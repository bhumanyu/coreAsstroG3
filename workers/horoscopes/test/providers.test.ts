import { afterEach, describe, expect, it, vi } from 'vitest';
import { FixtureProvider } from '../src/providers/fixtureProvider';
import { getProvider } from '../src/providers';
import { StarsApiProvider } from '../src/providers/starsApiProvider';
import { isRashiForecast, parseForecastQuery } from '../src/validation';

const parsedQuery = parseForecastQuery(new URLSearchParams('sign=taurus&period=monthly'));
if (!parsedQuery.ok) throw new Error(parsedQuery.message);

function query(value: string) {
  const result = parseForecastQuery(new URLSearchParams(value));
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

function vendorResponse(
  overrides: { data?: Record<string, unknown>; meta?: Record<string, unknown> } = {}
) {
  return {
    status: 200,
    success: true,
    data: {
      sign: 'Taurus',
      zodiac_system: 'vedic_moon',
      sub_type: 'general',
      period_type: 'monthly',
      period_key: '2026-11',
      period_start: '2026-11-01',
      period_end: '2026-11-30',
      language: 'en',
      language_fallback: false,
      summary: 'A practical month for steady progress.',
      content: '<p>Build momentum through patience.</p>',
      content_text: 'Build momentum through patience.',
      content_paragraphs: ['Build momentum through patience.'],
      content_sections: {
        overview: { title: 'Overview', body: 'A steady month.' },
        love: { title: 'Love', body: 'Make room for honest connection.' },
        career: { title: 'Career', body: 'Focus on durable plans.' },
        health: { title: 'Health', body: 'Keep a balanced routine.' }
      },
      lucky_number: 8,
      lucky_color: 'Deep green',
      generated_at: '2026-10-31 03:30:08',
      ...overrides.data
    },
    meta: {
      timestamp: '2026-11-01T00:00:00Z',
      ...overrides.meta
    }
  };
}

function stubVendorResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('horoscope providers', () => {
  it('returns deterministic fixture data that matches the frontend response contract', async () => {
    const provider = new FixtureProvider();
    const forecast = await provider.fetchForecast(parsedQuery.value, new Date('2026-11-14T08:00:00Z'));
    expect(forecast).toMatchObject({
      sign: 'taurus',
      period: 'monthly',
      subtype: 'general',
      provider: 'starsapi',
      language: 'en'
    });
    expect(forecast.summary).toContain('Taurus');
    expect(forecast.summary).toContain('monthly');
    expect(isRashiForecast(forecast, parsedQuery.value)).toBe(true);
  });

  it('marks fixture English as a fallback for Hindi requests', async () => {
    const hindi = parseForecastQuery(new URLSearchParams('sign=leo&period=daily&language=hi'));
    if (!hindi.ok) throw new Error(hindi.message);
    const forecast = await new FixtureProvider().fetchForecast(hindi.value, new Date('2026-11-14T08:00:00Z'));
    expect(forecast).toMatchObject({ language: 'en', languageFallback: true });
    expect(isRashiForecast(forecast, hindi.value)).toBe(true);
  });

  it('selects fixture by default and StarsAPI only when its secret is present', () => {
    expect(getProvider({ HOROSCOPE_CACHE: { get: vi.fn(), put: vi.fn() } })).toBeInstanceOf(FixtureProvider);
    expect(getProvider({
      HOROSCOPE_CACHE: { get: vi.fn(), put: vi.fn() },
      STARSAPI_KEY: 'test-secret'
    })).toBeInstanceOf(StarsApiProvider);
  });

  it('maps a documented monthly StarsAPI response into the normalized forecast', async () => {
    const fetchMock = stubVendorResponse(vendorResponse());
    const forecast = await new StarsApiProvider('test-secret').fetchForecast(
      parsedQuery.value,
      new Date('2026-11-14T08:00:00Z')
    );
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];

    expect(url.origin + url.pathname).toBe('https://starsapi.com/api/v3/horoscope/monthly');
    expect(url.searchParams.get('sign')).toBe('Taurus');
    expect(url.searchParams.get('zodiac_system')).toBe('vedic_moon');
    expect(url.searchParams.get('language')).toBe('en');
    expect(url.searchParams.get('month')).toBe('2026-11');
    expect(url.searchParams.has('sub_type')).toBe(false);
    expect(new Headers(init.headers).get('X-Api-Key')).toBe('test-secret');
    expect(forecast).toMatchObject({
      sign: 'taurus',
      period: 'monthly',
      subtype: 'general',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      title: 'Taurus Monthly Horoscope',
      summary: 'A practical month for steady progress.',
      content: 'Build momentum through patience.',
      sections: {
        love: 'Make room for honest connection.',
        career: 'Focus on durable plans.',
        health: 'Keep a balanced routine.',
        luckyColour: 'Deep green',
        luckyNumber: '8'
      },
      provider: 'starsapi',
      publishedAt: '2026-11-01T00:00:00Z',
      language: 'en'
    });
    expect(isRashiForecast(forecast, parsedQuery.value)).toBe(true);
  });

  it('requests every period with its documented date parameter and maps provider subtypes', async () => {
    const effectiveDate = new Date('2026-11-14T08:00:00Z');
    const cases = [
      {
        period: 'daily',
        params: ['date', '2026-11-14'],
        subtype: 'love',
        startDate: '2026-11-14',
        endDate: '2026-11-14'
      },
      {
        period: 'weekly',
        params: ['date', '2026-11-14'],
        subtype: 'career',
        startDate: '2026-11-09',
        endDate: '2026-11-15'
      },
      {
        period: 'yearly',
        params: ['year', '2026'],
        subtype: 'general',
        startDate: '2026-01-01',
        endDate: '2026-12-31'
      }
    ] as const;

    for (const item of cases) {
      const forecastQuery = query(
        `sign=aries&period=${item.period}&subtype=${item.subtype}&language=en&timezone=UTC`
      );
      const body = vendorResponse({
        data: {
          sign: 'Aries',
          period_type: item.period,
          sub_type: item.subtype,
          date: '2026-11-14',
          period_start_date: item.period === 'weekly' ? '2026-11-09' : undefined,
          period_end_date: item.period === 'weekly' ? '2026-11-15' : undefined,
          period_start: item.period === 'yearly' ? '2026-01-01' : undefined,
          period_end: item.period === 'yearly' ? '2026-12-31' : undefined,
          period_key: '2026',
          content_sections: undefined
        }
      });
      const fetchMock = stubVendorResponse(body);
      const forecast = await new StarsApiProvider('test-secret').fetchForecast(forecastQuery, effectiveDate);
      const [url] = fetchMock.mock.calls[0] as [URL];

      expect(url.pathname).toBe(`/api/v3/horoscope/${item.period}`);
      expect(url.searchParams.get(item.params[0])).toBe(item.params[1]);
      expect(url.searchParams.get('sub_type')).toBe(
        item.period === 'yearly' ? null : item.subtype
      );
      expect(forecast.period).toBe(item.period);
      expect(forecast.subtype).toBe(item.subtype);
      expect(forecast.startDate).toBe(item.startDate);
      expect(forecast.endDate).toBe(item.endDate);
      vi.unstubAllGlobals();
    }
  });

  it('marks an English response to a Hindi request as a language fallback', async () => {
    stubVendorResponse(vendorResponse({
      data: {
        sign: 'Leo',
        period_type: 'daily',
        date: '2026-11-14',
        language: 'en',
        language_fallback: true
      }
    }));
    const hindiQuery = query('sign=leo&period=daily&language=hi&timezone=UTC');
    const forecast = await new StarsApiProvider('test-secret').fetchForecast(
      hindiQuery,
      new Date('2026-11-14T08:00:00Z')
    );

    expect(forecast.language).toBe('en');
    expect(forecast.languageFallback).toBe(true);
    expect(isRashiForecast(forecast, hindiQuery)).toBe(true);
  });

  it.each([400, 503])('surfaces vendor HTTP %i as a typed provider error', async (status) => {
    stubVendorResponse({ success: false, error: { code: 'VENDOR_ERROR', message: 'Failure' } }, status);
    await expect(new StarsApiProvider('test-secret').fetchForecast(
      parsedQuery.value,
      new Date('2026-11-14T08:00:00Z')
    )).rejects.toMatchObject({
      name: 'StarsApiProviderError',
      statusCode: status,
      vendorCode: 'VENDOR_ERROR'
    });
  });

  it('rejects free-plan sample content instead of presenting it as a live forecast', async () => {
    stubVendorResponse(vendorResponse({ data: { is_sample: true } }));
    await expect(new StarsApiProvider('test-secret').fetchForecast(
      parsedQuery.value,
      new Date('2026-11-14T08:00:00Z')
    )).rejects.toMatchObject({ vendorCode: 'FORECAST_UNAVAILABLE' });
  });

  it('does not silently use general content for unsupported monthly or yearly subtypes', async () => {
    const fetchMock = stubVendorResponse(vendorResponse());
    for (const period of ['monthly', 'yearly'] as const) {
      await expect(new StarsApiProvider('test-secret').fetchForecast(
        query(`sign=taurus&period=${period}&subtype=love`),
        new Date('2026-11-14T08:00:00Z')
      )).rejects.toMatchObject({
        vendorCode: 'FORECAST_UNAVAILABLE'
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
