# CW-R1 — Career Convergence Contract

## Status

Design document for target architecture. No code changes in this PR. Astronomy/Dasha/Varga/transit calculations unchanged.

## 1. Purpose

This contract defines the migration path from the current dual-product/legacy Career reasoning state to a single canonical Career pipeline (C4–C11). It establishes:

- The current transitional state with two parallel production paths
- The target canonical architecture with clear authority boundaries
- Migration invariants that preserve correctness during transition
- Convergence steps to integrate Product B components into the authoritative production path
- Validation criteria for cutover to the target architecture

## 2. Current Dual-Product / Transitional State

### 2.1 Current Production Authority

The current production Career result is produced by `interpretCareerV2` in `src/domain/career/CareerDomainInterpreterV2.ts`. This interpreter executes a hybrid transitional path that consumes components from both Product A (legacy) and Product B (canonical) at different integration levels.

### 2.2 Product A

Product A is the legacy production Career reasoning path. It provides the foundational Career semantic source that currently drives production results.

```
Legacy Career semantic source
        ↓
ThemeInterpretation
        ↓
CareerEvidenceMapper
        ↓
CW-01 structural/domain hierarchy
        │
        ├───────────────┐
        ▼               ▼
   Career Dasha     Career Timing
        │
        ▼
  Career Manifestation
        │
        ▼
 Legacy CW-05 Final Synthesis
```

Product A components are documented in the C1 freeze document (`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`).

### 2.3 Product B

Product B is the canonical Career reasoning pipeline comprising modules C4–C11. It produces the canonical Career structural interpretation and evidence used to derive the natal Career promise.

Product B modules:
- C4: `careerStructuralReasoning` — canonical Career structure
- C5: `careerPlanetaryRelevance` — planetary relevance scoring
- C6: `careerPlanetaryCondition` — planetary condition evaluation
- C7: `interpretCareerLordRelationship` — lord relationship interpretation
- C8: `careerExpression` — Career expression modes
- C9: `careerDashaActivation` — Dasha activation synthesis
- C10: `careerD10Qualification` — D10 qualification synthesis
- C11: `careerFinalSynthesis` — final Career synthesis

Note: C9 (Dasha) and C10 (D10) are NOT themselves natal Career promise. They operate as activation and qualification layers on top of the natal Career foundation produced by C4–C8. The layering is: Natal foundation → Career promise → Expression/qualification → Activation → Timing → Final synthesis.

### 2.4 Current Integration Boundary

Product B components exist at different levels of integration. The Career Dasha synthesis, Career timing synthesis, Career manifestation synthesis, and the legacy CW-05 final synthesis are already consumed by `interpretCareerV2`. However, the complete C4–C11 canonical reasoning pipeline does not currently control the production Career result.

Specifically:
- `interpretCareerV2` calls `buildCareerDashaSynthesis(...)` (line ~300)
- `interpretCareerV2` calls `synthesizeCareerTransit(...)` (line ~308)
- `interpretCareerV2` calls `synthesizeCareerTiming(...)` (line ~309)
- `interpretCareerV2` calls manifestation synthesis
- `interpretCareerV2` calls legacy CW-05 final synthesis (`synthesizeCareerFinal`)

The pure C4–C11 canonical semantic modules (`careerStructuralReasoning`, `careerPlanetaryRelevance`/`interpretCareerPlanetaryRelevance`, `careerPlanetaryCondition`, `interpretCareerLordRelationship`, `careerExpression`, C9 `careerDashaActivation`, C10 `careerD10Qualification`, C11 `careerFinalSynthesis`) are NOT imported/called by the interpreter.

### 2.5 Current Migration State

**Authoritative Right Now:**
- C4 `careerStructuralReasoning`: Additively integrated, not yet legacy-replacement authority
- C5–C8: Not fully production integrated
- C9/C10: Partial integration (Dasha/D10 synthesis components consumed by interpreter)
- C11: Not production-authoritative
- Legacy Product A: Retained for comparison and controlled parity during transition

**Canonical Target Authority:**
- C4–C11 pipeline will become the authoritative production source
- Legacy Product A will be demoted to non-authoritative status or removed

## 3. Target Architecture

### 3.1 Canonical Career Pipeline

