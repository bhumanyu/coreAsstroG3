# P2-11B: Canonical Career Orchestrator

**Status:** IMPLEMENTED — VERIFICATION PENDING

## Overview

The Canonical Career Orchestrator is a deterministic, dependency-injected composition layer that gathers existing C4–C7 / P2-07A–E / 10H-10L outputs into one immutable `CanonicalCareerFoundation`. It does NOT reimplement any astrology rules — it only validates contracts, preserves identities/provenance, composes existing engines, records diagnostics, and represents missing data explicitly.

## Location

- Module: `src/domain/career/orchestration/`
- Files:
  - `canonicalCareerContracts.ts` — Branded-ID types and orchestration interfaces
  - `canonicalCareerOrchestrator.ts` — Main orchestrator class
  - `canonicalCareerValidation.ts` — Boundary validation helpers
  - `canonicalCareerPortsAdapter.ts` — Real engine wiring
  - `canonicalCareerOrchestrator.test.ts` — Contract tests
  - `index.ts` — Public API

## Contract

### CanonicalCareerFoundation

The immutable output containing all career domain outputs:

```typescript
interface CanonicalCareerFoundation {
  readonly foundationId: string;
  readonly timestamp: string;

  // Pattern layer (C4/P2-03)
  readonly patternCandidates: readonly PatternCandidate[];

  // Qualification layer (P2-07A)
  readonly patternQualifications: readonly PatternQualification[];

  // Participant roles layer (P2-07B)
  readonly participantRoleAssignments: readonly ParticipantRoleAssignment[];

  // Mechanism layer (P2-07D)
  readonly resolvedMechanisms: readonly ResolvedMechanism[];

  // Mechanism refinement layer (P2-07E)
  readonly mechanismRefinements: readonly MechanismRefinement[];

  // 10H/10L supplement layers (P2-07F/G)
  readonly careerFoundationSupplements: readonly CareerFoundationSupplement[];

  // Identity mappings
  readonly identityMappings: readonly IdentityMapping[];
  // NOTE: Currently empty - producers do not yet supply explicit cross-stage mappings.
  // Documented via diagnostic ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED.

  // Stage references
  readonly stageReferences: readonly StageReference[];

  // Diagnostics
  readonly diagnostics: readonly OrchestrationDiagnostic[];

  // Metadata
  readonly metadata: {
    readonly totalPatterns: number;
    readonly totalQualifiedPatterns: number;
    readonly totalMechanisms: number;
    readonly totalRefinedMechanisms: number;
    readonly dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  };
}
```

### Invariants

1. **Deep Freeze:** All outputs are deeply frozen to ensure immutability
2. **Determinism:** Output is deterministic and input-order independent
3. **Identity Preservation:** Identity keys are preserved from producers (never modified)
4. **Explicit Missing Data:** Missing data is represented explicitly (never fabricated)
5. **Provenance Tracking:** All provenance is tracked (patternIds, evidenceIds, ruleIds, mechanismIds)
6. **No Fabricated Types:** Establishing evidence does not fabricate mechanismType - it is optional and determined by the resolver
7. **Empty Contexts = UNAVAILABLE:** When dispositor contexts are unavailable, refinements are marked UNAVAILABLE without calling the refiner
8. **Unresolved Identity:** When the refiner provides no mechanism ID, mechanismId is empty string (unresolved), not aliased to candidateId
9. **Mixed Establishing Evidence Outcomes:** The `establishingEvidenceStatus` field on `ResolvedMechanism` is a single priority-ordered value (RESOLVED_FOR_MECHANISM > REJECTED > SOURCE_EVIDENCE_PRESENT > UNRESOLVED > UNAVAILABLE). `RESOLVED_FOR_MECHANISM` means "at least one establishing record was accepted" — it does NOT imply all evidence was accepted. Downstream consumers MUST inspect the three ID lists (`acceptedEstablishingEvidenceIds`, `rejectedEstablishingEvidenceIds`, `firewallExcludedEstablishingEvidenceIds`) on `ResolvedMechanism` to detect mixed outcomes where both accepted and rejected/firewall-excluded evidence are present.

## Port Adapter Mapping

The orchestrator uses dependency injection via ports. The adapter file wires real engines to these ports:

### Qualification Port

- **Adapter:** `QualificationPortAdapter`
- **Real Engine:** `qualifyCareerPatterns` from `careerPatternQualification`
- **Signature:**
  ```typescript
  qualifyCareerPatterns({
    patterns: readonly CareerPattern[];
    relevance: readonly CareerPlanetaryRelevance[];
    condition: readonly CareerPlanetaryConditionResult[];
  }): {
    qualifiedPatterns: readonly QualifiedCareerPattern[];
  }
  ```

### Participant Roles Port

