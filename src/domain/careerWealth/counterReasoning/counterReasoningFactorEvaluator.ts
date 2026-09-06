/**
 * Known remaining CW-07B items / Documented gaps:
 * - MANIFESTS edge semantics: MANIFESTS remains NEUTRAL regardless of outcomeSemantics (Option A).
 *   Manifestation outcome-specific handling is a documented gap and deferred to future work.
 */

import type {
  CounterReasoningClaim,
  CounterReasoningFactor,
  EvaluatedCounterReasoningFactor,
  EvaluatedFactorRelation,
  CounterReasoningAlignment,
  CounterReasoningPropositionAlignment
} from './counterReasoningTypes';
import { resolveEdgeSemantic, resolveOutcomePolarity } from './counterReasoningSemantics';
import { matchFactorOutcome } from './counterReasoningOutcomeMatcher';
import { applyAssertion } from './counterReasoningAssertionSemantics';

export { resolveEdgeSemantic } from './counterReasoningSemantics';

/**
 * Evaluates the RAW DOMAIN RELATION of a single factor against the claim's asserted outcome.
 *
 * Contract (Issue #13 & #14 API Separation):
 * - Returns ONLY raw domain semantics (ALIGNS | OPPOSES | NEUTRAL) on `alignment`.
 * - Does NOT return propositionAlignment (which is exclusively computed by evaluatePropositionFactor).
 * - This evaluates raw domain directionality WITHOUT user assertion or polarity inversion.
 */
