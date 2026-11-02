# Tarefas — dashboard superadmin E2E

Data: 2026-11-02. [Spec](spec.md) · [SDD](sdd.md) ·
[Tarefas frontend](../../../../frontend/.specs/features/super-admin-dashboard/task.md).

Somente planejamento. Caixas de implementação permanecem abertas.
**Não commitar sem revisão de cada grupo.** Os commits abaixo são sugestões
em inglês, no padrão Conventional Commits, e não foram executados.
Paths são relativos à raiz do repositório; SDD detalha a lógica por arquivo.

## Ordem e bloqueios

G0 → G1 → G2 → G3/G4 → G5 → G6 → G8. G7 depende de SA-P05 e pode avançar
separadamente após G1/G2. Tela de planos deve estar utilizável antes de
cadastrar empresa real. G3/G4 compõem o cadastro comercial; não publicar
cadastro com venda incompleto. Usar ramos/worktrees separados quando a
implementação for autorizada; dependentes convergem em integração para staging.

## G0 — Revisar e fechar contratos

- [ ] SA-00: Revalidar baseline, import de autenticação e ausência de
  users.company_id no SQL; distinguir histórico de testes de prova atual.
- [ ] SA-01: Resolver SA-P01 a SA-P07 conforme trecho; registrar o que segue
  bloqueado. Configurações globais ficam Aguardando resposta.
- [ ] SA-02: Aprovar URLs, projeções, campos, estados, idempotência,
  transação, paginação e plano de migrations; sem preços inventados.
- [x] SA-03: Registrar revisão documental e só depois commitar documentação.

Arquivos: esta pasta spec.md/sdd.md/task.md; frontend/.specs/features/
super-admin-dashboard/{spec,task}.md; docs/super-admin.md e índices.
Sugestão de commit: `docs(super-admin): define dashboard delivery plan`.
Aceite: decisões aprovadas ou bloqueios explícitos; backlog de trial,
limites/regras de planos e billing separado do compromisso desta entrega.

## G1 — Corrigir dependências e proteger plataforma

- [ ] SA-04: Resolver import ausente e tipagem sem duplicar regra de identidade;
  conferir profile/JWT/papéis e bloqueio por estado da empresa.
- [ ] SA-05: Versionar evolução necessária de vínculo users.company_id com
  FK/checks aprovados; revisar ciclo com as migrations já existentes.
- [ ] SA-06: Implementar guard backend super_admin com identidade vigente;
  manter admin legado desmontado até substituição segura.
- [ ] SA-07: Testar 401/403, revogação de papel/vínculo e ausência de dados
  empresariais privados na plataforma. Registrar revisão do grupo.

Arquivos a alterar: backend/src/middlewares/auth.ts,
backend/src/services/user.service.ts, backend/src/entities/user.entity.ts,
backend/src/interfaces/auth.user.row.ts, repositories/adapters de users e
backend/src/persistence/json/local.data.ts. Criar, se aprovado,
backend/src/middlewares/super.admin.ts e migration
backend/prisma/migrations/<timestamp>_user_company_scope/migration.sql.
Testes previstos: backend/tests/platform.authorization.test.ts e testes de
users existentes, depois de implementação autorizada.
Sugestão de commit: `fix(auth): align identity and platform authorization`.
Aceite: base coerente, migrations revisadas, chamadas administrativas
negadas no backend para outros papéis. SQL real só em ambiente autorizado.

## G2 — Shell privado e navegação

- [ ] SA-08: Montar layout/rotas superadmin usando ProtectedRoute e profile;
  redirecionar login desse perfil somente após a rota existir.
- [ ] SA-09: Implementar menu disponível, logout local, loading/erro/403 e
  limpeza de estado; preservar rotas públicas e outros perfis.
- [ ] SA-10: Verificar acesso direto/reload, teclado/foco e falha de rede;
  revisar diff antes de commit. Não criar métricas fictícias.

Arquivos: alterar frontend/src/routes/AppRoute.tsx,
frontend/src/pages/login.tsx e frontend/src/components/auth/ProtectedRoute.tsx
apenas se necessário; criar frontend/src/components/layout/SuperAdminLayout.tsx,
frontend/src/pages/super-admin/Overview.tsx e frontend/src/lib/platform.api.ts.
Detalhes e testes planejados estão no task frontend.
Sugestão de commit: `feat(super-admin): add protected administration shell`.

## G2P — Configurações do próprio perfil e design

- [ ] SA-10D: Implementar o [design frontend](../../../../frontend/.specs/features/super-admin-dashboard/design.md)
  e layout raiz com sidebar/header, modo claro padrão e escuro azul principal;
  respeitar preferência ainda não definida e revisar contraste/teclado/portais.
- [ ] SA-10P: Especificar contrato de atualização do próprio nome/e-mail e
  política de sessão/confirmar e-mail conforme SDD (SA-P07).
- [ ] SA-10Q: Implementar leitura/gravação do perfil próprio com DTO estrito,
  e-mail único sem caixa e proteção contra alteração de outro usuário/role.
- [ ] SA-10R: Integrar ProfileSettings/header; verificar persistência, 409,
  sessão após edição e temas. Revisar antes do commit. Senha em backlog.

