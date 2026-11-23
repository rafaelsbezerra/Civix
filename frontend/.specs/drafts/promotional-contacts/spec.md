# Cadastro público de contatos por e-mail

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 09. Tarefas novas permanecem abertas.

## Baseline observada

Home/catálogo/ajuda não têm captura persistida de contato promocional.
Suporte, convite e recuperação têm outras finalidades. Não há endpoint/UI
de inscrição/descadastro ou dashboard de marketing implementados.

## Dependências e referências

Referência CT-09-CONTACTS e spec backend pareada; não depende de login.
Descoberta/envio recorrente fica na etapa 10
[recurring-promotions backend](../../../../backend/.specs/features/recurring-promotions/spec.md).
Não executar scheduler/campanha pelo navegador.
[Spec backend pareada](../../../../backend/.specs/features/promotional-contacts/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Capturar somente e-mail como contato; sem usuário, senha, JWT ou dashboard.
- Distinguir promoção de recuperação/convite/suporte.
- Explicar finalidade/estado conforme textos e política aprovados.
- Não coletar nome, telefone, role ou empresa neste fluxo.
- Descadastro usa contrato backend, sem inventar token/regra de campanha.

## Contrato frontend/backend

Propostas: POST /api/v1/promotional-contacts e
POST /api/v1/promotional-contacts/unsubscribe.
E-mail é o único dado de contato; nome do campo, mecanismo de descadastro e
retorno dependem de CT-09-CONTACTS. Duplicidade/consentimento/retentativa e
mensagens públicas precisam de definição; campo de e-mail não prova adesão.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Visitante sem sessão inscreve e-mail pela UI e backend reais.
2. Conferir persistência no armazenamento isolado, sem token/dashboard.
3. Exercitar inválido, indisponibilidade e duplicidade pela regra aprovada.
4. Descadastro confirma estado no backend conforme fluxo aprovado.
5. Nenhuma tarefa de envio/descoberta é iniciada pelo frontend.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-09-01: Implementar formulário público no local/textos/finalidade aprovados.
- [ ] FE-09-02: Implementar inscrição/validação/feedback sem autenticação.
- [ ] FE-09-03: Implementar UI de descadastro conforme contrato backend aprovado.
- [ ] FE-09-04: Testar E2E de persistência/descadastro sem criar conta.

## Aceite

- Não solicita dados pessoais adicionais, senha ou vínculo.
- Inscrição confirma backend; falha não mostra sucesso fictício.
- Contato não recebe acesso autenticado/dashboard.
- UI de descadastro não depende de mecanismo inventado.

## Definições pendentes

**Aguardando resposta:** local/textos, finalidade/consentimento,
duplicidade e contrato de descadastro. Política de descoberta/envio permanece
na etapa 10 backend; não escolher frequência/destinatários/retenção na UI.

Não houve implementação ou execução de teste ao criar esta spec.
