# A05 — Dasha Authority and Temporal Regression

## Status

Implementation branch: `feat/a05-dasha-authority-regression`  
Base: `main` at `0de9362f2c6d7229872c7b5a722edf064f983e7b`  
Scope: temporal-authority regression coverage; no Dasha mathematics redesign.

## Canonical ownership

`resolveAnalysisTemporalState(horoscope, context)` remains the sole product temporal authority. It derives the active report for the immutable `AnalysisContext.asOf` through `resolveDashaInterpretationForAsOf`.

The full horoscope Vimshottari timeline/report is distinct from the active MD/AD/PD selection for one requested analysis instant. Embedded `horoscope.dashaInterpretation.current` is not authoritative for a new analysis.

## Verified existing implementation

- `src/core/analysis/resolveAnalysisTemporalState.ts`: validates context timestamp, derives the date, invokes the date-specific resolver, and freezes the returned state/report.
- `src/engine/dashaInterpretation/resolveDashaForAsOf.ts`: recalculates using `horoscope.vimshottari` and related canonical inputs. When an explicit valid date is supplied and recalculation throws or returns no active period, it returns `undefined`; it does not return the embedded report.
- `src/product/life-analysis/lifeAnalysisProductService.ts`: resolves temporal state once and passes the same object to Career, Wealth, view-model projection and AI explanation.
- `src/product/analysis/__tests__/canonicalPath.test.ts`: already contains identity assertions for the canonical ProductAnalysis path.
- `src/engine/validation/temporalCalculationValidation.test.ts`: already tests an Antardasha boundary with half-open interval semantics.

## Added regression coverage

`src/core/analysis/resolveAnalysisTemporalState.test.ts` adds assertions for:

1. Preserving the complete Dasha timeline while replacing active-current state for the requested date.
2. Missing canonical Vimshottari data remaining unavailable even when an embedded active report exists.
3. Resolving MD/AD/PD at a requested instant from the canonical timeline.
4. Preserving report availability metadata on the embedded source while the recomputed state remains unavailable.
5. Passing the same `AnalysisTemporalState` object to the product Career, Wealth and AI execution consumers.

## State semantics

A missing active report is represented by the existing optional `dashaInterpretation` field being `undefined`. This is not silently converted into an embedded active period. Product-level status behavior remains governed by the existing product contract; A05 does not introduce a new status enum or make all missing Dasha data fatal.

## Existing boundary coverage

The engine temporal validation suite tests the exact Antardasha boundary using the resolver, with `before = boundary - 1ms` and `at = boundary`, consistent with the existing half-open interval contract. A05 does not modify period boundary arithmetic.

## Non-goals

- No redesign of Vimshottari calculation or MD/AD/PD mathematics.
- No change to the complete horoscope Dasha timeline contract.
- No change to C11, CW-05, or their synthesis authority.
- No parallel temporal resolver.
- No new product status vocabulary.

## Validation record

The GitHub connector used for this implementation can inspect repository files and write Git objects, but it does not execute npm scripts or GitHub Actions commands. Therefore the following are **NOT RUN in this environment** and must be executed locally or by CI on the branch:

- `npm run lint`
- `npm test -- --run src/core/analysis/resolveAnalysisTemporalState.test.ts`
- `npm test -- --run src/engine/validation/temporalCalculationValidation.test.ts`
- `npm run build`

No test or build success is claimed by this report.
