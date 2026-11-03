# B04 — Profession Recommendation Ranking

## Purpose and boundaries

B04 ranks broad profession-domain/family candidates emitted by P2-10A. It does not predict a job title, employment outcome, salary, market demand, or employability. Candidate ranking is comparative within the available evidence set.

D1/C11 is the entry gate: only C11 `natalDirection = SUPPORT` or `CONDITIONAL` permits a ranked recommendation list. C11 remains the final Career conclusion authority. D10 can qualify or constrain an existing D1-derived candidate but cannot create one or replace the D1 promise.

## Candidate identity and grouping

- Existing P2-10A candidate identity remains pattern- and rule-scoped (`candidateId`).
- B04 groups candidates by the stable semantic pair `domain + family`.
- A ranked family ID is `PROFESSION:<DOMAIN>:<FAMILY>`; it is independent of pattern IDs, rule IDs, and input order.
- All pattern-scoped candidate IDs and rule IDs are retained under `supportingCandidateIds` and `ruleIds`.
- No domain/family is expanded into an unsupported specific job title.

## Evidence and identity namespaces

For each candidate, B04 preserves:
- canonical evidence occurrence IDs from linked `DomainEvidence.id`;
- semantic identity keys from `DomainEvidence.identityKey`;
- root semantic identity keys from `DomainEvidence.rootEvidenceIds`;
- D10 occurrence IDs from the matched C10 qualification evidence;
- D10 root identity keys from `CareerD10CanonicalEvidence.provenance.natalRootIds`.

Occurrence IDs, semantic identity keys, root identity keys, candidate IDs, and rule IDs remain separate fields. No identity is synthesized from a rule ID, expression label, or statement. Only DomainEvidence explicitly linked through `relatedEvidenceIds` is included.

## D1/D10 hierarchy and matching

- The interpreter passes `canonicalC11Result.natalDirection` as the D1 promise gate.
- If the gate is absent, neutral, mixed, challenged, or unavailable, B04 emits no ranked candidates and returns a diagnostic.
- Candidate D10 qualification requires a C10 expression qualification with `mappingStatus = RESOLVED`, a non-null legacy expression, a matching legacy mode from the canonical C8-to-C10 expression-type resolver, and complete ownership of the qualification's `sourceMechanismCandidateIds` by the already-established profession candidate.
- Expression IDs are not compared across the C8 and C10 namespaces.
- A resolved SUPPORT qualification can add a D10 refinement contribution; CHALLENGE is a counter-indication; MIXED/QUALIFIES/MODIFIES remain partial. Missing/unmapped D10 makes no score contribution and remains visible as NOT_PROVIDED/UNAVAILABLE.
- D10 does not add candidates, change candidate identity, or modify C11.

## Deterministic score policy

Policy version: `B04-PROFESSION-RANKING-v1`.

Scores are integer policy points, not percentages or probabilities.

| Contribution | Points |
|---|---:|
| Each distinct EXPRESSION rule within a family | +5 |
| Each distinct MECHANISM rule within a family | +8 |
| Linked SUPPORTING evidence | strength points × bounded priority |
| Linked CHALLENGING evidence | negative strength points × bounded priority |
| Linked NEUTRAL evidence | 0 |
| Resolved D10 SUPPORT qualification | +3 |
| Resolved D10 CHALLENGE / CONFLICTED qualification | -3 |
| Missing, unavailable, or partial D10 | 0 |

Evidence strength points: VERY_STRONG=4, STRONG=3, MODERATE=2, WEAK=1. Evidence priority is truncated and bounded to the inclusive range 1–3. Each canonical occurrence is counted once per grouped family. Duplicate pattern instances of the same rule do not multiply the rule contribution.

Ranking order:
1. score descending;
2. domain ascending by code-point comparison;
3. family ascending by code-point comparison;
4. stable candidate ID ascending.

Equal scores share a competition rank (1, 1, 3). The sorted tie-break order is only for deterministic display; it does not break the semantic tie.

## Candidate-level confidence and coverage

Confidence is deliberately independent of rank and score:
- HIGH: at least two linked evidence occurrences, semantic identity and root identity coverage, and resolved D10 SUPPORT.
- MEDIUM: semantic identity and root identity coverage exist, but one or more qualification/coverage layers remain incomplete.
- LOW: conflicting evidence exists or semantic/root linkage is incomplete.
- UNAVAILABLE: no linked canonical evidence occurrences exist.

Coverage reports occurrence, semantic identity, root identity, and linked source counts. Confidence never changes rank, and rank never implies confidence.

## Alternatives and explanations

All distinct domain/family candidates are retained. Each ranked item includes:
- contributing pattern-scoped candidate IDs and rule IDs;
- support occurrence IDs and D10 occurrence IDs;
- counter-evidence occurrence IDs and counter-evidence explanations;
- candidate confidence and coverage;
- positive reasons and an explicit alternative/tie explanation.

No lower-ranked candidate is discarded solely because another candidate ranks higher.

## Product projection

The ranking is projected through `CareerProductAnalysis.profession.ranking` and `CareerProfessionViewModel.ranking`. The Career profession section displays rank, policy points, candidate confidence, D10 state, coverage, positive reasons, counter-evidence, and alternative explanation.

## Tests

- multiple-family evidence-weighted ordering and alternative retention;
- deterministic ties and competition rank;
- confidence distinct from rank;
- counter-evidence preservation;
- missing D10 partial state and zero D10 score contribution;
- C11 D1 gate prevents ranked output without D1 promise;
- source-mechanism bridge qualifies only the matching D1 candidate;
- input permutation stability;
- no direct planet-to-job-title inference remains covered by the existing profession engine boundary test.
