import { Horoscope, Planet, Sign } from '../../types';
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
  AiEvidenceSource,
  AiEvidenceStrength,
  AscendantFact,
  CareerFact,
  DashaFacts,
  DashaPeriodFact,
  DivisionalFact,
  DivisionalFacts,
  HouseFactSummary,
  LifeThemeFact,
  PlanetFactSummary,
  WealthFact,
  WealthSubthemeFact,
  YogaFactSummary
} from '../types/aiContextTypes';
import type { WealthSubthemeKey } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import { deepFreeze } from './deepFreeze';

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
  const yogas = horoscope.yogas?.yogas || [];
  return yogas.map((y: any) => {
    const rawStatus = y.assessment?.finalStatus || y.finalStatus || 'PRESENT';
    const rawStrength = y.assessment?.strength || y.strength;
    const planets: readonly Planet[] = [...(y.planets || [])];
    const houses: readonly number[] = (y.houses || []).filter(
      (h: unknown): h is number => typeof h === 'number'
    );

    return {
      type: String(y.type),
      category: String(y.category),
      status: String(rawStatus),
      ...(rawStrength ? { strength: String(rawStrength) } : {}),
      planets,
      houses
    };
  });
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

  return {
    system: 'VIMSHOTTARI',
    periods,
    active
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
        confidence: (d9Interp.confidence || 'HIGH') as AiConfidence
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
        confidence: (d10Interp.confidence || 'HIGH') as AiConfidence
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

function mapThemeEffectToStatus(effect: string | undefined): 'STRONGLY_SUPPORTED' | 'SUPPORTED' | 'MIXED' | 'CHALLENGED' | 'LIMITED_EVIDENCE' {
  switch (effect) {
    case 'SUPPORT':
      return 'SUPPORTED';
    case 'CHALLENGE':
      return 'CHALLENGED';
    case 'MIXED':
      return 'MIXED';
    case 'NEUTRAL':
    default:
      return 'LIMITED_EVIDENCE';
  }
}

function buildCareerFact(horoscope: Horoscope): CareerFact | undefined {
  const career = horoscope.themeInterpretationV2?.career;
  if (!career) {
    return undefined;
  }

  return {
    status: career.conclusion.status,
    confidence: career.conclusion.confidence as AiConfidence,
    natalPromise: career.careerNatalPromise.status,
    d10Relationship: career.metadata.vargaConfirmationStatus,
    supportingFactors: [...career.conclusion.keySupportingFactors],
    challengingFactors: [...career.conclusion.keyChallengingFactors],
    conditionalFactors: [...career.conclusion.keyConditionalFactors]
  };
}

function buildWealthFact(horoscope: Horoscope): WealthFact | undefined {
  const wealth = horoscope.themeInterpretationV2?.wealth;
  if (!wealth) {
    return undefined;
  }

  const subthemeKeys: readonly WealthSubthemeKey[] = [
    'ACCUMULATION',
    'GAINS',
    'FORTUNE',
    'SPECULATION'
  ];
  const subthemes: WealthSubthemeFact[] = [];

  if (wealth.subthemes) {
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

  return {
    status: wealth.conclusion.status,
    confidence: wealth.conclusion.confidence as AiConfidence,
    subthemes,
    supportingFactors: [...wealth.conclusion.keySupportingFactors],
    challengingFactors: [...wealth.conclusion.keyChallengingFactors],
    conditionalFactors: [...wealth.conclusion.keyConditionalFactors]
  };
}

function buildLifeThemeFacts(horoscope: Horoscope): readonly LifeThemeFact[] {
  const themes = horoscope.lifeThemes?.themes || [];
  return themes.map((t: any) => ({
    theme: String(t.theme),
    effect: (t.effect || 'NEUTRAL') as AiEvidenceEffect,
    confidence: (t.confidence || 'MEDIUM') as AiConfidence,
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
    if (upper === 'PLANET' || upper === 'GRAHA') return 'PLANET';
    if (upper === 'HOUSE' || upper === 'BHAVA') return 'HOUSE';
    if (upper === 'YOGA') return 'YOGA';
    if (upper === 'FUNCTIONAL_ROLE' || upper === 'FUNCTIONAL') return 'FUNCTIONAL_ROLE';
    if (upper === 'STRENGTH' || upper === 'SHADBALA' || upper === 'PLANETARY_STRENGTH') return 'STRENGTH';
    if (upper === 'DASHA' || upper === 'VIMSHOTTARI') return 'DASHA';
    if (upper === 'D9' || upper === 'NAVAMSA') return 'D9';
    if (upper === 'D10' || upper === 'DASAMSA') return 'D10';
    if (upper === 'CAREER') return 'CAREER';
    if (upper === 'WEALTH') return 'WEALTH';
    if (upper === 'LIFE_THEME' || upper === 'THEME') return 'LIFE_THEME';
    const validSources: readonly AiEvidenceSource[] = [
      'PLANET',
      'HOUSE',
      'YOGA',
      'FUNCTIONAL_ROLE',
      'STRENGTH',
      'DASHA',
      'D9',
      'D10',
      'CAREER',
      'WEALTH',
      'LIFE_THEME'
    ];
    if (validSources.includes(upper as AiEvidenceSource)) {
      return upper as AiEvidenceSource;
    }
  }
  return 'UNKNOWN';
}

function buildEvidence(horoscope: Horoscope): readonly AiEvidence[] {
  const themes = horoscope.lifeThemes?.themes || [];
  const evidenceMap = new Map<string, AiEvidence>();

  for (const t of themes) {
    for (const e of t.evidence || []) {
      const source = mapToAiEvidenceSource(e.source);
      const strength = normalizeEvidenceStrength(e.strength);
      const statement = String(e.statement || '');
      const planetsStr = (e.planets || []).join(',');
      const housesStr = (e.houses || []).join(',');
      const ruleId = e.ruleId ? String(e.ruleId) : undefined;
      const id = ruleId || `${source}|${statement}|${planetsStr}|${housesStr}`;

      if (!evidenceMap.has(id)) {
        evidenceMap.set(id, {
          id,
          source,
          effect: (e.effect || 'NEUTRAL') as AiEvidenceEffect,
          strength,
          statement,
          ...(e.planets && e.planets.length > 0 ? { planets: [...e.planets] } : {}),
          ...(e.houses && e.houses.length > 0 ? { houses: [...e.houses] } : {}),
          ...(ruleId ? { ruleId } : {})
        });
      }
    }
  }

  return Array.from(evidenceMap.values());
}

export function buildAiContext(horoscope: Horoscope): AiContext {
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
  const career = buildCareerFact(horoscope);
  const wealth = buildWealthFact(horoscope);
  const lifeThemes = buildLifeThemeFacts(horoscope);
  const evidence = buildEvidence(horoscope);

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
    methodology
  };

  return deepFreeze(context);
}
