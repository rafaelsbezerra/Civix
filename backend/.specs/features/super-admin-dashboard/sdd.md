# SDD — telas e backend do superadmin

Data: 2026-11-02. Complementa a [spec](spec.md) e orienta [tarefas](task.md).
Tudo descrito como criação/alteração é planejamento, não código entregue.
Caminhos são relativos à raiz do repositório. Escolhas novas de contrato,
schema e coordenação estão **Aguardando resposta — SA-P07** antes de código.
Os casos de negócio confirmados estão em SA-D01 a SA-D10 da spec.

## 1. Organização e responsabilidade

Preservar pastas por função e controllers com funções independentes.
Routers chamam middleware e controller; controller valida HTTP e chama
service diretamente; service resolve regras; repository contém contrato de
domínio. SQL fica nos adapters já adotados em src/persistence, não em uma
nova interface genérica de consultas. Não adicionar ORM/SDK/biblioteca para
esta spec. Prisma 7 continua com migrations SQL nativas versionadas.

| Responsabilidade | Arquivos previstos |
| --- | --- |
| Sessão e autorização | Alterar backend/src/middlewares/auth.ts e backend/src/services/user.service.ts; criar backend/src/middlewares/super.admin.ts se aprovado. Resolver import ausente sem criar uma segunda fonte de identidade. |
| Entrada administrativa | Criar backend/src/routes/platform.routes.ts; montagem futura em backend/src/app.ts somente após handlers/autorização completos. Não simplesmente montar admin.routes legado. |
| Empresas | Alterar backend/src/services/company.service.ts, backend/src/repositories/company.repository.ts e adapters json/postgres/company.repository.ts; criar backend/src/controller/platform.company.controller.ts e backend/src/dtos/company.admin.dto.ts. |
| Cadastro coordenado | Criar backend/src/services/company.onboarding.service.ts para coordenar empresa/plano/venda; responsabilidade de gravação conjunta em backend/src/persistence/company.onboarding.ts e contrato de domínio backend/src/repositories/company.onboarding.repository.ts, se a proposta de transação for aprovada. |
| Equipe empresarial | Criar backend/src/controller/company.user.controller.ts, backend/src/services/company.user.service.ts e backend/src/dtos/company.user.dto.ts; estender UserRepository/adapters e reutilizar admin.service/auth.service para convites aprovados. |
| Planos | Estender backend/src/services/plan.service.ts, backend/src/repositories/plan.repository.ts, backend/src/persistence/{json,postgres}/plan.repository.ts; criar backend/src/controller/platform.plan.controller.ts e backend/src/dtos/plan.admin.dto.ts. |
| Vendas | Criar backend/src/entities/sale.entity.ts, backend/src/interfaces/sale.row.ts, backend/src/dtos/sale.dto.ts, backend/src/repositories/sale.repository.ts, backend/src/services/sale.service.ts, backend/src/controller/sale.controller.ts e backend/src/persistence/{sale.repository.ts,json/sale.repository.ts,postgres/sale.repository.ts}. |
| Superadmins | Criar backend/src/controller/platform.user.controller.ts, backend/src/services/platform.user.service.ts e backend/src/dtos/platform.user.dto.ts; estender users sem criar tabela paralela de identidade. |
| Schema e modo local | Alterar backend/src/persistence/json/local.data.ts e tipos de Company/User; criar migrations incrementais sob backend/prisma/migrations/<timestamp>_<change>/migration.sql após aprovação. |
| Shell frontend | Alterar frontend/src/routes/AppRoute.tsx e frontend/src/pages/login.tsx; criar frontend/src/components/layout/SuperAdminLayout.tsx e frontend/src/pages/super-admin/*.tsx. |
| Consumo e formulários | Criar frontend/src/lib/platform.api.ts e frontend/src/components/super-admin/*; reutilizar frontend/src/lib/api.ts e frontend/src/components/auth/ProtectedRoute.tsx. |

Configurações globais e billing não ganham arquivos de implementação antes
da definição. Os nomes acima indicam onde colocar código, não autorizam
criar abstrações vazias ou todos os arquivos de uma vez.

## 2. Rotas e contratos propostos

Prefixo administrativo proposto: /api/v1/platform; todas as operações abaixo
exigem Bearer e super_admin vigente, inclusive GET. URLs não estão montadas.
SA-P07 precisa aprovar contratos; usar PUT nas propostas para não introduzir
PATCH silenciosamente, que o CORS atual não permite.

| Método/caminho após o prefixo | Caso e entrada | Saída proposta |
| --- | --- | --- |
| GET /companies | Filtros por termo, estado, plano; página/limite validados | 200 data de empresas administrativas e meta de paginação aprovada |
| POST /companies | Dados empresariais permitidos + planId; identificador de operação idempotente | 201 data contendo company e sale |
| GET /companies/:companyId | UUID | 200 data de empresa/plano/estado; sem conteúdo de conversas |
| PUT /companies/:companyId | Campos editáveis e planId, conforme DTO | 200 empresa atualizada; nenhuma venda automática na edição |
| POST /companies/:companyId/suspension | Motivo se aprovado | 200 estado atualizado |
| DELETE /companies/:companyId | UUID | 204 após soft delete; nunca exclusão física |
| GET /companies/:companyId/users | Empresa e filtros de papel/estado | 200 equipe daquela empresa |
| POST /companies/:companyId/users/invitations | email e role empresarial permitido | 201 estado do convite; nunca senha/token bruto |
| PUT /companies/:companyId/users/:userId | Somente campos aprovados | 200 projeção pública do funcionário |
| POST /companies/:companyId/users/:userId/suspension | Usuário do contexto | 200 estado do acesso |
| GET /plans e GET /plans/:planId | Incluem inativos no administrativo | 200 projeção de plano |
| POST /plans e PUT /plans/:planId | Campos comerciais validados | 201/200 plano |
| POST /plans/:planId/activation | active boolean | 200 plano; sem alterar vendas antigas |
| GET /sales e GET /sales/:saleId | Filtros de empresa/plano/origem/data, paginação | 200 vendas comerciais; valor decimal string + currency BRL |
| POST /sales | companyId, planId, motivo e demais campos aprovados em SA-P04 | 201 venda manual; repetição segura |
| GET /administrators | Superadmins e estados, sem campos secretos | 200 lista administrativa |
| POST /administrators/invitations e PUT /administrators/:userId | Pendentes de SA-P05 | Não publicar até ciclo/permissões definidos |

Não criar DELETE físico de vendas ou plano, APIs de pagamento, endpoints
genéricos para configurações ou endpoint universal de dashboard.
Resumo inicial usa dados administrativos aprovados. Contagens/indicadores
extras exigem fonte e regra explícitas; não somar venda como dinheiro recebido.

Preservar sucesso { data, meta? }, erro público de produção { status,
message }, 401 sem sessão, 403 sem papel, 404 inexistente, 400 entrada
inválida e 409 conflito de unicidade/estado/idempotência. O corpo final de
erros concorrentes e projeções depende de SA-P07. Erros não expõem SQL/hash.
Não aceitar role, actorId, deletedAt, moeda livre ou object_key do cliente.

## 3. Autenticação e navegação

1. Login valida senha e papel persistido; só super_admin é encaminhado à
   rota proposta /super-admin, depois de ela existir. Outros perfis mantêm
   destinos disponíveis; cliente continua sem login.
2. ProtectedRoute busca GET /api/v1/users/profile. Loading bloqueia conteúdo;
   401 limpa token/estado e volta ao login; erro de rede não finge logout.
3. Backend decodifica JWT e busca usuário atual; confere status, papel e
   company_id nulo. Não confiar somente no claim nem no menu frontend.
4. Cada operação administrativa verifica super_admin antes de ler o recurso.
   API empresarial não recebe privilégio global por mudança de parâmetro.
5. Layout oferece Empresas, Planos, Vendas e Administradores disponíveis.
   Configurações/pagamentos/trial não apresentam controles ativos.
6. Ao sair, limpar token e estado administrativo. Não adicionar revogação
   remota ou refresh sem decisão específica; comunicar limite Bearer atual.

Código: auth.ts/user.service.ts, middleware proposto super.admin.ts,
ProtectedRoute.tsx, SuperAdminLayout.tsx, AppRoute.tsx e login.tsx.

## 4. Cadastro de empresa e venda inicial

1. Controller recebe DTO empresarial + planId e identidade do ator da sessão.
   Campos da empresa usam o contrato existente em português; identificadores
   novos seguem inglês. Não renomear todo o catálogo nesta entrega.
2. Service valida CNPJ/e-mail/campos existentes, busca plano no repository e
   exige plano ativo com preço > 0. Plano ausente: 404; inelegível: 400.
3. Validar repetição de operação. Proposta: chave idempotente persistida,
   escopada ao ator/operação, com vínculo ao payload normalizado. Repetição
   igual recupera o resultado original; mesma chave com outro payload: 409.
   Cliente guarda chave enquanto repete um mesmo envio. Nome/campo/header,
   prazo e SQL desse mecanismo precisam de SA-P07; se header novo, atualizar
   allowedHeaders do CORS em app.ts antes da integração.
4. Na mesma transação, gerar UUID de empresa, criar vínculo do plano na empresa
   e registrar venda inicial com UUID, company_id, plan_id, origem company_creation,
   autor e snapshot do plano/valor/período/moeda. Snapshot vem do banco,
   nunca do preço oculto do formulário. Proteger também com unicidade da
   venda inicial por empresa, além da chave de operação.
5. Falha de qualquer gravação desfaz empresa/vínculo/venda. Não montar isso
   como três INSERT independentes nem chamar o endpoint HTTP de vendas.
6. Commit confirma o resultado. Só depois emitir log sanitizado de sucesso e
   responder 201. Uma repetição não gera segunda empresa/venda.
7. Primeiro admin empresarial pode ser convidado pelo fluxo separado de equipe
   após criação. Falha de e-mail não desfaz venda nem induz recadastro;
   persistir convite e permitir reenvio. Não introduzir outbox de produção
   ou conta administrativa automática sem decisão de onboarding adicional.

PostgreSQL: escopo de transação precisa compartilhar uma conexão/contexto
entre gravações de domínio; não tratar db.query independentes como transação.
JSON: uma mutação sob o bloqueio existente valida e grava todo o snapshot,
incluindo empresa/plano/venda/idempotência. Falha preserva arquivo anterior.
Simular JSON não comprova atomicidade PostgreSQL.

Código: platform.company.controller.ts → company.onboarding.service.ts →
contrato company.onboarding.repository.ts e implementação transacional;
plan.service.ts/sale.service.ts fornecem regras reaproveitáveis sem depender
de Express. Forma exata da coordenação precisa de SA-P07.

## 5. Consulta, edição, suspensão e arquivamento

1. Buscar empresa persistida pelo UUID em projeção administrativa, incluindo
   estado/vínculo/histórico permitido. Inexistente: 404, sem fallback fictício.
2. Edição aplica lista explícita de campos. Em mudança de plano, buscar novo
   plano ativo e positivo; salvar só vínculo e dados aprovados. Vendas antigas
   mantêm snapshot. Mudanças em preço do catálogo não reescrevem o histórico.
3. Formulário sempre exibe a observação confirmada sobre venda manual; ao
   salvar a troca, oferecer navegação para nova venda com empresa/plano
   pré-selecionados. Nada é lançado apenas por abrir essa tela.
4. Suspensão altera estado administrativo persistido. Auth verifica empresa
   a cada acesso de admin/atendente, impedindo uso de tokens anteriores.
   Preservar status individual de funcionários: não reativá-los em lote.
5. Todas as consultas públicas de empresa, filtros, busca e detalhe precisam
   aplicar elegibilidade, assim como a rota de URL da capa e upload.
   URL assinada já emitida pode durar até expirar; não prometer revogação
   instantânea de arquivo já baixado. Não excluir imagens por suspensão.
6. DELETE arquiva por marcador persistido, sem apagar vendas/equipe/imagens.
   Arquivada não é candidata a venda nova, convite ou troca de plano. Proposta
   de repetir arquivamento sem efeito adicional deve ser aprovada em SA-P07.
7. Preservar unicidade de e-mail/CNPJ de arquivados até haver política
   explícita de reutilização; não criar índice parcial silenciosamente.

Proposta de schema: companies.plan_id FK plans + estado administrativo
separado do status/is_verified existente, deleted_at e dados de alteração
necessários. Nomes/valores finais e restauração dependem de SA-P02/SA-P07.
Soft delete não é estado de pagamento nem informação de verificação.

Código: company.service.ts, CompanyRepository/adapters, auth/user service,
storage.service.ts e consultas públicas; DTOs público/administrativo distintos.

## 6. Equipe empresarial e usuários globais

1. Buscar empresa; recusar estado indisponível conforme política aprovada.
   Para edição de usuário, buscar usuário e comparar company_id persistido
   ao companyId da URL antes de alterar. Negar superadmin nesse endpoint.
2. Convite exige e-mail válido, role admin_empresa/atendente e empresa real;
   e-mail é único globalmente. Reutilizar verificações de convite pendente,
   primeiro acesso, purpose, prazo e reenvio; não promover conta existente.
3. Listagem/detalhe retornam id, nome, e-mail, papel, estado e companyId,
   nunca hash, reset/invite token. Formulários não escrevem JWT ou senha.
4. Alterações de dados/papel empresarial só após SA-P03 definir campos e
   transições. Não transferir funcionário entre empresas implicitamente.
5. Suspensão individual impede novas chamadas autenticadas. Remoção ou
   transferência de futuras atribuições não é implementada sem definição.
6. Gestão global busca apenas role super_admin e company_id nulo, em service
   separado. Confirmar SA-P05 antes de convite/bloqueio sensíveis; não permitir
   que um endpoint genérico altere qualquer role para super_admin.
7. Antes de alterar acesso, revalidar ator e aplicar proteção de último
   administrador/autoalteração que for aprovada, inclusive sob concorrência.
   Sem decisão, ação fica bloqueada, não implicitamente liberada.

Código: company.user.service.ts + admin/auth service e repositories de users;
platform.user.service.ts para escopo global. Não publicar admin.routes legado
com middleware comentado. Dashboard não oferece impersonação/conversas.

## 7. Planos e vendas manuais

Plano comercial: buscar inclusive inativos no administrativo; validar nome,
slug único, descrição, preço decimal positivo, período permitido e campos
descritivos existentes. Desativar impede novo uso, sem remover referências.
Não permitir que frontend faça concessão de capacidades com features/limits.
Não modificar seed Inicial gratuito com preço inventado; definir SA-P01
antes da migration/seed versionado. Banco vazio não requer backfill real.

Venda manual: validar superadmin, empresa elegível, plano e campos SA-P04;
copiar snapshot e BRL. Gerar ID/datas no backend e deduplicar tentativas
conforme SA-P07. Cadastro manual não muda plano da empresa automaticamente.
Troca de plano e registro manual são operações explícitas distintas nesta
fase. Aceitar diferença entre plano atual e histórico é natural após troca;
regras de seleção de plano histórico em venda manual aguardam SA-P04.

Proposta de tabela sales: id UUID, company_id FK, plan_id FK, origin,
plan_name/plan_price/plan_billing_period snapshots, amount NUMERIC,
currency BRL, created_by FK users, created_at e motivo para venda manual;
identificador de operação para repetição segura. Constraints de valor > 0,
origem conhecida e venda inicial única; referências sem cascata destrutiva.
Formato final e preço manual exigem aprovação. Interface SaleRow espelha SQL;
DTO usa montante decimal string e timestamps ISO, não float JS ou Date cru.

Listar vendas com filtros validados e ordenação estável; totais, se aprovados,
representam valor comercial registrado por BRL, nunca receita recebida.
Não expor edição/cancelamento/estorno até definir política SA-P04.

Código: plan.service/adapters + platform.plan.controller; sale.service,
sale.controller, SaleRepository e adapters; migrations versionadas próprias.

## 8. Telas e integração

Proposta de navegação: /super-admin, /super-admin/companies,
/super-admin/companies/new, /super-admin/companies/:companyId,
/super-admin/companies/:companyId/edit, /super-admin/companies/:companyId/users,
/super-admin/plans, /super-admin/sales, /super-admin/sales/new e
/super-admin/administrators. Detalhes de planos/vendas podem ser páginas ou
painéis; URLs e DTOs devem ser aprovados sem depender de estado invisível.

Formulários buscam dados/planos reais e distinguem carregamento, vazio, erro,
403 e conflito. Reenvio após falha preserva contexto/chave, sem duplicar vendas.
Confirmar suspensão/arquivamento com nome da empresa e efeito visível; botões
não representam API ainda não implementada. Tabelas e diálogos suportam
teclado, rótulos, foco, confirmação e mensagem de resultado acessível.

platform.api.ts extrai data via contrato comum e valida respostas; não criar
fetch paralelo que exponha envelope às telas. Não duplicar cache global,
estado de sessão ou bibliotecas. Cancelar/ignorar respostas antigas ao trocar
companyId e limpar dados ao perder acesso. Componentes SuperAdminLayout e
pages/super-admin usam UI existente; não redesenhar o site institucional.

## 8.1. Layout raiz, temas e configurações do próprio perfil

Confirmação de 2026-11-02: criar sidebar/header compartilhados e configurações
de perfil com edição de nome/e-mail. Senha fica em backlog. A especificação
visual está em [design frontend](../../../../frontend/.specs/features/super-admin-dashboard/design.md).
Layout raiz significa SuperAdminLayout com Outlet em rotas aninhadas, não
substituição da raiz pública do React. Sidebar/header ficam em
frontend/src/components/layout/{SuperAdminLayout,SuperAdminSidebar,SuperAdminHeader}.tsx.

Fluxo de perfil:

1. Ler identidade do próprio usuário por profile já autenticado e preencher
   ProfileSettings.tsx/ProfileForm.tsx. Nunca selecionar o usuário pelo ID
   fornecido no formulário nem reutilizar administração global irrestrita.
2. Proposta de gravação: PUT /api/v1/users/profile, protegido por auth e pelo
   escopo aprovado da área. Handler independente em user.controller.ts chama
   updateOwnProfile em user.service.ts. Contrato final depende de SA-P07.
3. Service busca novamente usuário pelo ator autenticado, valida estado,
   nome/e-mail e aceita somente esses campos. Excluir role/company_id/status
   e credenciais do DTO; não promover ou transferir vínculo por mass assignment.
4. Repository de users consulta unicidade de e-mail sem caixa e atualiza os
   campos atomicamente com constraints do banco; duplicidade retorna 409.
   Estender contrato/adapters JSON/PostgreSQL e DTO de perfil em
   backend/src/dtos/user.profile.dto.ts, se aprovado. Não criar tabela de perfil.
5. Responder com projeção sanitizada persistida; frontend atualiza header e
   formulário pelo resultado. Não indicar sucesso antes da gravação.
6. JWT atual carrega e-mail e middleware compara ao registro vigente.
   **Aguardando resposta — SA-P07:** definir se a edição de e-mail exige novo
   login após sucesso ou renovação explícita do token; se há confirmação de
   titularidade do novo endereço. Não emitir refresh/cookies ou afirmar
   e-mail verificado por inferência. Testar o comportamento aprovado.

Não alterar senha, avatar ou configurações globais nesta extensão. A decisão
de persistir tema entre visitas permanece pendente no design, sem API/coluna
de preferência antecipada. Conferir UI/API do próprio perfil, e-mail duplicado,
tentativa de alterar outro usuário e integridade da sessão nos dois temas.

## 9. Critérios de verificação

- E2E real isolado: superadmin login → empresa com plano → uma venda → equipe
  → edição/troca sem venda automática → venda manual → suspensão/soft delete.
- Negativas: sem token, admin, atendente, cliente, usuário suspenso, token
  com papel/vínculo alterado e tentativa direta por URL/API administrativa.
- Integridade: empresa A/B; e-mails por caixa; CNPJ duplicado; plano inativo
  ou zero; tentativa concorrente; falha parcial de SQL; repetição de envio;
  histórico após mudar nome/preço/plano e arquivar empresa.
- Público: suspensa/arquivada some em todas as consultas e capa; empresa
  ativa continua funcional. URL pré-emitida tem limite de revogação conhecido.
- Contratos: 201/200/204 e erro status/message; nenhum segredo/conversa
  em payload/log. Sem afirmar recebimento de pagamento.
- Executar scripts existentes pertinentes após consultar package.json;
  fixtures de PostgreSQL e R2 somente em ambiente autorizado e isolado.
  Nesta tarefa documental não executar nem criar testes executáveis.

## 10. Revisão obrigatória

**Não commitar sem revisão do grupo.** Conferir decisões, diff, SQL,
contratos/permissões, acessibilidade e evidências; registrar revisor e resultado
no task.md. Propostas de commit não autorizam commit automático. Pendência
de negócio mantém tarefa afetada aberta. Aplicação de SQL, instalação de
pacotes e publicação de endpoints exigem a autorização pertinente.
