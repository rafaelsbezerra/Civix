# Extração de tipos de auth

Estado: implementado, com tipagem verificada; entregue no PR #12 e presente na baseline codex/http-adoption-integration. Merge em staging não presumido.

## Escopo

- Extrair `JwtInvitePayload` para `dtos/auth.invite.dto.ts`.
- Extrair `UserRow` e o resultado `ResetTokenRow` para
  `interfaces/auth.user.row.ts`.
- Importar os contratos no controller sem mudar regras, SQL ou respostas.
- Reutilizar `UserRole` no payload, preservando os papéis empresa/cliente.

## Verificação e limites

`tsc -p tsconfig.foundation.json` passou com as dependências já instaladas.
Não houve instalação, mudança de schema ou execução de consultas SQL.
A adoção dos contratos HTTP foi implementada separadamente no PR #14, presente nesta baseline; frontend posterior.

Documentação principal: [tipos de auth](../../../docs/auth-types.md).
