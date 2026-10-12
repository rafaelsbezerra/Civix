# Histórico documental e verificações

## Tooling Prisma 7 e resolução de conflitos — 2026-10-10

Os PRs #7/#8 incorporam staging e2b3d8b sem reintroduzir nomes/camadas antigas.
CLI/client/adapter permanecem fixados em 7.10.0. test:foundation mantém
contratos, empresas e usuários; test:prisma executa três verificações offline
em tests/prisma.tooling.test.mjs (validate/generate, SQL de criação/inversão e pins).
A incompatibilidade de tipos CLI6/configuração7 descrita acima é histórica:
essa branch alinha os pacotes. Verificações desta resolução: 27 testes de foundation e três testes offline
Prisma aprovados; typecheck:foundation, typecheck:contracts e TypeScript
completo passaram. Os registros anteriores permanecem históricos.

Schema comercial, baseline completa, comandos migrations:apply/show/rollback
e ciclo em PostgreSQL continuam pendentes. SQL de planos não foi alterado.
Não executar migrations automaticamente nem contra produção/remoto.
Na resolução original, os PRs ficaram abertos para merge pelo usuário. O tooling já entrou em staging via PR #7 (eea5f1d).

## Prisma e próximos passos

O alvo aprovado é Prisma 7/SQL nativo com migration inversa. Este checkout
fixa CLI/client/adapter em 7.10.0; tooling integrado da staging.
Schema comercial e baseline de banco vazio continuam pendentes.
Pendências atuais: frontend consumidor, schema canônico, baseline e prova de migrations em PostgreSQL. Auth/admin agora possuem services.
