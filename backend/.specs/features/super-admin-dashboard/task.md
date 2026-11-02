# Tarefas — dashboard superadmin E2E

Data: 2026-11-02. [Spec](spec.md) · [SDD](sdd.md) ·
[Tarefas frontend](../../../../frontend/.specs/features/super-admin-dashboard/task.md).

G0 a G4 e equivalentes frontend, incluindo G2P, foram concluídos.
Em 2026-11-02 o usuário autorizou a continuação G5 a G8 e equivalentes frontend;
as decisões técnicas novas abaixo aguardam confirmação antes da parte afetada.
**Não commitar sem revisão de cada grupo.** Os commits abaixo são sugestões
em inglês, no padrão Conventional Commits, e orientam os commits da implementação revisada.
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

- [x] SA-04: Resolver import ausente e tipagem sem duplicar regra de identidade;
  conferir profile/JWT/papéis e bloqueio por estado da empresa.
- [x] SA-05: Revalidar a migration users.company_id existente, FK/checks e
  compatibilidade da sequência. Não recriar nem executar essa migration.
- [x] SA-06: Implementar guard backend super_admin com identidade vigente;
  manter admin legado desmontado até substituição segura.
- [x] SA-07: Testar 401/403, revogação de papel/vínculo e ausência de dados
  empresariais privados na plataforma. Registrar revisão do grupo.

Arquivos a alterar: backend/src/middlewares/auth.ts,
backend/src/services/user.service.ts, backend/src/entities/user.entity.ts,
backend/src/interfaces/auth.user.row.ts, repositories/adapters de users e
backend/src/persistence/json/local.data.ts. Criar, se aprovado,
backend/src/middlewares/super.admin.ts; conferir a migration de vínculo
20261102000100_user_company_scope existente, sem criar duplicata.
Testes previstos: backend/tests/platform.foundation.test.ts e testes de
users existentes, depois de implementação autorizada.
Sugestão de commit: `fix(auth): align identity and platform authorization`.
Aceite: base coerente, migrations revisadas, chamadas administrativas
negadas no backend para outros papéis. SQL real só em ambiente autorizado.

## G2 — Shell privado e navegação

- [x] SA-08: Montar layout/rotas superadmin usando ProtectedRoute e profile;
  redirecionar login desse perfil somente após a rota existir.
- [x] SA-09: Implementar menu disponível, logout local, loading/erro/403 e
  limpeza de estado; preservar rotas públicas e outros perfis.
- [x] SA-10: Verificar acesso direto/reload, teclado/foco e falha de rede;
  revisar diff antes de commit. Não criar métricas fictícias.

Arquivos: alterar frontend/src/routes/AppRoute.tsx,
frontend/src/pages/login.tsx e frontend/src/components/auth/ProtectedRoute.tsx
apenas se necessário; criar frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx,
frontend/src/pages/dashboard-super-admin/Overview.tsx; estender o arquivo existente
frontend/src/lib/api.ts.
Detalhes e testes planejados estão no task frontend.
Sugestão de commit: `feat(super-admin): add protected administration shell`.

## G2P — Configurações do próprio perfil e design

- [x] SA-10D: Implementar o [design frontend](../../../../frontend/.specs/features/super-admin-dashboard/design.md)
  e layout raiz com sidebar/header, modo claro padrão e escuro azul principal;
  persistir preferência neste navegador e revisar contraste/teclado/portais.
- [x] SA-10P: Especificar contrato de atualização do próprio nome/e-mail e
  política de sessão/confirmar e-mail conforme SDD (SA-P07).
- [x] SA-10Q: Implementar leitura/gravação do perfil próprio com DTO estrito,
  e-mail único sem caixa e proteção contra alteração de outro usuário/role.
- [x] SA-10R: Integrar ProfileSettings/header; verificar persistência, 409,
  sessão após edição e temas. Revisar antes do commit. Senha em backlog.

Alterar backend/src/controller/user.controller.ts, services/user.service.ts,
routes/user.routes.ts, repositories/user.repository.ts e adapters JSON/SQL.
Estender backend/src/dtos/user.auth.dto.ts existente, sem arquivo/tabela de
perfil. Frontend: arquivos do FE-SA-01D/01L/01P no task pareado.
Sugestões após revisão: `feat(super-admin): add brand-aligned light and dark themes`,
`feat(super-admin): add shared sidebar and header layout` e
`feat(profile): add personal name and email settings`.

## G3 — Administração comercial de planos

- [x] SA-11: Estender PlanRepository para consulta administrativa, criação,
  atualização e ativação; manter listagem pública só de ativos.
- [x] SA-12: Validar preço positivo, BRL, slug único e período; não implementar
  trial, medição ou controle de capacidades por plano.
