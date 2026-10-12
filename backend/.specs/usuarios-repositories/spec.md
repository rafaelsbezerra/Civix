# Usuários e contratos de persistência

Estado: escopo de extração/interfaces implementado e integrado em staging
na referência atual bedb73a. A adoção HTTP também está integrada pelos
PRs #13/#14; respostas legadas preservadas na extração inicial são histórico.

## Escopo e decisões confirmadas

- Refatorar userController/userRoute em user.routes.ts/user.controller.ts/
  user.service.ts; separar entidade/DTO e manter pastas por função.
- Controllers com handlers independentes e imports diretos do service.
- A extração inicial criou somente interfaces. Em 2026-10-12, o modo local
  autorizou adapters JSON/PostgreSQL e adoção nos módulos atuais; SQL está
  em src/persistence, sem parser genérico de consultas.
- Não criar repository para envio de e-mail ou módulos comerciais ausentes.
- Extração inicial manteve auth/admin, frontend, schema e regras intactos.
  A adoção posterior altera envelopes/erros de auth/admin sem novo schema.
- Sempre perguntar diante de dúvidas e registrar decisões pendentes.

## Tarefas e evidências

- [x] USR-01: Separar routes/controller/service de usuários.
  user.routes.ts preserva URLs/aliases/middleware; controller concentra HTTP,
  service concentra SQL, bcrypt, JWT, reset token/hash e envio de e-mail.
- [x] USR-02: Separar User/PublicUser/inputs/resultados e tipos de planos.
  entities/user.entity.ts, user.auth.dto.ts, entities/plan.entity.ts e
  interfaces/plan.row.ts; saída PublicUser não inclui hash/senha.
- [x] REP-01: Criar UserRepository/CompanyRepository/PlanRepository.
  repositories/*.repository.ts: métodos de domínio, ausência undefined;
  assignPlan retorna boolean. Implementações/consumo foram adicionados no modo local.
- [x] USR-03: Verificar fluxos preservados e documentar extração.
  Login empresa bcrypt/cliente atual/JWT 1h, recuperação sem enumeração,
  token aleatório/hash/expiração e reset bcrypt10; persistência/e-mail
  simulados em tests/user.routes.test.ts, documentos de arquitetura/padrões.

## Adoção autorizada — 2026-10-12

- [x] REP-02: Implementar e consumir repositories dos módulos atuais.
  O modo local autorizou antecipar esta evolução. Interfaces permanecem em
  repositories; implementações em persistence/json e persistence/postgres, com nomes domínio.repository.ts. Services usam a seleção
  definida na inicialização. AuthRepository cobre as operações existentes de
  users e user sem unificar schema. Não houve execução de banco real.
  Ver [spec de dados locais](../dados-locais/spec.md).

## HTTP histórico e adoção posterior

A extração preservou respostas/status existentes e não adotou os envelopes.
Depois, [a adoção HTTP](../adocao-http/spec.md) substituiu resultados com
reason/switch por dados ou AppError e aplicou data/meta nos controllers.
Esse código está integrado em staging via PRs #13/#14, referência bedb73a.
A divergência users/user permanece até a etapa de schema aprovada.

## Verificação registrada e entrega

Extração: 27 testes (14 contratos, 4 empresas, 9 usuários) e tipagem isolada
aprovados. Comandos: test:users, test:foundation, typecheck:foundation.
A adoção posterior registra 36 testes. O tooling Prisma 7 integrado corrigiu o bloqueio histórico do TypeScript completo. Auditoria não repetiu esses checks.
Nenhum banco remoto, envio real, migration ou verificação frontend.

Branches codex/repository-contracts e codex/user-layers foram reunidas em
codex/users-persistence-integration, ancestral da staging de referência.
As interfaces não substituem SQL nem comprovam persistência durável.
