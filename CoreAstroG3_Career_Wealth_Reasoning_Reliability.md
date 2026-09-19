# CoreAstroG3 — Career & Wealth Reasoning Reliability Program

## Product Owner Direction

### Current phase

CoreAstroG3 is now in the **Engine Reliability + Domain Reasoning Hardening** phase.

The immediate objective is **not launch, UI expansion, or adding new life domains**.

The priority is to make the existing:

- Career engine
- Wealth engine
- Dasha activation
- D10/D2 qualification
- Transit timing
- Evidence/provenance
- Conflict resolution

more **precise, deterministic, explainable, and defensible**.

---

# 1. Product Scope

## In scope

### Career

- Natal Career promise
- Career structural factors
- Career planetary relevance
- Career expression
- Employment/service
- Technical specialization
- Management
- Leadership
- Authority/institutional expression
- Independent professional work
- Entrepreneurship
- D10 confirmation/refinement
- Career Dasha activation
- Career transit timing
- Career conflict resolution
- Career evidence/provenance

### Wealth

- Wealth foundation
- Accumulation
- Gains/income
- Fortune
- Speculation
- Wealth planetary relevance
- Wealth Dasha activation
- D2 confirmation/refinement
- Wealth transit timing
- Wealth conflict resolution
- Wealth evidence/provenance

## Explicitly out of scope

Do not expand into:

- Marriage
- Children
- Health
- Property
- Spirituality
- Other life domains

until Career + Wealth are materially more reliable.

---

# 2. Product Owner Decision

## Freeze significant UI development

The existing UI is sufficient to consume and demonstrate the engine.

UI work should now be limited to:

- exposing newly implemented engine capabilities
- correcting misleading labels
- fixing functional defects
- displaying unavailable/partial states correctly
- supporting reasoning/evidence visibility

Do not spend the next major development cycle on:

- visual redesign
- animations
- additional pages
- navigation experiments
- cosmetic polish

The engine is the product.

The UI is the presentation layer.

---

# 3. Core Product Objective

The product must move from:

```text
Rules
 ↓
Scores
 ↓
Status
```

toward:

```text
Astrological Factor
        ↓
Domain Relevance
        ↓
Condition
        ↓
Relationship
        ↓
Domain Expression
        ↓
Qualification
        ↓
Dasha Activation
        ↓
Transit Timing
        ↓
Conflict Resolution
        ↓
Evidence Graph
        ↓
Final Deterministic Conclusion
```

The goal is not simply to have more rules.

The goal is to make the existing rules **understand context and relationships**.

---

# 4. Target Architecture

```text
                     BIRTH INPUT
                          │
                          ▼
                  INPUT VALIDATION
                          │
                          ▼
                 ASTRONOMICAL TRUTH
                          │
                          ▼
                  CANONICAL D1 CHART
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
       CAREER DOMAIN              WEALTH DOMAIN
             │                         │
       ┌─────┴─────┐             ┌─────┴─────┐
       ▼           ▼             ▼           ▼
   Structural   Planetary   Accumulation  Gains
    Promise     Relevance
       │           │             Fortune    Speculation
       └─────┬─────┘                 │
             ▼                       ▼
         EXPRESSION             DIMENSION
             │                 QUALIFICATION
             ▼                       │
           D10                     D2
             │                       │
             └──────────┬────────────┘
                        ▼
                  DASHA ACTIVATION
                        │
                   MD → AD → PD
                        │
                        ▼
                   TRANSIT TIMING
                        │
                        ▼
                  CONFLICT ENGINE
                        │
                        ▼
                  EVIDENCE GRAPH
                        │
                        ▼
                  FINAL SYNTHESIS
                        │
                  ┌─────┴─────┐
                  ▼           ▼
                  UI          AI
```

---

# 5. Core Reliability Principle

For the same:

```text
Birth Details
+
Methodology
+
Engine Version
+
Rules Version
+
asOf
```

the deterministic engine must return the same result.

AI wording can vary.

The deterministic astrological conclusion cannot arbitrarily vary.

---

# 6. Existing P0 Reliability Work

The P0 reliability program should continue, but it should no longer consume the majority of product-development attention once the remaining blockers are contained.

