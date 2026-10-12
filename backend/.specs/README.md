# Specs do backend

## Planejamento dos dashboards — 2026-10-12

Novo [plano ordenado](roadmaps/dashboards/README.md), com specs por entrega,
[contratos E2E propostos](roadmaps/dashboards/contracts.md) e
[decisões confirmadas/pendentes](roadmaps/dashboards/decisions.md).
Nesta rodada só documentação: nenhum código implementado, commit ou migration.
Referências históricas abaixo preservam as entregas de base; não substituem
esse planejamento de identidade, empresa, atribuição e acesso à plataforma.

SDD leve + DDD leve: tarefas pequenas, evidências de implementação e decisões
explícitas. Revisão de status em 2026-10-10 na staging `bedb73a`, após os
merges da base Prisma 7, tipos de auth, adoção HTTP e auditoria documental.
Checkbox marcado significa escopo implementado ou decisão confirmada,
conforme a evidência do item. Entrega em PR não significa merge em staging.

## Logs estruturados internos

[Spec e contrato](features/structured-logs/spec.md) e
[tarefas em dois commits](features/structured-logs/tasks.md). Fundação
publicada em d1114da (codex/backend-logs-foundation). Adoção nos sete services
e CLI implementada/verificada na worktree services, com revisão independente
sem bloqueadores. Logs internos, sem tabela ou alteração HTTP.
[Evidências](features/structured-logs/validation.md): 99 foundation, 17 services,
22 da fundação de logging e dois typechecks aprovados. Commits d1114da/5258124
publicados e reunidos no PR [#19](https://github.com/rafaelsbe/Civix/pull/19) para staging; merge pendente.

## Grupos e situação

| Grupo | Implementado | Pendências reais |
| --- | --- | --- |
| [Contratos HTTP](contratos-http/spec.md) | Base/helpers e erro/sucesso backend integrados em staging | Frontend parcial; login excluído da integração atual |
| [Estrutura](estrutura-modulos/spec.md) | Camadas de empresas/usuários/planos; auth/admin separados em services no checkout local | Nenhuma extração atual pendente; não expor admin |
| [Tipagem](tipagem-dominio/spec.md) | Entidades/DTOs existentes, linhas auth/plan e interfaces de persistência | Modelo canônico e validação/serialização abrangentes |
| [Migrations](migrations/spec.md) | Prisma 7/SQL/inversa aprovados; tooling integrado via PR #7/eea5f1d | Schema/baseline, comandos a discutir, ciclo em PostgreSQL |
| [Usuários/repositories](usuarios-repositories/spec.md) | Interfaces e adapters JSON/PostgreSQL adotados localmente em 2026-10-12 | Schema/banco real seguem em spec própria |
| [Tipos auth](adocao-http/auth-types.md) | Tipos separados; auth.service.ts implementado localmente | Protocolo canônico de identidade/reset segue para definição |
| [Adoção HTTP](adocao-http/spec.md) | Backend integrado via PRs #13/#14 | Consumidores adaptados no PR #17, exceto login; PR dependente do #16 |
| [Dados locais](dados-locais/spec.md) | Flag global, JSON persistido, caixa de saída, comando de usuário e POST empresas, publicados no PR #16 | Banco real/schema não executados; frontend parcial no PR #17 |

Consultar [STATE.md](STATE.md) para decisões atuais e históricas superadas.
Prisma 8/TS e espera de versão estável não são pendências atuais: o usuário
confirmou Prisma 7/SQL nativo. Nome users e banco criado do zero confirmados;
campos, vínculos e restrições do schema ainda aguardam resposta.

## Evoluções fora das pendências atuais

Paginação será adotada somente quando necessário (HTTP-03-A); helpers e contrato
permanecem disponíveis. REP-02 foi antecipado pela implementação autorizada
do modo local: interfaces e adapters foram adotados nos módulos atuais.
Ver o [relatório consolidado](reviews/revisao-pendencias-specs.md).

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
CQRS, event sourcing ou interfaces para toda estrutura. A pasta repositories
contém interfaces; implementações estão em persistence/json e persistence/postgres.
Services utilizam seletores por ambiente; SQL fica nos adapters PostgreSQL.

## Padrões ainda em discussão

Validação runtime geral, serialização de datas/IDs/null, filtros/ordenação,
rastreabilidade no contrato HTTP, coleta/retenção de logs e configuração runtime/CI.
Contexto/UUID interno e logs HTTP sem segredos estão implementados na fundação;
adoção nos services foi implementada e verificada separadamente.
Sanitização, enum, handler e diagnóstico já estão implementados. Autorização
nova e isolamento por empresa exigem escopo próprio; não ampliar o MVP.

## Verificação desta auditoria

Comparação somente documental com arquivos source/config, branches e specs.
Não reexecutou testes, instalou dependências, executou migrations ou alterou
código/configuração. Registros de testes pertencem às entregas indicadas.
Referências: [diagnóstico](reviews/diagnostico.md),
[API](../../docs/api.md), [pendências gerais](decisions/decisoes.md).

## Revisões e decisões

- [Diagnóstico backend](reviews/diagnostico.md).
- [Pendências backend](reviews/revisao-pendencias-specs.md).
- [Decisões backend](decisions/decisoes.md).
- [Histórico documental](reviews/historico-documental.md).
- [Revisões frontend](../../frontend/.specs/reviews/revisao-pendencias-specs.md).
