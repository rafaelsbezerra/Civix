# Specs do frontend

Planejamento leve por funcionalidade, com spec backend pareada e contrato
canônico. Documentação não autoriza código, configuração, instalação ou testes
executáveis. Novos checkboxes ficam abertos; sem commit nesta etapa.

## Ordem recomendada

| Ordem | Etapa | Frontend | Backend |
| --- | --- | --- | --- |
| 01 | Identidade/perfis | [spec](features/identity-access-model/spec.md) | [pareada](../../backend/.specs/features/identity-access-model/spec.md) |
| 02 | Modelo de dados | Sem FE-02 | [identity-data-model](../../backend/.specs/features/identity-data-model/spec.md) |
| 03 | Sessão | [spec](features/authentication-session/spec.md) | [pareada](../../backend/.specs/features/authentication-session/spec.md) |
| 04 | Autorização empresa | [spec](features/tenant-authorization/spec.md) | [pareada](../../backend/.specs/features/tenant-authorization/spec.md) |
| 05 | Empresa/equipe | [spec](features/company-team-management/spec.md) | [pareada](../../backend/.specs/features/company-team-management/spec.md) |
| 06 | Base dashboards | [spec](features/dashboard-foundation/spec.md) | [pareada](../../backend/.specs/features/dashboard-foundation/spec.md) |
| 07 | Atendimentos | [spec](features/assigned-attendance/spec.md) | [pareada](../../backend/.specs/features/assigned-attendance/spec.md) |
| 08 | Gestão/métricas Civix | [spec](features/platform-management-metrics/spec.md) | [pareada](../../backend/.specs/features/platform-management-metrics/spec.md) |
| 09 | Contatos e-mail | [spec](features/promotional-contacts/spec.md) | [pareada](../../backend/.specs/features/promotional-contacts/spec.md) |
| 10 | Descoberta/envio recorrente | Sem execução frontend | [recurring-promotions](../../backend/.specs/features/recurring-promotions/spec.md) |

[Contrato canônico](../../backend/.specs/roadmaps/dashboards/contracts.md)
centraliza os CTs e propostas de endpoints/DTOs; não tratar exemplos como APIs
novas implementadas. IDs FE acompanham a ordem: FE-01 e FE-03 a FE-09.
Modelo persistido e descoberta/envio recorrente são etapas somente backend.
A 01 define modelo/DTOs/matriz/estados compartilhados; bootstrap/UI/E2E
operacionais pertencem às 03/04/06 e não bloqueiam sua definição.
A 04 verifica política com fixture isolada sem endpoints fake; conversas/
atribuições reais são repetidas na 07, sem ciclo de dependência 04 → 07 → 04.

## Confirmado e pendente

Civix cadastra empresa/convida dono; dono/atendente têm uma única empresa.
Atendente só acessa atribuídos; superadmin gerencia a plataforma, nunca
conversas. Newsletter é somente e-mail, sem conta/JWT/dashboard.

**Aguardando resposta:** Bearer com refresh HttpOnly ou Bearer sem refresh;
quem atribui/transfere atendimentos. Payloads, identificadores e rotas novos
também aguardam aprovação. A exclusão anterior de login é histórica;
a autorização atual só planeja sua correção, sem mudar o código existente.

## E2E em conjunto

Cada spec planeja frontend e backend reais, com dados/efeitos isolados.
Mocks do frontend não substituem essa prova. Testar acesso permitido/negado,
persistência, expiração, falha API e isolamento entre empresas/atribuições.
Paginação só quando necessária. Plano selecionado não é venda/pagamento;
zero não equivale a ausência de dado nem demo financeira é fonte real.

## Specs existentes

- [Home](features/home-hero/spec.md) e [Sobre](features/about-page/spec.md):
  históricos e AD-002, sem restaurar layout automaticamente.
- [Integração backend](features/backend-integration/spec.md).
- [Animações](features/entry-animations/spec.md).
- [Transição de empresa](features/company-page-transition/spec.md).
- [Manutenção de dependências](features/dependency-maintenance/spec.md).

[STATE](STATE.md) mantém registros existentes. [Docs](../../docs/README.md)
contém guias gerais. Nenhuma verificação executável nesta criação documental.
