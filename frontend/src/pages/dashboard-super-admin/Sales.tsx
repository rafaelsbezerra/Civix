import { useCallback, useState, type FormEvent } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { deletePlatformSale, getPlatformSales, type PlatformSale } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Pagination } from '../../components/ui/Pagination';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import { CompanyPicker } from '../../components/dashboard-super-admin/CompanyPicker';
import { PlanFilter } from '../../components/dashboard-super-admin/PlanFilter';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';

export default function Sales() {
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [filters, setFilters] = useState({ companyId:'', planId:'', origin:'', from:'', to:'' });
  const [companyName, setCompanyName] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState<PlatformSale | null>(null);
  const [picker, setPicker] = useState(false);
  const load = useCallback(() => getPlatformSales({ ...filters, page }).catch(error => { throw new Error(handleError(error), { cause:error }); }), [filters,page,handleError]);
  const query = useAsyncQuery(JSON.stringify([filters,page,retry]), load);
  const filter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const from = String(values.get('from') || ''); const to = String(values.get('to') || '');
    setFilters(current => ({ ...current, planId:String(values.get('planId') || ''), origin:String(values.get('origin') || ''), from:from ? new Date(from + 'Z').toISOString() : '', to:to ? new Date(to + 'Z').toISOString() : '' })); setPage(1);
  };
  return <><div className="sa-page-heading sa-heading-row"><div><span className="sa-eyebrow">REGISTROS COMERCIAIS</span><h1>Vendas</h1><p>Registros imutáveis. Correções exigem exclusão definitiva e novo lançamento.</p></div><Link className="sa-text-link" to="/dashboard/super-admin/sales/new">Lançar venda manual</Link></div>
    {notice && <p className="sa-feedback" role="status">{notice} <Link to="/dashboard/super-admin/sales/new">Fazer novo lançamento</Link></p>}
    <form className="sa-form sa-panel sa-filter-form" onSubmit={filter} aria-label="Filtrar vendas"><PlanFilter onError={handleError} /><label>Origem<select name="origin"><option value="">Todas</option><option value="manual">Manual</option><option value="company_creation">Cadastro da empresa</option></select></label><label>De (UTC)<input type="datetime-local" name="from" /></label><label>Até (UTC)<input type="datetime-local" name="to" /></label><button className="sa-text-link" type="submit">Filtrar</button></form>
    <div className="sa-inline-actions"><button onClick={() => setPicker(value => !value)}>Filtrar por empresa</button>{companyName && <><span>{companyName}</span><button onClick={() => { setFilters(current => ({ ...current,companyId:'' }));setCompanyName('');setPage(1); }}>Limpar empresa</button></>}</div>
    {picker && <CompanyPicker selectedId={filters.companyId} includeArchived onError={handleError} onSelect={company => { setFilters(current => ({ ...current,companyId:company.id }));setCompanyName(company.nome);setPage(1);setPicker(false); }} />}
    {query.loading ? <p role="status">Carregando vendas…</p> : query.error ? <p className="sa-feedback sa-error" role="alert">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p> : <section className="sa-panel" aria-label="Vendas comerciais">
      {!query.data?.data.length ? <p className="sa-empty">Nenhuma venda encontrada.</p> : <div className="sa-table-scroll"><table className="sa-table"><thead><tr><th>Empresa / plano</th><th>Valor</th><th>Origem</th><th>Data comercial UTC</th><th>Ações</th></tr></thead><tbody>{query.data.data.map(sale => <tr key={sale.id}><td><Link className="sa-text-link" to={'/dashboard/super-admin/companies/' + sale.companyId}>{sale.companyName || 'Consultar empresa'}</Link><small>{sale.planName || 'Valor manual justificado'}</small><details><summary>Detalhes da venda</summary><p>{sale.description || 'Sem descrição adicional.'}</p><p>Criada em {new Date(sale.createdAt).toISOString()} UTC</p><p>Modo: {sale.pricingMode === 'company_plan' ? 'Plano vigente' : 'Valor manual'}</p></details></td><td>{new Intl.NumberFormat('pt-BR',{ style:'currency',currency:'BRL' }).format(Number(sale.amount))}</td><td>{sale.origin === 'manual' ? 'Manual' : 'Cadastro da empresa'}</td><td>{new Date(sale.soldAt).toISOString()}</td><td><button onClick={() => setDeleting(sale)}>Excluir definitivamente</button></td></tr>)}</tbody></table></div>}
      {query.data && <Pagination meta={query.data.meta} onPage={setPage} />}
    </section>}
    {deleting && <ActionConfirmation title="Excluir venda definitivamente" description={'Esta venda de ' + deleting.amount + ' BRL será removida do banco. A empresa e o plano serão preservados. A correção exige novo lançamento manual.'} onClose={() => setDeleting(null)} onConfirm={async () => {
      try { await deletePlatformSale(deleting.id);setPage(1);setRetry(value => value + 1);setNotice('Venda excluída definitivamente.'); }
      catch (error) { throw new Error(handleError(error),{ cause:error }); }
    }} />}
  </>;
}
