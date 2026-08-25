import { Horoscope, Planet, Sign } from '../../types';
import type { DomainStrength } from '../../domain/reasoning/reasoningTypes';
import type { TimingEffect } from '../../domain/timing/careerWealthTiming/careerWealthTimingTypes';
import {
  AI_CONTEXT_SCHEMA_VERSION,
  AiAvailability,
  AiConfidence,
  AiEvidenceEffect
} from '../types/aiTypes';
import {
  ActiveDashaFact,
  AiContext,
  AiContextMethodology,
  AiContextSource,
  AiEvidence,
  AiEvidenceDimension,
  AiEvidencePriority,
  AiEvidenceSource,
  AiEvidenceStrength,
  AscendantFact,
  CareerFact,
  CareerHierarchyFact,
  CareerTimingFact,
  CareerPeriodTimingFact,
  CareerDashaSynthesisFact,
  CareerDashaSynthesisFactorFact,
  CareerTimingSynthesisFact,
  CareerTimingFactorFact,
  WealthTimingSynthesisFact,
  WealthTimingFactorFact,
  DashaFacts,
  DashaInterpretationFacts,
  DashaPairFacts,
  DashaPeriodFact,
  DashaPeriodFacts,
  DivisionalFact,
  DivisionalFacts,
  HouseFactSummary,
  LifeThemeFact,
  PlanetFactSummary,
  WealthFact,
  WealthHierarchyFact,
  WealthTimingFact,
  WealthPeriodTimingFact,
  WealthSubthemeFact,
  YogaFactSummary,
  TimingActivationEffect
} from '../types/aiContextTypes';
import type { CareerTimingFactor, WealthTimingFactor, WealthDimensionTimingSynthesis } from '../../domain/timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerDashaFactor } from '../../domain/career/careerDasha/careerDashaSynthesisTypes';
import type { WealthPeriodTimingActivation } from '../../domain/wealth/wealthTypes';
import type { WealthSubthemeKey } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { YogaResult } from '../../engine/yoga/yogaTypes';
import type {
  ActiveDashaInterpretation,
  DashaInterpretationEvidence
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  mapActiveDasha,
  type DashaPlanetProduct,
  type DashaPairProduct
} from '../../product/life-analysis/dasha/activeDashaMapper';
import {
  createDefaultDomainInterpreterRegistry,
  projectDomainInterpretationForAi,
  buildNormalizedCareerTiming,
  buildNormalizedWealthTiming,
  getCareerTimingActivations,
  getWealthPeriodTimingActivations,
  type DomainInterpretation,
  type DomainEvidence,
  type DomainInterpretationAiProjection
} from '../../domain/interpretation';
import {
  synthesizeCareerDashaHierarchy,
  synthesizeWealthDashaHierarchy,
  indexDashaPeriodActivations
} from '../../product/life-analysis';
import {
  synthesizeLifeAnalysis,
  projectLifeAnalysisForAi,
  type LifeAnalysis
} from '../../domain/synthesis';
import { deepFreeze } from './deepFreeze';

/**
 * Options to avoid double calculation when domain interpretations and life analysis
 * have already been computed upstream.
 */
export interface BuildAiContextOptions {
  /**
   * Pre-computed domain interpretations (e.g., Career V2, Wealth V2).
   * When provided, these bypass the default registry instantiation and interpretation.
   */
  readonly domainInterpretations?: readonly DomainInterpretation[];
  /**
   * Pre-computed life analysis result.
   * When provided, this bypasses synthesis from domain interpretations.
   */
  readonly lifeAnalysis?: LifeAnalysis;
}

const PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
]);

function buildAscendantFact(horoscope: Horoscope): AscendantFact {
  const sign: Sign | undefined =
    horoscope.rasiChart?.ascendantSign ||
    horoscope.ascendant?.sign;

  if (!sign) {
    throw new Error('Cannot build AiContext: missing ascendant sign');
  }

  const lord: Planet | undefined =
    horoscope.houseLordship?.houseLords?.[1];

  if (!lord) {
    throw new Error('Cannot build AiContext: missing ascendant lord');
  }

  const lordPlanetFact = horoscope.planetFacts?.[lord];
  const lordHouse = lordPlanetFact?.house;
  const lordSign = lordPlanetFact?.sign;

  return {
    sign,
    lord,
    ...(typeof lordHouse === 'number' ? { lordHouse } : {}),
    ...(lordSign ? { lordSign } : {})
  };
}

function buildPlanetFacts(horoscope: Horoscope): readonly PlanetFactSummary[] {
  const facts: PlanetFactSummary[] = [];

  for (const planet of PLANET_ORDER) {
    const fact = horoscope.planetFacts?.[planet];
    if (!fact?.sign) {
      throw new Error('Cannot build AiContext: missing sign for ' + planet);
    }
    if (typeof fact?.house !== 'number') {
      throw new Error('Cannot build AiContext: missing house for ' + planet);
    }
    const sign: Sign = fact.sign;
    const house: number = fact.house;
    const dignity: string | undefined = fact?.dignity?.status
      ? String(fact.dignity.status)
      : undefined;
    const state: string | undefined = fact?.state?.condition
      ? String(fact.state.condition)
      : undefined;

    const functionalRoles: readonly string[] = (
      horoscope.functionalRoles?.planets?.[planet]?.roles || []
    ).map((role: unknown) => String(role));

    const ownedHouses: readonly number[] = [
      ...(horoscope.functionalRoles?.planets?.[planet]?.ownedHouses ||
        horoscope.houseLordship?.planetLordships?.[planet]?.ownedHouses ||
        [])
    ];

    const strengthStatus: string | undefined = horoscope.planetaryStrength
      ?.planets?.[planet]?.shadbala?.status
      ? String(horoscope.planetaryStrength.planets[planet].shadbala.status)
      : undefined;

    const nakshatra: string | undefined =
      fact?.nakshatraMetadata?.name ||
      fact?.nakshatraMetadata?.englishName ||
      (typeof fact?.nakshatraResult?.nakshatra === 'string'
        ? fact.nakshatraResult.nakshatra
        : fact?.nakshatraResult?.nakshatra?.name) ||
      undefined;

    const nakshatraPada: number | undefined =
      typeof fact?.nakshatraResult?.padaNumber === 'number'
        ? fact.nakshatraResult.padaNumber
        : typeof fact?.nakshatraResult?.pada === 'number'
          ? fact.nakshatraResult.pada
          : undefined;

    facts.push({
      planet,
      sign,
      house,
      ...(dignity ? { dignity } : {}),
      ...(state ? { state } : {}),
      functionalRoles,
      ownedHouses,
      ...(strengthStatus ? { strengthStatus } : {}),
      ...(nakshatra ? { nakshatra } : {}),
      ...(nakshatraPada !== undefined ? { nakshatraPada } : {})
    });
  }

  return facts;
}

