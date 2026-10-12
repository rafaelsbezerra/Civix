# Execução e infraestrutura

## Preparação local

Há manifests na raiz, frontend e backend, sem workspaces. Para reproduzir
os caminhos diretamente associados às configurações de cada aplicação,
os comandos abaixo usam os diretórios frontend/backend. Não foram
executados nesta revisão; não representam um setup comprovadamente verde.

```powershell
# Backend, em um terminal
cd backend
npm ci
Copy-Item .env.example .env
# Preencher apenas valores locais válidos no .env
npm run dev

# Frontend, em outro terminal a partir da raiz do repositório
cd frontend
npm ci
npm run dev
```

Backend usa PORT ou 3000. O proxy Vite encaminha `/api` para localhost:3000.
O pool exige DATABASE_URL e as tabelas esperadas pelos services/controllers.
As migrations atuais não criam essas tabelas integralmente. Portanto,
não há procedimento de provisionamento de banco vazio validado.
Não executar o SQL histórico do Notion como substituto de migrations.

## Variáveis observadas

USE_MOCK_DATA=true seleciona armazenamento e caixa de saída locais; false
ou ausência mantém PostgreSQL/Resend. MOCK_DATA_DIR define o diretório JSON.
Preparação e limites: [modo local](dados-locais.md). Não execute npm ci nem
altere o .env automaticamente como parte dos testes.

| Variável | Uso atual |
| --- | --- |
| USE_MOCK_DATA | true usa JSON; false ou ausência usa PostgreSQL/Resend |
| MOCK_DATA_DIR | Diretório absoluto ou relativo à raiz do backend |
| DATABASE_URL | Conexão Neon no modo real e configuração Prisma |
| PORT | Porta backend, default 3000 |
| JWT_SECRET | Assinatura/verificação do access token |
| JWT_INVITE_SECRET | Convite, pré-validação e ativação; código ainda tem fallback fixo |
| JWT_RESET_SECRET | Reenvio legado; ausente do .env.example |
| FRONTEND_URL | Links de e-mail; não controla o CORS atual |
| RESEND_API_KEY | Cliente de e-mail Resend |
| MAIL_FROM | Remetente configurado/verificado |
| VITE_API_URL | Origem pública do backend para os helpers atuais; valor anterior com /api/v1 aceito; login excluído mantém configuração antiga |

API_BASE_URL, BREVO_API_KEY, SENDER_EMAIL e SENDER_NAME aparecem no
exemplo, mas não têm uso encontrado no fluxo ativo revisado.
Variáveis VITE são públicas e não devem conter segredos.
O .env backend não configura automaticamente o ambiente de build frontend.

Fonte: [.env.example](../backend/.env.example),
[mail.service](../backend/src/services/mail.service.ts) e
[vite.config](../frontend/vite.config.ts).

## Comandos de verificação disponíveis

No frontend: `npm test`, `npm run lint`, `npm run build`,
`npm run test:e2e`. Build executa TypeScript, Vite e verificação de assets
de Sobre. O script e2e é específico de Sobre, não uma suíte completa do SaaS.
No backend, confira package.json: há scripts de testes de contratos/usuários/base
e typechecks; não presumir lint/build. A validação da adoção consta na entrega.
O start do manifest frontend aponta `backend/src/server.ts` relativo ao
frontend, caminho que não corresponde à estrutura atual.

## Infraestrutura prevista versus comprovada

Notion menciona Hostinger, Neon, GitHub Actions, Auth0 e possibilidade de
Cloudflare R2. O código mostra conexão Neon, e-mail Resend e workflows
incompletos. Não foram encontrados Dockerfiles, Compose, IaC, configuração
de deploy, backup/restore, monitoramento, gestão de segredos ou workflow
n8n exportado. Nenhum ambiente remoto, banco ou provedor foi alterado.
Hostinger/R2/Auth0 não foram verificados externamente.

## Validação histórica da revisão inicial

- Commit local e remoto de staging conferidos: `5db3c5b`.
- Código de entrada, routers, controllers, services, schema/migrations,
  manifests, configs, UI/consumidores e specs locais examinados.
- Documentação acessível do Notion lida e preservada com origem e data.
- Revisão de referências e integridade dos arquivos docs realizada.

Não há node_modules nos diretórios das aplicações. Testes, lint, build,
browser e consultas ao banco não foram executados. Os achados são
estáticos; não se afirma aprovação de execução ou disponibilidade do
produto. Relatórios históricos de PASS foram lidos apenas como fontes.

