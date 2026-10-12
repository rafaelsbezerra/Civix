# Gestão da Civix e métricas da plataforma

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 08. Tarefas novas permanecem abertas.

## Baseline observada

Não há dashboard plataforma, vendas, métricas ou custo de IA implementados.
Planos têm listagem/seleção, que não equivale a pagamento/venda.
Cards estáticos com zero não demonstrariam indicadores reais.

## Dependências e referências

Depende de etapas 01 a 06 e CT-08-PLATFORM.
[Gestão de empresas](../company-team-management/spec.md) e
[base autenticada](../dashboard-foundation/spec.md).
Modelo/fontes de vendas/custos/agregações precisam ser aprovados no backend.
[Spec backend pareada](../../../../backend/.specs/features/platform-management-metrics/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Superadmin gerencia Civix, empresas, vendas, métricas e custos IA.
- Nunca expor conversa, mensagens, prompts ou impersonação de atendente.
- Separar a visão global de contexto empresarial de dono/atendente.
- Não inventar faturamento, margem, moeda, período ou regra de custo.
- Seleção de plano não representa cobrança, recebimento ou venda.

## Contrato frontend/backend

Propostas: /api/v1/platform/overview, /companies, /sales e /ai-costs
sob /api/v1/platform. Métodos/indicadores/filtros dependem de CT-08-PLATFORM.
Datas, moedas, janelas, margem e fontes são TBD. Dado ausente não é zero;
não criar cálculo contábil ou usar demonstração como fonte real.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Backend de teste fornece dados conhecidos e seus períodos/fontes.
2. Superadmin consulta UI/API reais e confere valores/estados.
3. Zero legítimo, ausência e erro API apresentam estados distintos.
4. Dono/atendente são negados nas URLs plataforma; não há requests de conversas.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-08-01: Implementar gestão/indicadores aprovados somente para superadmin.
- [ ] FE-08-02: Adaptar consumo de valores/períodos/ausência ao contrato canônico.
- [ ] FE-08-03: Implementar ações aprovadas e feedback de falha sem sucesso fictício.
- [ ] FE-08-04: Testar E2E de agregações conhecidas e negação de acesso.

## Aceite

- Indicadores têm significado, origem e período definidos no backend.
- Ausência não vira zero/margem calculada sem regra aprovada.
- Área de plataforma não expõe conversa/mensagem.
- Filtros/consultas respeitam autorização da etapa 04.

## Definições pendentes

**Aguardando resposta:** métricas mínimas, origem vendas/custos IA,
moeda/datas/janelas, significado de margem e ações em empresas.
Endpoints/payloads são propostas; não criar cobranças/gráficos com dados sem origem.

Não houve implementação ou execução de teste ao criar esta spec.
