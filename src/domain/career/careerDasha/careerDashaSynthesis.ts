/**
 * Career Dasha Synthesis.
 *
 * CW-09 Authoritative Convergence:
 * - Single deterministic scoring and evidence pipeline utilizing strict career linkage gating
 * - Career relevance evidence model preserving provenance (spec §6)
 * - Separation of planetary strength and career relevance (spec §14)
 * - MD↔AD / MD↔PD / AD↔PD relationship modeling (spec §8–9)
 * - Partitioned evidence arrays: primaryEvidence (MD), supportingEvidence (AD), qualifyingEvidence (afflicted/conflicting) (spec §11–12)
 * - Semantic career contribution categories (spec §17)
 * - Standardized stable rule IDs across all factors (spec §19)
 */

import { Planet } from '../../../types';
import type {
  DashaPlanetActivation,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation,
  DashaPratyantardashaInterpretation,
  DashaPairInterpretation
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
  D10CareerContext,
  DashaPlanetRelationship
} from './careerDashaSynthesisTypes';
import {
  classifyCareerFunctionalNature,
  classifyCareerFunctionalRole,
  classifyCareerHouseOwnership,
  classifyCareerHousePlacement,
  classifyCareerYoga,
  classifyPlanetStrengthDirection,
  resolveCareerKarakaRelevance,
  buildCareerRelevance,
  deriveCareerDashaImpact,
  mapHouseToContributionCategory,
  buildDashaPlanetRelationship
} from './careerDashaRules';
import { getCareerHousePortfolio } from '../careerTypes';
import {
  calculateFactorScore,
  combineCareerDashaConfidence,
  effectScore,
  resolveCareerDashaEffect,
  resolveCombinedCareerDashaEffect
} from './careerDashaScoring';
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import { synthesizeCareerDashaPlanetary } from './careerDashaPlanetarySynthesis';

