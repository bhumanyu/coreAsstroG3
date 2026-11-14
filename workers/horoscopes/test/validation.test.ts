import { describe, expect, it } from 'vitest';
import { parseForecastQuery } from '../src/validation';

describe('parseForecastQuery', () => {
  it('accepts valid required params and applies optional defaults', () => {
    const result = parseForecastQuery(new URLSearchParams('sign=aries&period=daily'));
    expect(result).toEqual({
      ok: true,
      value: {
        sign: 'aries',
        period: 'daily',
        subtype: 'general',
        language: 'en',
        timezone: 'UTC'
      }
    });
  });

  it('accepts explicit valid optional params', () => {
    const result = parseForecastQuery(new URLSearchParams(
      'sign=pisces&period=yearly&subtype=career&language=hi&timezone=Asia%2FKolkata'
    ));
    expect(result).toMatchObject({
      ok: true,
      value: { sign: 'pisces', period: 'yearly', subtype: 'career', language: 'hi', timezone: 'Asia/Kolkata' }
    });
  });

  it.each([
    ['period missing', 'sign=aries'],
    ['invalid sign', 'sign=ophiuchus&period=daily'],
    ['invalid period', 'sign=aries&period=hourly'],
    ['invalid subtype', 'sign=aries&period=daily&subtype=travel'],
    ['invalid language', 'sign=aries&period=daily&language=fr'],
    ['invalid timezone', 'sign=aries&period=daily&timezone=Mars%2FOlympus'],
    ['duplicate required param', 'sign=aries&sign=leo&period=daily'],
    ['unknown param', 'sign=aries&period=daily&key=secret']
  ])('rejects %s', (_label, query) => {
    expect(parseForecastQuery(new URLSearchParams(query)).ok).toBe(false);
  });
});
