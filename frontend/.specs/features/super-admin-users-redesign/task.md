# Redesign da Tela de Superadmins e Equipe da Empresa (Superadmin)

## Objetivo

Refatorar a tela compartilhada de administração de superadmins e equipe empresarial (`frontend/src/pages/dashboard-super-admin/Users.tsx`) e o formulário de convite/edição (`frontend/src/components/dashboard-super-admin/UserForm.tsx`), adotando os componentes `shadcn/ui` (`Card`, `Table`, `Badge`, `Button`, `Field`, `Input`, `Select`), `CompanyPagination`, Tailwind CSS, `react-hook-form` e `zod`, eliminando todas as classes CSS legadas (`.sa-panel`, `.sa-filter-form`, `.sa-table`, `.sa-button`, `.sa-text-link`).

## Restrições globais

- Manter um único par de tela/formulário (`Users.tsx` e `UserForm.tsx`) para os contextos global (`/dashboard/super-admin/administrators`) e empresarial (`/dashboard/super-admin/companies/:companyId/users`), sem duplicar arquivos por papel.
- Nunca enviar `role`, `companyId` ou `password` no payload de convite/edição de superadmin (`companyId === null`).
- Preservar as travas de segurança na UI: impedir a desativação da própria conta (`title="Você não pode desativar a própria conta."`) e do último superadmin ativo (`title="O último superadmin ativo deve ser preservado."`), além de desabilitar convites/edições quando a empresa estiver arquivada (`deleted_at`).
- Aplicar o mapeamento de variáveis CSS (`--card`, `--popover`, `--input`, `--accent`) e manter `SelectTrigger` com fundo de baixa opacidade (`bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`) e `SelectContent` com `container={portalRef.current}` e `alignItemWithTrigger={false}`.
- Não realizar commit ou push sem revisão e autorização explícita do usuário.

## Pontos de atenção

- **Interação com `Select` nos testes (`Users.test.tsx`)**: ao substituir os `<select>` nativos de `"Estado do acesso"` e `"Perfil"` (nos filtros de `Users.tsx` e no formulário `UserForm.tsx`) pelo componente `Select` do `@base-ui/react/select`, os testes em `frontend/src/pages/dashboard-super-admin/Users.test.tsx` (linhas 218–219 e 278–282) que usam `fireEvent.change` ou `within(role).queryByRole('option')` precisarão interagir abrindo o `SelectTrigger` com clique e selecionando a opção correspondente.
- **Asserção do cabeçalho em `Users.test.tsx` (linha 444)**: o teste `"atualiza o nome do próprio superadmin no cabeçalho"` busca `screen.getByRole('link', { name: /Nome Atualizado/ })`. Como o `SuperAdminHeader.tsx` agora renderiza o menu do usuário como um `button` (`aria-label="Abrir menu de Nome Atualizado"`), essa asserção deve ser atualizada para `getByRole('button', { name: /Nome Atualizado/ })`.
- **Exibição do nome da empresa no modo empresarial**: o teste na linha 186 de `Users.test.tsx` verifica `await screen.findByText(companyA.nome)`. Ao remover `.sa-page-heading`, o nome da empresa (`company.data?.nome || companyId`) deve continuar visível na barra superior ou em um card/badge de contexto quando `companyId` estiver presente.

## Task 1: Refatorar `UserForm.tsx` com `react-hook-form`, `zod` e `shadcn/ui`

**Arquivos:**
- Modificar: `frontend/src/components/dashboard-super-admin/UserForm.tsx`
- Criar: nenhum

Passos:

- [x] Definir o schema `userFormSchema` com `zod` validando:
  - `name`: `z.string().trim().min(1, 'Informe nome e e-mail válido.').max(120)`
  - `email`: `z.string().trim().regex(/^\S+@\S+\.\S+$/, 'Informe nome e e-mail válido.').max(254)`
  - `role`: `z.enum(['admin_empresa', 'atendente'])`
