import {
  Planet,
  Sign,
  PlanetFacts,
  PlanetaryStrengthInput,
  PlanetaryStrengthReport,
  PlanetaryStrength,
  PlanetStrengthComponent,
  PlanetaryStrengthEvidence,
  ShadbalaComponent,
  ShadbalaSubcomponent,
  ShadbalaAggregation,
  ShadbalaAggregationStatus,
  StrengthComponentStatus,
  DignityStatus,
  Relationship,
  SHADBALA_MINIMUM_REQUIREMENTS
} from '../../types';
import {
  DEBILITATION_DATA,
  SIGNS_METADATA,
  MOOLATRIKONA_DATA,
  OWN_SIGNS_DATA
} from '../../data/astroData';
import { normalizeDegree } from '../nakshatraUtils';
import { calculateNaturalRelationship } from '../chartMath';
import { getVargaSign, VargaType } from './varga';
import { calculatePlanetKalaBala } from './kalaBala';
import { calculateCheshtaBala } from './cheshtaBala';
import { calculateDrikBala } from './drikBala';
import { calculateShadbala } from './shadbala';
import { calculateYuddhaBala } from './yuddhaBala';
import { parseUtcDate } from '../solarTime';

export function compoundRelationship(
  naturalRel: Relationship,
  isTemporalFriend: boolean
): { category: string; points: number } {
  if (naturalRel === Relationship.FRIEND) {
    if (isTemporalFriend) {
      return { category: 'GREAT_FRIEND', points: 22.5 };
    }
    return { category: 'NEUTRAL', points: 7.5 };
  }
  if (naturalRel === Relationship.NEUTRAL) {
    if (isTemporalFriend) {
      return { category: 'FRIEND', points: 15.0 };
    }
    return { category: 'ENEMY', points: 3.75 };
  }
  // Relationship.ENEMY
  if (isTemporalFriend) {
    return { category: 'NEUTRAL', points: 7.5 };
  }
  return { category: 'GREAT_ENEMY', points: 1.875 };
}

export const NAISARGIKA_BALA_SHASTIAMSA: Readonly<Partial<Record<Planet, number>>> = Object.freeze({
  [Planet.SUN]: 60.00,
  [Planet.MOON]: 51.43,
  [Planet.VENUS]: 42.86,
  [Planet.JUPITER]: 34.29,
  [Planet.MERCURY]: 25.71,
  [Planet.MARS]: 17.14,
  [Planet.SATURN]: 8.57
});

export const DIG_BALA_HOUSES: Readonly<Partial<Record<Planet, number>>> = Object.freeze({
  [Planet.JUPITER]: 1,
  [Planet.MERCURY]: 1,
  [Planet.SUN]: 10,
  [Planet.MARS]: 10,
  [Planet.MOON]: 4,
  [Planet.VENUS]: 4,
  [Planet.SATURN]: 7
});

export const SAPTAVARGAJA_VARGAS: readonly VargaType[] = Object.freeze([
  'D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30'
]);

export function circularDistance(a: number, b: number): number {
  const na = normalizeDegree(a);
  const nb = normalizeDegree(b);
  const diff = Math.abs(na - nb);
  return Math.min(diff, 360 - diff);
}

export function houseOffset(sourceHouse: number, targetHouse: number): number {
  return ((targetHouse - sourceHouse) + 12) % 12;
}

