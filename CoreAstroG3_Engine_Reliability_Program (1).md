# CoreAstroG3 — Engine Reliability & Determinism Program

## 1. Purpose

This document defines the engineering program for making **CoreAstroG3 reliable, deterministic, internally consistent, and production-grade** before any launch work or expansion into additional astrology domains.

### Current product scope

The product scope is intentionally limited to:

- **Career**
- **Wealth**

The following domains are **out of scope for this phase**:

- Marriage
- Children
- Health
- Property
- Spirituality
- Other life domains

The objective is not to add more features. The objective is to make the existing Career + Wealth engine trustworthy.

---

# 2. Core Reliability Principle

The engine must evolve toward one authoritative chain:

```text
ONE astronomical truth
        ↓
ONE canonical chart truth
        ↓
ONE Dasha truth
        ↓
ONE Career truth
        ↓
ONE Wealth truth
        ↓
ONE timing truth
        ↓
ONE evidence graph
        ↓
ONE final deterministic conclusion
        ↓
UI + AI explanations
```

There must be no competing production paths that can produce materially different results.

For identical:

- birth date
- birth time
- birth location
- timezone
- calculation methodology
- `asOf` timestamp
- engine/rules version

the engine should return the same deterministic analytical result.

---

# 3. Reliability Contract

## 3.1 Determinism

Given the same inputs and methodology:

```text
Analysis(Input A, Methodology M, AsOf T)
==
Analysis(Input A, Methodology M, AsOf T)
```

No random behavior should affect deterministic astrology.

AI generation may vary linguistically, but the underlying deterministic result must not.

## 3.2 Reproducibility

Every analysis must be reproducible from:

```text
BirthInput
+
Methodology
+
EngineVersion
+
RulesVersion
+
AsOf
```

## 3.3 Provenance

Every major conclusion must be traceable back to:

```text
Conclusion
   ↓
Inference
   ↓
Evidence
   ↓
Canonical chart/Dasha/transit fact
   ↓
Astronomical input
```

## 3.4 Separation of concerns

The engine must distinguish:

- raw astronomical facts
- derived chart facts
- astrological rules
- domain interpretations
- timing
- synthesis
- explanation

AI must not become an alternative astrology engine.

---

# 4. Target Architecture

```text
Birth Details
    │
    ▼
Input Validation
    │
    ▼
Astronomical Engine
    │
    ▼
Canonical Horoscope
    │
    ├───────────────┐
    ▼               ▼
Natal Truth       Dasha Truth
    │               │
    └───────┬───────┘
            ▼
    Career / Wealth
      Canonical CW-01
            │
       ┌────┴────┐
       ▼         ▼
      D10        D2
       │         │
       └────┬────┘
            ▼
       Timing Engine
            │
            ▼
      Conflict Resolver
            │
            ▼
       Evidence Graph
            │
            ▼
      Final Synthesis
            │
       ┌────┴────┐
       ▼         ▼
      UI        AI
```

---

# 5. Priority Classification

## P0 — Must Fix Before Reliability Can Be Claimed

1. Canonicalize CW-01
2. Propagate `asOf` through the full pipeline
3. Remove legacy Career/Wealth interpretation from production paths
4. Fix transit geometry semantics
5. Fix planet motion consistency
6. Fix Varga isolation
7. Make Dasha source canonical
8. Prevent evidence double-counting
9. Strict birth input validation
10. Make dependency/build/test execution reproducible
11. Add package lockfile
12. Secure remote AI credentials
13. Correct `.gitignore`
14. Ensure UI and AI consume the same final deterministic result

## P1 — Major Reliability/Quality Improvements

15. Semantic Career Dasha synthesis
16. Career manifestation taxonomy cleanup
17. D10 semantic confirmation
18. Wealth planetary Dasha synthesis
19. Wealth conflict resolution
20. Transit semantic model
21. Evidence root identity/deduplication
22. External astronomy validation
23. Core type safety
24. Explicit D2 availability/implementation status

## P2 — Product Hardening

25. Methodology panel
26. Static vs dynamic UI separation
27. Reasoning Explorer polish
28. Export/report reliability
29. Privacy documentation
30. Accessibility
31. Responsive behavior
32. Performance
33. Monitoring/observability

---

# 6. P0-01 — Canonicalize CW-01

## Current problem

The repository contains the CW-01 architecture, but the production path is not yet guaranteed to mean:

```ts
interpretCareerV2(horoscope)
```

