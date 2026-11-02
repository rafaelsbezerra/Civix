# Tarefas — dashboard superadmin E2E

Data: 2026-11-02. [Spec](spec.md) · [SDD](sdd.md) ·
[Tarefas frontend](../../../../frontend/.specs/features/super-admin-dashboard/task.md).

Implementação autorizada em 2026-11-02 para G0 a G4 e equivalentes frontend,
incluindo G2P. G5 a G8 continuam fora desta rodada.
**Não commitar sem revisão de cada grupo.** Os commits abaixo são sugestões
em inglês, no padrão Conventional Commits, e não foram executados.
Paths são relativos à raiz do repositório; SDD detalha a lógica por arquivo.

## Ordem e bloqueios

G0 → G1 → G2 → G3/G4 → G5 → G6 → G8. G7 usa o fluxo de convite confirmado e pode avançar
separadamente após G1/G2. Tela de planos deve estar utilizável antes de
cadastrar empresa real. G3/G4 compõem o cadastro comercial; não publicar
cadastro com venda incompleto. Usar ramos/worktrees separados quando a
implementação for autorizada; dependentes convergem em integração para staging.

## G0 — Revisar e fechar contratos

- [x] SA-00: Baseline revalidada: auth já importa user.service e a migration
  20261102000100_user_company_scope já existe. Não duplicar essa migration.
  Corrigir UserId ausente e demais erros de tipagem/runtime em G1.
- [x] SA-01: Resoluções SA-P01–05 adotadas; usuário revisou a spec e autorizou
  implementação. SA-P06 permanece em backlog; SA-P07 aprovado para G0–G4
  conforme contratos escolhidos no SDD, sem liberar grupos posteriores.
- [x] SA-02: Rotas platform e contratos G0–G4 adotados. Operação de cadastro
  usa operationId UUID no body, escopo ator+operação e fingerprint do payload,
  transação em conexão única e replay sem nova venda. Sem SQL aplicado.
- [x] SA-03: Registrar revisão documental e só depois commitar documentação.

Arquivos: esta pasta spec.md/sdd.md/task.md; frontend/.specs/features/
super-admin-dashboard/{spec,task}.md; docs/super-admin.md e índices.
Sugestão de commit: `docs(super-admin): define dashboard delivery plan`.
Aceite: decisões aprovadas ou bloqueios explícitos; backlog de trial,
limites/regras de planos e billing separado do compromisso desta entrega.

## G1 — Corrigir dependências e proteger plataforma

- [ ] SA-04: Resolver import ausente e tipagem sem duplicar regra de identidade;
  conferir profile/JWT/papéis e bloqueio por estado da empresa.
- [ ] SA-05: Revalidar a migration users.company_id existente, FK/checks e
  compatibilidade da sequência. Não recriar nem executar essa migration.
- [ ] SA-06: Implementar guard backend super_admin com identidade vigente;
  manter admin legado desmontado até substituição segura.
- [ ] SA-07: Testar 401/403, revogação de papel/vínculo e ausência de dados
  empresariais privados na plataforma. Registrar revisão do grupo.

Arquivos a alterar: backend/src/middlewares/auth.ts,
backend/src/services/user.service.ts, backend/src/entities/user.entity.ts,
backend/src/interfaces/auth.user.row.ts, repositories/adapters de users e
backend/src/persistence/json/local.data.ts. Criar, se aprovado,
backend/src/middlewares/super.admin.ts; conferir a migration de vínculo
20261102000100_user_company_scope existente, sem criar duplicata.
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
apenas se necessário; criar frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx,
frontend/src/pages/dashboard-super-admin/Overview.tsx; estender o arquivo existente
frontend/src/lib/api.ts.
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
Estender backend/src/dtos/user.auth.dto.ts existente, sem arquivo/tabela de
perfil. Frontend: arquivos do FE-SA-01D/01L/01P no task pareado.
Sugestões após revisão: `feat(super-admin): add brand-aligned light and dark themes`,
`feat(super-admin): add shared sidebar and header layout` e
`feat(profile): add personal name and email settings`.

## G3 — Administração comercial de planos

- [ ] SA-11: Estender PlanRepository para consulta administrativa, criação,
  atualização e ativação; manter listagem pública só de ativos.
- [ ] SA-12: Validar preço positivo, BRL, slug único e período; não implementar
  trial, medição ou controle de capacidades por plano.
- [ ] SA-13: Usar planos demo atuais como referência. Não exigir planos
  cadastrados/ativos para construir módulos; usar fixtures em testes e validar
  os registros reais na execução do cadastro. Seed é preparação de ambiente,
  não definição de catálogo bloqueante nem alteração obrigatória de migration.
