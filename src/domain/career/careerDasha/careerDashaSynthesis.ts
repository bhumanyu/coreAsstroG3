import { Planet } from '../../../types';
import type {
  DashaPlanetActivation,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation,
  DashaPratyantardashaInterpretation
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  BuildCareerDashaSynthesisParams,
  CareerDashaFactor,
  CareerDashaPeriod,
  CareerDashaPeriodSynthesis,
  CareerDashaPlanetInput,
  CareerDashaPlanetSynthesis,
  CareerDashaSynthesis,
  CareerFactorCategory,
  CareerFactorDirection,
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
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';

export function synthesizeCareerDashaPlanet(
  input: CareerDashaPlanetInput
): CareerDashaPlanetSynthesis {
  const { period, activation, housePortfolio, d10, start, end } = input;
  const planet = activation.planet;
  const factors: CareerDashaFactor[] = [];

  const addFactor = (
    category: CareerFactorCategory,
    suffix: string,
    direction: CareerFactorDirection,
    weight: number,
    statement: string,
    houses?: readonly number[],
    evidenceIds?: readonly string[],
    meta?: Record<string, unknown>
  ) => {
    factors.push({
      id: `CAREER_DASHA_${period}_${planet.toUpperCase()}_${category}_${suffix}`,
      period,
      planet,
      category,
      direction,
      weight,
      statement,
      ...(houses ? { houses } : {}),
      ...(evidenceIds ? { evidenceIds } : {}),
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

  // 3. Functional Role (contextualized with activation and portfolio)
  for (const role of activation.functionalRoles || []) {
    const cls = classifyCareerFunctionalRole(role, activation, housePortfolio);
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

  // 4. Functional Nature (contextualized modifier)
  if (activation.functionalNature) {
    const cls = classifyCareerFunctionalNature(activation.functionalNature, activation, housePortfolio);
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
  const digRaw = typeof activation.dignity === 'string' ? activation.dignity : undefined;
  if (digRaw) {
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
  const stRaw =
    typeof activation.state === 'string'
      ? (activation.state as string)
      : activation.state?.condition
        ? String(activation.state.condition)
        : undefined;
  if (stRaw) {
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
        asp.targetHouse !== undefined &&
        (housePortfolio.primary.includes(asp.targetHouse) ||
          housePortfolio.supporting.includes(asp.targetHouse))
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

  // 9. Yoga (Career relevance checked)
  if (activation.yogaParticipation) {
    for (const yoga of activation.yogaParticipation) {
      const cls = classifyCareerYoga(yoga, activation, housePortfolio);
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

  // 10. Karaka (Derived from career karaka infrastructure with strict career linkage)
  const karaka = resolveCareerKarakaRelevance(planet, activation, housePortfolio);
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
  // TODO: Deferred synthesis - in a future milestone, expand D10 planetary placement/lagnamsha synthesis
  // rather than using chart-level relationship confirmation only.
  if (d10 && d10.relationship && d10.relationship !== 'UNAVAILABLE') {
    let direction: CareerFactorDirection = 'NEUTRAL';
    let weight = 0;
    if (d10.relationship === 'CONFIRMS') {
      direction = 'SUPPORT';
      weight = 1.5;
    } else if (d10.relationship === 'PARTIALLY_CONFIRMS') {
      direction = 'SUPPORT';
      weight = 1.0;
    } else if (d10.relationship === 'MODIFIES') {
      direction = 'NEUTRAL';
      weight = 0;
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
  const resolvedConfidence: InterpretationConfidence =
    input.confidence ??
    (activation as any).confidence ??
    (activation.strength?.meetsMinimum ||
    (activation.strength?.totalRupa !== undefined && activation.strength.totalRupa >= 5) ||
    (activation.strength as any)?.level === 'STRONG' ||
    (activation.strength as any)?.score !== undefined
      ? 'HIGH'
      : 'MEDIUM');

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
    confidence: resolvedConfidence,
    supportScore,
    challengeScore,
    netScore,
    factors: Object.freeze(factors),
    supportingFactorIds,
    challengingFactorIds,
    neutralFactorIds,
    activatedCareerHouses,
    d10Effect,
    summary,
    ...(start ? { start } : {}),
    ...(end ? { end } : {})
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

  let summary: string;
  if (md.effect === 'DOES_NOT_ACTIVATE' && (ad.effect === 'SUPPORTS' || ad.effect === 'STRONGLY_SUPPORTS')) {
    summary = `The ${md.planet} Mahadasha does not establish a primary Career theme; ${ad.planet} Antardasha provides temporary sub-period activation.`;
  } else {
    summary = `Career Dasha timing is ${combinedEffect.toLowerCase().replace(/_/g, ' ')} with ${md.planet} Mahadasha (Primary), ${ad.planet} Antardasha (Modifier), and ${pd.planet} Pratyantardasha (Refinement).`;
  }

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

function extractActivation(
  periodInterp?:
    | DashaMahadashaInterpretation
    | DashaAntardashaInterpretation
    | DashaPratyantardashaInterpretation
    | { readonly natal?: DashaPlanetActivation }
    | DashaPlanetActivation
): DashaPlanetActivation | undefined {
  if (!periodInterp) return undefined;
  if ('natal' in periodInterp && periodInterp.natal) {
    return periodInterp.natal;
  }
  if ('planet' in periodInterp && typeof periodInterp.planet === 'string') {
    return periodInterp as DashaPlanetActivation;
  }
  return undefined;
}

export function buildCareerDashaSynthesis(
  params: BuildCareerDashaSynthesisParams
): CareerDashaSynthesis {
  const portfolio = params.housePortfolio ?? getCareerHousePortfolio();
  const d10Context: D10CareerContext = params.d10Context ?? { relationship: 'UNAVAILABLE' };

  const fallbackPlanet = (period: CareerDashaPeriod): CareerDashaPlanetSynthesis =>
    Object.freeze({
      period,
      planet: Planet.SUN,
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

    const timing = Object.freeze({
      md: Object.freeze({ period: 'MD' as const, planet: Planet.SUN }),
      ad: Object.freeze({ period: 'AD' as const, planet: Planet.SUN }),
      pd: Object.freeze({ period: 'PD' as const, planet: Planet.SUN })
    });

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
      reasoningVersion: 'CW-02' as const,
      timing,
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

  const mdInterp = current.mahadasha;
  const adInterp = current.antardasha;
  const pdInterp = current.pratyantardasha;

  const mdAct = extractActivation(mdInterp);
  const adAct = extractActivation(adInterp);
  const pdAct = extractActivation(pdInterp);

  const md = mdAct
    ? synthesizeCareerDashaPlanet({
        period: 'MD',
        activation: mdAct,
        housePortfolio: portfolio,
        d10: d10Context,
        confidence: mdInterp?.confidence,
        start: mdInterp?.start,
        end: mdInterp?.end
      })
    : fallbackPlanet('MD');

  const ad = adAct
    ? synthesizeCareerDashaPlanet({
        period: 'AD',
        activation: adAct,
        housePortfolio: portfolio,
        d10: d10Context,
        confidence: adInterp?.confidence,
        start: adInterp?.start,
        end: adInterp?.end
      })
    : fallbackPlanet('AD');

  const pd = pdAct
    ? synthesizeCareerDashaPlanet({
        period: 'PD',
        activation: pdAct,
        housePortfolio: portfolio,
        d10: d10Context,
        confidence: pdInterp?.confidence,
        start: pdInterp?.start,
        end: pdInterp?.end
      })
    : fallbackPlanet('PD');

  const combined = synthesizeCareerDashaPeriods(md, ad, pd);
  const allFactors = Object.freeze([...md.factors, ...ad.factors, ...pd.factors]);

  const timing = Object.freeze({
    md: Object.freeze({
      period: 'MD' as const,
      planet: md.planet,
      ...(md.start ? { start: md.start } : {}),
      ...(md.end ? { end: md.end } : {})
    }),
    ad: Object.freeze({
      period: 'AD' as const,
      planet: ad.planet,
      ...(ad.start ? { start: ad.start } : {}),
      ...(ad.end ? { end: ad.end } : {})
    }),
    pd: Object.freeze({
      period: 'PD' as const,
      planet: pd.planet,
      ...(pd.start ? { start: pd.start } : {}),
      ...(pd.end ? { end: pd.end } : {})
    })
  });

  return Object.freeze({
    asOf,
    natalPromiseProtected: true,
    reasoningVersion: 'CW-02' as const,
    timing,
    md,
    ad,
    pd,
    combined,
    factors: allFactors,
    summary: combined.summary
  });
}
