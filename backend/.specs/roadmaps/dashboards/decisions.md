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

A resposta de onboarding confirmou D06 durante a escrita. Restrições antigas
sobre preservar login pertencem a entregas anteriores. Estas specs planejam
sua evolução, sem alterar o código nessa rodada.

## Aguardando resposta

| ID | Pergunta e parte dependente |
| --- | --- |
| DASH-P01 | Quem atribui/transfere atendimentos? Somente dono ou atendentes podem assumir disponíveis? Bloqueia mutações da 07 |
| DASH-P02 | Bearer + refresh em cookie HttpOnly ou Bearer sem refresh? Bloqueia modelo final de sessão, renovação, cookies/CSRF e revogação na 03 |
| DASH-P03 | Identificadores dos quatro papéis resolvidos por D09; permanecem decisões de estados, vínculo, campos e restrições restantes do modelo de identidade. Bloqueia conclusão do DDL da 02 |
| DASH-P04 | Procedimento seguro para primeiro superadministrador e seu vínculo técnico global ou organização interna Civix |
| DASH-P05 | Destino dos users cliente existentes, transição do papel empresa/vínculos e política dos tokens antigos; sem exclusão, promoção ou conversão automática para contatos |
| DASH-P06 | Campos editáveis por dono, mudança de dono, poderes sobre equipe, bloqueio da empresa e destino das atribuições ao remover atendente |
| DASH-P07 | Rotas/payloads/permissões finais e política 403/404 para recurso fora do escopo; exemplos do contrato são propostas |
| DASH-P08 | Domínio/estados de atendimento, canais, fonte de mensagens, atribuição inicial e integração IA/WhatsApp |
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
