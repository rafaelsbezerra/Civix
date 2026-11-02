import { useCallback, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { getPlatformCompany, getPlatformPlans, updatePlatformCompany, type CompanyRegistrationInput } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { CompanyForm } from '../../components/dashboard-super-admin/CompanyForm';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function CompanyEdit() {
  const { companyId = '' } = useParams();
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const load = useCallback(() => Promise.all([getPlatformCompany(companyId), getPlatformPlans()]).then(([company,plans]) => ({ company, plans }))
    .catch(failure => { throw new Error(handleError(failure), { cause: failure }); }), [companyId, handleError]);
  const query = useAsyncQuery(companyId + ':' + retry, load);
  const save = async (input: Omit<CompanyRegistrationInput,'operationId'>) => {
    setBusy(true); setError(''); setNotice('');
    try { await updatePlatformCompany(companyId, input); setNotice('Empresa atualizada. Nenhuma venda foi lançada automaticamente.'); }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  return <><div className="sa-page-heading"><Link className="sa-text-link" to={'/super-admin/companies/' + companyId}>Voltar à empresa</Link><h1>Editar empresa</h1><p>A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.</p></div>
    {error && <p className="sa-feedback sa-error" role="alert">{error}</p>}
    {notice && <div className="sa-feedback" role="status">{notice}</div>}
    {query.loading ? <p role="status">Carregando cadastro…</p> : query.error ? <p role="alert">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p> : query.data?.company.deleted_at ? <p>Restaure a empresa antes de editar.</p>
      : query.data && <CompanyForm key={companyId} company={query.data.company} plans={query.data.plans.filter(plan => plan.id === query.data!.company.plan_id || plan.isActive && Number(plan.price) > 0)} busy={busy} onSave={save} />}
  </>;
}
