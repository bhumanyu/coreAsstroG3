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
  readonly error?: string;
  readonly rawOutput?: string;
}
