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
  readonly candidateCount: number;
}

/**
 * Decorates an AiResponse with immutable routing and provider provenance metadata.
 */
export function decorateAiResponse(
  response: AiResponse,
  options: DecorateAiResponseOptions
): AiResponse {
  const existingMetadata = response.metadata ?? {};

  const routingMetadata = Object.freeze({
    mode: options.mode,
    fallbackUsed: options.fallbackUsed,
    selectionReason: options.selectionReason,
    candidateCount: options.candidateCount
  });

  const mergedMetadata = Object.freeze({
    ...existingMetadata,
    provider: options.providerId,
    routing: routingMetadata
  });

  return Object.freeze({
    ...response,
    metadata: mergedMetadata
  });
}
