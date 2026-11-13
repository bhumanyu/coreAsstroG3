# Localization Foundation — PR-I18N-001 / PR-I18N-002 slice

This branch implements the first localization foundation for CoreAstroG3 based on the approved English/Hindi localization blueprint.

## Product decisions applied
- English is the deterministic default unless a valid explicit language preference is stored.
- Hindi uses professional, simple language with Jyotish terminology.
- Locales: `en-IN` and `hi-IN`; formatters request Western digits with `numberingSystem: "latn"`.
- Language selection persists under `coreastro.language`.
- Language switching does not call analysis/controller methods.
- Missing translations fall back to English.
- Canonical domain values, engine IDs, calculation outputs and evidence remain unchanged.

## Repository-specific implementation
- React 18, TypeScript 5.7, Vite 6 and Vitest 4.
- Header: `src/components/Header.tsx`; app shell: `src/app/AppShell.tsx`.
- Existing theme state remains isolated in `ThemeContext`.
- Localization is initialized before React renders.
- Header switcher is available in desktop and mobile layouts.
- Translation convention: each component uses `useTranslation('namespace')` for its UI-copy namespace.
- Namespaces: `common`, `navigation`, `settings`, `birthForm`, `dateTime`, `validation`, `profiles`, `dashboard`, `astrology`, `dasha`, `career`, `wealth`, `reports`, `research`, `errors`, `chartExport`, and `chartSharing`.

## Added
- `src/i18n/config.ts`, `resources.ts`, `i18n.ts`, `languageManager.ts`, `localeUtils.ts`.
- `src/components/language/LanguageSwitcher.tsx`.
- Tests for persistence, switching, Western digits and resource parity.

## PR-I18N-003 Phase 4 static UI
- Phase 4 adds bilingual static copy for overview, career/wealth page navigation and state surfaces, Dasha/timing status and controls, reasoning and evidence-confidence surfaces, financial facts/disclaimers, AI status, and product/theme report headers through the existing `useTranslation('namespace')` convention.
- Canonical planetary and chart data, engine-generated interpretation/report prose, AI narrative text, status/enum/contract identifiers and API/calculation data remain unchanged.
- `overviewFormat.ts` remains English, and `userFacingInterpretation.ts` currently uses its English copy provider. The latter exposes a copy-provider seam for future localization without changing canonical enum values; only surrounding static UI labels are translated in this phase.
- Hindi language switching changes presentation only; it does not reset form input or trigger analysis/controller work.

## PR-I18N-006 — Dynamic enum labels
- Canonical enum values are rendered through the typed `src/i18n/enumLabels.ts` registry and the `enums` namespace. Registry members are checked against both locales.
- Apply this four-category rule consistently:
  1. **Static UI copy** (headings, buttons, explanations written by the interface) is translated through the component's namespace.
  2. **Display enums/classifications** (including confidence, status, effect, profession and dimension labels) are translated at render time through `enumLabel`; unknown values fall back to their raw value, never a translation key.
  3. **Canonical identifiers and provenance** (IDs, rule/evidence references, method versions, source/reference IDs, persisted/API values) remain unchanged. Chart-source classifications such as `NATAL`, `D10`, and `TRANSIT` are display enums where explicitly registered; provenance/reference identifiers remain raw.
  4. **Domain-generated prose** remains unchanged, including `period.statement`, `dasha.currentActivation`, `axis.diagnostic`, `unavailableReason`, `alternativeExplanation`, `reasons`, `counterEvidenceReasons`, `contribution.explanation`, and `evidence.statement`.
- Enum labels and badges are presentation-only. Never translate canonical enum values or identifiers in data, engine contracts, persisted state, or API payloads.
- `candidate.candidateId`, `patternIds`, `ruleId`, `evidenceId`, `sourceIds`, unresolved mechanism IDs, occurrence IDs, and `methodVersion` remain canonical. Ranking diagnostics are currently typed as `string[]` in the domain contract, so known codes have registered labels while unknown codes safely display their original code.
- Planet, rashi, and nakshatra names remain canonical English data. `overviewFormat.ts` and `userFacingInterpretation.ts` remain English per the documented formatter decision.
- Evidence `title` and `statement` fields are domain-generated English content, not static component copy or display enums. They remain unchanged in this migration and are deferred to a separate domain-prose localization pass.

## Remaining work
The planned static-UI migration is implemented across the birth form, chart and research tools, career/wealth detail views, reasoning, full natal reports, and app fallback surfaces. `translationParity.test.ts` checks that all declared namespaces have matching English/Hindi keys, every resource namespace is registered with i18next, statically referenced keys exist in both locales, and computed career/wealth key families remain present.

Remaining release work:
- Hindi browser acceptance was completed across Overview, Career, Wealth, Dasha, Reasoning, detailed Reports, and the Research/Developer tools routes. The visible-page scan found no exact raw display-enum tokens or `ns:key` strings; the app reported `html lang="hi"`. Hindi persistence across reload was verified separately.
- The birth-form modal includes a compact language switcher within its focus-managed dialog; automated tests cover switching language while retaining unsaved form input.
- Have a native Hindi reviewer review Jyotish terminology and phrasing before release, including बृहस्पति vs गुरु, चंद्र vs चंद्रमा, प्रत्यंतरदशा spelling, and धन/व्यवसाय/साक्ष्य distinctions. Do not mark this migration release-ready until that review is complete.
- Keep canonical IDs, enum/status/contract values, chart data, and engine-generated prose unchanged; `overviewFormat.ts` and the current `userFacingInterpretation.ts` copy provider remain intentionally English.

## Validation
Latest follow-up validation: `npm run lint` passed; `npm run build` passed with the existing large-chunk warning; focused enum/report tests passed (5 files, 67 tests). The full Vitest suite passed 373 of 374 files (6,513 passed tests, 4 skipped); its sole failure is the RG-09 fixture guard because `CALCULATION_REFERENCE_FIXTURES` is empty. This remains an external-validation blocker; do not fabricate fixtures to force it to pass. Stale assertions should be updated to assert the rendered localized labels.

Do not treat this migration as release-ready until native Hindi/Jyotish terminology review is complete.