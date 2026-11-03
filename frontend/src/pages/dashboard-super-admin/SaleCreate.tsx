import { useCallback, useRef, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { createManualSale, getPlatformCompany, getPlatformPlans, type ManualSaleDraft, type PlatformSale } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { CompanyPicker } from '../../components/dashboard-super-admin/CompanyPicker';
import { SaleForm } from '../../components/dashboard-super-admin/SaleForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function SaleCreate() {
  const [search] = useSearchParams();
  const [companyId, setCompanyId] = useState(search.get('companyId') || '');
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlatformSale | null>(null);
  const [retry, setRetry] = useState(0);
  const operation = useRef<{ id: string; payload: string } | null>(null);
  const load = useCallback(() => companyId ? Promise.all([getPlatformCompany(companyId),getPlatformPlans()]).then(([company,plans]) => ({ company, plans }))
    .catch(failure => { throw new Error(handleError(failure), { cause: failure }); }) : Promise.resolve(null), [companyId,handleError]);
  const query = useAsyncQuery(companyId + ':' + retry, load);
  const save = async (input: ManualSaleDraft) => {
    if (busy) return;
    const payload = JSON.stringify(input);
    if (!operation.current || operation.current.payload !== payload) operation.current = { id: crypto.randomUUID(), payload };
    setBusy(true); setError('');
    try { setResult((await createManualSale({ ...input, operationId: operation.current.id })).sale); }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  return <><div className="sa-page-heading"><Link className="sa-text-link" to="/super-admin/sales">Vendas</Link><h1>Lançar venda manual</h1><p>Um registro comercial, sem cobrança e sem alterar o plano da empresa.</p></div>
    {error && <p role="alert" className="sa-feedback sa-error">{error}</p>}
    {result ? <section className="sa-panel sa-success" aria-label="Venda registrada"><h2>Venda registrada.</h2><p>{new Intl.NumberFormat('pt-BR',{ style:'currency',currency:'BRL' }).format(Number(result.amount))}</p><p>Data comercial: {new Date(result.soldAt).toISOString()} UTC</p><Link className="sa-text-link" to="/super-admin/sales">Consultar vendas</Link><button className="sa-text-link" onClick={() => { setResult(null); operation.current = null; }}>Novo lançamento</button></section> : <>
      <CompanyPicker selectedId={companyId} onError={handleError} onSelect={company => { setCompanyId(company.id); operation.current = null; setError(''); }} />
      {companyId && (query.loading ? <p role="status">Carregando plano da empresa…</p> : query.error ? <p role="alert">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p>
        : query.data && (query.data.company.deleted_at || query.data.company.status === 'inativo' ? <p>Empresa indisponível para novo lançamento.</p>
          : <SaleForm key={companyId} company={query.data.company} plan={query.data.plans.find(plan => plan.id === query.data!.company.plan_id)} busy={busy} onSave={save} />))}
    </>}
  </>;
}
