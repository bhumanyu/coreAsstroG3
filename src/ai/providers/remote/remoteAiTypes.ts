import type {
  AiCapability,
  AiProviderIdentity,
  AiProviderStatus
} from '../../types/aiProviderTypes';

import type {
  AiRequest
} from '../../types/aiRequestTypes';

import type {
  AiResponse
} from '../../types/aiResponseTypes';

/**
 * Immutable configuration for a remote provider.
 */
export interface RemoteAiProviderConfig {
  readonly identity: AiProviderIdentity;

  readonly capabilities: readonly AiCapability[];

  readonly endpoint: string;

  readonly apiKey?: string;

  readonly timeoutMs?: number;

  readonly defaultHeaders?: Readonly<Record<string, string>>;
}

/**
 * Generic HTTP request produced by a RemoteAiRequestMapper.
 */
export interface RemoteAiHttpRequest {
  readonly url: string;

  readonly method: 'POST';

  readonly headers: Readonly<Record<string, string>>;

  readonly body: unknown;
}

/**
 * Generic HTTP response supplied to a response mapper.
 */
export interface RemoteAiHttpResponse {
  readonly status: number;

  readonly headers: Readonly<Record<string, string>>;

  readonly body: unknown;
}

/**
 * Maps an internal AiRequest into a provider-neutral HTTP request.
 */
export interface RemoteAiRequestMapper {
  map(
    request: AiRequest,
    config: RemoteAiProviderConfig
  ): RemoteAiHttpRequest;
}

/**
 * Maps a remote provider response into CoreAstro's AiResponse.
 */
export interface RemoteAiResponseMapper {
  map(
    request: AiRequest,
    response: RemoteAiHttpResponse
  ): AiResponse;
}

/**
 * Transport abstraction.
 */
export interface RemoteAiTransport {
  send(
    request: RemoteAiHttpRequest,
    timeoutMs: number
  ): Promise<RemoteAiHttpResponse>;
}

/**
 * Remote provider error categories.
 */
export type RemoteAiErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'INVALID_ENDPOINT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE'
  | 'MAPPING_ERROR';

/**
 * Safe status snapshot for a remote provider.
 */
export interface RemoteAiProviderStatus extends AiProviderStatus {
  readonly endpoint: string;
}
