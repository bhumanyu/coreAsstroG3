import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  AyanamsaType,
  StrengthComponentStatus,
  PlanetFact
} from '../../types';

import {
  calculateCheshtaBala,
  calculateCheshtaBalaFromLongitudes,
  CheshtaMotionState
} from './cheshtaBala';

function createMockPlanetFacts(
  overrides: Partial<Record<Planet, Partial<{ longitude: number; retrograde: boolean; stationary: boolean }>>> = {}
): Record<Planet, PlanetFact> {
  const result: Partial<Record<Planet, PlanetFact>> = {};
  const defaultLongitudes: Record<Planet, number> = {
    [Planet.SUN]: 45.0,
    [Planet.MOON]: 120.0,
    [Planet.MARS]: 90.0,
    [Planet.MERCURY]: 50.0,
    [Planet.JUPITER]: 180.0,
    [Planet.VENUS]: 60.0,
    [Planet.SATURN]: 270.0,
    [Planet.RAHU]: 15.0,
    [Planet.KETU]: 195.0
  };

  for (const planet of Object.values(Planet)) {
    const ov = overrides[planet] || {};
    const long = ov.longitude ?? defaultLongitudes[planet];
    const isRetro = ov.retrograde ?? false;
    const isStat = ov.stationary ?? false;

    result[planet] = ({
      planet,
      position: {
        planet,
        eclipticLongitude: long,
        eclipticLatitude: 0,
        motion: {
          speed: isRetro ? -0.5 : 1.0,
          retrograde: isRetro,
          stationary: isStat
        }
      },
      sign: Sign.ARIES,
      signMetadata: {} as any,
      nakshatraResult: {} as any,
      nakshatraMetadata: {} as any,
      state: {
        planet,
        motion: {
          speed: isRetro ? -0.5 : 1.0,
          retrograde: isRetro,
          stationary: isStat
        },
        condition: {} as any
      },
      dignity: {} as any,
      house: 1
    }) as any;
  }

  return result as unknown as Record<Planet, PlanetFact>;
}

