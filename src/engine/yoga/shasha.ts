import { Planet, Sign } from '../../types';
import {
  evaluateMahapurushaRule,
  PanchaMahapurushaRuleDefinition
} from './panchaMahapurusha';
import { YogaAnalysisInput, YogaResult, YogaRule, YogaType } from './yogaTypes';

export const shashaDefinition: PanchaMahapurushaRuleDefinition = Object.freeze({
  type: YogaType.SHASHA,
  planet: Planet.SATURN,
  ownSigns: Object.freeze([Sign.CAPRICORN, Sign.AQUARIUS]),
  exaltationSign: Sign.LIBRA,
  ruleId: 'YOGA_SHASHA_001'
});

export const shashaRule: YogaRule = Object.freeze({
  id: shashaDefinition.ruleId,
  type: YogaType.SHASHA,
  requiredPlanets: Object.freeze([Planet.SATURN]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    return evaluateMahapurushaRule(shashaDefinition, input);
  }
});
