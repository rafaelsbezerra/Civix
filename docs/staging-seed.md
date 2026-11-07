# Seed e Reset do banco de dados a partir dos dados locais

Importa `companies`, `plans` e `users` de `backend/.local-data/data.json` (ou do
diretório `MOCK_DATA_DIR`). Preserva UUIDs de empresas/usuários, papéis atuais,
vínculos, faixas de preço (`price_range`), timestamps (`created_at`, `updated_at`),
enums de status em UPPER CASE (`user_status` e `company_status`) e hashes bcrypt.
Não importa tokens de convite/reset, outbox nem objetos/imagens R2. Não versionar
o JSON local ou credenciais.

O script de **reset** (`backend/scripts/reset.database.ts`) executa a limpeza das
tabelas de negócio (`TRUNCATE TABLE sales, company_registration_operations, images, users, companies, plans RESTART IDENTITY CASCADE`)
dentro de uma transação, preservando o schema e a tabela `_prisma_migrations`.

## Preparação

Aplicar as migrations é uma ação separada, não executada pelo seed nem pelo reset.
Toda vez que uma nova migration alterar o schema (colunas, constraints, tabelas ou enums),
os scripts `backend/scripts/lib/staging.seed.ts` e `backend/scripts/lib/database.reset.ts`
devem ser atualizados em conjunto.

Os scripts usam `pg` já instalado e leem as variáveis de banco configuradas no `.env`
(`DATABASE_URL` ou `STAGING_DATABASE_URL`).

## Uso no diretório backend

```powershell
# Prévia local do seed: valida e mostra apenas contagens, sem conectar ao banco
npm run seed

# Arquivo de origem explícito
npm run seed -- --source caminho/para/data.json

# Aplicar seed no banco configurado no .env (DATABASE_URL / STAGING_DATABASE_URL)
npm run seed -- --apply

# Prévia do reset: lista as tabelas que serão limpas, sem conectar ao banco
npm run reset:db

# Executar o reset das tabelas de negócio no banco configurado no .env
npm run reset:db -- --apply
```

--apply grava dados; criar o script não significa que essa execução foi
realizada. Prévia não comprova schema/credenciais do destino. USE_MOCK_DATA
não governa o seed, que lê JSON diretamente e usa conexão própria ao aplicar.

## Consistência e limites

Valida o snapshot e os campos exigidos pelo PostgreSQL antes de conectar.
O seed recusa chaves de capa/logo ou imagens locais, pois importação de
metadados sem objetos R2 não entregaria arquivos funcionais. Contas pendentes
de convite são recusadas: tokens descartados não permitiriam primeiro acesso.
O script nunca cria senha padrão, promove papéis ou envia e-mails.

No banco, verifica coluna de vínculo, exige empresas/usuários vazios e
bloqueia escritas concorrentes nas três tabelas durante a transação. Planos
vêm primeiro, depois empresas e usuários. Falha executa rollback; nenhuma
reescrita de arquivo local, truncamento ou alteração de schema é feita.
Reexecutar após sucesso interrompe porque já existem empresas/usuários.
Valores comerciais são copiados, inclusive preço zero local: a regra futura
de planos pagos do dashboard não é implementada por este seed.

Os dados são enviados somente pela execução explícita de --apply. Não logar
hashes, e-mails, tokens, parâmetros SQL ou URL de conexão.

## Verificação

Prévia executada com a origem local: 3 planos, 5 empresas e 1 usuário,
sem conexão ao banco. Os 40 testes de npm run test:seed passaram com conexão
substituta, incluindo mapeamento BIGINT sem perda de precisão, validações,
igualdade dos planos, rollback e descarte de tokens. TypeScript strict
isolado do CLI, biblioteca e teste passou. git diff --check aprovado.
Revisão independente por final_review em 2026-11-02 liberou o commit limitado
após conferir código, SQL, testes e documentação. Não houve conexão,
importação ou aplicação de migration em staging nesta entrega.

O TypeScript completo do backend ainda aponta erros em módulos anteriores
(UserId, adapters e imports ausentes de storage/provisionamento). A aprovação
isolada deste seed não significa aprovação do typecheck completo da base.
