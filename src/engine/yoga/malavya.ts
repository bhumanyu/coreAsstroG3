import { Planet, Sign } from '../../types';
import {
  evaluateMahapurushaRule,
  PanchaMahapurushaRuleDefinition
} from './panchaMahapurusha';
import { YogaAnalysisInput, YogaResult, YogaRule, YogaType } from './yogaTypes';

export const malavyaDefinition: PanchaMahapurushaRuleDefinition = Object.freeze({
  type: YogaType.MALAVYA,
  planet: Planet.VENUS,
  ownSigns: Object.freeze([Sign.TAURUS, Sign.LIBRA]),
  exaltationSign: Sign.PISCES,
  ruleId: 'YOGA_MALAVYA_001'
});

export const malavyaRule: YogaRule = Object.freeze({
  id: malavyaDefinition.ruleId,
  type: YogaType.MALAVYA,
  requiredPlanets: Object.freeze([Planet.VENUS]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    return evaluateMahapurushaRule(malavyaDefinition, input);
  }
});