- [x] Inicializar `useForm` com `zodResolver(userFormSchema)` e sincronizar os valores quando `initial` mudar (`name`, `email`, `role`).
- [x] Substituir `<form className="sa-form sa-panel">` por um `Card` (`rounded-2xl`) com `CardHeader` (`CardTitle` e `CardDescription`) e `CardContent` contendo `<form noValidate aria-label={initial ? 'Editar usuário' : 'Convidar usuário'}>`.
- [x] Substituir os inputs nativos por `FieldSet`, `FieldGroup`, `Field`, `FieldLabel`, `Input` e `FieldError` para `"Nome"` e `"E-mail"`.
- [x] Quando `!global`, renderizar `Field` + `Controller` + `Select` para `"Perfil"` (`SelectTrigger` com `bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50` e `SelectContent` com `container={portalRef.current} alignItemWithTrigger={false}`), oferecendo apenas `"Admin da empresa"` (`admin_empresa`) e `"Atendente"` (`atendente`).
- [x] No submit, montar o payload `{ name: values.name.trim(), email: values.email.trim(), ...(global ? {} : { role: values.role }) }` garantindo que `role`, `companyId` e `password` nunca sejam enviados no modo global.
- [x] Substituir os botões por `Button variant="outline"` (`"Cancelar"`) e `Button type="submit"` (`initial ? 'Salvar usuário' : 'Enviar convite'` / `"Salvando…"`).

Pronto quando:
- `UserForm.tsx` renderiza dentro de um `Card` com componentes `shadcn/ui`, valida campos via `zod` + `react-hook-form` e preserva as regras de payload para convite/edição global e empresarial.

Commit sugerido:
`refactor(dashboard): redesign managed user form with shadcn and react-hook-form`

## Task 2: Refatorar `Users.tsx` com `Card`, `Table`, `Badge`, `Select` e `CompanyPagination`

**Arquivos:**
- Modificar: `frontend/src/pages/dashboard-super-admin/Users.tsx`, `frontend/src/pages/dashboard-super-admin/Users.test.tsx`
- Criar: nenhum

Passos:

- [x] Remover `.sa-page-heading` em `Users.tsx` e criar a barra superior com:
  - Quando `companyId !== null`: `Button variant="outline"` com `<Link to={\`/dashboard/super-admin/companies/\${companyId}\`} role="link">` (`"Voltar à empresa"`) e identificação visível do nome da empresa (`company.data?.nome || companyId`).
  - `Button` `"Convidar usuário"` (desabilitado se `archived`).
- [x] Adicionar o objeto `theme` (`CSSProperties`) e `portalRef` no container raiz `div.space-y-6` de `Users.tsx`.
- [x] Substituir `<form className="sa-form sa-filter-form">` por um `Card` (`rounded-2xl py-5`) com `CardContent`, utilizando `Field`, `FieldLabel`, `Input` (`"Nome ou e-mail"`), `Select` (`"Estado do acesso"` e, quando `companyId !== null`, `"Perfil"`, ambos com `bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`) e `Button type="submit"` (`"Filtrar"`).
- [x] Substituir `<section className="sa-panel">` e `<table className="sa-table">` por `Card` (`gap-0 rounded-2xl py-0`), `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead` e `TableCell`, usando `Badge` para as colunas `"Estado"` e `"Convite"` e `Button variant="outline" size="sm"` (ou `variant="destructive" size="sm"` para `"Excluir atendente"`) na coluna `"Ações"`.
- [x] Substituir `Pagination` legado por `CompanyPagination` (`frontend/src/components/dashboard-super-admin/CompanyPagination.tsx`).
- [x] Atualizar as interações de `Select` (linhas 218–219 e 278–282) e a asserção do botão de perfil no header (linha 444) em `frontend/src/pages/dashboard-super-admin/Users.test.tsx`.
- [x] Executar `npx vitest run src/pages/dashboard-super-admin/Users.test.tsx` e `npx eslint src/pages/dashboard-super-admin/Users.tsx src/components/dashboard-super-admin/UserForm.tsx src/pages/dashboard-super-admin/Users.test.tsx`.

Pronto quando:
- `Users.tsx` opera nos contextos de Superadmins e Equipe da Empresa com visual `shadcn/ui` completo nos temas claro e escuro, e todos os 11 testes de `Users.test.tsx` passam sem erros de lint.

Commit sugerido:
`refactor(dashboard): redesign superadmin and company users page with shadcn ui`

