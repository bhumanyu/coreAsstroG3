import { describe, expect, it } from 'vitest';
import { RemoteAiError } from './RemoteAiError';

describe('RemoteAiError', () => {
  it('preserves normalized error information', () => {
    const error = new RemoteAiError(
      'HTTP_ERROR',
      'Remote request failed',
      {
        statusCode: 429,
        requestId: 'request-1'
      }
    );

    expect(error.name).toBe('RemoteAiError');
    expect(error.code).toBe('HTTP_ERROR');
    expect(error.statusCode).toBe(429);
    expect(error.requestId).toBe('request-1');
  });

  it('preserves cause if provided', () => {
    const underlying = new Error('Socket closed');
    const error = new RemoteAiError(
      'NETWORK_ERROR',
      'Remote request failed',
      {
        cause: underlying
      }
    );

    expect(error.cause).toBe(underlying);
  });

  it('does not include secrets by itself', () => {
    const error = new RemoteAiError(
      'NETWORK_ERROR',
      'Remote network request failed'
    );

    expect(error.message).not.toContain('apiKey');
    expect(error.message).not.toContain('Authorization');
  });
});
