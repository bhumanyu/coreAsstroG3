# Gate-0 preparation inventory

Baseline inspected at `5388fc7952a29282296b4db4376180f7a0fb8cb0` (`main`); the
worktree was clean before this task. No artifacts were regenerated during the
baseline inventory.

- Fixture source: 2,015 fixtures; its file SHA-256
  (`541a3ce9e0929b4e49d435a6e691980cf4e49ddc40d72c75a80c1cf722378731`) matches
  the parity report.
- Approval: `tools/gate0/approvals.json` is absent. The report correctly says
  approval is `MISSING` and overall status is `PENDING_REVIEW`.
- Cohort inventory: 86 non-TBD cases, 86 `cohort/` manifest entries, and 86
  on-disk artifacts; no missing entries, orphan entries, or unmanifested files
  were found.
- Report provenance: the report names engine commit
  `e7c763ce4b39f9bf7c922dff404e44fa1c295a34`; the capture manifest names
  `e257193197472479db978e503fe8fc4c33c94ae3`. Both differ from baseline HEAD.
- Test inventory: five Gate-0 test files. The report records 27 failures among
  405 nakshatra-boundary measurements.
- Open exit checks at baseline: numeric capture validation, manifest
  completeness, independent Swiss Ephemeris conformance, per-vector
  nakshatra-boundary diagnosis, CWD-independent gate loading, and explicit
  human approval.

## Work completed after the baseline inventory

- G0-02: capture validation now rejects non-finite/out-of-range longitudes,
  non-numeric speeds, invalid ayanamsa, coordinates, and UTC instants using the
  repository's actual artifact field names. Tests cover each invalid field.
- G0-03: both cohort-audit and fixture-generation paths reconcile non-TBD
  definitions, manifest entries, and files on disk. Current audit: 86/86
  captures and 27/27 strict Moon brackets; missing, orphan, and extra-file
  cases are tested as BLOCKED errors.
- G0-04: `seConformance.test.ts` checks official Astro.com swetest 2.10.04
  vectors at 1900 and 2099 for Sun, Moon, mean node, and ΔT. It also checks the
  UT wrapper contracts and Lahiri/house calculations against documented
  independent formula references. The local WASM core remains 2.10.03.
- G0-05: the regenerated report and
  `NAKSHATRA-BOUNDARY-DEFECT-REPORT.md` compare all three positions in each
  failing triplet. All 27 failures are exact pada-boundary assignments; both
  epsilon-side assignments pass. The reference longitudes are direct inputs,
  isolating this as a categorical boundary defect, not an ephemeris error.
  Frozen calculation algorithms and expected vectors were not changed.
- G0-06: the RG-09 module hashes its imported fixture content and performs
  approval evaluation only when the gate function is called with an explicit
  approval path. A test reloads/evaluates the module from a different CWD.
- The fixture source file, capture artifacts, and capture manifest remain
  unchanged. The parity report's fixture-set SHA is now the JSON-content hash
  (`6b9b935e1850b790db4f0be8d442e17778bde967b8a49d4fd6ccc16c287b130f`), not
  the generated TypeScript file-byte hash recorded at baseline; this is a
  hash-semantics change, not fixture regeneration.
- Current report status is RG-09 `coverageStatus: READY`,
  `approvalStatus: MISSING`, `overallStatus: PENDING_REVIEW`; Gate-0 readiness
  is also `PENDING_REVIEW`. No approval manifest was created and no reviewer
  identity or approval was inferred.

Validation completed: root `tsc --noEmit`; full root `npm test` (388 files,
6,961 passed, 4 skipped); Gate-0 suite (40 passed); targeted RG-09 CWD/status
tests (2 passed); cohort audit; parity report regeneration; Swiss Ephemeris
conformance test; and `check:imports`.

G0-01 remains a human action. The current fixture-content SHA must be reviewed
and explicitly approved in `tools/gate0/approvals.json` before any READY
decision.
