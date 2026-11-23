# Tela Sobre Civix — Tarefas

> **Auditoria de estado — 2026-10-10:** este documento preserva decisões, checkboxes e resultados históricos. A vigência dos requisitos antigos está **Aguardando resposta**. Não restaurar layout, reabrir escopo ou declarar gates atuais aprovados sem confirmação e evidência.
> AppRoute não registra /sobre; About aparece dentro da Home. dashboard.png e macbook-silver.png do manifest histórico não existem no checkout; AboutVisual usa macbook.png e não renderiza dashboard. Não foi decidido restaurar a composição original ou aceitar essas divergências.
> Revisão consolidada: [pendências das specs](../../reviews/revisao-pendencias-specs.md).

## Execution Protocol (MANDATORY -- do not skip)

Implementar estas tarefas com a skill `tlc-spec-driven`: ativá-la por nome e seguir seu fluxo Execute e suas Critical Rules. Cada tarefa concluída exige gate verde, atualização deste arquivo e um commit atômico.

---

**Design**: `.specs/features/about-page/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `vite.config.ts`, `package.json` e testes co-localizados em `src/**/*.test.tsx`; strong defaults aplicados onde não há regra explícita.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Assets estáticos | build-only | Todos os imports resolvem e URLs temporárias não aparecem no bundle | `src/assets/civix/about/**` | `npm run build` |
| Componentes React de apresentação | unit | Conteúdo, ordem, semântica, assets e contratos responsivos atribuídos ao componente | `src/components/**/*.test.tsx` | `npm run test` |
| Página React | unit | Todos os ACs de conteúdo e landmarks da página | `src/pages/**/*.test.tsx` | `npm run test` |
| Roteamento | integration | `/sobre` renderiza a página correta; rotas existentes permanecem resolvíveis | `src/**/*.test.tsx` | `npm run test` |
| Layout no navegador | browser/e2e | Retângulos, fluxo, overflow, CLS e contraste são medidos no Chromium nos viewports da spec | `scripts/verify-about-browser.mjs` | `npm run test:e2e` |
| Configuração e qualidade | build-only | TypeScript, lint e build passam sem erros determinísticos | arquivos tocados pelo diagnóstico | `npm run lint && npm run build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após componente isolado | `npm run test` |
| Full | Após página ou rota | `npm run test && npm run test:e2e && npm run lint && npm run build` |
| Build | Após assets ou correções de gate | `npm run lint && npm run build` |
| Visual | Após integração | Servidor Vite local em `320×900`, `768×1024`, `1024×760` e `1728×760` |

---

## Execution Plan

### Phase 1: Foundation

```text
T1 -> T2
```

### Phase 2: Components

```text
T3 -> T4
```

### Phase 3: Integration

```text
T5 -> T6 -> T7 -> T8 -> T9
```

---

## Task Breakdown

### Phase 1: Foundation

#### T1: Restaurar os gates determinísticos da branch

**What**: Restaurar o baseline verde da branch e os hovers, espaçamentos e destinos de navegação já aprovados pelo usuário antes da tela Sobre.
**Where**: `src/components/`
**Depends on**: None
**Reuses**: Tipos atuais de `NavigationItem` e uso interno de `buttonVariants`.
**Requirement**: ABT-01

**Tools**:

- MCP: NONE
- Skills: `tlc-spec-driven`

**Done when**:

- [x] O teste customizado do header usa um destino compatível com `/${string}`.
- [x] `button.tsx` exporta somente o componente consumido externamente.
- [x] O comportamento compartilhado corresponde às alterações já aprovadas pelo usuário e permanece coberto por testes.
- [x] Gate Build passa.

**Tests**: build-only
**Gate**: build
**Commit**: `fix(frontend): restore quality gates`

**Status**: ✅ Complete — lint e build passaram; nenhuma alteração de comportamento em produção.

#### T2: Versionar os assets da tela Sobre

**What**: Organizar os seis exports originais do frame em um diretório local estável.
**Where**: `src/assets/civix/about/`
**Depends on**: T1
**Reuses**: Manifest do Figma em `design.md`.
**Requirement**: ABT-07, ABT-11, ABT-13, ABT-15

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `figma:figma-design-to-code`, `tlc-spec-driven`

**Done when**:

- [x] Os seis arquivos do manifest existem com bytes exportados do Figma.
- [x] PNGs e SVGs têm formatos válidos e dimensões preservadas.
- [x] Nenhuma URL MCP temporária será usada no código.
- [x] Gate Build passa.

