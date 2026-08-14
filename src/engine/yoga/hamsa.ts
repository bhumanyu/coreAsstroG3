import { Planet, Sign } from '../../types';
import {
  evaluateMahapurushaRule,
  PanchaMahapurushaRuleDefinition
} from './panchaMahapurusha';
import { YogaAnalysisInput, YogaResult, YogaRule, YogaType } from './yogaTypes';

export const hamsaDefinition: PanchaMahapurushaRuleDefinition = Object.freeze({
  type: YogaType.HAMSA,
  planet: Planet.JUPITER,
  ownSigns: Object.freeze([Sign.SAGITTARIUS, Sign.PISCES]),
  exaltationSign: Sign.CANCER,
  ruleId: 'YOGA_HAMSA_001'
});

export const hamsaRule: YogaRule = Object.freeze({
  id: hamsaDefinition.ruleId,
  type: YogaType.HAMSA,
  requiredPlanets: Object.freeze([Planet.JUPITER]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    return evaluateMahapurushaRule(hamsaDefinition, input);
  }
});
