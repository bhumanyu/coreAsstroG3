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

## Remaining work
This remains an incremental bilingual UI migration; static labels across all detailed career, wealth, Dasha, reasoning and full natal report cards should continue to move into these namespaces in follow-on slices. Birth form, chart, research, validation and export surfaces also need incremental migration. Hindi Jyotish terminology needs review before release.

## Validation
Tests have been added but have not been executed in this GitHub-only editing environment. Regenerate package-lock with the repository-pinned Node/npm toolchain, then run `npm ci`, `npm run lint`, focused Vitest tests and `npm run build`. Do not treat this PR as release-ready before those checks and browser state-preservation acceptance pass.