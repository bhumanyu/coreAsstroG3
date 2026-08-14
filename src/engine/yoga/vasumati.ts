/**
 * Vasumati Yoga (Phaladeepika Definition):
 * 
 * Vasumati Yoga forms when qualifying natural benefics occupy Upachaya houses (3, 6, 10, 11)
 * relative to either the Lagna or the natal Moon.
 * 
 * Reference Frame Mechanics (Option B):
 * - In the LAGNA reference frame: All four natural benefics (Mercury, Venus, Jupiter, and waxing Moon)
 *   must occupy Upachaya houses (3, 6, 10, 11) from the Lagna.
 * - In the MOON reference frame: The Moon acts as the reference body and is not required to occupy
 *   an Upachaya from itself. Only Jupiter, Venus, and Mercury are evaluated relative to the natal Moon,
 *   requiring all three to occupy Upachaya houses (3, 6, 10, 11) from the Moon's sign.
 * - Mixed-frame combinations do not form Vasumati Yoga.
 * 
 * Natural Benefic Classification (Vasumati context only, NOT functional nature):
 * - Jupiter: Always natural benefic
 * - Venus: Always natural benefic
 * - Mercury: Always natural benefic
 * - Moon: Natural benefic ONLY when waxing (0 < phase < 180 degrees from Sun)
 * 
 * Boundary Conditions for Waxing Moon:
 * - Phase = ((moonLon - sunLon) % 360 + 360) % 360
 * - Waxing condition: 0 < phase < 180
 * - Note: The exclusion of exact 0 degrees (New Moon / Amavasya) and exact 180 degrees
 *   (Full Moon / Purnima) is a repository operational convention for deterministic boundary handling.
 */

import { SIGNS_METADATA } from '../../data/astroData';
import { Planet, PlanetFact, Sign } from '../../types';
import { HouseGroups } from '../houseLordship/houseGroups';
import {
  YogaAnalysisInput,
  YogaCategory,
  YogaEvidence,
  YogaResult,
  YogaRule,
  YogaStrength,
  YogaType
} from './yogaTypes';

/**
 * Natural benefic classification for Vasumati Yoga only.
 * This is NOT functional nature.
 */
function isNaturalBenefic(planet: Planet, facts: Readonly<Record<Planet, PlanetFact>>): boolean {
  if (planet === Planet.JUPITER || planet === Planet.VENUS || planet === Planet.MERCURY) {
    return true;
  }
  if (planet === Planet.MOON) {
    const sunFact = facts[Planet.SUN];
    const moonFact = facts[Planet.MOON];
    if (!sunFact || !moonFact) return false;

    const sunLon = sunFact.position.eclipticLongitude ?? sunFact.position.longitude;
    const moonLon = moonFact.position.eclipticLongitude ?? moonFact.position.longitude;

    // Phase calculation: degrees Moon is ahead of Sun (0 to 360)
    const phase = ((moonLon - sunLon) % 360 + 360) % 360;

    // Waxing Moon boundary: strictly between 0 and 180 degrees.
    // 0 (New Moon) and 180 (Full Moon) are exact boundary points, not waxing.
    return phase > 0 && phase < 180;
  }
  return false;
}

/**
 * Derives house position (1-12) of a target sign relative to a reference sign.
 */
function getHouseFromReferenceSign(referenceSign: Sign, targetSign: Sign): number {
  const refNum = SIGNS_METADATA[referenceSign].number!;
  const targetNum = SIGNS_METADATA[targetSign].number!;
  return ((targetNum - refNum + 12) % 12) + 1;
}

export const vasumatiYogaRule: YogaRule = Object.freeze({
  id: 'YOGA_VASUMATI_001',
  type: YogaType.VASUMATI_YOGA,
  requiredPlanets: Object.freeze([Planet.MERCURY, Planet.VENUS, Planet.JUPITER, Planet.MOON]),
  requiresHouseLordship: false,
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    const facts = input.planetFacts;
    const factMerc = facts[Planet.MERCURY];
    const factVenus = facts[Planet.VENUS];
    const factJup = facts[Planet.JUPITER];
    const factMoon = facts[Planet.MOON];

    if (!factMerc || !factVenus || !factJup || !factMoon) return null;

    // All four benefics must be natural benefics (specifically Moon must be waxing)
    const benefics = [Planet.MERCURY, Planet.VENUS, Planet.JUPITER, Planet.MOON] as const;
    for (const b of benefics) {
      if (!isNaturalBenefic(b, facts)) {
        return null; // If Moon is waning or missing facts, Vasumati cannot form
      }
    }

    const upachaya: readonly number[] = HouseGroups.UPACHAYA;

    // Frame 1: FROM LAGNA
    const lagnaQualifies = benefics.every(p => upachaya.includes((facts[p].house ?? facts[p].position.house) as number));

    // Frame 2: FROM MOON (using Moon's SIGN as reference)
    const moonSign = factMoon.sign ?? factMoon.position.sign;
    const beneficsFromMoon = [Planet.MERCURY, Planet.VENUS, Planet.JUPITER] as const;
    const moonQualifies = beneficsFromMoon.every(p => {
      const pSign = facts[p].sign ?? facts[p].position.sign;
      const hFromMoon = getHouseFromReferenceSign(moonSign, pSign);
      return upachaya.includes(hFromMoon);
    });

    if (!lagnaQualifies && !moonQualifies) {
      return null;
    }

    const mercHouse = factMerc.house ?? factMerc.position.house;
    const venusHouse = factVenus.house ?? factVenus.position.house;
    const jupHouse = factJup.house ?? factJup.position.house;
    const moonHouse = factMoon.house ?? factMoon.position.house;

    const planets = Object.freeze([Planet.MERCURY, Planet.VENUS, Planet.JUPITER, Planet.MOON]);
    const houses = Object.freeze([mercHouse, venusHouse, jupHouse, moonHouse]);

    const evidenceList: YogaEvidence[] = [];

    if (lagnaQualifies) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'YOGA_VASUMATI_001',
          classicalReference: 'PHALADEPIKA_VASUMATI_YOGA',
          referenceFrame: 'LAGNA',
          reason: 'The natural benefics (Mercury, Venus, Jupiter, and waxing Moon) occupy Upachaya houses (3, 6, 10, 11) from the Lagna.',
          planets,
          houses
        })
      );
    }

    if (moonQualifies) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'YOGA_VASUMATI_001',
          classicalReference: 'PHALADEPIKA_VASUMATI_YOGA',
          referenceFrame: 'MOON',
          reason: 'Jupiter, Venus, and Mercury occupy Upachaya houses (3, 6, 10, 11) from the natal Moon; the Moon is the reference body.',
          planets,
          houses
        })
      );
    }

    return Object.freeze({
      type: YogaType.VASUMATI_YOGA,
      category: YogaCategory.PROSPERITY,
      strength: YogaStrength.STRONG,
      planets,
      houses,
      evidence: Object.freeze(evidenceList)
    });
  }
});
