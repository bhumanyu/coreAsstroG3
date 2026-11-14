import type { ForecastPeriod, ForecastQuery } from './types';

export interface EffectivePeriod {
  readonly key: string;
  readonly startDate: string;
  readonly endDate: string;
}

interface LocalDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function localDateParts(date: Date, timezone: string): LocalDateParts {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day'))
  };
}

function formatUtcDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

function utcDate(parts: LocalDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function isoWeekKey(date: Date): string {
  const thursday = new Date(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const isoYear = thursday.getUTCFullYear();
  const firstDay = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((thursday.getTime() - firstDay.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export function getEffectivePeriod(
  period: ForecastPeriod,
  timezone: string,
  effectiveDate = new Date()
): EffectivePeriod {
  const parts = localDateParts(effectiveDate, timezone);
  const date = utcDate(parts);

  if (period === 'daily') {
    const key = formatUtcDate(date);
    return { key, startDate: key, endDate: key };
  }
  if (period === 'weekly') {
    const dayOfWeek = date.getUTCDay() || 7;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return {
      key: isoWeekKey(date),
      startDate: formatUtcDate(monday),
      endDate: formatUtcDate(sunday)
    };
  }
  if (period === 'monthly') {
    const first = new Date(Date.UTC(parts.year, parts.month - 1, 1));
    const last = new Date(Date.UTC(parts.year, parts.month, 0));
    return {
      key: `${parts.year}-${String(parts.month).padStart(2, '0')}`,
      startDate: formatUtcDate(first),
      endDate: formatUtcDate(last)
    };
  }
  const first = new Date(Date.UTC(parts.year, 0, 1));
  const last = new Date(Date.UTC(parts.year, 11, 31));
  return {
    key: String(parts.year),
    startDate: formatUtcDate(first),
    endDate: formatUtcDate(last)
  };
}

export function effectivePeriodKey(query: ForecastQuery, effectiveDate = new Date()): string {
  return getEffectivePeriod(query.period, query.timezone, effectiveDate).key;
}
