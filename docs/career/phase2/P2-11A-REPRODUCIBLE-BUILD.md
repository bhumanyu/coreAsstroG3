# P2-11A: Reproducible Build Baseline

**Status**: Build and bundle scan pass locally; full verification is blocked by UI test failures. Remote CI is pending.

## Package Manager and Toolchain

- npm is authoritative; `package-lock.json` (lockfileVersion 3) is the dependency lockfile.
- `.nvmrc` pins Node `22.20.0`; `package.json` permits Node `^22.20.0`.
- `package.json` pins npm `10.9.2` through `engines.npm` and `packageManager`.
- `.node-version` is not present.

The Node pin is based on the locked dependency engines, not a tooling preference. `@testing-library/jest-dom@7.0.1` requires Node `>=22`, and the Linux x64 optional package `@napi-rs/lzma-linux-x64-gnu@1.5.1` requires `^22.20 || ^24.12 || >=25`. Node `22.20.0` satisfies both. Vite `6.4.4` accepts `^18 || ^20 || >=22`, and lightningcss `1.32.0` accepts Node `>=12`; neither imposes a stricter requirement.

## Bundle Scan Ordering

CI checks out `${{ github.sha }}` and runs, in order:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run verify:bundle`

The normal Vitest configuration excludes the bundle-dependent boundary test from the Node test project. `test:bundle` runs it with `vite.bundle.config.ts`; `verify:bundle` first runs a fresh production build and then `test:bundle`. The boundary test fails with an explicit build-first message if `dist/assets` is missing, and also requires at least one emitted JavaScript asset before checking the existing security markers.

## Local Verification Record

Validation ran in a fresh temporary worktree at the source revision below, with the current infrastructure changes copied in, using `npm ci` before the other commands. The worktree had no `dist` output before the negative boundary-test check.

| Item | Result |
|---|---|
| Source commit checked out | `d0cf1c909f0c789d7103b1ca72faf2e90c5cb3c1` |
| Final PR/source-change commit | Not available; changes are uncommitted |
| Node actually used | `v22.20.0` |
| npm actually used | `10.9.2` |
| SHA-256 of `package-lock.json` | `01076AA49B3EB9E68FE4C70BDEDE98BBD49AEA9D4F3FE03E15C22AC39BEDAEE4` |

| Command | Exit code | Result |
|---|---:|---|
| `npm ci` | 0 | Installed 178 packages; no engine warnings. npm reported 2 moderate audit findings. |
| `npm run lint` | 0 | `tsc --noEmit` passed. |
| `npm test` | 1 | 320 test files: 318 passed, 2 failed; 5,822 tests passed, 3 failed, 4 skipped. Failures were direct-navigation UI assertions in `src/app/ProductPageRouter.test.tsx` and a UI integration timeout in `src/App.test.tsx`. |
| `npm run build` | 0 | Production assets emitted. Vite reported a large-chunk advisory. |
| `npm run verify` | 1 | Lint passed; the test step failed before `verify:bundle`. This run had 318 test files passed and 2 failed (5,823 passed, 2 failed, 4 skipped), with UI navigation assertions. |
| `npm run verify:bundle` | 0 | Fresh build completed and both browser-boundary tests passed. |

The observed UI test failures are recorded without classifying them as pre-existing or caused by this change; no baseline comparison established their origin. The bundle prerequisite was separately verified: running `npm run test:bundle` with `dist` absent exited 1 and reported `dist/assets missing — run \`npm run build\` before this test; it is invoked by \`verify:bundle\``.

## CI Status

Remote CI for the final source-change SHA is pending because this change has not been committed or pushed. Do not treat the local source revision above as the final PR SHA.