and:

```ts
interpretWealthV2(horoscope)
```

as the one authoritative implementation.

The current pattern still conditionally invokes CW-01 through strategy options.

Example pattern:

```ts
if (options?.strategy === 'CW01') {
    ...
}
```

The product service also directly invokes V2 interpreters without necessarily forcing the canonical strategy.

## Required target

The public production API should become semantically unambiguous:

```ts
interpretCareerV2(horoscope)
```

means:

> Canonical Career CW-01 interpretation.

And:

```ts
interpretWealthV2(horoscope)
```

means:

> Canonical Wealth CW-01 interpretation.

Legacy implementations may remain temporarily as:

- migration references
- test oracles
- historical comparison tools

but must not participate in the production result.

## Acceptance criteria

- Product pipeline returns `reasoningVersion = CW-01`.
- No production result depends on legacy theme interpretation.
- Existing legacy implementations cannot silently become active.
- Golden tests prove the production path is canonical.

---

# 7. P0-02 — Immutable `asOf` Propagation

## Problem

`ProductAnalysisService.analyze()` accepts `asOf`, but the timestamp is not reliably propagated through the entire deterministic pipeline.

A mapper can later fall back to:

```ts
new Date().toISOString()
```

This creates a serious reproducibility problem.

The displayed analysis timestamp can differ from the timestamp actually used by timing/transit calculations.

## Required architecture

Create one immutable analysis context:

```ts
interface AnalysisContext {
    asOf: Instant;
    methodology: ProductMethodology;
    engineVersion: string;
    rulesVersion: string;
}
```

Pass the same context through:

```text
ProductAnalysisService
        ↓
Pipeline
        ↓
Dasha
        ↓
Career
        ↓
Wealth
        ↓
D10/D2
        ↓
Transit
        ↓
Final synthesis
        ↓
Mapper
        ↓
UI
        ↓
AI
```

## Critical invariant

Changing `asOf` must:

- potentially change timing/transit
- NEVER change natal promise

Therefore:

```text
Natal Promise(asOf=T1)
==
Natal Promise(asOf=T2)
```

while:

```text
Timing(asOf=T1)
may differ from
Timing(asOf=T2)
```

## Acceptance tests

- Run the same chart at two timestamps.
- Compare natal Career.
- Compare natal Wealth.
- They must remain unchanged.
- Compare timing/transits.
- They may change appropriately.
- Final output must explicitly preserve the requested `asOf`.

---

# 8. P0-03 — Remove Legacy Production Dependencies

## Problem

Legacy objects such as:

- `themeInterpretationV2`
- `interpretCareerTheme`
- `interpretWealthTheme`

still exist in the repository and may feed AI or other production consumers.

This creates:

```text
UI → Canonical Career
AI → Legacy Career
```

which is unacceptable.

## Required rule

All downstream consumers must use:

```text
Final Deterministic ProductAnalysis
```

not raw legacy theme structures.

AI should receive the same Career/Wealth result that the user sees.

## Target

```text
Canonical Analysis
       │
       ├── UI
       │
       ├── Why/Reasoning
       │
       └── AI Context
```

No alternate interpretation tree.

---

# 9. P0-04 — Transit Geometry

## Current critical semantic issue

The transit engine contains logic equivalent to:

```ts
natalSign === transitSign
```

being treated as:

```text
TRANSIT_OVER_NATAL_PLANET
```

This is incorrect if the intended meaning is conjunction.

Example:

```text
Natal = 1° Aries
Transit = 29° Aries
```

They share the same sign but are:

```text
28°
```

apart.

That is not a conjunction.

## Required taxonomy

Transit relationships should distinguish:

```text
SAME_SIGN
CONJUNCTION
OPPOSITION
SPECIAL_ASPECT
EXACT_CONTACT
```

## Geometry

Use angular separation:

```text
Δ = minimal angular distance between
    natal longitude and transit longitude
```

For example:

```text
Δ = min(
    abs(a-b),
    360-abs(a-b)
)
```

Then classify using configured aspect geometry and orb.

## Important distinction

```text
Same sign ≠ conjunction
```

## Required target model

```text
Transit Planet
      ↓
Longitude
      ↓
Angular Relationship
      ↓
Target
      ↓
Target Type
      ├── Planet
      ├── House
      ├── Lord
      └── Domain Factor
      ↓
Orb / Exactness
      ↓
Strength
      ↓
Duration / Motion
      ↓
Dasha Correlation
      ↓
Timing Interpretation
```

