# 06 — Base dos dashboards

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 03/04/05.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/dashboard-foundation/spec.md).

Contrato: CT-06-DASHBOARD, reutilizando CT-03-SESSION/CT-05-TEAM.

## Baseline e objetivo

[app.ts](../../../src/app.ts) monta usuários/auth/empresas/planos; admin não
está exposto. [Profile](../../../src/controller/user.controller.ts) é confirmação
de token, não contexto completo. Conversas, vendas e medição IA não existem.
Fornecer contexto/operações reais aos shells frontend, sem dados financeiros
fictícios nem implementar 07/08 antecipadamente.

## Fluxo e regras

Sessão válida → perfil com escopo/permissões → shell correspondente →
consultas autorizadas existentes → dados/vazio/indisponibilidade explícitos.
Cada perfil recebe seu próprio escopo. Não enviar plataforma a dono/atendente
nem mensagens empresariais ao gestor Civix por conveniência de uma API genérica.
Recurso não implementado não vira indicador zero ou ação aparentemente funcional.
JSON demonstrativo não comprova banco real ou integração externa.

## Tarefas

- [ ] BE-06-01: Inventariar operações prontas 03/05 e suas permissões/DTOs públicos.
- [ ] BE-06-02: Ajustar projeções necessárias ao shell, sem expor campos internos.
- [ ] BE-06-03: Reutilizar profile da 03, sem contrato de sessão concorrente.
- [ ] BE-06-04: Retirar dependência de placeholders user.home/profile somente
  quando contratos aprovados equivalentes estiverem disponíveis.
- [ ] BE-06-05: Testar shell → perfil → empresa/equipe com dois tenants e negativas.
- [ ] BE-06-06: Integrar CT-06 ao frontend e registrar limites/docs principais.

## Aceite E2E

Login alcança shell correto e operações existentes funcionam. Loading/vazio,
401/403 e indisponibilidade são distinguíveis. Não prometer atendimento/
financeiro funcional antes de 07/08. API segue protegida sem guards frontend.
Contato promocional não tem shell. Navbar pública/telas de acesso preservam
escopo, exceto mudanças explicitamente necessárias da sessão aprovada.

## Aguardando resposta

P07 DTOs/URLs/destinos e resumos mínimos necessários. Não criar endpoint
universal de contagens, websocket, cache ou biblioteca de estado por antecipação.

## Atualização — decisões de escopo de 2026-11-02

Escopo empresarial aprovado: Home, dados/configurações da empresa, equipe,
leads e conversas para admin_empresa/atendente. A Home não apresenta métricas
até aprovação das fontes/indicadores. O dashboard super_admin não faz parte
desta entrega.

A matriz aprovada e centralizada está em
[decisions.md](../../roadmaps/dashboards/decisions.md), DASH-D10–D18.
O shell pode consumir apenas operações reais; módulos sem API permanecem
indisponíveis e não contam como E2E concluído.

**Aguardando resposta:** URLs e contratos HTTP/DTO finais; estados e origem
das conversas; campos editáveis do perfil de atendente; política de recurso
fora do escopo (403/404); modelo de concorrência da atribuição. Não criar
migrations/endpoints antes de aprovar seus contratos.