- **Adapter:** `ParticipantRolesPortAdapter`
- **Real Engine:** `assignParticipantRoles` from `careerParticipantRoles`
- **Signature:**
  ```typescript
  assignParticipantRoles({
    pattern: CareerPattern;
    qualification: QualifiedCareerPattern;
    networks: readonly CareerHouseNetwork[];
    planetaryConditions: readonly CareerPlanetaryConditionResult[];
    relevance: readonly CareerPlanetaryRelevance[];
  }): {
    assignments: readonly ParticipantRoleAssignment[];
  }
  ```
- **Per-Pattern Loop:** The adapter loops per pattern and flattens results

### Mechanism Resolver Port

- **Adapter:** `MechanismResolverPortAdapter`
- **Real Engine:** `defaultCareerMechanismResolver` from `careerMechanism/resolver`
- **Signature:**
  ```typescript
  resolveAll(inputs: readonly {
    pattern: CareerPattern;
    qualification: QualifiedCareerPattern;
    participantRoles: readonly ParticipantRoleAssignment[];
    establishingEvidence: readonly CareerMechanismEvidence[];
    networks: readonly CareerHouseNetwork[];
  }[]): readonly CareerMechanismCandidateSet[]
  ```

### Mechanism Refiner Port

- **Adapter:** `MechanismRefinerPortAdapter`
- **Real Engine:** `defaultCareerMechanismDispositorRefiner` from `careerMechanism/dispositor`
- **Signature:**
  ```typescript
  refine({
    candidate: CareerMechanismCandidate;
    dispositorContexts: readonly CareerDispositorContext[];
    coreParticipants?: readonly string[];
    supportingParticipants?: readonly string[];
    challengingParticipants?: readonly string[];
  }): CareerMechanismDispositorRefinementResult
  ```
- **DEFERRED:** Dispositor contexts are not yet provided in the orchestration input. When unavailable, all refinements are marked `UNAVAILABLE` without calling the refiner. This is documented via diagnostic `ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE`. When dispositor contexts are wired in, the refiner will be called normally.

### 10H/10L Supplements

- **Consumes:** `Career10HFoundation` / `Career10LFoundation` from `career10h`
- **Status Mapping:**
  - `COMPLETE` → `AVAILABLE`
  - `INSUFFICIENT_DATA` → `PARTIALLY_AVAILABLE` or `UNAVAILABLE` based on `missingInputs`

## Status Vocabulary Reconciliation

The orchestrator uses the repo's existing status vocabulary:

### Qualification Status

- **Repo:** `QUALIFIED | UNQUALIFIED | INSUFFICIENT_DATA`
- **Orchestrator:** Uses the same vocabulary (no `INDETERMINATE`)
- **Invariant:** `INSUFFICIENT_DATA` is NOT treated as negative/unqualified — it represents missing data

### Refinement Status

- **Engine:** `REFINED | UNCHANGED | INSUFFICIENT_DATA`
- **Orchestrator:** Maps to `REFINED | UNCHANGED | UNAVAILABLE`
- **Mapping:**
  - `REFINED` → `REFINED`
  - `UNCHANGED` → `UNCHANGED`
  - `INSUFFICIENT_DATA` / missing → `UNAVAILABLE`

### 10H/10L Status

- **Engine:** `COMPLETE | INSUFFICIENT_DATA`
- **Orchestrator:** Maps to availability
- **Mapping:**
  - `COMPLETE` → `AVAILABLE`
  - `INSUFFICIENT_DATA` → `PARTIALLY_AVAILABLE` or `UNAVAILABLE` based on `missingInputs`

## Mechanism Gating Decision

The orchestrator implements the same gating policy as the real `DefaultCareerMechanismResolver`:

### Gating Policy

- **UNQUALIFIED:** Skip mechanism resolution (no candidates produced)
- **QUALIFIED:** Resolve mechanisms normally
- **INSUFFICIENT_DATA:** Resolve structurally (pattern-level facts only)

### Rationale

This policy ensures that:
1. Unqualified patterns don't produce mechanisms (prevents invalid candidates)
2. Patterns with insufficient data can still generate structurally-valid candidates for downstream consumption
3. The pipeline is not blocked when qualification data is missing but pattern structure is valid

### Diagnostic

When a pattern is UNQUALIFIED, the orchestrator records a diagnostic:
- `category: 'GATING'`
- `message: 'Pattern {patternId} is UNQUALIFIED - skipping mechanism resolution'`

## Missing Data Semantics

The orchestrator follows the "missing ≠ negative" rule:

### Representation

- Missing inputs are recorded in `diagnostics` with `category: 'MISSING_DATA'`
- Missing data is represented as `null` or empty arrays (not fabricated)
- Status fields use `INSUFFICIENT_DATA` or `UNAVAILABLE` (not negative values)

