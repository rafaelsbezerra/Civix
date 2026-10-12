# Base de padrões do backend

Referência de organização do código, contratos compartilhados e persistência.
Erro/sucesso são utilizados nos endpoints atuais; paginação permanece como
helper disponível para uso quando necessário. Repositories possuem interfaces
e implementações JSON/PostgreSQL. Envelopes em [API](api.md).


## Contratos aprovados

- Sucesso: `{ data, meta? }`; criação 201; operação sem corpo 204.
- Paginação: `page`/`pageSize`, base 1, padrão 20, máximo 100; metadados
  `page`, `pageSize`, `total`, `totalPages`. Entrada inválida retorna 400.
- Lista vazia/página além do fim: sucesso com `data: []`.
- Erro em produção: `{ status, message }`; fora de produção: adicionar
  `code`, `details`, `requestId`, `stack`, sanitizando credenciais.

## Estrutura e persistência

Identificadores em inglês; arquivos domínio.papel.ts e pastas por função.
Comentários e mensagens de erro em português. Cadeia
routes → controller → service; entidades/interfaces/DTOs em arquivos próprios.
Prisma 7 com migrations SQL nativas e reversão por migration inversa aprovado;
o schema de identidade e empresas ainda depende de definição.
Empresas e usuários estão separados por camadas; todos os endpoints backend
adotam os contratos de erro e sucesso. O consumidor frontend de login ainda utiliza envelope antigo.

## Implementação da base HTTP

Disponível em `backend/src/shared/contracts/{error,response,pagination}.contract.ts`,
`backend/src/shared/errors/app.error.ts` e `backend/src/middlewares/error.handler.ts`.
app.ts monta a aplicação e os handlers globais; server.ts inicia a escuta.

- `createSuccessResponse` gera `{ data }` ou `{ data, meta }`.
- `sendSuccess`, `sendCreated`, `sendNoContent` usam 200, 201 e 204; 204 termina
  a resposta sem JSON.
- `parsePagination` aceita números inteiros positivos ou strings decimais
  positivas, retorna page/pageSize/offset e rejeita entradas inválidas com 400.
  Defaults: 1/20. Limite: 100. Rejeita offsets fora do inteiro seguro.
- `createPaginationMeta` recebe total já filtrado e validado; calcula totalPages.
  Total zero produz zero páginas. Não consulta banco nem ordena resultados.
- `AppError` separa falhas classificadas de exceções desconhecidas.
- `serializeError` retorna exatamente `{ status, message }` em produção.
  Exceções desconhecidas usam 500 e mensagem pública genérica. Fora de produção,
  inclui diagnóstico, stack (sintético para lançamentos que não são Error) e requestId quando fornecido.
  Campos sensíveis, credenciais em URLs e tokens Bearer são sanitizados;
  não executar getters durante a serialização.
- Handlers globais de erro/404 respeitam headers enviados; registrados após
  routers em app.ts, com error handler por último.

Exemplo de paginação verificado nos testes:
`parsePagination({ page: '2', pageSize: '100' })` produz
`{ page: 2, pageSize: 100, offset: 100 }`.

## Interfaces de persistência preparadas

Disponíveis em repositories/{user,company,plan,auth}.repository.ts. Interfaces
são implementadas por repositories em persistence/json e persistence/postgres,
com nomes domínio.repository.ts. Seletores na raiz de persistence usam a flag
para fornecer o repository ao service. Estrutura em [dados locais](dados-locais.md).
Services não executam SQL; o adapter PostgreSQL preserva as consultas. Não há interface query
genérica nem novas factories. Busca sem resultado usa undefined, como
rows[0] nas consultas atuais; atribuição de plano retorna boolean.

User descreve campos observados internamente; password_hash é dado de
persistência, nunca parte da resposta de login. Plan e PlanRow foram
extraídos para entities/plan.entity.ts e interfaces/plan.row.ts; exports
de tipos do service preservados para compatibilidade. Nenhuma query mudou.

## Usuários separados por responsabilidade

Rotas em user.routes.ts; controller em user.controller.ts exporta handlers
independentes e importa userService diretamente; user.service.ts concentra
login/recuperação/redefinição, sem Express, usando UserRepository. User fica em user.entity.ts e
os tipos de entrada/saída em user.auth.dto.ts. Login não expõe password_hash.
Profile e home mantêm middleware Bearer; respostas agora são envolvidas em data.

Mantidos login cliente por e-mail, empresa com bcrypt, JWT1h, recuperação
sem enumeração, token aleatório com hash SHA-256/expiração1h, reset bcrypt10
e limpeza dos tokens. SQL está nos adapters reais; modo local persiste JSON.
Convite/primeiro acesso também utilizam envelopes e erros compartilhados;
pré-validação e ativação conferem o mesmo token/perfil/status.

## Adoção HTTP aprovada

Todos os endpoints atuais do backend adotam AppError e { data, meta? },
com ErrorCode centralizado e handler global. Stack/diagnóstico sanitizados
fora de production; somente status/message em production. Frontend de login ainda não lê esse envelope. A spec de adoção está em
[backend/.specs/adocao-http](../backend/.specs/adocao-http/spec.md).

ErrorCode contém VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
CONFLICT e INTERNAL_ERROR. Services retornam dados ou lançam AppError;
sem LoginFailure/reason ou switch no controller. Falha SQL de empresas
retorna 500 com causa preservada; ausência retorna 404. Auth usa tipos
extraídos em dtos/auth.invite.dto.ts e interfaces/auth.user.row.ts.

## Modo local — 2026-10-12

Flag global, JSON persistido, caixa de saída e novo cadastro protegido de
empresas: ver [guia de uso](dados-locais.md) e [spec](../backend/.specs/dados-locais/spec.md).
Esta necessidade antecipou os adapters e a separação de auth/admin em services.
