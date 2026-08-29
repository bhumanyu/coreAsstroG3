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
 * Evaluates the RAW DOMAIN RELATION of a single factor against the claim's asserted outcome.
 *
 * Contract:
 * - Returns ALIGNS, OPPOSES, or NEUTRAL based on whether the factor's intrinsic astrological nature
 *   directly aligns with or opposes the domain outcome.
 * - This evaluates raw domain directionality WITHOUT proposition-level polarity inversion.
 * - For proposition-aware evaluation (which inverts polarity when the proposition itself is negative,
 *   e.g. asking about DELAY/LOSS), use evaluatePropositionFactor() instead.
 *
 * Rules (CW-07 Spec Section 10):
 * 1. Missing or UNKNOWN asserted outcome -> NEUTRAL alignment.
 * 2. ACTIVATION or MODIFICATION edge semantics represent domain activation/modulation
 *    and do not prove or disprove a specific outcome -> NEUTRAL alignment.
 * 3. MANIFESTS edge type: CW-07A treats MANIFESTS as NEUTRAL for proposition alignment; outcome-specific manifestation alignment is deferred to CW-07B.
 * 4. Otherwise:
 *    - factor.relation === 'SUPPORT' -> ALIGNS
 *    - factor.relation === 'CHALLENGE' -> OPPOSES
 *    - otherwise -> NEUTRAL
 */
export function evaluateFactorRelation(
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

  if (factor.edgeType === 'MANIFESTS') {
    // Note (CW-07A): MANIFESTS indicates domain manifestation; outcome-specific MANIFESTS handling is deferred to CW-07B.
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      alignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain manifestation; this relationship alone does not establish the asserted outcome.`
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
 * @deprecated Use evaluateFactorRelation or evaluatePropositionFactor instead.
 * - evaluateFactorRelation: evaluates raw astrological/domain relation semantics (ALIGNS/OPPOSES/NEUTRAL).
 * - evaluatePropositionFactor: evaluates user-proposition semantics with polarity awareness (SUPPORTS_PROPOSITION/OPPOSES_PROPOSITION/NEUTRAL).
 */
export const evaluateFactor = evaluateFactorRelation;

/**
 * Evaluates a factor with respect to the USER'S PROPOSITION (PROPOSITION SEMANTICS),
 * taking into account the asserted outcome's polarity (CW-07 Spec Section 14-15 with polarity correction).
 *
 * CW-07A: negative polarity establishes only generic negative proposition support; factor-specific outcome matching (DELAY != OBSTACLE != LOSS != VOLATILITY) is deferred to CW-07B.
 *
 * Contract:
 * - Returns SUPPORTS_PROPOSITION, OPPOSES_PROPOSITION, or NEUTRAL.
 * - Polarity inversion:
 *   - When the user asks a negative proposition (e.g. DELAY, OBSTACLE, CHALLENGE, LOSS):
 *     A CHALLENGE edge in the graph represents friction/obstacle, which SUPPORTS_PROPOSITION.
 *     A SUPPORT / CONFIRMS edge in the graph represents strength/smoothness, which OPPOSES_PROPOSITION.
 *   - When the user asks a positive proposition (e.g. SUPPORT, GROWTH, PROMOTION, STABILITY, MANIFESTATION):
 *     A SUPPORT / CONFIRMS edge in the graph SUPPORTS_PROPOSITION.
 *     A CHALLENGE edge in the graph OPPOSES_PROPOSITION.
 * - Special edge semantics:
 *   - ACTIVATES / MODIFIES: Domain activation/modulation is NEUTRAL with respect to specific outcomes.
 *   - MANIFESTS: Resolves to NEUTRAL in CW-07A even when assertedOutcome is MANIFESTATION.
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

  // Handle MANIFESTS edge specifically
  if (factor.edgeType === 'MANIFESTS') {
    // Note (CW-07A): MANIFESTS edge with assertedOutcome 'MANIFESTATION' yields NEUTRAL in CW-07A.
    // Outcome-specific MANIFESTS handling is deferred to CW-07B.
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      propositionAlignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain manifestation. This relationship alone does not establish the asserted outcome.`
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
    // Note (CW-07A): A CHALLENGE-relation factor currently supports ANY negative proposition (DELAY/LOSS/OBSTACLE/VOLATILITY)
    // because polarity is coarse-grained; outcome-specific evidence semantics (e.g. factor.outcomes = ['DELAY'] distinguishing
    // DELAY from LOSS) are deferred to CW-07B.
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
