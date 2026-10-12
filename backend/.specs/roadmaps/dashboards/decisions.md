# Decisões dos dashboards

Data: 2026-10-12. Somente planejamento; não autoriza implementar ou executar.
Referência comum para backend/frontend, evitando decisões divergentes.

## Confirmadas pelo usuário

| ID | Regra |
| --- | --- |
| DASH-D01 | Três personas autenticadas: superadministrador Civix, dono/administrador e atendente |
| DASH-D02 | Dono/atendente pertence a uma única empresa, sem troca de contexto entre empresas |
| DASH-D03 | Atendente acessa somente atendimentos atribuídos a ele, dentro da própria empresa |
| DASH-D04 | Superadministrador cuida de empresas, vendas, métricas e gastos IA da Civix; não acessa nem controla conversas empresariais |
| DASH-D05 | Cliente cadastra apenas e-mail para promoções; sem dashboard ou sessão autenticada nesta fase |
| DASH-D06 | A Civix cadastra a empresa e convida o primeiro dono; não há autocadastro empresarial pelo dono nesta evolução |
| DASH-D07 | PostgreSQL novo, Prisma 7 com SQL nativo e reversão por nova migration inversa; modo JSON continua disponível |
| DASH-D08 | Reutilizar contratos HTTP/logs: sucesso data/meta, erro de produção somente status/message, diagnóstico sanitizado fora de produção |

A resposta de onboarding confirmou D06 durante a escrita. Restrições antigas
sobre preservar login pertencem a entregas anteriores. Estas specs planejam
sua evolução, sem alterar o código nessa rodada.

## Aguardando resposta

| ID | Pergunta e parte dependente |
| --- | --- |
| DASH-P01 | Quem atribui/transfere atendimentos? Somente dono ou atendentes podem assumir disponíveis? Bloqueia mutações da 07 |
| DASH-P02 | Bearer + refresh em cookie HttpOnly ou Bearer sem refresh? Bloqueia modelo final de sessão, renovação, cookies/CSRF e revogação na 03 |
| DASH-P03 | Identificadores dos papéis, estados, IDs, campos obrigatórios, unicidade de e-mail e remoção. Bloqueia DDL final da 02 |
| DASH-P04 | Procedimento seguro para primeiro superadministrador e seu vínculo técnico global ou organização interna Civix |
| DASH-P05 | Migração dos users cliente para contatos, users empresa sem vínculo e invalidação de tokens antigos; sem exclusão/conversão automática |
| DASH-P06 | Campos editáveis por dono, mudança de dono, poderes sobre equipe, bloqueio da empresa e destino das atribuições ao remover atendente |
| DASH-P07 | Rotas/payloads/permissões finais e política 403/404 para recurso fora do escopo; exemplos do contrato são propostas |
| DASH-P08 | Domínio/estados de atendimento, canais, fonte de mensagens, atribuição inicial e integração IA/WhatsApp |
| DASH-P09 | Definição/fontes de vendas, métricas, períodos, fuso, moeda e custo IA; associação do plano à empresa |
| DASH-P10 | Quem envia promoções, finalidade/autorização, confirmação do e-mail, descadastro, frequência, conteúdo, provedor e retenção |

P01/P02 foram perguntadas e ainda não respondidas. Não interpretar tempo
transcorrido ou aprovação de escrever specs como aprovação dessas opções.

## Limites compartilhados

Não permitir ao superadministrador acesso indireto a mensagens/prompts por
exports, busca, logs ou detalhamento de custo IA. Métricas aprovadas usam
agregados/metadados sem conteúdo de conversas. Contato promocional não vira
conta, atendente ou lead de funil automaticamente. Catálogo continua público.