function buildHouseFacts(horoscope: Horoscope): readonly HouseFactSummary[] {
  const houses: HouseFactSummary[] = [];

  for (let h = 1; h <= 12; h++) {
    const houseInterp = horoscope.houseInterpretation?.houses?.[h];
    const houseAnalysis = horoscope.houseAnalysis?.houses?.[h];

    const sign: Sign | undefined =
      (houseInterp?.placement?.sign || houseAnalysis?.sign) as Sign | undefined;

    if (!sign) {
      throw new Error('Cannot build AiContext: missing sign for house ' + h);
    }

    const lord: Planet | undefined =
      houseInterp?.lord?.planet ||
      houseAnalysis?.lord ||
      horoscope.houseLordship?.houseLords?.[h];

    if (!lord) {
      throw new Error('Cannot build AiContext: missing lord for house ' + h);
    }

    const occupants: readonly Planet[] = [
      ...(houseInterp?.occupants?.planets || houseAnalysis?.occupants || [])
    ];

    const aspectingPlanetsSet = new Set<Planet>();

    if (houseInterp?.aspects?.received) {
      for (const received of houseInterp.aspects.received) {
        if (Array.isArray(received.sourcePlanets)) {
          for (const p of received.sourcePlanets) {
            aspectingPlanetsSet.add(p);
          }
        }
      }
    }

    if (houseAnalysis?.receivedAspects) {
      for (const aspect of houseAnalysis.receivedAspects) {
        const p = aspect.sourcePlanet || aspect.aspectingPlanet;
        if (p) {
          aspectingPlanetsSet.add(p);
        }
      }
    }

    const drishtiList = horoscope.natalGrahaDrishti?.aspectsReceivedByHouse?.[h];
    if (drishtiList) {
      for (const drishti of drishtiList) {
        const p = drishti.sourcePlanet || drishti.aspectingPlanet;
        if (p) {
          aspectingPlanetsSet.add(p);
        }
      }
    }

    const aspectingPlanets: readonly Planet[] = Array.from(aspectingPlanetsSet);

    houses.push({
      house: h,
      sign,
      lord,
      occupants,
      aspectingPlanets
    });
  }

  return houses;
}

function buildYogaFacts(horoscope: Horoscope): readonly YogaFactSummary[] {
  const yogas: readonly YogaResult[] = horoscope.yogas?.yogas || [];
  return yogas.map((y) => {
    const rawStatus = y.assessment?.finalStatus || y.finalStatus || 'UNKNOWN';
    const rawStrength = y.assessment?.strength;
    const planets: readonly Planet[] = [...(y.planets || [])];
    const houses: readonly number[] = (y.houses || []).filter(
      (h): h is number => typeof h === 'number'
    );

    return {
      type: String(y.type),
      category: String(y.category),
      status: rawStatus as
        | 'PRESENT'
        | 'WEAKENED'
        | 'STRONG'
        | 'CANCELLED'
        | 'UNKNOWN',
      ...(rawStrength ? { strength: String(rawStrength) } : {}),
      planets,
      houses
    };
  });
}

function mapDashaPlanetProductToPeriodFacts(
  product: DashaPlanetProduct | undefined
): DashaPeriodFacts | undefined {
  if (!product) {
    return undefined;
  }

  const evidenceIds = (product.evidence || []).map((e) => projectDashaEvidenceToAi(e).id);

  return {
    level: product.level,
    planet: product.planet,
    start: product.start,
    end: product.end,
    placement: {
      house: product.placement.house,
      sign: product.placement.sign
    },
    ownedHouses: [...product.ownedHouses],
    functionalRoles: [...product.functionalRoles],
    ...(product.functionalNature ? { functionalNature: product.functionalNature } : {}),
    ...(product.dignity ? { dignity: product.dignity } : {}),
    ...(product.state ? { state: product.state } : {}),
    ...(product.strength
      ? {
          strength: {
            availability: product.strength.availability,
            ...(typeof product.strength.totalRupa === 'number'
              ? { totalRupa: product.strength.totalRupa }
              : {}),
            ...(typeof product.strength.totalShastiamsa === 'number'
              ? { totalShastiamsa: product.strength.totalShastiamsa }
              : {}),
            ...(typeof product.strength.percentageOfMinimum === 'number'
              ? { percentageOfMinimum: product.strength.percentageOfMinimum }
              : {}),
            ...(typeof product.strength.meetsMinimum === 'boolean'
              ? { meetsMinimum: product.strength.meetsMinimum }
              : {}),
            ...(product.strength.shadbalaStatus
              ? { shadbalaStatus: product.strength.shadbalaStatus }
              : {})
          }
        }
      : {}),
    ...(product.castAspects ? { castAspects: product.castAspects } : {}),
    ...(product.receivedAspects ? { receivedAspects: product.receivedAspects } : {}),
    ...(product.yogaParticipation ? { yogaParticipation: product.yogaParticipation } : {}),
    ...(product.planetarySynthesis
      ? {
          planetarySynthesis: {
            effect: product.planetarySynthesis.effect,
            confidence: product.planetarySynthesis.confidence,
            supportingEvidenceIds: [...product.planetarySynthesis.supportingEvidenceIds],
            challengingEvidenceIds: [...product.planetarySynthesis.challengingEvidenceIds],
            neutralEvidenceIds: [...product.planetarySynthesis.neutralEvidenceIds],
            summary: product.planetarySynthesis.summary
          }
        }
      : {}),
    ...(product.domainSynthesis
      ? {
          domainSynthesis: product.domainSynthesis.map((ds) => ({
            domain: ds.domain,
            effect: ds.effect,
            confidence: ds.confidence,
            supportingEvidenceIds: [...ds.supportingEvidenceIds],
            challengingEvidenceIds: [...ds.challengingEvidenceIds],
            neutralEvidenceIds: [...ds.neutralEvidenceIds],
            activatedHouses: [...ds.activatedHouses],
            summary: ds.summary
          }))
        }
      : {}),
    evidenceIds,
    confidence: product.confidence
  };
}

