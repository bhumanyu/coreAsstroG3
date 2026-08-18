import { describe, expect, it } from 'vitest';
import { RemoteAiProvider } from './RemoteAiProvider';
import { RemoteAiError } from './RemoteAiError';
import {
  FakeRemoteAiRequestMapper,
  FakeRemoteAiResponseMapper,
  FakeRemoteAiTransport
} from './testFixtures';
import type { AiRequest } from '../../types/aiRequestTypes';
import type { AiContext } from '../../types/aiContextTypes';
import type { RemoteAiProviderConfig } from './remoteAiTypes';

function createRequest(): AiRequest {
  return {
    requestId: 'remote-test-1',
    schemaVersion: '1.0.0',
    task: 'CAREER_ANALYSIS',
    context: {} as AiContext,
    responseFormat: 'STRUCTURED'
  };
}

function createProvider(
  transport: FakeRemoteAiTransport,
  overrides?: Partial<RemoteAiProviderConfig>
): RemoteAiProvider {
  return new RemoteAiProvider(
    {
      identity: Object.freeze({
        id: 'remote-test',
        name: 'Remote Test Provider',
        kind: 'REMOTE_LLM',
        version: '0.1.0'
      }),
      capabilities: Object.freeze([
        'CAREER',
        'STRUCTURED_OUTPUT'
      ]),
      endpoint: 'https://example.com/ai',
      apiKey: 'secret-test-key',
      timeoutMs: 5000,
      ...overrides
    },
    new FakeRemoteAiRequestMapper(),
    new FakeRemoteAiResponseMapper(),
    transport
  );
}

