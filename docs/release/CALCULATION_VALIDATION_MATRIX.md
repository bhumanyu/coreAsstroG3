# Calculation and release validation matrix

This matrix defines reporting surfaces only. It does not execute build, test, workflow, or calculation validation. A gate result is separate from coverage: `PASS`, `FAIL`, `BLOCKED`, and `NOT_RUN` describe the gate; `PASSED`, `BLOCKED`, `NOT_TESTED`, and `SCOPE_EXCLUDED` describe evidence coverage.

The report contains exactly the required gates RG-01 through RG-14. `aggregateReleaseStatus` evaluates that required inventory only, with precedence `FAIL` → `BLOCKED` → `NOT_RUN` → `PASS`. Missing required results are `NOT_RUN`; duplicate results for one required gate fail closed. `canRelease` is finalized only as `status === PASS`.

| Gate | Required validation | Reporting rule / retained limitation |
|---|---|---|
| RG-01 | Release scope and policy | Confirm the policy is present and Career + Wealth scope is respected. |
| RG-02 | Release inputs and configuration | Record the exact inputs/configuration and their provenance. |
| RG-03 | Production build | Record the build result and evidence; absent execution is `NOT_RUN`. |
| RG-04 | Type checking | Record type-checking result and evidence; absent execution is `NOT_RUN`. |
| RG-05 | Unit test suite | Record test result and test evidence. |
| RG-06 | Skipped-test policy | Delete stale output before testing; accept only Vitest JSON with totals matching enumerated assertions, unique file-qualified test names, and a `startTime` within the recorded command execution window. Record `startTime`; fail RG-06 on malformed output or any skip not approved by the empty allowlist. |
| RG-07 | Golden acceptance baselines | Record baseline comparisons without upgrading blocked acceptance surfaces to `PASS`. |
| RG-08 | Integration test suite | Record temporal calculation validation result and evidence. |
| RG-09 | Required fixtures | An empty or incomplete inventory is `BLOCKED`. The runner independently recomputes required coverage from the versioned `calculationCoverage` policy and requires a schema-versioned execution envelope whose candidate SHA, invocation ID, fixture counts, suite-completion marker, command timestamps, and per-fixture results correlate to the successful invocation. Every fixture must have exactly one `{fixtureId, kind, operationId, compared: true, passed: true}` result. Duplicate boundary-position tuples and unordered epsilon-before/exact/epsilon-after inputs flag coverage incomplete. Structured provenance is mandatory. A module-provided `READY` flag is not accepted as evidence. |
| RG-10 | Independent external reference parity | Remains `BLOCKED` until independent Swiss Ephemeris / JPL Horizons reference data and parity evidence are available. |
| RG-11 | Owner-gated mechanism coverage | Owner-gated non-dusthana mechanism families remain `BLOCKED`; no `PASS` is inferred. |
| RG-12 | Determinism and reproducibility | Record reproducible inputs, version context, and repeatability evidence. |
| RG-13 | PR-8 production acceptance surfaces | Consume exact-revision PR-8 surface evidence. `report-renderer` and `AppController async-state` pass only with successful adapter tests, all required Chromium journeys, CI identity and artifact references; missing or mismatched evidence is `BLOCKED`. |
| RG-14 | Limitations and excluded capabilities | Confirm retained blockers and out-of-scope capabilities are disclosed in the release report. |

RG-10 and RG-11 remain independently retained blockers. RG-13 is evidence-derived: PR-8 surfaces are never assumed PASS and remain BLOCKED until their exact-revision adapter/browser evidence is present.

## Test inventory audit

The Vitest file inventory was compared using `vitest list --filesOnly`: the legacy `vite.config.ts` configuration listed 327 files; `vitest.standard.config.ts` listed 324. The three additional standard-config exclusions are intentional release-only suites, each separately invoked by `verify:release`:

- `src/engine/validation/calculationValidation.test.ts` (`test:calculation-validation`)
- `src/engine/validation/temporalCalculationValidation.test.ts` (`test:temporal-validation`)
- `src/release/pr8AcceptanceReport.test.ts` (`test:pr8-acceptance`)

`src/ai/security/browserBoundary.test.ts` is excluded from the main test project in both configs because its bundle assertion requires built assets. It is explicitly included by `vite.bundle.config.ts`; `npm run verify` invokes `test:bundle` after the production build, so the security test runs in its required Node environment and is not silently omitted. The direct standard-config selection was checked and correctly returns “No test files found”; the bundle-config run executes its two tests.

The skipped-test allowlist is empty. The existing project record identifies the `D08-A1` Moon-anchor validation as skipped; this policy does not approve it. Do not claim that there are no skipped tests unless the executed test results verify that fact.

The last full Vitest JSON inventory contained four skipped cases: `D07-C`'s deterministic resolved-path evidence test and the three `MOON-ANCHOR-01-NEW-DELHI-1980`, `MOON-ANCHOR-02-LONDON-2000`, and `MOON-ANCHOR-03-TOKYO-2015` external-ephemeris longitude tests under `D08-A1`. These names remain unapproved because the allowlist is empty. The two RG-09 `.todo` checks for planetary speed/retrograde and Rahu/Ketu opposition are TODOs rather than skipped tests and keep RG-09 blocked.

