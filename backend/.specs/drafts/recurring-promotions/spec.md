# 10 — Envio recorrente de promoções

Estado: descoberta, aguardando definição. Data: 2026-10-12.
Dependências: 09 + P10.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Somente backend nesta descoberta; interface de campanhas ainda não definida.

## Objetivo e baseline

O usuário deseja promoções recorrentes aos e-mails cadastrados. Resend/outbox
atendem convites/recuperação transacionais; não há campanha/scheduler/worker
promocional implementado. Outbox/aceite do provedor não comprovam entrega ou leitura.

## Escopo a definir

Quem envia, destinatários, conteúdo, frequência/calendário/fuso, autorização,
confirmação, descadastro, retenção, provedor, orçamento e operação. Empresas
não recebem lista de e-mails por padrão; inscrição não dá acesso à equipe/
conversas. Não escolher cron/fila/lib sem necessidade/ambiente e aprovação.
Se gestão de campanhas com UI for confirmada, criar par frontend e contrato
antes de implementar essa interface. Não inventar dashboard adicional agora.

## Tarefas futuras

- [ ] BE-10-01: Aprovar política/ator/escopo mínimo e necessidade de interface.
- [ ] BE-10-02: Especificar recorrência, fontes de conteúdo e seleção de destinatários.
- [ ] BE-10-03: Definir persistência de campanha/execução e migrations, se necessárias.
- [ ] BE-10-04: Implementar envio idempotente, retomada, retries e limites aprovados.
- [ ] BE-10-05: Revalidar elegibilidade/autorização antes do envio, inclusive
  descadastro ocorrido após seleção inicial.
- [ ] BE-10-06: Testar repetição/concorrência/falha parcial/recuperação/descadastro
  com provedor simulado, sem envio externo automático em testes.
- [ ] BE-10-07: Documentar operação/evidências/limites e atualizar docs principais.

## Aceite futuro

Retry não duplica mensagens; contatos descadastrados/inelegíveis não recebem.
Falha permite retomada rastreável, sem e-mail/conteúdo privado nos logs. Modo
JSON verifica outbox local sem provedor externo, explicitando diferenças
operacionais. Confirmar entrega exige evidência além de salvar ou aceitar envio.

## Aguardando resposta

P10 e interface/contrato de campanhas. Todos os checkboxes são trabalho futuro;
esta spec não autoriza instalação, agendamento, gasto ou envio a destinatários reais.