function mapDashaPairProductToPairFacts(
  pair: DashaPairProduct | undefined
): DashaPairFacts | undefined {
  if (!pair) {
    return undefined;
  }

  const relationshipEvidenceIds = (pair.relationshipEvidence || []).map(
    (e) => projectDashaEvidenceToAi(e).id
  );

  return {
    mahadashaLord: pair.mahadashaLord,
    antardashaLord: pair.antardashaLord,
    sharedHouses: [...pair.sharedHouses],
    combinedHouseSet: [...pair.combinedHouseSet],
    relationshipEvidenceIds
  };
}

function buildDashaFacts(horoscope: Horoscope): DashaFacts {
  const mahadashas = horoscope.vimshottari?.mahadashas || [];
  // v1: only Mahadasha projection is supported currently
  const periods: DashaPeriodFact[] = mahadashas.map((m: any) => ({
    planet: m.planet,
    level: 'MAHADASHA',
    start: m.start,
    end: m.end
  }));

  let active: ActiveDashaFact | undefined;
  const current =
    horoscope.dashaInterpretation?.current ||
    horoscope.dashaInterpretation?.activePeriods ||
    horoscope.fullNatalAnalysis?.currentDasha?.current;

  if (current?.mahadasha?.planet) {
    active = {
      mahadasha: current.mahadasha.planet,
      ...(current.antardasha?.planet ? { antardasha: current.antardasha.planet } : {}),
      ...(current.pratyantardasha?.planet ? { pratyantardasha: current.pratyantardasha.planet } : {})
    };
  }

  const product = mapActiveDasha(horoscope.dashaInterpretation?.current);

  let interpretation: DashaInterpretationFacts | undefined;
  let asOf: string | undefined;

  if (product && product.status === 'AVAILABLE') {
    asOf = product.at;
    const topLevelEvidenceIds = (product.evidence || []).map(
      (e) => projectDashaEvidenceToAi(e).id
    );

    interpretation = {
      status: product.status,
      ...(product.mahadasha
        ? { mahadasha: mapDashaPlanetProductToPeriodFacts(product.mahadasha) }
        : {}),
      ...(product.antardasha
        ? { antardasha: mapDashaPlanetProductToPeriodFacts(product.antardasha) }
        : {}),
      ...(product.pratyantardasha
        ? { pratyantardasha: mapDashaPlanetProductToPeriodFacts(product.pratyantardasha) }
        : {}),
      ...(product.pair ? { pair: mapDashaPairProductToPairFacts(product.pair) } : {}),
      evidenceIds: topLevelEvidenceIds,
      ...(product.confidence ? { confidence: product.confidence } : {}),
      ...(product.at ? { asOf: product.at } : {})
    };
  }

  return {
    system: 'VIMSHOTTARI',
    periods,
    ...(active ? { active } : {}),
    ...(asOf ? { asOf } : {}),
    ...(interpretation ? { interpretation } : {})
  };
}

function buildDivisionalFacts(horoscope: Horoscope): DivisionalFacts {
  const d9Interp = horoscope.divisionalInterpretation?.d9;
  const d10Interp = horoscope.divisionalInterpretation?.d10;

  const d9: DivisionalFact = d9Interp
    ? {
      varga: 'D9',
      status: 'AVAILABLE' as AiAvailability,
      ...(d9Interp.ascendant?.sign ? { ascendantSign: d9Interp.ascendant.sign } : {}),
      confidence: d9Interp.confidence as AiConfidence
    }
    : {
      varga: 'D9',
      status: 'UNAVAILABLE' as AiAvailability
    };

  const d10: DivisionalFact = d10Interp
    ? {
      varga: 'D10',
      status: 'AVAILABLE' as AiAvailability,
      ...(d10Interp.ascendant?.sign ? { ascendantSign: d10Interp.ascendant.sign } : {}),
      confidence: d10Interp.confidence as AiConfidence
    }
    : {
      varga: 'D10',
      status: 'UNAVAILABLE' as AiAvailability
    };

  return {
    d9,
    d10,
    // D2 is intentionally absent because Wealth D2 interpretation is not implemented
    d2: undefined
  };
}

function mapThemeEffectToStatus(
  effect: string | undefined
):
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'NEUTRAL'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED_EVIDENCE' {
  switch (effect) {
    case 'SUPPORT':
      return 'SUPPORTED';
    case 'CHALLENGE':
      return 'CHALLENGED';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
      return 'NEUTRAL';
    default:
      return 'LIMITED_EVIDENCE';
  }
}

