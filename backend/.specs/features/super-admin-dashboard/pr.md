O superadmin precisava de uma área administrativa para operar a plataforma. Esta branch entrega o dashboard protegido e os fluxos de empresas, planos, vendas, equipe empresarial e administradores globais, com os grupos G0 a G7 implementados e a validação local de G8 concluída.

## O que mudou, como e por quê

### Complemento autorizado: logo no cadastro e capa na edição

Reutilizar POST /api/v1/storage/images com multipart (file, module=companies,
resourceId e purpose=logo|cover) e GET /api/v1/storage/images/:imageId/url.
Sem novos buckets, dependências, tabelas ou migrations. Preservar os limites
de 10 MB, PNG/JPG/WEBP e assinatura pública por 300 segundos.

No backend, validar os dois destinos, selecionar logo_key/cover_key e caminho
R2 por purpose, manter compare-and-swap e limpeza independente por imagem.
Consultas de empresa devem apresentar a logo assinada no campo logo já
consumido pelo site, preservando a URL legada quando não há logo_key; a capa
continua em cover_image_url. Chaves internas não são retornadas.

No frontend, o formulário de cadastro permite selecionar somente logo.
Primeiro cadastrar empresa/venda; depois enviar a logo usando o ID retornado.
Na falha do upload, preservar cadastro e venda e permitir reenviar apenas a
imagem. O formulário de edição permite enviar somente capa, em operação
separada da edição dos dados comerciais, com prévia e feedback. Ambos validam
tipo/tamanho no navegador; o backend mantém a validação real do conteúdo.

Implementação concluída em codex/company-images, derivada de
feat/super-admin-dashboard. Ambos os PRs têm staging como destino; integrar
primeiro o dashboard. Até essa integração, o diff cumulativo do PR de imagens
também contém os commits necessários do dashboard. Esta ampliação não cria
migrations, tabelas, dependências ou rotas.

Verificação do complemento: backend foundation 131/131, storage 47/47 e
plataforma 67/67. TypeScript backend/frontend e lint completo frontend
aprovados. Frontend: 84 testes direcionados aprovados (dashboard/guard/imagens
53; API e consumidores existentes 31), incluindo 11 casos novos de imagens.
E2E em Chrome com Vite, Express e JSON reais de teste, substituindo somente o
provedor R2 por armazenamento em memória. Inclui falha sintética de logo,
reenvio sem repetir cadastro/venda e envio de capa mantendo logo, além dos
fluxos anteriores. A primeira execução encontrou timeout no fluxo herdado de
venda manual; a repetição com diagnóstico passou integralmente. Evidências de
imagem inspecionadas. Revisão estática independente aprovada, sem bloqueadores.
R2/PostgreSQL reais continuam sem homologação; nenhuma migration executada.

Os tópicos e números seguintes também registram a validação histórica do
dashboard, anterior ao complemento de imagens.

- Rotas `/api/v1/platform` exigem identidade vigente e super_admin; controllers independentes chamam os módulos existentes. Frontend concentra transporte em `lib/api.ts` e componentes exclusivos em `dashboard-super-admin`.
- Cadastro de empresa e venda inicial usam uma transação/operação repetível. Edição e troca de plano não geram venda; a interface orienta o lançamento manual. Empresas podem ser desativadas, arquivadas, restauradas ainda inativas e reativadas.
- Vendas são imutáveis: lançamento pelo plano atual ou valor manual justificado, snapshots em BRL/UTC e exclusão definitiva. `operation_id` identifica a tentativa por ator e `fingerprint` compara dados normalizados dentro de sales. Vendas manuais removidas não bloqueiam novo lançamento. A tabela de recibos existe somente para o cadastro inicial, para não recriar sua venda ao repetir a operação original.
- Equipe e superadmins reutilizam user.*; convites definem a senha no primeiro acesso, com consumo único e reenvio. Desativação exige motivo; exclusão de atendente é lógica. Transações revalidam ator/alvo e preservam o último superadmin ativo, impedindo também autossuspensão.
- `tokens_revoked_at` revoga todas as sessões afetadas; reativação exige novo login. Instantes de autenticação são capturados antes da leitura/hash e comparados na API. Reenvios revalidam revogação/elegibilidade dentro da gravação, evitando recolocar convites antigos.
- Layout exclusivo, temas claro/escuro persistidos no navegador, perfil de nome/e-mail, confirmações acessíveis e listas paginadas. Senha no perfil, billing, trial, limites por plano e configurações globais continuam em backlog.

## Validação

