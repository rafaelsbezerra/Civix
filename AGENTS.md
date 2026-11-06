## Project overview

## Your role
- Read Markdown and TypeScript to understand the system's actual behavior.
- Produce and update documentation in `docs/` and specs in `backend/.specs/` and `frontend/.specs/`, ensuring clarity and including practical examples.
- Write for developers, explaining concepts without assuming prior expertise.
- During documentation/spec tasks, use source code and configurations as references. Implement changes only when the user authorizes implementation.
- Communicate in Brazilian Portuguese; keep code and identifiers in English.
- Maintain the language of existing documents unless instructed otherwise by the user.

## Project knowledge
*   **Back:** Node, Express, TypeScript
*   **Front:** React + Vite + TypeScript + React Router + shadcn/ui + Tailwind CSS
*   **Banco de dados:** PostgreSQL
*   **Persistence:** Existing code uses SQL through Neon/PostgreSQL. Prisma dependencies are present, but its schema has no models and the application does not use PrismaClient. The current approved target is Prisma 7 with native SQL migrations and reversal through a new inverse migration. CLI, client and PostgreSQL adapter are pinned to 7.10.0 in this tooling branch. Schema and database execution remain pending; do not run migrations automatically.
*   **Libs:** Zod in the backend; Axios, shadcn/ui and Lucide React in the frontend. Check each package manifest before assuming a library is installed.
*   **Hospedagem:** a definir depois do MVP
*   **Gerenciador de pacote:** npm, as reflected by the current package-lock.json files; no Yarn 4 configuration is present.
*   **Segurança:** Helmet, CORS, bcrypt and JWT are present. Do not describe HttpOnly cookie sessions as implemented; current authentication uses Bearer tokens.
- **File Structure:**
  - `backend/src` – Backend application source code
  - `docs/` – Project documentation
  - `backend/.specs/` – Lightweight backend specs, tasks and decisions
  - `frontend/.specs/` – Existing frontend specs
  - `frontend/src` – Frontend application source code

## Project Conventions:
- Functions and variables: camelCase, such as `getMonthlySummary`.
- Classes, interfaces, and types: PascalCase, such as `TransactionRepository`.
- Global constants: UPPER_SNAKE_CASE, such as `MAX_PAGE_SIZE`.
- Backend files: use lowercase domain/responsibility names separated by dots, such as `company.service.ts`, `company.controller.ts`, `company.routes.ts` and `company.entity.ts`. Never use camelCase/PascalCase filenames or join the domain and responsibility with a hyphen. Preserve existing folders by function; controllers use the existing `src/controller/` directory.
- Keep backend folders organized by function (routes, controllers, services, entities, interfaces and DTOs), with routes → controller → service. Keep HTTP handling in controllers and business rules in services. Existing modules still require gradual alignment.
- Persistence interfaces for each implemented module belong in `backend/src/repositories`, with domain methods such as `UserRepository.getById`; do not replace these contracts with a generic SQL query interface. Current decision: this folder contains interfaces only; implementations will be created later. Existing services keep their SQL until that separate implementation phase.
- Export controller handlers as independent functions. Import the service directly (for example, `import * as companyService`) and call `companyService.method()`. Do not introduce controller/router/service factories as the default pattern.
- Write error messages, diagnostic placeholder text and code comments in Brazilian Portuguese. Keep identifiers and machine-readable error codes in English.
- On the frontend, adhere to existing conventions and framework-mandated naming.
- Use real project examples and explicitly detail relevant validations, return values, and errors.
- Do not present an example as functional without verifying the related contracts and code.
- Describe flows by name and step: input, validation, use case, modules, persistence, and response.
- Preserve content unrelated to the request and avoid duplicating rules across multiple documents.
- Follow the worktree and branch rules below; explicit user instructions about the current task take precedence.
- Commit messages follow the Conventional Commits specification and use english language.

## Code formatting and readability

- Write all new and modified code with consistent indentation and readable
  line breaks. Follow the indentation already used by the file.
- Do not introduce compressed or "truncated" code that places several
  statements, JSX elements, conditions, or callbacks on the same line.
- Expand complex JSX props, nested ternaries, object literals, chained calls,
  and function arguments across multiple lines.
- Use braces and line breaks when a condition performs an action. Do not
  sacrifice readability to reduce the number of lines.
- When modifying an existing compressed section, format the lines directly
  affected by the change when this can be done without creating unrelated
  behavior changes. A broader cleanup remains a separate task.
- Run the formatter configured by the affected package before delivery. Run
  lint separately when the package provides a lint command; lint does not
  replace automated formatting.
- If the package has no formatter, preserve the local style and report that
  automated formatting was not available.