function buildCareerFact(
  horoscope: Horoscope,
  careerInterpretation?: DomainInterpretation,
  asOf?: string
): CareerFact | undefined {
  const career = horoscope.themeInterpretationV2?.career;
  const timing = buildNormalizedCareerTiming(careerInterpretation, asOf) as CareerTimingFact | undefined;

  let hierarchy: CareerHierarchyFact | undefined;
  let dashaSynthesisFact: CareerDashaSynthesisFact | undefined;
  const careerDashaSynthesis = careerInterpretation?.conclusionData?.careerDashaSynthesis;

  if (careerDashaSynthesis && careerDashaSynthesis.combined.combinedEffect !== 'INSUFFICIENT_DATA') {
    const syn = careerDashaSynthesis.combined;
    const mapEffect = (effect: string): TimingActivationEffect => {
      if (effect === 'STRONGLY_SUPPORTS' || effect === 'SUPPORTS') return 'ACTIVATES';
      if (effect === 'CHALLENGES' || effect === 'STRONGLY_CHALLENGES') return 'CHALLENGES';
      if (effect === 'MIXED') return 'PARTIALLY_ACTIVATES';
      return 'DOES_NOT_ACTIVATE';
    };

    const mapSynthesisFactor = (f: CareerDashaFactor): CareerDashaSynthesisFactorFact => ({
      id: f.id,
      category: f.category,
      direction: f.direction,
      weight: f.weight,
      statement: f.statement,
      ...(f.houses ? { houses: [...f.houses] } : {}),
      ...(f.evidenceIds ? { evidenceIds: [...f.evidenceIds] } : {})
    });

    dashaSynthesisFact = {
      reasoningVersion: 'CW-02',
      md: {
        planet: syn.md.planet,
        effect: syn.md.effect,
        factors: syn.md.factors.map(mapSynthesisFactor)
      },
      ad: {
        planet: syn.ad.planet,
        effect: syn.ad.effect,
        factors: syn.ad.factors.map(mapSynthesisFactor)
      },
      pd: {
        planet: syn.pd.planet,
        effect: syn.pd.effect,
        factors: syn.pd.factors.map(mapSynthesisFactor)
      },
      hierarchy: {
        mdRole: syn.hierarchy.mdRole,
        adRole: syn.hierarchy.adRole,
        pdRole: syn.hierarchy.pdRole,
        combinedEffect: syn.combinedEffect
      },
      summary: syn.summary
    };

    hierarchy = {
      primary: {
        level: 'MAHADASHA',
        role: 'PRIMARY',
        planet: syn.md.planet,
        effect: mapEffect(syn.md.effect),
        ...(syn.md.start ? { start: syn.md.start } : {}),
        ...(syn.md.end ? { end: syn.md.end } : {})
      },
      modifier: {
        level: 'ANTARDASHA',
        role: 'MODIFIER',
        planet: syn.ad.planet,
        effect: mapEffect(syn.ad.effect),
        ...(syn.ad.start ? { start: syn.ad.start } : {}),
        ...(syn.ad.end ? { end: syn.ad.end } : {})
      },
      trigger: {
        level: 'PRATYANTARDASHA',
        role: 'TRIGGER',
        planet: syn.pd.planet,
        effect: mapEffect(syn.pd.effect),
        ...(syn.pd.start ? { start: syn.pd.start } : {}),
        ...(syn.pd.end ? { end: syn.pd.end } : {})
      },
      overallEffect: mapEffect(syn.combinedEffect),
      confidence: syn.combinedConfidence === 'HIGH' ? 0.9 : syn.combinedConfidence === 'MEDIUM' ? 0.7 : 0.5,
      evidenceIds: (careerDashaSynthesis.factors ?? []).map((f: { id: string }) => f.id),
      summary: syn.summary
    };
  } else if (timing?.status === 'AVAILABLE' && timing.mahadasha && timing.antardasha && timing.pratyantardasha) {
    const activations = getCareerTimingActivations(careerInterpretation);
    const { md, ad, pd } = indexDashaPeriodActivations(activations);

    if (md && ad && pd) {
      const syn = synthesizeCareerDashaHierarchy(md, ad, pd);
      hierarchy = {
        primary: { level: 'MAHADASHA', role: 'PRIMARY', planet: md.planet, effect: md.effect },
        modifier: { level: 'ANTARDASHA', role: 'MODIFIER', planet: ad.planet, effect: ad.effect },
        trigger: { level: 'PRATYANTARDASHA', role: 'TRIGGER', planet: pd.planet, effect: pd.effect },
        overallEffect: syn.overallEffect,
        confidence: syn.confidence,
        evidenceIds: syn.evidenceIds,
        summary: syn.summary
      };
    }
  }

  const careerTimingSynthesis = careerInterpretation?.conclusionData?.careerTimingSynthesis;
  let careerTimingSynthesisFact: CareerTimingSynthesisFact | undefined;
  if (careerTimingSynthesis) {
    careerTimingSynthesisFact = {
      reasoningVersion: 'CW-03',
      natalPromise: careerTimingSynthesis.natalPromise,
      dashaEffect: careerTimingSynthesis.dashaEffect,
      transitEffect: careerTimingSynthesis.transitEffect,
      overallEffect: careerTimingSynthesis.overallEffect,
      confidence: careerTimingSynthesis.confidence,
      factors: careerTimingSynthesis.factors.map((f: CareerTimingFactor): CareerTimingFactorFact => ({
        id: f.id,
        planet: f.planet,
        category: f.category,
        direction: f.direction,
        weight: f.weight,
        statement: f.statement,
        ...(f.houses ? { houses: [...f.houses] } : {}),
        ...(f.natalEvidenceIds ? { natalEvidenceIds: [...f.natalEvidenceIds] } : {}),
        ...(f.dashaEvidenceIds ? { dashaEvidenceIds: [...f.dashaEvidenceIds] } : {})
      })),
      summary: careerTimingSynthesis.summary
    };
  }

  const enrichedTiming: CareerTimingFact | undefined = timing || careerTimingSynthesisFact
    ? {
        ...(timing ?? { status: 'AVAILABLE' }),
        ...(hierarchy ? { hierarchy } : {}),
        ...(dashaSynthesisFact ? { dashaSynthesis: dashaSynthesisFact } : {}),
        ...(careerTimingSynthesisFact ? { timingSynthesis: careerTimingSynthesisFact } : {})
      }
    : undefined;

  if (career) {
    return {
      status: career.conclusion.status,
      confidence: career.conclusion.confidence as AiConfidence,
      natalPromise: career.careerNatalPromise.status,
      d10Relationship: career.metadata.vargaConfirmationStatus,
      supportingFactors: [...career.conclusion.keySupportingFactors],
      challengingFactors: [...career.conclusion.keyChallengingFactors],
      conditionalFactors: [...career.conclusion.keyConditionalFactors],
      ...(enrichedTiming ? { timing: enrichedTiming } : {}),
      ...(dashaSynthesisFact ? { dashaSynthesis: dashaSynthesisFact } : {})
    };
  }

  if (careerInterpretation) {
    const d10 = careerInterpretation.vargaConfirmations.find((v) => v.varga === 'D10');
    return {
      status: careerInterpretation.conclusion.strength as any,
      confidence: careerInterpretation.conclusion.confidence as AiConfidence,
      natalPromise: careerInterpretation.natalPromise.strength as any,
      d10Relationship: (d10?.relationship ?? 'UNAVAILABLE') as any,
      supportingFactors: [],
      challengingFactors: [],
      conditionalFactors: [],
      ...(enrichedTiming ? { timing: enrichedTiming } : {}),
      ...(dashaSynthesisFact ? { dashaSynthesis: dashaSynthesisFact } : {})
    };
  }

  return undefined;
}

