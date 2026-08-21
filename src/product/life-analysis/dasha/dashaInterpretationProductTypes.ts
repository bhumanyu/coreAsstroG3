import type { Planet } from '../../../types';
import type { 
  ActiveDashaInterpretation, 
  DashaInterpretationEvidence,
  DashaPairInterpretation,
  DashaPlanetActivation,
  InterpretationConfidence
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
 
export type DashaInterpretationStatus = 'AVAILABLE' | 'UNAVAILABLE';
 
export type DashaLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
 
export interface DashaPlanetProduct {
  readonly planet: Planet;
  readonly level: DashaLevel;
  readonly start: string;
  readonly end: string;
  readonly placement: {
    readonly sign: string;
    readonly house: number;
  };
  readonly ownedHouses: readonly number[];
  readonly functionalRoles: readonly string[];
  readonly functionalNature?: string;
  readonly dignity?: string;
  readonly state?: string;
  readonly strength?: {
    readonly availability: string;
  };
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
}
 
export interface DashaPairProduct {
  readonly mahadashaLord: Planet;
  readonly antardashaLord: Planet;
  readonly sharedHouses: readonly number[];
  readonly combinedHouseSet: readonly number[];
  readonly relationshipEvidence: readonly DashaInterpretationEvidence[];
}
 
export interface DashaInterpretationProduct {
  readonly status: DashaInterpretationStatus;
  readonly mahadasha?: DashaPlanetProduct;
  readonly antardasha?: DashaPlanetProduct;
  readonly pratyantardasha?: DashaPlanetProduct;
  readonly pair?: DashaPairProduct;
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence?: InterpretationConfidence;
  readonly at?: string;
}
