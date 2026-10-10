# Contratos HTTP

Estado: base implementada e integrada em `staging`; adoção de erro/sucesso
implementada na baseline `codex/http-adoption-integration`, entregue no
[PR #14](https://github.com/rafaelsbe/Civix/pull/14). O código desse PR não
comprova merge em staging. Frontend e paginação SQL permanecem posteriores.

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
pageSize, total, totalPages. Empresas terão ordenação nome/ID. Abrangência,
filtros e campos adicionais: **Aguardando resposta**. URLs atuais preservadas,
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
- [ ] HTTP-03-A: Aplicar paginação/contagem/ordenação nas consultas escolhidas.
  Depende da abrangência; verificar filtros, desempate, vazio e além do fim
  com dados controlados. Helpers não comprovam contagem ou ordenação SQL.
- [x] HTTP-04-A: Adotar erro/sucesso em todos os endpoints atuais do backend.
  Implementado no PR #14, ainda distinguir entrega e merge em staging.
  Evidência: app.ts, controllers, auth middleware, http.adoption.test.ts.
  Falha SQL de empresas usa 500; ausência usa 404; JSON inválido usa 400 e
  corpo acima do limite usa 413, com causa preservada.
- [ ] HTTP-04-B: Migrar consumidores frontend e validar compatibilidade.
  Explicitamente adiado na adoção backend; lib/api.ts e páginas continuam
  lendo envelopes antigos. Não considerar a integração frontend concluída.
- [x] HTTP-05: Atualizar API, padrões e decisões com exemplos/verificações.
  Evidência: docs/api.md, docs/padroes-backend.md e spec de adoção.

## Verificação registrada

Base inicial: 14 testes de contrato. Adoção PR #14: 36 testes isolados e
checks typecheck:foundation/typecheck:contracts aprovados pela implementação.
Typecheck completo segue bloqueado por Prisma CLI 6/configuração 7 nesta
baseline. Nenhum banco remoto, envio real de e-mail ou teste frontend.
A auditoria de status não reexecutou os testes.
