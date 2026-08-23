import type { DashaInterpretation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  CareerDashaFactor,
  CareerDashaPeriod,
  CareerDashaPeriodSynthesis,
  CareerDashaPlanetInput,
  CareerDashaPlanetSynthesis,
  CareerDashaSynthesis,
  CareerFactorCategory,
  CareerFactorDirection,
  CareerHousePortfolio,
  D10CareerContext
} from './careerDashaSynthesisTypes';
import {
  classifyCareerFunctionalNature,
  classifyCareerFunctionalRole,
  classifyCareerHouseOwnership,
  classifyCareerHousePlacement,
  classifyCareerYoga,
  classifyPlanetStrengthDirection,
  getCareerHousePortfolio,
  resolveCareerKarakaRelevance
} from './careerDashaRules';
import {
  calculateFactorScore,
  combineCareerDashaConfidence,
  effectScore,
  resolveCareerDashaEffect,
  resolveCombinedCareerDashaEffect
} from './careerDashaScoring';

export function synthesizeCareerDashaPlanet(
  input: CareerDashaPlanetInput
): CareerDashaPlanetSynthesis {
  const { period, activation, housePortfolio, d10 } = input;
  const planet = activation.planet;
  const factors: CareerDashaFactor[] = [];

  const addFactor = (
    category: CareerFactorCategory,
    suffix: string,
    direction: CareerFactorDirection,
    weight: number,
    statement: string,
    houses?: readonly number[],
    meta?: Record<string, unknown>
  ) => {
    factors.push({
      id: `CAREER_DASHA_${period}_${planet.toUpperCase()}_${category}_${suffix}`,
      category,
      direction,
      weight,
      statement,
      ...(houses ? { houses } : {}),
      ...(meta ? { meta } : {})
    });
  };

  // 1. House Ownership
  for (const house of activation.ownedHouses || []) {
    const cls = classifyCareerHouseOwnership(house, housePortfolio);
    if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
      addFactor(
        'HOUSE_OWNERSHIP',
        String(house),
        cls.direction,
        cls.weight,
        `${planet} owns house ${house} (${cls.direction.toLowerCase()} for career).`,
        [house]
      );
    }
  }

  // 2. House Placement
  if (activation.house !== undefined) {
    const house = activation.house;
    const cls = classifyCareerHousePlacement(house, housePortfolio);
    if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
      addFactor(
        'HOUSE_PLACEMENT',
        String(house),
        cls.direction,
        cls.weight,
        `${planet} is placed in house ${house} (${cls.direction.toLowerCase()} for career).`,
        [house]
      );
    }
  }

  // 3. Functional Role
  for (const role of activation.functionalRoles || []) {
    const cls = classifyCareerFunctionalRole(role);
    if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
      addFactor(
        'FUNCTIONAL_ROLE',
        role,
        cls.direction,
        cls.weight,
        `${planet} acts as ${role.replace(/_/g, ' ')} (${cls.direction.toLowerCase()}).`
      );
    }
  }

  // 4. Functional Nature
  if (activation.functionalNature) {
    const cls = classifyCareerFunctionalNature(activation.functionalNature);
    if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
      addFactor(
        'FUNCTIONAL_NATURE',
        activation.functionalNature,
        cls.direction,
        cls.weight,
        `${planet} operates as a functional ${activation.functionalNature.toLowerCase()} graha.`
      );
    }
  }

  // 5. Dignity
  const digRaw = typeof activation.dignity === 'string' ? activation.dignity : (activation.dignity as any)?.status;
  if (digRaw && typeof digRaw === 'string') {
    const digUpper = digRaw.toUpperCase();
    let direction: CareerFactorDirection = 'NEUTRAL';
    let weight = 0;
    if (
      digUpper.includes('EXALTED') ||
      digUpper.includes('MOOLATRIKONA') ||
      digUpper.includes('OWN')
    ) {
      direction = 'SUPPORT';
      weight = 2.0;
    } else if (digUpper.includes('FRIEND')) {
      direction = 'SUPPORT';
      weight = 1.0;
    } else if (digUpper.includes('DEBILITATED')) {
      direction = 'CHALLENGE';
      weight = 2.0;
    } else if (digUpper.includes('ENEMY')) {
      direction = 'CHALLENGE';
      weight = 1.0;
    }

    if (direction !== 'NEUTRAL' || weight > 0) {
      addFactor(
        'DIGNITY',
        digUpper.replace(/\s+/g, '_'),
        direction,
        weight,
        `${planet} holds ${digRaw} dignity (${direction.toLowerCase()}).`
      );
    }
  }

  // 6. State
  const stRaw = typeof activation.state === 'string' ? activation.state : (activation.state as any)?.state;
  if (stRaw && typeof stRaw === 'string') {
    const stUpper = stRaw.toUpperCase();
    let direction: CareerFactorDirection = 'NEUTRAL';
    let weight = 0;
    if (stUpper.includes('COMBUST') || stUpper.includes('DEFEAT')) {
      direction = 'CHALLENGE';
      weight = 1.5;
    } else if (stUpper.includes('VICTORY') || stUpper.includes('EXALTED')) {
      direction = 'SUPPORT';
      weight = 1.5;
    } else if (stUpper.includes('RETROGRADE')) {
      direction = 'NEUTRAL';
      weight = 0.5;
    }

    if (direction !== 'NEUTRAL' || weight > 0) {
      addFactor(
        'STATE',
        stUpper.replace(/\s+/g, '_'),
        direction,
        weight,
        `${planet} is in ${stRaw} state (${direction.toLowerCase()}).`
      );
    }
  }

  // 7. Strength
  if (activation.strength) {
    const cls = classifyPlanetStrengthDirection(activation.strength);
    if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
      addFactor(
        'STRENGTH',
        'SHADBALA',
        cls.direction,
        cls.weight,
        `${planet} shadbala strength is ${activation.strength.shadbalaStatus || 'evaluated'} (${cls.direction.toLowerCase()}).`
      );
    }
  }

  // 8. Aspects
  if (activation.castAspects) {
    for (let i = 0; i < activation.castAspects.length; i++) {
      const asp = activation.castAspects[i];
      if (
        housePortfolio.primary.includes(asp.targetHouse) ||
        housePortfolio.supporting.includes(asp.targetHouse)
      ) {
        const isPrimary = housePortfolio.primary.includes(asp.targetHouse);
        addFactor(
          'ASPECT',
          `CAST_${asp.targetHouse}`,
          'SUPPORT',
          isPrimary ? 1.5 : 1.0,
          `${planet} casts aspect on house ${asp.targetHouse}.`,
          [asp.targetHouse]
        );
      }
    }
  }

  // 9. Yoga
  if (activation.yogaParticipation) {
    for (const yoga of activation.yogaParticipation) {
      const cls = classifyCareerYoga(yoga);
      if (cls.direction !== 'NEUTRAL' || cls.weight > 0) {
        addFactor(
          'YOGA',
          yoga.yogaType || 'YOGA',
          cls.direction,
          cls.weight,
          `${planet} participates in yoga ${yoga.yogaType} (${cls.direction.toLowerCase()}).`
        );
      }
    }
  }

  // 10. Karaka
  const karaka = resolveCareerKarakaRelevance(planet, activation);
  if (karaka) {
    addFactor(
      'KARAKA',
      'ROLE',
      karaka.direction,
      karaka.weight,
      `${planet} acts as ${karaka.karakaTitle}: ${karaka.traitDescription}`
    );
  }

  // 11. D10 Confirmation
  if (d10 && d10.relationship) {
    let direction: CareerFactorDirection = 'NEUTRAL';
    let weight = 0;
    if (d10.relationship === 'CONFIRMS' || d10.relationship === 'PARTIALLY_CONFIRMS') {
      direction = 'SUPPORT';
      weight = d10.relationship === 'CONFIRMS' ? 1.5 : 1.0;
    } else if (d10.relationship === 'CONFLICTS') {
      direction = 'CHALLENGE';
      weight = 1.5;
    }

    if (direction !== 'NEUTRAL' || weight > 0) {
      addFactor(
        'D10',
        d10.relationship,
        direction,
        weight,
        `D10 divisional chart ${d10.relationship.toLowerCase().replace(/_/g, ' ')} (${direction.toLowerCase()}).`
      );
    }
  }

  const d10Effect: 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL' =
    d10?.relationship === 'CONFIRMS' || d10?.relationship === 'PARTIALLY_CONFIRMS'
      ? 'SUPPORTS'
      : d10?.relationship === 'CONFLICTS'
        ? 'CHALLENGES'
        : 'NEUTRAL';

  const activatedHousesSet = new Set<number>();
  for (const h of activation.ownedHouses || []) {
    if (housePortfolio.primary.includes(h) || housePortfolio.supporting.includes(h)) {
      activatedHousesSet.add(h);
    }
  }
  if (
    activation.house !== undefined &&
    (housePortfolio.primary.includes(activation.house) || housePortfolio.supporting.includes(activation.house))
  ) {
    activatedHousesSet.add(activation.house);
  }
  const activatedCareerHouses = Object.freeze(Array.from(activatedHousesSet).sort((a, b) => a - b));

  const { support: supportScore, challenge: challengeScore } = calculateFactorScore(factors);
  const netScore = Math.round((supportScore - challengeScore) * 100) / 100;
  const effect = resolveCareerDashaEffect(supportScore, challengeScore, factors);
  const confidence = (activation as any).confidence ?? 'HIGH';

  const supportingFactorIds = Object.freeze(
    factors.filter((f) => f.direction === 'SUPPORT').map((f) => f.id)
  );
  const challengingFactorIds = Object.freeze(
    factors.filter((f) => f.direction === 'CHALLENGE').map((f) => f.id)
  );
  const neutralFactorIds = Object.freeze(
    factors.filter((f) => f.direction === 'NEUTRAL').map((f) => f.id)
  );

  const summary = `${period} Lord ${planet} ${effect.toLowerCase().replace(/_/g, ' ')} career manifestation (${supportScore.toFixed(1)} support vs ${challengeScore.toFixed(1)} challenge).`;

  return Object.freeze({
    period,
    planet,
    effect,
    confidence,
    supportScore,
    challengeScore,
    netScore,
    factors: Object.freeze(factors),
    supportingFactorIds,
    challengingFactorIds,
    neutralFactorIds,
    activatedCareerHouses,
    d10Effect,
    summary
  });
}

