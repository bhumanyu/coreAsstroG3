import { Planet, AyanamsaType, type Horoscope } from '../../../types';
import type { ActiveDashaState } from '../../../engine/dasha/vimshottari';
import { calculateTransit } from '../../../engine/transitEngine';
import { calculateCurrentTransitLongitudes } from '../../../engine/transitEphemeris';
import { analyzeTransits } from '../../../engine/transitAnalysis';
import { correlateDashaAndTransit, type DashaState } from '../../../engine/dashaTransitCorrelation';
import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import {
  type WealthDimension,
  WEALTH_DIMENSION_HOUSES,
  WEALTH_HOUSES,
  WEALTH_DIMENSION_KARAKAS
} from '../../wealth/wealthTypes';
import type {
  WealthTransitFactor,
  WealthTransitDimensionSynthesis,
  WealthTimingSynthesis
} from './careerWealthTimingTypes';
import {
  mapWealthDimensionTransitEffect,
  resolveWealthDimensionTransitEffect
} from './wealthTransitRules';

function getNatalMoonLongitude(horoscope: Horoscope): number | undefined {
  if (horoscope.positions?.MOON?.eclipticLongitude !== undefined) {
    return horoscope.positions.MOON.eclipticLongitude;
  }
  if (horoscope.positions?.MOON?.longitude !== undefined) {
    return horoscope.positions.MOON.longitude;
  }
  const moonFact = horoscope.planetFacts?.[Planet.MOON];
  if (moonFact?.position?.eclipticLongitude !== undefined) {
    return moonFact.position.eclipticLongitude;
  }
  if (moonFact?.position?.longitude !== undefined) {
    return moonFact.position.longitude;
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
    const pos = horoscope.positions?.[p];
    const lon = pos?.eclipticLongitude ?? pos?.longitude ?? pf?.position?.eclipticLongitude ?? pf?.position?.longitude;
    if (lon !== undefined) {
      result[p] = lon;
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
 * Synthesizes wealth transit and timing synthesis across all four wealth dimensions independently.
 */
export function synthesizeWealthTiming(
  horoscope: Horoscope,
  activeDasha: ActiveDashaState | null,
  asOf: Date,
  natalPromises?: Partial<Record<WealthDimension, DomainStrength>>,
  dashaEffects?: Partial<Record<WealthDimension, 'SUPPORTS' | 'CHALLENGES' | 'MIXED' | 'NEUTRAL' | 'INSUFFICIENT_DATA'>>
): WealthTimingSynthesis {
  if (!asOf || !(asOf instanceof Date) || Number.isNaN(asOf.getTime())) {
    throw new TypeError('Valid asOf Date instance is required.');
  }

  const natalMoonLongitude = getNatalMoonLongitude(horoscope);
  const natalAscendantLongitude = getNatalAscendantLongitude(horoscope);
  const natalPlanetLongitudes = getNatalPlanetLongitudes(horoscope);

  const dimensions: WealthDimension[] = ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'];

  if (natalMoonLongitude === undefined || natalAscendantLongitude === undefined || natalPlanetLongitudes === undefined) {
    const insufficientSyntheses: Partial<Record<WealthDimension, WealthTransitDimensionSynthesis>> = {};
    for (const dim of dimensions) {
      const natalPromise = natalPromises?.[dim] ?? 'UNDETERMINED';
      const dashaEffect = dashaEffects?.[dim] ?? 'INSUFFICIENT_DATA';
      const overallEffect = resolveWealthDimensionTransitEffect(natalPromise, dashaEffect, { transitEffect: 'INSUFFICIENT_DATA' });
      insufficientSyntheses[dim] = Object.freeze({
        dimension: dim,
        natalPromise,
        dashaEffect,
        transitEffect: 'INSUFFICIENT_DATA',
        overallEffect,
        confidence: 0.5,
        factors: Object.freeze([]),
        summary: 'Required natal position longitudes unavailable for timing calculation.'
      });
    }
    return Object.freeze({
      dimensions: insufficientSyntheses as Record<WealthDimension, WealthTransitDimensionSynthesis>,
      overallSummary: 'Required natal position longitudes unavailable for wealth timing calculation.'
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

  const factors: WealthTransitFactor[] = [];
  const trackedFactorIds = new Set<string>();

  const getPlanetWealthRole = (planet: Planet, dim: WealthDimension) => {
    const ownedHouses: number[] = [];
    for (let h = 1; h <= 12; h++) {
      if (getHouseLord(horoscope, h) === planet) {
        ownedHouses.push(h);
      }
    }
    const pf = horoscope.planetFacts?.[planet];
    const natalHouse = pf?.house;
    const dignity = pf?.dignity?.status;
    const isExaltedOrOwn = dignity === 'EXALTED' || dignity === 'OWN_SIGN' || dignity === 'MOOLATRIKONA';
    const isDebilitated = dignity === 'DEBILITATED';
    const isKaraka = WEALTH_DIMENSION_KARAKAS[dim].includes(planet);
    const targetHouse = WEALTH_DIMENSION_HOUSES[dim];
    const ownsTargetHouse = ownedHouses.includes(targetHouse);
    const ownsWealthHouse = ownedHouses.some((h) => WEALTH_HOUSES.includes(h));
    const ownsLagna = ownedHouses.includes(1);
    const ownsDusthana = ownedHouses.some((h) => [8, 12].includes(h));
    const occupiesWealthHouse = natalHouse !== undefined && WEALTH_HOUSES.includes(natalHouse);

    return {
      ownedHouses,
      natalHouse,
      dignity,
      isExaltedOrOwn,
      isDebilitated,
      isKaraka,
      ownsTargetHouse,
      ownsWealthHouse,
      ownsLagna,
      ownsDusthana,
      occupiesWealthHouse
    };
  };

  for (const dim of dimensions) {
    const targetHouse = WEALTH_DIMENSION_HOUSES[dim];

    // 1. House Transits for dimension
    for (const p of Object.values(Planet)) {
      const pRes = transitAnalysis.results[p];
      if (!pRes?.housePosition) continue;

      const isOccupying = pRes.housePosition.fromAscendant === targetHouse;
      const isAspecting = pRes.aspects?.some((a) => a.targetHouseFromAscendant === targetHouse);

      if (isOccupying || isAspecting) {
        const factorId = `WTR_HOUSE_${dim}_${p}_H${targetHouse}_${isOccupying ? 'OCC' : 'ASP'}`;
        if (trackedFactorIds.has(factorId)) continue;
        trackedFactorIds.add(factorId);

        const role = getPlanetWealthRole(p, dim);
        let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
        let weight = isOccupying ? 2.0 : 1.5;

        if (dim === 'SPECULATION') {
          // 5th house speculation heuristics:
          // - Venus & Mercury are natural karakas for intelligence, speculative intellect, and trading (Purva Punya / Dhimanth).
          // - Saturn, Mars, Rahu, Ketu transiting 5H introduce speculative volatility, impulsive risk, or loss of capital.
          if (role.ownsTargetHouse || role.ownsLagna || role.isKaraka || p === Planet.VENUS || p === Planet.MERCURY) {
            direction = 'SUPPORT';
          } else if (p === Planet.SATURN || p === Planet.MARS || p === Planet.RAHU || p === Planet.KETU || (role.ownsDusthana && !role.ownsWealthHouse)) {
            direction = 'CHALLENGE';
            weight = 1.5;
          } else {
            direction = 'NEUTRAL';
          }
        } else if (dim === 'GAINS') {
          // 11th house gains heuristics:
          // - Upachaya rule: Saturn and Mars transiting 11H (house of gains/Labha) yield material persistence and competitive gains.
          if (p === Planet.SATURN || p === Planet.MARS) {
            direction = 'SUPPORT';
            weight = isOccupying ? 2.0 : 1.5;
          } else if (role.ownsWealthHouse || role.ownsLagna || role.isKaraka) {
            direction = 'SUPPORT';
          } else if (role.ownsDusthana && !role.ownsWealthHouse) {
            direction = 'CHALLENGE';
          } else {
            direction = 'NEUTRAL';
          }
        } else {
          if (role.ownsWealthHouse || role.ownsLagna || role.isKaraka || role.occupiesWealthHouse) {
            direction = 'SUPPORT';
          } else if (role.ownsDusthana && !role.ownsWealthHouse && !role.isKaraka) {
            direction = 'CHALLENGE';
            weight = 1.5;
          } else {
            direction = 'NEUTRAL';
          }
        }

        const actionText = isOccupying ? 'occupies' : 'aspects';
        const statement = `Transit ${p} ${actionText} wealth house ${targetHouse} (${dim}).`;

        factors.push(Object.freeze({
          id: factorId,
          planet: p,
          category: 'WEALTH_HOUSE_TRANSIT',
          direction,
          weight,
          statement,
          dimension: dim,
          houses: [targetHouse],
          transitingPlanet: p
        }));
      }
    }

    // 2. Lord Transits for dimension
    const lord = getHouseLord(horoscope, targetHouse);
    if (lord) {
      const lordRes = transitAnalysis.results[lord];
      if (lordRes?.housePosition) {
        const currentHouse = lordRes.housePosition.fromAscendant;
        if (currentHouse !== undefined) {
          const factorId = `WTR_LORD_${dim}_${lord}_H${targetHouse}_IN_H${currentHouse}`;
          if (!trackedFactorIds.has(factorId)) {
            trackedFactorIds.add(factorId);

            let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
            let weight = 2.0;

            if (currentHouse === targetHouse) {
              direction = 'SUPPORT';
              weight = 2.5;
            } else if ([2, 11, 9, 5, 1, 10].includes(currentHouse)) {
              direction = 'SUPPORT';
            } else if (currentHouse === 6) {
              direction = dim === 'GAINS' ? 'SUPPORT' : 'NEUTRAL';
            } else if (currentHouse === 8 || currentHouse === 12) {
              direction = 'CHALLENGE';
              weight = 1.5;
            } else {
              direction = 'NEUTRAL';
            }

            const statement = `Wealth lord of house ${targetHouse} (${dim}) (${lord}) transits house ${currentHouse}.`;

            factors.push(Object.freeze({
              id: factorId,
              planet: lord,
              category: 'WEALTH_LORD_TRANSIT',
              direction,
              weight,
              statement,
              dimension: dim,
              houses: [targetHouse, currentHouse],
              transitingPlanet: lord
            }));
          }
        }
      }
    }

    // 3. Karaka Transits for dimension
    const karakas = WEALTH_DIMENSION_KARAKAS[dim];
    for (const kp of karakas) {
      const kpRes = transitAnalysis.results[kp];
      if (kpRes?.housePosition) {
        const hPos = kpRes.housePosition.fromAscendant;
        if (hPos === targetHouse || hPos === 1 || hPos === 10) {
          const factorId = `WTR_KARAKA_${dim}_${kp}_H${hPos}`;
          if (!trackedFactorIds.has(factorId)) {
            trackedFactorIds.add(factorId);
            factors.push(Object.freeze({
              id: factorId,
              planet: kp,
              category: 'WEALTH_KARAKA_TRANSIT',
              direction: 'SUPPORT',
              weight: 1.5,
              statement: `Wealth karaka ${kp} transits key house ${hPos} for ${dim}.`,
              dimension: dim,
              houses: [hPos],
              transitingPlanet: kp
            }));
          }
        }
      }
    }
  }

  // 4. Dasha-Lord Transits for Wealth
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
        const dashaPlanet = corr.dashaPlanet;
        const transitingPlanet = corr.transitPlanet;
        const targetPlanet = corr.natalPlanet ?? (corr as { natalTargetPlanet?: Planet }).natalTargetPlanet;
        const weight = corr.dashaLevel === 'MAHADASHA' ? 3.0 : corr.dashaLevel === 'ANTARDASHA' ? 2.0 : 1.0;

        for (const dim of dimensions) {
          const planetRole = getPlanetWealthRole(dashaPlanet, dim);
          const targetRole = targetPlanet ? getPlanetWealthRole(targetPlanet, dim) : undefined;

          // Check if this correlation is relevant to this dimension
          const isDimensionRelevant =
            planetRole.ownsTargetHouse ||
            planetRole.isKaraka ||
            planetRole.ownsWealthHouse ||
            planetRole.occupiesWealthHouse ||
            (targetRole && (targetRole.ownsTargetHouse || targetRole.isKaraka || targetRole.ownsWealthHouse)) ||
            (planetRole.ownsDusthana && !planetRole.ownsWealthHouse) ||
            String(corr.type).includes('TRANSIT_CONDITION');

          if (!isDimensionRelevant) {
            continue;
          }

          const factorId = `WTR_DASHA_${dim}_${corr.dashaLevel}_${dashaPlanet}_${corr.type}`;
          if (trackedFactorIds.has(factorId)) continue;
          trackedFactorIds.add(factorId);

          let direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';

          if (String(corr.type).includes('TRANSIT_CONDITION')) {
            if (corr.reason?.toLowerCase().includes('sade sati') || corr.reason?.toLowerCase().includes('saturn over moon')) {
              direction = 'CHALLENGE';
            } else {
              direction = (planetRole.ownsTargetHouse || planetRole.isKaraka || planetRole.ownsWealthHouse) ? 'SUPPORT' : 'NEUTRAL';
            }
          } else {
            if (planetRole.ownsDusthana && !planetRole.ownsWealthHouse && !planetRole.isKaraka) {
              direction = 'CHALLENGE';
            } else if (
              planetRole.ownsTargetHouse ||
              planetRole.isKaraka ||
              planetRole.ownsWealthHouse ||
              (targetRole && (targetRole.ownsTargetHouse || targetRole.isKaraka || targetRole.ownsWealthHouse))
            ) {
              direction = 'SUPPORT';
            } else {
              direction = 'NEUTRAL';
            }
          }

          factors.push(Object.freeze({
            id: factorId,
            planet: dashaPlanet,
            category: 'DASHA_LORD_TRANSIT',
            direction,
            weight,
            statement: `Active ${corr.dashaLevel} lord ${dashaPlanet} transit correlation for ${dim}: ${corr.reason}`,
            dimension: dim,
            dashaPlanet,
            transitingPlanet,
            ...(targetPlanet ? { targetPlanet } : {})
          }));
        }
      }
    }
  }

  const dimensionSyntheses: Partial<Record<WealthDimension, WealthTransitDimensionSynthesis>> = {};

  for (const dim of dimensions) {
    const dimFactors = factors.filter((f) => f.dimension === dim);
    const { transitEffect, confidence } = mapWealthDimensionTransitEffect(dimFactors, dim);

    const natalPromise: DomainStrength = natalPromises?.[dim] ?? 'UNDETERMINED';
    const dashaEffect = dashaEffects?.[dim] ?? 'INSUFFICIENT_DATA';

    const overallEffect = resolveWealthDimensionTransitEffect(natalPromise, dashaEffect, { transitEffect });
    const summary = `${dim} wealth dimension timing: natal promise is ${natalPromise}, dasha status is ${dashaEffect}, current transit effect is ${transitEffect}, yielding overall timing result: ${overallEffect}.`;

    dimensionSyntheses[dim] = Object.freeze({
      dimension: dim,
      natalPromise,
      dashaEffect,
      transitEffect,
      overallEffect,
      confidence,
      factors: Object.freeze(dimFactors),
      summary
    });
  }

  const overallSummary = dimensions
    .map((dim) => `${dim}: ${dimensionSyntheses[dim]?.overallEffect ?? 'INSUFFICIENT_DATA'}`)
    .join(' | ');

  return Object.freeze({
    dimensions: dimensionSyntheses as Record<WealthDimension, WealthTransitDimensionSynthesis>,
    overallSummary
  });
}
