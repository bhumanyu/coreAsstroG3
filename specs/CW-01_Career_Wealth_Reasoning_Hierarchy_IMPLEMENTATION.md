# CW-01 — Career & Wealth Reasoning Hierarchy
## Complete Implementation Specification

**Scope:** Career + Wealth only  
**Status:** Implementation-ready  
**Source basis:** `CW-01_Career_Wealth_Reasoning_Hierarchy.md`

---

## 1. Objective

Upgrade the existing Career V2 and Wealth V2 implementations from evidence aggregation into deterministic, hierarchy-aware reasoning without redesigning the existing product architecture.

The reasoning order is:

```text
Primary Natal Promise
        ↓
Secondary Structural Support
        ↓
Modifiers
        ↓
Yoga / Classical Confirmation
        ↓
Varga Confirmation
        ↓
Dasha Activation
        ↓
Transit Trigger
        ↓
Conflict Resolution
        ↓
Final Domain Conclusion
        ↓
Reasoning Trace
        ↓
WHY / AI Explanation
```

Core rule:

> Natal promise establishes what the chart can support. Dasha activates or challenges that promise. Transit modifies or triggers timing. Varga confirms/modifies specialized expression. Later layers must not silently erase a strong natal promise unless an explicit conflict rule exists.

---

## 2. Non-negotiable rules

### 2.1 Do not rebuild existing engines

CW-01 must not rebuild:

- Vimshottari Dasha calculation
- Nakshatra calculation
- D1 calculation
- D10 calculation
- D2 calculation
- AI provider architecture
- AI routing architecture
- Life Analysis UI architecture
- Full Natal Report architecture

CW-01 consumes existing deterministic facts/evidence.

### 2.2 No user-facing numerical astrology scores

Use qualitative states only:

```ts
export type DomainStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';
```

Internal weights are engineering controls only.

### 2.3 Evidence quality > quantity

A strong primary factor can outweigh multiple weak secondary factors.

### 2.4 Promise != activation != trigger

```text
Natal Promise = structural capacity
Dasha Activation = period-level activation/modification
Transit Trigger = current timing pressure/opportunity
```

### 2.5 Missing evidence is not negative evidence

`UNAVAILABLE` must never silently become `CHALLENGE`.

### 2.6 D10/D2 are qualifiers, not replacements

D10 qualifies Career.

D2 will eventually qualify Wealth.

Neither silently rewrites D1.

---

# 3. File tree

Create:

```text
src/domain/reasoning/
├── reasoningTypes.ts
├── reasoningWeights.ts
├── reasoningHierarchy.ts
├── reasoningConflictResolver.ts
├── reasoningConclusion.ts
├── dashaHierarchy.ts
├── reasoningTrace.ts
└── index.ts

src/domain/reasoning/
├── reasoningHierarchy.test.ts
├── reasoningConflictResolver.test.ts
├── reasoningConclusion.test.ts
└── dashaHierarchy.test.ts

src/domain/career/
├── careerReasoningRules.ts
├── careerReasoningHierarchy.ts
└── careerReasoningHierarchy.test.ts

src/domain/wealth/
├── wealthReasoningRules.ts
├── wealthReasoningHierarchy.ts
└── wealthReasoningHierarchy.test.ts
```

Existing files remain compatible:

```text
src/domain/career/CareerDomainInterpreterV2.ts
src/domain/wealth/WealthDomainInterpreterV2.ts
```

---

# 4. Shared reasoning types

## `src/domain/reasoning/reasoningTypes.ts`

```ts
export type ReasoningLayer =
  | 'PRIMARY_PROMISE'
  | 'SECONDARY_SUPPORT'
  | 'MODIFIER'
  | 'YOGA'
  | 'VARGA'
  | 'DASHA'
  | 'TRANSIT';

export type ReasoningDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type TimingLevel = 'MD' | 'AD' | 'PD';

export type DomainStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type TimingActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type EvidenceStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK';

export interface WeightedReasoningEvidence {
  readonly evidenceId: string;
  readonly ruleId?: string;
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly strength: EvidenceStrength;
  readonly priority: number;
  readonly weight: number;
  readonly statement: string;
  readonly relatedEvidenceIds: readonly string[];
}

export interface LayerSummary {
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly weightedSupport: number;
  readonly weightedChallenge: number;
  readonly evidenceIds: readonly string[];
}

export interface DirectionalTimingResult {
  readonly level: TimingLevel;
  readonly effect: TimingActivationEffect;
  readonly confidence: number;
  readonly evidenceIds: readonly string[];
}

export interface TimingHierarchyResult {
  readonly md: DirectionalTimingResult;
  readonly ad: DirectionalTimingResult;
  readonly pd: DirectionalTimingResult;
  readonly finalEffect: TimingActivationEffect;
  readonly dominantLevel: TimingLevel | 'NONE';
  readonly rationale: string;
}

export interface HierarchicalDomainResult {
  readonly natalDirection: ReasoningDirection;
  readonly natalStrength: DomainStrength;
  readonly layerSummaries: readonly LayerSummary[];
  readonly dasha: TimingHierarchyResult;
  readonly vargaDirection: ReasoningDirection;
  readonly transitDirection: ReasoningDirection;
  readonly finalStrength: DomainStrength;
  readonly finalStatement: string;
  readonly primaryEvidenceIds: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedEvidenceIds: readonly string[];
}

export interface ReasoningTrace {
  readonly primaryPromise: readonly WeightedReasoningEvidence[];
  readonly secondarySupport: readonly WeightedReasoningEvidence[];
  readonly modifiers: readonly WeightedReasoningEvidence[];
  readonly yogas: readonly WeightedReasoningEvidence[];
  readonly varga: readonly WeightedReasoningEvidence[];
  readonly dasha: readonly WeightedReasoningEvidence[];
  readonly transit: readonly WeightedReasoningEvidence[];
}
```