- [x] SA-13: Usar planos demo atuais como referência. Não exigir planos
  cadastrados/ativos para construir módulos; usar fixtures em testes e validar
  os registros reais na execução do cadastro. Seed é preparação de ambiente,
  não definição de catálogo bloqueante nem alteração obrigatória de migration.
- [x] SA-14: Integrar listagem/formulário e inativação; preservar plano usado
  no histórico. Testar preço zero/inativo e acesso negado; revisar grupo.

Arquivos: alterar backend/src/services/plan.service.ts,
backend/src/repositories/plan.repository.ts, backend/src/persistence/
{json,postgres}/plan.repository.ts e plan.mapper.ts conforme campos; alterar
backend/src/controller/plan.controller.ts e tipos em entities/plan.entity.ts
existentes; rotas em platform.routes.ts após prontas.
Frontend: pages/dashboard-super-admin/Plans.tsx, components/dashboard-super-admin/PlanForm.tsx
e lib/api.ts. Não bloquear implementação por existência de seed/dados no banco.
Testes: backend/tests/platform.foundation.test.ts e frontend de planos.
Sugestão de commit: `feat(plans): add commercial plan administration`.

## G4 — Cadastro de empresa e venda automática

- [x] SA-15: Aprovar/versionar companies.plan_id, estado administrativo,
  soft delete e sales com snapshots/constraints; alinhar interfaces SQL/TS.
- [x] SA-16: Implementar regras de venda e persistência JSON/PostgreSQL,
  coordenação transacional empresa/vínculo/venda e repetição segura.
- [x] SA-17: Integrar cadastro com plano ativo positivo e venda inicial única;
  separar envio/reenvio de convite da confirmação comercial.
- [x] SA-18: Expor POST administrativo e formulário com resultado real;
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
Vendas manuais removidas não entram na decisão de novo lançamento (SA-D35);
a proteção contra recriar venda inicial pelo cadastro permanece distinta.

## G6 — Equipe de cada empresa

- [ ] SA-24: Consultar funcionários por empresa e permitir convite dos
  papéis empresariais aprovados usando primeiro acesso/reenvio existentes.
- [ ] SA-25: Permitir troca admin_empresa/atendente e desativar o último admin
  empresarial. Validar empresa da URL/vínculo e motivo obrigatório. Atendentes
  podem ser desativados/excluídos logicamente por deleted_at, finalizando atendimentos atribuídos; integrar
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

## Histórico da fase documental — anterior à implementação

As linhas abaixo registram o estado de cada revisão documental naquela fase.
A seção seguinte contém o estado atual de G0 a G4.

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

## Evidências da implementação — 2026-11-02

Revisão secundária: final_review, sem bloqueadores após corrigir privacidade
das consultas públicas e ativação de plano legado com preço zero.
Revisões de testes: storage_tests e review_http.

- Backend: foundation 124/124, platform 19/19, seed 40/40, Prisma tooling offline 3/3; TypeScript completo aprovado.
- Frontend: 26/26 testes direcionados na revisão inicial. Repetição posterior: 25/26, com timeout de 5 segundos no teste existente de recuperação; arquivo repetido com limite de 15 segundos: 13/13.
- TypeScript frontend e lint aprovados; reset de erro dos efeitos corrigido e verificado novamente nos dois arquivos afetados.
- Browser real com Chrome headless, backend JSON/Vite isolados: login, tema por teclado/reload, planos criar/editar, cadastro com uma empresa e venda, nome no header, troca de e-mail encerrando sessão e menu mobile/Escape sem overflow.
- Build: TypeScript e bundle Vite concluídos; gate final existente falha por dashboard.png ausente na página Sobre. Não considerar npm run build aprovado.
- Não foram executados PostgreSQL/R2 reais nem migrations. Testes PostgreSQL usam conexão simulada, sem provar homologação no provedor.
- Migrations novas preservam as anteriores e reutilizam companies.status. G5 a G8 continuam planejados.

Documentos atualizados: spec/SDD/tasks pareados para rastrear decisões e entrega;
docs/api.md e docs/frontend-backend.md para contratos; docs/storage.md e
docs/dados-locais.md para comandos válidos. A spec de storage foi alinhada
à remoção confirmada de cover_image_url_expires_in; TTL da URL continua 300s.

Revisão visual final: títulos escuros herdavam regra global com !important.
Override restrito ao dashboard corrigiu o tema; Chrome confirmou títulos
#f4f6f7 sobre #102b42 (13,39:1), sem overflow mobile ou erros de página.
review_http aprovou o delta visual, além dos fluxos reais já registrados.

## Continuação autorizada — G5 a G8

