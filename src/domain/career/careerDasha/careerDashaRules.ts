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
  CareerDashaPeriod,
  CareerFactorCategory,
  CareerFactorDirection,
  CareerHousePortfolio
} from './careerDashaSynthesisTypes';
import { getCareerKarakaDefinition } from '../../../engine/themeInterpretation/rules/career/careerPlanetRules';

export const CAREER_DASHA_PERIOD_WEIGHTS = Object.freeze({
  MD: 1.0,
  AD: 0.6,
  PD: 0.3
});

export const CAREER_DASHA_PERIOD_PRIORITY: Readonly<Record<CareerDashaPeriod, number>> = Object.freeze({
  MD: 60,
  AD: 40,
  PD: 20
});

export const CAREER_DASHA_CATEGORY_PRIORITY: Readonly<Record<CareerFactorCategory, number>> = Object.freeze({
  HOUSE_OWNERSHIP: 8,
  HOUSE_PLACEMENT: 8,
  D10: 8,
  STRENGTH: 8,
  YOGA: 5,
  DIGNITY: 5,
  STATE: 5,
  KARAKA: 5,
  FUNCTIONAL_ROLE: 3,
  FUNCTIONAL_NATURE: 3,
  ASPECT: 3
});

export function getCareerDashaEvidencePriority(
  period: CareerDashaPeriod,
  category: CareerFactorCategory
): number {
  const periodBase = CAREER_DASHA_PERIOD_PRIORITY[period] ?? 20;
  const catOffset = CAREER_DASHA_CATEGORY_PRIORITY[category] ?? 0;
  return periodBase + catOffset;
}

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
    return { direction: 'SUPPORT', weight: 2.5 };
  }
  if (portfolio.supporting.includes(house)) {
    return { direction: 'SUPPORT', weight: 1.5 };
  }
  if (portfolio.challenging.includes(house)) {
    return { direction: 'CHALLENGE', weight: 0.75 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function classifyCareerHousePlacement(
  house: number,
  portfolio: CareerHousePortfolio
): { direction: CareerFactorDirection; weight: number } {
  if (portfolio.primary.includes(house)) {
    return { direction: 'SUPPORT', weight: 2.25 };
  }
  if (portfolio.supporting.includes(house)) {
    return { direction: 'SUPPORT', weight: 1.25 };
  }
  if (portfolio.challenging.includes(house)) {
    return { direction: 'CHALLENGE', weight: 0.75 };
  }
  return { direction: 'NEUTRAL', weight: 0 };
}

export function getHouseWeight(house: number, portfolio: CareerHousePortfolio): number {
  if (portfolio.primary.includes(house)) return 2.5;
  if (portfolio.supporting.includes(house)) return 1.5;
  if (portfolio.challenging.includes(house)) return 0.75;
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
      return { direction: 'SUPPORT', weight: 2.0 };
    case FunctionalRole.LAGNA_LORD:
    case FunctionalRole.KENDRA_LORD:
    case FunctionalRole.TRIKONA_LORD:
      return { direction: 'SUPPORT', weight: 1.5 };
    case FunctionalRole.SECOND_LORD:
    case FunctionalRole.ELEVENTH_LORD:
      return { direction: 'SUPPORT', weight: 1.0 };
    case FunctionalRole.THIRD_LORD:
      return { direction: 'NEUTRAL', weight: 0.25 };
    case FunctionalRole.DUSTHANA_LORD:
    case FunctionalRole.MARAKA_LORD:
    case FunctionalRole.BADHAKA_LORD: {
      const port = portfolio ?? getCareerHousePortfolio();
      const hasCareerLink =
        activation?.ownedHouses?.some((h) => port.primary.includes(h) || port.supporting.includes(h)) ||
        (activation?.house !== undefined && (port.primary.includes(activation.house) || port.supporting.includes(activation.house))) ||
        activation?.functionalRoles?.includes(FunctionalRole.YOGAKARAKA);

      if (hasCareerLink) {
        return { direction: 'NEUTRAL', weight: 0.25 };
      }
      return { direction: 'CHALLENGE', weight: 0.5 };
    }
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

export interface CareerYogaContext {
  readonly yogaType?: string;
  readonly yogaId?: string;
  readonly participatingHouses?: readonly number[];
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED' | string;
  readonly strength?: string;
  readonly relationship?: string;
}

export function isCareerRelevantYoga(
  yoga: CareerYogaContext | DashaYogaReference,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): boolean {
  const port = portfolio ?? getCareerHousePortfolio();
  const relevantHouses = new Set([...port.primary, ...port.supporting]);

  const yogaHouses = (yoga as any).participatingHouses as readonly number[] | undefined;
  if (yogaHouses && Array.isArray(yogaHouses) && yogaHouses.length > 0) {
    return yogaHouses.some((h) => relevantHouses.has(h));
  }

  if (activation) {
    const planetHouses: number[] = [];
    if (activation.house !== undefined) {
      planetHouses.push(activation.house);
    }
    if (activation.ownedHouses) {
      planetHouses.push(...activation.ownedHouses);
    }
    return planetHouses.some((h) => relevantHouses.has(h));
  }

  return false;
}

export function classifyCareerYoga(
  yoga: CareerYogaContext | DashaYogaReference,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): {
  direction: CareerFactorDirection;
  weight: number;
} {
  const status = (yoga as any).finalStatus || (yoga as any).strength;
  if (status === 'CANCELLED' || !isCareerRelevantYoga(yoga, activation, portfolio)) {
    return { direction: 'NEUTRAL', weight: 0 };
  }
  if (status === 'STRONG') {
    return { direction: 'SUPPORT', weight: 1.5 };
  }
  if (status === 'WEAKENED') {
    return { direction: 'SUPPORT', weight: 0.5 };
  }
  return { direction: 'SUPPORT', weight: 1.0 };
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
    activation.castAspects?.some((a) => a.targetHouse !== undefined && portfolio.primary.includes(a.targetHouse)) ||
    activation.receivedAspects?.some(
      (a) => (a.sourceHouse !== undefined && portfolio.primary.includes(a.sourceHouse)) || (a.targetHouse !== undefined && portfolio.primary.includes(a.targetHouse))
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

  return {
    karakaTitle: karakaInfo.title,
    traitDescription: karakaInfo.description,
    direction: 'SUPPORT',
    weight: 1.5
  };
}
