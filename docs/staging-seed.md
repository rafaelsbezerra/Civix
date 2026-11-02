# Seed de staging a partir dos dados locais

Importa companies, plans e users de backend/.local-data/data.json (ou do
diretório MOCK_DATA_DIR). Preserva UUIDs de empresas/usuários, papéis atuais,
vínculos e hashes bcrypt. Não importa tokens de convite/reset, outbox nem
objetos/imagens R2. Não versionar o JSON local ou credenciais.

Decisões confirmadas em 2026-11-02: staging vazio; IDs numéricos de planos
gerados pelo banco, usando slug para reconhecer o plano e traduzir o plan_id
local; planos já inseridos pelas migrations só são reutilizados quando seus
dados comerciais coincidirem integralmente. Divergência interrompe o seed.
Empresas/usuários preexistentes também interrompem, sem sobrescrever.

## Preparação

Aplicar as migrations é uma ação separada, não executada pelo seed.
A migration incremental user_company_scope acrescenta users.company_id, FK
e regras de vínculo: admin_empresa/atendente exigem empresa; super_admin/
cliente não possuem vínculo. Não edita migrations anteriores. Dados antigos
incompatíveis fazem a migration falhar, sem associação inferida.

O script usa pg já instalado e STAGING_DATABASE_URL explicitamente; não usa
DATABASE_URL como fallback. Confirme externamente que a URL pertence a
staging. Seu nome não comprova o ambiente remoto. Não incluir URL em comandos
versionados ou exemplos com credenciais.

## Uso no diretório backend

```powershell
# Prévia local: valida e mostra apenas contagens, sem conectar ao banco
npm run seed:staging

# Arquivo de origem explícito
npm run seed:staging -- --source caminho/para/data.json

# Após preparar as migrations e configurar STAGING_DATABASE_URL no ambiente
npm run seed:staging -- --apply
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
sem conexão ao banco. Revisão independente por final_review em 2026-11-02
conferiu o desenho, SQL e documentação. Testes offline serão registrados
após conclusão. Não houve conexão, importação ou aplicação de migration
em staging nesta entrega.

O TypeScript completo do backend ainda aponta erros em módulos anteriores
(UserId, adapters e imports ausentes de storage/provisionamento). A validação
isolada deste seed será registrada separadamente, sem declarar a base aprovada.