- Backend: foundation 124/124, plataforma 67/67, seed 40/40, Prisma tooling offline 3/3; TypeScript aprovado.
- Frontend: 55 testes direcionados, TypeScript e lint aprovados. Suíte completa atual: 176 aprovados e 11 falhas herdadas em App, About/assets, rotas públicas, Hero e ActionButton.
- `npm run test:e2e:super-admin` aprovado em Chrome headless, com API real e JSON sintético temporário. Fluxos comerciais, convites, revogação, perfis, exclusão/restauração e navegação móvel verificados. Processos/fixture encerrados no finally.
- Build: TypeScript e bundle Vite passam; gate final existente de About falha por `dashboard.png` ausente no manifest. Não declarar build/suíte completa aprovados.
- Revisões secundárias backend, UI e documentação realizadas. PostgreSQL e R2 reais não foram homologados; testes SQL usam conexão simulada. Nenhuma migration foi aplicada automaticamente.

## Migrations e SQL

As migrations originais anteriores a create_images foram preservadas. Users já existe no banco: seus novos campos entram por ALTER incremental. Revisar o histórico do ambiente e aplicar somente as migrations pendentes em ordem.

### 20261102000200_company_administration

[Migration versionada](https://github.com/rafaelsbe/Civix/blob/feat/super-admin-dashboard/backend/prisma/migrations/20261102000200_company_administration/migration.sql)

```sql
BEGIN;
ALTER TABLE companies ADD COLUMN plan_id BIGINT REFERENCES plans(id);
ALTER TABLE companies ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN deactivation_reason TEXT;
ALTER TABLE companies ADD COLUMN deactivated_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN deactivated_by UUID REFERENCES users(id);
ALTER TABLE companies ADD CONSTRAINT companies_deactivation_reason_check
  CHECK (deactivation_reason IS NULL OR length(trim(deactivation_reason)) > 0);
CREATE INDEX companies_plan_id_idx ON companies (plan_id);
COMMIT;
```

### 20261102000300_create_sales

[Migration versionada](https://github.com/rafaelsbe/Civix/blob/feat/super-admin-dashboard/backend/prisma/migrations/20261102000300_create_sales/migration.sql)

```sql
BEGIN;
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id),
  plan_id BIGINT REFERENCES plans(id),
  origin TEXT NOT NULL CHECK (origin IN ('company_creation', 'manual')),
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('company_plan', 'manual_amount')),
  plan_name TEXT,
  plan_price NUMERIC(12,2),
  plan_billing_period TEXT CHECK (plan_billing_period IN ('monthly', 'yearly', 'one_time')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  description TEXT,
  sold_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  operation_id UUID,
  fingerprint TEXT CHECK (fingerprint IS NULL OR fingerprint ~ '^[0-9a-f]{64}$'),
  CHECK ((operation_id IS NULL) = (fingerprint IS NULL)),
  CHECK (pricing_mode <> 'manual_amount' OR description IS NOT NULL AND length(trim(description)) > 0),
  CHECK (pricing_mode <> 'company_plan' OR plan_id IS NOT NULL AND plan_name IS NOT NULL
    AND plan_price IS NOT NULL AND plan_billing_period IS NOT NULL AND amount = plan_price)
);
CREATE UNIQUE INDEX sales_initial_company_key ON sales (company_id) WHERE origin = 'company_creation';
CREATE INDEX sales_company_id_idx ON sales (company_id);
CREATE UNIQUE INDEX sales_manual_operation_key ON sales (created_by, operation_id) WHERE operation_id IS NOT NULL;
CREATE TABLE company_registration_operations (
  actor_id UUID NOT NULL REFERENCES users(id),
  operation_id UUID NOT NULL,
  fingerprint TEXT NOT NULL CHECK (length(fingerprint) = 64),
  company_id UUID NOT NULL REFERENCES companies(id),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (actor_id, operation_id)
);
COMMIT;
```

### 20261102000400_user_administration

[Migration versionada](https://github.com/rafaelsbe/Civix/blob/feat/super-admin-dashboard/backend/prisma/migrations/20261102000400_user_administration/migration.sql)

```sql
BEGIN;

ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN deactivation_reason TEXT;
ALTER TABLE users ADD COLUMN tokens_revoked_at TIMESTAMPTZ;

COMMIT;
```

## Próximos passos

As duas branches estão publicadas, mas as tentativas de criar seus PRs para
staging pelo conector GitHub retornaram 404 (a busca retornou 422 por falta de
visibilidade/permissão). Nenhum PR foi criado nesta execução. Liberar o acesso
ao repositório na conexão ou usar os links de abertura preparados:

- [Dashboard → staging](https://github.com/rafaelsbe/Civix/compare/staging...feat/super-admin-dashboard?expand=1)
- [Imagens → staging](https://github.com/rafaelsbe/Civix/compare/staging...codex/company-images?expand=1)

Revisar o PR para staging, aplicar as migrations pendentes pelo responsável no ambiente autorizado e homologar PostgreSQL/R2 reais. Tratar separadamente as falhas herdadas do site público/build antes de considerar todos os gates aprovados. Não fazer merge ou implantação automaticamente.
