import type { ConfidenceLevel } from './DomainInterpretationTypes';
import type { DomainEvidence } from './DomainEvidence';

export interface ConfidenceEvaluationOptions {
  readonly dataCompleteness?: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  readonly hasVargaConflict?: boolean;
  readonly hasPrimaryChallenge?: boolean;
}

export function calculateEvidenceConfidence(
  evidence: readonly DomainEvidence[],
  options?: ConfidenceEvaluationOptions
): ConfidenceLevel {
  if (evidence.length === 0) {
    return 'UNDETERMINED';
  }

  if (options?.dataCompleteness === 'INSUFFICIENT') {
    return 'LOW';
  }

  const primaryEvidence = evidence.filter(
    (e) => e.role === 'PRIMARY' || (e.phase === 'NATAL_PROMISE' && e.priority >= 90)
  );
  const primarySupporting = primaryEvidence.filter((e) => e.polarity === 'SUPPORTING');
  const primaryChallenging = primaryEvidence.filter((e) => e.polarity === 'CHALLENGING');

  const allSupporting = evidence.filter((e) => e.polarity === 'SUPPORTING');
  const allChallenging = evidence.filter((e) => e.polarity === 'CHALLENGING');

  const strongPrimarySupport = primarySupporting.filter(
    (e) => e.strength === 'STRONG' || e.strength === 'VERY_STRONG'
  );
  const veryStrongPrimarySupport = primarySupporting.filter(
    (e) => e.strength === 'VERY_STRONG'
  );

  const hasPrimaryChallenge =
    primaryChallenging.length > 0 || Boolean(options?.hasPrimaryChallenge);
  const hasVargaConflict = Boolean(options?.hasVargaConflict);

  // If no primary evidence is found
  if (primaryEvidence.length === 0) {
    return allSupporting.length > 0 ? 'LOW' : 'UNDETERMINED';
  }

  // If no supporting evidence exists at all
  if (allSupporting.length === 0) {
    return allChallenging.length > 0 ? 'LOW' : 'UNDETERMINED';
  }

  // Single weak primary evidence must NOT yield HIGH or VERY_HIGH
  if (primarySupporting.length === 1 && primarySupporting[0].strength === 'WEAK') {
    return 'LOW';
  }

  // Conflicted primary evidence
  if (hasPrimaryChallenge || hasVargaConflict) {
    if (strongPrimarySupport.length >= 1 && !hasVargaConflict) {
      return 'MODERATE';
    }
    return 'LOW';
  }

  // Strong multi-factor / very strong support
  if (veryStrongPrimarySupport.length >= 1 || (strongPrimarySupport.length >= 2 && allSupporting.length >= 3)) {
    return 'VERY_HIGH';
  }

  if (strongPrimarySupport.length >= 1 || primarySupporting.length >= 2) {
    return 'HIGH';
  }

  if (primarySupporting.some((e) => e.strength === 'MODERATE') || allSupporting.length >= 2) {
    return 'MODERATE';
  }

  return 'LOW';
}

