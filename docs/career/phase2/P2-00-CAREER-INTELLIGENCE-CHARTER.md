# P2-00 — Career Intelligence Charter

> **Status: Active Charter / Methodology + Authority Freeze**
>
> P2-00 establishes the Phase 2 methodology and authority hierarchy for building a semantic graph above existing Career facts. This is a DOCUMENTATION-ONLY wave — no production code changes.

## 1. Purpose

**PHASE 2 DOES NOT ADD MORE RULES TO C4. PHASE 2 BUILDS A SEMANTIC GRAPH ABOVE EXISTING FACTS.**

Phase 2 constructs a semantic graph (CareerAstroGraph → CareerHouseNetwork → CareerPattern → Pattern Qualification → Career Mechanism → CareerPatternEvidence) on top of the canonical Career facts produced by C4–C7. Facts remain facts; C4–C7 remain authoritative for natal semantics. The Pattern Engine enriches the existing natal foundation but does not replace or recalculate it.

## 2. Scope

P2-00 scope is methodology and contracts only:
- Pattern Engine architecture and authority hierarchy
- Semantic ownership extensions for P2 components
- Graph, network, pattern, qualification, and mechanism principles
- Evidence and provenance contracts
- Determinism guarantees
- Boundary definitions (C8–C11, Dasha, D10, Timing)
- Initial pattern families and Dusthana methodology
- D9 authority (frozen principle, implementation deferred)

## 3. Non-Goals

P2-00 must NOT contain:
- New graph implementation code
- New astrology calculations
- New pattern/yoga/dispositor detectors
- D9 implementation
- D10/Dasha/C8/C9/C10/C11 changes
- UI/AI/API changes
- Numeric career scoring
- Production orchestration

**P2-00 = no production code.** Implementation is deferred to P2-01+.

## 4. Phase 2 Canonical Architecture

The Phase 2 pipeline is frozen as:

```
D1/Horoscope + C4–C7
        ↓
Canonical Career Facts
        ↓
CareerAstroGraph
        ↓
CareerHouseNetwork
        ↓
CareerPattern
        ↓
Pattern Qualification
        ↓
Career Mechanism
        ↓
CareerPatternEvidence
        ↓
C8 → C9 → C10 → Timing → C11
```

**Refinement:** The graph is frozen BEFORE pattern classification. The graph (CareerAstroGraph + CareerHouseNetwork) is the reusable foundation. Pattern classification (CareerPattern) and qualification operate on this graph foundation.

## 5. Semantic Ownership

Reference the existing W0.3 ownership table in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W03-career-semantic-ownership) and extend it with the new P2 rows:

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
| **Graph construction** | **P2 Graph** | **CareerAstroGraph builder** |
| **Network detection** | **P2 Network** | **CareerHouseNetwork detector** |
| **Pattern identity** | **P2 Pattern** | **CareerPattern classifier** |
| **Pattern qualification** | **P2 Qualification** | **Pattern qualification engine** |
| **Career mechanism** | **P2 Mechanism** | **Career mechanism explainer** |
| **Pattern evidence** | **P2 Evidence** | **CareerPatternEvidence producer** |

**Central Invariant (restated by reference):** ONE SEMANTIC CONCEPT → ONE AUTHORITY → ONE CANONICAL RESULT → MANY CONSUMERS. See W0.3 central invariant in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W032-central-invariant).

## 6. Authority Hierarchy

The 6-level pattern hierarchy is frozen:

1. **L1 Direct Structural** — Direct house-house relationships (e.g., 6→10 link)
2. **L2 Higher-Order House Network** — Multi-house topologies (e.g., 6→10→11 chain)
3. **L3 Planetary/Yoga** — Yoga-based patterns and planetary combinations
4. **L4 Refinement** — Nakshatra, dispositor, varga-based refinement
5. **L5 Activation** — Dasha-based activation patterns
6. **L6 Expression/Timing** — D10+transit-based expression and timing

**Explicit rule:** Hierarchy is semantic authority, not automatic numerical strength. A L4 pattern is not simply "weaker=4". Hierarchy levels answer different semantic questions (structure vs refinement vs activation vs timing), not just "how strong is this pattern?".

## 7. Critical Authority Rule

**Pattern Engine cannot create natal Career promise.**

The Pattern Engine may derive:
- Pattern existence
- Pattern topology
- Pattern participants
- Pattern mechanism
- Pattern qualification
- Pattern evidence

