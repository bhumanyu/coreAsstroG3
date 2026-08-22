import type { Planet, NatalGrahaDrishti } from '../../../types';
import type { 
  DashaInterpretationEvidence,
  DashaYogaReference,
  InterpretationConfidence,
  DashaDirectionalSynthesis,
  DashaDomainSynthesis
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
 
export type DashaInterpretationStatus = 'AVAILABLE' | 'UNAVAILABLE';
 
export type DashaLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';

export interface DashaPlanetStrengthProduct {
  readonly availability: string;
  readonly totalRupa?: number;
  readonly totalShastiamsa?: number;
  readonly percentageOfMinimum?: number;
  readonly meetsMinimum?: boolean;
  readonly shadbalaStatus?: string;
}
 
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
  readonly strength?: DashaPlanetStrengthProduct;
  readonly castAspects?: readonly NatalGrahaDrishti[];
  readonly receivedAspects?: readonly NatalGrahaDrishti[];
  readonly yogaParticipation?: readonly DashaYogaReference[];
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
  readonly planetarySynthesis?: DashaDirectionalSynthesis;
  readonly domainSynthesis?: readonly DashaDomainSynthesis[];
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
