import type { Planet } from '../../../types';
import { CAREER_PRIMARY_HOUSES, CAREER_SUPPORTING_HOUSES } from '../careerTypes';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import type { PlanetStrengthInterpretation } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type { DashaPlanetActivation, DashaYogaReference } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  CareerFactorDirection,
  CareerHousePortfolio
} from './careerDashaSynthesisTypes';

export const CAREER_DASHA_PERIOD_WEIGHTS = Object.freeze({
  MD: 1.0,
  AD: 0.6,
  PD: 0.3
});

export function getCareerHousePortfolio(): CareerHousePortfolio {
  return {
    primary: Object.freeze(Array.from(CAREER_PRIMARY_HOUSES)),
    supporting: Object.freeze(Array.from(CAREER_SUPPORTING_HOUSES)),
    secondary: Object.freeze([])
  };
}

export function classifyCareerHouseOwnership(
  house: number,
  portfolio: CareerHousePortfolio
): { direction: CareerFactorDirection; weight: number } {
  if (portfolio.primary.includes(house)) {
    return { direction: 'SUPPORT', weight: 3.0 };
  }
  if (portfolio.supporting.includes(house)) {
    return { direction: 'SUPPORT', weight: 1.5 };
  }
  if (house === 8 || house === 12) {
    return { direction: 'CHALLENGE', weight: 1.5 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function classifyCareerHousePlacement(
  house: number,
  portfolio: CareerHousePortfolio
): { direction: CareerFactorDirection; weight: number } {
  if (portfolio.primary.includes(house)) {
    return { direction: 'SUPPORT', weight: 3.0 };
  }
  if (portfolio.supporting.includes(house)) {
    return { direction: 'SUPPORT', weight: 1.5 };
  }
  if (house === 8 || house === 12) {
    return { direction: 'CHALLENGE', weight: 1.5 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function getHouseWeight(house: number, portfolio: CareerHousePortfolio): number {
  if (portfolio.primary.includes(house)) return 3.0;
  if (portfolio.supporting.includes(house)) return 1.5;
  if (house === 8 || house === 12) return 1.5;
  return 0;
}

export function classifyCareerFunctionalRole(role: FunctionalRole): {
  direction: CareerFactorDirection;
  weight: number;
} {
  switch (role) {
    case FunctionalRole.LAGNA_LORD:
    case FunctionalRole.KENDRA_LORD:
    case FunctionalRole.TRIKONA_LORD:
      return { direction: 'SUPPORT', weight: 2.0 };
    case FunctionalRole.YOGAKARAKA:
      return { direction: 'SUPPORT', weight: 3.0 };
    case FunctionalRole.SECOND_LORD:
    case FunctionalRole.ELEVENTH_LORD:
      return { direction: 'SUPPORT', weight: 1.5 };
    case FunctionalRole.THIRD_LORD:
      return { direction: 'NEUTRAL', weight: 0.5 };
    case FunctionalRole.DUSTHANA_LORD:
      return { direction: 'CHALLENGE', weight: 2.0 };
    case FunctionalRole.MARAKA_LORD:
    case FunctionalRole.BADHAKA_LORD:
      return { direction: 'CHALLENGE', weight: 1.5 };
    default:
      return { direction: 'NEUTRAL', weight: 0 };
  }
}

export function classifyCareerFunctionalNature(nature: FunctionalNature | undefined): {
  direction: CareerFactorDirection;
  weight: number;
} {
  if (!nature) return { direction: 'NEUTRAL', weight: 0 };
  switch (nature) {
    case FunctionalNature.BENEFIC:
      return { direction: 'SUPPORT', weight: 1.5 };
    case FunctionalNature.MALEFIC:
      return { direction: 'CHALLENGE', weight: 1.5 };
    case FunctionalNature.MIXED:
      return { direction: 'NEUTRAL', weight: 0.5 };
    case FunctionalNature.NEUTRAL:
    default:
      return { direction: 'NEUTRAL', weight: 0 };
  }
}

export function classifyPlanetStrengthDirection(strength?: PlanetStrengthInterpretation): {
  direction: CareerFactorDirection;
  weight: number;
} {
  if (!strength || strength.availability !== 'AVAILABLE') {
    return { direction: 'NEUTRAL', weight: 0 };
  }
  if (
    strength.meetsMinimum === true ||
    (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum >= 100) ||
    strength.shadbalaStatus === 'STRONG' ||
    strength.shadbalaStatus === 'SUFFICIENT'
  ) {
    return { direction: 'SUPPORT', weight: 1.0 };
  }
  if (
    strength.meetsMinimum === false ||
    (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum < 80) ||
    strength.shadbalaStatus === 'WEAK' ||
    strength.shadbalaStatus === 'VERY_WEAK'
  ) {
    return { direction: 'CHALLENGE', weight: 1.0 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function classifyCareerYoga(yoga: DashaYogaReference): {
  direction: CareerFactorDirection;
  weight: number;
} {
  if (yoga.finalStatus === 'CANCELLED') {
    return { direction: 'NEUTRAL', weight: 0 };
  }
  if (yoga.finalStatus === 'WEAKENED') {
    return { direction: 'SUPPORT', weight: 0.75 };
  }
  if (yoga.finalStatus === 'STRONG') {
    return { direction: 'SUPPORT', weight: 2.5 };
  }
  if (yoga.finalStatus === 'PRESENT') {
    return { direction: 'SUPPORT', weight: 2.0 };
  }
  return { direction: 'SUPPORT', weight: 1.5 };
}

export interface CareerKarakaResolution {
  readonly karakaTitle: string;
  readonly traitDescription: string;
  readonly direction: CareerFactorDirection;
  readonly weight: number;
}

export function resolveCareerKarakaRelevance(
  planet: Planet,
  activation: DashaPlanetActivation
): CareerKarakaResolution | undefined {
  const karakaMap: Partial<Record<Planet, { title: string; desc: string }>> = {
    Sun: {
      title: 'Karaka for Public Status & Authority',
      desc: 'Sun governs public visibility, managerial authority, executive dignity, and government standing.'
    },
    Saturn: {
      title: 'Karaka for Karma & Professional Endurance',
      desc: 'Saturn governs career discipline, long-term perseverance, institutional structures, and labor duties.'
    },
    Mercury: {
      title: 'Karaka for Commerce & Analytical Intellect',
      desc: 'Mercury governs commercial transactions, analytical reasoning, communication skills, and trade skills.'
    },
    Mars: {
      title: 'Karaka for Executive Drive & Technical Initiative',
      desc: 'Mars provides executive energy, decisive initiative, courage in leadership, and technical problem solving.'
    },
    Jupiter: {
      title: 'Karaka for Executive Wisdom & Guidance',
      desc: 'Jupiter provides ethical expansion, high-level counsel, administrative wisdom, and organizational guidance.'
    }
  };

  const karakaInfo = karakaMap[planet];
  if (!karakaInfo) {
    return undefined;
  }

  // Check linkage to 10H/10L or career supporting houses (6, 11, 2)
  const rules10 = activation.ownedHouses?.includes(10);
  const occupies10 = activation.house === 10;
  const connects10 =
    activation.castAspects?.some((a) => a.targetHouse === 10) ||
    activation.receivedAspects?.some((a) => a.sourceHouse === 10 || a.targetHouse === 10);
  const yogaRelevant =
    activation.yogaParticipation && activation.yogaParticipation.some((y) => y.finalStatus !== 'CANCELLED');
  const rulesOrOccupiesCareerHouses =
    (activation.house !== undefined && [6, 11, 2].includes(activation.house)) ||
    activation.ownedHouses?.some((h) => [6, 11, 2].includes(h));

  const isLinked = Boolean(rules10 || occupies10 || connects10 || yogaRelevant || rulesOrOccupiesCareerHouses);

  if (!isLinked) {
    return undefined;
  }

  // If linked, check dignity
  const isDebilitated =
    activation.dignity?.toUpperCase().includes('DEBILITATED') ||
    activation.dignity?.toUpperCase().includes('ENEMY');

  return {
    karakaTitle: karakaInfo.title,
    traitDescription: karakaInfo.desc,
    direction: isDebilitated ? 'CHALLENGE' : 'SUPPORT',
    weight: 1.5
  };
}
