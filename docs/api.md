# API e contratos observados

Referência: [app](../backend/src/app.ts), [server](../backend/src/server.ts),
[routers](../backend/src/routes/user.routes.ts) e
[controllers](../backend/src/controller/user.controller.ts).
As rotas abaixo são as efetivamente montadas. Não são um contrato futuro.

## Endpoints atuais

| Método e URL | Entrada | Autorização | Retorno de sucesso |
| --- | --- | --- | --- |
| GET `/` | — | Público | 200 `{data:{message}}` |
| POST `/api/v1/users/login` | email e password; role opcional como filtro | Público | 200 `{data:{user,token}}` |
| POST `/api/v1/users/forgot-password` ou `/esqueci-senha` | email | Público | 200 `{data:{message}}` |
| POST `/api/v1/users/reset-password` ou `/redefinir-senha` | token, password mínimo 8 | Público | 200 `{data:{message}}` |
| GET `/api/v1/users/profile` | — | Bearer JWT | 200 `{data:{user,permissions}}` |
| POST `/api/v1/users/home` | — | Bearer JWT | 200 `{data:{message,userId,userRole}}` |
| GET `/api/auth/validate-token` | query token | Público | 200 `{data:{email}}` |
| POST `/api/auth/first-access` | token, password mínimo 8 | Token de convite | 200 `{data:{message}}` |
| POST `/api/auth/resend-invite-email` | email | Público | 200 `{data:{message}}` |
| POST /api/v1/empresas | Campos de CompanyCreateInput | Bearer JWT, role super_admin | 201 com data contendo Company |
| GET /api/v1/empresas | — | Público | 200 com data contendo Company[] |
| GET `/api/v1/empresas/verificadas/todas` | — | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/buscar` | query q não vazio | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/categoria/:categoria` | categoria | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/estado/:estado` | estado | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/tamanho/:tamanho` | pequena/media/grande | Público | 200 `{data:Company[]}` |
| GET `/api/v1/empresas/:id` | id | Público | 200 `{data:Company}` |
| GET `/api/v1/plans` | — | Público | 200 `{data:Plan[]}` |
| POST `/api/v1/plans/selection` | planId | Bearer, role admin_empresa | 200 `{data:Plan}` |

O router de convite declara POST `/admin/invite`, mas não é montado no
servidor. Não existe endpoint público operacional de convite nessa baseline.
O cadastro de empresas está disponível; atualização/exclusão,
CRUD público de usuários e vendas não foram implementados. Auth permanece
montado em /api/auth. Detalhes do cadastro e configuração dos dois modos
estão em [dados locais](dados-locais.md).

## Sessões e tokens

Login assina `{id,email,role,companyId,tokenVersion:2}` com JWT_SECRET e expiração de 1h. O middleware valida Bearer e consulta a identidade persistida: estado, papel, empresa e e-mail devem continuar válidos. Tokens antigos exigem novo login. Cliente não autentica; admin_empresa, super_admin e atendente exigem senha. Não há refresh ou logout remoto.

Recuperação principal gera token aleatório, salva SHA-256 e expiração 1h
em `users`; reset recalcula o hash e limpa token e expiração.
Convite assina JWT 24h, armazena token em `users`, ativa status e limpa
invite_token. Pré-validação e ativação compartilham o helper getInviteUser:
verificam JWT com JWT_INVITE_SECRET, e-mail/perfil, status e users.invite_token.
Token inválido/expirado retorna 401; usuário ausente 404; já ativo 400;
token consumido ou divergente 401. A ativação consome o token de forma
condicional por ID/token para impedir uso concorrente.

Reenvio renova o convite com propósito explícito, papel e companyId. Convites não substituem contas ativas ou de outro papel/empresa. O router admin permanece desmontado.

## Dados e respostas

Empresas usam aliases SQL para preservar o contrato público em português, com `descricao_detalhada` e
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

Login retorna `{ "data": { "user": { "id": "id", "email": "pessoa@example.test", "role": "super_admin", "companyId": null }, "token": "token" } }`.
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

Login utiliza o envelope atual, exige e-mail/senha e retorna à Home. O guard consulta profile; dashboards ainda não possuem rotas. Não há formulário de seleção de plano.
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

## Capas de empresas

POST /api/v1/storage/images recebe multipart autenticado com purpose=cover|logo;
GET /api/v1/storage/images/:imageId/url é público para a logo ou capa vigente.
Consultas públicas de empresa incluem cover_image_url e logo assinada quando
há logo_key, sem chaves internas. O detalhe administrativo também inclui as
URLs para prévia. Contratos, validações, status e preparação estão no
[guia de storage](storage.md) e na [spec](../backend/.specs/features/storage/spec.md).

