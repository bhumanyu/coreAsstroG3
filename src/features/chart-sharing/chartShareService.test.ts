import { describe, expect, it } from 'vitest';
import { AyanamsaType, type BirthDetails } from '../../types';
import { createChartShareUrl, decodeChartShareUrlFragment } from './chartShareService';

const birth: BirthDetails = {
  name: 'Hidden name',
  placeOfBirth: 'Hidden location',
  dateTimeStr: '2024-05-15T12:00:00+00:00',
  timeZone: 'UTC',
  latitude: 23.17,
  longitude: 75.78,
  ayanamsa: AyanamsaType.RAMAN
};

describe('chart share URL service', () => {
  it('places the versioned token in a URL fragment and retains no identifying fields', () => {
    const result = createChartShareUrl('https://example.test/chart?view=overview', birth);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const url = new URL(result.value);
    expect(url.pathname).toBe('/chart');
    expect(url.search).toBe('?view=overview');
    expect(url.hash).toMatch(/^#chart=v1\./);
    expect(result.value).not.toContain('Hidden name');
    expect(result.value).not.toContain('Hidden location');
    expect(decodeChartShareUrlFragment(url.hash)).toMatchObject({
      ok: true, value: { dateTimeStr: birth.dateTimeStr, ayanamsa: 'RAMAN' }
    });
  });

  it('returns a safe decode error for malformed fragments and accepts empty fragment', () => {
    expect(decodeChartShareUrlFragment('')).toEqual({ ok: false, error: 'MISSING' });
    expect(decodeChartShareUrlFragment('#chart=v99.payload')).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(decodeChartShareUrlFragment('#unrelated=yes')).toEqual({ ok: false, error: 'MISSING' });
  });

  it('works offline without any network dependency', () => {
    const url = createChartShareUrl('https://offline.example/app', birth);
    expect(url.ok).toBe(true);
    if (url.ok) expect(decodeChartShareUrlFragment(new URL(url.value).hash).ok).toBe(true);
  });
});
