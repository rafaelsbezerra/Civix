# Visão Geral Executiva do Super Admin (Backend)

## Objetivo
Disponibilizar a rota `GET /api/v1/platform/users/metrics` para retornar a contagem global de usuários gerenciados por perfil (`super_admin`, `admin_empresa`, `atendente`) e por status (`active`, `pending`, `blocked`), permitindo que o frontend monte a Visão Geral combinando essa rota com as rotas já existentes de empresas e vendas.

## Restrições globais
- Manter a separação em camadas `routes → controller → service → repository`.
- Proteger a rota exclusivamente para `super_admin` (`authMiddleware`, `requireSuperAdmin` e `requireSuperAdminActor`).
- Compatibilizar a consulta SQL com os enums em `UPPER CASE` no PostgreSQL (`user_role` e `user_status`) e manter paridade total com o repositório JSON (`USE_MOCK_DATA=true`).
- Não expor dados sensíveis (`password_hash`, `invite_token`, `reset_password_token`) nem usuários com perfil `cliente`.

## Pontos de atenção
- Usuários com `deleted_at IS NOT NULL` (ex.: atendentes removidos) não devem ser contabilizados nas métricas de usuários gerenciados.
- Quando `status` for `NULL` em registros legados, tratá-lo como `'active'` (`COALESCE(status::text, 'ACTIVE')`).

---

## Task 1: Implementar `GET /api/v1/platform/users/metrics` no Backend

**Arquivos:**
- Modificar:
  - `backend/src/dtos/user.auth.dto.ts`
  - `backend/src/repositories/user.repository.ts`
  - `backend/src/persistence/user.repository.ts`
  - `backend/src/persistence/postgres/user.repository.ts`
  - `backend/src/persistence/json/user.repository.ts`
  - `backend/src/services/user.service.ts`
  - `backend/src/controller/user.controller.ts`
  - `backend/src/routes/platform.routes.ts`
  - `backend/tests/platform.users.test.ts`
  - `backend/tests/platform.users.postgres.test.ts`

**Passos:**
- [ ] Definir as interfaces `RoleUsersBreakdown` e `ManagedUsersMetrics` em `backend/src/dtos/user.auth.dto.ts` e adicionar `getManagedUsersMetrics(): Promise<ManagedUsersMetrics>` ao contrato `UserRepository`.
- [ ] Implementar `getManagedUsersMetrics()` em `userPostgresRepository` (usando `GROUP BY role, COALESCE(status::text, 'ACTIVE')` com `WHERE deleted_at IS NULL`) e em `userJsonRepository`, delegando no wrapper `backend/src/persistence/user.repository.ts`.
- [ ] Criar `getManagedUsersMetrics(actorId: UserId)` em `backend/src/services/user.service.ts` validando `requireSuperAdminActor(actorId)` e o handler `getManagedUsersMetrics` em `backend/src/controller/user.controller.ts`.
- [ ] Registrar `router.get('/users/metrics', userController.getManagedUsersMetrics)` em `backend/src/routes/platform.routes.ts`.
- [ ] Adicionar testes cobrindo a agregação por perfil/status e o controle de acesso em `backend/tests/platform.users.test.ts` e `backend/tests/platform.users.postgres.test.ts`.

**Pronto quando:**
- `npm --prefix backend run test:platform`, `npm --prefix backend run typecheck:foundation`, `npm --prefix backend run lint` e `npm --prefix backend run format:check` passarem sem erros.

**Commit sugerido:**
`feat(platform): add managed users metrics endpoint by role and status`

