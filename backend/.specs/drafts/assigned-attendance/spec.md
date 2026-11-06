# 07 — Atendimento e atribuição

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 02/04/05/06 + P01/P08.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/assigned-attendance/spec.md).

Contrato: CT-07-ATTENDANCE. Não existe módulo backend de conversas/mensagens.

## Escopo confirmado e pendente

Atendente lê/atua somente em atendimento atribuído a ele e da sua empresa.
Superadministrador não lê, assume, transfere ou inspeciona conversas. Poderes
do dono e autoridade de atribuição dependem de P01/P06; não presumir fila
visível ou ação de assumir para o atendente.

Definir atendimento/conversa, interlocutor, mensagens, origem, atribuição e
estados antes de DDL/DTOs. Não confundir contato promocional com lead de funil.
IA/WhatsApp/canais e captura de leads exigem escopo mínimo aprovado; criar
um CRUD não comprova integração ou envio real de mensagem.

## Fluxo e invariantes

Contexto verificado → listar permitidos → escolher recurso → validar empresa
+ atribuição → ler/agir → persistir estado → retornar → frontend atualizar.
Mensagens, anexos, contagens, buscas e exports seguem a mesma autorização.

Atribuição só aceita atendente ativo da mesma empresa e ator autorizado.
Definir concorrência/dupla atribuição/transferência com persistência consistente.
Após transferência aprovada, atendente anterior perde acesso: JWT antigo
não conserva atribuição anterior. Atribuição não muda vínculo empresarial.

## Tarefas

- [ ] BE-07-01: Aprovar P01/P08, estados, ações e origem mínima das mensagens.
- [ ] BE-07-02: Criar migrations incrementais/entidades/DTOs/interfaces úteis.
- [ ] BE-07-03: Implementar JSON/PostgreSQL e regras de concorrência aprovadas.
- [ ] BE-07-04: Implementar leitura/operações aprovadas em routes/controller/service.
- [ ] BE-07-05: Aplicar CT-04 a listas/mensagens/mutações, sem bypass Civix.
- [ ] BE-07-06: Testar IDs trocados, atribuição a outro tenant, transferência,
  usuário revogado e leitura indireta por anexos/busca/contagem.
- [ ] BE-07-07: Integrar ações reais ao frontend e atualizar logs tipados/docs.

## Aceite E2E

Duas empresas, dois atendentes A: cada um vê/atua somente nos seus atribuídos;
B não acessa A e gestor Civix não recebe mensagens. Transferência aprovada
muda acesso imediatamente. Nenhuma listagem global filtrada só no navegador.
Canal ausente é limite explícito, sem simular entrega como confirmação funcional.

## Aguardando resposta

P06/P07/P08: estados, canais, integração IA/WhatsApp, fonte de mensagens além
do contato inicial, retenção/anexos e atualização em tempo real versus consulta.
O dono pode ler/responder conversas da própria empresa; o atendente vê e
responde atribuídos ou assumidos; somente atendentes ativos da mesma empresa
são destinos de atribuição/transferência; super_admin não acessa conversas.
Regras aprovadas em DASH-D13/D14 de
[decisions.md](../../roadmaps/dashboards/decisions.md).

Quem pode atribuir/transferir e assumir disponíveis não está mais pendente:
ver matriz acima. Permanecem pendentes o catálogo de estados, o canal além do
contato inicial, concorrência de atribuição e as URLs/DTOs HTTP finais.
