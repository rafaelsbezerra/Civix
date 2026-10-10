# Validation: Hero da Home Civix — PASS

> **Auditoria de estado — 2026-10-10:** este documento preserva decisões, checkboxes e resultados históricos. A vigência dos requisitos antigos está **Aguardando resposta**. Não restaurar layout, reabrir escopo ou declarar gates atuais aprovados sem confirmação e evidência.
> Componentes atuais estão em src/components/home. Home incorpora About com outro main/h1; header usa destinos de aplicação, incluindo /planos sem rota registrada. As verificações originais de âncoras locais, semântica única e geometria não constituem validação atual.
> Revisão consolidada: [pendências das specs](../../../../docs/revisao-pendencias-specs.md).

**Historical date**: 2026-08-20
**Spec**: `.specs/features/home-hero/spec.md`  
**Diff range**: `ac05e57..d8b6056`  
**Verifier**: independent sub-agent (author != verifier), correction round 2

---

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1 | ✅ Done | Vitest, jsdom and RTL run deterministically. |
| T2 | ✅ Done | Exact tokens and local Inter/Urbanist bundles compile. |
| T3 | ✅ Done | Five Figma exports are local; no temporary MCP URL remains. |
| T4 | ✅ Done | Three action variants, anchors, arrow and focus treatment are covered. |
| T5 | ✅ Done | Desktop/mobile navigation, menu state, Escape and 44 px logo target pass. |
| T6 | ✅ Done | Labeled local-state form, native length limits and side-effect-free submit pass. |
| T7 | ✅ Done | Hero content, assets, typography and desktop geometry pass. |
| T8 | ✅ Done | Semantic integration and responsive browser checks pass without overflow. |
| T9 | ✅ Done | Language, title, viewport and hybrid-platform description pass. |

---

## Spec-Anchored Acceptance Criteria

