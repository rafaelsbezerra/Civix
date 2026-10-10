# Specs do backend

SDD leve + DDD leve: tarefas pequenas, evidências de implementação e decisões
explícitas. Revisão de status em 2026-10-10 na staging `bedb73a`, após os
merges da base Prisma 7, tipos de auth, adoção HTTP e auditoria documental.
Checkbox marcado significa escopo implementado ou decisão confirmada,
conforme a evidência do item. Entrega em PR não significa merge em staging.

## Grupos e situação

| Grupo | Implementado | Pendências reais |
| --- | --- | --- |
| [Contratos HTTP](contratos-http/spec.md) | Base/helpers e erro/sucesso backend integrados em staging | Frontend consumidor |
| [Estrutura](estrutura-modulos/spec.md) | Convenções, empresas, usuários/planos e tipos auth | SQL/regras de auth/admin para services; tipos úteis locais de admin |
| [Tipagem](tipagem-dominio/spec.md) | Entidades/DTOs existentes, linhas auth/plan e três interfaces de repositories | Modelo canônico e validação/serialização abrangentes |
| [Migrations](migrations/spec.md) | Prisma 7/SQL/inversa aprovados; tooling integrado via PR #7/eea5f1d | Schema/baseline, comandos a discutir, ciclo em PostgreSQL |
| [Usuários/repositories](usuarios-repositories/spec.md) | Extração/interfaces integradas em staging | Nenhuma neste grupo; repositories fora das pendências atuais |
| [Tipos auth](adocao-http/auth-types.md) | Extração integrada em staging via PR #12 | Não equivale a auth.service.ts |
| [Adoção HTTP](adocao-http/spec.md) | Backend integrado via PRs #13/#14 | Frontend consumidor |

Consultar [STATE.md](STATE.md) para decisões atuais e históricas superadas.
Prisma 8/TS e espera de versão estável não são pendências atuais: o usuário
confirmou Prisma 7/SQL nativo. Nome users e banco criado do zero confirmados;
campos, vínculos e restrições do schema ainda aguardam resposta.

## Evoluções fora das pendências atuais

Paginação será adotada somente quando necessário (HTTP-03-A). Implementação
e consumo de repositories ficam para uma etapa futura (REP-02). Contratos,
helpers e interfaces existentes permanecem disponíveis; os itens não foram
marcados como concluídos. Ver o [relatório consolidado](../../docs/revisao-pendencias-specs.md).

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
