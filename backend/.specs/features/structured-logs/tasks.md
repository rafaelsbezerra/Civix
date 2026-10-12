# Logs estruturados — tarefas e entrega

Status: fundação publicada em d1114da; adoção nos services implementada/
verificada, revisão independente concluída. Commit 2/integração/PR pendentes.
Referência: [spec](spec.md). Data: 2026-10-12.

## Fase documental atual

- [x] Conferir app, handler, contrato de erro, manifest e sete services.
- [x] Confirmar Pino/pino-http, pino-pretty local e AsyncLocalStorage.
- [x] Confirmar diagnóstico interno sanitizado em todos os ambientes.
- [x] Especificar contrato, contexto, middleware e eventos de services.
- [x] Separar estrutura e adoção em dois commits de implementação.
- [x] Revisar links/escopo e preparar entrega documental antes do código.

O commit documental é próprio e antecede os dois commits abaixo. Criar
branches/worktrees por tarefa e uma terceira branch de integração para
reunir as entregas dependentes, conforme AGENTS; PRs apontam para staging.
Branches de implementação autorizadas; instalar libs após confirmar versões
e registrar as decisões pendentes. O contrato revisado exclui schemaVersion,
service e environment.

## Commit 1 — estrutura e integração HTTP

Mensagem prevista: feat(logging): add structured logging foundation

- [x] Versões e LOG_LEVEL confirmados; sem limite de tamanho dos registros.
- [x] Instalar e fixar libs aprovadas no manifest/lockfile do backend.
- [x] Criar contrato, adapter, sanitização e contexto AsyncLocalStorage.
- [x] Integrar middleware antes do parser; gerar requestId interno.
- [x] Integrar diagnóstico único no handler global, sem alterar respostas.
- [x] Registrar conclusão/aborto e substituir console de inicialização.
- [x] Testar contrato, sanitização, exceção não-Error, falha do logger,
  concorrência, isolamento/cleanup, parser inválido e headers já enviados.
- [x] Testar regressão do HTTP em production e fora dela: comparar corpos
  e status anteriores; nenhum requestId/header novo exposto ao cliente.
- [x] Atualizar docs gerais de arquitetura/operação/API com comportamento real.

Aceite: LOG-01/02/03/04/06. Não adotar eventos de negócio nos services ainda.
A fundação funciona sem eventos de negócio do commit 2. Rodada final:
82 testes foundation, 22 logging e dois typechecks aprovados; revisão concluída.

## Commit 2 — adoção nos services

Mensagem prevista: feat(logging): instrument existing service operations
Dependência: commit 1 d1114da validado/publicado em codex/backend-logs-foundation.

- [x] Instrumentar os sete services mapeados, sem mudar assinaturas/retornos.
- [x] Confirmar gravação/atribuição antes de cada evento de sucesso.
- [x] Separar token preparado, outbox salva e aceite do provedor.
- [x] Preservar retornos silenciosos/anti-enumeração e router admin desmontado.
- [x] Adequar logs do comando local à política, com fronteira de erro única.
- [x] Testar sucessos/falhas com doubles de repositories/provedor, contextos
  HTTP e não HTTP, ausência de segredos e ausência de diagnóstico duplicado.
- [x] Cobrir JSON com arquivo temporário e sem enviar e-mail externo; testar
  adapter PostgreSQL por doubles, sem executar banco remoto ou migrations.
- [x] Atualizar docs gerais e evidências da feature; não marcar teste não executado.

Aceite: LOG-05/06/07. Não modificar regras de autenticação, endpoints ou schema.

## Integração e evidências — ainda pendentes

- [ ] Reunir branches dependentes na branch de integração, preservando os
  dois commits. Registrar hashes e PRs reais depois de criados.
- [x] Executar scripts pertinentes existentes no manifest, acrescentando
  testes de logging somente durante implementação autorizada.
- [x] Registrar comandos/resultados, ambientes e checks não executados.

Hoje existem test:foundation e typecheck:foundation; confirmar scripts na
fase de execução. Não presumir lint/test/build genéricos no backend.
A criação desta spec não executa testes, comandos de banco ou infraestrutura.

Verificação documental: fonte conferida por subagente; cinco links locais da
spec/tarefas verificados, zero ausentes; diff --check sem erros. Nenhum teste
executável, instalação ou alteração de código realizada nesta fase.


## Rodada da fundação

- [x] Executar test:foundation (82/82 finais; primeira rodada histórica 75).
- [x] Executar test:logging (22/22 finais).
- [x] Executar typecheck:foundation e typecheck:contracts.
- [x] Verificar pino-pretty em processo filho e fechamento de seu worker.
- [x] Incorporar parecer independente e sete casos adicionais: allowlist, profundidade, fechamento, rota desconhecida, falha produção, aliases e headersSent.
- [x] Criar/publicar commit 1 d1114da em codex/backend-logs-foundation, sem adoção nos services.

Histórico documental de criação da spec acima permanece anterior ao código.
Estado atual/evidências: [validation.md](validation.md).


## Rodada final da adoção

- [x] test:foundation: 99/99.
- [x] Suíte services: 17/17; fundação de logging: 22/22.
- [x] typecheck:foundation e typecheck:contracts: exit 0.
- [x] Parecer independente da adoção: sem bloqueadores.
- [x] CLI positivo com prompts stderr/logs stdout e configuração inválida
  capturada por import dinâmico com erro estruturado.
- [ ] Criar/publicar commit 2, preservando separação de d1114da.
- [ ] Integrar adoção à branch codex/backend-logging-integration e abrir PR
  para staging; registrar somente hashes/URL reais depois dessas ações.

A branch de integração existe sobre d1114da; a reunião do commit 2 ainda
não foi executada neste registro. [Validação](validation.md).