---

# 5. Engineering weights

## `src/domain/reasoning/reasoningWeights.ts`

These are engineering weights, not classical doctrine.

```ts
import type {
  EvidenceStrength,
  ReasoningLayer,
  TimingLevel
} from './reasoningTypes';

export const REASONING_LAYER_WEIGHTS: Readonly<
  Record<ReasoningLayer, number>
> = Object.freeze({
  PRIMARY_PROMISE: 5.0,
  SECONDARY_SUPPORT: 2.5,
  MODIFIER: 1.5,
  YOGA: 2.5,
  VARGA: 2.5,
  DASHA: 2.0,
  TRANSIT: 1.0
});

export const EVIDENCE_STRENGTH_WEIGHTS: Readonly<
  Record<EvidenceStrength, number>
> = Object.freeze({
  VERY_STRONG: 1.5,
  STRONG: 1.25,
  MODERATE: 1.0,
  WEAK: 0.5
});

export const EVIDENCE_PRIORITY_FLOOR = 1;

export const MD_AD_PD_FACTOR: Readonly<
  Record<TimingLevel, number>
> = Object.freeze({
  MD: 1.0,
  AD: 0.70,
  PD: 0.40
});
```

Never expose these weights to users.

---

# 6. Evidence classification

## `src/domain/reasoning/reasoningHierarchy.ts`

Reuse the existing repository `DomainEvidence` type. Do not replace it with a parallel evidence system.

```ts
import type { DomainEvidence } from '../interpretation';

import type {
  LayerSummary,
  ReasoningDirection,
  ReasoningLayer,
  WeightedReasoningEvidence
} from './reasoningTypes';

import {
  EVIDENCE_STRENGTH_WEIGHTS,
  REASONING_LAYER_WEIGHTS
} from './reasoningWeights';

function resolveLayer(
  evidence: DomainEvidence
): ReasoningLayer {

  if (evidence.phase === 'NATAL_PROMISE') {

    if (
      evidence.role === 'PRIMARY' ||
      evidence.priority >= 90
    ) {
      return 'PRIMARY_PROMISE';
    }

    if (evidence.role === 'SECONDARY') {
      return 'SECONDARY_SUPPORT';
    }

    return 'MODIFIER';
  }

  if (evidence.phase === 'MODIFIER') {

    if (
      evidence.role === 'CONFIRMATION' &&
      evidence.source === 'D10'
    ) {
      return 'VARGA';
    }

    return 'MODIFIER';
  }

  if (evidence.phase === 'VARGA_CONFIRMATION') {
    return 'VARGA';
  }

  if (evidence.phase === 'DASHA_ACTIVATION') {
    return 'DASHA';
  }

  if (evidence.phase === 'TRANSIT_TRIGGER') {
    return 'TRANSIT';
  }

  if (evidence.role === 'CONFIRMATION') {
    return 'YOGA';
  }

  return 'MODIFIER';
}

function resolveDirection(
  evidence: DomainEvidence
): ReasoningDirection {

  switch (evidence.polarity) {
    case 'SUPPORTING':
      return 'SUPPORT';

    case 'CHALLENGING':
      return 'CHALLENGE';

    default:
      return 'NEUTRAL';
  }
}

export function classifyReasoningEvidence(
  evidence: readonly DomainEvidence[]
): readonly WeightedReasoningEvidence[] {

  return Object.freeze(
    evidence.map((item) => {

      const layer = resolveLayer(item);
      const direction = resolveDirection(item);

      const strengthWeight =
        EVIDENCE_STRENGTH_WEIGHTS[item.strength];

      const layerWeight =
        REASONING_LAYER_WEIGHTS[layer];

      return Object.freeze({
        evidenceId: item.id,

        ...(item.ruleId
          ? { ruleId: item.ruleId }
          : {}),

        layer,
        direction,
        strength: item.strength,
        priority: item.priority,
        weight: layerWeight * strengthWeight,

        statement: item.statement,

        relatedEvidenceIds:
          Object.freeze([
            ...item.relatedEvidenceIds
          ])
      });
    })
  );
}

export function summarizeLayers(
  evidence: readonly WeightedReasoningEvidence[]
): readonly LayerSummary[] {

  const layers =
    new Set<ReasoningLayer>(
      evidence.map((item) => item.layer)
    );

  return Object.freeze(
    [...layers].map((layer) => {

      const layerEvidence =
        evidence.filter(
          (item) => item.layer === layer
        );

      const weightedSupport =
        layerEvidence
          .filter(
            (item) => item.direction === 'SUPPORT'
          )
          .reduce(
            (sum, item) => sum + item.weight,
            0
          );

      const weightedChallenge =
        layerEvidence
          .filter(
            (item) => item.direction === 'CHALLENGE'
          )
          .reduce(
            (sum, item) => sum + item.weight,
            0
          );

      const direction: ReasoningDirection =
        weightedSupport === 0 &&
        weightedChallenge === 0
          ? 'NEUTRAL'
          : weightedSupport === weightedChallenge
            ? 'MIXED'
            : weightedSupport > weightedChallenge
              ? 'SUPPORT'
              : 'CHALLENGE';

      return Object.freeze({
        layer,
        direction,
        weightedSupport,
        weightedChallenge,
        evidenceIds: Object.freeze(
          layerEvidence.map(
            (item) => item.evidenceId
          )
        )
      });
    })
  );
}
```

