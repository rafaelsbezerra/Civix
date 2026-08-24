# Tela Sobre Civix — Tarefas

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
| Configuração e qualidade | build-only | TypeScript, lint e build passam sem erros determinísticos | arquivos tocados pelo diagnóstico | `npm run lint && npm run build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após componente isolado | `npm run test` |
| Full | Após página ou rota | `npm run test && npm run lint && npm run build` |
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
T5 -> T6
```

---

## Task Breakdown

### Phase 1: Foundation

#### T1: Restaurar os gates determinísticos da branch

**What**: Corrigir o contrato de rota no teste do header e remover o export auxiliar não consumido que viola Fast Refresh.
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
- [x] O comportamento de produção permanece inalterado.
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

- [ ] A página contém `main`, seção nomeada e um único `h1`.
- [ ] Marcador, título e texto institucional correspondem ao Figma.
- [ ] Desktop usa o frame de referência; tablet/mobile entram em fluxo vertical.
- [ ] Testes cobrem landmarks, heading único, copy e composição.
- [ ] Gate Full passa.

**Tests**: unit
**Gate**: full
**Commit**: `feat(about): compose responsive about page`

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

- [ ] `/sobre` renderiza `AboutPage` sem alterar as demais rotas.
- [ ] Teste de integração cobre a rota com `MemoryRouter`.
- [ ] Captura `1728 × 760` permanece dentro da tolerância definida.
- [ ] Viewports `320`, `768`, `1024` e `1728 px` não têm overflow horizontal.
- [ ] Gate Full e gate Visual passam.

**Tests**: integration
**Gate**: full + visual
**Commit**: `feat(about): register about route`

---

## Phase Execution Map

```text
Phase 1: T1 -> T2
Phase 2: T3 -> T4
Phase 3: T5 -> T6
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

---

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| ABT-01 | T1, T6 |
| ABT-02 | T5 |
| ABT-03 | T5 |
| ABT-04 | T4 |
| ABT-05 | T4, T5 |
| ABT-06 | T4, T5 |
| ABT-07 | T2, T3 |
| ABT-08 | T3, T5, T6 |
| ABT-09 | T3, T4, T5, T6 |
| ABT-10 | T3, T5, T6 |
| ABT-11 | T2, T3 |
| ABT-12 | T4, T5 |
| ABT-13 | T2, T3, T4 |
| ABT-14 | T4, T5 |
| ABT-15 | T2, T6 |

**Coverage:** 15 de 15 requisitos mapeados; 0 órfãos.

---

## Tools and Skills Approved for Execute

- Figma MCP para contexto e assets.
- `figma-implement-design` e `figma:figma-design-to-code` para tradução fiel.
- `tlc-spec-driven` para gates, commits e verificação independente.
- Browser local para comparação visual e responsividade.

O usuário autorizou a execução ao confirmar a branch e responder “pode prosseguir com a implementação”.
