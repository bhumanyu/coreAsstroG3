import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchPlacesDetailed } from './geocoding';

const validPlace = {
  name: 'London',
  latitude: 51.5072,
  longitude: -0.1276,
  timezone: 'Europe/London'
};

function response(status: number, json: () => Promise<unknown> = async () => ({ results: [validPlace] })) {
  return { ok: status >= 200 && status < 300, status, json };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('searchPlacesDetailed', () => {
  it('returns SUCCESS for a valid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200)));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({
      status: 'SUCCESS',
      places: [{ ...validPlace }]
    });
  });

  it('returns NO_RESULTS for an empty results array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({ results: [] }))));

    await expect(searchPlacesDetailed('Unknown')).resolves.toEqual({
      status: 'NO_RESULTS',
      places: []
    });
  });

  it('returns HTTP_ERROR with the status code for a non-success response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(503)));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({
      status: 'HTTP_ERROR',
      statusCode: 503
    });
  });

  it('returns NETWORK_ERROR when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(searchPlacesDetailed('London')).resolves.toMatchObject({
      status: 'NETWORK_ERROR',
      message: 'offline'
    });
  });

  it('returns TIMEOUT when the bounded request timeout expires', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const result = searchPlacesDetailed('London', { timeoutMs: 500 });
    await vi.advanceTimersByTimeAsync(500);

    await expect(result).resolves.toEqual({ status: 'TIMEOUT' });
  });

  it('returns ABORTED when the caller aborts', async () => {
    const abortController = new AbortController();
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const result = searchPlacesDetailed('London', { signal: abortController.signal });
    abortController.abort();

    await expect(result).resolves.toEqual({ status: 'ABORTED' });
  });

  it('returns INVALID_RESPONSE when JSON parsing throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => {
      throw new SyntaxError('invalid json');
    })));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({ status: 'INVALID_RESPONSE' });
  });

  it('returns INVALID_RESPONSE for malformed payloads and non-finite coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, async () => ({
      results: [{ ...validPlace, latitude: Number.NaN }]
    }))));

    await expect(searchPlacesDetailed('London')).resolves.toEqual({ status: 'INVALID_RESPONSE' });
  });
});
