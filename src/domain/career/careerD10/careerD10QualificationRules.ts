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

  return natalDirection === 'SUPPORT' || natalDirection === 'MIXED' || natalDirection === 'CHALLENGE';
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

  const houseRole = classifyCareerHouse(d10House, CAREER_HOUSE_PORTFOLIO);

  let baseDirection: CareerD10QualificationDirection;

  if (condition === 'AFFLICTED') {
    baseDirection = 'CHALLENGE';
  } else if (condition === 'WEAK') {
    baseDirection = 'CHALLENGE';
  } else if (condition === 'STRONG') {
    baseDirection = 'SUPPORT';
  } else if (condition === 'MODERATE') {
    baseDirection = 'NEUTRAL';
  } else {
    baseDirection = 'NEUTRAL';
  }

  if (houseRole === 'PRIMARY') {
    if (baseDirection === 'SUPPORT') {
      return 'SUPPORT';
    }
    if (baseDirection === 'CHALLENGE') {
      return 'CHALLENGE';
    }
    if (condition === 'MODERATE') {
      return 'NEUTRAL';
    }
    return baseDirection;
  }

  if (houseRole === 'SUPPORTING') {
    if (baseDirection === 'SUPPORT') {
      return 'SUPPORT';
    }
    if (baseDirection === 'CHALLENGE') {
      return 'NEUTRAL';
    }
    if (condition === 'MODERATE') {
      return 'SUPPORT';
    }
    return baseDirection;
  }

  if (houseRole === 'CHALLENGING') {
    if (baseDirection === 'CHALLENGE') {
      return 'CHALLENGE';
    }
    if (baseDirection === 'SUPPORT') {
      return 'NEUTRAL';
    }
    if (condition === 'MODERATE') {
      return 'CHALLENGE';
    }
    return baseDirection;
  }

  return baseDirection;
}

export function resolveD10Direction(
  context: CareerD10Context
): CareerD10QualificationDirection {
  if (!isD10DataAvailable(context)) {
    return 'UNAVAILABLE';
  }

  // Hierarchical evaluation: PRIMARY > SECONDARY > MODIFIER
  const primaryDirection = evaluatePrimaryEvidence(context);
  if (primaryDirection !== 'NEUTRAL') {
    return primaryDirection;
  }

  const secondaryDirection = evaluateSecondaryEvidence(context);
  if (secondaryDirection !== 'NEUTRAL') {
    return secondaryDirection;
  }

  const modifierDirection = evaluateModifierEvidence(context);
  if (modifierDirection !== 'NEUTRAL') {
    return modifierDirection;
  }

  return 'NEUTRAL';
}

function evaluatePrimaryEvidence(
  context: CareerD10Context
): CareerD10QualificationDirection {
  let supportCount = 0;
  let challengeCount = 0;

  // Planets in PRIMARY houses
  for (const planet of context.d10Planets) {
    const houseRole = classifyCareerHouse(planet.d10House, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'PRIMARY') {
      const direction = resolveD10PlanetDirection(planet);
      if (direction === 'SUPPORT') {
        supportCount++;
      } else if (direction === 'CHALLENGE') {
        challengeCount++;
      }
      // NEUTRAL is not counted as either support or challenge
    }
  }

  // PRIMARY house lords and tenants
  for (const house of context.d10Houses) {
    const houseRole = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'PRIMARY') {
      if (house.lordCondition === 'STRONG') {
        supportCount++;
      } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
        challengeCount++;
      }
      // MODERATE is not counted as either support or challenge

      // Tenants in PRIMARY houses are PRIMARY evidence
      for (const tenantCondition of house.tenantConditions) {
        if (tenantCondition === 'STRONG') {
          supportCount++;
        } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
          challengeCount++;
        }
        // MODERATE is not counted as either support or challenge
      }
    }
  }

  if (supportCount > challengeCount) {
    return 'SUPPORT';
  }
  if (challengeCount > supportCount) {
    return 'CHALLENGE';
  }
  if (supportCount > 0 && challengeCount > 0) {
    return 'MIXED';
  }
  return 'NEUTRAL';
}

function evaluateSecondaryEvidence(
  context: CareerD10Context
): CareerD10QualificationDirection {
  let supportCount = 0;
  let challengeCount = 0;

  // Planets in SUPPORTING houses
  for (const planet of context.d10Planets) {
    const houseRole = classifyCareerHouse(planet.d10House, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'SUPPORTING') {
      const direction = resolveD10PlanetDirection(planet);
      if (direction === 'SUPPORT') {
        supportCount++;
      } else if (direction === 'CHALLENGE') {
        challengeCount++;
      }
      // NEUTRAL is not counted as either support or challenge
    }
  }

  // SUPPORTING house lords and tenants
  for (const house of context.d10Houses) {
    const houseRole = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'SUPPORTING') {
      if (house.lordCondition === 'STRONG') {
        supportCount++;
      } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
        challengeCount++;
      }
      // MODERATE is not counted as either support or challenge

      // Tenants in SUPPORTING houses are SECONDARY evidence
      for (const tenantCondition of house.tenantConditions) {
        if (tenantCondition === 'STRONG') {
          supportCount++;
        } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
          challengeCount++;
        }
        // MODERATE is not counted as either support or challenge
      }
    }
  }

  if (supportCount > challengeCount) {
    return 'SUPPORT';
  }
  if (challengeCount > supportCount) {
    return 'CHALLENGE';
  }
  if (supportCount > 0 && challengeCount > 0) {
    return 'MIXED';
  }
  return 'NEUTRAL';
}

