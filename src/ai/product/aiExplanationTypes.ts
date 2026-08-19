import type { AiEvidence } from '../types/aiContextTypes';
import type { AiTask } from '../types/aiRequestTypes';
import type { AiProviderKind } from '../types/aiProviderTypes';
import type {
  AiRoutingMode,
  AiProviderSelectionReason
} from '../routing/aiRoutingTypes';

export interface AiExplanationEvidence {
  readonly evidence: AiEvidence;
  readonly role: 'SUPPORTING' | 'CHALLENGING';
}

export interface AiExplanationViewModel {
  readonly kind: 'SUCCESS';
  readonly requestId: string;
  readonly task: AiTask;
  readonly status: 'SUCCESS' | 'PARTIAL';
  readonly conclusion: string;
  readonly supportingEvidence: readonly AiExplanationEvidence[];
  readonly challengingEvidence: readonly AiExplanationEvidence[];
  readonly unresolvedQuestions: readonly string[];
  readonly warnings: readonly string[];
  readonly triggeredRuleIds: readonly string[];
  readonly providerId: string;
  readonly providerName: string;
  readonly providerKind: AiProviderKind;
  readonly routingMode: AiRoutingMode;
  readonly fallbackUsed: boolean;
  readonly selectionReason: AiProviderSelectionReason;
  readonly generatedAt: string;
}

export interface AiExplanationErrorViewModel {
  readonly kind: 'ERROR';
  readonly requestId: string;
  readonly task: AiTask;
  readonly status: 'ERROR' | 'UNAVAILABLE';
  readonly message: string;
  readonly warnings: readonly string[];
}

export type AiExplanationResult =
  | AiExplanationViewModel
  | AiExplanationErrorViewModel;

export interface AiExplanationStructuredOutput {
  readonly status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
  readonly conclusion: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly warnings: readonly string[];
  readonly triggeredRuleIds?: readonly string[];
}

export function isAiExplanationStructuredOutput(
  value: unknown
): value is AiExplanationStructuredOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.status === 'SUCCESS' ||
      candidate.status === 'PARTIAL' ||
      candidate.status === 'ERROR') &&
    typeof candidate.conclusion === 'string' &&
    Array.isArray(candidate.supportingEvidenceIds) &&
    Array.isArray(candidate.challengingEvidenceIds) &&
    Array.isArray(candidate.unresolvedQuestions) &&
    Array.isArray(candidate.warnings) &&
    candidate.supportingEvidenceIds.every((v) => typeof v === 'string') &&
    candidate.challengingEvidenceIds.every((v) => typeof v === 'string') &&
    candidate.unresolvedQuestions.every((v) => typeof v === 'string') &&
    candidate.warnings.every((v) => typeof v === 'string') &&
    (candidate.triggeredRuleIds === undefined ||
      (Array.isArray(candidate.triggeredRuleIds) &&
        candidate.triggeredRuleIds.every((v) => typeof v === 'string')))
  );
}
