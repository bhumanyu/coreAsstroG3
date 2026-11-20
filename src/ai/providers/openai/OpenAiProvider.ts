import { RemoteAiProvider } from '../remote/RemoteAiProvider';
import type { RemoteAiTransport } from '../remote/remoteAiTypes';
import { OpenAiRequestMapper } from './OpenAiRequestMapper';
import { OpenAiResponseMapper } from './OpenAiResponseMapper';
import type { OpenAiProviderOptions } from './OpenAiTypes';

const OPENAI_CAPABILITIES = Object.freeze([
  'STRUCTURED_OUTPUT',
  'CAREER',
  'WEALTH',
  'DASHA',
  'LIFE_THEMES',
  'CHART_SYNTHESIS',
  'LIFE_ANALYSIS'
] as const);

export class OpenAiProvider extends RemoteAiProvider {
  private readonly configured: boolean;

  constructor(
    options: OpenAiProviderOptions,
    transport?: RemoteAiTransport
  ) {
    const model = options.model ?? 'gpt-5.6';
    const endpoint = options.endpoint ?? 'https://api.openai.com/v1/responses';

    super(
      {
        identity: Object.freeze({
          id: 'openai',
          name: 'OpenAI',
          kind: 'REMOTE_LLM',
          version: model
        }),
        capabilities: OPENAI_CAPABILITIES,
        endpoint,
        apiKey: options.apiKey,
        timeoutMs: options.timeoutMs
      },
      new OpenAiRequestMapper(options),
      new OpenAiResponseMapper(model),
      transport
    );
    this.configured = options.apiKey.trim().length > 0 && endpoint.trim().length > 0;
  }

  getStatus() {
    return this.configured
      ? super.getStatus()
      : Object.freeze({
          availability: 'UNAVAILABLE' as const,
          message: 'OpenAI provider requires an API key and endpoint configuration.'
        });
  }
}
