import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HINDI_HOROSCOPE } from '../../config/featureFlags';
import { SIGNS_METADATA, SIGNS_ORDER } from '../../data/astroData';
import type { Horoscope } from '../../types';
import { Planet } from '../../types';
import {
  fetchRashiForecast,
  HoroscopeServiceError,
  type RashiForecast,
  type RashiForecastPeriod,
  type RashiForecastSign,
  type RashiForecastSubtype
} from '../../services/horoscopeService';

const periods: readonly RashiForecastPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const forecastCache = new Map<string, RashiForecast>();
const inFlightForecasts = new Map<string, Promise<RashiForecast>>();

function getLocalDateParts(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return { year: Number(value('year')), month: Number(value('month')), day: Number(value('day')) };
}

function effectiveDateKey(period: RashiForecastPeriod, timeZone: string): string {
  const { year, month, day } = getLocalDateParts(timeZone);
  if (period === 'yearly') return String(year);
  if (period === 'monthly') return `${year}-${String(month).padStart(2, '0')}`;
  if (period === 'daily') return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const localDate = new Date(Date.UTC(year, month - 1, day));
  localDate.setUTCDate(localDate.getUTCDate() + 4 - (localDate.getUTCDay() || 7));
  const isoYear = localDate.getUTCFullYear();
  const firstDay = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((localDate.getTime() - firstDay.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

function makeCacheKey(
  sign: RashiForecastSign,
  period: RashiForecastPeriod,
  subtype: RashiForecastSubtype,
  language: 'en' | 'hi',
  timeZone: string
): string {
  return [sign, period, subtype, language, effectiveDateKey(period, timeZone)].join('|');
}

function getMoonSign(horoscope?: Horoscope): RashiForecastSign | undefined {
  const moonSign = horoscope?.planetFacts?.[Planet.MOON]?.sign;
  if (!moonSign) return undefined;
  const normalized = String(moonSign).toLowerCase();
  return SIGNS_ORDER.some((sign) => String(sign).toLowerCase() === normalized)
    ? normalized as RashiForecastSign
    : undefined;
}

function getForecastForKey(
  key: string,
  request: Parameters<typeof fetchRashiForecast>[0]
): Promise<RashiForecast> {
  const cached = forecastCache.get(key);
  if (cached) return Promise.resolve(cached);

  const pending = inFlightForecasts.get(key);
  if (pending) return pending;

  const requestPromise = fetchRashiForecast(request)
    .then((forecast) => {
      forecastCache.set(key, forecast);
      return forecast;
    })
    .finally(() => {
      inFlightForecasts.delete(key);
    });
  inFlightForecasts.set(key, requestPromise);
  return requestPromise;
}

export function clearRashiForecastCache(): void {
  forecastCache.clear();
  inFlightForecasts.clear();
}

export interface RashiForecastCardProps {
  readonly horoscope?: Horoscope;
}

export const RashiForecastCard: React.FC<RashiForecastCardProps> = ({ horoscope }) => {
  const { t, i18n } = useTranslation('home');
  const moonSign = getMoonSign(horoscope);
  const [selectedSign, setSelectedSign] = useState<RashiForecastSign | undefined>();
  const sign = selectedSign ?? moonSign ?? 'aries';
  const [period, setPeriod] = useState<RashiForecastPeriod>('daily');
  const subtype: RashiForecastSubtype = 'general';
  const language = HINDI_HOROSCOPE && (i18n.resolvedLanguage ?? i18n.language).startsWith('hi') ? 'hi' : 'en';
  const timeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', []);
  const cacheKey = makeCacheKey(sign, period, subtype, language, timeZone);
  const [forecast, setForecast] = useState<RashiForecast>();
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unavailable'>('loading');
  const [expanded, setExpanded] = useState(false);
  const [retryNumber, setRetryNumber] = useState(0);

  useEffect(() => {
    let active = true;
    setForecast(undefined);
    setExpanded(false);
    setState('loading');
    getForecastForKey(cacheKey, { sign, period, subtype, language, timezone: timeZone })
      .then((result) => {
        if (!active) return;
        setForecast(result);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState(
          error instanceof HoroscopeServiceError &&
          (error.statusCode === 404 || error.serverCode === 'FORECAST_UNAVAILABLE')
            ? 'unavailable'
            : 'error'
        );
      });
    return () => {
      active = false;
    };
  }, [cacheKey, language, period, retryNumber, sign, subtype, timeZone]);

  const displayLocale = forecast?.language === 'hi' ? 'hi-IN' : 'en-IN';
  const formatDate = (date: string) => {
    const calendarDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
    return new Intl.DateTimeFormat(displayLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: calendarDateOnly ? 'UTC' : timeZone
    }).format(new Date(calendarDateOnly ? `${date}T00:00:00Z` : date));
  };
  const publishedAt = forecast
    ? new Intl.DateTimeFormat(displayLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(forecast.publishedAt))
    : '';

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <header className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">{t('rashiForecast.eyebrow')}</p>
        <h2 className="mt-1 font-serif-astro text-lg font-semibold text-slate-100">{t('rashiForecast.title')}</h2>
        <p className="mt-1 text-xs text-slate-400">{t('rashiForecast.disclaimer')}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label={t('rashiForecast.periodLabel')} className="flex flex-wrap gap-1">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={period === item}
              onClick={() => setPeriod(item)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${period === item ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              {t(`rashiForecast.periods.${item}`)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          <span>{t('rashiForecast.browseSign')}</span>
          <select
            aria-label={t('rashiForecast.browseSign')}
            value={sign}
            onChange={(event) => {
              const selected = SIGNS_ORDER.find(
                (item) => SIGNS_METADATA[item].englishName?.toLowerCase() === event.target.value
              );
              if (selected) setSelectedSign(String(selected).toLowerCase() as RashiForecastSign);
            }}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {SIGNS_ORDER.map((item) => {
              const metadata = SIGNS_METADATA[item];
              const englishName = metadata.englishName ?? String(item);
              return (
                <option key={item} value={englishName.toLowerCase()}>
                  {t(`signs.${englishName}`)}
                </option>
              );
            })}
          </select>
        </label>
      </div>

      <div aria-live="polite" className="min-h-44 rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
        {state === 'loading' && (
          <div role="status" aria-label={t('rashiForecast.loading')} className="animate-pulse space-y-3">
            <div className="h-4 w-2/5 rounded bg-slate-700/70" />
            <div className="h-3 w-1/3 rounded bg-slate-800" />
            <div className="h-3 w-full rounded bg-slate-800" />
            <div className="h-3 w-5/6 rounded bg-slate-800" />
            <span className="sr-only">{t('rashiForecast.loading')}</span>
          </div>
        )}
        {state === 'error' && (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <p role="alert" className="text-sm text-rose-300">{t('rashiForecast.error')}</p>
            <button
              type="button"
              onClick={() => setRetryNumber((value) => value + 1)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {t('rashiForecast.retry')}
            </button>
          </div>
        )}
        {state === 'unavailable' && (
          <p className="flex min-h-36 items-center justify-center text-center text-sm text-slate-400">
            {t('rashiForecast.unavailable')}
          </p>
        )}
        {state === 'ready' && forecast && (
          <article>
            <h3 className="font-serif-astro text-base font-semibold text-slate-100">{forecast.title}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(forecast.startDate)} – {formatDate(forecast.endDate)}
            </p>
            {forecast.languageFallback && (
              <p className="mt-2 text-[11px] text-amber-300">{t('rashiForecast.languageFallback')}</p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-slate-200">{forecast.summary}</p>
            {expanded && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{forecast.content}</p>}
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-2 text-xs font-medium text-indigo-300 hover:text-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {expanded ? t('rashiForecast.less') : t('rashiForecast.more')}
            </button>
            {forecast.sections && (
              <dl className="mt-4 grid gap-2 border-t border-slate-800 pt-3 sm:grid-cols-2">
                {([
                  ['love', forecast.sections.love],
                  ['career', forecast.sections.career],
                  ['health', forecast.sections.health],
                  ['luckyColour', forecast.sections.luckyColour],
                  ['luckyNumber', forecast.sections.luckyNumber]
                ] as const).filter((entry) => entry[1]).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t(`rashiForecast.sections.${key}`)}</dt>
                    <dd className="mt-0.5 text-xs text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-4 border-t border-slate-800 pt-2 text-[10px] text-slate-500">
              {t('rashiForecast.attribution', { provider: forecast.provider, publishedAt })}
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