export function analyzePlanetaryStrength(
  input: PlanetaryStrengthInput
): PlanetaryStrengthReport {
  if (!input) {
    throw new Error('input must not be null or undefined.');
  }
  if (!input.planetFacts) {
    throw new Error('planetFacts must not be null or undefined.');
  }

  const allPlanets: readonly Planet[] = Object.values(Planet);

  for (const planet of allPlanets) {
    const pf = input.planetFacts[planet];
    if (!pf) {
      throw new Error(`planetFacts is missing required planet: ${planet}.`);
    }
    const eclipticLong = pf.position?.eclipticLongitude;
    if (typeof eclipticLong !== 'number' || !Number.isFinite(eclipticLong)) {
      throw new Error(`eclipticLongitude for planet ${planet} is invalid or missing.`);
    }
    const house = pf.house ?? 1;
    if (typeof house !== 'number' || !Number.isInteger(house) || house < 1 || house > 12) {
      throw new Error(`house for planet ${planet} must be an integer between 1 and 12.`);
    }
  }

  // Pre-calculate varga sign placements for all 9 planets across the 7 vargas
  const vargaSignMaps: Record<VargaType, Record<Planet, Sign>> = {
    D1: {} as Record<Planet, Sign>,
    D2: {} as Record<Planet, Sign>,
    D3: {} as Record<Planet, Sign>,
    D7: {} as Record<Planet, Sign>,
    D9: {} as Record<Planet, Sign>,
    D12: {} as Record<Planet, Sign>,
    D30: {} as Record<Planet, Sign>
  };

  for (const v of SAPTAVARGAJA_VARGAS) {
    for (const p of allPlanets) {
      const long = input.planetFacts[p].position.eclipticLongitude ?? input.planetFacts[p].position.longitude;
      vargaSignMaps[v][p] = getVargaSign(long, v);
    }
  }

  const yuddhaReport = calculateYuddhaBala(input.planetFacts);

  const planetsResult: Partial<Record<Planet, PlanetaryStrength>> = {};

  for (const planet of allPlanets) {
    const pf = input.planetFacts[planet];
    const components: PlanetStrengthComponent[] = [];
    const evidenceList: PlanetaryStrengthEvidence[] = [];

    const isNode = (planet === Planet.RAHU || planet === Planet.KETU);

    // ----------------------------------------------------
    // 1A. STHANA_BALA / UCHCHA_BALA
    // ----------------------------------------------------
    let uchchaBalaRaw: number | undefined;
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Node exaltation values are a non-classical traditional extension and are intentionally excluded.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
        ruleId: 'SHADBALA_UCHCHA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Node exaltation values are a non-classical traditional extension and are intentionally excluded.'
      }));
    } else {
      const deb = DEBILITATION_DATA[planet];
      if (!deb) {
        throw new Error(`Missing debilitation configuration data for planet ${planet}.`);
      }
      const debLong = ((SIGNS_METADATA[deb.sign].number ?? 1) - 1) * 30 + deb.degree;
      const planetLong = normalizeDegree(pf.position.eclipticLongitude ?? pf.position.longitude);
      const dist = circularDistance(planetLong, debLong);
      uchchaBalaRaw = dist / 3;
      const uchchaBala = Number(uchchaBalaRaw.toFixed(2));

      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: uchchaBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_UCHCHA_BALA_001',
        reason: `Uchcha Bala for ${planet} is calculated from its angular distance (${Number(dist.toFixed(2))}°) to its debilitation point (${Number(debLong.toFixed(2))}°).`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
        ruleId: 'SHADBALA_UCHCHA_BALA_001',
        planet,
        reason: `Uchcha Bala for ${planet} is calculated from angular distance to debilitation point.`,
        inputs: Object.freeze({
          planetLongitude: Number(planetLong.toFixed(4)),
          debilitationLongitude: Number(debLong.toFixed(4)),
          angularDistance: Number(dist.toFixed(4))
        })
      }));
    }

    // ----------------------------------------------------
    // 1B. STHANA_BALA / SAPTAVARGAJA_BALA
    // ----------------------------------------------------
    let saptavargajaBalaRaw: number | undefined;
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Current canonical methodology does not define a repository-validated rule for Saptavargaja Bala of Rahu and Ketu.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
        ruleId: 'SHADBALA_SAPTAVARGAJA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Current canonical methodology does not define a repository-validated rule for Saptavargaja Bala of Rahu and Ketu.'
      }));
    } else {
      const vargaDetails: Array<{
        varga: VargaType;
        sign: Sign;
        ruler: Planet;
        dignityCategory: string;
        points: number;
      }> = [];
      let totalPoints = 0;

      for (const v of SAPTAVARGAJA_VARGAS) {
        const sign: Sign = vargaSignMaps[v][planet];
        const ruler: Planet = SIGNS_METADATA[sign].ruler;
        let category = 'NEUTRAL';
        let pts = 7.5;

        if (v === 'D1' && pf.dignity?.status === DignityStatus.MOOLATRIKONA) {
          category = 'MOOLATRIKONA';
          pts = 45.0;
        } else if (MOOLATRIKONA_DATA[planet]?.sign === sign || OWN_SIGNS_DATA[planet]?.includes(sign)) {
          category = 'OWN_SIGN';
          pts = 30.0;
        } else if (planet === ruler) {
          category = 'OWN_SIGN';
          pts = 30.0;
        } else {
          const natRel = calculateNaturalRelationship(planet, ruler);
          const pSign: Sign = vargaSignMaps[v][planet];
          const rSign: Sign = vargaSignMaps[v][ruler];
          const offset = houseOffset(SIGNS_METADATA[pSign].number ?? 1, SIGNS_METADATA[rSign].number ?? 1);
          const housePos = offset + 1;
          const isTempFriend = [2, 3, 4, 10, 11, 12].includes(housePos);
          const res = compoundRelationship(natRel, isTempFriend);
          category = res.category;
          pts = res.points;
        }

        totalPoints += pts;
        vargaDetails.push({
          varga: v,
          sign,
          ruler,
          dignityCategory: category,
          points: pts
        });
      }

      saptavargajaBalaRaw = totalPoints;
      const saptavargajaBala = Number(saptavargajaBalaRaw.toFixed(2));

      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: saptavargajaBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_SAPTAVARGAJA_BALA_001',
        reason: `Saptavargaja Bala for ${planet} is calculated across 7 vargas (${saptavargajaBala} Shastiamsas).`
      }));

      const inputsRecord: Record<string, string | number> = {
        totalPoints: saptavargajaBala
      };
      for (const vd of vargaDetails) {
        inputsRecord[`${vd.varga}_sign`] = vd.sign;
        inputsRecord[`${vd.varga}_category`] = vd.dignityCategory;
        inputsRecord[`${vd.varga}_points`] = vd.points;
      }

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
        ruleId: 'SHADBALA_SAPTAVARGAJA_BALA_001',
        planet,
        reason: `Saptavargaja Bala for ${planet} across D1, D2, D3, D7, D9, D12, D30.`,
        inputs: Object.freeze(inputsRecord)
      }));
    }

    // ----------------------------------------------------
    // 1C. STHANA_BALA / OJA_YUGMA_BALA
    // ----------------------------------------------------
    let ojaYugmaBalaRaw: number | undefined;
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Current canonical methodology does not define a repository-validated rule for Oja-Yugma Bala of Rahu and Ketu.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
        ruleId: 'SHADBALA_OJA_YUGMA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Current canonical methodology does not define a repository-validated rule for Oja-Yugma Bala of Rahu and Ketu.'
      }));
    } else {
      const isOddGroup = [Planet.SUN, Planet.MARS, Planet.JUPITER, Planet.MERCURY, Planet.SATURN].includes(planet);
      const preferredParity = isOddGroup ? 'ODD' : 'EVEN';

      const rasiSign = vargaSignMaps['D1'][planet];
      const rasiIsOdd = ((SIGNS_METADATA[rasiSign].number ?? 1) % 2 !== 0);
      const rasiParity = rasiIsOdd ? 'ODD' : 'EVEN';
      const rasiBonus = (rasiParity === preferredParity) ? 15 : 0;

      const navamsaSign = vargaSignMaps['D9'][planet];
      const navamsaIsOdd = ((SIGNS_METADATA[navamsaSign].number ?? 1) % 2 !== 0);
      const navamsaParity = navamsaIsOdd ? 'ODD' : 'EVEN';
      const navamsaBonus = (navamsaParity === preferredParity) ? 15 : 0;

      ojaYugmaBalaRaw = rasiBonus + navamsaBonus;
      const ojaYugmaBala = ojaYugmaBalaRaw;

      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: ojaYugmaBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_OJA_YUGMA_BALA_001',
        reason: `Oja-Yugma Bala for ${planet} is ${ojaYugmaBala} Shastiamsas based on Rasi (${rasiParity}) and Navamsa (${navamsaParity}) placement.`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
        ruleId: 'SHADBALA_OJA_YUGMA_BALA_001',
        planet,
        reason: `Oja-Yugma Bala calculated from Rasi and Navamsa sign parities.`,
        inputs: Object.freeze({
          rasiSign,
          rasiParity,
          navamsaSign,
          navamsaParity,
          preferredParity,
          rasiBonus,
          navamsaBonus
        })
      }));
    }

    // ----------------------------------------------------
    // 1D. STHANA_BALA / KENDRADI_BALA
    // ----------------------------------------------------
    const house = pf.house ?? 1;
    let kendradiClassification: 'KENDRA' | 'PANAPARA' | 'APOKLIMA' = 'APOKLIMA';
    let kendradiBalaRaw = 15;

    if ([1, 4, 7, 10].includes(house)) {
      kendradiClassification = 'KENDRA';
      kendradiBalaRaw = 60;
    } else if ([2, 5, 8, 11].includes(house)) {
      kendradiClassification = 'PANAPARA';
      kendradiBalaRaw = 30;
    } else {
      kendradiClassification = 'APOKLIMA';
      kendradiBalaRaw = 15;
    }

    components.push(Object.freeze({
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.KENDRADI_BALA,
      status: StrengthComponentStatus.CALCULATED,
      value: kendradiBalaRaw,
      unit: 'SHASTIAMSA',
      ruleId: 'SHADBALA_KENDRADI_BALA_001',
      reason: `Kendradi Bala for ${planet} is ${kendradiBalaRaw} Shastiamsas based on its house placement (${house}: ${kendradiClassification}).`
    }));

    evidenceList.push(Object.freeze({
      component: ShadbalaComponent.STHANA_BALA,
      subcomponent: ShadbalaSubcomponent.KENDRADI_BALA,
      ruleId: 'SHADBALA_KENDRADI_BALA_001',
      planet,
      reason: `Kendradi Bala calculated from house placement.`,
      inputs: Object.freeze({
        house,
        classification: kendradiClassification
      })
    }));

    // ----------------------------------------------------
    // 1E. STHANA_BALA / DREKKANA_BALA
    // ----------------------------------------------------
    let drekkanaBalaRaw: number | undefined;
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Current canonical methodology does not define a repository-validated rule for Drekkana Bala of Rahu and Ketu.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
        ruleId: 'SHADBALA_DREKKANA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Current canonical methodology does not define a repository-validated rule for Drekkana Bala of Rahu and Ketu.'
      }));
    } else {
      const posInSign = normalizeDegree(pf.position.eclipticLongitude ?? pf.position.longitude) % 30;
      let drekkanaNumber: 1 | 2 | 3 = 1;
      if (posInSign < 10) {
        drekkanaNumber = 1;
      } else if (posInSign < 20) {
        drekkanaNumber = 2;
      } else {
        drekkanaNumber = 3;
      }

      let group: 'MALE' | 'NEUTRAL' | 'FEMALE' = 'MALE';
      let prefDrekkana: 1 | 2 | 3 = 1;

      if ([Planet.SUN, Planet.MARS, Planet.JUPITER].includes(planet)) {
        group = 'MALE';
        prefDrekkana = 1;
      } else if ([Planet.MERCURY, Planet.SATURN].includes(planet)) {
        group = 'NEUTRAL';
        prefDrekkana = 2;
      } else {
        group = 'FEMALE';
        prefDrekkana = 3;
      }

      drekkanaBalaRaw = (drekkanaNumber === prefDrekkana) ? 15 : 0;
      const drekkanaBala = drekkanaBalaRaw;

      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: drekkanaBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_DREKKANA_BALA_001',
        reason: `Drekkana Bala for ${planet} is ${drekkanaBala} Shastiamsas based on Drekkana ${drekkanaNumber} placement.`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
        ruleId: 'SHADBALA_DREKKANA_BALA_001',
        planet,
        reason: `Drekkana Bala calculated based on degree in sign and planet gender group.`,
        inputs: Object.freeze({
          degreesWithinSign: Number(posInSign.toFixed(4)),
          drekkanaNumber,
          group
        })
      }));
    }

    // ----------------------------------------------------
    // 1F. STHANA_BALA AGGREGATE (Only if all 5 are CALCULATED)
    // ----------------------------------------------------
    if (
      uchchaBalaRaw !== undefined &&
      saptavargajaBalaRaw !== undefined &&
      ojaYugmaBalaRaw !== undefined &&
      kendradiBalaRaw !== undefined &&
      drekkanaBalaRaw !== undefined
    ) {
      const sthanaTotalRaw = uchchaBalaRaw + saptavargajaBalaRaw + ojaYugmaBalaRaw + kendradiBalaRaw + drekkanaBalaRaw;
      const sthanaTotal = Number(sthanaTotalRaw.toFixed(2));

      components.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.STHANA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: sthanaTotal,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_STHANA_BALA_001',
        reason: `Sthana Bala total for ${planet} is ${sthanaTotal} Shastiamsas, aggregated from its five subcomponents.`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.STHANA_BALA,
        subcomponent: ShadbalaSubcomponent.STHANA_BALA,
        ruleId: 'SHADBALA_STHANA_BALA_001',
        planet,
        reason: `Sthana Bala total aggregated from Uchcha, Saptavargaja, Oja-Yugma, Kendradi, and Drekkana Bala.`,
        inputs: Object.freeze({
          uchchaBala: Number(uchchaBalaRaw.toFixed(2)),
          saptavargajaBala: Number(saptavargajaBalaRaw.toFixed(2)),
          ojaYugmaBala: ojaYugmaBalaRaw,
          kendradiBala: kendradiBalaRaw,
          drekkanaBala: drekkanaBalaRaw
        })
      }));
    }

    // ----------------------------------------------------
    // 2. DIG_BALA / DIG_BALA
    // ----------------------------------------------------
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.DIG_BALA,
        subcomponent: ShadbalaSubcomponent.DIG_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Current canonical methodology does not define a repository-validated rule for Dig Bala of Rahu and Ketu.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.DIG_BALA,
        subcomponent: ShadbalaSubcomponent.DIG_BALA,
        ruleId: 'SHADBALA_DIG_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Current canonical methodology does not define a repository-validated rule for Dig Bala of Rahu and Ketu.'
      }));
    } else {
      const dirHouse = DIG_BALA_HOUSES[planet];
      if (dirHouse === undefined) {
        throw new Error(`Missing directional strength house configuration for planet ${planet}.`);
      }
      const weakHouse = ((dirHouse + 5) % 12) + 1;
      const planetHouse = pf.house ?? 1;
      const offsetFromWeak = houseOffset(weakHouse, planetHouse);
      const minCircularHouseDist = Math.min(offsetFromWeak, 12 - offsetFromWeak);
      const rawDigBala = (minCircularHouseDist / 6) * 60;
      const digBala = Number(rawDigBala.toFixed(2));

      components.push(Object.freeze({
        component: ShadbalaComponent.DIG_BALA,
        subcomponent: ShadbalaSubcomponent.DIG_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: digBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_DIG_BALA_001',
        reason: `Dig Bala for ${planet} is calculated based on its house position (${planetHouse}) relative to its directional strength house (${dirHouse}).`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.DIG_BALA,
        subcomponent: ShadbalaSubcomponent.DIG_BALA,
        ruleId: 'SHADBALA_DIG_BALA_001',
        planet,
        reason: `Dig Bala for ${planet} is calculated based on house position relative to directional strength house.`,
        inputs: Object.freeze({
          house: planetHouse,
          directionalHouse: dirHouse
        })
      }));
    }

    // ----------------------------------------------------
    // 3. KALA_BALA
    // ----------------------------------------------------
    let kalaBalaCoreTotal: number | undefined;
    if (input.birthDetails) {
      const bd = input.birthDetails;
      if (!bd.dateTimeStr || typeof bd.latitude !== 'number' || typeof bd.longitude !== 'number') {
        throw new Error('Invalid birthDetails provided for Kala Bala calculation.');
      }

      const sunLong = input.planetFacts[Planet.SUN].position.eclipticLongitude ?? input.planetFacts[Planet.SUN].position.longitude;
      const moonLong = input.planetFacts[Planet.MOON].position.eclipticLongitude ?? input.planetFacts[Planet.MOON].position.longitude;
      const planetLong = pf.position.eclipticLongitude ?? pf.position.longitude;

      const kbResult = calculatePlanetKalaBala(planet, bd, sunLong, moonLong, planetLong, yuddhaReport[planet]);
      kbResult.components.forEach(c => components.push(Object.freeze(c)));
      kbResult.evidence.forEach(e => evidenceList.push(Object.freeze(e)));
      kalaBalaCoreTotal = kbResult.kalaBalaCoreTotal;
    } else {
      components.push(Object.freeze({
        component: ShadbalaComponent.KALA_BALA,
        subcomponent: ShadbalaSubcomponent.KALA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Kala Bala requires birthDetails input.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.KALA_BALA,
        ruleId: 'SHADBALA_KALA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Kala Bala requires birthDetails input.'
      }));
    }

    // ----------------------------------------------------
    // 4. CHESHTA_BALA
    // ----------------------------------------------------
    if (input.birthDetails) {
      const bd = input.birthDetails;
      if (!bd.dateTimeStr) {
        throw new Error('Invalid birthDetails provided for Cheshta Bala calculation.');
      }
      const birthInstant = parseUtcDate(bd.dateTimeStr);
      const cheshtaResult = calculateCheshtaBala(
        planet,
        input.planetFacts,
        birthInstant,
        bd.ayanamsa
      );

      if (cheshtaResult.status === StrengthComponentStatus.CALCULATED) {
        components.push(Object.freeze({
          component: ShadbalaComponent.CHESHTA_BALA,
          subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: cheshtaResult.value,
          unit: 'SHASTIAMSA',
          ruleId: 'SHADBALA_CHESHTA_BALA_001',
          reason: `Cheshta Bala for ${planet} is calculated based on motional strength.`
        }));

        const evidenceInputs: Record<string, number | string> = {};
        if (planet === Planet.SUN) {
          evidenceInputs.ayanaBala = cheshtaResult.details?.ayanaBala ?? cheshtaResult.value!;
          evidenceInputs.motionState = cheshtaResult.motionState;
          evidenceInputs.finalValue = cheshtaResult.value!;
        } else if (planet === Planet.MOON) {
          evidenceInputs.pakshaBala = cheshtaResult.details?.pakshaBala ?? cheshtaResult.value!;
          if (cheshtaResult.details?.separation !== undefined) {
            evidenceInputs.separation = cheshtaResult.details.separation;
          }
          evidenceInputs.motionState = cheshtaResult.motionState;
          evidenceInputs.finalValue = cheshtaResult.value!;
        } else {
          evidenceInputs.trueLongitude = cheshtaResult.details?.trueLongitude!;
          evidenceInputs.meanLongitude = cheshtaResult.details?.meanLongitude!;
          evidenceInputs.sheeghrochha = cheshtaResult.details?.sheeghrochha!;
          evidenceInputs.averageLongitude = cheshtaResult.details?.averageLongitude!;
          evidenceInputs.cheshtaKendra = cheshtaResult.details?.cheshtaKendra!;
          evidenceInputs.reducedCheshtaKendra = cheshtaResult.details?.reducedCheshtaKendra!;
          evidenceInputs.motionState = cheshtaResult.motionState;
          evidenceInputs.finalValue = cheshtaResult.value!;
        }

        evidenceList.push(Object.freeze({
          component: ShadbalaComponent.CHESHTA_BALA,
          subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
          ruleId: 'SHADBALA_CHESHTA_BALA_001',
          planet,
          reason: `Cheshta Bala for ${planet} calculated.`,
          inputs: Object.freeze(evidenceInputs)
        }));
      } else {
        components.push(Object.freeze({
          component: ShadbalaComponent.CHESHTA_BALA,
          subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
          status: StrengthComponentStatus.NOT_IMPLEMENTED,
          reason: cheshtaResult.reason ?? 'Cheshta Bala not implemented for this planet.'
        }));
        evidenceList.push(Object.freeze({
          component: ShadbalaComponent.CHESHTA_BALA,
          subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
          ruleId: 'SHADBALA_CHESHTA_BALA_NOT_IMPLEMENTED',
          planet,
          reason: cheshtaResult.reason ?? 'Cheshta Bala not implemented for this planet.'
        }));
      }
    } else {
      components.push(Object.freeze({
        component: ShadbalaComponent.CHESHTA_BALA,
        subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Cheshta Bala requires birthDetails input.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.CHESHTA_BALA,
        subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
        ruleId: 'SHADBALA_CHESHTA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Cheshta Bala requires birthDetails input.'
      }));
    }

    // ----------------------------------------------------
    // 5. NAISARGIKA_BALA / NAISARGIKA_BALA
    // ----------------------------------------------------
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.NAISARGIKA_BALA,
        subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        reason: 'Current canonical methodology does not define a repository-validated rule for Naisargika Bala of Rahu and Ketu.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.NAISARGIKA_BALA,
        subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
        ruleId: 'SHADBALA_NAISARGIKA_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Current canonical methodology does not define a repository-validated rule for Naisargika Bala of Rahu and Ketu.'
      }));
    } else {
      const rawNaisargika = NAISARGIKA_BALA_SHASTIAMSA[planet];
      if (rawNaisargika === undefined) {
        throw new Error(`Missing Naisargika Bala configuration for planet ${planet}.`);
      }
      const naisargikaBala = Number(rawNaisargika.toFixed(2));

      components.push(Object.freeze({
        component: ShadbalaComponent.NAISARGIKA_BALA,
        subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: naisargikaBala,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_NAISARGIKA_BALA_001',
        reason: `Naisargika Bala for ${planet} is a fixed natural strength of ${naisargikaBala} Shastiamsas.`
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.NAISARGIKA_BALA,
        subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
        ruleId: 'SHADBALA_NAISARGIKA_BALA_001',
        planet,
        reason: `Naisargika Bala for ${planet} is a fixed natural strength.`,
        inputs: Object.freeze({
          naturalStrength: naisargikaBala
        })
      }));
    }

    // ----------------------------------------------------
    // 6. DRIK_BALA
    // ----------------------------------------------------
    if (isNode) {
      components.push(Object.freeze({
        component: ShadbalaComponent.DRIK_BALA,
        subcomponent: ShadbalaSubcomponent.DRIK_BALA,
        status: StrengthComponentStatus.NOT_IMPLEMENTED,
        ruleId: 'SHADBALA_DRIK_BALA_NOT_IMPLEMENTED',
        reason: 'Drik Bala is implemented for the seven classical Shadbala grahas; Rahu and Ketu are outside the current canonical calculation scope.'
      }));
      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.DRIK_BALA,
        subcomponent: ShadbalaSubcomponent.DRIK_BALA,
        ruleId: 'SHADBALA_DRIK_BALA_NOT_IMPLEMENTED',
        planet,
        reason: 'Drik Bala is implemented for the seven classical Shadbala grahas; Rahu and Ketu are outside the current canonical calculation scope.'
      }));
    } else {
      const drik = calculateDrikBala(planet, input.planetFacts);
      components.push(Object.freeze({
        component: ShadbalaComponent.DRIK_BALA,
        subcomponent: ShadbalaSubcomponent.DRIK_BALA,
        status: StrengthComponentStatus.CALCULATED,
        value: drik.value,
        unit: 'SHASTIAMSA',
        ruleId: 'SHADBALA_DRIK_BALA_001',
        reason: 'Drik Bala is calculated from rectified Sphuta Drishti received from the other classical planets.'
      }));

      evidenceList.push(Object.freeze({
        component: ShadbalaComponent.DRIK_BALA,
        subcomponent: ShadbalaSubcomponent.DRIK_BALA,
        ruleId: 'SHADBALA_DRIK_BALA_001',
        planet,
        reason: 'Drik Bala is calculated from rectified Sphuta Drishti received from the other classical planets.',
        details: Object.freeze({
          beneficTotal: drik.beneficTotal ?? 0,
          maleficTotal: drik.maleficTotal ?? 0,
          netValue: drik.value ?? 0,
          contributions: drik.contributions
        })
      }));
    }

    const completeKalaBala: number | undefined = undefined;
    const shadbala = calculateShadbala({
      planet,
      components,
      kalaBalaCoreTotal,
      completeKalaBala
    });

    const calculatedTotal =
      shadbala.status === ShadbalaAggregationStatus.COMPLETE
        ? shadbala.totalShastiamsa
        : undefined;
    const unit =
      shadbala.status === ShadbalaAggregationStatus.COMPLETE
        ? 'SHASTIAMSA'
        : undefined;

    const shadbalaEvidence = buildShadbalaEvidence(
      planet,
      components,
      completeKalaBala,
      shadbala
    );
    evidenceList.push(...shadbalaEvidence);

    planetsResult[planet] = Object.freeze({
      planet,
      components: Object.freeze(components),
      calculatedTotal,
      kalaBalaCoreTotal,
      completeKalaBala,
      unit,
      evidence: Object.freeze(evidenceList),
      shadbala
    });
  }

  const planetsContainer = Object.freeze(planetsResult as Record<Planet, PlanetaryStrength>);

  return Object.freeze({
    planets: planetsContainer
  });
}

