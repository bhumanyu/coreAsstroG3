import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  CareerDashaEffect,
  CareerDashaFactor,
  CareerDashaPlanetSynthesis
} from './careerDashaSynthesisTypes';

export function effectScore(effect: CareerDashaEffect): number {
  switch (effect) {
    case 'STRONGLY_SUPPORTS':
      return 2.0;
    case 'SUPPORTS':
      return 1.0;
    case 'MIXED':
      return 0.0;
    case 'CHALLENGES':
      return -1.0;
    case 'STRONGLY_CHALLENGES':
      return -2.0;
    case 'DOES_NOT_ACTIVATE':
    case 'INSUFFICIENT_DATA':
    default:
      return 0.0;
  }
}

export function calculateFactorScore(factors: readonly CareerDashaFactor[]): {
  support: number;
  challenge: number;
} {
  let support = 0;
  let challenge = 0;
  for (const factor of factors) {
    if (factor.direction === 'SUPPORT') {
      support += factor.weight;
    } else if (factor.direction === 'CHALLENGE') {
      challenge += factor.weight;
    }
  }
  return {
    support: Math.round(support * 100) / 100,
    challenge: Math.round(challenge * 100) / 100
  };
}

export function resolveCareerDashaEffect(
  support: number,
  challenge: number,
  factors: readonly CareerDashaFactor[]
): CareerDashaEffect {
  if (factors.length === 0) {
    return 'INSUFFICIENT_DATA';
  }
  const total = support + challenge;
  if (total === 0) {
    return 'DOES_NOT_ACTIVATE';
  }
  const ratio = support / total;
  if (ratio >= 0.75 && support >= 3.0) {
    return 'STRONGLY_SUPPORTS';
  }
  if (ratio >= 0.6) {
    return 'SUPPORTS';
  }
  if (ratio <= 0.25 && challenge >= 3.0) {
    return 'STRONGLY_CHALLENGES';
  }
  if (ratio <= 0.4) {
    return 'CHALLENGES';
  }
  return 'MIXED';
}

export function resolveCombinedCareerDashaEffect(
  md: CareerDashaPlanetSynthesis,
  ad: CareerDashaPlanetSynthesis,
  pd: CareerDashaPlanetSynthesis,
  combinedScore: number
): CareerDashaEffect {
  if (
    md.effect === 'INSUFFICIENT_DATA' ||
    (ad.effect === 'INSUFFICIENT_DATA' && pd.effect === 'INSUFFICIENT_DATA' && md.effect === 'DOES_NOT_ACTIVATE')
  ) {
    return 'INSUFFICIENT_DATA';
  }

  if (md.effect === 'DOES_NOT_ACTIVATE') {
    if (ad.effect === 'DOES_NOT_ACTIVATE' && pd.effect === 'DOES_NOT_ACTIVATE') {
      return 'DOES_NOT_ACTIVATE';
    }
    if (ad.effect === 'STRONGLY_SUPPORTS' || ad.effect === 'SUPPORTS') {
      return 'SUPPORTS';
    }
    if (ad.effect === 'STRONGLY_CHALLENGES' || ad.effect === 'CHALLENGES') {
      return 'CHALLENGES';
    }
    return 'MIXED';
  }

  // MD sets the base framework; AD and PD modify and refine
  switch (md.effect) {
    case 'STRONGLY_SUPPORTS': {
      // AD and PD can only modify/refine: outcome MUST be in { STRONGLY_SUPPORTS, SUPPORTS, MIXED }
      if (combinedScore >= 1.2) {
        return 'STRONGLY_SUPPORTS';
      }
      if (combinedScore >= 0.2) {
        return 'SUPPORTS';
      }
      return 'MIXED';
    }
    case 'SUPPORTS': {
      // Outcome can be elevated to STRONGLY_SUPPORTS or lowered to MIXED or CHALLENGES, but never STRONGLY_CHALLENGES
      if (combinedScore >= 1.3 && (ad.effect === 'STRONGLY_SUPPORTS' || pd.effect === 'STRONGLY_SUPPORTS')) {
        return 'STRONGLY_SUPPORTS';
      }
      if (combinedScore >= 0.3) {
        return 'SUPPORTS';
      }
      if (combinedScore >= -0.7) {
        return 'MIXED';
      }
      return 'CHALLENGES';
    }
    case 'MIXED': {
      if (combinedScore >= 0.7) {
        return 'SUPPORTS';
      }
      if (combinedScore <= -0.7) {
        return 'CHALLENGES';
      }
      return 'MIXED';
    }
    case 'CHALLENGES': {
      // Outcome can be elevated to MIXED or lowered to STRONGLY_CHALLENGES, but never STRONGLY_SUPPORTS
      if (combinedScore >= 0.5 && (ad.effect === 'STRONGLY_SUPPORTS' || pd.effect === 'STRONGLY_SUPPORTS')) {
        return 'MIXED';
      }
      if (combinedScore <= -1.3 && (ad.effect === 'STRONGLY_CHALLENGES' || pd.effect === 'STRONGLY_CHALLENGES')) {
        return 'STRONGLY_CHALLENGES';
      }
      if (combinedScore <= -0.3) {
        return 'CHALLENGES';
      }
      return 'MIXED';
    }
    case 'STRONGLY_CHALLENGES': {
      // Outcome MUST be in { STRONGLY_CHALLENGES, CHALLENGES, MIXED }
      if (combinedScore <= -1.2) {
        return 'STRONGLY_CHALLENGES';
      }
      if (combinedScore <= -0.2) {
        return 'CHALLENGES';
      }
      return 'MIXED';
    }
    default:
      return 'DOES_NOT_ACTIVATE';
  }
}

export function combineCareerDashaConfidence(
  mdConf: InterpretationConfidence,
  adConf: InterpretationConfidence,
  pdConf: InterpretationConfidence
): InterpretationConfidence {
  const confToScore = (c: InterpretationConfidence): number => {
    switch (c) {
      case 'HIGH':
        return 3;
      case 'MODERATE':
        return 2;
      case 'LOW':
      default:
        return 1;
    }
  };

  const weighted = (confToScore(mdConf) * 1.0 + confToScore(adConf) * 0.6 + confToScore(pdConf) * 0.3) / 1.9;
  if (weighted >= 2.5) return 'HIGH';
  if (weighted >= 1.7) return 'MODERATE';
  return 'LOW';
}
