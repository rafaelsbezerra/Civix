# Redesign da tela de Meu Perfil (`ProfileSettings` e `ProfileForm`)

**Estado:** planejada, aguardando aprovação para implementação.
**Escopo:** refatoração visual e estrutural de `frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx` e `frontend/src/components/dashboard-super-admin/ProfileForm.tsx` para o padrão `shadcn/ui` + Tailwind CSS + `react-hook-form` + `zod`.

## Referências de código

- Página atual: `frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx`
- Formulário atual: `frontend/src/components/dashboard-super-admin/ProfileForm.tsx`
- Contexto e cabeçalho: `frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx` e `frontend/src/components/dashboard-super-admin/layout/SuperAdminHeader.tsx`
- Contratos HTTP e tipos: `frontend/src/lib/api.ts` (`updateOwnProfile`, `SessionProfile`)
- Componentes base `shadcn/ui`:
  - `frontend/src/components/ui/card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
  - `frontend/src/components/ui/field.tsx` (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`)
  - `frontend/src/components/ui/input.tsx` (`Input`)
  - `frontend/src/components/ui/button.tsx` (`Button`)
- Testes relacionados: `frontend/src/pages/dashboard-super-admin/SuperAdmin.test.tsx`

## Padrão visual e estrutural

1. **Remoção do cabeçalho duplicado (`.sa-page-heading`)**:
   - O título `"Meu perfil"` já é exibido pelo `SuperAdminHeader.tsx`.
2. **Escopo de variáveis de tema (`theme`)**:
   - O container raiz em `ProfileSettings.tsx` (`div.mx-auto.max-w-2xl.space-y-6`) injeta o mapeamento de variáveis CSS (`--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--input`, `--accent`, `--accent-foreground`) para herdar os tokens de `.super-admin-root`.
3. **Formulário `ProfileForm` em `Card` com `react-hook-form` + `zod`**:
   - Estrutura envolvida em `Card` (`rounded-2xl`) com `CardHeader` (`CardTitle`: `"Dados da conta"`, `CardDescription`: `"Alterar o e-mail encerrará a sessão atual e exigirá novo login."`) e `CardContent`.
   - Campos `"Nome"` (`maxLength={120}`) e `"E-mail"` (`type="email"`, `maxLength={254}`) estruturados com `Field`, `FieldLabel`, `Input` e `FieldError`.
   - Botão de submissão com `Button type="submit"` exibindo `"Salvar perfil"` (ou `"Salvando…"` durante envio).

## Fluxos detalhados

### 1. Atualização de nome do próprio superadmin (`ProfileSettings.tsx` / `ProfileForm.tsx`)
- **Entrada**: alteração do campo `"Nome"` mantendo o `"E-mail"` atual e envio em `"Salvar perfil"`.
- **Validação**: schema Zod (`profileFormSchema`) valida `name.trim().min(1, 'Informe seu nome e um e-mail válido.')` e `email.trim()` com formato de e-mail válido (`/^\S+@\S+\.\S+$/`).
- **Caso de uso**: atualizar o nome exibido na sessão e no cabeçalho sem derrubar o token JWT atual.
- **Módulos**: `ProfileForm.tsx` → `ProfileSettings.tsx` → `updateOwnProfile` (`frontend/src/lib/api.ts`) → `setProfile` (`SuperAdminContext`).
- **Persistência**: `PATCH /api/v1/auth/me` (ou rota de perfil configurada em `updateOwnProfile`).
- **Resposta**:
  - `requiresLogin: false` e `emailChanged === false`: atualiza o contexto (`setProfile({ ...session, user: result.user })`), exibe `"Perfil atualizado com sucesso."` (`role="status"`) e reflete o novo nome no `SuperAdminHeader.tsx`.

### 2. Atualização de e-mail do próprio superadmin (`ProfileSettings.tsx`)
- **Entrada**: alteração do campo `"E-mail"` para um novo endereço válido e envio em `"Salvar perfil"`.
- **Validação**: schema Zod valida presença e formato do e-mail; `ProfileSettings.tsx` compara `result.user.email.toLowerCase() !== session.user.email.toLowerCase()` ou `result.requiresLogin`.
- **Caso de uso**: alterar o e-mail de login do superadmin exigindo reautenticação imediata para evitar sessão com claims divergentes.
- **Módulos**: `ProfileForm.tsx` → `ProfileSettings.tsx` → `updateOwnProfile` → `localStorage.removeItem('token')` + `navigate('/login/empresa', { replace: true })`.
- **Persistência**: `PATCH` de perfil no backend.
- **Resposta**: remove o token local e redireciona para `/login/empresa` com `{ state: { notice: 'Seu e-mail foi alterado. Faça login novamente.' } }`.

## Decisões pendentes

Nenhuma decisão técnica ou de contrato pendente. Alteração de senha permanece fora do escopo (backlog), conforme `frontend/.specs/features/super-admin-dashboard/task.md`.

