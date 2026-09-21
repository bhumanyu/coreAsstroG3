import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength
} from '../careerDasha';

import type {
  CareerD10Context,
  CareerD10PlanetContext,
  CareerD10HouseContext,
  CareerD10QualificationDirection,
  CareerD10QualificationEffect,
  CareerD10QualificationStrength,
  CareerD10HouseRole
} from './careerD10QualificationTypes';

import {
  classifyCareerHouse,
  CAREER_HOUSE_PORTFOLIO
} from '../careerTypes';

export function hasNatalCareerPromise(
  natalDirection: CareerStructuralDirection,
  natalStrength: CareerStructuralStrength
): boolean {
  if (natalDirection === 'UNAVAILABLE') {
    return false;
  }

  if (natalDirection === 'NEUTRAL') {
    return false;
  }

  if (natalStrength === 'UNDETERMINED') {
    return false;
  }

  return natalDirection === 'SUPPORT' || natalDirection === 'MIXED';
}

export function isD10DataAvailable(context: CareerD10Context): boolean {
  return context.d10Available &&
         context.d10Houses.length > 0 &&
         context.d10Planets.length > 0;
}

export function resolveD10PlanetDirection(
  planetContext: CareerD10PlanetContext
): CareerD10QualificationDirection {
  const { condition, d10House } = planetContext;

  if (condition === 'UNAVAILABLE') {
    return 'UNAVAILABLE';
  }

  if (condition === 'AFFLICTED') {
    return 'CHALLENGE';
  }

  if (condition === 'WEAK') {
    return 'CHALLENGE';
  }

  if (condition === 'STRONG') {
    return 'SUPPORT';
  }

  if (condition === 'MODERATE') {
    return 'NEUTRAL';
  }

  const houseRole = classifyCareerHouse(d10House, CAREER_HOUSE_PORTFOLIO);

  if (houseRole === 'PRIMARY') {
    return condition === 'STRONG' ? 'SUPPORT' : 'NEUTRAL';
  }

  if (houseRole === 'SUPPORTING') {
    return condition === 'STRONG' || condition === 'MODERATE' ? 'SUPPORT' : 'NEUTRAL';
  }

  if (houseRole === 'CHALLENGING') {
    return condition === 'WEAK' || condition === 'AFFLICTED' ? 'CHALLENGE' : 'NEUTRAL';
  }

  return 'NEUTRAL';
}

export function resolveD10Direction(
  context: CareerD10Context
): CareerD10QualificationDirection {
  if (!isD10DataAvailable(context)) {
    return 'UNAVAILABLE';
  }

  let supportCount = 0;
  let challengeCount = 0;

  for (const planet of context.d10Planets) {
    const direction = resolveD10PlanetDirection(planet);

    if (direction === 'SUPPORT') {
      supportCount++;
    } else if (direction === 'CHALLENGE') {
      challengeCount++;
    }
  }

  for (const house of context.d10Houses) {
    const houseRole = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO);

    if (houseRole === 'PRIMARY') {
      if (house.lordCondition === 'STRONG' || house.lordCondition === 'MODERATE') {
        supportCount++;
      } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
        challengeCount++;
      }
    }

    for (const tenantCondition of house.tenantConditions) {
      if (tenantCondition === 'STRONG' || tenantCondition === 'MODERATE') {
        supportCount++;
      } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
        challengeCount++;
      }
    }
  }

  if (supportCount === 0 && challengeCount === 0) {
    return 'NEUTRAL';
  }

  if (supportCount > challengeCount) {
    return 'SUPPORT';
  }

  if (challengeCount > supportCount) {
    return 'CHALLENGE';
  }

  return 'MIXED';
}

