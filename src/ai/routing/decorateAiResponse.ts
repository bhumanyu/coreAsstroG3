import type { AiResponse } from '../types/aiResponseTypes';
import type {
  AiProviderSelectionReason,
  AiRoutingMode
} from './aiRoutingTypes';

export interface DecorateAiResponseOptions {
  readonly providerId: string;
  readonly mode: AiRoutingMode;
  readonly fallbackUsed: boolean;
  readonly selectionReason: AiProviderSelectionReason;
  /**
   * Number of providers evaluated by the selector,
   * including rejected candidates.
   */
  readonly candidateCount: number;
  /**
   * Number of eligible candidates matching requirements.
   */
  readonly eligibleCandidateCount: number;
}

export function decorateAiResponse(
  response: AiResponse,
  options: DecorateAiResponseOptions
): AiResponse {
  return Object.freeze({
    ...response,
    metadata: Object.freeze({
      ...(response.metadata ?? {}),
      provider: response.metadata?.provider ?? options.providerId,
      routing: Object.freeze({
        mode: options.mode,
        fallbackUsed: options.fallbackUsed,
        selectionReason: options.selectionReason,
        candidateCount: options.candidateCount,
        eligibleCandidateCount: options.eligibleCandidateCount
      })
    })
  });
}
