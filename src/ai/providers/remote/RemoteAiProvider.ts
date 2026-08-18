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
  RemoteAiProviderConfig,
  RemoteAiProviderStatus,
  RemoteAiRequestMapper,
  RemoteAiResponseMapper,
  RemoteAiTransport
} from './remoteAiTypes';

const DEFAULT_TIMEOUT_MS = 30_000;

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

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.endpoint);
  } catch (error) {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      'Remote AI provider endpoint must be a valid URL.',
      {
        cause: error
      }
    );
  }

  if (
    parsedUrl.protocol !== 'https:' &&
    parsedUrl.hostname !== 'localhost' &&
    parsedUrl.hostname !== '127.0.0.1'
  ) {
    throw new RemoteAiError(
      'INVALID_ENDPOINT',
      'Remote AI provider endpoint must use HTTPS.'
    );
  }

  if (config.timeoutMs !== undefined && config.timeoutMs <= 0) {
    throw new RemoteAiError(
      'INVALID_CONFIGURATION',
      'Remote AI timeout must be greater than zero.'
    );
  }
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

    this.config = Object.freeze({
      ...config,
      capabilities: Object.freeze([...config.capabilities]),
      defaultHeaders: Object.freeze({
        ...(config.defaultHeaders ?? {})
      })
    });

    this.identity = Object.freeze({
      ...config.identity
    });

    this.capabilities = Object.freeze([...config.capabilities]);

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
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw error;
      }

      throw new RemoteAiError(
        'MAPPING_ERROR',
        'Failed to map AiRequest to remote provider request.',
        {
          requestId: request.requestId,
          cause: error
        }
      );
    }

    let httpResponse;

    try {
      httpResponse = await this.transport.send(httpRequest, this.timeoutMs);
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw new RemoteAiError(error.code, error.message, {
          requestId: request.requestId,
          statusCode: error.statusCode,
          cause: error
        });
      }

      throw new RemoteAiError(
        'NETWORK_ERROR',
        'Remote AI transport failed.',
        {
          requestId: request.requestId,
          cause: error
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
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw error;
      }

      throw new RemoteAiError(
        'MAPPING_ERROR',
        'Failed to map remote provider response to AiResponse.',
        {
          requestId: request.requestId,
          cause: error
        }
      );
    }
  }
}
