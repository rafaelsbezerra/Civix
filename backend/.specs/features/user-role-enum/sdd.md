# SDD — Padronização de `users.role` para ENUM em UPPER CASE (`user_role`)

Data: 2026-11-08  
Arquivos da spec: [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)

## 1. Arquitetura e camadas afetadas

A alteração é concentrada na camada de banco de dados (migration + Prisma schema), scripts de banco (seed/reset) e nos adapters de persistência PostgreSQL (`backend/src/persistence/postgres/`), preservando inalterados os contratos HTTP, middlewares, serviços e frontend:

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Schema e Migrations | [`backend/prisma/schema.prisma`](../../../prisma/schema.prisma), `backend/prisma/migrations/20261108000100_add_user_role_enum/*` | Criar `enum user_role` em `UPPER CASE`, migrar a coluna `users.role` e atualizar a constraint `users_company_scope_check` |
| Seed e Reset | [`backend/scripts/lib/staging.seed.ts`](../../../scripts/lib/staging.seed.ts), [`backend/scripts/lib/database.reset.ts`](../../../scripts/lib/database.reset.ts) | Converter `user.role` para `UPPER CASE` ao popular a tabela `users` |
| Persistência PostgreSQL | [`user.repository.ts`](../../../src/persistence/postgres/user.repository.ts), [`auth.repository.ts`](../../../src/persistence/postgres/auth.repository.ts), [`company.repository.ts`](../../../src/persistence/postgres/company.repository.ts), [`plan.repository.ts`](../../../src/persistence/postgres/plan.repository.ts), [`sale.repository.ts`](../../../src/persistence/postgres/sale.repository.ts) | Enviar valores de `role` em `UPPER CASE` para o PostgreSQL e normalizar `role.toLowerCase()` ao hidratar objetos `User` / `UserRow` |
| Testes | [`prisma.tooling.test.mjs`](../../../tests/prisma.tooling.test.mjs), [`staging.seed.test.ts`](../../../tests/staging.seed.test.ts), [`platform.users.postgres.test.ts`](../../../tests/platform.users.postgres.test.ts), [`http.adoption.test.ts`](../../../tests/http.adoption.test.ts) | Verificar o SQL parametrizado em `UPPER CASE`, o contrato da migration e a normalização de retorno |

---

## 2. Fluxo 1 — Migration SQL (`20261108000100_add_user_role_enum`) e `schema.prisma`

### 2.1. UP (`migration.sql`)

1. Criar o tipo `user_role` de forma idempotente:
   `'ADMIN_EMPRESA'`, `'SUPER_ADMIN'`, `'CLIENTE'`, `'ATENDENTE'`.
2. Remover as constraints `users_company_scope_check` e `users_role_check` (pois referenciam literais em lowercase e comparam `role` como `TEXT`).
3. Alterar o tipo da coluna `users.role` para `user_role` convertendo os valores atuais com `UPPER(TRIM(role::text))`.
4. Recriar a constraint `users_company_scope_check` utilizando os literais do enum em `UPPER CASE`.
5. Inserir o registro da migration em `_prisma_migrations` caso ainda não exista.

```sql
-- UP (migration.sql)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'ADMIN_EMPRESA',
      'SUPER_ADMIN',
      'CLIENTE',
      'ATENDENTE'
    );
  END IF;
END $$;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_scope_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ALTER COLUMN role TYPE user_role
  USING (
    CASE UPPER(TRIM(role::text))
      WHEN 'ADMIN_EMPRESA' THEN 'ADMIN_EMPRESA'::user_role
      WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::user_role
      WHEN 'CLIENTE' THEN 'CLIENTE'::user_role
      WHEN 'ATENDENTE' THEN 'ATENDENTE'::user_role
      ELSE 'CLIENTE'::user_role
    END
  );

ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
  (role IN ('ADMIN_EMPRESA'::user_role, 'ATENDENTE'::user_role) AND company_id IS NOT NULL)
  OR (role IN ('SUPER_ADMIN'::user_role, 'CLIENTE'::user_role) AND company_id IS NULL)
);

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
  'manual_sql_20261108000100_add_user_role_enum',
  NOW(),
  '20261108000100_add_user_role_enum',
  NULL,
  NULL,
  NOW(),
  1
WHERE to_regclass('public._prisma_migrations') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000100_add_user_role_enum'
      AND "rolled_back_at" IS NULL
  );

COMMIT;
```

### 2.2. DOWN (`down.sql`)

