import { Planet, Sign } from '../../types';
import {
  evaluateMahapurushaRule,
  PanchaMahapurushaRuleDefinition
} from './panchaMahapurusha';
import { YogaAnalysisInput, YogaResult, YogaRule, YogaType } from './yogaTypes';

export const ruchakaDefinition: PanchaMahapurushaRuleDefinition = Object.freeze({
  type: YogaType.RUCHAKA,
  planet: Planet.MARS,
  ownSigns: Object.freeze([Sign.ARIES, Sign.SCORPIO]),
  exaltationSign: Sign.CAPRICORN,
  ruleId: 'YOGA_RUCHAKA_001'
});

export const ruchakaRule: YogaRule = Object.freeze({
  id: ruchakaDefinition.ruleId,
  type: YogaType.RUCHAKA,
  requiredPlanets: Object.freeze([Planet.MARS]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    return evaluateMahapurushaRule(ruchakaDefinition, input);
  }
});
