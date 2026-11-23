# Redesign da tela de Planos Comerciais (`Plans` e `PlanForm`)

**Estado:** planejada, aguardando aprovação para implementação.
**Escopo:** refatoração visual e estrutural de `frontend/src/pages/dashboard-super-admin/Plans.tsx` e `frontend/src/components/dashboard-super-admin/PlanForm.tsx` para o padrão `shadcn/ui` + Tailwind CSS + `react-hook-form` + `zod`, alinhado às páginas `Companies.tsx`, `CompanyCreate.tsx` e `CompanyDetail.tsx`.

## Referências de código

- Página atual: `frontend/src/pages/dashboard-super-admin/Plans.tsx`
- Formulário atual: `frontend/src/components/dashboard-super-admin/PlanForm.tsx`
- Contratos HTTP e tipos: `frontend/src/lib/api.ts` (`getPlatformPlans`, `savePlatformPlan`, `setPlatformPlanActive`, `Plan`, `PlanInput`)
- Componentes base `shadcn/ui`:
  - `frontend/src/components/ui/card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardAction`)
  - `frontend/src/components/ui/table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`)
  - `frontend/src/components/ui/badge.tsx` (`Badge`)
  - `frontend/src/components/ui/button.tsx` (`Button`)
  - `frontend/src/components/ui/field.tsx` (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`)
  - `frontend/src/components/ui/input.tsx` (`Input`)
  - `frontend/src/components/ui/textarea.tsx` (`Textarea`)
  - `frontend/src/components/ui/select.tsx` (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`)
  - `frontend/src/components/ui/checkbox.tsx` (`Checkbox`)
- Testes relacionados: `frontend/src/pages/dashboard-super-admin/SuperAdmin.test.tsx`

## Padrão visual e estrutural

1. **Remoção do cabeçalho duplicado (`.sa-page-heading`)**:
   - O título `"Planos comerciais"` já é exibido pelo `SuperAdminHeader.tsx`.
   - O topo da página passa a exibir uma barra de ações enxuta com o botão `"Novo plano"` (`Button` com ícone `Plus`).
2. **Escopo de variáveis de tema (`theme`)**:
   - O container raiz da página (`div.space-y-6`) injeta o mapeamento de variáveis CSS para que os componentes `shadcn/ui` e portais do `Select` respeitem os temas claro e escuro de `.super-admin-root`:
     ```tsx
     const theme = {
       '--card': 'var(--sa-surface)',
       '--card-foreground': 'var(--sa-ink)',
       '--popover': 'var(--sa-surface)',
       '--popover-foreground': 'var(--sa-ink)',
       '--input': 'var(--sa-line)',
       '--accent': 'var(--sa-soft)',
       '--accent-foreground': 'var(--sa-ink)',
     } as CSSProperties;
     ```
3. **Listagem e busca em `Card` + `Table`**:
   - Barra de filtro/busca dentro de um `Card` (`rounded-2xl`) ou no cabeçalho do `Card` da tabela, mantendo o campo de busca acessível (`id="plan-search"`, label `"Buscar plano por nome ou identificador"`, placeholder `"Nome ou slug"`) e o contador (`Badge variant="outline"` com `${filtered.length} planos`).
   - Tabela com `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead` (`px-6 font-medium text-muted-foreground`) e `TableCell` (`px-6 py-4`), exibindo:
     - **Plano**: nome em destaque (`font-medium`) e `plan.slug` abaixo em `text-xs text-muted-foreground`.
     - **Cobrança**: `Mensal` (`monthly`), `Anual` (`yearly`) ou `Avulso` (`one_time`).
     - **Preço**: `${plan.price} BRL`.
     - **Situação**: `Badge` com variante visual semântica (`Ativo` em esmeralda e `Inativo` em âmbar/neutro), seguindo o mesmo estilo de `Companies.tsx`.
     - **Ações**: botões `Button variant="outline" size="sm"` com nomes acessíveis preservados (`Editar ${plan.name}` e `Desativar ${plan.name}` / `Ativar ${plan.name}`).
