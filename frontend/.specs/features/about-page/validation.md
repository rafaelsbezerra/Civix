# About Page Validation

> **Auditoria de estado — 2026-10-10:** este documento preserva decisões, checkboxes e resultados históricos. A vigência dos requisitos antigos está **Aguardando resposta**. Não restaurar layout, reabrir escopo ou declarar gates atuais aprovados sem confirmação e evidência.
> AppRoute não registra /sobre; About aparece dentro da Home. dashboard.png e macbook-silver.png do manifest histórico não existem no checkout; AboutVisual usa macbook.png e não renderiza dashboard. Não foi decidido restaurar a composição original ou aceitar essas divergências.
> Revisão consolidada: [pendências das specs](../../reviews/revisao-pendencias-specs.md).

## Validação histórica: PASS ✅

**Historical date**: 2026-08-24
**Spec**: `.specs/features/about-page/spec.md`  
**Diff range**: `009eab0..c7a20e2`  
**Branch**: `feature/about-page`  
**Verifier**: independent sub-agent (author ≠ verifier)

The third and final fix cycle closes the two remaining evidence gaps. The browser gate now proves canonical responsive order below `1024 px` and repeats the full non-occlusion matrix at 200% text zoom. All four full-gate commands pass, and both scratch-only mutants are killed.

---

## Task Completion

| Tasks | Declared status | Verifier status | Notes |
| --- | --- | --- | --- |
| T1–T8 | ✅ Complete | ✅ Done | Prior implementation and evidence remain green. |
| T9 | ✅ Complete | ✅ Done | Responsive order and complete zoom assertions are executable and discriminating. |

All nine tasks are complete. No task is blocked or partial.

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion expression | Verdict |
| --- | --- | --- | --- |
| ABT-01 | `/sobre` renders About without redirect. | `src/routes/AppRoute.test.tsx:8-21` renders `MemoryRouter initialEntries={['/sobre']}` and asserts the exact About `h1` plus principles region. | ✅ PASS |
| ABT-02 | Exactly one `h1` with `Transformamos atendimento em oportunidades.` | `src/pages/About.test.tsx:10-18` asserts `getAllByRole('heading', { level: 1 })` has length `1` and the exact accessible name exists. | ✅ PASS |
| ABT-03 | Exact canonical marker and institutional paragraph. | `src/pages/About.test.tsx:21-32` asserts exact `//`, exact `Sobre nós`, and the full canonical introduction with `toHaveTextContent(...)`. | ✅ PASS |
| ABT-04 | Valor, Visão and Missão appear in order with exact descriptions. | `src/components/about/AboutPrinciples.test.tsx:7-15` asserts `['Valor', 'Visão', 'Missão']`; `:18-31` asserts all three canonical descriptions. | ✅ PASS |
| ABT-05 | Urbanist is computed for marker/title/principle names; Inter for supporting text. | `scripts/verify-about-browser.mjs:232-271` reads computed `fontFamily`; `:270-271` matches every display role to `Urbanist Variable` and every supporting role to `Inter Variable`. | ✅ PASS |
| ABT-06 | Exact `#07192A`, `#D89C28`, `#9A6500`, `#FAF9F6` role mapping. | `scripts/verify-about-browser.mjs:241-269` asserts the four root tokens and computed background/text role colors; `tests/aboutAssets.test.ts:8-24` pins all ornament/export bytes by canonical SHA-256. | ✅ PASS |
| ABT-07 | All six approved assets are the exact local exports and are rendered. | `tests/aboutAssets.test.ts:8-24` checks six exact hashes; `src/components/about/AboutVisual.test.tsx:7-32` asserts four rendered sources; `src/components/about/AboutPrinciples.test.tsx:34-50` asserts the two dividers. | ✅ PASS |
| ABT-08 | At `1728×760`, every reference rectangle is within `±4 px`. | `scripts/verify-about-browser.mjs:5-30` defines the exact reference rectangles and tolerance; `:134-139` measures and checks marker, heading, introduction, laptop, scribble, principles, and frame. | ✅ PASS |
| ABT-09 | Below `1024 px`, copy, visual, and principles form canonical vertical flow without overlap. | `scripts/verify-about-browser.mjs:141-184` executes at `320` and `768`; `:164-169` checks every copy pair; `:170-171` asserts `marker.bottom <= heading.top` and `heading.bottom <= introduction.top`; `:172-181` asserts copy → visual → principles, each heading/description non-overlap and containment, and adjacent article order. Mandatory mutant M1 is killed at `:170`. | ✅ PASS |
| ABT-10 | At `320 px`, `scrollWidth === clientWidth` and every essential text node stays in document bounds. | `scripts/verify-about-browser.mjs:95-100` enumerates marker, title, introduction, three principle headings, and three descriptions; `:141-161` checks width equality and left/right/top/bottom bounds, including `320 px`. | ✅ PASS |
| ABT-11 | Controlled delayed assets keep CLS `<= 0.1`. | `scripts/verify-about-browser.mjs:283-300` installs a buffered layout-shift observer, delays PNG/SVG requests by `150 ms`, accumulates CLS, and asserts `cls <= 0.1`. | ✅ PASS |
| ABT-12 | One `main`, one named section, exactly one `h1`. | `src/pages/About.test.tsx:7-18` directly asserts all three semantic outcomes. | ✅ PASS |
| ABT-13 | All six visual assets have `alt=""` and `aria-hidden="true"`. | `src/components/about/AboutVisual.test.tsx:7-17` asserts the four visual images; `src/components/about/AboutPrinciples.test.tsx:34-44` asserts the two divider images. | ✅ PASS |
| ABT-14 | Required contrast ratios pass, marker uses accessible gold, and 200% text zoom preserves complete readable flow. | `scripts/verify-about-browser.mjs:258-281` asserts exact colors and computes all role contrast thresholds. `:187-228` doubles every essential font, reasserts horizontal and vertical bounds, all copy pairs and order, copy → visual → principles, every heading/description non-overlap and containment, and adjacent articles. M2 is killed at `:222`. | ✅ PASS |
| ABT-15 | With Figma unavailable, all six assets come from the local production bundle. | `scripts/verify-about-bundle.mjs:5-22` requires all six manifest entries and emitted files; `:24-38` rejects emitted Figma/MCP URLs; `package.json:9` runs the verifier in the production build. | ✅ PASS |

