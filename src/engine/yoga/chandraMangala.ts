/**
 * Chandra-Mangala Yoga (Conjunction-only scope):
 * 
 * Forms when the Moon and Mars are conjunct in the same house.
 * Opposition or mutual aspect configurations are explicitly excluded.
 */

import { Planet } from '../../types';
import {
  YogaAnalysisInput,
  YogaCategory,
  YogaEvidence,
  YogaResult,
  YogaRule,
  YogaStrength,
  YogaType
} from './yogaTypes';

export const chandraMangalaRule: YogaRule = Object.freeze({
  id: 'YOGA_CHANDRA_MANGALA_001',
  type: YogaType.CHANDRA_MANGALA_YOGA,
  requiredPlanets: Object.freeze([Planet.MOON, Planet.MARS]),
  requiresHouseLordship: false,
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    const factMoon = input.planetFacts[Planet.MOON];
    const factMars = input.planetFacts[Planet.MARS];

    if (!factMoon || !factMars) return null;

    if (factMoon.house !== factMars.house) return null;

    const planets = Object.freeze([Planet.MOON, Planet.MARS]);
    const houses = Object.freeze([factMoon.house]);

    const evidence: YogaEvidence = Object.freeze({
      ruleId: 'YOGA_CHANDRA_MANGALA_001',
      relationship: 'CONJUNCTION',
      classicalReference: 'BPHS_CHANDRA_MANGALA_YOGA',
      reason: `The Moon and Mars are conjunct in House ${factMoon.house}.`,
      planets,
      houses
    });

    return Object.freeze({
      type: YogaType.CHANDRA_MANGALA_YOGA,
      category: YogaCategory.DHANA,
      strength: YogaStrength.STRONG,
      planets,
      houses,
      evidence: Object.freeze([evidence])
    });
  }
});