export function resolveD10Effect(
  natalDirection: CareerStructuralDirection,
  d10Direction: CareerD10QualificationDirection,
  context: CareerD10Context
): CareerD10QualificationEffect {
  if (!isD10DataAvailable(context)) {
    return 'UNAVAILABLE';
  }

  if (natalDirection === 'UNAVAILABLE') {
    return 'INSUFFICIENT_DATA';
  }

  if (d10Direction === 'UNAVAILABLE') {
    return 'UNAVAILABLE';
  }

  if (d10Direction === 'NEUTRAL') {
    return 'INSUFFICIENT_DATA';
  }

  if (natalDirection === 'SUPPORT' && d10Direction === 'SUPPORT') {
    return 'REINFORCES';
  }

  if (natalDirection === 'SUPPORT' && d10Direction === 'CHALLENGE') {
    return 'WEAKENS';
  }

  if (natalDirection === 'CHALLENGE' && d10Direction === 'SUPPORT') {
    return 'REINFORCES';
  }

  if (natalDirection === 'CHALLENGE' && d10Direction === 'CHALLENGE') {
    return 'CONFLICTS';
  }

  if (natalDirection === 'MIXED' && d10Direction === 'SUPPORT') {
    return 'REINFORCES';
  }

  if (natalDirection === 'MIXED' && d10Direction === 'CHALLENGE') {
    return 'WEAKENS';
  }

  if (natalDirection === 'NEUTRAL' && d10Direction === 'SUPPORT') {
    return 'QUALIFIES';
  }

  if (natalDirection === 'NEUTRAL' && d10Direction === 'CHALLENGE') {
    return 'CONFLICTS';
  }

  return 'INSUFFICIENT_DATA';
}

export function resolveD10Strength(
  natalStrength: CareerStructuralStrength,
  d10Direction: CareerD10QualificationDirection,
  context: CareerD10Context
): CareerD10QualificationStrength {
  if (!isD10DataAvailable(context)) {
    return 'UNDETERMINED';
  }

  if (d10Direction === 'UNAVAILABLE' || d10Direction === 'NEUTRAL') {
    return 'UNDETERMINED';
  }

  let strongCount = 0;
  let moderateCount = 0;
  let weakCount = 0;

  for (const planet of context.d10Planets) {
    if (planet.condition === 'STRONG') {
      strongCount++;
    } else if (planet.condition === 'MODERATE') {
      moderateCount++;
    } else if (planet.condition === 'WEAK' || planet.condition === 'AFFLICTED') {
      weakCount++;
    }
  }

  for (const house of context.d10Houses) {
    if (house.lordCondition === 'STRONG') {
      strongCount++;
    } else if (house.lordCondition === 'MODERATE') {
      moderateCount++;
    } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
      weakCount++;
    }

    for (const tenantCondition of house.tenantConditions) {
      if (tenantCondition === 'STRONG') {
        strongCount++;
      } else if (tenantCondition === 'MODERATE') {
        moderateCount++;
      } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
        weakCount++;
      }
    }
  }

  const total = strongCount + moderateCount + weakCount;

  if (total === 0) {
    return 'UNDETERMINED';
  }

  const strongRatio = strongCount / total;
  const weakRatio = weakCount / total;

  if (d10Direction === 'SUPPORT') {
    if (strongRatio >= 0.6) {
      return 'VERY_STRONG';
    }
    if (strongRatio >= 0.4) {
      return 'STRONG';
    }
    if (strongRatio >= 0.2) {
      return 'MODERATE';
    }
    return 'WEAK';
  }

  if (d10Direction === 'CHALLENGE') {
    if (weakRatio >= 0.6) {
      return 'VERY_WEAK';
    }
    if (weakRatio >= 0.4) {
      return 'WEAK';
    }
    if (weakRatio >= 0.2) {
      return 'MODERATE';
    }
    return 'WEAK';
  }

  if (d10Direction === 'MIXED') {
    return 'MODERATE';
  }

  return 'UNDETERMINED';
}

