# Arquitetura atual

## Estrutura

| Camada | Implementação observada |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind 4, componentes shadcn/Base UI, Lenis |
| Backend | Node, TypeScript, Express 5, Helmet, CORS, compression, cookie-parser, JWT, bcrypt |
| Persistência utilizada | USE_MOCK_DATA seleciona JSON persistido ou Pool Neon com SQL parametrizado |
| ORM configurado | Prisma com generator e datasource, sem modelos no schema |
| E-mail utilizado | Resend no modo real; outbox JSON no modo local |
| Testes versionados | Vitest/Testing Library e script de navegador para Sobre |

Fontes: [frontend/package.json](../frontend/package.json),
[backend/package.json](../backend/package.json),
[server.ts](../backend/src/server.ts) e
[data.ts](../backend/src/shared/config/data.ts).
Next.js, Auth0 e uso operacional de Prisma descritos no Notion não são
comportamentos demonstrados pela implementação atual.

## Configuração de dados

backend/src/shared/config/data.ts centraliza USE_MOCK_DATA, BACKEND_ROOT,
MOCK_DATA_DIR e db. O Pool real só é criado ao executar uma consulta; no modo
local, consultas PostgreSQL são bloqueadas. Seleção dos repositories permanece
em persistence, usando a flag exportada por data.ts. Não há módulo auxiliar
de configuração de persistência.

## Backend

O servidor monta routers de usuários, primeiro acesso, empresas e planos.
Usuários agora separam handlers HTTP e validação no controller de login,
recuperação e redefinição no user.service;
primeiro acesso possui controller próprio. Na baseline inicial, empresas executavam handlers diretamente nas rotas.
Após a extração, usam controller com funções independentes. Agora services usam adapters selecionados; SQL fica em persistence. Planos usam
rota → controller → service, com mapeamento explícito do DTO.
Erros e respostas usam a camada compartilhada em src/shared. Validação e
autorização ainda exigem alinhamento gradual; paginação está disponível
somente em helpers, com adoção apenas quando necessária, fora das pendências atuais.

| Domínio | Estado |
| --- | --- |
| Autenticação | Parcial: JWT de 1h, empresa com senha, cliente por e-mail |
| Convites | Controller/service e router existem; router admin não montado |
| Empresas/tenants | Catálogo de leitura; sem gestão e isolamento tenant demonstrados |
| Usuários/equipes | Sem CRUD completo, papéis internos ou gestão de vendedores |
| Planos | Listagem ativa e seleção por usuário empresa |
| Vendas/cobrança | Ausente; seleção de plano não processa pagamento |
| Leads/conversas/mensagens | Ausentes |
| IA/WhatsApp/handoff | Desenho n8n/WAHA no Notion; sem workflow ou integração versionada |
| Dashboards/métricas | Ausentes |

## Modelo de dados observado

[schema.prisma](../backend/prisma/schema.prisma) não declara entidades.
As migrations versionadas criam `plans` e atualizam suas descrições;
adicionam `users.plan_id` somente se `users` já existir. Não criam `users`
ou `empresas`. Um banco vazio não é reconstruído por esse histórico.

| Entidade | Expectativa do código | Divergência documental |
| --- | --- | --- |
| `users` | id, name, email, role, password_hash, reset_password_token, reset_password_expires, plan_id; convite/ativação também usam status e invite_token | Notion usa USERS com nome, empresa_id, is_active e quatro papéis; schema canônico completo pendente |
| `empresas` | categoria, cnpj, descricao_detalhada, verificado, tamanho, status e contatos | Notion usa segmento_id, plano_id, slug, media_preco, welcome_message e is_active |
| `plans` | BIGSERIAL, slug, price, billing_period, features/limits JSONB, flags e ordem | Notion usa UUID e separa preço único e mensalidade |

Fontes: [company.service](../backend/src/services/company.service.ts),
[plan.service](../backend/src/services/plan.service.ts),
[controllers](../backend/src/controller/user.controller.ts) e
[migration inicial](../backend/prisma/migrations/20260914210000_create_plans/migration.sql).
O banco real não foi inspecionado; tipos TypeScript não garantem que suas
colunas existam. O SQL do Notion tem erros de sintaxe e campos incompletos;
não é uma migration executável.

## Frontend

[AppRoute](../frontend/src/routes/AppRoute.tsx) registra `/`, `/login`,
`/catalogo`, `/empresa/:id`, `/primeiro-acesso`, `/primeiro-acesso/:token`,
`/esqueci-senha`, `/redefinir-senha`, `/termos-de-uso`,
`/politica-de-privacidade`, `/central-de-ajuda` e fallback `*`.
Sobre, Plans e FAQ têm arquivos, mas não estão registrados nesse router.
Não existe dashboard nem guard de área autenticada.

