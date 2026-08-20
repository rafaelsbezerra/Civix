# Hero da Home Civix — Tarefas

## Execution Protocol (MANDATORY -- do not skip)

Implementar estas tarefas com a skill `tlc-spec-driven`: ativá-la por nome e seguir seu fluxo Execute e suas Critical Rules. Não procurar os arquivos da skill por um caminho fixo durante a execução.

Se a skill não puder ser ativada, interromper e informar o usuário. Cada tarefa concluída exige gate verde, atualização deste arquivo e um commit atômico.

---

**Design**: `.specs/features/home-hero/design.md`
**Status**: Approved

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: nenhuma; strong defaults aplicados. O repositório não contém testes, e o usuário aprovou Vitest + React Testing Library + validação visual no navegador.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Configuração de testes | integration smoke | Runner inicializa em jsdom e executa ao menos um teste | `src/**/*.test.ts?(x)` | `npm run test` |
| Tokens, fontes, assets e metadados | build-only | Imports resolvem, CSS compila e documento contém metadados previstos | `src/index.css`, `src/assets/**`, `index.html` | `npm run lint && npm run build` |
| Componentes React de apresentação | unit | Todos os ACs atribuídos ao componente, semântica, variantes e estados interativos | `src/**/*.test.tsx` | `npm run test` |
| Composição da página | unit + visual | Landmarks e integração por RTL; geometria e overflow nos cinco viewports da spec | `src/App.test.tsx` + capturas | `npm run test` + validação visual |

## Gate Check Commands

> Generated from codebase and approved test strategy — confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Após componente isolado | `npm run test` |
| Full | Após integração da página | `npm run test && npm run lint && npm run build` |
| Build | Após tokens, assets ou metadados | `npm run lint && npm run build` |
| Visual | Após T8 e antes da validação independente | Executar Vite localmente e capturar `320×900`, `390×844`, `768×1024`, `1024×1117` e `1728×1117` |

---

## Execution Plan

As fases são sequenciais. Cada tarefa executa na ordem apresentada.

### Phase 1: Foundation

```text
T1 -> T2 -> T3
```

### Phase 2: Components

```text
T4 -> T5 -> T6 -> T7
```

### Phase 3: Integration

```text
T8 -> T9
```

---

## Task Breakdown

### Phase 1: Foundation

#### T1: Configurar o ambiente de testes React

**What**: Adicionar Vitest, jsdom, React Testing Library, jest-dom, user-event, scripts e setup mínimo executável.
**Where**: `frontend/`
**Depends on**: None
**Reuses**: `vite.config.ts`, alias `@` e stack React/Vite existente.
**Requirement**: HOME-15, HOME-18

**Tools**:

- MCP: NONE
- Skills: `tlc-spec-driven`

**Done when**:

- [x] Dependências de teste estão fixadas no lockfile.
- [x] `npm run test` executa em jsdom sem modo watch.
- [x] Setup inclui matchers do jest-dom e cleanup previsível.
- [x] Existe um smoke test verde.
- [x] Gate Full passa com pelo menos 1 teste.

**Tests**: integration smoke
**Gate**: full
**Commit**: `test(home): configure React test environment`

**Status**: ✅ Complete — 1 teste passou; lint e build passaram no worktree isolado da superfície de T1.

#### T2: Definir tokens e tipografia Civix

**What**: Substituir os estilos globais do template pelos tokens Civix, resets e imports Fontsource Variable.
**Where**: `src/index.css`
**Depends on**: T1
**Reuses**: Import Tailwind 4 e paleta dos frames `64:453` e `70:986`.
**Requirement**: HOME-03, HOME-04, HOME-10, HOME-16

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Tokens do design estão declarados com valores exatos.
- [x] Inter Variable e Urbanist Variable são servidas pelo bundle.
- [x] Paleta clara não muda com `prefers-color-scheme`.
- [x] Reset global remove limitações do template Vite.
- [x] Gate Build passa.

**Tests**: build-only
**Gate**: build
**Commit**: `style(home): add Civix design tokens`

**Status**: ✅ Complete — lint e build passaram no worktree isolado; o bundle emitiu as fontes Inter e Urbanist em WOFF2.

#### T3: Versionar os assets originais do Figma

**What**: Baixar e organizar logo, ilustração, forma decorativa e ícones originais do frame.
**Where**: `src/assets/civix/`
**Depends on**: T2
**Reuses**: Manifest de assets de `design.md` e exports MCP do frame `90:1204`.
**Requirement**: HOME-02, HOME-14, HOME-18

**Tools**:

- MCP: Figma `download_assets`
- Skills: `figma-implement-design`, `figma:figma-design-to-code`, `tlc-spec-driven`

**Done when**:

- [x] Os cinco assets do manifest existem localmente com bytes exportados do Figma.
- [x] Nenhum asset usa URL MCP temporária no código.
- [x] SVGs mantêm `viewBox` e renderizam no tamanho esperado.
- [x] Gate Build passa.