---

# 7. Critical fact-vs-direction rule

Do not convert every descriptive fact into directional evidence.

Example:

```text
Jupiter owns 10H
```

is a fact.

It becomes:

```text
Career → SUPPORT
```

only after domain interpretation evaluates:

```text
house ownership
+
placement
+
functional role
+
strength
+
relationship
+
domain relevance
```

Therefore CW-01 should consume existing directional domain evidence and should not invent polarity from raw facts.

---

# 8. Natal promise resolver

## `src/domain/reasoning/reasoningConclusion.ts`

Dasha and transit are excluded from natal promise.

```ts
import type {
  DomainStrength,
  ReasoningDirection,
  WeightedReasoningEvidence
} from './reasoningTypes';

export interface NatalPromiseResult {
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;

  readonly primarySupport: number;
  readonly primaryChallenge: number;

  readonly secondarySupport: number;
  readonly secondaryChallenge: number;

  readonly rationale: string;
}

function sum(
  evidence: readonly WeightedReasoningEvidence[],
  direction: 'SUPPORT' | 'CHALLENGE'
): number {

  return evidence
    .filter(
      (item) => item.direction === direction
    )
    .reduce(
      (total, item) => total + item.weight,
      0
    );
}

function resolveStrength(
  support: number,
  challenge: number
): DomainStrength {

  const total = support + challenge;

  if (total === 0) {
    return 'UNDETERMINED';
  }

  const dominance =
    Math.abs(support - challenge) / total;

  if (support > challenge) {

    if (dominance >= 0.75) return 'VERY_STRONG';
    if (dominance >= 0.50) return 'STRONG';

    return 'MODERATE';
  }

  if (challenge > support) {

    if (dominance >= 0.75) return 'VERY_WEAK';
    if (dominance >= 0.50) return 'WEAK';

    return 'MIXED';
  }

  return 'MIXED';
}

export function resolveNatalPromise(
  evidence: readonly WeightedReasoningEvidence[]
): NatalPromiseResult {

  const primary =
    evidence.filter(
      (item) =>
        item.layer === 'PRIMARY_PROMISE'
    );

  const secondary =
    evidence.filter(
      (item) =>
        item.layer === 'SECONDARY_SUPPORT'
    );

  const modifiers =
    evidence.filter(
      (item) =>
        item.layer === 'MODIFIER'
    );

  const primarySupport =
    sum(primary, 'SUPPORT');

  const primaryChallenge =
    sum(primary, 'CHALLENGE');

  const secondarySupport =
    sum(secondary, 'SUPPORT');

  const secondaryChallenge =
    sum(secondary, 'CHALLENGE');

  const primaryNet =
    primarySupport - primaryChallenge;

  const secondaryNet =
    secondarySupport - secondaryChallenge;

  const modifierNet =
    sum(modifiers, 'SUPPORT') -
    sum(modifiers, 'CHALLENGE');

  let direction: ReasoningDirection;

  if (
    primarySupport === 0 &&
    primaryChallenge === 0
  ) {

    direction =
      secondaryNet > 0
        ? 'SUPPORT'
        : secondaryNet < 0
          ? 'CHALLENGE'
          : 'UNAVAILABLE';

  } else if (
    primarySupport > 0 &&
    primaryChallenge > 0
  ) {

    direction = 'MIXED';

  } else if (primaryNet > 0) {

    direction = 'SUPPORT';

  } else {

    direction = 'CHALLENGE';
  }

  const strength =
    resolveStrength(
      primarySupport +
        secondarySupport +
        Math.max(modifierNet, 0),

      primaryChallenge +
        secondaryChallenge +
        Math.max(-modifierNet, 0)
    );

  return Object.freeze({
    direction,
    strength,
    primarySupport,
    primaryChallenge,
    secondarySupport,
    secondaryChallenge,
    rationale:
      'Natal promise is resolved from primary evidence first, then secondary support and modifiers. Dasha and transit evidence are excluded.'
  });
}
```

