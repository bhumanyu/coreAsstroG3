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
import { classifyCareerHouse } from '../../career/careerTypes';
import type {
  CareerTransitFactor,
  CareerTransitSynthesis,
  CareerTimingSynthesis,
  TimingEffect
} from './careerWealthTimingTypes';
import { mapTransitEffect, resolveCareerTransitEffect } from './careerTransitRules';

function getNatalMoonLongitude(horoscope: Horoscope): number | undefined {
  if (horoscope.positions?.MOON?.eclipticLongitude !== undefined) {
    return horoscope.positions.MOON.eclipticLongitude;
  }
  const moonFact = horoscope.planetFacts?.[Planet.MOON];
  if (moonFact?.position?.eclipticLongitude !== undefined) {
    return moonFact.position.eclipticLongitude;
  }
  if (typeof (moonFact as unknown as { longitude?: number })?.longitude === 'number') {
    return (moonFact as unknown as { longitude?: number }).longitude;
  }
  return undefined;
}

function getNatalAscendantLongitude(horoscope: Horoscope): number | undefined {
  if (horoscope.ascendant?.longitude !== undefined) {
    return horoscope.ascendant.longitude;
  }
  const bhava1 = horoscope.bhavas?.[1] as unknown as { degree?: number; longitude?: number } | undefined;
  if (typeof bhava1?.degree === 'number') {
    return bhava1.degree;
  }
  if (typeof bhava1?.longitude === 'number') {
    return bhava1.longitude;
  }
  if (horoscope.rasiChart?.ascendantDegree !== undefined) {
    return horoscope.rasiChart.ascendantDegree;
  }
  return undefined;
}

