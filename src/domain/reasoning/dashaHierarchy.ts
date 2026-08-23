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
      dominantLevel = 'NONE';
    }
  } else if (md.effect === 'CHALLENGES') {
    if (ad.effect === 'CHALLENGES') {
      finalEffect = 'CHALLENGES';
      dominantLevel = 'MD';
    } else if (ad.effect === 'ACTIVATES') {
      // Invariant: MD CHALLENGES + AD ACTIVATES must NOT become full ACTIVATES
      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'MD';
    } else {
      finalEffect = 'CHALLENGES';
      dominantLevel = 'MD';
    }
  } else if (md.effect === 'ACTIVATES') {
    if (ad.effect === 'CHALLENGES') {
      // Invariant: MD ACTIVATES + AD CHALLENGES -> PARTIALLY_ACTIVATES
      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'MD';
    } else if (ad.effect === 'ACTIVATES') {
      // Invariant: PD may refine a supportive MD+AD combination
      finalEffect =
        pd.effect === 'CHALLENGES'
          ? 'PARTIALLY_ACTIVATES'
          : 'ACTIVATES';

      dominantLevel =
        pd.effect === 'CHALLENGES'
          ? 'AD'
          : 'MD';
    } else if (ad.effect === 'PARTIALLY_ACTIVATES') {
      finalEffect = 'PARTIALLY_ACTIVATES';
      dominantLevel = 'AD';
    } else {
      finalEffect = 'ACTIVATES';
      dominantLevel = 'MD';
    }
  } else if (md.effect === 'PARTIALLY_ACTIVATES') {
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

    const selected = [...levels].sort(
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
      'Dasha hierarchy resolved with MD as primary regime, AD as secondary modification, and PD as tertiary refinement.'
  });
}
