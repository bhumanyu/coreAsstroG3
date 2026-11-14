export type RashiForecastSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type RashiForecastPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RashiForecastSubtype = 'general' | 'love' | 'career';
export type RashiForecastLanguage = 'en' | 'hi';

export interface RashiForecast {
  readonly sign: RashiForecastSign;
  readonly period: RashiForecastPeriod;
  readonly subtype: RashiForecastSubtype;
  readonly startDate: string;
  readonly endDate: string;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly sections?: Readonly<{
    love?: string;
    career?: string;
    health?: string;
    luckyColour?: string;
    luckyNumber?: string;
  }>;
  readonly provider: 'starsapi';
  readonly publishedAt: string;
  readonly language: RashiForecastLanguage;
  readonly languageFallback?: boolean;
}

export interface FetchRashiForecastRequest {
  readonly sign: RashiForecastSign;
  readonly period: RashiForecastPeriod;
  readonly subtype?: RashiForecastSubtype;
  readonly language: RashiForecastLanguage;
  readonly timezone: string;
}

export type HoroscopeServiceErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'HTTP_ERROR'
  | 'INVALID_RESPONSE';

export class HoroscopeServiceError extends Error {
  readonly code: HoroscopeServiceErrorCode;
  readonly statusCode?: number;
  readonly serverCode?: string;
  override readonly cause?: unknown;

  constructor(
    code: HoroscopeServiceErrorCode,
    message: string,
    options: { statusCode?: number; serverCode?: string; cause?: unknown } = {}
  ) {
    super(message);
    this.name = 'HoroscopeServiceError';
    this.code = code;
    this.statusCode = options.statusCode;
    this.serverCode = options.serverCode;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const DEFAULT_TIMEOUT_MS = 8000;
const HOROSCOPE_API_BASE_URL = import.meta.env.VITE_HOROSCOPE_API_BASE_URL ?? '';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isForecast(value: unknown): value is RashiForecast {
  if (!isRecord(value)) return false;
  const sections = value.sections;
  const validSections = sections === undefined || (
    isRecord(sections) &&
    ['love', 'career', 'health', 'luckyColour', 'luckyNumber'].every((key) =>
      sections[key] === undefined || typeof sections[key] === 'string'
    )
  );
  return (
    isNonEmptyString(value.sign) &&
    isNonEmptyString(value.period) &&
    isNonEmptyString(value.subtype) &&
    isValidDate(value.startDate) &&
    isValidDate(value.endDate) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.summary) &&
    isNonEmptyString(value.content) &&
    validSections &&
    value.provider === 'starsapi' &&
    isValidDate(value.publishedAt) &&
    (value.language === 'en' || value.language === 'hi') &&
    (value.languageFallback === undefined || typeof value.languageFallback === 'boolean')
  );
}

function freezeForecast(value: RashiForecast): RashiForecast {
  return Object.freeze({
    ...value,
    ...(value.sections ? { sections: Object.freeze({ ...value.sections }) } : {})
  });
}

function horoscopeEndpoint(): string {
  const base = HOROSCOPE_API_BASE_URL.replace(/\/+$/, '');
  return `${base}/api/horoscopes`;
}

export async function fetchRashiForecast(
  request: FetchRashiForecastRequest,
  options: { readonly timeoutMs?: number } = {}
): Promise<RashiForecast> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new HoroscopeServiceError('INVALID_RESPONSE', 'Horoscope request timeout must be greater than zero.');
  }

  const url = new URL(horoscopeEndpoint(), window.location.origin);
  url.searchParams.set('sign', request.sign);
  url.searchParams.set('period', request.period);
  url.searchParams.set('subtype', request.subtype ?? 'general');
  url.searchParams.set('language', request.language);
  url.searchParams.set('timezone', request.timezone);

  const controller = new AbortController();
  const timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      let serverCode: string | undefined;
      try {
        const errorBody: unknown = await response.json();
        if (isRecord(errorBody)) {
          if (typeof errorBody.code === 'string') {
            serverCode = errorBody.code;
          } else if (isRecord(errorBody.error) && typeof errorBody.error.code === 'string') {
            serverCode = errorBody.error.code;
          }
        }
      } catch {
        serverCode = undefined;
      }
      throw new HoroscopeServiceError(
        'HTTP_ERROR',
        `Horoscope service returned HTTP ${response.status}.`,
        { statusCode: response.status, serverCode }
      );
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      throw new HoroscopeServiceError(
        'INVALID_RESPONSE',
        'Horoscope service returned invalid JSON.',
        { cause: error }
      );
    }

    if (!isForecast(responseBody) ||
      responseBody.sign !== request.sign ||
      responseBody.period !== request.period ||
      responseBody.subtype !== (request.subtype ?? 'general') ||
      (responseBody.language !== request.language &&
        !(request.language === 'hi' && responseBody.language === 'en' && responseBody.languageFallback === true)) ||
      (responseBody.languageFallback === true && request.language !== 'hi')
    ) {
      throw new HoroscopeServiceError(
        'INVALID_RESPONSE',
        'Horoscope service response did not match the requested forecast.'
      );
    }

    return freezeForecast(responseBody);
  } catch (error) {
    if (error instanceof HoroscopeServiceError) throw error;
    if (
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      throw new HoroscopeServiceError(
        'TIMEOUT',
        `Horoscope request timed out after ${timeoutMs}ms.`,
        { cause: error }
      );
    }
    throw new HoroscopeServiceError(
      'NETWORK_ERROR',
      'Horoscope service network request failed.',
      { cause: error }
    );
  } finally {
    window.clearTimeout(timeoutHandle);
  }
}
