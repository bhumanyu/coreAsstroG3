/**
 * CW-09 Career Dasha Planetary Synthesis.
 *
 * ARCHITECTURAL DESIGN NOTE / INTEGRATION STATUS:
 * - Authoritative Target: This module (`synthesizeCareerDashaPlanetary`) defines the
 *   authoritative CW-09 model with strict separation between career linkage gating
 *   and directional score modulation (e.g. functional roles/nature only modulate scores
 *   when career linkage is established via house ownership, placement, or aspects).
 * - Production Integration Plan: The legacy synthesis path (`synthesizeCareerDashaPlanet` in
 *   `careerDashaSynthesis.ts`) is currently retained in production to avoid silent breaking
 *   changes across existing consumers. As part of the planned convergence milestone,
 *   production callers will transition to `synthesizeCareerDashaPlanetary`, or legacy
 *   callers will adopt the explicit linkage gate. Until full convergence, note that
 *   the legacy path computes effect directly from score totals without the strict CW-09
 *   linkage gate.
 */

import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import type {
  CareerDashaPlanetaryEvidence,
  CareerDashaPlanetaryEffect,
  CareerDashaPlanetaryInput,
  CareerDashaPlanetarySynthesis
} from './careerDashaPlanetaryTypes';
import {
  classifyDignity,
  classifyFunctionalRole,
  classifyOwnership,
  classifyPlacement,
  CW09_PLANETARY_WEIGHTS
} from './careerDashaPlanetaryRules';
import {
  buildCareerRelevance,
  classifyPlanetStrengthLevel,
  deriveCareerDashaImpact,
  mapHouseToContributionCategory
} from './careerDashaRules';

const CATEGORY_ORDER: Readonly<Record<CareerDashaPlanetaryEvidence['source'], number>> = Object.freeze({
  DASHA_ACTIVATION: 1,
  CAREER_HOUSE_RULE: 2,
  FUNCTIONAL_ROLE: 3,
  PLANETARY_DIGNITY: 5,
  PLANETARY_STATE: 6,
  PLANETARY_STRENGTH: 7,
  NATAL_ASPECT: 8,
  NATAL_YOGA: 9,
  CAREER_KARAKA: 10,
  D10_PLANET: 11,
  D10_COMPARISON: 12
});

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeIdPart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_');
}