function buildWealthFact(
  horoscope: Horoscope,
  wealthInterpretation?: DomainInterpretation,
  asOf?: string
): WealthFact | undefined {
  const wealth = horoscope.themeInterpretationV2?.wealth;
  const timing = buildNormalizedWealthTiming(wealthInterpretation, asOf) as WealthTimingFact | undefined;

  let hierarchy: WealthHierarchyFact | undefined;
  if (timing?.status === 'AVAILABLE' && timing.mahadasha && timing.antardasha && timing.pratyantardasha) {
    const activations = getWealthPeriodTimingActivations(wealthInterpretation);
    const { md, ad, pd } = indexDashaPeriodActivations(activations);

    if (md && ad && pd) {
      const syn = synthesizeWealthDashaHierarchy(md, ad, pd);
      hierarchy = {
        primary: { level: 'MAHADASHA', role: 'PRIMARY', planet: md.planet, effect: md.effect ?? 'UNKNOWN' },
        modifier: { level: 'ANTARDASHA', role: 'MODIFIER', planet: ad.planet, effect: ad.effect ?? 'UNKNOWN' },
        trigger: { level: 'PRATYANTARDASHA', role: 'TRIGGER', planet: pd.planet, effect: pd.effect ?? 'UNKNOWN' },
        dimensions: syn.dimensions.map((d) => ({
          dimension: d.dimension,
          primary: d.primary,
          modifier: d.modifier,
          trigger: d.trigger,
          overallEffect: d.overallEffect,
          confidence: d.confidence
        })),
        evidenceIds: syn.evidenceIds,
        summary: syn.summary
      };
    }
  }

  const wealthTimingSynthesis = wealthInterpretation?.conclusionData?.wealthTimingSynthesis;
  let wealthTimingSynthesisFact: WealthTimingSynthesisFact | undefined;
  if (wealthTimingSynthesis) {
    const dimFacts: Record<string, {
      readonly dimension: string;
      readonly natalPromise: DomainStrength;
      readonly dashaEffect: string;
      readonly transitEffect: string;
      readonly overallEffect: TimingEffect;
      readonly confidence: number;
      readonly factors: readonly WealthTimingFactorFact[];
      readonly summary: string;
    }> = {};
    for (const [dimKey, dimSyn] of Object.entries(wealthTimingSynthesis.dimensions)) {
      const synObj = dimSyn as WealthDimensionTimingSynthesis;
      dimFacts[dimKey] = {
        dimension: synObj.dimension,
        natalPromise: synObj.natalPromise,
        dashaEffect: synObj.dashaEffect,
        transitEffect: synObj.transitEffect,
        overallEffect: synObj.overallEffect,
        confidence: synObj.confidence,
        factors: synObj.factors.map((f: WealthTimingFactor): WealthTimingFactorFact => ({
          id: f.id,
          planet: f.planet,
          category: f.category,
          direction: f.direction,
          weight: f.weight,
          statement: f.statement,
          dimension: f.dimension,
          ...(f.houses ? { houses: [...f.houses] } : {}),
          ...(f.natalEvidenceIds ? { natalEvidenceIds: [...f.natalEvidenceIds] } : {}),
          ...(f.dashaEvidenceIds ? { dashaEvidenceIds: [...f.dashaEvidenceIds] } : {})
        })),
        summary: synObj.summary
      };
    }
    wealthTimingSynthesisFact = {
      reasoningVersion: 'CW-03',
      dimensions: dimFacts,
      overallSummary: wealthTimingSynthesis.overallSummary
    };
  }

  const enrichedTiming: WealthTimingFact | undefined = timing || wealthTimingSynthesisFact
    ? {
        ...(timing ?? { status: 'AVAILABLE' }),
        ...(hierarchy ? { hierarchy } : {}),
        ...(wealthTimingSynthesisFact ? { timingSynthesis: wealthTimingSynthesisFact } : {})
      }
    : undefined;

  const subthemeKeys: readonly WealthSubthemeKey[] = [
    'ACCUMULATION',
    'GAINS',
    'FORTUNE',
    'SPECULATION'
  ];
  const subthemes: WealthSubthemeFact[] = [];

  if (wealth?.subthemes) {
    for (const key of subthemeKeys) {
      const summary = wealth.subthemes[key];
      if (summary) {
        subthemes.push({
          subtheme: summary.key || key,
          house: summary.houseNumber,
          status: mapThemeEffectToStatus(summary.status),
          primaryFamily: String(summary.primaryFamily),
          supportingCount: summary.supportingEvidenceCount,
          challengingCount: summary.challengingEvidenceCount,
          summary: summary.summaryStatement
        });
      }
    }
  }

  if (wealth) {
    return {
      status: wealth.conclusion.status,
      confidence: wealth.conclusion.confidence as AiConfidence,
      subthemes,
      supportingFactors: [...wealth.conclusion.keySupportingFactors],
      challengingFactors: [...wealth.conclusion.keyChallengingFactors],
      conditionalFactors: [...wealth.conclusion.keyConditionalFactors],
      ...(enrichedTiming ? { timing: enrichedTiming } : {})
    };
  }

  if (wealthInterpretation) {
    return {
      status: wealthInterpretation.conclusion.strength as any,
      confidence: wealthInterpretation.conclusion.confidence as AiConfidence,
      subthemes: [],
      supportingFactors: [],
      challengingFactors: [],
      conditionalFactors: [],
      ...(enrichedTiming ? { timing: enrichedTiming } : {})
    };
  }

  return undefined;
}

function normalizeEvidenceEffect(effect: unknown): AiEvidenceEffect {
  if (
    effect === 'SUPPORT' ||
    effect === 'CHALLENGE' ||
    effect === 'NEUTRAL' ||
    effect === 'MIXED' ||
    effect === 'UNKNOWN'
  ) {
    return effect;
  }
  return 'UNKNOWN';
}

function buildLifeThemeFacts(horoscope: Horoscope): readonly LifeThemeFact[] {
  const themes = horoscope.lifeThemes?.themes || [];
  return themes.map((t: any) => ({
    theme: String(t.theme),
    effect: normalizeEvidenceEffect(t.effect),
    confidence: t.confidence as AiConfidence,
    evidenceCount: t.evidenceCount ?? (t.evidence?.length || 0)
  }));
}

function normalizeEvidenceStrength(strength: unknown): AiEvidenceStrength {
  if (strength === 'STRONG') return 'STRONG';
  if (strength === 'WEAK') return 'WEAK';
  if (strength === 'MODERATE') return 'MODERATE';
  return 'UNKNOWN';
}

