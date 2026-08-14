/**
 * Lakshmi Yoga (Parashari Definition):
 * 
 * Condition 1: The 9th lord's dignity status is OWN_SIGN, EXALTED, or MOOLATRIKONA.
 * Condition 2: The 9th lord is positioned in a Kendra (1, 4, 7, 10) or Trikona (1, 5, 9) house.
 * Condition 3: The Lagna lord's dignity status is OWN_SIGN, EXALTED, or MOOLATRIKONA.
 * 
 * Note: Condition 3 uses a deterministic dignity status proxy for the classical
 * "strong Lagna lord", rather than a Shadbala-based strength computation.
 */

import { DignityStatus } from '../../types';
import { House, HouseGroups } from '../houseLordship/houseGroups';
import {
  YogaAnalysisInput,
  YogaCategory,
  YogaEvidence,
  YogaResult,
  YogaRule,
  YogaStrength,
  YogaType
} from './yogaTypes';

const QUALIFYING_DIGNITIES: readonly DignityStatus[] = Object.freeze([
  DignityStatus.OWN_SIGN,
  DignityStatus.EXALTED,
  DignityStatus.MOOLATRIKONA
]);

const KENDRA_TRIKONA_HOUSES: readonly number[] = Object.freeze([
  ...HouseGroups.KENDRA,
  ...HouseGroups.TRIKONA
]);

export const lakshmiYogaRule: YogaRule = Object.freeze({
  id: 'YOGA_LAKSHMI_001',
  type: YogaType.LAKSHMI_YOGA,
  requiredPlanets: Object.freeze([]),
  requiresHouseLordship: true,
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    if (!input.houseLordship) return null;

    const ninthLord = input.houseLordship.houseLords[House.NINTH];
    const lagnaLord = input.houseLordship.houseLords[House.FIRST];

    if (!ninthLord || !lagnaLord) return null;

    const factNinth = input.planetFacts[ninthLord];
    const factLagna = input.planetFacts[lagnaLord];

    if (!factNinth || !factLagna) return null;

    const ninthHouse = factNinth.house ?? factNinth.position.house;
    const lagnaHouse = factLagna.house ?? factLagna.position.house;

    if (ninthHouse === undefined) return null;

    // Condition 1: 9th lord dignity
    if (!QUALIFYING_DIGNITIES.includes(factNinth.dignity.status)) {
      return null;
    }

    // Condition 2: 9th lord in Kendra or Trikona
    if (!KENDRA_TRIKONA_HOUSES.includes(ninthHouse)) {
      return null;
    }

    // Condition 3: Lagna lord strong by dignity (deterministic proxy)
    if (!QUALIFYING_DIGNITIES.includes(factLagna.dignity.status)) {
      return null;
    }

    const planets = Object.freeze([lagnaLord, ninthLord]);
    const houses = Object.freeze([ninthHouse]);

    let dignityLabel = 'own sign';
    if (factNinth.dignity.status === DignityStatus.EXALTED) {
      dignityLabel = 'exaltation sign';
    } else if (factNinth.dignity.status === DignityStatus.MOOLATRIKONA) {
      dignityLabel = 'Moolatrikona sign';
    }

    const evidence: YogaEvidence = Object.freeze({
      ruleId: 'YOGA_LAKSHMI_001',
      classicalReference: 'BPHS_LAKSHMI_YOGA',
      reason: `The 9th lord ${ninthLord} is in its ${dignityLabel} in House ${factNinth.house}, a Kendra/Trikona, and the Lagna lord ${lagnaLord} is strong by dignity.`,
      planets,
      houses
    });

    return Object.freeze({
      type: YogaType.LAKSHMI_YOGA,
      category: YogaCategory.PROSPERITY,
      strength: YogaStrength.STRONG,
      planets,
      houses,
      evidence: Object.freeze([evidence])
    });
  }
});
