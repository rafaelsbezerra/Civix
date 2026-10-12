# Decisões e estado do backend

Revisão documental: 2026-10-10. Referência atual: staging `bedb73a`.
Base Prisma 7, tipos de auth, adoção HTTP e auditoria documental já integrados.
Atualização de 2026-10-12 no checkout local, sem commit: modo JSON global,
caixa de saída, bootstrap de usuário, cadastro protegido e services auth/admin.

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
  ficam como interfaces; adapters por domínio em persistence foram autorizados
  e adotados no modo local de 2026-10-12, antecipando a evolução REP-02.
- Sucesso data/meta; criação 201; sem corpo 204. Produção status/message;
  demais ambientes code/details/stack sanitizados, requestId quando fornecido.
  ErrorCode central e handler global; preservar cause. Adoção em todos os
  endpoints backend aprovada; frontend explicitamente em etapa posterior.
- Paginação page/pageSize, base 1, padrão 20, máximo 100, total/totalPages;
  inválidos 400; vazio/além do fim data: []; ordem nome/ID prevista para
  empresas quando houver adoção. Usar paginação somente quando necessário,
  fora das pendências atuais.
- Prisma 7/SQL nativo/migration inversa substitui Prisma 8/TS/up-down.
  PostgreSQL novo e nome users confirmados. Base/dependências autorizadas,
  sem tabela comercial nova ou banco remoto antes do schema aprovado.

## Registro das decisões

| ID | Tema | Estado vigente |
| --- | --- | --- |
| BE-01 | Sucesso/adoção | Confirmado: data/meta, 201/204, URLs preservadas; backend integrado em staging via PRs #13/#14, frontend posterior |
| BE-02 | Erros | Confirmado: enum/handler, produção status/message, diagnóstico sanitizado e cause nos demais ambientes |
| BE-03 | Paginação | Sob demanda: contrato/helpers prontos; adoção fora das pendências atuais. Abrangência/filtros serão definidos quando necessário |
| BE-04 | Idioma/arquivos | Confirmado: domínio.papel.ts, código em inglês, erros/comentários em português, funções independentes |
| BE-05 | Pastas | Confirmado: pastas por função, shared e repositories atuais; nenhuma escolha de src/modules pendente |
| BE-06 | Persistência | Implementado localmente: interfaces e adapters JSON/PostgreSQL; USE_MOCK_DATA seleciona o modo. SQL preservado nos adapters reais |
| BE-07 | Migrations | Confirmado: Prisma 7, SQL nativo e inversa; tooling 7.10.0 integrado via PR #7/eea5f1d; schema e banco pendentes |
| BE-08 | Banco/baseline | Banco PostgreSQL do zero confirmado; baseline depende do schema e do destino dos SQL de planos |
| BE-09 | Identidade/schema | users confirmado; campos, vínculos, restrições e correção do uso user/users aguardam resposta |
| BE-10 | Padrões adicionais | Sanitização/enum/diagnóstico aprovados e implementados; requestId opcional no contexto. Validação abrangente, serialização, filtros, geração de requestId/logs e configuração aguardam resposta |

## Entregas e evidências

- Integrado em staging e2b3d8b: base dos contratos/helpers, correções de
  empresas, camadas/tipos de usuários/planos e três interfaces de repositories.
  Na extração inicial, services executavam SQL. Em 2026-10-12, adapters foram adotados no checkout local.
- Tipos auth: PR #12 integrado em staging; auth.invite.dto.ts/auth.user.row.ts.
- Adoção HTTP: integrada via PR #13 (8548c2b); PR #14 (bedb73a) incorpora
  também a auditoria documental. app.ts, AppError/ErrorCode, endpoints e
  handlers 404/erro estão na staging atual.
- Tooling: entregue nos PRs #7/#8 e integrado à staging pelo PR #7 (eea5f1d).
  CLI/client/adapter 7.10.0 e três testes offline presentes nesta baseline.

Adoção HTTP registrou 36 testes e typechecks isolados aprovados. O bloqueio
do typecheck completo por CLI 6 é histórico e foi corrigido pelo tooling
Prisma 7 integrado. Auditoria de status não reexecutou esses checks.

## Pendências reais

Frontend consumidor; modelo canônico e validação/serialização;
schema/baseline/migrations
comerciais; comandos operacionais a discutir; ciclo completo em PostgreSQL
temporário autorizado. Requisitos vigentes de Home/Sobre aguardam confirmação.

Paginação será usada somente quando necessário, fora das pendências atuais.
Repositories foram adotados por necessidade do modo local autorizado;
auth/admin agora usam services e adapters. Admin permanece desmontado.
Ver o [relatório consolidado](../../docs/revisao-pendencias-specs.md).
Nome users aprovado não autoriza converter consultas ou schema incidentalmente.
Nenhum banco remoto, envio real, migration ou mudança de frontend foi
executado na adoção HTTP. Consultas presentes não comprovam banco pronto.

## Histórico superado

A etapa inicial criou contratos sem adoção. O usuário depois autorizou a
adoção backend e adiou frontend. A correção local de empresas inicialmente
ficou sem commit, por exceção específica; o usuário autorizou commit depois.
Prisma 8/TS e espera de versão estável foram substituídos por Prisma 7/SQL.
Essas condições históricas não são decisões atuais aguardando resposta.
