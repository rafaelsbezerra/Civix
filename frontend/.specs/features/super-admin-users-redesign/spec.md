# Redesign da tela de Superadmins e Equipe da Empresa (`Users` e `UserForm`)

**Estado:** planejada, aguardando aprovação para implementação.
**Escopo:** refatoração visual e estrutural de `frontend/src/pages/dashboard-super-admin/Users.tsx` e `frontend/src/components/dashboard-super-admin/UserForm.tsx` para o padrão `shadcn/ui` + Tailwind CSS + `react-hook-form` + `zod`, preservando o compartilhamento do componente entre a rota global de Superadmins (`/dashboard/super-admin/administrators`) e a rota de equipe por empresa (`/dashboard/super-admin/companies/:companyId/users`).

## Referências de código

- Página atual: `frontend/src/pages/dashboard-super-admin/Users.tsx`
- Formulário atual: `frontend/src/components/dashboard-super-admin/UserForm.tsx`
- Confirmação modal (já refatorada): `frontend/src/components/dashboard-super-admin/ActionConfirmation.tsx`
- Paginação (já refatorada): `frontend/src/components/dashboard-super-admin/CompanyPagination.tsx`
- Contratos HTTP e tipos: `frontend/src/lib/api.ts` (`getManagedUsers`, `inviteManagedUser`, `updateManagedUser`, `changeManagedUserState`, `getPlatformCompany`, `ManagedUser`, `ManagedUserInput`)
- Componentes base `shadcn/ui`:
  - `frontend/src/components/ui/card.tsx` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
  - `frontend/src/components/ui/table.tsx` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`)
  - `frontend/src/components/ui/badge.tsx` (`Badge`)
  - `frontend/src/components/ui/button.tsx` (`Button`)
  - `frontend/src/components/ui/field.tsx` (`Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `FieldSet`)
  - `frontend/src/components/ui/input.tsx` (`Input`)
  - `frontend/src/components/ui/select.tsx` (`Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`)
- Testes relacionados: `frontend/src/pages/dashboard-super-admin/Users.test.tsx`

## Padrão visual e estrutural

1. **Barra superior e contexto**:
   - No modo global (`companyId === null`), o título `"Superadmins"` já consta no `SuperAdminHeader.tsx`; a barra superior da página apresenta apenas o botão `"Convidar usuário"` (`Button` com ícone `Plus`).
   - No modo empresarial (`companyId !== null`), a barra superior exibe o botão `"Voltar à empresa"` (`Button variant="outline"` renderizando `<Link to={\`/dashboard/super-admin/companies/\${companyId}\`} role="link" />`), a identificação da empresa (`company.data?.nome || companyId`) e o botão `"Convidar usuário"` (desabilitado quando `archived` for `true`).
2. **Escopo de variáveis de tema (`theme`)**:
   - O container raiz em `Users.tsx` (`div.space-y-6`) injeta o mapeamento de variáveis CSS (`--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--input`, `--accent`, `--accent-foreground`) e mantém `portalRef` para os `SelectContent`.
3. **Filtro em `Card`**:
   - Formulário de filtro dentro de `Card` (`rounded-2xl py-5`) contendo:
     - `Field` + `Input` para `"Nome ou e-mail"` (`maxLength={200}`)
     - `Field` + `Select` para `"Estado do acesso"` (`Todos`, `Ativo` (`active`), `Convite pendente` (`pending`), `Desativado` (`blocked`)) com `SelectTrigger` de baixa opacidade (`bg-muted/40 hover:bg-muted/60 dark:bg-input/30 dark:hover:bg-input/50`)
     - Quando `companyId !== null`: `Field` + `Select` para `"Perfil"` (`Todos`, `Admin da empresa` (`admin_empresa`), `Atendente` (`atendente`))
     - `Button type="submit"` `"Filtrar"` com ícone `Search`.
4. **Formulário `UserForm` em `Card` com `react-hook-form` + `zod`**:
   - Envolvido por `Card` (`rounded-2xl`) mantendo `<form noValidate aria-label={initial ? 'Editar usuário' : 'Convidar usuário'}>`.
   - Campos `"Nome"` e `"E-mail"` com `Field`, `FieldLabel`, `Input` e `FieldError`.
   - Quando `!global` (`companyId !== null`), exibe `Field` + `Select` para `"Perfil"` (`Admin da empresa` / `Atendente`), nunca oferecendo a opção `"Superadmin"` nem renderizando campo de senha.