**Tests**: build-only
**Gate**: build
**Commit**: `chore(home): add Figma hero exports`

**Status**: ✅ Complete — cinco assets locais verificados; quatro SVGs preservam `viewBox`; lint e build passaram no worktree isolado.

### Phase 2: Components

#### T4: Criar ActionButton

**What**: Implementar o link reutilizável com variantes primary, light e translucent e suporte opcional à seta.
**Where**: `src/components/ui/ActionButton.tsx`
**Depends on**: T3
**Reuses**: Asset `arrow-right.svg` e tokens Civix.
**Requirement**: HOME-01, HOME-02, HOME-09, HOME-10, HOME-16

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] As três variantes reproduzem cores, dimensões e raio do Figma.
- [x] Props de âncora são repassadas sem remover nome acessível.
- [x] Seta é decorativa e tem `24 × 24 px` quando exibida.
- [x] Testes cobrem as três variantes, href, seta e focus class.
- [x] Gate Quick passa com pelo menos 5 testes do componente.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(home): add action button variants`

**Status**: ✅ Complete — 6 testes unitários passaram e o lint está limpo.

#### T5: Criar SiteHeader responsivo

**What**: Implementar header com logo, âncoras, CTA e menu compacto controlado por teclado.
**Where**: `src/components/layout/SiteHeader.tsx`
**Depends on**: T4
**Reuses**: `ActionButton`, logo local e navegação do frame.
**Requirement**: HOME-01, HOME-02, HOME-06, HOME-09, HOME-10, HOME-15, HOME-18

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Desktop mostra logo, quatro âncoras e CTA nas posições previstas.
- [x] Viewports abaixo de 1024 px usam botão com `aria-expanded` e `aria-controls`.
- [x] Seleção de âncora e tecla Escape fecham o menu.
- [x] Fechamento por Escape devolve foco ao botão.
- [x] Testes cobrem desktop, toggle, Escape, seleção e atributos acessíveis.
- [x] Gate Quick passa com pelo menos 6 testes do componente.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(home): add responsive site header`

**Status**: ✅ Complete — 7 testes unitários passaram e o lint está limpo.

#### T6: Criar SearchForm local

**What**: Implementar os dois inputs, select e submit com estado local e sem efeitos externos.
**Where**: `src/features/home/components/SearchForm.tsx`
**Depends on**: T5
**Reuses**: Tokens, assets de seta/chevron e frame `Search`.
**Requirement**: HOME-07, HOME-08, HOME-10, HOME-11, HOME-12, HOME-13, HOME-14, HOME-15

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Todos os controles têm labels associados e nomes acessíveis.
- [x] Inputs aplicam `maxLength={100}` e mantêm valores locais.
- [x] Select contém opções ilustrativas e valor vazio inicial.
- [x] Submit chama `preventDefault` e callback opcional sem navegação.
- [x] Layout é horizontal, em grade ou empilhado conforme o breakpoint.
- [x] Testes cobrem labels, edição, limite, seleção, submit e ausência de reset.
- [x] Gate Quick passa com pelo menos 6 testes do componente.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(home): add local search form`

**Status**: ✅ Complete — 8 testes unitários passaram e o lint está limpo.

#### T7: Criar HeroSection fiel ao frame

**What**: Compor copy, ilustração, CTAs e SearchForm no container visual responsivo.
**Where**: `src/features/home/components/HeroSection.tsx`
**Depends on**: T6
**Reuses**: `ActionButton`, `SearchForm`, tokens e assets locais.
**Requirement**: HOME-01, HOME-02, HOME-04, HOME-05, HOME-07, HOME-08, HOME-18

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`

**Done when**:

- [x] Desktop preserva container `1600 × 900 px` no viewport de referência.
- [x] Título, texto e CTAs seguem medidas e tipografia do Figma.
- [x] Ilustração e forma decorativa usam assets originais e crop responsivo.
- [x] Busca sobrepõe a base no desktop e entra no fluxo no mobile.
- [x] Testes cobrem heading, copy, CTAs, assets decorativos e formulário composto.
- [x] Gate Quick passa com pelo menos 5 testes do componente.

**Tests**: unit
**Gate**: quick
**Commit**: `feat(home): build responsive hero section`

**Status**: ✅ Complete — 6 testes da hero e 28 testes totais passaram; lint limpo.

### Phase 3: Integration

#### T8: Compor a primeira tela da home

**What**: Substituir o template Vite pela composição semântica de SiteHeader e HeroSection e validar os viewports definidos.
**Where**: `src/App.tsx`
**Depends on**: T7
**Reuses**: Entrada `main.tsx`, `SiteHeader` e `HeroSection`.
**Requirement**: HOME-01, HOME-05, HOME-07, HOME-08, HOME-09, HOME-10, HOME-15, HOME-16

**Tools**:

- MCP: Figma
- Skills: `figma-implement-design`, `tlc-spec-driven`, `browser:control-in-app-browser`

