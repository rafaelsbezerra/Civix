# SDD — telas e backend do superadmin

Data: 2026-11-02. Complementa a [spec](spec.md) e orienta [tarefas](task.md).
G0 a G4 e equivalentes frontend concluídos; checklists/evidências distinguem
o que foi verificado. G5 a G8 e equivalentes frontend autorizados em 2026-11-02,
com novas decisões técnicas pendentes registradas no fim deste documento. Configurações globais continuam fora do escopo.
Caminhos são relativos à raiz do repositório. Escolhas novas de contrato,
schema e mecanismo transacional foram aprovados no escopo de G0–G4 pela
revisão e autorização de implementação do usuário. Detalhes abaixo registram
as escolhas concretas desta rodada, sem implementar grupos posteriores. A organização nos módulos existentes e nas pastas frontend foi
confirmada em SA-D13/14; não está pendente nem autoriza arquivos separados
para os casos de usuários ou cadastro coordenado.
Os casos de negócio confirmados estão na tabela SA-D da spec, incluindo as
decisões posteriores de reuso de arquivos e vendas imutáveis.

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
| Empresas e cadastro com venda | Alterar backend/src/controller/company.controller.ts, backend/src/services/company.service.ts, backend/src/dtos/company.create.dto.ts, backend/src/repositories/company.repository.ts e backend/src/persistence/{json,postgres}/company.repository.ts. A coordenação e a gravação conjunta fazem parte de company, sem módulo/arquivos separados de onboarding. |
| Usuários da empresa | Estender backend/src/controller/user.controller.ts, backend/src/services/user.service.ts, backend/src/dtos/user.auth.dto.ts, backend/src/repositories/user.repository.ts e backend/src/persistence/{json,postgres}/user.repository.ts. Reutilizar admin.service.ts/auth.service.ts nos convites, sem novos controller/service/repository por perfil. |
| Planos | Estender backend/src/controller/plan.controller.ts, backend/src/services/plan.service.ts, backend/src/entities/plan.entity.ts, backend/src/repositories/plan.repository.ts e backend/src/persistence/{json,postgres}/plan.repository.ts. |
| Vendas | Criar backend/src/entities/sale.entity.ts, backend/src/interfaces/sale.row.ts, backend/src/dtos/sale.dto.ts, backend/src/repositories/sale.repository.ts, backend/src/services/sale.service.ts, backend/src/controller/sale.controller.ts e backend/src/persistence/{sale.repository.ts,json/sale.repository.ts,postgres/sale.repository.ts}. |
| Superadmins | Usar os mesmos user.controller.ts, user.service.ts, user.auth.dto.ts e UserRepository/adapters existentes, com funções nomeadas pelo escopo global. Não criar módulo/arquivos de superadmin ou tabela paralela de identidade. |
| Schema e modo local | Alterar backend/src/persistence/json/local.data.ts e tipos de Company/User; criar migrations incrementais sob backend/prisma/migrations/<timestamp>_<change>/migration.sql após aprovação. |
| Shell frontend | Alterar frontend/src/routes/AppRoute.tsx e frontend/src/pages/login.tsx; criar frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx e frontend/src/pages/dashboard-super-admin/*.tsx. |
| Consumo e formulários | Estender frontend/src/lib/api.ts, sem outro arquivo de transporte/API; criar componentes exclusivos em frontend/src/components/dashboard-super-admin/* e reutilizar frontend/src/components/auth/ProtectedRoute.tsx. |

Configurações globais e billing não ganham arquivos de implementação antes
da definição. Os nomes acima indicam onde colocar código, não autorizam
criar abstrações vazias ou todos os arquivos de uma vez.

### Nomenclatura e reuso confirmados

Funções usam camelCase, com ação e escopo claros: getUsersByCompanyId,
getUserByCompanyId(userId, companyId), findActiveUserByCompanyId(userId,
companyId), inviteCompanyUser, updateCompanyUser e suspendCompanyUser.
Para plataforma, usar getSuperAdmins, inviteSuperAdmin, updateSuperAdmin e
suspendSuperAdmin nos mesmos arquivos de user, conforme permissões aprovadas.
Os nomes são sugestões, não métodos já existentes. Singular retorna usuário
específico; plural lista usuários. Não confiar apenas no nome: validar ator,
papel e vínculo em cada operação. Shared files não significam acesso genérico.

No frontend, Users.tsx e UserForm.tsx podem atender contextos empresarial e
global com campos/ações autorizados, sem duplicar formulários por papel.
Componentes realmente reutilizáveis por outros dashboards (busca, botões,
campos e tabelas genéricas) seguem frontend/src/components/ui ou a pasta
compartilhada já adotada; não criar uma nova pasta shared por antecipação.
Sidebar/header/layout exclusivos ficam em components/dashboard-super-admin/layout.

## 2. Rotas e contratos propostos

Prefixo administrativo proposto: /api/v1/platform; todas as operações abaixo
exigem Bearer e super_admin vigente, inclusive GET. G0 a G4 já estão montados;
as novas rotas de G5 a G7 aguardam esta implementação.
SA-P07 precisa aprovar contratos; usar PUT nas propostas para não introduzir
PATCH silenciosamente, que o CORS atual não permite.

| Método/caminho após o prefixo | Caso e entrada | Saída proposta |
| --- | --- | --- |
| GET /companies | Filtros por termo, estado, plano; página/limite validados | 200 data de empresas administrativas e meta de paginação aprovada |
| POST /companies | Dados empresariais permitidos + planId; identificador de operação idempotente | 201 data contendo company e sale |
| GET /companies/:companyId | UUID | 200 data de empresa/plano/estado; sem conteúdo de conversas |
| PUT /companies/:companyId | Campos editáveis e planId, conforme DTO | 200 empresa atualizada; nenhuma venda automática na edição |
| POST /companies/:companyId/suspension | Motivo obrigatório, não vazio | 200 estado atualizado; motivo persistido |
| POST /companies/:companyId/reactivation | Empresa desativada e transição permitida | 200 empresa reativada e novamente elegível a catálogo/acesso |
| POST /companies/:companyId/restoration | Empresa arquivada por soft delete | 200 empresa restaurada ainda desativada; exige reativação explícita |
| DELETE /companies/:companyId | UUID | 204 após soft delete; nunca exclusão física |
| GET /companies/:companyId/users | Empresa e filtros de papel/estado | 200 equipe daquela empresa |
| POST /companies/:companyId/users/invitations | email e role empresarial permitido | 201 estado do convite; nunca senha/token bruto |
| PUT /companies/:companyId/users/:userId | Somente campos aprovados | 200 projeção pública do funcionário |
| POST /companies/:companyId/users/:userId/suspension | Usuário do contexto e motivo obrigatório | 200 estado do acesso; motivo persistido |
| GET /plans e GET /plans/:planId | Incluem inativos no administrativo | 200 projeção de plano |
| POST /plans e PUT /plans/:planId | Campos comerciais validados | 201/200 plano |
| POST /plans/:planId/activation | active boolean | 200 plano; sem alterar vendas antigas |
| GET /sales e GET /sales/:saleId | Filtros de empresa/plano/origem/data, paginação | 200 vendas comerciais; valor decimal string + currency BRL |
| POST /sales | companyId, modo de preço e data UTC; modo plano atual usa preço do banco, modo valor manual exige amount e descrição/motivo | 201 venda registrada; repetição segura |
| DELETE /sales/:saleId | UUID de uma venda existente; superadmin vigente | 204 após exclusão definitiva; não altera empresa/plano nem relança venda |
| GET /administrators | Superadmins e estados, sem campos secretos | 200 lista administrativa |
| POST /administrators/invitations e PUT /administrators/:userId | Convite para definir senha e campos permitidos; mesmos poderes | 201 convite preparado / 200 dados atualizados, sem senha/token na resposta |
| POST /administrators/:userId/suspension | Motivo obrigatório; alvo distinto do ator e proteção do último ativo | 200 após desativação; recusar violações mesmo com motivo |
| POST /administrators/:userId/reactivation | Outro superadmin ativo como ator | 200 conta reativada; sem elevar permissões além do papel existente |
| DELETE /companies/:companyId/users/:userId | Atendente do contexto, finalizar atendimentos atribuídos | 204 após exclusão lógica em users.deleted_at, preservando referências |

Não criar edição de vendas, DELETE físico de plano, APIs de pagamento, endpoints
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
   ou conta administrativa automática sem decisão adicional de cadastro.

Se o plano usado nesse cadastro estiver errado, corrigir o plano em company,
excluir definitivamente a venda automática e lançar nova venda manual. Não
editar snapshot da venda original e não disparar outra venda automática pela
edição da empresa. Excluir a venda não pode apagar a empresa. Repetir a
requisição original de cadastro não pode ressuscitar a venda excluída; o
mecanismo aprovado em SA-P07 precisa manter a identidade da operação de
cadastro independente da existência posterior do registro de venda.

PostgreSQL: escopo de transação precisa compartilhar uma conexão/contexto
entre gravações de domínio; não tratar db.query independentes como transação.
JSON: uma mutação sob o bloqueio existente valida e grava todo o snapshot,
incluindo empresa/plano/venda/idempotência. Falha preserva arquivo anterior.
Simular JSON não comprova atomicidade PostgreSQL.

Código: company.controller.ts → company.service.ts → CompanyRepository e
adapters existentes de company. O service coordena plano e venda; o contrato
pode receber um método de domínio como createCompanyWithInitialSale, com
gravação conjunta na implementação de company e sem novo repository de
onboarding. PlanService/SaleService fornecem regras reaproveitáveis, sem
Express. A API de domínio/transação permanece sujeita a SA-P07, dentro desses
arquivos; não criar arquivos novos para a coordenação.

## 5. Consulta, edição, suspensão e arquivamento

1. Buscar empresa persistida pelo UUID em projeção administrativa, incluindo
   estado/vínculo/histórico permitido. Inexistente: 404, sem fallback fictício.
2. Edição aplica lista explícita de campos. Em mudança de plano, buscar novo
   plano ativo e positivo; salvar só vínculo e dados aprovados. Vendas antigas
   mantêm snapshot. Mudanças em preço do catálogo não reescrevem o histórico.
3. Formulário sempre exibe a observação confirmada sobre venda manual; ao
   salvar a troca, oferecer navegação para nova venda com empresa/plano
   pré-selecionados. Nada é lançado apenas por abrir essa tela.
4. Desativação/suspensão exige motivo textual não vazio após remover espaços
   nas extremidades; recusar 400 sem motivo, antes de qualquer alteração.
   Salvar motivo e estado juntos, com identificação do ator/data na projeção
   administrativa conforme campos aprovados em SA-P07. Invalidar os convites
   vigentes dos usuários da empresa; retomada não recupera token anterior.
   Auth verifica empresa
   a cada acesso de admin/atendente, impedindo uso de tokens anteriores.
   Preservar status individual de funcionários: não reativá-los em lote.
5. Todas as consultas públicas de empresa, filtros, busca e detalhe precisam
   aplicar elegibilidade, assim como a rota de URL da capa e upload.
   URL assinada já emitida pode durar até expirar; não prometer revogação
   instantânea de arquivo já baixado. Não excluir imagens por suspensão.
6. DELETE arquiva por marcador persistido, sem apagar vendas/equipe/imagens,
   reutilizando o motivo de desativação conforme SA-D34.
   Arquivada não é candidata a venda nova, convite ou troca de plano. Proposta
   de repetir arquivamento sem efeito adicional deve ser aprovada em SA-P07.
7. Reativação e restauração são permitidas. Implementá-las em company.service.ts
   e CompanyRepository existentes, por exemplo reactivateCompany e restoreCompany.
   Validar ator, existência e estado de origem; não reativar usuários que
   estavam bloqueados individualmente nem recriar venda. Restaurar remove o
   arquivamento, mas mantém desativação: sem login, catálogo ou capa pública.
   Somente reativação explícita recupera elegibilidade. Convites antigos
   continuam inválidos; novo convite/reenvio deve gerar token novo.
8. Preservar unicidade de e-mail/CNPJ de arquivados até haver política
   explícita de reutilização; não criar índice parcial silenciosamente.

Proposta de schema: companies.plan_id FK plans + estado administrativo
usando status existente (ativo/inativo, com verificado legado aceito como ativo),
deleted_at e dados de alteração
necessários, incluindo motivo da desativação. Nomes/valores finais dependem
de SA-P07; restauração para estado desativado e reativação explícita estão confirmadas.
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
4. Permitir alterar role entre admin_empresa e atendente no mesmo vínculo.
   Não transferir funcionário entre empresas ou promover superadmin. Campos
   de dados seguem DTO estrito, conforme desenho SA-P07. A mudança de papel
   invalida claims divergentes nas chamadas seguintes.
5. Desativação individual exige motivo textual não vazio e persistido na
   mesma gravação do estado. Isso vale para todos os papéis gerenciados,
   incluindo superadmin. Sem motivo, retornar 400 sem mudar acesso.
   Suspensão individual impede novas chamadas autenticadas. Atendentes podem
   ser desativados ou excluídos; seus atendimentos atribuídos devem ser
   finalizados, sem transferência automática para outro funcionário.
   Quando esse domínio existir, integrar ao módulo responsável pela finalização,
   sem manipular tabelas desconhecidas ou criar o módulo completo de atendimento
   por antecipação. Não deixar atendimentos abertos após sucesso dessa operação.
   Preservar referências com soft delete em users.deleted_at, conforme SA-D29/30.
6. Gestão global busca apenas role super_admin e company_id nulo, em funções
   específicas do user.service.ts existente. Superadmins ativos podem criar
   outros por convite para definir a senha e desativá-los com motivo. Adaptar
   validação do convite global nos arquivos de user/auth existentes, com
   company_id nulo, token individual e consumo único. Não promover conta já
   existente por um endpoint genérico nem enviar senha pronta.
7. Para desativar superadmin, buscar ator e alvo persistidos e validar os
   papéis/estados. Se alvo e ator forem a mesma conta, negar sem escrita.
   Verificar quantidade de superadmins ativos e impedir retirar o último.
   Contagem, revalidação e atualização devem ser consistentes sob concorrência,
   na transação/bloqueio aprovada em SA-P07. Não basta contar antes da transação.
   Duas tentativas simultâneas não podem deixar a plataforma sem conta ativa.
8. Reutilizar suspendSuperAdmin no user.service.ts e UserRepository/adapters;
   não criar serviço de superadmin. UI pode desabilitar ações, mas o backend
   deve recusar chamadas diretas inválidas. Proteções empresariais do último
   admin da empresa não se aplicam: o usuário permitiu desativar o último
   admin empresarial. Somente superadmins mantêm a proteção de último ativo.
9. Outro superadmin ativo pode reativar conta superadmin desativada. Todos
   compartilham os mesmos poderes; não implementar níveis ou editor individual
   de permissões. O início com uma conta não elimina criação/reativação futuras.

Código: user.controller.ts → funções com escopo em user.service.ts →
UserRepository/adapters existentes; reutilizar admin.service.ts/auth.service.ts
para convites e primeiro acesso. Não criar módulos separados por tipo de
usuário. Não publicar admin.routes legado com middleware comentado.
Dashboard não oferece impersonação/conversas.

## 7. Planos e vendas manuais

Plano comercial: buscar inclusive inativos no administrativo; validar nome,
slug único, descrição, preço decimal positivo, período permitido e campos
descritivos existentes. Desativar impede novo uso, sem remover referências.
Não permitir que frontend faça concessão de capacidades com features/limits.
Usar os planos demo com preço que o frontend já exibe como referência.
Não inventar catálogo nem exigir registros ativos no banco para desenvolver
os módulos. Testar contratos com fixtures e validar plano real apenas ao
executar cadastro/troca/venda. Cadastro/seed de planos é preparação de dados,
não uma pendência funcional bloqueante SA-P01.

Venda manual: validar superadmin e empresa elegível; selecionar explicitamente
o modo de preço. No modo plano, buscar o plano atual pelo vínculo persistido
da empresa e usar seu preço do banco, sem motivo obrigatório ou sobrescrita
de amount. Não confiar no planId do navegador como prova de plano atual.
No modo valor manual, validar montante decimal positivo em BRL e exigir
descrição/motivo não vazio; esse modo atende também o lançamento por plano
antigo, sem precisar alterar o plano atual da empresa.
Registrar modo/origem do preço e snapshot correspondente; modo manual não
deve copiar o nome/preço do plano atual como se tivesse sido a fonte do valor.
Proposta de contrato: pricingMode = company_plan ou manual_amount; campos
exatos seguem SA-P07. Vínculo/snapshot de plano pode ser opcional no modo
manual, conforme DDL aprovado, sem forçar plano antigo inexistente no catálogo.
Permitir data passada em UTC; separar data comercial da venda do instante
real de criação do registro. Gerar ID/created_at no backend e deduplicar
tentativas conforme SA-P07. Cadastro manual não muda plano da empresa.
Troca de plano e registro manual continuam operações explícitas distintas.

Vendas são imutáveis enquanto existirem. Não oferecer UPDATE/PUT/PATCH para
trocar plano, valor, data, empresa ou autor da venda. Correções são exclusão
definitiva e novo POST manual, em ações explícitas; não apresentar como
estorno, cancelamento financeiro ou pagamento.

Fluxo de exclusão em sale.controller.ts → sale.service.ts → SaleRepository:
validar superadmin vigente e UUID, buscar venda, retornar 404 se inexistente,
excluir definitivamente apenas sales pelo ID e responder 204 após confirmação.
Usar um método de domínio como deleteSaleById; não aplicar soft delete, não
apagar plano/empresa e não criar venda automaticamente. UI confirma a exclusão
definitiva e oferece o formulário de novo lançamento. Novo lançamento repete
as validações da empresa e do modo de preço escolhido; somente o modo plano
exige o plano atual como origem do preço. Excluir não dispensa essas verificações.

Proposta de tabela sales: id UUID, company_id FK, plan_id FK nullable no modo
manual, origin,
plan_name/plan_price/plan_billing_period snapshots, amount NUMERIC,
currency BRL, created_by FK users, created_at, data comercial UTC e modo de
preço; descrição/motivo obrigatório somente no modo de valor manual;
identificador de operação para repetição segura. Constraints de valor > 0,
origem conhecida e venda inicial única; referências sem cascata destrutiva.
Formato final dos campos e vínculo opcional de plano no modo manual seguem SA-P07.
Interface SaleRow espelha SQL;
DTO usa montante decimal string e timestamps ISO, não float JS ou Date cru.

Listar vendas com filtros validados e ordenação estável; totais, se aprovados,
representam valor comercial registrado por BRL, nunca receita recebida.
Não expor edição de venda ou operações de cancelamento/estorno financeiro.
SA-P04 está resolvida: modo plano atual ou valor manual justificado,
retroatividade permitida e UTC. Ao arquivar empresa, preservar vendas que não
tenham sido excluídas explicitamente pelo superadmin.

Código: plan.controller.ts, plan.service.ts e adapters existentes; sale.service,
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

frontend/src/lib/api.ts reúne os métodos de empresas, usuários, planos e
vendas, extrai data via contrato comum e valida respostas. Não criar outro
arquivo de API ou fetch paralelo que exponha envelope às telas. Não duplicar cache global,
estado de sessão ou bibliotecas. Cancelar/ignorar respostas antigas ao trocar
companyId e limpar dados ao perder acesso. Componentes SuperAdminLayout e
pages/dashboard-super-admin usam UI existente; não redesenhar o site institucional.

Datas do sistema em UTC: timestamps ISO 8601 com Z na API, persistência de
instantes em UTC e filtros/entrada/exibição identificados como UTC. Formulários
não devem interpretar silenciosamente datetime-local no fuso do navegador.
Intervalos de relatório devem converter seus limites explicitamente para UTC;
regra de limites de intervalo é detalhe de contrato em SA-P07.

## 8.1. Layout raiz, temas e configurações do próprio perfil

Confirmação de 2026-11-02: criar sidebar/header compartilhados e configurações
de perfil com edição de nome/e-mail. Senha fica em backlog. A especificação
visual está em [design frontend](../../../../frontend/.specs/features/super-admin-dashboard/design.md).
Layout raiz é exclusivo do dashboard superadmin, compartilhado apenas entre
suas telas. Significa SuperAdminLayout com Outlet em rotas aninhadas, não
substituição da raiz pública do React. Sidebar/header ficam em
frontend/src/components/dashboard-super-admin/layout/{SuperAdminLayout,SuperAdminSidebar,SuperAdminHeader}.tsx.

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
   backend/src/dtos/user.auth.dto.ts existente. Não criar arquivo ou tabela de perfil.
5. Responder com projeção sanitizada persistida; frontend atualiza header e
   formulário pelo resultado. Não indicar sucesso antes da gravação.
6. JWT atual carrega e-mail e middleware compara ao registro vigente.
   Decisão aprovada: editar e-mail exige novo login após salvar, sem
   confirmação de titularidade do novo endereço nesta etapa. Não emitir refresh/cookies ou afirmar
   e-mail verificado por inferência. Testar o comportamento aprovado.

Não alterar senha, avatar ou configurações globais nesta extensão. A decisão
de persistir tema entre visitas foi aprovada: localStorage neste navegador, sem API/coluna
de preferência antecipada. Conferir UI/API do próprio perfil, e-mail duplicado,
tentativa de alterar outro usuário e integridade da sessão nos dois temas.

## 9. Critérios de verificação

- E2E real isolado: superadmin login → empresa com plano → uma venda → equipe
  → edição/troca sem venda automática → venda manual → suspensão/soft delete.
- Correção comercial: cadastro com plano errado → corrigir empresa → excluir
  venda automática definitivamente → novo lançamento manual. Confirmar ausência
  de edição de venda e que repetir cadastro não recria a venda excluída.
- Negativas: sem token, admin, atendente, cliente, usuário suspenso, token
  com papel/vínculo alterado e tentativa direta por URL/API administrativa.
- Desativações: motivo ausente/vazio/espaços recusado sem escrita; motivo
  válido persistido com o estado. Superadmin não desativa a própria conta
  nem o último ativo; testar concorrência, inclusive com só uma conta inicial.
- Empresa reativada/restaurada não gera venda nem reativa usuário bloqueado
  individualmente; restaurada permanece desativada e só volta ao catálogo após
  reativação explícita. Tokens de convite anteriores não voltam a funcionar.
- Venda por plano usa plano atual/preço do backend sem motivo obrigatório;
  valor manual exige motivo. Cobrir plano antigo, amount adulterado no modo
  plano, datas passadas UTC e snapshot imutável após mudar preço do catálogo.
- Usuários: troca de papel empresarial, último admin da empresa desativável,
  finalização de atendimentos atribuídos na desativação/exclusão de atendente;
  superadmin por convite/reativação e poderes iguais, mantendo suas proteções.
- Integridade: empresa A/B; e-mails por caixa; CNPJ duplicado; plano inativo
  ou zero; tentativa concorrente; falha parcial de SQL; repetição de envio;
  histórico após mudar nome/preço/plano e arquivar empresa.
- Público: suspensa/arquivada some em todas as consultas e capa; empresa
  ativa continua funcional. URL pré-emitida tem limite de revogação conhecido.
- Contratos: 201/200/204 e erro status/message; nenhum segredo/conversa
  em payload/log. Sem afirmar recebimento de pagamento.
- Executar scripts existentes pertinentes após consultar package.json;
  fixtures de PostgreSQL e R2 somente em ambiente autorizado e isolado.
  Na implementação G0 a G4, usar testes isolados e registrar limites no task.md.

## 10. Revisão obrigatória

**Não commitar sem revisão do grupo.** Conferir decisões, diff, SQL,
contratos/permissões, acessibilidade e evidências; registrar revisor e resultado
no task.md. Propostas de commit não autorizam commit automático. Pendência
de negócio mantém tarefa afetada aberta. Aplicação de SQL, instalação de
pacotes e publicação de endpoints exigem a autorização pertinente.

## Contratos adotados na implementação G0–G4

- Cadastro: operationId UUID no body, sem header novo; hash canônico dos campos
  validados, único por ator/operação. Mesmo payload retorna o mesmo company/sale;
  payload diferente retorna 409. Se a venda original não existir, não recriar.
- PostgreSQL: uma conexão e transação para plano bloqueado, empresa, venda e
  recibo de operação. JSON: uma atualização bloqueada do snapshot inteiro.
- Perfil: nome/e-mail do ator; mudança de e-mail salva e exige novo login,
  sem confirmação de endereço nesta etapa, conforme resposta do usuário.
- Tema: primeiro uso claro, preferência claro/escuro guardada neste navegador,
  conforme resposta do usuário. Tema exclusivo do dashboard.
- Listagem administrativa de planos sem paginação desnecessária nesta etapa;
  ordenação displayOrder/id. Paginação de empresas/vendas pertence a G5.
- Novo schema incrementa companies com plan_id/estado administrativo e cria
  sales e recibos de operação, sem executar migrations. Perfis/vínculos usam
  migration existente. Não criar endpoints de G5–G7 ou menus sem funcionalidade.

## Continuação autorizada — G5 a G8

Em 2026-11-02 o usuário autorizou G5 a G8 e equivalentes frontend na
branch feat/super-admin-dashboard. Revisar cada grupo antes de commitar;
não executar migrations automaticamente. As respostas às seis perguntas
estão consolidadas em SA-D29–36 na [spec](spec.md).

### Usuários: exclusão e schema autorizado

1. Buscar o atendente no vínculo empresarial correto e validar o ator.
2. Excluir logicamente usando users.deleted_at. Impedir autenticação e
   retirar o usuário da listagem normal, preservando imagens e referências.
3. Alterar a migration existente
   backend/prisma/migrations/20261025000100_create_users/migration.sql
   para acrescentar deleted_at e deactivation_reason TEXT, conforme SA-D37.
   Acrescentar também tokens_revoked_at TIMESTAMPTZ, aprovado na resolução
   de SA-P09. Não criar session_version ou campo de autor.
4. Alinhar User, UserRow, schema JSON e filtros dos repositories ao campo,
   durante a implementação; esta atualização documental não altera SQL/TS.
5. Reativar usuário empresarial pelo superadmin conforme SA-D33. Se ainda
   não há senha, preparar novo convite e não conceder sessão antecipada.

SA-P08 resolvida: persistir o motivo em users.deactivation_reason TEXT.
Ao desativar, exigir motivo não vazio e invalidar todas as sessões do usuário.
Reativar exige novo login; um token antigo não pode voltar a funcionar.
SA-P09 resolvida: usar tokens_revoked_at TIMESTAMPTZ e instante de emissão
com precisão de milissegundos no token. O middleware recusa token anterior
ao marcador; novo login emite instante posterior. Não basta limpar
o token no navegador ou apenas verificar status enquanto a conta está inativa.
Não substituir essas decisões por campos de recuperação/convite nem limpar
senhas por inferência.

O domínio de atendimento ainda não existe no backend. Não criar esse módulo
por antecipação nem afirmar que atendimentos inexistentes foram finalizados.
Quando disponível, a integração deverá respeitar os casos de G6.

### Empresas: motivo do arquivamento

Arquivar reutiliza o motivo de desativação e o campo existente
companies.deactivation_reason. Não criar um motivo separado de arquivamento.
Manter status inativo e deleted_at, preservando histórico, equipe e imagens.
Restaurar não reativa; a reativação continua uma ação explícita.

### Vendas manuais: usar sales, sem tabela de operações

Não criar manual_sale_operations ou outra tabela de recibos para vendas
manuais. A tabela sales existente já diferencia origin=manual de
origin=company_creation; pricing_mode distingue a fonte do preço.
A sugestão do usuário de usar um tipo na própria tabela não exige criar
outro discriminador redundante nem aprova campos adicionais por inferência.

Fluxo de repetição aprovado para POST manual:

1. Validar ator, entrada e contexto empresarial conforme o fluxo de vendas.
2. Consultar somente vendas ainda existentes ao verificar a operação.
3. Se a mesma operação/dados encontra uma venda existente, retornar essa
   venda; se a operação existente tem dados diferentes, retornar 409.
4. Se a venda anterior foi excluída, ela não participa da verificação de
   criação. Sua exclusão não bloqueia um novo lançamento manual. Não criar
   recibo de exclusão nem retornar conflito apenas pela venda removida.
5. Criar o novo registro somente após as demais validações. A ação não
   altera o plano da empresa nem representa cobrança ou pagamento.

Exemplo: registrar venda manual, excluí-la definitivamente e reenviar a
operação não é recusado apenas pela venda excluída. Uma venda manual ainda
existente continua sujeita à verificação de operação/dados descrita acima.
Usar fingerprint para comparar dados normalizados da requisição (SA-D39).
Ele verifica se os dados mudaram, mas sozinho não distingue uma tentativa
repetida de uma nova venda legítima com os mesmos dados.
SA-P10 resolvida: usar operation_id UUID junto de fingerprint TEXT na
própria sales. Buscar por ator/operação e comparar fingerprint para replay
ou 409. A exclusão física da venda remove também esses campos; não há
recibo de exclusão manual ou tabela nova.

Essa decisão não altera company_registration_operations nem a proteção
já implementada da venda inicial: repetir o cadastro da empresa não recria
uma venda inicial excluída. Os dois fluxos têm regras diferentes confirmadas.

### Paginação administrativa

Adotar page/limit, limite padrão 20, máximo 100, ordenação estável e
metadados. Aplicar a listas administrativas previstas em G5 a G7; preservar
os contratos públicos existentes e a consulta de planos adotada em G3.
Validar entradas antes da consulta e permitir navegação sem carregar toda
a plataforma para paginar apenas no navegador.

### Concorrência na gestão de superadmins

Usar transação e bloqueio comum aos fluxos de alteração administrativa.
Revalidar ator ativo, alvo, estado e quantidade de superadmins ativos dentro
da mesma transação antes da escrita. Manter a proibição de desativar a
própria conta e o último ativo, inclusive em solicitações simultâneas.

O usuário sugeriu permist_write como possível solução para a proteção de
escrita. Registrar como sugestão, sem afirmar que essa API existe ou está
implementada no projeto. A base usa SQL/driver; não há autorização para
instalar ORM, alterar a persistência ou introduzir dependências por isso.

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
