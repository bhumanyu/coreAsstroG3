import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import type { CareerDashaEffect } from '../../career/careerDasha/careerDashaSynthesisTypes';
import type {
  CareerTransitFactor,
  CareerTransitSynthesis,
  TimingEffect
} from './careerWealthTimingTypes';

/**
 * Maps an array of CareerTransitFactors into a top-level transit effect and confidence score
 * using 1.5x dominance thresholds and an INSUFFICIENT_DATA guard.
 */
export function mapTransitEffect(factors: readonly CareerTransitFactor[]): {
  transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
  confidence: number;
} {
  if (!factors || factors.length === 0) {
    return { transitEffect: 'INSUFFICIENT_DATA', confidence: 0.5 };
  }

  let supportSum = 0;
  let challengeSum = 0;

  for (const factor of factors) {
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
 * Resolves timing effect for a MIXED natal career promise.
 * Guardrail: A MIXED natal promise can never be upgraded to full ACTIVATES.
 */
export function resolveMixedNatalCareerPromise(
  dashaEffect: CareerDashaEffect | 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA',
  transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA'
): TimingEffect {
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

/**
 * Resolves timing effect for a supported (STRONG or MODERATE) natal career promise.
 */
export function resolveSupportedNatalCareerPromise(
  dashaEffect: CareerDashaEffect | 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA',
  transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA',
  hasDirectPrimaryActivation: boolean = false
): TimingEffect {
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

  // Dasha is NEUTRAL or INSUFFICIENT_DATA:
  // Transits alone act as modifiers/opportunities rather than a full secondary Dasha engine.
  // Returns ACTIVATES only when a transit directly activates a very strong primary natal Career factor
  // AND explicit rule designates direct primary activation.
  if (transitEffect === 'SUPPORTS') {
    return hasDirectPrimaryActivation ? 'ACTIVATES' : 'MODIFIES';
  }
  if (transitEffect === 'CHALLENGES' || transitEffect === 'MIXED') {
    return 'MODIFIES';
  }

  return 'DOES_NOT_ACTIVATE';
}

/**
 * Master resolution function enforcing CW-03 priority:
 * Natal promise (ceiling) > Dasha activation > Transit trigger.
 */
export function resolveCareerTransitEffect(
  natalPromise: DomainStrength,
  dashaEffect: CareerDashaEffect | 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA',
  transitSynthesis: {
    transitEffect: 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA';
    hasDirectPrimaryActivation?: boolean;
  }
): TimingEffect {
  // WEAK natal promise: Ceiling principle ensures it can never be activated or upgraded
  if (natalPromise === 'WEAK') {
    return 'DOES_NOT_ACTIVATE';
  }

  const transitEffect = transitSynthesis.transitEffect;

  if (dashaEffect === 'INSUFFICIENT_DATA' && transitEffect === 'INSUFFICIENT_DATA') {
    return 'INSUFFICIENT_DATA';
  }

  if (natalPromise === 'STRONG' || natalPromise === 'MODERATE') {
    return resolveSupportedNatalCareerPromise(
      dashaEffect,
      transitEffect,
      transitSynthesis.hasDirectPrimaryActivation ?? false
    );
  }

  if (natalPromise === 'MIXED') {
    return resolveMixedNatalCareerPromise(dashaEffect, transitEffect);
  }

  return 'DOES_NOT_ACTIVATE';
}
