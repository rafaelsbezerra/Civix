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

## Validação da extração de usuários e repositories

No backend, npm run test:users verifica login, recuperação, reset e rotas
protegidas com persistência/e-mail simulados. npm run test:foundation reúne
contratos, empresas e usuários: 27 testes passaram.
npm run typecheck:foundation cobre src, servidor, interfaces e esses testes
sem incluir prisma.config.ts, cuja incompatibilidade CLI6/configuração7
continua preexistente. Nenhuma dependência nova ou acesso externo.

Interfaces de repositories não são implementações; a aplicação mantém SQL
nos services até a próxima etapa. Nenhuma migration aplicada nesta tarefa.

## Execução da adoção HTTP

`src/app.ts` exporta a aplicação Express sem abrir porta; `src/server.ts`
inicia a escuta. Testes podem importar app e abrir uma porta local temporária,
com banco/e-mail simulados, sem iniciar o servidor de produção. Routers são
seguidos pelo 404 global e pelo handler de erros. Admin continua desmontado.

NODE_ENV exatamente production limita erros a status/message; staging, test
e demais valores permitem stack/details/code sanitizados. requestId é opcional
quando recebido pelo contexto, sem geração automática nesta etapa.

Nenhuma dependência, tabela ou migration foi alterada por esta adoção.
Repositories são interfaces apenas; SQL permanece nos services. Frontend
não foi adaptado: executar ambos não comprova compatibilidade dos envelopes.
Os 27 testes acima são históricos; a suíte ampliada atual passou com 36 testes. Typecheck completo ainda depende da integração
Prisma CLI 7/configuração, fora desta tarefa.


## Verificação da adoção — 2026-10-10

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Typecheck completo continua bloqueado exclusivamente pelo TS2353 preexistente
em prisma.config.ts (CLI 6/configuração 7). Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.