- Treat the examples below as structure and indentation guidance. Preserve
  local punctuation conventions, including the existing use or omission of
  semicolons.

**Preferred TypeScript formatting:**

```typescript
async function fetchUserById(id: string): Promise<User> {
  if (!id) {
    throw new Error('O ID do usuário é obrigatório');
  }

  const response = await api.get(`/users/${id}`);

  return response.data;
}
```

**Preferred TSX formatting:**

```tsx
export function UserCard({ user }: UserCardProps) {
  return (
    <article className="user-card">
      <header>
        <h2>{user.name}</h2>
        <span>{user.role}</span>
      </header>

      <Button
        type="button"
        variant="outline"
        onClick={() => openUserDetails(user.id)}
      >
        Ver detalhes
      </Button>
    </article>
  );
}
```

Avoid compressed formatting such as:

```tsx
export function UserCard({ user }: UserCardProps) { return <article><h2>{user.name}</h2><Button onClick={() => openUserDetails(user.id)}>Ver detalhes</Button></article>; }
```

## Always do

- Before any task, read the applicable `AGENTS.md` and the active task spec, when one exists.
- Confirm substantial changes to existing documents in advance.
- Specify which documents were modified, why, and how they were verified.
- Highlight remaining questions, pending decisions, and unperformed checks.

## Subagents

- Use sub-agents for secondary actions: reviews, tests, verifications, and validations.
- Before each delegation, specify the sub-agent's model and function in the main conversation.
- Enable communication between sub-agents to share context and results.
- If sub-agents are unavailable, transparently communicate the limitation.

## Never do

- Do not make technical decisions on your own; present options and request confirmation.
- Record unresolved decisions in the relevant spec as **Aguardando resposta**.
- Never include secrets, credentials, or private data in commits or documentation.
- During documentation/spec-only tasks, do not modify source code, executable tests, or configuration files.
- Never push directly to `main`.
- Never run migrations in production.
- Do not expand the MVP scope or treat proposals as approved decisions.
- Prior confirmation already granted for the requested action does not need to be requested again.

## Ask First

- Caso exista qualquer dúvida sobre a tarefa, sempre faça perguntas antes de implementar a parte afetada. Registre decisões pendentes na spec como **Aguardando resposta**; não presuma aprovação.
- Ask before installing dependencies, changing the schema, or making any other critical change.

## Commands and Verification

- Use the package manager reflected in the repository (currently npm) and run commands within the corresponding package directory.
- Check the existing scripts in `package.json` before running them.
- Do not assume the existence of `docs:build`, `lint`, `test`, or any other specific script.
- Review examples, references, file names, and alignment with the MVP scope.
- Perform only relevant checks that do not have destructive effects.
- Do not use npm, npx, or temporary downloads to bypass dependency approval.
- If a validation cannot be performed, state the reason; do not claim success without evidence.

**Illustrative code style example (not a verified project API contract):**
```typescript
// ✅ Bom: nomes descritivos e tratamento de erros
async function fetchUserById(id: string): Promise<User> {
  if (!id) throw new Error('O ID do usuário é obrigatório');
  
  const response = await api.get(`/users/${id}`);
  return response.data;
}

// ❌ Ruim: nomes vagos e ausência de tratamento de erros
async function get(x) {
  return await api.get('/users/' + x).data;
}
```

## Pull request rules

- Write PR titles, descriptions and messages in Brazilian Portuguese.
- In every PR, explain what was changed, how it was implemented, and why.
- After that explanation, indicate the next steps; state when none are needed.
- When a change needs a new table, create a versioned migration and include
  the resulting SQL in the PR description. When a migration is authored in TypeScript,
  include the SQL preview produced by the migration tooling and link the
  migration source. Do not replace the migration with SQL pasted only in a PR.
- Report relevant verification and any checks that were not performed.

## Worktrees, branches and delivery

- Use a separate Git worktree and branch for each distinct task. Git worktrees
  are local checkouts; publish their branches to the GitHub remote.
- On completion, commit the task changes and push the task branch to the
  remote, unless the user explicitly requests no commit or no push.
- For distinct tasks that depend on one another, keep their separate worktrees
  and branches, and create a third integration branch to combine their changes.
- Do not merge or push unrelated changes with a task. Preserve other worktrees
  and pending changes.
- Current phase: commit documentation before implementation, update main docs,
  use task worktrees/branches and integration branches, and target staging PRs.
  Error/success contracts are now adopted across the current backend endpoints.
  Frontend adoption, paginated queries, schemas and repository implementations
  are deferred. Admin remains unmounted; do not expose new endpoints.
