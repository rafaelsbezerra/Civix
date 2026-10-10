# Avaliação do Prisma e decisão vigente

Análise inicial: 2026-10-09. Status revisado em 2026-10-10.

## Decisão atual

Prisma 7 com migrations SQL nativas e reversão por nova migration inversa.
CLI/client/adapter fixados em 7.10.0 na branch codex/prisma7-foundation,
commit 48eb252, entregue no [PR #8](https://github.com/rafaelsbe/Civix/pull/8).
Tooling implementado separadamente, ainda não integrado à baseline auditada
ou staging e2b3d8b. Não existe nova decisão sobre Prisma 8 aguardando resposta.

O PR registra validate, geração de cliente e diffs SQL de criação/inversão
com fixture isolada, sem banco. O schema comercial permanece vazio; atualizar
pacotes não converte as consultas SQL/Neon nem define o modelo canônico.

## Histórico da decisão

Inicialmente foram avaliadas migrations TypeScript e reversão do Prisma 8.
O usuário aceitou migration inversa no lugar de funções up/down, mas decidiu
aguardar versão estável após a avaliação de releases candidates. Depois
confirmou banco criado do zero, nome users e dependências na versão 7, e
escolheu explicitamente Prisma 7 com SQL nativo. Essa última decisão
substitui a opção Prisma 8 e o bloqueio por espera de versão estável.

O histórico explica as alternativas; não autoriza instalar Prisma 8/RC ou
adotar um runner TS paralelo. Prisma Migrate é o mecanismo aprovado.

## Compatibilidade e verificação registrada

O checkout atual ainda declara CLI ^6.12.0 e client/adapter ^7.10.0. O
TypeScript completo nele permanece bloqueado pela configuração Prisma;
checks isolados do backend foram registrados na adoção HTTP. No worktree
do PR #8, as versões exatas foram alinhadas e o TypeScript completo passou.
Não há runtime Node fixado no projeto; confirmar runtime local/CI antes
quando essa configuração entrar no escopo de implementação.

Os três testes de tooling não executam SQL nem demonstram inicialização,
falha, recuperação ou reversão em PostgreSQL. Nenhuma migration foi aplicada.
Esta auditoria não reexecutou esses testes nem instalou dependências.

## Pendências reais

- Integrar o tooling mantendo as convenções e scripts atuais.
- Definir campos, relações e restrições do schema e destino dos SQL de planos.
- Discutir comandos operacionais após a implementação, como pedido pelo usuário.
- Testar aplicação/reaplicação/status/falha/recuperação e inversa em PostgreSQL
  temporário autorizado; avaliar transações e preservação de dados por mudança.

Referências: [spec atual](spec.md),
[Prisma 7 Migrate](https://docs.prisma.io/docs/orm/v7/prisma-migrate),
[recuperação de falhas](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing).
