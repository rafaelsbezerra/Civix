# Identidade e modelo de acesso

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 01. Tarefas novas permanecem abertas.

## Baseline observada

Login usa os papéis empresa/cliente e token em localStorage. Lê
response.data.token, embora o backend retorne data; /dashboard-empresa não
está em AppRoute. GET /api/v1/users/profile só fornece mensagem/userId.
Não há dashboard nem bootstrap de vínculo/permissões implementados.

## Dependências e referências

Esta etapa define modelo/DTOs/matriz/estados, sem bootstrap ou UI operacional.
A [02 backend](../../../../backend/.specs/features/identity-data-model/spec.md)
implementará a persistência. [Sessão](../authentication-session/spec.md),
[isolamento](../tenant-authorization/spec.md) e shell 06 consomem o modelo,
sem serem pré-requisitos para concluir sua definição na 01.
[Spec backend pareada](../../../../backend/.specs/features/identity-access-model/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Dono/atendente pertencem a uma única empresa; sem seletor multitenant.
- Atendente acessa somente atendimentos atribuídos.
- Superadmin gerencia Civix/empresas/vendas/métricas/custos IA, nunca conversas.
- Civix cria empresa e convida dono; não propor autocadastro de empresa.
- Contato promocional é só e-mail, sem conta, senha, sessão ou dashboard.

## Contrato frontend/backend

Planejar a evolução de GET /api/v1/users/profile para o bootstrap.
Identidade, vínculo e permissões precisam de campos canônicos; não inferir
autoridade do papel selecionado visualmente no login. Nomes/valores novos
dos perfis e URLs privadas também permanecem propostas.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Cenários E2E previstos para as etapas 03/04/06

1. Na 03/04, fixtures geram os perfis/vínculos definidos neste modelo.
2. Na 03, login/profile reais fornecem bootstrap; na 06, UI mostra área permitida.
3. Na 04/06, provar negativas de acesso; conversas reais somente na 07.
4. Na 09, contato promocional não recebe token ou área privada.
São cenários previstos, não requisitos operacionais para concluir a definição 01.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-01-01: Documentar DTOs canônicos de identidade/vínculo/permissões aprovados.
- [ ] FE-01-02: Documentar estados UX de identidade carregando/ausente/negada.
- [ ] FE-01-03: Documentar mapeamento perfil/capacidade/navegação permitida.
- [ ] FE-01-04: Documentar matriz de provas E2E a executar nas etapas posteriores.

## Aceite

- DTOs/matriz/estados são coerentes entre frontend e backend, sem UI implementada.
- Matriz não concede conversas/mensagens ao superadmin.
- Contrato prevê vínculo único/autoridade backend, não escolha arbitrária na UI.
- Modelo distingue contato promocional de conta e não depende do E2E operacional.

## Definições pendentes

**Aguardando resposta:** nomes/campos canônicos dos perfis e bootstrap.
Sessão depende da etapa 03; quem atribui/transfere depende da etapa 07.
Não tomar essas decisões ao desenhar o modelo comum.

Não houve implementação ou execução de teste ao criar esta spec.
