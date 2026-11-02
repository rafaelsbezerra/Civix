# Tipos do controller de autenticação

Os tipos do fluxo auth ficam em arquivos próprios. Controllers tratam HTTP;
auth.service.ts usa o payload de convite e adapters usam as linhas de
persistência:

- `backend/src/dtos/auth.invite.dto.ts`: `JwtInvitePayload`, com o e-mail e o
  papel operacional do convite, companyId e purpose: invite.
- `backend/src/interfaces/auth.user.row.ts`: `UserRow`, utilizado na consulta
  de primeiro acesso e na pré-validação do convite.

Esses contratos descrevem os campos já utilizados nas consultas SQL. Não
criam tabelas, não definem um novo schema e não validam valores em execução.
Validação, convite e primeiro acesso utilizam `users`. Os campos existentes
`status` e `invite_token` também pertencem à identidade de usuário.
Essa mudança de consultas não cria colunas nem comprova schema no PostgreSQL.
Pré-validação e ativação agora usam o mesmo helper getInviteUser, com JWT
de convite, e-mail/perfil, status e invite_token. ResetTokenRow e a consulta
de reset usada na antiga pré-validação foram removidos. Reenvio renova o JWT de convite com propósito explícito e vínculo.


Regras ficam em auth.service.ts/admin.service.ts; SQL nos repositories
PostgreSQL, com JSON como alternativa local. Admin permanece sem montagem.

A evolução dos quatro papéis, middleware com identidade vigente e operação de bootstrap estão no [guia de usuários e storage](storage.md).
