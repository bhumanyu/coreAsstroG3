import type { Planet, NatalGrahaDrishti } from '../../../types';
import type { 
  DashaInterpretationEvidence,
  DashaYogaReference,
  InterpretationConfidence,
  DashaDirectionalSynthesis,
  DashaDomainSynthesis
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type {
  CareerDashaCanonicalEffect,
  CareerDashaCanonicalLevel
} from '../../../domain/career/careerDasha/careerDashaCanonicalTypes';
import type { ReasoningDirection } from '../../../domain/reasoning/reasoningTypes';
import type { CareerPlanetaryConditionAssessment } from '../../../domain/career/careerPlanetaryCondition';
 
export type DashaInterpretationStatus = 'AVAILABLE' | 'UNAVAILABLE';
 
export type DashaLevel = 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';

/**
 * Product-level diagnostics emitted when canonical C9 career dasha data
 * cannot be reconciled with the engine dasha interpretation for a period.
 */
export type DashaInterpretationDiagnosticCode =
  | 'C9_PERIOD_MISSING'
  | 'ENGINE_PERIOD_MISSING'
  | 'C9_PERIOD_PLANET_MISMATCH';

export interface DashaInterpretationDiagnostic {
  readonly code: DashaInterpretationDiagnosticCode;
  readonly level: CareerDashaCanonicalLevel;
  readonly activationPlanet?: Planet;
  readonly canonicalPlanet?: Planet;
}

export interface DashaPlanetStrengthProduct {
  readonly availability: string;
  readonly totalRupa?: number;
  readonly totalShastiamsa?: number;
  readonly percentageOfMinimum?: number;
  readonly meetsMinimum?: boolean;
  readonly shadbalaStatus?: string;
}

export interface CanonicalCareerActivationProduct {
  readonly level: CareerDashaCanonicalLevel;
  readonly planet?: Planet;
  readonly effect: CareerDashaCanonicalEffect;
  readonly direction: ReasoningDirection;
  readonly conditionAssessment?: CareerPlanetaryConditionAssessment;
  readonly afflictionAssessed?: boolean;
  readonly expressionEvidenceCount?: number;
  readonly evidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly statement: string;
  readonly start?: string;
  readonly end?: string;
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
  readonly canonicalCareerActivation?: CanonicalCareerActivationProduct;
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
  readonly diagnostics?: readonly DashaInterpretationDiagnostic[];
}
