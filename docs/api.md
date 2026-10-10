# API e contratos observados

Referência: [server](../backend/src/server.ts),
[routers](../backend/src/routes/userRoute.ts) e
[controllers](../backend/src/controller/userController.ts).
As rotas abaixo são as efetivamente montadas. Não são um contrato futuro.

## Endpoints atuais

| Método e URL | Entrada | Autorização | Retorno de sucesso |
| --- | --- | --- | --- |
| GET `/` | — | Público | 200 `{message}` |
| POST `/api/v1/users/login` | email, role; password para empresa | Público | 200 `{user,token}` |
| POST `/api/v1/users/forgot-password` ou `/esqueci-senha` | email | Público | 200 `{message}` |
| POST `/api/v1/users/reset-password` ou `/redefinir-senha` | token, password mínimo 8 | Público | 200 `{message}` |
| GET `/api/v1/users/profile` | — | Bearer JWT | 200 `{message,userId}` |
| POST `/api/v1/users/home` | — | Bearer JWT | 200 `{message,userId,userRole}` |
| GET `/api/auth/validate-token` | query token | Público | 200 `{email}` |
| POST `/api/auth/first-access` | token, password mínimo 8 | Token de convite | 200 `{success,message}` |
| POST `/api/auth/resend-invite-email` | email | Público | 200 `{message}` |
| GET `/api/v1/empresas` | — | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/verificadas/todas` | — | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/buscar` | query q não vazio | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/categoria/:categoria` | categoria | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/estado/:estado` | estado | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/tamanho/:tamanho` | pequena/media/grande | Público | 200 `{success,data,message}` |
| GET `/api/v1/empresas/:id` | id | Público | 200 `{success,data,message}` |
| GET `/api/v1/plans` | — | Público | 200 `{success,data,plans}` |
| POST `/api/v1/plans/selection` | planId | Bearer, role empresa | 200 `{success,data,plan}` |

O router de convite declara POST `/admin/invite`, mas não é montado no
servidor. Não existe endpoint público operacional de convite nessa baseline.
Os CRUDs de usuários, empresas e vendas listados no Notion não estão
implementados. Comentários de controller com `/api/v1/auth` não refletem
o mount real `/api/auth`.

## Sessões e tokens

Login assina `{id,email,role}` com `JWT_SECRET`, expiração 1h.
Middleware valida Bearer e injeta `userId`/`userRole`; não carrega usuário
ativo, vínculo tenant ou permissões do banco. Não há refresh/logout/revogação.

Recuperação principal gera token aleatório, salva SHA-256 e expiração 1h
em `users`; reset recalcula o hash e limpa token e expiração.
Convite assina JWT 24h, armazena token em `"user"`, ativa status e limpa
invite_token. A validação pública consulta reset_password_token em `users`
sem calcular hash. Reenvio gera JWT de reset 1h e grava token cru sem
atualizar expiração. Esses fluxos não compartilham um protocolo consistente.

## Dados e respostas

Empresas retornam linhas SQL sem mapper; campos como `descricao_detalhada`
e `data_cadastro` não correspondem aos tipos frontend `descricaoDetalhada`
e `dataCadastro`. Planos possuem mapper e retornam id e price como strings;
billingPeriod é monthly/yearly/one_time e limits é um objeto flexível.
Não há moeda explícita ou enforcement dos limites no backend.

Erros variam entre `{error}` e `{success:false,error}`. Não há código
estável, detalhes de validação ou requestId. Não há middleware global de
erro/404 JSON. Empresas filtradas podem retornar HTTP 200 com success false
em erro SQL; detalhe pode retornar 404 por erro SQL, confundindo ausência
com falha. Planos usam 400 para plano inválido/inativo ou usuário ausente.

Não existe paginação, metadados total/cursor ou limite de página; empresas
não têm ordenação determinística. Não há OpenAPI versionado ou testes
de integração de contrato frontend/backend.

## Decisões necessárias para padronizar

Definir envelope de sucesso, formato/códigos de erro, matriz de status,
paginação e ordenação, idioma/casing dos DTOs, identificadores, dinheiro,
datas/fuso, filtros combináveis, versionamento e política de compatibilidade.
Depois registrar OpenAPI/schemas, migração dos consumidores e testes de
contrato. Nenhum envelope novo foi escolhido nesta revisão.

## Base nova ainda não adotada

Os contratos novos estão implementados e descritos em
[padroes-backend.md](padroes-backend.md), mas os endpoints acima ainda retornam
os envelopes legados. A base exportada possui serialização de erros por
ambiente, respostas tipadas e validação/metadados de paginação. Nenhum handler
foi registrado no bootstrap nesta etapa.
