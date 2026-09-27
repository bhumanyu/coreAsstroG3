# P2-04 — Dispositor Model

> **STATUS: PLACEHOLDER — not active until activated by P2-00 charter**
>
> This document is a controlled placeholder. P2-00 must establish the Phase 2 authority before this document becomes active.

## Purpose

P2-04 will freeze the dispositor model for Career intelligence, defining how dispositor chains are constructed, analyzed, and interpreted. This is explicitly a later P2 document (not in initial scope).

## Outline (to be frozen when activated)

- CareerDispositorChain object definition
  - chain (array of dispositor relationships)
  - terminalPlanet (final dispositor)
  - cycle (boolean: does chain loop?)
  - mutualReception (boolean: do two planets mutually own each other's signs?)
  - depth (length of chain)
  - careerDestination (does chain terminate in career-relevant house/planet?)

- Dispositor relationship definition
  - Planet A is in sign of Planet B → Planet B disposits Planet A
  - Recursive chain: A → B → C → ... → terminal

- Chain construction rules
  - Start from key planets (career lords, key planets in career houses)
  - Follow dispositor links until termination
  - Detect cycles (A → B → C → A)
  - Identify mutual reception (A ↔ B)

- Termination conditions
  - Reaches a planet in its own sign (self-dispositor)
  - Reaches a career-relevant terminal (e.g., 10L, planet in 10H)
  - Enters a cycle (no further progress)

- Cycle detection
  - Simple cycle (A → B → A)
  - Complex cycle (A → B → C → D → A)
  - Cycle significance (stability vs stagnation)

- Mutual reception
  - Two planets mutually own each other's signs
  - Mutual reception in career context (e.g., 6L↔10L)
  - Strength implications (strengthening or weakening based on condition)

- Depth limits
  - Maximum chain depth (prevent infinite loops)
  - Practical depth cutoff (diminishing returns beyond X links)

- Career destination analysis
  - Does chain terminate in career house?
  - Does chain terminate in career lord?
  - Does chain terminate in dusthana? (route through condition → career-house connection)

- Dispositor-based patterns
  - Dispositor chain patterns (e.g., chain to 10H)
  - Mutual reception patterns (e.g., 6L↔10L exchange)
  - Cycle patterns (e.g., stable cycle vs unstable cycle)

- TypeScript interface for CareerDispositorChain (exact shape)

## Cross-References

- [`P2-00-CAREER-INTELLIGENCE-CHARTER.md`](./P2-00-CAREER-INTELLIGENCE-CHARTER.md) — Master charter establishing Phase 2 authority, §27 Deferred Pattern Families
- [`CW-R1-CAREER-CONVERGENCE-CONTRACT.md`](../CW-R1-CAREER-CONVERGENCE-CONTRACT.md) — W0.3 ownership table, W0.4 evidence identity contract
- [`P2-01-PATTERN-TAXONOMY.md`](./P2-01-PATTERN-TAXONOMY.md) — Pattern taxonomy (dispositor patterns as L4 refinement)
