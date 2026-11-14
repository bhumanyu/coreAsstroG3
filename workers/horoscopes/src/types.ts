export type RashiSign =
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

export type ForecastPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ForecastSubtype = 'general' | 'love' | 'career';
export type ForecastLanguage = 'en' | 'hi';

export interface ForecastSections {
  readonly love?: string;
  readonly career?: string;
  readonly health?: string;
  readonly luckyColour?: string;
  readonly luckyNumber?: string;
}

export interface RashiForecast {
  readonly sign: RashiSign;
  readonly period: ForecastPeriod;
  readonly subtype: ForecastSubtype;
  readonly startDate: string;
  readonly endDate: string;
  readonly title: string;
  readonly summary: string;
  readonly content: string;
  readonly sections?: ForecastSections;
  readonly provider: 'starsapi';
  readonly publishedAt: string;
  readonly language: ForecastLanguage;
  readonly languageFallback?: boolean;
}

export interface ForecastQuery {
  readonly sign: RashiSign;
  readonly period: ForecastPeriod;
  readonly subtype: ForecastSubtype;
  readonly language: ForecastLanguage;
  readonly timezone: string;
}

export interface HoroscopeProvider {
  readonly cacheId: 'fixture' | 'starsapi';
  fetchForecast(query: ForecastQuery, effectiveDate: Date): Promise<RashiForecast>;
}

export interface HoroscopeCache {
  get(key: string, type: 'text'): Promise<string | null>;
  put(key: string, value: string, options: { expirationTtl: number }): Promise<void>;
}

export interface HoroscopeEnvironment {
  readonly HOROSCOPE_CACHE: HoroscopeCache;
  readonly STARSAPI_KEY?: string;
  readonly ALLOWED_ORIGIN?: string;
}