The target architecture uses a single canonical pipeline from C4 through C11:

```
Canonical Career Structural Evidence
             ↓
        C4 Structure
             ↓
    C5/C6 Planetary Semantics
             ↓
        C8 Expression
             ↓
    ┌────────┴────────┐
    ▼                 ▼
   C10               C9
   D10              Dasha
    │                 │
    └────────┬────────┘
             ▼
          Timing
             ↓
       C11 Final
             ↓
       DomainEvidence
             ↓
     Career Interpretation
```

### 3.2 Authority Boundaries

The canonical pipeline establishes clear authority boundaries:
- C4–C8: Authoritative producer of natal Career structural evidence and promise
- C9: Authoritative producer of Dasha activation insights
- C10: Authoritative producer of D10 qualification insights
- C11: Authoritative producer of final Career synthesis
- DomainEvidence: Canonical evidence envelope for all Career evidence

### 3.3 DomainEvidence Boundary

DomainEvidence remains the canonical Career evidence envelope. All Career evidence from C4–C11 must flow through DomainEvidence with proper identityKey and sourceIds deduplication per the canonical evidence dedup contract.

### 3.4 Dasha Boundary

Dasha (C9) is an activation layer, not a natal Career promise engine. Dasha identifies WHEN and HOW the natal Career promise activates, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent Dasha from being treated as a parallel Career-promise source.

### 3.5 D10 Boundary

D10 (C10) is a qualification/confirmation layer, not a natal Career promise engine. D10 qualifies and confirms Career potential from the natal foundation, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent D10 from being treated as a parallel Career-promise source.

### 3.6 Timing Boundary

Transit timing is a timing layer, not a natal Career promise engine. Transit identifies WHEN Career themes manifest, but does not independently establish Career promise. The target architecture must preserve this boundary to prevent transit from being treated as a parallel Career-promise source.

## 4. Migration Invariants

### 4.1 Preserved C1 Invariants

The following C1 invariants remain in force during migration:
- DomainEvidence remains the canonical Career evidence envelope
- Career evidence mapping remains the boundary between engine evidence and domain reasoning
- Career reasoning must not recalculate natal astrology
- D10 cannot establish Career promise independently
- Dasha cannot establish natal Career promise independently
- Transit cannot establish natal Career promise independently
- Missing evidence is not negative evidence
- Existing Career rule IDs must not silently change
- Existing manifestation modes must not silently change

### 4.2 Superseded C1 Invariant #2

C1 Invariant #2 ("ThemeInterpretation remains the authoritative producer of existing Career evidence") is superseded by this convergence contract for the target architecture. It remains the accurate description of the current legacy production producer, but the canonical C4–C11 pipeline will become the authoritative producer for the target architecture.

### 4.3 No Hybrid Authority

During migration, Product A and Product B may be executed side-by-side for comparison/parity, but their conclusions must not be silently combined into a third undocumented hybrid Career conclusion.

Permitted shape:
```
Product A ────────┐
                  ├──→ Comparison / parity
Product B ────────┘
```

Forbidden shape:
```
Product A ────────┐
                  ├──→ Undocumented hybrid conclusion
Product B ────────┘
```

All authoritative Career conclusions must come from a single, documented source at any point in time.

### 4.4 No Double Counting

Migration must respect the existing canonical evidence dedup contract (identityKey vs sourceIds). The same Career evidence must not be counted multiple times across Product A and Product B components. When C4–C11 become authoritative, legacy Product A evidence must be properly deduplicated or excluded to prevent double-counting.

## 5. Convergence Steps

### 5.1 Structural integration

Integrate C4 `careerStructuralReasoning` additively into the production Career path. C4 becomes the canonical structural reasoning implementation for the migration target, but during the transitional phase does NOT yet replace the legacy CW-01 structural hierarchy authority. The legacy structural reasoning remains available for controlled parity/comparison until the canonical C4–C7 path is production-authoritative.

### 5.2 Planetary integration

Integrate C5 `careerPlanetaryRelevance` and C6 `careerPlanetaryCondition` as the authoritative producers of planetary semantics. This step will establish the flow from C5/C6 to DomainEvidence, replacing legacy planetary relevance sources for the target architecture.

### 5.3 Expression integration