function mapToAiEvidenceSource(source: unknown): AiEvidenceSource {
  if (typeof source === 'string') {
    const upper = source.trim().toUpperCase();
    if (
      upper === 'PLANET' ||
      upper === 'GRAHA' ||
      upper === 'SUN' ||
      upper === 'MOON' ||
      upper === 'MARS' ||
      upper === 'MERCURY' ||
      upper === 'JUPITER' ||
      upper === 'VENUS' ||
      upper === 'SATURN' ||
      upper === 'RAHU' ||
      upper === 'KETU'
    ) {
      return 'PLANET';
    }
    if (
      upper === 'HOUSE' ||
      upper === 'BHAVA' ||
      upper.endsWith('_HOUSE') ||
      upper.endsWith('_LORD')
    ) {
      return 'HOUSE';
    }
    if (upper === 'ASPECT') return 'ASPECT';
    if (upper === 'YOGA') return 'YOGA';
    if (upper === 'FUNCTIONAL_ROLE' || upper === 'FUNCTIONAL') return 'FUNCTIONAL_ROLE';
    if (upper === 'STRENGTH' || upper === 'SHADBALA' || upper === 'PLANETARY_STRENGTH') return 'STRENGTH';
    if (upper === 'DASHA' || upper === 'VIMSHOTTARI') return 'DASHA';
    if (upper === 'D9' || upper === 'NAVAMSA') return 'D9';
    if (upper === 'D10' || upper === 'DASAMSA') return 'D10';
    if (upper === 'D2' || upper === 'HORA') return 'D2';
    if (upper === 'WEALTH') return 'WEALTH';
    if (upper === 'CAREER') return 'CAREER';
    if (upper === 'TRANSIT' || upper === 'GOCHARA') return 'TRANSIT';
    if (upper === 'LIFE_THEME' || upper === 'THEME') return 'LIFE_THEME';
  }
  return 'UNKNOWN';
}

function isEvidenceEqual(a: AiEvidence, b: AiEvidence): boolean {
  if (
    a.id !== b.id ||
    a.source !== b.source ||
    a.effect !== b.effect ||
    a.strength !== b.strength ||
    a.statement !== b.statement ||
    a.ruleId !== b.ruleId ||
    a.priority !== b.priority ||
    a.dimension !== b.dimension ||
    a.conditional !== b.conditional ||
    a.varga !== b.varga ||
    a.dashaLevel !== b.dashaLevel ||
    a.timingPlanet !== b.timingPlanet ||
    a.vargaRelationship !== b.vargaRelationship ||
    a.timingReason !== b.timingReason ||
    a.timingRelevanceType !== b.timingRelevanceType
  ) {
    return false;
  }

  const aPlanets = a.planets || [];
  const bPlanets = b.planets || [];
  if (aPlanets.length !== bPlanets.length) return false;
  for (let i = 0; i < aPlanets.length; i++) {
    if (aPlanets[i] !== bPlanets[i]) return false;
  }

  const aHouses = a.houses || [];
  const bHouses = b.houses || [];
  if (aHouses.length !== bHouses.length) return false;
  for (let i = 0; i < aHouses.length; i++) {
    if (aHouses[i] !== bHouses[i]) return false;
  }

  const aTimingHouses = a.timingHouses || [];
  const bTimingHouses = b.timingHouses || [];
  if (aTimingHouses.length !== bTimingHouses.length) return false;
  for (let i = 0; i < aTimingHouses.length; i++) {
    if (aTimingHouses[i] !== bTimingHouses[i]) return false;
  }

  return true;
}

function mapPolarityToAiEffect(polarity: unknown): AiEvidenceEffect {
  if (polarity === 'SUPPORTING' || polarity === 'SUPPORT') return 'SUPPORT';
  if (polarity === 'CHALLENGING' || polarity === 'CHALLENGE') return 'CHALLENGE';
  if (polarity === 'NEUTRAL') return 'NEUTRAL';
  if (polarity === 'MIXED') return 'MIXED';
  return 'UNKNOWN';
}

export function projectDomainEvidenceToAi(evidence: DomainEvidence): AiEvidence {
  const e = evidence as any;
  const source = mapToAiEvidenceSource(e.evidenceFamily || e.sourceType || e.source);
  const strength = normalizeEvidenceStrength(e.strength);
  const effect = mapPolarityToAiEffect(e.polarity ?? e.effect);
  const statement = String(e.statement || '');
  const ruleId = e.ruleId ? String(e.ruleId) : undefined;

  let priority: AiEvidencePriority | undefined = undefined;
  if (
    e.priority === 'PRIMARY' ||
    e.priority === 'SECONDARY' ||
    e.priority === 'CONFIRMATORY' ||
    e.priority === 'TIMING'
  ) {
    priority = e.priority;
  } else if (e.role === 'PRIMARY') {
    priority = 'PRIMARY';
  } else if (e.role === 'SECONDARY') {
    priority = 'SECONDARY';
  } else if (e.role === 'CONFIRMATION') {
    priority = 'CONFIRMATORY';
  } else if (e.role === 'TIMING') {
    priority = 'TIMING';
  }

  let dimension: AiEvidenceDimension | undefined = undefined;
  if (
    e.dimension === 'NATAL_STRUCTURE' ||
    e.dimension === 'MODIFIER' ||
    e.dimension === 'CONFIRMATION' ||
    e.dimension === 'TIMING'
  ) {
    dimension = e.dimension;
  } else if (e.phase === 'NATAL_PROMISE') {
    dimension = 'NATAL_STRUCTURE';
  } else if (e.phase === 'VARGA_CONFIRMATION') {
    dimension = 'CONFIRMATION';
  } else if (e.phase === 'TIMING_TRIGGER' || e.phase === 'DASHA_ACTIVATION') {
    dimension = 'TIMING';
  } else if (e.phase === 'MODIFIER' || e.role === 'MODIFIER') {
    dimension = 'MODIFIER';
  }

  const conditional =
    e.polarity === 'CONDITIONAL' || e.conditional === true ? true : undefined;

  let varga: 'D9' | 'D10' | undefined = undefined;
  const vargaVal =
    e.vargaEvidence?.varga ||
    e.varga ||
    (e.source === 'D10' || e.source === 'D9' ? e.source : undefined);
  if (vargaVal === 'D10' || vargaVal === 'D9') {
    varga = vargaVal;
  }

  const vargaRelationship =
    e.vargaRelationship || e.vargaEvidence?.relationship;

  let dashaLevel: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | undefined = undefined;
  const dashaVal =
    e.timingEvidence?.dashaLevel ||
    e.dashaLevel ||
    (e.timing?.period === 'MD' || e.timing?.level === 'MD'
      ? 'MAHADASHA'
      : e.timing?.period === 'AD' || e.timing?.level === 'AD'
        ? 'ANTARDASHA'
        : e.timing?.period === 'PD' || e.timing?.level === 'PD'
          ? 'PRATYANTARDASHA'
          : undefined);
  if (
    dashaVal === 'MAHADASHA' ||
    dashaVal === 'ANTARDASHA' ||
    dashaVal === 'PRATYANTARDASHA'
  ) {
    dashaLevel = dashaVal;
  }

  let timingPlanet: Planet | undefined = undefined;
  const tPlanet = e.timingEvidence?.planet || e.timingPlanet || e.timing?.planet;
  if (tPlanet && PLANET_ORDER.includes(tPlanet)) {
    timingPlanet = tPlanet;
  } else if (e.timing?.periodKey && PLANET_ORDER.includes(e.timing.periodKey as Planet)) {
    timingPlanet = e.timing.periodKey as Planet;
  }

  const planets = e.planets && e.planets.length > 0 ? [...e.planets] : undefined;
  const houses = e.houses && e.houses.length > 0 ? [...e.houses] : undefined;
  const timingHouses =
    e.timingEvidence?.houses?.length
      ? [...e.timingEvidence.houses]
      : e.timingHouses?.length
        ? [...e.timingHouses]
        : undefined;
  const timingReason =
    e.timingEvidence?.relevanceReason || e.timingReason || undefined;
  const timingRelevanceType =
    e.timingEvidence?.relevanceType || e.timingRelevanceType || undefined;

  return {
    id: String(e.id),
    source,
    effect,
    strength,
    statement,
    ...(planets ? { planets } : {}),
    ...(houses ? { houses } : {}),
    ...(ruleId ? { ruleId } : {}),
    ...(priority ? { priority } : {}),
    ...(dimension ? { dimension } : {}),
    ...(conditional !== undefined ? { conditional } : {}),
    ...(varga ? { varga } : {}),
    ...(vargaRelationship ? { vargaRelationship } : {}),
    ...(dashaLevel ? { dashaLevel } : {}),
    ...(timingPlanet ? { timingPlanet } : {}),
    ...(timingHouses ? { timingHouses } : {}),
    ...(timingReason ? { timingReason } : {}),
    ...(timingRelevanceType ? { timingRelevanceType } : {})
  };
}