- [ ] SA-14: Integrar listagem/formulário e inativação; preservar plano usado
  no histórico. Testar preço zero/inativo e acesso negado; revisar grupo.

Arquivos: alterar backend/src/services/plan.service.ts,
backend/src/repositories/plan.repository.ts, backend/src/persistence/
{json,postgres}/plan.repository.ts e plan.mapper.ts conforme campos; alterar
backend/src/controller/plan.controller.ts e tipos em entities/plan.entity.ts
existentes; rotas em platform.routes.ts após prontas.
Frontend: pages/dashboard-super-admin/Plans.tsx, components/dashboard-super-admin/PlanForm.tsx
e lib/api.ts. Não bloquear implementação por existência de seed/dados no banco.
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
dtos/sale.dto.ts, repositories/sale.repository.ts e services/sale.service.ts;
adapters sale em persistence/json e postgres e selector persistence/sale.repository.ts.
Alterar controller/company.controller.ts, services/company.service.ts,
entities/company.entity.ts, dtos/company.create.dto.ts e repositories/adapters
existentes de company para coordenar e gravar empresa/plano/venda. Não criar
arquivos de onboarding; o método de gravação conjunta pertence a CompanyRepository.
Atualizar JSON schema. Criar SQL em
backend/prisma/migrations/<timestamp>_company_administration/migration.sql e
<timestamp>_create_sales/migration.sql, conforme dependências aprovadas.
Frontend: pages/dashboard-super-admin/CompanyCreate.tsx, components/dashboard-super-admin/CompanyForm.tsx.
Testes previstos: estender backend/tests/company.routes.test.ts e conferir
atomicidade em SQL isolado, sem criar uma implementação de onboarding separada.
Sugestão de commit: `feat(companies): register company and initial sale atomically`.

## G5 — Gestão de empresas e vendas manuais

- [ ] SA-19: Implementar listagem/detalhe/edição administrativos e troca de
  plano sem venda automática; preservar snapshot de vendas antigas.
- [ ] SA-20: Implementar desativação com motivo obrigatório, soft delete,
  reativação e restauração permitidas; aplicar elegibilidade em auth, catálogo
  e storage. Restaurada permanece desativada até reativação explícita;
  invalidar convites anteriores, sem recuperá-los ao reativar.
  Não apagar histórico/imagens nem reativar funcionários bloqueados individualmente.
- [ ] SA-21: Implementar consulta de vendas e lançamento manual conforme
  decisões resolvidas SA-P04 e contratos SA-P07; proteger repetição; não criar cobrança ou pagamento. Não
  implementar edição: correção exige DELETE definitivo e novo POST manual.
  Modo plano atual usa preço consultado pelo backend sem motivo obrigatório;
  modo valor manual exige descrição/motivo e atende plano antigo. Permitir
  data comercial passada, distinta de created_at, e UTC em todas as datas.
- [ ] SA-22: Integrar telas, confirmações e aviso de venda manual na edição;
  navegação após troca não registra venda sozinha.
- [ ] SA-23: Testar suspensa/arquivada, tokens anteriores, dois tenants,
  URL de capa e histórico. Cobrir plano errado no cadastro → excluir venda
  automática → relançar manualmente; troca posterior de plano não gera venda.
  Testar DELETE sem apagar empresa/plano e impedir que repetição do cadastro
  recrie a venda excluída. Revisar interfaces, UI e grupo antes de commit.

Alterar company.service.ts, CompanyRepository e adapters, public
company.controller.ts, storage.service.ts e auth/user service; criar
controller/sale.controller.ts e completar services/dtos de venda e empresa.
Rotas futuras em backend/src/routes/platform.routes.ts e montagem em app.ts.
Frontend: pages/dashboard-super-admin/{Companies,CompanyDetail,CompanyEdit,Sales,SaleCreate}.tsx,
components/dashboard-super-admin/{CompanyForm,SaleForm}.tsx e lib/api.ts.
Testes previstos: backend/tests/platform.companies.test.ts,
backend/tests/platform.sales.test.ts e testes frontend dos formulários.
Sugestões de commits, cada qual revisado:
`feat(companies): add platform lifecycle management` e
`feat(sales): add commercial sales and manual registration`.
Exclusão definitiva fica no sale.controller.ts/sale.service.ts e
SaleRepository/adapters propostos, com método deleteSaleById; sem updateSale,
sem soft delete de venda e sem exclusão automática na troca de plano.

## G6 — Equipe de cada empresa