Integrate C8 `careerExpression` as the authoritative producer of Career expression modes. This step will establish the flow from C8 to DomainEvidence, replacing legacy manifestation mappings for the target architecture.

### 5.4 Dasha integration

Elevate C9 `careerDashaActivation` to authoritative status for Dasha activation insights. The Career Dasha synthesis is already consumed by `interpretCareerV2`; this step ensures C9 controls the production result rather than being a secondary input.

### 5.5 D10 integration

Elevate C10 `careerD10Qualification` to authoritative status for D10 qualification insights. Ensure C10 controls the production result rather than being a secondary confirmation layer.

### 5.6 C11 integration

Integrate C11 `careerFinalSynthesis` as the authoritative final Career synthesis. This step will replace the legacy CW-05 final synthesis with C11 as the final decision point for the target architecture.

### 5.7 Legacy demotion

Demote the legacy CW-05 final synthesis to an internal compatibility layer. It may be retained temporarily for parity comparison or fallback, but must not remain as a second authoritative engine. The authoritative production result must come from C11.

Note: The conceptual sequence above (C4→C5→C6→…→C11) is presented for clarity, but the migration contract must not prescribe a false implementation order. The real dependencies form a graph:

```
                 Career Structure
                 /      |       \
                ↓       ↓        ↓
           Relevance  Expression D10
                ↓        ↑        ↑
             Condition ──┘        │
                                  │
               Dasha ─────────────┘
                  │
                  ▼
               Timing
                  │
                  ▼
                 C11
```

Migration must respect these actual dependencies rather than imposing a strict linear chain.

## 6. Validation / Cutover Criteria

Cutover to the target architecture is validated when:
- C4–C11 are all imported and called by `interpretCareerV2`
- The canonical C4–C11 pipeline controls the production Career result
- Legacy Product A components are demoted to non-authoritative status or removed
- DomainEvidence contains only canonical evidence from C4–C11 with proper deduplication
- All migration invariants are satisfied (no hybrid authority, no double-counting)
- Boundary conditions are preserved (Dasha/D10/Timing as layers, not promise engines)
- Test coverage validates parity with legacy results where appropriate
- Production Career behavior matches the target architecture specification

## 7. Explicit Non-Goals

This PR is documentation-only. No code changes are introduced. The following are explicitly out of scope:
- Implementation of the target architecture
- Modification of `interpretCareerV2` or any source code
- Changes to astronomy, Dasha, Varga, or transit calculations
- Changes to test suites or build configuration
- Package dependency changes or `package-lock.json` modifications

The convergence contract is a forward-looking design document. Implementation will occur in subsequent PRs following this contract.

## 8. Final Target State

The final target state is a single canonical Career pipeline (C4–C11) that:
- Produces authoritative Career structural evidence from C4–C8
- Applies Dasha activation insights from C9
- Applies D10 qualification insights from C10
- Synthesizes the final Career result from C11
- Flows all evidence through DomainEvidence with proper deduplication
- Preserves clear boundaries between natal promise, activation, qualification, and timing layers
- Eliminates hybrid authority and double-counting
- Demotes legacy Product A components to non-authoritative status or removes them

This target state provides a clean, maintainable architecture for Career reasoning with single sources of truth for each semantic layer.

## 9. C4 MIXED Evidence Identity Contract

C4 MIXED structural evidence represents one semantic structural fact with multiple directional occurrences.

A MIXED structural fact may be represented as:
- one SUPPORTING occurrence
- one CHALLENGING occurrence

The occurrence IDs MUST remain distinct because they represent distinct occurrences.

The semantic identity MUST remain shared.

Therefore:

```text
occurrenceId(SUPPORTING) != occurrenceId(CHALLENGING)

identityKey(SUPPORTING) == identityKey(CHALLENGING)
```

Both occurrences MUST preserve:
- the same canonical rule identity;
- the same semantic subject/object identity;
- `provenance.effect = MIXED`;
- their individual occurrence IDs.

During canonical reasoning deduplication:
```
SUPPORT + CHALLENGE → MIXED
```

The canonical record MUST:
- contain one semantic identity;
- preserve both occurrence IDs through `sourceIds`;
- report the appropriate occurrence count;
- retain the maximum single-occurrence weight;
- never sum duplicate occurrence weights.

