import { Planet, AyanamsaType, type Horoscope } from '../../../types';
import type { ActiveDashaState } from '../../../engine/dasha/vimshottari';
import { calculateTransit } from '../../../engine/transitEngine';
import { calculateCurrentTransitLongitudes } from '../../../engine/transitEphemeris';
import { analyzeTransits } from '../../../engine/transitAnalysis';
import { correlateDashaAndTransit, type DashaState } from '../../../engine/dashaTransitCorrelation';
import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import type { CareerDashaSynthesis } from '../../career/careerDasha/careerDashaSynthesisTypes';
import { getCareerHousePortfolio } from '../../career/careerDasha/careerDashaRules';
import { CAREER_KARAKA_DEFINITIONS } from '../../../engine/themeInterpretation/rules/career/careerPlanetRules';
import type {
  CareerTransitFactor,
  CareerTransitSynthesis,
  CareerTimingSynthesis,
  TimingEffect
} from './careerWealthTimingTypes';
import { mapTransitEffect, resolveCareerTransitEffect } from './careerTransitRules';

function getNatalMoonLongitude(horoscope: Horoscope): number {
  if (horoscope.positions?.MOON?.eclipticLongitude !== undefined) {
    return horoscope.positions.MOON.eclipticLongitude;
  }
  const moonFact = horoscope.planetFacts?.[Planet.MOON] as any;
  if (moonFact?.longitude !== undefined) {
    return moonFact.longitude;
  }
  if (moonFact?.position?.eclipticLongitude !== undefined) {
    return moonFact.position.eclipticLongitude;
  }
  return 0;
}

function getNatalAscendantLongitude(horoscope: Horoscope): number {
  if (horoscope.ascendant?.longitude !== undefined) {
    return horoscope.ascendant.longitude;
  }
  const bhava1 = horoscope.bhavas?.[1] as any;
  if (bhava1?.degree !== undefined) {
    return bhava1.degree;
  }
  if (bhava1?.longitude !== undefined) {
    return bhava1.longitude;
  }
  if (horoscope.rasiChart?.ascendantDegree !== undefined) {
    return horoscope.rasiChart.ascendantDegree;
  }
  return 0;
}

function getNatalPlanetLongitudes(horoscope: Horoscope): Partial<Record<Planet, number>> {
  const result: Partial<Record<Planet, number>> = {};
  for (const p of Object.values(Planet)) {
    const pf = horoscope.planetFacts?.[p] as any;
    if (pf?.longitude !== undefined) {
      result[p] = pf.longitude;
    } else if (pf?.position?.eclipticLongitude !== undefined) {
      result[p] = pf.position.eclipticLongitude;
    }
  }
  return result;
}

function getHouseLord(horoscope: Horoscope, houseNumber: number): Planet | undefined {
  if (horoscope.houseLordship?.houseLords?.[houseNumber]) {
    return horoscope.houseLordship.houseLords[houseNumber] as Planet;
  }
  if (horoscope.bhavas?.[houseNumber]?.lord) {
    return horoscope.bhavas[houseNumber].lord as Planet;
  }
  return undefined;
}

const BENEFIC_PLANETS = new Set<Planet>([Planet.JUPITER, Planet.VENUS, Planet.MERCURY]);

/**
 * Synthesizes current transit impacts on career factors for a given deterministic asOf timestamp.
 */