Catálogo, perfil, planos, recuperação, redefinição e primeiro acesso usam
fetch por [lib/api](../frontend/src/lib/api.ts), com origem central e prefixos
/api/v1 ou /api/auth por endpoint. O helper extrai data e apresenta message
dos erros públicos, valida a presença do envelope e preserva cancelamento.
Tipos de empresa usam os nomes snake_case efetivamente recebidos; não há
contrato gerado nem validação completa dos campos da resposta em runtime.
Login permanece Axios, intacto e incompatível com o envelope por exclusão
explícita do escopo. Seu token fica em localStorage. O catálogo escolhe um filtro por
precedência, em vez de combinar os filtros.

## Reorganização de empresas implementada

O catálogo mantém `/api/v1/empresas` e seus sete endpoints.
[company.routes](../backend/src/routes/company.routes.ts) registra handlers;
[company.controller](../backend/src/controller/company.controller.ts) valida
entradas e define status/JSON; o service mantém consultas parametrizadas e
dados do catálogo. A adoção HTTP envolve os dados em data e propaga falhas
SQL para o handler global, distinguindo ausência 404 de infraestrutura 500.

[Company](../backend/src/entities/company.entity.ts) descreve os campos existentes
sem novas invariantes: os nomes portugueses e snake_case são preservados
para compatibilidade com as linhas SQL e respostas atuais.
CompanyListResult/CompanyDetailResult foram removidos após a extração anterior;
o service agora retorna Company/Company[]
e os controllers aplicam os contratos compartilhados.
O service usa CompanyRepository pela seleção de persistência. O adapter real
usa Pool Neon com db.query<Company>; o local usa JSON. Testes simulam db.query
no modo real; não há CompanyQuery ou factory de controller.
O controller importa o service diretamente e exporta handlers independentes.
A etapa inicial criou somente interfaces; o modo local autorizou adapters.
SQL está na implementação PostgreSQL; a alternativa JSON persiste em disco.

Exemplo de fluxo: GET `/api/v1/empresas/categoria/Obras` → controller
valida categoria não vazia → service consulta por LOWER com parâmetro →
controller retorna { data }. Demais endpoints backend adotam o mesmo contrato.
Os consumidores existentes de catálogo/perfil foram adaptados nesta branch;
login continua pendente conforme api.md.

Verificação: quatro testes HTTP com Express e consulta falsa cobrem os sete
endpoints, mensagens/status, vazios, ausência, parâmetros e falhas SQL.
Nenhum teste conecta ao banco remoto.

## Contratos de persistência e usuários

Repositories reúne UserRepository, CompanyRepository, PlanRepository e
AuthRepository como interfaces. Implementações em persistence/json e
persistence/postgres usam domínio.repository.ts. Seletores na raiz de
persistence exportam repositories tipados; services os usam diretamente.
Plan/PlanRow foram extraídos sem alterar consultas ou mapeamento. Atribuição
de plano ao usuário pertence ao contrato UserRepository.

Usuários segue routes → controller → service com handlers independentes,
entity/DTO separados e acesso a UserRepository. Rotas/aliases e efeitos de
login/recuperação/reset são preservados. Auth/admin também separam controllers,
services e persistência. Na branch codex/json-postgres-repositories, todos
os fluxos usam users, incluindo convite e ativação; admin continua desmontado.
O JSON reúne esses usuários na mesma coleção, com status/invite_token opcionais.
A unificação não altera os protocolos de token nem cria schema/migrations.
Login bloqueia pending com 401 e preserva usuários atuais sem status.

## Adoção dos contratos compartilhados

app.ts exporta a aplicação sem listen; server.ts inicia a escuta. Express 5
encaminha rejeições para o handler global, registrado após routers e 404.
ErrorCode/AppError vivem em shared/errors; sucesso/serialização em
shared/contracts; configuração em shared/config. Tipos de auth foram
extraídos para DTO/interface; regras de convite/primeiro acesso permanecem.
A adoção HTTP está integrada em staging bedb73a. O modo local de 2026-10-12
antecipou uso de repositories nos módulos atuais, sem commit. Ver o
[guia de dados locais](dados-locais.md). Paginação permanece sob demanda.
Schema e baseline continuam pendentes; não há aplicação comprovada no banco.

## Integração dos consumidores existentes — 2026-10-12

A branch codex/frontend-backend-integration depende do PR #16 e tem destino
staging. Sem dashboard, páginas/rotas novas ou alteração de login. A
pré-validação de convite usa o mesmo JWT, perfil/status e invite_token da
ativação; o protocolo divergente de reenvio permanece pendente.
HTTP-04-B continua parcialmente completo. Ver [integração](frontend-backend.md).
