# Decisões e estado do backend

Auditoria documental: 2026-10-10. Baseline auditada:
codex/http-adoption-integration; staging de referência: e2b3d8b.
Implementado em uma branch/PR não significa integrado em staging.

## Decisões confirmadas

- SDD leve + DDD leve; specs simples por assunto; subagentes nas tarefas
  secundárias. Perguntar diante de dúvidas e registrar decisões pendentes.
- Documentação antes do código, branches/worktrees por tarefa, integração de
  dependências e PRs para staging. Commits em inglês; mensagens de PR em PT-BR.
- Identificadores em inglês; arquivos domínio.papel.ts; comentários/erros em
  português; dois espaços e separação legível dos blocos de código.
- Pastas globais por função, controller existente no singular; shared para
  configuração/contratos/erros e repositories para interfaces de persistência.
  Controllers exportam funções independentes e importam services diretamente.
- Interfaces úteis, sem CompanyQuery ou interface para todo objeto. Repositories
  de usuários/empresas/planos somente interfaces; implementações futuras.
- Sucesso data/meta; criação 201; sem corpo 204. Produção status/message;
  demais ambientes code/details/stack sanitizados, requestId quando fornecido.
  ErrorCode central e handler global; preservar cause. Adoção em todos os
  endpoints backend aprovada; frontend explicitamente em etapa posterior.
- Paginação page/pageSize, base 1, padrão 20, máximo 100, total/totalPages;
  inválidos 400; vazio/além do fim data: []; empresas ordenadas por nome/ID.
- Prisma 7/SQL nativo/migration inversa substitui Prisma 8/TS/up-down.
  PostgreSQL novo e nome users confirmados. Base/dependências autorizadas,
  sem tabela comercial nova ou banco remoto antes do schema aprovado.

## Registro das decisões

| ID | Tema | Estado vigente |
| --- | --- | --- |
| BE-01 | Sucesso/adoção | Confirmado: data/meta, 201/204, URLs preservadas; backend implementado no PR #14, frontend posterior |
| BE-02 | Erros | Confirmado: enum/handler, produção status/message, diagnóstico sanitizado e cause nos demais ambientes |
| BE-03 | Paginação | Parcialmente confirmado: limites/meta/vazio/ordem nome-ID definidos; abrangência e filtros/ordenação adicionais aguardam resposta |
| BE-04 | Idioma/arquivos | Confirmado: domínio.papel.ts, código em inglês, erros/comentários em português, funções independentes |
| BE-05 | Pastas | Confirmado: pastas por função, shared e repositories atuais; nenhuma escolha de src/modules pendente |
| BE-06 | Persistência | Confirmado: repositories somente interfaces; SQL atual preservado; implementações/adoção posteriores |
| BE-07 | Migrations | Confirmado: Prisma 7, SQL nativo e inversa; tooling PR #8 implementado separadamente, integração pendente |
| BE-08 | Banco/baseline | Banco PostgreSQL do zero confirmado; baseline depende do schema e do destino dos SQL de planos |
| BE-09 | Identidade/schema | users confirmado; campos, vínculos, restrições e correção do uso user/users aguardam resposta |
| BE-10 | Padrões adicionais | Sanitização/enum/diagnóstico aprovados e implementados; requestId opcional no contexto. Validação abrangente, serialização, filtros, geração de requestId/logs e configuração aguardam resposta |

## Entregas e evidências

- Integrado em staging e2b3d8b: base dos contratos/helpers, correções de
  empresas, camadas/tipos de usuários/planos e três interfaces de repositories.
  Services ainda executam SQL; interfaces não são persistência operacional.
- Tipos auth: PR #12, auth.invite.dto.ts/auth.user.row.ts; presente nesta baseline.
- Adoção HTTP: [PR #14](https://github.com/rafaelsbe/Civix/pull/14), implementado
  na baseline: app.ts, AppError/ErrorCode, todos endpoints, handlers 404/erro,
  testes isolados. Ainda não presumir merge desse PR em staging.
- Tooling: [PR #8](https://github.com/rafaelsbe/Civix/pull/8), commit 48eb252,
  branch codex/prisma7-foundation; CLI/client/adapter 7.10.0 e três testes
  offline. Não integrado nesta baseline; ela ainda mistura CLI 6 e client 7.

Adoção HTTP registrou 36 testes e typechecks isolados aprovados. Typecheck
completo nesta baseline continua bloqueado pelo Prisma preexistente; no
worktree do tooling passou. Auditoria de status não reexecutou esses checks.

## Pendências reais

Integração das entregas abertas; frontend; consultas paginadas; implementação
/adoção dos repositories; extração de SQL/regras de auth/admin; tipo local
útil de admin; schema/baseline/migrations comerciais; comandos operacionais
a discutir; ciclo completo em PostgreSQL temporário autorizado.

Auth/admin preservam regras e ainda acessam SQL; admin permanece desmontado.
Nome users aprovado não autoriza converter consultas ou schema incidentalmente.
Nenhum banco remoto, envio real, migration ou mudança de frontend foi
executado na adoção HTTP. Consultas presentes não comprovam banco pronto.

## Histórico superado

A etapa inicial criou contratos sem adoção. O usuário depois autorizou a
adoção backend e adiou frontend. A correção local de empresas inicialmente
ficou sem commit, por exceção específica; o usuário autorizou commit depois.
Prisma 8/TS e espera de versão estável foram substituídos por Prisma 7/SQL.
Essas condições históricas não são decisões atuais aguardando resposta.
