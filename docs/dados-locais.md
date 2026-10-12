# Dados locais persistidos em JSON

Implementado em 2026-10-12; entrega pela branch codex/json-postgres-repositories, com PR destinado à staging.

## Organização dos repositories

As interfaces permanecem em backend/src/repositories. Suas implementações
ficam separadas por armazenamento, usando domínio.repository.ts:

```text
backend/src/
  repositories/
    company.repository.ts
    user.repository.ts
    auth.repository.ts
    plan.repository.ts
  persistence/
    company.repository.ts
    user.repository.ts
    auth.repository.ts
    plan.repository.ts
    plan.mapper.ts
    json/
      company.repository.ts
      user.repository.ts
      auth.repository.ts
      plan.repository.ts
      local.data.ts
      local.store.ts
      mail.outbox.ts
    postgres/
      company.repository.ts
      user.repository.ts
      auth.repository.ts
      plan.repository.ts
```

Os arquivos na raiz de persistence selecionam os repositories pela flag.
Services importam companyRepository/userRepository/authRepository/planRepository;
as implementações usam nomes como companyJsonRepository e companyPostgresRepository.
As oito implementações e os quatro seletores mantêm tipagem explícita pelas
interfaces existentes, sem duplicar contratos ou introduzir classes/factories.

Exemplo: [interface CompanyRepository](../backend/src/repositories/company.repository.ts),
[JSON](../backend/src/persistence/json/company.repository.ts),
[PostgreSQL](../backend/src/persistence/postgres/company.repository.ts) e
[seletor](../backend/src/persistence/company.repository.ts).
local.store.ts, local.data.ts e mail.outbox.ts são auxiliares exclusivos de JSON;
plan.mapper é compartilhado. A seleção dos repositories não altera a flag. A atualização posterior de
identidade modifica os JSONs antigos para reunir os usuários em users.

## Configuração e seleção

No backend, configure as variáveis no seu arquivo .env:

```env
USE_MOCK_DATA=true
MOCK_DATA_DIR=./.local-data
JWT_SECRET=substitua_por_um_segredo_local
JWT_INVITE_SECRET=substitua_por_outro_segredo_local
JWT_RESET_SECRET=substitua_por_outro_segredo_local
FRONTEND_URL=http://localhost:5173
```

A configuração fica centralizada em
[data.ts](../backend/src/shared/config/data.ts): leitura da flag, raiz do backend,
diretório JSON e acesso sob demanda ao Pool PostgreSQL. Repositories, store,
serviços e scripts importam desse mesmo módulo, sem arquivo auxiliar de configuração.

A flag aceita exatamente true ou false; ausente equivale a false. Valor inválido
interrompe a inicialização. Alterar a flag ou o diretório exige reiniciar a API.

- true: empresas, usuários, auth e planos usam JSON; e-mails vão para a caixa
  de saída local. Não são executadas consultas PostgreSQL ou envios Resend.
- false: esses módulos usam PostgreSQL e e-mail real, com as variáveis já
  documentadas em [operação](operacao.md). Nenhum JSON local é consultado.

MOCK_DATA_DIR relativo é resolvido contra a raiz do backend, mesmo se o processo
for iniciado em outro diretório. O caminho padrão é backend/.local-data/data.json.
Essa pasta está no .gitignore. Um diretório personalizado também deve ficar fora
do versionamento. DATABASE_URL e credenciais Resend não são necessárias no modo
local; JWT_SECRET continua necessário para login e rotas protegidas.

Não há conversão ou sincronização automática de JSON para PostgreSQL.

## Preparar o primeiro acesso local

No diretório backend:

```powershell
npm run mock:user:create
npm run dev
```

O primeiro comando solicita e-mail, perfil (empresa ou cliente), nome opcional
e senha para perfil empresa (mínimo de oito caracteres). Apenas o hash bcrypt
é persistido. O usuário é criado em users; não é criado um cadastro público.
Duplicidade do mesmo e-mail/perfil retorna conflito, sem sobrescrever o registro.

