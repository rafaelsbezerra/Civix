# Arquitetura atual

## Estrutura

| Camada | Implementação observada |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind 4, componentes shadcn/Base UI, Lenis |
| Backend | Node, TypeScript, Express 5, Helmet, CORS, compression, cookie-parser, JWT, bcrypt |
| Persistência utilizada | Pool de `@neondatabase/serverless` e SQL parametrizado |
| ORM configurado | Prisma com generator e datasource, sem modelos no schema |
| E-mail utilizado | Resend em `mail.service.ts` |
| Testes versionados | Vitest/Testing Library e script de navegador para Sobre |

Fontes: [frontend/package.json](../frontend/package.json),
[backend/package.json](../backend/package.json),
[server.ts](../backend/src/server.ts) e
[data.ts](../backend/src/config/data.ts).
Next.js, Auth0 e uso operacional de Prisma descritos no Notion não são
comportamentos demonstrados pela implementação atual.

## Backend

O servidor monta routers de usuários, primeiro acesso, empresas e planos.
Usuários concentram login e recuperação de senha no controller;
primeiro acesso possui controller próprio. Na baseline inicial, empresas executavam handlers diretamente nas rotas.
Após a extração, usam controller com funções independentes e SQL no service. Planos usam
rota → controller → service, com mapeamento explícito do DTO.
Não há arquitetura modular uniforme nem camada compartilhada de validação,
erros, autorização, DTOs ou paginação.

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
adicionam `users.plan_id` somente se `users` já existir. Não criam `users`,
`"user"` ou `empresas`. Um banco vazio não é reconstruído por esse histórico.

| Entidade | Expectativa do código | Divergência documental |
| --- | --- | --- |
| `users` | id, name, email, role, password_hash, reset_password_token, reset_password_expires, plan_id | Notion usa USERS com nome, empresa_id, is_active e quatro papéis |
| `"user"` | email, role, status, invite_token, password_hash | Convites/ativação usam tabela diferente do login |
| `empresas` | categoria, cnpj, descricao_detalhada, verificado, tamanho, status e contatos | Notion usa segmento_id, plano_id, slug, media_preco, welcome_message e is_active |
| `plans` | BIGSERIAL, slug, price, billing_period, features/limits JSONB, flags e ordem | Notion usa UUID e separa preço único e mensalidade |

Fontes: [company.service](../backend/src/services/company.service.ts),
[plan.service](../backend/src/services/plan.service.ts),
[controllers](../backend/src/controller/userController.ts) e
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

Catálogo, perfil e planos usam `fetch` por [lib/api](../frontend/src/lib/api.ts).
Login e recuperação usam instâncias Axios nas páginas; primeiro acesso
usa URLs localhost fixas. O token de login fica em localStorage.
Tipos são duplicados entre frontend e backend, sem contrato gerado ou
validação de resposta em runtime. O catálogo escolhe um filtro por
precedência, em vez de combinar os filtros.

## Reorganização de empresas implementada

O catálogo mantém `/api/v1/empresas` e seus sete endpoints.
[company.routes](../backend/src/routes/company.routes.ts) registra handlers;
[company.controller](../backend/src/controller/company.controller.ts) valida
entradas e define status/JSON; o service mantém consultas parametrizadas e
resultados legados. O servidor mudou apenas o import/nome do router.

[Company](../backend/src/entities/company.entity.ts) descreve os campos existentes
sem novas invariantes: os nomes portugueses e snake_case são preservados
para compatibilidade com as linhas SQL e respostas atuais.
[CompanyListResult/CompanyDetailResult](../backend/src/dtos/company.response.dto.ts)
são resultados legados, sem adoção dos contratos compartilhados novos.
O service usa diretamente o Pool Neon com `db.query<Company>`. Os testes
simulam `db.query`; não há interface CompanyQuery ou factory de controller.
O controller importa o service diretamente e exporta handlers independentes.
O SQL permanece no service enquanto a decisão de repositório aguarda resposta.

Exemplo de fluxo: GET `/api/v1/empresas/categoria/Obras` → controller
valida categoria não vazia → service consulta por LOWER com parâmetro →
controller retorna o envelope legado. Frontend e demais módulos intactos.
A próxima etapa adotará os contratos novos com os consumidores.

Verificação: quatro testes HTTP com Express e consulta falsa cobrem os sete
endpoints, mensagens/status, vazios, ausência, parâmetros e falhas SQL.
Nenhum teste conecta ao banco remoto.
