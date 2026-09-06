import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  CareerDashaEffect,
  CareerDashaFactor,
  CareerDashaPlanetSynthesis,
  DashaPlanetRelationship
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
  _combinedScore?: number,
  relationships?: readonly DashaPlanetRelationship[]
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
  let baseEffect: CareerDashaEffect;
  switch (md.effect) {
    case 'STRONGLY_SUPPORTS': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'SUPPORTS';
        } else {
          baseEffect = 'STRONGLY_SUPPORTS';
        }
      } else if (ad.effect === 'SUPPORTS') {
        if (pd.effect === 'CHALLENGES' || pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'SUPPORTS';
        } else {
          baseEffect = 'STRONGLY_SUPPORTS';
        }
      } else if (ad.effect === 'MIXED' || ad.effect === 'DOES_NOT_ACTIVATE') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'MIXED';
        } else {
          baseEffect = 'SUPPORTS';
        }
      } else {
        // ad.effect is CHALLENGES or STRONGLY_CHALLENGES
        baseEffect = 'MIXED';
      }
      break;
    }
    case 'SUPPORTS': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES' || pd.effect === 'CHALLENGES') {
          baseEffect = 'SUPPORTS';
        } else {
          baseEffect = 'STRONGLY_SUPPORTS';
        }
      } else if (ad.effect === 'SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'MIXED';
        } else {
          baseEffect = 'SUPPORTS';
        }
      } else if (ad.effect === 'MIXED' || ad.effect === 'DOES_NOT_ACTIVATE') {
        if (pd.effect === 'CHALLENGES' || pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'MIXED';
        } else {
          baseEffect = 'SUPPORTS';
        }
      } else if (ad.effect === 'CHALLENGES') {
        baseEffect = 'MIXED';
      } else if (ad.effect === 'STRONGLY_CHALLENGES') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'CHALLENGES';
        } else {
          baseEffect = 'MIXED';
        }
      } else {
        baseEffect = 'SUPPORTS';
      }
      break;
    }
    case 'MIXED': {
      if (ad.effect === 'STRONGLY_SUPPORTS' || ad.effect === 'SUPPORTS') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'MIXED';
        } else {
          baseEffect = 'SUPPORTS';
        }
      } else if (ad.effect === 'STRONGLY_CHALLENGES' || ad.effect === 'CHALLENGES') {
        if (pd.effect === 'STRONGLY_SUPPORTS') {
          baseEffect = 'MIXED';
        } else {
          baseEffect = 'CHALLENGES';
        }
      } else if (pd.effect === 'STRONGLY_SUPPORTS') {
        baseEffect = 'SUPPORTS';
      } else if (pd.effect === 'STRONGLY_CHALLENGES') {
        baseEffect = 'CHALLENGES';
      } else {
        baseEffect = 'MIXED';
      }
      break;
    }
    case 'CHALLENGES': {
      if (ad.effect === 'STRONGLY_SUPPORTS' || ad.effect === 'SUPPORTS') {
        baseEffect = 'MIXED';
      } else if (ad.effect === 'STRONGLY_CHALLENGES') {
        baseEffect = 'STRONGLY_CHALLENGES';
      } else if (ad.effect === 'CHALLENGES') {
        if (pd.effect === 'STRONGLY_CHALLENGES') {
          baseEffect = 'STRONGLY_CHALLENGES';
        } else {
          baseEffect = 'CHALLENGES';
        }
      } else if (pd.effect === 'STRONGLY_SUPPORTS') {
        baseEffect = 'MIXED';
      } else if (pd.effect === 'STRONGLY_CHALLENGES') {
        baseEffect = 'STRONGLY_CHALLENGES';
      } else {
        baseEffect = 'CHALLENGES';
      }
      break;
    }
    case 'STRONGLY_CHALLENGES': {
      if (ad.effect === 'STRONGLY_SUPPORTS') {
        baseEffect = 'MIXED';
      } else if (ad.effect === 'SUPPORTS') {
        baseEffect = 'CHALLENGES';
      } else if (ad.effect === 'CHALLENGES' || ad.effect === 'STRONGLY_CHALLENGES') {
        baseEffect = 'STRONGLY_CHALLENGES';
      } else if (pd.effect === 'STRONGLY_SUPPORTS') {
        baseEffect = 'CHALLENGES';
      } else {
        baseEffect = 'STRONGLY_CHALLENGES';
      }
      break;
    }
    default:
      baseEffect = 'DOES_NOT_ACTIVATE';
      break;
  }

  const mdAdRel = relationships?.find(
    (r) =>
      (r.sourcePeriod === 'MD' && r.targetPeriod === 'AD') ||
      (r.fromPeriod === 'MD' && r.toPeriod === 'AD')
  );

  if (!mdAdRel) {
    return baseEffect;
  }

  if (mdAdRel.careerImpact === 'CONFLICTING') {
    // A conflicting MD<->AD relationship constrains supportive effects without overturning MD dominance
    if (baseEffect === 'STRONGLY_SUPPORTS' || baseEffect === 'SUPPORTS') {
      return 'MIXED';
    }
    return baseEffect;
  }

  if (mdAdRel.careerImpact === 'SUPPORTIVE') {
    // A supportive MD<->AD relationship reinforces active career effects, especially with shared house 10
    const hasShared10 =
      mdAdRel.sharedHouses?.includes(10) ||
      mdAdRel.evidence.some((e) => e.ruleId === 'CAREER_DASHA_DUAL_10_ACTIVATION');
    if (baseEffect === 'SUPPORTS' && hasShared10 && (md.effect === 'SUPPORTS' || md.effect === 'STRONGLY_SUPPORTS')) {
      return 'STRONGLY_SUPPORTS';
    }
    return baseEffect;
  }

  return baseEffect;
}

export function combineCareerDashaConfidence(
  mdConf: InterpretationConfidence,
  adConf: InterpretationConfidence,
  pdConf: InterpretationConfidence,
  relationships?: readonly DashaPlanetRelationship[]
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

  const mdAdRel = relationships?.find(
    (r) =>
      (r.sourcePeriod === 'MD' && r.targetPeriod === 'AD') ||
      (r.fromPeriod === 'MD' && r.toPeriod === 'AD')
  );

  let weighted = (confToScore(mdConf) * 1.0 + confToScore(adConf) * 0.6 + confToScore(pdConf) * 0.3) / 1.9;
  if (mdAdRel?.careerImpact === 'CONFLICTING') {
    weighted -= 0.25;
  } else if (mdAdRel?.careerImpact === 'SUPPORTIVE' && mdAdRel.sharedHouses?.includes(10)) {
    weighted += 0.1;
  }

  if (weighted >= 2.5) return 'HIGH';
  if (weighted >= 1.7) return 'MEDIUM';
  return 'LOW';
}
