import type {
  ForecastLanguage,
  ForecastPeriod,
  ForecastQuery,
  ForecastSubtype,
  RashiForecast,
  RashiSign
} from './types';

export const RASHI_SIGNS: readonly RashiSign[] = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces'
];

const periods: readonly ForecastPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const subtypes: readonly ForecastSubtype[] = ['general', 'love', 'career'];
const languages: readonly ForecastLanguage[] = ['en', 'hi'];
const queryKeys = new Set(['sign', 'period', 'subtype', 'language', 'timezone']);

export type QueryValidation =
  | { readonly ok: true; readonly value: ForecastQuery }
  | { readonly ok: false; readonly message: string };

function getSingleParameter(params: URLSearchParams, name: string): string | undefined {
  const values = params.getAll(name);
  return values.length === 1 ? values[0].trim() : undefined;
}

export function parseForecastQuery(params: URLSearchParams): QueryValidation {
  for (const [key] of params) {
    if (!queryKeys.has(key)) return { ok: false, message: `Unknown query parameter: ${key}.` };
  }

  const sign = getSingleParameter(params, 'sign');
  const period = getSingleParameter(params, 'period');
  const subtype = getSingleParameter(params, 'subtype') ?? 'general';
  const language = getSingleParameter(params, 'language') ?? 'en';
  const timezone = getSingleParameter(params, 'timezone') ?? 'UTC';

  if (!sign || !RASHI_SIGNS.includes(sign as RashiSign)) {
    return { ok: false, message: 'sign must be one of the 12 lowercase rashi values.' };
  }
  if (!period || !periods.includes(period as ForecastPeriod)) {
    return { ok: false, message: 'period must be daily, weekly, monthly, or yearly.' };
  }
  if (!subtype || !subtypes.includes(subtype as ForecastSubtype)) {
    return { ok: false, message: 'subtype must be general, love, or career.' };
  }
  if (!language || !languages.includes(language as ForecastLanguage)) {
    return { ok: false, message: 'language must be en or hi.' };
  }
  if (!timezone) {
    return { ok: false, message: 'timezone must be a valid IANA timezone.' };
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date());
  } catch {
    return { ok: false, message: 'timezone must be a valid IANA timezone.' };
  }
  if (params.getAll('sign').length !== 1 || params.getAll('period').length !== 1) {
    return { ok: false, message: 'sign and period must each be provided exactly once.' };
  }
  for (const optionalParameter of ['subtype', 'language', 'timezone']) {
    if (params.getAll(optionalParameter).length > 1) {
      return { ok: false, message: `${optionalParameter} may only be provided once.` };
    }
  }

  return {
    ok: true,
    value: {
      sign: sign as RashiSign,
      period: period as ForecastPeriod,
      subtype: subtype as ForecastSubtype,
      language: language as ForecastLanguage,
      timezone
    }
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidDate(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

export function isRashiForecast(
  value: unknown,
  query?: ForecastQuery
): value is RashiForecast {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const forecast = value as Record<string, unknown>;
  const sections = forecast.sections;
  const validSections = sections === undefined || (
    typeof sections === 'object' && sections !== null && !Array.isArray(sections) &&
    ['love', 'career', 'health', 'luckyColour', 'luckyNumber'].every((key) => {
      const sectionValue = (sections as Record<string, unknown>)[key];
      return sectionValue === undefined || typeof sectionValue === 'string';
    })
  );
  const valid = (
    typeof forecast.sign === 'string' && RASHI_SIGNS.includes(forecast.sign as RashiSign) &&
    typeof forecast.period === 'string' && periods.includes(forecast.period as ForecastPeriod) &&
    typeof forecast.subtype === 'string' && subtypes.includes(forecast.subtype as ForecastSubtype) &&
    isValidDate(forecast.startDate) &&
    isValidDate(forecast.endDate) &&
    isNonEmptyString(forecast.title) &&
    isNonEmptyString(forecast.summary) &&
    isNonEmptyString(forecast.content) &&
    validSections &&
    forecast.provider === 'starsapi' &&
    isValidDate(forecast.publishedAt) &&
    (forecast.language === 'en' || forecast.language === 'hi') &&
    (forecast.languageFallback === undefined || typeof forecast.languageFallback === 'boolean')
  );
  if (!valid || !query) return valid;
  return forecast.sign === query.sign &&
    forecast.period === query.period &&
    forecast.subtype === query.subtype &&
    (forecast.language === query.language ||
      (query.language === 'hi' && forecast.language === 'en' && forecast.languageFallback === true)) &&
    (forecast.languageFallback !== true || query.language === 'hi');
}
