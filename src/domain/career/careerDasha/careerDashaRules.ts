import { Planet } from '../../../types';
import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES
} from '../careerTypes';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import type { PlanetStrengthInterpretation } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  DashaPlanetActivation,
  DashaYogaReference
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  CareerFactorDirection,
  CareerHousePortfolio
} from './careerDashaSynthesisTypes';
import { getCareerKarakaDefinition } from '../../../engine/themeInterpretation/rules/career/careerPlanetRules';

export const CAREER_DASHA_PERIOD_WEIGHTS = Object.freeze({
  MD: 1.0,
  AD: 0.6,
  PD: 0.3
});

export function getCareerHousePortfolio(): CareerHousePortfolio {
  return {
    primary: Object.freeze(Array.from(CAREER_PRIMARY_HOUSES)),
    supporting: Object.freeze(Array.from(CAREER_SUPPORTING_HOUSES)),
    challenging: Object.freeze(Array.from(CAREER_CHALLENGING_HOUSES)),
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
  if (portfolio.challenging.includes(house)) {
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
  if (portfolio.challenging.includes(house)) {
    return { direction: 'CHALLENGE', weight: 1.5 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function getHouseWeight(house: number, portfolio: CareerHousePortfolio): number {
  if (portfolio.primary.includes(house)) return 3.0;
  if (portfolio.supporting.includes(house)) return 1.5;
  if (portfolio.challenging.includes(house)) return 1.5;
  return 0;
}

export function classifyCareerFunctionalRole(
  role: FunctionalRole,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): {
  direction: CareerFactorDirection;
  weight: number;
} {
  switch (role) {
    case FunctionalRole.YOGAKARAKA:
      return { direction: 'SUPPORT', weight: 2.5 };
    case FunctionalRole.LAGNA_LORD:
    case FunctionalRole.KENDRA_LORD:
    case FunctionalRole.TRIKONA_LORD:
      return { direction: 'SUPPORT', weight: 1.5 };
    case FunctionalRole.SECOND_LORD:
    case FunctionalRole.ELEVENTH_LORD:
      return { direction: 'SUPPORT', weight: 1.0 };
    case FunctionalRole.THIRD_LORD:
      return { direction: 'NEUTRAL', weight: 0.5 };
    case FunctionalRole.DUSTHANA_LORD: {
      const port = portfolio ?? getCareerHousePortfolio();
      const hasCareerLink =
        activation?.ownedHouses?.some((h) => port.primary.includes(h) || port.supporting.includes(h)) ||
        (activation?.house !== undefined && (port.primary.includes(activation.house) || port.supporting.includes(activation.house))) ||
        activation?.functionalRoles?.includes(FunctionalRole.YOGAKARAKA);

      if (hasCareerLink) {
        return { direction: 'NEUTRAL', weight: 0.5 };
      }
      return { direction: 'CHALLENGE', weight: 0.75 };
    }
    case FunctionalRole.MARAKA_LORD:
    case FunctionalRole.BADHAKA_LORD:
      return { direction: 'CHALLENGE', weight: 0.75 };
    default:
      return { direction: 'NEUTRAL', weight: 0 };
  }
}

export function classifyCareerFunctionalNature(
  nature: FunctionalNature | undefined,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): {
  direction: CareerFactorDirection;
  weight: number;
} {
  if (!nature) return { direction: 'NEUTRAL', weight: 0 };
  switch (nature) {
    case FunctionalNature.BENEFIC:
      return { direction: 'SUPPORT', weight: 0.5 };
    case FunctionalNature.MALEFIC: {
      const port = portfolio ?? getCareerHousePortfolio();
      const isCareerAligned =
        activation?.functionalRoles?.includes(FunctionalRole.YOGAKARAKA) ||
        activation?.ownedHouses?.some((h) => port.primary.includes(h)) ||
        (activation?.house !== undefined && port.primary.includes(activation.house));

      if (isCareerAligned) {
        return { direction: 'NEUTRAL', weight: 0.25 };
      }
      return { direction: 'CHALLENGE', weight: 0.5 };
    }
    case FunctionalNature.MIXED:
      return { direction: 'NEUTRAL', weight: 0.25 };
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
    (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum >= 100)
  ) {
    return { direction: 'SUPPORT', weight: 1.0 };
  }
  if (
    strength.meetsMinimum === false ||
    (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum < 80)
  ) {
    return { direction: 'CHALLENGE', weight: 1.0 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function isCareerRelevantYoga(
  yoga: DashaYogaReference,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): boolean {
  const yogaUpper = (yoga.name || yoga.type || '').toUpperCase();
  const isStatusOrCareerYoga =
    yogaUpper.includes('RAJA') ||
    yogaUpper.includes('DHANA') ||
    yogaUpper.includes('MAHAPURUSHA') ||
    yogaUpper.includes('GAJA_KESARI') ||
    yogaUpper.includes('GAJAKESARI') ||
    yogaUpper.includes('RUCHAKA') ||
    yogaUpper.includes('BHADRA') ||
    yogaUpper.includes('HAMSA') ||
    yogaUpper.includes('MALAVYA') ||
    yogaUpper.includes('SHASHA') ||
    yogaUpper.includes('PARVATA') ||
    yogaUpper.includes('KAHALA') ||
    yogaUpper.includes('AMALA') ||
    yogaUpper.includes('CHAMARA') ||
    yogaUpper.includes('LAKSHMI') ||
    yogaUpper.includes('SARASWATI') ||
    yogaUpper.includes('BUDHADITYA') ||
    yogaUpper.includes('VIPARITA');

  if (isStatusOrCareerYoga) {
    return true;
  }

  if (activation) {
    const port = portfolio ?? getCareerHousePortfolio();
    const linksCareer =
      activation.ownedHouses?.some((h) => port.primary.includes(h) || port.supporting.includes(h)) ||
      (activation.house !== undefined && (port.primary.includes(activation.house) || port.supporting.includes(activation.house))) ||
      activation.castAspects?.some((a) => port.primary.includes(a.targetHouse)) ||
      activation.receivedAspects?.some((a) => port.primary.includes(a.sourceHouse) || port.primary.includes(a.targetHouse));

    if (linksCareer) {
      return true;
    }
  }

  return false;
}

export function classifyCareerYoga(
  yoga: DashaYogaReference,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): {
  direction: CareerFactorDirection;
  weight: number;
} {
  if (yoga.finalStatus === 'CANCELLED' || !isCareerRelevantYoga(yoga, activation, portfolio)) {
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
  activation: DashaPlanetActivation,
  portfolio: CareerHousePortfolio
): CareerKarakaResolution | undefined {
  const karakaInfo = getCareerKarakaDefinition(planet);
  if (!karakaInfo) {
    return undefined;
  }

  const rules10 = activation.ownedHouses?.some((h) => portfolio.primary.includes(h));
  const occupies10 = activation.house !== undefined && portfolio.primary.includes(activation.house);
  const connects10 =
    activation.castAspects?.some((a) => portfolio.primary.includes(a.targetHouse)) ||
    activation.receivedAspects?.some(
      (a) => portfolio.primary.includes(a.sourceHouse) || portfolio.primary.includes(a.targetHouse)
    );
  const yogaRelevant =
    activation.yogaParticipation &&
    activation.yogaParticipation.some(
      (y) => y.finalStatus !== 'CANCELLED' && isCareerRelevantYoga(y, activation, portfolio)
    );
  const rulesOrOccupiesSupporting =
    (activation.house !== undefined && portfolio.supporting.includes(activation.house)) ||
    activation.ownedHouses?.some((h) => portfolio.supporting.includes(h));

  const isLinked = Boolean(
    rules10 || occupies10 || connects10 || yogaRelevant || rulesOrOccupiesSupporting
  );

  if (!isLinked) {
    return undefined;
  }

  const isDebilitated =
    activation.dignity?.toUpperCase().includes('DEBILITATED') ||
    activation.dignity?.toUpperCase().includes('ENEMY');

  return {
    karakaTitle: karakaInfo.title,
    traitDescription: karakaInfo.description,
    direction: isDebilitated ? 'CHALLENGE' : 'SUPPORT',
    weight: 1.5
  };
}