G5 a G8 e equivalentes frontend foram autorizados em 2026-11-02, na branch
feat/super-admin-dashboard. Respostas às seis perguntas registradas como
SA-D29–36 na [spec](spec.md); lógica e arquivos no [SDD](sdd.md).
As tarefas G5 a G8 continuam abertas: documentar uma decisão não comprova
sua implementação. Revisar cada grupo antes do commit e não aplicar SQL.

### Ajustes de tasks pelas decisões respondidas

- [ ] SA-20D: Arquivar empresa reutilizando o motivo/campo de desativação,
  sem criar campo próprio de arquivamento (SA-D34).
- [ ] SA-21D: Diferenciar venda manual na própria sales, sem tabela de
  operações manuais. Validar operação/dados somente entre vendas existentes;
  venda excluída não impede novo lançamento. Manter distinta a proteção da
  venda inicial em company_registration_operations (SA-D31/35).
- [ ] SA-23D: Cobrir replay de venda manual existente, dados divergentes,
  exclusão seguida de novo lançamento e repetição do cadastro inicial.
- [ ] SA-24D: Aplicar page/limit, padrão 20, máximo 100, ordenação estável
  e metadados às listas administrativas previstas (SA-D32).
- [ ] SA-25D: Acrescentar deleted_at e deactivation_reason TEXT à migration existente
  backend/prisma/migrations/20261025000100_create_users/migration.sql;
  alinhar User, UserRow, JSON e repositories. Excluir atendente logicamente,
  retirar da lista normal e impedir acesso sem destruir referências
  (SA-D29/30/37). Não executar migration nem criar campos não aprovados.
- [ ] SA-25R: Permitir reativar usuário empresarial pelo superadmin; quando
  ainda não possuir senha, exigir novo convite (SA-D33).
- [ ] SA-29D: Proteger alterações administrativas por transação/bloqueio,
  revalidando ator, alvo e último ativo dentro da operação. Testar solicitações
  concorrentes. permist_write foi uma sugestão, sem autorizar ORM/pacote
  (SA-D36).
- [ ] SA-31D: Incluir os casos acima na validação G8 e registrar separadamente
  evidências simuladas/reais. Não afirmar entrega dos grupos antes dos checks.

### Impedimentos técnicos remanescentes

- **SA-P08 resolvida:** campo users.deactivation_reason TEXT aprovado em
  SA-D37. Implementar gravação e validação junto de G6/G7.
- **SA-P09 resolvida:** usar tokens_revoked_at TIMESTAMPTZ; desativar
  invalida todas as sessões, reativar exige novo login. Não usar session_version.
- **SA-P10 resolvida:** operation_id UUID e fingerprint TEXT na própria
  sales, sem tabela adicional e sem considerar vendas excluídas.

Não existe módulo de atendimento no backend atual. Preservar essa limitação;
quando o domínio existir, integrar a finalização dos atendimentos atribuídos.
Não criar esse módulo por antecipação nem marcar essa integração como feita.

### Revisão documental das respostas — 2026-11-02

Subagente scope_review (gpt-6-luna, raciocínio max), revisão somente leitura:
SA-D29–36 e SA-P08–10 sem bloqueadores documentais; commit liberado.
22 links relativos válidos e git diff --check aprovado. Nenhum SQL ou teste
foi executado para esta atualização documental. Alterações de código/teste
já em andamento antes dela foram preservadas e não integram este commit.

## Resolução final de sessões e vendas — 2026-11-02

Usuário escolheu data de revogação: usar users.tokens_revoked_at TIMESTAMPTZ,
sem session_version. Ao desativar, gravar o instante e invalidar todas as
sessões. Reativar não apaga o marcador; novo login emite token com instante
de emissão posterior. Middleware compara a cada requisição. Tokens anteriores
ou sem instante válido diante de marcador persistido são recusados.
Precisão de milissegundos no contrato de emissão evita reutilização de token
gerado no mesmo segundo. Alteração e marcador são gravados na mesma operação.

Usuário aprovou sales.operation_id UUID e sales.fingerprint TEXT. Escopo de
operação por ator; fingerprint de dados validados/normalizados. Mesma operação
com dados iguais reutiliza venda existente, dados diferentes gera 409. Vendas
excluídas não são consultadas e não deixam recibo para o fluxo manual.
Acrescentar os campos à migration existente de sales e alinhar SQL/JSON/TS;
não criar tabela adicional. A proteção da venda inicial permanece separada.

SA-P08 resolvida por deactivation_reason TEXT; SA-P09 resolvida por data de
revogação; SA-P10 resolvida por operation_id + fingerprint na própria sales.
Nenhuma dessas decisões autoriza executar migrations automaticamente.
