import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateCareerYogas } from '../../evaluators/yogaEvaluator';

export const careerYogaRules: readonly ThemeRule[] = Object.freeze([
  {
    id: 'CAREER_YOGA_CONFIRMATION_001',
    evidenceFamily: CareerEvidenceFamily.YOGA,
    priority: 'CONFIRMATORY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult => {
      const yogas = evaluateCareerYogas(context);
      if (yogas.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence[] = yogas.map((y) => ({
        id: `CAREER_YOGA_CONFIRMATION_001:${y.yogaType}`,
        ruleId: 'CAREER_YOGA_CONFIRMATION_001',
        evidenceFamily: CareerEvidenceFamily.YOGA,
        priority: 'CONFIRMATORY',
        strength: y.strength,
        effect: y.effect,
        statement: y.statement,
        factors: y.factors,
        conditional: false,
        dimension: 'CONFIRMATION'
      }));

      return { triggered: true, evidence: Object.freeze(evidenceList) };
    }
  }
]);