4. **Formulário `PlanForm` com `react-hook-form` + `zod`**:
   - Envolvido por `Card` (`rounded-2xl`) com `CardHeader` e `CardContent`.
   - `SelectTrigger` de `"Recorrência"` com fundo de baixa opacidade (`bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`) e `SelectContent` renderizado no container local (`container={portalRef.current} alignItemWithTrigger={false}`).
   - Campos booleanos (`isActive` — `"Disponível para novos cadastros"` e `isFeatured` — `"Destacar no catálogo"`) controlados via `Controller` com `Checkbox` (ou input checkbox acessível vinculado ao `FieldLabel`).

## Fluxos detalhados

### 1. Consulta e filtragem de planos (`Plans.tsx`)
- **Entrada**: abertura da rota `/dashboard/super-admin/plans` e digitação no campo `"Buscar plano por nome ou identificador"`.
- **Validação**: filtro local case-insensitive por `plan.name` ou `plan.slug` sem disparar novas requisições a cada tecla.
- **Caso de uso**: listar todos os planos comerciais (ativos e inativos) e permitir busca rápida.
- **Módulos**: `Plans.tsx` → `useAsyncQuery` → `getPlatformPlans` (`frontend/src/lib/api.ts`).
- **Persistência**: leitura via `GET /api/v1/platform/plans`.
- **Resposta**:
  - Estado carregando (`role="status"`): `"Carregando planos…"` dentro de `Card`.
  - Estado de erro (`role="alert"`): mensagem pública + `Button` `"Tentar novamente"`.
  - Lista vazia: `"Nenhum plano cadastrado."` dentro de `CardContent`.
  - Sucesso: renderização da `Table` com os planos retornados.

### 2. Criação e edição de plano (`PlanForm.tsx`)
- **Entrada**:
  - `name` (obrigatório, `trim`, máx. 100 caracteres)
  - `slug` (obrigatório, `trim`, regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`)
  - `price` (obrigatório, formato monetário `/^\d+(?:[.,]\d{1,2})?$/`, normalizado com ponto e 2 casas decimais, ex.: `"59,90"` → `"59.90"`)
  - `billingPeriod` (`'monthly' | 'yearly' | 'one_time'`)
  - `displayOrder` (inteiro `>= 0`)
  - `description` (opcional, `trim` ou `null`)
  - `featuresText` (separado por quebras de linha ou vírgula em `string[]`)
  - `isActive` (`boolean`)
  - `isFeatured` (`boolean`)
- **Validação**: schema Zod (`planFormSchema`) executado pelo `zodResolver` no submit, exibindo erros em português brasileiro via `FieldError` e `role="alert"`.
- **Caso de uso**: cadastrar novo plano comercial ou atualizar plano existente sem transportar `id` no corpo do payload.
- **Módulos**: `PlanForm.tsx` → `Plans.tsx` → `savePlatformPlan(input, editingPlanId)` (`frontend/src/lib/api.ts`).
- **Persistência**: `POST /api/v1/platform/plans` (criação) ou `PATCH /api/v1/platform/plans/:id` (edição).
- **Resposta**: exibe feedback `"Plano salvo com sucesso."` (`role="status"`), fecha o formulário e recarrega a listagem.

### 3. Ativação e desativação de plano (`Plans.tsx`)
- **Entrada**: clique no botão `Desativar ${plan.name}` ou `Ativar ${plan.name}`.
- **Validação**: bloqueia cliques concorrentes na mesma linha (`busyId === plan.id`).
- **Caso de uso**: alternar disponibilidade comercial do plano para novos cadastros sem afetar vendas históricas.
- **Módulos**: `Plans.tsx` → `setPlatformPlanActive(plan.id, !plan.isActive)` (`frontend/src/lib/api.ts`).
- **Persistência**: `PATCH /api/v1/platform/plans/:id`.
- **Resposta**:
  - Sucesso: exibe `"Plano ativado."` ou `"Plano desativado."` (`role="status"`) e atualiza a lista.
  - Falha (ex.: HTTP 409): exibe mensagem pública em `role="alert"` e reabilita o botão.

## Decisões pendentes

Nenhuma decisão técnica ou de contrato pendente. Não há alteração de rotas ou payloads de backend.