export function synthesizeCareerDashaPlanet(
  input: CareerDashaPlanetInput
): CareerDashaPlanetSynthesis {
  const planetary = synthesizeCareerDashaPlanetary({
    period: input.period,
    activation: input.activation,
    housePortfolio: input.housePortfolio ?? getCareerHousePortfolio(),
    confidence: input.confidence,
    start: input.start,
    end: input.end,
    d10: input.d10
      ? {
          planet: input.activation.planet,
          available: input.d10.available ?? (input.d10.relationship !== 'UNAVAILABLE'),
          relationship: input.d10.relationship as any,
          statement: input.d10.statement
        }
      : undefined
  });

  const factors = planetary.factors as readonly CareerDashaFactor[];
  const supportingFactorIds = planetary.supportingFactorIds ?? planetary.supportingEvidenceIds;
  const challengingFactorIds = planetary.challengingFactorIds ?? planetary.challengingEvidenceIds;
  const neutralFactorIds = planetary.neutralFactorIds ?? planetary.neutralEvidenceIds;

  return Object.freeze({
    period: planetary.period,
    planet: planetary.planet,
    effect: planetary.effect,
    confidence: planetary.confidence,
    supportScore: planetary.supportScore,
    challengeScore: planetary.challengeScore,
    netScore: planetary.netScore,
    careerLinked: planetary.careerLinked,
    relevance: planetary.relevance,
    impact: planetary.impact,
    factors,
    supportingFactorIds,
    challengingFactorIds,
    neutralFactorIds,
    supportingEvidenceIds: supportingFactorIds,
    challengingEvidenceIds: challengingFactorIds,
    neutralEvidenceIds: neutralFactorIds,
    qualifyingEvidenceIds: challengingFactorIds,
    activatedCareerHouses: planetary.activatedCareerHouses,
    d10Effect: planetary.d10Effect,
    summary: planetary.summary,
    ...(input.start ? { start: input.start } : {}),
    ...(input.end ? { end: input.end } : {})
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
  pd: CareerDashaPlanetSynthesis,
  pairInterp?: DashaPairInterpretation
): CareerDashaPeriodSynthesis {
  const hierarchy = Object.freeze({
    mdRole: 'PRIMARY' as const,
    adRole: 'MODIFIER' as const,
    pdRole: 'REFINEMENT' as const
  });

  const mdAdRelationship = buildDashaPlanetRelationship(md.planet, ad.planet, 'MD', 'AD', {
    pairInterp,
    sourceSynthesis: md,
    targetSynthesis: ad,
    portfolio: getCareerHousePortfolio()
  });
  const mdPdRelationship = buildDashaPlanetRelationship(md.planet, pd.planet, 'MD', 'PD', {
    sourceSynthesis: md,
    targetSynthesis: pd,
    portfolio: getCareerHousePortfolio()
  });
  const adPdRelationship = buildDashaPlanetRelationship(ad.planet, pd.planet, 'AD', 'PD', {
    sourceSynthesis: ad,
    targetSynthesis: pd,
    portfolio: getCareerHousePortfolio()
  });
  const relationships = Object.freeze([mdAdRelationship, mdPdRelationship, adPdRelationship]);

  const mdScore = effectScore(md.effect);
  const adScore = effectScore(ad.effect);
  const pdScore = effectScore(pd.effect);

  let relScore = 0;
  if (mdAdRelationship.careerImpact === 'SUPPORTIVE') {
    relScore = mdAdRelationship.evidence.some((e) => e.ruleId === 'CAREER_DASHA_DUAL_10_ACTIVATION') ? 1.5 : 1.0;
  } else if (mdAdRelationship.careerImpact === 'CONFLICTING') {
    relScore = -1.0;
  }

  const relWeight = 0.25;
  const combinedScore =
    Math.round(
      ((mdScore * 1.0 + adScore * 0.6 + pdScore * 0.3 + relScore * relWeight) /
        (1.9 + relWeight)) *
        100
    ) / 100;

  const combinedEffect = resolveCombinedCareerDashaEffect(md, ad, pd, combinedScore, relationships);
  const combinedConfidence = combineCareerDashaConfidence(md.confidence, ad.confidence, pd.confidence, relationships);

  let summary: string;
  if (md.effect === 'DOES_NOT_ACTIVATE' && (ad.effect === 'SUPPORTS' || ad.effect === 'STRONGLY_SUPPORTS')) {
    summary = `The ${md.planet} Mahadasha does not establish a primary Career theme; ${ad.planet} Antardasha provides temporary sub-period activation.`;
  } else if (mdAdRelationship.careerImpact === 'CONFLICTING' && (md.effect === 'SUPPORTS' || md.effect === 'STRONGLY_SUPPORTS')) {
    summary = `Career Dasha timing is active but constrained by ${md.planet}-${ad.planet} conflicting relationship (${combinedEffect.toLowerCase().replace(/_/g, ' ')}) with ${md.planet} Mahadasha (Primary) and ${ad.planet} Antardasha (Modifier).`;
  } else {
    summary = `Career Dasha timing is ${combinedEffect.toLowerCase().replace(/_/g, ' ')} with ${md.planet} Mahadasha (Primary), ${ad.planet} Antardasha (Modifier), and ${pd.planet} Pratyantardasha (Refinement).`;
  }

  return Object.freeze({
    hierarchy,
    md,
    ad,
    pd,
    relationships,
    mdAdRelationship,
    mdPdRelationship,
    adPdRelationship,
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
      careerLinked: false,
      factors: Object.freeze([]),
      supportingFactorIds: Object.freeze([]),
      challengingFactorIds: Object.freeze([]),
      neutralFactorIds: Object.freeze([]),
      supportingEvidenceIds: Object.freeze([]),
      challengingEvidenceIds: Object.freeze([]),
      neutralEvidenceIds: Object.freeze([]),
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
      primaryEvidence: Object.freeze([]),
      supportingEvidence: Object.freeze([]),
      qualifyingEvidence: Object.freeze([]),
      tertiaryEvidence: Object.freeze([]),
      relationships: Object.freeze([]),
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
        confidence: mdInterp?.confidence ?? current.confidence,
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
        confidence: adInterp?.confidence ?? current.confidence,
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
        confidence: pdInterp?.confidence ?? current.confidence,
        start: pdInterp?.start,
        end: pdInterp?.end
      })
    : fallbackPlanet('PD');

  const combined = synthesizeCareerDashaPeriods(md, ad, pd, params.pairInterpretation);
  const allFactors = Object.freeze([...md.factors, ...ad.factors, ...pd.factors]);

  const primaryEvidence = Object.freeze([...md.factors]);
  const supportingEvidence = Object.freeze([...ad.factors]);
  const tertiaryEvidence = Object.freeze([...pd.factors]);
  const qualifyingEvidence = Object.freeze(allFactors.filter((f) => f.direction === 'CHALLENGE'));

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
    primaryEvidence,
    supportingEvidence,
    qualifyingEvidence,
    tertiaryEvidence,
    relationships: combined.relationships,
    summary: combined.summary
  });
}

