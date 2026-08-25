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
  // D10 chart-level confirmation alone without planetary career connection cannot manufacture activation
  const nonD10Factors = factors.filter((f) => f.category !== 'D10' && f.direction !== 'NEUTRAL');
  if (nonD10Factors.length === 0) {
    return 'DOES_NOT_ACTIVATE';
  }
  const supportRatio = support / total;
  const challengeRatio = challenge / total;
  if (supportRatio >= 0.75) {
    return 'STRONGLY_SUPPORTS';
  }
  if (supportRatio >= 0.6) {
    return 'SUPPORTS';
  }
  if (challengeRatio >= 0.75) {
    return 'STRONGLY_CHALLENGES';
  }
  if (challengeRatio >= 0.6) {
    return 'CHALLENGES';
  }
  return 'MIXED';
}

export function resolveCombinedCareerDashaEffect(
  md: CareerDashaPlanetSynthesis,
  ad: CareerDashaPlanetSynthesis,
  pd: CareerDashaPlanetSynthesis,
  _combinedScore?: number
): CareerDashaEffect {
  if (
    md.effect === 'INSUFFICIENT_DATA' ||
    (ad.effect === 'INSUFFICIENT_DATA' && pd.effect === 'INSUFFICIENT_DATA' && md.effect === 'DOES_NOT_ACTIVATE')
  ) {
    return 'INSUFFICIENT_DATA';
  }

  // ISSUE 8: MD DOES_NOT_ACTIVATE cannot yield full SUPPORTS/CHALLENGES
  if (md.effect === 'DOES_NOT_ACTIVATE') {
    if (ad.effect === 'DOES_NOT_ACTIVATE' && pd.effect === 'DOES_NOT_ACTIVATE') {
      return 'DOES_NOT_ACTIVATE';
    }
    // Sub-period activation without MD base is partial/sub-period (MIXED)
    return 'MIXED';
  }

  // ISSUE 9: Structural hierarchy (MD base -> AD allowed transitions -> PD refinement)
  switch (md.effect) {
    case 'STRONGLY_SUPPORTS': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'SUPPORTS';
        }
        return 'STRONGLY_SUPPORTS';
      }
      if (ad.effect === 'SUPPORTS') {
        if (pd.effect === 'CHALLENGES' || pd.effect === 'STRONGLY_CHALLENGES') {
          return 'SUPPORTS';
        }
        return 'STRONGLY_SUPPORTS';
      }
      if (ad.effect === 'MIXED' || ad.effect === 'DOES_NOT_ACTIVATE') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'MIXED';
        }
        return 'SUPPORTS';
      }
      // ad.effect is CHALLENGES or STRONGLY_CHALLENGES
      return 'MIXED';
    }
    case 'SUPPORTS': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES' || pd.effect === 'CHALLENGES') {
          return 'SUPPORTS';
        }
        return 'STRONGLY_SUPPORTS';
      }
      if (ad.effect === 'SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'MIXED';
        }
        return 'SUPPORTS';
      }
      if (ad.effect === 'MIXED' || ad.effect === 'DOES_NOT_ACTIVATE') {
        if (pd.effect === 'CHALLENGES' || pd.effect === 'STRONGLY_CHALLENGES') {
          return 'MIXED';
        }
        return 'SUPPORTS';
      }
      if (ad.effect === 'CHALLENGES') {
        return 'MIXED';
      }
      if (ad.effect === 'STRONGLY_CHALLENGES') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'CHALLENGES';
        }
        return 'MIXED';
      }
      return 'SUPPORTS';
    }
    case 'MIXED': {
      if (ad.effect === 'STRONGLY_SUPPORTS' || ad.effect === 'SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'MIXED';
        }
        return 'SUPPORTS';
      }
      if (ad.effect === 'STRONGLY_CHALLENGES' || ad.effect === 'CHALLENGES') {
        if (pd.effect === 'STRONGLY_SUPPORTS') {
          return 'MIXED';
        }
        return 'CHALLENGES';
      }
      if (pd.effect === 'STRONGLY_SUPPORTS') {
        return 'SUPPORTS';
      }
      if (pd.effect === 'STRONGLY_CHALLENGES') {
        return 'CHALLENGES';
      }
      return 'MIXED';
    }
    case 'CHALLENGES': {
      if (ad.effect === 'STRONGLY_SUPPORTS' || ad.effect === 'SUPPORTS') {
        return 'MIXED';
      }
      if (ad.effect === 'STRONGLY_CHALLENGES') {
        return 'STRONGLY_CHALLENGES';
      }
      if (ad.effect === 'CHALLENGES') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          return 'STRONGLY_CHALLENGES';
        }
        return 'CHALLENGES';
      }
      if (pd.effect === 'STRONGLY_SUPPORTS') {
        return 'MIXED';
      }
      if (pd.effect === 'STRONGLY_CHALLENGES') {
        return 'STRONGLY_CHALLENGES';
      }
      return 'CHALLENGES';
    }
    case 'STRONGLY_CHALLENGES': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        return 'MIXED';
      }
      if (ad.effect === 'SUPPORTS') {
        return 'CHALLENGES';
      }
      if (ad.effect === 'CHALLENGES' || ad.effect === 'STRONGLY_CHALLENGES') {
        return 'STRONGLY_CHALLENGES';
      }
      if (pd.effect === 'STRONGLY_SUPPORTS') {
        return 'CHALLENGES';
      }
      return 'STRONGLY_CHALLENGES';
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
      case 'MEDIUM':
        return 2;
      case 'LOW':
      default:
        return 1;
    }
  };

  const weighted = (confToScore(mdConf) * 1.0 + confToScore(adConf) * 0.6 + confToScore(pdConf) * 0.3) / 1.9;
  if (weighted >= 2.5) return 'HIGH';
  if (weighted >= 1.7) return 'MEDIUM';
  return 'LOW';
}