## Hard invariant

A transit can:

- activate
- time
- reinforce
- challenge

but must NOT create a natal promise that does not exist.

---

# 10. P0-05 — Canonical Planet Motion

## Problem

Astronomical position generation computes actual motion information, but downstream state calculations may reconstruct motion using defaults such as:

```ts
speed: 1.0
retrograde: false
stationary: false
```

This can cause:

```text
PlanetPosition:
    retrograde = true

PlanetState:
    retrograde = false
```

## Required design

Motion must be calculated once.

```ts
interface PlanetMotion {
    speed: number;
    retrograde: boolean;
    stationary: boolean;
}
```

Then:

```text
Astronomy
   ↓
PlanetPosition
   +
PlanetMotion
   ↓
All downstream calculations
```

No downstream recalculation using fake defaults.

## Acceptance tests

For every supported planet:

```text
Position.motion
==
State.motion
==
Transit/reference motion
```

where applicable.

Include retrograde and stationary boundary fixtures.

---

# 11. P0-06 — Varga Isolation

## Problem

Divisional chart construction can retain metadata derived from D1 while replacing longitude.

This can lead to a dangerous structure such as:

```text
D10 longitude = D10
D10 sign = D1
D10 house = D1
```

## Required data model

Separate layers:

```text
PlanetPosition
    = raw astronomical position

VargaPosition
    = divisional position

ChartContext
    = chart-specific sign/house interpretation
```

A D10 object must not inherit D1 sign/house semantics.

## Required tests

For every Varga:

- D1 sign must not leak into D9.
- D1 sign must not leak into D10.
- D1 house must not leak into D10.
- D1 dignity must be recalculated where applicable.
- D1 metadata must not survive merely because the object was copied.

---

# 12. P0-07 — Canonical Dasha Source

## Problem

Dasha view-model generation still has fallback logic involving:

- `horoscope.dashaInterpretation`
- `vimshottari`
- `fullNatalAnalysis.vimshottari`

This creates multiple possible Dasha truths.

## Required source

The product Dasha pipeline should use:

```ts
horoscope.dashaInterpretation
```

as the authoritative source.

The upstream engine should guarantee that it is populated correctly.

## Dasha invariants

The Dasha engine should guarantee:

```text
Moon Nakshatra
        ↓
Birth Dasha Balance
        ↓
Mahadasha
        ↓
Antardasha
        ↓
Pratyantar Dasha
```

The timeline must be:

- continuous
- non-overlapping
- correctly nested
- reproducible

## Convention

If using 365.25 days for product calculations, this must be explicit and consistently applied.

---

# 13. P0-08 — Evidence Deduplication

## Problem

The same underlying astrological fact can potentially appear through:

```text
Natal evidence
CW rule
Dasha rule
D10 rule
Final synthesis
Legacy rule
```

If every representation receives an independent weight, the engine may accidentally count one fact multiple times.

## Required evidence model

Every derived evidence item should retain:

```text
rootFactId
producer
phase
role
sourceType
```

Example:

```text
rootFactId:
    NATAL_10L_STRONG

producer:
    CareerDashaSynthesis

phase:
    INFERENCE

role:
    SUPPORT

sourceType:
    DASHA
```

## Principle

One underlying fact can support multiple explanations, but it should not become multiple independent votes.

---

# 14. P0-09 — Strict Birth Input Validation

## Current risk

Patterns such as:

```ts
latitude: parseFloat(latitude) || 0
```

can silently convert invalid input into:

```text
0
```

This is unacceptable.

## Required validation

### Latitude

```text
-90 <= latitude <= 90
```

### Longitude

```text
-180 <= longitude <= 180
```

### Date

Must be a valid calendar date.

### Time

Must be valid.

### Timezone

Must be valid and explicit.

### Location

Must resolve to a valid geographic location where required.

## Rule

Invalid input must produce an explicit validation error.

Never silently replace bad input with:

```text
0
0
UTC
```

or another arbitrary default.

---

# 15. P0-10 — Reproducible Build/Test Environment

## Current issue

The repository does not currently provide a fully reproducible dependency installation path because a committed lockfile is missing.

CI uses:

```bash
npm ci
```

but `npm ci` requires a lockfile.

## Required

Commit:

```text
package-lock.json
```

Then CI should execute:

```bash
npm ci
npm run lint
npm test
npm run build
```

## CI principle

A clean machine must be able to:

