# P2-03 — Pattern Identity/Classification

> **STATUS: IMPLEMENTED**

> Pattern identity/classification layer (CareerPattern) is implemented and verified with deterministic golden test. Pattern qualification (next layer) is not yet implemented.

## Purpose

P2-03 implements the pattern identity/classification layer that sits ABOVE the CareerHouseNetwork detection (P2-02) and BELOW the qualification layer. This is a pure structural pattern-identity/classification layer that does NOT calculate strength, confidence, scores, qualification, activation, Dasha, D10, transit, mechanism, or prediction anywhere in the output.

## Network-vs-Pattern Identity Invariant

**Critical Invariant:** `CareerHouseNetwork.identityKey` (P2-02) includes `direction`, but `CareerPattern.identityKey` (P2-03) excludes it.

- **Network direction may distinguish two CareerHouseNetworks**, but it must not create two CareerPatterns when the underlying semantic pattern identity is otherwise identical.
- FORWARD and REVERSE networks over the same houses, topology, and relationships map to a single CareerPattern.
- **Warning:** Changing either identity key definition breaks the other layer. The exclusion of direction from pattern identity is deliberate — direction is a flow property of the structural network layer, not a semantic pattern property.

**Identity Key Comparison:**
- `CareerHouseNetwork.identityKey` (P2-02): `${sortedHouses}:${topology}:${direction}:${sortedRelationshipIdentities}`
- `CareerPattern.identityKey` (P2-03): `CAREER_PATTERN:<family>:<classification>:HOUSES:<sorted-csv>:TOPOLOGY:<t>:RELATIONSHIPS:<sorted-pipe-list>`

Note that pattern identity excludes direction, ensuring that FORWARD/REVERSE variations of the same structural pattern collapse to one semantic pattern.

## Relationship-IDs-in-Identity Semantics

**Deliberate Design:** Pattern identity contains relationship identity because the same house set can represent different structural mechanisms.

- Two networks with identical houses, classification, and topology but different relationship edges legitimately produce different patterns.
- This is deliberate and matters before P2-04 qualification — relationship identity captures the structural mechanism (e.g., lordship vs aspect vs conjunction).
- Example: Houses [6, 10] connected via lordship vs via aspect are structurally different patterns, even though the house set is identical.

## P2-03 Taxonomy Extensions

The following pattern families are deliberate P2-03 additions beyond the originally frozen list (2-6-10-11, 3-6-10-11, 5-9-10, 6-10-11, 9-10-11):

**P2-03 Additions:**
- `2-3-6-10-11` → `COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS`
- `10-11` → `PROFESSION_TO_GAINS`

**P2-03 Removals:**
- `SELF_EFFORT_TO_WORK_TO_PROFESSION_TO_GAINS` was removed from the type union as unused (no rule maps to it).

These extensions and removals were made during P2-03 implementation and are frozen as part of this phase.

## Generic Classification Semantics

**CAREER_HOUSE_NETWORK** is a structural carrier classification — not a claim of career significance, strength, qualification, or positive outcome.

- The generic fallback classification ensures every network produces at least one pattern for traceability.
- This classification is structural only — it does NOT imply the pattern is career-significant, strong, qualified, or destined for positive outcomes.
- Qualification (strength, relevance, coherence, activation potential) is a separate layer (P2-04, future).

## Golden Test Status

A deterministic golden fixture (fixed chart → expected classification → expected identity/provenance) is implemented. The test exercises the full chain: `calculateHoroscope(CANONICAL_BIRTH_DETAILS)` → `buildCareerStructuralReasoning` → `buildCareerGraphFactsFromStructural` → `buildCareerAstroGraph` → `detectCareerHouseNetworks` → `classifyCareerPatterns`. It first verifies determinism by running the chain twice and asserting equality, then asserts the full serialized result against frozen expected constants.

Current test coverage includes:
- Unit tests for all classification rules
- Determinism tests (input-order independence, evidence/relationship sort order)
- Real-engine end-to-end chain test
- Deep-freeze immutability tests
- Boundary enforcement tests (no forbidden properties)
- **Golden test with frozen expected pattern output for CANONICAL_BIRTH_DETAILS**

## P2-03 Implementation Notes

