# Redesign da Tela de Planos Comerciais (Superadmin)

## Objetivo

Refatorar a página de listagem e gestão de planos comerciais (`frontend/src/pages/dashboard-super-admin/Plans.tsx`) e o formulário de criação/edição de plano (`frontend/src/components/dashboard-super-admin/PlanForm.tsx`), substituindo a marcação legada baseada em classes CSS puras (`.sa-panel`, `.sa-form`, `.sa-table`, `.sa-button`, `.sa-badge`) pelos componentes `shadcn/ui`, Tailwind CSS, `react-hook-form` e `zod`, mantendo total paridade visual com a página de Empresas (`Companies.tsx`, `CompanyCreate.tsx`, `CompanyDetail.tsx`).

## Restrições globais

- Não criar, remover ou alterar rotas ou contratos HTTP em `frontend/src/lib/api.ts`.
- Nunca enviar a propriedade `id` dentro do corpo (`PlanInput`) passado para `savePlatformPlan(input, id)`.
- Preservar todos os rótulos (`aria-label`, textos de `FieldLabel` e nomes acessíveis de botões como `"Novo plano"`, `"Salvar plano"`, `"Editar ${plan.name}"`, `"Desativar ${plan.name}"`, `"Ativar ${plan.name}"` e `"Tentar novamente"`) exigidos pela suíte de testes existente.
- Aplicar o mapeamento de variáveis de tema (`--card`, `--popover`, `--input`, `--accent`) no container raiz da página e renderizar `SelectContent` com `container={portalRef.current}` e `alignItemWithTrigger={false}`.
- Manter o fundo com baixa opacidade (`bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`) nos componentes `SelectTrigger`.
- Não realizar commit ou push sem revisão e autorização explícita do usuário.

## Pontos de atenção

- **Interação do `Select` em testes**: caso um teste altere o campo `"Recorrência"` (`billingPeriod`), o componente `Select` do `@base-ui/react/select` abre o popup via clique (`userEvent.click`) e seleciona uma `option` (`role="option"`), em vez de `fireEvent.change`. No teste atual de `SuperAdmin.test.tsx`, o valor padrão `'monthly'` é mantido, portanto o fluxo de criação/edição deve inicializar `billingPeriod: 'monthly'` em `defaultValues`.
- **Normalização de preço**: o campo `"Preço em reais (ex.: 99.90)"` deve continuar aceitando vírgula ou ponto (ex.: `"59,90"`) e convertendo para `"59.90"` antes de chamar `onSubmit`.
- **Teste herdado em `SuperAdmin.test.tsx` (linha 161)**: na mesma suíte onde `Plans` é testado (`SuperAdmin.test.tsx`), o teste de perfil na linha 161 busca `getByRole('link', { name: /Nome Atualizado/ })`, que pertence à tela de Perfil / Header. Ao validar apenas os testes de `Plans`, usar filtro por nome do teste (`-t "Planos|plano"`) até que a task da spec de Perfil seja aplicada.

## Task 1: Refatorar `PlanForm.tsx` com `react-hook-form`, `zod` e `shadcn/ui`

**Arquivos:**
- Modificar: `frontend/src/components/dashboard-super-admin/PlanForm.tsx`
- Criar: nenhum

Passos:

- [ ] Definir o schema `planFormSchema` com `zod` validando:
  - `name`: `z.string().trim().min(1, 'Informe o nome, slug válido e preço em reais.')`
  - `slug`: `z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Informe o nome, slug válido e preço em reais.')`
  - `price`: `z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, 'Informe o nome, slug válido e preço em reais.')`
  - `billingPeriod`: `z.enum(['monthly', 'yearly', 'one_time'])`
  - `displayOrder`: `z.coerce.number().int().min(0, 'A ordem de exibição deve ser um número inteiro igual ou maior que zero.')`
  - `description`: `z.string()`
  - `featuresText`: `z.string()`
  - `isActive`: `z.boolean()`
  - `isFeatured`: `z.boolean()`
