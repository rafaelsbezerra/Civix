import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
import { getPlatformCompanies, type PlatformCompany } from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { CompanyPagination } from './CompanyPagination';

export function CompanyPicker({
  selectedId,
  onSelect,
  onError,
  includeArchived = false,
  onLoadingChange,
}: {
  selectedId: string;
  onSelect: (company: PlatformCompany) => void;
  onError: (error: unknown) => string;
  includeArchived?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);

  const load = useCallback(
    () =>
      getPlatformCompanies({
        q: search,
        page,
        status: includeArchived ? undefined : 'ativo',
      }).catch(error => {
        throw new Error(onError(error), { cause: error });
      }),
    [search, page, includeArchived, onError],
  );

  const query = useAsyncQuery(JSON.stringify([search, page, retry, includeArchived]), load);

  useEffect(() => {
    onLoadingChange?.(query.loading);
  }, [query.loading, onLoadingChange]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(String(new FormData(event.currentTarget).get('company-search') || ''));
    setPage(1);
  };

  return (
    <Card role="region" aria-label="Escolher empresa" className="gap-0 rounded-2xl py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base font-semibold">Escolha a empresa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5 pb-5">
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Field className="flex-1">
            <FieldLabel htmlFor="company-picker-search">
              Buscar empresa por nome ou CNPJ
            </FieldLabel>
            <Input
              id="company-picker-search"
              name="company-search"
              maxLength={200}
              placeholder="Digite o nome ou CNPJ"
              className="h-10"
            />
          </Field>
          <Button type="submit" variant="outline" className="min-h-10 px-4">
            <Search aria-hidden="true" />
            Buscar empresa
          </Button>
        </form>

        {query.loading ? (
          <p role="status" className="py-4 text-sm text-muted-foreground">
            Carregando empresas…
          </p>
        ) : query.error ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <span>{(query.error as Error).message}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRetry(value => value + 1)}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !query.data?.data.length ? (
          <p className="py-4 text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {query.data.data.map(company => {
              const selected = selectedId === company.id;
              return (
                <li key={company.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSelect(company)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? 'border-primary bg-primary/8 font-medium'
                        : 'border-border bg-muted/20 hover:bg-muted/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{company.nome}</div>
                      <small className="block text-xs text-muted-foreground">
                        {company.cnpj}
                        {company.deleted_at
                          ? ' · Arquivada'
                          : company.status === 'inativo'
                            ? ' · Inativa'
                            : ''}
                      </small>
                    </div>
                    {selected && (
                      <Badge variant="outline" className="shrink-0">
                        Selecionada
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {query.data && <CompanyPagination meta={query.data.meta} onPage={setPage} />}
    </Card>
  );
}