```text
clone
↓
install
↓
typecheck
↓
test
↓
build
```

without manual intervention.

---

# 16. P0-11 — `.gitignore` Hardening

The repository should ignore:

```text
node_modules/
dist/
coverage/

.env
.env.*
!.env.example
```

This is especially important if AI provider credentials are ever used.

---

# 17. P0-12 — AI Security Boundary

## Rule

Never expose provider API secrets in browser/client code.

The architecture should be:

```text
Browser
   ↓
Backend/API boundary
   ↓
Provider secret
   ↓
AI provider
```

not:

```text
Browser
   ↓
OPENAI_API_KEY
```

or equivalent.

## AI responsibility

AI should explain:

```text
deterministic result
+
evidence
+
reasoning trace
```

It should not independently calculate:

- houses
- planetary strength
- Dasha
- transit aspects
- Career promise
- Wealth promise

---

# 18. P0-13 — One Result for UI and AI

The final deterministic object should be the source for:

```text
Career UI
Wealth UI
Dasha UI
Why Result UI
AI Context
Exports
```

Target:

```text
ProductAnalysisResult
        │
        ├── Product UI
        ├── Reasoning Explorer
        ├── Evidence
        └── AI Context
```

There should not be an AI-specific reconstruction of the analysis.

---

# 19. Career Reliability Model

Career should follow this hierarchy:

```text
Natal Promise
      ↓
Career Expression
      ↓
D10 Confirmation
      ↓
Dasha Activation
      ↓
Transit Timing
      ↓
Final Synthesis
```

## Primary Career factors

- 10th house
- 10th lord

## Secondary

- 6th house
- 2nd house
- 11th house

## Planetary relevance

- Sun
- Saturn
- Mercury
- Mars
- Jupiter

## Factors

Each relevant planet should be evaluated through:

```text
Ownership
Placement
Functional Role
Functional Nature
Dignity
Strength
State
Aspects
Yogas
Karaka relevance
D10
Dasha
Transit
```

---

# 20. Career Dasha Reasoning

Career Dasha should not simply be a score.

Use:

```text
Relevance
    ↓
Condition
    ↓
Expression
```

Example:

```text
Planet is relevant to Career
        ↓
Planet is strong/supportive
        ↓
Planet activates a specific career expression
```

A weighted score can assist reasoning, but must not replace semantic logic.

## Required Dasha hierarchy

```text
MD
 ↓
AD
 ↓
PD
```

The system must respect hierarchy.

A highly favorable PD should not automatically override a strongly challenging MD/AD.

---

# 21. Career Manifestation Taxonomy

Consolidate overlapping labels into:

```text
LEADERSHIP
MANAGEMENT
TECHNICAL_SPECIALIZATION
SERVICE_EMPLOYMENT
AUTHORITY_INSTITUTIONAL
INDEPENDENT_PROFESSIONAL
ENTREPRENEURSHIP
```

## Entrepreneurship caution

10H/10L/11H/11L alone do not prove entrepreneurship.

Entrepreneurship should consider an intentional combination of:

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

and relevant structural relationships.

---

# 22. D10 Reliability

D10 should not simply say:

> D10 confirms Career.

It should answer:

> What specific Career expression does D10 confirm?

Examples:

```text
Management
Technical specialization
Authority
Institutional expression
Professional independence
```

D10 should function as confirmation/refinement of natal Career promise.

It should not invent a career promise absent from D1.

---

# 23. Wealth Reliability Model

Wealth should be divided into four independent dimensions:

```text
ACCUMULATION
GAINS
FORTUNE
SPECULATION
```

## Core principle

Speculation should not determine overall Wealth.

For example:

```text
Strong accumulation
Strong gains
Strong fortune
Weak speculation
```

can still produce:

```text
Strong overall wealth potential
+
High speculative caution
```

## UI terminology

Prefer:

> Speculative Risk Indication

instead of:

> Risk Profile

because the system is providing an astrological indication, not a quantitative financial risk model.

---

# 24. Wealth Dasha Synthesis

Wealth needs a Career-level planetary Dasha synthesis.

For each MD/AD/PD planet evaluate:

```text
2H
5H
9H
11H
ownership
placement
functional role
functional nature
dignity
strength
state
aspects
Yogas
Karaka
D2
```

Then map separately to:

```text
Accumulation
Gains
Fortune
Speculation
```

Do not collapse these dimensions too early.

---

# 25. D2 / Hora

