# Extração de tipos de auth

Estado: implementado, com tipagem verificada e integrado em staging via PR #12; presente na referência bedb73a.

## Escopo

- Extrair `JwtInvitePayload` para `dtos/auth.invite.dto.ts`.
- Extração inicial levou UserRow e ResetTokenRow para interfaces/auth.user.row.ts.
  Na integração posterior, UserRow serve à pré-validação/ativação de convite;
  ResetTokenRow foi removido junto da antiga consulta de reset.
- A extração inicial importou contratos no controller; agora service e adapters usam os tipos próprios, sem mudar regras ou schema.
- Reutilizar `UserRole` no payload, preservando os papéis empresa/cliente.

## Verificação e limites

`tsc -p tsconfig.foundation.json` passou com as dependências já instaladas.
Não houve instalação, mudança de schema ou execução de consultas SQL.
A adoção HTTP foi integrada via PRs #13/#14. Na branch de integração atual,
consumidores existentes foram adaptados, exceto login explicitamente excluído.

Documentação principal: [tipos de auth](../../../docs/auth-types.md).

## Pré-validação do convite — 2026-10-12

validateToken e firstAccess compartilham getInviteUser com JWT_INVITE_SECRET,
e-mail/perfil, status e invite_token. O protocolo de reenvio/reset permanece
fora deste ajuste. Sem novo schema, tabela ou dependência.
Entrega na branch codex/frontend-backend-integration, dependente do PR #16.
