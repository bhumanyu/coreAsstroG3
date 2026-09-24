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

## W0.4 — Canonical Evidence Identity Contract

### W0.4.1 Central Invariant

The canonical evidence identity engine enforces one fundamental invariant:

```
ONE SEMANTIC FACT → ONE identityKey → MANY OCCURRENCES → sourceIds[]
```

A single semantic astrological fact (e.g., "Jupiter aspects the 10th house") is represented by exactly one semantic identity (identityKey). This fact may appear multiple times across different layers, representations, or reasoning passes (many occurrences). All occurrence IDs are preserved in the sourceIds array for provenance traceability.

Example from C4 MIXED evidence:
- One semantic fact: Jupiter's relationship to the 10th house
- One identityKey: `CW-CAREER-NATAL-D1-JUPITER_10TH_ASPECT-JUPITER-HOUSE_10`
- Two occurrences: one SUPPORTING, one CHALLENGING
- sourceIds: `[occurrenceId(SUPPORT), occurrenceId(CHALLENGE)]`
- occurrenceCount: 2

This invariant prevents duplicate representations of the same underlying fact from independently contributing to the Career conclusion.

### W0.4.2 Three Identity Levels

Per W0.2.1, the canonical evidence identity engine operates at three distinct identity levels:

1. **Occurrence ID (evidenceId)** — Unique identifier for each evidence occurrence. Includes effect/strength in the identifier. Format: `CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]-<EFFECT>-<STRENGTH>`

2. **Semantic Identity Key (identityKey)** — Canonical semantic identity. Excludes effect/strength to enable identity-based deduplication. Same fact with different direction/strength shares the same identityKey. Format: `CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]`

3. **Source IDs (sourceIds)** — Array of all occurrence IDs that were merged into the canonical fact. Provides provenance traceability to original input evidence items.

Relationship:
```
occurrenceId(SUPPORT) != occurrenceId(CHALLENGE)
identityKey(SUPPORT) == identityKey(CHALLENGE)
sourceIds = [occurrenceId(SUPPORT), occurrenceId(CHALLENGE), ...]
```

**Critical distinction:** Semantic identity (identityKey) != occurrence identity (evidenceId). The same semantic fact can have multiple occurrence IDs (different directions, strengths, layers) but must share one identityKey.

### W0.4.3 DomainEvidence Envelope Contract

The canonical evidence envelope is defined in `src/domain/interpretation/DomainEvidence.ts` and `DomainInterpretationTypes.ts`. The field-by-field contract:

- **id / evidenceId** — Occurrence identifier. Includes effect/strength. Distinct for each occurrence of the same semantic fact.

- **ruleId** — Canonical rule identifier. Preserved from first occurrence during deduplication. Does not vary across occurrences of the same semantic fact.

- **identityKey** — Derived semantic identity key. Computed by `buildEvidenceIdentityKey` (evidenceIdentity.ts) based on domain, axis, source, ruleId, subjectKey, and objectKey. Excludes effect/strength. Same for all occurrences of the same semantic fact.

- **provenance** — EvidenceProvenance object with fields:
  - domain: EvidenceDomain (CAREER/WEALTH)
  - axis: EvidenceAxis (NATAL/DASHA/TIMING)
  - source: EvidenceSource (D1/D2/D10/DASHA/TRANSIT/C4_STRUCTURAL_REASONING)
  - effect: EvidenceEffect (SUPPORT/CHALLENGE/NEUTRAL/MIXED/UNAVAILABLE)
  - strength: EvidenceStrength (PRIMARY/STRONG/MODERATE/WEAK)

- **polarity** — EvidencePolarity from DomainEvidence. EXACTLY three values:
  - SUPPORTING
  - CHALLENGING
  - NEUTRAL

  Note: MIXED and UNAVAILABLE exist only at the reasoning-direction level (ReasoningDirection in reasoningTypes.ts), not at the DomainEvidence.polarity level. Reference W0.2.3 direction merge table.

- **strength** — EvidenceStrength from DomainEvidence. Ordered scale:
  - VERY_STRONG
  - STRONG
  - MODERATE
  - WEAK

- **weight** — Reasoning-derived composite weight (layerWeight * strengthWeight). MAX-not-SUM: duplicate occurrences do not increase evidentiary weight; the max single-occurrence weight is retained. Explicitly "weight is not identity" — weight varies by layer/strength but does not affect semantic identity.