D2 should not be represented as complete until it is actually implemented and validated.

If unavailable:

```text
D2 status = NOT_AVAILABLE
```

not:

```text
D2 = weak
```

and not:

```text
Wealth = unavailable
```

D2 should be added after the core D1 + Dasha Wealth reasoning is stable.

---

# 26. Conflict Resolution

The engine needs explicit conflict handling.

Examples:

### Case A

```text
Strong natal Career
+
Weak D10
```

Result:

```text
Strong natal promise
+
D10 qualification/conflict
```

Not:

```text
Career is weak
```

### Case B

```text
Weak natal Career
+
Excellent Dasha
```

Result:

```text
Weak natal foundation
+
temporary activation/support
```

Dasha does not manufacture natal promise.

### Case C

```text
Strong natal Career
+
supportive MD
+
supportive AD
+
challenging PD
```

PD should modify the current expression, not erase the hierarchy.

---

# 27. Transit Reliability Model

Transit should be treated as timing/activation.

```text
Natal Promise
       +
Dasha Activation
       +
Transit Trigger
       ↓
Timing
```

Not:

```text
Transit
  ↓
Creates Promise
```

## Transit strength should consider

- angular separation
- aspect type
- orb
- exactness
- planetary nature
- functional role
- natal target
- target house
- target lord
- target planet
- retrograde motion
- duration
- Dasha correlation

---

# 28. Astronomy Validation

The astronomical engine should eventually be externally validated against a trusted reference such as:

- Swiss Ephemeris
- JPL/reference ephemerides

Validation should cover:

```text
Sun
Moon
Mercury
Venus
Mars
Jupiter
Saturn
Rahu/Ketu methodology
Ascendant
```

## Highest priority

Moon.

Reason:

```text
Moon
 ↓
Nakshatra
 ↓
Dasha balance
 ↓
MD
 ↓
AD
 ↓
PD
 ↓
Current timing
```

A Moon error near a Nakshatra boundary can cascade into the entire timing system.

## Boundary testing

Include cases near:

- sign boundaries
- Nakshatra boundaries
- retrograde stations
- combustion boundaries
- aspect orb boundaries
- Ascendant boundaries

---

# 29. Shadbala and Strength Claims

Do not claim complete Shadbala unless every required component is actually implemented and validated.

If a component is missing:

```text
NOT_IMPLEMENTED
```

or:

```text
PARTIAL
```

should be represented explicitly.

The product must not present partial calculations as complete classical strength calculations.

---

# 30. Evidence Architecture

The evidence model should distinguish:

```text
OBSERVATION
INFERENCE
SYNTHESIS
```

## Observation

Direct chart fact.

Example:

```text
10th lord occupies X.
```

## Inference

A deterministic astrological rule derives a meaning.

Example:

```text
10th lord placement supports Career expression.
```

## Synthesis

Multiple inferences combine into a final conclusion.

Example:

```text
Career promise is strong with management/technical emphasis.
```

The evidence graph should preserve this hierarchy.

---

# 31. Type Safety

The core engine currently relies too heavily on broad `any` contracts.

This is especially dangerous in:

- Horoscope
- Chart
- Dasha
- Planet positions
- Varga
- Domain results
- Reasoning
- Provenance

## Target

Replace generic `any` with explicit domain types.

Prefer:

```ts
type PlanetId = ...
type HouseNumber = ...
type Longitude = ...
type Sign = ...
type DashaPeriod = ...
type Evidence = ...
type CareerResult = ...
type WealthResult = ...
```

Use branded/value-object types where appropriate.

Do this incrementally.

Do not attempt a giant type rewrite before behavioral reliability is stabilized.

---

# 32. Correct Domain Boundaries

Avoid conceptual aliases such as:

```ts
type Chart = Horoscope
```

A horoscope is broader than a chart.

Prefer explicit models:

```text
Horoscope
 ├── BirthContext
 ├── NatalChart
 ├── DivisionalCharts
 ├── DashaInterpretation
 ├── TransitData
 └── Analysis metadata
```

---

# 33. Test Strategy

The repository already has a substantial test suite. The next step is not merely increasing test count.

The priority is **behavioral golden coverage of the production path**.

## Career golden cases

### C1 — Strong natal promise

Expected:

```text
strong Career promise
```

### C2 — Strong natal + strong D10

Expected:

```text
strong promise
+
strong D10 confirmation
```

### C3 — Strong natal + supportive MD/AD + challenging PD