describe('RemoteAiProvider', () => {
  it('exposes REMOTE_LLM identity and frozen structures', () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const provider = createProvider(transport);

    expect(provider.identity.kind).toBe('REMOTE_LLM');
    expect(provider.identity.id).toBe('remote-test');
    expect(Object.isFrozen(provider.identity)).toBe(true);
    expect(Object.isFrozen(provider.capabilities)).toBe(true);
  });

  it('generates an AiResponse through the transport', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'remote result'
    });

    const provider = createProvider(transport);
    const response = await provider.generate(createRequest());

    expect(response.requestId).toBe('remote-test-1');
    expect(response.content).toBe('remote result');
    expect(response.metadata?.provider).toBe('remote-test');
    expect(response.metadata?.remote).toBe(true);
  });

  it('uses the configured endpoint', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const provider = createProvider(transport);
    await provider.generate(createRequest());

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0].url).toBe('https://example.com/ai');
  });

  it('does not expose the API key through response metadata or serialization', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'safe'
    });

    const provider = createProvider(transport);
    const response = await provider.generate(createRequest());

    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain('secret-test-key');
  });

  it('maps HTTP failures to RemoteAiError with statusCode and requestId', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 500,
      headers: {},
      body: {
        error: 'server failure'
      }
    });

    const provider = createProvider(transport);

    await expect(provider.generate(createRequest())).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      statusCode: 500,
      requestId: 'remote-test-1'
    });
  });

  it('maps transport failures with requestId preserved', async () => {
    const transport = new FakeRemoteAiTransport(
      {
        status: 200,
        headers: {},
        body: 'unused'
      },
      new RemoteAiError('TIMEOUT', 'request timed out')
    );

    const provider = createProvider(transport);

    await expect(provider.generate(createRequest())).rejects.toMatchObject({
      code: 'TIMEOUT',
      requestId: 'remote-test-1'
    });
  });

  it('normalizes any request mapper failure to MAPPING_ERROR', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const mapper = {
      map() {
        throw new RemoteAiError(
          'NETWORK_ERROR',
          'incorrect mapper classification'
        );
      }
    };

    const provider = new RemoteAiProvider(
      {
        identity: {
          id: 'remote-test',
          name: 'Remote Test Provider',
          kind: 'REMOTE_LLM'
        },
        capabilities: ['CAREER'],
        endpoint: 'https://example.com/ai'
      },
      mapper,
      new FakeRemoteAiResponseMapper(),
      transport
    );

    await expect(
      provider.generate(createRequest())
    ).rejects.toMatchObject({
      code: 'MAPPING_ERROR',
      requestId: 'remote-test-1'
    });
  });

  it('normalizes any response mapper failure to MAPPING_ERROR', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const mapper = {
      map() {
        throw new RemoteAiError(
          'NETWORK_ERROR',
          'incorrect response mapper classification'
        );
      }
    };

    const provider = new RemoteAiProvider(
      {
        identity: {
          id: 'remote-test',
          name: 'Remote Test Provider',
          kind: 'REMOTE_LLM'
        },
        capabilities: ['CAREER'],
        endpoint: 'https://example.com/ai'
      },
      new FakeRemoteAiRequestMapper(),
      mapper,
      transport
    );

    await expect(
      provider.generate(createRequest())
    ).rejects.toMatchObject({
      code: 'MAPPING_ERROR',
      requestId: 'remote-test-1'
    });
  });

  it('prevents API key leakage when mapper throws an Error containing secret', async () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const throwingRequestMapper = {
      map: () => {
        throw new Error('Authorization failed for secret-test-api-key-12345');
      }
    };

    const provider = new RemoteAiProvider(
      {
        identity: {
          id: 'remote-test',
          name: 'Remote Test Provider',
          kind: 'REMOTE_LLM'
        },
        capabilities: ['CAREER'],
        endpoint: 'https://example.com/ai',
        apiKey: 'secret-test-api-key-12345'
      },
      throwingRequestMapper,
      new FakeRemoteAiResponseMapper(),
      transport
    );

    let caughtError: unknown;
    try {
      await provider.generate(createRequest());
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(RemoteAiError);
    const remoteError = caughtError as RemoteAiError;
    expect(remoteError.code).toBe('MAPPING_ERROR');
    expect(remoteError.requestId).toBe('remote-test-1');
    expect(remoteError.cause).toBeUndefined();
    expect(remoteError.message).not.toContain('secret-test-api-key-12345');
    expect(JSON.stringify(remoteError)).not.toContain('secret-test-api-key-12345');
  });

  it('reports configured remote status without performing network IO', () => {
    const transport = new FakeRemoteAiTransport({
      status: 200,
      headers: {},
      body: 'ok'
    });

    const provider = createProvider(transport);
    const status = provider.getStatus();

    expect(status.availability).toBe('AVAILABLE');
    expect(status.message).toContain('configured');
    expect(status).not.toHaveProperty('apiKey');
  });

  it('rejects non-remote provider identity', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'invalid',
              name: 'Invalid',
              kind: 'LOCAL_RULES'
            },
            capabilities: [],
            endpoint: 'https://example.com'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(/REMOTE_LLM/);
  });

  it('rejects empty provider ID', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: '   ',
              name: 'Empty ID',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'https://example.com'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(RemoteAiError);
  });

  it('rejects invalid endpoint', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'remote',
              name: 'Remote',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'not-a-url'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(RemoteAiError);
  });

  it('rejects empty endpoint', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'remote',
              name: 'Remote',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: '   '
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(RemoteAiError);
  });

  it('rejects insecure non-local endpoint', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'remote',
              name: 'Remote',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'http://example.com'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(/HTTPS/);
  });

  it('allows localhost HTTP for local development', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'local-remote',
              name: 'Local Remote Adapter',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'http://localhost:8080/v1'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).not.toThrow();
  });

  it('allows 127.0.0.1 HTTP for local development', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'local-ip-remote',
              name: 'Local IP Remote Adapter',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'http://127.0.0.1:8080/v1'
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).not.toThrow();
  });

  it('rejects timeout <= 0', () => {
    expect(
      () =>
        new RemoteAiProvider(
          {
            identity: {
              id: 'remote',
              name: 'Remote',
              kind: 'REMOTE_LLM'
            },
            capabilities: [],
            endpoint: 'https://example.com',
            timeoutMs: 0
          },
          new FakeRemoteAiRequestMapper(),
          new FakeRemoteAiResponseMapper()
        )
    ).toThrow(RemoteAiError);
  });
});
