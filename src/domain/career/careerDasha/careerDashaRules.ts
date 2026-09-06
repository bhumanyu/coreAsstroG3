import { Planet, Relationship } from '../../../types';
import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES,
  getCareerHousePortfolio
} from '../careerTypes';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import type { PlanetStrengthInterpretation } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  DashaPlanetActivation,
  DashaYogaReference,
  DashaPairInterpretation
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import { calculateNaturalRelationship } from '../../../engine/chartMath';
import {
  CareerContributionCategory,
  type CareerDashaPeriod,
  type CareerFactorCategory,
  type CareerFactorDirection,
  type CareerHousePortfolio,
  type CareerRelevanceEvidence,
  type CareerRelevance,
  type CareerDashaImpact,
  type CareerDashaFactor,
  type DashaPlanetRelationship,
  type DashaRelationshipType,
  type DashaRelationshipCareerImpact
} from './careerDashaSynthesisTypes';
import { getCareerKarakaDefinition } from '../../../engine/themeInterpretation/rules/career/careerPlanetRules';
import { isCareerLinked } from './careerDashaPlanetaryRules';

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
  ASPECT: 3,
  RELATIONSHIP: 4
});

export function getCareerDashaEvidencePriority(
  period: CareerDashaPeriod,
  category: CareerFactorCategory
): number {
  const periodBase = CAREER_DASHA_PERIOD_PRIORITY[period] ?? 20;
  const catOffset = CAREER_DASHA_CATEGORY_PRIORITY[category] ?? 0;
  return periodBase + catOffset;
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

export function getCareerYogaContext(yoga: CareerYogaContext | DashaYogaReference): CareerYogaContext {
  if (!yoga || typeof yoga !== 'object') {
    return {};
  }
  const y = yoga as Record<string, unknown>;
  const yogaType =
    'yogaType' in y && typeof y.yogaType === 'string'
      ? y.yogaType
      : 'type' in y && typeof y.type === 'string'
        ? y.type
        : undefined;

  const yogaId = 'yogaId' in y && typeof y.yogaId === 'string' ? y.yogaId : undefined;

  const participatingHouses =
    'participatingHouses' in y && Array.isArray(y.participatingHouses)
      ? (y.participatingHouses as readonly number[])
      : undefined;

  const finalStatus =
    'finalStatus' in y && typeof y.finalStatus === 'string'
      ? y.finalStatus
      : undefined;

  const strength = 'strength' in y && typeof y.strength === 'string' ? y.strength : undefined;

  const relationship =
    'relationship' in y && typeof y.relationship === 'string' ? y.relationship : undefined;

  return {
    yogaType,
    yogaId,
    participatingHouses,
    finalStatus,
    strength,
    relationship
  };
}

export function isCareerRelevantYoga(
  yoga: CareerYogaContext | DashaYogaReference,
  activation?: DashaPlanetActivation,
  portfolio?: CareerHousePortfolio
): boolean {
  const ctx = getCareerYogaContext(yoga);
  const port = portfolio ?? getCareerHousePortfolio();
  const relevantHouses = new Set([...port.primary, ...port.supporting]);

  const yogaHouses = ctx.participatingHouses;
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
  const ctx = getCareerYogaContext(yoga);
  const status = ctx.finalStatus || ctx.strength;
  if (status === 'CANCELLED' || !isCareerRelevantYoga(ctx, activation, portfolio)) {
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

/**
 * Maps a house to its semantic career contribution category (spec §17).
 * Reuses existing CoreAstro placement evaluator vocabulary.
 */
export function mapHouseToContributionCategory(house: number): CareerContributionCategory {
  switch (house) {
    case 1:
      return CareerContributionCategory.AUTHORITY;
    case 2:
      return CareerContributionCategory.STABILITY;
    case 3:
      return CareerContributionCategory.COMMUNICATION;
    case 4:
      return CareerContributionCategory.INSTITUTIONAL;
    case 5:
      return CareerContributionCategory.CREATIVE_COUNSEL;
    case 6:
      return CareerContributionCategory.SERVICE;
    case 7:
      return CareerContributionCategory.PARTNERSHIP;
    case 8:
      return CareerContributionCategory.TRANSFORMATION;
    case 9:
      return CareerContributionCategory.ADVISORY;
    case 10:
      return CareerContributionCategory.CAREER_STATUS;
    case 11:
      return CareerContributionCategory.GAINS;
    case 12:
      return CareerContributionCategory.FOREIGN;
    default:
      return CareerContributionCategory.CAREER_STATUS;
  }
}

/**
 * Builds an explicit, fine-grained Career Relevance evidence model (spec §6).
 * Preserves individual evidence items for provenance and downstream explainability.
 */
export function buildCareerRelevance(
  activation: DashaPlanetActivation,
  portfolio: CareerHousePortfolio,
  d10Available: boolean = false
): CareerRelevance {
  const evidence: CareerRelevanceEvidence[] = [];
  const planet = activation.planet;

  // 1. Owns 10th house (Primary Career House)
  if (activation.ownedHouses?.includes(10) || portfolio.primary.some((h) => activation.ownedHouses?.includes(h))) {
    evidence.push({
      factor: 'OWNS_PRIMARY_CAREER_HOUSE',
      source: 'HOUSE_OWNERSHIP',
      strength: 'STRONG',
      explanationKey: 'CAREER_RELEVANCE_OWNS_10TH',
      ruleId: 'CAREER_DASHA_REL_OWNS_10',
      houses: [10],
      planets: [planet]
    });
  }

  // 2. Occupies 10th house
  if (activation.house === 10 || (activation.house !== undefined && portfolio.primary.includes(activation.house))) {
    evidence.push({
      factor: 'OCCUPIES_PRIMARY_CAREER_HOUSE',
      source: 'HOUSE_PLACEMENT',
      strength: 'STRONG',
      explanationKey: 'CAREER_RELEVANCE_OCCUPIES_10TH',
      ruleId: 'CAREER_DASHA_REL_OCCUPIES_10',
      houses: [10],
      planets: [planet]
    });
  }

  // 3. Connects via Cast Aspect to 10th house
  if (
    activation.castAspects?.some(
      (a) => a.targetHouse === 10 || (a.targetHouse !== undefined && portfolio.primary.includes(a.targetHouse))
    )
  ) {
    evidence.push({
      factor: 'ASPECTS_PRIMARY_CAREER_HOUSE',
      source: 'ASPECT',
      strength: 'STRONG',
      explanationKey: 'CAREER_RELEVANCE_ASPECT_10TH',
      ruleId: 'CAREER_DASHA_REL_ASPECT_10',
      houses: [10],
      planets: [planet]
    });
  }

  // 4. Connects via Received Aspect from 10th house
  if (
    activation.receivedAspects?.some(
      (a) => a.sourceHouse === 10 || (a.sourceHouse !== undefined && portfolio.primary.includes(a.sourceHouse))
    )
  ) {
    evidence.push({
      factor: 'RECEIVES_ASPECT_FROM_PRIMARY_CAREER_HOUSE',
      source: 'ASPECT',
      strength: 'MODERATE',
      explanationKey: 'CAREER_RELEVANCE_RECEIVED_ASPECT_10TH',
      ruleId: 'CAREER_DASHA_REL_RECEIVED_ASPECT_10',
      houses: [10],
      planets: [planet]
    });
  }

  // 5. Owns Supporting Career Houses (6th, 2nd, 11th, Lagna/1st)
  for (const h of activation.ownedHouses || []) {
    if (portfolio.supporting.includes(h) || h === 1) {
      evidence.push({
        factor: `OWNS_CAREER_SUPPORTING_HOUSE_${h}`,
        source: 'HOUSE_OWNERSHIP',
        strength: 'MODERATE',
        explanationKey: `CAREER_RELEVANCE_OWNS_HOUSE_${h}`,
        ruleId: `CAREER_DASHA_REL_OWNS_H${h}`,
        houses: [h],
        planets: [planet]
      });
    }
  }

  // 6. Occupies Supporting Career Houses (6th, 2nd, 11th, Lagna/1st)
  if (activation.house !== undefined && (portfolio.supporting.includes(activation.house) || activation.house === 1)) {
    evidence.push({
      factor: `OCCUPIES_CAREER_SUPPORTING_HOUSE_${activation.house}`,
      source: 'HOUSE_PLACEMENT',
      strength: 'MODERATE',
      explanationKey: `CAREER_RELEVANCE_OCCUPIES_HOUSE_${activation.house}`,
      ruleId: `CAREER_DASHA_REL_OCCUPIES_H${activation.house}`,
      houses: [activation.house],
      planets: [planet]
    });
  }

  // 7. Casts Aspect to Supporting Career Houses
  for (const aspect of activation.castAspects || []) {
    if (aspect.targetHouse !== undefined && portfolio.supporting.includes(aspect.targetHouse)) {
      evidence.push({
        factor: `ASPECTS_CAREER_SUPPORTING_HOUSE_${aspect.targetHouse}`,
        source: 'ASPECT',
        strength: 'MODERATE',
        explanationKey: `CAREER_RELEVANCE_ASPECT_HOUSE_${aspect.targetHouse}`,
        ruleId: `CAREER_DASHA_REL_ASPECT_H${aspect.targetHouse}`,
        houses: [aspect.targetHouse],
        planets: [planet]
      });
    }
  }

  // 8. Career Yoga Participation
  if (activation.yogaParticipation) {
    for (const yoga of activation.yogaParticipation) {
      if (yoga.finalStatus !== 'CANCELLED' && isCareerRelevantYoga(yoga, activation, portfolio)) {
        evidence.push({
          factor: `YOGA_${yoga.yogaType || 'CAREER_YOGA'}`,
          source: 'YOGA',
          strength: yoga.finalStatus === 'STRONG' ? 'STRONG' : 'MODERATE',
          explanationKey: 'CAREER_RELEVANCE_YOGA',
          ruleId: `CAREER_DASHA_REL_YOGA_${yoga.yogaType || 'CAREER_YOGA'}`,
          planets: [planet]
        });
      }
    }
  }

  const linked = isCareerLinked(activation, portfolio) || evidence.length > 0;

  // Calculate relevance score
  let score = 0;
  for (const item of evidence) {
    if (item.strength === 'STRONG') score += 2.5;
    else if (item.strength === 'MODERATE') score += 1.5;
    else score += 1.0;
  }
  score = Math.round(score * 100) / 100;

  let relevanceLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE' = 'NONE';
  if (linked && score > 0) {
    if (score >= 4.0 || evidence.some((e) => e.houses?.includes(10) && e.strength === 'STRONG')) {
      relevanceLevel = 'HIGH';
    } else if (score >= 2.0) {
      relevanceLevel = 'MODERATE';
    } else {
      relevanceLevel = 'LOW';
    }
  }

  return Object.freeze({
    careerLinked: linked,
    relevanceScore: score,
    relevanceLevel,
    evidence: Object.freeze(evidence),
    d10ReferenceAvailable: d10Available
  });
}

/**
 * Derives Career Dasha Impact by combining Planetary Strength and Career Relevance (spec §14).
 * Ensures strong-but-non-relevant planets yield negligible/low career activation,
 * and moderate-but-highly-relevant planets yield strong career activation.
 */
export function deriveCareerDashaImpact(
  relevance: CareerRelevance,
  strength?: PlanetStrengthInterpretation,
  planet: Planet = Planet.SUN
): CareerDashaImpact {
  let strengthLevel: 'STRONG' | 'MODERATE' | 'WEAK' | 'UNKNOWN' = 'UNKNOWN';

  if (strength) {
    const isStrong =
      strength.meetsMinimum === true ||
      (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum >= 100) ||
      (strength.totalRupa !== undefined && strength.totalRupa >= 6.0) ||
      (strength as any).level === 'STRONG' ||
      ((strength as any).score !== undefined && (strength as any).score >= 60);

    const isWeak =
      strength.meetsMinimum === false ||
      (strength.percentageOfMinimum !== undefined && strength.percentageOfMinimum < 80) ||
      (strength as any).level === 'WEAK' ||
      ((strength as any).score !== undefined && (strength as any).score < 40);

    if (isStrong) {
      strengthLevel = 'STRONG';
    } else if (isWeak) {
      strengthLevel = 'WEAK';
    } else {
      strengthLevel = 'MODERATE';
    }
  }

  const relLevel = relevance.relevanceLevel;
  let overallImpact: 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE' = 'NEGLIGIBLE';
  let statement = '';

  if (!relevance.careerLinked || relLevel === 'NONE') {
    overallImpact = 'NEGLIGIBLE';
    statement = `${planet} possesses ${strengthLevel === 'UNKNOWN' ? 'unassessed' : strengthLevel.toLowerCase()} strength but has no direct career relevance in this chart; professional activation does not trigger.`;
  } else if (relLevel === 'LOW') {
    overallImpact = strengthLevel === 'STRONG' ? 'LOW' : (strengthLevel === 'WEAK' ? 'NEGLIGIBLE' : 'LOW');
    statement = `${planet} has ${strengthLevel.toLowerCase()} strength with low career relevance; limited professional activation.`;
  } else if (relLevel === 'MODERATE') {
    if (strengthLevel === 'STRONG') {
      overallImpact = 'HIGH';
      statement = `${planet} combines strong planetary strength with moderate career relevance to deliver significant professional momentum.`;
    } else if (strengthLevel === 'WEAK') {
      overallImpact = 'LOW';
      statement = `${planet} has moderate career relevance but weak planetary strength, limiting execution.`;
    } else {
      overallImpact = 'MODERATE';
      statement = `${planet} has moderate career relevance and moderate strength for steady career progression.`;
    }
  } else {
    // HIGH relevance
    if (strengthLevel === 'STRONG' || strengthLevel === 'MODERATE' || strengthLevel === 'UNKNOWN') {
      overallImpact = 'HIGH';
      statement = `${planet} has high career relevance with solid strength, driving major professional developments.`;
    } else {
      overallImpact = 'MODERATE';
      statement = `${planet} possesses high career relevance but is constrained by weak planetary strength.`;
    }
  }

  return Object.freeze({
    relevanceLevel: relLevel,
    strengthLevel,
    overallImpact,
    statement
  });
}

/**
 * Models MD↔AD, MD↔PD, AD↔PD career relationships (spec §8–9).
 * Consumes DashaPairInterpretation and calculateNaturalRelationship without recomputing raw aspects.
 */
export function buildDashaPlanetRelationship(
  sourcePlanet: Planet,
  targetPlanet: Planet,
  sourcePeriod: CareerDashaPeriod,
  targetPeriod: CareerDashaPeriod,
  pairInterp?: DashaPairInterpretation
): DashaPlanetRelationship {
  const rel = calculateNaturalRelationship(sourcePlanet, targetPlanet);
  const relationshipType: DashaRelationshipType =
    rel === Relationship.FRIEND
      ? 'FRIEND'
      : rel === Relationship.ENEMY
        ? 'ENEMY'
        : 'NEUTRAL';

  let careerImpact: DashaRelationshipCareerImpact = 'NEUTRAL';
  if (relationshipType === 'FRIEND') {
    careerImpact = 'SUPPORTIVE';
  } else if (relationshipType === 'ENEMY') {
    careerImpact = 'CONFLICTING';
  } else {
    careerImpact = 'NEUTRAL';
  }

  const sharedHouses = pairInterp?.sharedHouses ?? [];
  const combinedHouseSet = pairInterp?.combinedHouseSet ?? [];

  const evidence: CareerDashaFactor[] = [
    {
      id: `CAREER_DASHA_RELATIONSHIP_${sourcePeriod}_${targetPeriod}_${sourcePlanet}_${targetPlanet}_${relationshipType}`,
      period: sourcePeriod,
      planet: sourcePlanet,
      category: 'RELATIONSHIP',
      direction: careerImpact === 'SUPPORTIVE' ? 'SUPPORT' : (careerImpact === 'CONFLICTING' ? 'CHALLENGE' : 'NEUTRAL'),
      weight: careerImpact === 'SUPPORTIVE' || careerImpact === 'CONFLICTING' ? 1.0 : 0.5,
      statement: `${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} share a natural ${relationshipType.toLowerCase()} relationship (${careerImpact.toLowerCase()} for career coordination).`,
      ruleId: `CAREER_DASHA_RELATIONSHIP_${sourcePlanet}_${targetPlanet}`,
      planets: [sourcePlanet, targetPlanet],
      houses: sharedHouses.length > 0 ? sharedHouses : undefined
    }
  ];

  const summary = `${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} have a ${relationshipType.toLowerCase()} relationship with ${careerImpact.toLowerCase()} career impact.`;

  return Object.freeze({
    sourcePlanet,
    targetPlanet,
    sourcePeriod,
    targetPeriod,
    fromPlanet: sourcePlanet,
    toPlanet: targetPlanet,
    fromPeriod: sourcePeriod,
    toPeriod: targetPeriod,
    relationshipType,
    careerImpact,
    sharedHouses: Object.freeze(sharedHouses),
    combinedHouseSet: Object.freeze(combinedHouseSet),
    evidence: Object.freeze(evidence),
    ruleId: `CAREER_DASHA_RELATIONSHIP_${sourcePlanet}_${targetPlanet}`,
    summary
  });
}