## Remaining P0 blockers

### P0-A — Canonical CW-01

Career and Wealth V2 must genuinely execute CW-01 as the authoritative production interpretation.

The presence of:

```text
reasoningVersion = CW-01
```

is not sufficient.

The underlying implementation must also be CW-01.

---

### P0-B — Remove legacy production dependencies

Legacy structures such as:

```text
themeInterpretationV2
interpretCareerTheme
interpretWealthTheme
```

may remain temporarily as migration/reference code.

They must not determine production Career/Wealth results.

Target:

```text
Canonical CW-01
       ↓
ProductAnalysisResult
       ↓
UI
       ↓
AI
```

---

### P0-C — Canonical Dasha source

The final production path should have one Dasha authority:

```text
horoscope.dashaInterpretation
```

Avoid multiple fallback sources such as:

```text
vimshottari
fullNatalAnalysis.vimshottari
```

once upstream canonicalization is complete.

---

### P0-D — Transit geometry

Separate:

```text
SAME_SIGN
```

from:

```text
CONJUNCTION
```

and other angular relationships.

Whole-sign Gochara logic may remain where intentionally required.

Planet-to-planet contact must use appropriate longitude/angular geometry.

---

### P0-E — Birth validation

Do not silently convert:

```text
invalid latitude
invalid longitude
invalid time
invalid date
```

into arbitrary defaults such as:

```text
0
```

Invalid birth data must stop calculation with a clear validation error.

---

### P0-F — Wealth fallback

Do not use:

```text
MODERATE
```

as a generic fallback when evidence is insufficient.

Use an explicit state such as:

```text
INSUFFICIENT_DATA
```

or:

```text
MIXED
```

where appropriate.

---

### P0-G — Build reproducibility

Establish:

```bash
npm ci
npm run lint
npm test
npm run build
```

on a clean environment.

Commit:

```text
package-lock.json
```

---

### P0-H — AI single-source-of-truth

AI must consume the same final deterministic Career/Wealth result that the UI consumes.

AI must not reconstruct Career/Wealth from legacy horoscope interpretation.

---

# 7. New Major Program — CW-R1

# Career & Wealth Reasoning Reliability

This becomes the primary domain-development milestone.

The objective is:

> Make every important Career and Wealth conclusion traceable to a coherent chain of astrological relevance, condition, relationship, expression, activation, and evidence.

---

# 8. Standard Domain Reasoning Pipeline

Both Career and Wealth should follow:

```text
1. RELEVANCE
      ↓
2. STRUCTURAL PROMISE
      ↓
3. CONDITION
      ↓
4. RELATIONSHIP
      ↓
5. EXPRESSION / DIMENSION
      ↓
6. QUALIFICATION
      ↓
7. DASHA ACTIVATION
      ↓
8. TRANSIT TIMING
      ↓
9. CONFLICT RESOLUTION
      ↓
10. FINAL SYNTHESIS
```

This should become a reusable conceptual pattern without creating unnecessary generic abstractions.

---

# 9. First-Class Concept — Relevance

A planet being strong does not automatically make it relevant to Career or Wealth.

The engine must first ask:

```text
Is this factor relevant to this domain?
```

Then:

```text
How relevant?
```

Then:

```text
Is it supportive or challenging?
```

Then:

```text
What exactly does it express?
```

Example:

```text
Strong Saturn
```

does not automatically mean:

```text
Strong Career
```

Instead:

```text
Strong Saturn
+
Career linkage
+
appropriate condition
→
Career contribution
```

---

# 10. First-Class Concept — Condition

For every important factor, distinguish:

```text
RELEVANCE
```

from:

```text
CONDITION
```

Possible conditions:

```text
STRONG
MODERATE
NEUTRAL
WEAK
AFFLICTED
UNAVAILABLE
```

Example:

```text
Career relevance = HIGH
Condition = AFFLICTED
```

means:

```text
Important Career factor
+
challenged expression
```

not:

```text
No Career relevance
```

---

# 11. First-Class Concept — Relationship

The engine should capture how a factor connects to the domain.

Examples:

