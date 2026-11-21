import {
  Planet,
  Sign,
  Modality,
  Nakshatra,
  Pada,
  NakshatraResult,
  ChartType,
  DashaSystem,
  PlanetMotion,
  PlanetPosition,
  PlanetCondition,
  DignityStatus,
  PlanetDignity,
  PlanetState,
  PlanetFacts,
  PlanetFact,
  Relationship,
  AyanamsaType,
  BirthDetails,
  Chart,
  Horoscope
} from '../types';
import { assertValidBirthDetails } from '../core/validation/birthDetailsValidation';
import {
  SIGNS_METADATA,
  SIGNS_ORDER,
  NAKSHATRAS_METADATA,
  EXALTATION_DATA,
  DEBILITATION_DATA,
  MOOLATRIKONA_DATA,
  OWN_SIGNS_DATA,
  NATURAL_FRIENDS,
  NATURAL_ENEMIES,
  PLANETS_METADATA
} from '../data/astroData';

import { calculateVimshottari } from './dasha/vimshottari';
import { analyzeHouseLordship } from './houseLordship/houseLordship';
import { analyzeYogas } from './yoga/yogaEngine';
import { analyzeNatalGrahaDrishti } from './natalGrahaDrishti';
import { analyzePlanets } from './planetAnalysis';
import { analyzeHouses } from './houseAnalysis';
import { analyzeFunctionalNatureIntegration } from './functionalNature/functionalNatureIntegration';
import { analyzeFunctionalRoles } from './functionalNature/functionalRoles';
import { analyzePlanetaryStrength } from './planetaryStrength/planetaryStrength';
import { analyzePlanetInterpretation } from './planetInterpretation/planetInterpretation';
import { analyzeHouseInterpretation } from './houseInterpretation/houseInterpretation';
import { analyzeDashaInterpretation, analyzeActiveDasha } from './dashaInterpretation/dashaInterpretation';
import {
  DashaInterpretationInput,
  DashaInterpretationReport
} from './dashaInterpretation/dashaInterpretationTypes';
import { analyzeDivisionalInterpretation } from './divisionalInterpretation/divisionalInterpretation';
import { analyzeLifeThemes } from './lifeThemes/lifeThemes';
import { synthesizeChart } from './chartSynthesis/chartSynthesis';
import { buildFullNatalAnalysis } from './fullNatalAnalysis/fullNatalAnalysis';
import { interpretCareerTheme } from './themeInterpretation/themeInterpretation';
import { interpretWealthTheme } from './themeInterpretation/wealthThemeInterpretation';
import { calculateNakshatra, normalizeDegree } from './nakshatraUtils';
import {
  calculateSign,
  calculateWholeSignHouse,
  calculateNaturalRelationship,
  getDivisionalLongitude
} from './chartMath';
import {
  calculateJulianDay,
  parseUtcDate,
  getAyanamsaOffset,
  getSunTropicalLongitude
} from './solarTime';

export {
  calculateNakshatra,
  normalizeDegree,
  calculateSign,
  calculateNaturalRelationship,
  getDivisionalLongitude,
  calculateJulianDay,
  parseUtcDate,
  getAyanamsaOffset
};

import { calculateDignity } from './planetaryDignity';
export { calculateDignity };
import { swissEphemerisAdapter } from './ephemeris/swissEphemerisAdapter';

/**
 * Calculates combustion (Asta) condition relative to the Sun.
 */
export function calculateCombustion(
  planet: Planet,
  planetLongitude: number,
  sunLongitude: number,
  motion: PlanetMotion
): PlanetState {
  if (planet === Planet.SUN) {
    return {
      planet,
      motion,
      condition: PlanetCondition.NORMAL
    };
  }

  if (planet === Planet.RAHU || planet === Planet.KETU) {
    return {
      planet,
      motion,
      condition: PlanetCondition.NORMAL
    };
  }

  let dist = Math.abs(normalizeDegree(planetLongitude - sunLongitude));
  if (dist > 180) dist = 360 - dist;

  // Standard classical combustion orbs (degrees)
  const combustionOrbs: Record<string, { combust: number; deeply: number }> = {
    [Planet.MOON]: { combust: 12, deeply: 3 },
    [Planet.MARS]: { combust: 17, deeply: 4 },
    [Planet.MERCURY]: { combust: 12, deeply: 3 },
    [Planet.JUPITER]: { combust: 11, deeply: 3 },
    [Planet.VENUS]: { combust: 10, deeply: 2 },
    [Planet.SATURN]: { combust: 15, deeply: 4 },
  };

  const orb = combustionOrbs[planet] || { combust: 12, deeply: 3 };
  let condition = PlanetCondition.NORMAL;

  if (dist <= orb.deeply) {
    condition = PlanetCondition.DEEP_COMBUST;
  } else if (dist <= orb.combust) {
    condition = PlanetCondition.COMBUST;
  }

  return {
    planet,
    motion,
    condition
  };
}



