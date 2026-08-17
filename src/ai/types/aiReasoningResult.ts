import type { AiResponse } from './aiResponseTypes';

export type AiReasoningStatus =
  | 'SUCCESS'
  | 'PARTIAL'
  | 'ERROR'
  | 'FALLBACK'
  | 'UNAVAILABLE';

export interface AiReasoningResult {
  readonly status: AiReasoningStatus;
  readonly response?: AiResponse;
  readonly conclusion?: string;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly unresolvedQuestions: readonly string[];
  readonly warnings: readonly string[];
  readonly error?: string;
}
