import { Planet, AyanamsaType, type Horoscope } from '../../../types';
import type { ActiveDashaState } from '../../../engine/dasha/vimshottari';
import { calculateTransit } from '../../../engine/transitEngine';
import { calculateCurrentTransitLongitudes } from '../../../engine/transitEphemeris';
import { analyzeTransits } from '../../../engine/transitAnalysis';
import type { DomainStrength } from '../../interpretation/DomainInterpretationTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import type {
  WealthTransitFactor,
  WealthTransitDimensionSynthesis,
  WealthTimingSynthesis
} from './careerWealthTimingTypes';
import {
  mapWealthDimensionTransitEffect,
  resolveWealthDimensionTransitEffect
} from './wealthTransitRules';

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

const DIMENSION_HOUSES: Record<WealthDimension, number> = {
  ACCUMULATION: 2,
  GAINS: 11,
  FORTUNE: 9,
  SPECULATION: 5
};

const DIMENSION_KARAKAS: Record<WealthDimension, readonly Planet[]> = {
  ACCUMULATION: [Planet.JUPITER, Planet.VENUS],
  GAINS: [Planet.JUPITER],
  FORTUNE: [Planet.JUPITER],
  SPECULATION: [Planet.VENUS, Planet.MERCURY]
};

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

  analyzeTransits({
    transit: transitAnalysis,
    natalPlanetLongitudes
  });

  const factors: WealthTransitFactor[] = [];
  const trackedFactorIds = new Set<string>();

  const dimensions: WealthDimension[] = ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'];

  for (const dim of dimensions) {
    const targetHouse = DIMENSION_HOUSES[dim];

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

        const isBenefic = BENEFIC_PLANETS.has(p);
        const direction = isBenefic ? 'SUPPORT' : 'CHALLENGE';
        const weight = isBenefic ? 2.0 : 1.0;
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
          houses: [targetHouse]
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
            const isGoodPlacement = [2, 11, 9, 5, 1, 10].includes(currentHouse);
            const direction = isGoodPlacement ? 'SUPPORT' : 'CHALLENGE';
            const weight = isGoodPlacement ? 2.0 : 1.0;
            const statement = `Wealth lord of house ${targetHouse} (${dim}) (${lord}) transits house ${currentHouse}.`;

            factors.push(Object.freeze({
              id: factorId,
              planet: lord,
              category: 'WEALTH_LORD_TRANSIT',
              direction,
              weight,
              statement,
              dimension: dim,
              houses: [targetHouse, currentHouse]
            }));
          }
        }
      }
    }

    // 3. Karaka Transits for dimension
    const karakas = DIMENSION_KARAKAS[dim];
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
              houses: [hPos]
            }));
          }
        }
      }
    }
  }

  const dimensionSyntheses: Partial<Record<WealthDimension, WealthTransitDimensionSynthesis>> = {};

  for (const dim of dimensions) {
    const dimFactors = factors.filter((f) => f.dimension === dim);
    const { transitEffect, confidence } = mapWealthDimensionTransitEffect(dimFactors, dim);

    const natalPromise: DomainStrength = natalPromises?.[dim] ?? 'MODERATE';
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
