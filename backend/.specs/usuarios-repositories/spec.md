# Usuários e contratos de persistência

Estado: refatoração solicitada. Implementação das decisões abaixo
**Aguardando resposta**. Documentação anterior ao código.

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

## Decisões pendentes

1. **Aguardando resposta:** repositories contém interface + implementação
   SQL (user.repository.ts e user.postgres.repository.ts), retirando SQL dos
   services, ou apenas interfaces com SQL mantido nos services?
2. **Aguardando resposta:** usuários inclui auth.controller/admin.controller
   (primeiro acesso e convites), ou apenas userController/userRoute agora?

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