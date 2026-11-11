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

## Remaining work
This is the foundation/shell milestone, not complete bilingual UI. Birth form, detailed analysis, charts, career, wealth, Dasha, research, validation, AI interpretations and report/export content still require incremental migration. Hindi terminology needs Jyotish review before release.

## Validation
Tests have been added but have not been executed in this GitHub-only editing environment. Regenerate package-lock with the repository-pinned Node/npm toolchain, then run `npm ci`, `npm run lint`, focused Vitest tests and `npm run build`. Do not treat this PR as release-ready before those checks and browser state-preservation acceptance pass.