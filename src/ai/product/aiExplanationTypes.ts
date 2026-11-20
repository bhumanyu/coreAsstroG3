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
  /** Original reference supplied by synthesis; identity references remain distinct from occurrence IDs. */
  readonly referenceId?: string;
  readonly referenceNamespace?: 'IDENTITY';
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
  readonly providerVersion?: string;
  readonly model?: string;
  readonly promptVersion?: string;
  readonly routingMode: AiRoutingMode;
  readonly fallbackUsed: boolean;
  readonly selectionReason: AiProviderSelectionReason;
  readonly generatedAt: string;
  readonly likelyThemes?: readonly string[];
  readonly supportingReasons?: readonly {
    readonly text: string;
    readonly evidenceIds: readonly string[];
  }[];
  readonly risks?: readonly string[];
  readonly uncertainties?: readonly string[];
  readonly practicalFocus?: readonly string[];
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
  readonly likelyThemes?: readonly string[];
  readonly supportingReasons?: readonly {
    readonly text: string;
    readonly evidenceIds: readonly string[];
  }[];
  readonly risks?: readonly string[];
  readonly uncertainties?: readonly string[];
  readonly practicalFocus?: readonly string[];
}

export function isAiExplanationStructuredOutput(
  value: unknown
): value is AiExplanationStructuredOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  const isStringArray = (item: unknown): item is readonly string[] =>
    Array.isArray(item) && item.every((value) => typeof value === 'string');
  const isSupportingReasonArray = (
    item: unknown
  ): item is AiExplanationStructuredOutput['supportingReasons'] =>
    Array.isArray(item) && item.every((reason) =>
      typeof reason === 'object' &&
      reason !== null &&
      typeof (reason as Record<string, unknown>).text === 'string' &&
      isStringArray((reason as Record<string, unknown>).evidenceIds)
    );

  return (
    (candidate.status === 'SUCCESS' ||
      candidate.status === 'PARTIAL' ||
      candidate.status === 'ERROR') &&
    typeof candidate.conclusion === 'string' &&
    Array.isArray(candidate.supportingEvidenceIds) &&
    Array.isArray(candidate.challengingEvidenceIds) &&
    Array.isArray(candidate.unresolvedQuestions) &&
    Array.isArray(candidate.warnings) &&
    isStringArray(candidate.supportingEvidenceIds) &&
    isStringArray(candidate.challengingEvidenceIds) &&
    isStringArray(candidate.unresolvedQuestions) &&
    isStringArray(candidate.warnings) &&
    (candidate.triggeredRuleIds === undefined ||
      isStringArray(candidate.triggeredRuleIds)) &&
    (candidate.likelyThemes === undefined ||
      isStringArray(candidate.likelyThemes)) &&
    (candidate.supportingReasons === undefined ||
      isSupportingReasonArray(candidate.supportingReasons)) &&
    (candidate.risks === undefined ||
      isStringArray(candidate.risks)) &&
    (candidate.uncertainties === undefined ||
      isStringArray(candidate.uncertainties)) &&
    (candidate.practicalFocus === undefined ||
      isStringArray(candidate.practicalFocus))
  );
}
