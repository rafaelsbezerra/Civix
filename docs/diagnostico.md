# Diagnóstico da staging

Revisão estática do commit `5db3c5b`, em 2026-10-09.
Prioridades abaixo indicam a ordem sugerida de tratamento; não substituem
specs, decisão de produto ou execução dos testes.

## Problemas concretos

| ID | Prioridade | Evidência | Consequência |
| --- | --- | --- | --- |
| INT-01 | Alta | FirstAccess chama `/api/v1/auth/*`; server monta `/api/auth/*` | Validação e ativação atingem URLs inexistentes |
| INT-02 | Alta | Convite/ativação usam `"user"`; login usa `users` | A conta ativada não necessariamente é a conta autenticada |
| INT-03 | Alta | validateToken compara token cru em users; convite usa invite_token em outra tabela; reset usa hash | Validação de links não corresponde aos produtores |
| INT-04 | Alta | Reenvio grava JWT cru; reset espera SHA-256 e expiração no banco | Link reenviado não segue o fluxo principal de reset |
| INT-05 | Alta | Login navega `/dashboard-empresa`; router não declara rota | Login empresa termina no fallback 404 |
| INT-06 | Alta | Router importa `@/pages/resetPassword`; arquivo é `ResetPassword.tsx` | Resolução sensível a caixa pode falhar em Linux/build |
| INT-07 | Alta | `/sobre` e `/planos` ausentes de AppRoute; testes/header esperam páginas | Features existem como arquivos, mas não como destinos navegáveis |
| INT-08 | Alta | api.searchEmpresas usa `/empresas/buscar/query`; router usa `/empresas/buscar` | Pesquisa por termo não atinge handler correto |
| INT-09 | Alta | lib/api espera VITE_API_URL com `/api/v1`; Axios acrescenta `/api/v1/users/*` | Uma configuração comum pode duplicar prefixo ou omiti-lo |
| INT-10 | Média | Empresa SQL snake_case vs tipos frontend camelCase, sem transformação | Consumidores podem receber campos ausentes |
| INT-11 | Alta | Schema Prisma vazio, migrations apenas plans/ajuste de copy | Banco limpo não suporta as consultas existentes |
| INT-12 | Alta | verify-about-bundle exige dashboard.png/macbook-silver.png ausentes; assets atuais usam macbook.png | Verificação de bundle está incompatível com os assets atuais |
| INT-13 | Média | Catálogo aplica termo, categoria ou estado com else-if | Campos preenchidos juntos não são combinados |
| INT-14 | Média | ResetPassword aponta `/esqueci-minha-senha`; router usa `/esqueci-senha` | Link de retorno termina no fallback |

Evidências locais: [FirstAccess](../frontend/src/pages/FirstAccess.tsx),
[auth.controller](../backend/src/controller/auth.controller.ts),
[userController](../backend/src/controller/user.controller.ts),
[admin.controller](../backend/src/controller/admin.controller.ts),
[AppRoute](../frontend/src/routes/AppRoute.tsx),
[api](../frontend/src/lib/api.ts),
[CatalogoEmpresas](../frontend/src/pages/CatalogoEmpresas.tsx),
[ResetPassword](../frontend/src/pages/ResetPassword.tsx),
[verificador do bundle](../frontend/scripts/verify-about-bundle.mjs).
INT-06 e INT-12 são incompatibilidades encontradas por inspeção;
build não foi executado para reproduzir o diagnóstico.

## Autenticação, autorização e isolamento

- Login cliente concede JWT apenas pelo e-mail cadastrado, sem senha ou
  comprovação de posse. É necessário definir o propósito desse acesso.
- Login não consulta status ativo; middleware não valida empresa vinculada.
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
Prisma CLI 6 e client/adapter 7 estão desalinhados. A estrutura mistura
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
ausência 404; sucesso usa data. INT-08/INT-10 persistem: URLs e diferenças
snake_case/camelCase não foram resolvidas. Frontend foi explicitamente
adiado e seus consumidores ainda exigem envelopes antigos (ver api.md).
Nenhuma tabela/migration foi criada.

Os quatro testes HTTP locais passaram com persistência simulada. O
typecheck completo permanece bloqueado pela configuração Prisma existente
(`datasource` incompatível com o PrismaConfig instalado); a checagem
isolada dos arquivos de empresas e seus testes passou.

A camada global de erro/sucesso substitui a ausência de padronização
da revisão inicial. Stack/details/code fora de produção são sanitizados;
produção retorna apenas status/message. Testes históricos de extração
não substituem a validação da adoção, registrada em operacao.md.