The Pattern Engine must NOT independently conclude:
- Career is promised
- Career is successful
- Career will fail
- The person will become X

C4–C7 remain the authoritative natal foundation. Phase 2 enriches it, does not replace it.

## 8. Graph Principles

**CareerAstroGraph** is the core graph object.

**Initial FROZEN scope:**
- **Nodes:** HOUSE, PLANET
  - Future (not initially): KARAKA, YOGA, VARGA, NAKSHATRA
- **Edges:** LORD_OF, OCCUPIES, ASPECTS, CONJUNCT, EXCHANGES
  - Later: DISPOSITOR_OF
  - Much later: NAKSHATRA_LORD_OF, ARGALA_ON, JAMINI_ASPECTS

**Deterministic graph identity:** Every relationship has deterministic identity independent of input/array/rule/traversal ordering. Examples:
- Node: `HOUSE:10`
- Edge: `LORD_OF:PLANET:SATURN→HOUSE:10`

Determinism guarantees are inherited from W0.4/W0.2.5 (see [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W025-determinism-guarantee)).

## 9. Network Principles

**CareerHouseNetwork** is a conceptual object with fields:
- networkId
- identityKey
- houses
- lords
- relationships
- topology
- direction
- provenance
- evidenceIds

Exact TypeScript shape is deferred to P2-01.

**Topologies (frozen):**
- DIRECT_LINK
- CHAIN
- TRIANGLE
- LOOP
- STAR
- CLUSTER

**Freeze invariant:** A network is NOT yet a CareerPattern. Example: `6→10→11` is a network; only after semantic classification is it `CAREER_WORK_TO_PROFESSION_TO_GAINS`.

**Network identity invariant:** Network identity must NOT depend on strength/dignity/condition. Changing condition changes qualification, not pattern identity.

## 10. Pattern Principles

**CareerPattern** semantic fields (frozen, exact TS interface deferred to P2-01):
- Identity
- Family
- Classification
- Topology
- Participants
- Relationships
- Mechanism
- Direction
- Strength
- Qualification
- Evidence
- Provenance
- Conflicts

**Freeze:** Pattern identity ≠ Pattern qualification. Identity answers "what pattern is this?"; qualification answers "how strongly is this pattern qualified?".

## 11. Qualification Principles

Pattern + Planetary Condition + Career Relevance + Pattern Coherence + Divisional Confirmation = Qualified Pattern.

- **Detection** answers: "Does the pattern exist?"
- **Qualification** answers: "How strongly is this pattern qualified by planetary conditions?"

Qualification does NOT produce a numeric prediction score. It produces semantic qualification dimensions.

## 12. Mechanism Principles

Patterns produce:
- CareerPatternEvidence
- A mechanism explanation

Patterns do NOT produce predictions. Example forbidden output: "You will become a successful manager."

Mechanism explains HOW the pattern operates (e.g., "6L in 10 with exchange creates work-to-profession alignment"), not WHAT will happen.

## 13. Evidence Contract

Reference W0.4 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W04-canonical-evidence-identity-contract). Pattern evidence flows through the existing DomainEvidence identity contract. No new global dedup mechanism.

## 14. Provenance Contract

Every pattern must be explainable down to source facts/relationships/rules. Mandatory answerable questions:
- Why detected? (which rules)
- Which facts? (source houses/planets)
- Which relationships? (edges in the graph)
- Which rules? (detection logic)
- Which evidence? (DomainEvidence sourceIds)
- Which qualification changed strength? (condition changes)
- Which downstream layer modified it? (network → pattern → qualification)

No opaque patterns. Every pattern must have a complete provenance chain.

## 15. Determinism Contract

JSON(A) === JSON(B) for semantically equivalent inputs regardless of fact ordering.

Determinism applies to:
- Graph nodes/edges
- Networks
- Pattern IDs
- Pattern ordering
- Evidence
- Provenance
- Conflicts
- Mechanism ordering

Reference W0.2.5 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W025-determinism-guarantee).

## 16. Missing Evidence

**MISSING ≠ NEGATIVE.**

- No D10 info ≠ D10 challenges
- No dispositor chain ≠ pattern weakened

