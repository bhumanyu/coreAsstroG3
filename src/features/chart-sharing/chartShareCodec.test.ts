import { describe, expect, it } from 'vitest';
import { AyanamsaType, type BirthDetails } from '../../types';
import { decodeChartShare, encodeChartShare, MAX_SHARE_TOKEN_LENGTH } from './chartShareCodec';

const birth: BirthDetails = {
  name: 'Do not share',
  placeOfBirth: 'Private place',
  dateTimeStr: '2024-05-15T12:00:00Z',
  timeZone: 'Asia/Kolkata',
  latitude: 28.6139,
  longitude: 77.209,
  ayanamsa: AyanamsaType.LAHIRI
};

function base64UrlJson(value: unknown): string {
  const base64 = btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `v1.${base64}`;
}

function base64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

describe('chart share codec', () => {
  it('round-trips minimum inputs while excluding name and place, accepting UTC ISO with Z', () => {
    const encoded = encodeChartShare(birth);
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) return;
    const decoded = decodeChartShare(encoded.value);
    expect(decoded).toEqual({
      ok: true,
      value: {
        version: 1,
        dateTimeStr: birth.dateTimeStr,
        timeZone: birth.timeZone,
        latitude: birth.latitude,
        longitude: birth.longitude,
        ayanamsa: AyanamsaType.LAHIRI
      }
    });
    expect(encoded.value).not.toContain('Do not share');
    expect(encoded.value).not.toContain('Private place');
  });

  it('validates real AyanamsaType and invalid UTC dates', () => {
    expect(encodeChartShare({ ...birth, dateTimeStr: '2024-05-15T12:00' })).toEqual({ ok: false, error: 'INVALID_INPUT' });
    expect(decodeChartShare(base64UrlJson({
      version: 1, dateTimeStr: birth.dateTimeStr, timeZone: birth.timeZone,
      latitude: birth.latitude, longitude: birth.longitude, ayanamsa: 'NOT_REAL'
    }))).toEqual({ ok: false, error: 'INVALID_INPUT' });
  });

  it('returns distinct errors for missing, too-large, bad encoding, bad JSON, unsupported version, and invalid payload', () => {
    expect(decodeChartShare(null)).toEqual({ ok: false, error: 'MISSING' });
    expect(decodeChartShare(`v1.${'a'.repeat(MAX_SHARE_TOKEN_LENGTH)}`)).toEqual({ ok: false, error: 'TOO_LARGE' });
    expect(decodeChartShare('v1.%%%')).toEqual({ ok: false, error: 'BAD_ENCODING' });
    expect(decodeChartShare(`v1.${base64Url('{broken')}`)).toEqual({ ok: false, error: 'BAD_JSON' });
    expect(decodeChartShare('v2.eyJ2ZXJzaW9uIjoyfQ')).toEqual({ ok: false, error: 'UNSUPPORTED_VERSION' });
    expect(decodeChartShare(base64UrlJson({ version: 1, name: 'extra' }))).toEqual({ ok: false, error: 'INVALID_INPUT' });
  });

  it('enforces the maximum encoded token length', () => {
    const tooLong = { ...birth, timeZone: 'A'.repeat(3000) };
    expect(encodeChartShare(tooLong)).toEqual({ ok: false, error: 'INVALID_INPUT' });
    expect(decodeChartShare(`v1.${'A'.repeat(MAX_SHARE_TOKEN_LENGTH)}`)).toEqual({ ok: false, error: 'TOO_LARGE' });
  });
});
