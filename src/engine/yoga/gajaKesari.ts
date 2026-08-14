import { Planet } from '../../types';
import {
  YogaRule,
  YogaType,
  YogaCategory,
  YogaStrength,
  YogaResult,
  YogaEvidence,
  YogaAnalysisInput
} from './yogaTypes';

const RULE_ID = 'YOGA_GAJA_KESARI_001';

export const gajaKesariRule: YogaRule = Object.freeze({
  id: RULE_ID,
  type: YogaType.GAJA_KESARI,
  requiredPlanets: Object.freeze([Planet.MOON, Planet.JUPITER]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    const moonFact = input.planetFacts[Planet.MOON];
    const jupiterFact = input.planetFacts[Planet.JUPITER];
    if (!moonFact || !jupiterFact) return null;

    const moonHouse = moonFact.house ?? moonFact.position.house;
    const jupiterHouse = jupiterFact.house ?? jupiterFact.position.house;

    if (moonHouse === undefined || jupiterHouse === undefined) return null;

    const relativeHouseDistance = (jupiterHouse - moonHouse + 12) % 12;

    if ([0, 3, 6, 9].includes(relativeHouseDistance)) {
      const planets: readonly Planet[] = Object.freeze([Planet.MOON, Planet.JUPITER]);
      const houses: readonly (number | undefined)[] = Object.freeze([moonHouse, jupiterHouse]);

      const evidenceItem: YogaEvidence = Object.freeze({
        ruleId: RULE_ID,
        reason: 'Gaja Kesari Yoga formed because Jupiter occupies a Kendra from the Moon.',
        planets,
        houses,
        relativeHouseDistance
      });

      return Object.freeze({
        type: YogaType.GAJA_KESARI,
        category: YogaCategory.RAJA,
        strength: YogaStrength.STRONG,
        planets,
        houses,
        evidence: Object.freeze([evidenceItem])
      });
    }

    return null;
  }
});