| Requirement | Spec-defined outcome | `file:line` + assertion/evidence | Result |
| --- | --- | --- | --- |
| HOME-01 | Header, hero, two CTAs and search appear in the approved hierarchy. | `src/App.tsx:7`, `src/App.tsx:9`; `src/components/home/HeroSection.test.tsx:29` asserts both CTAs and `src/components/home/HeroSection.test.tsx:52` asserts the search. | ✅ PASS |
| HOME-02 | Logo, main artwork, decorative shape, arrow and select indicator use local Figma exports. | `src/components/layout/SiteHeader.tsx:3`, `src/components/home/HeroSection.tsx:1`, `src/components/home/SearchForm.tsx:3`; production build emitted local PNG/SVG assets and source search found no MCP asset URL. | ✅ PASS |
| HOME-03 | Exact navy, gold, ivory and ink tokens are defined and used. | `src/index.css:6` through `src/index.css:9`; the production CSS resolves all four tokens. | ✅ PASS |
| HOME-04 | Urbanist is used for titles/actions and Inter for supporting copy/navigation. | `src/components/home/HeroSection.test.tsx:15`, `src/components/ui/ActionButton.test.tsx:17`, `src/components/home/SearchForm.test.tsx:12`; computed browser families were Urbanist for h1, hero CTA, input and search button, and Inter for copy/navigation at 320, 768 and 1728 px. Built CSS maps both explicit utilities to `font-family`. | ✅ PASS |
| HOME-05 | Key desktop bounds stay within ±2 px at 1728×1117. | `src/components/home/HeroSection.test.tsx:61`; browser bounds were hero `(64,109,1600,900)` and search `(350,920,1104,142)`, exact to the design table. The logo image remains `(128,32,99,32)` inside its expanded target. | ✅ PASS |
| HOME-06 | Below 1024 px, desktop navigation is replaced by an accessible menu toggle. | `src/components/layout/SiteHeader.tsx:58`, `src/components/layout/SiteHeader.tsx:83`; `src/components/layout/SiteHeader.test.tsx:34` and `src/components/layout/SiteHeader.test.tsx:47` assert collapsed/expanded state and relationship. | ✅ PASS |
| HOME-07 | Below 768 px, content/CTAs/search stack with no horizontal overflow at 320 px or above. | `src/components/home/SearchForm.tsx:40` supplies the one-column layout. Browser assertion at 320×900 returned `scrollWidth=305`, `clientWidth=305`; `src/index.css:29` and `src/index.css:34` no longer force 320 px minimums. | ✅ PASS |
| HOME-08 | At 768–1023 px, layout is legible and every interactive area is at least 44×44 px. | `src/components/layout/SiteHeader.test.tsx:12` asserts `min-h-11`; browser target at 768×1024 was `99×44`. `src/components/layout/SiteHeader.tsx:46` and the 52 px form controls preserve required hit areas. | ✅ PASS |
| HOME-09 | Navigation uses local fragments without application routing. | `src/App.test.tsx:28` asserts every header `href` matches `/^#\\w+/`; `src/components/layout/SiteHeader.test.tsx:88` exercises local selection and closure. | ✅ PASS |
| HOME-10 | Focus-visible indicator has at least 3:1 contrast against its surroundings. | `src/index.css:58` through `src/index.css:61` define an ivory inner outline plus navy outer ring. Computed focused anchor style resolved both colors; ivory/navy contrast is `16.882:1`, so one ring remains visible against either approved surface. | ✅ PASS |
| HOME-11 | Search exposes the two exact text labels, price label and Pesquisar button. | `src/components/home/SearchForm.test.tsx:11`, `src/components/home/SearchForm.test.tsx:15` through `src/components/home/SearchForm.test.tsx:17` assert all accessible names. | ✅ PASS |
| HOME-12 | Submit prevents reload, navigation and network effects. | `src/components/home/SearchForm.tsx:33`; `src/components/home/SearchForm.test.tsx:79` asserts `submitEvent.defaultPrevented === true`, and the component contains no request call. | ✅ PASS |
| HOME-13 | Edited values persist during the current page session. | `src/components/home/SearchForm.test.tsx:27`, `src/components/home/SearchForm.test.tsx:28`, `src/components/home/SearchForm.test.tsx:64` and `src/components/home/SearchForm.test.tsx:95` assert retained values. | ✅ PASS |
| HOME-14 | Both text fields reject characters beyond 100 through native limits. | `src/components/home/SearchForm.test.tsx:40` through `src/components/home/SearchForm.test.tsx:43` assert `maxlength=100` and exact 100-character values after typing 105. | ✅ PASS |
| HOME-15 | Exactly one h1, header/nav/main landmarks and accessible control names. | `src/App.test.tsx:10` through `src/App.test.tsx:20` assert landmarks and one h1; `src/components/home/SearchForm.test.tsx:11` through `src/components/home/SearchForm.test.tsx:17` assert control names. | ✅ PASS |
| HOME-16 | Normal text contrast is at least 4.5:1 and large text at least 3:1. | `src/index.css:6` through `src/index.css:9`; verified ratios are navy/ivory `16.882:1`, ivory/navy `16.882:1`, and ink/ivory `18.316:1`. | ✅ PASS |
| HOME-17 | `pt-BR`, title Civix and a hybrid-platform meta description are defined. | `index.html:2`, `index.html:6`, `index.html:7` through `index.html:11`; the production build preserved the metadata. | ✅ PASS |
| HOME-18 | Purely decorative illustrations expose empty alt text or aria-hidden. | `src/components/home/HeroSection.test.tsx:44` through `src/components/home/HeroSection.test.tsx:47` assert two decorative images; `src/components/ui/ActionButton.test.tsx:52` through `src/components/ui/ActionButton.test.tsx:55` assert the arrow. | ✅ PASS |

**Status**: 18/18 requirements matched their specified outcomes; 0 spec-precision gaps.

---

