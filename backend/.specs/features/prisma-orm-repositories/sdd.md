# SDD — Adoção do Prisma ORM e Entrada Única de Persistência

## 1. Topologia de Arquitetura

### 1.1. Comparativo de Estrutura de Arquivos

#### Antes:
```text
backend/src/
├── repositories/                     <-- Contratos TypeScript
│   ├── auth.repository.ts
│   ├── company.repository.ts
│   ├── plan.repository.ts
│   ├── sale.repository.ts
│   ├── storage.repository.ts
│   └── user.repository.ts
└── persistence/
    ├── auth.repository.ts            <-- Seletor USE_MOCK_DATA
    ├── company.repository.ts         <-- Seletor USE_MOCK_DATA
    ├── plan.repository.ts            <-- Seletor USE_MOCK_DATA
    ├── sale.repository.ts            <-- Seletor USE_MOCK_DATA
    ├── storage.repository.ts         <-- Seletor USE_MOCK_DATA
    ├── user.repository.ts            <-- Seletor USE_MOCK_DATA
    ├── json/                         <-- Implementação Mock em arquivos JSON
    │   └── ...
    └── postgres/                     <-- IMPLEMENTAÇÃO SQL PURO (driver pg/neon)
        ├── auth.repository.ts
        ├── company.repository.ts
        ├── plan.repository.ts
        ├── sale.repository.ts
        ├── storage.repository.ts
        └── user.repository.ts
```

#### Depois

```text
backend/src/
├── repositories/                     # Seis contratos TypeScript por domínio
├── persistence/
│   ├── index.ts                      # Seleciona e exporta os seis repositórios
│   ├── postgres/                     # Adaptadores Prisma
│   └── json/                         # Adaptadores locais
└── shared/config/
    └── prisma.ts                     # Singleton do PrismaClient
```

Os services importam os repositórios de `src/persistence/index.ts`. Esse módulo seleciona os adaptadores com `USE_MOCK_DATA` e substitui os seis seletores por domínio. Cada adaptador importa o contrato correspondente de `src/repositories/` como tipo.

## 2. Configuração Centralizada do Prisma Client (`shared/config/prisma.ts`)

Para evitar múltiplas instâncias de conexão e garantir compatibilidade com o PostgreSQL / Neon:

```typescript
import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.USE_MOCK_DATA !== 'true') {
  throw new Error('DATABASE_URL deve ser informada quando USE_MOCK_DATA=false.');
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Singleton global para reuso eficiente de conexões
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 3. Estratégia de Migração dos Repositórios

### 3.1. `company.repository.ts`

O arquivo `src/repositories/company.repository.ts` exporta o contrato abaixo. Os adaptadores de empresa o importam como tipo.
```typescript
export interface CompanyRepository {
  listPlatformCompanies(filters: CompanyListFilters): Promise<{ items: Company[]; total: number }>;
  changeCompanyAdministration(input: CompanyAdministrationChange): Promise<Company>;
  createCompanyWithInitialSale(input: CompanyRegistration): Promise<CompanyRegistrationResult>;
  isImageKeyReferenced(key: string): Promise<boolean>;
  create(company: Company): Promise<Company>;
  getAll(): Promise<Company[]>;
  getById(id: string): Promise<Company | undefined>;
  getVerified(): Promise<Company[]>;
  getByCategory(category: string): Promise<Company[]>;
  getByState(state: string): Promise<Company[]>;
  getBySize(size: Company['tamanho']): Promise<Company[]>;
  searchByName(name: string): Promise<Company[]>;
  searchPublicCompanies(filters: PublicCompanySearchFilters): Promise<Company[]>;
  updateCoverKey(id: string, coverKey: string | null, expectedKey: string | null): Promise<boolean>;
  updateLogoKey(id: string, logoKey: string | null, expectedKey: string | null): Promise<boolean>;
}
```

**Implementação com Prisma ORM:**
- Consultas simples (`getById`, `getAll`, etc.):
  ```typescript
  async getById(id: string) {
    const row = await prisma.companies.findFirst({
      where: { id, deleted_at: null },
    });
    return row ? mapCompanyRowToEntity(row) : undefined;
  }
  ```
- Busca com filtros públicos e paginação (`listPlatformCompanies`):
  ```typescript
  async listPlatformCompanies(filters) {
    const where: Prisma.companiesWhereInput = {
      deleted_at: filters.status === 'archived' ? { not: null } : null,
      ...(filters.q && {
        OR: [
          { name: { contains: filters.q, mode: 'insensitive' } },
          { cnpj: { contains: filters.q, mode: 'insensitive' } },
        ],
      }),
      ...(filters.planId && { plan_id: BigInt(filters.planId) }),
      ...(filters.status && filters.status !== 'archived' && {
        status: filters.status === 'ativo' ? { not: 'INATIVO' } : 'INATIVO',
      }),
    };

    const [total, rows] = await Promise.all([
      prisma.companies.count({ where }),
      prisma.companies.findMany({
        where,
        skip: filters.offset,
        take: filters.pageSize,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
    ]);

    return { total, items: rows.map(mapCompanyRowToEntity) };
  }
  ```

---

## 4. Preservação de Particularidades do PostgreSQL

### 4.1. Concorrência Crítica e Lock Consultivo (`pg_advisory_xact_lock`)

Em operações onde múltiplos administradores podem alterar o mesmo recurso concorrentemente, o sistema utiliza o lock consultivo do PostgreSQL. Com o Prisma, isso é executado dentro de uma transação interativa:

```typescript
return await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('civix:platform-administration', 0))`;

  const actor = await tx.users.findUnique({
    where: { id: input.actorId },
    select: { role: true, status: true, deleted_at: true },
  });

  if (!actor || actor.role !== 'SUPER_ADMIN' || actor.deleted_at || actor.status !== 'ACTIVE') {
    throw new AppError({
      status: 403,
      code: ErrorCode.FORBIDDEN,
      message: 'Acesso administrativo alterado.',
    });
  }

  // Execução atômica da alteração
  const updated = await tx.companies.update({
    where: { id: input.companyId },
    data: { plan_id: input.planId ? BigInt(input.planId) : null },
  });

  return mapCompanyRowToEntity(updated);
});
```

### 4.2. Faixa de Preço (`numrange`)

Como `price_range` é do tipo `numrange` nativo do PostgreSQL (marcado como `Unsupported("numrange")` no schema Prisma):
- Para leitura da faixa (`faixa_preco`), utilizamos a consulta SQL formatada via `prisma.$queryRaw` ou helper nativo já consolidado em `PRICE_RANGE_TO_NUMRANGE`.
- Para escrita da faixa no cadastro de empresas:
  ```typescript
  if (toNumrangeLiteral(input.faixa_preco)) {
    await tx.$executeRaw`
      UPDATE companies
      SET price_range = ${toNumrangeLiteral(input.faixa_preco)}::numrange
      WHERE id = ${company.id}::uuid
    `;
  }
  ```

---

## 5. Fluxo de Dados e Interação

```text
HTTP Request
   │
   ▼
[Routes & Controllers]
   │
   ▼
[Domain Services] (ex: company.service.ts)
   │
   ▼ (importa de src/persistence/index.js)
[src/persistence/index.ts] (chaveia USE_MOCK_DATA)
   ├───► USE_MOCK_DATA=true  ──► [src/persistence/json/company.repository.ts]
   └───► USE_MOCK_DATA=false ──► [src/persistence/postgres/company.repository.ts]
                                      │
                                      ▼
                                [PrismaClient]
                                      │
                                      ▼
                                [PostgreSQL / Neon]
```
