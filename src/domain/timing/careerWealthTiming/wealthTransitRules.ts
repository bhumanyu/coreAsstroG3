import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import type {
  WealthTransitFactor,
  TimingEffect
} from './careerWealthTimingTypes';

/**
 * Maps an array of WealthTransitFactors for a specific dimension into top-level transit effect and confidence score.
 */
export function mapWealthDimensionTransitEffect(
  factors: readonly WealthTransitFactor[],
  dimension: WealthDimension
): {
  transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  confidence: number;
} {
  const dimFactors = factors.filter((f) => f.dimension === dimension);
  if (!dimFactors || dimFactors.length === 0) {
    return { transitEffect: 'INSUFFICIENT_DATA', confidence: 0.5 };
  }

  let supportSum = 0;
  let challengeSum = 0;

  for (const factor of dimFactors) {
    if (factor.direction === 'SUPPORT') {
      supportSum += factor.weight;
    } else if (factor.direction === 'CHALLENGE') {
      challengeSum += factor.weight;
    }
  }

  if (supportSum === 0 && challengeSum === 0) {
    return { transitEffect: 'NEUTRAL', confidence: 0.5 };
  }

  const total = supportSum + challengeSum;
  let transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';

  if (supportSum > 0 && (challengeSum === 0 || supportSum >= 1.5 * challengeSum)) {
    transitEffect = 'SUPPORTS';
  } else if (challengeSum > 0 && (supportSum === 0 || challengeSum >= 1.5 * supportSum)) {
    transitEffect = 'CHALLENGES';
  } else {
    transitEffect = 'MIXED';
  }

  const dominantSum = transitEffect === 'SUPPORTS' ? supportSum : transitEffect === 'CHALLENGES' ? challengeSum : total * 0.5;
  const rawConfidence = total > 0 ? dominantSum / total : 0.5;
  const confidence = Number(Math.min(0.95, Math.max(0.5, rawConfidence)).toFixed(2));

  return { transitEffect, confidence };
}

/**
 * Resolves timing effect for a single wealth dimension according to CW-03 principles:
 * - Natal promise is the ceiling. WEAK -> DOES_NOT_ACTIVATE.
 * - Priority: natal > Dasha > transit.
 * - Speculation is independent and isolated.
 */
export function resolveWealthDimensionTransitEffect(
  natalPromise: DomainStrength,
  dashaEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA',
  transitSynthesis: { transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA' }
): TimingEffect {
  if (natalPromise === 'WEAK') {
    return 'DOES_NOT_ACTIVATE';
  }

  const transitEffect = transitSynthesis.transitEffect;

  if (dashaEffect === 'INSUFFICIENT_DATA' && transitEffect === 'INSUFFICIENT_DATA') {
    return 'INSUFFICIENT_DATA';
  }

  if (natalPromise === 'STRONG' || natalPromise === 'MODERATE') {
    if (dashaEffect === 'SUPPORTS') {
      if (transitEffect === 'CHALLENGES' || transitEffect === 'MIXED') {
        return 'MODIFIES';
      }
      return 'ACTIVATES';
    }
    if (dashaEffect === 'CHALLENGES') {
      if (transitEffect === 'SUPPORTS') {
        return 'MODIFIES';
      }
      return 'CHALLENGES';
    }
    if (dashaEffect === 'MIXED') {
      return 'MODIFIES';
    }
    // Dasha is NEUTRAL or INSUFFICIENT_DATA
    if (transitEffect === 'SUPPORTS') {
      return 'ACTIVATES';
    }
    if (transitEffect === 'CHALLENGES' || transitEffect === 'MIXED') {
      return 'MODIFIES';
    }
    return 'DOES_NOT_ACTIVATE';
  }

  if (natalPromise === 'MIXED') {
    if (dashaEffect === 'CHALLENGES' || transitEffect === 'CHALLENGES') {
      if (dashaEffect === 'SUPPORTS' && transitEffect === 'CHALLENGES') {
        return 'MODIFIES';
      }
      return 'CHALLENGES';
    }
    if (dashaEffect === 'SUPPORTS' || transitEffect === 'SUPPORTS') {
      return 'MODIFIES';
    }
    return 'MODIFIES';
  }

  return 'DOES_NOT_ACTIVATE';
}
