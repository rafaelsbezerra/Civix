# Contratos E2E dos dashboards

Data: 2026-10-12. **Rascunho — Aguardando resposta (DASH-P07).**
As rotas/payloads novos abaixo são propostas, não APIs existentes/aprovadas.
Aprovar o contrato e atualizar os dois lados antes de implementá-lo.
[Decisões comuns](decisions.md) e [ordem/dependências](README.md).

## Contratos existentes a preservar

Sucesso: data e meta opcional; criação 201 e 204 sem corpo quando aplicável.
Erro de produção: status/message. Fora de produção há diagnóstico sanitizado.
Frontend não depende de code/stack/requestId que não existem em produção.
401: identidade/sessão ausente ou inválida; 403: ação proibida; 400: validação;
404: recurso ausente ou ocultação de existência, se aprovada; 409: conflito.
Mensagens legíveis em português; identificadores em inglês.

Paginação somente quando uma listagem precisar. Nesse caso usar contrato
page/pageSize aprovado (início 1, padrão 20, máximo 100), total e ordem estável.
Serialização de IDs/datas/moeda e campos finais depende de P03/P07/P09.

## Catálogo de integração

| ID | Proposta de operação/retorno | Spec responsável |
| --- | --- | --- |
| CT-03-SESSION | POST /api/v1/users/login existente; evoluir GET /api/v1/users/profile para identidade/vínculo/permissões; POST /api/v1/users/logout proposto; refresh depende de P02 | [03](../../features/authentication-session/spec.md) |
| CT-04-AUTHZ | Ação + empresa + recurso verificados no backend; frontend consome permissões do perfil e negativas, sem conceder vínculo por body | [04](../../features/tenant-authorization/spec.md) |
| CT-05-TEAM | POST /api/v1/platform/companies para Civix criar empresa/convidar dono; operações próprias em /api/v1/company/members; payload/métodos finais pendentes | [05](../../features/company-team-management/spec.md) |
| CT-06-DASHBOARD | Shell consome CT-03/05 e operações realmente existentes, sem criar contagens/financeiro fictícios | [06](../../features/dashboard-foundation/spec.md) |
| CT-07-ATTENDANCE | /api/v1/company/conversations, /:id, /:id/messages e /:id/assignment propostos; atribuição/ações/canais dependem de P01/P08 | [07](../../features/assigned-attendance/spec.md) |
| CT-08-PLATFORM | /api/v1/platform/overview, /companies, /sales e /ai-costs propostos; campos aprovados sem mensagens/prompts | [08](../../features/platform-management-metrics/spec.md) |
| CT-09-CONTACTS | POST /api/v1/promotional-contacts recebe apenas e-mail; POST /api/v1/promotional-contacts/unsubscribe proposto, com prova de autorização a definir | [09](../../features/promotional-contacts/spec.md) |

URLs abreviadas /:id e /companies nas linhas estendem o prefixo da própria
linha; não representam rotas globais. Não usar catálogo público como endpoint
administrativo nem aceitar companyId arbitrário como prova de pertencimento.

## Sessão: exemplo conceitual, não implementação

GET profile deixaria de confirmar token e informaria, dentro de data:

- user: identidade pública mínima, papel e estado aprovados.
- scope: plataforma ou empresa verificada; vínculo único de dono/atendente.
- permissions: ações calculadas no servidor.

Campos/enums exatos e vínculo técnico do superadministrador dependem de
P03/P04/P07. Login já retorna data.user/data.token; corrigir o consumidor
legado. Sua resposta futura depende da escolha P02. Nunca expor senha,
hashes, convites ou refresh tokens no perfil público.

## Convite e primeiro acesso

POST /api/auth/first-access, GET /api/auth/validate-token e POST
/api/auth/resend-invite-email existem. Evoluir os consumidores coordenadamente.
Pré-validação e ativação usam o mesmo convite/usuário/empresa; reenvio legado
precisa ser alinhado, sem confundir convite com recuperação. O servidor
atribui papel/vínculo; o formulário não escolhe esses poderes. Router admin
não está montado e não possui requireAdmin efetivo: não expô-lo antes da 04.

## Aceite compartilhado

1. Dono entra → frontend lê data → perfil confirma empresa → shell correto.
2. Sessão inválida/revogada → API nega → frontend limpa estado sem loop.
3. Atendente troca ID → servidor nega atendimento não atribuído ou de outra empresa.
4. Superadministrador solicita mensagens → API nega, inclusive buscas/exports.
5. Cadastro promocional → confirmação genérica aprovada, sem token de acesso.

Logs usam o contrato tipado, userId/companyId quando permitidos e diagnóstico
sanitizado. Evoluir enums de papéis/módulos e validadores ao introduzi-los.
Não gravar mensagens, e-mails, prompts, credenciais ou tokens; não usar Pino
como fonte canônica de faturamento/custo. JSON demonstrativo não prova banco real.

Referências: [autorização OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
e [autorização por objeto](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/).
