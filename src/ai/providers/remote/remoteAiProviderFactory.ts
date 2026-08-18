import type { AiProvider } from '../../types/aiProviderTypes';
import type {
  RemoteAiProviderConfig,
  RemoteAiRequestMapper,
  RemoteAiResponseMapper,
  RemoteAiTransport
} from './remoteAiTypes';
import { RemoteAiProvider } from './RemoteAiProvider';

export function createRemoteAiProvider(
  config: RemoteAiProviderConfig,
  requestMapper: RemoteAiRequestMapper,
  responseMapper: RemoteAiResponseMapper,
  transport?: RemoteAiTransport
): AiProvider {
  return new RemoteAiProvider(
    config,
    requestMapper,
    responseMapper,
    transport
  );
}
