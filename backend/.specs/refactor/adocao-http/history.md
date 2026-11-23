# Histórico documental e verificações

## Histórico da extração/API

## Histórico da extração

A extração anterior preservou envelopes legados. Esta adoção substitui essa
restrição em usuários, auth/admin, empresas, planos, root e middleware.
A adoção HTTP foi integrada em staging bedb73a. O registro inicial de
2026-10-12 descrevia o modo local ainda sem commit; depois ele foi publicado
pelo PR #16, incluindo adapters e uso das interfaces nos módulos atuais.
A branch de integração frontend depende desse PR, sem afirmar merge.
Paginação permanece sob demanda; schema segue pendente.

Registro histórico da adoção HTTP: 36 testes e typechecks isolados aprovados.
A integração atual registrou 25 testes direcionados frontend e 60 backend,
typechecks frontend/foundation/contratos e Vite aprovados. Build completo e
lint continuam com falhas históricas; detalhes em operacao.md.

## Extração e evolução dos tipos auth

A extração inicial preservou rotas, consultas, regras e respostas. A adoção
posterior de envelopes HTTP e AppError já está integrada em staging bedb73a,
[documentada na spec de adoção](spec.md).
Regras estão em auth.service.ts/admin.service.ts; SQL fica nos adapters PostgreSQL e o modo local usa JSON. Admin permanece sem montagem.

Verificação: `tsc -p tsconfig.foundation.json` executado no backend sem erros,
utilizando as dependências locais existentes. Nenhuma dependência foi
instalada e nenhuma consulta foi executada contra banco de dados.

## Evolução do convite — 2026-10-12

Na branch codex/frontend-backend-integration, dependente do PR #16,
validateToken retorna email após verificar o mesmo convite aceito por
firstAccess. Nenhuma entidade/tabela nova ou alteração de schema.
A entrega registrou 60 testes direcionados backend e typechecks
foundation/contratos aprovados; não houve banco real ou envio externo.

## Verificação da adoção — 2026-10-10

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Na entrega original, o typecheck completo estava bloqueado por TS2353 em prisma.config.ts (CLI 6/configuração 7); esse bloqueio foi corrigido pelo tooling Prisma 7 integrado posteriormente. Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.

## Verificação da resolução dos PRs #13/#14/#15 — 2026-10-10

A staging 7b976d7 foi conciliada com a adoção HTTP e o tooling Prisma 7.
Validação em cópia temporária dos arquivos do backend, reutilizando as
dependências 7.10.0 já instaladas: test:foundation (36 testes), test:prisma
(3 testes), typecheck:foundation, typecheck:contracts e TypeScript completo
(--noEmit) passaram. Os arquivos executáveis, testes e configuração são
iguais nas três branches; suas diferenças são documentais. Nenhum pacote
foi instalado, banco real acessado, e-mail enviado ou migration aplicada.
Na resolução original, os merges ficaram a cargo do usuário. Posteriormente,
PR #13 foi integrado em 8548c2b e PR #14 em bedb73a. A adoção backend e a
revisão documental já estão na staging atual; frontend consumidor permanece
pendente. Não é necessário reaplicar os commits compartilhados do PR #15.

## Contexto original da execução HTTP

Nenhuma dependência, tabela ou migration foi alterada por esta adoção.
Nesse registro histórico da adoção HTTP, repositories continha apenas
interfaces e SQL permanecia nos services; frontend não havia sido adaptado.
O PR #16 substituiu esse estado de persistência, e a integração atual adapta
consumidores existentes, exceto login. Executar ambos não comprova por si só
compatibilidade completa.
Os 27 testes acima são históricos; a suíte ampliada atual passou com 36 testes. O bloqueio anterior do typecheck completo foi corrigido pela integração do tooling Prisma 7.

## Verificação da adoção — 2026-10-10 — registro 2

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Na entrega original, o typecheck completo estava bloqueado por TS2353 em prisma.config.ts (CLI 6/configuração 7); o tooling Prisma 7 integrado da staging corrigiu esse bloqueio. Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.

## Evolução da adoção HTTP

A restrição inicial sem adoção é histórica. Não duplicar success, plan ou
plans no envelope. A adoção backend já está integrada em staging bedb73a.
Repositories foram adotados no modo local autorizado de 2026-10-12; paginação
permanece sob demanda. Incompatibilidades do frontend constam em api.md.

## Registro arquitetural da adoção

A adoção HTTP está integrada em staging bedb73a. O modo local de 2026-10-12
antecipou uso de repositories nos módulos atuais, sem commit. Ver o
[guia de dados locais](../../../docs/dados-locais.md). Paginação permanece sob demanda.
Schema e baseline continuam pendentes; não há aplicação comprovada no banco.