**Recent Changes (this iteration):**
- Documented network-vs-pattern identity invariant (direction exclusion from pattern identity)
- Documented evidence boundary (CareerPatternClassificationEvidence is local, not canonical DomainEvidence)
- Documented relationship-ids-in-identity semantics (same house set with different relationships = different patterns)
- Recorded P2-03 taxonomy extensions (2-3-6-10-11, 10-11) and removal (SELF_EFFORT_TO_WORK_TO_PROFESSION_TO_GAINS)
- Documented generic classification semantics (CAREER_HOUSE_NETWORK is structural, not a claim of significance)
- Used UPACHAYA_HOUSES constant in classifyThreeSixTenEleven for single-source-of-truth
- Removed `as any` type assertion by adding typed `isCareerHouse` helper
- Added relationship-order permutation tests (shuffled and reversed relationships produce identical output)
- Added deferred golden test documentation note

**Implemented:**
- CareerPattern type system (CareerPatternFamily, CareerPatternLevel, CareerPatternClassification, CareerPattern, etc.)
- Pattern identity key builder (excludes direction, strength, dignity, condition, Dasha, D10, timing, qualification)
- Classification rules for career house networks (2-6-10-11, 3-6-10-11, 5-9-10, 9-10-11, 6-10-11, 2-3-6-10-11, 10-11, Parivartana)
- Generic fallback classification
- Pattern deduplication and merging
- Deterministic output with deep-freeze immutability

## Evidence Boundary

**CareerPatternClassificationEvidence** is a P2-03 local classification/provenance record — it is NOT canonical DomainEvidence and does not replace the W0.4 contract.

- `CareerPatternClassificationEvidence` tracks the source network, rule, and identity that led to a pattern classification.
- This is a P2-03-local provenance mechanism for traceability within the pattern layer.
- Conversion to canonical `DomainEvidence` happens at the pattern-evidence/canonical-evidence boundary (later wave).
- No new global dedup mechanism is introduced in P2-03 — dedup occurs at the pattern identity level only.

**Not yet implemented (future work):**
- Pattern qualification methodology (planetary conditions, career relevance, pattern coherence, divisional confirmation)
- Qualification dimensions (semantic, not numeric)
- Activation potential assessment
- Divisional confirmation (D9/D10)

## Outline (to be frozen when activated)

- Qualification equation
  - Pattern + Planetary Condition + Career Relevance + Pattern Coherence + Divisional Confirmation = Qualified Pattern

- Qualification dimensions (semantic, not numeric)
  - Structural Strength (how strong is the structural foundation?)
  - Planetary Condition (how well-conditioned are the participants?)
  - Career Relevance (how relevant is this pattern to Career?)
  - Pattern Coherence (how coherent are the relationships?)
  - Activation Potential (how likely is Dasha activation?)
  - Divisional Confirmation (how confirmed by D9/D10?)

- Detection vs Qualification
  - Detection: Does the pattern exist? (binary: yes/no)
  - Qualification: How strongly is it qualified? (semantic dimensions)

- Planetary Condition inputs
  - Dignity (exalted, own, friendly, neutral, enemy, debilitated)
  - Strength (shad-bala, kakshya, other strength measures)
  - Affliction (aspect from malefic, conjunction with malefic)
  - House placement (dusthana, kendradhipati, etc.)

- Career Relevance assessment
  - Primary career houses (10, 6, 2, 11)
  - Primary career lords (10L, 6L, 2L, 11L)
  - Dusthana routing (8, 12 through condition → career-house connection)

- Pattern Coherence
  - Relationship consistency (all links supportive vs mixed)
  - Topological completeness (chain intact vs broken)
  - Directional alignment (all links same direction vs conflicting)

- Divisional Confirmation
  - D9 confirmation (planetary potential stability/maturity)
  - D10 confirmation (professional manifestation)
  - Cross-varga alignment (D1→D9→D10 consistency)

- No numeric prediction score
  - Forbid `qualificationScore = 87`
  - Use semantic dimensions only
  - Reference P2-00 §28 (No Generic Career Score)

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority, §28 No Generic Career Score
- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract
- [`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`](../CW-R1-C1-CAREER-SEMANTIC-FREEZE.md) — C1 invariants (MISSING ≠ NEGATIVE)
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (qualification operates on patterns)
