import type {
  AiRequest
} from '../../types/aiRequestTypes';

import type {
  AiResponse
} from '../../types/aiResponseTypes';

import type {
  RemoteAiHttpRequest,
  RemoteAiHttpResponse,
  RemoteAiProviderConfig,
  RemoteAiRequestMapper,
  RemoteAiResponseMapper,
  RemoteAiTransport
} from './remoteAiTypes';

export class FakeRemoteAiTransport implements RemoteAiTransport {
  readonly requests: RemoteAiHttpRequest[] = [];

  private readonly response: RemoteAiHttpResponse;
  private readonly failure: Error | undefined;

  constructor(
    response: RemoteAiHttpResponse,
    failure?: Error
  ) {
    this.response = response;
    this.failure = failure;
  }

  async send(
    request: RemoteAiHttpRequest,
    _timeoutMs: number
  ): Promise<RemoteAiHttpResponse> {
    this.requests.push(request);

    if (this.failure) {
      throw this.failure;
    }

    return this.response;
  }
}

export class FakeRemoteAiRequestMapper implements RemoteAiRequestMapper {
  map(
    request: AiRequest,
    config: RemoteAiProviderConfig
  ): RemoteAiHttpRequest {
    return Object.freeze({
      url: config.endpoint,
      method: 'POST',
      headers: Object.freeze({
        'content-type': 'application/json',
        ...(config.defaultHeaders ?? {})
      }),
      body: Object.freeze({
        requestId: request.requestId,
        task: request.task,
        responseFormat: request.responseFormat
      })
    });
  }
}

export class FakeRemoteAiResponseMapper implements RemoteAiResponseMapper {
  map(
    request: AiRequest,
    response: RemoteAiHttpResponse
  ): AiResponse {
    return Object.freeze({
      requestId: request.requestId,
      content: String(response.body),
      format: request.responseFormat,
      warnings: Object.freeze([]),
      metadata: Object.freeze({
        source: 'fake-remote'
      })
    });
  }
}
