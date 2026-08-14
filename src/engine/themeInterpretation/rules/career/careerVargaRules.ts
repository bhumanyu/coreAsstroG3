import {
  ThemeRule,
  ThemeRuleResult,
  CareerEvidenceFamily,
  ThemeInterpretationEvidence,
  CareerNatalPromise
} from '../../themeInterpretationTypes';
import { ThemeInterpretationContext } from '../../themeInterpretationContext';
import { evaluateD10VargaConfirmation } from '../../evaluators/vargaEvaluator';

/**
 * D10 Structural Confirmation v1:
 * Provides introductory divisional confirmation for 10th house career promise.
 * Note: This is an initial structural confirmation layer and not the full standalone D10 career engine.
 */
export function evaluateD10Rule(
  context: ThemeInterpretationContext,
  natalPromise?: CareerNatalPromise
): ThemeRuleResult {
  const vargaEv = evaluateD10VargaConfirmation(context, natalPromise);
  if (vargaEv.relationship === 'UNAVAILABLE') {
    return { triggered: false };
  }

  const evidence: ThemeInterpretationEvidence = {
    id: 'CAREER_D10_CONFIRMATION_001:D10',
    ruleId: 'CAREER_D10_CONFIRMATION_001',
    evidenceFamily: CareerEvidenceFamily.D10,
    priority: 'CONFIRMATORY',
    strength: vargaEv.relationship === 'CONFIRMS' ? 'STRONG' : 'MODERATE',
    effect: vargaEv.effect,
    statement: vargaEv.statement,
    vargaEvidence: vargaEv,
    conditional: vargaEv.relationship === 'MODIFIES',
    dimension: 'CONFIRMATION'
  };

  return { triggered: true, evidence };
}

export const careerVargaRules: readonly ThemeRule[] = Object.freeze([
  {
    id: 'CAREER_D10_CONFIRMATION_001',
    evidenceFamily: CareerEvidenceFamily.D10,
    priority: 'CONFIRMATORY',
    evaluate: (context: ThemeInterpretationContext, natalPromise?: any): ThemeRuleResult => {
      return evaluateD10Rule(context, natalPromise);
    }
  }
]);