function resolveEffect(
  supportScore: number,
  challengeScore: number,
  factors: readonly CareerDashaPlanetaryEvidence[],
  careerLinked: boolean
): CareerDashaPlanetaryEffect {
  if (!careerLinked) {
    return 'DOES_NOT_ACTIVATE';
  }

  if (factors.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const total = supportScore + challengeScore;

  if (total <= 0) {
    return 'INSUFFICIENT_DATA';
  }

  const supportRatio = supportScore / total;
  const challengeRatio = challengeScore / total;

  if (supportRatio >= 0.75) {
    return 'STRONGLY_SUPPORTS';
  }

  if (supportRatio >= 0.60) {
    return 'SUPPORTS';
  }

  if (challengeRatio >= 0.75) {
    return 'STRONGLY_CHALLENGES';
  }

  if (challengeRatio >= 0.60) {
    return 'CHALLENGES';
  }

  return 'MIXED';
}

function resolveConfidence(
  explicitConfidence: CareerDashaPlanetaryInput['confidence'],
  careerLinked: boolean,
  directionalFactorCount: number
): InterpretationConfidence {
  if (explicitConfidence) {
    return explicitConfidence;
  }

  if (!careerLinked) {
    return 'LOW';
  }

  if (directionalFactorCount >= 5) {
    return 'MEDIUM';
  }

  return 'LOW';
}

export function synthesizeCareerDashaPlanetary(
  input: CareerDashaPlanetaryInput
): CareerDashaPlanetarySynthesis {
  const {
    period,
    activation,
    housePortfolio,
    d10,
    confidence,
    start,
    end
  } = input;

  const planet = activation.planet;

  // P1 #2: Single authoritative linkage.
  // Set careerLinked directly from relevance.careerLinked.
  const relevance = buildCareerRelevance(
    activation,
    housePortfolio,
    d10?.available
  );
  const careerLinked = relevance.careerLinked;

  const impact = deriveCareerDashaImpact(
    relevance,
    activation.strength,
    planet
  );

  const factors: CareerDashaPlanetaryEvidence[] = [];

  const addFactor = (
    source: CareerDashaPlanetaryEvidence['source'],
    suffix: string,
    direction: CareerDashaPlanetaryEvidence['direction'],
    weight: number,
    statement: string,
    options: {
      category?: CareerDashaPlanetaryEvidence['category'];
      houses?: readonly number[];
      planets?: readonly typeof planet[];
      ruleId?: string;
    } = {}
  ): void => {
    if (weight <= 0) {
      return;
    }

    const firstHouse = options.houses?.[0];
    const contributionCategory = firstHouse ? mapHouseToContributionCategory(firstHouse) : undefined;
    const evidenceDirection =
      direction === 'SUPPORT' ? 'SUPPORTING' : direction === 'CHALLENGE' ? 'CHALLENGING' : 'NEUTRAL';
    const periodRole =
      period === 'MD'
        ? 'PRIMARY'
        : period === 'AD'
          ? 'MODIFIER'
          : 'REFINEMENT';
    const qualification =
      direction === 'CHALLENGE' ? 'QUALIFYING' : 'NONE';
    const role = periodRole;

    factors.push({
      id: [
        'CW09',
        period,
        normalizeIdPart(planet),
        normalizeIdPart(source),
        normalizeIdPart(suffix)
      ].join('_'),
      period,
      planet,
      source,
      category: options.category,
      direction,
      weight,
      statement,
      role,
      periodRole,
      qualification,
      evidenceDirection,
      ...(contributionCategory ? { contributionCategory } : {}),
      ...(options.houses ? { houses: options.houses } : {}),
      ...(options.planets ? { planets: options.planets } : {}),
      ...(options.ruleId ? { ruleId: options.ruleId } : {})
    });
  };

  /*
   * 1. HOUSE OWNERSHIP
   */
  for (const house of activation.ownedHouses || []) {
    const result = classifyOwnership(house, housePortfolio);

    if (result.direction !== 'NEUTRAL') {
      addFactor(
        'CAREER_HOUSE_RULE',
        `OWN_${house}`,
        result.direction,
        result.weight,
        `${planet} owns career-relevant house ${house}.`,
        {
          category: 'HOUSE_OWNERSHIP',
          houses: [house],
          ruleId: `CW09_HOUSE_OWNERSHIP_${house}`
        }
      );
    }
  }

  /*
   * 2. HOUSE PLACEMENT
   */
  const placementResult = classifyPlacement(
    activation.house,
    housePortfolio
  );

  if (placementResult.direction !== 'NEUTRAL') {
    addFactor(
      'CAREER_HOUSE_RULE',
      `PLACEMENT_${activation.house}`,
      placementResult.direction,
      placementResult.weight,
      `${planet} is placed in career-relevant house ${activation.house}.`,
      {
        category: 'HOUSE_PLACEMENT',
        houses: [activation.house],
        ruleId: `CW09_HOUSE_PLACEMENT_${activation.house}`
      }
    );
  }

  /*
   * 3. FUNCTIONAL ROLE
   *
   * Gated on career linkage: functional role modulates direction for a career-linked planet,
   * but never establishes participation or score weight for a non-linked planet.
   */
  if (careerLinked) {
    for (const role of activation.functionalRoles || []) {
      const result = classifyFunctionalRole(role);

      if (result.direction !== 'NEUTRAL') {
        addFactor(
          'FUNCTIONAL_ROLE',
          String(role),
          result.direction,
          result.weight,
          `${planet} has functional role ${String(role)}.`,
          {
            category: 'FUNCTIONAL_ROLE',
            ruleId: `CW09_FUNCTIONAL_ROLE_${String(role)}`
          }
        );
      }
    }
  }

  /*
   * 4. FUNCTIONAL NATURE
   *
   * Gated on career linkage: functional nature modulates direction for a career-linked planet,
   * but never establishes participation or score weight for a non-linked planet.
   */
  if (careerLinked && activation.functionalNature) {
    const nature = activation.functionalNature;

    if (nature === FunctionalNature.BENEFIC) {
      addFactor(
        'FUNCTIONAL_ROLE',
        'BENEFIC',
        'SUPPORT',
        CW09_PLANETARY_WEIGHTS.FUNCTIONAL_BENEFIC,
        `${planet} has functional benefic nature.`,
        {
          category: 'FUNCTIONAL_NATURE',
          ruleId: 'CW09_FUNCTIONAL_NATURE_BENEFIC'
        }
      );
    } else if (nature === FunctionalNature.MALEFIC) {
      addFactor(
        'FUNCTIONAL_ROLE',
        'MALEFIC',
        'CHALLENGE',
        CW09_PLANETARY_WEIGHTS.FUNCTIONAL_MALEFIC,
        `${planet} has functional malefic nature.`,
        {
          category: 'FUNCTIONAL_NATURE',
          ruleId: 'CW09_FUNCTIONAL_NATURE_MALEFIC'
        }
      );
    }
  }

  /*
   * 5. DIGNITY
   */
  const dignityResult = classifyDignity(activation.dignity);

  if (dignityResult.direction !== 'NEUTRAL') {
    addFactor(
      'PLANETARY_DIGNITY',
      activation.dignity ?? 'UNKNOWN',
      dignityResult.direction,
      dignityResult.weight,
      `${planet} has ${activation.dignity} dignity.`,
      {
        category: 'DIGNITY',
        ruleId: `CW09_DIGNITY_${normalizeIdPart(
          activation.dignity ?? 'UNKNOWN'
        )}`
      }
    );
  }

  /*
   * 6. STATE
   */
  const state =
    typeof activation.state === 'string'
      ? activation.state
      : activation.state?.condition;

  if (state) {
    const normalized = String(state)
      .trim()
      .toUpperCase();

    if (
      normalized.includes('COMBUST') ||
      normalized.includes('DEFEAT')
    ) {
      addFactor(
        'PLANETARY_STATE',
        normalizeIdPart(normalized),
        'CHALLENGE',
        CW09_PLANETARY_WEIGHTS.COMBUST,
        `${planet} is in ${state} state.`,
        {
          category: 'STATE',
          ruleId: `CW09_STATE_${normalizeIdPart(normalized)}`
        }
      );
    }
  }

  /*
   * 7. STRENGTH (P1 #6: Centralized strength classification)
   */
  if (activation.strength) {
    const strengthLevel = classifyPlanetStrengthLevel(activation.strength);

    if (strengthLevel === 'STRONG') {
      addFactor(
        'PLANETARY_STRENGTH',
        'STRONG',
        'SUPPORT',
        CW09_PLANETARY_WEIGHTS.STRENGTH_STRONG,
        `${planet} has strong planetary strength.`,
        {
          category: 'STRENGTH',
          ruleId: 'CW09_STRENGTH_STRONG'
        }
      );
    } else if (strengthLevel === 'WEAK') {
      addFactor(
        'PLANETARY_STRENGTH',
        'WEAK',
        'CHALLENGE',
        CW09_PLANETARY_WEIGHTS.STRENGTH_WEAK,
        `${planet} has weak planetary strength.`,
        {
          category: 'STRENGTH',
          ruleId: 'CW09_STRENGTH_WEAK'
        }
      );
    }
  }

  /*
   * 8. CAST ASPECTS
   */
  for (const aspect of activation.castAspects || []) {
    const targetHouse = aspect.targetHouse;

    if (targetHouse === undefined) {
      continue;
    }

    if (housePortfolio.primary.includes(targetHouse)) {
      addFactor(
        'NATAL_ASPECT',
        `CAST_HOUSE_${targetHouse}`,
        'SUPPORT',
        CW09_PLANETARY_WEIGHTS.CAREER_ASPECT_PRIMARY,
        `${planet} casts an aspect to career primary house ${targetHouse}.`,
        {
          category: 'ASPECT',
          houses: [targetHouse],
          ruleId: `CW09_ASPECT_CAST_H${targetHouse}`
        }
      );
    } else if (housePortfolio.supporting.includes(targetHouse)) {
      addFactor(
        'NATAL_ASPECT',
        `CAST_HOUSE_${targetHouse}`,
        'SUPPORT',
        CW09_PLANETARY_WEIGHTS.CAREER_ASPECT_SUPPORTING,
        `${planet} casts an aspect to career supporting house ${targetHouse}.`,
        {
          category: 'ASPECT',
          houses: [targetHouse],
          ruleId: `CW09_ASPECT_CAST_H${targetHouse}`
        }
      );
    }
  }

  /*
   * 9. RECEIVED ASPECTS
   *
   * A received aspect does not automatically become a support.
   * It is retained as neutral unless a dedicated career rule establishes
   * directional meaning.
   */
  for (const aspect of activation.receivedAspects || []) {
    if (aspect.sourceHouse !== undefined) {
      const sourceHouse = aspect.sourceHouse;

      if (
        housePortfolio.primary.includes(sourceHouse) ||
        housePortfolio.supporting.includes(sourceHouse)
      ) {
        addFactor(
          'NATAL_ASPECT',
          `RECEIVED_HOUSE_${sourceHouse}`,
          'NEUTRAL',
          0.1,
          `${planet} receives an aspect connected with career house ${sourceHouse}.`,
          {
            category: 'RECEIVED_ASPECT',
            houses: [sourceHouse],
            ruleId: `CW09_ASPECT_RECEIVED_H${sourceHouse}`
          }
        );
      }
    }
  }

  /*
   * 10. YOGA
   *
   * Note: DashaYogaReference does not include participatingHouses.
   * Yoga factors are attached when the planet itself is career-linked and the yoga is active.
   */
  for (const yoga of activation.yogaParticipation || []) {
    if (yoga.finalStatus === 'CANCELLED') {
      continue;
    }

    if (!careerLinked) {
      continue;
    }

    const weight =
      yoga.finalStatus === 'STRONG'
        ? 1.5
        : yoga.finalStatus === 'WEAKENED'
          ? 0.5
          : 1.0;

    addFactor(
      'NATAL_YOGA',
      yoga.yogaType,
      'SUPPORT',
      weight,
      `${planet} participates in career-relevant ${yoga.yogaType}.`,
      {
        category: 'YOGA',
        ruleId: `CW09_YOGA_${normalizeIdPart(yoga.yogaType)}`
      }
    );
  }

  /*
   * 11. D10 PLANETARY CONFIRMATION
   */
  if (d10 && (d10.available || (d10.available === undefined && d10.relationship !== 'UNAVAILABLE'))) {
    switch (d10.relationship) {
      case 'CONFIRMS':
        addFactor(
          'D10_PLANET',
          'CONFIRMS',
          'SUPPORT',
          CW09_PLANETARY_WEIGHTS.D10_CONFIRMATION,
          (d10 as any).statement ?? `D10 confirms the career role of ${planet}.`,
          {
            category: 'D10',
            planets: [planet],
            ruleId: 'CW09_D10_PLANET_CONFIRMS'
          }
        );
        break;

      case 'PARTIALLY_CONFIRMS':
        addFactor(
          'D10_PLANET',
          'PARTIAL',
          'SUPPORT',
          CW09_PLANETARY_WEIGHTS.D10_PARTIAL,
          (d10 as any).statement ?? `D10 partially confirms the career role of ${planet}.`,
          {
            category: 'D10',
            planets: [planet],
            ruleId: 'CW09_D10_PLANET_PARTIAL'
          }
        );
        break;

      case 'CONFLICTS':
        addFactor(
          'D10_PLANET',
          'CONFLICTS',
          'CHALLENGE',
          CW09_PLANETARY_WEIGHTS.D10_CONFLICT,
          (d10 as any).statement ?? `D10 conflicts with the career role of ${planet}.`,
          {
            category: 'D10',
            planets: [planet],
            ruleId: 'CW09_D10_PLANET_CONFLICTS'
          }
        );
        break;

      default:
        break;
    }
  }

  // Canonical category ordering sort
  factors.sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.source] ?? 99;
    const orderB = CATEGORY_ORDER[b.source] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id.localeCompare(b.id);
  });

  const supportingFactors = factors.filter((factor) => factor.direction === 'SUPPORT');
  const challengingFactors = factors.filter((factor) => factor.direction === 'CHALLENGE');
  const neutralFactors = factors.filter((factor) => factor.direction === 'NEUTRAL');

  const supportScore = roundScore(
    supportingFactors.reduce((sum, factor) => sum + factor.weight, 0)
  );

  const challengeScore = roundScore(
    challengingFactors.reduce((sum, factor) => sum + factor.weight, 0)
  );

  const netScore = roundScore(
    supportScore - challengeScore
  );

  const effect = resolveEffect(
    supportScore,
    challengeScore,
    factors,
    careerLinked
  );

  const directionalFactorCount = supportingFactors.length + challengingFactors.length;

  const resolvedConfidence = resolveConfidence(
    confidence,
    careerLinked,
    directionalFactorCount
  );

  const activatedCareerHouses = Object.freeze(
    Array.from(
      new Set(
        [
          ...(activation.ownedHouses || []),
          activation.house
        ].filter(
          (house) =>
            housePortfolio.primary.includes(house) ||
            housePortfolio.supporting.includes(house)
        )
      )
    ).sort((a, b) => a - b)
  );

  const supportingEvidenceIds = Object.freeze(
    supportingFactors.map((factor) => factor.id)
  );

  const challengingEvidenceIds = Object.freeze(
    challengingFactors.map((factor) => factor.id)
  );

  const neutralEvidenceIds = Object.freeze(
    neutralFactors.map((factor) => factor.id)
  );

  const d10Effect =
    d10?.relationship === 'CONFIRMS' ||
    d10?.relationship === 'PARTIALLY_CONFIRMS'
      ? 'SUPPORTS'
      : d10?.relationship === 'CONFLICTS'
        ? 'CHALLENGES'
        : 'NEUTRAL';

  const summary =
    `${period} ${planet} planetary career synthesis: ` +
    `${effect.toLowerCase().replace(/_/g, ' ')} ` +
    `(${supportScore.toFixed(2)} support vs ` +
    `${challengeScore.toFixed(2)} challenge).`;

  return Object.freeze({
    period,
    planet,
    effect,
    confidence: resolvedConfidence,
    supportScore,
    challengeScore,
    netScore,
    careerLinked,
    relevance,
    impact,
    activatedCareerHouses,
    factors: Object.freeze(factors),
    supportingEvidenceIds,
    challengingEvidenceIds,
    neutralEvidenceIds,
    qualifyingEvidenceIds: challengingEvidenceIds,
    supportingFactorIds: supportingEvidenceIds,
    challengingFactorIds: challengingEvidenceIds,
    neutralFactorIds: neutralEvidenceIds,
    d10Effect,
    summary,
    ...(start ? { start } : {}),
    ...(end ? { end } : {})
  });
}

