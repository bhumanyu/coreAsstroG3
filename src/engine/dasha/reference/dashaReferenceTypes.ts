import { BirthDetails, Planet } from '../../../types';

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
 * Reference fixture case contract for validating the Vimshottari dasha engine.
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
  readonly source: string;
  readonly notes?: string;
}
