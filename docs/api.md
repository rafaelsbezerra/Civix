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
O cadastro de empresas está disponível; atualização/exclusão,
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
invite_token. Pré-validação e ativação compartilham o helper getInviteUser:
verificam JWT com JWT_INVITE_SECRET, e-mail/perfil, status e users.invite_token.
Token inválido/expirado retorna 401; usuário ausente 404; já ativo 400;
token consumido ou divergente 401. A ativação consome o token de forma
condicional por ID/token para impedir uso concorrente.

Reenvio ainda gera JWT de reset 1h e grava token cru sem atualizar expiração.
Esse protocolo não corresponde ao reset principal, que espera hash SHA-256;
a correção de convite não resolve o reenvio. Login de contas com status pending retorna 401; usuários
atuais sem status continuam autenticando pelas regras existentes. Convites
não substituem contas ativas ou atuais sem status.

## Dados e respostas

Empresas retornam linhas SQL sem mapper, com `descricao_detalhada` e
`data_cadastro`. Os consumidores frontend agora utilizam esses nomes
snake_case; o backend mantém esse formato de dados. Planos possuem mapper e retornam id e price como strings;
billingPeriod é monthly/yearly/one_time e limits é um objeto flexível.
Não há moeda explícita ou enforcement dos limites no backend.

Erros agora seguem o contrato compartilhado. Produção retorna somente
status e message; exceção desconhecida retorna 500 com "Erro interno do servidor".
Fora de produção, code, stack e details incluem diagnóstico/cause sanitizados.
requestId permanece opcional quando fornecido ao contexto do serializador.
O UUID automático dos logs é interno e não é acrescentado ao corpo/header HTTP.
ErrorCode contém VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT
e INTERNAL_ERROR. 404 e error handler ficam após os routers em app.ts;
Express 5 encaminha rejeições de handlers assíncronos. Falha SQL de empresas
retorna 500; ausência retorna 404. Planos preservam 400 para plano
inválido/inativo ou usuário ausente.

Não existe paginação, metadados total/cursor ou limite de página; empresas
não têm ordenação determinística. Não há OpenAPI versionado. Há testes direcionados de consumidores e
contratos com persistência/HTTP simulados; não comprovam integração no
navegador contra um banco real.

## Contrato adotado e exemplos

Login retorna `{ "data": { "user": { "id": "id", "email": "pessoa@example.test", "role": "cliente" }, "token": "token" } }`.
Recuperação retorna `{ "data": { "message": "Se o e-mail existir no sistema, as instruções serão enviadas." } }`.
Erro inesperado em produção retorna `{ "status": 500, "message": "Erro interno do servidor" }`.
Nos demais ambientes, code/stack/details são acrescentados com sanitização.

Os helpers permitem 200/201 e 204 sem corpo; nenhuma rota atual responde
204. Admin mantém router desmontado; seu handler de convite
usará 201 com data contendo message, sem expor um endpoint novo.
Convite, ativação, login e recuperação utilizam users. As migrations atuais
não criam um schema comercial completo.

## Consumidores frontend — adoção parcial

Os consumidores existentes utilizam estes contratos:

- lib/api.ts extrai data, aceita meta opcional e exibe message do erro público;
  não exige success nem usa dados fictícios para substituir falhas da API.
- Catálogo/perfil usam os campos snake_case e busca /empresas/buscar?q=.
  IDs, categorias, estados e tokens são codificados nos parâmetros.
- FirstAccess usa /api/auth, lê o resultado já extraído pelo helper e aceita
  token por query ou parâmetro da rota existente.
- ForgotPassword/ResetPassword usam os helpers comuns de /api/v1/users e
  exibem message; o link de recuperação aponta para /esqueci-senha.
- Planos e selectPlan usam o novo envelope; selectPlan envia o Bearer existente.

VITE_API_URL representa a origem do backend (padrão http://localhost:3000).
O helper aceita também o valor anterior terminado em /api/v1 sem duplicar
prefixos; inclui /api/v1 ou /api/auth por endpoint.

**Login ainda utiliza o envelope antigo:** login.tsx
ainda lê token no topo e error nos erros Axios. Seus destinos incluem um dashboard ainda inexistente. Não há interface de seleção de plano no frontend.
requestId não existe em produção e não é obrigatório no frontend.

Detalhes e verificações: [integração frontend/backend](frontend-backend.md).


## Diagnóstico interno e contrato público

O middleware de logging gera um UUID interno antes do parser e o propaga
nas chamadas assíncronas. Esse UUID relaciona o diagnóstico e o resumo da
requisição; não integra o payload de sucesso/erro nem cria um header novo.

O handler registra stack/causa sanitizados internamente também em produção,
enquanto os consumidores continuam recebendo os mesmos corpos, status e
diagnóstico público definidos acima. LOG_LEVEL e apresentação pretty alteram
somente a saída interna. Services também registram etapas confirmadas,
sem mudar autenticação, retornos, rotas ou regras comerciais. Falhas propagadas
continuam pertencendo ao handler; não são registradas repetidamente pelos
services. Preparação de token, outbox salva e aceite do provedor são eventos
distintos, sem expor identidade/segredos ao consumidor. Admin continua desmontado.
