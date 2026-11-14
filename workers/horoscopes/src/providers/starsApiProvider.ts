import { getEffectivePeriod } from '../effectivePeriod';
import type {
  ForecastLanguage,
  ForecastQuery,
  HoroscopeProvider,
  RashiForecast
} from '../types';

const API_BASE_URL = 'https://starsapi.com/api/v3/horoscope';

type JsonRecord = Record<string, unknown>;

export class StarsApiProviderError extends Error {
  readonly statusCode?: number;
  readonly vendorCode?: string;

  constructor(message: string, options: { statusCode?: number; vendorCode?: string; cause?: unknown } = {}) {
    super(message, { cause: options.cause });
    this.name = 'StarsApiProviderError';
    this.statusCode = options.statusCode;
    this.vendorCode = options.vendorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function localizedDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function plainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h[1-6]|li)>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function sectionText(value: unknown): string | undefined {
  if (typeof value === 'string') return nonEmptyString(value);
  if (!isRecord(value)) return undefined;
  const body = nonEmptyString(value.body);
  if (body) return body;
  const html = nonEmptyString(value.body_html);
  return html ? plainText(html) : undefined;
}

function responseDate(
  data: JsonRecord,
  names: readonly string[],
  fallback: string
): string {
  for (const name of names) {
    const value = nonEmptyString(data[name]);
    if (value) return value;
  }
  return fallback;
}

function mapLanguage(
  data: JsonRecord,
  requestedLanguage: ForecastLanguage
): { language: ForecastLanguage; languageFallback?: boolean } {
  const rawLanguage = nonEmptyString(data.language)?.toLowerCase();
  const vendorFallback = data.language_fallback === true;
  const language = rawLanguage === 'en' || rawLanguage === 'hi'
    ? rawLanguage
    : vendorFallback && requestedLanguage === 'hi'
      ? 'en'
      : undefined;

  if (!language) {
    throw new StarsApiProviderError('StarsAPI response omitted a supported content language.');
  }

  const languageFallback = requestedLanguage === 'hi' &&
    (vendorFallback || language === 'en');
  return {
    language: languageFallback ? 'en' : language,
    ...(languageFallback ? { languageFallback: true } : {})
  };
}

function mapSections(data: JsonRecord): RashiForecast['sections'] {
  const contentSections = isRecord(data.content_sections) ? data.content_sections : {};
  const luckyNumber = data.lucky_number;
  const sections = {
    love: sectionText(contentSections.love),
    career: sectionText(contentSections.career),
    health: sectionText(contentSections.health),
    luckyColour: nonEmptyString(data.lucky_color),
    luckyNumber: typeof luckyNumber === 'number' || typeof luckyNumber === 'string'
      ? String(luckyNumber)
      : undefined
  };
  return Object.values(sections).some((value) => value !== undefined)
    ? Object.freeze(sections)
    : undefined;
}

function mapContent(data: JsonRecord): string {
  const contentText = nonEmptyString(data.content_text);
  if (contentText) return contentText;
  if (Array.isArray(data.content_paragraphs)) {
    const paragraphs = data.content_paragraphs.filter(
      (paragraph): paragraph is string => typeof paragraph === 'string' && paragraph.trim().length > 0
    );
    if (paragraphs.length > 0) return paragraphs.join('\n\n');
  }
  const content = nonEmptyString(data.content);
  if (content) return plainText(content);
  throw new StarsApiProviderError('StarsAPI response omitted forecast content.');
}

function vendorEndpoint(query: ForecastQuery): URL {
  const endpoint = new URL(`${API_BASE_URL}/${query.period}`);
  endpoint.searchParams.set('sign', query.sign[0].toUpperCase() + query.sign.slice(1));
  endpoint.searchParams.set('zodiac_system', 'vedic_moon');
  endpoint.searchParams.set('language', query.language);

  if (query.period === 'daily' || query.period === 'weekly') {
    endpoint.searchParams.set('sub_type', query.subtype);
  } else if (query.subtype !== 'general') {
    throw new StarsApiProviderError(
      `StarsAPI ${query.period} forecasts only support the general subtype.`,
      { vendorCode: 'FORECAST_UNAVAILABLE' }
    );
  }
  return endpoint;
}

export class StarsApiProvider implements HoroscopeProvider {
  readonly cacheId = 'starsapi' as const;

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new Error('STARSAPI_KEY is required.');
  }