- [ ] SA-24: Consultar funcionários por empresa e permitir convite dos
  papéis empresariais aprovados usando primeiro acesso/reenvio existentes.
- [ ] SA-25: Permitir troca admin_empresa/atendente e desativar o último admin
  empresarial. Validar empresa da URL/vínculo e motivo obrigatório. Atendentes
  podem ser desativados/excluídos, finalizando atendimentos atribuídos; integrar
  ao domínio de atendimento quando disponível, sem criá-lo por antecipação.
  Não promover superadmin nem transferir empresa implicitamente.
- [ ] SA-26: Integrar lista/formulário e estados do convite; tratar falha de
  e-mail sem duplicar conta/empresa/venda.
- [ ] SA-27: Testar duas empresas, e-mail único, convite repetido, vínculo
  divergente, usuário suspenso e payload sem segredos; revisar grupo.

Alterar backend/src/controller/user.controller.ts, services/user.service.ts,
dtos/user.auth.dto.ts e UserRepository/adapters existentes. Nomear funções
pelo contexto, por exemplo getUsersByCompanyId, findActiveUserByCompanyId,
inviteCompanyUser e suspendCompanyUser. Reutilizar admin.service.ts e
auth.service.ts nos convites. Sem controller/service/DTO próprio de equipe.
Rotas administrativas explícitas em platform.routes.ts.
Frontend: pages/dashboard-super-admin/Users.tsx e
components/dashboard-super-admin/UserForm.tsx compartilhados com G7.
Testes: estender backend/tests/user.routes.test.ts e testes frontend de usuários.
Sugestão de commit: `feat(users): add company-scoped administration`.

## G7 — Administradores da plataforma

- [ ] SA-28: Implementar criação de superadmins por outros ativos via convite
  para definir senha, listagem e reativação por outro superadmin ativo.
  Usar user existente, com motivo ao desativar e poderes iguais para todos.
- [ ] SA-29: Impedir desativar a própria conta de superadmin e o último
  superadmin ativo, inclusive sob concorrência. Testar chamadas diretas,
  motivo ausente e cenário com uma única conta; não expor editor de permissões.
- [ ] SA-30: Integrar tela e testar escalação indevida, vínculo nulo,
  duplicidade, motivo persistido, convite/consumo único, reativação e poderes
  iguais; revisar grupo. SA-P05 funcionalmente resolvida, sem editor de permissões.

Estender backend/src/controller/user.controller.ts, services/user.service.ts,
dtos/user.auth.dto.ts e UserRepository/adapters existentes com operações
como getSuperAdmins, inviteSuperAdmin, updateSuperAdmin e suspendSuperAdmin,
sem arquivos/módulo por perfil. Reutilizar/adaptar convite para definir senha;
campos e implementação transacional seguem SA-P07.
Frontend: reutilizar pages/dashboard-super-admin/Users.tsx e
components/dashboard-super-admin/UserForm.tsx com escopo global autorizado;
rotas em platform.routes.ts. Testes: estender user.routes.test.ts e frontend
de usuários, com casos globais separados dos casos por empresa.
Sugestão de commit: `feat(users): add reviewed superadmin management`.

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
| Reuso de módulos e vendas imutáveis | Subagente final_review, mesmo modelo do agente principal, em 2026-11-02 | Sete Markdown revisados; company/user existentes, API única, pastas exclusivas, DELETE definitivo e relançamento manual coerentes; links e git diff --check aprovados. Sem testes executáveis ou SQL nesta tarefa. | Sim, somente documentação |
| Reativação, motivos, preço e proteção de superadmins | Subagente final_review, mesmo modelo do agente principal, em 2026-11-02 | Seis Markdown revisados sem bloqueadores; decisões SA-D17–21 coerentes, inclusive impedir própria conta/último ativo sob concorrência. Links locais e git diff --check aprovados. | Não: usuário solicitou manter sem commit/push |
| Resolução de SA-P01–05 | Subagente final_review, mesmo modelo do agente principal, em 2026-11-02 | Seis Markdown conferidos: planos demo sem gate de dados, restauração inativa, usuários/equipe, dois modos de preço, UTC e convites/reativação de superadmin com poderes iguais. Links válidos e sem inconsistências relevantes. | Não: manter sem commit/push |
| G1–G8 implementação | Não executada | Planejamento somente; nenhum teste ou SQL executado. | Não |

A revisão documental não aprova preços, contratos ou schema pendentes e não
constitui revisão da futura implementação.

Não executados: testes da aplicação, build, integração externa ou migrations.
Não há código, configuração ou teste executável alterado nesta entrega.
