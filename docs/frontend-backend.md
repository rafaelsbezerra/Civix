# Integração do frontend com o backend

Contratos e configuração dos consumidores existentes. O frontend acessa
HTTP; a seleção de JSON/PostgreSQL pertence ao backend.

## Consumidores adaptados

Os consumidores existentes leem data no sucesso e message nos
erros. O backend determina se os registros vêm do JSON ou PostgreSQL; o
frontend continua consumindo HTTP e não acessa arquivos locais diretamente.

| Consumidor existente | Endpoint do backend |
| --- | --- |
| Login | POST /api/v1/users/login |
| Catálogo e Home | GET /api/v1/empresas |
| Busca | GET /api/v1/empresas/buscar?q=termo |
| Categoria/estado/tamanho/verificadas | GETs existentes em /api/v1/empresas |
| Perfil público | GET /api/v1/empresas/:id |
| Planos exibidos | GET /api/v1/plans |
| Helper de seleção já existente | POST /api/v1/plans/selection, Bearer JWT |
| Recuperação | POST /api/v1/users/esqueci-senha |
| Redefinição | POST /api/v1/users/redefinir-senha |
| Pré-validação de convite | GET /api/auth/validate-token?token=convite |
| Primeiro acesso | POST /api/auth/first-access |

A pré-validação passa a conferir o JWT de convite e users.invite_token,
conforme a mesma identidade/perfil e status utilizados na ativação. O reenvio renova o convite com propósito e vínculo explícitos.

## Configuração

No ambiente do frontend:

```env
VITE_API_URL=http://localhost:3000
```

A configuração comum também aceita a forma anterior com /api/v1 ao final.
Os consumidores incluídos na adaptação evitam duplicar esse prefixo; o auth
legado continua no prefixo real /api/auth. A aplicação deve ser reiniciada
quando a configuração mudar.

## Fluxos disponíveis e limites

Login consome o envelope atual pelo service `login`, com erros públicos em
`message` e gravação do token após validação da resposta. Não há dashboard nem formulário de cadastro de empresas no frontend.
Plans.tsx não possui rota; PlanCard conserva seu link existente. Campos de
empresa seguem snake_case, incluindo descricao_detalhada.

A [spec de integração](../frontend/.specs/features/backend-integration/spec.md)
registra escopo/tarefas e a [validação](../frontend/.specs/features/backend-integration/validation.md)
preserva as evidências e limites das verificações.

## Adoção HTTP no frontend — 2026-10-19

Autorizado incluir o login na integração, superando sua exclusão histórica.
Cada service de API extrai `data` do envelope `{ data, meta? }`; o transporte
comum valida o envelope e trata erros públicos por `message` e status HTTP.
Não haverá interceptor que remova o envelope. Telas recebem dados de domínio,
sem depender de `code`, `details` ou `stack`, ausentes em produção.

Login envia e-mail e senha; o backend determina admin_empresa, super_admin ou atendente e retorna user com companyId. Cliente não autentica. A tela valida a resposta, armazena o token e retorna à Home. ProtectedRoute consulta profile e verifica permissões; será ligado às futuras rotas de dashboard. Tokens antigos exigem novo login.

Consultas públicas de empresa incluem cover_image_url e cover_image_url_expires_in. O formulário de upload não faz parte desta entrega. Ver [guia de storage e usuários](storage.md).

## Escolha de acesso — 2026-11-02

Os links de login do site continuam apontando para /login, que agora mostra
somente as opções Empresa e Cliente. Empresa abre /login/empresa, com e-mail
e senha; Cliente abre /login/cliente, somente com a mensagem de área em
construção, sem campos ou botão de login. O popup da Home já
abre a rota específica escolhida, sem repetir a seleção. As três telas
reutilizam o visual de login existente.

Login empresarial envia e-mail/senha, sem papel imposto pelo frontend, e
continua retornando à Home enquanto os dashboards não existem. No acesso de
cliente, a tela apresenta diretamente “A área logada do cliente está sendo
construída.” Não solicita e-mail, não chama a API e não cria sessão.

Simplificação verificada com 22 testes direcionados, TypeScript, lint e
git diff --check aprovados. Revisão independente por final_review sem
bloqueadores; suíte completa e inspeção visual não repetidas nesta mudança.

Arquivos: pages/AccessChoice.tsx, pages/ClientAccess.tsx e pages/login.tsx,
rotas em routes/AppRoute.tsx, helpers em lib/api.ts e navegação direta em
components/pop-up/SignSelect.tsx, todos sob frontend/src.

Evidência anterior à simplificação da tela cliente: 25 testes direcionados aprovados em AccessChoice,
SignSelect e BackendConsumers; TypeScript, lint e git diff --check aprovados.
Suíte completa: 141 testes passaram e 11 falharam, em Home, Sobre, Planos,
ActionButton e identidade de assets. Essas falhas não foram corrigidas nesta
entrega; não considerar a suíte completa aprovada. Não houve verificação
visual no navegador nem execução do build completo nesta rodada.
Revisão independente por final_review, em 2026-11-02, sem bloqueadores para
o fluxo e seus testes; commit limitado liberado com essas ressalvas.

Evidência histórica da integração anterior: 35 testes direcionados, TypeScript
e lint aprovados. Naquela rodada o bundle Vite passou e o gate final do build
acusou dashboard.png ausente. Não é evidência da alteração de rotas de acesso.
