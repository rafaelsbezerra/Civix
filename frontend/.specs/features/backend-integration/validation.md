# Histórico documental e verificações

## Entrega registrada

# Integração do frontend com o backend

Implementação autorizada em 2026-10-12 na branch codex/frontend-backend-integration,
derivada do PR #16. Consumidores do escopo adaptados; verificações direcionadas concluídas.
Entrega publicada no [PR #17](https://github.com/rafaelsbe/Civix/pull/17),
aberto para staging e dependente do [PR #16](https://github.com/rafaelsbe/Civix/pull/16).

## Escopo da integração

## Escopo preservado

Login e seus destinos permanecem intactos por orientação explícita do usuário;
a leitura de token/erro no login ainda está pendente para outra etapa.
Não há dashboard, novas rotas, formulário de cadastro ou UI nova de seleção.
Plans.tsx permanece sem rota; PlanCard continua com seu link atual.
Empresas mantêm os nomes retornados pelo backend, como descricao_detalhada.

Nenhuma biblioteca foi instalada e nenhuma animação foi implementada nesta entrega. O planejamento
do site está em [plano de animações](../entry-animations/design.md).

## Verificação da integração

## Verificação

Baseline anterior à implementação: 42/54 testes frontend aprovados; doze falhas
históricas em layout, rotas, assets e localStorage do Node 25. Lint aponta
set-state-in-effect em SignSelect; build aponta a caixa do import ResetPassword.
Após os ajustes, os 25 testes direcionados de contratos/consumidores frontend e
os 60 testes foundation backend passaram. Os typechecks backend, TypeScript e
Vite frontend passaram. O import de ResetPassword foi corrigido; o build completo
continua falhando no gate histórico do asset dashboard.png de Sobre. Lint mantém
o erro preexistente react-hooks/set-state-in-effect em SignSelect. Esses limites
não autorizam restaurar os requisitos históricos de Home/Sobre (AD-002).
A suíte completa frontend terminou em 65/77, mantendo as mesmas doze falhas
históricas da baseline em sete arquivos, sem novas falhas.

Smoke HTTP real: nove verificações aprovadas com Express e JSON temporário
isolado. No navegador, catálogo exibiu duas empresas, busca por “Ação + Saúde”
retornou uma, perfil apresentou descricao_detalhada e a Home carregou empresas
e um plano da API sem login. A verificação cobriu dados/sucesso; os estados de
erro/cancelamento dos formulários foram cobertos pelos testes direcionados.
Servidores e fixture foram temporários; o JSON local real foi preservado.
Nenhum banco remoto, envio externo de e-mail ou instalação foi utilizado.

Spec: [integração](spec.md).

## Integração frontend/backend — 2026-10-12

Na branch codex/frontend-backend-integration, dependente do PR #16, os
consumidores existentes usam VITE_API_URL como origem, com padrão
http://localhost:3000. Valores terminados em /api/v1 também são aceitos pelos
helpers comuns sem repetir prefixo. Empresas/planos/recuperação usam /api/v1;
convite/primeiro acesso usam /api/auth. Login permaneceu intacto e excluído,
portanto sua configuração/envelope continuam pendentes.

Verificação da entrega: 25 testes direcionados frontend, 60 backend,
typechecks frontend/foundation/contratos e Vite aprovados. npm run build do
frontend executa etapas adicionais: o gate de assets Sobre permanece com
falha histórica (AD-002). npm run lint também falha em SignSelect preexistente.
Não declarar build/lint completos aprovados. Sem instalação de dependências,
banco real, envio externo, schema ou migrations.

Procedimento e limites: [integração frontend/backend](../../../../docs/frontend-backend.md).

## Registro arquitetural da integração

## Integração dos consumidores existentes — 2026-10-12

A branch codex/frontend-backend-integration depende do PR #16 e tem destino
staging. Sem dashboard, páginas/rotas novas ou alteração de login. A
pré-validação de convite usa o mesmo JWT, perfil/status e invite_token da
ativação; o protocolo divergente de reenvio permanece pendente.
HTTP-04-B continua parcialmente completo. Ver [integração](../../../../docs/frontend-backend.md).

## Adoção HTTP e login — 2026-10-19

Implementação na branch `codex/frontend-http-adoption`, a partir da staging
`3fe5868`. O transporte retorna o envelope validado; cada service extrai
`data`. Login usa a origem comum, retorna token/usuário e apresenta somente
a mensagem pública, preservando papéis e destinos existentes.

Verificações executadas:

- 29 testes direcionados passaram: `npm test -- src/lib/api.test.ts
  src/pages/BackendConsumers.test.tsx --maxWorkers=1`. Incluem login dos dois
  perfis, gravação do token, navegação, erro público sem diagnóstico, rede e
  envelope inválido, além dos consumidores anteriores.
- `node node_modules/typescript/bin/tsc -b`: aprovado.
- `npm run lint` e lint direcionado aos quatro arquivos alterados: aprovados.
- `npm run build`: TypeScript e Vite aprovados; verificador posterior falha
  em `Missing About asset in build manifest: dashboard.png`. Essa checagem
  e os assets Sobre não foram alterados nesta tarefa.
- Revisão independente do código e documentação concluída; `git diff --check`
  aprovado. Dependências existentes reutilizadas, sem instalação.

Não executados: suíte completa, navegador com backend real e banco remoto.
Dashboard de empresa segue fora do escopo; o destino existente foi preservado.