- **role** — EvidenceRole from DomainEvidence. Five values:
  - PRIMARY
  - SECONDARY
  - MODIFIER
  - CONFIRMATION
  - TIMING

  **CRITICAL DISTINCTION:** EvidenceRole (DomainEvidence.role field, 5 values) is NOT the same as ReasoningLayer (PRIMARY_PROMISE/SECONDARY_SUPPORT/MODIFIER/YOGA/VARGA/DASHA/TRANSIT, 7 values used for layer precedence in deduplicateReasoningEvidence). Do not document the layer set as if it were the role union.

- **phase** — EvidencePhase from DomainEvidence. Examples:
  - NATAL_PROMISE
  - DASHA_ACTIVATION
  - TRANSIT_TRIGGER
  - VARGA_CONFIRMATION
  - MODIFIER

- **source** — EvidenceSource from DomainEvidence. Examples:
  - D1
  - D2
  - D10
  - DASHA
  - TRANSIT
  - C4_STRUCTURAL_REASONING

### W0.4.4 Subject/Object Identity Derivation

Subject and object identity are derived in `classifyReasoningEvidence` (reasoningHierarchy.ts) and feed into `buildEvidenceIdentityKey`:

- **subjectKey** — Derived from planet field (e.g., JUPITER, SATURN) or house alone (e.g., HOUSE_10). Deterministic and normalized. Must not invent new subject vocabulary.

- **objectKey** — Derived from house field when planet is also present (e.g., HOUSE_10). Optional for facts without an object.

Derivation logic (classifyReasoningEvidence):
- planet + house → subjectKey = planet, objectKey = HOUSE_<house>
- planet only → subjectKey = planet, objectKey = undefined
- house only → subjectKey = HOUSE_<house>, objectKey = undefined
- neither → fallback to occurrence ID, subjectKey = UNKNOWN

Subject/object must be deterministic and normalized. The identity key construction uses these subject/object keys to distinguish semantic facts (e.g., JUPITER/HOUSE_10 vs JUPITER/HOUSE_7 are different semantic facts).

### W0.4.5 Root Evidence Link (Forward-Looking)

Root evidence linkage is a forward-looking (W1) concept. The current repository does NOT implement a rootEvidenceId field:

- Verified: zero grep matches for "rootEvidenceId" in the codebase
- Current linkage field: `relatedEvidenceIds` in DomainEvidence
- W0.4 does NOT introduce a new root-link mechanism

Future W1 work may establish a root evidence tree structure for evidence dependency tracking, but this is outside the scope of W0.4.

### W0.4.6 Reference to Existing Identity & Dedup Mechanisms

W0.4 references (does not restate in full) the existing mechanisms documented in W0.2:

- **W0.2.3 Direction Merge Table** — SUPPORT + CHALLENGE → MIXED, with full merge rules for all direction combinations.

- **W0.2.4 MAX-Strength Rule** — Evidence strength merge uses MAX on the ordered scale (WEAK < MODERATE < STRONG < VERY_STRONG). Duplicate occurrences do NOT increase evidentiary weight.

- **W0.2.5 Determinism Guarantee** — Evidence sorted by identityKey, fixed layer precedence, sorted sourceIds/relatedEvidenceIds, input-order independence.

- **W0.2.6 Identity Mechanism Resolution** — Two complementary mechanisms:
  - `buildEvidenceIdentityKey` — Canonical dedup identity (evidenceIdentity.ts)
  - `getEvidenceIndependenceKey` — Separate manifestation-scoping heuristic (ManifestationMode.ts)
  - They serve different purposes and do not violate the "one canonical dedup mechanism" invariant.

### W0.4.7 Source/Phase/Role Preservation Through Dedup

Current behavior from `deduplicateReasoningEvidence` (deduplicateEvidence.ts):

- **Canonical layer selection** — Deterministic based on fixed precedence order: PRIMARY_PROMISE > SECONDARY_SUPPORT > MODIFIER > YOGA > VARGA > DASHA > TRANSIT. The highest-precedence layer present in the occurrence set becomes the canonical layer.

- **Layers set retention** — The `layers` field in CanonicalReasoningEvidence contains the full set of all occurrence layers, sorted by precedence. This preserves which layers contributed to the canonical fact.