The exact numeric thresholds are engineering defaults and must be validated against existing golden cases before replacing the current strength path.

---

# 9. Dasha hierarchy

## `src/domain/reasoning/dashaHierarchy.ts`

Hierarchy:

```text
MD = primary regime
AD = secondary modification
PD = short-term refinement
```

```ts
import type {
  DirectionalTimingResult,
  TimingActivationEffect,
  TimingHierarchyResult,
  TimingLevel
} from './reasoningTypes';

const EFFECT_RANK: Readonly<
  Record<TimingActivationEffect, number>
> = Object.freeze({
  ACTIVATES: 3,
  PARTIALLY_ACTIVATES: 2,
  DOES_NOT_ACTIVATE: 0,
  CHALLENGES: -2,
  UNKNOWN: 0,
  INSUFFICIENT_DATA: 0
});

export interface DashaTimingEvidence {
  readonly level: TimingLevel;
  readonly effect: TimingActivationEffect;
  readonly evidenceIds: readonly string[];
  readonly confidence: number;
}

function toDirectionalResult(
  input: DashaTimingEvidence
): DirectionalTimingResult {

  return Object.freeze({
    level: input.level,
    effect: input.effect,
    confidence: input.confidence,
    evidenceIds: Object.freeze([
      ...input.evidenceIds
    ])
  });
}

export function resolveDashaHierarchy(
  md: DashaTimingEvidence,
  ad: DashaTimingEvidence,
  pd: DashaTimingEvidence
): TimingHierarchyResult {

  const mdRank = EFFECT_RANK[md.effect];
  const adRank = EFFECT_RANK[ad.effect];
  const pdRank = EFFECT_RANK[pd.effect];

  let finalEffect: TimingActivationEffect;
  let dominantLevel: TimingLevel | 'NONE' = 'NONE';

  if (
    md.effect === 'INSUFFICIENT_DATA' ||
    md.effect === 'UNKNOWN'
  ) {

    if (
      ad.effect !== 'UNKNOWN' &&
      ad.effect !== 'INSUFFICIENT_DATA'
    ) {
      finalEffect = ad.effect;
      dominantLevel = 'AD';

    } else if (
      pd.effect !== 'UNKNOWN' &&
      pd.effect !== 'INSUFFICIENT_DATA'
    ) {
      finalEffect = pd.effect;
      dominantLevel = 'PD';

    } else {
      finalEffect = 'UNKNOWN';
    }

  } else if (md.effect === 'CHALLENGES') {

    if (ad.effect === 'CHALLENGES') {
      finalEffect = 'CHALLENGES';
      dominantLevel = 'MD';

    } else if (ad.effect === 'ACTIVATES') {
      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'MD';

    } else {
      finalEffect = 'CHALLENGES';
      dominantLevel = 'MD';
    }

  } else if (md.effect === 'ACTIVATES') {

    if (ad.effect === 'CHALLENGES') {
      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'MD';

    } else if (ad.effect === 'ACTIVATES') {

      finalEffect =
        pd.effect === 'CHALLENGES'
          ? 'PARTIALLY_ACTIVATES'
          : 'ACTIVATES';

      dominantLevel =
        pd.effect === 'CHALLENGES'
          ? 'AD'
          : 'MD';

    } else if (
      ad.effect === 'PARTIALLY_ACTIVATES'
    ) {

      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'AD';

    } else {

      finalEffect = 'ACTIVATES';
      dominantLevel = 'MD';
    }

  } else if (
    md.effect === 'PARTIALLY_ACTIVATES'
  ) {

    if (ad.effect === 'ACTIVATES') {

      finalEffect =
        pd.effect === 'ACTIVATES'
          ? 'ACTIVATES'
          : 'PARTIALLY_ACTIVATES';

      dominantLevel = 'AD';

    } else if (ad.effect === 'CHALLENGES') {

      finalEffect = 'CHALLENGES';
      dominantLevel = 'AD';

    } else {

      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'MD';
    }

  } else {

    const levels = [
      {
        level: 'MD' as const,
        result: md,
        rank: mdRank
      },
      {
        level: 'AD' as const,
        result: ad,
        rank: adRank
      },
      {
        level: 'PD' as const,
        result: pd,
        rank: pdRank
      }
    ];

    const selected =
      [...levels].sort(
        (a, b) => b.rank - a.rank
      )[0];

    finalEffect = selected.result.effect;
    dominantLevel = selected.level;
  }

  return Object.freeze({
    md: toDirectionalResult(md),
    ad: toDirectionalResult(ad),
    pd: toDirectionalResult(pd),
    finalEffect,
    dominantLevel,
    rationale:
      'Dasha hierarchy resolved with MD as primary, AD as secondary, and PD as tertiary timing influence.'
  });
}
```

---

# 10. Dasha hierarchy invariants

### Rule A

```text
MD CHALLENGES
AD ACTIVATES
```

must not automatically become full `ACTIVATES`.

### Rule B

```text
MD ACTIVATES
AD CHALLENGES
```

normally becomes `PARTIALLY_ACTIVATES`, subject to configured strength/conflict policy.

