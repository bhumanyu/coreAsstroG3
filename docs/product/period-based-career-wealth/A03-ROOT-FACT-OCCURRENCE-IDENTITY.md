# A03 — Root-Fact and Occurrence Identity

**Status:** A03 baseline merged via PR #4; post-merge correctness fixes are committed to the feature branch and require a follow-up PR/CI run  
**Base:** `main` at `5b990ad0668b030ae6917738764d43034e6f1116` (A02 merged)  
**Scope:** Evidence identity contracts, root-link propagation, duplicate occurrence guardrails and reasoning projections  
**Canonical authorities preserved:** Career C11; Wealth CW-05; shared temporal authority unchanged

## 1. Objective

A03 makes the distinction between a semantic fact and each occurrence of that fact explicit throughout the Career/Wealth evidence pipeline.

One semantic fact may have multiple legitimate occurrences (for example, support/challenge projections or the same fact carried through multiple reasoning layers). Those occurrences must remain traceable without being mistaken for independent facts or counted twice.

A derived occurrence may also declare which canonical semantic root facts it depends on. Those links must resolve to semantic identities, not to occurrence IDs or raw producer IDs.

## 2. Canonical identity model

| Field | Namespace | Contract |
|---|---|---|
| `DomainEvidence.identityKey` | Semantic/root identity | Identifies the semantic fact; used for semantic grouping and canonical references |
| `DomainEvidence.id` | Occurrence identity | Identifies this particular occurrence |
| `EvidenceProvenance.evidenceId` | Occurrence identity | Must equal `DomainEvidence.id` for provenance-backed Career/Wealth evidence |
| `relatedEvidenceIds` / `sourceIds` | Producer occurrence provenance | Retains source/producer occurrences; never substitutes for a root semantic identity |
| `rootEvidenceIds` | Root dependency links | References `identityKey` values of root facts in the same canonical domain graph |
| `CanonicalReasoningEvidence.representativeOccurrenceId` | Representative occurrence | Deterministic real occurrence ID selected from sorted `sourceIds`; it is not the semantic identity |

The canonical relationship is:

```
one identityKey (semantic fact)
  ├── occurrence id A
  ├── occurrence id B
  └── occurrence id C

derived occurrence D
  └── rootEvidenceIds: [identityKey]
```

An occurrence ID cannot be used as a root link. A producer source ID cannot be used as a root link. Missing root links are not invented.

## 3. Implementation

### 3.1 DomainEvidence root-link contract

In `src/domain/interpretation/DomainEvidence.ts`:

- Added optional `rootEvidenceIds`.
- Root references are trimmed, sorted, unique and frozen.
- Empty references, the unresolved-identity sentinel, occurrence-ID references and self-identity references are rejected.
- Added `assertUniqueDomainEvidenceOccurrenceIds`; duplicate occurrence IDs fail closed.
- Added `validateDomainEvidenceRootLinks`; references must resolve to a semantic `identityKey` in the same graph.
- Root dependency cycles are rejected as `ROOT_EVIDENCE_CYCLE`.

The new functions and types are exported from `src/domain/interpretation/index.ts`.

### 3.2 Reasoning pipeline identity separation

In `reasoningTypes.ts`, `reasoningHierarchy.ts` and `deduplicateEvidence.ts`:

- `WeightedReasoningEvidence` carries root references separately from producer `sourceIds`.
- `classifyReasoningEvidence` rejects repeated DomainEvidence occurrence IDs and carries root references forward.
- `deduplicateReasoningEvidence` rejects duplicate occurrence IDs across both representative IDs and source occurrence sets.
- The canonical aggregate now exposes `representativeOccurrenceId`, rather than overloading `evidenceId` with `identityKey`.
- `sourceIds` retains all distinct occurrence IDs.
- `occurrenceCount` is the number of distinct valid source occurrences.
- `rootEvidenceIds` are unioned, sorted and preserved independently.
- `canonicalToWeighted` returns a real representative occurrence ID in `WeightedReasoningEvidence.evidenceId`, while retaining `identityKey` as the semantic identity.

Career and Wealth reasoning summaries now project semantic `identityKey` values in their canonical evidence-ID fields, and retain occurrence IDs separately in source provenance.

### 3.3 Provenance-backed Career/Wealth evidence

In `src/domain/careerWealth/provenance/careerWealthEvidence.ts` and `evidenceProvenanceFactory.ts`:

- A caller-supplied occurrence ID is passed into the provenance factory.
- `DomainEvidence.id` and `provenance.evidenceId` are now the same occurrence ID.
- `identityKey` is independently supplied or derived with `buildEvidenceIdentityKey`; it excludes effect/strength.
- The contract rejects a semantic `identityKey` that is equal to the occurrence ID.

