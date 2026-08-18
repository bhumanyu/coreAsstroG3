import { LocalVedicRulesProvider } from '../providers/local';
import { AiProviderRegistry } from './AiProviderRegistry';
import { AiRouter } from './AiRouter';

/**
 * Creates a default AiRouter pre-configured with the deterministic LocalVedicRulesProvider.
 * This is the standard entry point for local-first, zero-network Vedic AI synthesis.
 */
export function createDefaultAiRouter(): AiRouter {
  const registry = new AiProviderRegistry();
  registry.register(new LocalVedicRulesProvider());
  return new AiRouter(registry);
}
