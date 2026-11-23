# 08 — Gestão e métricas da Civix

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 04/05/06 + fontes P09.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/platform-management-metrics/spec.md).

Contrato: CT-08-PLATFORM. Não depende de ler conversas da 07.

## Baseline e escopo

[Plan service](../../../src/services/plan.service.ts) atribui plano ao usuário,
sem processar cobrança/venda. Não há ledger financeiro ou medição persistida
IA. Logs Pino são diagnóstico, sem retenção financeira garantida.
Superadministrador consulta empresas, vendas, métricas e gasto IA Civix.

Não entregar mensagens/prompts/transcrições/detalhes de conversa em drilldown,
export ou relatório de custo. Projeções contêm apenas campos aprovados;
não reutilizar APIs empresariais privadas com acesso global irrestrito.

## Dados e regras

Definir origem/semântica/período de indicadores, estornos/cancelamentos,
assinatura, moedas/fuso e gasto estimado versus efetivamente cobrado.
Quantidade de logs/chamadas não é valor monetário comprovado. Captura/
conciliação de dados de fornecedores depende de autorização/integração.
Dados ausentes ou integração indisponível não são zero; retorno distingue estados.

Se aprovado, registrar uso/custo como dados de negócio mínimos, sem conteúdo
privado. Isso não cria tabela de logs: Pino continua sem persistência em banco.
Não implementar billing/provedor/instrumentação completa só para preencher card.

## Tarefas

- [ ] BE-08-01: Aprovar P09, dicionário de indicadores/fontes/filtros/projeções.
- [ ] BE-08-02: Criar migrations incrementais e persistência de fontes aprovadas.
- [ ] BE-08-03: Implementar captura/consulta/conciliação necessárias com repetição
  segura; seleção de plano não conta como pagamento.
- [ ] BE-08-04: Expor CT-08 apenas ao papel da plataforma.
- [ ] BE-08-05: Testar cálculos/período/fuso/moeda, estorno e indisponibilidade.
- [ ] BE-08-06: Testar negativas e ausência de mensagens/prompts/credenciais.
- [ ] BE-08-07: Integrar frontend e documentar fonte/limites nos guias principais.

## Aceite E2E

Gestor consulta dados aprovados com período/fonte/estado conhecidos. Dono/
atendente não obtêm esses dados por URL/API. Não existe ação sobre conversa.
Fonte ausente aparece indisponível, não faturamento/gasto zero. Dados JSON
fictícios são identificados; não servem como prova de vendas reais.

## Aguardando resposta

P09/P07: fórmulas, fonte, fuso/moeda, ingestão/atualização/conciliação, provedor,
integrações financeiras/IA, assinatura ligada à empresa e retenção. Não escolher
serviços nem prometer cobrança automática na spec de dashboard.