/**
 * Calculates Tropical Ecliptic Longitudes for planets given Julian Day.
 */
function computeTropicalPositions(jd: number): Record<Planet, { long: number; radius: number }> {
  const positions = swissEphemerisAdapter.tropicalPositions(jd);
  const result = {} as Record<Planet, { long: number; radius: number }>;
  for (const planet of Object.values(Planet)) {
    result[planet] = { long: positions[planet].longitude, radius: 1 };
  }
  return result;
}

export function calculateSiderealLuminaries(
  date: Date,
  ayanamsa: AyanamsaType = AyanamsaType.LAHIRI
): { sunLongitude: number; moonLongitude: number } {
  const jd = calculateJulianDay(date);
  const positions = computeTropicalPositions(jd);
  const ayanamsaShift = getAyanamsaOffset(ayanamsa, date);
  return {
    sunLongitude: normalizeDegree(positions[Planet.SUN].long - ayanamsaShift),
    moonLongitude: normalizeDegree(positions[Planet.MOON].long - ayanamsaShift)
  };
}

/**
 * Generates astronomical positions for the 9 Vedic planets based on birth details.
 */
export function generatePlanetaryPositions(birthDetails: BirthDetails): Record<Planet, PlanetPosition> {
  const date = parseUtcDate(birthDetails.dateTimeStr);
  const jd = calculateJulianDay(date);
  const ayanamsaShift = getAyanamsaOffset(birthDetails.ayanamsa, date);
  const pos = computeTropicalPositions(jd);
  const speeds = swissEphemerisAdapter.tropicalPositions(jd);

  const result: Partial<Record<Planet, PlanetPosition>> = {};

  Object.values(Planet).forEach((planet) => {
    const siderealLong = normalizeDegree(pos[planet].long - ayanamsaShift);
    const speed = speeds[planet].longitudeSpeed;

    const isNode = planet === Planet.RAHU || planet === Planet.KETU;
    const retrograde = isNode ? true : speed < 0;

    const sign = calculateSign(siderealLong);
    const signLongitude = siderealLong % 30;
    result[planet] = {
      planet,
      eclipticLongitude: siderealLong,
      siderealLongitude: siderealLong,
      longitude: siderealLong,
      sign,
      house: 1,
      signLongitude,
      eclipticLatitude: speeds[planet].latitude,
      motion: {
        speed,
        retrograde,
        stationary: Math.abs(speed) < 0.005
      }
    };
  });

  return result as Record<Planet, PlanetPosition>;
}

/**
 * Calculates Lagna (Ascendant) longitude using Local Sidereal Time and Geographic Latitude.
 */
export function calculateAscendant(birthDetails: BirthDetails): number {
  const date = parseUtcDate(birthDetails.dateTimeStr);
  const jd = calculateJulianDay(date);
  const ascTropicalDeg = swissEphemerisAdapter.ascendantTropical(
    jd,
    birthDetails.latitude,
    birthDetails.longitude
  );
  const ayanamsaShift = getAyanamsaOffset(birthDetails.ayanamsa, date);
  return normalizeDegree(ascTropicalDeg - ayanamsaShift);
}

/**
 * Constructs a divisional position with consistent positional metadata
 * derived from its own divisional longitude.
 */
export function createDivisionalPosition(
  original: PlanetPosition,
  divisionalLongitude: number,
  ascendantSign: Sign
): PlanetPosition {
  const sign = calculateSign(divisionalLongitude);
  return {
    planet: original.planet,
    eclipticLongitude: divisionalLongitude,
    siderealLongitude: divisionalLongitude,
    longitude: divisionalLongitude,
    sign,
    house: calculateWholeSignHouse(ascendantSign, sign),
    signLongitude: divisionalLongitude % 30,
    eclipticLatitude: original.eclipticLatitude ?? 0,
    motion: original.motion
  };
}

export interface CalculateHoroscopeOptions {
  customPositions?: Record<Planet, PlanetPosition>;
  asOf?: string | Date;
}

/**
 * Constructs a complete Horoscope object with all derived facts and vargas.
 */