export function evaluateFactorRelation(
  factor: CounterReasoningFactor,
  claim: CounterReasoningClaim
): EvaluatedFactorRelation {
  const outcomeMatch = matchFactorOutcome(factor, claim);
  const edgeSemantic = resolveEdgeSemantic(factor.edgeType);

  if (!claim.assertedOutcome || claim.assertedOutcome === 'UNKNOWN') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      alignment: 'NEUTRAL',
      reason: 'No specific outcome asserted to align or oppose.'
    };
  }

  if (factor.edgeType === 'MANIFESTS') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      alignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain manifestation; manifestation outcome semantics are a known remaining CW-07B gap and this relationship alone does not establish the asserted outcome.`
    };
  }

  if (edgeSemantic === 'ACTIVATION' || edgeSemantic === 'MODIFICATION') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
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
    edgeSemantic,
    outcomeMatch,
    alignment,
    reason
  };
}

/**
 * @deprecated Use evaluateFactorRelation or evaluatePropositionFactor instead.
 */
export const evaluateFactor = evaluateFactorRelation;

/**
 * Evaluates a factor with respect to the USER'S PROPOSITION (PROPOSITION SEMANTICS),
 * integrating outcome matching, edge semantics, polarity, and assertion mode/polarity.
 *
 * Design note (Issue #13 & #14):
 * - `propositionAlignment` is the single authoritative field consumed by downstream evaluators.
 * - `relationAlignment` captures the raw domain relation purely for trace introspection.
 * - Downstream evaluation (disposition calculation) NEVER relies on raw alignment.
 *
 * Evaluation Order (Critical):
 * a. Compute outcomeMatch = matchFactorOutcome(factor, claim).
 * b. If assertedOutcome is undefined or 'UNKNOWN' -> NEUTRAL.
 * c. If edgeType is 'ACTIVATES' or 'MODIFIES' -> NEUTRAL.
 * d. If edgeType is 'MANIFESTS' -> NEUTRAL.
 * e. If outcomeMatch === 'ABSENT' -> NEUTRAL ('Factor has explicit outcome semantics, but not the asserted outcome.').
 * f. Otherwise compute baseAlignment from relation & polarity, apply assertion mode & polarity, and set reason.
 */
export function evaluatePropositionFactor(
  factor: CounterReasoningFactor,
  claim: CounterReasoningClaim
): EvaluatedCounterReasoningFactor {
  const outcomeMatch = matchFactorOutcome(factor, claim);
  const edgeSemantic = resolveEdgeSemantic(factor.edgeType);

  // a & b. Missing or UNKNOWN asserted outcome
  if (!claim.assertedOutcome || claim.assertedOutcome === 'UNKNOWN') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      propositionAlignment: 'NEUTRAL',
      relationAlignment: 'NEUTRAL',
      reason: 'No specific asserted outcome is available.'
    };
  }

  // c. ACTIVATES or MODIFIES edge semantics
  if (edgeSemantic === 'ACTIVATION' || edgeSemantic === 'MODIFICATION' || factor.edgeType === 'ACTIVATES' || factor.edgeType === 'MODIFIES') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      propositionAlignment: 'NEUTRAL',
      relationAlignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain activation or modulation; this relationship alone does not establish the asserted outcome.`
    };
  }

  // d. MANIFESTS edge type (remains NEUTRAL regardless of outcomeSemantics - documented gap)
  if (factor.edgeType === 'MANIFESTS') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      propositionAlignment: 'NEUTRAL',
      relationAlignment: 'NEUTRAL',
      reason: `${factor.edgeType} indicates domain manifestation; manifestation outcome semantics are a known remaining CW-07B gap and this relationship alone does not establish the asserted outcome.`
    };
  }

  // e. Outcome semantics explicit but mismatching (ABSENT)
  if (outcomeMatch === 'ABSENT') {
    return {
      evidenceId: factor.evidenceId,
      edgeType: factor.edgeType,
      explanation: factor.explanation,
      relation: factor.relation,
      edgeSemantic,
      outcomeMatch,
      propositionAlignment: 'NEUTRAL',
      relationAlignment: factor.relation === 'SUPPORT' ? 'ALIGNS' : factor.relation === 'CHALLENGE' ? 'OPPOSES' : 'NEUTRAL',
      reason: 'Factor has explicit outcome semantics, but not the asserted outcome.'
    };
  }

  // f. EXACT or UNSPECIFIED -> compute baseAlignment from relation and polarity
  const polarity = resolveOutcomePolarity(claim.assertedOutcome);
  let baseAlignment: CounterReasoningPropositionAlignment = 'NEUTRAL';
  let reason: string;

  if (polarity === 'NEGATIVE') {
    if (factor.relation === 'CHALLENGE') {
      baseAlignment = 'SUPPORTS_PROPOSITION';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor indicates challenge or friction, which supports the negative proposition.';
    } else if (factor.relation === 'SUPPORT') {
      baseAlignment = 'OPPOSES_PROPOSITION';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor indicates supportive activation, which opposes the negative proposition.';
    } else {
      baseAlignment = 'NEUTRAL';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor is neutral with respect to the negative proposition.';
    }
  } else {
    // POSITIVE or NEUTRAL polarity
    if (factor.relation === 'SUPPORT') {
      baseAlignment = 'SUPPORTS_PROPOSITION';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor supports the positive proposition.';
    } else if (factor.relation === 'CHALLENGE') {
      baseAlignment = 'OPPOSES_PROPOSITION';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor challenges or opposes the positive proposition.';
    } else {
      baseAlignment = 'NEUTRAL';
      reason = outcomeMatch === 'EXACT'
        ? 'Factor explicitly matches the asserted outcome.'
        : 'Factor is neutral with respect to the proposition.';
    }
  }

  const finalAlignment = applyAssertion(baseAlignment, claim.assertionMode, claim.assertionPolarity);

  return {
    evidenceId: factor.evidenceId,
    edgeType: factor.edgeType,
    explanation: factor.explanation,
    relation: factor.relation,
    edgeSemantic,
    outcomeMatch,
    propositionAlignment: finalAlignment,
    relationAlignment: factor.relation === 'SUPPORT' ? 'ALIGNS' : factor.relation === 'CHALLENGE' ? 'OPPOSES' : 'NEUTRAL',
    reason
  };
}