export function qualifyNatalCareerWithD10(
  natalDirection: CareerStructuralDirection,
  natalStrength: CareerStructuralStrength,
  d10Direction: CareerD10QualificationDirection,
  d10Strength: CareerD10QualificationStrength,
  context: CareerD10Context
): {
  qualifiedDirection: CareerD10QualificationDirection;
  qualifiedStrength: CareerD10QualificationStrength;
  natalPromisePreserved: boolean;
} {
  if (natalDirection === 'UNAVAILABLE') {
    return {
      qualifiedDirection: 'UNAVAILABLE',
      qualifiedStrength: 'UNDETERMINED',
      natalPromisePreserved: true
    };
  }

  if (!isD10DataAvailable(context)) {
    return {
      qualifiedDirection: natalDirection === 'SUPPORT' ? 'SUPPORT' :
                          natalDirection === 'CHALLENGE' ? 'CHALLENGE' :
                          natalDirection === 'MIXED' ? 'MIXED' : 'UNAVAILABLE',
      qualifiedStrength: natalStrength === 'VERY_STRONG' ? 'VERY_STRONG' :
                         natalStrength === 'STRONG' ? 'STRONG' :
                         natalStrength === 'MODERATE' ? 'MODERATE' :
                         natalStrength === 'WEAK' ? 'WEAK' :
                         natalStrength === 'VERY_WEAK' ? 'VERY_WEAK' : 'UNDETERMINED',
      natalPromisePreserved: true
    };
  }

  if (d10Direction === 'UNAVAILABLE' || d10Direction === 'NEUTRAL') {
    return {
      qualifiedDirection: natalDirection === 'SUPPORT' ? 'SUPPORT' :
                          natalDirection === 'CHALLENGE' ? 'CHALLENGE' :
                          natalDirection === 'MIXED' ? 'MIXED' : 'UNAVAILABLE',
      qualifiedStrength: natalStrength === 'VERY_STRONG' ? 'VERY_STRONG' :
                         natalStrength === 'STRONG' ? 'STRONG' :
                         natalStrength === 'MODERATE' ? 'MODERATE' :
                         natalStrength === 'WEAK' ? 'WEAK' :
                         natalStrength === 'VERY_WEAK' ? 'VERY_WEAK' : 'UNDETERMINED',
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'CHALLENGE') {
    return {
      qualifiedDirection: 'CHALLENGE',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'SUPPORT' && d10Direction === 'SUPPORT') {
    return {
      qualifiedDirection: 'SUPPORT',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'SUPPORT' && d10Direction === 'CHALLENGE') {
    return {
      qualifiedDirection: 'MIXED',
      qualifiedStrength: 'MODERATE',
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'MIXED' && d10Direction === 'SUPPORT') {
    return {
      qualifiedDirection: 'SUPPORT',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'MIXED' && d10Direction === 'CHALLENGE') {
    return {
      qualifiedDirection: 'CHALLENGE',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'NEUTRAL' && d10Direction === 'SUPPORT') {
    return {
      qualifiedDirection: 'SUPPORT',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  if (natalDirection === 'NEUTRAL' && d10Direction === 'CHALLENGE') {
    return {
      qualifiedDirection: 'CHALLENGE',
      qualifiedStrength: d10Strength,
      natalPromisePreserved: true
    };
  }

  return {
    qualifiedDirection: 'UNDETERMINED',
    qualifiedStrength: 'UNDETERMINED',
    natalPromisePreserved: true
  };
}

export function promoteCareerStrength(
  natalStrength: CareerStructuralStrength,
  d10Strength: CareerD10QualificationStrength
): CareerD10QualificationStrength {
  if (d10Strength === 'VERY_STRONG') {
    return 'VERY_STRONG';
  }

  if (d10Strength === 'STRONG') {
    if (natalStrength === 'VERY_STRONG') {
      return 'VERY_STRONG';
    }
    return 'STRONG';
  }

  if (d10Strength === 'MODERATE') {
    if (natalStrength === 'VERY_STRONG' || natalStrength === 'STRONG') {
      return 'STRONG';
    }
    return 'MODERATE';
  }

  if (d10Strength === 'WEAK') {
    if (natalStrength === 'VERY_STRONG') {
      return 'STRONG';
    }
    if (natalStrength === 'STRONG') {
      return 'MODERATE';
    }
    return 'WEAK';
  }

  if (d10Strength === 'VERY_WEAK') {
    if (natalStrength === 'VERY_STRONG' || natalStrength === 'STRONG') {
      return 'MODERATE';
    }
    return 'WEAK';
  }

  return 'UNDETERMINED';
}

export function weakenCareerStrength(
  natalStrength: CareerStructuralStrength,
  d10Strength: CareerD10QualificationStrength
): CareerD10QualificationStrength {
  if (d10Strength === 'VERY_WEAK') {
    return 'VERY_WEAK';
  }

  if (d10Strength === 'WEAK') {
    if (natalStrength === 'VERY_WEAK') {
      return 'VERY_WEAK';
    }
    return 'WEAK';
  }

  if (d10Strength === 'MODERATE') {
    if (natalStrength === 'VERY_WEAK' || natalStrength === 'WEAK') {
      return 'WEAK';
    }
    return 'MODERATE';
  }

  if (d10Strength === 'STRONG') {
    if (natalStrength === 'VERY_WEAK') {
      return 'WEAK';
    }
    if (natalStrength === 'WEAK') {
      return 'MODERATE';
    }
    return 'STRONG';
  }

  if (d10Strength === 'VERY_STRONG') {
    if (natalStrength === 'VERY_WEAK' || natalStrength === 'WEAK') {
      return 'MODERATE';
    }
    return 'STRONG';
  }

  return 'UNDETERMINED';
}
