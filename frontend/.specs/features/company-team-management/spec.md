# Criação de empresas e gestão de equipes

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 05. Tarefas novas permanecem abertas.

## Baseline observada

Há catálogo/perfil públicos e criação de empresa via API com role empresa.
Não existem telas privadas de criação/equipe; router admin não é montado.
Texto de ajuda sobre convites não comprova um fluxo operacional.

## Dependências e referências

Depende de etapas 01 a 04 e CT-05-TEAM.
Alimenta [dashboard](../dashboard-foundation/spec.md) e
[atendimentos](../assigned-attendance/spec.md).
Onboarding usa a [sessão/primeiro acesso](../authentication-session/spec.md).
[Spec backend pareada](../../../../backend/.specs/features/company-team-management/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Civix cria empresa e convida dono; dono não se autocadastra como empresa.
- Separar gestão da plataforma de gestão interna da equipe empresarial.
- Dono/atendente têm um único vínculo de empresa.
- Não inventar regras de remover/desativar/alterar integrantes antes da matriz.
- Seleção de plano não representa venda/pagamento concluído.

## Contrato frontend/backend

Propostas: /api/v1/platform/companies para criação/convite do dono e
/api/v1/company/members para equipe. Métodos, campos e ações dependem
de CT-05-TEAM. O cadastro atual precisa ser conciliado com onboarding aprovado;
role empresa atual não comprova autorização do novo fluxo Civix.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Superadmin cria empresa/convida dono por UI e backend reais.
2. Dono ativa pelo link de teste e acessa apenas sua empresa.
3. Ação de equipe aprovada persiste e reaparece após consulta/recarregamento.
4. ID de integrante de outra empresa é negado; falha de convite não afirma entrega.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-05-01: Implementar formulário de criação pela Civix e convite do dono.
- [ ] FE-05-02: Implementar equipe/ações conforme permissão e contrato aprovados.
- [ ] FE-05-03: Implementar estados pendente/sucesso/falha da etapa confirmada.
- [ ] FE-05-04: Testar E2E empresa → dono → equipe e isolamento entre empresas.

## Aceite

- Criação da plataforma não é confundida com gestão interna de equipe.
- Empresa/vínculo/estado resultam de dados reais do backend.
- Convite não implica ativação automática ou confirmação de entrega de e-mail.
- Ações de integrante respeitam isolamento e política aprovada.

## Definições pendentes

**Aguardando resposta:** campos de empresa/dono/membro e ações/rotas/métodos.
Convites de equipe, remoção/desativação e mudanças de perfil precisam de limites
canônicos; não decidir exclusão de dados ou regra comercial na UI.

## Atualização — decisões de 2026-11-02

O dono pode convidar, consultar, editar perfil, bloquear/desbloquear e remover
atendentes; consultar atividades; e transferir a propriedade para atendente
ativo da mesma empresa. O dono anterior passa a atendente. Bloquear revoga
acesso imediatamente; remover encerra o vínculo, preserva histórico e deixa
atendimentos sem responsável para o dono reassumir/atribuir. Detalhes da matriz
estão em DASH-D15/D16 de
[decisions.md](../../../../backend/.specs/roadmaps/dashboards/decisions.md).

**Aguardando resposta:** campos editáveis do integrante, rotas/DTOs finais,
política de bloqueio da empresa e regras de concorrência/idempotência. A UI
não deve oferecer ações além das capabilities retornadas pelo backend.

Não houve implementação ou execução de teste ao criar esta spec.