O arquivo começa com coleções vazias; não são inseridos dados comerciais ou
senhas padrão. O comando cria a estrutura para depois cadastrar empresas pela API.

Para obter o token, use POST /api/v1/users/login com email, role e password
quando role=empresa. O token está em data.token. O fluxo de login cliente por
e-mail e as demais regras existentes foram preservados.

## Cadastrar empresa em qualquer modo

POST /api/v1/empresas exige Authorization: Bearer com token de login válido
e role empresa. O mesmo endpoint grava JSON ou PostgreSQL conforme a flag.

Exemplo de corpo aceito, verificado pelos testes:

```json
{
  "nome": "Empresa de demonstração",
  "cnpj": "cnpj-de-teste",
  "descricao": "Resumo",
  "descricao_detalhada": "Descrição completa",
  "categoria": "Obras",
  "cidade": "Fortaleza",
  "estado": "CE",
  "tamanho": "media"
}
```

O cadastro preserva os nomes atuais em português/snake_case; não aprova um
novo schema comercial. CNPJ é uma string não vazia, sem validação de dígitos
verificadores ou regra nova de unicidade nesta entrega.

Campos opcionais: logo, endereco, telefone, email, website, whatsapp,
descritivo e tone. Campos desconhecidos são rejeitados. O servidor gera id UUID,
data_cadastro ISO, status ativo e verificado=false; não aceite esses quatro
campos na entrada. Os valores de tamanho são pequena, media e grande.

A resposta é 201 com { data: Company }, somente após a gravação.
Sem token/identidade: 401; outro perfil: 403; corpo inválido: 400.
Falhas usam AppError e o handler global. GETs de catálogo passam a consultar
os registros gravados, incluindo filtros, busca e detalhe.

Em PostgreSQL, o INSERT utiliza campos permitidos e parâmetros. Esta entrega
não cria tabela nem valida um banco real; a tabela empresas e suas colunas
precisam existir. Schema e baseline seguem pendentes.

O dashboard/formulário não foi implementado nesta tarefa. A integração
posterior de consumidores existentes adapta os envelopes, exceto login
explicitamente excluído; ver [integração frontend/backend](frontend-backend.md).

## Coleções e fluxos existentes

data.json contém version=1 e estas coleções:

| Coleção | Uso |
| --- | --- |
| companies | Catálogo e novos cadastros |
| users | Login, convite/primeiro acesso, recuperação/redefinição e vínculo de plano |
| plans | Linhas de plano com billing_period/is_active/display_order |
| outbox | E-mails locais, com id, kind, email, url e createdAt |

Usuários/auth e seleção de plano persistem suas atualizações pelo mesmo store.
Plans começa vazio. Sem endpoint de cadastro de planos, prepare os registros
manualmente com o backend parado, mantendo o formato de PlanRow e a estrutura
completa do JSON. Exemplo de registro local de teste:

```json
{
  "id": "plano-local",
  "name": "Plano de demonstração",
  "slug": "demonstracao",
  "description": "Dados de teste",
  "price": "10.00",
  "billing_period": "monthly",
  "features": [],
  "limits": {},
  "is_featured": false,
  "is_active": true,
  "display_order": 1
}
```

GET /api/v1/plans retorna somente ativos; POST /api/v1/plans/selection mantém
a autorização empresa e grava plan_id no usuário. A saída pública continua
mapeada para camelCase, com id e price como strings.

Na recuperação, outbox guarda o link que contém o token; users armazena seu
hash e expiração. Esses arquivos contêm informações privadas de teste e não
devem ser publicados. A caixa local não possui endpoint público.

