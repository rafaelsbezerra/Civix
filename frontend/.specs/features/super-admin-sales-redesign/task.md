# Redesign das Telas de Vendas Comerciais (Superadmin)

## Objetivo

Refatorar a página de listagem de vendas (`frontend/src/pages/dashboard-super-admin/Sales.tsx`), a página de novo lançamento manual (`frontend/src/pages/dashboard-super-admin/SaleCreate.tsx`), o formulário de venda (`frontend/src/components/dashboard-super-admin/SaleForm.tsx`) e os componentes auxiliares `CompanyPicker.tsx` e `PlanFilter.tsx`, adotando `shadcn/ui` (`Card`, `Table`, `Badge`, `Button`, `Field`, `Input`, `Textarea`, `Select`), `CompanyPagination`, Tailwind CSS, `react-hook-form` e `zod`.

## Restrições globais

- Não criar funcionalidade ou botão de edição de venda (`queryByRole('button', { name: /Editar/ })` deve continuar retornando `null`).
- No modo `'company_plan'`, não renderizar o input `"Valor em reais"` e nunca enviar a propriedade `amount` no payload de `createManualSale`.
- No modo `'manual_amount'`, exigir valor positivo válido e justificativa não vazia (`description.trim().length > 0`).
- Preservar integralmente a lógica de idempotência (`operationId` via `crypto.randomUUID()`): reutilizar o mesmo `operationId` ao repetir o envio do mesmo payload após erro de rede/API e gerar um novo `operationId` quando qualquer dado do formulário for modificado.
- Manter o fundo de baixa opacidade (`bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`) nos componentes `SelectTrigger` e passar `container={portalRef.current}` e `alignItemWithTrigger={false}` em `SelectContent`.
- Não realizar commit ou push sem revisão e autorização explícita do usuário.

## Pontos de atenção

- **Assinatura de idempotência em `SaleForm.tsx` com `react-hook-form`**: o teste `"reutiliza operationId após falha idêntica e cria outra chave quando o conteúdo muda"` em `frontend/src/pages/dashboard-super-admin/Sales.test.tsx` (linhas 186–241) verifica que `crypto.randomUUID` só é chamado quando o payload efetivamente muda. Portanto, a geração/reutilização do `operationId` deve continuar baseada na comparação da assinatura do payload no momento do submit (`lastSignatureRef`), e não a cada renderização.
- **Interação com `Select` nos testes (`Sales.test.tsx`)**: ao migrar `"Origem do valor"` (em `SaleForm.tsx`), `"Plano"` (em `PlanFilter.tsx`) e `"Origem"` (em `Sales.tsx`) de `<select>` nativo para o componente `Select` do `shadcn/ui` (`@base-ui/react/select`), o arquivo `frontend/src/pages/dashboard-super-admin/Sales.test.tsx` (linhas 154, 178, 204, 258–259) precisará usar clique no trigger e seleção de `role="option"` (e `toHaveTextContent` no trigger em vez de `toHaveValue('company_plan')`).
- **Seletor `span` da empresa filtrada (`Sales.test.tsx` linha 283)**: o teste verifica `expect(screen.getByText('Empresa de Exemplo', { selector: 'span' })).toBeInTheDocument()` após selecionar uma empresa para filtro. Ao estilizar o indicador da empresa selecionada com `Badge` ou chip em `Sales.tsx`, garantir que o nome da empresa continue dentro de uma tag `<span>`.

## Task 1: Refatorar `CompanyPicker.tsx` e `PlanFilter.tsx` para `shadcn/ui`

**Arquivos:**
- Modificar: `frontend/src/components/dashboard-super-admin/CompanyPicker.tsx`, `frontend/src/components/dashboard-super-admin/PlanFilter.tsx`
- Criar: nenhum

Passos:

- [ ] Refatorar `CompanyPicker.tsx` substituindo `<section className="sa-panel" aria-label="Escolher empresa">` por um `Card` (`rounded-2xl`) que preserve `<section aria-label="Escolher empresa">`, com `CardHeader` (`CardTitle`: `"Escolha a empresa"`) e `CardContent`.
- [ ] Em `CompanyPicker.tsx`, substituir o formulário de busca por `Field`, `FieldLabel` (`"Buscar empresa por nome ou CNPJ"`), `Input` (`name="company-search"`, `maxLength={200}`) e `Button type="submit" variant="outline"` (`"Buscar empresa"`).
- [ ] Estilizar a lista de empresas em `CompanyPicker.tsx` com botões/cartões Tailwind mantendo `type="button"` e `aria-pressed={selectedId === company.id}`, e trocar `Pagination` legado por `CompanyPagination`.
- [ ] Refatorar `PlanFilter.tsx` para receber `value`, `onValueChange` e `portalContainer` (ou manter controle compatível com o formulário de filtro), utilizando `Field`, `FieldLabel` (`"Plano"`), `Select`, `SelectTrigger` (`aria-label="Plano"` com `bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`), `SelectValue`, `SelectContent` e `SelectItem`, preservando o aviso `role="alert"` com o botão `"Tentar novamente"` em caso de falha.

Pronto quando:
- `CompanyPicker.tsx` e `PlanFilter.tsx` não utilizam mais classes `.sa-*` e seguem o design de cards, inputs, selects e paginação do `shadcn/ui`.

Commit sugerido:
`refactor(dashboard): redesign company picker and plan filter components`