5. **Tabela de usuários em `Card` + `Table` + `CompanyPagination`**:
   - Colunas: `Nome`, `E-mail`, `Perfil`, `Estado`, `Convite` e `Ações`.
   - `Estado` e `Convite` exibidos com `Badge` semânticas (`Ativo` em esmeralda, `Convite pendente`/`Convite enviado` em azul/âmbar, `Desativado` em âmbar/neutro).
   - Ações com `Button variant="outline" size="sm"` (e `variant="destructive"` para `"Excluir atendente"`), preservando `aria-label={`Editar ${user.name}`}`, `"Reenviar convite"`, `"Reativar"` / `"Desativar"` (com `title` explicativo quando bloqueado por proteção da própria conta ou do último superadmin ativo) e `"Excluir atendente"`.
   - Rodapé paginado utilizando `CompanyPagination` (`nav[aria-label="Paginação"]`).

## Fluxos detalhados

### 1. Listagem, filtro e paginação de usuários (`Users.tsx`)
- **Entrada**: rota `/dashboard/super-admin/administrators` (`companyId = null`) ou `/dashboard/super-admin/companies/:companyId/users`, filtros (`q`, `status`, `role`) e página (`page`).
- **Validação**: limpeza de estado transitório (`mode`, `editing`, `pending`, `feedback`, `actionError`, `filters`) ao trocar `companyId`.
- **Caso de uso**: consultar superadmins da plataforma ou membros da equipe de uma empresa com isolamento de contexto.
- **Módulos**: `Users.tsx` → `getManagedUsers` e `getPlatformCompany` (`frontend/src/lib/api.ts`).
- **Persistência**: `GET /api/v1/platform/administrators` ou `GET /api/v1/platform/companies/:companyId/users`.
- **Resposta**: renderiza `Table` + `CompanyPagination`, ou estados de carregamento (`"Carregando usuários…"`), vazio (`"Nenhum usuário encontrado."`) e erro (`role="alert"` + `"Tentar novamente"`).

### 2. Convite e edição de usuário (`UserForm.tsx`)
- **Entrada**: `name` (obrigatório, `trim`), `email` (obrigatório, `trim`, formato de e-mail) e `role` (`'admin_empresa' | 'atendente'`, somente quando `!global`).
- **Validação**: schema Zod (`userFormSchema`) no `UserForm.tsx`; nunca inclui `role`, `companyId` ou `password` no payload global (`global === true`).
- **Caso de uso**: convidar novo superadmin/membro da empresa (enviando link de definição de senha) ou atualizar cadastro existente; se o próprio superadmin editar seu nome ou e-mail, sincroniza o header ou encerra a sessão se o e-mail mudar.
- **Módulos**: `UserForm.tsx` → `Users.tsx` → `inviteManagedUser` / `updateManagedUser` (`frontend/src/lib/api.ts`).
- **Persistência**: `POST` ou `PATCH` nas rotas de usuários administrados.
- **Resposta**: exibe `role="status"` (`"Convite enviado..."` ou `"Usuário atualizado."`) e recarrega a lista.

### 3. Mudança de estado: desativar, reativar e excluir atendente (`Users.tsx` + `ActionConfirmation.tsx`)
- **Entrada**: clique em `"Desativar"`, `"Reativar"` ou `"Excluir atendente"` e preenchimento do `"Motivo"` no modal `ActionConfirmation` (obrigatório para `suspension` e `delete`, dispensado para `reactivation`).
- **Validação**: bloqueia na UI a desativação da própria conta (`self`) e do último superadmin ativo (`lastActiveSuperAdmin`); exige motivo não vazio para suspensão e exclusão.
- **Caso de uso**: alterar estado de acesso com auditoria de motivo e proteção contra lockout de superadmins.
- **Módulos**: `Users.tsx` → `ActionConfirmation.tsx` → `changeManagedUserState` (`frontend/src/lib/api.ts`).
- **Persistência**: `POST`/`PATCH` de estado do usuário no backend.
- **Resposta**: exibe `"Acesso atualizado."` ou `"Usuário reativado. Envie um novo convite para definir a senha."` (`role="status"`) e atualiza a listagem.

## Decisões pendentes

Nenhuma decisão técnica ou de contrato pendente.

