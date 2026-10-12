# 05 — Gestão de empresa, dono e equipe

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 02/03/04.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/company-team-management/spec.md).

Contrato: CT-05-TEAM. Civix → cadastro empresa → convite dono está confirmado.

## Baseline e fluxo

[POST empresas](../../../src/routes/company.routes.ts) exige empresa e não
vincula dono. [Admin legado](../../../src/routes/admin.routes.ts) não tem
requireAdmin efetivo e não está montado. Reutilizar services de convite/
outbox/adapters, evoluindo vínculo/roles/finalidade.

1. Superadministrador autorizado informa empresa e e-mail do primeiro dono.
2. Servidor valida dados/conflitos, cria empresa e convite vinculados.
3. Persistência/envio são separados: falha no e-mail mantém estado consistente
   e retomada aprovada, sem duplicar empresa, usuário ou vínculo.
4. Dono ativa credencial pela 03, entra e administra sua própria equipe.
5. Convite de atendente vincula a mesma empresa; e-mail existente não muda empresa/papel.
6. Bloqueio/remoção revoga acesso e trata atribuições conforme regra aprovada,
   sem transferir silenciosamente nem deixar acesso pelo token anterior.

Não permitir autocadastro empresarial pelo dono nesta evolução; mudar a rota
atual somente na implementação coordenada. Preservar GETs públicos. Não
montar admin legado sem autorização nem enviar senha por e-mail. Inscrição
promocional não produz uma conta de equipe.

## Tarefas

- [ ] BE-05-01: Aprovar campos/URLs/poderes/estados/conflitos e política de remoção.
- [ ] BE-05-02: Criar empresa pelo ator Civix e associar convite/dono à empresa.
- [ ] BE-05-03: Evoluir ativação/reenvio com rejeição de conflitos e repetição segura.
- [ ] BE-05-04: Implementar gestão própria de equipe e revogação do acesso.
- [ ] BE-05-05: Proteger role/companyId/campos sensíveis por CT-04.
- [ ] BE-05-06: Testar falha de envio/outbox, repetição e paridade JSON/PostgreSQL.
- [ ] BE-05-07: Integrar cadastro/convite/equipe ao frontend e atualizar docs.

## Aceite E2E

Civix cria A/convida dono → dono ativa/entra → convida atendente → atendente
ativa e recebe somente A. Duplicidade/reenvio não cria vínculo adicional.
B não administra equipe A; atendente não convida dono nem eleva papel. Falha
de envio não aparece como convite entregue. Conta removida perde acesso.

## Aguardando resposta

P03/P04/P05/P06/P07, mudança de dono, limites de equipe por plano e efeito
de bloqueio da empresa/remoção com atendimentos atribuídos. Não implementar
cobrança ou pagamento no onboarding.
