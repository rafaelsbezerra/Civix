# Avaliação do Prisma e decisão vigente

Análise inicial: 2026-10-09. Status revisado em 2026-10-10.

## Decisão atual

Prisma 7 com migrations SQL nativas e reversão por nova migration inversa.
CLI/client/adapter fixados em 7.10.0 na branch codex/prisma7-foundation,
entregue nos PRs #7/#8 e integrado à staging pelo PR #7 em eea5f1d.
Tooling presente na staging atual bedb73a. Não existe nova decisão sobre Prisma 8 aguardando resposta.

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

O checkout atual fixa CLI/client/adapter em 7.10.0. O bloqueio anterior de
TypeScript pela configuração Prisma/CLI 6 é histórico; o tooling alinhado
passou no TypeScript completo. Checks isolados foram registrados na adoção HTTP.
Não há runtime Node fixado no projeto; confirmar runtime local/CI antes
quando essa configuração entrar no escopo de implementação.

Os três testes de tooling não executam SQL nem demonstram inicialização,
falha, recuperação ou reversão em PostgreSQL. Nenhuma migration foi aplicada.
Esta auditoria não reexecutou esses testes nem instalou dependências.

## Pendências reais

- Definir campos, relações e restrições do schema e destino dos SQL de planos.
- Discutir comandos operacionais após a implementação, como pedido pelo usuário.
- Testar aplicação/reaplicação/status/falha/recuperação e inversa em PostgreSQL
  temporário autorizado; avaliar transações e preservação de dados por mudança.

Referências: [spec atual](spec.md),
[Prisma 7 Migrate](https://docs.prisma.io/docs/orm/v7/prisma-migrate),
[recuperação de falhas](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing).
