# Extração de tipos de auth

Estado: implementado, com tipagem verificada.

## Escopo

- Extrair `JwtInvitePayload` para `dtos/auth.invite.dto.ts`.
- Extrair `UserRow` e o resultado `ResetTokenRow` para
  `interfaces/auth.user.row.ts`.
- Importar os contratos no controller sem mudar regras, SQL ou respostas.
- Reutilizar `UserRole` no payload, preservando os papéis empresa/cliente.

## Verificação e limites

`tsc -p tsconfig.foundation.json` passou com as dependências já instaladas.
Não houve instalação, mudança de schema ou execução de consultas SQL.
A adoção dos contratos HTTP será realizada separadamente na integração.

Documentação principal: [tipos de auth](../../../docs/auth-types.md).
