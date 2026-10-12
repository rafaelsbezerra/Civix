# Tipos do controller de autenticação

Os tipos do fluxo auth ficam em arquivos próprios. Em 2026-10-12, controllers
foram reduzidos ao HTTP; auth.service.ts usa o payload de convite e adapters
usam as linhas de persistência:

- `backend/src/dtos/auth.invite.dto.ts`: `JwtInvitePayload`, com o e-mail e o
  papel do convite (`UserRole`, definido na entidade de usuário).
- `backend/src/interfaces/auth.user.row.ts`: `UserRow`, utilizado na consulta
  de primeiro acesso e na pré-validação do convite.

Esses contratos descrevem os campos já utilizados nas consultas SQL. Não
criam tabelas, não definem um novo schema e não validam valores em execução.
A unificação de 2026-10-12 na branch codex/json-postgres-repositories usa
`users` na validação, no convite e no primeiro acesso. Os campos existentes
`status` e `invite_token` também pertencem à identidade de usuário.
Essa mudança de consultas não cria colunas nem comprova schema no PostgreSQL.
Pré-validação e ativação agora usam o mesmo helper getInviteUser, com JWT
de convite, e-mail/perfil, status e invite_token. ResetTokenRow e a consulta
de reset usada na antiga pré-validação foram removidos. Reenvio continua
pendente: grava JWT de reset cru, enquanto o reset principal espera hash.

A extração inicial preservou rotas, consultas, regras e respostas. A adoção
posterior de envelopes HTTP e AppError já está integrada em staging bedb73a,
[documentada na spec de adoção](../backend/.specs/adocao-http/spec.md).
Regras estão em auth.service.ts/admin.service.ts; SQL fica nos adapters PostgreSQL e o modo local usa JSON. Admin permanece sem montagem.

Verificação: `tsc -p tsconfig.foundation.json` executado no backend sem erros,
utilizando as dependências locais existentes. Nenhuma dependência foi
instalada e nenhuma consulta foi executada contra banco de dados.

## Evolução do convite — 2026-10-12

Na branch codex/frontend-backend-integration, dependente do PR #16,
validateToken retorna email após verificar o mesmo convite aceito por
firstAccess. Nenhuma entidade/tabela nova ou alteração de schema.
A entrega registrou 60 testes direcionados backend e typechecks
foundation/contratos aprovados; não houve banco real ou envio externo.
