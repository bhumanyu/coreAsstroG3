import {
  ThemeRuleResult,
  ThemeInterpretationEvidence
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { WealthEvidenceFamily, WealthRule } from '../../wealthThemeInterpretationTypes';
import { evaluateWealthYogas } from '../../evaluators/wealthYogaEvaluator';

export const wealthYogaRules: readonly WealthRule[] = Object.freeze([
  {
    id: 'WEALTH_YOGA_CONFIRMATION_001',
    evidenceFamily: WealthEvidenceFamily.YOGA,
    priority: 'CONFIRMATORY',
    evaluate: (context: ThemeInterpretationContext): ThemeRuleResult<WealthEvidenceFamily> => {
      const yogas = evaluateWealthYogas(context);
      if (yogas.length === 0) {
        return { triggered: false };
      }

      const evidenceList: ThemeInterpretationEvidence<WealthEvidenceFamily>[] = yogas.map((y) => ({
        id: `WEALTH_YOGA_CONFIRMATION_001:${y.yogaType}`,
        ruleId: 'WEALTH_YOGA_CONFIRMATION_001',
        evidenceFamily: WealthEvidenceFamily.YOGA,
        priority: 'CONFIRMATORY',
        strength: y.strength,
        effect: y.effect,
        statement: y.statement,
        factors: y.factors,
        conditional: true,
        dimension: 'CONFIRMATION'
      }));

      return { triggered: true, evidence: Object.freeze(evidenceList) };
    }
  }
]);