- **ruleId preservation** — Taken from the first occurrence with a ruleId. Not merged or changed.

- **sourceIds preservation** — All distinct occurrence IDs are accumulated and sorted alphabetically. Provides complete provenance traceability.

- **role/phase/source preservation** — The current implementation does NOT merge role, phase, or source fields. The canonical record's role/phase/source values come from the selected canonical layer (the highest-precedence occurrence). This is the actual current behavior; W0.4 does not introduce a new merge rule for these fields.

### W0.4.8 Invariants Checklist

W0.4 establishes the following invariants:

- [ ] ONE SEMANTIC FACT → ONE identityKey → MANY OCCURRENCES → sourceIds[]
- [ ] Semantic identity (identityKey) != occurrence identity (evidenceId)
- [ ] identityKey excludes effect/strength to enable semantic deduplication
- [ ] occurrenceId includes effect/strength to distinguish occurrences
- [ ] EvidenceRole (5 values) != ReasoningLayer (7 values) — distinct concepts
- [ ] polarity is exactly SUPPORTING/CHALLENGING/NEUTRAL (MIXED/UNAVAILABLE are reasoning-direction only)
- [ ] weight is MAX-not-SUM (duplicate occurrences do not increase weight)
- [ ] subject/object identity is deterministic and normalized
- [ ] rootEvidenceId does not exist in current repo (forward-looking W1 concept)
- [ ] source/phase/source preservation follows actual deduplicateReasoningEvidence behavior
- [ ] buildEvidenceIdentityKey is the canonical dedup identity mechanism
- [ ] getEvidenceIndependenceKey is a separate heuristic (not a competing dedup implementation)

### W0.4.9 Contract Test Coverage (Extended)

The canonical evidence identity contract is validated by `src/domain/reasoning/canonicalEvidenceIdentity.contract.test.ts`, which tests spec §16 groups A–L:

- A: same identity + same direction → one canonical record
- B: SUPPORT + CHALLENGE (same identityKey) → direction MIXED, occurrenceCount 2
- C: SUPPORT weight 3 + CHALLENGE weight 2 → MIXED, canonical weight 3 (never 5)
- D: both occurrence ids survive in sourceIds
- E: identityKey(SUPPORT) === identityKey(CHALLENGE) while occurrence ids differ
- F: order independence — dedup([A,B]) deep-equals dedup([B,A])
- G: three occurrences (SUPPORT 3, SUPPORT 2, CHALLENGE 1) → MIXED, weight 3, occurrenceCount 3
- H: false-dedup protection — different ruleId produces different identityKeys
- K: false-dedup protection — different object (house) produces different identityKeys (same ruleId + same planet, different house → not merged)
- L: false-dedup protection — different subject (planet) produces different identityKeys (same ruleId + different planet, same house → not merged)

## W0.5 — Test Gates

### W0.5.1 Six Test Gates

The canonical Career pipeline validation uses six test gates:

1. **TypeScript Compilation** — Verify all TypeScript code compiles without errors. This catches type mismatches, missing imports, and syntax errors before runtime.

2. **Changed-Module Unit Tests** — Run unit tests for modules that were changed in the current PR. This validates that changes do not break existing functionality at the module level.

3. **Career Integration Tests** — Run integration tests for the Career domain. This validates that the Career pipeline produces correct results end-to-end, including evidence flow through C4–C11.

4. **Determinism** — Verify that the canonical pipeline produces deterministic output. Run deduplicateReasoningEvidence(input) twice and verify deep-equal results. Verify input-order independence (dedup([A,B]) === dedup([B,A])).

5. **Golden Tests** — Compare current output against golden fixtures for Career and Wealth domains. Existing fixtures:
   - `src/domain/career/career-v2-golden.fixture.ts`
   - `src/domain/wealth/wealth-v2-golden.fixture.ts`

   Golden tests validate that changes do not unexpectedly alter canonical outputs for known inputs.

6. **Legacy-vs-Canonical Comparison** — Compare legacy Product A output with canonical Product B output. This is a semantic-dimension comparison, not JSON===JSON. Parity is allowed (canonical may differ from legacy while still being correct). Hybrid authority is forbidden — cross-reference §4.3. The comparison must explain differences and classify them as:

   - Acceptable parity (canonical correct, legacy outdated/incorrect)
   - Acceptable improvement (canonical fixes legacy bug)
   - Regression (canonical breaks working legacy behavior)
   - Inconclusive (requires manual review)

