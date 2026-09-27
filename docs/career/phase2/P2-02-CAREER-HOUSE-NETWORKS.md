# P2-02 — Career House Networks

> **STATUS: PLACEHOLDER — not active until activated by P2-00 charter**
>
> This document is a controlled placeholder. P2-00 must establish the Phase 2 authority before this document becomes active.

## Purpose

P2-02 will freeze the CareerHouseNetwork conceptual object, its topologies, and the initial house-network families. It will define how networks are detected from the CareerAstroGraph and how they differ from semantic CareerPatterns.

## Outline (to be frozen when activated)

- CareerHouseNetwork object definition
  - networkId
  - identityKey
  - houses (array)
  - lords (array)
  - relationships (edges from graph)
  - topology (type)
  - direction (forward/reverse/bidirectional)
  - provenance (source facts/rules)
  - evidenceIds (DomainEvidence sourceIds)

- Network topologies
  - DIRECT_LINK (e.g., 6→10)
  - CHAIN (e.g., 6→10→11)
  - TRIANGLE (e.g., 2→6→10→2)
  - LOOP (circular chain)
  - STAR (central house with multiple connections)
  - CLUSTER (dense multi-house connectivity)

- Initial house-network families
  - 2–6–10–11 (wealth-service-profession-gains)
  - 3–6–10–11 (communication-service-profession-gains)
  - 5–9–10 (creativity-dharma-profession)
  - 6–10–11 (service-profession-gains)
  - 9–10–11 (dharma-profession-gains)

- Network vs Pattern distinction
  - Network: Structural topology (what houses are connected)
  - Pattern: Semantic classification (what does this network mean for Career)

- Network identity invariants
  - Identity independent of strength/dignity/condition
  - Deterministic identity independent of input/array/traversal ordering

- TypeScript interface for CareerHouseNetwork (exact shape)

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority
- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (consumes networks)