export function buildShadbalaEvidence(
  planet: Planet,
  components: readonly PlanetStrengthComponent[],
  completeKalaBala: number | undefined,
  shadbala: ShadbalaAggregation
): readonly PlanetaryStrengthEvidence[] {
  const evidenceList: PlanetaryStrengthEvidence[] = [];

  if (shadbala.status === ShadbalaAggregationStatus.COMPLETE) {
    const sthanaComp = components.find(
      (c) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.STHANA_BALA
    );
    const digComp = components.find(
      (c) => c.component === ShadbalaComponent.DIG_BALA && c.subcomponent === ShadbalaSubcomponent.DIG_BALA
    );
    const cheshtaComp = components.find(
      (c) => c.component === ShadbalaComponent.CHESHTA_BALA && c.subcomponent === ShadbalaSubcomponent.CHESHTA_BALA
    );
    const naisargikaComp = components.find(
      (c) => c.component === ShadbalaComponent.NAISARGIKA_BALA && c.subcomponent === ShadbalaSubcomponent.NAISARGIKA_BALA
    );
    const drikComp = components.find(
      (c) => c.component === ShadbalaComponent.DRIK_BALA && c.subcomponent === ShadbalaSubcomponent.DRIK_BALA
    );
    const minimum = shadbala.minimumRequirement ?? SHADBALA_MINIMUM_REQUIREMENTS[planet];
    const requiredShastiamsa = typeof minimum === 'number' ? minimum : (minimum?.requiredShastiamsa ?? 0);
    const requiredRupa = typeof minimum === 'number' ? minimum / 60 : (minimum?.requiredRupa ?? 0);

    evidenceList.push(
      Object.freeze({
        subcomponent: ShadbalaSubcomponent.SHADBALA_TOTAL,
        ruleId: 'SHADBALA_TOTAL_001',
        planet,
        reason: 'Complete Shadbala aggregation computed from six components.',
        shadbalaDetails: Object.freeze({
          sthanaBala: sthanaComp?.value ?? 0,
          digBala: digComp?.value ?? 0,
          kalaBala: completeKalaBala ?? 0,
          cheshtaBala: cheshtaComp?.value ?? 0,
          naisargikaBala: naisargikaComp?.value ?? 0,
          drikBala: drikComp?.value ?? 0,
          totalShastiamsa: shadbala.totalShastiamsa!,
          totalRupa: shadbala.totalRupa!,
          requiredShastiamsa,
          requiredRupa,
          ratioToMinimum: shadbala.ratioToMinimum!,
          percentageOfMinimum: shadbala.percentageOfMinimum!,
          meetsMinimum: shadbala.meetsMinimum!
        })
      })
    );

    evidenceList.push(
      Object.freeze({
        subcomponent: ShadbalaSubcomponent.SHADBALA_TOTAL,
        ruleId: 'SHADBALA_RUPA_CONVERSION_001',
        planet,
        reason: 'Total Shastiamsa converted to Rupa using 60 Shastiamsas per Rupa.',
        inputs: Object.freeze({
          totalShastiamsa: shadbala.totalShastiamsa!,
          divisor: 60,
          totalRupa: shadbala.totalRupa!
        })
      })
    );

    evidenceList.push(
      Object.freeze({
        subcomponent: ShadbalaSubcomponent.SHADBALA_TOTAL,
        ruleId: 'SHADBALA_MINIMUM_REQUIREMENT_001',
        planet,
        reason: 'Canonical minimum Shadbala requirement selected for the planet.',
        inputs: Object.freeze({
          requiredShastiamsa: minimum.requiredShastiamsa,
          requiredRupa: minimum.requiredRupa
        })
      })
    );

    evidenceList.push(
      Object.freeze({
        subcomponent: ShadbalaSubcomponent.SHADBALA_TOTAL,
        ruleId: 'SHADBALA_MINIMUM_RATIO_001',
        planet,
        reason: 'Shadbala total compared with the canonical minimum requirement.',
        inputs: Object.freeze({
          totalShastiamsa: shadbala.totalShastiamsa!,
          requiredShastiamsa: minimum.requiredShastiamsa,
          ratioToMinimum: shadbala.ratioToMinimum!,
          percentageOfMinimum: shadbala.percentageOfMinimum!,
          meetsMinimum: shadbala.meetsMinimum!
        })
      })
    );
  } else {
    evidenceList.push(
      Object.freeze({
        subcomponent: ShadbalaSubcomponent.SHADBALA_TOTAL,
        ruleId: 'SHADBALA_TOTAL_INCOMPLETE',
        planet,
        reason: `Complete Shadbala aggregation is unavailable because ${shadbala.missingComponents?.join(', ') ?? ''} are incomplete.`,
        inputs: Object.freeze({
          missingComponents: shadbala.missingComponents?.join(',') ?? ''
        })
      })
    );
  }

  return Object.freeze(evidenceList);
}
