# 02 — Modelo de dados e migrations de identidade

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 01 e aprovação de schema.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Entrega somente backend; não há UI nova nesta spec.

## Baseline e escopo

[schema.prisma](../../../prisma/schema.prisma) não declara models. Tooling
Prisma 7 existe, mas migrations de planos não criam users/empresas. Complementar
[spec atual de migrations](../migrations/spec.md), sem trocar runner/versão.
PostgreSQL novo, SQL nativo e nova migration inversa estão aprovados.

Criar fundação mínima de contas autenticadas, empresas, vínculo único e
convites/ativação. Campos/IDs/constraints ainda são propostas. Conversas,
contatos promocionais e fontes financeiras entram nas respectivas entregas.

## Invariantes

Dono/atendente provisionado tem exatamente uma empresa; convite nasce
vinculado à empresa criada pela Civix. Convite não transfere conta existente
para outra empresa. Rejeitar referências inexistentes e papéis/estados
incompatíveis. Representação do vínculo do superadministrador depende de P04.
Conta e contato promocional são separados, sem exclusão automática do legado.

## Tarefas

- [ ] BE-02-01: Aprovar campos/IDs/relações/estados/índices/uniqueness mínimos.
- [ ] BE-02-02: Decidir destino dos SQL antigos e dependências users/plans.
- [ ] BE-02-03: Criar migrations SQL versionadas Prisma 7 e estratégia inversa.
- [ ] BE-02-04: Alinhar entidades/DTOs/interfaces e adapters JSON/PostgreSQL.
- [ ] BE-02-05: Validar invariantes também em JSON, sem atribuir a ele constraints SQL.
- [ ] BE-02-06: Planejar conversão explícita dos JSONs antigos, preservando original,
  conflitos e registros até revisão; nunca apagar/converter silenciosamente.
- [ ] BE-02-07: Verificar criação do zero, reaplicação, histórico, falha e recuperação
  em PostgreSQL temporário; testes offline/JSON não comprovam esse ciclo.
- [ ] BE-02-08: Separar seeds demonstrativos de bootstrap privilegiado e atualizar docs.

## Aceite e limites

Banco vazio reproduz fundação aprovada. Nenhuma migration executa no startup,
banco remoto ou produção. Inversa não recupera dados removidos por si só;
perda/transação/backup exigem avaliação por mudança. Não inventar tipo global
de ID a partir dos string/number atuais. users.plan_id é código observado,
não aprovação de assinatura por usuário. Não bloquear 02 pelo schema de todo o SaaS.

## Aguardando resposta

P03/P04/P05/P09, destino dos SQL antigos e comandos operacionais da spec de
migrations. Nenhum DDL, model, dependência ou JSON é alterado nesta rodada.
