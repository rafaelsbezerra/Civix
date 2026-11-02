import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getPlatformPlans, savePlatformPlan, setPlatformPlanActive, type Plan, type PlanInput } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { SearchField } from '../../components/ui/SearchField';
import { PlanForm } from '../../components/dashboard-super-admin/PlanForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

const periods = { monthly: 'Mensal', yearly: 'Anual', one_time: 'Único' };
export default function Plans() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<Plan | 'new' | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    getPlatformPlans().then(data => { if (active) { setLoadFailed(false); setPlans(data); setError(''); } })
      .catch(failure => { if (active) { setLoadFailed(true); setError(handleError(failure)); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry, handleError]);
  const save = async (input: PlanInput) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const saved = await savePlatformPlan(input, editor && editor !== 'new' ? editor.id : undefined);
      setPlans(current => [...current.filter(plan => plan.id !== saved.id), saved].sort((a, b) => a.displayOrder - b.displayOrder));
      setEditor(null); setNotice('Plano salvo com sucesso.');
    } catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  const activate = async (plan: Plan) => {
    setBusy(true); setError(''); setNotice('');
    try { const saved = await setPlatformPlanActive(plan.id, !plan.isActive); setPlans(current => current.map(item => item.id === saved.id ? saved : item)); setNotice(saved.isActive ? 'Plano ativado.' : 'Plano desativado para novos cadastros.'); }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  const visible = plans.filter(plan => (plan.name + ' ' + plan.slug).toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="sa-page-heading sa-heading-row"><div><span className="sa-eyebrow">OFERTA COMERCIAL</span><h1>Planos</h1><p>Uma oferta organizada, pronta para cada novo cadastro.</p></div>
      <Button className="sa-button" onClick={() => { setEditor('new'); setNotice(''); }}><Plus size={17} /> Novo plano</Button></div>
    {error && <div className="sa-feedback sa-error" role="alert">{error}<button type="button" onClick={() => { setLoading(true); setRetry(value => value + 1); }}>Tentar novamente</button></div>}
    {notice && <p className="sa-feedback" role="status">{notice}</p>}
    {editor && <PlanForm key={editor === 'new' ? 'new' : editor.id} plan={editor === 'new' ? undefined : editor} busy={busy} onSave={save} onCancel={() => setEditor(null)} />}
    <section className="sa-panel" aria-label="Planos cadastrados"><div className="sa-table-toolbar"><h2>Catálogo de planos <span className="sa-counter">{plans.length}</span></h2><SearchField id="plan-search" label="Buscar planos" placeholder="Buscar por nome ou identificador" value={query} onChange={setQuery} /></div>
      {loading ? <p className="sa-empty" role="status">Carregando planos…</p> : loadFailed ? <p className="sa-empty">Não foi possível carregar o catálogo. Tente novamente.</p> : !plans.length ? <div className="sa-empty"><h3>Nenhum plano cadastrado.</h3><p>Crie um plano para começar os cadastros comerciais.</p></div> : !visible.length ? <p className="sa-empty">Nenhum plano encontrado para esta busca.</p> : <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>Plano</th><th>Preço</th><th>Período</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>
        {visible.map(plan => <tr key={plan.id}><td><strong>{plan.name}</strong><small>{plan.slug}</small></td><td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plan.price))}</td><td>{periods[plan.billingPeriod]}</td><td><span className={plan.isActive ? 'sa-badge' : 'sa-badge is-muted'}>{plan.isActive ? 'Ativo' : 'Inativo'}</span></td><td className="sa-row-actions"><button disabled={busy} onClick={() => setEditor(plan)} aria-label={`Editar ${plan.name}`}>Editar</button><button disabled={busy} onClick={() => activate(plan)} aria-label={`${plan.isActive ? 'Desativar' : 'Ativar'} ${plan.name}`}>{plan.isActive ? 'Desativar' : 'Ativar'}</button></td></tr>)}
      </tbody></table></div>}
    </section>
  </>;
}
