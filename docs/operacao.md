# Execução e infraestrutura

## Preparação local

Frontend e backend têm manifestos próprios, sem workspaces. Para reproduzir
os caminhos diretamente associados às configurações de cada aplicação,
os comandos abaixo usam os diretórios frontend/backend. Preencha as
variáveis e prepare o armazenamento antes de iniciar a aplicação.

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
As migrations de 2026-10-25 acrescentam `users`, `companies` e `images` ao histórico de
planos, mas sua aplicação em PostgreSQL ainda não foi validada. Exigem
PostgreSQL com `gen_random_uuid()` disponível (nativa a partir da versão 13).
Não aplicá-las automaticamente; tabelas já existentes exigem inspeção e plano
próprio, pois as novas criações não convertem schemas legados. Ver a
[baseline e recuperação](../backend/.specs/features/migrations/users-companies.md).
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
| LOG_LEVEL | debug/info/warn/error/fatal; override validado do nível interno de logs |
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
e typechecks; confira os nomes disponíveis antes de executar.
O backend é iniciado pelo seu próprio manifest; frontend utiliza npm run dev
(Vite) e não possui script start para executar código de servidor.

## Infraestrutura prevista versus comprovada

Notion menciona Hostinger, Neon, GitHub Actions, Auth0 e possibilidade de
Cloudflare R2. O código mostra conexão Neon, e-mail Resend e workflows
incompletos. Não foram encontrados Dockerfiles, Compose, IaC, configuração
de deploy, backup/restore, monitoramento, gestão de segredos ou workflow
n8n exportado. Nenhum ambiente remoto, banco ou provedor foi alterado.
Hostinger/R2/Auth0 não foram verificados externamente.

## Execução e diagnóstico HTTP

`src/app.ts` exporta a aplicação Express sem abrir porta; `src/server.ts`
inicia a escuta. Testes podem importar app e abrir uma porta local temporária,
com banco/e-mail simulados, sem iniciar o servidor de produção. Routers são
seguidos pelo 404 global e pelo handler de erros. Admin continua desmontado.

NODE_ENV exatamente production limita erros a status/message; staging, test
e demais valores permitem stack/details/code sanitizados. requestId é opcional
quando recebido pelo contexto do serializador. O UUID criado para logs
internos não é acrescentado ao corpo/header das respostas HTTP.

## Registros de verificação

Evidências e limitações das entregas ficam nas specs:
[backend](../backend/.specs/README.md) e
[integração frontend](../frontend/.specs/features/backend-integration/validation.md).
Não executar migrations para preparar o modo JSON.


## Organização das dependências frontend

O manifest frontend descreve a aplicação React/Vite. Bibliotecas de servidor
como Express, CORS, dotenv, bcrypt, JWT e PostgreSQL pertencem ao backend,
assim como Neon e seus tipos; não fazem parte da aplicação de navegador.
tsx também não é necessário para iniciar o frontend com Vite.

| Grupo | Local no manifest | Exemplos |
| --- | --- | --- |
| Runtime da interface | dependencies | React/Router, Axios, fontes, Lenis, Motion, Lucide, classes e tw-animate-css |
| Ferramentas de build/geração | devDependencies | Vite, TypeScript, @tailwindcss/vite, tailwindcss, shadcn |
| Testes e tipagem | devDependencies | @playwright/test, Vitest, Testing Library, ESLint, tipos React/Node |

Axios permanece porque login ainda o utiliza. Fontes, helpers de classes e
CSS também são usados pelo frontend; sua remoção não faz parte dessa divisão.
O script de navegador usa chromium exportado por @playwright/test, já declarado
no manifest, sem depender de um pacote Playwright implícito.

A [spec de manutenção](../frontend/.specs/features/dependency-maintenance/spec.md)
registra a análise e as verificações da alteração de manifest/lockfile.


## Movimento e preferência do navegador

Motion 14.1.0 pertence às dependencies do frontend. O motor de entradas
MotionRoot carrega motion/mini sob demanda; a transição do perfil usa
motion/react, importado pelos componentes React. Não exige configuração de backend ou variável de ambiente.
Nas páginas públicas, prefers-reduced-motion reduz as entradas e desativa
Lenis; mudanças da preferência são acompanhadas durante a sessão.

