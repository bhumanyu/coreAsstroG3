# P2-08A: Mechanism→Expression Layer

## Overview

P2-08A implements the career expression resolver that maps career mechanism candidates (P2-07C/D/E) to career expression candidates. P2-08A performs mechanism→expression mapping plus 10H/10L provenance/context attachment to evidence. Contextual expression refinement (10H/10L influencing rule matching) is deferred to P2-08B. Expressions are domain-level classifications of HOW career activity manifests in observable work patterns, derived from but distinct from the structural mechanism layer.

## Three Core Invariants (§40)

1. **P2-08A may transform mechanisms into expressions, but may not create a new natal career mechanism.**
   - Expressions are derived from existing mechanism candidates only.
   - No new mechanisms are created during expression resolution.
   - The expression layer is a transformation layer, not a creation layer.

2. **Expression is not profession assignment.**
   - Expressions classify HOW work manifests (e.g., RESEARCH_WORK, COMMUNICATION_WORK).
   - Expressions do NOT assign specific professions (e.g., SOFTWARE_ENGINEER, BANKER, DOCTOR).
   - Profession assignment belongs to a later synthesis layer.

3. **Dasha activates, D10 refines, neither creates.**
   - Dasha (timing) can activate existing mechanisms/expressions but never creates them.
   - D10 (divisional chart) can refine mechanisms/expressions but never establishes them.
   - The expression layer has firewalls preventing Dasha/D10 from creating expressions without source mechanisms.

## Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROFESSION LAYER                             │
│                   (not implemented yet)                          │
│  Specific professions: SOFTWARE_ENGINEER, BANKER, DOCTOR, etc.  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESSION LAYER (P2-08A)                     │
│  Domain-level work patterns: RESEARCH_WORK, COMMUNICATION_WORK, │
│  AUTHORITY_EXPRESSION, FOREIGN_WORK_EXPRESSION, etc.            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   MECHANISM LAYER (P2-07C/D/E)                    │
│  Structural classifications: RESEARCH, COMMUNICATION, AUTHORITY, │
│  FOREIGN_WORK, etc.                                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PATTERN LAYER (P2-06)                        │
│  Structural facts: house relationships, planetary positions,     │
│  yogas, dispositor chains                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Naming Collision Resolution

### Issue
The legacy `careerExpression.ts` file (C8 layer) exports:
- `CareerExpression` (mode/strength/weight-based)
- `CareerExpressionAnalysis` (expressions, primaryExpression, statement)
- `CareerExpressionEvidence` (mode/strength/weight-based evidence)

The new P2-08A module needed to avoid shadowing these types.

### Resolution
- **Legacy types unchanged**: The C8 layer types remain in `src/domain/career/careerExpression.ts`
- **New module types**:
  - `CareerExpressionCandidate` (no collision)
  - `CareerExpressionAnalysisResult` (instead of `CareerExpressionAnalysis`)
  - `CareerExpressionEvidence` is reused but with incompatible structure:
    - Legacy: mode/strength/weight-based (id, mode, role, statement, weight, planets, houses)
    - New: mechanism-source-based (evidenceId, sourceMechanismId, sourceEvidenceIds, source10HIds, source10LIds, ruleId, role)
- **Documentation**: The divergence is documented in `careerExpressionTypes.ts` header

## Module Structure

### `careerExpressionTypes.ts`
- `CareerExpressionType`: Union of expression types (mapped from CareerMechanismType)
- `CareerExpressionStatus`: CANDIDATE | INSUFFICIENT_DATA (no unreachable status)
- `CareerExpressionPathway`: Passthrough of CareerMechanismPathway
- `CareerExpressionCandidate`: Canonical expression record
- `CareerExpressionEvidence`: Mechanism-source-based evidence
- `CareerExpressionProvenance`: Provenance tracking (expression→mechanism→pattern→relationship)
- `CareerExpressionAnalysisResult`: Resolution result (expressions, status, missingInputs, provenance)
- `CareerExpressionResolverInput`: Resolver input (mechanism candidates, optional 10H/10L context)

### `careerExpressionRules.ts`
- `CareerExpressionRule`: Rule descriptor (ruleId, mechanismTypes, expressionType, requiredContext, precedence)
- `CAREER_EXPRESSION_RULES`: Frozen array of rules
  - Primary 1:1 mappings (RESEARCH→RESEARCH_WORK, COMMUNICATION→COMMUNICATION_WORK, etc.)
  - Composite rules (RESEARCH+SPECIALIZED_KNOWLEDGE→ANALYTICAL_SPECIALIZED_WORK)

