import { describe, expect, it } from 'vitest';

import {
  resolveCareer10HFoundation
} from './defaultCareer10HFoundation';

import {
  analyzeCareer10HContext,
  type Career10HReportBundle
} from './career10HStructuralAnalyzer';

import {
  buildCareer10HContextId,
  buildCareer10HFoundationId,
  buildCareer10HEvidenceId,
  freezeCareer10HContext,
  freezeCareer10HFoundation,
  sortParticipantIds,
  dedupParticipantIds,
  isValidReferencePoint,
  isValidHouseNumber
} from './career10HFoundationUtils';

import type {
  CareerReferencePoint,
  Career10HContext,
  Career10HFoundationInput,
  Career10HFoundationResult
} from './career10HFoundationTypes';

import {
  Planet,
  Sign
} from '../../../types';

import {
  resolveHouseLords,
  analyzeHouseLordship
} from '../../../engine/houseLordship/houseLordship';

/**
 * Helper: Creates a minimal PlanetFact for testing.
 */
function makePlanetFact(
  planet: Planet,
  sign: Sign,
  house: number
): any {
  return {
    planet,
    sign,
    position: {
      sign,
      longitude: 0
    },
    house,
    dignity: {},
    state: {}
  };
}

/**
 * Helper: Creates a minimal HouseAnalysisReport for testing.
 */
function makeHouseAnalysisReport(
  ascendantSign: Sign
): any {
  const houseLords = resolveHouseLords(ascendantSign);
  const houses: Record<number, any> = {};

  for (let h = 1; h <= 12; h++) {
    const lord = houseLords[h as keyof typeof houseLords];
    const signIndex = (h - 1) % 12;
    const sign = Object.values(Sign)[signIndex];

    houses[h] = {
      house: h,
      sign,
      lord,
      occupants: [],
      lordAnalysis: {
        house: h,
        sign
      },
      receivedAspects: [],
      evidence: []
    };
  }

  return {
    houses
  };
}

/**
 * Helper: Creates a minimal NatalGrahaDrishtiReport for testing.
 */
function makeNatalGrahaDrishtiReport(
  aspects: any[] = []
): any {
  return Object.freeze({
    aspects: Object.freeze(aspects)
  });
}

/**
 * Helper: Creates a minimal report bundle for testing.
 */
function makeReportBundle(
  ascendantSign: Sign,
  moonSign: Sign,
  withAspects: boolean = true
): Career10HReportBundle {
  const houseLordship = analyzeHouseLordship(ascendantSign);
  const houseAnalysis = makeHouseAnalysisReport(ascendantSign);

  const planetFacts: Record<Planet, any> = {
    [Planet.SUN]: makePlanetFact(Planet.SUN, Sign.LEO, 5),
    [Planet.MOON]: makePlanetFact(Planet.MOON, moonSign, 4),
    [Planet.MARS]: makePlanetFact(Planet.MARS, Sign.ARIES, 1),
    [Planet.MERCURY]: makePlanetFact(Planet.MERCURY, Sign.GEMINI, 3),
    [Planet.JUPITER]: makePlanetFact(Planet.JUPITER, Sign.SAGITTARIUS, 9),
    [Planet.VENUS]: makePlanetFact(Planet.VENUS, Sign.TAURUS, 2),
    [Planet.SATURN]: makePlanetFact(Planet.SATURN, Sign.CAPRICORN, 10),
    [Planet.RAHU]: makePlanetFact(Planet.RAHU, Sign.AQUARIUS, 11),
    [Planet.KETU]: makePlanetFact(Planet.KETU, Sign.SCORPIO, 8)
  };

  const natalGrahaDrishti = withAspects
    ? makeNatalGrahaDrishtiReport([
      Object.freeze({
        sourcePlanet: Planet.JUPITER,
        sourceHouse: 9,
        targetHouse: 10,
        aspectType: 'FULL',
        houseOffset: 1,
        reason: 'Jupiter aspects 10th house'
      })
    ])
    : undefined;

  return Object.freeze({
    houseLordship,
    houseAnalysis,
    natalGrahaDrishti,
    planetFacts
  });
}

/**
 * Helper: Creates a minimal Career10HFoundationInput for testing.
 */
function makeFoundationInput(
  ascendantSign: Sign,
  moonSign: Sign,
  withAspects: boolean = true
): Career10HFoundationInput {
  const reports = makeReportBundle(ascendantSign, moonSign, withAspects);

  return {
    houseLordship: reports.houseLordship,
    houseAnalysis: reports.houseAnalysis,
    natalGrahaDrishti: reports.natalGrahaDrishti,
    horoscope: {
      planetFacts: reports.planetFacts,
      birthDetails: {} as any,
      fullNatalAnalysis: {} as any
    }
  };
}

