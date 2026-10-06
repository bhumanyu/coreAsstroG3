import type {
  CareerPlanetRelevance,
  CareerPlanetRole
} from '../careerPlanetaryRelevance';

import type {
  CareerPlanetaryCondition
} from '../careerPlanetaryCondition';

import type {
  CareerExpression,
  CareerExpressionDirection
} from '../careerExpression';

import type {
  CareerStructuralDirection,
  CareerStructuralStrength
} from '../careerStructuralReasoning';

import {
  Planet
} from '../../../types';

export type CareerDashaActivationLevel =
  | 'MD'
  | 'AD'
  | 'PD';

export type CareerDashaActivationEffect =
  | 'ACTIVATES'
  | 'PARTIALLY_ACTIVATES'
  | 'CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'UNKNOWN'
  | 'INSUFFICIENT_DATA';

export type CareerDashaActivationDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'UNAVAILABLE';

export type CareerDashaActivationStrength =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'WEAK'
  | 'VERY_WEAK'
  | 'UNDETERMINED';

export type CareerDashaActivationRole =
  | 'PRIMARY_DRIVER'
  | 'MODIFIER'
  | 'REFINEMENT'
  | 'TRIGGER';

export type CareerDashaEvidenceRole =
  | 'STRUCTURAL'
  | 'PLANETARY_RELEVANCE'
  | 'PLANETARY_CONDITION'
  | 'EXPRESSION'
  | 'TIMING'
  | 'ACTIVATION';

export interface CareerDashaPlanetContext {
  readonly planet: Planet;
  readonly relevance: CareerPlanetRelevance;
  readonly roles: readonly CareerPlanetRole[];
  readonly condition: CareerPlanetaryCondition;
  readonly expressions: readonly CareerExpression[];
  readonly relatedHouses: readonly number[];
  readonly relatedPlanets: readonly Planet[];
}

export interface CareerDashaActivationEvidence {
  readonly id: string;
  readonly role: CareerDashaEvidenceRole;
  readonly statement: string;
  readonly planet?: Planet;
  readonly direction?: CareerDashaActivationDirection;
  readonly strength?: CareerDashaActivationStrength;
  readonly level: CareerDashaActivationLevel;
  readonly relatedPlanetIds: readonly string[];
  readonly relevanceEvidenceIds: readonly string[];
  readonly conditionEvidenceIds: readonly string[];
  readonly expressionEvidenceIds: readonly string[];
  readonly activationRuleIds: readonly string[];
  readonly sourceIds: readonly string[];
}

export interface CareerDashaActivation {
  readonly level: CareerDashaActivationLevel;
  readonly planet?: Planet;
  readonly role: CareerDashaActivationRole;
  readonly effect: CareerDashaActivationEffect;
  readonly direction: CareerDashaActivationDirection;
  readonly strength: CareerDashaActivationStrength;
  readonly evidence: readonly CareerDashaActivationEvidence[];
  readonly statement: string;
  readonly start?: string;
  readonly end?: string;
  readonly active: boolean;
  readonly activatedPromiseEvidenceIds: readonly string[];
  readonly challengedPromiseEvidenceIds: readonly string[];
  readonly expressionEvidenceIds: readonly string[];
}

export interface CareerDashaActivationHierarchy {
  readonly md: CareerDashaActivation;
  readonly ad: CareerDashaActivation;
  readonly pd: CareerDashaActivation;
  readonly overallEffect: CareerDashaActivationEffect;
  readonly overallDirection: CareerDashaActivationDirection;
  readonly overallStrength: CareerDashaActivationStrength;
  readonly dominantLevel: 'MD' | 'AD' | 'PD' | 'NONE';
  readonly statement: string;
}

export interface CareerDashaTiming {
  readonly planet?: Planet;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaActivationContext {
  readonly structuralDirection: CareerStructuralDirection;
  readonly structuralStrength: CareerStructuralStrength;
  readonly structuralPrimarySupport: number;
  readonly structuralPrimaryChallenge: number;
  readonly planetContexts: readonly CareerDashaPlanetContext[];
  readonly mdTiming: CareerDashaTiming;
  readonly adTiming: CareerDashaTiming;
  readonly pdTiming: CareerDashaTiming;
}