function getNatalPlanetLongitudes(horoscope: Horoscope): Partial<Record<Planet, number>> | undefined {
  const result: Partial<Record<Planet, number>> = {};
  let count = 0;
  for (const p of Object.values(Planet)) {
    const pf = horoscope.planetFacts?.[p];
    if (pf?.position?.eclipticLongitude !== undefined) {
      result[p] = pf.position.eclipticLongitude;
      count++;
    } else if (typeof (pf as unknown as { longitude?: number })?.longitude === 'number') {
      result[p] = (pf as unknown as { longitude?: number }).longitude!;
      count++;
    }
  }
  return count > 0 ? result : undefined;
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

/**
 * Synthesizes current transit impacts on career factors for a given deterministic asOf timestamp.
 */
export function synthesizeCareerTransit(
  horoscope: Horoscope,
  activeDasha: ActiveDashaState | null,
  asOf: Date,
  dashaSynthesis?: CareerDashaSynthesis
): CareerTransitSynthesis {
  if (!asOf || !(asOf instanceof Date) || Number.isNaN(asOf.getTime())) {
    throw new TypeError('Valid asOf Date instance is required.');
  }

  const natalMoonLongitude = getNatalMoonLongitude(horoscope);
  const natalAscendantLongitude = getNatalAscendantLongitude(horoscope);
  const natalPlanetLongitudes = getNatalPlanetLongitudes(horoscope);

  if (natalMoonLongitude === undefined || natalAscendantLongitude === undefined || natalPlanetLongitudes === undefined) {
    return Object.freeze({
      transitEffect: 'INSUFFICIENT_DATA',
      confidence: 0.5,
      factors: Object.freeze([]),
      summary: 'Required natal position longitudes unavailable for timing calculation.'
    });
  }

  const ayanamsa = horoscope.birthDetails?.ayanamsa ?? AyanamsaType.LAHIRI;
  const transitLongitudes = calculateCurrentTransitLongitudes(asOf, ayanamsa);

  const transitInput = {
    at: asOf.toISOString(),
    natalMoonLongitude,
    natalAscendantLongitude,
    transitLongitudes
  };

  const transitAnalysis = calculateTransit(transitInput);

  const transitReport = analyzeTransits({
    transit: transitAnalysis,
    natalPlanetLongitudes
  });

  const portfolio = getCareerHousePortfolio();
  const factors: CareerTransitFactor[] = [];
  const trackedFactorIds = new Set<string>();

  const getPlanetCareerRole = (planet: Planet) => {
    const ownedHouses: number[] = [];
    for (let h = 1; h <= 12; h++) {
      if (getHouseLord(horoscope, h) === planet) {
        ownedHouses.push(h);
      }
    }
    const natalHouse = horoscope.planetFacts?.[planet]?.house;
    const isKaraka = CAREER_KARAKA_DEFINITIONS[planet] !== undefined;
    const ownsCareerHouse = ownedHouses.some((h) => [10, 6, 2, 11].includes(h));
    const ownsLagna = ownedHouses.includes(1);
    const ownsDusthana = ownedHouses.some((h) => [8, 12].includes(h));
    const occupiesCareerHouse = natalHouse !== undefined && [10, 6, 2, 11].includes(natalHouse);

    return {
      ownedHouses,
      natalHouse,
      isKaraka,
      ownsCareerHouse,
      ownsLagna,
      ownsDusthana,
      occupiesCareerHouse
    };
  };

  // 1. Career-House Transits
  const targetCareerHouses = [...portfolio.primary, ...portfolio.supporting];
  for (const houseNum of targetCareerHouses) {
    const houseClassification = classifyCareerHouse(houseNum, portfolio);
    const isPrimary = houseClassification === 'PRIMARY';

    for (const p of Object.values(Planet)) {
      const pRes = transitAnalysis.results[p];
      if (!pRes?.housePosition) continue;

      const isOccupying = pRes.housePosition.fromAscendant === houseNum;
      const isAspecting = pRes.aspects?.some((a) => a.targetHouseFromAscendant === houseNum);

      if (isOccupying || isAspecting) {
        const factorId = `CTR_HOUSE_${p}_H${houseNum}_${isOccupying ? 'OCC' : 'ASP'}`;
        if (trackedFactorIds.has(factorId)) continue;
        trackedFactorIds.add(factorId);

        const role = getPlanetCareerRole(p);
        let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
        let weight = isPrimary ? (isOccupying ? 2.5 : 2.0) : (isOccupying ? 1.5 : 1.0);

        if (houseNum === 10) {
          if (p === Planet.SATURN) {
            direction = 'SUPPORT';
            weight = isOccupying ? 2.5 : 2.0;
          } else if (role.ownsCareerHouse || role.ownsLagna || role.isKaraka || role.occupiesCareerHouse) {
            direction = 'SUPPORT';
          } else if (role.ownsDusthana && !role.ownsCareerHouse && !role.isKaraka) {
            direction = 'CHALLENGE';
            weight = 1.5;
          } else {
            direction = 'NEUTRAL';
          }
        } else if (houseNum === 6) {
          if (p === Planet.MARS || p === Planet.SATURN) {
            direction = 'SUPPORT';
            weight = isOccupying ? 2.0 : 1.5;
          } else if (role.ownsCareerHouse || role.ownsLagna || role.isKaraka) {
            direction = 'SUPPORT';
          } else if (role.ownsDusthana && !role.ownsCareerHouse) {
            direction = 'CHALLENGE';
          } else {
            direction = 'NEUTRAL';
          }
        } else if (houseNum === 2 || houseNum === 11) {
          if (role.ownsCareerHouse || role.ownsLagna || role.isKaraka || role.occupiesCareerHouse) {
            direction = 'SUPPORT';
          } else if (role.ownsDusthana && !role.ownsCareerHouse && !role.isKaraka) {
            direction = 'CHALLENGE';
          } else {
            direction = 'NEUTRAL';
          }
        }

        const actionText = isOccupying ? 'occupies' : 'aspects';
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

    const houseCls = classifyCareerHouse(hNum, portfolio);
    const isPrimaryLord = houseCls === 'PRIMARY';
    const lordRole = getPlanetCareerRole(lord);

    let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
    let weight = isPrimaryLord ? 2.5 : 1.5;

    if ([10, 11, 1, 5, 9, 2].includes(currentHouse)) {
      direction = 'SUPPORT';
    } else if (currentHouse === 6) {
      direction = isPrimaryLord || hNum === 6 ? 'SUPPORT' : 'NEUTRAL';
    } else if (currentHouse === 8 || currentHouse === 12) {
      direction = 'CHALLENGE';
      weight = isPrimaryLord ? 2.0 : 1.5;
    } else {
      direction = lordRole.isKaraka || lordRole.ownsLagna ? 'SUPPORT' : 'NEUTRAL';
    }

    const statement = `${lord} is lord of Career-related house ${hNum} and currently transits house ${currentHouse}.`;

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
        const planetRole = getPlanetCareerRole(corr.dashaPlanet);

        let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';

        if (String(corr.type).includes('TRANSIT_CONDITION')) {
          if (corr.reason?.toLowerCase().includes('sade sati') || corr.reason?.toLowerCase().includes('saturn over moon')) {
            direction = 'CHALLENGE';
          } else {
            direction = planetRole.ownsCareerHouse || planetRole.isKaraka ? 'SUPPORT' : 'NEUTRAL';
          }
        } else {
          const target = (corr as { natalTargetPlanet?: Planet }).natalTargetPlanet;
          const targetRole = target ? getPlanetCareerRole(target) : undefined;

          if (planetRole.ownsDusthana && !planetRole.ownsCareerHouse && !planetRole.isKaraka) {
            direction = 'CHALLENGE';
          } else if (planetRole.ownsCareerHouse || planetRole.isKaraka || (targetRole && (targetRole.ownsCareerHouse || targetRole.isKaraka))) {
            direction = 'SUPPORT';
          } else {
            direction = 'NEUTRAL';
          }
        }

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
  const karakaPlanets = Object.keys(CAREER_KARAKA_DEFINITIONS) as Planet[];
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

  // 5. CW-02 factor participation & linkage
  if (dashaSynthesis?.factors && dashaSynthesis.factors.length > 0) {
    for (let i = 0; i < factors.length; i++) {
      const factor = factors[i];
      const matchingDashaFactors = dashaSynthesis.factors.filter((df) => df.planet === factor.planet);
      if (matchingDashaFactors.length > 0) {
        const dashaEvidenceIds = matchingDashaFactors.map((df) => df.id);
        const isStrongDashaAgent = matchingDashaFactors.some((df) => df.direction === 'SUPPORT' && df.weight >= 2.0);

        const newWeight = isStrongDashaAgent ? Number((factor.weight * 1.25).toFixed(2)) : factor.weight;
        const newDirection = isStrongDashaAgent ? 'SUPPORT' : factor.direction;

        factors[i] = Object.freeze({
          ...factor,
          direction: newDirection,
          weight: newWeight,
          dashaEvidenceIds: Object.freeze(dashaEvidenceIds)
        });
      }
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
  const hasDirectPrimaryActivation = transitSynthesis.factors.some(
    (f) => f.category === 'CAREER_LORD_TRANSIT' && f.houses?.includes(10) && f.direction === 'SUPPORT'
  );

  const overallEffect = resolveCareerTransitEffect(natalPromise, dashaEffect, {
    transitEffect: transitSynthesis.transitEffect,
    hasDirectPrimaryActivation
  });
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
