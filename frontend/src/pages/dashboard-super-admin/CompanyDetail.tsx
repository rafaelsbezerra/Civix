import { useCallback, useState, type CSSProperties } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Building2,
  CircleCheckBig,
  Layers3,
  Mail,
  MapPin,
  Pencil,
  Power,
  RotateCcw,
  Users,
} from 'lucide-react';
import {
  changePlatformCompanyState,
  getPlatformCompany,
  getPlatformPlans,
  type PlatformCompany,
} from '../../lib/api';
import { useAsyncQuery } from '../../hooks/useAsyncQuery';
import { ActionConfirmation } from '../../components/dashboard-super-admin/ActionConfirmation';
import { DashboardPageLoader } from '../../components/dashboard-super-admin/DashboardPageLoader';
import type { SuperAdminContext } from '../../components/dashboard-super-admin/layout/SuperAdminLayout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '../../components/ui/card';

type Action = 'suspension' | 'reactivation' | 'restoration' | 'archive';
const labels: Record<Action, string> = {
  suspension: 'Desativar empresa',
  reactivation: 'Reativar empresa',
  restoration: 'Restaurar empresa',
  archive: 'Arquivar empresa',
};

const theme = {
  '--card': 'var(--sa-surface)',
  '--card-foreground': 'var(--sa-ink)',
  '--popover': 'var(--sa-surface)',
  '--popover-foreground': 'var(--sa-ink)',
  '--input': 'var(--sa-line)',
  '--accent': 'var(--sa-soft)',
  '--accent-foreground': 'var(--sa-ink)',
} as CSSProperties;

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

