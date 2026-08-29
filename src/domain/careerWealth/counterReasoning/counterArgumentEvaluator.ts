import type {
  CounterReasoningClaim,
  CounterReasoningContext,
  CounterReasoningDisposition
} from './counterReasoningTypes';

export interface EvaluateCounterArgumentParams {
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly claim: CounterReasoningClaim;
  readonly context?: CounterReasoningContext;
}

export interface EvaluateCounterArgumentResult {
  readonly disposition: CounterReasoningDisposition;
  readonly rebuttal: string;
}

/**
 * Evaluates counter-arguments against the resolved evidence.
 * Rules:
 * - CONFIRMED: support > 0 and challenge === 0
 * - PARTIALLY_CONFIRMED: challenge > 0 (with or without support)
 * - INSUFFICIENT_EVIDENCE: support === 0 and challenge === 0
 * Note: Automatic conclusion reversal is strictly disallowed (conclusionChanged is immutable false).
 */
export function evaluateCounterArgument(
  params: EvaluateCounterArgumentParams
): EvaluateCounterArgumentResult {
  const { supportingEvidenceIds, challengingEvidenceIds, claim } = params;

  const supportCount = supportingEvidenceIds.length;
  const challengeCount = challengingEvidenceIds.length;

  if (supportCount === 0 && challengeCount === 0) {
    return {
      disposition: 'INSUFFICIENT_EVIDENCE',
      rebuttal: `No direct astrological evidence was identified in the reasoning graph for ${claim.targetSubjectKey}.`
    };
  }

  if (challengeCount > 0) {
    if (supportCount > 0) {
      return {
        disposition: 'PARTIALLY_CONFIRMED',
        rebuttal: `While ${supportCount} astrological factor(s) support ${claim.targetSubjectKey}, ${challengeCount} challenge factor(s) present active friction or qualification.`
      };
    }
    return {
      disposition: 'PARTIALLY_CONFIRMED',
      rebuttal: `${challengeCount} astrological counter-factor(s) challenge ${claim.targetSubjectKey} without active supporting evidence on this specific axis.`
    };
  }

  return {
    disposition: 'CONFIRMED',
    rebuttal: `${supportCount} astrological factor(s) confirm ${claim.targetSubjectKey} with no counter-evidence found in the reasoning graph.`
  };
}
