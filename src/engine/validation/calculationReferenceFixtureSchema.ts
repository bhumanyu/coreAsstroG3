/**
 * Calculation Reference Fixture Schema (Gate 0 / RG-09)
 *
 * Types and pure builder helpers for authoring entries of the
 * `CalculationReferenceFixture` union declared in
 * `./calculationReferenceTypes.ts`.
 *
 * HARD CONSTRAINTS (see docs/career/audit/GATE-0-VALIDATION-PROTOCOL.md):
 * - This module contains NO expected values. Builders accept expected values
 *   as caller-supplied arguments; nothing here derives them from engine output.
 * - `CALCULATION_REFERENCE_FIXTURES` in `./calculationReferenceFixtures.ts`
 *   remains empty until independently produced, approved reference data exists.
 * - Missing data must stay UNAVAILABLE / NOT_PROVIDED; never fabricate.
 * - Engine output must never seed a reference fixture.
 *
 * Coverage contract enforced downstream by `inspectBoundaryCoverage`
 * (./calculationReferenceFixtures.ts):
 * - Boundary fixtures require EPSILON_BEFORE / EXACT / EPSILON_AFTER triplets
 *   per boundary kind (SIGN / NAKSHATRA / PADA).
 * - `provenance.expectedValuesProducedIndependently` must be `true`.
 * - `boundaryDefinition` identity must match `boundaryId`, `boundaryLongitude`,
 *   and the declared coordinate convention.
 * - Epsilon distances must fall inside `boundaryEpsilonDegrees` from
 *   docs/release/release-policy.json `calculationCoverage`.
 */

import type {
  BoundaryDefinition,
  BoundaryKind,
  BoundaryPosition,
  CalculationConventions,
  CalculationReferenceFixture,
  CalculationReferenceKind,
  HousePositionReference,
  NakshatraBoundaryReference,
  PlanetaryLongitudeReference,
  PlanetaryMotionReference,
  RahuKetuOppositionReference,
  ReferenceSource,
  SignBoundaryReference,
  VimshottariDashaReference,
  VargaLongitudeReference
} from './calculationReferenceTypes.ts';
import type {
  BirthDetails,
  ChartType,
  Nakshatra,
  Pada,
  Planet,
  Sign
} from '../../types.ts';

/* ------------------------------------------------------------------ */
/* Capture metadata                                                    */
/* ------------------------------------------------------------------ */

/**
 * Provenance of the raw capture that produced a fixture's expected values.
 * Extends the `ReferenceSource` contract with the machine-checkable capture
 * record required by the Gate 0 protocol.
 */
export interface ReferenceCaptureRecord {
  /** Stable identifier of the capture run (e.g. `CAPTURE-2026-11-20-001`). */
  readonly captureId: string;
  /** SHA-256 (lowercase hex) of the raw captured artifact bytes. */
  readonly sourceArtifactSha256: string;
  /** Reference implementation that produced the capture. */
  readonly referenceImplementation: string;
  /** Version string of the reference implementation. */
  readonly referenceImplementationVersion: string;
  /** Feature/configuration flags of the reference implementation, sorted. */
  readonly referenceFlags: readonly string[];
  /** Raw captured output, verbatim, unmodified. */
  readonly rawCapturedOutput: string;
  /** Engine commit SHA the fixture was validated against (informational). */
  readonly engineCommitSha: string;
}

/**
 * Observation context for a single birth instant. All three representations
 * of the instant must be mutually consistent; `utcInstant` is authoritative.
 */
export interface ObservationInstant {
  /** Authoritative instant as an ISO-8601 UTC timestamp. */
  readonly utcInstant: string;
  /** Local wall-clock representation exactly as recorded at the location. */
  readonly localRepresentation: string;
  /** IANA timezone identifier (e.g. `Asia/Kolkata`). */
  readonly ianaTimeZone: string;
}

/**
 * Birth observation site for fixture generation.
 */
export interface ObservationSite {
  readonly latitude: number;
  readonly longitude: number;
  readonly instant: ObservationInstant;
}

/**
 * Ephemeris convention flags describing how the reference capture was produced.
 */
