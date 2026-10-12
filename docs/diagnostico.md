# Diagnóstico da staging

Revisão estática do commit `5db3c5b`, em 2026-10-09.
INT-02 atualizado em 2026-10-12 para a branch codex/json-postgres-repositories;
isso não comprova merge em staging ou execução contra PostgreSQL.
Prioridades abaixo indicam a ordem sugerida de tratamento; não substituem
specs, decisão de produto ou execução dos testes.

## Problemas concretos

| ID | Prioridade | Evidência | Consequência |
| --- | --- | --- | --- |
| INT-01 | Resolvido nesta branch | FirstAccess usa helpers comuns sob /api/auth | Pré-validação e ativação usam as rotas existentes |
| INT-02 | Resolvido no código da branch atual | Convite, ativação, login e recuperação usam users; JSON possui uma única coleção de usuários | Schema/baseline e aplicação no PostgreSQL permanecem pendentes |
| INT-03 | Resolvido nesta branch para convite | validateToken e firstAccess compartilham verificação JWT de convite, perfil/status e users.invite_token | Pré-validação corresponde ao convite; reenvio/reset divergente permanece em INT-04 |
| INT-04 | Alta | Reenvio grava JWT cru; reset espera SHA-256 e expiração no banco | Link reenviado não segue o fluxo principal de reset |
| INT-05 | Alta | Login navega `/dashboard-empresa`; router não declara rota | Login empresa termina no fallback 404 |
| INT-06 | Resolvido nesta branch | Router importa ResetPassword com caixa correspondente ao arquivo | TypeScript e Vite passaram; não foi executado em Linux |
| INT-07 | Alta | `/sobre` e `/planos` ausentes de AppRoute; testes/header esperam páginas | Features existem como arquivos, mas não como destinos navegáveis |
| INT-08 | Resolvido nesta branch | searchEmpresas usa /api/v1/empresas/buscar?q= com codificação | Busca atinge o contrato existente |
| INT-09 | Parcial nesta branch | Helpers normalizam VITE_API_URL e incluem prefixo por endpoint; login Axios foi excluído | Consumidores adaptados corrigidos; login ainda exige alinhamento |
| INT-10 | Resolvido nos consumidores atuais | Tipos e exibição frontend usam descricao_detalhada e data_cadastro | Backend preserva snake_case, sem mapper novo |
| INT-11 | Alta | Schema Prisma vazio, migrations apenas plans/ajuste de copy | Banco limpo não suporta as consultas existentes |
| INT-12 | Alta | verify-about-bundle exige dashboard.png/macbook-silver.png ausentes; assets atuais usam macbook.png | Verificação de bundle está incompatível com os assets atuais |
| INT-13 | Média | Catálogo aplica termo, categoria ou estado com else-if | Campos preenchidos juntos não são combinados |
| INT-14 | Resolvido nesta branch | ResetPassword aponta /esqueci-senha | Destino de recuperação já registrado |

Evidências locais: [FirstAccess](../frontend/src/pages/FirstAccess.tsx),
[auth.controller](../backend/src/controller/auth.controller.ts),
[userController](../backend/src/controller/user.controller.ts),
[admin.controller](../backend/src/controller/admin.controller.ts),
[AppRoute](../frontend/src/routes/AppRoute.tsx),
[api](../frontend/src/lib/api.ts),
[CatalogoEmpresas](../frontend/src/pages/CatalogoEmpresas.tsx),
[ResetPassword](../frontend/src/pages/ResetPassword.tsx),
[verificador do bundle](../frontend/scripts/verify-about-bundle.mjs).
Na revisão inicial, INT-06/INT-12 eram achados estáticos. Na integração atual,
INT-06 foi corrigido; o gate de assets Sobre (INT-12) continua falhando.
Não alterar requisitos Home/Sobre sem resolver AD-002.

## Autenticação, autorização e isolamento

- Login cliente concede JWT apenas pelo e-mail cadastrado, sem senha ou
  comprovação de posse. É necessário definir o propósito desse acesso.