export function calculateHoroscope(
  birthDetails: BirthDetails,
  customPositionsOrOptions?: Record<Planet, PlanetPosition> | CalculateHoroscopeOptions,
  asOfParam?: string | Date
): Horoscope {
  // Validate birth details at engine boundary to prevent invalid input from reaching deterministic engine
  assertValidBirthDetails(birthDetails);

  let customPositions: Record<Planet, PlanetPosition> | undefined;
  let asOf: string | Date | undefined;

  if (customPositionsOrOptions) {
    if ('customPositions' in customPositionsOrOptions || 'asOf' in customPositionsOrOptions) {
      const opts = customPositionsOrOptions as CalculateHoroscopeOptions;
      customPositions = opts.customPositions;
      asOf = opts.asOf ?? asOfParam;
    } else {
      customPositions = customPositionsOrOptions as Record<Planet, PlanetPosition>;
      asOf = asOfParam;
    }
  } else {
    asOf = asOfParam;
  }

  const resolvedAsOf = asOf ? (typeof asOf === 'string' ? new Date(asOf) : asOf) : undefined;

  const positions = customPositions || generatePlanetaryPositions(birthDetails);

  // Validate Moon position early (fail-closed before any loops access positions)
  const moonPos = positions[Planet.MOON];
  if (!moonPos) {
    throw new TypeError('Moon position is required for Vimshottari Dasha calculation.');
  }
  const moonLong = moonPos.eclipticLongitude ?? moonPos.longitude;
  if (typeof moonLong !== 'number' || isNaN(moonLong) || !isFinite(moonLong)) {
    throw new TypeError('Moon longitude must be a finite number for Vimshottari Dasha calculation.');
  }

  const ascendantLong = calculateAscendant(birthDetails);
  const ascendantSign = calculateSign(ascendantLong);

  // Generate divisional charts
  const createChart = (type: ChartType): Chart => {
    const chartAsc = getDivisionalLongitude(ascendantLong, type);
    const chartAscendantSign = calculateSign(chartAsc);
    const chartPositions = {} as Record<Planet, PlanetPosition>;

    Object.values(Planet).forEach((p) => {
      const originalPosition = positions[p]!;
      const originalLongitude = originalPosition.eclipticLongitude ?? originalPosition.longitude ?? 0;
      const divisionalLongitude = getDivisionalLongitude(originalLongitude, type);

      if (type === ChartType.RASI) {
        chartPositions[p] = originalPosition;
      } else {
        chartPositions[p] = createDivisionalPosition(
          originalPosition,
          divisionalLongitude,
          chartAscendantSign
        );
      }
    });

    return {
      type,
      chartType: type,
      ascendantLongitude: chartAsc,
      ascendantSign: chartAscendantSign,
      positions: chartPositions
    } as any;
  };

  const rasiChart = createChart(ChartType.RASI);
  const charts: Record<ChartType, Chart> = {
    [ChartType.RASI]: rasiChart,
    [ChartType.DREKKANA]: createChart(ChartType.DREKKANA),
    [ChartType.NAVAMSA]: createChart(ChartType.NAVAMSA),
    [ChartType.DASAMSA]: createChart(ChartType.DASAMSA),
  };

  // Derive PlanetFacts for Rasi Chart
  const planetFacts: Partial<Record<Planet, PlanetFact>> = {};
  const sunPos = positions[Planet.SUN]!;
  const sunLong = sunPos.eclipticLongitude ?? sunPos.longitude ?? 0;
  const ascSignNumber = SIGNS_METADATA[ascendantSign]?.number ?? 1;

  Object.values(Planet).forEach((planet) => {
    const pos = positions[planet]!;
    const planetLong = pos.eclipticLongitude ?? pos.longitude ?? 0;
    const sign = calculateSign(planetLong);
    const signMeta = SIGNS_METADATA[sign]!;
    const signDegree = planetLong % 30;

    const nakshatraRes = calculateNakshatra(planetLong);
    const nakshatraMeta = NAKSHATRAS_METADATA.find(n => n.nakshatra === nakshatraRes.nakshatra)!;

    const dignity = calculateDignity(planet, sign, signDegree);
    const motion = pos.motion;
    const state = calculateCombustion(planet, planetLong, sunLong, motion);

    // Calculate house index from Lagna (Whole Sign)
    let house = ((signMeta.number ?? 1) - ascSignNumber + 1);
    if (house <= 0) house += 12;

    planetFacts[planet] = {
      planet,
      position: pos,
      sign,
      signMetadata: signMeta,
      nakshatraResult: nakshatraRes,
      nakshatraMetadata: nakshatraMeta,
      state,
      dignity,
      house
    };
  });

  const vimshottari = calculateVimshottari({
    birthDateTime: birthDetails.dateTimeStr,
    moonSiderealLongitude: moonLong
  });

  const houseLordship = analyzeHouseLordship(ascendantSign);
  const natalGrahaDrishti = analyzeNatalGrahaDrishti(planetFacts as any);
  const planetAnalysis = analyzePlanets({
    planetFacts: planetFacts as any,
    natalGrahaDrishti
  });
  const houseAnalysis = analyzeHouses({
    planetFacts: planetFacts as any,
    planetAnalysis,
    houseLordship
  });
  const functionalRoles = analyzeFunctionalRoles(
    (rasiChart as any).ascendantSign ?? (rasiChart.ascendant as any)?.sign ?? Sign.ARIES,
    houseLordship
  );
  const functionalNatureIntegration = analyzeFunctionalNatureIntegration({
    functionalRoles,
    planetAnalysis,
    houseAnalysis
  });
  const planetaryStrength = analyzePlanetaryStrength({
    planetFacts: planetFacts as any,
    birthDetails
  });
  const yogas = analyzeYogas({
    planetFacts: planetFacts as any,
    houseLordship,
    functionalRoles,
    planetaryStrength,
    planetAnalysis,
    natalGrahaDrishti
  });

  const planetInterpretation = analyzePlanetInterpretation({
    planetFacts: planetFacts as any,
    planetAnalysis,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetaryStrength
  });

  const houseInterpretation = analyzeHouseInterpretation({
    houseAnalysis,
    planetAnalysis,
    planetInterpretation,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetaryStrength
  });

  const dashaInterpretationInput: DashaInterpretationInput = {
    vimshottari,
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetAnalysis,
    planetaryStrength
  };

  const dashaUnavailable = vimshottari.mahadashas.length === 0;
  // Keep an empty engine timeline explicitly unavailable; do not invent periods or pass it
  // to the interpretation validator, which correctly requires a populated timeline.
  const rawDashaInterpretation: DashaInterpretationReport = dashaUnavailable
    ? Object.freeze({
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: Object.freeze({
          nakshatra: vimshottari.nakshatra,
          nakshatraLord: vimshottari.nakshatraLord,
          nakshatraProgress: vimshottari.nakshatraProgress,
          remainingFraction: vimshottari.remainingFraction
        }),
        mahadashas: Object.freeze([]),
        confidence: 'LOW',
        availability: 'UNAVAILABLE',
        diagnostics: Object.freeze(['EMPTY_VIMSHOTTARI_TIMELINE'] as const)
      })
    : analyzeDashaInterpretation(dashaInterpretationInput);
  let activeDasha = null;
  if (!dashaUnavailable && resolvedAsOf && !isNaN(resolvedAsOf.getTime())) {
    try {
      activeDasha = analyzeActiveDasha(dashaInterpretationInput, resolvedAsOf);
    } catch {
      activeDasha = null;
    }
  }

  const dashaInterpretation: DashaInterpretationReport = Object.freeze({
    ...rawDashaInterpretation,
    ...(activeDasha ? { current: activeDasha } : {})
  });

  const divisionalInterpretation = analyzeDivisionalInterpretation({
    d1Chart: rasiChart,
    d9Chart: charts[ChartType.NAVAMSA],
    d10Chart: charts[ChartType.DASAMSA],
    planetFacts: planetFacts as any,
    planetInterpretation,
    functionalRoles
  });

  const lifeThemes = analyzeLifeThemes({
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    yogas,
    natalGrahaDrishti,
    dashaInterpretation,
    divisionalInterpretation
  });

  const chartSynthesis = synthesizeChart({
    lifeThemes
  });

  const careerTheme = interpretCareerTheme({
    planetAnalysis,
    houseAnalysis,
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    yogas,
    planetaryStrength,
    divisionalInterpretation,
    dashaInterpretation,
    natalGrahaDrishti
  });

  const wealthTheme = interpretWealthTheme({
    planetAnalysis,
    houseAnalysis,
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    yogas,
    planetaryStrength,
    divisionalInterpretation,
    dashaInterpretation,
    natalGrahaDrishti
  });

  const partialHoroscope: any = {
    birthDetails,
    rasiChart,
    charts,
    planetFacts: planetFacts as any,
    vimshottari,
    houseLordship,
    yogas,
    natalGrahaDrishti,
    planetAnalysis,
    houseAnalysis,
    functionalNatureIntegration,
    functionalRoles,
    planetaryStrength,
    planetInterpretation,
    houseInterpretation,
    dashaInterpretation,
    divisionalInterpretation,
    lifeThemes,
    chartSynthesis,
    themeInterpretationV2: {
      career: careerTheme,
      wealth: wealthTheme
    }
  } as Horoscope;

  const fullNatalAnalysis = buildFullNatalAnalysis({
    horoscope: partialHoroscope,
    lifeThemes,
    chartSynthesis
  });

  return {
    ...partialHoroscope,
    fullNatalAnalysis
  };
}
