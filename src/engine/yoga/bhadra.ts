import { Planet, Sign } from '../../types';
import {
  evaluateMahapurushaRule,
  PanchaMahapurushaRuleDefinition
} from './panchaMahapurusha';
import { YogaAnalysisInput, YogaResult, YogaRule, YogaType } from './yogaTypes';

export const bhadraDefinition: PanchaMahapurushaRuleDefinition = Object.freeze({
  type: YogaType.BHADRA,
  planet: Planet.MERCURY,
  ownSigns: Object.freeze([Sign.GEMINI, Sign.VIRGO]),
  exaltationSign: Sign.VIRGO,
  ruleId: 'YOGA_BHADRA_001'
});

export const bhadraRule: YogaRule = Object.freeze({
  id: bhadraDefinition.ruleId,
  type: YogaType.BHADRA,
  requiredPlanets: Object.freeze([Planet.MERCURY]),
  evaluate(input: YogaAnalysisInput): YogaResult | null {
    return evaluateMahapurushaRule(bhadraDefinition, input);
  }
});
