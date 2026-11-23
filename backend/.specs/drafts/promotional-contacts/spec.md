# 09 — Contatos promocionais

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 01 + decisões próprias; schema incremental.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/promotional-contacts/spec.md).

Contrato: CT-09-CONTACTS. [Envio recorrente](../recurring-promotions/spec.md) separado.

## Baseline e objetivo

Hoje cliente participa do login por e-mail e recebe JWT. O novo cadastro
registra apenas e-mail para promoções, sem senha/vínculo empresarial/dashboard/
sessão/inscrição automática como atendente ou lead. Não usar users.login para newsletter.

## Fluxo e regras

Visitante informa e-mail → validar formato/normalização aprovados → persistir
contato/preferência necessária → confirmação genérica → frontend mostra resultado.
Repetição não duplica registros nem revela cadastro alheio. Inscrição não
inicia campanha automaticamente. Não expor lista pública de contatos.

Descadastro/preferência exige prova de autorização aprovada: conhecer apenas
e-mail alheio não permite alterá-lo. Definir finalidade/acesso administrativo,
retenção e confirmação. Se confirmação for aprovada, estado pendente impede
envio; não presumir double opt-in implementado ou aprovado.

## Tarefas

- [ ] BE-09-01: Aprovar CT-09/P10, normalização, estados e acesso interno.
- [ ] BE-09-02: Criar schema/migration incremental, DTOs e adapters JSON/PostgreSQL.
- [ ] BE-09-03: Implementar inscrição/duplicidade/preferência sem JWT.
- [ ] BE-09-04: Implementar prova aprovada para confirmação/descadastro e expiração.
- [ ] BE-09-05: Planejar extração dos users cliente legados, preservando original/
  conflitos até migração aprovada; tokens antigos são tratados pela 03.
- [ ] BE-09-06: Validar abuso/repetição e logs sem e-mail/token.
- [ ] BE-09-07: Integrar formulário e atualizar docs principais.

## Aceite E2E

Inscrição pede só e-mail, persiste no armazenamento escolhido e não retorna
access token. Repetição é segura e não expõe contatos. Descadastro impede
envios futuros da 10. Cliente não abre dashboard. Falha de confirmação/envio
não vira sucesso fictício ou entrega comprovada.

## Aguardando resposta

P05/P07/P10: finalidade/texto de autorização, confirmação, normalização,
contatos existentes, acesso interno, descadastro/retorno público e retenção.
Não usar dados da equipe/primeiro acesso para inscrever em promoções automaticamente.