export function scoreCareerDashaPlanet(
  period: CareerDashaPeriod,
  activation: DashaPlanetActivation,
  d10?: D10CareerContext
): CareerDashaPlanetSynthesis {
  return synthesizeCareerDashaPlanet({
    period,
    activation,
    housePortfolio: getCareerHousePortfolio(),
    d10: d10 ?? { relationship: 'UNAVAILABLE' }
  });
}

export function synthesizeCareerDashaPeriods(
  md: CareerDashaPlanetSynthesis,
  ad: CareerDashaPlanetSynthesis,
  pd: CareerDashaPlanetSynthesis
): CareerDashaPeriodSynthesis {
  const hierarchy = Object.freeze({
    mdRole: 'PRIMARY' as const,
    adRole: 'MODIFIER' as const,
    pdRole: 'REFINEMENT' as const
  });

  const mdScore = effectScore(md.effect);
  const adScore = effectScore(ad.effect);
  const pdScore = effectScore(pd.effect);

  const combinedScore = Math.round(((mdScore * 1.0 + adScore * 0.6 + pdScore * 0.3) / 1.9) * 100) / 100;
  const combinedEffect = resolveCombinedCareerDashaEffect(md, ad, pd, combinedScore);
  const combinedConfidence = combineCareerDashaConfidence(md.confidence, ad.confidence, pd.confidence);

  const summary = `Career Dasha timing is ${combinedEffect.toLowerCase().replace(/_/g, ' ')} with ${md.planet} Mahadasha (Primary), ${ad.planet} Antardasha (Modifier), and ${pd.planet} Pratyantardasha (Refinement).`;

  return Object.freeze({
    hierarchy,
    md,
    ad,
    pd,
    combinedEffect,
    combinedConfidence,
    combinedScore,
    summary
  });
}

