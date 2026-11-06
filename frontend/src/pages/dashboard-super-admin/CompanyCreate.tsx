import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { getPlatformPlans, registerCompany, uploadCompanyImage, type CompanyRegistrationInput, type CompanyRegistrationResult, type Plan } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../../components/ui/card';
import { CompanyForm } from '../../components/dashboard-super-admin/CompanyForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

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
  return (
    <div className="space-y-6 text-foreground" style={theme}>
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" className="min-h-10 rounded-xl" render={<Link to="/dashboard/super-admin/companies" />} nativeButton={false}>
          <ArrowLeft aria-hidden="true" />Voltar para empresas
        </Button>
      </div>
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <Card className="rounded-2xl py-10">
          <CardContent className="text-center text-sm text-muted-foreground" role="status">
            Carregando planos disponíveis…
          </CardContent>
        </Card>
      ) : result ? (
        <Card className="max-w-3xl rounded-2xl py-6" role="region" aria-labelledby="company-created-title">
          <CardHeader className="px-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-7 text-[var(--sa-accent-ink)]" aria-hidden="true" />
              <h2 id="company-created-title" className="text-xl font-semibold">Empresa cadastrada.</h2>
            </div>
            <CardDescription className="text-sm">
              {result.company.nome} está vinculada ao plano {result.sale.planName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6">
            {busy && pendingLogo && <p role="status" className="text-sm text-muted-foreground">Enviando logo…</p>}
            {logoUploaded && <p role="status" className="text-sm font-medium text-green-700 dark:text-green-300">Logo enviada com sucesso.</p>}
            {logoError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                <p>{logoError}</p>
                <Button variant="outline" className="min-h-10 rounded-xl" disabled={busy} onClick={async () => {
                  if (!pendingLogo || busy) return;
                  setBusy(true);
                  try { await sendLogo(result.company.id, pendingLogo); } finally { setBusy(false); }
                }}>Tentar enviar logo novamente</Button>
              </div>
            )}
            <dl className="grid gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Venda comercial inicial</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(result.sale.amount))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Registro em UTC</dt>
                <dd className="mt-1 text-base font-semibold tabular-nums">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(result.sale.createdAt))} UTC
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-3 px-6 py-4">
            <Button variant="outline" className="min-h-11 rounded-xl" render={<Link to={'/dashboard/super-admin/companies/' + result.company.id} />} nativeButton={false}>
              Ver empresa
            </Button>
            <Button className="min-h-11 rounded-xl" disabled={busy} onClick={() => { setResult(null); setPendingLogo(null); setLogoError(''); setLogoUploaded(false); operation.current = null; }}>
              Cadastrar outra empresa
            </Button>
          </CardFooter>
        </Card>
      ) : loadFailed ? (
        <Card className="rounded-2xl py-8">
          <CardContent className="flex flex-col items-center gap-4 px-6 text-center">
            <p className="text-sm text-muted-foreground">Não foi possível carregar os planos.</p>
            <Button variant="outline" className="min-h-10 rounded-xl" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : !plans.length ? (
        <Card className="rounded-2xl py-8">
          <CardContent className="flex flex-col items-center gap-3 px-6 text-center">
            <h2 className="text-lg font-semibold">Nenhum plano disponível para cadastro.</h2>
            <p className="text-sm text-muted-foreground">Cadastre ou ative um plano com preço positivo para continuar.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button variant="outline" className="min-h-10 rounded-xl" render={<Link to="/dashboard/super-admin/plans" />} nativeButton={false}>
                Ir para planos
              </Button>
              <Button className="min-h-10 rounded-xl" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>
                Atualizar planos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CompanyForm plans={plans} busy={busy} onSave={save} />
      )}
    </div>
  );
}
