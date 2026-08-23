import { BirthDetails, Planet } from '../../../types';

/**
 * Provenance source metadata for reference validation cases.
 */
export interface ReferenceSource {
  readonly name: string;
  readonly methodology: string;
  readonly zodiac: 'SIDEREAL' | 'TROPICAL';
  readonly ayanamsa: string; // e.g. 'LAHIRI'
  readonly timezone: string;
  readonly dateConvention: string;
  readonly version?: string;
  readonly url?: string;
}

/**
 * Astrological and astronomical conventions governing reference calculations.
 */
export interface ReferenceConventions {
  readonly zodiac: 'SIDEREAL' | 'TROPICAL' | string;
  readonly ayanamsa: 'LAHIRI' | 'RAMAN' | 'KRISHNAMURTI' | string;
  readonly timezone: string;
  readonly yearLength: number; // Standard astrological year length in days (365.25)
}

/**
 * Expected active dasha triple at a specific point in time.
 */
export interface ExpectedActiveDasha {
  readonly asOf: string;
  readonly mahadasha: Planet;
  readonly antardasha: Planet;
  readonly pratyantardasha: Planet;
}

/**
 * Authoritative reference fixture case contract for validating the Vimshottari dasha engine.
 */
export interface DashaReferenceCase {
  readonly id: string;
  readonly description: string;
  readonly birth: BirthDetails;
  readonly expectedMoonLongitude: number;
  readonly expectedNakshatra: string;
  readonly expectedNakshatraLord: Planet;
  readonly expectedNakshatraProgress: number;
  readonly expectedNakshatraRemaining: number;
  readonly expectedBirthDashaBalanceYears: number;
  readonly expectedMahadashaLord: Planet;
  readonly expectedMahadashaStart: string;
  readonly expectedMahadashaEnd: string;
  readonly expectedActiveDasha?: ExpectedActiveDasha;
  readonly source: ReferenceSource;
  readonly conventions: ReferenceConventions;
  readonly notes?: string;
  readonly isGoldenSelfBaseline?: boolean;
}

/**
 * Self-baseline / golden snapshot case contract (mirroring disclaimer in canonicalChart.ts).
 */
export interface GoldenBaselineCase {
  readonly id: string;
  readonly description: string;
  readonly birth: BirthDetails;
  readonly expectedMoonLongitude: number;
  readonly expectedNakshatra: string;
  readonly expectedNakshatraLord: Planet;
  readonly expectedBirthDashaBalanceYears: number;
  readonly disclaimer: string;
  readonly isGoldenSelfBaseline: true;
}