Reference the existing C1/W0 invariant in [`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`](../CW-R1-C1-CAREER-SEMANTIC-FREEZE.md#hard-invariants) (invariant #8).

## 17. Double-Counting

One underlying fact reused by patterns A/B/C is ONE evidence identity, not 3× weight.

Reference W0.4 MAX-not-SUM in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#W024-strength-merge-max-rule).

## 18. Conflict Handling

Conflicting patterns must coexist. Example:
- Strong network + planetary constraint + weak D10 + Dasha activation

These are preserved separately. The Pattern Engine must NOT collapse them into one score. C11 performs final synthesis.

## 19. C8 Boundary

C8 (Career expression) is an expression layer, not a natal Career promise engine. Reference §3.1–§3.3 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#31-canonical-career-pipeline). C8 expresses the natal Career promise produced by C4–C7.

## 20. C9 Boundary

C9 (Dasha activation) is an activation layer, not a natal Career promise engine. Reference §3.4 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#34-dasha-boundary). Dasha identifies WHEN and HOW the natal Career promise activates, but does not independently establish Career promise.

## 21. C10 Boundary

C10 (D10 qualification) is a qualification/confirmation layer, not a natal Career promise engine. Reference §3.5 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#35-d10-boundary). D10 qualifies and confirms Career potential from the natal foundation, but does not independently establish Career promise.

## 22. Timing Boundary

Transit timing is a timing layer, not a natal Career promise engine. Reference §3.6 in [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md#36-timing-boundary). Transit identifies WHEN Career themes manifest, but does not independently establish Career promise.

## 23. C11 Boundary

C11 (final synthesis) is the final synthesis layer. C11 consumes the enriched natal foundation (C4–C8 + Pattern Engine + C9/C10/Timing) and produces the final Career conclusion. C11 does not independently create natal Career promise.

## 24. Initial Pattern Families (FROZEN)

### Family A: Career House Networks

House networks with mechanism examples (mechanisms, not predictions):
- 2–6–10–11
- 3–6–10–11
- 5–9–10
- 6–10–11
- 9–10–11

Mechanism example: "6→10→11 creates work-to-profession-to-gains alignment (service → profession → gains network)."

### Family B: Kendra–Trikona

Classifications:
- RAJA_YOGA_CAREER
- DHARMA_KARMA_ALIGNMENT
- AUTHORITY_PATTERN
- PROFESSIONAL_RISE_PATTERN

**EXPLICIT prohibition:** "Two lords coexist → Raja Yoga" is insufficient. Require verification of:
- Lordship
- Relationship
- House involvement
- Condition
- Career relevance

### Family C: Upachaya

Houses: 3, 6, 10, 11 with semantic meanings:
- 3: Communication, skill development, initiative
- 6: Service, competition, obstacle-overcoming
- 10: Profession, career, authority
- 11: Gains, fulfillment, achievement

3→6→10→11 professional-development pathway mechanism (not prediction).

### Family D: Parivartana

Context-sensitive classification fields:
- EXCHANGE
- HOUSE_PAIR
- CAREER_ROLE
- FUNCTIONAL_CONTEXT

6L↔10L ≠ 9L↔10L ≠ 8L↔10L. Context matters (service↔profession ≠ dharma↔profession ≠ transformation↔profession).

## 25. Dusthana Methodology (FROZEN, Prominent)

**Never encode "8=bad" or "12=bad".**

Route through: Dusthana involvement → relationship → planetary condition → career-house connection → professional mechanism.

### 8↔10 Mechanism Examples

Research, risk, investigation, insurance, taxation, banking, compliance, transformation, crisis.

Example mechanism: "8L in 10 with exchange creates transformation-through-profession mechanism (crisis/depth management as career)."

### 12↔10 Mechanism Examples

Foreign, remote, institutional, hospital, research, isolated, multinational.

Example mechanism: "12L in 10 with aspect creates institutional-profession mechanism (foreign/remote/institutional work environment)."

**12↔10 must NOT auto-become "career loss".** Route through planetary condition and career-house connection to derive the actual mechanism.

## 26. D9 Authority (FROZEN)

- D1 = what is promised
- D9 = how stable/mature is planetary potential
- D10 = how professional manifestation occurs

D9 cannot independently create natal Career promise. D9 cannot override C4–C7. D9 is a refinement/confirmation layer.

D9 implementation is deferred to a later P2 wave.

## 27. Deferred Pattern Families

NOT in initial scope:
- Dispositor intelligence (deferred to P2-04)
- Advanced Yoga graph (deferred to P2-05)
- Nakshatra refinement
- D1→D9→D10 cross-confirmation
- Jaimini
- Amatyakaraka
- Atmakaraka
- Karakamsha
- A10
- Arudha Lagna
- Argala
- Specialized profession ontology
- Complex Raja Yoga taxonomy

## 28. No Generic Career Score (Hard Rule)

Forbid `careerScore = 87`.

Use semantic dimensions:
- Structural Strength
- Planetary Condition
- Career Relevance
- Pattern Coherence
- Activation Potential
- Divisional Confirmation

Semantic strength, not prediction score.

## 29. Acceptance Criteria

Reproduce the full §35 checklist as the P2-00 gate that must be TRUE before any P2-01 coding:

### Architecture
- [ ] Phase 2 pipeline frozen: D1/Horoscope + C4–C7 → Canonical Career Facts → CareerAstroGraph → CareerHouseNetwork → CareerPattern → Pattern Qualification → Career Mechanism → CareerPatternEvidence → C8 → C9 → C10 → Timing → C11
- [ ] Graph frozen BEFORE pattern classification
- [ ] P2 semantic ownership defined in extended W0.3 table
- [ ] 6-level pattern hierarchy frozen
- [ ] Central invariant restated (ONE SEMANTIC CONCEPT → ONE AUTHORITY → ONE CANONICAL RESULT → MANY CONSUMERS)

### Identity
- [ ] CareerAstroGraph nodes/edges deterministic (independent of input/array/rule/traversal ordering)
- [ ] CareerHouseNetwork identity independent of strength/dignity/condition
- [ ] Pattern identity ≠ Pattern qualification
- [ ] Pattern evidence flows through existing DomainEvidence contract (W0.4)
- [ ] No new global dedup mechanism

### Semantics
- [ ] Pattern Engine cannot create natal Career promise (bold rule frozen)
- [ ] C4–C7 remain authoritative natal foundation
- [ ] Hierarchy is semantic authority, not automatic numerical strength
- [ ] Mechanism produces explanation, not prediction
- [ ] D9 authority frozen (refinement layer, not promise engine)
- [ ] MISSING ≠ NEGATIVE (reference C1/W0)
- [ ] No generic Career Score (semantic dimensions only)

### Evidence
- [ ] Pattern evidence uses existing DomainEvidence identity contract
- [ ] Double-counting prevented (MAX-not-SUM, reference W0.4)
- [ ] Conflicting patterns coexist (not collapsed into one score)
- [ ] C11 performs final synthesis, not Pattern Engine

### Scope
- [ ] P2-00 is methodology/contracts only (no production code)
- [ ] Non-goals explicitly listed
- [ ] Initial pattern families frozen (A: Career House Networks, B: Kendra–Trikona, C: Upachaya, D: Parivartana)
- [ ] Dusthana methodology frozen (never encode "8=bad" or "12=bad")
- [ ] Deferred pattern families explicitly listed

### Determinism
- [ ] Determinism contract frozen (JSON(A) === JSON(B) for semantically equivalent inputs)
- [ ] Applies to graph nodes/edges, networks, pattern IDs, pattern ordering, evidence, provenance, conflicts, mechanism ordering
- [ ] Reference W0.2.5 determinism guarantees

## 30. Golden-Test + P2 Execution Rules

P2-01+ implementation must add:
- Golden tests for graph/network/pattern determinism
- Determinism tests (input-order independence)

Each subsequent P2 doc becomes active only after this charter establishes its authority.

## Cross-References

- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract, §3.4–§3.6 boundaries
- [`CW-R1-C1-CAREER-SEMANTIC-FREEZE.md`](../CW-R1-C1-CAREER-SEMANTIC-FREEZE.md) — C1 invariants (MISSING ≠ NEGATIVE, D10/Dasha/Transit cannot establish natal Career promise, DomainEvidence is canonical)
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (placeholder, activated by P2-00)
- [`P2-02-CAREER-HOUSE-NETWORKS.md`](./P2-02-CAREER-HOUSE-NETWORKS.md) — CareerHouseNetwork (placeholder, activated by P2-00)
- [`P2-03-PATTERN-QUALIFICATION.md`](./P2-03-PATTERN-QUALIFICATION.md) — Pattern qualification (placeholder, activated by P2-00)
- [`P2-04-DISPOSITOR-MODEL.md`](./P2-04-DISPOSITOR-MODEL.md) — Dispositor model (placeholder, activated by P2-00)
- [`P2-05-ADVANCED-YOGA-MODEL.md`](./P2-05-ADVANCED-YOGA-MODEL.md) — Advanced Yoga model (placeholder, activated by P2-00)
