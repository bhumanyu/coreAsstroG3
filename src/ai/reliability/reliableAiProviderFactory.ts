import type { AiProvider } from '../types/aiProviderTypes';
import { ReliableAiProvider } from './ReliableAiProvider';
import type { RemoteRetryPolicy } from './RemoteRetryPolicy';

export function withRemoteReliability(
  provider: AiProvider,
  policy?: RemoteRetryPolicy
): AiProvider {
  return new ReliableAiProvider(provider, policy);
}
