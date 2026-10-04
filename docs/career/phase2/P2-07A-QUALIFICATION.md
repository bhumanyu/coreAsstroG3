# P2-07A — Career Pattern Qualification (Policy-Based)

> **STATUS: IMPLEMENTED — VERIFICATION PENDING**

P2-07A extends the P2-04 qualification shell with real deterministic policy-based evaluation per pattern family, replacing the placeholder `INSUFFICIENT_DATA` routing with explainable, per-family qualification logic.

## Purpose

P2-07A implements policy-based qualification for Career patterns, where each `CareerPatternClassification` has a dedicated `QualificationPolicy` that:
- Declares required structural facts (establishing relationships, topology, etc.)
- Evaluates dimensions dimension-by-dimension
- Applies status precedence rules (missing ≠ negative)
- Generates explainable evidence with proper provenance
- Never auto-QUALIFIED generic patterns (conservative carrier policy)

## QualificationStatus

Per spec §24 status precedence (frozen):
- **UNQUALIFIED**: Mandatory structural prerequisite explicitly absent OR known disqualifier
- **INSUFFICIENT_DATA**: Mandatory prerequisite unevaluable (missing ≠ negative) OR any dimension NOT_ASSESSED/UNKNOWN/UNAVAILABLE
- **QUALIFIED**: Prerequisites confirmed + conditions met (requires methodology freeze; currently blocked by NOT_ASSESSED dimensions)

### Decision Chain (Spec §24)

Policies implement status precedence via this decision chain:

1. **Structural prerequisites check**: If mandatory establishing relationships are explicitly absent → `UNQUALIFIED`
2. **Dimension assessment**: Compute all qualification dimensions via `computeQualificationDimensions`
3. **Missing/negative evaluation**:
   - If any dimension is `NOT_ASSESSED`, `UNKNOWN`, or `UNAVAILABLE` → `INSUFFICIENT_DATA` with specific reasons
   - If `planetaryCondition === 'WEAK'` or `careerRelevance === 'NEUTRAL'` → `UNQUALIFIED`
4. **Status determination**:
   - If prerequisites present + all evaluable dimensions positive → `INSUFFICIENT_DATA` with reason "structural strength methodology not frozen"
   - QUALIFIED requires the structural-strength methodology freeze (currently unreachable)

**Critical**: `structuralStrength` is `NOT_ASSESSED` until methodology freeze. Therefore:
- Prerequisites + all evaluable dimensions OK → `INSUFFICIENT_DATA` (reason: "structural strength methodology not frozen")
- WEAK/NEUTRAL disqualifiers → `UNQUALIFIED`
- QUALIFIED is unreachable until structural-strength freeze (intentional, not a placeholder oversight)

No numeric scoring (`qualificationScore`) or universal thresholds (spec §15).

## Dimension Vocabulary (Spec §2/§13)

Existing dimension enum (already matches spec):
- `structuralStrength`: STRONG | MODERATE | WEAK | NOT_ASSESSED
- `planetaryCondition`: STRONG | MODERATE | WEAK | UNAVAILABLE
- `careerRelevance`: PRIMARY | SUPPORTING | MIXED | NEUTRAL | UNAVAILABLE
- `patternCoherence`: HIGH | MODERATE | LOW | INSUFFICIENT_DATA
- `activationPotential`: HIGH | MODERATE | LOW | UNKNOWN
- `divisionalConfirmation`: CONFIRMED | NOT_CONFIRMED | NOT_ASSESSED

**ACTIVATION/D10 contract (spec §9-10):** ACTIVATION stays `UNKNOWN`, D10 stays `NOT_ASSESSED`. These dimensions never raise natal status to QUALIFIED—Dasha strong + natal UNQUALIFIED → UNQUALIFIED.

## Policy Registry

`qualificationRegistry.ts` maintains a `Record<CareerPatternClassification, QualificationPolicy>` map.

### Implemented Policies

1. **SERVICE_TO_PROFESSION_TO_GAINS** (`serviceToProfessionToGainsPolicy.ts`)
   - Required: Establishing relationships 6→10 AND 10→11
   - Evaluates: structural prerequisite presence, planetary condition, career relevance, coherence
   - Status: UNQUALIFIED if prerequisites absent; INSUFFICIENT_DATA if NOT_ASSESSED dimensions block