describe('cheshtaBala', () => {
  const testInstant = new Date('2023-01-01T12:00:00Z');
  const ayanamsa = AyanamsaType.LAHIRI;

  describe('calculateCheshtaBalaFromLongitudes', () => {
    it('shouldReturnZeroAtZeroCheshtaKendra', () => {
      const res = calculateCheshtaBalaFromLongitudes(100, 100, 100);
      expect(res.averageLongitude).toBe(100);
      expect(res.cheshtaKendra).toBe(0);
      expect(res.reducedCheshtaKendra).toBe(0);
      expect(res.value).toBe(0);
    });

    it('shouldReturnSixtyAt180DegreeCheshtaKendra', () => {
      const res = calculateCheshtaBalaFromLongitudes(100, 100, 280);
      expect(res.averageLongitude).toBe(100);
      expect(res.cheshtaKendra).toBe(180);
      expect(res.reducedCheshtaKendra).toBe(180);
      expect(res.value).toBe(60);
    });

    it('shouldReduceCheshtaKendraAbove180', () => {
      const res = calculateCheshtaBalaFromLongitudes(100, 100, 20);
      expect(res.averageLongitude).toBe(100);
      expect(res.cheshtaKendra).toBe(280);
      expect(res.reducedCheshtaKendra).toBe(80);
      expect(res.value).toBeCloseTo(26.67, 2);
    });

    it('shouldNormalizeCircularDifference', () => {
      // Wrap-around case: negative angle handling (10 - 350 = -340 -> 20 deg)
      const res1 = calculateCheshtaBalaFromLongitudes(350, 350, 10);
      expect(res1.averageLongitude).toBe(350);
      expect(res1.cheshtaKendra).toBe(20);
      expect(res1.reducedCheshtaKendra).toBe(20);
      expect(res1.value).toBeCloseTo(20 / 3, 4);

      // Over 180 circular wrap
      const res2 = calculateCheshtaBalaFromLongitudes(10, 10, 350);
      expect(res2.averageLongitude).toBe(10);
      expect(res2.cheshtaKendra).toBe(340);
      expect(res2.reducedCheshtaKendra).toBe(20);
      expect(res2.value).toBeCloseTo(20 / 3, 4);
    });
  });

  it('shouldCalculateCheshtaBalaForSunUsingAyanaBala', () => {
    const facts = createMockPlanetFacts();
    const result = calculateCheshtaBala(Planet.SUN, facts, testInstant, ayanamsa);

    expect(result.planet).toBe(Planet.SUN);
    expect(result.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(typeof result.value).toBe('number');
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(60);
    expect(result.motionState).toBe(CheshtaMotionState.NOT_APPLICABLE);
    expect(result.details?.ayanaBala).toBeDefined();
  });

  it('shouldCalculateCheshtaBalaForMoonUsingPakshaBala', () => {
    const facts = createMockPlanetFacts();
    const result = calculateCheshtaBala(Planet.MOON, facts, testInstant, ayanamsa);

    expect(result.planet).toBe(Planet.MOON);
    expect(result.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(typeof result.value).toBe('number');
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(60);
    expect(result.motionState).toBe(CheshtaMotionState.NOT_APPLICABLE);
    expect(result.details?.pakshaBala).toBeDefined();
    expect(result.details?.separation).toBeDefined();
  });

  it('shouldNotUseRetrogradeAsFixed60Shortcut', () => {
    // Direct verification: 90° kendra yields exactly 30 Bala regardless of motion state
    const kendra90 = calculateCheshtaBalaFromLongitudes(0, 0, 90);
    expect(kendra90.cheshtaKendra).toBe(90);
    expect(kendra90.reducedCheshtaKendra).toBe(90);
    expect(kendra90.value).toBe(30);

    // End-to-end check: retrograde motion state is recorded as evidence but value is computed mathematically
    const facts = createMockPlanetFacts({
      [Planet.MARS]: { retrograde: true }
    });

    const result = calculateCheshtaBala(Planet.MARS, facts, testInstant, ayanamsa);

    expect(result.planet).toBe(Planet.MARS);
    expect(result.status).toBe(StrengthComponentStatus.CALCULATED);
    expect(result.motionState).toBe(CheshtaMotionState.RETROGRADE);

    // Value must be strictly computed from Kendra / 3 and never overridden to fixed 60.0
    expect(typeof result.value).toBe('number');
    const expectedValue = Number((result.details!.reducedCheshtaKendra! / 3).toFixed(2));
    expect(result.value).toBe(expectedValue);
  });

  it('shouldCorrectlySetMotionStateEvidence', () => {
    const directFacts = createMockPlanetFacts({
      [Planet.JUPITER]: { retrograde: false, stationary: false }
    });
    const directResult = calculateCheshtaBala(Planet.JUPITER, directFacts, testInstant, ayanamsa);
    expect(directResult.motionState).toBe(CheshtaMotionState.DIRECT);

    const retroFacts = createMockPlanetFacts({
      [Planet.JUPITER]: { retrograde: true, stationary: false }
    });
    const retroResult = calculateCheshtaBala(Planet.JUPITER, retroFacts, testInstant, ayanamsa);
    expect(retroResult.motionState).toBe(CheshtaMotionState.RETROGRADE);

    const statFacts = createMockPlanetFacts({
      [Planet.JUPITER]: { retrograde: false, stationary: true }
    });
    const statResult = calculateCheshtaBala(Planet.JUPITER, statFacts, testInstant, ayanamsa);
    expect(statResult.motionState).toBe(CheshtaMotionState.STATIONARY);
  });

  it('shouldReturnNotImplementedForNodes', () => {
    const facts = createMockPlanetFacts();
    const rahuResult = calculateCheshtaBala(Planet.RAHU, facts, testInstant, ayanamsa);
    const ketuResult = calculateCheshtaBala(Planet.KETU, facts, testInstant, ayanamsa);

    expect(rahuResult.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
    expect(rahuResult.value).toBeUndefined();
    expect(rahuResult.motionState).toBe(CheshtaMotionState.NOT_APPLICABLE);

    expect(ketuResult.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
    expect(ketuResult.value).toBeUndefined();
    expect(ketuResult.motionState).toBe(CheshtaMotionState.NOT_APPLICABLE);
  });

  it('shouldReturnFrozenObjects', () => {
    const facts = createMockPlanetFacts();
    const result = calculateCheshtaBala(Planet.MARS, facts, testInstant, ayanamsa);

    expect(Object.isFrozen(result)).toBe(true);
    if (result.details) {
      expect(Object.isFrozen(result.details)).toBe(true);
    }
  });

  it('shouldNotMutateInputPlanetFacts', () => {
    const facts = createMockPlanetFacts();
    const originalFacts = structuredClone(facts);

    calculateCheshtaBala(Planet.SATURN, facts, testInstant, ayanamsa);

    expect(facts).toEqual(originalFacts);
  });

  it('shouldBeDeterministic', () => {
    const facts = createMockPlanetFacts();
    const res1 = calculateCheshtaBala(Planet.VENUS, facts, testInstant, ayanamsa);
    const res2 = calculateCheshtaBala(Planet.VENUS, facts, testInstant, ayanamsa);

    expect(res1).toEqual(res2);
  });

  it('shouldValidateInputsAndThrowOnInvalidData', () => {
    const facts = createMockPlanetFacts();

    expect(() => calculateCheshtaBala(Planet.MARS, null as unknown as Record<Planet, PlanetFact>, testInstant, ayanamsa)).toThrow();

    expect(() => calculateCheshtaBala(Planet.MARS, facts, new Date('invalid'), ayanamsa)).toThrow();

    const invalidFacts = createMockPlanetFacts({
      [Planet.MARS]: { longitude: NaN }
    });
    expect(() => calculateCheshtaBala(Planet.MARS, invalidFacts, testInstant, ayanamsa)).toThrow();
  });
});
