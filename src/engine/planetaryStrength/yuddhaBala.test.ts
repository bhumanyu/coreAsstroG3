import { describe, it, expect } from 'vitest';
import { Planet, PlanetFact, StrengthComponentStatus } from '../../types';
import { calculateYuddhaBala, YUDDHA_PLANETS } from './yuddhaBala';

function createMockPlanetFacts(overrides: Partial<Record<Planet, number>> = {}): Record<Planet, PlanetFact> {
  const defaultLongitudes: Record<Planet, number> = {
    [Planet.SUN]: 10,
    [Planet.MOON]: 40,
    [Planet.MARS]: 100,
    [Planet.MERCURY]: 150,
    [Planet.JUPITER]: 200,
    [Planet.VENUS]: 250,
    [Planet.SATURN]: 300,
    [Planet.RAHU]: 50,
    [Planet.KETU]: 230
  };

  const facts: Partial<Record<Planet, PlanetFact>> = {};
  for (const p of Object.values(Planet)) {
    const long = overrides[p] !== undefined ? overrides[p]! : defaultLongitudes[p];
    facts[p] = {
      planet: p,
      position: {
        eclipticLongitude: long,
        isRetrograde: false
      },
      house: 1
    } as unknown as PlanetFact;
  }
  return facts as Record<Planet, PlanetFact>;
}

describe('calculateYuddhaBala', () => {
  it('throws an error if planetFacts input is missing or invalid', () => {
    expect(() => calculateYuddhaBala(null as any)).toThrow();
    expect(() => calculateYuddhaBala({} as any)).toThrow();
  });

  it('throws an error if a planet fact longitude is invalid', () => {
    const facts = createMockPlanetFacts();
    (facts[Planet.MARS] as any).position.eclipticLongitude = NaN;
    expect(() => calculateYuddhaBala(facts)).toThrow();
  });

  it('evaluates exactly 10 unique pairs for applicable planets', () => {
    const facts = createMockPlanetFacts();
    const result = calculateYuddhaBala(facts);

    for (const p of YUDDHA_PLANETS) {
      expect(result[p]?.pairs?.length).toBe(4);
    }
  });

  it('classifies Sun, Moon, Rahu, Ketu as NOT_APPLICABLE', () => {
    const facts = createMockPlanetFacts();
    const result = calculateYuddhaBala(facts);

    const nonYuddhaPlanets = [Planet.SUN, Planet.MOON, Planet.RAHU, Planet.KETU];
    for (const p of nonYuddhaPlanets) {
      expect(result[p]?.status).toBe(StrengthComponentStatus.NOT_APPLICABLE);
      expect(result[p]?.value).toBeUndefined();
      expect(result[p]?.pairs).toEqual([]);
      expect(result[p]?.reason).toContain('outside classical planetary war');
    }
  });

  it('detects planetary war when separation is 0.5 degrees (< 1 deg)', () => {
    const facts = createMockPlanetFacts({
      [Planet.MARS]: 100.0,
      [Planet.MERCURY]: 100.5
    });
    const result = calculateYuddhaBala(facts);

    expect(result[Planet.MARS]?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
    expect(result[Planet.MARS]?.value).toBeUndefined();

    const marsMercPair = result[Planet.MARS]?.pairs?.find(
      (p: any) => (p.planetA === Planet.MARS && p.planetB === Planet.MERCURY) ||
           (p.planetA === Planet.MERCURY && p.planetB === Planet.MARS)
    );

    expect(marsMercPair).toBeDefined();
    expect(marsMercPair!.isYuddha).toBe(true);
    expect(marsMercPair!.separation).toBeCloseTo(0.5, 4);
    expect(marsMercPair!.ruleId).toBe('YUDDHA_BALA_001');
    expect(result[Planet.MARS]?.reason).toContain('Planetary war detected');
  });

  it('rejects war when separation is exactly 0 degrees', () => {
    const facts = createMockPlanetFacts({
      [Planet.MARS]: 100.0,
      [Planet.MERCURY]: 100.0
    });
    const result = calculateYuddhaBala(facts);

    const marsMercPair = result[Planet.MARS]?.pairs?.find(
      (p: any) => (p.planetA === Planet.MARS && p.planetB === Planet.MERCURY) ||
           (p.planetA === Planet.MERCURY && p.planetB === Planet.MARS)
    );

    expect(marsMercPair).toBeDefined();
    expect(marsMercPair!.isYuddha).toBe(false);
    expect(marsMercPair!.separation).toBe(0);
    expect(marsMercPair!.ruleId).toBe('YUDDHA_BALA_NO_WAR');
  });

  it('rejects war when separation is exactly 1.0 degree', () => {
    const facts = createMockPlanetFacts({
      [Planet.MARS]: 100.0,
      [Planet.MERCURY]: 101.0
    });
    const result = calculateYuddhaBala(facts);

    const marsMercPair = result[Planet.MARS]?.pairs?.find(
      (p: any) => (p.planetA === Planet.MARS && p.planetB === Planet.MERCURY) ||
           (p.planetA === Planet.MERCURY && p.planetB === Planet.MARS)
    );

    expect(marsMercPair).toBeDefined();
    expect(marsMercPair!.isYuddha).toBe(false);
    expect(marsMercPair!.separation).toBeCloseTo(1.0, 4);
    expect(marsMercPair!.ruleId).toBe('YUDDHA_BALA_NO_WAR');
  });

  it('correctly calculates short-arc separation across 360/0 degree boundary (359.5 vs 0.1)', () => {
    const facts = createMockPlanetFacts({
      [Planet.MARS]: 359.6,
      [Planet.MERCURY]: 0.1
    });
    const result = calculateYuddhaBala(facts);

    const marsMercPair = result[Planet.MARS]?.pairs?.find(
      (p: any) => (p.planetA === Planet.MARS && p.planetB === Planet.MERCURY) ||
           (p.planetA === Planet.MERCURY && p.planetB === Planet.MARS)
    );

    expect(marsMercPair).toBeDefined();
    expect(marsMercPair!.isYuddha).toBe(true);
    expect(marsMercPair!.separation).toBeCloseTo(0.5, 4);
    expect(marsMercPair!.ruleId).toBe('YUDDHA_BALA_001');
  });

  it('freezes returned data structures', () => {
    const facts = createMockPlanetFacts();
    const result = calculateYuddhaBala(facts);

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[Planet.MARS])).toBe(true);
    expect(Object.isFrozen(result[Planet.MARS]?.pairs)).toBe(true);
    if (result[Planet.MARS]?.pairs && result[Planet.MARS]!.pairs!.length > 0) {
      expect(Object.isFrozen(result[Planet.MARS]!.pairs![0])).toBe(true);
    }
  });
});