```text
LORD_IN_HOUSE
CONJUNCTION
ASPECT
MUTUAL_ASPECT
EXCHANGE
COMMON_LORD
OCCUPANCY
YOGA
KARAKA_LINK
```

The relationship itself should become evidence.

---

# 12. First-Class Concept — Expression

Career should answer:

> What kind of professional expression is supported?

Canonical expression types:

```text
SERVICE_EMPLOYMENT
TECHNICAL_SPECIALIZATION
MANAGEMENT
LEADERSHIP
AUTHORITY_INSTITUTIONAL
INDEPENDENT_PROFESSIONAL
ENTREPRENEURSHIP
```

Wealth should answer:

```text
ACCUMULATION
GAINS
FORTUNE
SPECULATION
```

A factor should contribute to an expression/dimension, not merely increase an overall score.

---

# 13. CAREER — CW-R1A

# Career Structural Promise

## Primary factors

```text
10H
10L
```

## Supporting factors

```text
6H
6L
2H
2L
11H
11L
```

## Planetary factors

```text
Sun
Saturn
Mercury
Mars
Jupiter
```

Evaluate:

```text
Ownership
Placement
Dignity
Strength
State
Occupants
Aspects
Yogas
Functional Role
Functional Nature
Karaka relevance
House relationships
Planet relationships
```

---

# 14. Career — 10th House Deep Analysis

Do not collapse the 10H into:

```text
STRONG
```

Instead derive a structural profile:

```text
10H
 ├── sign
 ├── lord
 ├── occupants
 ├── occupant condition
 ├── benefic influence
 ├── malefic influence
 ├── aspects
 ├── strength
 ├── dignity of lord
 ├── lord placement
 ├── Yoga participation
 └── functional context
```

Then:

```text
10H Structural Profile
        ↓
Career Promise
```

---

# 15. Career — 10th Lord Deep Analysis

For 10L:

```text
Ownership
Placement
Sign
Dignity
Strength
Combustion
Retrograde state
Conjunctions
Aspects
Functional role
Functional nature
Relationship with 10H
Relationship with 6H
Relationship with 2H
Relationship with 11H
Yoga participation
Karaka role
D10 qualification
```

---

# 16. Career — House Link Engine

Do not treat every relationship as equivalent.

Examples:

```text
10L in 6H
6L in 10H
10L aspects 6L
10L conjunct 6L
10L exchanges with 6L
```

These are different relationships.

Represent relationship type explicitly.

Likewise:

```text
10 ↔ 11
10 ↔ 2
10 ↔ 6
```

should retain:

```text
relationship type
strength
direction
support/challenge
Career meaning
```

---

# 17. Career — Employment Logic

Employment/service should primarily consider:

```text
6H
6L
10H
10L
2H
11H
Saturn
Mercury
```

The system should identify a coherent employment pattern rather than relying on one rule.

Expected output:

```text
Employment:
SUPPORTED
```

with evidence.

---

# 18. Career — Management Logic

Management should require a coherent combination of factors such as:

```text
10H
10L
Sun
Saturn
Jupiter
11H
authority/organizational relationships
D10 confirmation
```

Do not let one strong planet automatically produce:

```text
MANAGEMENT
```

---

# 19. Career — Technical Specialization

Technical expression should evaluate combinations involving:

```text
10H / 10L
6H / 6L
3H / 3L
Mercury
Mars
Saturn
```

and their condition and relationships.

The engine should distinguish:

```text
Career exists
```

from:

```text
Career is technically oriented
```

---

# 20. Career — Leadership

Leadership should require multiple supporting indicators.

Potential factors:

```text
10H
10L
Sun
Mars
Jupiter
11H
authority relationships
D10
```

One factor should contribute, not decide.

---

# 21. Career — Entrepreneurship

This requires stronger guardrails.

Evaluate:

```text
3H / 3L
5H / 5L
7H / 7L
10H / 10L
11H / 11L
Mars
Mercury
Sun
D10
```

Look for coherent indications of:

```text
initiative
enterprise
commercial activity
partnership/business
professional independence
gains
authority
```

Do not use:

```text
10H + 11H
```

alone as proof of entrepreneurship.

---

# 22. Career — Employment vs Entrepreneurship

These should be independent dimensions.

Possible result:

```text
Employment:
STRONG SUPPORT

Entrepreneurship:
MODERATE SUPPORT
```

or:

```text
Employment:
STRONG SUPPORT

Entrepreneurship:
INSUFFICIENT_DATA
```

Do not force a winner.

---

# 23. Career — Natural Karaka vs Domain Relevance

Distinguish:

```text
Natural Career Karaka
```

from:

```text
Career-Relevant Planet
```

and:

```text
Career-Activating Planet
```

For example:

```text
Saturn = natural Career significator
```

does not automatically mean:

```text
Saturn = Career support
```

The engine must establish:

```text
Saturn
 ↓
Career linkage
 ↓
Condition
 ↓
Expression
```

---

# 24. Career — Dasha Synthesis

Build a complete planetary synthesis for:

```text
MD
AD
PD
```

For each planet evaluate:

```text
Career relevance
10H ownership
10L role
6H / 6L
2H / 2L
11H / 11L
Placement
Dignity
Strength
State
Aspects
Yogas
Functional role
Functional nature
Karaka
D10
Career expression
```

Then produce:

```text
MD foundation
+
AD modification
+
PD refinement
```

---

# 25. Career — Dasha Hierarchy Rule

The hierarchy must remain:

```text
MD
 ↓
AD
 ↓
PD
```

A favorable PD should not erase a challenging MD/AD.

Example:

```text
MD = challenging
AD = supportive
PD = very supportive
```

must still communicate:

```text
MD challenge remains
AD provides modification
PD provides short-term support
```

---

# 26. Career — D10

D10 should answer:

> What professional expression does the D10 support?

Not simply:

> Does Career exist?

Examples:

```text
D10:
management support

D10:
technical specialization support

D10:
authority/institutional support
```

D10 cannot manufacture a natal Career promise.

---

# 27. WEALTH — CW-R1F

# Wealth Structural Model

Wealth must remain divided into:

```text
ACCUMULATION
GAINS
FORTUNE
SPECULATION
```

These are independent analytical dimensions.

---

# 28. Wealth — Accumulation

Primary:

```text
2H
2L
```

Supporting:

```text
11H
11L
5H
9H
Jupiter
Venus
Dhana Yogas
```

The central question:

> Can wealth be retained and accumulated?

Do not confuse this with income generation.

---

# 29. Wealth — Gains

Primary:

```text
11H
11L
```

Supporting:

```text
2H
2L
5H
5L
9H
9L
10H
10L
```

The question:

> Does the chart support gains/income/opportunity from activity?

---

# 30. Wealth — Fortune

Primary:

```text
9H
9L
Jupiter
```

Supporting:

```text
5H
11H
```

The question:

> Is there a structural fortune/prosperity/opportunity component?

Do not automatically translate fortune into salary/income.

---

# 31. Wealth — Speculation

Evaluate:

```text
5H
5L
9H
11H
Mars
Mercury
Jupiter
Venus
```

and relevant:

```text
Dasha
Transit
condition
relationships
```

Speculation must remain separate from core Wealth.

---

# 32. Wealth — Four-Dimension Output

The engine should be capable of:

```text
Accumulation:
STRONG

Gains:
STRONG

Fortune:
MODERATE

Speculation:
CHALLENGED
```

without collapsing everything into:

```text
Wealth = Moderate
```

The final Wealth result must preserve the dimensions.

---

# 33. Wealth — Natural Significators

Evaluate:

```text
Jupiter
Venus
Mercury
```

as natural Wealth significators.

But:

```text
Strong Jupiter
```

does not automatically mean:

```text
Strong Wealth
```

The engine must establish Wealth relevance.

---

# 34. Wealth — Dhana Yoga

Dhana Yoga should be:

```text
confirmation
```

not:

```text
automatic wealth guarantee
```

Evaluate:

```text
participating planets
house ownership
placement
condition
strength
Dasha activation
dimension relevance
```

Then identify whether it reinforces:

```text
Accumulation
Gains
Fortune
```

or another specific dimension.

---

# 35. Wealth — House Relationships

Represent relationships explicitly.

Examples:

```text
2 ↔ 11
2 ↔ 9
2 ↔ 5
5 ↔ 11
9 ↔ 11
5 ↔ 9
```