export default function CompanyDetail() {
  const { companyId = '' } = useParams();
  const { handleError } = useOutletContext<SuperAdminContext>();
  const [retry, setRetry] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(
    () =>
      Promise.all([getPlatformCompany(companyId), getPlatformPlans()])
        .then(([company, plans]) => ({
          ...company,
          planName:
            plans.find((plan) => plan.id === company.plan_id)?.name ||
            (company.plan_id ? 'Plano indisponível' : 'Sem plano'),
        }))
        .catch((error) => {
          throw new Error(handleError(error), { cause: error });
        }),
    [companyId, handleError],
  );
  const query = useAsyncQuery(companyId + ':' + retry, load);
  const company = query.data;

  return (
    <div className="space-y-6 text-foreground" style={theme}>
      {query.loading ? (
        <DashboardPageLoader label="Carregando empresa…" />
      ) : (
        <div className="sa-page-enter space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              className="min-h-10 rounded-xl px-4"
              render={<Link to="/dashboard/super-admin/companies" role="link" />}
              nativeButton={false}
            >
              <ArrowLeft aria-hidden="true" />
              Voltar para empresas
            </Button>
          </div>

          {notice && (
            <div
              role="status"
              className="rounded-xl border bg-muted/50 p-4 text-sm font-medium"
            >
              {notice}
            </div>
          )}

          {query.error ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <p>{(query.error as Error).message}</p>
              <Button
                variant="outline"
                className="min-h-10 rounded-xl"
                onClick={() => setRetry((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            company && (
              <>
                <Card className="rounded-2xl py-6">
                  <CardHeader className="px-6">
                    <div className="space-y-1">
                      <h1 className="text-xl font-semibold tracking-tight">
                        {company.nome}
                      </h1>
                      <CardDescription className="text-xs">
                        Cadastro e disponibilidade na plataforma.
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 px-6">
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CircleCheckBig className="size-3.5" aria-hidden="true" />
                          Situação
                        </dt>
                        <dd className="mt-1.5">
                          <CompanyStatusBadge company={company} />
                        </dd>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Building2 className="size-3.5" aria-hidden="true" />
                          CNPJ
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium tabular-nums">
                          {company.cnpj}
                        </dd>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Layers3 className="size-3.5" aria-hidden="true" />
                          Plano
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium">
                          {company.planName}
                        </dd>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          Localização
                        </dt>
                        <dd className="mt-1.5 text-sm font-medium">
                          {company.cidade} · {company.estado}
                        </dd>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-4">
                        <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="size-3.5" aria-hidden="true" />
                          E-mail
                        </dt>
                        <dd className="mt-1.5 break-all text-sm font-medium">
                          {company.email || 'Não informado'}
                        </dd>
                      </div>
                    </dl>

                    <div className="rounded-xl border bg-muted/20 p-4">
                      <h3 className="text-xs font-medium text-muted-foreground">
                        Sobre a empresa
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed">
                        {company.descricao_detalhada}
                      </p>
                    </div>

                    {company.deactivation_reason && (
                      <div className="rounded-xl border border-yellow-600/30 bg-yellow-500/10 p-4 text-sm text-yellow-800 dark:border-yellow-400/30 dark:bg-yellow-400/10 dark:text-yellow-200">
                        <strong>Motivo da desativação/arquivamento:</strong>{' '}
                        {company.deactivation_reason}
                      </div>
                    )}

                    {company.deleted_at && (
                      <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                        Restauração preserva a empresa inativa. Reative explicitamente
                        para liberar catálogo e acesso.
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-wrap items-center justify-end gap-3 px-6 py-4">
                    {company.deleted_at ? (
                      <Button
                        className="min-h-10 rounded-xl px-4"
                        onClick={() => setAction('restoration')}
                      >
                        <RotateCcw aria-hidden="true" />
                        Restaurar empresa
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="min-h-10 rounded-xl px-4"
                          render={
                            <Link
                              to={
                                '/dashboard/super-admin/companies/' +
                                company.id +
                                '/edit'
                              }
                              role="link"
                            />
                          }
                          nativeButton={false}
                        >
                          <Pencil aria-hidden="true" />
                          Editar empresa
                        </Button>
                        <Button
                          variant="outline"
                          className="min-h-10 rounded-xl px-4"
                          render={
                            <Link
                              to={
                                '/dashboard/super-admin/companies/' +
                                company.id +
                                '/users'
                              }
                              role="link"
                            />
                          }
                          nativeButton={false}
                        >
                          <Users aria-hidden="true" />
                          Gerenciar equipe
                        </Button>
                        <Button
                          variant={company.status === 'inativo' ? 'default' : 'outline'}
                          className="min-h-10 rounded-xl px-4"
                          onClick={() =>
                            setAction(
                              company.status === 'inativo'
                                ? 'reactivation'
                                : 'suspension',
                            )
                          }
                        >
                          <Power aria-hidden="true" />
                          {company.status === 'inativo'
                            ? 'Reativar empresa'
                            : 'Desativar empresa'}
                        </Button>
                        <Button
                          variant="destructive"
                          className="min-h-10 rounded-xl px-4"
                          onClick={() => setAction('archive')}
                        >
                          <Archive aria-hidden="true" />
                          Arquivar empresa
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>

                {action && (
                  <ActionConfirmation
                    title={labels[action]}
                    description={
                      company.nome +
                      ': ' +
                      (action === 'archive' || action === 'suspension'
                        ? 'O acesso empresarial e a exibição pública serão bloqueados. O histórico será preservado.'
                        : action === 'restoration'
                          ? 'A empresa continuará inativa após restaurar.'
                          : 'O catálogo e o acesso voltarão a ficar disponíveis; sessões antigas continuam revogadas.')
                    }
                    requireReason={action === 'archive' || action === 'suspension'}
                    onClose={() => setAction(null)}
                    onConfirm={async (reason) => {
                      try {
                        await changePlatformCompanyState(
                          company.id,
                          action,
                          action === 'archive' || action === 'suspension'
                            ? reason
                            : undefined,
                        );
                        setNotice('Estado da empresa atualizado.');
                        setRetry((value) => value + 1);
                      } catch (error) {
                        throw new Error(handleError(error), { cause: error });
                      }
                    }}
                  />
                )}
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