**Tests**: build-only
**Gate**: build
**Commit**: `chore(about): add Figma exports`

**Status**: ✅ Complete — seis exports válidos; dashboard `1024×768`, notebook `4340×2860`; lint e build passaram.

### Phase 2: Components

#### T3: Criar a composição visual do notebook

**What**: Implementar `AboutVisual` com dashboard, notebook e ornamentos responsivos.
**Where**: `src/components/about/AboutVisual.tsx`
**Depends on**: T2
**Reuses**: Assets locais e tokens Civix.
**Requirement**: ABT-07, ABT-08, ABT-09, ABT-10, ABT-11, ABT-13

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Os quatro assets visuais são renderizados em containers com proporções explícitas.
- [x] A composição preserva rotação e enquadramento do desktop.
- [x] O layout reduz em mobile sem ultrapassar a largura disponível.
- [x] Testes cobrem assets, atributos decorativos e classes geométricas.
- [x] Gate Quick passa.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(about): add notebook visual`

**Status**: ✅ Complete — 3 testes do componente e 35 testes totais passaram.

#### T4: Criar a lista institucional

**What**: Implementar `AboutPrinciples` com Valor, Visão, Missão e divisores originais.
**Where**: `src/components/about/AboutPrinciples.tsx`
**Depends on**: T3
**Reuses**: Assets de divisor e tipografia global.
**Requirement**: ABT-04, ABT-05, ABT-06, ABT-09, ABT-12, ABT-13, ABT-14

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Os três princípios e descrições aparecem na ordem do Figma.
- [x] Os dois divisores originais são decorativos.
- [x] Desktop usa alinhamento título/descrição e mobile mantém ordem linear.
- [x] Testes cobrem texto, ordem, tipografia e assets.
- [x] Gate Quick passa.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(about): add institutional principles`

**Status**: ✅ Complete — 4 testes do componente, 39 testes totais, lint e build passaram.

### Phase 3: Integration

#### T5: Compor a página Sobre

**What**: Implementar `AboutPage` com marcador, título, introdução, visual e princípios.
**Where**: `src/pages/About.tsx`
**Depends on**: T4
**Reuses**: `AboutVisual`, `AboutPrinciples` e tokens Civix.
**Requirement**: ABT-02, ABT-03, ABT-05, ABT-06, ABT-08, ABT-09, ABT-10, ABT-12, ABT-14

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] A página contém `main`, seção nomeada e um único `h1`.
- [x] Marcador, título e texto institucional correspondem ao Figma.
- [x] Desktop usa o frame de referência; tablet/mobile entram em fluxo vertical.
- [x] Testes cobrem landmarks, heading único, copy e composição.
- [x] Gate Full passa.

**Tests**: unit
**Gate**: full
**Commit**: `feat(about): compose responsive about page`

**Status**: ✅ Complete — 5 testes da página, 44 testes totais, lint e build passaram.

#### T6: Registrar e validar a rota Sobre

**What**: Adicionar `/sobre` ao roteador e validar a tela nos viewports definidos.
**Where**: `src/routes/AppRoute.tsx`
**Depends on**: T5
**Reuses**: `AppRoutes`, `BrowserRouter` existente e destino do `SiteHeader`.
**Requirement**: ABT-01, ABT-08, ABT-09, ABT-10, ABT-15

**Tools**:

- MCP: Figma, Browser
- Skills: `figma-implement-design`, `browser:control-in-app-browser`, `tlc-spec-driven`

**Done when**:

- [x] `/sobre` renderiza `AboutPage` sem alterar as demais rotas.
- [x] Teste de integração cobre a rota com `MemoryRouter`.
- [x] Captura `1728 × 760` permanece dentro da tolerância definida.
- [x] Viewports `320`, `768`, `1024` e `1728 px` não têm overflow horizontal.
- [x] Gate Full e gate Visual passam.

**Tests**: integration
**Gate**: full + visual
**Commit**: `feat(about): register about route`

**Status**: ✅ Complete — rota integrada; 45 testes, lint e build passaram; geometria desktop conferida e matriz responsiva sem overflow horizontal.

#### T7: Fortalecer a evidência de validação

