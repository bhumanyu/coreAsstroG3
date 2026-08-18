import { RemoteAiError } from './RemoteAiError';
import type {
  RemoteAiHttpRequest,
  RemoteAiHttpResponse,
  RemoteAiTransport
} from './remoteAiTypes';

export class FetchRemoteAiTransport implements RemoteAiTransport {
  async send(
    request: RemoteAiHttpRequest,
    timeoutMs: number
  ): Promise<RemoteAiHttpResponse> {
    if (timeoutMs <= 0) {
      throw new RemoteAiError(
        'INVALID_CONFIGURATION',
        'Remote AI timeout must be greater than zero.'
      );
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: controller.signal
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      let body: unknown;
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        try {
          body = await response.json();
        } catch (error) {
          throw new RemoteAiError(
            'INVALID_RESPONSE',
            'Remote AI provider returned invalid JSON.',
            {
              cause: error
            }
          );
        }
      } else {
        body = await response.text();
      }

      return Object.freeze({
        status: response.status,
        headers: Object.freeze({
          ...headers
        }),
        body
      });
    } catch (error) {
      if (error instanceof RemoteAiError) {
        throw error;
      }

      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        throw new RemoteAiError(
          'TIMEOUT',
          `Remote AI request timed out after ${timeoutMs}ms.`
        );
      }

      throw new RemoteAiError(
        'NETWORK_ERROR',
        'Remote AI provider network request failed.',
        {
          cause: error
        }
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