## Validação histórica da extração de usuários e repositories

No backend, npm run test:users verifica login, recuperação, reset e rotas
protegidas com persistência/e-mail simulados. npm run test:foundation reúne
contratos, empresas e usuários: 27 testes passaram.
npm run typecheck:foundation cobre src, servidor, interfaces e esses testes
sem incluir prisma.config.ts. Na extração inicial, CLI6/configuração7 ainda
causava incompatibilidade; esse bloqueio foi corrigido pelo tooling Prisma 7.
Nenhuma dependência nova ou acesso externo naquela extração.

Na extração histórica, repositories continha apenas interfaces e SQL ficava
nos services. A entrega posterior do PR #16 criou/adotou os adapters
JSON/PostgreSQL; SQL fica em persistence/postgres. Nenhuma migration aplicada.

## Execução da adoção HTTP

`src/app.ts` exporta a aplicação Express sem abrir porta; `src/server.ts`
inicia a escuta. Testes podem importar app e abrir uma porta local temporária,
com banco/e-mail simulados, sem iniciar o servidor de produção. Routers são
seguidos pelo 404 global e pelo handler de erros. Admin continua desmontado.

NODE_ENV exatamente production limita erros a status/message; staging, test
e demais valores permitem stack/details/code sanitizados. requestId é opcional
quando recebido pelo contexto, sem geração automática nesta etapa.

Nenhuma dependência, tabela ou migration foi alterada por esta adoção.
Nesse registro histórico da adoção HTTP, repositories continha apenas
interfaces e SQL permanecia nos services; frontend não havia sido adaptado.
O PR #16 substituiu esse estado de persistência, e a integração atual adapta
consumidores existentes, exceto login. Executar ambos não comprova por si só
compatibilidade completa.
Os 27 testes acima são históricos; a suíte ampliada atual passou com 36 testes. O bloqueio anterior do typecheck completo foi corrigido pela integração do tooling Prisma 7.


## Verificação da adoção — 2026-10-10

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Na entrega original, o typecheck completo estava bloqueado por TS2353 em prisma.config.ts (CLI 6/configuração 7); esse bloqueio foi corrigido pelo tooling Prisma 7 integrado posteriormente. Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.

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

## Histórico do escopo documental — 2026-10-10

Paginação será usada somente quando necessário; implementação e consumo de
repositories ficam para uma etapa futura. Ambos estão fora das pendências
atuais. Frontend, camadas de auth/admin, schema/baseline, comandos operacionais
e prova de migrations em PostgreSQL permanecem no relatório de pendências.
Esta atualização altera apenas Markdown; não reexecuta testes, build ou
migrations e não altera as evidências históricas de execução.

## Persistência local — 2026-10-12

USE_MOCK_DATA=true foi implementado para empresas/usuários/auth/planos e caixa
local de e-mails. false mantém consultas PostgreSQL e Resend. SQL fica nos
adapters, e auth/admin usam services. O adiamento anterior de repositories foi
substituído pela autorização desta tarefa. Admin permanece sem montagem.
Ver [configuração e cadastro](dados-locais.md).

Verificação atual: 50 testes de foundation aprovados, typecheck foundation e
contratos aprovados. TypeScript completo passou em fixture temporária com
Prisma 7.10.0 já instalado em outra worktree, sem modificar dependências.
A node_modules desta checkout ainda tem CLI 6.12.0: o typecheck completo nela
falha pela configuração Prisma preexistente. Os testes da API não usam Prisma.
Sem banco real, envio externo, execução de migrations ou instalação.

## Integração frontend/backend — 2026-10-12

Na branch codex/frontend-backend-integration, dependente do PR #16, os
consumidores existentes usam VITE_API_URL como origem, com padrão
http://localhost:3000. Valores terminados em /api/v1 também são aceitos pelos
helpers comuns sem repetir prefixo. Empresas/planos/recuperação usam /api/v1;
convite/primeiro acesso usam /api/auth. Login permaneceu intacto e excluído,
portanto sua configuração/envelope continuam pendentes.

Verificação da entrega: 25 testes direcionados frontend, 60 backend,
typechecks frontend/foundation/contratos e Vite aprovados. npm run build do
frontend executa etapas adicionais: o gate de assets Sobre permanece com
falha histórica (AD-002). npm run lint também falha em SignSelect preexistente.
Não declarar build/lint completos aprovados. Sem instalação de dependências,
banco real, envio externo, schema ou migrations.

Procedimento e limites: [integração frontend/backend](frontend-backend.md).
