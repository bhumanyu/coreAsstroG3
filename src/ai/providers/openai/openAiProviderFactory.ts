import type { AiProvider } from '../../types/aiProviderTypes';
import type { RemoteAiTransport } from '../remote/remoteAiTypes';
import { OpenAiProvider } from './OpenAiProvider';
import type { OpenAiProviderOptions } from './OpenAiTypes';

export function createOpenAiProvider(
  options: OpenAiProviderOptions,
  transport?: RemoteAiTransport
): AiProvider {
  return new OpenAiProvider(options, transport);
}
