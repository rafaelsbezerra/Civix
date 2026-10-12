# Logs estruturados internos

Status: fundação publicada; adoção nos services/CLI implementada e verificada
nesta worktree, com revisão independente concluída. Data: 2026-10-12.
Base examinada: staging 258da1a. Entrega: [tarefas e commits](tasks.md).

## Objetivo e decisões confirmadas

Facilitar diagnóstico, acompanhamento de falhas e rastreabilidade dos fluxos,
sem criar tabela, migration ou alterar regras de negócio e respostas HTTP.
Logs não constituem uma trilha de auditoria durável nem comprovam entrega
externa; retenção e consulta futura dependem da infraestrutura de coleta.

- Pino + pino-http; pino-pretty somente no desenvolvimento.
- AsyncLocalStorage propaga o contexto até services sem importar Express.
- Logs internos podem conter stack e causa sanitizados em todos os ambientes.
- Resposta HTTP permanece exatamente como implementada: produção usa
  status/message; outros ambientes mantêm diagnóstico sanitizado existente.
  Sucesso, status, headers de negócio e fluxos de autenticação não mudam.
- Separar estrutura/contrato/middleware e adoção nos services em dois commits.
- Implementação autorizada em 2026-10-12 após revisão do usuário. O registro
  não contém schemaVersion, service ou environment, removidos na revisão.

## Estado atual e pontos de integração

[app.ts](../../../src/app.ts) registra log.middleware antes do parser/CORS/
routers. O [handler global](../../../src/middlewares/error.handler.ts) emite
http.request.failed com diagnóstico original sanitizado e mantém a resposta
serializada existente. [server.ts](../../../src/server.ts) usa server.started/
server.failed, sem console de inicialização.

O contexto AsyncLocalStorage possui UUID interno por requisição. Não é
acrescentado requestId ao contrato HTTP ou header de resposta. A presença
opcional de requestId no contexto do serializador continua como antes.
Manifest/lockfile fixam pino 10.4.0, pino-http 11.0.0 e pino-pretty 13.2.0.

Services e adapters JSON/PostgreSQL já existem. Preservar routes → controller
→ service e seletores de persistência; não instrumentar repositories nesta
entrega nem expor o router administrativo hoje desmontado.

## Contrato de saída

Um objeto JSON por linha, com campos abaixo. O adapter configura os nomes
canônicos: o formato padrão do Pino não é o contrato do projeto. A interface
de emissão exige evento e mensagem e permite somente contexto tipado; a
biblioteca não deve ser importada diretamente por cada service.

| Campo | Regra |
| --- | --- |
| timestamp | Data UTC ISO 8601, gerada pelo logger |
| level | debug, info, warn, error ou fatal |
| event | Identificador estável em inglês, como company.created |
| module | Área responsável, como companies, users, auth, plans, mail ou http |
| message | Texto legível em português, sem segredos |
| requestId | UUID gerado internamente; obrigatório no contexto HTTP, ausente fora dele |
| context | Campos explicitamente permitidos por evento, sem payload livre |
| http | Quando pertinente: method, route normalizada, statusCode e durationMs |
| error | Quando pertinente: name, code, status, message, stack, details e cause sanitizados |

Exemplo ilustrativo do contrato interno de log. company.created é emitido
pelo service somente após a criação confirmada pelo repository:

~~~json
{
  "timestamp": "2026-10-12T18:30:00.000Z",
  "level": "info",
  "event": "company.created",
  "module": "companies",
  "requestId": "d442d53f-9e2a-43b2-8ba0-721d3e1b21e9",
  "message": "Empresa cadastrada com sucesso",
  "context": { "companyId": "empresa-exemplo", "persistenceMode": "json" }
}
~~~

IDs são internos; objetos de usuário/empresa não entram no log. Usar debug
para consultas/validações rotineiras, info para mudanças confirmadas, warn
para falhas HTTP esperadas, error para falhas inesperadas/5xx e fatal para
falha que impede a inicialização. Não adicionar reason nem switch por cenário;
reaproveitar AppError/ErrorCode e classificação central pelo status.

## Estrutura, middleware e erros

Arquivos implementados, seguindo domínio.papel.ts:

