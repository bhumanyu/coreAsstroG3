# P2-07D Non-Dusthana Mechanism Decision Request

## Purpose and context

This document requests the domain owner's contract for mapping non-dusthana career-pattern classifications to `CareerMechanismType` values before any resolver rule is written.

The resolver registry currently contains only the three proven dusthana rules: `RULE_MECHANISM_PATTERN_DUSTHANA_8_10`, `RULE_MECHANISM_PATTERN_DUSTHANA_12_10`, and `RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10`. Non-dusthana families currently resolve to no candidates and are effectively `UNAVAILABLE` downstream.

Every emitted mechanism type MUST be an existing member of the `CareerMechanismType` union in [`careerMechanismTypes.ts`](../../../src/domain/career/careerMechanism/careerMechanismTypes.ts). This decision cannot introduce new mechanism types. Names such as `KENDRA_TRIKONA` are pattern classifications, not mechanism types.

Any future rule must conform to [`CareerMechanismResolutionRule`](../../../src/domain/career/careerMechanism/resolver/careerMechanismResolverTypes.ts): declare its `pathway`; implement `applies()` guarded on real establishing edges using canonical predicates; and implement `resolve()` so it returns only registry-valid mechanism types.

> **Guardrail:** No registry rule will be added until this contract is confirmed and the P2-06 evidence contract is frozen. Do not repeat the earlier empty-resolve KENDRA_TRIKONA placeholder.

## Current fail-closed status

**Status: DEFERRED / owner-blocked for all five families and final sign-off.** The existing resolver suite now pins the current behavior: structurally evidenced `QUALIFIED` patterns in each family still return an empty candidate set while the registry contains only the three proven dusthana rule IDs. This test coverage does not approve a mapping or activate a family.

`careerMechanismResolverRules.ts` documents the staged per-family implementation template: explicit rule ID and pathway, canonical establishing-edge predicates with the provenance intersection invariant, existing `PatternLevelEstablishingEvidence`/source firewall, existing mechanism types only, deterministic precedence/deduplication, and the required family-specific tests. The template is documentation only; no rule is instantiated or registered.

Complete each owner-decision row below and freeze that family's P2-06 evidence contract before activation in a separate per-family PR. Until then, keep each row and the sign-off row `TBD` and `DEFERRED`; no empty placeholder rule is permitted.

## Owner decision register

For each family below, complete every owner-decision field. Outputs must be selected only from the existing `CareerMechanismType` union. The classifications listed are the known emitted classifications to decide against; they are not proposed mechanism mappings.

### CAREER_HOUSE_NETWORK family

**Decision status: DEFERRED / owner-blocked.**

Known classifications:

- `CAREER_HOUSE_NETWORK`
- `WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS`
- `COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS`
- `CREATIVE_DHARMA_TO_PROFESSION`
- `SERVICE_TO_PROFESSION_TO_GAINS`
- `PROFESSION_TO_GAINS`

`CAREER_HOUSE_NETWORK` is a structural carrier per `classifyGenericCareerNetwork`, not by itself a claim of career significance, strength, qualification, or positive outcome. The owner must specify whether and how it is scoped so the generic carrier does not overstate what its establishing relationships support.

| Owner decision | Decision (owner to complete) |
|---|---|
| `CareerMechanismType[]` outputs, by classification (or explicitly shared across classifications) | TBD — |
| Required establishing evidence: required edges/relationships and participant roles | TBD — |
| Rejection conditions: when the rule must NOT apply | TBD — |
| Incomplete evidence behavior: emit nothing or emit a structural candidate | TBD — |
| Is this family's P2-06 evidence contract frozen? (yes/no) | TBD — |

### KENDRA_TRIKONA family

**Decision status: DEFERRED / owner-blocked.**

Known classifications emitted by `kendraTrikonaDetector.ts`:

- `DHARMA_KARMA_ALIGNMENT`
- `AUTHORITY_PATTERN`
- `PROFESSIONAL_RISE_PATTERN`

| Owner decision | Decision (owner to complete) |
|---|---|
| `CareerMechanismType[]` outputs, by classification (or explicitly shared across classifications) | TBD — |
| Required establishing evidence: required edges/relationships and participant roles | TBD — |
| Rejection conditions: when the rule must NOT apply | TBD — |
| Incomplete evidence behavior: emit nothing or emit a structural candidate | TBD — |
| Is this family's P2-06 evidence contract frozen? (yes/no) | TBD — |

### UPACHAYA_PROGRESSION family

**Decision status: DEFERRED / owner-blocked.**

Known classification:

- `UPACHAYA_PROGRESSION`

Existing but unwired candidate chain in `careerPatternClassificationRules.ts`:

- `UPACHAYA_MECHANISM_CHAIN` = `SELF_EFFORT`, `SKILL_DEVELOPMENT`, `PROFESSIONALIZATION`, `PROFESSIONAL_GAINS`

The chain is recorded as an existing candidate only; the owner must confirm whether this is the intended mapping and whether its evidence contract is frozen.

| Owner decision | Decision (owner to complete) |
|---|---|
| `CareerMechanismType[]` outputs, including explicit confirmation or rejection of the existing candidate chain | TBD — |
| Required establishing evidence: required edges/relationships and participant roles | TBD — |
| Rejection conditions: when the rule must NOT apply | TBD — |
| Incomplete evidence behavior: emit nothing or emit a structural candidate | TBD — |
| Is this family's P2-06 evidence contract frozen? (yes/no) | TBD — |

### PARIVARTANA_YOGA family

**Decision status: DEFERRED / owner-blocked.**

Known sub-types:

- `SERVICE_PROFESSION_EXCHANGE`
- `DHARMA_KARMA_EXCHANGE`
- `TRANSFORMATION_PROFESSION_EXCHANGE`
- `GAINS_PROFESSION_EXCHANGE`

| Owner decision | Decision (owner to complete) |
|---|---|
| `CareerMechanismType[]` outputs, by sub-type (or explicitly shared across sub-types) | TBD — |
| Required establishing evidence: required exchange edges/relationships and participant roles | TBD — |
| Rejection conditions: when the rule must NOT apply | TBD — |
| Incomplete evidence behavior: emit nothing or emit a structural candidate | TBD — |
| Is this family's P2-06 evidence contract frozen? (yes/no) | TBD — |

### CAREER_YOGA_STRUCTURE family

**Decision status: DEFERRED / owner-blocked.**

Known classification from `careerYogaDetector.ts`:

- `CAREER_YOGA_STRUCTURE`

| Owner decision | Decision (owner to complete) |
|---|---|
| `CareerMechanismType[]` outputs | TBD — |
| Required establishing evidence: required yoga relationships/edges and participant roles | TBD — |
| Rejection conditions: when the rule must NOT apply | TBD — |
| Incomplete evidence behavior: emit nothing or emit a structural candidate | TBD — |
| Is this family's P2-06 evidence contract frozen? (yes/no) | TBD — |

## Sign-off

| Owner | Decision date | All family mappings and evidence contracts confirmed? | Status |
|---|---|---|---|
| TBD — | TBD — | TBD — | DEFERRED / owner-blocked |
