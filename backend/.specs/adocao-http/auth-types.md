# Extração de tipos de auth

Estado: implementado, com tipagem verificada e integrado em staging via PR #12; presente na referência bedb73a.

## Escopo

- Extrair `JwtInvitePayload` para `dtos/auth.invite.dto.ts`.
- Extrair `UserRow` e o resultado `ResetTokenRow` para
  `interfaces/auth.user.row.ts`.
- Importar os contratos no controller sem mudar regras, SQL ou respostas.
- Reutilizar `UserRole` no payload, preservando os papéis empresa/cliente.

## Verificação e limites

`tsc -p tsconfig.foundation.json` passou com as dependências já instaladas.
Não houve instalação, mudança de schema ou execução de consultas SQL.
A adoção dos contratos HTTP também foi integrada via PRs #13/#14; frontend consumidor permanece pendente.

Documentação principal: [tipos de auth](../../../docs/auth-types.md).