- src/shared/logging/log.contract.ts: contrato e interface de emissão.
- src/shared/logging/log.logger.ts: adapter Pino, nível, formato e sanitização.
- src/shared/logging/log.context.ts: AsyncLocalStorage e acesso ao logger atual.
- src/shared/logging/log.sanitizer.ts: allowlist e sanitização de texto/diagnóstico.
- src/middlewares/log.middleware.ts: contexto e ciclo HTTP.

Registrar o middleware antes de express.json e das demais etapas que possam
falhar. Gerar UUID interno sem confiar em IDs enviados pelo cliente. Não
acrescentar header/campo à resposta HTTP nesta entrega.

Cada requisição tem contexto próprio, preservado por await e chamadas
aninhadas. A conclusão emite http.request.completed com método, rota padrão,
status final e duração; conexão encerrada prematuramente emite
http.request.aborted, sem emitir também completed. Rotas não reconhecidas
usam identificador genérico; excluir query e parâmetros concretos sensíveis.

O handler global emite http.request.failed uma única vez com diagnóstico do
erro original, incluindo falhas do parser. O registro de conclusão pode
coexistir como resumo HTTP, mas não repetir stack/details. Preservar o
encaminhamento de erros quando headersSent=true, sem tentar responder de novo.

Usar logger base fora de HTTP, sem fabricar requestId. Falhas propagadas
pelos services ficam para o handler; não adicionar catch-log-throw em todas
as camadas. Erro de comando local é registrado uma vez na fronteira do comando.
Falha do mecanismo de logging não pode mudar o resultado de negócio ou
substituir a exceção original; testar esse comportamento com destino simulado.

## Sanitização e operação

Emitir JSON no destino padrão do processo, sem tabela nem arquivo local de
logs obrigatório. Leitura formatada é restrita ao desenvolvimento; homologação
e produção preservam JSON. Definir LOG_LEVEL com validação; inicialmente
usar debug em development e info nos demais ambientes, sem alterar NODE_ENV existente.

Permitir IDs internos, role, contagem, tipo de operação e modo json/postgres.
Excluir e-mail, nome, senha/hash, JWT, cookies, Authorization, tokens/hash de
reset, links de convite/reset, connection strings, parâmetros SQL, bodies e
respostas integrais de provedores. Não registrar originalUrl indiscriminadamente.

Combinar allowlist com redaction do Pino e sanitização de strings/stack/cause.
A sanitização HTTP atual pode ser reutilizada onde aplicável, mas é insuficiente
para todo texto arbitrário: cobrir tokens em URLs, e-mail e credenciais em
causas externas. Não limitar nem truncar registros por tamanho; tratar ciclos/objetos lançados
sem instância de Error, sem invocar getters não confiáveis.

## Adoção implementada nos services

| Service atual | Eventos e contexto permitidos |
| --- | --- |
| company.service.ts | company.created somente após create resolvido; buscas em debug com operação/contagem, sem termo de busca ou objeto completo |
| plan.service.ts | plans.listed em debug com contagem; plan.assigned em info somente se atribuição confirmada, com userId/planId; retorno null não representa sucesso |
| user.service.ts | user.authenticated depois da geração do token, sem token/e-mail; user.password-reset.prepared após persistência do reset; user.password.changed após atualização |
| auth.service.ts | auth.invite.validated em debug; auth.first-access.completed após activateUser confirmado; auth.password-reset.prepared após saveResetToken |
| mail.service.ts | mail.outbox.saved após escrita JSON; mail.provider.accepted após provedor aceitar; contexto tipo invite/password-reset e modo, sem destinatário/links/HTML |
| admin.service.ts | admin.invite.prepared após saveInvite; sem abrir endpoint ou registrar token/e-mail; envio tem evento próprio de mail |
| mock.user.service.ts | mock.user.created após gravação JSON, com userId/role; sem inventar requestId HTTP |

Preservar o retorno silencioso de recuperação para usuário inexistente.
Não adicionar logs informativos com identidade/resultado que revelem essa
condição. Funções utilitárias signToken/hashPassword/comparePassword não
registram argumentos nem geram logs repetitivos. sendForgotPasswordEmail
delega sendResetPasswordEmail: o log de envio pertence à função executora.

Preparação de token e envio são etapas diferentes: se o envio falhar depois
de salvar o token, manter o evento de preparação e registrar a falha no
handler. Não declarar operação inteira concluída nem e-mail entregue.
O comando mock:user:create usa a mesma política para mensagens de
log, sem transformar o objeto retornado pelo service em contexto completo.

