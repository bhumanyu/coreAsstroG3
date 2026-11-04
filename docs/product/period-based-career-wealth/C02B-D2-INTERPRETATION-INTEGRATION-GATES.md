# C02B — D2 Interpretation and Wealth Integration (Gated)

**Base branch:** `main`  
**Implementation branch:** `feat/wealth-c02b-d2-interpretation-gated`  
**Status:** PRECONDITION BLOCKED — interpretation contract may be reviewed; canonical Wealth integration is not authorized.  
**Canonical authority:** CW-05 remains the sole final Wealth synthesis authority.  
**Containment authority:** A08 remains active and unchanged.

## 1. Gate decision at implementation start

C02B requires C02A calculation approval and independent golden validation before D2 is allowed to qualify canonical Wealth indications.

At the time this document was prepared:

- C02A PR #22 has merged, but that PR implemented the deterministic mapper contract and unit tests only.
- C02A explicitly recorded independent Swiss Ephemeris/JPL Horizons D2 parity as BLOCKED because no approved independent D2 fixtures were supplied.
- GitHub Actions for the merged C02A head `efcb4abc2a52afbf2961763093b8092872357519` reported:
  - CI Workflows: FAILURE (TypeScript lint succeeded; unit suite had 1 failed, 6,203 passed and 4 skipped).
  - Release Gate: FAILURE.
- The unit failure was a D7 non-regression expectation in `src/engine/planetaryStrength/varga.d2.test.ts`: the test expected Aries at 10°, while existing D7 logic returned Gemini. A corrective one-line test PR #23 has been opened; it has no workflow run yet.
- The independent calculation-reference fixture inventory is still empty. The release policy's external-reference gate remains blocked.

Therefore calculation validation is **NOT APPROVED**. Merge of a contract/test PR is not the same as passing the independent calculation gate.

No D2 relationship or Wealth claim may become canonically available in this state.

## 2. Interpretation boundary — proposed contract for review

The interpretation layer must be a *qualifier of existing D1 Wealth indications*, never an independent generator of Wealth promise.

### 2.1 Permitted evidence families

Each family must point to an already identified D1 Wealth semantic root through `rootEvidenceIds`. Root references use A03 `identityKey` values, never occurrence IDs.

| Evidence family | Meaning | Permitted effect |
|---|---|---|
| `D2_HORA_LORD_DIGNITY` | D2 sign ruler dignity/condition, computed under an independently approved rulebook | Qualify an already existing D1 accumulation/gains indication only |
| `D2_HORA_OCCUPANT` | A planet occupies a Hora sign and is relevant under the approved rulebook | Qualify an already existing D1 indication only |
| `D2_HORA_LORD_LINK` | A D2 Hora ruler has a validated relationship to a D1 wealth significator | Qualify only where the relationship is explicitly derived and its source placements are traced |
| `D2_SOURCE_CHART_LINK` | Link from a D2 derived placement to the source D1 planet/longitude occurrence | Provenance/trace only; never a standalone directional claim |

The names above are reserved contract identifiers, not approved Parashara rule assertions. Before implementation can emit SUPPORT/CHALLENGE, the domain owner must approve a deterministic rule catalogue containing authoritative source/citation, scope, input requirements, effect, precedence, exceptions and test vectors for each rule.

### 2.2 Directional semantics

- `CONFIRMS`: D2 independently and validly corroborates a qualifying D1 indication. It does not increase D1 promise strength by itself.
- `PARTIALLY_CONFIRMS`: only a subset of the required D2 signals is available or corroborative.
- `MODIFIES`: D2 provides a limited qualifier that changes the expression/availability description, without reversing or creating the D1 promise.
- `CONFLICTS`: validated D2 evidence materially contradicts an existing D1 indication. It reduces confidence in the joint reading; it does not replace D1 or independently declare the opposite Wealth result.
- `UNAVAILABLE`: D2 chart, mapping, rule inputs, provenance, or validation gate is missing/invalid.

No D2 evidence may invent income, assets, savings, gains, inheritance, debt, liquidity, net worth, occupation, business ownership, investment outcome or any other real-world financial fact.