- Na branch atual, login bloqueia status pending e preserva usuários sem status.
  O middleware ainda não valida empresa vinculada.
- Não existe isolamento tenant aplicado às consultas nem contexto tenant
  autenticado. O catálogo público precisa de DTO e política próprios.
- Convite e primeiro acesso usam segredo fallback fixo quando a variável
  falta; o router admin tem proteção comentada e está desmontado.
  Montá-lo sem definir autorização abriria a emissão de convites.
- CORS reflete qualquer origem com credentials true. Não há allowlist,
  rate limiting ou trilha de auditoria versionados.
- Seleção de plano é gravada no usuário, não na empresa, divergindo da
  associação empresa/plano descrita no Notion.

Fontes: [middleware](../backend/src/middlewares/auth.ts),
[server](../backend/src/server.ts),
[admin.routes](../backend/src/routes/admin.routes.ts),
[plan.service](../backend/src/services/plan.service.ts).

## Padronização e qualidade

Existem três manifests/lockfiles sem workspaces declarados, versões
diferentes de ferramentas e dependências de backend no frontend.
O desalinhamento anterior entre Prisma CLI 6 e client/adapter 7 foi corrigido; os três pacotes estão fixados em 7.10.0. A estrutura mistura
userRoute, empresaRoute, auth.routes e controllers com camelCase e pontos.
Português/inglês e formatos de campos variam entre os domínios.

Os testes locais cobrem sobretudo UI pública; não foi encontrada suíte
backend, de isolamento tenant ou de integração real entre API e páginas.
Specs Home/Sobre e STATE descrevem contextos de feature anteriores à união.
Exemplos: spec de Sobre promete `/sobre`, mas router atual não registra;
verificador exige seis exports que não coincidem com os assets atuais.

Os workflows de frontend/backend têm apenas workflow_dispatch e jobs
com steps sem comandos executáveis. Não fornecem gates de união, testes,
build, deploy ou migrations.

## Lacunas de produto

Faltam gestão de tenants, usuários/equipes, permissões, vendas, leads,
conversas, mensagens, IA/WhatsApp, handoff, auditoria, métricas e dashboards.
Planos não implicam assinatura, cobrança ou limites operacionais.
Arquivos de páginas legais/ajuda não demonstram validação jurídica ou
funcionalidade de suporte. O fluxo n8n/WAHA pode existir externamente;
o repositório não permite reproduzi-lo nem verificar seu isolamento.

## Atualização: camadas do catálogo

Empresas foi separado em `company.routes.ts`, `company.controller.ts`,
`company.service.ts`, entidade, tipos observados; a interface genérica de consulta foi removida.
A mistura de handlers e registro de rotas foi resolvida nesse domínio;
as inconsistências dos demais módulos permanecem.

A extração inicial preservou contratos legados e documentou falhas SQL
como 200/404. A adoção atual corrige isso: infraestrutura retorna 500,
ausência 404; sucesso usa data. O adiamento inicial de frontend foi
substituído pela integração autorizada dos consumidores existentes, que
corrige INT-08/INT-10. Login continua excluído e incompatível (ver api.md).
Nenhuma tabela/migration foi criada.

Os quatro testes HTTP locais passaram com persistência simulada. O
typecheck completo estava bloqueado, na extração inicial, pela configuração Prisma existente
(`datasource` incompatível com o PrismaConfig instalado); a checagem
isolada dos arquivos de empresas e seus testes passou.

A camada global de erro/sucesso substitui a ausência de padronização
da revisão inicial. Stack/details/code fora de produção são sanitizados;
produção retorna apenas status/message. Testes históricos de extração
não substituem a validação da adoção, registrada em operacao.md.

## Verificação da integração — 2026-10-12

Estado acima para codex/frontend-backend-integration, dependente do PR #16,
com destino à staging; não comprova merge. Passaram 25 testes direcionados
frontend, 60 backend, typechecks frontend/foundation/contratos e Vite.
O build completo continua falhando no gate histórico de assets Sobre e lint
em SignSelect preexistente. Login, dashboard, páginas/rotas novas, schema e
migrations estão fora desta entrega.
