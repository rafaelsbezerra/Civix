# SDD — Visão Geral Executiva do Super Admin (Backend)

- **Feature:** [feature.md](feature.md)
- **Tasks:** [tasks.md](tasks.md)
- **Spec Frontend pareada:** [`frontend/.specs/features/super-admin-overview-metrics/sdd.md`](../../../../frontend/.specs/features/super-admin-overview-metrics/sdd.md)

---

## 1. Arquitetura e camadas afetadas no Backend

Para que o frontend possa exibir o **Total de Usuários Gerenciados por Perfil** sem precisar consultar individualmente cada empresa cadastrada, será adicionada uma rota específica em `platform.routes.ts` seguindo o fluxo `routes → controller → service → repository`:

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Rotas | [`backend/src/routes/platform.routes.ts`](../../../src/routes/platform.routes.ts) | Expor `GET /api/v1/platform/users/metrics` sob `authMiddleware` e `requireSuperAdmin` |
| Controller | [`backend/src/controller/user.controller.ts`](../../../src/controller/user.controller.ts) | Handler `getManagedUsersMetrics(req, res)` retornando `createSuccessResponse(...)` |
| Service | [`backend/src/services/user.service.ts`](../../../src/services/user.service.ts) | Caso de uso `getManagedUsersMetrics(actorId)` validando `requireSuperAdminActor(actorId)` |
| Contrato de Repositório | [`backend/src/repositories/user.repository.ts`](../../../src/repositories/user.repository.ts) | Assinatura `getManagedUsersMetrics(): Promise<ManagedUsersMetrics>` |
| Persistência PostgreSQL | [`backend/src/persistence/postgres/user.repository.ts`](../../../src/persistence/postgres/user.repository.ts) | Agregação SQL em `users` (`WHERE deleted_at IS NULL AND role IN ('SUPER_ADMIN', 'ADMIN_EMPRESA', 'ATENDENTE')`) |
| Persistência JSON | [`backend/src/persistence/json/user.repository.ts`](../../../src/persistence/json/user.repository.ts) | Agregação em memória sobre `localData.users` para `USE_MOCK_DATA=true` |
| Wrapper de Persistência | [`backend/src/persistence/user.repository.ts`](../../../src/persistence/user.repository.ts) | Delegação de `getManagedUsersMetrics()` para o repositório ativo |

---

## 2. Fluxo: `GET /api/v1/platform/users/metrics`

### 2.1. Entrada e Validação
- **Método e caminho:** `GET /api/v1/platform/users/metrics`
- **Autenticação e Autorização:**
  1. `authMiddleware` valida o token JWT (cookie ou header `Authorization: Bearer`) e hidrata `req.authenticatedUser`.
  2. `requireSuperAdmin` verifica `req.authenticatedUser.role === 'super_admin'`.
  3. No serviço (`userService.getManagedUsersMetrics(actorId)`), `requireSuperAdminActor(actorId)` confirma no banco/JSON que o ator continua ativo, não excluído e com perfil `super_admin`.

### 2.2. Contrato de Dados (`ManagedUsersMetrics`)

```typescript
export interface RoleUsersBreakdown {
  role: 'super_admin' | 'admin_empresa' | 'atendente';
  total: number;
  active: number;
  pending: number;
  blocked: number;
}

export interface ManagedUsersMetrics {
  total: number;
  active: number;
  pending: number;
  blocked: number;
  byRole: RoleUsersBreakdown[];
}
```

### 2.3. Persistência PostgreSQL (`userPostgresRepository.getManagedUsersMetrics`)

Como `users.role` e `users.status` são enums em `UPPER CASE` no banco (`user_role` e `user_status`), a query agrupa e conta diretamente no PostgreSQL:

```sql
SELECT
  LOWER(role::text) AS role,
  LOWER(COALESCE(status::text, 'ACTIVE')) AS status,
  COUNT(*)::int AS count
FROM users
WHERE deleted_at IS NULL
  AND role IN ('SUPER_ADMIN'::user_role, 'ADMIN_EMPRESA'::user_role, 'ATENDENTE'::user_role)
GROUP BY role, COALESCE(status::text, 'ACTIVE')
```

O repositório inicializa a estrutura para os 3 perfis na ordem canônica (`['super_admin', 'admin_empresa', 'atendente']`) com contadores zerados, preenche a partir das linhas retornadas pelo `GROUP BY` e calcula os totais globais (`total`, `active`, `pending`, `blocked`).

### 2.4. Persistência JSON (`userJsonRepository.getManagedUsersMetrics`)

Filtra `data.users` onde `!user.deleted_at` e `['super_admin', 'admin_empresa', 'atendente'].includes(user.role.toLowerCase())`, normalizando `(user.status || 'active').toLowerCase()` e produzindo exatamente o mesmo objeto `ManagedUsersMetrics`.

### 2.5. Resposta HTTP (`200 OK`)

```json
{
  "data": {
    "total": 12,
    "active": 9,
    "pending": 2,
    "blocked": 1,
    "byRole": [
      {
        "role": "super_admin",
        "total": 2,
        "active": 2,
        "pending": 0,
        "blocked": 0
      },
      {
        "role": "admin_empresa",
        "total": 6,
        "active": 5,
        "pending": 1,
        "blocked": 0
      },
      {
        "role": "atendente",
        "total": 4,
        "active": 2,
        "pending": 1,
        "blocked": 1
      }
    ]
  }
}
```

---

## 3. Reutilização das Rotas Existentes para Empresas e Vendas

Conforme definido na spec, nenhuma nova rota de backend será criada para empresas ou vendas:
1. **Empresas (`GET /api/v1/platform/companies`):**
   - Já retorna todos os campos necessários em `PlatformCompany`: `id`, `nome`, `cnpj`, `categoria`, `cidade`, `estado`, `status`, `plan_id`, `data_cadastro`, `createdAt`, `deleted_at`.
   - O frontend paginará as empresas (como já faz em `getPlatformCompanyMetrics`) e organizará localmente:
     - **Saúde da Base de Empresas:** contagem de `active`, `inactive`, `archived` e `total`.
     - **Últimas Empresas Registradas:** ordenação decrescente por `Date.parse(company.createdAt || company.data_cadastro || '')` pegando os 5 primeiros registros.
2. **Vendas (`GET /api/v1/platform/sales`):**
   - Já retorna `PlatformSale[]` ordenado por `sold_at DESC, id DESC` com `id`, `companyId`, `companyName`, `planId`, `planName`, `origin`, `amount`, `currency`, `soldAt`.
   - O frontend buscará as páginas de vendas e calculará localmente:
     - **Faturamento no Mês Atual vs. Mês Anterior** (comparando `soldAt` em UTC).
     - **Receita Total Acumulada** (soma de `Number(sale.amount)` e contagem total de vendas).
     - **Últimas Vendas Registradas** (as 5 primeiras vendas retornadas).

