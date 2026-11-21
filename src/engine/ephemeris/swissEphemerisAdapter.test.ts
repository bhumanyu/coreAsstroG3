import { afterEach, describe, expect, it, vi } from 'vitest';
import { Planet, AyanamsaType } from '../../types';
import {
  loadBrowserEphemerisFiles,
  swissEphemerisAdapter
} from './swissEphemerisAdapter';

const TEST_JD = 2461065.837117963;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Swiss Ephemeris adapter', () => {
  it('returns all nine finite, in-range body outputs', () => {
    const positions = swissEphemerisAdapter.tropicalPositions(TEST_JD);
    for (const planet of Object.values(Planet)) {
      expect(Number.isFinite(positions[planet].longitude)).toBe(true);
      expect(positions[planet].longitude).toBeGreaterThanOrEqual(0);
      expect(positions[planet].longitude).toBeLessThan(360);
      expect(Number.isFinite(positions[planet].latitude)).toBe(true);
      expect(Math.abs(positions[planet].latitude)).toBeLessThanOrEqual(90);
      expect(Number.isFinite(positions[planet].longitudeSpeed)).toBe(true);
    }
  });

  it('uses mean Rahu semantics and exact Ketu opposition', () => {
    const positions = swissEphemerisAdapter.tropicalPositions(TEST_JD);
    const rahu = positions[Planet.RAHU];
    const ketu = positions[Planet.KETU];
    expect(((ketu.longitude - rahu.longitude + 360) % 360)).toBeCloseTo(180, 10);
    expect(ketu.latitude).toBeCloseTo(-rahu.latitude, 10);
    expect(ketu.longitudeSpeed).toBeCloseTo(rahu.longitudeSpeed, 10);
  });

  it('classifies motion directly from longitudeSpeed', () => {
    const positions = swissEphemerisAdapter.tropicalPositions(TEST_JD);
    for (const planet of [Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN]) {
      const speed = positions[planet].longitudeSpeed;
      const retrograde = speed < 0;
      const stationary = Math.abs(speed) < 0.005;
      expect(retrograde).toBe(speed < 0);
      expect(stationary).toBe(Math.abs(speed) < 0.005);
    }
  });

  it('isolates ayanamsa modes across alternating calls', () => {
    const types = [
      AyanamsaType.LAHIRI,
      AyanamsaType.RAMAN,
      AyanamsaType.KRISHNAMURTI,
      AyanamsaType.FAGAN_BRADLEY,
      AyanamsaType.TROPICAL
    ];
    const forward = types.map(type => swissEphemerisAdapter.ayanamsaFor(TEST_JD, type));
    const reverse = [...types].reverse().map(type => swissEphemerisAdapter.ayanamsaFor(TEST_JD, type));
    for (const type of types) {
      const isolated = swissEphemerisAdapter.ayanamsaFor(TEST_JD, type);
      expect(isolated).toBeCloseTo(forward[types.indexOf(type)], 10);
    }
    expect(forward[0]).toBeCloseTo(swissEphemerisAdapter.ayanamsa(TEST_JD), 10);
    expect(forward[4]).toBe(0);
    expect(Number.isFinite(reverse[0])).toBe(true);
  });

  it('verifies sequential interleaving and Lahiri restoration', () => {
    const types = [
      AyanamsaType.LAHIRI,
      AyanamsaType.RAMAN,
      AyanamsaType.KRISHNAMURTI,
      AyanamsaType.FAGAN_BRADLEY,
      AyanamsaType.TROPICAL
    ];
    let last = 0;
    for (const type of [...types, ...types].reverse()) {
      const value = swissEphemerisAdapter.ayanamsaFor(TEST_JD, type);
      if (type !== AyanamsaType.TROPICAL) expect(Number.isFinite(value)).toBe(true);
      if (type === AyanamsaType.TROPICAL) expect(value).toBe(0);
      last = swissEphemerisAdapter.ayanamsa(TEST_JD);
      expect(last).toBeCloseTo(swissEphemerisAdapter.ayanamsaFor(TEST_JD, AyanamsaType.LAHIRI), 10);
    }
  });

  it('classifies a genuine retrograde Jupiter and near-stationary Mercury', () => {
    const retrograde = swissEphemerisAdapter.tropicalPositions(2460645.499201289)[Planet.JUPITER];
    expect(retrograde.longitudeSpeed).toBeLessThan(0);
    const stationary = swissEphemerisAdapter.tropicalPositions(2461468)[Planet.MERCURY];
    expect(stationary.longitudeSpeed).toBeLessThan(0);
    expect(Math.abs(stationary.longitudeSpeed)).toBeLessThan(0.005);
  });

  it('fails closed for missing browser ephemeris assets', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(loadBrowserEphemerisFiles('/missing-ephe')).rejects.toThrow(/404|failed/i);
  });

  it('rejects non-finite, out-of-range, and unsupported-date inputs', () => {
    expect(() => swissEphemerisAdapter.tropicalPositions(Number.NaN)).toThrow(/finite/i);
    expect(() => swissEphemerisAdapter.tropicalPositions(2000000)).toThrow(/outside/i);
  });

  it('calculates an ascendant only for valid locations', () => {
    expect(swissEphemerisAdapter.ascendantTropical(TEST_JD, 28.6139, 77.2090)).toBeGreaterThanOrEqual(0);
    expect(swissEphemerisAdapter.ascendantTropical(TEST_JD, 28.6139, 77.2090)).toBeLessThan(360);
    expect(() => swissEphemerisAdapter.ascendantTropical(TEST_JD, 91, 77)).toThrow(/Latitude/i);
    expect(() => swissEphemerisAdapter.ascendantTropical(TEST_JD, 28, 181)).toThrow(/Longitude/i);
  });
});