### 2.3 Prohibited independent claims

D2 must never:
- create a Wealth dimension or D1 root fact;
- create a standalone Wealth verdict, prosperity grade, or promise strength;
- create a financial fact or financial metric under C01;
- activate a Wealth Dasha period, timing event, or predicted monetary amount;
- manufacture root links, source identities, or occurrence provenance;
- convert missing/invalid data into neutral, supportive, or challenging evidence;
- increase evidence coverage by counting multiple D2 manifestations of the same root as independent evidence sources.

## 3. Required producer contract

A future D2 producer should be a pure, deterministic boundary with explicit typed input and output.

Minimum input:
- validation-gate receipt (calculation contract/version, independent fixture report ID, tested source revision, approval identity/time);
- source D1 chart identity and source occurrence IDs;
- D2 placements derived from that D1 by the approved calculation engine;
- approved rule-catalogue version and citations;
- existing D1 Wealth evidence, including semantic `identityKey` values.

Minimum output:
- D2 diagnostic status: `AVAILABLE`, `PARTIAL`, `UNAVAILABLE`, or `CONFLICTING`;
- relationship: `CONFIRMS`, `PARTIALLY_CONFIRMS`, `MODIFIES`, `CONFLICTS`, or `UNAVAILABLE`;
- deterministic rule IDs and rule-catalogue version;
- new occurrence IDs and distinct semantic identity keys for each D2-derived claim;
- explicit `rootEvidenceIds` linking only to D1 Wealth `identityKey` roots;
- source chart/planet/placement references and coordinate convention;
- diagnostics for missing placements, rejected rules, unresolved roots, invalid provenance, contradictory declarations and gate failures;
- no result when the validation receipt, rule catalogue or source chart identity fails validation.

Every evidence occurrence must satisfy A03 identity rules: `DomainEvidence.id` is a unique occurrence identity; `identityKey` is a semantic identity; `provenance.evidenceId` equals the occurrence ID; root links reference semantic identities only.

A caller-supplied `relationship`, `polarity`, `strength` or `confidence` field is not authoritative. The producer calculates the outcome from approved rules and validates it against the source facts.

## 4. Qualification policy

The qualification algorithm must operate on a D1 root set already accepted by CW-05:

1. Resolve the D1 Wealth semantic roots by `identityKey`.
2. Reject/diagnose missing, duplicate or cross-domain root references.
3. Collect only D2 rule outputs whose source D1 root is explicitly linked.
4. Deduplicate by semantic D2 rule identity; retain all distinct occurrence IDs for trace.
5. Determine D2 relationship using the approved catalogue:
   - all required corroborating signals present and no material conflict → `CONFIRMS`;
   - some required corroborating signals present but inputs incomplete → `PARTIALLY_CONFIRMS`;
   - a bounded qualifier without corroboration or contradiction → `MODIFIES`;
   - validated opposing signals beyond the catalogue's conflict threshold → `CONFLICTS`;
   - gate/input/provenance failure or no usable D2 evidence → `UNAVAILABLE`.
6. Never synthesize an unlinked D1 root from D2.
7. Preserve each conflict and missing-data diagnostic; do not resolve by arbitrary precedence.
8. Return a qualification object. Do not write directly to CW-05 final status/strength.

The actual required signals, thresholds and rule precedence cannot be inferred from existing software fields. They require a reviewed domain rule catalogue; this document intentionally does not fabricate those astrological rules.

## 5. Completeness and confidence

While C02A calculation approval or C02B interpretation approval is missing:

- canonical D2 availability remains `UNAVAILABLE`;
- D2 is excluded from evidence-source counts, completeness and confidence axes, per A08;
- absence is not a D1 challenge;
- no confidence increase or decrease is caused by unvalidated D2 declarations.

After explicit approval in a separate promotion change:

- `AVAILABLE` D2 may qualify the D1 root only if every required rule input and provenance link is present;
- `PARTIAL` D2 remains partial and cannot be counted as a fully independent evidence axis;
- `CONFLICTING` D2 is represented as a conflict and may cap confidence under the approved conflict policy, but cannot rewrite natal promise;
- `UNAVAILABLE` remains excluded rather than treated as negative evidence;
- multiple D2 occurrences linked to one D1 root do not inflate independent source coverage.

