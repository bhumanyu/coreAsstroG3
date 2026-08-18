import type { AiRequest } from '../types/aiRequestTypes';
import type {
  AiProviderSelectionReason,
  AiRoutingMode,
  AiRoutingOptions,
  AiRoutingResult
} from './aiRoutingTypes';
import type { AiProviderRegistry } from './AiProviderRegistry';
import { AiProviderSelector } from './AiProviderSelector';
import { AiRoutingError } from './AiRoutingError';
import { decorateAiResponse } from './decorateAiResponse';

export class AiRouter {
  constructor(
    private readonly registry: AiProviderRegistry,
    private readonly selector: AiProviderSelector = new AiProviderSelector()
  ) {}

  /**
   * Routes an AI request to the highest-ranking eligible provider,
   * handling transparent deterministic fallback if configured.
   */
  async route(
    request: AiRequest,
    options: AiRoutingOptions = {}
  ): Promise<AiRoutingResult> {
    const allProviders = this.registry.list();
    if (allProviders.length === 0) {
      throw new AiRoutingError(
        'NO_PROVIDERS_REGISTERED',
        'No AI providers are registered in the registry',
        request.requestId
      );
    }

    const selection = this.selector.select(allProviders, request, options);
    const mode: AiRoutingMode = options.mode ?? 'AUTO';
    const allowFallback = options.fallbackPolicy !== 'NO_FALLBACK';

    const executionErrors: { providerId: string; error: unknown }[] = [];

    for (let index = 0; index < selection.orderedCandidates.length; index++) {
      const candidate = selection.orderedCandidates[index];
      const provider = this.registry.get(candidate.providerId);

      if (!provider) {
        continue;
      }

      const fallbackUsed = index > 0;
      const selectionReason: AiProviderSelectionReason = selection.reason;

      try {
        const rawResponse = await provider.generate(request);

        const decoratedResponse = decorateAiResponse(rawResponse, {
          providerId: provider.identity.id,
          mode,
          fallbackUsed,
          selectionReason,
          candidateCount: selection.candidates.length,
          eligibleCandidateCount: selection.orderedCandidates.length
        });

        return Object.freeze({
          requestId: request.requestId,
          providerId: provider.identity.id,
          providerName: provider.identity.name,
          providerKind: provider.identity.kind,
          routingMode: mode,
          fallbackUsed,
          selectionReason,
          candidates: selection.candidates,
          response: decoratedResponse
        });
      } catch (error) {
        executionErrors.push({ providerId: candidate.providerId, error });

        if (!allowFallback) {
          throw error;
        }
      }
    }

    throw new AiRoutingError(
      'ALL_PROVIDERS_FAILED',
      `All eligible AI providers failed to generate a response: ${executionErrors
        .map(
          (e) =>
            `${e.providerId} (${
              e.error instanceof Error ? e.error.message : String(e.error)
            })`
        )
        .join('; ')}`,
      request.requestId
    );
  }
}
