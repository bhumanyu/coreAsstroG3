import { describe, expect, it } from 'vitest';
import {
  AyanamsaType,
  BirthDetails,
  ChartType,
  Nakshatra,
  Pada,
  Planet,
  Sign
} from '../../types';
import type { BoundaryDefinition } from './calculationReferenceTypes';
import {
  BoundaryTripletSpec,
  FixtureProvenance,
  ReferenceCaptureRecord,
  boundaryTripletLongitudes,
  buildHousePositionFixture,
  buildNakshatraBoundaryFixture,
  buildPlanetaryLongitudeFixture,
  buildRahuKetuOppositionFixture,
  buildSignBoundaryFixture,
  buildVargaLongitudeFixture,
  buildVimshottariDashaFixture
} from './calculationReferenceFixtureSchema';

const POLICY = Object.freeze({ min: 0.000001, max: 0.0001 });

function makeBirth(): BirthDetails {
  return Object.freeze({
    latitude: 19.076,
    longitude: 72.8777,
    timeZone: 'Asia/Kolkata',
    ayanamsa: AyanamsaType.LAHIRI,
    dateTimeStr: '1990-01-01T00:00:00.000Z'
  });
}

function makeCapture(overrides: Partial<ReferenceCaptureRecord> = {}): ReferenceCaptureRecord {
  return Object.freeze({
    captureId: 'CAPTURE-TEST-001',
    sourceArtifactSha256: 'a'.repeat(64),
    referenceImplementation: 'Swiss Ephemeris',
    referenceImplementationVersion: '2.10.03',
    referenceFlags: Object.freeze(['FLG_SIDEREAL', 'FLG_LAHIRI']),
    rawCapturedOutput: 'raw ephemeris line output',
    engineCommitSha: 'b704d146',
    ...overrides
  });
}

function makeProvenance(
  overrides: Partial<FixtureProvenance> = {}
): FixtureProvenance {
  return Object.freeze({
    sourceType: 'EXTERNAL_EPHEMERIS',
    sourceName: 'Swiss Ephemeris',
    citation: 'Test citation',
    sourceVersion: '2.10.03',
    methodology: 'Geocentric apparent longitudes',
    coordinateConvention: 'GEOCENTRIC_APPARENT',
    timeStandard: 'UTC',
    ayanamsa: 'LAHIRI',
    nodeConvention: 'MEAN',
    tolerance: 'see fixture',
    toleranceRationale: 'test',
    independenceStatement: 'Independently produced offline capture',
    independentlyProduced: true as const,
    retrievedAt: '2026-11-20T00:00:00.000Z',
    approvedBy: 'tester',
    approvedAt: '2026-11-20T00:00:00.000Z',
    capture: makeCapture(),
    site: Object.freeze({
      latitude: 19.076,
      longitude: 72.8777,
      instant: Object.freeze({
        utcInstant: '1990-01-01T00:00:00.000Z',
        localRepresentation: '1990-01-01 05:30:00 IST',
        ianaTimeZone: 'Asia/Kolkata'
      })
    }),
    ephemeris: Object.freeze({
      positionConvention: 'GEOCENTRIC' as const,
      apparentConvention: 'APPARENT' as const,
      nodeConvention: 'MEAN' as const
    }),
    expectedValuesProducedIndependently: true,
    ...overrides
  });
}

function makeDefinition(name: string, longitude: number): BoundaryDefinition {
  return Object.freeze({
    name,
    longitude,
    convention: Object.freeze({
      coordinateFrame: 'SIDEREAL' as const,
      ayanamsa: AyanamsaType.LAHIRI
    })
  });
}

function makeSpec(overrides: Partial<BoundaryTripletSpec> = {}): BoundaryTripletSpec {
  return Object.freeze({
    boundaryId: 'ARIES_0',
    boundaryKind: 'SIGN' as const,
    boundaryLongitude: 0,
    definition: makeDefinition('ARIES_0', 0),
    epsilonDegrees: 0.00005,
    policy: POLICY,
    ...overrides
  });
}

const SIDEREAL_CONVENTIONS = Object.freeze({
  coordinateFrame: 'SIDEREAL' as const,
  ayanamsa: AyanamsaType.LAHIRI,
  timeStandard: 'UTC'
});