Career and Wealth producer mappers preserve their producer occurrence IDs. They also pass through explicit `rootEvidenceIds`, reject duplicate occurrences and validate root links before returning the mapped evidence.

The Wealth theme evidence type and producer adapter now allow optional root links to pass through without fabricating them.

### 3.4 C9/C10 root-link propagation

- C9 `resolveNatalRootEvidenceIds` now returns natal `identityKey` values, not natal `evidenceId` occurrence values.
- The canonical Career mapper projects C9 `natalRootIds` into `DomainEvidence.rootEvidenceIds`.
- The mapper also projects C10 `natalRootIds` when supplied.
- Natal canonical reasoning root references survive the Weighted → DomainEvidence projection.
- The current C10 producer still emits an empty `natalRootIds` array. A03 does not invent D10-to-natal links without producer-supported source references.

### 3.5 Continuity enforcement

- Career canonical mapping returns a root-link validation result.
- `CareerDomainInterpreterV2` passes that result into the evidence-continuity gate.
- Unresolved root references and root cycles are ERROR-level continuity issues.
- Career continuity also rejects a mismatch between `DomainEvidence.id` and `provenance.evidenceId`.
- Wealth mapping applies the same root-link validation before returning its evidence.

## 4. Regression coverage added or updated

| Test | Contract |
|---|---|
| `DomainEvidence.identity.test.ts` | Root-link normalization, unique occurrence IDs, self-reference and cycle rejection |
| `canonicalEvidenceIdentity.contract.test.ts` | Root-link preservation, duplicate occurrence rejection and canonical round-trip identity separation |
| `deduplicateEvidence.test.ts` | Distinct occurrences across layers; representative occurrence remains distinct from semantic identity |
| `careerDashaIntegration.test.ts` | C9 natal roots use semantic identityKey values |
| `canonicalCareerEvidenceMapper.test.ts` | C9/C10 root-link projection, semantic root resolution and duplicate occurrence rejection |
| `careerEvidenceMapper.test.ts` | Career producer occurrence preservation, root-link resolution and duplicate-ID rejection |
| `wealthEvidenceMapper.test.ts` | Wealth occurrence/semantic identity separation and root-link resolution |
| `careerWealthEvidence.test.ts` | Provenance evidenceId equals occurrence ID; identityKey remains separate |
| `careerWealthEvidenceIntegration.test.ts` | Career and Wealth identity namespace separation and legacy occurrence preservation |
| `evidenceContinuity.test.ts` | Unresolved root, cycle and provenance/occurrence mismatch failures |
| `WealthDomainInterpreterV2.test.ts` | Wealth provenance occurrence identity contract |
| Career/Wealth reasoning hierarchy tests | Canonical evidence IDs use identityKey; source trace retains real occurrence IDs |

## 5. Non-goals and preserved authorities

A03 does not:
- Redesign Career C11 or Wealth CW-05.
- Change Career or Wealth calculation rules, evidence weights, or Dasha activation rules.
- Add a second deduplication engine.
- Treat missing evidence as negative evidence.
- Invent root links for producers that do not supply them.
- Change temporal/Dasha orchestration.

The reasoning changes are identity/provenance projections only. The canonical Career and Wealth synthesis authorities remain unchanged.

## 6. Validation record

Repository source was inspected and updated on the feature branch. The branch is based directly on current `main`; no merge-base drift was detected at the last comparison.

PR #4 was merged at commit `4fc4d009a757f48b0d0e6409af29063bffd65082`, using tested PR head `0cfb513546b5a1a0951216fc29eec90e2efeddb1`. The workflow runs for that tested head were:

- CI Workflows: **FAIL** — `npm run lint` / `tsc --noEmit` reported syntax errors in `DomainEvidence.identity.test.ts` (the test file was malformed by an insertion conflict).
- Release Gate: **FAIL** — `npm run verify:release` returned `Release status: FAIL`; the captured log does not include the manifest's individual failing gate details.

Follow-up corrections now committed to this branch after the merge:
- Rebuilt `DomainEvidence.identity.test.ts` as a complete, syntactically coherent test suite.
- Removed a duplicate `trimmedIdentityKey` declaration found during source audit.
- Added empty/whitespace `identityKey` rejection and canonical trimming.
- Enforced normalized Wealth occurrence uniqueness.
- Deduplicated repeated C9 natal semantic root references.
- Updated the canonical product trace test to assert occurrence IDs and semantic identity separately.
- Updated the identity-contract documentation.

These follow-up changes have **NOT_RUN**:
- `npm ci`
- `npm run lint`
- Targeted Vitest suites
- `npm test`
- `npm run build`
- `npm run verify:release`

The follow-up branch head must pass the actual TypeScript/lint/test/build/release gates before the corrections are merged. No runtime success is claimed.
