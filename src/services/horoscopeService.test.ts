import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRashiForecast,
  HoroscopeServiceError,
  type RashiForecast
} from './horoscopeService';

const request = {
  sign: 'aries' as const,
  period: 'daily' as const,
  subtype: 'general' as const,
  language: 'en' as const,
  timezone: 'Asia/Kolkata'
};

function forecast(overrides: Partial<RashiForecast> = {}): RashiForecast {
  return {
    sign: 'aries',
    period: 'daily',
    subtype: 'general',
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    title: 'Aries Daily Horoscope',
    summary: 'A clear day for planning.',
    content: 'Take time to review your priorities.',
    sections: { love: 'Make time for a meaningful conversation.' },
    provider: 'starsapi',
    publishedAt: '2026-11-14T00:00:00Z',
    language: 'en',
    ...overrides
  };
}

function response(
  body: unknown,
  status = 200,
  json = vi.fn().mockResolvedValue(body)
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fetchRashiForecast', () => {
  it('requests the normalized forecast and freezes the result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(forecast()));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchRashiForecast(request);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsedUrl = new URL(url);

    expect(parsedUrl.pathname).toBe('/api/horoscopes');
    expect(parsedUrl.searchParams.get('sign')).toBe('aries');
    expect(parsedUrl.searchParams.get('period')).toBe('daily');
    expect(parsedUrl.searchParams.get('subtype')).toBe('general');
    expect(parsedUrl.searchParams.get('language')).toBe('en');
    expect(parsedUrl.searchParams.get('timezone')).toBe('Asia/Kolkata');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.sections)).toBe(true);
  });

  it('times out a request and reports TIMEOUT', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    ));

    const result = fetchRashiForecast(request, { timeoutMs: 100 });
    const rejection = expect(result).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(100);
    await rejection;
  });

  it('classifies non-2xx responses as HTTP_ERROR with the normalized server code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(
      { error: { code: 'FORECAST_UNAVAILABLE', message: 'No forecast' } },
      404
    )));

    await expect(fetchRashiForecast(request)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      statusCode: 404,
      serverCode: 'FORECAST_UNAVAILABLE'
    });
  });

  it('classifies malformed JSON and schema mismatches as INVALID_RESPONSE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(
      undefined,
      200,
      vi.fn().mockRejectedValue(new SyntaxError('invalid JSON'))
    )));
    await expect(fetchRashiForecast(request)).rejects.toBeInstanceOf(HoroscopeServiceError);
    await expect(fetchRashiForecast(request)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ ...forecast(), content: undefined })));
    await expect(fetchRashiForecast(request)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('classifies a failed fetch as NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(fetchRashiForecast(request)).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('preserves a licensed Hindi-to-English fallback signal', async () => {
    const hindiRequest = { ...request, language: 'hi' as const };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(
      forecast({ language: 'en', languageFallback: true })
    )));

    await expect(fetchRashiForecast(hindiRequest)).resolves.toMatchObject({
      language: 'en',
      languageFallback: true
    });
  });

  it('rejects English content for a Hindi request without the fallback marker', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(forecast({ language: 'en' }))));
    await expect(fetchRashiForecast({ ...request, language: 'hi' })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE'
    });
  });
});