**What**: Resolver os gaps do primeiro Verifier com testes observáveis de navegador, contraste acessível, identidade dos assets e verificação do bundle local.
**Where**: `e2e/`, `scripts/`, `src/assets/civix/about/`, configuração de build e spec.
**Depends on**: T6
**Reuses**: Geometria do frame, manifest canônico e rota `/sobre`.
**Requirement**: ABT-03, ABT-04, ABT-06, ABT-07, ABT-08, ABT-09, ABT-10, ABT-11, ABT-14, ABT-15

**Done when**:

- [x] Playwright mede a geometria desktop com tolerância de `±4 px`.
- [x] Playwright prova ausência de overflow, visibilidade e não sobreposição nos viewports definidos.
- [x] Playwright mede CLS `<= 0.1` com assets atrasados e todos os contrastes exigidos.
- [x] Os seis exports são fixados por SHA-256 e aparecem como assets locais no manifest da build.
- [x] O bundle rejeita URLs remotas de Figma/MCP.
- [x] Gate Full passa; a re-verificação independente está prevista após o commit.

**Tests**: unit + browser/e2e + build-only
**Gate**: full
**Commit**: `test(about): strengthen validation evidence`

**Status**: ✅ Complete — 46 testes unitários, 4 grupos de verificações no Chromium, lint, build, manifest local e scanner de URLs passaram no ciclo de fix 1.

#### T8: Completar a cobertura semântica do navegador

**What**: Fechar os cinco gaps restantes do segundo Verifier com assertions computadas para fontes, cores, ordem responsiva, limites de cada texto e contraste de todos os papéis.
**Where**: `scripts/verify-about-browser.mjs`, `src/pages/About.tsx`, `src/components/about/AboutPrinciples.tsx` e estilos escopados.
**Depends on**: T7
**Reuses**: Harness Playwright e tokens canônicos da spec.
**Requirement**: ABT-05, ABT-06, ABT-09, ABT-10, ABT-14

**Done when**:

- [x] Urbanist e Inter são conferidas via `getComputedStyle` em todos os papéis previstos.
- [x] Os quatro tokens e as cores renderizadas são comparados aos valores canônicos exatos.
- [x] Todo texto essencial é enumerado e mantido dentro do documento em `320`, `768`, `1024` e `1728 px`.
- [x] Abaixo de `1024 px`, todos os blocos textuais e princípios são ordenados e não se sobrepõem.
- [x] Todos os papéis de texto têm contraste calculado e a ampliação textual de `200%` preserva o fluxo.
- [x] Gate Full passa; a terceira verificação independente está prevista após o commit.

**Tests**: browser/e2e
**Gate**: full
**Commit**: `test(about): complete browser assertions`

**Status**: ✅ Complete — assertions observáveis ampliadas no ciclo de fix 2; browser gate verde.

#### T9: Discriminar ordem responsiva e zoom

**What**: Matar o mutante sobrevivente do terceiro Verifier, tornando o fluxo textual estritamente vertical abaixo de `1024 px` e repetindo toda a matriz de oclusão em zoom textual de `200%`.
**Where**: `src/pages/About.tsx` e `scripts/verify-about-browser.mjs`.
**Depends on**: T8
**Reuses**: Retângulos e helpers do browser gate.
**Requirement**: ABT-09, ABT-14

**Done when**:

- [x] Marcador, título e introdução obedecem limites adjacentes nessa ordem abaixo de `1024 px`.
- [x] O layout adaptativo não usa colunas antes do frame desktop `2xl`.
- [x] Em zoom textual de `200%`, todos os pares de copy e princípios permanecem ordenados, contidos e sem overlap.
- [x] O mutante que reordena o marcador passa a falhar no browser gate.
- [x] Gate Full passa; a re-verificação independente final está prevista após o commit.

**Tests**: browser/e2e
**Gate**: full
**Commit**: `test(about): enforce responsive reading order`

**Status**: ✅ Complete — terceiro ciclo de fix aplicado; release Verifier confirmou 15/15 ACs, 4/4 gates e 2/2 mutantes mortos.

---

## Phase Execution Map

```text
Phase 1: T1 -> T2
Phase 2: T3 -> T4
Phase 3: T5 -> T6 -> T7 -> T8 -> T9
```

