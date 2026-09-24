import { describe, expect, it, vi } from 'vitest';
import { ReliableAiProvider } from './ReliableAiProvider';
import { withRemoteReliability } from './reliableAiProviderFactory';
import { RemoteAiError } from '../providers/remote/RemoteAiError';
import type { AiProvider } from '../types/aiProviderTypes';
import type { AiRequest } from '../types/aiRequestTypes';
import type { AiResponse } from '../types/aiResponseTypes';

const DEFAULT_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 0,
  maxDelayMs: 0,
  jitterRatio: 0,
  allowPostRetry: true,
  retryableStatusCodes: [429, 500, 503],
  retryableErrorCodes: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'HTTP_ERROR'
  ] as const
};

function createDummyRequest(): AiRequest {
  return {
    requestId: 'req-reliable-test',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: {} as any,
    responseFormat: 'NARRATIVE'
  };
}

const dummyRequest = createDummyRequest();

function createProvider(generate: AiProvider['generate']): AiProvider {
  return {
    identity: {
      id: 'openai',
      name: 'OpenAI',
      kind: 'REMOTE_LLM',
      version: 'gpt-5.6'
    },
    capabilities: Object.freeze(['CAREER', 'STRUCTURED_OUTPUT']),
    getStatus() {
      return {
        availability: 'AVAILABLE'
      };
    },
    generate
  };
}

describe('ReliableAiProvider', () => {
  it('preserves provider identity and capabilities', () => {
    const provider = createProvider(async (): Promise<AiResponse> => ({
      requestId: 'test',
      content: 'ok',
      format: 'NARRATIVE',
      warnings: []
    }));

    const reliable = new ReliableAiProvider(provider);

    expect(reliable.identity).toEqual(provider.identity);
    expect(reliable.capabilities).toEqual(provider.capabilities);
  });

  it('preserves provider status by delegating getStatus()', () => {
    const provider = createProvider(async (): Promise<AiResponse> => ({
      requestId: 'test',
      content: 'ok',
      format: 'NARRATIVE',
      warnings: []
    }));

    const reliable = new ReliableAiProvider(provider);

    expect(reliable.getStatus()).toEqual(provider.getStatus());
  });

  it('does not retry POST by default', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValue(new RemoteAiError('NETWORK_ERROR', 'network failed'));

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider);

    await expect(reliable.generate(dummyRequest)).rejects.toMatchObject({
      code: 'NETWORK_ERROR'
    });

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('retries when POST retry is explicitly enabled and succeeds', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValueOnce(
        new RemoteAiError('NETWORK_ERROR', 'network failure')
      )
      .mockRejectedValueOnce(
        new RemoteAiError('HTTP_ERROR', 'service unavailable', {
          statusCode: 503
        })
      )
      .mockResolvedValueOnce({
        requestId: 'req-reliable-test',
        content: 'success response',
        format: 'NARRATIVE',
        warnings: []
      });

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider, DEFAULT_POLICY);

    const response = await reliable.generate(dummyRequest);

    expect(response.content).toBe('success response');
    expect(response.warnings).toEqual([]);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('stops after max attempts and preserves original RemoteAiError', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValue(
        new RemoteAiError('HTTP_ERROR', 'internal server error', {
          statusCode: 500
        })
      );

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider, {
      ...DEFAULT_POLICY,
      maxAttempts: 3
    });

    await expect(reliable.generate(dummyRequest)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      statusCode: 500
    });

    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('does not retry mapping errors', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValue(new RemoteAiError('MAPPING_ERROR', 'cannot map payload'));

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider, DEFAULT_POLICY);

    await expect(reliable.generate(dummyRequest)).rejects.toMatchObject({
      code: 'MAPPING_ERROR'
    });

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not retry invalid endpoint errors', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValue(
        new RemoteAiError('INVALID_ENDPOINT', 'bad endpoint URL')
      );

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider, DEFAULT_POLICY);

    await expect(reliable.generate(dummyRequest)).rejects.toMatchObject({
      code: 'INVALID_ENDPOINT'
    });

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('does not retry non-retryable HTTP status 400', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockRejectedValue(
        new RemoteAiError('HTTP_ERROR', 'Bad Request', {
          statusCode: 400
        })
      );

    const provider = createProvider(generate);
    const reliable = new ReliableAiProvider(provider, DEFAULT_POLICY);

    await expect(reliable.generate(dummyRequest)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      statusCode: 400
    });

    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('works via withRemoteReliability factory function', async () => {
    const generate = vi
      .fn<AiProvider['generate']>()
      .mockResolvedValueOnce({
        requestId: 'req-factory-test',
        content: 'factory ok',
        format: 'NARRATIVE',
        warnings: []
      });

    const provider = createProvider(generate);
    const reliable = withRemoteReliability(provider, DEFAULT_POLICY);

    const response = await reliable.generate(dummyRequest);
    expect(response.content).toBe('factory ok');
    expect(reliable.identity.id).toBe('openai');
  });

  it('delays execution across retry attempts when baseDelayMs is positive', async () => {
    vi.useFakeTimers();
    try {
      const generate = vi
        .fn<AiProvider['generate']>()
        .mockRejectedValueOnce(
          new RemoteAiError('NETWORK_ERROR', 'network drop')
        )
        .mockResolvedValueOnce({
          requestId: 'req-delay-test',
          content: 'delayed ok',
          format: 'NARRATIVE',
          warnings: []
        });

      const provider = createProvider(generate);
      const reliable = new ReliableAiProvider(provider, {
        ...DEFAULT_POLICY,
        baseDelayMs: 50,
        maxDelayMs: 50
      });

      const promise = reliable.generate(dummyRequest);

      expect(generate).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(50);

      const response = await promise;
      expect(response.content).toBe('delayed ok');
      expect(generate).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