export function buildEvidenceFromDomainInterpretations(
  interpretations: readonly DomainInterpretation[]
): readonly AiEvidence[] {
  const evidenceMap = new Map<string, AiEvidence>();

  for (const interpretation of interpretations) {
    for (const item of interpretation.evidence || []) {
      const projected = projectDomainEvidenceToAi(item);
      const existing = evidenceMap.get(projected.id);
      if (existing) {
        if (!isEvidenceEqual(existing, projected)) {
          throw new Error(`Cannot build AiContext: conflicting evidence id ${projected.id}`);
        }
        continue;
      }
      evidenceMap.set(projected.id, projected);
    }
  }

  return Array.from(evidenceMap.values());
}

export function projectDashaEvidenceToAi(e: DashaInterpretationEvidence): AiEvidence {
  const planetsStr = (e.planets || []).join(',');
  const housesStr = (e.houses || []).join(',');
  const ruleId = e.ruleId ? String(e.ruleId) : '';
  const level = String(e.level || '');
  const statement = String(e.statement || '');
  const effect = normalizeEvidenceEffect(e.effect);
  const id = `DASHA:${level}:${ruleId}:${planetsStr}:${housesStr}:${effect}`;
  const strength = normalizeEvidenceStrength((e as any).strength);
  const dashaLevel =
    e.level === 'MAHADASHA' || e.level === 'ANTARDASHA' || e.level === 'PRATYANTARDASHA'
      ? e.level
      : undefined;

  const planets = e.planets && e.planets.length > 0 ? [...e.planets] : undefined;
  const houses = e.houses && e.houses.length > 0 ? [...e.houses] : undefined;
  const timingPlanet = planets && planets.length > 0 ? planets[0] : undefined;

  return {
    id,
    source: 'DASHA',
    effect,
    strength,
    statement,
    ...(planets ? { planets } : {}),
    ...(houses ? { houses } : {}),
    ...(ruleId ? { ruleId } : {}),
    priority: 'TIMING',
    dimension: 'TIMING',
    ...(dashaLevel ? { dashaLevel } : {}),
    ...(timingPlanet ? { timingPlanet } : {})
  };
}

export function buildDashaEvidence(
  current: ActiveDashaInterpretation | undefined
): readonly AiEvidence[] {
  if (!current) {
    return [];
  }

  const rawList: DashaInterpretationEvidence[] = [
    ...(current.evidence || []),
    ...(current.mahadasha?.natal?.evidence || []),
    ...(current.mahadasha?.evidence || []),
    ...(current.antardasha?.natal?.evidence || []),
    ...(current.antardasha?.evidence || []),
    ...(current.pratyantardasha?.natal?.evidence || []),
    ...(current.pratyantardasha?.evidence || []),
    ...(current.antardasha?.pairInterpretation?.relationshipEvidence || [])
  ];

  const evidenceMap = new Map<string, AiEvidence>();
  for (const raw of rawList) {
    const item = projectDashaEvidenceToAi(raw);
    const existing = evidenceMap.get(item.id);
    if (existing) {
      if (!isEvidenceEqual(existing, item)) {
        throw new Error(`Cannot build AiContext: conflicting evidence id ${item.id}`);
      }
      continue;
    }
    evidenceMap.set(item.id, item);
  }

  return Array.from(evidenceMap.values());
}

function buildLifeThemeEvidence(horoscope: Horoscope): readonly AiEvidence[] {
  const evidenceMap = new Map<string, AiEvidence>();
  const themes = horoscope.lifeThemes?.themes || [];
  for (const t of themes) {
    const themeName = String(t.theme || '');
    for (const e of t.evidence || []) {
      const source = mapToAiEvidenceSource(e.source);
      const strength = normalizeEvidenceStrength(e.strength);
      const effect = normalizeEvidenceEffect(e.effect);
      const statement = String(e.statement || '');
      const planetsStr = (e.planets || []).join(',');
      const housesStr = (e.houses || []).join(',');
      const ruleId = e.ruleId ? String(e.ruleId) : '';
      const id = `LIFE_THEME:${themeName}:${ruleId}:${statement}:${planetsStr}:${housesStr}`;

      const item: AiEvidence = {
        id,
        source,
        effect,
        strength,
        statement,
        ...(e.planets && e.planets.length > 0 ? { planets: [...e.planets] } : {}),
        ...(e.houses && e.houses.length > 0 ? { houses: [...e.houses] } : {}),
        ...(ruleId ? { ruleId } : {})
      };

      const existing = evidenceMap.get(id);
      if (existing) {
        if (!isEvidenceEqual(existing, item)) {
          throw new Error(`Cannot build AiContext: conflicting evidence id ${id}`);
        }
        continue;
      }
      evidenceMap.set(id, item);
    }
  }
  return Array.from(evidenceMap.values());
}