### Rule C

PD can refine a supportive MD+AD combination.

### Rule D

PD cannot independently create a strong natal promise.

---

# 11. Career reasoning

## Primary

```text
10H
10L
```

## Secondary

```text
6H
6L
2H
2L
11H
11L
```

## Modifiers

```text
Sun
Saturn
Mercury
Mars
Jupiter
Dignity
Strength
Drishti
Conjunctions
```

## Yoga

```text
Raja Yoga
Dharma-Karmadhipati
Mahapurusha
etc.
```

## Varga

```text
D10
```

Reuse existing rule IDs. Do not invent IDs that are not emitted by existing evidence generators.

---

# 12. Career manifestation model

CW-01 should prepare for:

```ts
export type CareerManifestation =
  | 'LEADERSHIP'
  | 'MANAGEMENT'
  | 'TECHNICAL_SPECIALIZATION'
  | 'SERVICE_EMPLOYMENT'
  | 'AUTHORITY'
  | 'INDEPENDENT_WORK'
  | 'BUSINESS_ENTREPRENEURSHIP';
```

A manifestation is strong only when supported by at least:

```text
1 primary/strong factor
+
1 independent supporting factor
```

A strong overall Career domain alone is not sufficient.

---

# 13. Career manifestation rules

## `src/domain/career/careerReasoningRules.ts`

```ts
export const CAREER_MANIFESTATION_RULES = Object.freeze({

  LEADERSHIP: [
    'CAREER_HOUSE_PROMISE_10H_001',
    'CAREER_LORD_PROMISE_10L_001',
    'CAREER_SUN_KARAKA_001',
    'CAREER_JUPITER_KARAKA_001',
    'CAREER_YOGA_CONFIRMATION_001'
  ],

  MANAGEMENT: [
    'CAREER_HOUSE_PROMISE_10H_001',
    'CAREER_SATURN_KARAKA_001',
    'CAREER_10H_11H_LINK_001'
  ],

  TECHNICAL_SPECIALIZATION: [
    'CAREER_MERCURY_KARAKA_001',
    'CAREER_MARS_KARAKA_001',
    'CAREER_MERCURY_RELEVANCE_001',
    'CAREER_MARS_RELEVANCE_001'
  ],

  SERVICE_EMPLOYMENT: [
    'CAREER_HOUSE_PROMISE_6H_001',
    'CAREER_LORD_PROMISE_6L_001',
    'CAREER_SATURN_KARAKA_001'
  ],

  AUTHORITY: [
    'CAREER_HOUSE_PROMISE_10H_001',
    'CAREER_SUN_KARAKA_001',
    'CAREER_10L_DIGNITY_001'
  ],

  INDEPENDENT_WORK: [
    'CAREER_HOUSE_PROMISE_11H_001',
    'CAREER_LORD_PROMISE_11L_001'
  ],

  BUSINESS_ENTREPRENEURSHIP: [
    'CAREER_HOUSE_PROMISE_11H_001',
    'CAREER_10H_11H_LINK_001'
  ]

});
```

These IDs are taken from the implementation specification as candidate mappings. Before committing, map each to actual existing repository evidence IDs.

---

# 14. D10 integration

Career reasoning order:

```text
D1 Natal Promise
        ↓
D10 Confirmation / Modification
        ↓
Dasha Hierarchy
        ↓
Transit
        ↓
Conflict Resolution
        ↓
Career Conclusion
```

D10 must never replace D1.

Example:

```text
D1 = STRONG
D10 = CONFLICTS
```

means:

```text
Natal Career = STRONG
D10 = CONFLICTS
Final = qualified/reduced expression
```

Recommended wording:

> Strong natal career promise with divisional execution friction.

Not:

> Career is weak.

---

# 15. Career interpreter integration

In `CareerDomainInterpreterV2.ts`, move from raw timing selection to the hierarchy:

```ts
const timingHierarchy =
  resolveCareerDashaHierarchy(
    timingActivations
  );

const conclusionData =
  buildCareerConclusionData(
    ...existingArguments,
    timingHierarchy
  );
```

Add optional compatibility fields:

```ts
interface CareerConclusionData {
  readonly timingHierarchy?: DashaHierarchyResult;

  readonly timingDominantLevel?:
    | 'MD'
    | 'AD'
    | 'PD'
    | 'NONE';
}
```

Existing `currentActivation` must derive from the hierarchy.

---

# 16. Career target product output

```text
CAREER

Natal Promise: STRONG

Primary Factors
• 10th house ...
• 10th lord ...

Supporting Factors
• 6th ...
• 11th ...

Modifiers
• Saturn ...
• Mercury ...

Yoga Confirmation
• ...

D10
CONFIRMS

Current Dasha
ACTIVATES

Current Transit
MODERATE PRESSURE

Dominant Manifestation
TECHNICAL SPECIALIZATION

Overall
Strong natal career promise with active timing,
confirmed by D10, with moderate current pressure.

WHY
[traceable evidence]
```

---

# 17. Wealth reasoning

Wealth remains four-dimensional:

