# Specs do frontend

## Estrutura obrigatória de todas as specs

Toda especificação de funcionalidade (`.specs/features/<nome-da-feature>/`) **deve** conter obrigatoriamente **3 arquivos**:

1. `feature.md` — visão de negócio, escopo funcional na interface, decisões confirmadas/pendentes e critérios de aceite.
2. `sdd.md` — desenho técnico (Software Design Document), componentes, estados, contratos de API consumidos e fluxos de navegação.
3. `tasks.md` — plano de execução passo a passo seguindo estritamente o template abaixo.

### Padrão obrigatório para o arquivo `tasks.md`

```markdown
# <Título>

## Objetivo
<Descrição clara do objetivo da entrega>

## Restrições globais
- <Restrição 1>
- <Restrição 2>

## Pontos de atenção
- <Ponto de atenção, se houver>

---

## Task 1: <Título da Task>

**Arquivos:**
- Modificar:
  - `caminho/do/arquivo.tsx`
- Criar:
  - `caminho/do/novo-arquivo.tsx`

**Passos:**
- [ ] Passo 1
- [ ] Passo 2

**Pronto quando:**
- <Critério objetivo de conclusão e verificação>

**Commit sugerido:**
`feat(escopo): mensagem em ingles no padrao conventional commits`
```

### Regra obrigatória para migrations em specs integradas (`_prisma_migrations` + UP e DOWN)

Sempre que uma spec envolver criação de migrations no backend (`backend/prisma/migrations/<nome_da_migration>/`), toda migration deve conter:
1. **UP (`migration.sql`):** o SQL da alteração acompanhado de um `INSERT` idempotente na tabela `_prisma_migrations` (pois as migrations podem ser executadas via query SQL direta no banco, sem passar pelo CLI do Prisma).
2. **DOWN (`down.sql` na mesma pasta + bloco comentado no `migration.sql`):** o SQL de reversão das alterações e o `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '<nome_da_migration>'`.
3. **Atualização obrigatória do Seed e do Reset:** toda alteração que possua migration exige a atualização conjunta dos scripts de **seed** (`backend/scripts/seed.staging.ts` / `backend/scripts/lib/staging.seed.ts`) e de **reset** (`backend/scripts/reset.database.ts` / `backend/scripts/lib/database.reset.ts`), que utilizam as variáveis de banco do `.env`.

---

## Busca pública de empresas e evolução de schema — 2026-11-07

- [Feature](features/company-search-and-schema/feature.md)
- [SDD](features/company-search-and-schema/sdd.md)
- [Tasks](features/company-search-and-schema/tasks.md)

---

## Entrega do superadmin — 2026-11-02

[Telas e integração](features/super-admin-dashboard/spec.md) e
[tarefas/arquivos/commits sugeridos](features/super-admin-dashboard/task.md).
[SDD backend/frontend](../../backend/.specs/features/super-admin-dashboard/sdd.md)
detalha esta entrega sem implementar as demais etapas do roadmap abaixo.
Billing, trial e capacidades/limites/regras de planos ficam em backlog.

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
