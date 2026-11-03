import { useCallback, useState, type FormEvent } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getPlatformCompanies } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/button';
import { PlanFilter } from '../../components/dashboard-super-admin/PlanFilter';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function Companies() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ q: '', status: '', planId: '' });
  const [retry, setRetry] = useState(0);
  const load = useCallback(() => getPlatformCompanies({ ...filters, page }).catch(error => { throw new Error(handleError(error), { cause: error }); }), [filters, page, handleError]);
  const query = useAsyncQuery(JSON.stringify([filters, page, retry]), load);
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setPage(1); setFilters({ q: String(data.get('q') || ''), status: String(data.get('status') || ''), planId: String(data.get('planId') || '') });
  };
  return <>
    <div className="sa-page-heading sa-heading-row"><div><span className="sa-eyebrow">EMPRESAS</span><h1>Uma plataforma, muitas empresas.</h1><p>Consulte cadastros, planos e disponibilidade.</p></div><Link className="sa-text-link" to="/super-admin/companies/new">Cadastrar empresa</Link></div>
    <form className="sa-form sa-panel sa-filter-form" onSubmit={filter} aria-label="Filtrar empresas">
      <label>Nome ou CNPJ<input name="q" maxLength={200} /></label><label>Estado do cadastro<select name="status"><option value="">Todos</option><option value="ativo">Ativas</option><option value="inativo">Inativas</option><option value="archived">Arquivadas</option></select></label>
      <PlanFilter onError={handleError} /><Button className="sa-button" type="submit">Filtrar</Button>
    </form>
    {query.loading ? <p role="status">Carregando empresas…</p> : query.error ? <div role="alert" className="sa-feedback sa-error">{String((query.error as Error).message)}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></div>
      : <section className="sa-panel" aria-label="Empresas cadastradas">{!query.data?.data.length ? <p className="sa-empty">Nenhuma empresa encontrada.</p> : <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>Empresa</th><th>CNPJ</th><th>Situação</th><th>Plano</th><th>Ação</th></tr></thead><tbody>{query.data.data.map(company => <tr key={company.id}><td>{company.nome}</td><td>{company.cnpj}</td><td>{company.deleted_at ? 'Arquivada' : company.status === 'inativo' ? 'Inativa' : 'Ativa'}</td><td>{company.plan_id ? <Link className="sa-text-link" to="/super-admin/plans">Consultar plano</Link> : 'Sem plano'}</td><td><Link className="sa-text-link" to={'/super-admin/companies/' + company.id}>Consultar {company.nome}</Link></td></tr>)}</tbody></table></div>}
        {query.data && <Pagination meta={query.data.meta} onPage={setPage} />}</section>}
  </>;
}
