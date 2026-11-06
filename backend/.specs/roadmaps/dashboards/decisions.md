# Decisões dos dashboards

Data: 2026-10-12. Somente planejamento; não autoriza implementar ou executar.
Referência comum para backend/frontend, evitando decisões divergentes.
Atualização de papéis e limite do cliente confirmada em 2026-11-01;
implementação continua pendente.

## Confirmadas pelo usuário

| ID | Regra |
| --- | --- |
| DASH-D01 | Três personas autenticadas: superadministrador Civix, dono/administrador e atendente |
| DASH-D02 | Dono/atendente pertence a uma única empresa, sem troca de contexto entre empresas |
| DASH-D03 | Atendente acessa somente atendimentos atribuídos a ele, dentro da própria empresa |
| DASH-D04 | Superadministrador cuida de empresas, vendas, métricas e gastos IA da Civix; não acessa nem controla conversas empresariais |
| DASH-D05 | Atualização de 2026-11-01: cliente permanece em backlog, sem dashboard, área logada ou casos de uso adicionais definidos; não criar fluxo autenticado para esse papel |
| DASH-D06 | A Civix cadastra a empresa e convida o primeiro dono; não há autocadastro empresarial pelo dono nesta evolução |
| DASH-D07 | PostgreSQL novo, Prisma 7 com SQL nativo e reversão por nova migration inversa; modo JSON continua disponível |
| DASH-D08 | Reutilizar contratos HTTP/logs: sucesso data/meta, erro de produção somente status/message, diagnóstico sanitizado fora de produção |
| DASH-D09 | Papéis técnicos confirmados: admin_empresa, super_admin, cliente e atendente; dashboards previstos apenas para admin_empresa, super_admin e atendente |
| DASH-D10 | O dashboard empresarial deste escopo cobre Home, dados/configurações da empresa, equipe, leads e conversas. A Home começa sem métricas até que fontes e indicadores sejam aprovados. |
| DASH-D11 | Cadastro de usuário cliente não concede dashboard. O lead empresarial é criado quando o usuário contata uma empresa específica pelo perfil público; o lead fica vinculado à empresa contatada. Usuários da equipe não são leads. Contato promocional continua fora do funil. |
| DASH-D12 | O dono consulta e administra todos os leads da empresa: editar, atribuir, atualizar status, exportar e arquivar logicamente. Não há exclusão física de leads neste fluxo. |
| DASH-D13 | Atendente vê leads/conversas atribuídos e disponíveis da própria empresa; pode assumir disponíveis. Pode editar contato, atualizar status, registrar observação/prioridade e responder itens atribuídos ou assumidos. Pode transferir somente itens atribuídos/assumidos para atendente ativo da mesma empresa; pode exportar e arquivar logicamente somente leads atribuídos/assumidos. |
| DASH-D14 | O dono pode ler e responder conversas da própria empresa. O super_admin não pode ler mensagens nem acessar conversas. O atendente atua somente em conversas atribuídas/assumidas. |
| DASH-D15 | O dono pode convidar atendentes, consultar equipe/atividades, editar perfil, bloquear/desbloquear e remover vínculos. Bloqueio revoga acesso imediatamente; remoção preserva histórico e deixa atendimentos sem responsável para o dono reassumir/atribuir. |
| DASH-D16 | Troca de dono é permitida somente para atendente ativo da mesma empresa; o dono anterior passa a atendente. |
| DASH-D17 | Dono pode editar descrição curta/detalhada, categoria, endereço, cidade, estado, telefone, e-mail, site, WhatsApp e texto de apresentação. CNPJ, verificação/status e porte são somente leitura. Alteração de capa integra US-54: PNG/JPG/WEBP, até 10 MB, multipart e URL assinada por 5 minutos. |
| DASH-D18 | O dono não consulta nem altera plano, benefícios, assinatura ou pagamento pelo dashboard empresarial. |

A resposta de onboarding confirmou D06 durante a escrita. Restrições antigas
sobre preservar login pertencem a entregas anteriores. Estas specs planejam
sua evolução, sem alterar o código nessa rodada.

## Aguardando resposta

| ID | Pergunta e parte dependente |
| --- | --- |
| DASH-P01 | Semântica final de atribuição/concorrência entre operações simultâneas e catálogo de estados; papéis e escopo permitidos estão definidos em DASH-D13/D14. Bloqueia contratos e mutações da 07 |
| DASH-P02 | Bearer + refresh em cookie HttpOnly ou Bearer sem refresh? Bloqueia modelo final de sessão, renovação, cookies/CSRF e revogação na 03 |
| DASH-P03 | Identificadores dos quatro papéis resolvidos por D09; permanecem decisões de estados, vínculo, campos e restrições restantes do modelo de identidade. Bloqueia conclusão do DDL da 02 |
| DASH-P04 | Procedimento seguro para primeiro superadministrador e seu vínculo técnico global ou organização interna Civix |
| DASH-P05 | Destino dos users cliente existentes, transição do papel empresa/vínculos e política dos tokens antigos; sem exclusão, promoção ou conversão automática para contatos |
| DASH-P06 | Campos editáveis, poderes de equipe, troca de dono e bloqueio/remoção foram definidos em DASH-D15–D17; permanecem pendentes os campos exatos de edição de perfil do atendente, efeitos de bloqueio da própria empresa e idempotência/concorrência das mudanças |
| DASH-P07 | Rotas/payloads/permissões HTTP finais e política 403/404 para recurso fora do escopo; propostas ainda não aprovadas |
| DASH-P08 | Catálogo de estados de lead/conversa, canal e fonte de mensagens além do contato inicial, retenção/anexos, desempate/concorrência de atribuição e integração IA/WhatsApp |
| DASH-P09 | Definição/fontes de vendas, métricas, períodos, fuso, moeda e custo IA; associação do plano à empresa |
| DASH-P10 | Quem envia promoções, finalidade/autorização, confirmação do e-mail, descadastro, frequência, conteúdo, provedor e retenção |

P01/P02 foram perguntadas e ainda não respondidas. Não interpretar tempo
transcorrido ou aprovação de escrever specs como aprovação dessas opções.

Evolução documentada em [papéis de usuários](../../features/users-roles/spec.md),
com [tarefas](../../features/users-roles/task.md). O vínculo com upload está na
[spec de storage](../../features/storage/spec.md). A descrição promocional
anterior de D05 é histórica; não atribuir novos casos de uso a cliente nesta
decisão, nem apagar registros existentes.

## Limites compartilhados

Não permitir ao superadministrador acesso indireto a mensagens/prompts por
exports, busca, logs ou detalhamento de custo IA. Métricas aprovadas usam
agregados/metadados sem conteúdo de conversas. Contato promocional não vira
conta, atendente ou lead de funil automaticamente. Catálogo continua público.