As dependências entre fases são T3 após T2 e T5 após T4. O mapa mostra a ordem interna das fases.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Um objetivo coeso: restaurar gates | ✅ Granular |
| T2 | Um bundle de assets do mesmo frame | ✅ Granular |
| T3 | Um componente visual | ✅ Granular |
| T4 | Um componente de conteúdo | ✅ Granular |
| T5 | Uma composição de página | ✅ Granular |
| T6 | Uma integração de rota | ✅ Granular |
| T7 | Um reforço coeso da evidência de validação | ✅ Granular |
| T8 | Um complemento coeso das assertions observáveis | ✅ Granular |
| T9 | Um reforço coeso da ordem responsiva e zoom | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Início | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2, fase anterior | Início da Phase 2 | ✅ Match |
| T4 | T3 | T3 → T4 | ✅ Match |
| T5 | T4, fase anterior | Início da Phase 3 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7 | T7 → T8 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Configuração/qualidade | build-only | build-only | ✅ OK |
| T2 | Assets | build-only | build-only | ✅ OK |
| T3 | Componente React | unit | unit | ✅ OK |
| T4 | Componente React | unit | unit | ✅ OK |
| T5 | Página React | unit | unit | ✅ OK |
| T6 | Roteamento | integration | integration | ✅ OK |
| T7 | Browser, assets e build | browser/e2e + build-only | browser/e2e + build-only | ✅ OK |
| T8 | Browser | browser/e2e | browser/e2e | ✅ OK |
| T9 | Browser | browser/e2e | browser/e2e | ✅ OK |

---

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| ABT-01 | T1, T6 |
| ABT-02 | T5 |
| ABT-03 | T5, T7 |
| ABT-04 | T4, T7 |
| ABT-05 | T4, T5, T8 |
| ABT-06 | T4, T5, T7, T8 |
| ABT-07 | T2, T3, T7 |
| ABT-08 | T3, T5, T6, T7 |
| ABT-09 | T3, T4, T5, T6, T7, T8, T9 |
| ABT-10 | T3, T5, T6, T7, T8 |
| ABT-11 | T2, T3, T7 |
| ABT-12 | T4, T5 |
| ABT-13 | T2, T3, T4 |
| ABT-14 | T4, T5, T7, T8, T9 |
| ABT-15 | T2, T6, T7 |

**Coverage:** 15 de 15 requisitos mapeados; 0 órfãos.

---

## Tools and Skills Approved for Execute

- Figma MCP para contexto e assets.
- `figma-implement-design` e `figma:figma-design-to-code` para tradução fiel.
- `tlc-spec-driven` para gates, commits e verificação independente.
- Browser local para comparação visual e responsividade.

O usuário autorizou a execução ao confirmar a branch e responder “pode prosseguir com a implementação”.

## Estado atual observado em leitura

Os checkboxes acima permanecem como registro da entrega histórica; não comprovam
o estado atual. Divergência não autoriza retorno ao layout anterior ou tarefa nova.

| Tarefa / requisito | Estado atual | Evidência e limite |
| --- | --- | --- |
| T1 / gates compartilhados | Implementação presente; validação atual pendente | Configuração e testes existem, mas lint/build/testes não foram executados nesta auditoria. |
| T2 / ABT-07 | Divergente do requisito histórico | dashboard.png e macbook-silver.png ausentes; macbook.png substitui notebook. Manifest aprovado preservado para decisão. |
| T3 / ABT-07/13 | Divergente do requisito histórico | AboutVisual renderiza três imagens em vez de quatro; atributos decorativos presentes. Testes ainda esperam assets/dimensões originais. |
| T4/T5 / ABT-02/03/04/05/06/12 | Implementação preservada no componente isolado | Conteúdo, princípios, estrutura local, fontes e tokens presentes. A integração na Home duplica main/h1. Não houve renderização dinâmica nesta auditoria. |
| T6 / ABT-01 | Divergente do requisito histórico | /sobre não está registrada; About é incorporada na Home. Não declarar endpoint de frontend operacional. |
| T7–T9 / ABT-08/09/10/11/14/15 | Validação atual não executada | Scripts de geometria, responsividade, zoom, CLS, contraste e bundle existem, mas dependem de rota/assets divergentes. PASS histórico não é aprovação atual. |

Nenhuma suíte, build, lint, navegador ou comparação visual foi executada nesta
auditoria. Não há dist, relatórios Playwright ou capturas locais nesta worktree
para reaproveitar como evidência atual. Critérios visuais permanecem não verificados.

Identidade dos SVGs: a auditoria de bytes encontrou diferenças CRLF/LF;
os quatro SVGs normalizados para LF coincidem com os hashes históricos.
O teste atual calcula hash bruto e pode divergir neste checkout Windows.
Isso não explica os dois PNGs ausentes. Nenhum hash ou manifest foi alterado.
