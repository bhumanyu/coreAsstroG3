import type {
  AyanamsaType,
  BirthDetails,
  ChartType,
  Nakshatra,
  Pada,
  Planet,
  Sign
} from '../../types.ts';

/**
 * Calculation-level references are accepted only when their expected values
 * come from an independently produced source and have been explicitly approved.
 * Engine snapshots and values copied from the implementation are not references.
 */
export type CalculationReferenceKind =
  | 'PLANETARY_LONGITUDE'
  | 'PLANETARY_MOTION'
  | 'RAHU_KETU_OPPOSITION'
  | 'SIGN_BOUNDARY'
  | 'NAKSHATRA_BOUNDARY'
  | 'HOUSE_POSITION'
  | 'VARGA_LONGITUDE'
  | 'VIMSHOTTARI_DASHA';

export interface ReferenceSource {
  readonly sourceType: 'EXTERNAL_EPHEMERIS' | 'PUBLISHED_REFERENCE' | 'INDEPENDENT_CALCULATION';
  readonly sourceName: string;
  readonly citation: string;
  readonly sourceVersion: string;
  readonly methodology: string;
  readonly independentlyProduced: true;
  readonly retrievedAt: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
}

export type CalculationReferenceProvenance = ReferenceSource;

export interface CalculationConventions<
  Frame extends 'TROPICAL' | 'SIDEREAL' = 'TROPICAL' | 'SIDEREAL'
> {
  readonly coordinateFrame: Frame;
  readonly ayanamsa: AyanamsaType | null;
  readonly timeStandard: string;
  readonly yearLengthDays?: number;
}

export interface AngularExpectation {
  readonly degrees: number;
  readonly toleranceDegrees: number;
}

export interface CalculationReferenceBase<
  Kind extends CalculationReferenceKind,
  EntryPoint extends string,
  Input
> {
  readonly id: string;
  readonly kind: Kind;
  readonly entryPoint: EntryPoint;
  readonly description: string;
  readonly input: Input;
  readonly provenance: ReferenceSource;
  readonly conventions: CalculationConventions;
}

export interface SiderealPositionReferenceBase<
  Kind extends 'PLANETARY_LONGITUDE' | 'PLANETARY_MOTION',
  EntryPoint extends 'generatePlanetaryPositions',
  Expected
> extends CalculationReferenceBase<
    Kind,
    EntryPoint,
    { readonly birth: BirthDetails; readonly planet: Planet }
  > {
  readonly conventions: CalculationConventions<'SIDEREAL'> & { readonly ayanamsa: AyanamsaType };
  readonly expected: Expected;
}

export interface PlanetaryLongitudeReference extends SiderealPositionReferenceBase<
  'PLANETARY_LONGITUDE',
  'generatePlanetaryPositions',
  AngularExpectation
> {}

export interface PlanetaryMotionReference extends SiderealPositionReferenceBase<
  'PLANETARY_MOTION',
  'generatePlanetaryPositions',
  {
    readonly speedDegreesPerDay: number;
    readonly speedToleranceDegreesPerDay: number;
    readonly retrograde: boolean;
    readonly stationary: boolean;
  }
> {
  readonly scenario: 'PROGRADE' | 'RETROGRADE' | 'NEAR_STATIONARY';
}

export interface RahuKetuOppositionReference extends CalculationReferenceBase<
  'RAHU_KETU_OPPOSITION',
  'generatePlanetaryPositions',
  { readonly birth: BirthDetails }
> {
  readonly conventions: CalculationConventions<'SIDEREAL'> & { readonly ayanamsa: AyanamsaType };
  readonly expected: {
    readonly degrees: 180;
    readonly toleranceDegrees: number;
  } & AngularExpectation;
}

export type BoundaryPosition = 'EPSILON_BEFORE' | 'EXACT' | 'EPSILON_AFTER';
export type BoundaryKind = 'SIGN' | 'NAKSHATRA' | 'PADA';

export interface SignBoundaryReference extends CalculationReferenceBase<
  'SIGN_BOUNDARY',
  'calculateSign',
  { readonly longitude: number }
> {
  readonly boundaryId: string;
  readonly boundaryPosition: BoundaryPosition;
  readonly expectedSign: Sign;
}

export interface NakshatraBoundaryReference extends CalculationReferenceBase<
  'NAKSHATRA_BOUNDARY',
  'calculateNakshatra',
  { readonly longitude: number }
> {
  readonly boundaryKind: 'NAKSHATRA' | 'PADA';
  readonly boundaryId: string;
  readonly boundaryPosition: BoundaryPosition;
  readonly expectedNakshatra: Nakshatra;
  readonly expectedPada: Pada;
}

export interface HousePositionReference extends CalculationReferenceBase<
  'HOUSE_POSITION',
  'calculateWholeSignHouse',
  { readonly referenceSign: Sign; readonly targetSign: Sign }
> {
  readonly expectedHouse: number;
}

export interface VargaLongitudeReference extends CalculationReferenceBase<
  'VARGA_LONGITUDE',
  'getDivisionalLongitude',
  { readonly longitude: number; readonly chartType: ChartType }
> {
  readonly expected: AngularExpectation;
}

export interface VimshottariDashaReference extends CalculationReferenceBase<
  'VIMSHOTTARI_DASHA',
  'calculateVimshottari',
  {
    readonly birthDateTime: string;
    readonly moonSiderealLongitude: number;
    readonly until?: string;
  }
> {
  readonly conventions: CalculationConventions<'SIDEREAL'> & {
    readonly ayanamsa: AyanamsaType;
    readonly yearLengthDays: number;
  };
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

export type CalculationReferenceFixture =
  | PlanetaryLongitudeReference
  | PlanetaryMotionReference
  | RahuKetuOppositionReference
  | SignBoundaryReference
  | NakshatraBoundaryReference
  | HousePositionReference
  | VargaLongitudeReference
  | VimshottariDashaReference;

export type CalculationReferenceGateStatus = 'BLOCKED' | 'READY';

export interface CalculationReferenceGate {
  readonly id: 'RG-09';
  readonly status: CalculationReferenceGateStatus;
  readonly fixtureCount: number;
  readonly coverageComplete: boolean;
  readonly reason: string;
}