```text
Accumulation
Gains
Fortune
Speculation
```

Primary houses:

```text
Accumulation → 2H / 2L
Gains       → 11H / 11L
Fortune     → 9H / 9L
Speculation → 5H / 5L
```

Secondary/modifier evidence must reuse existing Wealth evidence producers.

---

# 18. Wealth dimension model

```ts
export type WealthDimension =
  | 'ACCUMULATION'
  | 'GAINS'
  | 'FORTUNE'
  | 'SPECULATION';

export interface WealthDimensionReasoningResult {
  readonly dimension: WealthDimension;

  readonly natalStatus: string;

  readonly mdEffect: TimingActivationEffect;
  readonly adEffect: TimingActivationEffect;
  readonly pdEffect: TimingActivationEffect;

  readonly finalTimingEffect:
    TimingActivationEffect;

  readonly dominantTimingLevel:
    | 'MD'
    | 'AD'
    | 'PD'
    | 'NONE';

  readonly primaryEvidenceIds:
    readonly string[];

  readonly supportingEvidenceIds:
    readonly string[];

  readonly challengingEvidenceIds:
    readonly string[];
}
```

---

# 19. Wealth must not collapse dimensions early

Correct:

```text
Accumulation = STRONG
Gains        = STRONG
Fortune      = MODERATE
Speculation  = CHALLENGED

Overall Wealth = STRONG
```

Incorrect:

```text
Speculation = CHALLENGED
        ↓
Overall Wealth = MIXED
```

Speculation is not equivalent to total Wealth.

---

# 20. Speculation-specific safeguard

CW-01 must not infer:

```text
5H strong
5L strong
      ↓
excellent trading
```

The current scope only determines whether the **speculation dimension** is supported or challenged.

It does not establish suitability for:

- options
- derivatives
- leverage
- day trading
- high-risk trading

Those require a later semantic/risk layer.

---

# 21. Wealth Dasha integration

Evaluate MD/AD/PD independently for each dimension:

```text
Accumulation
  MD / AD / PD / final

Gains
  MD / AD / PD / final

Fortune
  MD / AD / PD / final

Speculation
  MD / AD / PD / final
```

Do not calculate one generic Wealth Dasha result and copy it to every dimension.

---

# 22. Wealth conflict types

```ts
export type WealthConflictKind =
  | 'NATAL_PRIMARY_CONFLICT'
  | 'D2_CONFIRMATION_CONFLICT'
  | 'DIMENSION_TENSION'
  | 'DASHA_NATAL_TENSION'
  | 'TRANSIT_NATAL_TENSION';
```

Implement now:

```text
NATAL_PRIMARY_CONFLICT
DIMENSION_TENSION
DASHA_NATAL_TENSION
TRANSIT_NATAL_TENSION
```

Keep:

```text
D2_CONFIRMATION_CONFLICT = UNAVAILABLE
```

until D2 interpretation exists.

---

# 23. Wealth final output

```text
WEALTH

Overall: STRONG

Accumulation: STRONG
Gains: STRONG
Fortune: MODERATE
Speculation: MIXED

Current Dasha

Accumulation: ACTIVATES
Gains: ACTIVATES
Fortune: PARTIALLY_ACTIVATES
Speculation: CHALLENGES

Overall

Strong wealth-building potential led by accumulation
and gains, with more mixed speculative indications.

WHY
[traceable evidence]
```

---

# 24. Conflict resolution model

## `src/domain/reasoning/reasoningConflictResolver.ts`

```ts
export type ConflictSeverity =
  | 'MINOR'
  | 'MODERATE'
  | 'MAJOR'
  | 'CRITICAL';

export type ConflictScope =
  | 'PROMISE'
  | 'EXPRESSION'
  | 'TIMING'
  | 'RISK';

export interface ReasoningConflict {
  readonly kind: string;
  readonly severity: ConflictSeverity;
  readonly scope: ConflictScope;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface ConflictResolution {
  readonly conflicts: readonly ReasoningConflict[];

  readonly finalDirection:
    | 'SUPPORT'
    | 'CHALLENGE'
    | 'MIXED'
    | 'NEUTRAL'
    | 'UNAVAILABLE';

  readonly rationale: string;
}
```

Priority of conflict:

```text
Promise-level conflict
>
Expression-level conflict
>
Timing-level conflict
>
Short-term trigger
```

A challenging transit cannot erase a strong natal promise.

---

# 25. Reasoning trace

## `src/domain/reasoning/reasoningTrace.ts`

```ts
import type {
  ReasoningTrace,
  WeightedReasoningEvidence
} from './reasoningTypes';

export function buildReasoningTrace(
  evidence: readonly WeightedReasoningEvidence[]
): ReasoningTrace {

  const byLayer = (
    layer: WeightedReasoningEvidence['layer']
  ): readonly WeightedReasoningEvidence[] =>
    Object.freeze(
      evidence.filter(
        (item) => item.layer === layer
      )
    );

  return Object.freeze({
    primaryPromise:
      byLayer('PRIMARY_PROMISE'),

    secondarySupport:
      byLayer('SECONDARY_SUPPORT'),

    modifiers:
      byLayer('MODIFIER'),

    yogas:
      byLayer('YOGA'),

    varga:
      byLayer('VARGA'),

    dasha:
      byLayer('DASHA'),

    transit:
      byLayer('TRANSIT')
  });
}
```