## Plataforma superadmin — G0 a G4

Rotas Bearer com identidade vigente e papel super_admin:

- GET/POST `/api/v1/platform/plans`: listar todos ou criar plano.
- GET/PUT `/api/v1/platform/plans/:planId`: consultar ou editar plano.
- POST `/api/v1/platform/plans/:planId/activation`: body `{ "active": true }`. Ativar exige preço positivo.
- POST `/api/v1/platform/companies`: campos de empresa + `planId` + `operationId` UUID.
- PUT `/api/v1/users/profile`: somente `{ "name": "Nome", "email": "nome@example.test" }`, para o próprio usuário autenticado.

O cadastro retorna 201 com `data.company`, `data.sale` e `data.replayed`.
Repetir ator/operação/payload retorna o resultado original; outro payload na
mesma operação gera 409. Plano ausente/inativo ou inválido impede gravação.
O POST existente `/api/v1/empresas` exige o mesmo contrato. Perfil retorna
`data.user` e `data.requiresLogin`; mudar e-mail invalida o token anterior.
Validação retorna 400, falta de sessão 401 e perfil sem permissão 403.
As migrations incrementais precisam ser aplicadas no ambiente autorizado.
Ver [estado e limites da implementação](super-admin.md). O router admin legado
permanece desmontado; apenas as operações acima foram montadas na plataforma.

## Plataforma superadmin — gestão G5 a G7

Todas as operações abaixo exigem Bearer e super_admin vigente.

- GET `/api/v1/platform/companies` e GET/PUT `/companies/:companyId`:
  consulta administrativa e edição. Novo plano precisa ser ativo/positivo;
  manter o vínculo atual inativo permite editar os outros dados. Sem nova venda.
- POST `/companies/:companyId/suspension` com `{ "reason": "Motivo" }`;
  DELETE `/companies/:companyId` também exige reason e arquiva logicamente.
  POST `/reactivation` reativa; POST `/restoration` restaura ainda inativa.
  Esses sufixos usam o mesmo prefixo `/api/v1/platform/companies/:companyId`.
- GET `/api/v1/platform/sales` e GET `/sales/:saleId`; POST `/sales` registra
  venda manual; DELETE `/sales/:saleId` exclui definitivamente e retorna 204.
  Não há edição de venda. Excluir não altera empresa ou plano.
- GET `/api/v1/platform/companies/:companyId/users`, POST `/invitations`,
  PUT `/:userId`, POST `/:userId/suspension`, POST `/:userId/reactivation`
  e DELETE `/:userId` para atendente: todos os sufixos são relativos à rota
  de usuários da empresa. Suspensão/exclusão exigem reason; exclusão é lógica.
- GET `/api/v1/platform/administrators`, POST `/invitations`, PUT `/:userId`,
  POST `/:userId/suspension` e POST `/:userId/reactivation`: sufixos relativos
  à lista de administradores. Não aceitar role/companyId para promover conta.

Listas administrativas de empresas/vendas/usuários aceitam page/limit
(padrão 20, máximo 100). Resposta: data array e meta com page, pageSize, total,
totalPages. Empresa filtra q/status/planId; status permite ativo/inativo/archived.
Venda filtra companyId/planId/origin/from/to; datas ISO em UTC e limites
inclusivos. Usuários filtram q/status e, no contexto empresarial, role.

POST de venda manual exige companyId, operationId UUID, soldAt ISO UTC e
pricingMode. company_plan usa preço do vínculo atual no backend e não aceita
amount/planId no body; manual_amount exige amount decimal string e description
não vazia. Os dois modos preservam snapshots e não mudam o plano da empresa.

A operação é única por ator: dados normalizados iguais retornam a venda
existente com replayed=true; dados diferentes geram 409. Fingerprint é interno.
Depois do DELETE a venda manual não entra nessa verificação e um novo
lançamento pode ocorrer; a proteção do cadastro inicial permanece distinta.

Convites empresariais recebem email/name opcional/role admin_empresa ou
atendente; convites globais não recebem role/companyId. A conta fica pending
até primeiro acesso. Falha de envio após salvar retorna 502 e permite reenvio
sem duplicar conta. Alterar e-mail/perfil invalida sessões/convites anteriores.
Reativação de usuário sem senha mantém pending e exige novo convite.

Desativar usuário ou empresa revoga as sessões afetadas em todas as chamadas
seguintes. Reativar preserva tokens_revoked_at e exige login novo. Usuário
excluído logicamente não autentica. Hashes, tokens e campos de recuperação
não fazem parte das respostas administrativas. Ver [SDD canônico](../backend/.specs/features/super-admin-dashboard/sdd.md).
