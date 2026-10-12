# Verificação da fundação de logs estruturados

Estado: fundação implementada e verificada na worktree backend-logs-foundation.
Revisão independente da fundação concluída sem bloqueadores novos;
commit 1 d1114da publicado em codex/backend-logs-foundation.
Adoção nos services (commit 2) implementada e verificada na worktree
backend-logs-services, revisão independente sem bloqueadores. Commit 2 e
integração/push/PR do conjunto ainda pendentes de entrega.

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

Os resultados acima são da fundação. Adoção nos sete services e fronteira
CLI é verificada separadamente no commit 2; não usar os 82 testes anteriores
para afirmar conclusão da adoção.

Sem banco remoto, migration, envio externo, tabela ou alteração de dados locais.
Destino remoto, retenção e busca histórica dependem de infraestrutura futura;
logging interno não é auditoria durável. AGENTS não foi modificado.


## Adoção nos services — implementação verificada

Services de empresas, planos, usuários, auth, admin, mail e mock.user usam
getLogger. Eventos de criação/atribuição/troca de senha/ativação seguem a
confirmação da etapa. Autenticação é registrada após gerar o token, sem
registrá-lo. Consultas usam debug, operação/contagem/IDs, sem termo ou objeto.

mail.outbox.saved e mail.provider.accepted representam estados distintos:
gravação JSON e aceite do provedor, nunca entrega final de e-mail.
A função delegadora não repete o evento. Token preparado permanece uma etapa
confirmada quando um envio posterior falha; diagnóstico único na fronteira
HTTP/CLI. Recuperação de conta inexistente conserva retorno silencioso.

CLI envia prompts para stderr e reserva stdout ao logger; no modo JSON,
nenhuma linha interativa mistura-se aos registros. Não imprime objeto/e-mail
retornado pelo service, registra erro
estruturado único na fronteira e fecha readline/logger. Admin continua
desmontado; repositories não receberam instrumentação.

Resultados finais da adoção:

- test:foundation: 99/99 aprovados.
- Suíte de services: 17/17 aprovados.
- Fundação de logging: 22/22 aprovados.
- typecheck:foundation e typecheck:contracts: exit 0.
- Revisão independente da adoção: sem bloqueadores.

Os testes cobrem sucessos somente após gravação/atribuição confirmada,
ausência de sucesso na etapa que falhou, token preparado antes de falha
de envio, ownership único de mail, anti-enumeração, logger que falha,
contexto HTTP/não HTTP e isolamento de dados sensíveis. Persistência local
usa fixture temporária; PostgreSQL/Resend usam doubles, sem acesso externo.

CLI positivo interativo confirmou prompts em stderr e logs JSON em stdout,
sem imprimir e-mail/objeto. Configuração inválida é capturada pela fronteira
graças aos imports dinâmicos; produz erro estruturado e exit code de falha,
sem stack bruto do Node. Logger/readline encerrados após a operação.

A branch codex/backend-logging-integration existe sobre d1114da e aguarda
commit 2/merge da adoção. Não há hash do commit 2 ou número/URL de PR neste
registro. A entrega final para staging será documentada após as ações reais.