export interface EphemerisConventions {
  /** `GEOCENTRIC` or `TOPOCENTRIC` (apparent place). */
  readonly positionConvention: 'GEOCENTRIC' | 'TOPOCENTRIC';
  /** `APPARENT` (light-time + aberration) or `ASTROMETRIC`. */
  readonly apparentConvention: 'APPARENT' | 'ASTROMETRIC';
  /** Node model, e.g. `MEAN` or `TRUE`. */
  readonly nodeConvention: 'MEAN' | 'TRUE';
}

/**
 * Extended provenance for fixture entries: the `ReferenceSource` contract
 * plus the capture record and observation context.
 */
export interface FixtureProvenance extends ReferenceSource {
  readonly capture: ReferenceCaptureRecord;
  readonly site: ObservationSite;
  readonly ephemeris: EphemerisConventions;
}

/* ------------------------------------------------------------------ */
/* Epsilon policy                                                      */
/* ------------------------------------------------------------------ */

/**
 * Boundary epsilon range required by the release policy.
 * Values must be read from `docs/release/release-policy.json`
 * `calculationCoverage.boundaryEpsilonDegrees`; this helper only validates
 * a candidate epsilon against a caller-supplied policy range.
 */
export function isEpsilonWithinPolicy(
  epsilonDegrees: number,
  policy: { readonly min: number; readonly max: number }
): boolean {
  return Number.isFinite(epsilonDegrees)
    && epsilonDegrees >= policy.min
    && epsilonDegrees <= policy.max;
}

/* ------------------------------------------------------------------ */
/* Boundary triplet helpers                                            */
/* ------------------------------------------------------------------ */

export interface BoundaryTripletSpec {
  readonly boundaryId: string;
  readonly boundaryKind: BoundaryKind;
  /** Boundary longitude on the grid; 0 <= longitude < 360, sidereal or tropical per convention. */
  readonly boundaryLongitude: number;
  readonly definition: BoundaryDefinition;
  /** Epsilon in degrees; must satisfy the release-policy range. */
  readonly epsilonDegrees: number;
}

/**
 * Computes the three input longitudes for a boundary triplet
 * (EPSILON_BEFORE / EXACT / EPSILON_AFTER) around a grid boundary.
 * Returns `null` when the epsilon is non-finite or non-positive so callers
 * cannot silently emit malformed fixtures.
 */
export function boundaryTripletLongitudes(
  spec: BoundaryTripletSpec
): Readonly<Record<BoundaryPosition, number>> | null {
  if (!Number.isFinite(spec.epsilonDegrees) || spec.epsilonDegrees <= 0) {
    return null;
  }
  const normalize = (value: number): number => ((value % 360) + 360) % 360;
  return Object.freeze({
    EPSILON_BEFORE: normalize(spec.boundaryLongitude - spec.epsilonDegrees),
    EXACT: normalize(spec.boundaryLongitude),
    EPSILON_AFTER: normalize(spec.boundaryLongitude + spec.epsilonDegrees)
  });
}

/* ------------------------------------------------------------------ */
/* Fixture builders                                                    */
/*
 * Each builder is a pure assembler: every expected value is supplied by the
 * caller from an approved independent source. Builders never compute,
 * interpolate, or default expected values.
 * ------------------------------------------------------------------ */

export interface PlanetaryLongitudeFixtureInput {
  readonly id: string;
  readonly entryPoint: 'generatePlanetaryPositions';
  readonly description: string;
  readonly birth: BirthDetails;
  readonly planet: Planet;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'> & {
    readonly ayanamsa: BirthDetails['ayanamsa'];
  };
  /** Independently produced expected longitude in degrees. */
  readonly expectedLongitudeDegrees: number;
  readonly toleranceDegrees: number;
}

export function buildPlanetaryLongitudeFixture(
  input: PlanetaryLongitudeFixtureInput
): PlanetaryLongitudeReference {
  return Object.freeze({
    id: input.id,
    kind: 'PLANETARY_LONGITUDE' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({ birth: input.birth, planet: input.planet }),
    provenance: input.provenance,
    conventions: input.conventions,
    expected: Object.freeze({
      degrees: input.expectedLongitudeDegrees,
      toleranceDegrees: input.toleranceDegrees
    })
  });
}

