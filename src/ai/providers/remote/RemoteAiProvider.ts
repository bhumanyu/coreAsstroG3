import type {
  AiProvider,
  AiProviderIdentity,
  AiProviderStatus
} from '../../types/aiProviderTypes';

import type {
  AiRequest
} from '../../types/aiRequestTypes';

import type {
  AiResponse
} from '../../types/aiResponseTypes';

import {
  RemoteAiError
} from './RemoteAiError';

import {
  FetchRemoteAiTransport
} from './FetchRemoteAiTransport';

import type {
  RemoteAiErrorCode,
  RemoteAiProviderConfig,
  RemoteAiProviderStatus,
  RemoteAiRequestMapper,
  RemoteAiResponseMapper,
  RemoteAiTransport
} from './remoteAiTypes';

const DEFAULT_TIMEOUT_MS = 30_000;

function safeTransportErrorMessage(code: RemoteAiErrorCode): string {
  switch (code) {
    case 'TIMEOUT':
      return 'Remote AI request timed out.';
    case 'NETWORK_ERROR':
      return 'Remote AI provider network request failed.';
    case 'HTTP_ERROR':
      return 'Remote AI provider returned an HTTP error.';
    case 'INVALID_RESPONSE':
      return 'Remote AI provider returned an invalid response.';
    case 'MAPPING_ERROR':
      return 'Remote AI provider mapping failed.';
    case 'INVALID_ENDPOINT':
      return 'Remote AI provider endpoint is invalid.';
    case 'INVALID_CONFIGURATION':
      return 'Remote AI provider configuration is invalid.';
  }
}

function validateUrlSecurity(url: string, label: string): void {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      `${label} must be a valid URL.`
    );
  }

  const isLocal =
    parsedUrl.hostname === 'localhost' ||
    parsedUrl.hostname === '127.0.0.1';

  if (parsedUrl.protocol !== 'https:' && !isLocal) {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      `${label} must use HTTPS.`
    );
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      `${label} must not contain credentials.`
    );
  }

  const sensitiveQueryKeys = new Set([
    'api_key',
    'apikey',
    'api-key',
    'access_token',
    'access-token',
    'auth_token',
    'auth-token',
    'authorization',
    'bearer_token',
    'bearer-token',
    'password',
    'secret',
    'token',
    'key'
  ]);

  for (const key of parsedUrl.searchParams.keys()) {
    if (sensitiveQueryKeys.has(key.toLowerCase())) {
      throw new RemoteAiError(
        'INVALID_ENDPOINT',
        `${label} must not contain credential query parameters.`
      );
    }
  }
}

function validateConfig(config: RemoteAiProviderConfig): void {
  if (!config.identity.id || config.identity.id.trim().length === 0) {
    throw new RemoteAiError(
      'INVALID_CONFIGURATION',
      'Remote AI provider ID must not be empty.'
    );
  }

  if (config.identity.kind !== 'REMOTE_LLM') {
    throw new RemoteAiError(
      'INVALID_CONFIGURATION',
      'Remote AI provider identity.kind must be REMOTE_LLM.'
    );
  }

  if (!config.endpoint || config.endpoint.trim().length === 0) {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      'Remote AI provider endpoint must not be empty.'
    );
  }

  validateUrlSecurity(config.endpoint, 'Remote AI provider endpoint');

  if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
    throw new RemoteAiError(
      'INVALID_CONFIGURATION',
      'Remote AI timeout must be greater than zero.'
    );
  }
}

function validateRequestUrl(url: string): void {
  validateUrlSecurity(url, 'Remote AI request URL');
}

export class RemoteAiProvider implements AiProvider {
  readonly identity: AiProviderIdentity;
  readonly capabilities: RemoteAiProviderConfig['capabilities'];

  private readonly config: RemoteAiProviderConfig;
  private readonly requestMapper: RemoteAiRequestMapper;
  private readonly responseMapper: RemoteAiResponseMapper;
  private readonly transport: RemoteAiTransport;
  private readonly timeoutMs: number;

  constructor(
    config: RemoteAiProviderConfig,
    requestMapper: RemoteAiRequestMapper,
    responseMapper: RemoteAiResponseMapper,
    transport: RemoteAiTransport = new FetchRemoteAiTransport()
  ) {
    validateConfig(config);

    const frozenIdentity = Object.freeze({
      ...config.identity
    });

    const frozenCapabilities = Object.freeze([
      ...config.capabilities
    ]);

    const frozenHeaders = Object.freeze({
      ...(config.defaultHeaders ?? {})
    });

    this.config = Object.freeze({
      ...config,
      identity: frozenIdentity,
      capabilities: frozenCapabilities,
      defaultHeaders: frozenHeaders
    });

    this.identity = frozenIdentity;
    this.capabilities = frozenCapabilities;

    this.requestMapper = requestMapper;
    this.responseMapper = responseMapper;
    this.transport = transport;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  getStatus(): AiProviderStatus {
    const status: RemoteAiProviderStatus = Object.freeze({
      availability: 'AVAILABLE',
      message: 'Remote AI provider configured and ready.',
      endpoint: this.config.endpoint
    });

    return status;
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    let httpRequest;

    try {
      httpRequest = this.requestMapper.map(request, this.config);
    } catch {
      throw new RemoteAiError(
        'MAPPING_ERROR',
        'Failed to map AiRequest to remote provider request.',
        {
          requestId: request.requestId
        }
      );
    }

    try {
      validateRequestUrl(httpRequest.url);
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw new RemoteAiError(error.code, error.message, {
          requestId: request.requestId
        });
      }

      throw new RemoteAiError(
        'INVALID_ENDPOINT',
        'Remote AI request URL is invalid.',
        {
          requestId: request.requestId
        }
      );
    }

    let httpResponse;

    try {
      httpResponse = await this.transport.send(httpRequest, this.timeoutMs);
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw new RemoteAiError(
          error.code,
          safeTransportErrorMessage(error.code),
          {
            requestId: request.requestId,
            statusCode: error.statusCode
          }
        );
      }

      throw new RemoteAiError(
        'NETWORK_ERROR',
        safeTransportErrorMessage('NETWORK_ERROR'),
        {
          requestId: request.requestId
        }
      );
    }

    if (httpResponse.status < 200 || httpResponse.status >= 300) {
      throw new RemoteAiError(
        'HTTP_ERROR',
        `Remote AI provider returned HTTP ${httpResponse.status}.`,
        {
          statusCode: httpResponse.status,
          requestId: request.requestId
        }
      );
    }

    try {
      const response = this.responseMapper.map(request, httpResponse);

      return Object.freeze({
        ...response,
        metadata: Object.freeze({
          ...(response.metadata ?? {}),
          provider: this.identity.id,
          remote: true
        })
      });
    } catch {
      throw new RemoteAiError(
        'MAPPING_ERROR',
        'Failed to map remote provider response to AiResponse.',
        {
          requestId: request.requestId
        }
      );
    }
  }
}
