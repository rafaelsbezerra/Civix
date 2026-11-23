# Base dos dashboards autenticados

**Estado:** implementação parcial do shell; operações de domínio não implementadas.
**Ordem:** 06. Tarefas novas permanecem abertas.

## Baseline observada

AppRoute contém o site público e o dashboard empresarial protegido. Login
encaminha admin_empresa e atendente para /dashboard-empresa após autenticação.
O shell usa o perfil confirmado pelo backend; suas áreas de domínio ainda não
estão integradas.

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
- Superadmin não recebe navegação empresarial. A matriz do atendente permite
  itens atribuídos e disponíveis, conforme DASH-D13; as consultas ainda não
  existem neste shell.
- Site institucional e acesso não se tornam dashboard público.
- Reutilizar o padrão visual atual, sem impor biblioteca/animar login.

## Contrato frontend/backend

Consumir a evolução de GET /api/v1/users/profile para bootstrap.
As rotas frontend do shell são /dashboard-empresa e suas seções. Endpoints,
DTOs de domínio e operações privadas aguardam contratos aprovados.
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

- [x] FE-06-01: Implementar shell/menu/contexto e rotas do dashboard empresarial.
- [x] FE-06-02: Reutilizar bootstrap existente, loading/erro e acessibilidade básica.
- [ ] FE-06-03: Integrar saída da sessão e limpeza de estado privado.
- [ ] FE-06-04: Testar E2E da navegação autenticada com API real.

FE-06-01/02 cobrem o shell e a apresentação visual da Home. As opções de
navegação ficam no menu lateral; a visão geral inclui gráficos e indicadores
fictícios somente para demonstração, com aviso visível de que não são dados da
empresa. Equipe e configurações são rotas de proprietário; leads e conversas
são telas com estado explícito de indisponibilidade para os perfis empresariais.

## Aceite

- Rotas futuras existem antes do redirecionamento para elas.
- Shell não oferece capacidade ausente no bootstrap.
- Teclado/foco e estados de loading/erro/vazio continuam utilizáveis.
- Nenhum indicador é apresentado como real sem resposta correspondente.

## Definições pendentes

**Aguardando resposta:** contratos HTTP/DTOs para operações do domínio, política
de recursos fora de escopo e decisões de sessão/revogação ainda listadas nas
etapas relacionadas. Não escolher armazenamento ou renovação silenciosamente.
Indicadores comerciais permanecem na etapa 08.

## Atualização — decisões de escopo de 2026-11-02

O escopo aprovado para o dashboard empresarial inclui Home sem métricas,
empresa/configurações, equipe, leads e conversas. A matriz de capacidades
está em [decisions.md](../../../../backend/.specs/roadmaps/dashboards/decisions.md),
DASH-D10–D18. Cadastro de usuário cliente não concede dashboard; usuário
de equipe não é lead; o contato com uma empresa pelo perfil público cria o
lead vinculado àquela empresa.

O shell não apresenta conteúdo de exemplo nem transforma módulo sem API em
funcionalidade concluída. O menu deriva do perfil verificado; rotas de
proprietário não são acessíveis ao atendente. O guard do frontend é apenas
controle de navegação e não substitui autorização backend por requisição.

O shell não repete as opções do menu em cartões de navegação na visão geral.
A Home usa a paleta institucional Civix (marinho, dourado e marfim), mantém o
conteúdo demonstrativo sem o aviso destacado “Modo demonstração” e oferece
alternância entre tema escuro e claro. A navegação lateral exibe a logo Civix
com contraste adequado ao fundo marinho. Cada destino tem título,
descrição e motivo específico de indisponibilidade; não apresenta ausência de
registros como uma lista vazia legítima. Os gráficos não comprovam integração,
fonte real ou funcionalidade dos módulos. Ainda não há fluxos E2E de operações
reais, autorização por tenant, logout, equipe, perfil empresarial, leads,
conversas ou capa.

**Aguardando resposta:** DTOs e contratos HTTP de domínio, catálogo de status e
política de 403/404 para recurso fora do escopo. A implementação de conversas
depende das decisões de domínio e persistência da etapa 07.

Verificações: 4 testes do layout (incluindo alternância de tema) e 4 testes
focados das rotas do dashboard passaram; ESLint, TypeScript e `git diff
--check` também passaram. A paleta clara e escura foi verificada no navegador
com a API local. O teste geral de rotas continua incluindo uma falha de
assertiva da página About, não relacionada ao dashboard. Indicadores na Home
são mock visual, não integração real.
