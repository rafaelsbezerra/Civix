# Redesign da Tela de Meu Perfil (Superadmin)

## Objetivo

Refatorar a página de configurações de perfil (`frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx`) e o formulário de dados pessoais (`frontend/src/components/dashboard-super-admin/ProfileForm.tsx`) para utilizar `shadcn/ui` (`Card`, `Field`, `Input`, `Button`), Tailwind CSS, `react-hook-form` e `zod`, eliminando o uso de classes CSS legadas (`.sa-page-heading`, `.sa-panel`, `.sa-form`, `.sa-profile-form`, `.sa-button`).

## Restrições globais

- Não criar campos de alteração de senha ou novas rotas de configuração global (escopo restrito a nome e e-mail do próprio superadmin).
- Preservar a regra de segurança de sessão: quando `result.requiresLogin` for `true` ou o e-mail retornado diferir do e-mail anterior (`emailChanged`), remover `token` do `localStorage` e redirecionar imediatamente para `/login/empresa`.
- Manter os rótulos acessíveis exatos nos campos (`"Nome"` e `"E-mail"`), no formulário (`aria-label="Configurações de perfil"`) e no botão (`"Salvar perfil"` / `"Salvando…"`).
- Aplicar o mapeamento de variáveis CSS (`--card`, `--popover`, `--input`, `--accent`) no container da página para suportar os temas claro e escuro de `.super-admin-root`.
- Não realizar commit ou push sem revisão e autorização explícita do usuário.

## Pontos de atenção

- **Asserção legada do Header em `SuperAdmin.test.tsx` (linha 161)**: o teste `"Alterar nome atualiza cabeçalho sem encerrar sessão"` em `frontend/src/pages/dashboard-super-admin/SuperAdmin.test.tsx` ainda procura `screen.getByRole('link', { name: /Nome Atualizado/ })` da época em que o nome do usuário no `SuperAdminHeader.tsx` era um `<Link>` direto. Como o `SuperAdminHeader.tsx` foi refatorado para usar um menu dropdown disparado por botão (`aria-label="Abrir menu de Nome Atualizado"`), é necessário atualizar essa asserção no teste para verificar o botão do menu no header (`getByRole('button', { name: /Nome Atualizado/ })`).

## Task 1: Refatorar `ProfileForm.tsx` com `react-hook-form`, `zod` e `shadcn/ui`

**Arquivos:**
- Modificar: `frontend/src/components/dashboard-super-admin/ProfileForm.tsx`
- Criar: nenhum

Passos:

- [x] Definir o schema `profileFormSchema` com `zod`:
  - `name`: `z.string().trim().min(1, 'Informe seu nome e um e-mail válido.').max(120)`
  - `email`: `z.string().trim().regex(/^\S+@\S+\.\S+$/, 'Informe seu nome e um e-mail válido.').max(254)`
- [x] Inicializar `useForm` com `zodResolver(profileFormSchema)` e sincronizar `defaultValues` (`name: session.user.name || ''`, `email: session.user.email`) via `useEffect` quando `session.user` atualizar.
- [x] Substituir `<form className="sa-form sa-panel sa-profile-form">` por um `Card` (`rounded-2xl`) contendo `CardHeader` (`CardTitle` `"Dados da conta"` e `CardDescription` `"Alterar o e-mail encerrará a sessão atual e exigirá novo login."`) e `CardContent` com `<form noValidate aria-label="Configurações de perfil">`.
- [x] Substituir os campos nativos por `FieldSet`, `FieldGroup`, `Field`, `FieldLabel`, `Input` e `FieldError` para `"Nome"` e `"E-mail"`.
- [x] Substituir o botão `.sa-button` por `Button type="submit"` (`"Salvar perfil"` / `"Salvando…"`).

Pronto quando:
- O componente `ProfileForm.tsx` utiliza `react-hook-form`, `zod` e componentes `shadcn/ui` (`Card`, `Field`, `Input`, `Button`), exibindo erros de validação acessíveis e enviando `{ name: values.name.trim(), email: values.email.trim() }`.

Commit sugerido:
`refactor(dashboard): redesign profile form with shadcn and react-hook-form`

## Task 2: Refatorar `ProfileSettings.tsx` e alinhar teste de cabeçalho em `SuperAdmin.test.tsx`

**Arquivos:**
- Modificar: `frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx`, `frontend/src/pages/dashboard-super-admin/SuperAdmin.test.tsx`
- Criar: nenhum

Passos:

- [x] Remover `<header className="sa-page-heading">` de `ProfileSettings.tsx`, pois `"Meu perfil"` já consta no `SuperAdminHeader.tsx`.
- [x] Envolver o conteúdo de `ProfileSettings.tsx` em um container `div.mx-auto.max-w-2xl.space-y-6` com as variáveis CSS de `theme` (`--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--input`, `--accent`, `--accent-foreground`).
- [x] Estilizar os avisos de sucesso (`role="status"`) e erro (`role="alert"`) com utilitários Tailwind compatíveis com os temas claro e escuro, removendo `.sa-feedback` e `.sa-error`.
- [x] Atualizar a linha 161 de `frontend/src/pages/dashboard-super-admin/SuperAdmin.test.tsx` de `screen.getByRole('link', { name: /Nome Atualizado/ })` para `screen.getByRole('button', { name: /Nome Atualizado/ })`, refletindo o trigger atual do `SuperAdminHeader.tsx`.
- [x] Executar `npx vitest run src/pages/dashboard-super-admin/SuperAdmin.test.tsx` e `npx eslint src/pages/dashboard-super-admin/ProfileSettings.tsx src/components/dashboard-super-admin/ProfileForm.tsx src/pages/dashboard-super-admin/SuperAdmin.test.tsx`.

Pronto quando:
- `ProfileSettings.tsx` e `ProfileForm.tsx` seguem integralmente o novo design system e toda a suíte `SuperAdmin.test.tsx` passa (incluindo os testes `"Alterar nome atualiza cabeçalho sem encerrar sessão"` e `"Alterar e-mail encerra sessão e solicita novo login"`).

Commit sugerido:
`refactor(dashboard): redesign profile settings page with shadcn ui`

