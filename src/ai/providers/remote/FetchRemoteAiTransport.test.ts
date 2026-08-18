import { describe, expect, it, vi, afterEach } from 'vitest';
import { FetchRemoteAiTransport } from './FetchRemoteAiTransport';
import { RemoteAiError } from './RemoteAiError';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FetchRemoteAiTransport', () => {
  it('sends POST requests as JSON', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          result: 'ok'
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    const transport = new FetchRemoteAiTransport();
    const response = await transport.send(
      {
        url: 'https://example.com/v1',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer test'
        },
        body: {
          hello: 'world'
        }
      },
      5000
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      result: 'ok'
    });
  });

  it('parses non-JSON responses as text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('plain text', {
        status: 200
      })
    );

    const transport = new FetchRemoteAiTransport();
    const response = await transport.send(
      {
        url: 'https://example.com',
        method: 'POST',
        headers: {},
        body: {}
      },
      5000
    );

    expect(response.body).toBe('plain text');
  });

  it('throws INVALID_RESPONSE when JSON is malformed', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not-json-content', {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    const transport = new FetchRemoteAiTransport();
    await expect(
      transport.send(
        {
          url: 'https://example.com',
          method: 'POST',
          headers: {},
          body: {}
        },
        5000
      )
    ).rejects.toMatchObject({
      code: 'INVALID_RESPONSE'
    });
  });

  it('throws MAPPING_ERROR when request body cannot be JSON serialized', async () => {
    const transport = new FetchRemoteAiTransport();
    const circularBody: Record<string, unknown> = {};
    circularBody.self = circularBody;

    await expect(
      transport.send(
        {
          url: 'https://example.com',
          method: 'POST',
          headers: {},
          body: circularBody
        },
        5000
      )
    ).rejects.toMatchObject({
      code: 'MAPPING_ERROR'
    });
  });

  it('normalizes network failures to NETWORK_ERROR', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    const transport = new FetchRemoteAiTransport();

    await expect(
      transport.send(
        {
          url: 'https://example.com',
          method: 'POST',
          headers: {},
          body: {}
        },
        5000
      )
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR'
    });
  });

  it('rejects invalid timeout with INVALID_CONFIGURATION', async () => {
    const transport = new FetchRemoteAiTransport();

    await expect(
      transport.send(
        {
          url: 'https://example.com',
          method: 'POST',
          headers: {},
          body: {}
        },
        0
      )
    ).rejects.toMatchObject({
      code: 'INVALID_CONFIGURATION'
    });
  });

  it('normalizes abort timeout to TIMEOUT', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new DOMException('aborted', 'AbortError')
    );

    const transport = new FetchRemoteAiTransport();

    await expect(
      transport.send(
        {
          url: 'https://example.com',
          method: 'POST',
          headers: {},
          body: {}
        },
        10
      )
    ).rejects.toMatchObject({
      code: 'TIMEOUT'
    });
  });
});