**Matched**: 15/15 ACs.  
**Spec-precision gaps**: 0.  
**Evidence gaps**: 0.

---

## Final Gap Recheck

| Previous gap | Final evidence |
| --- | --- |
| ABT-09 did not discriminate marker → heading → introduction below `1024 px`. | ✅ Closed at `scripts/verify-about-browser.mjs:170-171`; M1 reorders the marker after heading/introduction and fails at line 170. |
| ABT-14 omitted the full pairwise, containment, bounds, and adjacent-article matrix at 200% text zoom. | ✅ Closed at `scripts/verify-about-browser.mjs:200-228`; M2 creates a zoom-only description overflow and fails at line 222. |

---

## Discrimination Sensor

The lightweight sensor ran in the isolated local clone `%TEMP%/civix-about-release-5092093453bd42539eec0aa98d106aa9` at `c7a20e2`. A `node_modules` junction required a scratch-only `server.fs.allow` accommodation. The accommodated scratch baseline emitted the same browser PASS as the real tree. Its process retained a junction-related handle after the checks completed and was stopped only after the PASS output. Both mutant runs exited normally with assertion failures. The scratch was deleted.

| Mutation | Scratch file:line | Behavioral fault | Covering command | Result |
| --- | --- | --- | --- | --- |
| M1, mandatory prior survivor | `src/pages/About.tsx:15,22` | Added sub-`2xl` CSS ordering that renders marker after heading/introduction while preserving desktop geometry. | `npm run test:e2e` | ✅ Killed at `scripts/verify-about-browser.mjs:170`: `layout.marker.bottom <= layout.heading.top` was false. |
| M2, zoom containment | `src/components/about/AboutPrinciples.tsx:37` | Fixed each mobile principle article to `140 px`, sufficient at normal size but too short at 200% text. | `npm run test:e2e` | ✅ Killed at `scripts/verify-about-browser.mjs:222`: zoomed description exceeded its article bounds. |

**Sensor depth**: lightweight, 2 targeted behavior mutations.  
**Result**: 2/2 killed, PASS ✅.

