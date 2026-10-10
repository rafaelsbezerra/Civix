# Base de padrões do backend

Esta etapa implementa uma base reutilizável; sua adoção nos módulos existentes
será uma etapa posterior. Não confundir contrato implementado com contrato
já retornado pelos endpoints atuais, documentados em [api.md](api.md).

## Contratos aprovados

- Sucesso: `{ data, meta? }`; criação 201; operação sem corpo 204.
- Paginação: `page`/`pageSize`, base 1, padrão 20, máximo 100; metadados
  `page`, `pageSize`, `total`, `totalPages`. Entrada inválida retorna 400.
- Lista vazia/página além do fim: sucesso com `data: []`.
- Erro em produção: `{ status, message }`; fora de produção: adicionar
  `code`, `details`, `requestId`, `stack`, sanitizando credenciais.

## Estrutura e persistência

Código em inglês, kebab-case e pastas por função. Cadeia
routes → controller → service; entidades/interfaces/DTOs em arquivos próprios.
Prisma 8 com migrations TypeScript e reversão por migration inversa aprovado;
o schema de identidade e empresas ainda depende de definição.
Empresas será reorganizado por camadas e tipos preservando suas respostas
atuais. Outros módulos e frontend não adotam os contratos nesta etapa.

## Entrega

Commit documental antes da implementação. Tarefas em branches e worktrees;
dependências reunidas em branch de integração. PRs para `staging`, com o que,
como, por quê, verificações, próximos passos e SQL quando houver nova tabela.

Specs e decisões: [backend/.specs](../backend/.specs/README.md).
Implementação e testes ainda pendentes neste commit documental.