The relationship must be mapped to its likely Wealth dimension.

Example:

```text
2 ↔ 11
```

can be relevant to:

```text
Accumulation
+
Gains
```

while:

```text
5 ↔ 9
```

may be more relevant to:

```text
Speculation
+
Fortune
```

The relationship itself is not the final conclusion.

---

# 36. Wealth — Planetary Dasha

Build:

```text
WealthDashaPlanetarySynthesis
```

parallel to Career.

For each:

```text
MD
AD
PD
```

evaluate:

```text
2H / 2L
5H / 5L
9H / 9L
11H / 11L
Placement
Dignity
Strength
State
Aspects
Yogas
Functional role
Functional nature
Karaka
D2
```

Then map independently to:

```text
Accumulation
Gains
Fortune
Speculation
```

---

# 37. Wealth — Dasha Example

A planet may produce:

```text
Accumulation:
SUPPORTS

Gains:
SUPPORTS

Fortune:
STRONGLY_SUPPORTS

Speculation:
CHALLENGES
```

The final result must preserve this distinction.

It must not collapse to:

```text
Good Wealth period
```

without explanation.

---

# 38. Wealth — D2

D2 should refine Wealth, not replace D1.

When D2 is unavailable:

```text
D2 = NOT_AVAILABLE
```

Do not interpret missing D2 as:

```text
Weak Wealth
```

and do not make:

```text
Wealth = unavailable
```

unless the underlying D1 evidence itself is unavailable.

---

# 39. Wealth — Speculation Must Not Dominate Overall Wealth

Example:

```text
Accumulation = Strong
Gains = Strong
Fortune = Moderate
Speculation = Weak
```

Expected:

```text
Core Wealth = supported
Speculative indication = challenged
```

not:

```text
Overall Wealth = weak
```

Likewise:

```text
Speculation = Strong
Accumulation = Weak
```

does not automatically mean:

```text
Strong Wealth
```

---

# 40. Conflict Resolution

Conflict resolution should be explicit.

## Career

```text
Strong D1
+
Weak D10
```

means:

```text
Strong natal promise
+
qualified D10 manifestation
```

not:

```text
Weak Career
```

## Career

```text
Weak D1
+
Strong Dasha
```

means:

```text
Weak natal foundation
+
period activation
```

not:

```text
Strong natal Career
```

## Wealth

```text
Strong accumulation
+
weak speculation
```

means:

```text
Strong core Wealth
+
speculative challenge
```

not:

```text
Weak Wealth
```

---

# 41. Evidence Model

The evidence graph should distinguish:

```text
OBSERVATION
INFERENCE
SYNTHESIS
```

## Observation

Direct calculated fact.

Example:

```text
10L is placed in 11H.
```

## Inference

Astrological interpretation.

Example:

```text
10L connection with 11H supports Career gains.
```

## Synthesis

Combined conclusion.

Example:

```text
Career has a strong professional-gains component.
```

---

# 42. Root Fact Deduplication

Introduce/strengthen:

```text
rootFactId
```

Example:

```text
ROOT FACT:
10L in 11H
```

may support:

```text
Career
Gains
Dasha
Expression
Final synthesis
```

but must not become five independent votes.

The evidence graph should distinguish:

```text
one fact
```

from:

```text
many interpretations of that fact
```

---

# 43. Counterfactual Testing

This should become a major test category.

## Test

Remove D10.

Expected:

```text
Career promise remains
D10 confirmation disappears
```

## Test

Remove D2.

Expected:

```text
Wealth remains available
D2 qualification becomes unavailable
```

## Test

Remove Dhana Yoga.

Expected:

```text
Structural Wealth evidence remains
Yoga-specific evidence disappears
```

## Test

Remove one Career planet.

Expected:

```text
Career conclusion changes only according to the removed evidence
```

Counterfactual tests reveal hidden dependencies.

---

# 44. Irrelevant Strong Planet Tests

Example:

```text
Very strong Jupiter
```

but:

```text
No Career linkage
```

Expected:

```text
No automatic Career support
```

Likewise:

```text
Very strong Venus
```

but:

```text
No Wealth linkage
```

Expected:

```text
No automatic Wealth support
```

This protects the relevance gate.

---

# 45. Relevant but Afflicted Planet Tests

Example:

```text
10L
+
high Career relevance
+
poor condition
```

Expected:

```text
Career relevance = HIGH
Condition = CHALLENGED
```

not:

```text
Career support = HIGH
```

This verifies the separation between relevance and condition.

---

# 46. Double-Counting Tests

Example:

```text
10L in 11H
```

may generate:

- house relationship evidence
- Career evidence
- gains evidence
- Dasha evidence
- expression evidence
- final synthesis evidence

All are valid representations.

But the scoring system must not treat them as independent structural facts.

---

# 47. Transit Interaction With Career/Wealth

Transit must remain downstream:

```text
Natal Promise
      +
Dasha Activation
      +
Transit Trigger
      ↓
Timing
```

Never:

```text
Transit
   ↓
Creates natal promise
```

A transit can:

- activate
- reinforce
- challenge
- time

but cannot manufacture a missing natal foundation.

---

# 48. Product-Level Career Output

The deterministic result should eventually be able to explain:

```text
CAREER PROMISE
----------------
Strength:
...

Primary basis:
10H
10L

Supporting structure:
6H
2H
11H

Key planets:
...

Career expression:
Technical
Management
Leadership
...

D10:
...

Current Dasha:
MD
AD
PD

Transit:
...

Challenges:
...

Evidence:
...

Why:
...
```

---

# 49. Product-Level Wealth Output

The deterministic result should eventually be able to explain:

```text
WEALTH
----------------
Overall:
...

Accumulation:
...

Gains:
...

Fortune:
...

Speculation:
...

Primary factors:
2H / 2L
11H / 11L
9H / 9L
5H / 5L

Key planets:
...

Dasha:
...

D2:
...

Transit:
...

Challenges:
...

Evidence:
...

Why:
...
```

---

# 50. Golden Test Program

## Career

Create production-path fixtures for:

```text
C01 Strong natal promise
C02 Strong natal + D10 support
C03 Strong natal + supportive MD + supportive AD + challenging PD
C04 Challenging MD + supportive AD
C05 Strong natal + challenging transit
C06 Weak natal + favorable Dasha
C07 Strong natal + conflicting D10
C08 Employment vs Entrepreneurship
C09 Repeated same-asOf execution
C10 Irrelevant strong planet
C11 Relevant but afflicted planet
C12 Counterfactual D10 removal
C13 Double-counting protection
```

## Wealth

```text
W01 Strong accumulation
W02 Strong gains
W03 Strong fortune
W04 Strong speculation
W05 Strong core + weak speculation
W06 Strong speculation + weak accumulation
W07 Dasha supports accumulation but challenges speculation
W08 Dasha challenge
W09 Missing D2
W10 Dhana Yoga removal
W11 Irrelevant strong planet
W12 Relevant but afflicted planet
W13 Counterfactual test
W14 Double-counting protection
```

---

# 51. Determinism Tests

For the same:

```text Birth
Methodology
Rules Version
Engine Version
asOf
```

run the analysis repeatedly.

Expected:

```text Deep Equality
```

not merely:

```text Same status
```

The test should compare:

- final result
- evidence
- reasoning
- methodology
- timing
- provenance

where deterministic.

---

# 52. Temporal Mutation Tests

Changing `asOf` should:

```text Natal Career:
UNCHANGED

Natal Wealth:
UNCHANGED

Career timing:
MAY CHANGE

Wealth timing:
MAY CHANGE

Transit:
MAY CHANGE
```

This is one of the most important product invariants.

---

# 53. Dasha Mutation Tests

Changing Dasha period should:

```text change activation
```

but should not:

```text change natal promise
```

For example:

```text Natal Career = Strong
```

must remain:

```text Natal Career = Strong
```

across different `asOf` dates even if the active MD/AD/PD changes.

---

# 54. D10 Mutation Tests

Removing or disabling D10 should:

```text reduce Career qualification/confirmation
```

but must not:

```text invent natal weakness
```

---

# 55. D2 Mutation Tests

Removing D2 should:

```text mark D2 unavailable
```

and should not:

