# Contratos HTTP

Estado: base e adoção de erro/sucesso integradas em `staging`, referência
`bedb73a`, pelos PRs #13/#14. A integração posterior do frontend é parcial:
login foi explicitamente excluído; demais consumidores existentes adaptados.
Paginação será usada somente quando necessário, fora das pendências atuais.

## Problema inicial e escopo

As respostas misturavam message/error/success/data/plan/plans, e falhas SQL
podiam resultar em 200 ou 404. A adoção padroniza os endpoints existentes,
sem redesenhar autenticação, permissões, schema ou regras comerciais.

Fontes atuais: `src/app.ts`, `src/controller/*.controller.ts`,
`src/middlewares/error.handler.ts` e `src/shared/contracts/*.contract.ts`.

## Requisitos

- ERR-01: Falhas esperadas usam AppError, código estável e status coerente.
- ERR-02: Produção expõe somente status/message; demais ambientes incluem
  stack e diagnóstico sanitizado, preservando a causa original.
- ERR-03: Enum ErrorCode distingue validação, autenticação, autorização,
  ausência, conflito e falha interna; rota desconhecida segue o contrato.
  Política abrangente de validação por campo e rastreabilidade é posterior.
- RES-01: Sucesso JSON usa data/meta; criação usa 201 e sem corpo usa 204.
- RES-02: Services retornam dados ou lançam erros; controllers fazem HTTP.
- PAG-01: Listagens escolhidas futuramente recebem limites validados e meta.
- PAG-02: Filtros precedem contagem/paginação; ordenação tem desempate por ID.
- PAG-03: Parâmetros inválidos retornam 400; vazio/além do fim usam data: [].

## Contratos confirmados

Sucesso `{ data, meta? }`. Produção: `{ status, message }`, com status HTTP
correspondente. Fora de produção: code/details/stack e requestId quando
fornecido ao contexto. Geração e propagação de requestId não implementadas.

ErrorCode: VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT,
INTERNAL_ERROR. O enum e o handler global substituem reason/switch.

Paginação: page/pageSize, base 1, padrão 20, máximo 100; metadados page,
pageSize, total, totalPages. Na futura adoção para empresas, ordenar por nome/ID.
Abrangência, filtros e campos adicionais serão discutidos quando houver
necessidade de paginação, sem bloquear a etapa atual. URLs preservadas,
incluindo `/api/v1` e as rotas auth sob `/api/auth`.

## Tarefas e aceite

- [x] HTTP-01: Aprovar contratos, exemplos e catálogo básico de erros/status.
  Evidência: STATE.md, ErrorCode, contratos compartilhados e docs/api.md.
  Detalhes adicionais de BE-10 não impedem a conclusão do contrato aprovado.
- [x] HTTP-02: Criar tipos/utilitários e tratamento central de erros.
  Evidência: AppError, serializeError e handlers globais; erros inesperados
  usam 500 e produção omite diagnóstico. Logging central é etapa separada.
- [x] HTTP-03: Implementar helpers de entrada e saída da paginação.
  Evidência: parsePagination/createPaginationMeta e tests/contracts.test.ts.
- [x] HTTP-04-A: Adotar erro/sucesso em todos os endpoints atuais do backend.
  Integrado em staging via PRs #13/#14, confirmado em bedb73a.
  Evidência: app.ts, controllers, auth middleware, http.adoption.test.ts.
  Falha SQL de empresas usa 500; ausência usa 404; JSON inválido usa 400 e
  corpo acima do limite usa 413, com causa preservada.
- [ ] HTTP-04-B: Migrar consumidores frontend e validar compatibilidade.
  Parcial na branch codex/frontend-backend-integration, dependente do PR #16:
  lib/api.ts, catálogo/perfil/planos, recuperação/reset e primeiro acesso
  adotam data/message. Login continua intacto e incompatível por exclusão
  explícita; não marcar compatibilidade integral nem fluxo autenticado completo.
  Ver spec frontend/backend-integration para verificações e limites.
- [x] HTTP-05: Atualizar API, padrões e decisões com exemplos/verificações.
  Evidência: docs/api.md, docs/padroes-backend.md e spec de adoção.

## Evolução sob demanda — fora das pendências atuais

**HTTP-03-A:** adotar paginação/contagem/ordenação somente quando uma listagem
precisar. Contrato e helpers continuam disponíveis; não há adoção SQL.
Quando retomada, definir abrangência/filtros e verificar desempate, vazio e
página além do fim. Essa evolução não está concluída nem integra o aceite atual.

## Verificação registrada

Base inicial: 14 testes de contrato. Adoção PR #14: 36 testes isolados e
checks typecheck:foundation/typecheck:contracts aprovados pela implementação.
O bloqueio histórico do TypeScript completo por CLI 6/configuração 7 foi corrigido pelo tooling Prisma 7 integrado. Nenhum banco remoto, envio real de e-mail ou teste frontend.
A auditoria de status não reexecutou os testes.

## Verificação da integração parcial — 2026-10-12

25 testes direcionados frontend e 60 backend aprovados, com typechecks
frontend/foundation/contratos e Vite. Build completo continua com falha
histórica no gate de assets Sobre e lint em SignSelect preexistente.
Não houve dependência nova, schema, banco real, alteração de login ou páginas/
rotas novas. Home/Sobre permanecem sob AD-002.