PR-8 linkage is anchored by `pr8.acceptedImplementationRevision` in `release-policy.json`, not an environment variable or report metadata. The policy's `revisionComparisonPaths` cover `src/acceptance/` and the analysis, domain, and product consumers imported by the production harness, plus its approved baseline fixtures. Each release run verifies the accepted commit exists in Git, compares the accepted revision with both the candidate and working tree for every declared path, and records the generated acceptance report SHA-256. A changed relevant file or missing/mismatched linkage makes `pr8.evaluatedOnCandidate` false and keeps RG-13 `BLOCKED` pending refreshed acceptance and policy anchoring.

Each PASS gate uses typed evidence: command-log reference, file SHA-256 reference, fixture-comparison reference, or policy-document reference. The gate's discriminant is fixed by gate ID; the runner validator rejects foreign evidence kinds and references not present in the evidence manifest or whose file hash does not match.

Evidence-manifest canonicalization sorts each top-level evidence collection and fixture IDs by canonical record key, so irrelevant input ordering does not change the SHA-256 digest; object keys are recursively sorted. Non-literal runtime `require()` and `import()` targets remain a declared static-analysis limitation. Each discovered target requires a path-specific approved waiver; the current waiver inventory is empty.

The harness import-graph resolver reads tsconfig files from the inspected Git revision, follows `extends`, and rejects compiler configuration diagnostics with `Error` severity (including diagnostic codes and flattened messages); warnings and suggestions do not fail graph construction. Missing specifiers matching a configured `paths` alias or a repository-local `baseUrl` candidate fail closed, while unresolved external package names remain outside the repository dependency graph.

The versioned `calculationCoverage` object in `release-policy.json` is the shared source for required calculation families, planets, motion scenarios, boundary kinds/positions, and varga types. Each boundary fixture declares a named `boundaryDefinition` with longitude and sidereal/tropical convention (including ayanamsha), and that identity must match `boundaryLongitude` and the appropriate sign, nakshatra, or pada grid. Its exact input must equal that value and before/exact/after inputs must be strictly increasing and within the approved epsilon range. Expected classifications are literal, independently approved fixture data: every boundary fixture must attest `expectedValuesProducedIndependently: true`, and validation checks the declared increasing-longitude transition without calling production classifiers to construct expectations. General provenance includes coordinate convention, time standard, ayanamsha, node convention, tolerance and rationale, an independence statement, and human approval fields. RG-09 remains `BLOCKED` while the inventory is empty.

On `pull_request`, the runner tests the PR head (`prHeadSha`/`testedSha`); `prMergeSha` is recorded for information and is not the tested merge result. `workflow_dispatch` intentionally accepts an arbitrary full commit SHA supplied by the operator, subject to all exact-revision, tree, and toolchain checks.

See [`release-policy.json`](release-policy.json) for the machine-readable required gate inventory, retained blockers, skipped-test policy, and exact excluded capability list (`accounts`, `sync`, `snapshots`, `notifications`, `PDF`, and share-link security).

Runner interface: `REQUIRED_RELEASE_GATE_IDS` is the stable readonly tuple of required IDs. The runner first calls `createValidatedRunnerResult(input, evidenceManifest)`; this validates gate statuses, evidence discriminants per gate, and references against present artifacts. `finalizeReleaseReport` accepts only that branded `ValidatedRunnerResult` and rejects raw gate-status input. The report contains the aggregate `status` and `canRelease`.

## Independent calculation fixture families

The fixture contract requires independently produced and approved expectations with source/version, convention, retrieval, approval, and tolerance provenance. Runtime outputs from this engine are never eligible as expected values.

| Calculation family | Real production output under test | Required expectation shape | Current state |
|---|---|---|---|
| Planet positions | `calculateHoroscope` / production position generation | Sidereal longitude, with input ayanamsa equal to the fixture convention; compare the returned `siderealLongitude` with circular tolerance | BLOCKED: no approved fixtures |
| Speed and retrograde | `calculateHoroscope` motion output | `motion.speed` direction and magnitude for direct, retrograde, and near-stationary fixtures; compare against an independent expectation | BLOCKED: no approved fixtures |
| Nodes | Production Rahu/Ketu position output | Rahu/Ketu opposition within the approved angular tolerance; do not rely on node `motion.retrograde` metadata | BLOCKED: no approved fixtures |
| Sign, nakshatra, and pada boundaries | Production horoscope-derived values | Independently approved values immediately before, exactly at, and immediately after each tested boundary | BLOCKED: no approved fixtures |
| Houses and divisional charts | Production Whole Sign house and D9/D10 entry points | Independently approved house/sign mapping and divisional placements | BLOCKED: no approved fixtures |
| Vimshottari | Production dasha builder/resolver | Independently approved birth balance and period start/end boundary expectations | BLOCKED: no approved fixtures |

Circular comparison helper tests validate wrap-aware mechanics only; they are not calculation references and do not unblock RG-09.

## Temporal production scenarios

The temporal suite exercises the real dasha resolver and product analysis service. It covers future/current/past selected MD–AD periods, inclusive starts and exclusive ends, rejection of children outside their parent hierarchy, typed invalid-selection failures, deterministic repeated requests, and stale selections after a profile switch. Lifetime career/wealth plus C11/CW-05 outputs are compared across distinct selected periods; the selected-period outputs must differ.

When the production timeline is absent, the validation result is `UNAVAILABLE`; the production service's native outcome remains `INVALID_SELECTION` with `REPORT_UNAVAILABLE`. Future-event outcomes and transit sample-gap coverage remain separate typed reports and each stays `BLOCKED` without an independent baseline.