This contract prevents duplicate representations of one underlying structural fact from independently contributing to the Career conclusion.

## W0.2 — Canonical Evidence Identity & Deduplication

### W0.2.1 Three Identity Levels

The canonical evidence identity engine operates at three distinct identity levels:

1. **Occurrence ID (evidenceId)** — Unique identifier for each evidence occurrence. Includes effect/strength in the identifier. Format: `CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]-<EFFECT>-<STRENGTH>`

2. **Semantic Identity Key (identityKey)** — Canonical semantic identity. Excludes effect/strength to enable identity-based deduplication. Same fact with different direction/strength shares the same identityKey. Format: `CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]`

3. **Source IDs (sourceIds)** — Array of all occurrence IDs that were merged into the canonical fact. Provides provenance traceability to original input evidence items.

Relationship:
```
occurrenceId(SUPPORT) != occurrenceId(CHALLENGE)
identityKey(SUPPORT) == identityKey(CHALLENGE)
sourceIds = [occurrenceId(SUPPORT), occurrenceId(CHALLENGE), ...]
```

### W0.2.2 Two-Stage Canonical Pipeline

The canonical deduplication engine uses a two-stage pipeline:

```
DomainEvidence[]
        ↓
classifyReasoningEvidence
        ↓
WeightedReasoningEvidence[] (with identityKey derived from provenance/ruleId + planet/house)
        ↓
deduplicateReasoningEvidence
        ↓
CanonicalReasoningEvidence[] (grouped by identityKey, merged, tracked)
```

Stage 1: `classifyReasoningEvidence` (reasoningHierarchy.ts)
- Derives identityKey from provenance if available, otherwise from ruleId + planet/house
- Converts DomainEvidence → WeightedReasoningEvidence
- Computes layer, direction, strength, and weight

Stage 2: `deduplicateReasoningEvidence` (deduplicateEvidence.ts)
- Groups evidence by identityKey
- Merges conflicting directions and strengths
- Tracks occurrenceCount and sourceIds
- Returns MAX weight (never sum)
- Sorts deterministically by identityKey

### W0.2.3 Direction Merge Table

The canonical direction merge table (mergeEvidenceDirection):

```
SUPPORT + SUPPORT → SUPPORT
CHALLENGE + CHALLENGE → CHALLENGE
SUPPORT + CHALLENGE → MIXED (either order)
MIXED + anything → MIXED
NEUTRAL + X → X
UNAVAILABLE + X → X (UNAVAILABLE never becomes negative/positive on its own)
```

### W0.2.4 Strength Merge (MAX Rule)

Evidence strength merge (mergeEvidenceStrength) uses MAX on the ordered scale:

```
WEAK < MODERATE < STRONG < VERY_STRONG

WEAK + STRONG → STRONG (not VERY_STRONG)
MODERATE + VERY_STRONG → VERY_STRONG
```

Duplicate occurrences do NOT increase evidentiary weight — the max single-occurrence weight is retained.

### W0.2.5 Determinism Guarantee

The canonical pipeline guarantees deterministic output:

- Evidence is sorted by identityKey in the final result
- Canonical layer selection uses fixed precedence order: PRIMARY_PROMISE > SECONDARY_SUPPORT > MODIFIER > YOGA > VARGA > DASHA > TRANSIT
- sourceIds and relatedEvidenceIds are sorted alphabetically
- Statement selection uses highest weight, tie-break by evidenceId localeCompare
- deduplicateReasoningEvidence(input) twice yields identical deep-equal results
- Input order does not affect output: deduplicateReasoningEvidence([A,B]) === deduplicateReasoningEvidence([B,A])

### W0.2.6 Identity Mechanism Resolution

The codebase contains TWO identity mechanisms that serve different purposes:

1. **`buildEvidenceIdentityKey`** (evidenceIdentity.ts) — The single canonical dedup identity mechanism. Used by `classifyReasoningEvidence` to derive identityKey for canonical deduplication. Based on domain, axis, source, ruleId, subjectKey, and objectKey. Excludes effect/strength to enable semantic identity-based deduplication.

