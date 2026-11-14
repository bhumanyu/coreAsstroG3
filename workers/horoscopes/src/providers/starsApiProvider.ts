import type { ForecastQuery, HoroscopeProvider, RashiForecast } from '../types';

export class StarsApiProvider implements HoroscopeProvider {
  readonly cacheId = 'starsapi' as const;

  constructor(private readonly apiKey: string) {
    if (!apiKey) throw new Error('STARSAPI_KEY is required.');
  }

  async fetchForecast(_query: ForecastQuery, _effectiveDate: Date): Promise<RashiForecast> {
    /*
     * Implementation gate: confirm the selected plan permits end-user display,
     * white-label use, the configured cache duration, and required attribution.
     * Expected request shape: zodiacSystem=vedic_moon, sign, period, subtype,
     * and language. Hindi output requires reviewed samples for every period.
     */
    void this.apiKey;
    throw new Error('StarsApiProvider not implemented — pending license confirmation');
  }
}