O motor fica desabilitado nas telas de login/primeiro acesso/recuperação/
redefinição. Falta de IntersectionObserver, MutationObserver ou Web Animations
API mantém conteúdo visível. A [validação da feature](../frontend/.specs/features/entry-animations/validation.md)
contém verificações e limitações; estes guias não representam aprovação
automática de build completo ou dos testes históricos.


## Logs estruturados e nível

O backend usa Pino 10.4.0 e pino-http 11.0.0. NODE_ENV exatamente development
ativa pino-pretty 13.2.0 e nível padrão debug; qualquer outro ambiente usa
JSON bruto e nível padrão info. LOG_LEVEL permite override somente com
debug, info, warn, error ou fatal. Valor inválido falha na configuração,
sem selecionar silenciosamente outro nível.

Cada registro JSON interno contém timestamp UTC ISO, level em texto,
event/module/message e, quando pertinente, requestId/context/http/error.
A saída vai ao processo, sem arquivo obrigatório, banco ou retenção remota.
Em desenvolvimento, pretty é apenas apresentação desse registro.

Stacks/causas internas são sanitizados inclusive em produção. Isso não
muda a resposta pública, limitada a status/message em produção. Contexto
permite IDs/operação/contagens, sem bodies, destinatários, credenciais ou SQL.
Não há truncamento ou limite arbitrário de tamanho/profundidade por política.

Falha da emissão não substitui a operação de negócio. Os registros do
ciclo HTTP, inicialização e etapas confirmadas dos services são registrados.
Evento de preparação de token não garante envio; aceite de provedor não
garante entrega de e-mail. O helper delegador de mail não duplica o evento. Comandos disponíveis: npm run test:logging,
npm run test:foundation, npm run typecheck:foundation e
npm run typecheck:contracts no backend. Evidências ficam na
[validação](../backend/.specs/features/structured-logs/validation.md).


## Comando de usuário local e logs

npm run mock:user:create continua solicitando os dados necessários de forma
interativa, com prompts em stderr e stdout reservado ao logger. Em modo
JSON, cada linha de stdout é um registro estruturado; em development vale
a apresentação pretty configurada. Após persistir, o service emite
mock.user.created com ID/role,
sem imprimir objeto ou e-mail do resultado. Uma falha emite
mock.user-command.failed na fronteira do comando, com diagnóstico sanitizado;
readline e logger são fechados ao concluir.

Não há requestId HTTP inventado para esse comando. Os prompts solicitam
e-mail/senha, mas esses valores não fazem parte do registro estruturado.
Logs de caixa de saída guardam tipo/modo, sem destinatário ou link de reset/
convite. As evidências e limitações ficam na spec da feature.


## Posição ao navegar nas páginas públicas

PublicSmoothScroll abre novas navegações sem hash no topo, inclusive quando
os cards de empresa chamam navigate programaticamente. Antes de reposicionar,
cancela a inércia do Lenis, move a rolagem nativa imediatamente e sincroniza
o motor. Com reduced motion, a rolagem nativa continua atendendo à regra.

Uma âncora inicial ou em outra página respeita scroll-padding da navbar.
Mudanças de altura após carregar dados realinham o destino até a primeira
interação do visitante (roda, toque, ponteiro ou teclado). Observers, listeners
e frames são removidos ao sair da página ou interromper esse acompanhamento.
Âncoras na mesma página continuam atendidas por Lenis/navegador.

Voltar/Avançar preserva a restauração nativa; não força o topo nem procura
novamente uma âncora histórica. Isso não implementa um armazenamento próprio
de posições nem garante restauração exata em páginas de altura variável.
O destino Contato permanece como estava; nenhum ID novo foi criado.

## Usuários e storage

A migration de 2026-11-01 acrescenta o vínculo único users.company_id e as restrições dos quatro papéis. Não foi aplicada. Bootstrap, conversão JSON com backup, configuração R2 e homologação pendente estão no [guia de usuários e capas](storage.md). Use as quatro variáveis R2_* consumidas pelo provider; os nomes CLOUDFLARE_R2_* do scaffold não são lidos por ele.
