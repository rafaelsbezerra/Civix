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

| Variável | Uso atual |
| --- | --- |
| DATABASE_URL | Conexão Neon e configuração Prisma |
| PORT | Porta backend, default 3000 |
| JWT_SECRET | Assinatura/verificação do access token |
| JWT_INVITE_SECRET | Convite/ativação; código ainda tem fallback fixo |
| JWT_RESET_SECRET | Reenvio legado; ausente do .env.example |
| FRONTEND_URL | Links de e-mail; não controla o CORS atual |
| RESEND_API_KEY | Cliente de e-mail Resend |
| MAIL_FROM | Remetente configurado/verificado |
| VITE_API_URL | URL pública embutida no frontend; significado inconsistente entre consumidores |

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
No backend não existem scripts de test, lint ou build; há apenas dev/start.
O start do manifest frontend aponta `backend/src/server.ts` relativo ao
frontend, caminho que não corresponde à estrutura atual.

## Infraestrutura prevista versus comprovada

Notion menciona Hostinger, Neon, GitHub Actions, Auth0 e possibilidade de
Cloudflare R2. O código mostra conexão Neon, e-mail Resend e workflows
incompletos. Não foram encontrados Dockerfiles, Compose, IaC, configuração
de deploy, backup/restore, monitoramento, gestão de segredos ou workflow
n8n exportado. Nenhum ambiente remoto, banco ou provedor foi alterado.
Hostinger/R2/Auth0 não foram verificados externamente.

## Validação desta revisão

- Commit local e remoto de staging conferidos: `5db3c5b`.
- Código de entrada, routers, controllers, services, schema/migrations,
  manifests, configs, UI/consumidores e specs locais examinados.
- Documentação acessível do Notion lida e preservada com origem e data.
- Revisão de referências e integridade dos arquivos docs realizada.

Não há node_modules nos diretórios das aplicações. Testes, lint, build,
browser e consultas ao banco não foram executados. Os achados são
estáticos; não se afirma aprovação de execução ou disponibilidade do
produto. Relatórios históricos de PASS foram lidos apenas como fontes.

## Validação da extração de usuários e repositories

No backend, npm run test:users verifica login, recuperação, reset e rotas
protegidas com persistência/e-mail simulados. npm run test:foundation reúne
contratos, empresas e usuários: 27 testes passaram.
npm run typecheck:foundation cobre src, servidor, interfaces e esses testes
sem incluir prisma.config.ts, cuja incompatibilidade CLI6/configuração7
continua preexistente. Nenhuma dependência nova ou acesso externo.

Interfaces de repositories não são implementações; a aplicação mantém SQL
nos services até a próxima etapa. Nenhuma migration aplicada nesta tarefa.

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
Os PRs permanecem abertos; esta resolução não realiza merge em staging.
