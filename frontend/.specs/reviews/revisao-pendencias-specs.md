# Revisão das pendências das specs do frontend

Revisão atualizada em 2026-10-12 na branch codex/frontend-backend-integration,
dependente de e229843 (PR #16), com destino à staging. Baseline de merges: bedb73a, revisada em 2026-10-10.
Essa referência já incorpora tooling Prisma 7 pelo PR #7, tipos de auth pelo
PR #12, adoção HTTP pelo PR #13 e auditoria documental pelo PR #14.

Paginação continua sob demanda. O usuário autorizou antecipar repositories
para permitir JSON/PostgreSQL em todos os módulos atuais. Esse modo, caixa de
saída, comando local e cadastro de empresas foram publicados no PR #16.
Services auth/admin também foram separados. A integração atual adapta
consumidores frontend existentes; login foi excluído e schema segue posterior.

Um checkbox concluído indica a entrega descrita; não comprova merge ou
execução no banco. Os estados abaixo distinguem essas situações.

## Pendências atuais

| Grupo | O que falta | Dependência ou limite |
| --- | --- | --- |
| Frontend consumidor (HTTP-04-B) | Adaptar login ao envelope e validar fluxo autenticado completo | Parcial: catálogo/perfil/planos, recuperação/reset e primeiro acesso adaptados nesta branch; login explicitamente excluído |

## Frontend: implementação preservada e divergências

Home conserva tokens/fontes, assets locais, ActionButton, menu responsivo,
formulário local e metadados. Sobre conserva conteúdo institucional,
princípios, componentes e tokens. Os relatórios PASS de agosto são históricos:
não validam automaticamente a composição atual de staging.

| Divergência observada | Evidência | Estado |
| --- | --- | --- |
| Sobre sem rota /sobre; incorporado na Home | AppRoute.tsx e pages/Home.tsx | Confirmar requisito vigente |
| Home incorpora outro main e h1 de About | pages/Home.tsx e pages/About.tsx | Diverge dos critérios de landmarks da Home |
| Header usa novos destinos, incluindo /planos sem rota | SiteHeader.tsx e AppRoute.tsx | Confirmar navegação vigente |
| Manifest/testes de Sobre esperam dashboard.png e macbook-silver.png, ausentes no código atual | src/assets/civix/about, AboutVisual e testes de assets | Confirmar assets vigentes e alinhar testes |
| Geometria, responsividade, zoom, CLS, contraste e bundle do checkout atual | Relatórios antigos e scripts presentes | Validação atual não executada nesta auditoria |
| Hashes crus de SVG dependem de CRLF/LF | Assets coincidem após normalização das quebras de linha | Conferir política de bytes ao alinhar testes |

**Orientação confirmada pelo usuário em 2026-10-10:** registrar as divergências
como aguardando confirmação, sem exigir retorno ao layout antigo. Essa
orientação não aprova automaticamente todos os detalhes da composição atual
nem reabre as tarefas históricas para restauração.

**Aguardando resposta:** definição dos requisitos vigentes de Home/Sobre,
incluindo navegação, rota, assets e composição. Até essa definição, manter
as divergências registradas; nenhuma mudança de requisitos/layout Home/Sobre
foi autorizada. A integração de consumidores existentes não resolve AD-002.

## Integração parcial dos consumidores — 2026-10-12

Concluídos nesta branch: data/message nos helpers e páginas existentes
exceto login; base de API comum, prefixos corretos, busca com q, campos
snake_case e link de recuperação. Pré-validação e ativação compartilham
JWT de convite, perfil/status e invite_token; INT-03 resolvido para esse fluxo.
ResetTokenRow/consulta de reset na pré-validação foram removidos.

Continuam pendentes: login explicitamente excluído; reenvio com protocolo
divergente (INT-04); dashboard/rotas ausentes; modelo/schema/migrations;
requisitos Home/Sobre AD-002. Não marcar HTTP-04-B como concluído integralmente.
Sem UI nova de seleção de plano ou cadastro de empresas.

Passaram 25 testes direcionados frontend e 60 backend, typechecks
frontend/foundation/contratos e Vite. Build completo falha no gate histórico
de assets Sobre; lint falha em SignSelect preexistente. Sem dependências novas
ou banco real. Ver [integração](../../../docs/frontend-backend.md).

Modelo/schema/migrations e evoluções backend: [revisão backend](../../../backend/.specs/reviews/revisao-pendencias-specs.md).
