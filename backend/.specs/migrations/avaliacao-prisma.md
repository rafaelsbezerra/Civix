# Avaliação inicial do Prisma

Data: 2026-10-09. Somente análise; nenhuma dependência atualizada.
Estado: adoção do Prisma 8 com migration inversa aprovada pelo usuário.
Versão instalável e compatibilidade ainda precisam ser verificadas.

## Situação do projeto

Manifesto e lockfile misturam Prisma CLI 6 com client/adapter 7.
O schema não possui models e não há uso de PrismaClient na aplicação.
As consultas atuais usam SQL/Neon. Atualizar pacotes não converte essas
consultas nem cria automaticamente um modelo canônico.
TypeScript está em modo strict; não existe versão de Node fixada no backend.

## Compatibilidade com o pedido

A [documentação do Prisma 8](https://www.prisma.io/docs/orm/migrations/how-migrations-work)
descreve migrations TypeScript e um fluxo novo de contrato, planejamento e
execução. Algumas capacidades de migrations ainda são indicadas como
iniciais; não há squash nem dry run em shadow database.

A [API de migrations](https://www.prisma.io/docs/orm/reference/migration-api)
usa classes com operações em `migration.ts`, compiladas em `ops.json`.
Isso atende à escrita em TypeScript, mas não é uma API de funções `up/down`.

Segundo a [documentação de reversão](https://www.prisma.io/docs/orm/migrations/rollbacks-and-recovery),
o Prisma 8 não possui `migrate down` ou arquivos down. A reversão adiciona
uma nova migration ao histórico. Portanto, atualização por si só não atende
à exigência literal de `up` e `down` no mesmo script.

O [guia de atualização PostgreSQL](https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql)
exige Node 22.18+ (na linha 24, 24.11+) e TypeScript 5.9+; a atualização
altera configuração, cliente e ownership de migrations. O guia parte de
uma aplicação Prisma 7 funcional, diferente da situação deste projeto.

## Alternativas para decisão

1. Adotar Prisma 8 com migrations TS nativas e reversão por nova migration.
   Exige aprovação para substituir o requisito literal de `up/down` e
   avaliar runtime, configuração, novo cliente e maturidade do fluxo.
2. Manter a exigência literal de `up/down`: escolher runner TS separado,
   com Prisma para acesso/modelo conforme versão aprovada. Exige garantir
   um único histórico de schema e verificar sincronização dos modelos.

Recomendação condicionada: se `up/down` for obrigatório, avaliar a alternativa
2; se a intenção for reversão versionada, avaliar a alternativa 1. Nenhuma
alternativa foi escolhida pelo agente. O usuário escolheu a alternativa 1,
aceitando reversão por nova migration em vez de funções `up/down`.

## Verificação antes de executar

- Confirmar versão alvo e runtime local/CI; alinhar dependências e lockfile.
- Definir modelo mínimo e confirmar se há banco/histórico aplicado.
- Testar geração/tipagem sem banco; testar aplicação, falha e recuperação em
  PostgreSQL temporário. Não declarar compatibilidade só por documentação.
- Registrar runner único, comandos, política de reversão e destino dos SQL.

Não houve instalação de pacotes, conexão de banco ou prova de execução.

## Decisão final de versão

Aguardar Prisma 8 estável. As versões RC consultadas não serão instaladas.
A opção Prisma 8/migration inversa permanece aprovada para futura adoção.

## Decisões de 2026-10-10

Prisma principal 7, banco criado do zero e nome canônico `users` confirmados.
Isso substitui a espera pelo Prisma 8 estável. Campo/vínculos de usuários não
foram definidos apenas pela escolha do nome.

**Aguardando resposta:** fixar CLI/client/adapter exatamente em 7.10.0 e usar
SQL versionado nativo do Prisma Migrate, ou manter TypeScript com runner separado?
Comandos `npm run migrations:apply`, `migrations:show` e `migrations:rollback`
são propostas do usuário para discussão após a implementação, não scripts
existentes nem política de rollback já aprovada.

## Decisão de formato e reversão

Prisma 7 com SQL nativo confirmado. CLI/client/adapter serão fixados em 7.10.0.
Migration concluída é revertida por nova migration inversa; falhas exigem
recuperação/reconciliação separadas. Isso substitui as alternativas anteriores.
