import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import type { PaginationMeta } from '../../lib/api';

export function CompanyPagination({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }) {
  return <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-4 border-t px-6 py-4">
    <span className="text-sm text-muted-foreground">{meta.total} registros · Página {meta.page} de {Math.max(1, meta.totalPages)}</span>
    <div className="flex gap-2">
      <Button variant="outline" className="min-h-10" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}><ChevronLeft aria-hidden="true" />Anterior</Button>
      <Button variant="outline" className="min-h-10" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Próxima<ChevronRight aria-hidden="true" /></Button>
    </div>
  </nav>;
}
