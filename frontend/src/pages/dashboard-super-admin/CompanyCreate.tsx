import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { getPlatformPlans, registerCompany, uploadCompanyImage, type CompanyRegistrationInput, type CompanyRegistrationResult, type Plan } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { CompanyForm } from '../../components/dashboard-super-admin/CompanyForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function CompanyCreate() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<CompanyRegistrationResult | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoError, setLogoError] = useState('');
  const [logoUploaded, setLogoUploaded] = useState(false);
  const operation = useRef<{ id: string; payload: string } | null>(null);
  useEffect(() => {
    let active = true;
    getPlatformPlans().then(data => { if (active) { setLoadFailed(false); setPlans(data.filter(plan => plan.isActive && Number(plan.price) > 0)); setError(''); } })
      .catch(failure => { if (active) { setLoadFailed(true); setError(handleError(failure)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry, handleError]);
  const sendLogo = async (companyId: string, file: File) => {
    setLogoError('');
    try {
      await uploadCompanyImage(companyId, 'logo', file);
      setPendingLogo(null); setLogoUploaded(true);
    } catch (failure) {
      setLogoError('Empresa e venda já cadastradas. Não foi possível enviar a logo: ' + handleError(failure));
    }
  };
  const save = async (input: Omit<CompanyRegistrationInput, 'operationId'>, logo?: File | null) => {
    if (busy) return;
    const payload = JSON.stringify(input);
    if (!operation.current || operation.current.payload !== payload) operation.current = { id: crypto.randomUUID(), payload };
    setBusy(true); setError('');
    try {
      const created = await registerCompany({ ...input, operationId: operation.current.id });
      setResult(created);
      if (logo) { setPendingLogo(logo); await sendLogo(created.company.id, logo); }
    }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  return <>
    <div className="sa-page-heading"><span className="sa-eyebrow">CADASTRO COMERCIAL</span><h1>Uma nova empresa na Civix.</h1><p>Dados organizados. Plano definido. Venda inicial registrada em uma só confirmação.</p></div>
    {error && <p className="sa-feedback sa-error" role="alert">{error}</p>}
    {loading ? <p role="status" className="sa-empty">Carregando planos disponíveis…</p> : result ? <section className="sa-panel sa-success" aria-labelledby="company-created-title">
      <CheckCircle2 size={32} aria-hidden="true" /><h2 id="company-created-title">Empresa cadastrada.</h2><p>{result.company.nome} está vinculada ao plano {result.sale.planName}.</p>
      {busy && pendingLogo && <p role="status">Enviando logo…</p>}
      {logoUploaded && <p role="status">Logo enviada com sucesso.</p>}
      {logoError && <div className="sa-feedback sa-error" role="alert"><p>{logoError}</p><Button className="sa-button" disabled={busy} onClick={async () => {
        if (!pendingLogo || busy) return;
        setBusy(true);
        try { await sendLogo(result.company.id, pendingLogo); } finally { setBusy(false); }
      }}>Tentar enviar logo novamente</Button></div>}
      <dl><div><dt>Venda comercial inicial</dt><dd>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(result.sale.amount))}</dd></div>
        <div><dt>Registro em UTC</dt><dd>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(result.sale.createdAt))} UTC</dd></div></dl>
      <Link className="sa-text-link" to={'/super-admin/companies/' + result.company.id}>Ver empresa</Link>
      <Button className="sa-button" disabled={busy} onClick={() => { setResult(null); setPendingLogo(null); setLogoError(''); setLogoUploaded(false); operation.current = null; }}>Cadastrar outra empresa</Button>
    </section> : loadFailed ? <section className="sa-panel sa-empty"><p>Não foi possível carregar os planos.</p><button className="sa-text-link" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Tentar novamente</button></section> : !plans.length ? <section className="sa-panel sa-empty"><h2>Nenhum plano disponível para cadastro.</h2><p>Cadastre ou ative um plano com preço positivo para continuar.</p><Link className="sa-text-link" to="/super-admin/plans">Ir para planos</Link><button className="sa-text-link" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Atualizar planos</button></section> : <CompanyForm plans={plans} busy={busy} onSave={save} />}
  </>;
}
