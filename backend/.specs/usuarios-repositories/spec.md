# Usuários e contratos de persistência

Estado: escopo confirmado em 2026-10-10. Documentação anterior ao código.

## Escopo confirmado

- Usuários: nomes user.routes.ts/user.controller.ts/user.service.ts;
  entidades/DTOs separados dos controllers, seguindo pastas por função.
- Controllers com handlers independentes e imports diretos do service.
- Interfaces de persistência dos módulos em backend/src/repositories,
  com métodos de domínio, como UserRepository.getById.
- Services existentes com acesso ao banco: empresas e planos; envio de
  e-mail não constitui repositório de persistência.
- Preservar contratos HTTP e regras existentes. Não corrigir schema,
  tabelas users/user ou regras de autenticação incidentalmente.
- Sempre perguntar caso exista dúvida e registrar decisão pendente.

## Decisões confirmadas

1. Somente interfaces em repositories; implementações futuras. SQL atual
   permanece nos services, sem runner, adapter ou factories novos.
2. Refatorar somente userController/userRoute; auth/admin e convite/primeiro
   acesso permanecem intactos.
3. Interfaces para usuários, empresas e planos. Não criar contrato de
   persistência para envio de e-mail ou para módulos comerciais ausentes.

## Critérios de aceite

- Controller sem SQL ou regras de autenticação; service sem Express.
- Interfaces tipadas sem senha/hash/token nas respostas públicas.
- Routes preservam URLs, aliases, middleware e status existentes.
- Login empresa com bcrypt, login cliente atual, JWT 1h e payload preservados.
- Recuperação sem enumeração, token aleatório/hash/expiração e reset bcrypt10
  mantidos; testes isolam banco e e-mail, sem chamadas externas.
- Empresas/planos preservam consultas parametrizadas e respostas atuais.
- Specs e documentação principal atualizadas; verificações reportam o
  bloqueio preexistente Prisma CLI6/configuração7 separadamente.
- Tarefas separadas em branches/worktrees e reunidas na integração.

Nenhuma nova dependência, tabela ou migration está autorizada por esta tarefa.

## Implementação por tarefa

- Interfaces UserRepository/CompanyRepository/PlanRepository preparadas, sem
  implementação ou uso nos services. Busca ausente usa undefined, conforme
  rows[0]; atribuição de plano usa boolean, conforme rowCount === 1.
- User e tipos de Plan extraídos; PublicUser/entradas/resultados de login
  definidos em user.auth.dto.ts, sem colocar Express nos services.
- user.routes.ts registra handlers de user.controller.ts; user.service.ts
  concentra SQL, bcrypt, JWT, geração/hash/expiração de token e envio de e-mail.
- Controller valida entrada e traduz resultados para as respostas legadas;
  profile/home saíram das rotas e continuam protegidos pelo mesmo middleware.
- Auth/admin, frontend, schema, SQL de empresas e queries de planos intactos.

A estrutura não é CRUD novo nem adoção dos envelopes HTTP da base. As
interfaces não substituem o acesso SQL antes da implementação posterior.

## Verificação

27 testes passaram (14 contratos, 4 empresas, 9 usuários), com banco e e-mail
simulados. Tipagem isolada de src/servidor/interfaces/testes passou. Comandos
reproduzíveis em backend: test:users, test:foundation, typecheck:foundation.
Typecheck completo ainda falha em prisma.config.ts por CLI6/configuração7.
Nenhum teste em banco remoto, envio real, migration ou verificação frontend.

## Integração

Tarefas em codex/repository-contracts e codex/user-layers, reunidas em
codex/users-persistence-integration. Os PRs têm staging como destino e
compartilham a baseline documental e as correções anteriores. A integração
é a entrega conjunta; não requer merge individual duplicado dos mesmos commits.

## Entrega dos contratos de persistência

Interfaces UserRepository/CompanyRepository/PlanRepository criadas e
verificadas com TypeScript isolado. Sem implementação ou uso pelos services.
Plan/PlanRow extraídos com reexports de compatibilidade. Queries preservadas.