export interface PlanetaryMotionFixtureInput {
  readonly id: string;
  readonly entryPoint: 'generatePlanetaryPositions';
  readonly description: string;
  readonly birth: BirthDetails;
  readonly planet: Planet;
  readonly scenario: PlanetaryMotionReference['scenario'];
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'> & {
    readonly ayanamsa: BirthDetails['ayanamsa'];
  };
  /** Independently produced expected speed in degrees/day. */
  readonly expectedSpeedDegreesPerDay: number;
  readonly expectedRetrograde: boolean;
  readonly expectedStationary: boolean;
  readonly speedToleranceDegreesPerDay: number;
}

export function buildPlanetaryMotionFixture(
  input: PlanetaryMotionFixtureInput
): PlanetaryMotionReference {
  return Object.freeze({
    id: input.id,
    kind: 'PLANETARY_MOTION' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({ birth: input.birth, planet: input.planet }),
    scenario: input.scenario,
    provenance: input.provenance,
    conventions: input.conventions,
    expected: Object.freeze({
      speedDegreesPerDay: input.expectedSpeedDegreesPerDay,
      speedToleranceDegreesPerDay: input.speedToleranceDegreesPerDay,
      retrograde: input.expectedRetrograde,
      stationary: input.expectedStationary
    })
  });
}

export interface RahuKetuOppositionFixtureInput {
  readonly id: string;
  readonly entryPoint: 'generatePlanetaryPositions';
  readonly description: string;
  readonly birth: BirthDetails;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'> & {
    readonly ayanamsa: BirthDetails['ayanamsa'];
  };
  /** Tolerance for the 180-degree separation check, in degrees. */
  readonly toleranceDegrees: number;
}

export function buildRahuKetuOppositionFixture(
  input: RahuKetuOppositionFixtureInput
): RahuKetuOppositionReference {
  return Object.freeze({
    id: input.id,
    kind: 'RAHU_KETU_OPPOSITION' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({ birth: input.birth }),
    provenance: input.provenance,
    conventions: input.conventions,
    expected: Object.freeze({
      degrees: 180 as const,
      toleranceDegrees: input.toleranceDegrees
    })
  });
}

export interface SignBoundaryFixtureInput {
  readonly spec: BoundaryTripletSpec;
  readonly position: BoundaryPosition;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'>;
  /** Independently produced expected sign at this input longitude. */
  readonly expectedSign: Sign;
}

export function buildSignBoundaryFixture(
  input: SignBoundaryFixtureInput
): SignBoundaryReference {
  const longitudes = boundaryTripletLongitudes(input.spec);
  if (!longitudes) {
    throw new RangeError(
      `boundaryTripletLongitudes returned null for ${input.spec.boundaryId}: invalid epsilon`
    );
  }
  return Object.freeze({
    id: `${input.spec.boundaryId}:${input.position}`,
    kind: 'SIGN_BOUNDARY' satisfies CalculationReferenceKind,
    entryPoint: 'calculateSign',
    description: `Sign boundary ${input.spec.boundaryId} at ${input.position}`,
    input: Object.freeze({ longitude: longitudes[input.position] }),
    provenance: Object.freeze({
      ...input.provenance,
      expectedValuesProducedIndependently: true as const
    }),
    conventions: input.conventions,
    boundaryDefinition: input.spec.definition,
    boundaryLongitude: input.spec.boundaryLongitude,
    boundaryId: input.spec.boundaryId,
    boundaryPosition: input.position,
    expectedSign: input.expectedSign
  });
}

export interface NakshatraBoundaryFixtureInput {
  readonly spec: BoundaryTripletSpec;
  readonly boundaryKind: 'NAKSHATRA' | 'PADA';
  readonly position: BoundaryPosition;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'>;
  /** Independently produced expected values at this input longitude. */
  readonly expectedNakshatra: Nakshatra;
  readonly expectedPada: Pada;
}

