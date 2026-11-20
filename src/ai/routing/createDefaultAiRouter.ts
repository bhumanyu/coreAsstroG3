import { LocalVedicRulesProvider } from '../providers/local';
import { AiProviderRegistry } from './AiProviderRegistry';
import { AiRouter } from './AiRouter';
import type { AiProvider } from '../types/aiProviderTypes';

export interface DefaultAiRouterOptions {
  /** A provider constructed by trusted remote-provider wiring with valid configuration. */
  readonly remoteProvider?: AiProvider;
}

/**
 * Creates a default AiRouter pre-configured with the deterministic LocalVedicRulesProvider.
 * This is the standard entry point for local-first, zero-network Vedic AI synthesis.
 */
export function createDefaultAiRouter(
  options: DefaultAiRouterOptions = {}
): AiRouter {
  const registry = new AiProviderRegistry();
  registry.register(new LocalVedicRulesProvider());
  const remoteProvider = options.remoteProvider;
  if (
    remoteProvider?.identity.kind === 'REMOTE_LLM' &&
    remoteProvider.getStatus().availability !== 'UNAVAILABLE'
  ) {
    registry.register(remoteProvider);
  }
  return new AiRouter(registry);
}
