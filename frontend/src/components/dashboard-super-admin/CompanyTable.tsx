import { Eye, Layers3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PageResult, PlatformCompany } from '../../lib/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/table';
import { CompanyPagination } from './CompanyPagination';

function CompanyStatusBadge({ company }: { company: PlatformCompany }) {
  if (company.deleted_at) {
    return (
      <Badge
        variant="outline"
        className="border-yellow-600/30 bg-yellow-500/10 text-yellow-700 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-300"
      >
        Arquivada
      </Badge>
    );
  }
  if (company.status === 'inativo') {
    return (
      <Badge
        variant="outline"
        className="border-red-600/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
      >
        Inativa
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-green-600/30 bg-green-500/10 text-green-700 dark:border-green-400/30 dark:bg-green-400/10 dark:text-green-300"
    >
      Ativa
    </Badge>
  );
}

export function CompanyTable({
  result,
  onPage,
}: {
  result: PageResult<PlatformCompany>;
  onPage: (page: number) => void;
}) {
  return (
    <Card
      className="gap-0 rounded-2xl py-0"
      role="region"
      aria-label="Empresas cadastradas"
    >
      {!result.data.length ? (
        <p className="px-6 py-12 text-center text-muted-foreground">
          Nenhuma empresa encontrada.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="px-6">Empresa</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="px-6 text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="px-6 py-5 font-medium">{company.nome}</TableCell>
                <TableCell className="text-muted-foreground">{company.cnpj}</TableCell>
                <TableCell>
                  <CompanyStatusBadge company={company} />
                </TableCell>
                <TableCell>
                  {company.plan_id ? (
                    <Button
                      variant="ghost"
                      className="min-h-10"
                      render={<Link to="/dashboard/super-admin/plans" />}
                      nativeButton={false}
                    >
                      <Layers3 aria-hidden="true" />
                      Consultar plano
                    </Button>
                  ) : (
                    'Sem plano'
                  )}
                </TableCell>
                <TableCell className="px-6 text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-10"
                    aria-label={'Consultar ' + company.nome}
                    title={'Consultar ' + company.nome}
                    render={
                      <Link to={'/dashboard/super-admin/companies/' + company.id} />
                    }
                    nativeButton={false}
                  >
                    <Eye aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <CompanyPagination meta={result.meta} onPage={onPage} />
    </Card>
  );
}
