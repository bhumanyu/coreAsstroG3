import {
  Planet,
  Sign,
  Modality,
  Nakshatra,
  Pada,
  NakshatraResult,
  ChartType,
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
import { analyzeDashaInterpretation } from './dashaInterpretation/dashaInterpretation';
import { analyzeDivisionalInterpretation } from './divisionalInterpretation/divisionalInterpretation';
import { analyzeLifeThemes } from './lifeThemes/lifeThemes';
import { synthesizeChart } from './chartSynthesis/chartSynthesis';
import { buildFullNatalAnalysis } from './fullNatalAnalysis/fullNatalAnalysis';
import { interpretCareerTheme } from './themeInterpretation/themeInterpretation';
import { interpretWealthTheme } from './themeInterpretation/wealthThemeInterpretation';
import { calculateNakshatra, normalizeDegree } from './nakshatraUtils';
import {
  calculateSign,
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

/**
 * Calculates combustion (Asta) condition relative to the Sun.
 */
export function calculateCombustion(planet: Planet, planetLongitude: number, sunLongitude: number): PlanetState {
  if (planet === Planet.SUN) {
    return {
      planet,
      motion: { speed: 1.0, retrograde: false, stationary: false },
      condition: PlanetCondition.NORMAL
    };
  }

  if (planet === Planet.RAHU || planet === Planet.KETU) {
    return {
      planet,
      motion: { speed: -0.05, retrograde: true, stationary: false },
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
    condition = PlanetCondition.DEEPLY_COMBUST;
  } else if (dist <= orb.combust) {
    condition = PlanetCondition.COMBUST;
  }

  return {
    planet,
    motion: { speed: 1.0, retrograde: false, stationary: false },
    condition
  };
}



/**
 * Calculates Tropical Ecliptic Longitudes for planets given Julian Day.
 */
function computeTropicalPositions(jd: number): Record<Planet, { long: number; radius: number }> {
  const t = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  // Sun
  const mSun = normalizeDegree(357.5291 + 35999.0503 * t);
  const sunLong = getSunTropicalLongitude(jd);
  const rSun = 1.00014 - 0.01671 * Math.cos(toRad(mSun)) - 0.00014 * Math.cos(toRad(2 * mSun));

  // Moon
  const lMoon = normalizeDegree(218.3165 + 481267.8813 * t);
  const mMoon = normalizeDegree(134.9634 + 477198.8675 * t);
  const fMoon = normalizeDegree(93.2721 + 483202.0175 * t);
  const dMoon = normalizeDegree(297.8502 + 445267.2217 * t);
  const cMoon = 6.2886 * Math.sin(toRad(mMoon))
    + 1.2740 * Math.sin(toRad(2 * dMoon - mMoon))
    + 0.6583 * Math.sin(toRad(2 * dMoon))
    + 0.2136 * Math.sin(toRad(2 * mMoon))
    - 0.1851 * Math.sin(toRad(mSun))
    - 0.1143 * Math.sin(toRad(2 * fMoon));
  const moonLong = normalizeDegree(lMoon + cMoon);

  // Helper for planet heliocentric -> geocentric
  const geoLong = (lHelio: number, rHelio: number): number => {
    const x = rHelio * Math.cos(toRad(lHelio)) + rSun * Math.cos(toRad(sunLong));
    const y = rHelio * Math.sin(toRad(lHelio)) + rSun * Math.sin(toRad(sunLong));
    return normalizeDegree(toDeg(Math.atan2(y, x)));
  };

  // Mercury
  const lMer = normalizeDegree(252.2509 + 149472.6741 * t);
  const mMer = normalizeDegree(174.7948 + 149472.5153 * t);
  const cMer = 23.4400 * Math.sin(toRad(mMer)) + 2.9818 * Math.sin(toRad(2 * mMer)) + 0.5255 * Math.sin(toRad(3 * mMer));
  const rMer = 0.3871 / (1 + 0.2056 * Math.cos(toRad(mMer + cMer)));
  const mercuryLong = geoLong(lMer + cMer, rMer);

  // Venus
  const lVen = normalizeDegree(181.9798 + 58517.8156 * t);
  const mVen = normalizeDegree(50.115 + 58517.80387 * t);
  const cVen = 0.7758 * Math.sin(toRad(mVen)) + 0.0033 * Math.sin(toRad(2 * mVen));
  const rVen = 0.7233 / (1 + 0.0067 * Math.cos(toRad(mVen + cVen)));
  const venusLong = geoLong(lVen + cVen, rVen);

  // Mars
  const lMar = normalizeDegree(355.45332 + 19140.2993 * t);
  const mMar = normalizeDegree(19.3730 + 19139.9712 * t);
  const cMar = 10.6912 * Math.sin(toRad(mMar)) + 0.6228 * Math.sin(toRad(2 * mMar)) + 0.0503 * Math.sin(toRad(3 * mMar));
  const rMar = 1.5237 / (1 + 0.0934 * Math.cos(toRad(mMar + cMar)));
  const marsLong = geoLong(lMar + cMar, rMar);

  // Jupiter
  const lJup = normalizeDegree(34.40438 + 3034.79256 * t);
  const mJup = normalizeDegree(20.0202 + 3034.6920 * t);
  const cJup = 5.5549 * Math.sin(toRad(mJup)) + 0.1683 * Math.sin(toRad(2 * mJup)) + 0.0071 * Math.sin(toRad(3 * mJup));
  const rJup = 5.20336 / (1 + 0.04849 * Math.cos(toRad(mJup + cJup)));
  const jupiterLong = geoLong(lJup + cJup, rJup);

  // Saturn
  const lSat = normalizeDegree(50.07744 + 1222.11379 * t);
  const mSat = normalizeDegree(317.0207 + 1221.5515 * t);
  const cSat = 6.3585 * Math.sin(toRad(mSat)) + 0.2204 * Math.sin(toRad(2 * mSat)) + 0.0106 * Math.sin(toRad(3 * mSat));
  const rSat = 9.53707 / (1 + 0.05551 * Math.cos(toRad(mSat + cSat)));
  const saturnLong = geoLong(lSat + cSat, rSat);

  // Rahu (Mean Lunar Node)
  const rahuLong = normalizeDegree(125.04452 - 1934.13626 * t + 0.002076 * t * t);
  const ketuLong = normalizeDegree(rahuLong + 180);

  return {
    [Planet.SUN]: { long: sunLong, radius: rSun },
    [Planet.MOON]: { long: moonLong, radius: 0.00257 },
    [Planet.MARS]: { long: marsLong, radius: rMar },
    [Planet.MERCURY]: { long: mercuryLong, radius: rMer },
    [Planet.JUPITER]: { long: jupiterLong, radius: rJup },
    [Planet.VENUS]: { long: venusLong, radius: rVen },
    [Planet.SATURN]: { long: saturnLong, radius: rSat },
    [Planet.RAHU]: { long: rahuLong, radius: 1 },
    [Planet.KETU]: { long: ketuLong, radius: 1 }
  };
}

/**
 * Generates astronomical positions for the 9 Vedic planets based on birth details.
 */
export function generatePlanetaryPositions(birthDetails: BirthDetails): Record<Planet, PlanetPosition> {
  const date = parseUtcDate(birthDetails.dateTimeStr);
  const jd = calculateJulianDay(date);
  const ayanamsaShift = getAyanamsaOffset(birthDetails.ayanamsa, date);

  const pos1 = computeTropicalPositions(jd);
  const pos2 = computeTropicalPositions(jd + 0.01); // 0.01 days later to determine speed

  const result: Partial<Record<Planet, PlanetPosition>> = {};

  Object.values(Planet).forEach((planet) => {
    const p1 = pos1[planet];
    const p2 = pos2[planet];

    const siderealLong = normalizeDegree(p1.long - ayanamsaShift);

    let diff = p2.long - p1.long;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const speed = diff / 0.01; // degrees / day

    const isNode = planet === Planet.RAHU || planet === Planet.KETU;
    const retrograde = isNode ? true : speed < 0;

    const sign = calculateSign(siderealLong);
    const signLongitude = siderealLong % 30;
    result[planet] = {
      planet,
      eclipticLongitude: siderealLong,
      longitude: siderealLong,
      sign,
      house: 1,
      signLongitude,
      eclipticLatitude: 0,
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
  const t = (jd - 2451545.0) / 36525.0;

  // Greenwich Mean Sidereal Time (GMST) in degrees
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t;
  gmst = normalizeDegree(gmst);

  // Local Sidereal Time (LST)
  const lstDeg = normalizeDegree(gmst + birthDetails.longitude);
  const lstRad = (lstDeg * Math.PI) / 180;

  // Obliquity of Ecliptic
  const epsDeg = 23.4392911 - 0.0130042 * t;
  const epsRad = (epsDeg * Math.PI) / 180;

  // Geographic Latitude
  const latRad = (birthDetails.latitude * Math.PI) / 180;

  // Ascendant formula (Tropical)
  const y = Math.cos(lstRad);
  const x = -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad));
  let ascTropicalDeg = (Math.atan2(y, x) * 180) / Math.PI;
  ascTropicalDeg = normalizeDegree(ascTropicalDeg);

  const ayanamsaShift = getAyanamsaOffset(birthDetails.ayanamsa, date);
  return normalizeDegree(ascTropicalDeg - ayanamsaShift);
}

/**
 * Constructs a complete Horoscope object with all derived facts and vargas.
 */
export function calculateHoroscope(birthDetails: BirthDetails, customPositions?: Record<Planet, PlanetPosition>): Horoscope {
  const positions = customPositions || generatePlanetaryPositions(birthDetails);
  const ascendantLong = calculateAscendant(birthDetails);
  const ascendantSign = calculateSign(ascendantLong);

  // Generate divisional charts
  const createChart = (type: ChartType): Chart => {
    const chartAsc = getDivisionalLongitude(ascendantLong, type);
    const chartPositions: Record<Planet, PlanetPosition> = { ...positions };

    Object.values(Planet).forEach((p) => {
      const origPos = positions[p]!;
      const longVal = origPos.eclipticLongitude ?? origPos.longitude ?? 0;
      const divLong = getDivisionalLongitude(longVal, type);
      chartPositions[p] = {
        ...origPos,
        eclipticLongitude: divLong,
        longitude: divLong
      };
    });

    return {
      type,
      chartType: type,
      ascendantLongitude: chartAsc,
      ascendantSign: calculateSign(chartAsc),
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
    const state = calculateCombustion(planet, planetLong, sunLong);

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

  const moonPos = positions[Planet.MOON]!;
  const moonLong = moonPos.eclipticLongitude ?? moonPos.longitude ?? 0;

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

  const dashaInterpretation = analyzeDashaInterpretation({
    vimshottari,
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetAnalysis,
    planetaryStrength
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
