import type {
  AiProvider,
  AiProviderIdentity,
  AiProviderStatus,
  AiCapability
} from '../../types/aiProviderTypes';
import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiResponse } from '../../types/aiResponseTypes';
import type { AiReasoningResult } from '../../types/aiReasoningResult';
import { reasonWithLocalRules } from './localVedicRulesEngine';

export class LocalVedicRulesProvider implements AiProvider {
  readonly identity: AiProviderIdentity = Object.freeze({
    id: 'local-vedic-rules',
    name: 'Local Vedic Rules Provider',
    kind: 'LOCAL_RULES',
    version: '1.0.0'
  });

  readonly capabilities: readonly AiCapability[] = Object.freeze([
    'OFFLINE',
    'LOCAL_FALLBACK',
    'CAREER',
    'WEALTH',
    'DASHA',
    'LIFE_THEMES',
    'CHART_SYNTHESIS',
    'LIFE_ANALYSIS',
    'STRUCTURED_OUTPUT'
  ]);

  getStatus(): AiProviderStatus {
    return Object.freeze({
      availability: 'AVAILABLE',
      message: 'Local Vedic rules engine ready for offline evaluation'
    });
  }

  /**
   * Synchronously performs local deterministic Vedic rule reasoning.
   */
  reason(request: AiRequest): AiReasoningResult {
    return reasonWithLocalRules(request.task, request.context);
  }

  /**
   * Asynchronously generates an AiResponse conforming to the AiProvider interface.
   */
  async generate(request: AiRequest): Promise<AiResponse> {
    const reasoning = this.reason(request);

    return Object.freeze({
      requestId: request.requestId,
      content: reasoning.conclusion,
      structuredOutput: reasoning,
      format: request.responseFormat,
      warnings: reasoning.warnings,
      metadata: Object.freeze({
        provider: this.identity.id,
        model: 'LOCAL_RULES',
        ruleEngineVersion: this.identity.version
      })
    });
  }
}
