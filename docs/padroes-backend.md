# Base de padrões do backend

Esta etapa implementa uma base reutilizável; sua adoção nos módulos existentes
será uma etapa posterior. Não confundir contrato implementado com contrato
já retornado pelos endpoints atuais, documentados em [api.md](api.md).

## Contratos aprovados

- Sucesso: `{ data, meta? }`; criação 201; operação sem corpo 204.
- Paginação: `page`/`pageSize`, base 1, padrão 20, máximo 100; metadados
  `page`, `pageSize`, `total`, `totalPages`. Entrada inválida retorna 400.
- Lista vazia/página além do fim: sucesso com `data: []`.
- Erro em produção: `{ status, message }`; fora de produção: adicionar
  `code`, `details`, `requestId`, `stack`, sanitizando credenciais.

## Estrutura e persistência

Código em inglês, kebab-case e pastas por função. Cadeia
routes → controller → service; entidades/interfaces/DTOs em arquivos próprios.
Decisão atual: Prisma 7, banco novo e users. SQL nativo aprovado; campos/relacionamentos ainda dependem de confirmação.
Empresas será reorganizado por camadas e tipos preservando suas respostas
atuais. Outros módulos e frontend não adotam os contratos nesta etapa.

## Entrega

Commit documental antes da implementação. Tarefas em branches e worktrees;
dependências reunidas em branch de integração. PRs para `staging`, com o que,
como, por quê, verificações, próximos passos e SQL quando houver nova tabela.

Specs e decisões: [backend/.specs](../backend/.specs/README.md).
A baseline documental precedeu a implementação descrita abaixo.

## Implementação da base HTTP

Disponível em `backend/src/contracts/{error,response,pagination}.contract.ts`,
`backend/src/errors/app-error.ts` e `backend/src/middlewares/error-handler.ts`.
Esses arquivos não são importados pelo servidor atual.

- `createSuccessResponse` gera `{ data }` ou `{ data, meta }`.
- `sendSuccess`, `sendCreated`, `sendNoContent` usam 200, 201 e 204; 204 termina
  a resposta sem JSON.
- `parsePagination` aceita números inteiros positivos ou strings decimais
  positivas, retorna page/pageSize/offset e rejeita entradas inválidas com 400.
  Defaults: 1/20. Limite: 100. Rejeita offsets fora do inteiro seguro.
- `createPaginationMeta` recebe total já filtrado e validado; calcula totalPages.
  Total zero produz zero páginas. Não consulta banco nem ordena resultados.
- `AppError` separa falhas classificadas de exceções desconhecidas.
- `serializeError` retorna exatamente `{ status, message }` em produção.
  Exceções desconhecidas usam 500 e mensagem pública genérica. Fora de produção,
  inclui diagnóstico, stack (sintético para lançamentos que não são Error) e requestId quando fornecido.
  Campos sensíveis, credenciais em URLs e tokens Bearer são sanitizados;
  não executar getters durante a serialização.
- Handlers exportados para erro/404 respeitam headers já enviados e não estão
  registrados em `server.ts`.

Exemplo de paginação verificado nos testes:
`parsePagination({ page: '2', pageSize: '100' })` produz
`{ page: 2, pageSize: 100, offset: 100 }`.

Verificação: `npm run test:contracts` (14 testes) e
`npm run typecheck:contracts`, dentro de backend. A instalação usou o lockfile
existente, sem scripts de instalação ou atualização de dependências.
Não houve teste em banco ou alteração de contratos do frontend.

## Prisma e próximos passos

Decisão histórica anterior, substituída em 2026-10-10: aguardar Prisma 8 estável. O registry consultado nesta revisão
publicou CLI 8.0.0-rc.22 e runtime PostgreSQL 8.0.0-rc.17. Não instalar RC nem
alterar configuração/schema/migrations SQL enquanto aguarda. Não existe
monitoramento automático de release.

Na adoção posterior: conectar handlers no servidor, migrar envelopes/controllers
consumidores, implementar queries paginadas com filtros e ordenação estável,
adaptar frontend e definir schema canônico antes das migrations.

## Integração verificada

Branches das tarefas: `codex/backend-contracts` e `codex/companies-layers`.
Reunião: `codex/backend-foundation-integration`. Os PRs usam `staging` como
base. A branch de integração inclui também a baseline documental; os PRs
individuais compartilham essa base e servem para revisão por assunto.
Não foram feitos merges na staging remota.

Executar em backend: `npm run test:foundation` e
`npm run typecheck:foundation`. Integração: 18 testes passaram; typecheck dos
arquivos novos/empresas passou. Antes do alinhamento com Prisma 7, o typecheck completo falhava na
configuração Prisma incompatível; nenhuma aprovação global de build/lint é
alegada. Nenhuma migration aplicada e nenhuma tabela nova nesta entrega.

## Decisão atual de persistência — 2026-10-10

Prisma 7 substitui a escolha de Prisma 8. Migrations serão pensadas para um
banco novo PostgreSQL; `users` é o nome canônico. Já está aprovado o
formato SQL nativo; campos/relacionamentos continuam pendentes.
A decisão foi commitada antes da atualização de pacotes; o schema permanece sem models.
Os comandos migrations:apply/show/rollback são propostas para discussão
posterior, não comandos disponíveis neste momento.

## Política atual aprovada — Prisma 7

Migrations SQL gerenciadas pelo Prisma Migrate. Para reverter uma migration
concluída, criar uma nova inversa; para migration falha, inspecionar/recuperar
o banco e reconciliar o histórico. SQL executado diretamente não atualiza
o histórico; marcar rolled-back não reverte o banco sozinho.

PRs devem ter título/descrição/mensagens em português. Schema comercial
permanece pendente e os comandos apply/show/rollback serão definidos depois.

## Tooling Prisma 7 implementado

CLI/client/adapter fixados em 7.10.0, usando configuração existente e SQL
nativo. Três testes isolados validam cliente, SQL de criação/inversão e pins.
TypeScript completo passou após o alinhamento; os 18 testes da base passaram.
Nenhuma migration comercial foi criada ou executada. O ciclo em PostgreSQL,
o schema e comandos operacionais permanecem pendentes. Ver [operação](operacao.md)
para comandos, limitações e avisos da auditoria de dependências.
