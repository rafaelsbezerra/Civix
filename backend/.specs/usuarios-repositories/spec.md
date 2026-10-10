# Usuários e contratos de persistência

Estado: escopo de extração/interfaces implementado e integrado em staging
na referência e2b3d8b. A adoção HTTP posterior está na baseline auditada/PR #14;
as respostas legadas abaixo preservadas inicialmente são histórico.

## Escopo e decisões confirmadas

- Refatorar userController/userRoute em user.routes.ts/user.controller.ts/
  user.service.ts; separar entidade/DTO e manter pastas por função.
- Controllers com handlers independentes e imports diretos do service.
- Repositories somente interfaces de usuários, empresas e planos. Manter
  SQL nos services; implementação e adoção são tarefas futuras.
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
  assignPlan retorna boolean. Sem implementação ou consumo nos services.
- [x] USR-03: Verificar fluxos preservados e documentar extração.
  Login empresa bcrypt/cliente atual/JWT 1h, recuperação sem enumeração,
  token aleatório/hash/expiração e reset bcrypt10; persistência/e-mail
  simulados em tests/user.routes.test.ts, documentos de arquitetura/padrões.
- [ ] REP-02: Implementar/consumir repositories em etapa posterior.
  Adiado explicitamente; não integra o aceite da extração atual.

## HTTP histórico e adoção posterior

A extração preservou respostas/status existentes e não adotou os envelopes.
Depois, [a adoção HTTP](../adocao-http/spec.md) substituiu resultados com
reason/switch por dados ou AppError e aplicou data/meta nos controllers.
Esse código está na baseline auditada e no PR #14; não presumir seu merge.
A divergência users/user permanece até a etapa de schema aprovada.

## Verificação registrada e entrega

Extração: 27 testes (14 contratos, 4 empresas, 9 usuários) e tipagem isolada
aprovados. Comandos: test:users, test:foundation, typecheck:foundation.
A adoção posterior registra 36 testes. O tooling Prisma 7 integrado corrigiu o bloqueio histórico do TypeScript completo. Auditoria não repetiu esses checks.
Nenhum banco remoto, envio real, migration ou verificação frontend.

Branches codex/repository-contracts e codex/user-layers foram reunidas em
codex/users-persistence-integration, ancestral da staging de referência.
As interfaces não substituem SQL nem comprovam persistência durável.