The trace is the bridge to:

```text
WHY UI
AI explanation
debugging
golden tests
```

Do not expose internal weights.

---

# 26. DomainInterpretation compatibility

Do not redesign the existing interface.

Add optional fields:

```ts
readonly reasoningTrace?: ReasoningTrace;

readonly reasoningVersion?: 'CW-01';
```

This allows old and new reasoning outputs to coexist during migration.

---

# 27. Migration flag

Use:

```ts
export interface DomainReasoningOptions {
  readonly strategy?: 'LEGACY' | 'CW01';
}
```

Example:

```ts
interpretCareerV2(
  horoscope,
  {
    strategy: 'CW01'
  }
);
```

and:

```ts
interpretWealthV2(
  horoscope,
  {
    strategy: 'CW01'
  }
);
```

Do not remove legacy reasoning until all golden scenarios pass.

---

# 28. Career golden scenarios

### C1 — Strong natal promise

Expected:

```text
Natal = VERY_STRONG / STRONG
```

### C2 — Strong promise + D10 confirm

Expected:

```text
D10 = CONFIRMS
```

### C3 — Strong promise + MD support + AD support + PD challenge

Expected:

```text
PARTIALLY_ACTIVATES
or
ACTIVATES
```

according to configured policy.

### C4 — Challenging MD + supportive AD

Expected:

```text
Not full ACTIVATES
```

### C5 — Challenging transit only

Expected:

```text
Natal promise preserved
Pressure increased
```

### C6 — Weak natal + favorable Dasha

Expected:

```text
Natal remains weak
Dasha = ACTIVATION
```

### C7 — D10 conflict

Expected:

```text
D1 promise remains visible
Final conclusion qualified
```

---

# 29. Wealth golden scenarios

### W1

```text
Accumulation = STRONG
Gains = STRONG
```

Expected:

```text
Overall Wealth = STRONG
```

### W2

```text
Wealth strong
Speculation weak
```

Expected:

```text
Overall Wealth = STRONG / SUPPORTED
Speculation = CHALLENGED
```

### W3

```text
Weak natal
Good Dasha
```

Expected:

```text
Natal remains limited
Dasha = ACTIVATION
```

### W4

```text
MD support
AD challenge
PD support
```

Expected:

```text
MD > AD > PD hierarchy preserved
```

### W5

```text
Accumulation strong
Speculation weak
```

Expected:

```text
No false global MIXED
```

### W6

```text
Transit challenge
```

Expected:

```text
Natal promise retained
Timing pressure increased
```

---

# 30. Cross-domain scenarios

### X1

```text
Career STRONG
Wealth STRONG
```

### X2

```text
Career STRONG
Wealth MIXED
```

Expected:

```text
Career ranking > Wealth
```

### X3

Career and Wealth active in the same Dasha.

Expected:

```text
SharedTiming contains same period key.
```

### X4

```text
Career active
Wealth speculation challenged
```

Expected:

```text
Career conclusion is not degraded.
```

---

# 31. Career × Wealth synthesis

Keep this as a separate synthesis layer.

Do not modify individual domain results.

Examples:

```text
Career STRONG
Wealth STRONG
```

may synthesize to:

> Strong professional and wealth-building potential.

```text
Career STRONG
Wealth MODERATE
```

means:

> Strong career potential does not automatically imply equally strong wealth accumulation.

```text
Career MODERATE
Wealth STRONG
```

means:

> Wealth indications may have channels beyond conventional career progression.

---

# 32. AI architecture

Do not redesign the AI system.

Use:

```text
Canonical Facts
      ↓
Domain Evidence
      ↓
CW-01 Hierarchy
      ↓
Conflict Resolution
      ↓
Domain Conclusion
      ↓
Reasoning Trace
      ↓
AI Context
      ↓
Natural-language explanation
```

AI explains deterministic results; it does not become the source of the deterministic conclusion.

---

# 33. Product UX contract

## Career

Display:

```text
Career Strength
Natal Promise
Primary Factors
Supporting Factors
Modifiers
Yoga Confirmation
D10
Current Dasha
Current Transit
Dominant Manifestation
Overall Conclusion
Why
```

## Wealth

Display:

```text
Overall Wealth
Accumulation
Gains
Fortune
Speculation
Current Dasha per dimension
Current Transit
Overall Conclusion
Why
```

Never expose:

```text
layerWeight = 5.0
evidenceWeight = 1.25
priority = 90
```

---

# 34. Implementation order

```text
CW-01-A  Shared reasoning types
CW-01-B  Reasoning weights
CW-01-C  Evidence classification
CW-01-D  Natal promise resolver
CW-01-E  MD/AD/PD hierarchy
CW-01-F  Conflict resolver
CW-01-G  Career integration
CW-01-H  Wealth integration
CW-01-I  Reasoning trace
CW-01-J  Migration flag
CW-01-K  Career golden scenarios
CW-01-L  Wealth golden scenarios
CW-01-M  Cross-domain scenarios
Full test/build
CW-01 acceptance
```