2. **`getEvidenceIndependenceKey`** (ManifestationMode.ts) — A distinct, non-competing manifestation-scoping heuristic. Used to group evidence for manifestation independence analysis (Spec §12). Based on sourceType, base ruleId, source, phase, planet, and house. Answers a different question ("are these evidence items independent factors?") than dedup identity ("are these the same semantic fact?").

These mechanisms are complementary and do not violate the "one canonical dedup mechanism" invariant:
- `buildEvidenceIdentityKey` is the authoritative dedup identity for the canonical pipeline
- `getEvidenceIndependenceKey` is a separate heuristic for manifestation status resolution
- They operate at different layers and answer different questions
- The existence of `getEvidenceIndependenceKey` does not create a competing dedup implementation

### W0.2.7 Contract Test Coverage

The canonical evidence identity and deduplication contract is validated by `src/domain/reasoning/canonicalEvidenceIdentity.contract.test.ts`, which tests spec §16 groups A–J:

- A: same identity + same direction → one canonical record
- B: SUPPORT + CHALLENGE (same identityKey) → direction MIXED, occurrenceCount 2
- C: SUPPORT weight 3 + CHALLENGE weight 2 → MIXED, canonical weight 3 (never 5)
- D: both occurrence ids survive in sourceIds
- E: identityKey(SUPPORT) === identityKey(CHALLENGE) while occurrence ids differ
- F: order independence — dedup([A,B]) deep-equals dedup([B,A])
- G: three occurrences (SUPPORT 3, SUPPORT 2, CHALLENGE 1) → MIXED, weight 3, occurrenceCount 3
- H: false-dedup protection — different ruleId produces different identityKeys
- I: deduplicateReasoningEvidence([]) returns [] (missing evidence is not negative evidence)
- J: merging preserves ruleId, sourceIds, provenance-derived identityKey

## W0.3 — Career Semantic Ownership

### W0.3.1 Ownership Table

One canonical owner per Career semantic concept, using the numbering established in §2.3:

| Semantic Concept | Canonical Owner | Module/Component |
|------------------|-----------------|------------------|
| Career house structure and C4 structural evidence | C4 | `careerStructuralReasoning` |
| Planetary relevance semantics | C5 | `careerPlanetaryRelevance` |
| Planetary condition evaluation | C6 | `careerPlanetaryCondition` |
| Lord relationship semantics | C7 | `interpretCareerLordRelationship` |
| Career expression | C8 | `careerExpression` |
| Dasha activation | C9 | `careerDashaActivation` |
| D10 qualification | C10 | `careerD10Qualification` |
| Timing | Timing layer | Transit timing synthesis |
| Final conclusion | C11 | `careerFinalSynthesis` |
| Evidence identity | DomainEvidence | Canonical evidence envelope |
| Evidence normalization/deduplication | deduplicateReasoningEvidence | Canonical evidence deduplication pipeline |
| Reasoning trace | Canonical Career reasoning trace | Trace/provenance assembly layer |
| UI explanation | Presentation layer | Display formatting |
| AI explanation | AI layer | AI-specific interpretation |

### W0.3.2 Central Invariant

ONE SEMANTIC CONCEPT → ONE AUTHORITY → ONE CANONICAL RESULT → MANY CONSUMERS

No module may independently recalculate another module's owned concept. Each semantic concept has exactly one authoritative producer. Other modules may consume the canonical result but must not produce their own version of the same concept.

### W0.3.3 Dependency Direction

Intended semantic dependency flow (not a linear implementation order):

```
C4 → C5 → C6 → C7 → Natal Career → C8 → {C9, C10, Timing} → C11
```

This represents the semantic dependency relationship between concepts. It does NOT prescribe a strict linear build order — actual implementation dependencies form a graph as documented in §5.7 (lines 220–239). Migration must respect the actual dependency graph rather than imposing a false linear chain.

### W0.3.4 Per-Owner Boundary Notes

**C4 `careerStructuralReasoning`**
- Owns: Career house structure and C4 structural evidence
- Must NOT: Recalculate planetary relevance, condition, or lord relationships delegated to C5–C7
- Note: Currently additively integrated (see §2.5 migration state)

**C5 `careerPlanetaryRelevance`**
- Owns: Career planetary relevance semantics, including relevance classification/scoring where applicable
- Must NOT: Independently establish Career structural facts (owned by C4) or bypass C4 relevance gating
- Note: Relevance gates C6 condition evaluation