describe('boundaryTripletLongitudes', () => {
  it('produces an ordered EPSILON_BEFORE/EXACT/EPSILON_AFTER triplet', () => {
    const result = boundaryTripletLongitudes(makeSpec({ boundaryLongitude: 30 }));
    expect(result.EXACT).toBe(30);
    expect(result.EPSILON_BEFORE).toBeCloseTo(30 - 0.00005, 10);
    expect(result.EPSILON_AFTER).toBeCloseTo(30 + 0.00005, 10);
  });

  it('wraps correctly at 0 degrees', () => {
    const result = boundaryTripletLongitudes(makeSpec({ boundaryLongitude: 0 }));
    expect(result.EXACT).toBe(0);
    expect(result.EPSILON_BEFORE).toBeCloseTo(360 - 0.00005, 10);
    expect(result.EPSILON_AFTER).toBeCloseTo(0.00005, 10);
  });

  it('wraps correctly just below 360 degrees', () => {
    const result = boundaryTripletLongitudes(
      makeSpec({ boundaryLongitude: 359.9999, epsilonDegrees: 0.0001 })
    );
    expect(result.EXACT).toBeCloseTo(359.9999, 10);
    expect(result.EPSILON_BEFORE).toBeCloseTo(359.9998, 10);
    // 359.9999 + 0.0001 = 360.0 wraps to 0.
    expect(result.EPSILON_AFTER).toBe(0);
  });

  it.each([Number.NaN, -0.001, 360, 720.5, Number.POSITIVE_INFINITY])(
    'rejects out-of-range boundaryLongitude %s',
    (boundaryLongitude) => {
      expect(() => boundaryTripletLongitudes(makeSpec({ boundaryLongitude })))
        .toThrow(RangeError);
      expect(() => boundaryTripletLongitudes(makeSpec({ boundaryLongitude })))
        .toThrow(/ARIES_0/);
    }
  );

  it.each([0, -0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects non-positive or non-finite epsilon %s',
    (epsilonDegrees) => {
      expect(() => boundaryTripletLongitudes(makeSpec({ epsilonDegrees })))
        .toThrow(RangeError);
    }
  );

  it('rejects epsilon below the policy minimum', () => {
    expect(() => boundaryTripletLongitudes(makeSpec({ epsilonDegrees: 0.0000005 })))
      .toThrow(RangeError);
  });

  it('rejects epsilon above the policy maximum', () => {
    expect(() => boundaryTripletLongitudes(makeSpec({ epsilonDegrees: 0.001 })))
      .toThrow(RangeError);
  });

  it('accepts epsilon at the policy boundaries', () => {
    expect(() => boundaryTripletLongitudes(makeSpec({ epsilonDegrees: POLICY.min })))
      .not.toThrow();
    expect(() => boundaryTripletLongitudes(makeSpec({ epsilonDegrees: POLICY.max })))
      .not.toThrow();
  });
});

describe('buildSignBoundaryFixture', () => {
  const baseInput = {
    spec: makeSpec(),
    position: 'EXACT' as const,
    provenance: makeProvenance(),
    conventions: SIDEREAL_CONVENTIONS,
    expectedSign: Sign.ARIES
  };

  it('constructs a valid SIGN_BOUNDARY fixture', () => {
    const fixture = buildSignBoundaryFixture(baseInput);
    expect(fixture.kind).toBe('SIGN_BOUNDARY');
    expect(fixture.boundaryId).toBe('ARIES_0');
    expect(fixture.boundaryPosition).toBe('EXACT');
    expect(fixture.input.longitude).toBe(0);
    expect(fixture.provenance.expectedValuesProducedIndependently).toBe(true);
    expect(Object.isFrozen(fixture)).toBe(true);
  });

  it('rejects a non-SIGN boundaryKind', () => {
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      spec: makeSpec({ boundaryKind: 'NAKSHATRA' })
    })).toThrow(TypeError);
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      spec: makeSpec({ boundaryKind: 'NAKSHATRA' })
    })).toThrow(/ARIES_0/);
  });

  it('rejects provenance without expectedValuesProducedIndependently', () => {
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({ expectedValuesProducedIndependently: false })
    })).toThrow(Error);
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({ expectedValuesProducedIndependently: undefined })
    })).toThrow(/expectedValuesProducedIndependently/);
  });

  it('rejects provenance with an unpopulated capture record', () => {
    const badCapture = { ...makeCapture(), captureId: '   ' };
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({ capture: badCapture })
    })).toThrow(/capture/);
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({
        capture: makeCapture({ sourceArtifactSha256: '' })
      })
    })).toThrow(/sourceArtifactSha256/);
    expect(() => buildSignBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({
        capture: makeCapture({ rawCapturedOutput: '' })
      })
    })).toThrow(/rawCapturedOutput/);
  });
});

