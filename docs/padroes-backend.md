# Base de padrões do backend

Esta etapa implementa uma base reutilizável; sua adoção nos módulos existentes
será uma etapa posterior. Não confundir contrato implementado com contrato
já retornado pelos endpoints atuais, documentados em [api.md](api.md).

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
Prisma 8 com migrations TypeScript e reversão por migration inversa aprovado;
o schema de identidade e empresas ainda depende de definição.
Empresas será reorganizado por camadas e tipos preservando suas respostas
atuais. Outros módulos e frontend não adotam os contratos nesta etapa.

## Entrega

Commit documental antes da implementação. Tarefas em branches e worktrees;
dependências reunidas em branch de integração. PRs para `staging`, com o que,
como, por quê, verificações, próximos passos e SQL quando houver nova tabela.

Specs e decisões: [backend/.specs](../backend/.specs/README.md).
Implementação e testes ainda pendentes neste commit documental.

## Implementação da base HTTP

Disponível em `backend/src/contracts/{error,response,pagination}.contract.ts`,
`backend/src/errors/app.error.ts` e `backend/src/middlewares/error.handler.ts`.
Esses arquivos não são importados pelo servidor atual.

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
- Handlers exportados para erro/404 respeitam headers já enviados e não estão
  registrados em `server.ts`.

Exemplo de paginação verificado nos testes:
`parsePagination({ page: '2', pageSize: '100' })` produz
`{ page: 2, pageSize: 100, offset: 100 }`.

Verificação: `npm run test:contracts` (14 testes) e
`npm run typecheck:contracts`, dentro de backend. A instalação usou o lockfile
existente, sem scripts de instalação ou atualização de dependências.
Não houve teste em banco ou alteração de contratos do frontend.

## Prisma e próximos passos

O usuário decidiu aguardar Prisma 8 estável. O registry consultado nesta revisão
publicou CLI 8.0.0-rc.22 e runtime PostgreSQL 8.0.0-rc.17. Não instalar RC nem
alterar configuração/schema/migrations SQL enquanto aguarda. Não existe
monitoramento automático de release.

Na adoção posterior: conectar handlers no servidor, migrar envelopes/controllers
consumidores, implementar queries paginadas com filtros e ordenação estável,
adaptar frontend e definir schema canônico antes das migrations.

## Próxima refatoração: usuários e repositories

Interfaces de persistência por módulo ficarão em backend/src/repositories.
Somente interfaces de repositories foram aprovadas; implementações ficam
para depois. Refatorar apenas userController/userRoute; primeiro acesso e
convites permanecem intactos. SQL permanece nos services atuais. Ver
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
Profile e home permanecem com o middleware Bearer e as respostas atuais.

Mantidos login cliente por e-mail, empresa com bcrypt, JWT1h, recuperação
sem enumeração, token aleatório com hash SHA-256/expiração1h, reset bcrypt10
e limpeza dos tokens. Repositories são interfaces apenas: o SQL continua
nos services. Convite/primeiro acesso, frontend e schema não foram alterados.