**C6 `careerPlanetaryCondition`**
- Owns: Planetary condition evaluation
- Must NOT: Operate without C5 relevance gating; must not become a second relevance source
- Note: Condition is relevance-gated by C5

**C7 `interpretCareerLordRelationship`**
- Owns: Lord relationship semantics
- Must NOT: Recalculate structural reasoning (C4) or bypass C5/C6 relevance/condition gates

**C8 `careerExpression`**
- Owns: Career expression modes
- Must NOT: Become a second natal-promise source; must operate on natal Career foundation from C4–C7
- Note: Expression modes qualify the natal Career promise, not replace it

**C9 `careerDashaActivation`**
- Owns: Dasha activation insights
- Must NOT: Create natal Career promise; must operate as activation layer on natal foundation
- Note: See §3.4 Dasha Boundary — Dasha is an activation layer, not a natal Career promise engine

**C10 `careerD10Qualification`**
- Owns: D10 qualification insights
- Must NOT: Create natal Career promise; must operate as qualification layer on natal foundation
- Note: See §3.5 D10 Boundary — D10 is a qualification layer, not a natal Career promise engine

**Timing layer**
- Owns: Transit timing synthesis
- Must NOT: Create natal Career promise; must operate as timing layer on natal foundation
- Note: See §3.6 Timing Boundary — Transit timing is a timing layer, not a natal Career promise engine

**C11 `careerFinalSynthesis`**
- Owns: Final Career synthesis
- Must NOT: Silently recalculate C4–C10 concepts; must synthesize from canonical outputs of upstream modules
- Note: C11 is the final decision point that consumes, not replaces, upstream authority

**DomainEvidence**
- Owns: Canonical evidence identity and deduplication
- Must NOT: Allow duplicate representations of the same semantic fact; must enforce identityKey-based dedup
- Note: See W0.2 for canonical evidence identity contract

**Evidence normalization/deduplication**
- Owns: Canonical evidence deduplication pipeline (deduplicateReasoningEvidence)
- Must NOT: Allow silent double-counting; must preserve sourceIds and occurrenceCount
- Note: See W0.2.2 for two-stage canonical pipeline

**Canonical Career reasoning trace**
- Owns: Trace/provenance assembly layer for complete Career reasoning chain
- Must NOT: Conflate evidence deduplication with full reasoning chain assembly
- Note: Trace assembly spans C4→C5→C6→C7→Natal Career→C8→{C9,C10,Timing}→C11

**Presentation layer (UI)**
- Owns: Display formatting and user-facing explanation
- Must NOT: Independently compute Career semantics; must consume canonical output from C4–C11
- Note: UI is a consumer, not a producer, of Career semantics

**AI layer**
- Owns: AI-specific interpretation formatting
- Must NOT: Independently compute Career semantics; must consume canonical output from C4–C11
- Note: AI is a consumer, not a producer, of Career semantics

### W0.3.5 Prohibition of Duplicate/Hybrid Authority

Legacy + canonical execution is permitted for comparison/parity ONLY during migration. Silent combination into a production conclusion is forbidden.

Permitted shape (from §4.3):
```
Product A ────────┐
                  ├──→ Comparison / parity
Product B ────────┘
```

Forbidden shape (from §4.3):
```
Product A ────────┐
                  ├──→ Undocumented hybrid conclusion
Product B ────────┘
```

All authoritative Career conclusions must come from a single, documented source at any point in time. No module may silently combine its own calculation with another module's canonical output to produce a hybrid result.

### W0.3.6 Migration State Clarification

Current migration state (from §2.5):
- C4 `careerStructuralReasoning`: Additively integrated, not yet legacy-replacement authority
- C5–C8: Not fully production integrated
- C9/C10: Partial integration (Dasha/D10 synthesis components consumed by interpreter)
- C11: Not production-authoritative
- Legacy Product A: Retained for comparison and controlled parity during transition

Canonical target authority:
- C4–C11 pipeline will become the authoritative production source
- Legacy Product A will be demoted to non-authoritative status or removed

This ownership contract establishes the target authority boundaries. During migration, legacy components remain available for controlled parity comparison but must not silently combine with canonical outputs to produce hybrid authoritative conclusions.
