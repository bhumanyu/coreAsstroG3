# Career/Wealth Reproducibility Baseline

## Baseline identity

- Source snapshot commit: `45c41269462c7a382c11896f384aa47865a43b26` (`phase 8`).
- Repository: `bhumanyu/coreAsstroG3`.
- Baseline working tree: clean (`git status --short` produced no entries before this documentation change).
- Repository working directory: `C:\Users\bhuma\astroMain\coreAsstroG3`.
- Authoritative Node version: `20.19.4` from `.nvmrc`.
- Declared package toolchain: Node `20.x`, npm `10.9.2`, `npm@10.9.2` from `package.json`.
- `package-lock.json` SHA256: `A905887D9A284F00FA7C5EB6606DEDAE1ED964F1E659C97CF1143B0925896BCA`.
- The shell's initial defaults were Node `v21.7.1` and npm `10.5.0`; all successful baseline install/test/build commands below used the pinned Node/npm pair via `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2`.
- Documentation placement: these records are co-located under `docs/product/period-based-career-wealth/`, the existing PBA source of truth. Career phase-two specifications remain under `docs/career/phase2/`; no parallel `docs/career-wealth/` tree was created.

No baseline runner was added. `verify` already runs lint, the full Vitest suite, `verify:bundle` (which builds and runs the browser-boundary test); invoking `npm run verify:bundle` separately would repeat gates already included by `npm run verify`.

## Existing CI and script contract

`.github/workflows/ci.yml` already:

1. Selects Node from `.nvmrc` and installs npm `10.9.2`.
2. Records commit SHA, Node/npm versions, and `package-lock.json` SHA256.
3. Asserts that `package-lock.json` is tracked.
4. Runs `npm ci`, `npm run lint`, `npm test`, and `npm run build`.

No CI, script, package manifest, or lockfile change was made. `package.json` currently defines `lint` as `tsc --noEmit`, `test` as `vitest run`, `verify` as `npm run lint && npm test && npm run verify:bundle`, and `verify:bundle` as `npm run build && vitest run src/ai/security/browserBoundary.test.ts`.

## Baseline command results

All commands in this section target source snapshot `45c41269462c7a382c11896f384aa47865a43b26` and the lock hash above.

| Command | Working directory | Start (local `+05:30`) | End (local `+05:30`) | Exit | Actual result |
|---|---|---|---|---:|---|
| `git rev-parse HEAD; git status --short; node --version; npm --version; Get-FileHash package-lock.json -Algorithm SHA256` | `C:\Users\bhuma\astroMain\coreAsstroG3` | Baseline capture, before install | Baseline capture, before install | 0 | SHA recorded above; no status entries; default shell was Node `v21.7.1` / npm `10.5.0`; lock hash recorded above. |
| `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2 -- npm ci` | `C:\Users\bhuma\astroMain\coreAsstroG3` | `2026-10-26T22:48:37.2175176+05:30` | `2026-10-26T22:48:50.1819994+05:30` | `-4048` | **FAILED / environment:** Windows `EPERM` while unlinking `node_modules\lightningcss-win32-x64-msvc\lightningcss.win32-x64-msvc.node`. The output identified a running Vite process in this worktree; it was not stopped. |
| `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2 -- npm ci` | `C:\Users\bhuma\AppData\Local\Temp\coreastro-baseline-45c4126` (detached clean worktree at the same SHA) | `2026-10-26T22:49:51.2157358+05:30` | `2026-10-26T22:50:23.0135678+05:30` | 0 | **PASS:** installed 178 packages. npm emitted `EBADENGINE` for `@testing-library/jest-dom@7.0.1` (requires Node `>=22`; current was the repository-pinned Node `20.19.4`), a deprecation warning, and reported 2 moderate audit findings. The pinned runtime nevertheless completed install and tests. |
| `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2 -- npm run verify` | Same detached clean worktree | `2026-10-26T22:50:29.4021186+05:30` | `2026-10-26T22:53:46.9934089+05:30` | 1 | **FAILED / clean-checkout precondition:** lint passed; Vitest reported 319 files passed, 1 failed; 5,785 passed, 4 skipped, 1 failed. `src/ai/security/browserBoundary.test.ts` failed because `dist/assets` did not exist before the test suite. |
| `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2 -- npm run build` | Same detached clean worktree | `2026-10-26T22:54:04.9942179+05:30` | `2026-10-26T22:54:17.4915934+05:30` | 0 | **PASS:** Vite production build completed and populated `dist/assets`. Existing large-chunk-size warning remained. This was an explicit precondition setup, not a script or source change. |
| `npm exec --yes --package=node@20.19.4 --package=npm@10.9.2 -- npm run verify` | Same detached clean worktree, after the preceding build | `2026-10-26T22:54:22.4026777+05:30` | `2026-10-26T22:57:57.1234104+05:30` | 0 | **PASS after prebuilding:** lint passed; 320 test files passed; 5,786 tests passed, 4 skipped; `verify:bundle` built successfully and its browser-boundary test passed (1 file, 2 tests). |

The first pristine `verify` attempt remains a recorded failure; the later passing run required `dist/assets` to have been produced first. This is a verified ordering/precondition sensitivity in the existing browser-boundary test, not a change to that test or the verification script. The `verify` script itself ran the bundle check; no separate `npm run verify:bundle` gate was run.

The detached worktree and its generated artifacts were temporary test infrastructure. They did not change the baseline source SHA or lockfile.

## Focused test inventory and results

