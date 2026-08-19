export { AI_CONTEXT_SCHEMA_VERSION } from './types/aiTypes';
export type {
  AiContextSchemaVersion,
  AiAvailability,
  AiConfidence,
  AiEvidenceEffect
} from './types/aiTypes';

export type {
  CareerNatalPromise,
  CareerD10Relationship,
  AiEvidenceSource,
  AiEvidenceStrength,
  AiEvidencePriority,
  AiEvidenceDimension,
  AscendantFact,
  PlanetFactSummary,
  HouseFactSummary,
  YogaFactSummary,
  DashaPeriodFact,
  ActiveDashaFact,
  DashaFacts,
  DivisionalFact,
  DivisionalFacts,
  CareerFact,
  WealthSubthemeFact,
  WealthFact,
  LifeThemeFact,
  AiEvidence,
  AiContextSource,
  AiContextMethodology,
  AiContext
} from './types/aiContextTypes';

export type { AiTask, AiRequest } from './types/aiRequestTypes';
export type { AiResponseMetadata, AiResponse } from './types/aiResponseTypes';
export type {
  AiReasoningStatus,
  AiReasoningResult
} from './types/aiReasoningResult';
export type {
  AiCapability,
  AiProviderAvailability,
  AiProviderStatus,
  AiProviderKind,
  AiProviderIdentity,
  AiProvider
} from './types/aiProviderTypes';

export { deepFreeze } from './context/deepFreeze';
export {
  FORBIDDEN_AI_CONTEXT_KEYS,
  forbiddenAiContextKeys
} from './context/aiContextPrivacy';
export type { ForbiddenAiContextKey } from './context/aiContextPrivacy';

export { buildAiContext } from './context/aiContextFactory';
export { createAiRequest } from './api/createAiRequest';

export { LocalVedicRulesProvider, reasonWithLocalRules } from './providers/local';
export type {
  LocalRuleDefinition,
  LocalRuleEvaluation,
  LocalRuleEffect,
  LocalRuleDomain,
  LocalReasoningOutput
} from './providers/local';

export {
  AiProviderRegistry,
  AiProviderSelector,
  AiRouter,
  AiRoutingError,
  createDefaultAiRouter,
  decorateAiResponse,
  TASK_REQUIRED_CAPABILITIES,
  requiredCapabilitiesForTask,
  requiredCapabilitiesForRequest
} from './routing';

export type {
  AiRoutingMode,
  AiRoutingFallbackPolicy,
  AiRoutingOptions,
  AiCandidateScoringFactor,
  AiProviderSelectionReason,
  AiProviderSelectionCandidate,
  AiProviderSelection,
  AiRoutingResult,
  AiRoutingContext,
  AiRoutingErrorCode
} from './routing';

export {
  RemoteAiProvider,
  FetchRemoteAiTransport,
  RemoteAiError,
  createRemoteAiProvider
} from './providers/remote';

export type {
  RemoteAiProviderConfig,
  RemoteAiHttpRequest,
  RemoteAiHttpResponse,
  RemoteAiRequestMapper,
  RemoteAiResponseMapper,
  RemoteAiTransport,
  RemoteAiErrorCode,
  RemoteAiProviderStatus
} from './providers/remote';

export {
  OpenAiProvider,
  createOpenAiProvider,
  OpenAiRequestMapper,
  OpenAiResponseMapper,
  OPENAI_REASONING_SCHEMA
} from './providers/openai';

export type {
  OpenAiProviderOptions,
  OpenAiResponseEnvelope,
  OpenAiResponseUsage,
  OpenAiStructuredReasoning,
  OpenAiProviderMetadata
} from './providers/openai';

export {
  ReliableAiProvider,
  DEFAULT_REMOTE_RETRY_POLICY,
  validateRemoteRetryPolicy,
  classifyRemoteRetry,
  calculateRetryDelayMs,
  withRemoteReliability
} from './reliability';

export type {
  RemoteRetryPolicy,
  RetryDecision
} from './reliability';

export {
  runAiExplanation,
  AI_EXPLANATION_TASKS,
  getAiExplanationTaskOption,
  isAiExplanationStructuredOutput
} from './product';

export type {
  AiExplanationTaskOption,
  AiExplanationEvidence,
  AiExplanationViewModel,
  AiExplanationErrorViewModel,
  AiExplanationResult,
  AiExplanationStructuredOutput
} from './product';



