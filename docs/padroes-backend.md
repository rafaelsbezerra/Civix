# Base de padrões do backend

A base reutilizável de erro e sucesso agora é adotada nos endpoints backend.
Paginação permanece como helper, sem aplicação às queries. Frontend fica
para a próxima etapa; envelopes em [api.md](api.md).

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
adotam os contratos de erro e sucesso. Frontend permanece pendente.

## Entrega

Commit documental antes da implementação. Tarefas em branches e worktrees;
dependências reunidas em branch de integração. PRs para `staging`, com o que,
como, por quê, verificações, próximos passos e SQL quando houver nova tabela.

Specs e decisões: [backend/.specs](../backend/.specs/README.md).
Verificação desta adoção é reportada na entrega; testes históricos abaixo são da extração anterior.

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

Verificação: `npm run test:contracts` (14 testes) e
`npm run typecheck:contracts`, dentro de backend. A instalação usou o lockfile
existente, sem scripts de instalação ou atualização de dependências.
Não houve teste em banco ou alteração de contratos do frontend.

## Prisma e próximos passos

O alvo aprovado é Prisma 7/SQL nativo com migration inversa. Este checkout
ainda mistura CLI 6 e client/adapter 7; integração do tooling é separada.
Schema comercial e baseline de banco vazio continuam pendentes.
Próximos passos: frontend, queries paginadas/ordenadas e schema canônico.

## Histórico da extração: usuários e repositories

Interfaces de persistência por módulo ficarão em backend/src/repositories.
Somente interfaces de repositories foram aprovadas; implementações ficam
para depois. A extração anterior afetou apenas userController/userRoute; a adoção
atual adequa erro/sucesso também em auth/admin, preservando regras. SQL permanece
nos services atuais. Ver
[spec](../backend/.specs/usuarios-repositories/spec.md).
Sempre perguntar diante de dúvida antes de implementar a parte afetada.


## Interfaces de persistência preparadas

Disponíveis em repositories/{user,company,plan}.repository.ts. São apenas
interfaces; não são importadas pelos services nem possuem implementações.
SQL continua nos services durante esta etapa. Não há interface query
genérica nem novas factories. Busca sem resultado usa undefined, como
rows[0] nas consultas atuais; atribuição de plano retorna boolean.

User descreve campos observados internamente; password_hash é dado de
persistência, nunca parte da resposta de login. Plan e PlanRow foram
extraídos para entities/plan.entity.ts e interfaces/plan.row.ts; exports
de tipos do service preservados para compatibilidade. Nenhuma query mudou.

## Usuários separados por responsabilidade

Rotas em user.routes.ts; controller em user.controller.ts exporta handlers
independentes e importa userService diretamente; user.service.ts concentra
login/recuperação/redefinição, sem Express. User fica em user.entity.ts e
os tipos de entrada/saída em user.auth.dto.ts. Login não expõe password_hash.
Profile e home mantêm middleware Bearer; respostas agora são envolvidas em data.

Mantidos login cliente por e-mail, empresa com bcrypt, JWT1h, recuperação
sem enumeração, token aleatório com hash SHA-256/expiração1h, reset bcrypt10
e limpeza dos tokens. Repositories são interfaces apenas: o SQL continua
nos services. Na extração anterior, convite/primeiro acesso ficaram intactos.
Nesta adoção seus envelopes/erros são adequados; regras, frontend e schema permanecem.

## Adoção HTTP aprovada

Todos os endpoints atuais do backend adotam AppError e { data, meta? },
com ErrorCode centralizado e handler global. Stack/diagnóstico sanitizados
fora de production; somente status/message em production. Frontend fica
para a próxima etapa por decisão explícita. A spec de adoção está em
[backend/.specs/adocao-http](../backend/.specs/adocao-http/spec.md).

ErrorCode contém VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND,
CONFLICT e INTERNAL_ERROR. Services retornam dados ou lançam AppError;
sem LoginFailure/reason ou switch no controller. Falha SQL de empresas
retorna 500 com causa preservada; ausência retorna 404. Auth usa tipos
extraídos em dtos/auth.invite.dto.ts e interfaces/auth.user.row.ts.

A restrição inicial sem adoção é histórica. Não duplicar success, plan ou
plans no envelope. Implementações dos repositories e paginação seguem
posteriores; incompatibilidades do frontend constam em api.md.


## Verificação da adoção — 2026-10-10

Executado pela tarefa de implementação: npm run test:foundation passou com
36 testes; npm run typecheck:foundation e npm run typecheck:contracts passaram.
Suíte isolada cobre contratos, usuários, empresas, auth, planos, middleware,
404, JSON inválido (400) e corpo acima do limite (413), com persistência/e-mail
simulados. Produção omite diagnóstico; staging preserva stack/cause sanitizados.
Typecheck completo continua bloqueado exclusivamente pelo TS2353 preexistente
em prisma.config.ts (CLI 6/configuração 7). Não houve banco remoto, envio real
de e-mail, migration, dependência nova ou adaptação frontend.