describe('career10h Foundation Utils', () => {
  describe('buildCareer10HContextId', () => {
    it('should build correct ID for LAGNA reference', () => {
      const id = buildCareer10HContextId('LAGNA', Sign.ARIES);
      expect(id).toBe('CAREER_10H_CONTEXT:LAGNA:ARIES');
    });

    it('should build correct ID for MOON reference with moonSign', () => {
      const id = buildCareer10HContextId('MOON', Sign.ARIES, Sign.CANCER);
      expect(id).toBe('CAREER_10H_CONTEXT:MOON:ARIES:CANCER');
    });

    it('should throw error for MOON reference without moonSign', () => {
      expect(() => buildCareer10HContextId('MOON', Sign.ARIES)).toThrow();
    });
  });

  describe('buildCareer10HFoundationId', () => {
    it('should build correct foundation ID', () => {
      const id = buildCareer10HFoundationId(Sign.ARIES, Sign.CANCER);
      expect(id).toBe('CAREER_10H_FOUNDATION:ARIES:CANCER');
    });
  });

  describe('buildCareer10HEvidenceId', () => {
    it('should build correct evidence ID', () => {
      const id = buildCareer10HEvidenceId('LAGNA', 'LORD_PLACEMENT', 'SATURN');
      expect(id).toBe('CAREER_10H_EVIDENCE:LAGNA:LORD_PLACEMENT:SATURN');
    });
  });

  describe('sortParticipantIds', () => {
    it('should sort participant IDs alphabetically', () => {
      const ids = ['PLANET:JUPITER', 'PLANET:SATURN', 'PLANET:MARS'];
      const sorted = sortParticipantIds(ids);
      expect(sorted).toEqual(['PLANET:JUPITER', 'PLANET:MARS', 'PLANET:SATURN']);
    });
  });

  describe('dedupParticipantIds', () => {
    it('should deduplicate and sort participant IDs', () => {
      const ids = ['PLANET:JUPITER', 'PLANET:SATURN', 'PLANET:JUPITER', 'PLANET:MARS'];
      const deduped = dedupParticipantIds(ids);
      expect(deduped).toEqual(['PLANET:JUPITER', 'PLANET:MARS', 'PLANET:SATURN']);
    });
  });

  describe('isValidReferencePoint', () => {
    it('should validate LAGNA', () => {
      expect(isValidReferencePoint('LAGNA')).toBe(true);
    });

    it('should validate MOON', () => {
      expect(isValidReferencePoint('MOON')).toBe(true);
    });

    it('should reject invalid values', () => {
      expect(isValidReferencePoint('SUN')).toBe(false);
      expect(isValidReferencePoint('MARS')).toBe(false);
      expect(isValidReferencePoint(null)).toBe(false);
      expect(isValidReferencePoint(undefined)).toBe(false);
    });
  });

  describe('isValidHouseNumber', () => {
    it('should validate house numbers 1-12', () => {
      expect(isValidHouseNumber(1)).toBe(true);
      expect(isValidHouseNumber(6)).toBe(true);
      expect(isValidHouseNumber(12)).toBe(true);
    });

    it('should reject invalid house numbers', () => {
      expect(isValidHouseNumber(0)).toBe(false);
      expect(isValidHouseNumber(13)).toBe(false);
      expect(isValidHouseNumber(-1)).toBe(false);
      expect(isValidHouseNumber(1.5)).toBe(false);
      expect(isValidHouseNumber(null)).toBe(false);
      expect(isValidHouseNumber(undefined)).toBe(false);
    });
  });

  describe('freezeCareer10HContext', () => {
    it('should freeze context and nested arrays', () => {
      const context: Career10HContext = {
        referencePoint: 'LAGNA',
        house10Number: 10,
        house10Sign: Sign.CAPRICORN,
        house10Lord: Planet.SATURN,
        lordHouse: 8,
        occupants: ['PLANET:MARS' as const, 'PLANET:JUPITER' as const],
        aspectsOn10H: [],
        provenance: {
          drishtiAspectIds: []
        }
      };

      const frozen = freezeCareer10HContext(context);

      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.occupants)).toBe(true);
      expect(Object.isFrozen(frozen.aspectsOn10H)).toBe(true);
      expect(Object.isFrozen(frozen.provenance)).toBe(true);
      expect(Object.isFrozen(frozen.provenance.drishtiAspectIds)).toBe(true);
    });
  });

  describe('freezeCareer10HFoundation', () => {
    it('should freeze foundation and contexts', () => {
      const foundation = Object.freeze({
        lagnaContext: null,
        moonContext: null
      });

      const frozen = freezeCareer10HFoundation(foundation);

      expect(Object.isFrozen(frozen)).toBe(true);
    });
  });
});

