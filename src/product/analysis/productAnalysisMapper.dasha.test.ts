/**
 * Tests for Dasha Period Options Mapper
 */

import { describe, it, expect } from 'vitest';
import { mapDashaPeriodOptions } from './productAnalysisMapper';
import type { SelectablePeriodsResult, PeriodDiagnostic } from '../../core/analysis/selectedMdAdPeriod';
import { Planet } from '../../types';

describe('mapDashaPeriodOptions', () => {
  it('computes temporalRelation as CURRENT when asOf is within period interval', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [
        {
          id: 'ad-1',
          mahadashaId: 'md-1',
          planet: Planet.SATURN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      diagnostics: []
    };

    const analysisAsOf = '2021-06-15T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas).toHaveLength(1);
    expect(result.mahadashas[0].temporalRelation).toBe('CURRENT');
    expect(result.mahadashas[0].antardashas).toHaveLength(1);
    expect(result.mahadashas[0].antardashas[0].temporalRelation).toBe('CURRENT');
  });

  it('computes temporalRelation as FUTURE when asOf is before period start', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2030-01-01T00:00:00.000Z',
          end: '2046-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [],
      diagnostics: []
    };

    const analysisAsOf = '2024-01-01T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas[0].temporalRelation).toBe('FUTURE');
  });

  it('computes temporalRelation as PAST when asOf is after period end', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2000-01-01T00:00:00.000Z',
          end: '2016-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [],
      diagnostics: []
    };

    const analysisAsOf = '2024-01-01T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas[0].temporalRelation).toBe('PAST');
  });

  it('preserves verbatim IDs, dates, valid, and diagnostics', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-test-123',
          planet: Planet.SATURN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2039-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: [] as PeriodDiagnostic[]
        }
      ],
      antardashas: [
        {
          id: 'ad-test-456',
          mahadashaId: 'md-test-123',
          planet: Planet.MERCURY,
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z',
          valid: false,
          diagnostics: ['INVALID_ANTARDASHA_INTERVAL'] as PeriodDiagnostic[]
        }
      ],
      diagnostics: ['DUPLICATE_MAHADASHA_ID'] as PeriodDiagnostic[]
    };

    const analysisAsOf = '2021-06-15T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas[0].id).toBe('md-test-123');
    expect(result.mahadashas[0].planet).toBe('SATURN');
    expect(result.mahadashas[0].start).toBe('2020-01-01T00:00:00.000Z');
    expect(result.mahadashas[0].end).toBe('2039-01-01T00:00:00.000Z');
    expect(result.mahadashas[0].valid).toBe(true);
    expect(result.mahadashas[0].diagnostics).toEqual([]);

    expect(result.mahadashas[0].antardashas[0].id).toBe('ad-test-456');
    expect(result.mahadashas[0].antardashas[0].planet).toBe('MERCURY');
    expect(result.mahadashas[0].antardashas[0].start).toBe('2020-01-01T00:00:00.000Z');
    expect(result.mahadashas[0].antardashas[0].end).toBe('2022-01-01T00:00:00.000Z');
    expect(result.mahadashas[0].antardashas[0].valid).toBe(false);
    expect(result.mahadashas[0].antardashas[0].diagnostics).toEqual(['INVALID_ANTARDASHA_INTERVAL'] as PeriodDiagnostic[]);

    expect(result.diagnostics).toEqual(['DUPLICATE_MAHADASHA_ID'] as PeriodDiagnostic[]);
  });

  it('filters antardashas by mahadashaId', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        },
        {
          id: 'md-2',
          planet: Planet.SATURN,
          start: '2036-01-01T00:00:00.000Z',
          end: '2055-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [
        {
          id: 'ad-1',
          mahadashaId: 'md-1',
          planet: Planet.SATURN,
          start: '2020-01-01T00:00:00.000Z',
          end: '2022-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        },
        {
          id: 'ad-2',
          mahadashaId: 'md-2',
          planet: Planet.MERCURY,
          start: '2036-01-01T00:00:00.000Z',
          end: '2038-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      diagnostics: []
    };

    const analysisAsOf = '2021-06-15T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas).toHaveLength(2);
    expect(result.mahadashas[0].antardashas).toHaveLength(1);
    expect(result.mahadashas[0].antardashas[0].id).toBe('ad-1');
    expect(result.mahadashas[1].antardashas).toHaveLength(1);
    expect(result.mahadashas[1].antardashas[0].id).toBe('ad-2');
  });

  it('handles empty periods list', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [],
      antardashas: [],
      diagnostics: []
    };

    const analysisAsOf = '2024-01-01T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it('computes CURRENT at interval boundary (asOf == start)', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2024-01-01T00:00:00.000Z',
          end: '2036-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [],
      diagnostics: []
    };

    const analysisAsOf = '2024-01-01T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas[0].temporalRelation).toBe('CURRENT');
  });

  it('computes PAST at interval boundary (asOf == end)', () => {
    const selectablePeriods: SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: Planet.JUPITER,
          start: '2020-01-01T00:00:00.000Z',
          end: '2024-01-01T00:00:00.000Z',
          valid: true,
          diagnostics: []
        }
      ],
      antardashas: [],
      diagnostics: []
    };

    const analysisAsOf = '2024-01-01T00:00:00.000Z';
    const result = mapDashaPeriodOptions(selectablePeriods, analysisAsOf);

    expect(result.mahadashas[0].temporalRelation).toBe('PAST');
  });
});
