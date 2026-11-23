# Atendimentos atribuídos e mensagens

**Estado:** shell visual e entrada de login separados implementados; a tela de
conversas está em implementação frontend. Backend, histórico e perfil continuam
não implementados.
**Ordem:** 07. Tarefas novas permanecem abertas.

## Baseline observada

O frontend tem `/login/atendente` e `/dashboard-atendente` com Início,
Conversas, Histórico e Perfil. O perfil é consultado pelo guard e apenas
`atendente` acessa essa área. O shell é visual: não há módulo backend de
conversas, mensagens ou atribuição. Catálogo público não é um sistema
operacional de atendimento. Mensagens locais de exemplo não comprovariam
comunicação e autorização backend.

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
A matriz de acesso foi confirmada em DASH-D13/D14; esta etapa limita a interface
às ações existentes na demonstração: assumir, devolver ao bot, finalizar e
reabrir. A transferência entre atendentes não faz parte desta tela.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Contrato esperado pelo frontend — aguardando alinhamento do backend

Por orientação do usuário, esta etapa implementa somente a interface e o
consumo HTTP. O outro integrante da equipe ajustará o backend para atender a
este contrato; ele não existe no servidor atual e não deve ser tratado como
contrato já implantado. A base de rotas é a proposta acima:

- `GET /api/v1/company/conversations?status=&q=` lista apenas conversas
  autorizadas para a sessão e retorna `data: ConversationSummary[]` e
  `meta: { total, statusCounts }`.
- `GET /api/v1/company/conversations/:id` retorna os dados da conversa.
- `GET /api/v1/company/conversations/:id/messages` retorna as mensagens
  persistidas em ordem cronológica.
- `POST /api/v1/company/conversations/:id/messages` recebe `{ text }` e retorna
  a mensagem aceita pelo backend.
- `POST /api/v1/company/conversations/:id/assignment` recebe
  `{ action: "assume" | "return_to_bot" }` e retorna a atribuição atualizada.
- `PATCH /api/v1/company/conversations/:id` recebe
  `{ status: "pending" | "completed" }` para reabrir ou finalizar e retorna a
  conversa atualizada.

Os tipos de frontend esperados são:

- `ConversationStatus`: `pending | in_progress | completed`.
- `ConversationAssignee`: `{ type: "bot" | "none" }` ou
  `{ type: "agent", id, name }`.
- `ConversationSummary`: `id`, `customer` (`name`, `phone`, `location`),
  `company` (`name`), `status`, `assignee`, `attention`, `unreadCount`,
  `updatedAt` ISO-8601 e `lastMessage` (`id`, `sender`, `text`, `createdAt`).
- `ConversationDetail`: resumo mais `messages`; cada mensagem contém `id`,
  `sender` (`customer | bot | agent | system`), `text` e `createdAt` ISO-8601.

As respostas seguem `{ data, meta? }`; os erros exibidos ao usuário usam apenas
status e message. A interface não usa dados locais de exemplo, não confirma
entrega de mensagem sem resposta de sucesso e apresenta falhas de rede/API
explicitamente. A autorização e o escopo por empresa/atendente permanecem
exclusivamente sob responsabilidade do backend.

Este contrato é uma proposta de integração para o outro integrante confirmar
ou ajustar. Não cria rotas no backend nem autoriza migrations nesta etapa.

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

- [x] FE-07-00: Criar entrada de login e shell protegido do atendente, com
  estados explícitos para telas sem contrato ou integração.
- [ ] FE-07-01: Implementar lista/detalhe/mensagens conforme autorização backend.
- [ ] FE-07-02: Implementar loading/erro/atualização sem conteúdo fictício.
- [ ] FE-07-03: Implementar ações após aprovação de atribuição/transferência.
- [ ] FE-07-04: Testar E2E entre empresas/atendentes, negando conversas ao superadmin.

Verificação do shell e entrada local: login com perfil `atendente` abriu
`/dashboard-atendente` após confirmação de `/api/v1/users/profile`; a
navegação exibiu Início, Conversas, Histórico e Perfil. Testes focados de
login/layout e rotas, ESLint e TypeScript passaram. O usuário local de
demonstração fica em `backend/.local-data/data.json` (ignorado pelo Git);
isso valida somente o shell, não os fluxos E2E de conversas ou persistência
de atendimentos.

## Aceite

- Não atribuído fica ausente na lista e negado no detalhe direto.
- Nenhum corpo de conversa/mensagem chega à área de superadmin.
- Falha de operação não aparece como mensagem/atribuição confirmada.
- Mudança de permissão não mantém acesso revogado.

## Definições pendentes

**Aguardando resposta:** catálogo de estados, canal/fonte de mensagens além do
contato inicial, concorrência de atribuição, método de atualização e contratos
HTTP/DTO finais. Matriz aprovada: atendente consulta atribuídos e disponíveis,
pode assumir disponíveis, responder e transferir apenas itens atribuídos/
assumidos para atendente ativo da mesma empresa; dono lê/responde conversas
da própria empresa; super_admin não acessa conversas. Ver DASH-D13/D14 em
[decisions.md](../../../../backend/.specs/roadmaps/dashboards/decisions.md).

Não houve implementação ou execução de teste ao criar esta spec.