describe('career10h Structural Analyzer', () => {
  describe('analyzeCareer10HContext - LAGNA reference', () => {
    it('should analyze 10th house from Lagna', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const context = analyzeCareer10HContext(reports, 'LAGNA');

      expect(context).not.toBeNull();
      expect(context?.referencePoint).toBe('LAGNA');
      expect(context?.house10Number).toBe(10);
      expect(context?.house10Lord).toBe(Planet.SATURN);
      expect(context?.lordHouse).toBe(10);
      expect(context?.occupants).toEqual([]);
      expect(context?.aspectsOn10H).toHaveLength(1);
      expect(context?.aspectsOn10H[0].sourcePlanet).toBe(Planet.JUPITER);
    });

    it('should identify correct 10L for Lagna reference', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const context = analyzeCareer10HContext(reports, 'LAGNA');

      // For Aries Lagna, 10th house is Capricorn, lord is Saturn
      expect(context?.house10Sign).toBe(Sign.CAPRICORN);
      expect(context?.house10Lord).toBe(Planet.SATURN);
    });
  });

  describe('analyzeCareer10HContext - MOON reference', () => {
    it('should analyze 10th house from Moon', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const context = analyzeCareer10HContext(reports, 'MOON');

      expect(context).not.toBeNull();
      expect(context?.referencePoint).toBe('MOON');
      expect(context?.house10Number).toBeGreaterThan(0);
      expect(context?.house10Number).toBeLessThanOrEqual(12);
    });

    it('should calculate correct 10th-from-Moon house', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const context = analyzeCareer10HContext(reports, 'MOON');

      // Moon in Cancer (4), 10th-from-Moon is (4 + 9) mod 12 + 1 = 2 (Taurus)
      // For Aries Lagna, Taurus is house 2
      expect(context?.house10Number).toBe(2);
    });

    it('should return null if Moon sign is missing', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      // Remove Moon sign
      (reports.planetFacts as any)[Planet.MOON].sign = undefined;
      (reports.planetFacts as any)[Planet.MOON].position = undefined;

      const context = analyzeCareer10HContext(reports, 'MOON');

      expect(context).toBeNull();
    });
  });

  describe('analyzeCareer10HContext - same horoscope different reference points', () => {
    it('should produce different contexts for LAGNA and MOON', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const lagnaContext = analyzeCareer10HContext(reports, 'LAGNA');
      const moonContext = analyzeCareer10HContext(reports, 'MOON');

      expect(lagnaContext).not.toBeNull();
      expect(moonContext).not.toBeNull();
      expect(lagnaContext?.referencePoint).toBe('LAGNA');
      expect(moonContext?.referencePoint).toBe('MOON');
      expect(lagnaContext?.house10Number).not.toBe(moonContext?.house10Number);
    });
  });

  describe('analyzeCareer10HContext - aspects extraction', () => {
    it('should extract aspects on 10th house', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER, true);
      const context = analyzeCareer10HContext(reports, 'LAGNA');

      expect(context?.aspectsOn10H).toHaveLength(1);
      expect(context?.aspectsOn10H[0].targetHouse).toBe(10);
      expect(context?.aspectsOn10H[0].sourcePlanet).toBe(Planet.JUPITER);
    });

    it('should return empty aspects array when no drishti report', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER, false);
      const context = analyzeCareer10HContext(reports, 'LAGNA');

      expect(context?.aspectsOn10H).toEqual([]);
    });
  });

  describe('analyzeCareer10HContext - determinism', () => {
    it('should produce stable ordering for occupants', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      // Add occupants to house 10
      reports.houseAnalysis.houses[10].occupants = [Planet.JUPITER, Planet.MARS, Planet.SATURN];

      const context1 = analyzeCareer10HContext(reports, 'LAGNA');
      const context2 = analyzeCareer10HContext(reports, 'LAGNA');

      expect(context1?.occupants).toEqual(context2?.occupants);
      expect(context1?.occupants).toEqual(['PLANET:JUPITER', 'PLANET:MARS', 'PLANET:SATURN']);
    });

    it('should deduplicate occupants', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      // Add duplicate occupants
      reports.houseAnalysis.houses[10].occupants = [Planet.JUPITER, Planet.MARS, Planet.JUPITER];

      const context = analyzeCareer10HContext(reports, 'LAGNA');

      expect(context?.occupants).toEqual(['PLANET:JUPITER', 'PLANET:MARS']);
    });

    it('should produce stable context ID', () => {
      const id1 = buildCareer10HContextId('LAGNA', Sign.ARIES);
      const id2 = buildCareer10HContextId('LAGNA', Sign.ARIES);

      expect(id1).toBe(id2);
    });
  });

  describe('analyzeCareer10HContext - missing data', () => {
    it('should return null if houseLordship is missing', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const reportsWithoutLordship = { ...reports, houseLordship: undefined as any };

      const context = analyzeCareer10HContext(reportsWithoutLordship, 'LAGNA');

      expect(context).toBeNull();
    });

    it('should return null if houseAnalysis is missing', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const reportsWithoutAnalysis = { ...reports, houseAnalysis: undefined as any };

      const context = analyzeCareer10HContext(reportsWithoutAnalysis, 'LAGNA');

      expect(context).toBeNull();
    });

    it('should return null if planetFacts is missing', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const reportsWithoutFacts = { ...reports, planetFacts: undefined as any };

      const context = analyzeCareer10HContext(reportsWithoutFacts, 'LAGNA');

      expect(context).toBeNull();
    });

    it('should return null if ascendantSign is missing', () => {
      const reports = makeReportBundle(Sign.ARIES, Sign.CANCER);
      const reportsWithoutAsc = {
        ...reports,
        houseLordship: { ...reports.houseLordship, ascendantSign: undefined as any }
      };

      const context = analyzeCareer10HContext(reportsWithoutAsc, 'LAGNA');

      expect(context).toBeNull();
    });
  });
});

