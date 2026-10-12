# Decisões e próxima fase do frontend

Este registro reúne questões para specs futuras. Não aprova padrões,
provedores ou arquitetura novos.

## Decisões necessárias

| ID | Tema | Questão a resolver |
| --- | --- | --- |
| DEC-17 | Dashboards | Funcionalidades/rotas por perfil e definição das métricas |

## Integração autorizada — 2026-10-12

Adaptar consumidores frontend existentes e pré-validação do convite na
branch codex/frontend-backend-integration, dependente do PR #16, para staging.
Login e seus destinos ficam intactos por exclusão explícita. Sem páginas,
rotas, dashboard, cadastro de empresa ou UI nova de seleção de plano.
Home/Sobre permanecem sob AD-002; proposta de animações separada da implementação.
Nenhuma biblioteca nova foi instalada.

HTTP-04-B é parcial: data/message e URLs/campos foram adotados nos demais
consumidores existentes. Pré-validação e ativação usam o mesmo JWT de convite,
perfil/status e invite_token. Reenvio de recuperação continua pendente.
Ver [integração frontend/backend](../../../docs/frontend-backend.md).

## Registros relacionados

DEC-01 a DEC-16 permanecem no [registro backend](../../../backend/.specs/decisions/decisoes.md);
esses IDs não foram renumerados ou aprovados pela reorganização.
AD-002 permanece no [STATE frontend](../STATE.md), sem exigir
retorno ao layout antigo. Decisões de navbar e animações estão na
[spec existente](../features/entry-animations/spec.md).


## Plano de navbar — requisitos confirmados

Nesta etapa, somente documentação para leitura do usuário. Navbar fixa,
106 px, fundo claro após scroll, seção ativa desktop/mobile, compensação de
âncoras e sobreposição abaixo do modal são requisitos futuros aprovados.
Unificar navbar nas páginas públicas, incluindo ajuda/termos/privacidade/404;
preservar login e formulários de acesso. Empresas /#empresas e Planos /#planos;
catálogo pelo botão Ver todas. Contato /#contato fica exatamente como está,
sem novo bloco/ID; sua âncora ausente é um limite preservado.

Motion permanece proposta. Instalação e implementação, inclusive navbar,
aguardam leitura do [plano atualizado](../features/entry-animations/design.md)
e autorização posterior. Nenhuma dessas alterações está implementada agora.
