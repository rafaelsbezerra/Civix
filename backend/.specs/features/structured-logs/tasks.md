# Logs estruturados — tarefas e entrega

Status: implementação autorizada; configuração confirmada; execução em andamento.
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
- [ ] Instalar e fixar libs aprovadas no manifest/lockfile do backend.
- [ ] Criar contrato, adapter, sanitização e contexto AsyncLocalStorage.
- [ ] Integrar middleware antes do parser; gerar requestId interno.
- [ ] Integrar diagnóstico único no handler global, sem alterar respostas.
- [ ] Registrar conclusão/aborto e substituir console de inicialização.
- [ ] Testar contrato, sanitização, exceção não-Error, falha do logger,
  concorrência, isolamento/cleanup, parser inválido e headers já enviados.
- [ ] Testar regressão do HTTP em production e fora dela: comparar corpos
  e status anteriores; nenhum requestId/header novo exposto ao cliente.
- [ ] Atualizar docs gerais de arquitetura/operação/API com comportamento real.

Aceite: LOG-01/02/03/04/06. Não adotar eventos de negócio nos services ainda.
Este commit deve funcionar e ser verificável sem o commit 2.

## Commit 2 — adoção nos services

Mensagem prevista: feat(logging): instrument existing service operations
Dependência: commit 1 validado, disponível na branch desta tarefa.

- [ ] Instrumentar os sete services mapeados, sem mudar assinaturas/retornos.
- [ ] Confirmar gravação/atribuição antes de cada evento de sucesso.
- [ ] Separar token preparado, outbox salva e aceite do provedor.
- [ ] Preservar retornos silenciosos/anti-enumeração e router admin desmontado.
- [ ] Adequar logs do comando local à política, com fronteira de erro única.
- [ ] Testar sucessos/falhas com doubles de repositories/provedor, contextos
  HTTP e não HTTP, ausência de segredos e ausência de diagnóstico duplicado.
- [ ] Cobrir JSON com arquivo temporário e sem enviar e-mail externo; testar
  adapter PostgreSQL por doubles, sem executar banco remoto ou migrations.
- [ ] Atualizar docs gerais e evidências da feature; não marcar teste não executado.

Aceite: LOG-05/06/07. Não modificar regras de autenticação, endpoints ou schema.

## Integração e evidências

- [ ] Reunir branches dependentes na branch de integração, preservando os
  dois commits. Registrar hashes e PRs reais depois de criados.
- [ ] Executar scripts pertinentes existentes no manifest, acrescentando
  testes de logging somente durante implementação autorizada.
- [ ] Registrar comandos/resultados, ambientes e checks não executados.

Hoje existem test:foundation e typecheck:foundation; confirmar scripts na
fase de execução. Não presumir lint/test/build genéricos no backend.
A criação desta spec não executa testes, comandos de banco ou infraestrutura.

Verificação documental: fonte conferida por subagente; cinco links locais da
spec/tarefas verificados, zero ausentes; diff --check sem erros. Nenhum teste
executável, instalação ou alteração de código realizada nesta fase.