- [ ] Configurar `useForm` com `zodResolver(planFormSchema)` e `useEffect` para sincronizar os valores quando a prop `initial` (`Plan | null`) mudar (alternando entre `"Novo plano"` e `"Editar plano"`).
- [ ] Estruturar o formulário dentro de `Card` (`rounded-2xl`), `CardHeader` (`CardTitle`, `CardDescription`) e `CardContent`, mantendo `aria-label={initial ? 'Editar plano' : 'Novo plano'}` e `noValidate` na tag `<form>`.
- [ ] Substituir os campos HTML legados por `FieldSet`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `Textarea`, `Select` (`SelectTrigger` com `bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50` e `SelectContent` com `container={portalRef.current} alignItemWithTrigger={false}`) e `Checkbox` (via `Controller` para `"Disponível para novos cadastros"` e `"Destacar no catálogo"`).
- [ ] Garantir que o submit normalize `price` (`Number(values.price.replace(',', '.')).toFixed(2)`), converta `featuresText` em array `features` e invoque `onSubmit(input)` sem incluir a chave `id` no objeto enviado.
- [ ] Substituir os botões de ação por `Button variant="outline"` (`"Cancelar"`) e `Button type="submit"` (`"Salvar plano"` / `"Salvando…"`).

Pronto quando:
- O formulário `PlanForm` renderiza com `Card`, `Field`, `Input`, `Select`, `Textarea`, `Checkbox` e `Button` do `shadcn/ui`, valida entradas com `zod` + `react-hook-form` e envia o payload exato esperado por `savePlatformPlan` sem `id` no corpo.

Commit sugerido:
`refactor(dashboard): redesign commercial plan form with shadcn and react-hook-form`

## Task 2: Refatorar `Plans.tsx` para o padrão visual de `Card`, `Table` e `Badge`

**Arquivos:**
- Modificar: `frontend/src/pages/dashboard-super-admin/Plans.tsx`
- Criar: nenhum

Passos:

- [ ] Remover o bloco `.sa-page-heading` (`<header className="sa-page-heading">`), pois o título `"Planos comerciais"` já é exibido no `SuperAdminHeader.tsx`, mantendo uma barra superior enxuta com o botão `"Novo plano"` (`Button` com ícone `Plus`).
- [ ] Adicionar o objeto `theme` (`CSSProperties`) no container raiz `div.space-y-6` da página para mapear `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--input`, `--accent` e `--accent-foreground`.
- [ ] Substituir os alertas `.sa-feedback` e `.sa-error` por blocos estilizados com Tailwind (`rounded-xl border ...`) ou `Card`, preservando `role="status"`, `role="alert"` e o botão `"Tentar novamente"`.
- [ ] Estruturar a seção da listagem em um `Card` (` gap-0 rounded-2xl py-0`), com cabeçalho de busca contendo o input acessível (`id="plan-search"`, label `"Buscar plano por nome ou identificador"`, placeholder `"Nome ou slug"`) e `Badge variant="outline"` exibindo `${filtered.length} planos`.
- [ ] Substituir `<table className="sa-table">` pelos componentes `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead` e `TableCell` de `frontend/src/components/ui/table.tsx`.
- [ ] Renderizar a coluna `"Situação"` com `Badge` estilizada (`Ativo` em verde esmeralda e `Inativo` em âmbar/neutro) e a coluna `"Ações"` com `Button variant="outline" size="sm"` mantendo os `aria-label` `"Editar ${plan.name}"` e `"Desativar ${plan.name}"` / `"Ativar ${plan.name}"`.
- [ ] Executar `npx vitest run src/pages/dashboard-super-admin/SuperAdmin.test.tsx -t "Planos|plano"` e `npx eslint src/pages/dashboard-super-admin/Plans.tsx src/components/dashboard-super-admin/PlanForm.tsx`.

Pronto quando:
- A página `Plans.tsx` não utiliza mais classes legadas `.sa-*`, exibe a tabela, busca, badges e ações no padrão `shadcn/ui` nos temas claro e escuro, e todos os testes de planos em `SuperAdmin.test.tsx` passam sem erros de lint ou TypeScript.

Commit sugerido:
`refactor(dashboard): redesign commercial plans page with shadcn ui`