### Examples

- Missing 10H foundation → `foundation10H: null`, diagnostic warning
- Missing qualification for a pattern → skip participant roles, diagnostic warning
- Missing dispositor contexts → refinement status `UNAVAILABLE`

## Boundary Validation

The orchestrator enforces the following boundary invariants:

### ID Namespaces

- Occurrence IDs, identity keys, source IDs, rule IDs, and mechanism IDs are kept in separate namespaces
- Never fabricates a run/rule ID the producer does not supply

### Identity Mapping

- Identity equivalence is validated from explicit `IdentityMapping` records only
- Never infers identity equivalence from string similarity
- **DEFERRED:** Cross-stage identity mappings are not yet implemented. Producers do not supply explicit mappings, so `identityMappings` is empty. This is documented via diagnostic `ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED`. When producers provide explicit mappings, they will be populated here.

### Stage References

- Cross-stage references are validated (e.g., qualification patternId must exist in patterns)
- Orphaned references produce error diagnostics

### Foundation ID Contract

The `foundationId` is a **CONTENT FINGERPRINT**, not an INPUT IDENTITY. It changes when the logical content of the input changes.

**Fingerprinted Fields:**
- `patternIds`: Sorted list of pattern IDs
- `relevanceData`: Planet:relevance pairs (sorted)
- `conditionData`: Planet:condition pairs (sorted)
- `networkIds`: Sorted list of network IDs
- `10H status`: COMPLETE or INSUFFICIENT_DATA (or NO_10H if not provided)
- `10L status`: COMPLETE or INSUFFICIENT_DATA (or NO_10L if not provided)
- `10H missingInputs`: Sorted list of missing input names (if any)
- `10L missingInputs`: Sorted list of missing input names (if any)

**Note:** The 10H/10L foundation payloads themselves are NOT included in the fingerprint. Including the full payloads would make the ID sensitive to internal representation changes that don't affect the logical content. The status and missingInputs capture the logical availability state.

**Determinism:** The same logical input produces the same foundation ID regardless of input order.

## Usage

### Basic Usage

```typescript
import {
  CanonicalCareerOrchestrator,
  defaultCareerOrchestrationPorts
} from './orchestration';

const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);

const foundation = orchestrator.orchestrate({
  patterns: [...],
  relevance: [...],
  condition: [...],
  networks: [...],
  foundation10H: ...,
  foundation10L: ...
});

console.log(foundation.metadata);
console.log(foundation.diagnostics);
```

### Custom Ports

```typescript
import {
  CanonicalCareerOrchestrator,
  type CareerOrchestrationPorts
} from './orchestration';

const customPorts: CareerOrchestrationPorts = {
  qualification: myCustomQualificationAdapter,
  participantRoles: myCustomRolesAdapter,
  mechanismResolver: myCustomResolverAdapter,
  mechanismRefiner: myCustomRefinerAdapter
};

const orchestrator = new CanonicalCareerOrchestrator(customPorts);
```

## Testing

### Test Suite

The test suite (`canonicalCareerOrchestrator.test.ts`) covers:

1. **Basic orchestration contract** — Empty input, single pattern, port calls
2. **Duplicate candidate IDs** — Error diagnostics for duplicates
3. **Unavailable C4–C7 stages** — Graceful handling of missing data
4. **Duplicate mechanism IDs** — Error diagnostics for duplicates
5. **Order-permutation determinism** — Same output regardless of input order
6. **Immutability** — Deep freeze and input mutation protection
7. **Metadata calculation** — Correct counts and completeness status

### Running Tests

```bash
npm test -- canonicalCareerOrchestrator.test.ts
```

## Compatibility

### Production Path

**The orchestrator is NOT wired into `CareerDomainInterpreterV2.ts` or any production path.** This is a standalone layer. Existing C11/legacy consumers remain unchanged.

### Future Integration

Future integration should:
1. Add a new method to `CareerDomainInterpreterV2` that calls the orchestrator
2. Keep existing methods unchanged for backward compatibility
3. Add feature flags for gradual rollout

## Verification Status

**IMPLEMENTED — VERIFICATION PENDING**

The implementation is complete but requires verification:

- [x] Code implementation
- [x] Contract tests
- [ ] Lint verification (`npm run lint`)
- [ ] Test suite execution
- [ ] Regression testing of existing career domain tests
- [ ] Integration testing with real engines

## References

- P2-07A: Pattern Qualification
- P2-07B: Participant Roles
- P2-07D: Mechanism Resolver
- P2-07E: Mechanism Dispositor Refinement
- P2-07F: 10H Structural Context
- P2-07G: 10L Condition and Relationships
- CW-R1: Career Convergence Contract
