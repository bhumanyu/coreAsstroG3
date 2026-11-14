import { describe, expect, it } from 'vitest';
import { computePanchang } from '../panchang';

describe('computePanchang', () => {
  it('matches the New Delhi sunrise panchang for the 2024-04-08 solar eclipse date', () => {
    const panchang = computePanchang(new Date('2024-04-08T00:00:00.000Z'));

    expect(panchang.tithi).toEqual({ number: 15, name: 'Amavasya', paksha: 'Krishna' });
    expect(panchang.nakshatra.name).toBe('Uttara Bhadrapada');
    expect(panchang.yoga).toBe('Indra');
    expect(panchang.sunrise).toBeInstanceOf(Date);
    expect(panchang.sunset).toBeInstanceOf(Date);
  });

  it('rejects invalid dates and coordinates explicitly', () => {
    expect(() => computePanchang(new Date(Number.NaN))).toThrow('valid Date');
    expect(() => computePanchang(new Date(), {
      latitude: 91,
      longitude: 77.209,
      timeZone: 'Asia/Kolkata'
    })).toThrow('valid latitude and longitude');
  });
});