function extractActivation(periodInterp: any): DashaPlanetActivation | undefined {
  if (!periodInterp) return undefined;
  if (periodInterp.natal) return periodInterp.natal;
  if (periodInterp.planet) {
    return {
      planet: periodInterp.planet,
      house: periodInterp.house ?? (periodInterp.housesOccupied?.[0] ?? 1),
      sign: periodInterp.sign ?? 'Aries',
      ownedHouses: periodInterp.ownedHouses ?? periodInterp.housesOwned ?? [],
      functionalRoles: periodInterp.functionalRoles ?? (periodInterp.functionalRole ? [periodInterp.functionalRole.role || periodInterp.functionalRole] : []),
      functionalNature: periodInterp.functionalNature ?? periodInterp.functionalRole?.nature,
      dignity: periodInterp.dignity?.status ?? periodInterp.dignity,
      strength: periodInterp.strength,
      castAspects: periodInterp.castAspects ?? [],
      receivedAspects: periodInterp.receivedAspects ?? [],
      yogaParticipation: periodInterp.yogaParticipation ?? [],
      houseEvidence: periodInterp.houseEvidence ?? [],
      evidence: periodInterp.evidence ?? []
    };
  }
  return undefined;
}

export interface BuildCareerDashaSynthesisParams {
  readonly dashaInterpretation?: any;
  readonly d10Context?: D10CareerContext;
  readonly housePortfolio?: CareerHousePortfolio;
}