### `careerExpressionUtils.ts`
- `createCareerExpressionId`: Deterministic ID generation
- `createExpressionEvidenceId`: Evidence ID with ruleId + sorted sourceMechanismIds + sorted sourceEvidenceIds
- `createExpressionRuleId`: Rule ID generation
- `deduplicateExpressionCandidates`: Dedupe by (expressionType, canonical-source-set) with provenance merge
- `deduplicateExpressionEvidence`: Dedupe by evidenceId
- `mergeExpressionProvenances`: Merge provenance records
- `canonicalSortExpressionCandidates`: Canonical sort by expressionType then expressionId
- `sortExpressionParticipantIds`: Re-export of compareParticipantIds for convenience

### `defaultCareerExpressionResolver.ts`
- `DefaultCareerExpressionResolver`: Main resolver class
  - `resolve(input)`: CareerExpressionAnalysisResult
    - Normalize candidates (base + refinements)
    - Match rules against mechanismTypes
    - Emit candidate per matched rule
    - 10H/10L provenance context (add real upstream IDs to evidence/provenance, never establish)
    - Dedupe by (expressionType, canonical-source-set) merging provenance
    - Canonical sort
    - Immutable output (deep-frozen)
    - Missing input ≠ negative (emit missingInputs + PARTIAL/INSUFFICIENT_DATA)

### `index.ts`
- Re-exports all public APIs

## Boundary Enforcement

The careerExpression module enforces strict boundaries and must NOT import from:
- `careerDasha`
- `careerD10`
- `d10/`
- `careerFinalSynthesis`
- `domain/timing`
- `transit`
- `profession`
- `ai`
- Legacy `careerExpression.ts` (unless deliberately consumed)

Boundary enforcement is verified by `careerExpressionBoundary.test.ts` which scans all `.ts` files in the module for forbidden imports.

## Test Coverage

`careerExpressionResolver.test.ts` covers spec §33 scenarios A–N:
- A: Basic mechanism→expression
- B: Dispositor-refined mechanism→expression
- C: Multi-mechanism → multiple candidates
- D: Composite rule
- E: Dedupe-with-merged-provenance
- F: Determinism (run repeatedly → identical)
- G: Input immutability (Object.isFrozen on candidates after resolve)
- H: Provenance chain expression→mechanism→pattern→relationship
- I: Missing 10H/10L optional-context behavior
- J: Dasha/D10/transit/profession firewalls

## Implementation Status

**IMPLEMENTED — VERIFICATION PENDING**

### Completed
- ✅ Module structure with all required files
- ✅ Type definitions with naming collision resolution
- ✅ Expression rules (primary 1:1 + composite)
- ✅ Resolver implementation with invariant enforcement
- ✅ Utility functions (ID generation, deduplication, canonical sort)
- ✅ Public API re-exports
- ✅ Boundary test for forbidden imports
- ✅ Comprehensive test coverage (spec §33 A–N)

### Pending Verification
- ⏳ `npm run lint` (tsc --noEmit)
- ⏳ Test suite execution (careerExpression + careerMechanism + career10h)
- ⏳ Integration testing with dependent modules

## Key Design Decisions

### 1. Expression Type Vocabulary
Expression types are mapped 1:1 from mechanism types with a naming convention:
- EXPRESSION family → EXPRESSION expression
- EXECUTION family → WORK expression
- KNOWLEDGE family → KNOWLEDGE expression
- BUSINESS family → BUSINESS expression
- INSTITUTIONAL family → INSTITUTIONAL expression
- FOREIGN family → FOREIGN expression

Only expression types actually emitted by rules are included in the union, ensuring the vocabulary stays minimal and matched to CareerMechanismType.

### 2. Composite Rules
Composite rules are included only where justified. The exemplar from spec §23:
- RESEARCH + SPECIALIZED_KNOWLEDGE → ANALYTICAL_SPECIALIZED_WORK

Composite rules have higher precedence (200) to take priority over individual mechanism mappings.

### 3. 10H/10L Provenance Context
10H and 10L foundations are optional provenance context that attach upstream identity to expression evidence:
- When present: added to evidence as `source10HIds`/`source10LIds` (real upstream IDs only)
- When absent: treated as missing input (PARTIAL status), never as weakening
- Invariant: expressions are never emitted without a source mechanism
- P2-08A does NOT perform contextual expression refinement (10H/10L influencing rule matching) — that belongs to P2-08B

### 4. Missing Input ≠ Negative
Missing optional inputs (10H/10L) do not weaken expressions:
- PARTIAL status: expressions emitted, optional context missing
- INSUFFICIENT_DATA status: no expressions emitted (required inputs missing)
- Missing inputs are tracked in `missingInputs` array

### 5. Immutable Output
All resolver output is deep-frozen:
- Result object is frozen
- Arrays (expressions, sourceMechanismIds, missingInputs) are frozen
- Provenance object is frozen
- Nested objects (evidence, candidates) are frozen

## Future Work

- Expand expression vocabulary as additional mechanism→expression mappings are validated
- Add more composite rules where justified by astrological principles
- Integrate with profession layer (future P2-09)
- Add Dasha activation support (future P2-10)
- Add D10 refinement support (future P2-11)