  async fetchForecast(
    query: ForecastQuery,
    effectiveDate: Date,
    signal?: AbortSignal
  ): Promise<RashiForecast> {
    const endpoint = vendorEndpoint(query);
    const range = getEffectivePeriod(query.period, query.timezone, effectiveDate);
    const localDate = localizedDate(effectiveDate, query.timezone);
    if (query.period === 'daily' || query.period === 'weekly') {
      endpoint.searchParams.set('date', localDate);
    } else if (query.period === 'monthly') {
      endpoint.searchParams.set('month', range.key);
    } else {
      endpoint.searchParams.set('year', range.key);
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Api-Key': this.apiKey
        },
        signal
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new StarsApiProviderError('StarsAPI forecast request failed.', { cause: error });
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new StarsApiProviderError(`StarsAPI returned HTTP ${response.status}.`, {
          statusCode: response.status,
          cause: error
        });
      }
      throw new StarsApiProviderError('StarsAPI returned invalid JSON.', {
        statusCode: response.status,
        cause: error
      });
    }

    if (!response.ok) {
      const errorBody = isRecord(responseBody) && isRecord(responseBody.error)
        ? responseBody.error
        : {};
      throw new StarsApiProviderError(
        `StarsAPI returned HTTP ${response.status}.`,
        {
          statusCode: response.status,
          vendorCode: nonEmptyString(errorBody.code)
        }
      );
    }

    if (!isRecord(responseBody) || responseBody.success !== true || !isRecord(responseBody.data)) {
      throw new StarsApiProviderError('StarsAPI returned an unsuccessful forecast response.', {
        statusCode: response.status
      });
    }

    const data = responseBody.data;
    if (data.is_sample === true) {
      throw new StarsApiProviderError('StarsAPI returned sample content; a live-content plan is required.', {
        vendorCode: 'FORECAST_UNAVAILABLE'
      });
    }
    const returnedSign = nonEmptyString(data.sign)?.toLowerCase();
    const returnedPeriod = nonEmptyString(data.period_type)?.toLowerCase();
    const returnedSubtype = nonEmptyString(data.sub_type)?.toLowerCase();
    if (returnedSign && returnedSign !== query.sign) {
      throw new StarsApiProviderError('StarsAPI response sign did not match the request.');
    }
    if (returnedPeriod && returnedPeriod !== query.period) {
      throw new StarsApiProviderError('StarsAPI response period did not match the request.');
    }
    if (returnedSubtype && returnedSubtype !== query.subtype) {
      throw new StarsApiProviderError('StarsAPI response subtype did not match the request.');
    }

    const summary = nonEmptyString(data.summary);
    if (!summary) throw new StarsApiProviderError('StarsAPI response omitted the forecast summary.');
    const language = mapLanguage(data, query.language);
    const sign = query.sign[0].toUpperCase() + query.sign.slice(1);
    const period = query.period[0].toUpperCase() + query.period.slice(1);
    const subtype = query.subtype === 'general'
      ? ''
      : ` ${query.subtype[0].toUpperCase()}${query.subtype.slice(1)}`;
    const startDateFields = query.period === 'daily'
      ? ['date']
      : ['period_start_date', 'period_start'];
    const endDateFields = query.period === 'daily'
      ? ['date']
      : ['period_end_date', 'period_end'];

    const sections = mapSections(data);
    return Object.freeze({
      sign: query.sign,
      period: query.period,
      subtype: query.subtype,
      startDate: responseDate(data, startDateFields, range.startDate),
      endDate: responseDate(data, endDateFields, range.endDate),
      title: `${sign} ${period}${subtype} Horoscope`,
      summary,
      content: mapContent(data),
      ...(sections ? { sections } : {}),
      provider: 'starsapi',
      publishedAt: responseDate(
        isRecord(responseBody.meta) ? responseBody.meta : {},
        ['timestamp'],
        responseDate(data, ['generated_at'], effectiveDate.toISOString())
      ),
      ...language
    });
  }
}
