# API e contratos observados

Referência: [app](../backend/src/app.ts), [server](../backend/src/server.ts),
[routers](../backend/src/routes/user.routes.ts) e
[controllers](../backend/src/controller/user.controller.ts).
As rotas abaixo são as efetivamente montadas. Não são um contrato futuro.

## Endpoints atuais

| Método e URL | Entrada | Autorização | Retorno de sucesso |
| --- | --- | --- | --- |
| GET `/` | — | Público | 200 `{data:{message}}` |
| POST `/api/v1/users/login` | email, role; password para empresa | Público | 200 `{data:{user,token}}` |
| POST `/api/v1/users/forgot-password` ou `/esqueci-senha` | email | Público | 200 `{data:{message}}` |
| POST `/api/v1/users/reset-password` ou `/redefinir-senha` | token, password mínimo 8 | Público | 200 `{data:{message}}` |
| GET `/api/v1/users/profile` | — | Bearer JWT | 200 `{data:{message,userId}}` |
| POST `/api/v1/users/home` | — | Bearer JWT | 200 `{data:{message,userId,userRole}}` |
| GET `/api/auth/validate-token` | query token | Público | 200 `{data:{email}}` |
| POST `/api/auth/first-access` | token, password mínimo 8 | Token de convite | 200 `{data:{message}}` |
| POST `/api/auth/resend-invite-email` | email | Público | 200 `{data:{message}}` |
| POST /api/v1/empresas | Campos de CompanyCreateInput | Bearer JWT, role empresa | 201 com data contendo Company |
| GET /api/v1/empresas | — | Público | 200 com data contendo Company[] |
| GET `/api/v1/empresas/verificadas/todas` | — | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/buscar` | query q não vazio | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/categoria/:categoria` | categoria | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/estado/:estado` | estado | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/tamanho/:tamanho` | pequena/media/grande | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/:id` | id | Público | 200 `{data:Company}` |
| GET `/api/v1/plans` | — | Público | 200 `{data:Plan[]}` |
| POST `/api/v1/plans/selection` | planId | Bearer, role empresa | 200 `{data:Plan}` |

O router de convite declara POST `/admin/invite`, mas não é montado no
servidor. Não existe endpoint público operacional de convite nessa baseline.
O cadastro de empresas foi acrescentado nesta entrega; atualização/exclusão,
CRUD público de usuários e vendas não foram implementados. Auth permanece
montado em /api/auth. Detalhes do cadastro e configuração dos dois modos
estão em [dados locais](dados-locais.md).

## Sessões e tokens

Login assina `{id,email,role}` com `JWT_SECRET`, expiração 1h.
Middleware valida Bearer e injeta `userId`/`userRole`; não carrega usuário
ativo, vínculo tenant ou permissões do banco. Não há refresh/logout/revogação.

Recuperação principal gera token aleatório, salva SHA-256 e expiração 1h
em `users`; reset recalcula o hash e limpa token e expiração.
Convite assina JWT 24h, armazena token em `users`, ativa status e limpa
invite_token. A validação pública consulta reset_password_token em `users`
sem calcular hash. Reenvio gera JWT de reset 1h e grava token cru sem
atualizar expiração. Esses fluxos não compartilham um protocolo consistente, mesmo após a
unificação em users. Login de contas com status pending retorna 401; usuários
atuais sem status continuam autenticando pelas regras existentes. Convites
não substituem contas ativas ou atuais sem status.

## Dados e respostas

Empresas retornam linhas SQL sem mapper; campos como `descricao_detalhada`
e `data_cadastro` não correspondem aos tipos frontend `descricaoDetalhada`
e `dataCadastro`. Planos possuem mapper e retornam id e price como strings;
billingPeriod é monthly/yearly/one_time e limits é um objeto flexível.
Não há moeda explícita ou enforcement dos limites no backend.

Erros agora seguem o contrato compartilhado. Produção retorna somente
status e message; exceção desconhecida retorna 500 com "Erro interno do servidor".
Fora de produção, code, stack e details incluem diagnóstico/cause sanitizados.
requestId é opcional quando fornecido ao contexto; não há geração automática.
ErrorCode contém VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT
e INTERNAL_ERROR. 404 e error handler ficam após os routers em app.ts;
Express 5 encaminha rejeições de handlers assíncronos. Falha SQL de empresas
retorna 500; ausência retorna 404. Planos preservam 400 para plano
inválido/inativo ou usuário ausente.

Não existe paginação, metadados total/cursor ou limite de página; empresas
não têm ordenação determinística. Não há OpenAPI versionado ou testes
de integração de contrato frontend/backend.

## Contrato adotado e exemplos

Login retorna `{ "data": { "user": { "id": "id", "email": "pessoa@example.test", "role": "cliente" }, "token": "token" } }`.
Recuperação retorna `{ "data": { "message": "Se o e-mail existir no sistema, as instruções serão enviadas." } }`.
Erro inesperado em produção retorna `{ "status": 500, "message": "Erro interno do servidor" }`.
Nos demais ambientes, code/stack/details são acrescentados com sanitização.

Os helpers permitem 200/201 e 204 sem corpo; nenhuma rota atual foi convertida
para 204 nesta tarefa. Admin mantém router desmontado; seu handler de convite
usará 201 com data contendo message, sem expor um endpoint novo.
As URLs e os protocolos de autenticação permanecem. Na branch
codex/json-postgres-repositories, convite, ativação, login e recuperação usam
somente users; a unificação não inclui schema ou migrations.

## Frontend pendente: incompatibilidades conhecidas

Adoção backend autorizada com frontend explicitamente adiado. Não considerar
os consumidores integrados até adaptar:

- `lib/api.ts`: remover exigência de success em fetchApi/selectPlan; manter data
  e ler message do corpo de erro HTTP, atualmente descartado por fetchApi.
- `pages/login.tsx`: ler response.data.data.token e message no erro Axios.
- `pages/FirstAccess.tsx`: ler data.data.email e message nos erros.
- `pages/ForgotPassword.tsx` e `pages/ResetPassword.tsx`: ler message nos erros;
  ignoram corpo de sucesso.
- Catálogo, perfil e planos dependem de lib/api.ts.

requestId não existe em produção e não deve ser obrigatório no frontend.
Persistem diferenças snake_case/camelCase e URLs anteriormente documentadas.

## Histórico da extração

A extração anterior preservou envelopes legados. Esta adoção substitui essa
restrição em usuários, auth/admin, empresas, planos, root e middleware.
A adoção HTTP está integrada em staging bedb73a. Em 2026-10-12, o modo local
antecipou adapters e uso das interfaces em empresas/usuários/auth/planos, no
checkout sem commit. Paginação permanece sob demanda; schema segue pendente.
Verificação da entrega: 36 testes e typechecks isolados aprovados; detalhes
em operacao.md. Esta atualização documental não reexecuta esses checks.