export function buildNakshatraBoundaryFixture(
  input: NakshatraBoundaryFixtureInput
): NakshatraBoundaryReference {
  const longitudes = boundaryTripletLongitudes(input.spec);
  if (!longitudes) {
    throw new RangeError(
      `boundaryTripletLongitudes returned null for ${input.spec.boundaryId}: invalid epsilon`
    );
  }
  return Object.freeze({
    id: `${input.spec.boundaryId}:${input.position}`,
    kind: 'NAKSHATRA_BOUNDARY' satisfies CalculationReferenceKind,
    entryPoint: 'calculateNakshatra',
    description: `${input.boundaryKind} boundary ${input.spec.boundaryId} at ${input.position}`,
    input: Object.freeze({ longitude: longitudes[input.position] }),
    provenance: Object.freeze({
      ...input.provenance,
      expectedValuesProducedIndependently: true as const
    }),
    conventions: input.conventions,
    boundaryDefinition: input.spec.definition,
    boundaryKind: input.boundaryKind,
    boundaryLongitude: input.spec.boundaryLongitude,
    boundaryId: input.spec.boundaryId,
    boundaryPosition: input.position,
    expectedNakshatra: input.expectedNakshatra,
    expectedPada: input.expectedPada
  });
}

export interface HousePositionFixtureInput {
  readonly id: string;
  readonly entryPoint: 'calculateWholeSignHouse';
  readonly description: string;
  readonly referenceSign: Sign;
  readonly targetSign: Sign;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'>;
  /** Independently produced expected house number (1-12). */
  readonly expectedHouse: number;
}

export function buildHousePositionFixture(
  input: HousePositionFixtureInput
): HousePositionReference {
  return Object.freeze({
    id: input.id,
    kind: 'HOUSE_POSITION' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({
      referenceSign: input.referenceSign,
      targetSign: input.targetSign
    }),
    provenance: input.provenance,
    conventions: input.conventions,
    expectedHouse: input.expectedHouse
  });
}

export interface VargaLongitudeFixtureInput {
  readonly id: string;
  readonly entryPoint: 'getDivisionalLongitude';
  readonly description: string;
  readonly longitude: number;
  readonly chartType: ChartType;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'>;
  /** Independently produced expected divisional longitude in degrees. */
  readonly expectedLongitudeDegrees: number;
  readonly toleranceDegrees: number;
}

export function buildVargaLongitudeFixture(
  input: VargaLongitudeFixtureInput
): VargaLongitudeReference {
  return Object.freeze({
    id: input.id,
    kind: 'VARGA_LONGITUDE' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({
      longitude: input.longitude,
      chartType: input.chartType
    }),
    provenance: input.provenance,
    conventions: input.conventions,
    expected: Object.freeze({
      degrees: input.expectedLongitudeDegrees,
      toleranceDegrees: input.toleranceDegrees
    })
  });
}

export interface VimshottariDashaFixtureInput {
  readonly id: string;
  readonly entryPoint: 'calculateVimshottari';
  readonly description: string;
  readonly birthDateTime: string;
  /** Moon sidereal longitude locked from an approved independent source. */
  readonly moonSiderealLongitude: number;
  readonly until?: string;
  readonly provenance: FixtureProvenance;
  readonly conventions: CalculationConventions<'SIDEREAL'> & {
    readonly ayanamsa: BirthDetails['ayanamsa'];
    readonly yearLengthDays: number;
  };
  /** Independently produced expected Dasha anchor values. */
  readonly expected: {
    readonly nakshatra: string;
    readonly nakshatraLord: Planet;
    readonly nakshatraProgress: number;
    readonly remainingFraction: number;
    readonly firstMahadashaLord: Planet;
    readonly firstMahadashaStart: string;
    readonly firstMahadashaEnd: string;
  };
  readonly tolerance: {
    readonly fraction: number;
    readonly boundaryMilliseconds: number;
  };
}

export function buildVimshottariDashaFixture(
  input: VimshottariDashaFixtureInput
): VimshottariDashaReference {
  return Object.freeze({
    id: input.id,
    kind: 'VIMSHOTTARI_DASHA' satisfies CalculationReferenceKind,
    entryPoint: input.entryPoint,
    description: input.description,
    input: Object.freeze({
      birthDateTime: input.birthDateTime,
      moonSiderealLongitude: input.moonSiderealLongitude,
      ...(input.until !== undefined ? { until: input.until } : {})
    }),
    provenance: input.provenance,
    conventions: input.conventions,
    expected: input.expected,
    tolerance: input.tolerance
  });
}

/** Union of every fixture kind this schema can assemble. */
export type SchemaBackedCalculationReferenceFixture = CalculationReferenceFixture;
