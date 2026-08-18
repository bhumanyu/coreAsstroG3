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
  'CHART_SYNTHESIS'
] as const);

export class OpenAiProvider extends RemoteAiProvider {
  constructor(
    options: OpenAiProviderOptions,
    transport?: RemoteAiTransport
  ) {
    const model = options.model ?? 'gpt-5.6';

    super(
      {
        identity: Object.freeze({
          id: 'openai',
          name: 'OpenAI',
          kind: 'REMOTE_LLM',
          version: model
        }),
        capabilities: OPENAI_CAPABILITIES,
        endpoint: options.endpoint ?? 'https://api.openai.com/v1/responses',
        apiKey: options.apiKey,
        timeoutMs: options.timeoutMs
      },
      new OpenAiRequestMapper(options),
      new OpenAiResponseMapper(),
      transport
    );
  }
}
