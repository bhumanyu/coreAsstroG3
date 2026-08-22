import { DashaEvidenceEffect, DashaReasoningEvidence } from './dashaReasoningTypes';

export interface DashaDirectionalSynthesis {
  readonly effect: DashaEvidenceEffect;
  readonly confidence: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly neutralEvidenceIds: readonly string[];
  readonly reasoningEvidence: readonly DashaReasoningEvidence[];
  readonly summary: string;
}
