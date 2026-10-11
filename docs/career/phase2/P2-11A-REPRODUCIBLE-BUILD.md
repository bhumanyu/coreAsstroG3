# P2-11A: Reproducible Build Baseline

**Status**: IMPLEMENTED — VERIFICATION PENDING

## Overview

This document establishes a trustworthy, reproducible build/verification baseline before any Career-path changes. This is a P0 "first gate" milestone.

## Package Manager Confirmation

**Package Manager**: npm

**Rationale**:
- `package.json` uses npm-style scripts (`npm run dev`, `npm run build`, `npm run lint`, `npm test`)
- CI workflow (`.github/workflows/ci.yml`) uses `npm ci` and `npm test`/`npm run build`
- No other package manager lockfiles are present (no `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`)
- Repository conventions and CI both assume npm

**Confirmed**: npm is the intended package manager for this project.

## Current State

### Commit SHA
Under review: `5eadede0` (HEAD of main branch)

### Existing Configuration
- `package.json`: npm-style scripts, no `engines` field
- `.github/workflows/ci.yml`: Node 20 pinned, runs `npm ci`, `npm test`, `npm run build`
- `tsconfig.json`: `strict: true`, `noUnusedLocals: false`, `noUnusedParameters: false`
- **No lockfile committed** (missing `package-lock.json`)
- **No ESLint configuration** exists
- **No `.nvmrc`** exists
- CI does **not** run `npm run lint` (type-check)

## Work Items

### 1. ✅ Package Manager Confirmation
- Confirmed npm as the intended package manager
- Recorded in this document

### 2. Package Lock Generation
- Generate `package-lock.json` using Node 20 and npm
- Commit the lockfile without editing dependency versions in `package.json`
- Verify clean reproducible install with `npm ci`

### 3. Node Version Pinning
- Add `.nvmrc` with `20`
- Add `engines` field to `package.json` with `"node": ">=20 <21"`
- Keep consistent with CI's `node-version: '20'` pin

### 4. CI Workflow Update
- Update `.github/workflows/ci.yml` to run: `npm ci` → lint/type-check → tests → build
- Add step for `npm run lint` before `npm test` and `npm run build`
- Enable npm caching via `setup-node` `cache: 'npm'`

### 5. ESLint Setup
- Add ESLint + `@typescript-eslint` to devDependencies
- Add React/React-hooks plugins appropriate for Vite + React + TS
- Create flat `eslint.config.js` configured for `src/**/*.{ts,tsx}`
- Add separate npm script `"lint:eslint": "eslint ."`
- Either keep `lint` as type-check with combined `"verify": "tsc --noEmit && eslint ."` or make `lint` run both
- Run ESLint and fix/suppress safe issues; scope initial ruleset to recommended baseline
- Regenerate/commit updated `package-lock.json` after adding devDependencies

### 6. Verification Documentation
- Record exact tested commit SHA
- Record actual command outputs for: `npm ci`, `npm run lint`, `npm run lint:eslint` (if added), `npm test`, `npm run build`
- Record baseline test/type/lint FAILURES as pre-change baseline
- Do not fix unrelated failing tests in this milestone

## Exit Criteria

- [ ] Clean `npm ci` install succeeds from the committed lockfile
- [ ] CI runs lint/type-check (and ESLint if added), tests, and build in that order
- [ ] Recorded test results belong to the exact commit SHA under review (no borrowed results)
- [ ] Baseline failures (if any) are recorded before any subsequent Career-path changes

## Verification Results

*This section will be populated with actual command outputs and test results.*

### npm ci
```
(Pending)
```

### npm run lint (tsc)
```
(Pending)
```

### npm run lint:eslint (if added)
```
(Pending)
```

### npm test
```
(Pending)
```

### npm run build
```
(Pending)
```

## Remote CI Status

*Status will be updated after observing remote CI workflow results for the exact commit SHA.*