Alterar backend/src/controller/user.controller.ts, services/user.service.ts,
routes/user.routes.ts, repositories/user.repository.ts e adapters JSON/SQL.
Criar backend/src/dtos/user.profile.dto.ts se o contrato for aprovado;
sem nova tabela. Frontend: arquivos do FE-SA-01D/01L/01P no task pareado.
Sugestões após revisão: `feat(super-admin): add brand-aligned light and dark themes`,
`feat(super-admin): add shared sidebar and header layout` e
`feat(profile): add personal name and email settings`.

## G3 — Administração comercial de planos

- [ ] SA-11: Estender PlanRepository para consulta administrativa, criação,
  atualização e ativação; manter listagem pública só de ativos.
- [ ] SA-12: Validar preço positivo, BRL, slug único e período; não implementar
  trial, medição ou controle de capacidades por plano.
- [ ] SA-13: Definir seed/preços via SA-P01 e preparar migration versionada
  apropriada ao banco vazio; não editar histórico aplicado sem conferência.
- [ ] SA-14: Integrar listagem/formulário e inativação; preservar plano usado
  no histórico. Testar preço zero/inativo e acesso negado; revisar grupo.

Arquivos: alterar backend/src/services/plan.service.ts,
backend/src/repositories/plan.repository.ts, backend/src/persistence/
{json,postgres}/plan.repository.ts e plan.mapper.ts conforme campos; criar
backend/src/controller/platform.plan.controller.ts,
backend/src/dtos/plan.admin.dto.ts; rotas em platform.routes.ts após prontas.
Frontend: pages/super-admin/Plans.tsx, components/super-admin/PlanForm.tsx
e lib/platform.api.ts. Migration de seed/dados somente após SA-P01.
Testes: backend/tests/platform.plans.test.ts e frontend de planos.
Sugestão de commit: `feat(plans): add commercial plan administration`.

## G4 — Cadastro de empresa e venda automática

- [ ] SA-15: Aprovar/versionar companies.plan_id, estado administrativo,
  soft delete e sales com snapshots/constraints; alinhar interfaces SQL/TS.
- [ ] SA-16: Implementar regras de venda e persistência JSON/PostgreSQL,
  coordenação transacional empresa/vínculo/venda e repetição segura.
- [ ] SA-17: Integrar cadastro com plano ativo positivo e venda inicial única;
  separar envio/reenvio de convite da confirmação comercial.
- [ ] SA-18: Expor POST administrativo e formulário com resultado real;
  testar falha parcial, dois envios e concorrência. Revisar SQL e grupo.

Criar backend/src/entities/sale.entity.ts, interfaces/sale.row.ts,
dtos/sale.dto.ts, repositories/sale.repository.ts,
services/sale.service.ts e services/company.onboarding.service.ts;
repositories/company.onboarding.repository.ts e persistence/company.onboarding.ts
se coordenação aprovada. Criar adapters sale em persistence/json e postgres,
selector persistence/sale.repository.ts e controller/platform.company.controller.ts.
Alterar entities/company.entity.ts, dtos/company.admin.dto.ts (criar),
repositories/adapters de companies e JSON schema. Criar SQL em
backend/prisma/migrations/<timestamp>_company_administration/migration.sql e
<timestamp>_create_sales/migration.sql, conforme dependências aprovadas.
Frontend: pages/super-admin/CompanyCreate.tsx, components/super-admin/CompanyForm.tsx.
Testes previstos: backend/tests/company.onboarding.test.ts e SQL isolado.
Sugestão de commit: `feat(companies): register company and initial sale atomically`.

## G5 — Gestão de empresas e vendas manuais

- [ ] SA-19: Implementar listagem/detalhe/edição administrativos e troca de
  plano sem venda automática; preservar snapshot de vendas antigas.
- [ ] SA-20: Implementar suspensão/soft delete e aplicar elegibilidade em
  auth, catálogo completo e storage. Não apagar histórico/imagens.
- [ ] SA-21: Implementar consulta de vendas e lançamento manual conforme
  SA-P04/SA-P07; proteger repetição; não criar cobrança ou pagamento.
- [ ] SA-22: Integrar telas, confirmações e aviso de venda manual na edição;
  navegação após troca não registra venda sozinha.
- [ ] SA-23: Testar suspensa/arquivada, tokens anteriores, dois tenants,
  URL de capa e histórico. Revisar interfaces, UI e grupo antes de commit.

Alterar company.service.ts, CompanyRepository e adapters, public
company.controller.ts, storage.service.ts e auth/user service; criar
controller/sale.controller.ts e completar services/dtos de venda e empresa.
Rotas futuras em backend/src/routes/platform.routes.ts e montagem em app.ts.
Frontend: pages/super-admin/{Companies,CompanyDetail,CompanyEdit,Sales,SaleCreate}.tsx,
components/super-admin/{CompanyForm,SaleForm}.tsx e lib/platform.api.ts.
Testes previstos: backend/tests/platform.companies.test.ts,
backend/tests/platform.sales.test.ts e testes frontend dos formulários.
Sugestões de commits, cada qual revisado:
`feat(companies): add platform lifecycle management` e
`feat(sales): add commercial sales and manual registration`.