## Task 2: Refatorar `SaleForm.tsx` e `SaleCreate.tsx` com `react-hook-form`, `zod` e `shadcn/ui`

**Arquivos:**
- Modificar: `frontend/src/components/dashboard-super-admin/SaleForm.tsx`, `frontend/src/pages/dashboard-super-admin/SaleCreate.tsx`
- Criar: nenhum

Passos:

- [ ] Definir o schema `saleFormSchema` com `zod` em `SaleForm.tsx` validando:
  - `soldAt`: string de data/hora convertível para ISO UTC válido (`'Informe uma data comercial válida em UTC.'`)
  - `pricingMode`: `z.enum(['company_plan', 'manual_amount'])`
  - `amount`: string validada quando `pricingMode === 'manual_amount'` (`/^\d+(?:[.,]\d{1,2})?$/` e `Number > 0`, `'Informe um valor manual positivo em reais.'`)
  - `description`: string obrigatória quando `pricingMode === 'manual_amount'` (`trim().min(1, 'Informe a descrição ou motivo do lançamento manual.')`) e opcional quando `pricingMode === 'company_plan'`
- [ ] Configurar `useForm` + `zodResolver` em `SaleForm.tsx`, observando `pricingMode` (`useWatch`) para exibir a prévia somente leitura (`${plan ? `${plan.price} BRL` : 'Sem plano comercial ativo'}`) no modo `'company_plan'` e renderizar o campo `"Valor em reais"` apenas no modo `'manual_amount'`.
- [ ] Manter a lógica de `operationId` (`useRef<{ signature: string; id: string } | null>(null)`) comparando a assinatura JSON do payload para reutilizar o mesmo UUID em retentativas idênticas e gerar novo UUID quando os dados mudarem.
- [ ] Estruturar `SaleForm.tsx` dentro de `Card` (`rounded-2xl`) com `FieldSet`, `FieldGroup`, `Field`, `FieldLabel`, `Input`, `Select`, `Textarea`, `FieldError` e `Button type="submit"` (`"Registrar venda manual"` / `"Registrando venda…"`).
- [ ] Refatorar `SaleCreate.tsx` removendo `.sa-page-heading`, aplicando o objeto `theme` (`CSSProperties`), estilizando o botão `"Voltar para vendas"` (`Button variant="outline"` com `<Link to="/dashboard/super-admin/sales" role="link" />`) e transformando o painel de sucesso em um `Card` com `role="region" aria-label="Venda registrada"`.

Pronto quando:
- O fluxo de lançamento manual em `SaleCreate.tsx` e `SaleForm.tsx` opera com `react-hook-form`, `zod` e `shadcn/ui`, respeitando as regras de `company_plan` vs `manual_amount` e de idempotência (`operationId`).

Commit sugerido:
`refactor(dashboard): redesign manual sale creation form with shadcn and react-hook-form`

## Task 3: Refatorar `Sales.tsx` e atualizar interações de `Select` em `Sales.test.tsx`

**Arquivos:**
- Modificar: `frontend/src/pages/dashboard-super-admin/Sales.tsx`, `frontend/src/pages/dashboard-super-admin/Sales.test.tsx`
- Criar: nenhum

Passos:

- [ ] Remover `.sa-page-heading` em `Sales.tsx`, adicionando o objeto `theme` (`CSSProperties`) no container raiz `div.space-y-6` e posicionando o botão `"Lançar venda manual"` (`Button` com `<Link to="/dashboard/super-admin/sales/new" role="link" />`) na barra superior.
- [ ] Estruturar o formulário de filtros dentro de um `Card` (`rounded-2xl py-5`) com `PlanFilter`, `Select` para `"Origem"`, `Input type="datetime-local"` para `"De (UTC)"` e `"Até (UTC)"`, botão `"Filtrar por empresa"` / `"Ocultar empresas"`, badge `<span>{company.nome}</span>` + botão `"Limpar empresa"` e botão `"Filtrar"`.
- [ ] Substituir `<section className="sa-panel">` e `<table className="sa-table">` por `Card` (`gap-0 rounded-2xl py-0`), `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `Badge` (para a coluna `"Origem"`) e `CompanyPagination`.
- [ ] Estilizar o botão `"Excluir definitivamente"` com `Button variant="destructive" size="sm"` e o banner pós-exclusão (`role="status"`) com o link `"Fazer novo lançamento"`.
- [ ] Atualizar `frontend/src/pages/dashboard-super-admin/Sales.test.tsx` para interagir com os componentes `Select` (`"Origem do valor"`, `"Plano"` e `"Origem"`) via clique no trigger e seleção da opção `role="option"`.
- [ ] Executar `npx vitest run src/pages/dashboard-super-admin/Sales.test.tsx` e `npx eslint src/pages/dashboard-super-admin/Sales.tsx src/pages/dashboard-super-admin/SaleCreate.tsx src/components/dashboard-super-admin/SaleForm.tsx src/components/dashboard-super-admin/CompanyPicker.tsx src/components/dashboard-super-admin/PlanFilter.tsx src/pages/dashboard-super-admin/Sales.test.tsx`.

Pronto quando:
- A listagem e o cadastro de vendas utilizam exclusivamente o novo padrão visual `shadcn/ui` nos temas claro e escuro, e todos os 6 testes de `Sales.test.tsx` passam sem erros de lint ou TypeScript.

Commit sugerido:
`refactor(dashboard): redesign commercial sales list and filters with shadcn ui`