export function buildCareerDashaSynthesis(
  params: BuildCareerDashaSynthesisParams
): CareerDashaSynthesis {
  const portfolio = params.housePortfolio ?? getCareerHousePortfolio();
  const d10Context: D10CareerContext = params.d10Context ?? { relationship: 'UNAVAILABLE' };

  const fallbackPlanet = (period: CareerDashaPeriod): CareerDashaPlanetSynthesis =>
    Object.freeze({
      period,
      planet: 'Sun',
      effect: 'INSUFFICIENT_DATA',
      confidence: 'LOW',
      supportScore: 0,
      challengeScore: 0,
      netScore: 0,
      factors: Object.freeze([]),
      supportingFactorIds: Object.freeze([]),
      challengingFactorIds: Object.freeze([]),
      neutralFactorIds: Object.freeze([]),
      activatedCareerHouses: Object.freeze([]),
      d10Effect: 'NEUTRAL',
      summary: `${period} timing data is insufficient.`
    });

  if (!params.dashaInterpretation || !params.dashaInterpretation.current) {
    const mdFallback = fallbackPlanet('MD');
    const adFallback = fallbackPlanet('AD');
    const pdFallback = fallbackPlanet('PD');

    const combined: CareerDashaPeriodSynthesis = Object.freeze({
      hierarchy: Object.freeze({
        mdRole: 'PRIMARY' as const,
        adRole: 'MODIFIER' as const,
        pdRole: 'REFINEMENT' as const
      }),
      md: mdFallback,
      ad: adFallback,
      pd: pdFallback,
      combinedEffect: 'INSUFFICIENT_DATA',
      combinedConfidence: 'LOW',
      combinedScore: 0,
      summary: 'Insufficient dasha timing data to evaluate Career Dasha synthesis.'
    });

    return Object.freeze({
      asOf: undefined,
      natalPromiseProtected: true,
      md: mdFallback,
      ad: adFallback,
      pd: pdFallback,
      combined,
      factors: Object.freeze([]),
      summary: 'Insufficient dasha timing data to evaluate Career Dasha synthesis.'
    });
  }

  const current = params.dashaInterpretation.current;
  const asOf = current.at;

  const mdAct = extractActivation(current.mahadasha);
  const adAct = extractActivation(current.antardasha);
  const pdAct = extractActivation(current.pratyantardasha);

  const md = mdAct
    ? synthesizeCareerDashaPlanet({
        period: 'MD',
        activation: mdAct,
        housePortfolio: portfolio,
        d10: d10Context
      })
    : fallbackPlanet('MD');

  const ad = adAct
    ? synthesizeCareerDashaPlanet({
        period: 'AD',
        activation: adAct,
        housePortfolio: portfolio,
        d10: d10Context
      })
    : fallbackPlanet('AD');

  const pd = pdAct
    ? synthesizeCareerDashaPlanet({
        period: 'PD',
        activation: pdAct,
        housePortfolio: portfolio,
        d10: d10Context
      })
    : fallbackPlanet('PD');

  const combined = synthesizeCareerDashaPeriods(md, ad, pd);
  const allFactors = Object.freeze([...md.factors, ...ad.factors, ...pd.factors]);

  return Object.freeze({
    asOf,
    natalPromiseProtected: true,
    md,
    ad,
    pd,
    combined,
    factors: allFactors,
    summary: combined.summary
  });
}
