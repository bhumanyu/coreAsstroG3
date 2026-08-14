import { Planet, Sign } from '../../types';
import { HouseGroups } from '../houseLordship/houseGroups';
import {
  YogaAnalysisInput,
  YogaCategory,
  YogaDignity,
  YogaEvidence,
  YogaResult,
  YogaStrength,
  YogaType
} from './yogaTypes';

export interface PanchaMahapurushaRuleDefinition {
  readonly type: YogaType;
  readonly planet: Planet;
  readonly ownSigns: readonly Sign[];
  readonly exaltationSign: Sign;
  readonly ruleId: string;
}

export const MAHAPURUSHA_KENDRAS: readonly number[] = HouseGroups.KENDRA;

export const YOGA_DISPLAY_NAMES: Readonly<Record<YogaType, string>> = Object.freeze({
  [YogaType.GAJA_KESARI]: 'Gaja Kesari',
  [YogaType.RUCHAKA]: 'Ruchaka',
  [YogaType.BHADRA]: 'Bhadra',
  [YogaType.HAMSA]: 'Hamsa',
  [YogaType.MALAVYA]: 'Malavya',
  [YogaType.SHASHA]: 'Shasha',
  [YogaType.RAJA_YOGA]: 'Raja Yoga',
  [YogaType.DHANA_YOGA]: 'Dhana Yoga',
  [YogaType.LAKSHMI_YOGA]: 'Lakshmi Yoga',
  [YogaType.CHANDRA_MANGALA_YOGA]: 'Chandra-Mangala Yoga',
  [YogaType.VASUMATI_YOGA]: 'Vasumati Yoga'
});

const PLANET_DISPLAY_NAMES: Readonly<Record<Planet, string>> = Object.freeze({
  [Planet.SUN]: 'Sun',
  [Planet.MOON]: 'Moon',
  [Planet.MARS]: 'Mars',
  [Planet.MERCURY]: 'Mercury',
  [Planet.JUPITER]: 'Jupiter',
  [Planet.VENUS]: 'Venus',
  [Planet.SATURN]: 'Saturn',
  [Planet.RAHU]: 'Rahu',
  [Planet.KETU]: 'Ketu'
});

export function evaluateMahapurushaRule(
  rule: PanchaMahapurushaRuleDefinition,
  input: YogaAnalysisInput
): YogaResult | null {
  if (!input || !input.planetFacts) {
    throw new TypeError(`${rule.planet} PlanetFacts are required.`);
  }

  const fact = input.planetFacts[rule.planet];
  if (!fact) {
    throw new TypeError(`${rule.planet} PlanetFacts are required.`);
  }

  const house = fact.house ?? fact.position.house;
  const sign = fact.sign ?? fact.position.sign;

  if (house === undefined || !MAHAPURUSHA_KENDRAS.includes(house)) {
    return null;
  }

  let dignity: YogaDignity | null = null;

  if (sign === rule.exaltationSign) {
    dignity = YogaDignity.EXALTATION;
  } else if (sign && rule.ownSigns.includes(sign)) {
    dignity = YogaDignity.OWN_SIGN;
  }

  if (!dignity) {
    return null;
  }

  const yogaDisplayName = YOGA_DISPLAY_NAMES[rule.type];
  const planetName = PLANET_DISPLAY_NAMES[rule.planet];
  const dignityText = dignity === YogaDignity.EXALTATION ? 'exaltation sign' : 'own sign';
  const reason = `${yogaDisplayName} Yoga formed because ${planetName} occupies a Kendra from the Lagna in its ${dignityText}.`;

  const planets: readonly Planet[] = Object.freeze([rule.planet]);
  const houses: readonly (number | undefined)[] = Object.freeze([house]);

  const evidenceItem: YogaEvidence = Object.freeze({
    ruleId: rule.ruleId,
    reason,
    planets,
    houses,
    planet: rule.planet,
    house,
    sign,
    dignity
  });

  return Object.freeze({
    type: rule.type,
    category: YogaCategory.RAJA,
    strength: YogaStrength.STRONG,
    planets,
    houses,
    evidence: Object.freeze([evidenceItem])
  });
}