**Done when**:

- [x] A página contém `header`, `nav`, `main`, um único `h1` e âncoras locais.
- [x] Nenhum conteúdo do template Vite é renderizado.
- [x] Testes cobrem landmarks, h1 único e integração dos componentes.
- [x] Capturas nos cinco viewports não apresentam overflow horizontal.
- [x] Em `1728 × 1117 px`, elementos-chave permanecem dentro da tolerância de `±2 px`.
- [x] Gate Full passa com pelo menos 3 testes de App e todos os testes anteriores.

**Tests**: unit + visual
**Gate**: full
**Commit**: `feat(home): compose Civix landing hero`

**Status**: ✅ Complete — 32 testes, lint e build passaram; cinco viewports sem overflow; geometria desktop dentro de ±0,5 px e console limpo.

#### T9: Definir metadados básicos da home

**What**: Atualizar título e meta description mantendo idioma e viewport corretos.
**Where**: `index.html`
**Depends on**: T8
**Reuses**: Documento HTML existente e posicionamento híbrido registrado em STATE.
**Requirement**: HOME-17

**Tools**:

- MCP: NONE
- Skills: `tlc-spec-driven`

**Done when**:

- [ ] Documento mantém `lang="pt-BR"` e viewport responsivo.
- [ ] Título é exatamente “Civix”.
- [ ] Meta description descreve conexão de clientes, serviços e empresas.
- [ ] Gate Build passa.

**Tests**: build-only
**Gate**: build
**Commit**: `feat(home): add landing metadata`

---

## Phase Execution Map

```text
Phase 1: T1 -> T2 -> T3
Phase 2: T4 -> T5 -> T6 -> T7
Phase 3: T8 -> T9
```

As dependências entre fases são T4 após T3 e T8 após T7. O mapa exibe somente a ordem interna de cada fase, conforme a regra do validador.

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Uma configuração coesa de testes | ✅ Granular |
| T2 | Um stylesheet global e seus imports de fonte | ✅ Granular |
| T3 | Um conjunto coeso de assets do mesmo frame | ✅ Granular |
| T4 | Um componente | ✅ Granular |
| T5 | Um componente | ✅ Granular |
| T6 | Um componente | ✅ Granular |
| T7 | Um componente | ✅ Granular |
| T8 | Uma composição de página | ✅ Granular |
| T9 | Um documento de metadados | ✅ Granular |

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Início | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3, fase anterior | Início da Phase 2 | ✅ Match |
| T5 | T4 | T4 → T5 | ✅ Match |
| T6 | T5 | T5 → T6 | ✅ Match |
| T7 | T6 | T6 → T7 | ✅ Match |
| T8 | T7, fase anterior | Início da Phase 3 | ✅ Match |
| T9 | T8 | T8 → T9 | ✅ Match |

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Configuração de testes | integration smoke | integration smoke | ✅ OK |
| T2 | Tokens e fontes | build-only | build-only | ✅ OK |
| T3 | Assets | build-only | build-only | ✅ OK |
| T4 | Componente React | unit | unit | ✅ OK |
| T5 | Componente React com estado | unit | unit | ✅ OK |
| T6 | Formulário React | unit | unit | ✅ OK |
| T7 | Composição de feature | unit | unit | ✅ OK |
| T8 | Composição de página | unit + visual | unit + visual | ✅ OK |
| T9 | Metadados | build-only | build-only | ✅ OK |

---

## Requirement Coverage

| Requirement | Tasks |
| --- | --- |
| HOME-01 | T4, T5, T7, T8 |
| HOME-02 | T3, T4, T5, T7 |
| HOME-03 | T2 |
| HOME-04 | T2, T7 |
| HOME-05 | T7, T8 |
| HOME-06 | T5 |
| HOME-07 | T6, T7, T8 |
| HOME-08 | T6, T7, T8 |
| HOME-09 | T4, T5, T8 |
| HOME-10 | T2, T4, T5, T6, T8 |
| HOME-11 | T6 |
| HOME-12 | T6 |
| HOME-13 | T6 |
| HOME-14 | T3, T6 |
| HOME-15 | T1, T5, T6, T8 |
| HOME-16 | T2, T4, T8 |
| HOME-17 | T9 |
| HOME-18 | T1, T3, T5, T7 |

**Coverage:** 18 de 18 requisitos mapeados; 0 órfãos.

---

## Tools and Skills Proposed for Execute

- Figma MCP: contexto, screenshot e download dos assets originais.
- `figma-implement-design`: tradução e validação visual contra o frame.
- `figma:figma-design-to-code`: pré-requisito de leitura do Figma.
- `tlc-spec-driven`: execução, gates, commits atômicos e verificação independente.
- `browser:control-in-app-browser`: capturas e inspeção dos cinco viewports.

O usuário deve confirmar estas ferramentas junto com a aprovação das tarefas antes do Execute.
