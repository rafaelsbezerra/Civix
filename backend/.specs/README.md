# Specs do backend

SDD leve + DDD leve: tarefas pequenas, evidências de implementação e decisões
explícitas. Auditoria de status em 2026-10-10 na baseline
codex/http-adoption-integration; staging de referência atualizada para 7b976d7.
Checkbox marcado significa escopo implementado ou decisão confirmada,
conforme a evidência do item. Entrega em PR não significa merge em staging.

## Grupos e situação

| Grupo | Implementado | Pendências reais |
| --- | --- | --- |
| [Contratos HTTP](contratos-http/spec.md) | Base/helpers integrados; backend com erro/sucesso na baseline/PR #14 | Frontend, aplicação SQL da paginação, abrangência/filtros |
| [Estrutura](estrutura-modulos/spec.md) | Convenções, empresas, usuários/planos e tipos auth | SQL/regras de auth/admin para services; tipos úteis locais de admin |
| [Tipagem](tipagem-dominio/spec.md) | Entidades/DTOs existentes, linhas auth/plan e três interfaces de repositories | Modelo canônico, validação/serialização abrangentes; implementação posterior da persistência |
| [Migrations](migrations/spec.md) | Prisma 7/SQL/inversa aprovados; tooling integrado via PR #7/eea5f1d | Schema/baseline, comandos a discutir, ciclo em PostgreSQL |
| [Usuários/repositories](usuarios-repositories/spec.md) | Extração/interfaces integradas em staging | Implementação/adoção dos repositories em outra etapa |
| [Tipos auth](adocao-http/auth-types.md) | Extração entregue no PR #12 e presente na baseline | Não equivale a auth.service.ts |
| [Adoção HTTP](adocao-http/spec.md) | Backend implementado/verificado no PR #14 | Merge em staging não presumido; frontend posterior |

Consultar [STATE.md](STATE.md) para decisões atuais e históricas superadas.
Prisma 8/TS e espera de versão estável não são pendências atuais: o usuário
confirmou Prisma 7/SQL nativo. Nome users e banco criado do zero confirmados;
campos, vínculos e restrições do schema ainda aguardam resposta.

## Como trabalhar

- Ler AGENTS.md e a spec; perguntar diante de dúvidas/decisões novas.
- Não pedir de novo confirmação já concedida; marcar decisões reais como
  **Aguardando resposta** e não tratar propostas como aprovações.
- Documentar antes do código e atualizar docs principais por implementação.
- Verificar critérios pertinentes, registrar limitações e evidências.
- Usar subagentes nas tarefas secundárias, informando função/modelo.
- Manter tarefas em branches/worktrees e integração para dependências;
  seguir exceções explícitas do usuário e PRs para staging.

DDD leve separa responsabilidades e contratos úteis sem exigir microserviços,
CQRS, event sourcing ou interfaces para toda estrutura. Repositories contêm
somente interfaces nesta etapa; manter SQL até a implementação futura.

## Padrões ainda em discussão

Validação runtime geral, serialização de datas/IDs/null, filtros/ordenação,
geração/propagação de requestId, logs sem segredos e configuração runtime/CI.
Sanitização, enum, handler e diagnóstico já estão implementados. Autorização
nova e isolamento por empresa exigem escopo próprio; não ampliar o MVP.

## Verificação desta auditoria

Comparação somente documental com arquivos source/config, branches e specs.
Não reexecutou testes, instalou dependências, executou migrations ou alterou
código/configuração. Registros de testes pertencem às entregas indicadas.
Referências: [diagnóstico](../../docs/diagnostico.md),
[API](../../docs/api.md), [pendências gerais](../../docs/decisoes.md).
