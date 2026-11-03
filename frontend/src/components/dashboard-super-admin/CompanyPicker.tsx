import { useCallback, useState, type FormEvent } from 'react';
import { getPlatformCompanies, type PlatformCompany } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Pagination } from '../ui/Pagination';

export function CompanyPicker({ selectedId, onSelect, onError, includeArchived = false }: {
  selectedId: string; onSelect: (company: PlatformCompany) => void; onError: (error: unknown) => string; includeArchived?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const load = useCallback(() => getPlatformCompanies({ q: search, page, status: includeArchived ? undefined : 'ativo' })
    .catch(error => { throw new Error(onError(error), { cause: error }); }), [search, page, includeArchived, onError]);
  const query = useAsyncQuery(JSON.stringify([search,page,retry,includeArchived]), load);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSearch(String(new FormData(event.currentTarget).get('company-search') || '')); setPage(1); };
  return <section className="sa-panel" aria-label="Escolher empresa"><h2>Escolha a empresa</h2>
    <form className="sa-form sa-filter-form" onSubmit={submit}><label>Buscar empresa por nome ou CNPJ<input name="company-search" maxLength={200} /></label><button className="sa-text-link" type="submit">Buscar empresa</button></form>
    {query.loading ? <p role="status">Carregando empresas…</p> : query.error ? <p role="alert">{(query.error as Error).message}<button onClick={() => setRetry(value => value + 1)}>Tentar novamente</button></p> : <>
      {!query.data?.data.length ? <p>Nenhuma empresa encontrada.</p> : <ul className="sa-company-options">{query.data.data.map(company => <li key={company.id}><button type="button" aria-pressed={selectedId === company.id} onClick={() => onSelect(company)}>{company.nome}<small>{company.cnpj}{company.deleted_at ? ' · Arquivada' : company.status === 'inativo' ? ' · Inativa' : ''}</small></button></li>)}</ul>}
      {query.data && <Pagination meta={query.data.meta} onPage={setPage} />}
    </>}
  </section>;
}
