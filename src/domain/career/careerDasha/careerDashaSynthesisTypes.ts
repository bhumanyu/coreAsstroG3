import type { Planet } from '../../../types';
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';

export type CareerDashaPeriod = 'MD' | 'AD' | 'PD';

export type CareerDashaEffect =
  | 'STRONGLY_SUPPORTS'
  | 'SUPPORTS'
  | 'MIXED'
  | 'CHALLENGES'
  | 'STRONGLY_CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'INSUFFICIENT_DATA';

export type CareerFactorDirection = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type CareerFactorCategory =
  | 'HOUSE_OWNERSHIP'
  | 'HOUSE_PLACEMENT'
  | 'FUNCTIONAL_ROLE'
  | 'FUNCTIONAL_NATURE'
  | 'DIGNITY'
  | 'STATE'
  | 'STRENGTH'
  | 'ASPECT'
  | 'YOGA'
  | 'KARAKA'
  | 'D10';

export interface CareerDashaFactor {
  readonly id: string;
  readonly category: CareerFactorCategory;
  readonly direction: CareerFactorDirection;
  readonly weight: number;
  readonly statement: string;
  readonly houses?: readonly number[];
  readonly meta?: Record<string, unknown>;
}

export interface CareerHousePortfolio {
  readonly primary: readonly number[];
  readonly supporting: readonly number[];
  readonly secondary: readonly number[];
}

export interface D10CareerContext {
  readonly relationship: VargaRelationship;
  readonly statement?: string;
}

export interface CareerDashaPlanetInput {
  readonly period: CareerDashaPeriod;
  readonly activation: DashaPlanetActivation;
  readonly housePortfolio: CareerHousePortfolio;
  readonly d10: D10CareerContext;
}

export interface CareerDashaPlanetSynthesis {
  readonly period: CareerDashaPeriod;
  readonly planet: Planet;
  readonly effect: CareerDashaEffect;
  readonly confidence: InterpretationConfidence;
  readonly supportScore: number;
  readonly challengeScore: number;
  readonly netScore: number;
  readonly factors: readonly CareerDashaFactor[];
  readonly supportingFactorIds: readonly string[];
  readonly challengingFactorIds: readonly string[];
  readonly neutralFactorIds: readonly string[];
  readonly activatedCareerHouses: readonly number[];
  readonly d10Effect: 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL';
  readonly summary: string;
}

export interface CareerDashaHierarchyRole {
  readonly mdRole: 'PRIMARY';
  readonly adRole: 'MODIFIER';
  readonly pdRole: 'REFINEMENT';
}

export interface CareerDashaPeriodSynthesis {
  readonly hierarchy: CareerDashaHierarchyRole;
  readonly md: CareerDashaPlanetSynthesis;
  readonly ad: CareerDashaPlanetSynthesis;
  readonly pd: CareerDashaPlanetSynthesis;
  readonly combinedEffect: CareerDashaEffect;
  readonly combinedConfidence: InterpretationConfidence;
  readonly combinedScore: number;
  readonly summary: string;
}

export interface CareerDashaSynthesis {
  readonly asOf?: string;
  readonly natalPromiseProtected: true;
  readonly md: CareerDashaPlanetSynthesis;
  readonly ad: CareerDashaPlanetSynthesis;
  readonly pd: CareerDashaPlanetSynthesis;
  readonly combined: CareerDashaPeriodSynthesis;
  readonly factors: readonly CareerDashaFactor[];
  readonly summary: string;
}