export function synthesizeCareerTransit(
  horoscope: Horoscope,
  activeDasha: ActiveDashaState | null,
  asOf: Date
): CareerTransitSynthesis {
  if (!asOf || !(asOf instanceof Date) || Number.isNaN(asOf.getTime())) {
    throw new TypeError('Valid asOf Date instance is required.');
  }

  const ayanamsa = horoscope.birthDetails?.ayanamsa ?? AyanamsaType.LAHIRI;
  const transitLongitudes = calculateCurrentTransitLongitudes(asOf, ayanamsa);
  const natalMoonLongitude = getNatalMoonLongitude(horoscope);
  const natalAscendantLongitude = getNatalAscendantLongitude(horoscope);

  const transitInput = {
    at: asOf.toISOString(),
    natalMoonLongitude,
    natalAscendantLongitude,
    transitLongitudes
  };

  const transitAnalysis = calculateTransit(transitInput);
  const natalPlanetLongitudes = getNatalPlanetLongitudes(horoscope);

  const transitReport = analyzeTransits({
    transit: transitAnalysis,
    natalPlanetLongitudes
  });

  const portfolio = getCareerHousePortfolio();
  const factors: CareerTransitFactor[] = [];
  const trackedFactorIds = new Set<string>();

  // 1. Career-House Transits
  const targetCareerHouses = [...portfolio.primary, ...portfolio.supporting];
  for (const houseNum of targetCareerHouses) {
    for (const p of Object.values(Planet)) {
      const pRes = transitAnalysis.results[p];
      if (!pRes?.housePosition) continue;

      const isOccupying = pRes.housePosition.fromAscendant === houseNum;
      const isAspecting = pRes.aspects?.some((a) => a.targetHouseFromAscendant === houseNum);

      if (isOccupying || isAspecting) {
        const factorId = `CTR_HOUSE_${p}_H${houseNum}_${isOccupying ? 'OCC' : 'ASP'}`;
        if (trackedFactorIds.has(factorId)) continue;
        trackedFactorIds.add(factorId);

        const isPrimary = portfolio.primary.includes(houseNum);
        const isBenefic = BENEFIC_PLANETS.has(p);
        const direction = isBenefic ? 'SUPPORT' : (houseNum === 6 && (p === Planet.MARS || p === Planet.SATURN)) ? 'SUPPORT' : 'CHALLENGE';
        const weight = isPrimary ? (isBenefic ? 2.5 : 1.5) : 1.0;

        const actionText = isOccupying ? `occupies` : `aspects`;
        const statement = `Transit ${p} ${actionText} career house ${houseNum} (${isPrimary ? 'Primary 10H' : 'Supporting ' + houseNum + 'H'}).`;

        factors.push(Object.freeze({
          id: factorId,
          planet: p,
          category: 'CAREER_HOUSE_TRANSIT',
          direction,
          weight,
          statement,
          houses: [houseNum]
        }));
      }
    }
  }

  // 2. Career-Lord Transits
  const careerHousesForLords = [10, 6, 2, 11];
  for (const hNum of careerHousesForLords) {
    const lord = getHouseLord(horoscope, hNum);
    if (!lord) continue;

    const lordRes = transitAnalysis.results[lord];
    if (!lordRes?.housePosition) continue;

    const currentHouse = lordRes.housePosition.fromAscendant;
    if (currentHouse === undefined) continue;

    const factorId = `CTR_LORD_${lord}_H${hNum}_IN_H${currentHouse}`;
    if (trackedFactorIds.has(factorId)) continue;
    trackedFactorIds.add(factorId);

    const is10Lord = hNum === 10;
    const isGoodPlacement = [10, 6, 2, 11, 1, 5, 9].includes(currentHouse);
    const direction = isGoodPlacement ? 'SUPPORT' : 'CHALLENGE';
    const weight = is10Lord ? (isGoodPlacement ? 2.5 : 2.0) : (isGoodPlacement ? 1.5 : 1.0);

    const statement = `Career 10H lord (${lord}) transits house ${currentHouse} (${isGoodPlacement ? 'Supportive alignment' : 'Challenging alignment'}).`;

    factors.push(Object.freeze({
      id: factorId,
      planet: lord,
      category: 'CAREER_LORD_TRANSIT',
      direction,
      weight,
      statement,
      houses: [hNum, currentHouse]
    }));
  }

  // 3. Dasha-Lord Transits
  if (activeDasha) {
    const dashaState: DashaState = {
      mahadashaPlanet: activeDasha.mahadasha.planet,
      antardashaPlanet: activeDasha.antardasha?.planet,
      pratyantardashaPlanet: activeDasha.pratyantardasha?.planet
    };

    const correlation = correlateDashaAndTransit({
      dasha: dashaState,
      transit: transitReport
    });

    if (correlation.correlations && correlation.correlations.length > 0) {
      for (const corr of correlation.correlations) {
        const factorId = `CTR_DASHA_${corr.dashaLevel}_${corr.dashaPlanet}_${corr.type}`;
        if (trackedFactorIds.has(factorId)) continue;
        trackedFactorIds.add(factorId);

        const weight = corr.dashaLevel === 'MAHADASHA' ? 3.0 : corr.dashaLevel === 'ANTARDASHA' ? 2.0 : 1.0;
        const isBeneficTransit = BENEFIC_PLANETS.has(corr.dashaPlanet);
        const direction = isBeneficTransit ? 'SUPPORT' : 'CHALLENGE';

        factors.push(Object.freeze({
          id: factorId,
          planet: corr.dashaPlanet,
          category: 'DASHA_LORD_TRANSIT',
          direction,
          weight,
          statement: `Active ${corr.dashaLevel} lord ${corr.dashaPlanet} transit correlation: ${corr.reason}`
        }));
      }
    }
  }

  // 4. Career Karaka Transits
  const karakaPlanets = [Planet.SUN, Planet.SATURN, Planet.MERCURY, Planet.MARS, Planet.JUPITER];
  for (const kp of karakaPlanets) {
    const kpRes = transitAnalysis.results[kp];
    if (!kpRes?.housePosition) continue;

    const hPos = kpRes.housePosition.fromAscendant;
    if (hPos === 10 || hPos === 1) {
      const factorId = `CTR_KARAKA_${kp}_H${hPos}`;
      if (trackedFactorIds.has(factorId)) continue;
      trackedFactorIds.add(factorId);

      const karakaDef = CAREER_KARAKA_DEFINITIONS[kp];
      factors.push(Object.freeze({
        id: factorId,
        planet: kp,
        category: 'CAREER_KARAKA_TRANSIT',
        direction: 'SUPPORT',
        weight: 1.5,
        statement: `Natural career karaka ${kp} transits key angular house ${hPos}. ${karakaDef?.title ?? ''}`,
        houses: [hPos]
      }));
    }
  }

  const { transitEffect, confidence } = mapTransitEffect(factors);

  const summary = factors.length > 0
    ? `Career transit analysis identifies ${factors.length} active factor(s) with ${transitEffect} effect (confidence ${confidence}).`
    : 'No strong career-specific transit activations currently active.';

  return Object.freeze({
    transitEffect,
    confidence,
    factors: Object.freeze(factors),
    summary
  });
}

