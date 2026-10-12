# Plano das specs dos dashboards

Data: 2026-10-12. Branch staging; somente documentação, sem commit.
Specs planejadas não representam código entregue ou autorização de execução.
[Decisões confirmadas e pendentes](decisions.md).
Pares E2E usam os mesmos [contratos de integração](contracts.md).

## Ordem e dependências

| Ordem | Entrega | Backend | Frontend | Depende de |
| --- | --- | --- | --- | --- |
| 01 | Identidade, vínculos e permissões | [Spec](../../features/identity-access-model/spec.md) | [Spec](../../../../frontend/.specs/features/identity-access-model/spec.md) | Decisões funcionais |
| 02 | Modelo de dados e migrations | [Spec](../../features/identity-data-model/spec.md) | Sem UI nesta entrega | 01 + decisões de schema |
| 03 | Autenticação e sessão | [Spec](../../features/authentication-session/spec.md) | [Spec](../../../../frontend/.specs/features/authentication-session/spec.md) | 01/02 + P02/P04 |
| 04 | Autorização e isolamento | [Spec](../../features/tenant-authorization/spec.md) | [Spec](../../../../frontend/.specs/features/tenant-authorization/spec.md) | 01/02/03 |
| 05 | Gestão de empresa e equipe | [Spec](../../features/company-team-management/spec.md) | [Spec](../../../../frontend/.specs/features/company-team-management/spec.md) | 02/03/04 |
| 06 | Base dos dashboards | [Spec](../../features/dashboard-foundation/spec.md) | [Spec](../../../../frontend/.specs/features/dashboard-foundation/spec.md) | 03/04/05 |
| 07 | Atendimento e atribuição | [Spec](../../features/assigned-attendance/spec.md) | [Spec](../../../../frontend/.specs/features/assigned-attendance/spec.md) | 02/04/05/06 + P01/P08 |
| 08 | Gestão e métricas Civix | [Spec](../../features/platform-management-metrics/spec.md) | [Spec](../../../../frontend/.specs/features/platform-management-metrics/spec.md) | 04/05/06 + fontes P09 |
| 09 | Contatos promocionais | [Spec](../../features/promotional-contacts/spec.md) | [Spec](../../../../frontend/.specs/features/promotional-contacts/spec.md) | 01 + decisões próprias |
| 10 | Envio recorrente de promoções | [Spec](../../features/recurring-promotions/spec.md) | UI de campanhas ainda não definida | 09 + P10 |

01 define modelo/contratos/matriz compartilhados; não exige um dashboard ou
bootstrap operacional antes de 03/04/06. Seus cenários E2E são critérios
compartilhados a executar nas entregas consumidoras. Na 04, políticas de
atribuição usam fixtures isoladas; a prova com conversas reais ocorre na 07.

09 pode seguir em paralelo após 01. 07 e 08 não dependem uma da outra:
gestão da Civix não lê conversas. Agregados operacionais/IA só existem quando
sua fonte estiver implementada. Cada entrega introduz suas tabelas por
migrations incrementais; 02 não exige todo o SaaS, contatos, conversas ou billing.
10 é descoberta, sem UI/fornecedor/calendário de campanhas definidos.

Bootstrap: preparar a conta do superadministrador na 03 (procedimento P04)
antes de 05. Cadastro empresarial é ação de plataforma, sem exigir vínculo
prévio com a empresa que será criada. Vínculo técnico Civix depende de P04.

## Critérios comuns de entrega

- Diferenciar decisão confirmada, proposta e comportamento observado no código.
- Tarefas de implementação ficam desmarcadas; documentação não conclui entrega.
- Aprovar contratos/DDL pendentes e atualizar pares antes de implementar.
- Preservar routes → controller → service, interfaces úteis em repositories,
  adapters JSON/PostgreSQL e arquivos domínio.responsabilidade.ts.
- Reutilizar contratos HTTP/logs existentes; paginação permanece sob demanda.
- Testar regras/isolamento backend e consumo/estados frontend; concluir E2E
  real dos dois lados antes de marcar integração como pronta.
- Atualizar docs principais e registrar evidências/limites em cada implementação.
- Seguir AGENTS e exceções explícitas de cada tarefa. Nesta rodada não há
  código, instalação, execução de migration, envio de e-mail ou commit.

## Baseline observada

Papéis empresa/cliente, JWT de 1h e cliente por e-mail não implementam o modelo
novo. Cadastro empresarial não associa dono; plano é atribuído a users.
Admin não está montado. Profile apenas confirma token. Login frontend lê
envelope antigo e aponta para dashboard sem rota. Não há módulos de conversas,
vendas/cobrança ou medição IA. Repositories, contratos e logs já existem;
evoluí-los, sem transformá-los novamente em tarefas de fundação não entregues.