```text change core D1 Wealth evidence
```

---

# 56. Transit Mutation Tests

Move a transit planet by a small angular amount.

Expected:

```text contact geometry changes according to orb/aspect rules
```

not:

```text same result regardless of longitude
```

Test especially:

```text 1° Aries
vs
29° Aries
```

for the same natal sign.

---

# 57. Product Quality Rules

Never output a stronger conclusion than the evidence supports.

Examples:

Do not convert:

```text one weak indicator
```

into:

```text strong Career
```

Do not convert:

```text missing D2
```

into:

```text weak Wealth
```

Do not convert:

```text same sign
```

into:

```text conjunction
```

Do not convert:

```text favorable transit
```

into:

```text natal promise
```

Do not convert:

```text strong natural Karaka
```

into:

```text domain support
```

without domain relevance.

---

# 58. Engineering Principle

Do not solve domain reasoning problems by adding random scoring weights.

Prefer:

```text Semantic rules
+
explicit relationships
+
condition states
+
domain dimensions
+
hierarchy
+
evidence provenance
```

over:

```text More points
+
more weights
+
more thresholds
```

Scores can be useful as supporting machinery, but they must not become the semantic engine.

---

# 59. Development Sequence

## Phase 1 — Finish remaining P0 blockers

```text
CW-01 canonical path
↓
Legacy removal
↓
Canonical Dasha
↓
Transit geometry
↓
Birth validation
↓
Wealth fallback
↓
Motion consistency
↓
Varga isolation
↓
Build reproducibility
↓
AI source boundary
```

---

## Phase 2 — Career Reasoning Reliability

```text
Career relevance
↓
10H/10L structural reasoning
↓
House relationships
↓
Planetary relevance
↓
Condition
↓
Career expression
↓
Dasha synthesis
↓
D10 qualification
↓
Conflict resolution
↓
Golden fixtures
```

---

## Phase 3 — Wealth Reasoning Reliability

```text
Wealth relevance
↓
2H/2L
11H/11L
5H/5L
9H/9L
↓
Four dimensions
↓
Planetary relevance
↓
Condition
↓
Dhana Yoga dimension mapping
↓
Wealth Dasha synthesis
↓
D2 qualification
↓
Conflict resolution
↓
Golden fixtures
```

---

## Phase 4 — Cross-Domain Evidence Reliability

```text
Root facts
↓
Evidence identity
↓
Deduplication
↓
Observation
↓
Inference
↓
Synthesis
```

---

## Phase 5 — External Astronomy Validation

Validate:

```text
Moon
Sun
Ascendant
Mercury
Venus
Mars
Jupiter
Saturn
Nodes
```

with particular attention to:

```text
Nakshatra boundaries
Sign boundaries
Ascendant boundaries
Retrograde stations
```

Moon receives highest priority because:

```text
Moon
 ↓
Nakshatra
 ↓
Dasha
 ↓
Timing
```

---

# 60. What NOT to Build Yet

Do not spend significant effort on:

```text
New life domains
Major UI redesign
Additional AI providers
Large Yoga expansion
Marketing
Launch
Launch dates
Cosmetic UI improvements
```

unless a new engine capability requires minimal supporting work.

---

# 61. Definition of Done — Career

Career reliability is achieved only when:

- [ ] 10H is deeply evaluated
- [ ] 10L is deeply evaluated
- [ ] Supporting houses are context-aware
- [ ] House relationships are explicit
- [ ] Planetary relevance is explicit
- [ ] Planet condition is explicit
- [ ] Natural Karaka is separated from domain relevance
- [ ] Career expressions are multi-factor
- [ ] Employment logic is coherent
- [ ] Entrepreneurship has guardrails
- [ ] Dasha hierarchy is respected
- [ ] D10 refines expression
- [ ] Transit only affects timing
- [ ] Conflicts are explicit
- [ ] Evidence is traceable
- [ ] Double-counting is prevented
- [ ] Production-path golden tests pass

---

# 62. Definition of Done — Wealth

Wealth reliability is achieved only when:

