import { useCallback, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { changePlatformCompanyState, getPlatformCompany, getPlatformPlans } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

type Action = 'suspension'|'reactivation'|'restoration'|'archive';
const labels: Record<Action,string> = { suspension: 'Desativar empresa', reactivation: 'Reativar empresa', restoration: 'Restaurar empresa', archive: 'Arquivar empresa' };
export default function CompanyDetail() {
  const { companyId = '' } = useParams();
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [retry, setRetry] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(() => Promise.all([getPlatformCompany(companyId),getPlatformPlans()]).then(([company,plans]) => ({ ...company,planName:plans.find(plan => plan.id === company.plan_id)?.name || (company.plan_id ? 'Plano indisponível' : 'Sem plano') })).catch(error => { throw new Error(handleError(error), { cause: error }); }), [companyId, handleError]);
  const query = useAsyncQuery(companyId + ':' + retry, load);
  const company = query.data;
  return <>
    <div className="sa-page-heading"><Link className="sa-text-link" to="/dashboard/super-admin/companies">Empresas</Link><h1>{company?.nome || 'Dados da empresa'}</h1><p>Cadastro e disponibilidade na plataforma.</p></div>
    {notice && <p className="sa-feedback" role="status">{notice}</p>}
    {query.loading ? <p role="status">Carregando empresa…</p> : query.error ? <p role="alert" className="sa-feedback sa-error">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p> : company && <>
      <section className="sa-panel"><h2>{company.deleted_at ? 'Empresa arquivada' : company.status === 'inativo' ? 'Empresa inativa' : 'Empresa ativa'}</h2><dl className="sa-detail-grid"><div><dt>CNPJ</dt><dd>{company.cnpj}</dd></div><div><dt>Plano</dt><dd>{company.planName}</dd></div><div><dt>Localização</dt><dd>{company.cidade} · {company.estado}</dd></div><div><dt>E-mail</dt><dd>{company.email || 'Não informado'}</dd></div></dl><p>{company.descricao_detalhada}</p>
        {company.deactivation_reason && <p><strong>Motivo da desativação/arquivamento:</strong> {company.deactivation_reason}</p>}
        {company.deleted_at && <p>Restauração preserva a empresa inativa. Reative explicitamente para liberar catálogo e acesso.</p>}
        <div className="sa-inline-actions">{company.deleted_at ? <button onClick={() => setAction('restoration')}>Restaurar empresa</button> : <>
          <Link to={'/dashboard/super-admin/companies/' + company.id + '/edit'}>Editar empresa</Link>
          <Link to={'/dashboard/super-admin/companies/' + company.id + '/users'}>Gerenciar equipe</Link>
          <button onClick={() => setAction(company.status === 'inativo' ? 'reactivation' : 'suspension')}>{company.status === 'inativo' ? 'Reativar empresa' : 'Desativar empresa'}</button>
          <button onClick={() => setAction('archive')}>Arquivar empresa</button>
        </>}</div>
      </section>
      {action && <ActionConfirmation title={labels[action]} description={company.nome + ': ' + (action === 'archive' || action === 'suspension' ? 'O acesso empresarial e a exibição pública serão bloqueados. O histórico será preservado.' : action === 'restoration' ? 'A empresa continuará inativa após restaurar.' : 'O catálogo e o acesso voltarão a ficar disponíveis; sessões antigas continuam revogadas.')}
        requireReason={action === 'archive' || action === 'suspension'} onClose={() => setAction(null)} onConfirm={async reason => {
          try { await changePlatformCompanyState(company.id, action, action === 'archive' || action === 'suspension' ? reason : undefined); setNotice('Estado da empresa atualizado.'); setRetry(value => value + 1); }
          catch (error) { throw new Error(handleError(error), { cause: error }); }
        }} />}
    </>}
  </>;
}
