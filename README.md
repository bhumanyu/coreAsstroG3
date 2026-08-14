# CoreAstroEngine

PR-001A Repository Foundation

## Architecture
- React 18
- TypeScript
- Vite (development, build, and preview)
- Vitest (test runner)
- Tailwind CSS v4

## Getting Started
- `npm run dev`: Start the development server
- `npm test`: Run the test suite with Vitest
- `npm run build`: Compile and build production assets

## Vimshottari Dasha Engine (PR-041)
- **Year Length Convention**: 1 Vimshottari year = 365.25 days; this materially affects MD/AD/PD boundaries and must match the chosen reference software/source (`VIMSHOTTARI_YEAR_DAYS`).
- **Date Arithmetic**: Fractional years added via deterministic date arithmetic (`addFractionalYears`).
- **Tiling Guarantees**: Continuous MD → AD → PD tiling with zero cumulative drift or gap.
- **Integration**: `getActiveDasha` state maps directly to PR-039 `DashaState` for transit correlation.
