# Tipos do controller de autenticação

Os tipos do fluxo auth ficam em arquivos próprios. Em 2026-10-12, controllers
foram reduzidos ao HTTP; auth.service.ts usa o payload de convite e adapters
usam as linhas de persistência:

- `backend/src/dtos/auth.invite.dto.ts`: `JwtInvitePayload`, com o e-mail e o
  papel do convite (`UserRole`, definido na entidade de usuário).
- `backend/src/interfaces/auth.user.row.ts`: `UserRow`, utilizado na consulta
  de primeiro acesso, e `ResetTokenRow`, utilizado na validação do token.

Esses contratos descrevem os campos já utilizados nas consultas SQL. Não
criam tabelas, não definem um novo schema e não validam valores em execução.
A validação do token continua consultando `users`; primeiro acesso continua
consultando `"user"`. Essa divergência permanece para a etapa de schema.

A extração inicial preservou rotas, consultas, regras e respostas. A adoção
posterior de envelopes HTTP e AppError já está integrada em staging bedb73a,
[documentada na spec de adoção](../backend/.specs/adocao-http/spec.md).
Regras estão em auth.service.ts/admin.service.ts; SQL fica nos adapters PostgreSQL e o modo local usa JSON. Admin permanece sem montagem.

Verificação: `tsc -p tsconfig.foundation.json` executado no backend sem erros,
utilizando as dependências locais existentes. Nenhuma dependência foi
instalada e nenhuma consulta foi executada contra banco de dados.