function evaluateModifierEvidence(
  context: CareerD10Context
): CareerD10QualificationDirection {
  let supportCount = 0;
  let challengeCount = 0;

  // Planets in non-career houses (MODIFIER)
  for (const planet of context.d10Planets) {
    const houseRole = classifyCareerHouse(planet.d10House, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'NEUTRAL' || houseRole === 'CHALLENGING') {
      const direction = resolveD10PlanetDirection(planet);
      if (direction === 'SUPPORT') {
        supportCount++;
      } else if (direction === 'CHALLENGE') {
        challengeCount++;
      }
      // NEUTRAL is not counted as either support or challenge
    }
  }

  // Tenants in NEUTRAL or CHALLENGING houses only (MODIFIER)
  // Tenants in PRIMARY/SUPPORTING houses are already counted in their respective level evaluations
  for (const house of context.d10Houses) {
    const houseRole = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO);
    if (houseRole === 'NEUTRAL' || houseRole === 'CHALLENGING') {
      for (const tenantCondition of house.tenantConditions) {
        if (tenantCondition === 'STRONG') {
          supportCount++;
        } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
          challengeCount++;
        }
        // MODERATE is not counted as either support or challenge
      }
    }
  }

  if (supportCount > challengeCount) {
    return 'SUPPORT';
  }
  if (challengeCount > supportCount) {
    return 'CHALLENGE';
  }
  if (supportCount > 0 && challengeCount > 0) {
    return 'MIXED';
  }
  return 'NEUTRAL';
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

  let primaryStrong = 0;
  let primaryWeak = 0;
  let secondaryStrong = 0;
  let secondaryWeak = 0;
  let modifierStrong = 0;
  let modifierWeak = 0;

  for (const house of context.d10Houses) {
    const houseRole = classifyCareerHouse(house.house, CAREER_HOUSE_PORTFOLIO);

    if (houseRole === 'PRIMARY') {
      if (house.lordCondition === 'STRONG') {
        primaryStrong++;
      } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
        primaryWeak++;
      }
    } else if (houseRole === 'SUPPORTING') {
      if (house.lordCondition === 'STRONG') {
        secondaryStrong++;
      } else if (house.lordCondition === 'WEAK' || house.lordCondition === 'AFFLICTED') {
        secondaryWeak++;
      }
    }

    for (const tenantCondition of house.tenantConditions) {
      if (tenantCondition === 'STRONG') {
        modifierStrong++;
      } else if (tenantCondition === 'WEAK' || tenantCondition === 'AFFLICTED') {
        modifierWeak++;
      }
    }
  }

  for (const planet of context.d10Planets) {
    const houseRole = classifyCareerHouse(planet.d10House, CAREER_HOUSE_PORTFOLIO);

    if (houseRole === 'PRIMARY') {
      if (planet.condition === 'STRONG') {
        primaryStrong++;
      } else if (planet.condition === 'WEAK' || planet.condition === 'AFFLICTED') {
        primaryWeak++;
      }
    } else if (houseRole === 'SUPPORTING') {
      if (planet.condition === 'STRONG') {
        secondaryStrong++;
      } else if (planet.condition === 'WEAK' || planet.condition === 'AFFLICTED') {
        secondaryWeak++;
      }
    } else {
      if (planet.condition === 'STRONG') {
        modifierStrong++;
      } else if (planet.condition === 'WEAK' || planet.condition === 'AFFLICTED') {
        modifierWeak++;
      }
    }
  }

  if (d10Direction === 'SUPPORT') {
    if (primaryStrong >= 1) {
      if (primaryStrong > primaryWeak) {
        return 'VERY_STRONG';
      }
      return 'STRONG';
    }

    if (primaryWeak >= 1 && primaryStrong === 0) {
      return 'STRONG';
    }

    if (secondaryStrong >= 2) {
      return 'STRONG';
    }

    if (secondaryStrong >= 1) {
      return 'MODERATE';
    }

    if (modifierStrong >= 2) {
      return 'MODERATE';
    }

    if (modifierStrong >= 1) {
      return 'WEAK';
    }

    return 'WEAK';
  }

  if (d10Direction === 'CHALLENGE') {
    if (primaryWeak >= 1) {
      if (primaryWeak > primaryStrong) {
        return 'VERY_WEAK';
      }
      return 'WEAK';
    }

    if (primaryStrong >= 1 && primaryWeak === 0) {
      return 'WEAK';
    }

    if (secondaryWeak >= 2) {
      return 'WEAK';
    }

    if (secondaryWeak >= 1) {
      return 'MODERATE';
    }

    if (modifierWeak >= 2) {
      return 'MODERATE';
    }

    if (modifierWeak >= 1) {
      return 'WEAK';
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