**Isolation**: no scratch mutation touched the real worktree. An unrelated `Home.tsx` modification appeared externally after the full gate and before the sensor; it was preserved byte-for-byte. The real porcelain immediately before sensor work and after scratch deletion was identical:

```text
 M frontend/src/pages/Home.tsx
?? frontend/.specs/LESSONS.md
?? frontend/.specs/features/about-page/validation.md
?? frontend/.specs/lessons.json
```

The branch and HEAD remained `feature/about-page` / `c7a20e2263a96fcd9fff1617ce8f6ab17ef1eeef`.

---

## Gate Check

- **Full gate commands**: `npm test -- --run`; `npm run test:e2e`; `npm run lint`; `npm run build`.
- **Unit/integration**: 11 files passed, 46 tests passed, 0 failed, 0 skipped.
- **Browser**: passed desktop geometry, responsive bounds/order/non-overlap, complete 200% text-zoom matrix, computed typography/palette/contrast, and CLS.
- **Lint**: passed with zero reported errors or warnings.
- **Build**: passed; TypeScript and Vite completed, 1,842 modules transformed.
- **Bundle**: all six local About assets were emitted; no remote Figma/MCP URL was found.
- **Test count at `009eab0`**: 32 total, 17 passed and 15 failed, as recorded by the initial independent verification.
- **Test count at `c7a20e2`**: 46 total, 46 passed.
- **Delta**: +14 tests; no test decrease and no skips.
- **Non-fatal unit diagnostics**: jsdom printed CSS parse messages and one unimplemented navigation diagnostic; Vitest exited 0.

**Gate result**: 4/4 commands passed.

---

## Edge Cases

| Edge case | Assessment | Evidence |
| --- | --- | --- |
| `320 px` stack without clipping or horizontal overflow | ✅ | `scripts/verify-about-browser.mjs:141-184` checks width, nine essential bounds, strict copy order, macroblocks, principles, and overlap. |
| 200% text zoom preserves order and prevents asset/text occlusion | ✅ | `scripts/verify-about-browser.mjs:187-228` runs the complete bounds, order, overlap, containment, and adjacency matrix. |
| Font loading fallback keeps content visible | ✅ | `src/index.css:16-17` defines `sans-serif` fallbacks; rendering is not gated on font readiness. |
| Backend JavaScript unavailable | ✅ | `src/pages/About.tsx:5-47` is static presentation with no fetch, data hook, or backend call. |
| Figma unavailable | ✅ | `scripts/verify-about-bundle.mjs:5-38` verifies local emitted assets and rejects remote design URLs during build. |

---

## Code Quality

| Check | Status | Evidence |
| --- | --- | --- |
| Minimum code / no unnecessary flexibility | ✅ | The feature uses one page, two prop-free presentation components, and focused verification scripts. |
| Surgical scope | ✅ | Feature changes trace to the approved spec/tasks; no verifier fix was made. |
| Matches repository patterns | ✅ | React Router, co-located RTL/Vitest tests, Vite manifest checks, and local imports match the project. |
| Spec-anchored exact values | ✅ | Content, order, fonts, colors, hashes, geometry, CLS, contrast, and responsive/zoom outcomes have exact assertions. |
| Per-layer coverage | ✅ | Unit, integration, browser, and production-build layers all pass; both high-risk behavior mutants are killed. |
| Every test is claimed | ✅ | In-scope tests map to ABT criteria or T7–T9 done-when outcomes. |
| Test integrity | ✅ | No feature test was removed, weakened, or skipped; count increased by 14. |
| Diff hygiene | ⚠️ Cosmetic only | `git diff --check 009eab0..c7a20e2` reports one extra blank line at EOF in `.specs/features/about-page/design.md:167`; it does not affect an AC or gate. |

---

## Lessons Self-Check

This validation is a clean PASS with no surviving mutant, failed AC, spec-precision gap, gate failure, or `SPEC_DEVIATION`. Per `lessons.md`, no lesson was recorded. Existing untracked lesson artifacts were not modified.

---

## Summary

**Overall**: ✅ Ready  
**Spec-anchored check**: 15/15 ACs matched, 0 spec-precision gaps, 0 evidence gaps.  
**Gate**: 4/4 commands passed.  
**Sensor**: 2/2 targeted mutations killed.  
**Next step**: release review may proceed; no fourth fix cycle is required or permitted.