2. **CAREER_HOUSE_NETWORK** (`careerHouseNetworkPolicy.ts`)
   - Generic carrier validation / deferred qualification policy (never auto-QUALIFIED per spec)
   - Required: Any establishing relationship
   - Status: UNQUALIFIED if no establishing relationships; INSUFFICIENT_DATA otherwise (deferred until methodology freeze)
   - Note: This is a carrier validation policy, not a complete qualification policy. It validates structural presence but routes to INSUFFICIENT_DATA until methodology is frozen.

### Future Policies (Deferred)

- WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS
- COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS
- CREATIVE_DHARMA_TO_PROFESSION
- DHARMA_KARMA_ALIGNMENT
- KENDRA_TRIKONA_CAREER
- UPACHAYA_CAREER_NETWORK
- PARIVARTANA_CAREER_NETWORK
- DUSTHANA_CAREER_TRANSFORMATION
- CAREER_YOGA_STRUCTURE

## Policy Contract

Each `QualificationPolicy` implements:
```typescript
interface QualificationPolicy {
  readonly policyId: string;
  readonly classification: CareerPatternClassification;
  readonly description: string;
  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult;
}
```

`PolicyEvaluationResult` includes:
- `status`: CareerPatternQualificationStatus
- `dimensions`: CareerPatternQualificationDimensions
- `evidence`: QualificationEvidence[] (policy-level)
- `decisionBlockingReasons`: DecisionBlockingReason[] (decision-blocking: structural strength, planetary condition, career relevance, coherence)
- `deferredDimensions`: CareerPatternDeferredDimension[] (non-decision-blocking: ACTIVATION_POTENTIAL, DIVISIONAL_CONFIRMATION)
- `ruleId`: string
- `explanation`: string

**DecisionBlockingReason Structure:**
```typescript
interface DecisionBlockingReason {
  readonly reason: string;
  readonly kind: DecisionBlockingReasonKind;
}

type DecisionBlockingReasonKind =
  | 'MISSING_INPUT'
  | 'METHODOLOGY_NOT_FROZEN'
  | 'INSUFFICIENT_STRUCTURAL_EVIDENCE';
```

**DecisionBlockingReason Mapping:**
- `structuralStrength === 'NOT_ASSESSED'` → `METHODOLOGY_NOT_FROZEN` (methodology not yet frozen)
- `planetaryCondition === 'UNAVAILABLE'` or `careerRelevance === 'UNAVAILABLE'` → `MISSING_INPUT` (C5/C6 input records missing)
- `coherence === 'INSUFFICIENT_DATA'` or establishing-relationship checks that are unevaluable → `INSUFFICIENT_STRUCTURAL_EVIDENCE` (structural evidence insufficient)

**Disqualifiers vs Decision-Blocking Reasons:**
- Disqualifiers (WEAK condition, NEUTRAL relevance) are explicit negatives → `UNQUALIFIED` status
- Disqualifiers are NOT pushed into `decisionBlockingReasons` — they are carried in `evidence`/`explanation` only
- Decision-blocking reasons are for `INSUFFICIENT_DATA` status only (missing ≠ negative)

**Missing Data vs Deferred Dimensions:**
- `decisionBlockingReasons`: Structural assessment cannot be completed (NOT_ASSESSED strength, UNAVAILABLE condition/relevance, INSUFFICIENT_DATA coherence). These are decision-blocking for natal qualification status.
- `deferredDimensions`: Intentionally deferred to later phases (ACTIVATION_POTENTIAL timing, DIVISIONAL_CONFIRMATION D10). These are non-decision-blocking and should not appear in insufficient-data explanation text.

This split prevents C11/UI from interpreting deferred phases as incomplete charts.

## Ownership Invariant

**Policy owns qualification status.** The qualification policy for each pattern classification is the sole authority for determining `CareerPatternQualificationStatus`. The shared utility functions `computeQualificationDimensions` and `classifyQualificationStatus` in `careerPatternQualificationRules.ts` provide dimension computation only and must not be used as status authority outside of policy evaluation.

The legacy path (patterns without a registered policy) uses `classifyQualificationStatus` as a fallback, but this is slated for removal in P2-07B/P2-07C once all pattern families have dedicated policies.

## Evidence Structure (Spec §25)

