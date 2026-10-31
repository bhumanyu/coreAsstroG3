# Release limitations

This release report is a gate-and-evidence projection. It is not a new calculation authority, does not alter calculation behavior, and does not convert unavailable or unverified evidence into a positive conclusion.

Run the expanded release sequence from a clean checkout after installing the locked dependencies:

- PowerShell: `$env:PR9_EXPECTED_SHA='<full-commit-sha>'; npm run verify:release`
- POSIX shell: `PR9_EXPECTED_SHA=<full-commit-sha> npm run verify:release`

The runner resolves no alternate revision or toolchain; it records each command and its log in ignored `artifacts/release/`. The ordinary `npm run verify` intentionally does not orchestrate the new calculation and temporal validation suites.

## Retained blockers

- **Independent reference parity — BLOCKED:** External Swiss Ephemeris / JPL Horizons comparison remains blocked pending independently captured reference data.
- **Owner-gated mechanism families — BLOCKED:** Non-dusthana mechanism families requiring owner approval remain blocked; they are never inferred to pass.
- **Report renderer — BLOCKED:** The PR-8 `report-renderer` surface remains blocked pending its adapter/acceptance evidence.
- **AppController async-state — BLOCKED:** The PR-8 `AppController async-state` surface remains blocked pending its adapter/acceptance evidence.
- **Skipped validation — not approved:** `D08-A1` Moon-anchor validation is recorded as skipped in the project acceptance documentation. `allowedSkippedTests` is `[]`; no skipped test is approved by this policy. The release report must not claim zero skips without executed test evidence.

RG-13 consumes the PR-8 acceptance statuses and retains `report-renderer` and `AppController async-state` as `BLOCKED`. A caller-provided `PASS` for either does not override the retained status.

## Excluded capabilities

The release boundary retains the project scope exclusions exactly:

- Accounts
- Sync
- Snapshots
- Notifications
- PDF
- Share-link security

These are out of scope for this phase, not capabilities whose correctness is implied by a passing Career + Wealth release report.

## Interpretation limits

- A gate `PASS` describes only its declared validation and supplied evidence. It does not imply broader domain or external-reference coverage.
- Coverage is reported separately from gate status and cannot independently enable release.
- `canRelease` is true only when the aggregate status across all 14 required gates is `PASS`; `BLOCKED`, `FAIL`, and `NOT_RUN` are not release approval.
- Missing fixture data blocks RG-09. Missing results for any other required gate remain visible as `NOT_RUN`.
