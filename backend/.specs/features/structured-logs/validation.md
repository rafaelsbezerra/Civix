# Verificação da fundação de logs estruturados

Estado: fundação implementada e verificada na worktree backend-logs-foundation.
Revisão independente concluída sem bloqueadores novos. Adoção nos services
(commit 2), integração/push/PR seguem etapas de entrega separadas; nenhum
hash ou número de PR é inventado neste documento.

## Contrato e escopo

Pino 10.4.0, pino-http 11.0.0 e pino-pretty 13.2.0 fixados. Registro interno
canônico com timestamp UTC ISO, level em texto, event/module/message e,
quando pertinente, requestId/context/http/error. Sem schemaVersion/service/
environment ou limites arbitrários de tamanho/profundidade/truncamento JSON.

UUID interno por requisição propagado por AsyncLocalStorage; contexto
encerrado não acompanha tarefas tardias. Middleware antes do parser.
completed/aborted mutuamente exclusivos; diagnóstico failed no handler,
sem stack/details duplicados no resumo. Falha do logger não altera retorno
ou exceção original. Pretty restrito a development; debug padrão nesse
ambiente e info/JSON nos demais. LOG_LEVEL validado em cinco níveis.

Corpos/status HTTP preservados. UUID interno não vira header/campo de
resposta; requestId opcional no serializador continua como antes. Sem
instrumentação de services/repositories ou comando local nesta fundação.

## Resultados finais

- test:foundation: 82/82 aprovados.
- test:logging: 22/22 aprovados.
- typecheck:foundation e typecheck:contracts: aprovados.
- Processo filho com pino-pretty: iniciou/emitiu/fechou, sem worker pendente.
- Revisão independente: concluída; nenhum bloqueador novo após correções.

A rodada inicial de 75 foundation/15 logging antecedeu sete casos adicionais.
Os resultados finais acima substituem o estado provisório anterior.

## Cobertura e correções verificadas

Os testes cobrem JSON canônico, níveis/filtro, ALS após await, concorrência/
cleanup, diagnóstico sanitizado em produção, registros longos/profundos sem
cap arbitrário, ciclos/acessores, allowlist, logger/destino quebrado,
fechamento idempotente e preservação de destino injetado.

HTTP cobre parser inválido, rotas desconhecidas, ausência de payload/query/
parâmetros concretos no log, headers já enviados e aborto de conexão.
Arrays de aliases são normalizados pelo primeiro alias registrado.

O tratamento terminal após erro com headersSent preserva a resposta parcial/
erro encaminhado e destrói a conexão sem console.error bruto do Express.
Caso de produção verificou failed uma vez, aborted uma vez e console.error
zero. Pretty não pode ser ativado fora de development.

## Limites e próxima etapa

Adoção nos sete services e fronteira do comando local pertence ao commit 2.
Eventos comerciais só seguem confirmação de persistência/atribuição/aceite,
sem transformar token preparado em e-mail entregue.

Sem banco remoto, migration, envio externo, tabela ou alteração de dados locais.
Destino remoto, retenção e busca histórica dependem de infraestrutura futura;
logging interno não é auditoria durável. AGENTS não foi modificado.