### W0.5.2 Gate Applicability Matrix

| Gate | W0.1–W0.4 | W1+ |
|------|----------|-----|
| TypeScript Compilation | Required | Required |
| Changed-Module Unit Tests | Required | Required |
| Career Integration Tests | Required | Required |
| Determinism | Required | Required |
| Golden Tests | Optional (if no canonical output changes) | Required |
| Legacy-vs-Canonical Comparison | Optional (if no legacy integration) | Required |

W0.1–W0.4 are foundational contract work without canonical output changes, so golden tests and legacy comparison are optional. W1+ changes canonical outputs, so all six gates are required.

### W0.5.3 Failure Policy

- **TypeScript Compilation** — Hard stop. Must fix compilation errors before proceeding.

- **Changed-Module Unit Tests** — Hard stop. Must fix failing unit tests before proceeding.

- **Career Integration Tests** — Hard stop. Must fix failing integration tests before proceeding.

- **Determinism** — Hard stop. Must fix non-deterministic behavior before proceeding.

- **Golden Tests** — Requires explained approval. If golden tests fail:
  - Explain why the change is correct (golden fixture may be outdated)
  - Update golden fixture if appropriate
  - Document the rationale for the change
  - Obtain approval before proceeding

- **Legacy-vs-Canonical Comparison** — Explain → classify → approve/fix:
  - Explain all semantic differences between legacy and canonical outputs
  - Classify each difference as acceptable parity, improvement, regression, or inconclusive
  - Fix regressions or inconclusive cases
  - Obtain approval for acceptable parity/improvement cases
  - Hybrid authority is forbidden — do not silently combine legacy and canonical

### W0.5.4 "Do Not Claim Green" Discipline

Report per-command PASS/NOT RUN/NOT VERIFIED honestly. Do not claim repository-wide green status without actually running and passing the commands.

- **PASS** — Command executed and all tests passed
- **NOT RUN** — Command was not executed (e.g., dependencies not installed, test not applicable)
- **NOT VERIFIED** — Command executed but results were not verified (e.g., timeout, environment issue)

Example honest reporting:
```
npm run lint: PASS
npm run test: NOT RUN (dependencies not installed)
npm run build: PASS
```

Do not claim "all tests pass" if tests were not actually run. Do not claim "build succeeded" if build was not executed.

### W0.5.5 Dasha/D10/Transit Independence Requirements

As W1 acceptance gates, changes to Dasha, D10, or transit modules must not create natal Career promise. Cross-reference existing boundary documentation:

- **§3.4 Dasha Boundary** — Dasha is an activation layer, not a natal Career promise engine. Dasha identifies WHEN and HOW the natal Career promise activates, but does not independently establish Career promise.

- **§3.5 D10 Boundary** — D10 is a qualification/confirmation layer, not a natal Career promise engine. D10 qualifies and confirms Career potential from the natal foundation, but does not independently establish Career promise.

- **§3.6 Timing Boundary** — Transit timing is a timing layer, not a natal Career promise engine. Transit identifies WHEN Career themes manifest, but does not independently establish Career promise.

Validation: After changes to Dasha/D10/transit, verify that natal Career promise (C4–C8) remains unchanged. The canonical pipeline must preserve the boundary: natal foundation → Career promise → activation/qualification/timing.

### W0.5.6 Definition-of-Done Checklist

W0.5 Definition-of-Done (mirroring spec §43):

- [ ] TypeScript compilation passes
- [ ] Changed-module unit tests pass
- [ ] Career integration tests pass
- [ ] Determinism verified (dedup is deterministic, input-order independent)
- [ ] Golden tests pass OR explained and approved
- [ ] Legacy-vs-Canonical comparison completed and classified
- [ ] Dasha/D10/Transit independence verified (no natal Career promise creation)
- [ ] All W0.4 invariants satisfied
- [ ] All boundary conditions preserved (Dasha/D10/Timing as layers, not promise engines)
- [ ] No hybrid authority (single documented source of truth)
- [ ] No double-counting (identityKey dedup respected)
- [ ] Documentation updated (W0.4/W0.5 sections reflect actual implementation)
- [ ] Honest reporting of test results (PASS/NOT RUN/NOT VERIFIED)
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
