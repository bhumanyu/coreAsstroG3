import type {
  CounterReasoningClaim,
  CounterReasoningContext,
  CounterReasoningDisposition,
  CounterReasoningFactor
} from './counterReasoningTypes';

export interface EvaluateCounterArgumentParams {
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly claim: CounterReasoningClaim;
  readonly context?: CounterReasoningContext;
  readonly factors?: readonly CounterReasoningFactor[];
}

export interface EvaluateCounterArgumentResult {
  readonly disposition: CounterReasoningDisposition;
  readonly rebuttal: string;
}

/**
 * Evaluates counter-arguments against the resolved evidence and claim asserted polarity.
 *
 * Rules:
 * For CHALLENGE assertions (e.g. 'Is Dasha causing delays?'):
 * - Aligned evidence is challenging factors in the graph (challengeCount).
 * - Opposing evidence is supportive/activating factors in the graph (supportCount).
 * - challengeCount > 0 && supportCount === 0 -> CONFIRMED (challenge assertion is confirmed)
 * - challengeCount > 0 && supportCount > 0 -> PARTIALLY_CONFIRMED (friction exists alongside activation)
 * - challengeCount === 0 && supportCount > 0 -> INSUFFICIENT_EVIDENCE (delay/challenge claim is not supported; only activation/support present)
 * - challengeCount === 0 && supportCount === 0 -> INSUFFICIENT_EVIDENCE
 *
 * For SUPPORT / NEUTRAL propositions (e.g. 'Why is career strong?'):
 * - supportCount > 0 && challengeCount === 0 -> CONFIRMED
 * - supportCount > 0 && challengeCount > 0 -> PARTIALLY_CONFIRMED
 * - supportCount === 0 && challengeCount > 0 -> REJECTED
 * - supportCount === 0 && challengeCount === 0 -> INSUFFICIENT_EVIDENCE
 *
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

  // Handle CHALLENGE assertions (question asserts delay, obstacle, or challenge)
  if (claim.assertedPolarity === 'CHALLENGE') {
    if (challengeCount > 0) {
      if (supportCount > 0) {
        return {
          disposition: 'PARTIALLY_CONFIRMED',
          rebuttal: `While ${challengeCount} challenge factor(s) introduce friction or delay for ${claim.targetSubjectKey}, ${supportCount} supportive factor(s) maintain activation.`
        };
      }
      return {
        disposition: 'CONFIRMED',
        rebuttal: `${challengeCount} astrological counter-factor(s) confirm challenges or delays for ${claim.targetSubjectKey} with no unconstrained supportive factors found.`
      };
    }

    // challengeCount === 0 and supportCount > 0:
    // User asserted a challenge/delay, but graph only has ACTIVATES / SUPPORTS
    return {
      disposition: 'INSUFFICIENT_EVIDENCE',
      rebuttal: `No astrological challenge or delay factors were identified in the reasoning graph for ${claim.targetSubjectKey}; active factors indicate supportive or activating planetary influences.`
    };
  }

  // Handle SUPPORT / NEUTRAL propositions
  if (supportCount > 0) {
    if (challengeCount > 0) {
      return {
        disposition: 'PARTIALLY_CONFIRMED',
        rebuttal: `While ${supportCount} astrological factor(s) support ${claim.targetSubjectKey}, ${challengeCount} challenge factor(s) present active friction or qualification.`
      };
    }
    return {
      disposition: 'CONFIRMED',
      rebuttal: `${supportCount} astrological factor(s) confirm ${claim.targetSubjectKey} with no counter-evidence found in the reasoning graph.`
    };
  }

  // supportCount === 0 and challengeCount > 0
  return {
    disposition: 'REJECTED',
    rebuttal: `No supportive astrological evidence was found for ${claim.targetSubjectKey}; ${challengeCount} counter-factor(s) challenge this proposition.`
  };
}

