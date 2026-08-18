import type {
  AiCapability,
  AiProvider,
  AiProviderAvailability,
  AiProviderKind
} from '../types/aiProviderTypes';
import type { AiRequest, AiTask } from '../types/aiRequestTypes';
import type { AiResponse } from '../types/aiResponseTypes';

export type AiRoutingMode = 'AUTO' | 'LOCAL_ONLY' | 'REMOTE_ONLY';

export type AiRoutingFallbackPolicy = 'ALLOW_FALLBACK' | 'NO_FALLBACK';

export type AiCandidateScoringFactor =
  | 'PREFERRED_PROVIDER'
  | 'CAPABILITY_MATCH'
  | 'AVAILABILITY'
  | 'PRIORITY';

export type AiProviderSelectionReason =
  | 'PREFERRED_PROVIDER'
  | 'PRIORITY'
  | 'ONLY_ELIGIBLE_PROVIDER'
  | 'LOCAL_FALLBACK';

export type AiRoutingErrorCode =
  | 'NO_PROVIDERS_REGISTERED'
  | 'NO_ELIGIBLE_PROVIDER'
  | 'PREFERRED_PROVIDER_UNAVAILABLE'
  | 'ALL_PROVIDERS_FAILED'
  | 'INVALID_PROVIDER';

export interface AiRoutingOptions {
  readonly mode?: AiRoutingMode;
  readonly preferredProviderId?: string;
  readonly fallbackPolicy?: AiRoutingFallbackPolicy;
  readonly excludedProviderIds?: readonly string[];
}

export interface AiProviderSelectionCandidate {
  readonly providerId: string;
  readonly providerName: string;
  readonly kind: AiProviderKind;
  readonly availability: AiProviderAvailability;
  readonly score: number;
  readonly eligible: boolean;
  readonly reasons: readonly AiCandidateScoringFactor[];
  readonly rejectedReason?: string;
}

export interface AiProviderSelection {
  readonly provider: AiProvider;
  readonly candidates: readonly AiProviderSelectionCandidate[];
  readonly orderedCandidates: readonly AiProviderSelectionCandidate[];
  readonly reason: AiProviderSelectionReason;
  readonly score: number;
}

export interface AiRoutingResult {
  readonly requestId: string;
  readonly providerId: string;
  readonly providerName: string;
  readonly providerKind: AiProviderKind;
  readonly routingMode: AiRoutingMode;
  readonly fallbackUsed: boolean;
  readonly selectionReason: AiProviderSelectionReason;
  readonly candidates: readonly AiProviderSelectionCandidate[];
  readonly response: AiResponse;
}

export interface AiRoutingContext {
  readonly request: AiRequest;
  readonly options: AiRoutingOptions;
}