---

# 35. Explicit non-goals

Do not implement in CW-01:

- Marriage
- Children
- Property
- Health
- Spirituality
- Ashtakavarga
- Jaimini
- KP
- Nadi
- complete Shadbala
- D2 calculation
- new remote AI providers

---

# 36. Acceptance criteria

## Career

- Primary promise evaluated before secondary evidence.
- Evidence quantity cannot overpower a materially stronger primary factor.
- D10 modifies/confirms/qualifies rather than replacing D1.
- MD > AD > PD timing hierarchy is enforced.
- Transit cannot create natal promise.
- Dasha cannot create natal promise.
- Career manifestations are evidence-driven.
- Career conflicts are explicitly represented.
- Final conclusion is traceable.

## Wealth

- 2H/2L are primary accumulation factors.
- 11H/11L are primary gains factors.
- 9H/9L are fortune factors.
- 5H/5L are speculation factors.
- Four dimensions remain independent until final summary.
- Weak speculation does not automatically weaken accumulation/gains.
- Dasha hierarchy is applied separately per dimension.
- Transit cannot create natal wealth promise.
- D2 remains explicitly unavailable rather than fabricated.
- Wealth conflicts are traceable.

## Shared

- Reasoning trace is deterministic.
- No user-facing numerical score.
- Evidence IDs remain resolvable.
- Unknown/missing evidence is never silently interpreted as negative.
- Tests cover positive, negative, mixed, timing and conflict cases.
- Existing Career/Wealth APIs remain backwards compatible during migration.

---

# 37. End-state architecture

```text
                         CORE ASTRO
                              │
                              ▼
                       Canonical Facts
                              │
                              ▼
                       Domain Evidence
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
              Career                    Wealth
                 │                         │
                 └────────────┬────────────┘
                              ▼
                    CW-01 Reasoning
                         Hierarchy
                              │
          ┌──────────┬─────────┼──────────┐
          ▼          ▼         ▼          ▼
       Promise     Yoga      Varga      Dasha
          │          │         │          │
          └──────────┴─────────┼──────────┘
                               ▼
                            Transit
                               │
                               ▼
                       Conflict Resolver
                               │
                               ▼
                       Domain Conclusion
                               │
                               ▼
                       Reasoning Trace
                         │           │
                         ▼           ▼
                        WHY          AI
                         │           │
                         └─────┬─────┘
                               ▼
                         User Result
```

---

# 38. Product end state

## Career

```text
CAREER

Natal Promise: STRONG

Primary Factors
10H / 10L

Supporting Factors
6H / 11H

Modifiers
...

Yoga
...

D10
CONFIRMS

Current Dasha
ACTIVATES

Current Transit
MODERATE PRESSURE

Dominant Manifestation
TECHNICAL SPECIALIZATION

Overall
Strong natal career promise with active timing,
confirmed by D10, with moderate current pressure.

WHY
Traceable deterministic evidence
```

## Wealth

```text
WEALTH

Overall: STRONG

Accumulation: STRONG
Gains: STRONG
Fortune: MODERATE
Speculation: MIXED

Current Dasha

Accumulation: ACTIVATES
Gains: ACTIVATES
Fortune: PARTIALLY_ACTIVATES
Speculation: CHALLENGES

Overall
Strong wealth-building potential led by accumulation
and gains, with more mixed speculative indications.

WHY
Traceable deterministic evidence
```

---

# 39. Next roadmap after CW-01

Do not move directly to Marriage.

Implement:

### CW-02 — Career Manifestation Deepening

Expand Career into:

```text
Capacity
Mode
Manifestation
Environment
Progression
```

### CW-03 — Wealth Dimension & Conflict Deepening

Strengthen:

```text
Accumulation
Gains
Fortune
Speculation
```

### CW-04 — D10 Career Semantic Interpretation

Move beyond:

```text
CONFIRMS
MODIFIES
CONFLICTS
```

toward semantic career expression.

### CW-05 — D2 Wealth Interpretation

Only when D2 is actually available.

### CW-06 — Dasha × Transit × Career/Wealth

Integrate:

```text
Natal
MD
AD
PD
Transit
```

per domain/dimension.

### CW-07 — Career/Wealth Golden Scenario Validation

Freeze:

```text
CoreAstro Career & Wealth Beta v1
```

Only then begin the next life domain.

---

# 40. Final engineering principle

The finished system must answer three independent questions:

```text
1. WHAT CAN THE NATAL CHART SUPPORT?
        ↓
2. WHAT IS THE CURRENT DASHA ACTIVATING?
        ↓
3. WHAT IS CURRENTLY BEING TRIGGERED OR MODIFIED?
```

Only after those are resolved should the product generate:

```text
FINAL CAREER CONCLUSION
FINAL WEALTH CONCLUSION
```

That separation is the central purpose of CW-01.
