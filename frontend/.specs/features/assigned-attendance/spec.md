# Atendimentos atribuídos e mensagens

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 07. Tarefas novas permanecem abertas.

## Baseline observada

Não há telas/módulo de conversas, mensagens ou atribuição. Catálogo público
não é um sistema operacional de atendimento. Mensagens locais de exemplo
não comprovariam comunicação e autorização backend.

## Dependências e referências

Depende de etapas 01 a 06 e CT-07-ATTENDANCE.
[Isolamento](../tenant-authorization/spec.md) e [equipe](../company-team-management/spec.md)
sustentam leitura/ações. Backend precisa do modelo e regras de atribuição.
[Spec backend pareada](../../../../backend/.specs/features/assigned-attendance/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Atendente vê somente conversas atribuídas a ele em sua única empresa.
- Dono/atendente têm vínculo único; a API continua sendo autoridade.
- Superadmin nunca acessa conversas, detalhes ou mensagens.
- Não inventar canal, realtime, estados ou regra de envio/transferência.
- Não planejar chat/impersonação de atendimento para superadmin.

## Contrato frontend/backend

Propostas: /api/v1/company/conversations, /:id, /:id/messages e
/:id/assignment sob esse recurso. Métodos/payloads/estados dependem
de CT-07-ATTENDANCE; paginação só se necessária.
Quem pode atribuir/transferir ainda não foi definido; rota proposta não
autoriza habilitar essa ação.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Backend prepara duas empresas e conversas de atendentes distintos.
2. Atendente lista/abre somente atribuídos e consulta mensagens reais.
3. URL/ID de não atribuído/outra empresa é negado; superadmin também é negado.
4. Ação aprovada confirma persistência e recarga; falha não cria sucesso fictício.
5. Transferência só integra o E2E após definição de quem pode agir.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-07-01: Implementar lista/detalhe/mensagens conforme autorização backend.
- [ ] FE-07-02: Implementar loading/erro/atualização sem conteúdo fictício.
- [ ] FE-07-03: Implementar ações após aprovação de atribuição/transferência.
- [ ] FE-07-04: Testar E2E entre empresas/atendentes, negando conversas ao superadmin.

## Aceite

- Não atribuído fica ausente na lista e negado no detalhe direto.
- Nenhum corpo de conversa/mensagem chega à área de superadmin.
- Falha de operação não aparece como mensagem/atribuição confirmada.
- Mudança de permissão não mantém acesso revogado.

## Definições pendentes

**Aguardando resposta:** quem atribui/transfere (dono, atendente ou outro fluxo),
regras de transferência, estados/canais e método de atualizar mensagens.
Payloads de leitura também precisam de aprovação antes de implementar.

Não houve implementação ou execução de teste ao criar esta spec.
