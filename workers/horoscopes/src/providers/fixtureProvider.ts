import { getEffectivePeriod } from '../effectivePeriod';
import type { ForecastQuery, HoroscopeProvider, RashiForecast } from '../types';

export class FixtureProvider implements HoroscopeProvider {
  readonly cacheId = 'fixture' as const;

  async fetchForecast(query: ForecastQuery, effectiveDate: Date): Promise<RashiForecast> {
    const range = getEffectivePeriod(query.period, query.timezone, effectiveDate);
    const sign = query.sign[0].toUpperCase() + query.sign.slice(1);
    const period = query.period[0].toUpperCase() + query.period.slice(1);
    const subtype = query.subtype[0].toUpperCase() + query.subtype.slice(1);
    const fallback = query.language === 'hi';

    return Object.freeze({
      sign: query.sign,
      period: query.period,
      subtype: query.subtype,
      startDate: range.startDate,
      endDate: range.endDate,
      title: `${sign} ${period} ${subtype} Horoscope`,
      summary: `Fixture ${subtype.toLowerCase()} forecast for ${sign} (${query.period}).`,
      content: `This deterministic fixture is for ${sign} during the ${query.period} period.`,
      sections: Object.freeze({
        love: `Fixture love outlook for ${sign}.`,
        career: `Fixture career outlook for ${sign}.`,
        health: `Fixture health outlook for ${sign}.`,
        luckyColour: 'Indigo',
        luckyNumber: '7'
      }),
      provider: 'starsapi',
      publishedAt: effectiveDate.toISOString(),
      language: fallback ? 'en' : query.language,
      ...(fallback ? { languageFallback: true } : {})
    });
  }
}