describe('buildNakshatraBoundaryFixture', () => {
  const nakshatraSpec = makeSpec({
    boundaryId: 'BHARANI_0',
    boundaryKind: 'NAKSHATRA',
    boundaryLongitude: 13 + 20 / 60,
    definition: makeDefinition('BHARANI_0', 13 + 20 / 60)
  });
  const baseInput = {
    spec: nakshatraSpec,
    boundaryKind: 'NAKSHATRA' as const,
    position: 'EXACT' as const,
    provenance: makeProvenance(),
    conventions: SIDEREAL_CONVENTIONS,
    expectedNakshatra: Nakshatra.BHARANI,
    expectedPada: Pada.FIRST
  };

  it('constructs a valid NAKSHATRA_BOUNDARY fixture', () => {
    const fixture = buildNakshatraBoundaryFixture(baseInput);
    expect(fixture.kind).toBe('NAKSHATRA_BOUNDARY');
    expect(fixture.boundaryKind).toBe('NAKSHATRA');
    expect(fixture.expectedNakshatra).toBe(Nakshatra.BHARANI);
    expect(fixture.expectedPada).toBe(Pada.FIRST);
  });

  it('accepts PADA boundary kind when spec agrees', () => {
    const padaSpec = makeSpec({
      boundaryId: 'PADA_2',
      boundaryKind: 'PADA',
      boundaryLongitude: 10,
      definition: makeDefinition('PADA_2', 10)
    });
    const fixture = buildNakshatraBoundaryFixture({
      ...baseInput,
      spec: padaSpec,
      boundaryKind: 'PADA',
      expectedNakshatra: Nakshatra.ARDRA,
      expectedPada: Pada.SECOND
    });
    expect(fixture.boundaryKind).toBe('PADA');
  });

  it('rejects spec/input boundaryKind mismatch', () => {
    expect(() => buildNakshatraBoundaryFixture({
      ...baseInput,
      boundaryKind: 'PADA'
    })).toThrow(TypeError);
    expect(() => buildNakshatraBoundaryFixture({
      ...baseInput,
      spec: makeSpec({ boundaryKind: 'SIGN', boundaryId: 'BHARANI_0' })
    })).toThrow(/BHARANI_0/);
  });

  it('rejects provenance without the independence flag or capture', () => {
    expect(() => buildNakshatraBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({ expectedValuesProducedIndependently: false })
    })).toThrow(Error);
    expect(() => buildNakshatraBoundaryFixture({
      ...baseInput,
      provenance: makeProvenance({
        capture: makeCapture({ rawCapturedOutput: '' })
      })
    })).toThrow(Error);
  });
});