## Critérios de aceite

- LOG-01: todo registro respeita o contrato e a política de dados permitidos.
- LOG-02: contexto HTTP existe antes do parser; IDs não se misturam entre
  requisições simultâneas; chamadas fora de HTTP não herdam contexto encerrado.
- LOG-03: erros conhecidos/desconhecidos preservam stack/causa sanitizados
  internamente em produção; respostas existentes permanecem iguais em todos os ambientes.
- LOG-04: conclusão/aborto e erro têm ownership único; sem duplicar diagnóstico.
- LOG-05: eventos de services representam etapas realmente confirmadas em
  JSON e PostgreSQL; zero evento de sucesso da etapa que falhou.
- LOG-06: dados sensíveis ausentes inclusive em URLs, stack, cause e erro de
  provedor; logging não altera retorno, status, negócio ou exceção original.
- LOG-07: estrutura e adoção são revisáveis em commits distintos, cada qual
  com testes pertinentes e atualização da documentação principal.

## Configuração confirmada e infraestrutura pendente

Confirmados: pino 10.4.0, pino-http 11.0.0 e pino-pretty 13.2.0; LOG_LEVEL
padrão debug em development e info nos demais ambientes, com override validado.
O usuário dispensou limite de tamanho dos registros JSON; não aplicar truncamento
por tamanho ou limite arbitrário de diagnóstico/contexto. Sanitizar segredos e
representar referências circulares continua necessário.

**Aguardando resposta:** destino e retenção futura de coleta.
Destino remoto e retenção ficam para infraestrutura; não bloqueiam a saída
JSON local, mas não prometer busca histórica antes dessa integração.

Referências: [Pino](https://github.com/pinojs/pino),
[pino-http](https://github.com/pinojs/pino-http),
[redaction](https://github.com/pinojs/pino/blob/main/docs/redaction.md) e
[pino-pretty](https://github.com/pinojs/pino-pretty).


## Verificação da fundação

Rodada final: 82/82 testes de foundation e 22/22 de logging aprovados;
typecheck:foundation e typecheck:contracts passaram. Processo filho com
pino-pretty iniciou, emitiu e encerrou sem worker pendente.

Revisão independente concluída sem bloqueadores novos. Foram corrigidos
aliases de rotas em arrays (normalização pelo primeiro alias registrado) e
o tratamento terminal de erro após headersSent: encaminhamento/erro original
preservados, conexão destruída e nenhum console bruto do Express. O caso
verifica um único failed e um único aborted.

Esses resultados pertencem ao commit 1, d1114da, publicado na branch
codex/backend-logs-foundation. O commit 2 adota eventos nos services e é
verificado separadamente; não usar essa contagem para atestar a adoção.
Sem schema/migration ou alteração HTTP. [Evidências](validation.md).


## Adoção e entrega separadas

Os sete services usam getLogger, preservando retornos/assinaturas. Mudanças
geram eventos após confirmação; consultas/validação usam debug sem termos
de busca, e-mail, token ou objetos completos. Não instrumentar os repositories.

Preparação de convite/reset precede o envio. mail.outbox.saved ocorre após
gravação JSON; mail.provider.accepted após aceite do Resend, sem afirmar
entrega ao destinatário. sendForgotPasswordEmail apenas delega: a função
executora possui o único evento de envio. Falhas propagadas pertencem ao
handler HTTP, sem catch-log-throw repetido em cada service.

No comando local, mock.user.created pertence ao service após persistência,
sem imprimir objeto/e-mail de retorno. Prompts usam stderr para não
misturar texto de interação com stdout dos logs. mock.user-command.failed pertence à
fronteira CLI; readline e logger são fechados. Fora de HTTP não fabricar UUID.
Admin continua desmontado; instrumentar inviteUser não expõe endpoint.

Fundação d1114da e adoção 5258124 publicadas em branches próprias.
A branch codex/backend-logging-integration reúne as duas por fast-forward.
PR [#19](https://github.com/rafaelsbe/Civix/pull/19) aberto para staging, aguardando revisão/merge.
O código integrado é o mesmo validado com 99 testes; esta atualização final
altera somente Markdown. Não tratar PR aberto como merge em staging.

Verificação final da adoção: 99/99 foundation, 17/17 services e 22/22 da
fundação de logging; ambos typechecks aprovados. Revisão independente sem
bloqueadores. [Evidências](validation.md).