Na branch codex/json-postgres-repositories, users é a única coleção de
identidade; status e invite_token são opcionais para os registros que não
passaram pelo convite. JSONs antigos são modificados explicitamente: reunir
os registros de legacyUsers em users, preservar campos e demais coleções e
remover legacyUsers. Não há conversão automática na leitura. O formato raiz
é estrito e rejeita coleções antigas inesperadas, preservando o arquivo.
Se houver IDs ou contas duplicadas, não sobrescrever dados: pedir orientação
antes de escolher qual registro manter.

Login bloqueia contas pending com 401; usuários atuais sem status continuam
autenticando pelas regras existentes. Convites não substituem contas ativas
ou atuais sem status. A ativação identifica a conta por ID, preservando seus
demais campos.

Os protocolos de convite/reset continuam distintos. O router admin permanece
sem montagem; esta entrega não cria um endpoint público de convite.

## Integridade e limites

Leitura, alteração e gravação são serializadas por uma fila no processo.
A escrita usa arquivo temporário no mesmo diretório, sincroniza o conteúdo
e substitui data.json. JSON inválido gera erro e permanece intacto.

data.lock impede gravações simultâneas por processos diferentes: quem não
conseguir adquirir o bloqueio recebe 409 e pode tentar novamente. A operação
não remove o bloqueio de outro processo. Após uma interrupção abrupta, pode
sobrar data.lock: confirme que não há processo usando os dados antes de
removê-lo manualmente. Leituras continuam usando o último JSON completo.

Use este modo com uma instância local e disco persistente. Não foi preparado
para múltiplas réplicas, disco efêmero ou concorrência de um banco de produção.
Trocar a flag não transfere dados e não substitui migrations.

## Verificação

npm run test:local usa diretório temporário próprio e simuladores de banco/e-mail.
Cobre reinício em outro processo, cadastro HTTP nos dois modos, permissões,
validação, senha/hash/JWT, recuperação, caixa de saída, plano, convite/ativação,
gravações concorrentes, bloqueio alheio e arquivo inválido.

npm run test:foundation também inclui esses testes. Seu runner define false
para as suítes SQL simuladas; a suíte local seleciona true no próprio processo.
Assim, o .env do desenvolvedor não altera o modo das suítes.

Resultados da entrega anterior à unificação de users: 50 testes de foundation,
incluindo 14 do modo local, e typechecks
foundation/contratos aprovados. TypeScript completo validado em fixture com
Prisma 7.10.0; a instalação desta checkout ainda possui CLI 6.12.0, sem
alteração ou instalação de dependências nesta tarefa.

Referências: [spec](../backend/.specs/dados-locais/spec.md),
[API](api.md) e [pendências atuais](revisao-pendencias-specs.md).

## Verificação da unificação de users — 2026-10-12

58 testes de foundation aprovados e typechecks foundation/contratos passaram.
O code review independente exigiu proteger reconvites contra ativação concorrente;
a correção e os testes correspondentes foram revisados e aprovados antes da entrega.
Na entrega da unificação, os protocolos de tokens e o schema/banco real
continuavam pendentes. A integração posterior alinha convite/ativação;
reenvio/reset divergente e schema permanecem pendentes.

O JSON local anterior estava ausente. Por confirmação do usuário, foi recriado
com cinco empresas e três planos fictícios, users vazio e sem legacyUsers.
Os registros de demonstração permanecem fora do Git. Reinicie o backend para
carregar as alterações; use mock:user:create para preparar um usuário local.

## Consumo no frontend — 2026-10-12

Na integração posterior, catálogo/perfil/planos, recuperação/reset e primeiro
acesso leem data/message com configuração comum. USE_MOCK_DATA continua
exclusivamente no backend; falhas da API não são substituídas por mocks do
frontend. A pré-validação do convite usa o mesmo token/identidade/status da
ativação, enquanto reenvio ainda possui protocolo divergente.
Login foi excluído e permanece incompatível; não há dashboard/cadastro novo.
Ver [integração frontend/backend](frontend-backend.md).