describe('buildPlanetaryLongitudeFixture', () => {
  const baseInput = {
    id: 'PL-TEST-001',
    entryPoint: 'generatePlanetaryPositions' as const,
    description: 'test',
    birth: makeBirth(),
    planet: Planet.SUN,
    provenance: makeProvenance(),
    conventions: SIDEREAL_CONVENTIONS,
    expectedLongitudeDegrees: 280.5,
    toleranceDegrees: 0.01
  };

  it('constructs a valid fixture', () => {
    const fixture = buildPlanetaryLongitudeFixture(baseInput);
    expect(fixture.kind).toBe('PLANETARY_LONGITUDE');
    expect(fixture.expected.degrees).toBe(280.5);
    expect(Object.isFrozen(fixture)).toBe(true);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects non-finite expected degrees %s',
    (expectedLongitudeDegrees) => {
      expect(() => buildPlanetaryLongitudeFixture({
        ...baseInput,
        expectedLongitudeDegrees
      })).toThrow(RangeError);
    }
  );

  it.each([0, -0.1, Number.NaN])(
    'rejects non-positive tolerance %s',
    (toleranceDegrees) => {
      expect(() => buildPlanetaryLongitudeFixture({
        ...baseInput,
        toleranceDegrees
      })).toThrow(RangeError);
    }
  );
});

describe('buildRahuKetuOppositionFixture', () => {
  it('constructs a valid fixture', () => {
    const fixture = buildRahuKetuOppositionFixture({
      id: 'RK-TEST-001',
      entryPoint: 'generatePlanetaryPositions',
      description: 'node opposition',
      birth: makeBirth(),
      provenance: makeProvenance(),
      conventions: SIDEREAL_CONVENTIONS,
      toleranceDegrees: 0.005
    });
    expect(fixture.kind).toBe('RAHU_KETU_OPPOSITION');
    expect(fixture.expected.degrees).toBe(180);
  });
});

describe('buildHousePositionFixture', () => {
  const baseInput = {
    id: 'HP-TEST-001',
    entryPoint: 'calculateWholeSignHouse' as const,
    description: 'test',
    referenceSign: Sign.ARIES,
    targetSign: Sign.CANCER,
    provenance: makeProvenance(),
    conventions: SIDEREAL_CONVENTIONS,
    expectedHouse: 4
  };

  it('constructs a valid fixture', () => {
    const fixture = buildHousePositionFixture(baseInput);
    expect(fixture.kind).toBe('HOUSE_POSITION');
    expect(fixture.expectedHouse).toBe(4);
  });

  it.each([0, 13, 1.5, Number.NaN])(
    'rejects invalid expectedHouse %s',
    (expectedHouse) => {
      expect(() => buildHousePositionFixture({
        ...baseInput,
        expectedHouse
      })).toThrow(RangeError);
    }
  );
});

describe('buildVargaLongitudeFixture', () => {
  const baseInput = {
    id: 'VG-TEST-001',
    entryPoint: 'getDivisionalLongitude' as const,
    description: 'test',
    longitude: 280.5,
    chartType: ChartType.D9,
    provenance: makeProvenance(),
    conventions: SIDEREAL_CONVENTIONS,
    expectedLongitudeDegrees: 102.25,
    toleranceDegrees: 0.01
  };

  it('constructs a valid fixture', () => {
    const fixture = buildVargaLongitudeFixture(baseInput);
    expect(fixture.kind).toBe('VARGA_LONGITUDE');
    expect(fixture.expected.degrees).toBe(102.25);
  });

  it.each([Number.NaN])(
    'rejects non-finite expected degrees %s',
    (expectedLongitudeDegrees) => {
      expect(() => buildVargaLongitudeFixture({
        ...baseInput,
        expectedLongitudeDegrees
      })).toThrow(RangeError);
    }
  );

  it.each([0, -0.01])(
    'rejects non-positive tolerance %s',
    (toleranceDegrees) => {
      expect(() => buildVargaLongitudeFixture({
        ...baseInput,
        toleranceDegrees
      })).toThrow(RangeError);
    }
  );
});

describe('buildVimshottariDashaFixture', () => {
  const baseInput = {
    id: 'VD-TEST-001',
    entryPoint: 'calculateVimshottari' as const,
    description: 'test',
    birthDateTime: '1990-01-01T00:00:00.000Z',
    moonSiderealLongitude: 280.5,
    provenance: makeProvenance(),
    conventions: Object.freeze({
      ...SIDEREAL_CONVENTIONS,
      yearLengthDays: 365.2425
    }),
    expected: Object.freeze({
      nakshatra: 'SHRAVANA',
      nakshatraLord: Planet.SATURN,
      nakshatraProgress: 0.5,
      remainingFraction: 0.5,
      firstMahadashaLord: Planet.SATURN,
      firstMahadashaStart: '1990-01-01T00:00:00.000Z',
      firstMahadashaEnd: '2009-01-01T00:00:00.000Z'
    }),
    tolerance: Object.freeze({
      fraction: 0.001,
      boundaryMilliseconds: 1000
    })
  };

  it('constructs a valid fixture', () => {
    const fixture = buildVimshottariDashaFixture(baseInput);
    expect(fixture.kind).toBe('VIMSHOTTARI_DASHA');
    expect(fixture.input.moonSiderealLongitude).toBe(280.5);
  });

  it.each([Number.NaN, -0.001, 360, 720])(
    'rejects out-of-range moonSiderealLongitude %s',
    (moonSiderealLongitude) => {
      expect(() => buildVimshottariDashaFixture({
        ...baseInput,
        moonSiderealLongitude
      })).toThrow(RangeError);
    }
  );

  it('accepts moonSiderealLongitude at 0', () => {
    expect(() => buildVimshottariDashaFixture({
      ...baseInput,
      moonSiderealLongitude: 0
    })).not.toThrow();
  });

  it.each([
    { fraction: -0.1, boundaryMilliseconds: 1000 },
    { fraction: 0.001, boundaryMilliseconds: -1 },
    { fraction: Number.NaN, boundaryMilliseconds: 1000 }
  ])('rejects negative or non-finite tolerances %j', (tolerance) => {
    expect(() => buildVimshottariDashaFixture({
      ...baseInput,
      tolerance: Object.freeze(tolerance)
    })).toThrow(RangeError);
  });
});

describe('freeze depth', () => {
  it('freezes the top-level fixture object (shallow freeze is the contract)', () => {
    const fixture = buildPlanetaryLongitudeFixture({
      id: 'PL-FREEZE-001',
      entryPoint: 'generatePlanetaryPositions',
      description: 'test',
      birth: makeBirth(),
      planet: Planet.MOON,
      provenance: makeProvenance(),
      conventions: SIDEREAL_CONVENTIONS,
      expectedLongitudeDegrees: 100,
      toleranceDegrees: 0.0001
    });
    expect(Object.isFrozen(fixture)).toBe(true);
    expect(Object.isFrozen(fixture.input)).toBe(true);
    expect(Object.isFrozen(fixture.expected)).toBe(true);
    // Shallow freeze only: nested provenance fields are not deep-frozen by builders.
    expect(Object.isFrozen(fixture.provenance)).toBe(true); // caller froze it; builder does not re-freeze
  });
});