Each command below was run separately as `npx vitest run <path>` through the pinned Node/npm package runner. Common working directory: `C:\Users\bhuma\AppData\Local\Temp\coreastro-baseline-45c4126`, a detached clean worktree at source SHA `45c41269462c7a382c11896f384aa47865a43b26`. Common lock hash: `A905887D9A284F00FA7C5EB6606DEDAE1ED964F1E659C97CF1143B0925896BCA`. Every command exited `0`; no test was skipped in the focused runs.

| Exact focused command | Runner result | Start (`+05:30`) | End (`+05:30`) | Exit |
|---|---|---|---|---:|
| `npx vitest run src/domain/career/careerMechanism/careerMechanismTypes.test.ts` | 1 file; 40 passed | `2026-10-26T22:59:25.0742359+05:30` | `2026-10-26T22:59:30.7277741+05:30` | 0 |
| `npx vitest run src/domain/career/careerMechanism/resolver/careerMechanismResolver.test.ts` | 1 file; 26 passed | `2026-10-26T22:59:30.7277741+05:30` | `2026-10-26T22:59:35.8954194+05:30` | 0 |
| `npx vitest run src/domain/career/orchestration/canonicalCareerOrchestrator.test.ts` | 1 file; 63 passed | `2026-10-26T22:59:35.8954194+05:30` | `2026-10-26T22:59:41.1011422+05:30` | 0 |
| `npx vitest run src/domain/career/orchestration/canonicalCareerFoundationBuilder.test.ts` | 1 file; 27 passed | `2026-10-26T22:59:41.1021436+05:30` | `2026-10-26T22:59:54.6973375+05:30` | 0 |
| `npx vitest run src/domain/career/careerProfession/careerProfessionEngine.test.ts` | 1 file; 32 passed | `2026-10-26T22:59:54.6973375+05:30` | `2026-10-26T22:59:59.8205089+05:30` | 0 |
| `npx vitest run src/domain/career/careerProfession/careerProfessionBoundary.test.ts` | 1 file; 25 passed | `2026-10-26T22:59:59.8215083+05:30` | `2026-10-26T23:00:05.1174873+05:30` | 0 |
| `npx vitest run src/domain/career/careerPatternQualification/careerPatternQualification.test.ts` | 1 file; 78 passed | `2026-10-26T23:00:05.1184899+05:30` | `2026-10-26T23:00:12.9819361+05:30` | 0 |
| `npx vitest run src/domain/evidence/evidenceSourceTypes.test.ts` | 1 file; 29 passed | `2026-10-26T23:00:12.9819361+05:30` | `2026-10-26T23:00:23.8635994+05:30` | 0 |
| `npx vitest run src/domain/career/careerDasha/careerDashaIntegration.test.ts` | 1 file; 37 passed | `2026-10-26T23:00:23.8635994+05:30` | `2026-10-26T23:00:36.7162909+05:30` | 0 |
| `npx vitest run src/domain/wealth/wealthEvidenceMapper.test.ts` | 1 file; 27 passed | `2026-10-26T23:00:36.7162909+05:30` | `2026-10-26T23:00:47.1532007+05:30` | 0 |
| `npx vitest run src/domain/wealth/selectedWealthDashaActivation.test.ts` | 1 file; 61 passed | `2026-10-26T23:00:47.1577620+05:30` | `2026-10-26T23:00:54.4163488+05:30` | 0 |
| `npx vitest run src/domain/synthesis/selectedPeriodSynthesis.test.ts` | 1 file; 87 passed | `2026-10-26T23:00:54.4182429+05:30` | `2026-10-26T23:01:01.8979771+05:30` | 0 |
| `npx vitest run src/product/analysis/productAnalysisMapper.test.ts` | 1 file; 29 passed | `2026-10-26T23:01:01.8979771+05:30` | `2026-10-26T23:01:06.8694546+05:30` | 0 |
| `npx vitest run src/product/analysis/selectedPeriodProductService.test.ts` | 1 file; 19 passed | `2026-10-26T23:01:06.8694546+05:30` | `2026-10-26T23:01:15.8023447+05:30` | 0 |
| `npx vitest run src/product/analysis/productAnalysisService.integration.test.ts` | 1 file; 33 passed | `2026-10-26T23:01:15.8023447+05:30` | `2026-10-26T23:01:35.6865385+05:30` | 0 |
| `npx vitest run src/features/chart-export/chartExportMapper.test.ts` | 1 file; 5 passed | `2026-10-26T23:01:35.6865385+05:30` | `2026-10-26T23:01:47.5203474+05:30` | 0 |
| `npx vitest run src/features/chart-export/chartExportSchema.test.ts` | 1 file; 5 passed | `2026-10-26T23:01:47.5209683+05:30` | `2026-10-26T23:01:52.7419697+05:30` | 0 |
| `npx vitest run src/components/dasha/__tests__/DashaComponents.test.tsx` | 1 file; 30 passed | `2026-10-26T23:05:21.4017094+05:30` | `2026-10-26T23:05:31.4948845+05:30` | 0 |
| `npx vitest run src/pages/__tests__/DashaPage.test.tsx` | 1 file; 13 passed | `2026-10-26T23:05:31.5020802+05:30` | `2026-10-26T23:05:39.5140509+05:30` | 0 |
| `npx vitest run src/domain/career/__tests__/goldenCareerAcceptance.test.ts` | 1 file; 30 passed | `2026-10-26T23:01:52.7473910+05:30` | `2026-10-26T23:02:08.6472700+05:30` | 0 |
| `npx vitest run src/test/fixtures/canonicalChart.test.ts` | 1 file; 11 passed | `2026-10-26T23:02:08.6472700+05:30` | `2026-10-26T23:02:19.3489167+05:30` | 0 |

Focused total: 21 files, 707 tests passed, 0 failed, 0 skipped.
