import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import type {
  CareerDashaActivationEffect,
  CareerDashaActivationDirection,
  CareerDashaActivationStrength
} from '../careerDasha';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type { Planet } from '../../types';

export type CareerD10QualificationEffect =
  | 'QUALIFIES'
  | 'WEAKENS'
  | 'REINFORCES'
  | 'CONFLICTS'
  | 'INSUFFICIENT_DATA'
  | 'UNAVAILABLE';

export type CareerD10QualificationDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNDETERMINED'
  | 'UNAVAILABLE';

export type CareerD10QualificationStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type CareerD10QualificationRole =
  | 'PRIMARY_DRIVER'
  | 'MODIFIER'
  | 'REFINEMENT'
  | 'TRIGGER';

export type CareerD10EvidenceRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'MODIFIER';

export type CareerD10HouseRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'CHALLENGING'
  | 'NEUTRAL';

export interface CareerD10HouseContext {
  readonly house: number;
  readonly role: CareerD10HouseRole;
  readonly occupied: boolean;
  readonly lord: Planet;
  readonly lordCondition: CareerPlanetaryCondition;
  readonly tenants: readonly Planet[];
  readonly tenantConditions: readonly CareerPlanetaryCondition[];
}

export interface CareerD10PlanetContext {
  readonly planet: Planet;
  readonly condition: CareerPlanetaryCondition;
  readonly d10House: number;
  readonly natalHouse: number;
  readonly relatedHouses: readonly number[];
}

export interface CareerD10Context {
  readonly natalDirection: CareerStructuralDirection;
  readonly natalStrength: CareerStructuralStrength;
  readonly natalPrimarySupport: number;
  readonly natalPrimaryChallenge: number;
  readonly dashaEffect?: CareerDashaActivationEffect;
  readonly dashaDirection?: CareerDashaActivationDirection;
  readonly dashaStrength?: CareerDashaActivationStrength;
  readonly d10Available: boolean;
  readonly d10Houses: readonly CareerD10HouseContext[];
  readonly d10Planets: readonly CareerD10PlanetContext[];
}

export interface CareerD10Evidence {
  readonly id: string;
  readonly role: CareerD10EvidenceRole;
  readonly direction: CareerD10QualificationDirection;
  readonly weight: number;
  readonly statement: string;
  readonly source?: string;
}

export interface CareerD10Qualification {
  readonly effect: CareerD10QualificationEffect;
  readonly direction: CareerD10QualificationDirection;
  readonly strength: CareerD10QualificationStrength;
  readonly evidence: readonly CareerD10Evidence[];
  readonly statement: string;
}

export interface CareerD10ExpressionQualification {
  readonly expressionId: string;
  readonly qualified: boolean;
  readonly effect: CareerD10QualificationEffect;
  readonly direction: CareerD10QualificationDirection;
  readonly strength: CareerD10QualificationStrength;
  readonly evidence: readonly CareerD10Evidence[];
  readonly statement: string;
}

export interface CareerD10QualificationResult {
  readonly natalDirection: CareerStructuralDirection;
  readonly natalStrength: CareerStructuralStrength;
  readonly dashaEffect: CareerDashaActivationEffect | 'UNAVAILABLE';
  readonly dashaDirection: CareerDashaActivationDirection | 'UNAVAILABLE';
  readonly d10Effect: CareerD10QualificationEffect;
  readonly d10Direction: CareerD10QualificationDirection;
  readonly d10Strength: CareerD10QualificationStrength;
  readonly qualifiedDirection: CareerD10QualificationDirection;
  readonly qualifiedStrength: CareerD10QualificationStrength;
  readonly natalPromisePreserved: boolean;
  readonly dashaPreserved: boolean;
  readonly evidence: readonly CareerD10Evidence[];
  readonly expressionQualifications: readonly CareerD10ExpressionQualification[];
  readonly statement: string;
}
