import { useCallback, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { getPlatformCompany, getPlatformPlans, updatePlatformCompany, uploadCompanyImage, getCompanyImageUrl, type CompanyRegistrationInput } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { CompanyForm } from '../../components/dashboard-super-admin/CompanyForm';
import { DashboardPageLoader } from '../../components/dashboard-super-admin/DashboardPageLoader';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import { CompanyImageInput } from '../../components/dashboard-super-admin/CompanyImageInput';
import { Button } from '../../components/ui/button';

export default function CompanyEdit() {
  const { companyId = '' } = useParams();
  return <CompanyEditPage key={companyId} />;
}

function CompanyEditPage() {
  const { companyId = '' } = useParams();
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [cover, setCover] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>();
  const [imageError, setImageError] = useState('');
  const [imageNotice, setImageNotice] = useState('');
  const load = useCallback(() => Promise.all([getPlatformCompany(companyId), getPlatformPlans()]).then(([company,plans]) => ({ company, plans }))
    .catch(failure => { throw new Error(handleError(failure), { cause: failure }); }), [companyId, handleError]);
  const query = useAsyncQuery(companyId + ':' + retry, load);
  const save = async (input: Omit<CompanyRegistrationInput,'operationId'>) => {
    setBusy(true); setError(''); setNotice('');
    try { await updatePlatformCompany(companyId, input); setNotice('Empresa atualizada. Nenhuma venda foi lançada automaticamente.'); }
    catch (failure) { setError(handleError(failure)); } finally { setBusy(false); }
  };
  return query.loading ? <DashboardPageLoader label="Carregando cadastro…" /> : <div className="sa-page-enter"><div className="sa-page-heading"><Link className="sa-text-link" to={'/dashboard/super-admin/companies/' + companyId}>Voltar à empresa</Link><h1>Editar empresa</h1><p>A alteração do plano não gera uma venda automática. Registre a venda manualmente na área de vendas.</p></div>
    {error && <p className="sa-feedback sa-error" role="alert">{error}</p>}
    {notice && <div className="sa-feedback" role="status">{notice} <Link to={'/dashboard/super-admin/sales/new?companyId=' + companyId}>Registrar venda manual</Link></div>}
    {query.error ? <p role="alert">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p> : query.data?.company.deleted_at ? <p>Restaure a empresa antes de editar.</p>
      : query.data && <>
        <CompanyForm key={companyId} company={query.data.company} plans={query.data.plans.filter(plan => plan.id === query.data!.company.plan_id || plan.isActive && Number(plan.price) > 0)} busy={busy} onSave={save} />
        {query.data.company.status === 'inativo' ? <p className="sa-feedback">Reative a empresa antes de enviar uma capa.</p> : <form className="sa-form sa-panel" aria-label="Atualizar capa" onSubmit={async event => {
          event.preventDefault();
          if (!cover || busy) return;
          setBusy(true); setImageError(''); setImageNotice('');
          try {
            const uploaded = await uploadCompanyImage(companyId, 'cover', cover);
            setCover(null); setCoverUrl(null); setImageNotice('Capa enviada com sucesso.');
            try { setCoverUrl(await getCompanyImageUrl(uploaded.imageId)); }
            catch (failure) { setImageError('Capa salva. Não foi possível carregar a prévia: ' + handleError(failure)); }
          } catch (failure) { setImageError(handleError(failure)); }
          finally { setBusy(false); }
        }}>
          <h2>Capa da empresa</h2>
          <CompanyImageInput key={companyId + ':' + imageNotice} purpose="cover" file={cover} onChange={setCover} currentUrl={coverUrl === undefined ? query.data.company.cover_image_url : coverUrl} disabled={busy} />
          {imageError && <p role="alert" className="sa-feedback sa-error">{imageError}</p>}
          {imageNotice && <p role="status" className="sa-feedback">{imageNotice}</p>}
          <div className="sa-form-actions"><Button className="sa-button" type="submit" disabled={busy || !cover}>{busy ? 'Enviando…' : 'Enviar capa'}</Button></div>
        </form>}
      </>}
  </div>;
}
