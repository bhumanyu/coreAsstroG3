import type {
  CounterReasoningClaim,
  CounterReasoningFactor,
  CounterReasoningPropositionFactor,
  EvaluatedCounterReasoningFactor,
  CounterReasoningAlignment,
  CounterReasoningPropositionAlignment
} from './counterReasoningTypes';
import { resolveEdgeSemantic, resolveOutcomePolarity } from './counterReasoningSemantics';

/**
 * Evaluates the alignment of a single factor against the claim's asserted outcome.
 *
 * Rules (CW-07 Spec Section 10):
 * 1. Missing or UNKNOWN asserted outcome -> NEUTRAL alignment.
 * 2. ACTIVATION or MODIFICATION edge semantics represent domain activation/modulation
 *    and do not prove or disprove a specific outcome -> NEUTRAL alignment.
 * 3. Otherwise:
 *    - factor.relation === 'SUPPORT' -> ALIGNS
 *    - factor.relation === 'CHALLENGE' -> OPPOSES
 *    - otherwise -> NEUTRAL
 */
export function evaluateFactor(
  factor: CounterReasoningFactor,
  claim: CounterReasoningClaim
): EvaluatedCounterReasoningFactor {
  if (!claim.assertedOutcome || claim.assertedOutcome === 'UNKNOWN') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      alignment: 'NEUTRAL',
      reason: 'No specific outcome asserted to align or oppose.'
    };
  }

  const edgeSemantic = resolveEdgeSemantic(factor.edgeType);
  if (edgeSemantic === 'ACTIVATION' || edgeSemantic === 'MODIFICATION') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      alignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain activation or modulation; this relationship alone does not establish the asserted outcome.`
    };
  }

  let alignment: CounterReasoningAlignment = 'NEUTRAL';
  let reason: string;

  if (factor.relation === 'SUPPORT') {
    alignment = 'ALIGNS';
    reason = 'Factor supports the asserted domain outcome.';
  } else if (factor.relation === 'CHALLENGE') {
    alignment = 'OPPOSES';
    reason = 'Factor challenges the asserted domain outcome.';
  } else {
    alignment = 'NEUTRAL';
    reason = 'Factor is neutral with respect to the outcome.';
  }

  return {
    evidenceId: factor.evidenceId,
    edgeType: factor.edgeType,
    explanation: factor.explanation,
    relation: factor.relation,
    alignment,
    reason
  };
}

/**
 * Evaluates a factor with respect to the user's proposition, taking into account
 * the asserted outcome's polarity (CW-07 Spec Section 14-15 with polarity correction).
 *
 * Polarity awareness:
 * - If assertedOutcome has NEGATIVE polarity (e.g. DELAY, OBSTACLE, CHALLENGE, LOSS):
 *   A CHALLENGE edge in the graph represents friction/obstacle, which SUPPORTS the negative proposition.
 *   A SUPPORT edge in the graph represents strength/smoothness, which OPPOSES the negative proposition.
 * - If assertedOutcome has POSITIVE or NEUTRAL polarity (e.g. SUPPORT, GROWTH, PROMOTION):
 *   A SUPPORT edge in the graph SUPPORTS the positive proposition.
 *   A CHALLENGE edge in the graph OPPOSES the positive proposition.
 * - ACTIVATION / MODIFICATION edges remain NEUTRAL (ACTIVATION is not proof of delay or loss).
 *
 * Note: full proposition-reversal via claim polarity for negated propositions (assertionMode: 'DENY')
 * is deferred to CW-07B since claimResolver does not yet parse explicit deny/affirm modes.
 */
export function evaluatePropositionFactor(
  factor: CounterReasoningFactor,
  claim: CounterReasoningClaim
): CounterReasoningPropositionFactor {
  const edgeSemantic = resolveEdgeSemantic(factor.edgeType);

  if (!claim.assertedOutcome || claim.assertedOutcome === 'UNKNOWN') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      propositionAlignment: 'NEUTRAL',
      reason: 'No specific asserted outcome to determine proposition alignment.'
    };
  }

  if (edgeSemantic === 'ACTIVATION' || edgeSemantic === 'MODIFICATION') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      propositionAlignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain activation or modulation. This relationship alone does not establish the asserted outcome.`
    };
  }

  const polarity = resolveOutcomePolarity(claim.assertedOutcome);
  let propositionAlignment: CounterReasoningPropositionAlignment = 'NEUTRAL';
  let reason: string;

  if (polarity === 'NEGATIVE') {
    if (factor.relation === 'CHALLENGE') {
      propositionAlignment = 'SUPPORTS_PROPOSITION';
      reason = 'Factor indicates challenge or friction, which supports the negative proposition.';
    } else if (factor.relation === 'SUPPORT') {
      propositionAlignment = 'OPPOSES_PROPOSITION';
      reason = 'Factor indicates supportive activation, which opposes the negative proposition.';
    } else {
      propositionAlignment = 'NEUTRAL';
      reason = 'Factor is neutral with respect to the negative proposition.';
    }
  } else {
    // POSITIVE or NEUTRAL polarity
    if (factor.relation === 'SUPPORT') {
      propositionAlignment = 'SUPPORTS_PROPOSITION';
      reason = 'Factor supports the positive proposition.';
    } else if (factor.relation === 'CHALLENGE') {
      propositionAlignment = 'OPPOSES_PROPOSITION';
      reason = 'Factor challenges or opposes the positive proposition.';
    } else {
      propositionAlignment = 'NEUTRAL';
      reason = 'Factor is neutral with respect to the proposition.';
    }
  }

  return {
    evidenceId: factor.evidenceId,
    edgeType: factor.edgeType,
    explanation: factor.explanation,
    relation: factor.relation,
    edgeSemantic,
    propositionAlignment,
    reason
  };
}
