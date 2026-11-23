import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PlatformCompany, PlatformSale } from '../../lib/api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

function formatUtcDate(dateString: string): string {
  if (!dateString) {
    return '—';
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '—';
  }
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year} UTC`;
}

export function OverviewRecentActivity({
  recentSales,
  recentCompanies,
}: {
  recentSales: PlatformSale[];
  recentCompanies: PlatformCompany[];
}) {
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* 1. Últimas Vendas Registradas */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimas Vendas Registradas
            </CardTitle>
            <CardDescription className="text-xs">
              Transações comerciais mais recentes
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary"
            render={<Link to="/dashboard/super-admin/sales" />}
            nativeButton={false}
          >
            Ver todas <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="px-5">
          {!recentSales.length ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma venda registrada até o momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 text-xs font-medium">
                    Empresa / Origem
                  </TableHead>
                  <TableHead className="h-8 text-xs font-medium">Data</TableHead>
                  <TableHead className="h-8 text-right text-xs font-medium">
                    Valor
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id} className="text-xs">
                    <TableCell className="py-2.5 font-medium">
                      <div className="truncate font-semibold text-foreground">
                        {sale.companyName || 'Empresa'}
                      </div>
                      <div className="truncate text-muted-foreground">
                        {sale.planName ||
                          (sale.origin === 'manual' ? 'Venda manual' : 'Plano')}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                      {formatUtcDate(sale.soldAt)}
                    </TableCell>
                    <TableCell className="py-2.5 text-right font-semibold tabular-nums text-foreground whitespace-nowrap">
                      {currency.format(Number(sale.amount || 0))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 2. Últimas Empresas Registradas */}
      <Card className="rounded-2xl py-4">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimas Empresas Registradas
            </CardTitle>
            <CardDescription className="text-xs">
              Cadastros mais recentes na plataforma
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-primary"
            render={<Link to="/dashboard/super-admin/companies" />}
            nativeButton={false}
          >
            Ver todas <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent className="px-5">
          {!recentCompanies.length ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Nenhuma empresa cadastrada até o momento.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-8 text-xs font-medium">Empresa</TableHead>
                  <TableHead className="h-8 text-xs font-medium">Localização</TableHead>
                  <TableHead className="h-8 text-right text-xs font-medium">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCompanies.map((company) => {
                  const isArchived = Boolean(company.deleted_at);
                  const isInactive = !isArchived && company.status === 'inativo';
                  const isActive = !isArchived && !isInactive;

                  return (
                    <TableRow key={company.id} className="text-xs">
                      <TableCell className="py-2.5 font-medium">
                        <Link
                          to={`/dashboard/super-admin/companies/${company.id}`}
                          className="hover:underline"
                        >
                          <div className="truncate font-semibold text-foreground">
                            {company.nome}
                          </div>
                        </Link>
                        <div className="text-muted-foreground">
                          {formatUtcDate(
                            company.createdAt || company.data_cadastro || '',
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-muted-foreground whitespace-nowrap">
                        {company.cidade
                          ? `${company.cidade} - ${company.estado}`
                          : company.estado}
                      </TableCell>
                      <TableCell className="py-2.5 text-right whitespace-nowrap">
                        {isActive && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                          >
                            Ativa
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-amber-500/30 bg-amber-500/10 px-2 py-0 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                          >
                            Inativa
                          </Badge>
                        )}
                        {isArchived && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-slate-500/30 bg-slate-500/10 px-2 py-0 text-[10px] font-semibold text-muted-foreground"
                          >
                            Arquivada
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
