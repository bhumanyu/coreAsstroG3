import type { AiRequest } from './aiRequestTypes';
import type { AiResponse } from './aiResponseTypes';

export type AiCapability =
  | 'STRUCTURED_OUTPUT'
  | 'STREAMING'
  | 'LOCAL_FALLBACK'
  | 'OFFLINE'
  | (string & {});

export type AiProviderAvailability = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';

export interface AiProviderStatus {
  readonly availability: AiProviderAvailability;
  readonly message?: string;
}

export type AiProviderKind = 'LOCAL' | 'REMOTE' | 'CUSTOM';

export interface AiProviderIdentity {
  readonly id: string;
  readonly name: string;
  readonly kind: AiProviderKind;
  readonly version?: string;
}

export interface AiProvider {
  readonly identity: AiProviderIdentity;
  readonly capabilities: readonly AiCapability[];
  getStatus(): AiProviderStatus;
  generate(request: AiRequest): Promise<AiResponse>;
}
