import { describe, expect, it } from 'vitest';
import type { ProductDashaPeriodOptions } from './productAnalysisTypes';
import {
  buildSelectedPeriodViewModel,
  validateSelectedPeriod
} from './selectedPeriodViewModel';

const options: ProductDashaPeriodOptions = {
  mahadashas: [
    {
      id: 'md-jupiter',
      planet: 'Jupiter',
      start: '2020-01-01T00:00:00.000Z',
      end: '2036-01-01T00:00:00.000Z',
      valid: true,
      diagnostics: [],
      temporalRelation: 'CURRENT',
      antardashas: [
        {
          id: 'ad-saturn',
          planet: 'Saturn',
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: [],
          temporalRelation: 'PAST'
        },
        {
          id: 'ad-invalid',
          planet: 'Mars',
          start: '2022-01-01T00:00:00.000Z',
          end: '2024-01-01T00:00:00.000Z',
          valid: false,
          diagnostics: ['INVALID_ANTARDASHA_INTERVAL'],
          temporalRelation: 'PAST'
        }
      ]
    },
    {
      id: 'md-saturn',
      planet: 'Saturn',
      start: '2036-01-01T00:00:00.000Z',
      end: '2055-01-01T00:00:00.000Z',
      valid: false,
      diagnostics: ['INVALID_MAHADASHA_INTERVAL'],
      temporalRelation: 'FUTURE',
      antardashas: [
        {
          id: 'ad-mars',
          planet: 'Mars',
          start: '2036-01-01T00:00:00.000Z',
          end: '2038-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: [],
          temporalRelation: 'FUTURE'
        }
      ]
    }
  ],
  diagnostics: []
};

describe('selectedPeriodViewModel', () => {
  it('reports EMPTY for no options and LOADING/ERROR for explicit load states', () => {
    expect(buildSelectedPeriodViewModel({ options: { mahadashas: [], diagnostics: [] } }))
      .toEqual({ status: 'EMPTY', canSubmit: false });
    expect(buildSelectedPeriodViewModel({ optionsStatus: 'LOADING' }).status).toBe('LOADING');
    expect(buildSelectedPeriodViewModel({ optionsStatus: 'ERROR' }).status).toBe('ERROR');
    expect(buildSelectedPeriodViewModel({}).status).toBe('EMPTY');
  });

  it('resolves valid MD/AD IDs to the canonical interval and allows submission', () => {
    const result = buildSelectedPeriodViewModel({
      options,
      selection: { mahadashaId: 'md-jupiter', antardashaId: 'ad-saturn' }
    });

    expect(result.status).toBe('READY');
    expect(result.canSubmit).toBe(true);
    expect(result.mahadasha?.id).toBe('md-jupiter');
    expect(result.antardasha?.id).toBe('ad-saturn');
    expect(result.interval).toEqual({
      start: '2020-01-01T00:00:00.000Z',
      end: '2022-01-01T00:00:00.000Z'
    });
  });

  it('does not allow submission while submitting', () => {
    const result = buildSelectedPeriodViewModel({
      options,
      selection: { mahadashaId: 'md-jupiter', antardashaId: 'ad-saturn' },
      isSubmitting: true
    });
    expect(result.canSubmit).toBe(false);
  });

  it('rejects unknown, invalid, or mismatched Mahadasha and Antardasha identifiers', () => {
    expect(validateSelectedPeriod(undefined, {
      mahadashaId: 'md-jupiter',
      antardashaId: 'ad-saturn'
    })).toEqual({ ok: false, error: 'OPTIONS_UNAVAILABLE' });
    expect(validateSelectedPeriod(options, {
      mahadashaId: 'md-unknown',
      antardashaId: 'ad-saturn'
    })).toEqual({ ok: false, error: 'MAHADASHA_NOT_FOUND' });
    expect(validateSelectedPeriod(options, {
      mahadashaId: 'md-saturn',
      antardashaId: 'ad-mars'
    })).toEqual({ ok: false, error: 'MAHADASHA_INVALID' });
    expect(validateSelectedPeriod(options, {
      mahadashaId: 'md-jupiter',
      antardashaId: 'ad-mars'
    })).toEqual({ ok: false, error: 'ANTARDASHA_NOT_FOUND' });
    expect(validateSelectedPeriod(options, {
      mahadashaId: 'md-jupiter',
      antardashaId: 'ad-invalid'
    })).toEqual({ ok: false, error: 'ANTARDASHA_INVALID' });
  });

  it('treats an AD from another MD as stale when the MD changes', () => {
    expect(validateSelectedPeriod(options, {
      mahadashaId: 'md-jupiter',
      antardashaId: 'ad-mars'
    })).toEqual({ ok: false, error: 'ANTARDASHA_NOT_FOUND' });
  });

  it('invalidates a selection when refreshed options no longer contain its IDs', () => {
    const refreshedOptions: ProductDashaPeriodOptions = {
      mahadashas: options.mahadashas.filter(({ id }) => id !== 'md-jupiter'),
      diagnostics: []
    };
    expect(validateSelectedPeriod(refreshedOptions, {
      mahadashaId: 'md-jupiter',
      antardashaId: 'ad-saturn'
    })).toEqual({ ok: false, error: 'MAHADASHA_NOT_FOUND' });
  });
});