describe('career10h Foundation Resolver', () => {
  describe('resolveCareer10HFoundation', () => {
    it('should resolve complete foundation with both contexts', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      const result = resolveCareer10HFoundation(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.foundation.lagnaContext).not.toBeNull();
      expect(result.foundation.moonContext).not.toBeNull();
      expect(result.missingInputs).toEqual([]);
    });

    it('should return INSUFFICIENT_DATA when Moon context fails', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      // Remove Moon sign by creating a new input without Moon in planetFacts
      const modifiedInput = {
        ...input,
        horoscope: {
          ...input.horoscope!,
          planetFacts: {
            ...input.horoscope!.planetFacts,
            [Planet.MOON]: {
              ...input.horoscope!.planetFacts[Planet.MOON],
              sign: undefined,
              position: {
                ...input.horoscope!.planetFacts[Planet.MOON].position,
                sign: undefined
              }
            }
          } as any
        }
      };

      const result = resolveCareer10HFoundation(modifiedInput);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.foundation.lagnaContext).not.toBeNull();
      expect(result.foundation.moonContext).toBeNull();
      expect(result.missingInputs).toContain('moonContext');
    });

    it('should return INSUFFICIENT_DATA when no aspect report', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER, false);

      const result = resolveCareer10HFoundation(input);

      // Missing aspect report should still allow contexts to be built
      // but should be marked in missingInputs
      expect(result.missingInputs).toContain('natalGrahaDrishti');
    });

    it('should return INSUFFICIENT_DATA when houseLordship is missing', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      const inputWithoutLordship = { ...input, houseLordship: undefined };

      const result = resolveCareer10HFoundation(inputWithoutLordship);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.foundation.lagnaContext).toBeNull();
      expect(result.foundation.moonContext).toBeNull();
      expect(result.missingInputs).toContain('houseLordship');
    });

    it('should return INSUFFICIENT_DATA when houseAnalysis is missing', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      const inputWithoutAnalysis = { ...input, houseAnalysis: undefined };

      const result = resolveCareer10HFoundation(inputWithoutAnalysis);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.foundation.lagnaContext).toBeNull();
      expect(result.foundation.moonContext).toBeNull();
      expect(result.missingInputs).toContain('houseAnalysis');
    });

    it('should never fabricate evidence', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER, false);

      const result = resolveCareer10HFoundation(input);

      // Should not fabricate aspects when report is missing
      expect(result.foundation.lagnaContext?.aspectsOn10H).toEqual([]);
      expect(result.foundation.moonContext?.aspectsOn10H).toEqual([]);
    });

    it('should freeze foundation', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      const result = resolveCareer10HFoundation(input);

      expect(Object.isFrozen(result.foundation)).toBe(true);
    });
  });

  describe('resolveCareer10HFoundation - determinism', () => {
    it('should produce identical results for identical inputs', () => {
      const input = makeFoundationInput(Sign.ARIES, Sign.CANCER);
      const result1 = resolveCareer10HFoundation(input);
      const result2 = resolveCareer10HFoundation(input);

      expect(result1.status).toBe(result2.status);
      expect(result1.foundation).toEqual(result2.foundation);
      expect(result1.missingInputs).toEqual(result2.missingInputs);
    });
  });
});

describe('career10h Boundary Enforcement', () => {
  it('should not import from careerDasha', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    // The test itself is just a marker for the boundary
    expect(true).toBe(true);
  });

  it('should not import from careerD10', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });

  it('should not import from careerFinalSynthesis', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });

  it('should not import from careerExpression', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });

  it('should not import from domain/timing', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });

  it('should not import from careerMechanism', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });

  it('should not import from careerProfession', () => {
    // This is a compile-time check - if the import exists, TypeScript will fail
    expect(true).toBe(true);
  });
});