New `QualificationEvidence` for policy-level explainability:
```typescript
interface QualificationEvidence {
  readonly evidenceId: string;
  readonly dimension: keyof CareerPatternQualificationDimensions;
  readonly sourceType: QualificationEvidenceSourceType;
  readonly sourceId: string;
  readonly relationshipIds: readonly string[];  // ONLY from pattern.provenance.establishingRelationshipIds
  readonly explanation: string;
}
```

**Critical:** `relationshipIds` sourced ONLY from `pattern.provenance.establishingRelationshipIds`, never from `network.relationships` bulk copy (avoids the P2-06 provenance bug).

## Source Consumption

Consume existing sources only—no new engines:
- **C5 CareerPlanetaryRelevance** → `careerRelevance` dimension (via existing `mapCareerRelevance`)
- **C6 CareerPlanetaryConditionResult** → `planetaryCondition` dimension (via existing `mapPlanetaryCondition`)
- **CareerPattern + establishing relationships** → structural/coherence dimensions

No new planetary-strength engine (spec §6/§26). No imports from careerDasha/careerD10/timing/C11.

## Missing vs Absent (Spec §20-21)

- **Missing** (unevaluable): Data not available → `INSUFFICIENT_DATA`
- **Absent** (explicitly negative): Structural prerequisite not present → `UNQUALIFIED`

Example:
- Missing relevance data for a planet → `INSUFFICIENT_DATA` (we can't evaluate)
- Required 6→10 relationship not in establishingRelationshipIds → `UNQUALIFIED` (explicitly absent)

## Status Precedence Implementation

Policies implement status precedence by:
1. Checking explicit absence of mandatory prerequisites → UNQUALIFIED
2. Checking for missing/unevaluable data → INSUFFICIENT_DATA
3. Evaluating conditions; if all met but NOT_ASSESSED dimensions block → INSUFFICIENT_DATA
4. Known disqualifiers (WEAK condition, NEUTRAL relevance) → UNQUALIFIED (subject to NOT_ASSESSED override)

Currently, `structuralStrength = NOT_ASSESSED` blocks all QUALIFIED outcomes, routing to `INSUFFICIENT_DATA` per spec §24. This is intentional: QUALIFIED requires the structural-strength methodology freeze and is currently unreachable.

## Immutability & Determinism

- All outputs frozen (`Object.freeze`)
- Canonical ordering of evidence/reasons (sorted)
- Input-order independent (permutation invariance per spec §33)
- Duplicate invariance (spec §37): unrelated relationships don't change qualification
- Establishing vs supporting evidence (spec §35): supporting evidence never changes identity/status

## Test Coverage

Extended test suite in `careerPatternQualification.test.ts`:
- Policy registry lookup tests
- Service-to-Profession-to-Gains policy tests (prerequisite checks, status outcomes)
- Career House Network generic carrier tests
- Missing vs absent distinction tests
- ACTIVATION/D10 cannot create qualification tests
- Policy evidence structure tests (establishingRelationshipIds only)
- DecisionBlockingReason structure tests (verify kind field: MISSING_INPUT, METHODOLOGY_NOT_FROZEN, INSUFFICIENT_STRUCTURAL_EVIDENCE)
- Disqualifier exclusion tests (verify WEAK/NEUTRAL are NOT in decisionBlockingReasons)
- Permutation invariance tests
- Unrelated edge invariance tests
- Real-engine golden test (existing, unchanged)

## Integration with Legacy

P2-07A maintains backward compatibility:
- Legacy `CareerPatternQualificationEvidence` retained for dimension evidence
- New `QualificationEvidence` in `policyEvidence` field for policy-specific evidence
- Legacy `computeQualificationDimensions` used for dimension values (consistency)
- Policies provide status/evidence on top of legacy dimension computation

## Deferred Items (Future Phases)

- **P2-07B:** Role assignment per pattern
- **P2-07C/D:** Mechanism integration
- **P2-07E:** Dispositor integration
- **10H foundation:** House 10 strength baseline
- **Upachaya methodology:** 3-6-11 progression rules (frozen per spec §40)

## Cross-References

- [`P2-04-PATTERN-QUALIFICATION.md`](./P2-04-PATTERN-QUALIFICATION.md) — P2-04 placeholder shell
- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter
- [`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`](../CW-R1-C1-CAREER-SEMANTIC-FREEZE.md) — C1 invariants (MISSING ≠ NEGATIVE)
