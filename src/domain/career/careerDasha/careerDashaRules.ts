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
  CAREER_HOUSE_RULE: 8,
  D10: 8,
  STRENGTH: 8,
  DASHA_ACTIVATION: 6,
  YOGA: 5,
  DIGNITY: 5,
  STATE: 5,
  KARAKA: 5,
  RELATIONSHIP: 4,
  FUNCTIONAL_ROLE: 3,
  FUNCTIONAL_NATURE: 3,
  ASPECT: 3,
  RECEIVED_ASPECT: 3
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
      const ownsPrimary = activation?.ownedHouses?.some((h) => port.primary.includes(h));
      const occupiesPrimary = activation?.house !== undefined && port.primary.includes(activation.house);
      const isYogakaraka = activation?.functionalRoles?.includes(FunctionalRole.YOGAKARAKA);

      // P1 #5: Subordinate functional-role authority.
      // Direct primary career-house linkage (ownership or placement in house 10) or Yogakaraka status
      // takes strict precedence over secondary functional dusthana/maraka/badhaka lordships.
      // Modifiers are subordinated to a minor neutral qualification (weight: 0.25) so direct career-house
      // linkage evidence (weight 2.25 - 2.5) strictly overpowers secondary functional roles.
      if (ownsPrimary || occupiesPrimary || isYogakaraka) {
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
        activation?.ownedHouses?.some((h) => port.primary.includes(h));

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

export interface ContributionCategoryContext {
  readonly planet?: Planet;
  readonly functionalRoles?: readonly FunctionalRole[];
  readonly functionalNature?: FunctionalNature;
  readonly relevanceLevel?: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  readonly strengthLevel?: 'STRONG' | 'MODERATE' | 'AVERAGE' | 'WEAK' | 'UNKNOWN';
}

/**
 * Returns candidate semantic career contribution categories for a house,
 * refined by contextual planetary and role significations (spec §17, P2 #9).
 */
export function getCandidateContributionCategories(
  house: number,
  context?: ContributionCategoryContext
): readonly CareerContributionCategory[] {
  switch (house) {
    case 1:
      return Object.freeze([
        CareerContributionCategory.AUTHORITY,
        CareerContributionCategory.LEADERSHIP
      ]);
    case 2:
      // House 2 can map to VOCAL/COMMUNICATION if driven by Mercury or 3rd lord, or STABILITY/GAINS for Jupiter/2nd lord
      if (
        context?.planet === Planet.MERCURY ||
        context?.functionalRoles?.includes(FunctionalRole.THIRD_LORD)
      ) {
        return Object.freeze([
          CareerContributionCategory.COMMUNICATION,
          CareerContributionCategory.STABILITY,
          CareerContributionCategory.GAINS
        ]);
      }
      return Object.freeze([
        CareerContributionCategory.STABILITY,
        CareerContributionCategory.GAINS,
        CareerContributionCategory.COMMUNICATION
      ]);
    case 3:
      return Object.freeze([
        CareerContributionCategory.COMMUNICATION,
        CareerContributionCategory.SKILL
      ]);
    case 4:
      return Object.freeze([
        CareerContributionCategory.INSTITUTIONAL,
        CareerContributionCategory.STABILITY
      ]);
    case 5:
      return Object.freeze([
        CareerContributionCategory.CREATIVE_COUNSEL,
        CareerContributionCategory.ADVISORY
      ]);
    case 6:
      return Object.freeze([
        CareerContributionCategory.SERVICE,
        CareerContributionCategory.SKILL
      ]);
    case 7:
      return Object.freeze([
        CareerContributionCategory.PARTNERSHIP,
        CareerContributionCategory.NETWORK
      ]);
    case 8:
      return Object.freeze([
        CareerContributionCategory.TRANSFORMATION,
        CareerContributionCategory.RESEARCH
      ]);
    case 9:
      return Object.freeze([
        CareerContributionCategory.ADVISORY,
        CareerContributionCategory.LEADERSHIP
      ]);
    case 10:
      if (context?.planet === Planet.SUN) {
        return Object.freeze([
          CareerContributionCategory.LEADERSHIP,
          CareerContributionCategory.CAREER_STATUS,
          CareerContributionCategory.AUTHORITY
        ]);
      }
      return Object.freeze([
        CareerContributionCategory.CAREER_STATUS,
        CareerContributionCategory.LEADERSHIP,
        CareerContributionCategory.AUTHORITY
      ]);
    case 11:
      return Object.freeze([
        CareerContributionCategory.GAINS,
        CareerContributionCategory.NETWORK
      ]);
    case 12:
      return Object.freeze([
        CareerContributionCategory.FOREIGN,
        CareerContributionCategory.TRANSITION
      ]);
    default:
      return Object.freeze([CareerContributionCategory.CAREER_STATUS]);
  }
}

/**
 * Maps a house to its semantic career contribution category (spec §17).
 * Reuses existing CoreAstro placement evaluator vocabulary.
 * Fully backward compatible: without context, returns the primary static category.
 */
export function mapHouseToContributionCategory(
  house: number,
  context?: ContributionCategoryContext
): CareerContributionCategory {
  const candidates = getCandidateContributionCategories(house, context);
  return candidates[0] ?? CareerContributionCategory.CAREER_STATUS;
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

  // 5. Owns Supporting Career Houses (6th, 2nd, 11th)
  for (const h of activation.ownedHouses || []) {
    if (portfolio.supporting.includes(h)) {
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

  // 6. Occupies Supporting Career Houses (6th, 2nd, 11th)
  if (activation.house !== undefined && portfolio.supporting.includes(activation.house)) {
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

  // 7b. Receives Aspect from Supporting Career Houses
  for (const aspect of activation.receivedAspects || []) {
    const src = aspect.sourceHouse;
    const tgt = aspect.targetHouse;
    const supportingHouse =
      src !== undefined && portfolio.supporting.includes(src)
        ? src
        : tgt !== undefined && portfolio.supporting.includes(tgt)
          ? tgt
          : undefined;

    if (supportingHouse !== undefined) {
      evidence.push({
        factor: `RECEIVES_ASPECT_FROM_CAREER_SUPPORTING_HOUSE_${supportingHouse}`,
        source: 'ASPECT',
        strength: 'WEAK',
        explanationKey: `CAREER_RELEVANCE_RECEIVED_ASPECT_H${supportingHouse}`,
        ruleId: `CAREER_DASHA_REL_RECEIVED_ASPECT_H${supportingHouse}`,
        houses: [supportingHouse],
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

  // P1 #2: Authoritative single linkage definition.
  // isCareerLinked is the sole predicate that determines linkage;
  // careerLinked === false implies no positive relevance evidence, and vice versa.
  const linked = isCareerLinked(activation, portfolio);

  // Calculate relevance score
  let score = 0;
  if (linked) {
    for (const item of evidence) {
      if (item.strength === 'STRONG') score += 2.5;
      else if (item.strength === 'MODERATE') score += 1.5;
      else score += 1.0;
    }
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
    evidence: Object.freeze(linked ? evidence : []),
    d10ReferenceAvailable: d10Available
  });
}

/**
 * Authoritative planetary strength level classifier (spec §14, P1 #6).
 * Centralizes Shadbala threshold classification across CW-09 so thresholds
 * are never reinterpreted in multiple places.
 */
export function classifyPlanetStrengthLevel(
  strength?: PlanetStrengthInterpretation
): 'STRONG' | 'MODERATE' | 'AVERAGE' | 'WEAK' | 'UNKNOWN' {
  if (!strength || strength.availability === 'UNAVAILABLE') {
    return 'UNKNOWN';
  }

  const rawLevel = (strength as any).level;
  if (rawLevel === 'STRONG') return 'STRONG';
  if (rawLevel === 'MODERATE') return 'MODERATE';
  if (rawLevel === 'AVERAGE') return 'AVERAGE';
  if (rawLevel === 'WEAK') return 'WEAK';

  const score = (strength as any).score;
  if (typeof score === 'number') {
    if (score >= 60) return 'STRONG';
    if (score < 40) return 'WEAK';
    return 'AVERAGE';
  }

  const meetsMin = strength.meetsMinimum;
  const pct = strength.percentageOfMinimum;
  const rupa = strength.totalRupa;

  if (meetsMin === false || (pct !== undefined && pct < 80)) {
    return 'WEAK';
  }

  if (
    (pct !== undefined && pct >= 100) ||
    (rupa !== undefined && rupa >= 6.0) ||
    meetsMin === true
  ) {
    return 'STRONG';
  }

  if (pct !== undefined && pct >= 80) {
    return 'MODERATE';
  }

  return 'UNKNOWN';
}

/**
 * Derives Career Dasha Impact by combining Planetary Strength and Career Relevance (spec §14, P1 #6, P2 #11).
 * Ensures strong-but-non-relevant planets yield negligible/low career activation,
 * and moderate-but-highly-relevant planets yield strong career activation.
 */
export function deriveCareerDashaImpact(
  relevance: CareerRelevance,
  strength?: PlanetStrengthInterpretation,
  planet: Planet = Planet.SUN
): CareerDashaImpact {
  const strengthLevel = classifyPlanetStrengthLevel(strength);
  const relLevel = relevance.relevanceLevel;
  let overallImpact: 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE' = 'NEGLIGIBLE';
  let statement = '';

  if (!relevance.careerLinked || relLevel === 'NONE') {
    overallImpact = 'NEGLIGIBLE';
    statement = `${planet} demonstrates ${strengthLevel === 'UNKNOWN' ? 'unassessed' : strengthLevel.toLowerCase()} capacity with no career linkage; professional activation does not trigger.`;
  } else if (relLevel === 'LOW') {
    overallImpact = strengthLevel === 'STRONG' ? 'LOW' : (strengthLevel === 'WEAK' ? 'NEGLIGIBLE' : 'LOW');
    statement = `${planet} demonstrates ${strengthLevel.toLowerCase()} strength with low career relevance; baseline career activation is limited.`;
  } else if (relLevel === 'MODERATE') {
    if (strengthLevel === 'STRONG') {
      overallImpact = 'HIGH';
      statement = `${planet} combines strong planetary capacity with moderate career relevance, providing supportive professional capacity.`;
    } else if (strengthLevel === 'WEAK') {
      overallImpact = 'LOW';
      statement = `${planet} shows moderate career relevance but weak planetary strength, constraining execution.`;
    } else {
      overallImpact = 'MODERATE';
      statement = `${planet} shows moderate career relevance and ${strengthLevel.toLowerCase()} strength for steady professional progression.`;
    }
  } else {
    // HIGH relevance
    if (strengthLevel === 'STRONG') {
      overallImpact = 'HIGH';
      statement = `${planet} combines strong planetary capacity with high career relevance, providing structured professional support.`;
    } else if (strengthLevel === 'MODERATE') {
      overallImpact = relevance.relevanceScore >= 4.5 ? 'HIGH' : 'MODERATE';
      statement = `${planet} combines moderate planetary capacity with high career relevance, supporting consistent professional engagement.`;
    } else if (strengthLevel === 'AVERAGE') {
      // P2 #11: AVERAGE strength does NOT produce HIGH impact without exceptional relevance evidence (score >= 5.0)
      const exceptionalRelevance = relevance.relevanceScore >= 5.0;
      overallImpact = exceptionalRelevance ? 'HIGH' : 'MODERATE';
      statement = exceptionalRelevance
        ? `${planet} possesses exceptional career relevance that elevates average planetary capacity to high professional impact.`
        : `${planet} demonstrates average planetary capacity with high career relevance, providing moderate professional baseline support.`;
    } else if (strengthLevel === 'UNKNOWN') {
      // P2 #11: UNKNOWN strength produces MODERATE, not HIGH
      overallImpact = 'MODERATE';
      statement = `${planet} demonstrates unassessed planetary capacity with high career relevance; professional impact is estimated as moderate.`;
    } else {
      // WEAK
      overallImpact = 'MODERATE';
      statement = `${planet} possesses high career relevance but execution is constrained to moderate impact by weak planetary capacity.`;
    }
  }

  return Object.freeze({
    relevanceLevel: relLevel,
    strengthLevel,
    overallImpact,
    statement
  });
}

export interface DashaPlanetRelationshipContext {
  readonly pairInterp?: DashaPairInterpretation;
  readonly sourceSynthesis?: {
    readonly activatedCareerHouses?: readonly number[];
    readonly careerLinked?: boolean;
    readonly relevance?: CareerRelevance;
    readonly impact?: CareerDashaImpact;
    readonly effect?: string;
  };
  readonly targetSynthesis?: {
    readonly activatedCareerHouses?: readonly number[];
    readonly careerLinked?: boolean;
    readonly relevance?: CareerRelevance;
    readonly impact?: CareerDashaImpact;
    readonly effect?: string;
  };
  readonly sourceActivation?: DashaPlanetActivation;
  readonly targetActivation?: DashaPlanetActivation;
  readonly portfolio?: CareerHousePortfolio;
}

/**
 * Models MD↔AD, MD↔PD, AD↔PD career relationships (spec §8–9, P1 #4).
 * Combines:
 * (a) natural relationship via calculateNaturalRelationship,
 * (b) career-house overlap (house 10 and supporting houses),
 * (c) career relevance of each planet, and
 * (d) functional interaction (e.g. natural friend who is a functional malefic in a challenging house produces qualified support, not pure support).
 */
export function buildDashaPlanetRelationship(
  sourcePlanet: Planet,
  targetPlanet: Planet,
  sourcePeriod: CareerDashaPeriod,
  targetPeriod: CareerDashaPeriod,
  pairInterpOrContext?: DashaPairInterpretation | DashaPlanetRelationshipContext
): DashaPlanetRelationship {
  const pairInterp: DashaPairInterpretation | undefined =
    pairInterpOrContext && 'sharedHouses' in pairInterpOrContext
      ? (pairInterpOrContext as DashaPairInterpretation)
      : (pairInterpOrContext as DashaPlanetRelationshipContext)?.pairInterp;

  const context: DashaPlanetRelationshipContext | undefined =
    pairInterpOrContext && !('sharedHouses' in pairInterpOrContext)
      ? (pairInterpOrContext as DashaPlanetRelationshipContext)
      : undefined;

  const portfolio = context?.portfolio ?? getCareerHousePortfolio();

  // (a) Natural relationship
  const rel = calculateNaturalRelationship(sourcePlanet, targetPlanet);
  const relationshipType: DashaRelationshipType =
    rel === Relationship.FRIEND
      ? 'FRIEND'
      : rel === Relationship.ENEMY
        ? 'ENEMY'
        : 'NEUTRAL';

  // (b) Career-house overlap
  const sourceHouses: readonly number[] =
    context?.sourceSynthesis?.activatedCareerHouses ??
    (context?.sourceActivation
      ? [
          ...(context.sourceActivation.ownedHouses || []),
          ...(context.sourceActivation.house !== undefined ? [context.sourceActivation.house] : [])
        ].filter((h) => portfolio.primary.includes(h) || portfolio.supporting.includes(h))
      : []);

  const targetHouses: readonly number[] =
    context?.targetSynthesis?.activatedCareerHouses ??
    (context?.targetActivation
      ? [
          ...(context.targetActivation.ownedHouses || []),
          ...(context.targetActivation.house !== undefined ? [context.targetActivation.house] : [])
        ].filter((h) => portfolio.primary.includes(h) || portfolio.supporting.includes(h))
      : []);

  const careerHouseOverlap = Object.freeze(
    Array.from(new Set(sourceHouses.filter((h) => targetHouses.includes(h)))).sort((a, b) => a - b)
  );

  const bothActivate10 = sourceHouses.includes(10) && targetHouses.includes(10);
  const one10OneSupporting =
    (sourceHouses.includes(10) && targetHouses.some((h) => portfolio.supporting.includes(h))) ||
    (targetHouses.includes(10) && sourceHouses.some((h) => portfolio.supporting.includes(h)));

  // (c) Career relevance of each planet
  const sourceLinked =
    context?.sourceSynthesis?.careerLinked ??
    (context?.sourceActivation ? isCareerLinked(context.sourceActivation, portfolio) : true);
  const targetLinked =
    context?.targetSynthesis?.careerLinked ??
    (context?.targetActivation ? isCareerLinked(context.targetActivation, portfolio) : true);

  const bothLinked = sourceLinked && targetLinked;
  const neitherLinked = !sourceLinked && !targetLinked;

  // (d) Functional interaction
  const sourceIsFunctionalMalefic =
    context?.sourceActivation?.functionalNature === FunctionalNature.MALEFIC ||
    context?.sourceActivation?.functionalRoles?.includes(FunctionalRole.DUSTHANA_LORD);
  const targetIsFunctionalMalefic =
    context?.targetActivation?.functionalNature === FunctionalNature.MALEFIC ||
    context?.targetActivation?.functionalRoles?.includes(FunctionalRole.DUSTHANA_LORD);
  const sourceInDusthana =
    context?.sourceActivation?.house !== undefined && [6, 8, 12].includes(context.sourceActivation.house);
  const targetInDusthana =
    context?.targetActivation?.house !== undefined && [6, 8, 12].includes(context.targetActivation.house);

  const hasChallengingFunctionalTaint =
    (sourceIsFunctionalMalefic && sourceInDusthana) ||
    (targetIsFunctionalMalefic && targetInDusthana);

  let careerImpact: DashaRelationshipCareerImpact = 'NEUTRAL';
  let functionalInteraction = '';

  if (neitherLinked) {
    careerImpact = 'NEUTRAL';
    functionalInteraction = 'Neither period lord establishes direct career linkage.';
  } else if (relationshipType === 'FRIEND') {
    if (hasChallengingFunctionalTaint) {
      careerImpact = 'MIXED';
      functionalInteraction = 'Natural friendship is tempered by functional malefic lordship in a dusthana house, yielding qualified support.';
    } else if (bothActivate10 || one10OneSupporting || bothLinked) {
      careerImpact = 'SUPPORTIVE';
      functionalInteraction = 'Natural friendship reinforces mutual career-house activation.';
    } else {
      careerImpact = 'SUPPORTIVE';
      functionalInteraction = 'Natural friendship provides harmonious coordination.';
    }
  } else if (relationshipType === 'ENEMY') {
    if (bothActivate10) {
      careerImpact = 'MIXED';
      functionalInteraction = 'Natural enmity creates friction, but mutual activation of house 10 forces career engagement.';
    } else {
      careerImpact = 'CONFLICTING';
      functionalInteraction = 'Natural enmity creates conflicting directional pull between periods.';
    }
  } else {
    // NEUTRAL natural relationship
    if (bothActivate10 || one10OneSupporting) {
      careerImpact = 'SUPPORTIVE';
      functionalInteraction = 'Neutral natural disposition coordinated by shared career-house focus.';
    } else if (hasChallengingFunctionalTaint) {
      careerImpact = 'CONFLICTING';
      functionalInteraction = 'Neutral disposition compromised by challenging functional dusthana placements.';
    } else {
      careerImpact = 'NEUTRAL';
      functionalInteraction = 'Independent operation without major career conflict or synergy.';
    }
  }

  const sharedHouses = pairInterp?.sharedHouses ?? careerHouseOverlap;
  const combinedHouseSet =
    pairInterp?.combinedHouseSet ??
    Array.from(new Set([...sourceHouses, ...targetHouses])).sort((a, b) => a - b);

  const evidence: CareerDashaFactor[] = [
    {
      id: `CAREER_DASHA_RELATIONSHIP_${sourcePeriod}_${targetPeriod}_${sourcePlanet}_${targetPlanet}_${relationshipType}`,
      period: sourcePeriod,
      planet: sourcePlanet,
      category: 'RELATIONSHIP',
      direction: careerImpact === 'SUPPORTIVE' ? 'SUPPORT' : (careerImpact === 'CONFLICTING' ? 'CHALLENGE' : 'NEUTRAL'),
      weight: careerImpact === 'SUPPORTIVE' || careerImpact === 'CONFLICTING' ? 1.0 : 0.5,
      statement: `${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} share a natural ${relationshipType.toLowerCase()} relationship (${careerImpact.toLowerCase()} for career coordination). ${functionalInteraction}`.trim(),
      ruleId: `CAREER_DASHA_RELATIONSHIP_${sourcePlanet}_${targetPlanet}`,
      planets: [sourcePlanet, targetPlanet],
      houses: sharedHouses.length > 0 ? sharedHouses : undefined
    }
  ];

  if (bothActivate10) {
    evidence.push({
      id: `CAREER_DASHA_OVERLAP_10_${sourcePeriod}_${targetPeriod}_${sourcePlanet}_${targetPlanet}`,
      period: sourcePeriod,
      planet: sourcePlanet,
      category: 'CAREER_HOUSE_RULE',
      direction: 'SUPPORT',
      weight: 1.0,
      statement: `Both ${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} directly activate primary career house 10.`,
      ruleId: 'CAREER_DASHA_DUAL_10_ACTIVATION',
      planets: [sourcePlanet, targetPlanet],
      houses: [10]
    });
  } else if (one10OneSupporting) {
    evidence.push({
      id: `CAREER_DASHA_OVERLAP_SUPPORT_${sourcePeriod}_${targetPeriod}_${sourcePlanet}_${targetPlanet}`,
      period: sourcePeriod,
      planet: sourcePlanet,
      category: 'CAREER_HOUSE_RULE',
      direction: 'SUPPORT',
      weight: 0.75,
      statement: `${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} coordinate house 10 with supporting career houses.`,
      ruleId: 'CAREER_DASHA_PRIMARY_SUPPORTING_COORDINATION',
      planets: [sourcePlanet, targetPlanet]
    });
  }

  const relevanceSummary = bothLinked
    ? 'Both period lords possess career linkage.'
    : !sourceLinked && !targetLinked
      ? 'Neither period lord is career-linked.'
      : `${sourceLinked ? sourcePlanet : targetPlanet} is career-linked while ${sourceLinked ? targetPlanet : sourcePlanet} operates without primary career linkage.`;

  const summary = `${sourcePeriod} Lord ${sourcePlanet} and ${targetPeriod} Lord ${targetPlanet} have a ${relationshipType.toLowerCase()} relationship with ${careerImpact.toLowerCase()} career impact. ${functionalInteraction}`.trim();

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
    careerHouseOverlap,
    relevanceSummary,
    functionalInteraction,
    evidence: Object.freeze(evidence),
    ruleId: `CAREER_DASHA_RELATIONSHIP_${sourcePlanet}_${targetPlanet}`,
    summary
  });
}