## Correction-Round Browser Evidence

The verifier independently re-derived the expected outcomes and corroborated the compiled CSS. The active Browser measurement was supplied by the orchestrator because the verifier's resumed Browser backend was unavailable.

| Viewport | Overflow | Logo target | Typography | Result |
| --- | --- | --- | --- | --- |
| 320×900 | `305 = 305` | `99×44` | Urbanist display/actions/form; Inter body/nav | ✅ PASS |
| 768×1024 | `753 = 753` | `99×44` | Urbanist display/actions/form; Inter body/nav | ✅ PASS |
| 1728×1117 | `1728 = 1728` | `99×44` target, image remains at Figma coordinates | Urbanist display/actions/form; Inter body/nav | ✅ PASS |

The build independently confirms `.font-[family-name:var(--font-display)] { font-family: var(--font-display) }`, `.font-[family-name:var(--font-body)] { font-family: var(--font-body) }`, `.min-h-11 { min-height: calc(var(--spacing) * 11) }`, and the exact two-tone focus rule from `src/index.css:58`.

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M2 | `src/components/home/HeroSection.tsx:34` | Regressed the h1 from explicit `font-family` syntax to the prior ambiguous `font-[var(--font-display)]` utility in a detached scratch worktree. | ✅ Killed: `src/components/home/HeroSection.test.tsx:15` failed on the exact expected utility; 1 failed, 5 passed in the targeted file. |

**Sensor depth**: lightweight, focused on a corrected highest-risk visual regression.  
**Sensor outcome**: 1/1 killed — PASS.  
**Isolation**: scratch worktree removed; real-tree porcelain returned to the pre-sensor baseline containing only this uncommitted report.

---

## Gate Check

- **Full gate commands**: `npm run test`, `npm run lint`, `npm run build`
- **Tests**: 32 passed, 0 failed, 0 skipped across 6 files.
- **Lint**: passed with 0 errors.
- **Build**: passed; Vite emitted local PNG/SVG artwork plus Inter and Urbanist WOFF2 assets.
- **Spec validator**: 0 errors, 0 warnings.
- **Tasks validator**: 0 errors, 0 warnings.
- **Test count before feature**: 0 at `ac05e57`.
- **Test count after feature**: 32.
- **Delta**: +32 tests; no deleted or skipped tests.
- **Diff hygiene**: `git diff --check ac05e57..d8b6056` passed.

---

## Edge Cases

- [x] Repeated submit remains local and values are not reset.
- [x] 320 px width has no horizontal overflow.
- [x] Font files are local and fallback text remains visible.
- [x] `color-scheme: light` fixes the light palette under dark system preference.
- [x] Escape closes the mobile menu and restores focus.

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code / no unrequested features | ✅ |
| Surgical feature-scoped changes | ✅ |
| No temporary runtime asset URLs | ✅ |
| Matches the approved component architecture | ✅ |
| Tests map to requirements or task done-when criteria | ✅ |
| Spec-anchored asserted outcomes | ✅ |
| Responsive/accessibility outcomes | ✅ |
| Documented guidelines | ✅ None found; strong defaults applied. |

---

## Requirement Traceability Update

| Requirement | Previous status | Verifier status |
| --- | --- | --- |
| HOME-01 through HOME-18 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready.  
**Spec-anchored check**: 18/18 requirements matched; 0 spec-precision gaps.  
**Sensor**: 1/1 mutation killed.  
**Gate**: 32 tests passed; lint, build and structural validators passed.

The prior typography, 320 px overflow, tablet target-size and focus-contrast findings are fixed. Desktop geometry remains exact, functional behavior stays covered, and the corrected typography test kills the regression mutation. This is a clean PASS, so no project lesson is recorded.

Nota de caminhos: referências aos componentes foram atualizadas para
src/components/home; os números de linha e assertions do relatório continuam
históricos e não foram reexecutados após a mudança de estrutura.
