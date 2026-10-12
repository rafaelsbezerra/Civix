# Diagnóstico do frontend

Revisão estática do commit `5db3c5b`, em 2026-10-09.
INT-02 atualizado em 2026-10-12 para a branch codex/json-postgres-repositories;
isso não comprova merge em staging ou execução contra PostgreSQL.
Prioridades abaixo indicam a ordem sugerida de tratamento; não substituem
specs, decisão de produto ou execução dos testes.

## Problemas concretos

| ID | Prioridade | Evidência | Consequência |
| --- | --- | --- | --- |
| INT-01 | Resolvido nesta branch | FirstAccess usa helpers comuns sob /api/auth | Pré-validação e ativação usam as rotas existentes |
| INT-05 | Alta | Login navega `/dashboard-empresa`; router não declara rota | Login empresa termina no fallback 404 |
| INT-06 | Resolvido nesta branch | Router importa ResetPassword com caixa correspondente ao arquivo | TypeScript e Vite passaram; não foi executado em Linux |
| INT-07 | Alta | `/sobre` e `/planos` ausentes de AppRoute; testes/header esperam páginas | Features existem como arquivos, mas não como destinos navegáveis |
| INT-08 | Resolvido nesta branch | searchEmpresas usa /api/v1/empresas/buscar?q= com codificação | Busca atinge o contrato existente |
| INT-09 | Parcial nesta branch | Helpers normalizam VITE_API_URL e incluem prefixo por endpoint; login Axios foi excluído | Consumidores adaptados corrigidos; login ainda exige alinhamento |
| INT-10 | Resolvido nos consumidores atuais | Tipos e exibição frontend usam descricao_detalhada e data_cadastro | Backend preserva snake_case, sem mapper novo |
| INT-12 | Alta | verify-about-bundle exige dashboard.png/macbook-silver.png ausentes; assets atuais usam macbook.png | Verificação de bundle está incompatível com os assets atuais |
| INT-13 | Média | Catálogo aplica termo, categoria ou estado com else-if | Campos preenchidos juntos não são combinados |
| INT-14 | Resolvido nesta branch | ResetPassword aponta /esqueci-senha | Destino de recuperação já registrado |

Evidências locais: [FirstAccess](../../src/pages/FirstAccess.tsx),
[auth.controller](../../../backend/src/controller/auth.controller.ts),
[userController](../../../backend/src/controller/user.controller.ts),
[admin.controller](../../../backend/src/controller/admin.controller.ts),
[AppRoute](../../src/routes/AppRoute.tsx),
[api](../../src/lib/api.ts),
[CatalogoEmpresas](../../src/pages/CatalogoEmpresas.tsx),
[ResetPassword](../../src/pages/ResetPassword.tsx),
[verificador do bundle](../../scripts/verify-about-bundle.mjs).
Na revisão inicial, INT-06/INT-12 eram achados estáticos. Na integração atual,
INT-06 foi corrigido; o gate de assets Sobre (INT-12) continua falhando.
Não alterar requisitos Home/Sobre sem resolver AD-002.

## Histórico de qualidade frontend

Os testes locais cobrem sobretudo UI pública; não foi encontrada suíte
backend, de isolamento tenant ou de integração real entre API e páginas.
Specs Home/Sobre e STATE descrevem contextos de feature anteriores à união.
Exemplos: spec de Sobre promete `/sobre`, mas router atual não registra;
verificador exige seis exports que não coincidem com os assets atuais.

## Verificação da integração — 2026-10-12

Estado acima para codex/frontend-backend-integration, dependente do PR #16,
com destino à staging; não comprova merge. Passaram 25 testes direcionados
frontend, 60 backend, typechecks frontend/foundation/contratos e Vite.
O build completo continua falhando no gate histórico de assets Sobre e lint
em SignSelect preexistente. Login, dashboard, páginas/rotas novas, schema e
migrations estão fora desta entrega.

Questões de auth, schema e backend: [backend](../../../backend/.specs/reviews/diagnostico.md).
