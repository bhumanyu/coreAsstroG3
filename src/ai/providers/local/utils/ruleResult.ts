import type {
  LocalRuleEffect,
  LocalRuleEvaluation
} from '../localVedicRulesTypes';

export function triggered(
  effect: LocalRuleEffect,
  statement: string,
  supporting: readonly string[] = [],
  challenging: readonly string[] = [],
  warnings: readonly string[] = []
): LocalRuleEvaluation {
  return {
    triggered: true,
    effect,
    statement,
    supportingEvidenceIds: Object.freeze([...supporting]),
    challengingEvidenceIds: Object.freeze([...challenging]),
    warnings: warnings.length > 0 ? Object.freeze([...warnings]) : undefined
  };
}

export function notTriggered(): LocalRuleEvaluation {
  return {
    triggered: false,
    effect: 'NEUTRAL',
    statement: ''
  };
}
