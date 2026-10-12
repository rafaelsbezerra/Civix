# Autenticação, sessão e primeiro acesso

**Estado:** planejada, não implementada. Autorização somente para documentar.
**Ordem:** 03. Tarefas novas permanecem abertas.

## Baseline observada

Login usa Axios/envelope antigo; helpers de primeiro acesso e reset já
usam data/message. Há Bearer/localStorage, sem refresh/logout implementados.
GET profile não fornece bootstrap completo. A exclusão de login nas tarefas
anteriores é histórica; esta fase planeja sua evolução, sem alterar código.

## Dependências e referências

Depende de [identidade](../identity-access-model/spec.md) e etapa 02 backend.
Referência CT-03-SESSION; [autorização](../tenant-authorization/spec.md)
depende desse fluxo. Fontes: FirstAccess/ForgotPassword/ResetPassword e api.ts.
[Spec backend pareada](../../../../backend/.specs/features/authentication-session/spec.md).
[Contrato canônico](../../../../backend/.specs/roadmaps/dashboards/contracts.md).
Fontes: [rotas](../../../src/routes/AppRoute.tsx), [API](../../../src/lib/api.ts) e [login](../../../src/pages/login.tsx).

## Escopo confirmado

- Planejar consumo de login, bootstrap, expiração e saída da sessão.
- Empresa/dono nasce por criação e convite da Civix; não abrir autocadastro.
- Convite/reset dependem da validação backend; preservar anti-enumeração.
- Não escolher storage/renovação antes da política de sessão aprovada.
- Não modificar login, formulários ou biblioteca nesta etapa documental.

## Contrato frontend/backend

Existentes: POST /api/v1/users/login, GET /api/v1/users/profile,
GET /api/auth/validate-token e POST /api/auth/first-access.
POST /api/v1/users/logout é proposta. /api/auth/resend-invite-email existe,
mas protocolo de reenvio precisa alinhamento com convite/reset.
CT-03-SESSION define payloads de sessão/bootstrap/reenvio antes da implementação.
Sucesso usa { data, meta? }; erro público em produção usa status/message.
Não depender de code/stack/details em produção nem exibi-los ao usuário.
Paginação só quando necessária; caminhos/identificadores/DTOs novos
são propostas, **Aguardando resposta**, até sua aprovação canônica.

## Fluxo e provas E2E

1. Usar bootstrap/fixture backend isolada com empresa/dono/convite válidos;
   essa preparação antecede a UI de criação/gestão da etapa 05.
2. UI pré-valida e ativa pelo backend; login lê data e obtém bootstrap real.
3. Recarregar/navegar conforme a política aprovada; testar expiração.
4. Logout/invalidade encerra acesso privado; reset/convite consumido é negado.
Este E2E valida sessão/identidade antes de existir UI de empresa da etapa 05
ou dashboard completo da 06; não depende dessas telas para concluir a 03.
Planejar navegador → frontend → backend real → armazenamento isolado →
resposta/UI. Mock do frontend sozinho não comprova essa comunicação.
Não acessar produção; dados/e-mails de teste são isolados.

## Tarefas planejadas

- [ ] FE-03-01: Adaptar login ao envelope e à política de sessão aprovada.
- [ ] FE-03-02: Implementar bootstrap, saída, expiração e limpeza de estado.
- [ ] FE-03-03: Adaptar pré-validação/primeiro acesso/reenvio ao contrato backend aprovado.
- [ ] FE-03-04: Testar E2E com fixture backend: convite → ativação → login → saída/expiração.

## Aceite

- Token/sucesso/erro usam o contrato canônico e mensagens públicas.
- Expiração não conserva tela/dados privados como sessão ativa.
- Redirecionamento usa destinos existentes; o E2E da 03 não exige UI da 05/06.
- Renovação automática não é presumida por existir um token.

## Definições pendentes

**Aguardando resposta:** Bearer com refresh em cookie HttpOnly ou Bearer
sem refresh; comportamento de renovação/encerramento depende dessa escolha.
Método/URL de logout, DTOs e protocolo de reenvio continuam propostas.

Não houve implementação ou execução de teste ao criar esta spec.
