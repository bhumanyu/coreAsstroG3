import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  classifyCareerHouse,
  type CareerHousePortfolio
} from '../careerTypes';

export const CW09_PLANETARY_WEIGHTS = Object.freeze({
  HOUSE_OWNERSHIP_PRIMARY: 2.5,
  HOUSE_OWNERSHIP_SUPPORTING: 1.5,
  HOUSE_OWNERSHIP_CHALLENGING: 0.75,

  HOUSE_PLACEMENT_PRIMARY: 2.25,
  HOUSE_PLACEMENT_SUPPORTING: 1.25,
  HOUSE_PLACEMENT_CHALLENGING: 0.75,

  YOGAKARAKA: 2.0,
  LAGNA_LORD: 1.5,
  KENDRA_LORD: 1.0,
  TRIKONA_LORD: 1.5,

  FUNCTIONAL_BENEFIC: 0.75,
  FUNCTIONAL_MALEFIC: 0.75,

  DIGNITY_STRONG: 2.0,
  DIGNITY_FRIEND: 1.0,
  DIGNITY_WEAK: 1.0,

  COMBUST: 1.5,
  DEFEATED: 1.5,

  STRENGTH_STRONG: 1.5,
  STRENGTH_WEAK: 1.5,

  CAREER_ASPECT_PRIMARY: 1.5,
  CAREER_ASPECT_SUPPORTING: 1.0,

  D10_CONFIRMATION: 1.5,
  D10_PARTIAL: 1.0,
  D10_CONFLICT: 1.5,

  KARAKA: 1.5
});

export function classifyOwnership(
  house: number,
  portfolio: CareerHousePortfolio
): {
  direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  weight: number;
} {
  const category = classifyCareerHouse(house, portfolio);

  switch (category) {
    case 'PRIMARY':
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_OWNERSHIP_PRIMARY
      };

    case 'SUPPORTING':
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_OWNERSHIP_SUPPORTING
      };

    case 'CHALLENGING':
      return {
        direction: 'CHALLENGE',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_OWNERSHIP_CHALLENGING
      };

    default:
      return {
        direction: 'NEUTRAL',
        weight: 0
      };
  }
}

export function classifyPlacement(
  house: number,
  portfolio: CareerHousePortfolio
): {
  direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  weight: number;
} {
  const category = classifyCareerHouse(house, portfolio);

  switch (category) {
    case 'PRIMARY':
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_PLACEMENT_PRIMARY
      };

    case 'SUPPORTING':
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_PLACEMENT_SUPPORTING
      };

    case 'CHALLENGING':
      return {
        direction: 'CHALLENGE',
        weight: CW09_PLANETARY_WEIGHTS.HOUSE_PLACEMENT_CHALLENGING
      };

    default:
      return {
        direction: 'NEUTRAL',
        weight: 0
      };
  }
}

export function classifyFunctionalRole(
  role: FunctionalRole
): {
  direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  weight: number;
} {
  switch (role) {
    case FunctionalRole.YOGAKARAKA:
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.YOGAKARAKA
      };

    case FunctionalRole.LAGNA_LORD:
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.LAGNA_LORD
      };

    case FunctionalRole.KENDRA_LORD:
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.KENDRA_LORD
      };

    case FunctionalRole.TRIKONA_LORD:
      return {
        direction: 'SUPPORT',
        weight: CW09_PLANETARY_WEIGHTS.TRIKONA_LORD
      };

    default:
      return {
        direction: 'NEUTRAL',
        weight: 0
      };
  }
}

export function classifyDignity(
  dignity?: string
): {
  direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  weight: number;
} {
  if (!dignity) {
    return {
      direction: 'NEUTRAL',
      weight: 0
    };
  }

  const normalized = dignity
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  if (
    normalized === 'EXALTED' ||
    normalized === 'MOOLATRIKONA' ||
    normalized === 'OWN_SIGN' ||
    normalized === 'OWN'
  ) {
    return {
      direction: 'SUPPORT',
      weight: CW09_PLANETARY_WEIGHTS.DIGNITY_STRONG
    };
  }

  if (
    normalized === 'FRIEND_SIGN' ||
    normalized === 'GREAT_FRIEND_SIGN'
  ) {
    return {
      direction: 'SUPPORT',
      weight: CW09_PLANETARY_WEIGHTS.DIGNITY_FRIEND
    };
  }

  if (
    normalized === 'DEBILITATED' ||
    normalized === 'ENEMY_SIGN' ||
    normalized === 'GREAT_ENEMY_SIGN'
  ) {
    return {
      direction: 'CHALLENGE',
      weight: CW09_PLANETARY_WEIGHTS.DIGNITY_WEAK
    };
  }

  return {
    direction: 'NEUTRAL',
    weight: 0
  };
}

export function isCareerLinked(
  activation: DashaPlanetActivation,
  portfolio: CareerHousePortfolio
): boolean {
  if (
    activation.ownedHouses.some(
      (house) =>
        portfolio.primary.includes(house) ||
        portfolio.supporting.includes(house)
    )
  ) {
    return true;
  }

  if (
    portfolio.primary.includes(activation.house) ||
    portfolio.supporting.includes(activation.house)
  ) {
    return true;
  }

  if (
    activation.castAspects.some(
      (aspect) =>
        aspect.targetHouse !== undefined &&
        (
          portfolio.primary.includes(aspect.targetHouse) ||
          portfolio.supporting.includes(aspect.targetHouse)
        )
    )
  ) {
    return true;
  }

  if (
    activation.receivedAspects.some(
      (aspect) =>
        (
          aspect.sourceHouse !== undefined &&
          (
            portfolio.primary.includes(aspect.sourceHouse) ||
            portfolio.supporting.includes(aspect.sourceHouse)
          )
        ) ||
        (
          aspect.targetHouse !== undefined &&
          (
            portfolio.primary.includes(aspect.targetHouse) ||
            portfolio.supporting.includes(aspect.targetHouse)
          )
        )
    )
  ) {
    return true;
  }

  // Functional role presence alone does NOT establish career linkage unless the role is career-relevant
  return activation.functionalRoles.includes(FunctionalRole.YOGAKARAKA);
}
