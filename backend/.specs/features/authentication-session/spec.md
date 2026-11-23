# 03 — Autenticação e sessão

Estado: planejada, sem implementação. Data: 2026-10-12.
Dependências: 01/02 e P02/P04.
[Plano](../../roadmaps/dashboards/README.md),
[decisões](../../roadmaps/dashboards/decisions.md) e
[contratos](../../roadmaps/dashboards/contracts.md).
Par E2E: [frontend](../../../../frontend/.specs/features/authentication-session/spec.md).

Contrato: CT-03-SESSION. Autorização completa de recursos pertence à 04.

## Baseline

[Login](../../../src/services/user.service.ts) compara senha apenas para empresa,
bloqueia pending e emite JWT de 1h. [Middleware](../../../src/middlewares/auth.ts)
verifica token sem consultar conta/vínculo atual. Profile confirma token;
convite/reset/reenvio existem, com protocolo legado a alinhar.

## Fluxo e regras

Convite → pré-validar → criar credencial aprovada → ativar vínculo → login →
consultar perfil/contexto → autorizar ações pela 04. Três perfis exigem prova
de identidade; inscrição promocional nunca gera JWT. Papel vem do servidor.
Validar claims e estado da conta/vínculo; decidir invalidação ao bloquear,
remover, trocar senha/papel. JWT válido sozinho não prova permissão vigente.

Separar acesso/convite/recuperação por finalidade, uso e validação. Reenvio,
expiração/reuso não podem trocar empresa ou reativar vínculo revogado. Falta
de segredo válido falha na configuração, sem fallback fixo.

P02 decide Bearer+refresh HttpOnly ou Bearer sem refresh. Se cookie aprovado,
definir SameSite/Secure por ambiente, origem/CORS e proteção CSRF pertinente.
Sem refresh, documentar novo login ao expirar. Logout/revogação não equivalem
apenas a remover token do navegador. Tempos e estratégia persistida precisam aprovação.

## Tarefas

- [ ] BE-03-01: Aprovar P02/P04 e contratos login/profile/logout/renovação.
- [ ] BE-03-02: Provisionar primeiro superadministrador por procedimento restrito,
  sem credencial hardcoded ou endpoint público de autoelevação.
- [ ] BE-03-03: Adaptar login aos perfis aprovados e retirar autenticação cliente.
- [ ] BE-03-04: Retornar identidade/contexto mínimo sem hash/convite/refresh no perfil.
- [ ] BE-03-05: Implementar estado/revogação de sessão e contexto vigente.
- [ ] BE-03-06: Alinhar pré-validação/ativação/reenvio/reset e convites legados.
- [ ] BE-03-07: Testar expiração/bloqueio/logout/reuso/finalidade errada e elevação de papel.
- [ ] BE-03-08: Integrar CT-03 ao frontend, atualizar logs tipados e docs.

## Aceite E2E

Os três perfis entram e recebem contexto correto. Pending/bloqueado/removido
ou token inválido não abre dashboard. Frontend limpa sessão sem loop e lê o
envelope vigente. Bootstrap restrito permite testar conta Civix antes da UI
05, sem autorizar operação empresarial sem vínculo. JSON e PostgreSQL seguem
as mesmas regras. Tokens antigos não mantêm poder após migração aprovada.

## Aguardando resposta

P02/P03/P04/P05/P07, tempos, limitação de tentativas e MFA do superadministrador.
Não escolher provedor/lib nem apresentar refresh/MFA como implementados.