export function buildAiContext(horoscope: Horoscope, options?: BuildAiContextOptions): AiContext {
  const source: AiContextSource = {
    engine: 'CORE_ASTRO',
    deterministic: true,
    astrologySystem: 'VEDIC'
  };

  const methodology: AiContextMethodology = {
    zodiac: 'SIDEREAL',
    ayanamsa: 'LAHIRI',
    houseSystem: 'WHOLE_SIGN',
    dashaSystem: 'VIMSHOTTARI',
    aspectSystem: 'PARASHARI'
  };

  const ascendant = buildAscendantFact(horoscope);
  const planets = buildPlanetFacts(horoscope);
  const houses = buildHouseFacts(horoscope);
  const yogas = buildYogaFacts(horoscope);
  const dasha = buildDashaFacts(horoscope);
  const divisional = buildDivisionalFacts(horoscope);
  const lifeThemes = buildLifeThemeFacts(horoscope);

  // Use pre-computed domain interpretations if provided, otherwise resolve once from registry
  const rawDomainInterpretations: readonly DomainInterpretation[] =
    options?.domainInterpretations && options.domainInterpretations.length > 0
      ? options.domainInterpretations
      : (() => {
          const registry = createDefaultDomainInterpreterRegistry();
          return [
            registry.get('CAREER').interpret(horoscope),
            registry.get('WEALTH').interpret(horoscope)
          ];
        })();

  const careerInterpretation = rawDomainInterpretations.find((d) => d.domain === 'CAREER');
  const wealthInterpretation = rawDomainInterpretations.find((d) => d.domain === 'WEALTH');
  const asOf = horoscope.dashaInterpretation?.current?.asOf;

  const career = buildCareerFact(horoscope, careerInterpretation, asOf);
  const wealth = buildWealthFact(horoscope, wealthInterpretation, asOf);

  const domainInterpretations: readonly DomainInterpretationAiProjection[] =
    rawDomainInterpretations.map(projectDomainInterpretationForAi);

  const lifeAnalysisValue: LifeAnalysis =
    options?.lifeAnalysis ?? synthesizeLifeAnalysis(rawDomainInterpretations);

  const projectedLifeAnalysis = projectLifeAnalysisForAi(lifeAnalysisValue);

  // Build unified evidence universe: Canonical DomainInterpretation evidence + Life Themes evidence + Dasha interpretation evidence
  const domainEvidenceList = buildEvidenceFromDomainInterpretations(rawDomainInterpretations);
  const lifeThemeEvidenceList = buildLifeThemeEvidence(horoscope);
  const dashaEvidenceList = buildDashaEvidence(horoscope.dashaInterpretation?.current);

  const evidenceMap = new Map<string, AiEvidence>();
  for (const item of domainEvidenceList) {
    evidenceMap.set(item.id, item);
  }
  for (const item of lifeThemeEvidenceList) {
    const existing = evidenceMap.get(item.id);
    if (existing) {
      if (!isEvidenceEqual(existing, item)) {
        throw new Error(`Cannot build AiContext: conflicting evidence id ${item.id}`);
      }
      continue;
    }
    evidenceMap.set(item.id, item);
  }
  for (const item of dashaEvidenceList) {
    const existing = evidenceMap.get(item.id);
    if (existing) {
      if (!isEvidenceEqual(existing, item)) {
        throw new Error(`Cannot build AiContext: conflicting evidence id ${item.id}`);
      }
      continue;
    }
    evidenceMap.set(item.id, item);
  }
  const evidence = Array.from(evidenceMap.values());

  // Net invariant assertion: every context.domainInterpretations[].evidence[].id MUST exist in context.evidence
  for (const di of domainInterpretations) {
    for (const e of di.evidence) {
      if (!evidenceMap.has(e.id)) {
        throw new Error(
          `Invariant violation: domain interpretation evidence id '${e.id}' not found in context.evidence`
        );
      }
    }
  }

  if (dasha.interpretation) {
    for (const evId of dasha.interpretation.evidenceIds) {
      if (!evidenceMap.has(evId)) {
        throw new Error(
          `Invariant violation: dasha interpretation evidence id '${evId}' not found in context.evidence`
        );
      }
    }
    if (dasha.interpretation.mahadasha) {
      for (const evId of dasha.interpretation.mahadasha.evidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: dasha mahadasha evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
    if (dasha.interpretation.antardasha) {
      for (const evId of dasha.interpretation.antardasha.evidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: dasha antardasha evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
    if (dasha.interpretation.pratyantardasha) {
      for (const evId of dasha.interpretation.pratyantardasha.evidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: dasha pratyantardasha evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
    if (dasha.interpretation.pair) {
      for (const evId of dasha.interpretation.pair.relationshipEvidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: dasha pair evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
  }

  if (career?.timing) {
    const timing = career.timing;
    for (const p of [timing.mahadasha, timing.antardasha, timing.pratyantardasha]) {
      if (p) {
        for (const evId of p.evidenceIds) {
          if (!evidenceMap.has(evId)) {
            throw new Error(
              `Invariant violation: career timing evidence id '${evId}' not found in context.evidence`
            );
          }
        }
      }
    }
    if (timing.hierarchy?.evidenceIds) {
      for (const evId of timing.hierarchy.evidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: career timing hierarchy evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
  }

  if (wealth?.timing) {
    const timing = wealth.timing;
    for (const p of [timing.mahadasha, timing.antardasha, timing.pratyantardasha]) {
      if (p) {
        for (const evId of p.evidenceIds) {
          if (!evidenceMap.has(evId)) {
            throw new Error(
              `Invariant violation: wealth timing evidence id '${evId}' not found in context.evidence`
            );
          }
        }
      }
    }
    if (timing.hierarchy?.evidenceIds) {
      for (const evId of timing.hierarchy.evidenceIds) {
        if (!evidenceMap.has(evId)) {
          throw new Error(
            `Invariant violation: wealth timing hierarchy evidence id '${evId}' not found in context.evidence`
          );
        }
      }
    }
  }

  const context: AiContext = {
    schemaVersion: AI_CONTEXT_SCHEMA_VERSION,
    source,
    ascendant,
    planets,
    houses,
    yogas,
    dasha,
    divisional,
    ...(career ? { career } : {}),
    ...(wealth ? { wealth } : {}),
    lifeThemes,
    evidence,
    methodology,
    domainInterpretations,
    lifeAnalysis: projectedLifeAnalysis
  };

  return deepFreeze(context);
}
