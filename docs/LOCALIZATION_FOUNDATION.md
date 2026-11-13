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
- `overviewFormat.ts` and `userFacingInterpretation.ts` are deliberately not localized or modified. Their English vocabulary is canonical formatter output; only surrounding static UI labels are translated. This keeps formatter values stable across languages and preserves existing contract/tests.
- Hindi language switching changes presentation only; it does not reset form input or trigger analysis/controller work.

## PR-I18N-006 — Dynamic enum labels
- Canonical enum values are rendered through the typed `src/i18n/enumLabels.ts` registry and the `enums` namespace. Registry members are checked against both locales.
- Enum labels and badges are presentation-only. Do not translate canonical enum values or identifiers in data, engine contracts, persisted state, or API payloads.
- Keep domain prose unchanged, including `period.statement`, `dasha.currentActivation`, `axis.diagnostic`, `unavailableReason`, `alternativeExplanation`, `reasons`, `counterEvidenceReasons`, and `evidence.statement`. Evidence/rule IDs and `methodVersion` also remain canonical.
- Planet, rashi, and nakshatra names remain canonical English data. `overviewFormat.ts` and `userFacingInterpretation.ts` remain English per the documented formatter decision.

## Remaining work
The planned static-UI migration is implemented across the birth form, chart and research tools, career/wealth detail views, reasoning, full natal reports, and app fallback surfaces. `translationParity.test.ts` checks that all declared namespaces have matching English/Hindi keys, every resource namespace is registered with i18next, statically referenced keys exist in both locales, and computed career/wealth key families remain present.

Remaining release work:
- Browser acceptance in Hindi covered Overview, Career, Wealth, Dasha, Reports, and Research: no raw enum badges or `ns:key` strings appeared; `html lang="hi"` and the selected language persisted after reload.
- The birth-form modal includes a compact language switcher within its focus-managed dialog; automated tests cover switching language while retaining unsaved form input.
- Complete the remaining static-copy localization in `DashaHero`; its page title and supporting UI copy are still English.
- Have a native Hindi reviewer review Jyotish terminology and phrasing before release, including बृहस्पति vs गुरु, चंद्र vs चंद्रमा, प्रत्यंतरदशा spelling, and धन/व्यवसाय/साक्ष्य distinctions. Do not mark this migration release-ready until that review is complete.
- Keep canonical IDs, enum/status/contract values, chart data, and engine-generated prose unchanged; formatter output from `overviewFormat.ts` and `userFacingInterpretation.ts` remains intentionally English.

## Validation
`npm run lint` and `npm run build` pass. The full `npx vitest --run` run completed with 372 passing files and 2 failing files (6,507 passed tests, 4 skipped): the existing RG-09 fixture guard (`CALCULATION_REFERENCE_FIXTURES` is empty) and a stale `WealthPage` status-label assertion. After updating the assertion to the rendered English label, the focused `WealthPage` and enum-registry tests pass (14/14).

Do not treat this migration as release-ready until native Hindi/Jyotish terminology review is complete.