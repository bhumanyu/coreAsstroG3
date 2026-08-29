import type {
  CounterReasoningClaim,
  CounterReasoningContext,
  CounterReasoningDisposition
} from './counterReasoningTypes';

export interface HierarchyGuardrailParams {
  readonly disposition: CounterReasoningDisposition;
  readonly claim: CounterReasoningClaim;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly context?: CounterReasoningContext;
}

export interface HierarchyGuardrailResult {
  readonly guardrailApplied: boolean;
  readonly guardrailReasons: readonly string[];
  readonly allowed: true;
}

/**
 * Applies CW-01A hierarchy and protection guardrails to counter-reasoning evaluation.
 * Invariants:
 * - Natal promise is the primary authority; secondary dasha or divisional challenges modulate timing/manifestation without negating natal capacity.
 * - Primary evidence is protected against reversal.
 * - In V1, allowed is always true (informative guardrails without blocking user interaction).
 */
export function applyHierarchyGuardrails(
  params: HierarchyGuardrailParams
): HierarchyGuardrailResult {
  const { claim, supportingEvidenceIds, challengingEvidenceIds, context } = params;
  const reasons: string[] = [];

  const primaryIds = new Set(context?.primaryEvidenceIds ?? []);
  const hasSupportingPrimary = supportingEvidenceIds.some((id) => primaryIds.has(id));
  const natalStatus = context?.natalPromiseStatus;
  const isStrongNatal = natalStatus === 'VERY_STRONG' || natalStatus === 'STRONG';
  const isModerateNatal = natalStatus === 'MODERATE';

  if (challengingEvidenceIds.length > 0) {
    if (isStrongNatal || hasSupportingPrimary) {
      reasons.push(
        'CW-01A: Secondary evidence cannot automatically reverse the primary natal direction, but may activate, delay, modify, qualify, or constrain manifestation.'
      );
      reasons.push('CW-01A: Primary natal evidence is protected against categorical reversal.');
    } else if (isModerateNatal) {
      reasons.push(
        'CW-01A: Primary direction exists but is qualified; secondary factors modulate timing and manifestation.'
      );
    } else if (claim.targetSubjectKey !== 'NATAL_PROMISE') {
      reasons.push(
        'CW-01A: Secondary axis challenges modulate manifestation timing without overturning foundational chart potential.'
      );
    }
  }

  const guardrailApplied = reasons.length > 0;

  return {
    guardrailApplied,
    guardrailReasons: reasons,
    allowed: true
  };
}