Expected:

```text
strong foundation
+
supportive period
+
PD-level challenge
```

### C4 — Challenging MD + supportive AD

Expected:

```text
MD hierarchy remains dominant
```

### C5 — Challenging transit only

Expected:

```text
timing challenge
```

not:

```text
natal Career weakness
```

### C6 — Weak natal + favorable Dasha

Expected:

```text
weak natal foundation
+
temporary activation
```

### C7 — D10 conflict

Expected:

```text
natal and D10 signals separately represented
```

### C8 — Employment vs Entrepreneurship

Expected:

```text
canonical manifestation taxonomy
```

with no unsupported entrepreneurship claim.

---

# 34. Wealth Golden Cases

### W1

Strong accumulation.

### W2

Strong gains.

### W3

Strong core Wealth + weak speculation.

### W4

Strong speculation + weak accumulation.

### W5

D2 conflict once D2 exists.

### W6

Dasha challenge.

### W7

Dasha supports accumulation but challenges speculation.

Each should verify that the four Wealth dimensions do not collapse into one score prematurely.

---

# 35. Mutation and Boundary Tests

Mandatory regression tests:

```text
Changing asOf
→ does not change natal promise

Removing D10
→ reduces confirmation
→ does not fabricate natal weakness

Removing D2
→ marks D2 unavailable
→ does not make Wealth unavailable

Favorable PD
→ cannot override challenging MD/AD hierarchy

Weak natal + favorable Dasha
→ remains weak natal foundation

One fact represented in multiple layers
→ cannot multiply its evidence weight

Same sign
→ is not automatically conjunction

Retrograde planet
→ retains consistent motion state

D10 chart
→ cannot inherit D1 house/sign metadata
```

---

# 36. Production-Path Golden Test

One especially important test should execute the same public service used by the UI:

```text
ProductAnalysisService
       ↓
production pipeline
       ↓
Career
       ↓
Wealth
       ↓
Dasha
       ↓
Timing
       ↓
Final result
```

Do not test only internal helpers.

The production API itself must be covered.

---

# 37. Reliability Invariants

The engine should eventually enforce these invariants.

## Invariant 1

Same inputs + same methodology + same `asOf`:

```text
same result
```

## Invariant 2

Changing `asOf`:

```text
natal result unchanged
timing may change
```

## Invariant 3

Transit:

```text
cannot create natal promise
```

## Invariant 4

Dasha:

```text
activates/modifies promise
does not manufacture promise
```

## Invariant 5

D10:

```text
confirms/refines Career expression
does not independently create Career promise
```

## Invariant 6

D2:

```text
refines Wealth
does not create Wealth from nothing
```

## Invariant 7

Same fact:

```text
cannot receive multiple independent votes
```

## Invariant 8

Varga:

```text
must be isolated from D1 metadata
```

## Invariant 9

Invalid birth input:

```text
must fail explicitly
```

## Invariant 10

AI:

```text
must explain deterministic result
must not independently calculate it
```

---

# 38. Reliability Observability

Every analysis should internally carry enough metadata to answer:

```text
Which engine version ran?
Which rules version?
Which methodology?
Which ayanamsa?
Which zodiac?
Which house system?
Which Dasha system?
Which calculation convention?
What was the asOf timestamp?
Which evidence produced the conclusion?
```

This should be available in a technical/debug representation even if not all of it is shown in the public UI.

---

# 39. Methodology Contract

The result should contain something equivalent to:

```ts
interface ProductMethodology {
    zodiacSystem: string;
    ayanamsa: string;
    houseSystem: string;
    dashaSystem: string;
    calculationEngine: string;
    rulesEngine: string;
    vargaRules: string;
}
```

These values must represent the actual runtime configuration.

Do not hardcode:

```text
Lahiri
Whole Sign
ASTRO_CORE_V1
PARASHARA_CLASSICAL_RULES_V2
PARASHARA_D10_D2
```

unless those are genuinely the active runtime values.

---

# 40. UI Reliability

The public UI should clearly separate:

## Static/Natal

```text
Career Promise
Career Expression
Wealth Foundation
Accumulation
Gains
Fortune
Speculation
```

## Dynamic

```text
Current Dasha
Current AD
Current PD
Transit
Timing
```

This prevents users from confusing:

```text
natal promise
```

with:

```text
current activation
```

---

# 41. Reasoning Explorer

The reasoning engine is one of the strongest differentiators.

The user should eventually be able to see:

```text
Conclusion
   ↓
Why?
   ↓
Evidence
   ↓
Rule
   ↓
Chart fact
```

Example:

```text
Career Promise: Strong

Why?

10th lord is strongly placed
    ↓
supports Career foundation

Saturn has relevant functional connection
    ↓
supports sustained professional structure

D10 reinforces management/technical expression
    ↓
confirmation

Current Dasha activates relevant factors
    ↓
timing
```

Raw rule IDs should not be the primary UX.

---

# 42. README and Metadata

Current README/metadata should be aligned with the actual product.

The product should be described as:

> Career & Wealth Astrology Analysis Engine

not as a generic:

> Complete Life Prediction Engine

Remove claims for functionality that is not actually implemented.

Especially verify metadata claims about server-side AI providers.

Documentation must reflect reality.

---

# 43. CI Definition of Done

A reliability milestone is not complete until:

```bash
npm ci
npm run lint
npm test
npm run build
```

all pass on a clean environment.

CI should execute the same basic commands.

---

# 44. Recommended Implementation Sequence

## Phase 1 — Freeze architecture

Do not introduce:

- new life domains
- unnecessary abstractions
- new AI providers
- major UI redesign

Focus only on correctness.

---

## Phase 2 — Canonical production path

Implement:

1. CW-01 canonical Career
2. CW-01 canonical Wealth
3. canonical Dasha source
4. remove production legacy dependencies
5. ensure `reasoningVersion = CW-01`

---

## Phase 3 — Temporal determinism

Implement:

1. immutable `asOf`
2. full propagation
3. transit geometry
4. motion consistency
5. timing regression tests

---

## Phase 4 — Chart correctness

Implement:

1. Varga isolation
2. D1/D10/D2 contract separation
3. birth input validation
4. astronomical boundary tests

---

## Phase 5 — Evidence correctness

Implement:

1. root fact IDs
2. evidence roles
3. observation/inference/synthesis levels
4. deduplication
5. conflict handling

---

## Phase 6 — Domain reasoning

Career:

1. semantic Dasha synthesis
2. manifestation taxonomy
3. D10 refinement

Wealth:

1. planetary Dasha synthesis
2. four-dimension conflict resolution
3. D2 implementation

---

## Phase 7 — External validation

Build a reference corpus.

For each birth chart compare:

```text
CoreAstro
vs
trusted astronomical reference
```

Start with:

```text
Moon
Sun
Ascendant
```

then all planets.

---

## Phase 8 — Type hardening

After behavioral correctness is stable:

1. eliminate core `any`
2. strengthen domain contracts
3. remove unsafe indexing
4. make compiler strictness meaningful

---

## Phase 9 — Product hardening

Only after engine reliability:

- methodology panel
- reasoning UX
- export
- accessibility
- privacy
- performance
- monitoring

---

# 45. Reliability Matrix

Maintain a living matrix:

| Component | Implemented | Deterministic | Tested | Externally Validated | Production Connected | Status |
|---|---:|---:|---:|---:|---:|---|
| Birth validation | Partial | Yes | Partial | N/A | Yes | P0 |
| Astronomy | Yes | Yes | Partial | Partial | Yes | P0 |
| D1 | Yes | Yes | Yes | Partial | Yes | P0 |
| Vargas | Yes | Yes | Partial | Partial | Yes | P0 |
| Dasha | Yes | Yes | Yes | Partial | Yes | P0 |
| Career CW-01 | Yes | Yes | Partial | N/A | Partial | P0 |
| Wealth CW-01 | Yes | Yes | Partial | N/A | Partial | P0 |
| Career Dasha | Yes | Yes | Partial | N/A | Partial | P1 |
| Wealth Dasha | Partial | Yes | Partial | N/A | Partial | P1 |
| D10 | Yes | Yes | Partial | Partial | Yes | P1 |
| D2 | Partial | Yes | Partial | Partial | Partial | P1 |
| Transit | Yes | Yes | Partial | Partial | Yes | P0 |
| Evidence | Yes | Yes | Partial | N/A | Yes | P0 |
| Final synthesis | Yes | Yes | Partial | N/A | Yes | P0 |
| AI context | Yes | Mostly | Partial | N/A | Yes | P0 |
| CI | Partial | N/A | Partial | N/A | Yes | P0 |

The matrix must be updated as fixes land.

---

# 46. Definition of "Reliable Engine"

CoreAstroG3 should not be called reliable merely because:

- many tests pass
- charts render
- AI produces good prose
- the UI looks correct
- individual astrology rules work

Reliability means:

```text
Correct input
+
correct astronomy
+
correct chart derivation
+
correct Dasha
+
correct domain reasoning
+
correct timing
+
correct evidence
+
correct synthesis
+
reproducibility
+
no conflicting production paths
```

---

# 47. Final Quality Gate

Before considering the reliability phase complete, verify:

### Architecture

- [ ] One canonical production analysis path
- [ ] CW-01 authoritative
- [ ] No legacy interpretation in production
- [ ] One Dasha source
- [ ] One timing source

### Astronomy

- [ ] Planet positions deterministic
- [ ] Motion state consistent
- [ ] Ascendant validated
- [ ] Moon validated
- [ ] Boundary cases covered
- [ ] Varga isolation verified

### Dasha

- [ ] Birth balance correct
- [ ] MD continuous
- [ ] AD continuous
- [ ] PD continuous
- [ ] No source duplication
- [ ] `asOf` handled consistently

### Career

- [ ] Natal promise deterministic
- [ ] Career Dasha hierarchy deterministic
- [ ] D10 isolated
- [ ] Manifestation taxonomy canonical
- [ ] Entrepreneurship guardrails implemented

### Wealth

- [ ] Accumulation independent
- [ ] Gains independent
- [ ] Fortune independent
- [ ] Speculation independent
- [ ] Speculation does not dominate overall Wealth
- [ ] Wealth Dasha synthesis implemented
- [ ] D2 status explicit

### Timing

- [ ] Degree-based transit geometry
- [ ] Same-sign ≠ conjunction
- [ ] Orb handling
- [ ] Transit cannot create promise
- [ ] Dasha/transit correlation deterministic

### Evidence

- [ ] Root fact identity
- [ ] Deduplication
- [ ] Observation/inference/synthesis separation
- [ ] Conflict resolution
- [ ] Traceable final conclusion

### Engineering

- [ ] Strict birth validation
- [ ] Core types hardened
- [ ] No dangerous `any` in critical contracts
- [ ] package-lock committed
- [ ] `.gitignore` hardened
- [ ] CI reproducible
- [ ] clean build passes
- [ ] clean test suite passes

### AI

- [ ] Same result as UI
- [ ] No independent astrology calculation
- [ ] Secret boundary secured
- [ ] Methodology comes from runtime
- [ ] AI explains evidence rather than inventing it

---

# 48. Strategic Rule for This Development Phase

The most important rule is:

> **Do not make the engine bigger until it becomes more trustworthy.**

The immediate objective is not:

```text
More Yogas
More Vargas
More Domains
More AI
More UI
```

The immediate objective is:

```text
Same input
    ↓
Same astronomical truth
    ↓
Same Dasha truth
    ↓
Same Career truth
    ↓
Same Wealth truth
    ↓
Same timing truth
    ↓
Same evidence
    ↓
Same final conclusion
```

Once that chain is stable, additional astrology capability can be added safely.

---

# 49. End State

The desired CoreAstroG3 engine should behave like:

```text
                    ┌──────────────────┐
                    │   BIRTH INPUT    │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ VALIDATION       │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ ASTRONOMY        │
                    │ SINGLE TRUTH     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ CANONICAL CHART  │
                    └────────┬─────────┘
                             ↓
                  ┌──────────┴──────────┐
                  ↓                     ↓
          ┌──────────────┐      ┌──────────────┐
          │ CAREER       │      │ WEALTH       │
          │ CW-01        │      │ CW-01        │
          └──────┬───────┘      └──────┬───────┘
                 ↓                     ↓
          ┌──────────────┐      ┌──────────────┐
          │ D10          │      │ D2           │
          └──────┬───────┘      └──────┬───────┘
                 └──────────┬──────────┘
                            ↓
                    ┌──────────────┐
                    │ DASHA        │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ TRANSIT      │
                    │ GEOMETRY     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ CONFLICT     │
                    │ RESOLUTION   │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ EVIDENCE     │
                    │ GRAPH        │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ FINAL RESULT │
                    └──────┬───────┘
                           ↓
                  ┌────────┴────────┐
                  ↓                 ↓
                UI                 AI
```

**This is the reliability target.**

Launch planning is deliberately excluded from this document. The current development objective is solely to make the **Career + Wealth deterministic astrology engine reliable, explainable, testable, and internally consistent**.