function buildCareerTimingSummary(
  natalPromise: DomainStrength,
  dashaEffect: string,
  transitEffect: string,
  overallEffect: TimingEffect
): string {
  return `Natal career promise is ${natalPromise}. Dasha status is ${dashaEffect} and current transit effect is ${transitEffect}, yielding overall timing result: ${overallEffect}.`;
}

/**
 * Top-level CW-03 timing synthesis combiner.
 */
export function synthesizeCareerTiming(
  natalPromise: DomainStrength,
  dashaSynthesis: CareerDashaSynthesis | undefined,
  transitSynthesis: CareerTransitSynthesis
): CareerTimingSynthesis {
  const dashaEffect = dashaSynthesis?.combined?.combinedEffect ?? 'INSUFFICIENT_DATA';
  const overallEffect = resolveCareerTransitEffect(natalPromise, dashaEffect, transitSynthesis);
  const factors = transitSynthesis.factors;
  const dashaConfidence = dashaSynthesis ? 0.85 : 0.5;
  const confidence = Number(((transitSynthesis.confidence + dashaConfidence) / 2).toFixed(2));
  const summary = buildCareerTimingSummary(natalPromise, dashaEffect, transitSynthesis.transitEffect, overallEffect);

  return Object.freeze({
    natalPromise,
    dashaEffect,
    transitEffect: transitSynthesis.transitEffect,
    overallEffect,
    confidence,
    factors,
    summary
  });
}
