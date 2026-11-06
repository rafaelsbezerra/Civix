# Redesign das telas de Vendas Comerciais (`Sales`, `SaleCreate`, `SaleForm`, `CompanyPicker` e `PlanFilter`)

**Estado:** planejada, aguardando aprovação para implementação.
**Escopo:** refatoração visual e estrutural de `frontend/src/pages/dashboard-super-admin/Sales.tsx`, `frontend/src/pages/dashboard-super-admin/SaleCreate.tsx`, `frontend/src/components/dashboard-super-admin/SaleForm.tsx`, `frontend/src/components/dashboard-super-admin/CompanyPicker.tsx` e `frontend/src/components/dashboard-super-admin/PlanFilter.tsx` para o padrão `shadcn/ui` + Tailwind CSS + `react-hook-form` + `zod`.

## Referências de código

- Listagem de vendas: `frontend/src/pages/dashboard-super-admin/Sales.tsx`
- Página de lançamento manual: `frontend/src/pages/dashboard-super-admin/SaleCreate.tsx`
- Formulário de lançamento manual: `frontend/src/components/dashboard-super-admin/SaleForm.tsx`
- Seletor paginado de empresa: `frontend/src/components/dashboard-super-admin/CompanyPicker.tsx`
- Filtro de plano comercial: `frontend/src/components/dashboard-super-admin/PlanFilter.tsx`
- Paginação (já refatorada): `frontend/src/components/dashboard-super-admin/CompanyPagination.tsx`
- Confirmação modal (já refatorada): `frontend/src/components/dashboard-super-admin/ActionConfirmation.tsx`
- Contratos HTTP e tipos: `frontend/src/lib/api.ts` (`getPlatformSales`, `createManualSale`, `deletePlatformSale`, `getPlatformCompanies`, `getPlatformCompany`, `getPlatformPlans`, `PlatformSale`, `ManualSaleInput`)
- Componentes base `shadcn/ui`:
  - `frontend/src/components/ui/card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
  - `frontend/src/components/ui/table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`)
  - `frontend/src/components/ui/badge.tsx` (`Badge`)
  - `frontend/src/components/ui/button.tsx` (`Button`)
  - `frontend/src/components/ui/field.tsx` (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`)
  - `frontend/src/components/ui/input.tsx` (`Input`)
  - `frontend/src/components/ui/textarea.tsx` (`Textarea`)
  - `frontend/src/components/ui/select.tsx` (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`)
- Testes relacionados: `frontend/src/pages/dashboard-super-admin/Sales.test.tsx`

## Padrão visual e estrutural

1. **Remoção do cabeçalho duplicado (`.sa-page-heading`)**:
   - O título `"Vendas"` já é exibido pelo `SuperAdminHeader.tsx`.
   - Em `Sales.tsx`, a barra de topo exibe o botão `"Lançar venda manual"` (`Button` com `<Link to="/dashboard/super-admin/sales/new" role="link" />`).
   - Em `SaleCreate.tsx`, a barra de topo exibe o botão `"Voltar para vendas"` (`Button variant="outline"` com `<Link to="/dashboard/super-admin/sales" role="link" />`).
2. **Escopo de variáveis de tema (`theme`)**:
   - Os containers raiz de `Sales.tsx` e `SaleCreate.tsx` aplicam o objeto `theme` (`--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--input`, `--accent`, `--accent-foreground`) e mantêm `portalRef` para portais de `SelectContent`.
3. **Filtros de vendas (`Sales.tsx` e `PlanFilter.tsx`)**:
   - Agrupados em um `Card` (`rounded-2xl py-5`) contendo:
     - `PlanFilter` refatorado com `Field`, `FieldLabel` (`"Plano"`) e `Select` (`SelectTrigger` com `bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`), mantendo alerta e botão `"Tentar novamente"` em caso de falha ao carregar planos.
     - `Field` + `Select` para `"Origem"` (`Todos`, `Cadastro da empresa` (`company_registration`), `Lançamento manual` (`manual`)).
     - `Field` + `Input type="datetime-local"` para `"De (UTC)"` e `"Até (UTC)"`.
     - Barra de ações do filtro com `Button variant="outline"` (`"Filtrar por empresa"` / `"Ocultar empresas"`), chip `<span>{company.nome}</span>` + `Button variant="ghost"` (`"Limpar empresa"`) quando selecionada, e `Button type="submit"` (`"Filtrar"`).
4. **Seletor `CompanyPicker` em `Card`**:
   - Envolvido por `<Card render={<section aria-label="Escolher empresa" />}>` com `CardHeader` (`CardTitle`: `"Escolha a empresa"`), formulário de busca (`Input` `"Buscar empresa por nome ou CNPJ"` + `Button` `"Buscar empresa"`), lista de opções estilizada com cartões/botões selecionáveis (`aria-pressed={selectedId === company.id}`) e `CompanyPagination`.
5. **Tabela de vendas (`Sales.tsx`)**:
   - Renderizada em `Card` (`gap-0 rounded-2xl py-0`) com `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` e `CompanyPagination`.
   - Exibe link para a empresa (`<Link to={\`/dashboard/super-admin/companies/\${sale.companyId}\`}>{sale.companyName}</Link>`), plano, `Badge` para origem (`Cadastro` / `Manual`), valor histórico formatado (`formatSaleAmount(sale.amount)`), descrição, data comercial UTC e botão `Button variant="destructive" size="sm"` `"Excluir definitivamente"`. Nunca exibe ação de editar venda.
6. **Formulário `SaleForm` em `Card` com `react-hook-form` + `zod`**:
   - Validação condicional conforme `pricingMode`:
     - Em `'company_plan'`: não renderiza o input `"Valor em reais"`, exibe um bloco informativo com o valor vigente (`${plan ? `${plan.price} BRL` : 'Sem plano comercial ativo'}`) e nunca envia `amount` no payload.
     - Em `'manual_amount'`: renderiza `"Valor em reais"` (`Input`) e exige tanto valor positivo válido quanto `"Descrição / motivo (obrigatório no valor manual)"` não vazia.
   - Preserva o controle de idempotência (`operationId` via `crypto.randomUUID()`), reutilizando a mesma chave quando o mesmo payload é reenviado após falha e gerando uma nova chave somente quando qualquer campo do payload muda.

## Fluxos detalhados

### 1. Listagem, filtro e paginação de vendas (`Sales.tsx`)
- **Entrada**: filtros `planId`, `origin`, `from` (convertido para ISO UTC), `to` (convertido para ISO UTC), `companyId` e `page`.
- **Validação**: conversão de `datetime-local` para ISO UTC (`toUtcIso`).
- **Caso de uso**: auditar vendas comerciais históricas sem confundir valor comercial com liquidação de pagamento.
- **Módulos**: `Sales.tsx` → `PlanFilter.tsx`, `CompanyPicker.tsx` → `getPlatformSales` (`frontend/src/lib/api.ts`).
- **Persistência**: `GET /api/v1/platform/sales`.
- **Resposta**: renderiza `Table` + `CompanyPagination`, ou estados de carregamento (`"Carregando vendas…"`), vazio (`"Nenhuma venda encontrada."`) e erro (`role="alert"` + `"Tentar novamente"`).

### 2. Exclusão definitiva de venda (`Sales.tsx` + `ActionConfirmation.tsx`)
- **Entrada**: clique em `"Excluir definitivamente"` na linha da venda e confirmação no modal `"Excluir venda definitivamente"`.
- **Validação**: confirmação explícita informando que a empresa e o plano serão preservados e que eventual correção exige novo lançamento manual.
- **Caso de uso**: remover registro comercial incorreto sem editar venda in-place nem alterar empresa.
- **Módulos**: `Sales.tsx` → `ActionConfirmation.tsx` → `deletePlatformSale(sale.id)` (`frontend/src/lib/api.ts`).
- **Persistência**: `DELETE /api/v1/platform/sales/:id`.
- **Resposta**: exibe banner `role="status"` com `"Venda excluída definitivamente."` e link `"Fazer novo lançamento"` apontando para `/dashboard/super-admin/sales/new`.

### 3. Lançamento de venda manual (`SaleCreate.tsx` + `SaleForm.tsx`)
- **Entrada**: seleção de empresa ativa via `CompanyPicker`, escolha de `"Data comercial (UTC)"`, `"Origem do valor"` (`company_plan` ou `manual_amount`), `"Valor em reais"` (se `manual_amount`) e `"Descrição / motivo (obrigatório no valor manual)"`.
- **Validação**: schema Zod (`saleFormSchema`) com `superRefine` validando data UTC válida, elegibilidade do plano no modo `company_plan` e obrigatoriedade de `amount` + `description` no modo `manual_amount`.
- **Caso de uso**: registrar venda manual com chave de idempotência (`operationId`).
- **Módulos**: `SaleCreate.tsx` → `CompanyPicker.tsx`, `SaleForm.tsx` → `createManualSale` (`frontend/src/lib/api.ts`).
- **Persistência**: `POST /api/v1/platform/sales`.
- **Resposta**: renderiza `Card` de confirmação (`role="region" aria-label="Venda registrada"`) com título `"Venda registrada."`, valor formatado (`formatSaleAmount`) e carimbo `${result.sale.soldAt} UTC`.

## Decisões pendentes

Nenhuma decisão técnica ou de contrato pendente.