## G6 — Equipe de cada empresa

- [ ] SA-24: Consultar funcionários por empresa e permitir convite dos
  papéis empresariais aprovados usando primeiro acesso/reenvio existentes.
- [ ] SA-25: Implementar edição/suspensão conforme SA-P03, validando empresa
  da URL e vínculo atual. Não promover ou transferir implicitamente.
- [ ] SA-26: Integrar lista/formulário e estados do convite; tratar falha de
  e-mail sem duplicar conta/empresa/venda.
- [ ] SA-27: Testar duas empresas, e-mail único, convite repetido, vínculo
  divergente, usuário suspenso e payload sem segredos; revisar grupo.

Criar backend/src/controller/company.user.controller.ts,
backend/src/services/company.user.service.ts e backend/src/dtos/company.user.dto.ts.
Alterar UserRepository/adapters, admin.service.ts e auth.service.ts apenas
para reaproveitar regras. Rotas administrativas explícitas em platform.routes.ts.
Frontend: pages/super-admin/CompanyUsers.tsx e
components/super-admin/CompanyUserForm.tsx. Testes:
backend/tests/platform.company.users.test.ts e testes frontend da equipe.
Sugestão de commit: `feat(company-users): add platform team administration`.

## G7 — Administradores da plataforma

- [ ] SA-28: Definir SA-P05 e implementar listagem/provisionamento e gestão
  de acessos de superadmins em fluxo distinto dos convites empresariais.
- [ ] SA-29: Aplicar proteções aprovadas de autoalteração/último administrador,
  incluindo concorrência; não expor editor genérico de permissões.
- [ ] SA-30: Integrar tela e testar escalação indevida, vínculo nulo,
  duplicidade e retirada de acesso; revisar grupo.

Criar backend/src/controller/platform.user.controller.ts,
backend/src/services/platform.user.service.ts e backend/src/dtos/platform.user.dto.ts;
estender users repositories/adapters e mecanismos de convite aprovados.
Frontend: pages/super-admin/Administrators.tsx e
components/super-admin/AdministratorForm.tsx; rotas em platform.routes.ts.
Testes: backend/tests/platform.users.test.ts e frontend correspondente.
Sugestão de commit: `feat(platform-users): add reviewed administrator management`.

## G8 — Integração, revisão e entrega

- [ ] SA-31: Executar E2E UI/API/persistência isolada dos casos do SDD;
  confirmar negativas, rollback e histórico; separar provas simuladas/reais.
- [ ] SA-32: Conferir scripts reais e executar checks relevantes; documentar
  falhas herdadas sem reaproveitar resultado antigo como sucesso atual.
- [ ] SA-33: Atualizar docs/api.md, docs/operacao.md, docs/storage.md,
  docs/frontend-backend.md e specs impactadas com o resultado implementado.
- [ ] SA-34: Revisar grupo e diff de integração; registrar aprovação antes
  de commit, push e PR para staging. Incluir SQL versionado no PR.

Arquivos previstos: backend/tests/platform.e2e.test.ts,
frontend/tests/super-admin.e2e.ts se o runner escolhido suportar o local,
specs desta entrega e guias listados. Não criar teste executável nesta fase.
Confirmar runner/local antes da implementação; não adicionar pacote sem aprovação.
Sugestão de commit: `test(super-admin): verify platform workflows end to end`.

## Backlog, sem inclusão automática na implementação

- [ ] SA-B01: Especificar assinaturas/cobrança/pagamentos e integração futura.
- [ ] SA-B02: Especificar arquitetura de trial gratuito, estados, datas,
  elegibilidade, encerramento/conversão e efeito sobre acesso.
- [ ] SA-B03: Especificar capacidades de planos, funcionalidades, limites,
  consumo, regras por plano e enforcement. Sem trial/plano grátis operacional.
- [ ] SA-B04: Definir configurações globais (SA-P06) antes de desenhar schema/API.
- [ ] SA-B05: Especificar alteração de senha na área de configurações do perfil.

## Registro de revisão e evidências

| Grupo | Revisor | Resultado / evidências | Commit liberado |
| --- | --- | --- | --- |
| G0 documentação | Subagente final_review, mesmo modelo do agente principal, em 2026-11-02 | Nove Markdown revisados contra código/decisões; sem bloqueadores. Links dos seis documentos novos resolvem e os três índices foram conferidos; git diff --check aprovado. | Sim, somente documentação |
| Extensão de design/layout/perfil | Subagente final_review, mesmo modelo do agente principal, em 2026-11-02 | Seis Markdown revisados na staging; links, cabeçalhos, tokens de cores, escopo do perfil e decisões pendentes conferidos; git diff --check aprovado. | Sim, somente documentação |
| G1–G8 implementação | Não executada | Planejamento somente; nenhum teste ou SQL executado. | Não |

A revisão documental não aprova preços, contratos ou schema pendentes e não
constitui revisão da futura implementação.

Não executados: testes da aplicação, build, integração externa ou migrations.
Não há código, configuração ou teste executável alterado nesta entrega.
