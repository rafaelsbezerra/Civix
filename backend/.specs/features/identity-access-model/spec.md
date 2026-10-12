# 01 — Identidade, vínculos e permissões

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: decisões funcionais do usuário.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/identity-access-model/spec.md).

## Objetivo e baseline

Definir identidade canônica e matriz de ações antes de schema/sessão.
Hoje [UserRole](../../../src/entities/user.entity.ts) contém empresa/cliente;
[login](../../../src/services/user.service.ts) emite id/email/role e cliente
não comprova identidade por senha. Isso não atende aos três dashboards.

## Regras confirmadas

Dono/atendente têm uma única empresa. Atendente só acessa seus atribuídos.
Superadministrador gerencia Civix e nunca acessa/controla conversas de empresas,
inclusive por busca, export, mensagens ou prompts. Cliente é contato promocional,
sem sessão. Civix cadastra empresa e convida dono. Catálogo permanece público.

| Ação | Superadministrador | Dono | Atendente |
| --- | --- | --- | --- |
| Criar empresa/convidar dono | Permitido na plataforma | Negado | Negado |
| Gerir própria equipe | Não herdar acesso empresarial | Própria empresa; detalhes P06 | Negado |
| Ler atendimento/mensagens | Negado | Escopo próprio a detalhar em 07 | Atribuídos e da própria empresa |
| Atribuir/transferir | Negado | P01 | P01; não presumir fila disponível |
| Vendas/métricas/gasto Civix | Plataforma sem mensagens | Negado para plataforma | Negado |

Permissão não definida permanece negada. Papel, empresa, ação e atribuição
são conceitos distintos; não conceder poder pelo role enviado no login/body.
Identificadores técnicos dos papéis são propostas até P03, sem autoelevação.

## Tarefas

- [ ] BE-01-01: Aprovar enum de papéis/estados e mapa explícito de ações.
- [ ] BE-01-02: Especificar vínculo único e escopo técnico do superadministrador.
- [ ] BE-01-03: Planejar transição do legado empresa/cliente sem perda de dados.
- [ ] BE-01-04: Tipar identidade/contexto/permissões úteis, sem interfaces para tudo.
- [ ] BE-01-05: Evoluir tipos/validadores dos logs para novos papéis, sem dados privados.
- [ ] BE-01-06: Testar matriz, integrar CT-03/04 ao frontend e atualizar docs.

## Aceite E2E

Backend/frontend usam a mesma matriz e negam ações não definidas. Contato de
promoções não obtém sessão. O frontend não decide autorização definitiva.
01 entrega definição/tipos/matriz compartilhados, sem exigir bootstrap ou
telas operacionais ainda dependentes de 03/04/06. Esses cenários E2E são
executados nas entregas consumidoras. Documento escrito não significa
tipos/permissões implementados ou integração executada.

## Aguardando resposta

P01 atribuição, P03 enums/estados, P04 bootstrap/vínculo Civix, P05 legado,
P06 poderes detalhados e P07 contrato. Vínculo único, escopo das personas e
onboarding Civix estão confirmados e não serão perguntados novamente.
