import type {
  CounterReasoningClaim,
  CounterReasoningContext,
  CounterReasoningDisposition,
  CounterReasoningFactor,
  CounterReasoningPropositionFactor
} from './counterReasoningTypes';
import { evaluatePropositionFactor } from './counterReasoningFactorEvaluator';

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
  readonly evaluatedFactors: readonly CounterReasoningPropositionFactor[];
}

/**
 * Evaluates counter-arguments using deterministic semantic factor evaluation.
 *
 * Rules (CW-07 Spec Section 19):
 * 1. Each graph factor is mapped to a CounterReasoningPropositionFactor based on edge semantics and claim outcome polarity.
 * 2. Factors are deterministically sorted by evidenceId then edgeType.
 * 3. Dispositions are derived strictly from the presence (not magnitude) of supporting and opposing proposition factors:
 *    - SUPPORTS_PROPOSITION > 0 && OPPOSES_PROPOSITION === 0 -> CONFIRMED
 *    - SUPPORTS_PROPOSITION === 0 && OPPOSES_PROPOSITION > 0 -> REJECTED
 *    - SUPPORTS_PROPOSITION > 0 && OPPOSES_PROPOSITION > 0 -> PARTIALLY_CONFIRMED
 *    - SUPPORTS_PROPOSITION === 0 && OPPOSES_PROPOSITION === 0 -> INSUFFICIENT_EVIDENCE
 * 4. Automatic conclusion reversal is strictly disallowed (conclusionChanged is immutable false).
 */
export function evaluateCounterArgument(
  params: EvaluateCounterArgumentParams
): EvaluateCounterArgumentResult {
  const { claim, factors } = params;

  if (!factors || factors.length === 0) {
    return {
      disposition: 'INSUFFICIENT_EVIDENCE',
      rebuttal: `No direct astrological evidence was identified in the reasoning graph for ${claim.targetSubjectKey}.`,
      evaluatedFactors: []
    };
  }

  // Evaluate each factor against the proposition and sort deterministically
  const evaluatedFactors = factors
    .map((factor) => evaluatePropositionFactor(factor, claim))
    .sort((a, b) => {
      const idCmp = a.evidenceId.localeCompare(b.evidenceId);
      if (idCmp !== 0) return idCmp;
      return a.edgeType.localeCompare(b.edgeType);
    });

  let supportsCount = 0;
  let opposesCount = 0;

  for (const factor of evaluatedFactors) {
    if (factor.propositionAlignment === 'SUPPORTS_PROPOSITION') {
      supportsCount++;
    } else if (factor.propositionAlignment === 'OPPOSES_PROPOSITION') {
      opposesCount++;
    }
  }

  if (supportsCount > 0 && opposesCount === 0) {
    return {
      disposition: 'CONFIRMED',
      rebuttal: `${supportsCount} astrological factor(s) confirm ${claim.targetSubjectKey} with no opposing factors found in the reasoning graph.`,
      evaluatedFactors
    };
  }

  if (supportsCount > 0 && opposesCount > 0) {
    return {
      disposition: 'PARTIALLY_CONFIRMED',
      rebuttal: `While ${supportsCount} astrological factor(s) support the proposition for ${claim.targetSubjectKey}, ${opposesCount} factor(s) present active qualification or friction.`,
      evaluatedFactors
    };
  }

  if (supportsCount === 0 && opposesCount > 0) {
    return {
      disposition: 'REJECTED',
      rebuttal: `No supportive astrological evidence was found for ${claim.targetSubjectKey}; ${opposesCount} counter-factor(s) challenge this proposition.`,
      evaluatedFactors
    };
  }

  return {
    disposition: 'INSUFFICIENT_EVIDENCE',
    rebuttal: `No direct confirming or opposing astrological factors were identified in the reasoning graph for ${claim.targetSubjectKey}; active factors provide general activation or modification without establishing the asserted outcome.`,
    evaluatedFactors
  };
}


