import type { PaginationMeta } from '../../lib/api';

export function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
  return <nav className="sa-pagination" aria-label="Paginação">
    <span>{meta.total} registros · Página {meta.page} de {Math.max(1, meta.totalPages)}</span>
    <button type="button" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Anterior</button>
    <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Próxima</button>
  </nav>;
}