Exact numeric confidence caps and source-count weights must be approved against the existing A07/CW-05 confidence model; this phase does not assign new weights by intuition.

## 6. Trace and product/API projection

A future approved projection should expose the same typed object through domain result, product API/view-model and UI:

- calculation validation status and report reference;
- interpretation rule-catalogue version;
- D2 availability and reason;
- relationship status;
- qualifying D1 semantic root IDs;
- D2 occurrence IDs and rule IDs;
- missing/conflict diagnostics;
- explicit flag that D2 is a qualifier and not an independent Wealth verdict.

The UI must display unavailable/partial/conflicting states from the projection, not infer availability from the presence of D2 records. No UI adapter may override A08.

## 7. Required scenario matrix

| D1 state | D2 state | Expected qualifier |
|---|---|---|
| Strong D1 | Strong validated D2 | CONFIRMS, only if every approved corroboration rule is met |
| Strong D1 | Weak validated D2 | MODIFIES or CONFLICTS per explicit rule catalogue; never silently weakens D1 promise |
| Strong D1 | Missing D2 | UNAVAILABLE; retain D1 result unchanged |
| Weak D1 | Strong D2 | D2 cannot create/upgrade a D1 Wealth promise; UNAVAILABLE as a standalone claim, or diagnostic-only corroboration if an approved D1 root exists |
| D1 root present | Conflicting D2 declarations | CONFLICTS only when both source occurrences are valid and rules establish a material contradiction; otherwise PARTIAL/UNAVAILABLE with diagnostics |
| Any D1 | D2 producer throws/fails | UNAVAILABLE with a stable failure diagnostic; canonical D1 result unchanged |
| Any D1 | D2 root link unresolved | Producer validation error; no canonical D2 evidence accepted |

## 8. Release and promotion gates

C02B implementation and eventual D2 activation are separate decisions.

### Required before any D2 evidence can enter CW-05
1. C02A's complete D2 calculation validation report is approved.
2. Independent golden fixtures cover all twelve signs, both Hora halves, exact and near boundaries, ascendant plus all supported planets, timezone/ayanamsa and representative complete charts.
3. CI passes on the exact release candidate: lint, targeted tests, full suite, build and required release gates.
4. Independent D2 reference parity is no longer BLOCKED.
5. Interpretation rule catalogue is source-cited and approved by the domain owner.
6. Producer/A03 evidence identity/root links and trace pass the end-to-end validation suite.
7. Strong, weak, missing, conflict and producer-failure golden tests pass.
8. Product/API/UI projections agree exactly on availability, relationship, evidence IDs and diagnostics.
9. Confidence/completeness impact is reviewed under A07 and CW-05.
10. Explicit domain/product-owner approval is recorded against the exact commit and report artifacts.

### Separate promotion PR
Only a dedicated follow-up PR may:
- change A08's D2 containment policy;
- allow the D2 producer relationship resolver to return a validated relationship;
- include approved D2 evidence in CW-05 qualification;
- update completeness/confidence and every AI/API/export/UI adapter consistently.

That PR must be based on the approved validation receipt and exact source revision. No feature flag, payload field, declaration, or UI change may bypass these conditions.

## 9. Current delivery status

This C02B branch records the interpretation contract and blocked promotion gate only. It does not contain a D2 producer, modify CW-05, change confidence/completeness, alter product API/UI behavior, or remove A08. Those implementation steps are intentionally blocked until the preconditions are satisfied.

The latest C02A CI run must be resolved first:
- CI Workflows failed because the D7 test expected ARIES but actual Saptamsa behavior returned GEMINI.
- Corrective PR #23 is open, awaiting CI.
- Release Gate failed; external-reference parity remains blocked.

## 10. Non-goals

- Rewriting CW-05.
- Treating D2 as a standalone Wealth verdict.
- Enabling D2 before calculation validation.
- Fabricating external golden data or unsupported astrological rule citations.
- Creating financial facts under C01 from divisional placements.
