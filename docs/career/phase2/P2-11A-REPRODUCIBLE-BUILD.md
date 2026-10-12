# P2-11A: Reproducible Build Baseline

**Status**: IMPLEMENTED — VERIFICATION PENDING

## Overview

This document establishes a trustworthy, reproducible build/verification baseline before any Career-path changes. This is a P0 "first gate" milestone.

## Package Manager Authority

**Authoritative Package Manager**: npm

**Lockfile Authority Decision**: npm is the authoritative package manager. `package-lock.json` (lockfileVersion: 3) is the committed lockfile and source of truth for dependency resolution.

**Rationale**:
- `package.json` uses npm-style scripts (`npm run dev`, `npm run build`, `npm run lint`, `npm test`)
- CI workflow (`.github/workflows/ci.yml`) uses `npm ci` and `npm test`/`npm run build`
- npm is explicitly declared via `packageManager` field in `package.json`
- Previous `bun.lock` has been removed from the repository to avoid lockfile conflicts
- CI toolchain is pinned to Node 20.19.4 and npm 10.9.2

**Confirmed**: npm is the authoritative package manager for this project.

## Current State

### Commit SHA
Under review: `3fe4f78` (HEAD of main branch, before infrastructure changes)

### Pinned Toolchain
- **Node version**: 20.19.4 (specified in `.nvmrc`)
- **npm version**: 10.9.2 (specified in `packageManager` field and CI)
- **Lockfile**: `package-lock.json` (lockfileVersion: 3)

### Configuration Files
- `package.json`: npm-style scripts, `engines` field with Node 20.x and npm 10.9.2, `packageManager` field
- `.nvmrc`: Node 20.19.4
- `package-lock.json`: Committed lockfile (lockfileVersion: 3)
- `.github/workflows/ci.yml`: Updated to use `.nvmrc`, npm caching, npm 10.9.2 pinning, separate test/build steps
- `tsconfig.json`: `strict: true`, `noUnusedLocals: false`, `noUnusedParameters: false`

### Removed Files
- `bun.lock`: Removed to establish npm as the authoritative package manager

## CI Workflow Stages

The CI workflow (`.github/workflows/ci.yml`) runs the following stages in order:

1. **Checkout**: `actions/checkout@v4`
2. **Setup Node**: `actions/setup-node@v4` with `node-version-file: .nvmrc` and `cache: npm`
3. **Pin npm**: `npm install --global npm@10.9.2`
4. **Record toolchain**: Logs commit SHA, Node version, npm version, and package-lock.json SHA256
5. **Assert lockfile tracked**: Verifies `package-lock.json` is in git
6. **Install dependencies**: `npm ci`
7. **Lint**: `npm run lint` (TypeScript type-check via `tsc --noEmit`)
8. **Test**: `npm test` (Vitest run)
9. **Build**: `npm run build` (Vite build)

All stages run as separate steps with individual failure conditions.

## Verification Report

*This section will be populated with actual command outputs and test results after verification.*

### Tested Commit SHA
*Pending: To be recorded after commit*

### Toolchain Verification
| Check | Status | Notes |
|-------|--------|-------|
| `node --version` matches .nvmrc | NOT RUN | Expected: v20.19.4 |
| `npm --version` matches packageManager | NOT RUN | Expected: 10.9.2 |
| `.nvmrc` exists and contains correct version | NOT RUN | Expected: 20.19.4 |

### Build Verification
| Stage | Command | Status | Exit Code | Notes |
|-------|---------|--------|-----------|-------|
| Install | `npm ci` | NOT RUN | - | Clean install from committed lockfile |
| Lint | `npm run lint` | NOT RUN | - | TypeScript type-check |
| Test | `npm test` | NOT RUN | - | Vitest run (node + jsdom projects) |
| Build | `npm run build` | NOT RUN | - | Vite build |

### Lockfile Verification
| Check | Status | Notes |
|-------|--------|-------|
| `package-lock.json` tracked in git | NOT RUN | `git ls-files --error-unmatch package-lock.json` |
| `package-lock.json` SHA256 recorded | NOT RUN | Baseline hash to be recorded |

### Baseline Failures
*None recorded yet. Any failures discovered during verification will be classified as baseline (pre-existing) vs regression (new).*

## Exit Criteria

- [ ] Clean `npm ci` install succeeds from the committed lockfile
- [ ] Node and npm versions match pinned toolchain
- [ ] CI runs lint, tests, and build as separate steps
- [ ] Recorded test results belong to the exact commit SHA under review (no borrowed results)
- [ ] Baseline failures (if any) are recorded before any subsequent Career-path changes
- [ ] Remote CI passes for the exact final commit SHA

## Remote CI Status

*Status will be updated after observing remote CI workflow results for the exact commit SHA.*

### Remote CI Workflow Run
- **Workflow**: CI Workflows
- **Run ID**: *Pending*
- **Status**: *Pending*
- **Commit SHA**: *Pending*
- **Trigger**: *Pending*

## Notes

- Infrastructure-only milestone: No changes to Career/astrology logic, C8–C11 contracts, or product behavior
- Lockfile authority decision: npm is authoritative; bun.lock removed to avoid conflicts
- CI stages are separated for granular failure detection
- Verification must be performed from a clean checkout on the final commit
