# Specs do backend

## Estrutura obrigatória de todas as specs

Toda especificação de funcionalidade (`.specs/features/<nome-da-feature>/`) **deve** conter obrigatoriamente **3 arquivos**:

1. `feature.md` — visão de negócio, escopo funcional, decisões confirmadas/pendentes e critérios de aceite.
2. `sdd.md` — desenho técnico (Software Design Document), arquitetura, fluxos (entrada, validação, caso de uso, módulos, persistência e resposta), contratos e SQL/schemas.
3. `tasks.md` — plano de execução passo a passo seguindo estritamente o template abaixo.

### Padrão obrigatório para o arquivo `tasks.md`

```markdown
# <Título>

## Objetivo
<Descrição clara do objetivo da entrega>

## Restrições globais
- <Restrição 1>
- <Restrição 2>

## Pontos de atenção
- <Ponto de atenção, se houver>

---

## Task 1: <Título da Task>

**Arquivos:**
- Modificar:
  - `caminho/do/arquivo.ts`
- Criar:
  - `caminho/do/novo.arquivo.ts`

**Passos:**
- [ ] Passo 1
- [ ] Passo 2

**Pronto quando:**
- <Critério objetivo de conclusão e verificação>

**Commit sugerido:**
`feat(escopo): mensagem em ingles no padrao conventional commits`
```

### Regra obrigatória para todas as migrations (`_prisma_migrations` + UP e DOWN)

Como nem sempre as migrations são executadas via CLI do Prisma (podendo ser aplicadas diretamente por query SQL no banco de dados), **toda migration criada deve obrigatoriamente conter**:

1. **UP (`migration.sql`):**
   - As instruções DDL/DML de aplicação da migration dentro de uma transação (`BEGIN; ... COMMIT;`).
   - Um `INSERT` idempotente na tabela `_prisma_migrations` registrando a aplicação da migration caso a tabela exista e o `migration_name` ainda não esteja registrado como aplicado (`rolled_back_at IS NULL`).
2. **DOWN (`down.sql` na mesma pasta + referência comentada ao final de `migration.sql`):**
   - As instruções SQL exatas de reversão da migration.
   - A remoção/atualização correspondente na tabela `_prisma_migrations` (`DELETE FROM "_prisma_migrations" WHERE "migration_name" = '<nome_da_migration>';`).

**Exemplo padrão de registro em `_prisma_migrations` (no UP):**
```sql
INSERT INTO "_prisma_migrations" (
  "id",
  "checksum",
  "finished_at",
  "migration_name",
  "logs",
  "rolled_back_at",
  "started_at",
  "applied_steps_count"
)
SELECT
  gen_random_uuid()::text,
  'manual_sql_<nome_da_migration>',
  NOW(),
  '<nome_da_migration>',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '<nome_da_migration>'
      AND "rolled_back_at" IS NULL
  );
```

3. **Atualização obrigatória dos scripts de Seed e Reset:**
   - Toda vez que uma alteração incluir criação ou modificação de **migration** (novas tabelas, colunas, constraints, tipos `ENUM` ou renomeações), é **obrigatório atualizar os scripts existentes de seed e de reset** (`backend/scripts/lib/staging.seed.ts`, `backend/scripts/seed.staging.ts`, `backend/scripts/lib/database.reset.ts` e `backend/scripts/reset.database.ts`) para refletir o novo schema.
   - Os scripts de seed e reset operam com base nas variáveis de conexão definidas no `.env` (`DATABASE_URL`, mantendo suporte a `STAGING_DATABASE_URL`), não sendo restritos apenas a staging.

---

## Adoção do Prisma ORM e Entrada Única de Persistência — 2026-11-11

- [Feature](features/prisma-orm-repositories/feature.md)
- [SDD](features/prisma-orm-repositories/sdd.md)
- [Tasks](features/prisma-orm-repositories/tasks.md)

---

## Visão Geral Executiva do Super Admin (Métricas, Gráficos e Atividade Recente) — 2026-11-08

- [Feature](features/super-admin-overview-metrics/feature.md)
- [SDD](features/super-admin-overview-metrics/sdd.md)
- [Tasks](features/super-admin-overview-metrics/tasks.md)

---

## Padronização de `users.role` para ENUM em UPPER CASE (`user_role`) — 2026-11-08

- [Feature](features/user-role-enum/feature.md)
- [SDD](features/user-role-enum/sdd.md)
- [Tasks](features/user-role-enum/tasks.md)

---

## Busca pública de empresas e evolução de schema — 2026-11-07

- [Feature](features/company-search-and-schema/feature.md)
- [SDD](features/company-search-and-schema/sdd.md)
- [Tasks](features/company-search-and-schema/tasks.md)

---

## Dashboard superadmin — planejamento de 2026-11-02

[Spec](features/super-admin-dashboard/spec.md),
[SDD com fluxos e arquivos](features/super-admin-dashboard/sdd.md) e
[tarefas com commits sugeridos](features/super-admin-dashboard/task.md).
Gestão de empresas/equipe/planos, venda comercial inicial e gestão global.
Sem implementação nesta tarefa; billing, trial e capacidades por plano em
backlog. Configurações globais e decisões detalhadas aguardam resposta.

## Evolução dos papéis de usuários

[Spec](features/users-roles/spec.md) e [tarefas](features/users-roles/task.md).
Quatro papéis confirmados, três dashboards previstos e cliente sem área logada.
Autorização de upload e conversão explícita do legado implementadas localmente.
Homologação externa permanece pendente. Leitura pública da capa não depende de autenticação.

## Storage de imagens

[Estrutura e contratos](features/storage/spec.md) e
[tarefas](features/storage/task.md). Fluxo de capa implementado com multipart, autorização, persistência e R2;
router montado. Migrations e homologação PostgreSQL/R2 reais não executadas.

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