- [ ] Accumulation is independent
- [ ] Gains are independent
- [ ] Fortune is independent
- [ ] Speculation is independent
- [ ] Natural Wealth Karakas require relevance
- [ ] Dhana Yogas are contextual
- [ ] House relationships are dimension-aware
- [ ] Wealth Dasha synthesis exists
- [ ] MD/AD/PD hierarchy is respected
- [ ] D2 refines rather than replaces D1
- [ ] Missing D2 is explicitly represented
- [ ] Speculation cannot dominate core Wealth
- [ ] Conflicts are explicit
- [ ] Evidence is traceable
- [ ] Double-counting is prevented
- [ ] Production-path golden tests pass

---

# 63. Final Product Owner Quality Gate

Before moving into major UI or launch work:

```text
                    COREASTROG3
                         │
                         ▼
                ONE ASTRONOMICAL TRUTH
                         │
                         ▼
                   ONE D1 TRUTH
                         │
                         ▼
                   ONE DASHA TRUTH
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
        CAREER TRUTH          WEALTH TRUTH
              │                     │
             D10                   D2
              │                     │
              └──────────┬──────────┘
                         ▼
                    TIMING TRUTH
                         │
                         ▼
                  EVIDENCE GRAPH
                         │
                         ▼
                  CONFLICT ENGINE
                         │
                         ▼
                 FINAL DETERMINISTIC
                       RESULT
                         │
                    ┌────┴────┐
                    ▼         ▼
                   UI        AI
```

The product should reach this state before it is considered mature.

---

# 64. Final Product Owner Direction

## The immediate strategic decision is:

> **Stop treating UI development as the main product-development activity.**

The UI is already capable of showing the product.

The next major product value must come from **Career + Wealth reasoning quality**.

The engine should become capable of answering:

### Career

> What is the Career promise?

> Why does the chart support it?

> Which houses create it?

> Which planets participate?

> Are those planets actually strong or challenged?

> What kind of Career expression is supported?

> Does D10 confirm or qualify that expression?

> What does MD → AD → PD activate?

> What is only a transit/timing effect?

> What evidence contradicts the conclusion?

### Wealth

> What is the underlying Wealth foundation?

> Is the strength in accumulation, gains, fortune, or speculation?

> Why?

> Which houses and planets create it?

> Which factors challenge it?

> What does the current Dasha activate?

> Does D2 confirm or qualify it?

> Does speculation differ from core Wealth?

> What does transit actually time?

> What evidence contradicts the conclusion?

---

# 65. The Product Standard We Are Building Toward

The target is not:

```text
"CoreAstro says Career is Strong."
```

The target is:

```text
Career is Strong
       │
       ├── because 10H has ...
       ├── because 10L has ...
       ├── because 6H/11H connect through ...
       ├── because Saturn/Mercury contribute through ...
       ├── because their condition is ...
       ├── therefore Career expression is ...
       ├── D10 qualifies it as ...
       ├── current MD/AD/PD activates ...
       ├── transit adds timing ...
       └── these factors provide the evidence.
```

And:

```text
Wealth is Supported
       │
       ├── Accumulation = ...
       ├── Gains = ...
       ├── Fortune = ...
       ├── Speculation = ...
       ├── primary structural evidence = ...
       ├── planetary evidence = ...
       ├── Dhana Yoga evidence = ...
       ├── Dasha activation = ...
       ├── D2 qualification = ...
       ├── transit timing = ...
       └── challenges = ...
```

That is the **CoreAstroG3 product standard**.

---

# 66. Strategic End State

The development principle for this phase is:

> **Do not make the engine bigger until it becomes more trustworthy.**

And specifically:

> **Do not add more Career/Wealth rules merely to increase feature count. Make the existing rules more context-aware, relational, hierarchical, dimension-specific, testable, and explainable.**

The desired outcome is:

```text
RELEVANCE
    ↓
PROMISE
    ↓
CONDITION
    ↓
RELATIONSHIP
    ↓
EXPRESSION / DIMENSION
    ↓
D10 / D2
    ↓
MD → AD → PD
    ↓
TRANSIT
    ↓
CONFLICT
    ↓
EVIDENCE
    ↓
DETERMINISTIC CONCLUSION
```

Once this chain is reliable, UI, AI, reporting, and eventual launch become much safer because they are consuming a trustworthy underlying engine.
