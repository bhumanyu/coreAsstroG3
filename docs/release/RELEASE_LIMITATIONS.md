# Release limitations

This release report is a gate-and-evidence projection. It is not a new calculation authority, does not alter calculation behavior, and does not convert unavailable or unverified evidence into a positive conclusion.

Run the expanded release sequence from a clean checkout after installing the locked dependencies and Chromium. After `npm ci`, run `npx playwright install --with-deps chromium`; the release gate executes the 18 required browser journeys itself so their evidence is tied to the same exact revision and CI run:

- PowerShell: `$env:PR9_EXPECTED_SHA='<full-commit-sha>'; npm run verify:release`
- POSIX shell: `PR9_EXPECTED_SHA=<full-commit-sha> npm run verify:release`

The runner resolves no alternate revision or toolchain; it records each command and its log in ignored `artifacts/release/`. The ordinary `npm run verify` intentionally does not orchestrate the new calculation and temporal validation suites.

On pull requests, the exact tested candidate is the PR head commit; the merge SHA is recorded separately for information. `workflow_dispatch` intentionally permits an operator to select any full commit SHA. The runner still requires that candidate to match the checked-out revision and enforces the pinned tree/toolchain without fallback.

RG-13 carries its accepted PR-8 revision and acceptance-relevant Git paths in the versioned `pr8` section of `release-policy.json`. The runner verifies the accepted commit exists, compares tracked and untracked harness/consumer files against that revision, executes the production acceptance probe itself, and hashes its output. Any source difference or missing execution/report evidence sets `pr8.evaluatedOnCandidate` false and leaves RG-13 `BLOCKED` until the baseline implementation is explicitly refreshed.

RG-06 removes any previous `test-report.json` before the test command. It accepts only the expected Vitest JSON structure and records its `startTime`; missing or malformed output fails the gate rather than reusing a stale report.

RG-09 does not trust the fixture module's `READY` or `coverageComplete` flags. The test emits one result per fixture to `calculation-fixture-results.json`, including an operation identifier and a runner-provided invocation nonce. The runner trusts the artifact only after a successful command and matching nonce/time window, then independently verifies exact inventory/result correspondence, comparison outcomes, structured provenance, and the versioned coverage contract. PASS results throughout the release report use gate-specific typed evidence references checked against the manifest and on-disk artifact hashes.

## Retained blockers

- **Independent reference parity — BLOCKED:** External Swiss Ephemeris / JPL Horizons comparison remains blocked pending independently captured reference data.
- **Owner-gated mechanism families — BLOCKED:** Non-dusthana mechanism families requiring owner approval remain blocked; they are never inferred to pass.
- **PR-8 production surfaces — evidence-gated:** The report renderer and AppController async-state are required acceptance surfaces. RG-13 derives their status from exact-revision adapter tests, Chromium journeys, CI run identity and artifact references. They remain BLOCKED when any evidence is absent or belongs to another SHA.
- **Skipped validation — not approved:** `D08-A1` Moon-anchor validation is recorded as skipped in the project acceptance documentation. `allowedSkippedTests` is `[]`; no skipped test is approved by this policy. The release report must not claim zero skips without executed test evidence.

RG-13 consumes PR-8 acceptance statuses and can pass only when every required surface has successful adapter and browser evidence tied to the exact tested SHA. A caller-provided `PASS` without the matching CI and artifact evidence is downgraded to `BLOCKED`.

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
