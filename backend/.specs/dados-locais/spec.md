# Persistência local controlada por ambiente

Estado: implementação concluída; entrega pela branch codex/json-postgres-repositories, com PR destinado à staging, em 2026-10-12.

## Decisões confirmadas

- USE_MOCK_DATA=true seleciona JSON; false ou ausência mantém PostgreSQL.
- Abranger empresas, usuários/auth e planos, incluindo gravações existentes.
- Persistir dados cadastrados em disco e recuperá-los após reiniciar.
- No modo local, gravar e-mails em caixa de saída JSON, sem envio externo.
- Disponibilizar comando local para criar o primeiro usuário de teste.
- Manter routes → controller → service e contratos de sucesso/erro.
- Implementações de persistência autorizadas nesta tarefa para a alternância;
  isso substitui o adiamento anterior somente nos módulos envolvidos.
- Não alterar AGENTS.md, frontend, schema ou migrations.
- Não montar o router admin nem corrigir incidentalmente user/users.

## Autorização confirmada

POST /api/v1/empresas exige login com Bearer JWT e role empresa, nos dois modos.
O servidor controla id UUID, data_cadastro ISO, status ativo e verificado=false.
Campos internos e desconhecidos não são aceitos no corpo. Schema comercial e
regras adicionais de CNPJ/tenant continuam separados desta entrega.

## Comportamento

Configuração selecionada na inicialização; mudar a flag exige reinício.
MOCK_DATA_DIR resolve um diretório absoluto ou relativo à raiz do backend.
O JSON começa vazio; não inserir usuários, senhas ou planos automaticamente.
Comando de usuário permite preparar acesso local sem cadastro público.
Coleções users e legacyUsers preservam a divergência observada no SQL atual.

Serializar a operação completa de leitura/alteração/gravação em um processo.
Gravar arquivo temporário no mesmo diretório e substituir o arquivo principal.
Arquivo inválido deve gerar erro sem ser sobrescrito ou tratado como vazio.
Bloqueio de outro processo retorna 409 e é preservado.
Responder sucesso somente após a persistência. Não migrar JSON para o banco
automaticamente ao trocar a flag. Arquivos locais ficam fora do Git.

## Tarefas e aceite

- [x] LOCAL-01: Configurar flag estrita, diretório e armazenamento JSON seguro.
- [x] LOCAL-02: Alternar consultas e gravações de empresas/usuários/auth/planos.
- [x] LOCAL-03: Cadastrar empresa nos dois modos, com autorização confirmada.
- [x] LOCAL-04: Caixa de saída local e comando de criação de usuário.
- [x] LOCAL-05: Validar reinício, concorrência, arquivo inválido, HTTP e regressões.
- [x] LOCAL-06: Atualizar documentação principal e estados das specs afetadas.

## Limites

JSON é destinado a uma instância com disco persistente. Não oferece coordenação
entre réplicas; um bloqueio exclusivo impede sobrescritas entre processos locais.
PostgreSQL continua responsável pela integridade real.
Schema comercial e ciclo de migrations no banco permanecem tarefas separadas.

## Verificação da entrega — 2026-10-12

50 testes de foundation aprovados: 36 regressões existentes e 14 da persistência
local. Typecheck foundation e contratos passaram. TypeScript completo passou
em cópia temporária com dependências Prisma 7.10.0 já disponíveis, sem instalação.
A node_modules da checkout ainda contém CLI 6.12.0; nela o typecheck completo
permanece incompatível com prisma.config.ts. Manifesto/lockfile não foram
alterados para contornar isso. API não utiliza PrismaClient nesta entrega.

Testes cobrem JSON após reinício, concorrência, lock alheio, arquivo inválido,
HTTP real/local simulado, permissões, hash/JWT, reset/outbox, planos e auth/admin.
Sem banco real, e-mail externo, schema/migration, alteração frontend ou commit.
Fonte e documentos principais revisados por subagentes.

## Organização dos repositories — 2026-10-12

Reorganização autorizada na staging, sem commit. Implementações JSON em
src/persistence/json e PostgreSQL em src/persistence/postgres. Arquivos e
exports dos módulos usam repository, como company.repository.ts e
companyJsonRepository. Seletores por ambiente ficam em persistence com
nomes company.repository.ts/user.repository.ts/auth.repository.ts/plan.repository.ts.

As oito implementações mantêm tipagem explícita pelas interfaces existentes
em src/repositories. A reorganização não altera métodos, consultas, validações,
flag, arquivo JSON ou contratos HTTP. Store/schema/outbox são auxiliares JSON;
plan.mapper permanece compartilhado. Imports, testes e documentos relacionados foram atualizados.

Verificação da reorganização: 50 testes de foundation aprovados; typechecks
foundation/contratos passaram. O subagente confirmou as oito implementações
e os quatro seletores tipados pelas interfaces existentes. Sem banco real,
e-mail externo, alteração de schema/dependências, commit ou edição do AGENTS.

## Configuração centralizada — 2026-10-12

A configuração de dados fica exclusivamente em src/shared/config/data.ts:
USE_MOCK_DATA, BACKEND_ROOT, MOCK_DATA_DIR e acesso sob demanda ao Pool real.
Arquivo auxiliar de configuração removido; imports e testes atualizados.
Preservadas a validação estrita da flag, o diretório padrão, a resolução de caminhos,
seleção dos repositories e bloqueio de consultas PostgreSQL no modo local.
Alteração na staging, sem commit e sem editar AGENTS.md.
Verificação: 50 testes de foundation aprovados e typechecks foundation/contratos
concluídos. Nenhum banco real ou e-mail externo utilizado. Também corrigidos
o import do schema de empresas, movido para company.entity.ts, e o await
na comparação de senha do login, necessário para rejeitar senhas incorretas.

## Entrega para revisão — 2026-10-12

Commit e publicação autorizados pelo usuário. Branch codex/json-postgres-repositories
criada a partir da staging atualizada. O PR reúne configuração em data.ts,
repositories JSON/PostgreSQL, cadastro de empresas, bootstrap de usuário,
caixa de saída local, testes e documentação. AGENTS.md fica fora da entrega.
Não há nova tabela ou migration nesta alteração.

Após abrir o PR, preparar cinco empresas e três planos fictícios no JSON local,
preservando registros existentes. Esses dados são exclusivos do ambiente local
e não fazem parte do commit nem representam definição comercial dos planos.
