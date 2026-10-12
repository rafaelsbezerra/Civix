# Base dos dashboards autenticados

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 06. Tarefas novas permanecem abertas.

## Baseline observada

AppRoute contém site público/acesso, sem dashboard/guard. Login encaminha
empresa a /dashboard-empresa, inexistente. Componentes/tokens visuais do site
não são layout operacional autenticado nem indicadores reais.

## Dependências e referências

Depende de etapas 01 a 05 e CT-06-DASHBOARD.
Serve de base a [atendimento](../assigned-attendance/spec.md) e
[plataforma](../platform-management-metrics/spec.md).
Consome [sessão](../authentication-session/spec.md) e [autorização](../tenant-authorization/spec.md).
[Spec backend pareada](../../../../backend/.specs/features/dashboard-foundation/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Planejar áreas distintas de dono, atendente e superadmin.
- Menu/contexto derivam do bootstrap, não da escolha visual no login.
- Superadmin não recebe navegação de conversas; atendente só vê atribuídos.
- Site institucional e acesso não se tornam dashboard público.
- Reutilizar o padrão visual atual, sem impor biblioteca/animar login.

## Contrato frontend/backend

Consumir a evolução de GET /api/v1/users/profile para bootstrap.
DTO/rotas frontend privadas e recursos do shell aguardam CT-06-DASHBOARD.
Não inventar resumo/métricas antes da etapa 08. Ausência de dados não vira
zero fictício; distinguir loading, vazio legítimo e erro.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Login no backend real fornece sessão/profile e área autorizada.
2. Navegar/recarregar conserva somente o contexto permitido.
3. Expiração/negação interrompe área privada sem dados anteriores.
4. API indisponível mostra erro; não preencher dashboard com mock frontend.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-06-01: Implementar shell/menu/contexto e rotas aprovadas por perfil.
- [ ] FE-06-02: Implementar bootstrap, loading/erro e acessibilidade do shell.
- [ ] FE-06-03: Integrar saída da sessão e limpeza de estado privado.
- [ ] FE-06-04: Testar E2E da navegação autenticada com API real.

## Aceite

- Rotas futuras existem antes do redirecionamento para elas.
- Shell não oferece capacidade ausente no bootstrap.
- Teclado/foco e estados de loading/erro/vazio continuam utilizáveis.
- Nenhum indicador é apresentado como real sem resposta correspondente.

## Definições pendentes

**Aguardando resposta:** URLs/nomes das áreas privadas e DTO mínimo do shell.
Sessão depende da etapa 03; não escolher storage ou renovação silenciosamente.
Indicadores comerciais permanecem na etapa 08.

Não houve implementação ou execução de teste ao criar esta spec.
