export {
  TASK_REQUIRED_CAPABILITIES,
  requiredCapabilitiesForTask,
  requiredCapabilitiesForRequest
} from './providerCapabilityMap';

export { AiRoutingError } from './AiRoutingError';
export { AiProviderRegistry } from './AiProviderRegistry';
export { AiProviderSelector } from './AiProviderSelector';
export { AiRouter } from './AiRouter';
export { createDefaultAiRouter } from './createDefaultAiRouter';
export { decorateAiResponse } from './decorateAiResponse';
export type { DecorateAiResponseOptions } from './decorateAiResponse';

export type {
  AiRoutingMode,
  AiRoutingFallbackPolicy,
  AiProviderSelectionReason,
  AiRoutingErrorCode,
  AiRoutingOptions,
  AiProviderSelectionCandidate,
  AiProviderSelection,
  AiRoutingResult,
  AiRoutingContext
} from './aiRoutingTypes';

export { createMockProvider } from './testFixtures';
export type { MockProviderConfig } from './testFixtures';