```sql
-- DOWN (down.sql)
BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_scope_check;

ALTER TABLE users
  ALTER COLUMN role TYPE TEXT
  USING LOWER(role::text);

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('admin_empresa', 'super_admin', 'cliente', 'atendente')
);

ALTER TABLE users ADD CONSTRAINT users_company_scope_check CHECK (
  (role IN ('admin_empresa', 'atendente') AND company_id IS NOT NULL)
  OR (role IN ('super_admin', 'cliente') AND company_id IS NULL)
);

DROP TYPE IF EXISTS user_role;

DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    DELETE FROM "_prisma_migrations"
    WHERE "migration_name" = '20261108000100_add_user_role_enum';
  END IF;
END $$;

COMMIT;
```

### 2.3. Atualização do `backend/prisma/schema.prisma`

```prisma
model users {
  // ...
  role user_role
  // ...
}

enum user_role {
  ADMIN_EMPRESA
  SUPER_ADMIN
  CLIENTE
  ATENDENTE
}
```

---

## 3. Fluxo 2 — Normalização nos Repositórios PostgreSQL

1. **Entrada no Repositório (`UserRole` em lowercase vindo dos Services):**
   - Os serviços continuam passando `role: 'super_admin' | 'admin_empresa' | 'atendente' | 'cliente'`.
2. **Mapeamento para SQL (Escrita e Filtros em `UPPER CASE`):**
   - [`user.repository.ts`](../../../src/persistence/postgres/user.repository.ts):
     - `getUsersForAdministration`:
       - Escopo global (`companyId === null`): `role='SUPER_ADMIN' AND company_id IS NULL`.
       - Escopo empresa (`companyId !== null`): `company_id=$1 AND role IN ('ADMIN_EMPRESA','ATENDENTE')`.
       - Filtro opcional `filters.role`: `values.push(filters.role.toUpperCase())` com `role=$n`.
     - `changeUserAdministration`:
       - `INSERT INTO users (...) VALUES ($1,$2,$3,$4,$5,'PENDING',$6)` recebe `input.role!.toUpperCase()` em `$4`.
       - `UPDATE users` na ação `update`: `updates.role = input.role!.toUpperCase()`.
       - Proteção do último superadmin ativo: `SELECT id FROM users WHERE role='SUPER_ADMIN' AND company_id IS NULL ...`.
     - `create(user)`: passa `user.role.toUpperCase()` no parâmetro `$4`.
     - `getByEmailAndRole(email, role)`: passa `role.toUpperCase()` no parâmetro `$2`.
   - [`auth.repository.ts`](../../../src/persistence/postgres/auth.repository.ts):
     - `getInviteUserByEmail(email, role)`: quando `role !== undefined`, passa `role.toUpperCase()` em `$2`.
     - `activateUser`: cláusula `WHERE` usa `(role = 'SUPER_ADMIN' AND company_id IS NULL) OR (role IN ('ADMIN_EMPRESA','ATENDENTE') AND EXISTS (...))`.
     - `saveInvite`: passa `role.toUpperCase()` nos parâmetros de `UPDATE` e `INSERT`.
   - [`company.repository.ts`](../../../src/persistence/postgres/company.repository.ts), [`plan.repository.ts`](../../../src/persistence/postgres/plan.repository.ts) e [`sale.repository.ts`](../../../src/persistence/postgres/sale.repository.ts):
     - Nas verificações transacionais do ator (`SELECT role, status ... FROM users WHERE id=$1`), comparar `actor.role.toLowerCase() !== 'super_admin'`.
3. **Hidratação / Saída do Repositório (`toLowerCase()`):**
   - `normalizeUser` (em `user.repository.ts`) e `normalizeAuthRow` (em `auth.repository.ts`) convertem `role: user.role.toLowerCase() as UserRole` naast `status: normalizeUserStatus(user.status)`.
4. **Resposta para Services e Controllers:**
   - Todos os objetos `User` e `UserRow` entregues aos services possuem `role` em lowercase (`'super_admin' | 'admin_empresa' | 'atendente' | 'cliente'`), preservando 100% dos contratos de API e autenticação.

---

## 4. Fluxo 3 — Atualização do Seed (`staging.seed.ts`)

1. **Entrada:** Snapshot local `backend/data/local.data.json` com `role` em lowercase (`'super_admin'`, `'admin_empresa'`, `'atendente'`, `'cliente'`).
2. **Validação (`prepareStagingSeed`):** Valida `isUserRole(user.role)` e o vínculo com `company_id`.
3. **Persistência (`insertUsers` em `backend/scripts/lib/staging.seed.ts`):**
   - No `INSERT INTO users (id, name, email, role, password_hash, status, plan_id, company_id)`, envia `user.role.toUpperCase()` no parâmetro `$4`.

