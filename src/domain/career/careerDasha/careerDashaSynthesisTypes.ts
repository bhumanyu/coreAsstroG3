import type { Planet } from '../../../types';
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  DashaPlanetActivation,
  DashaInterpretationReport
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type { CareerHousePortfolio } from '../careerTypes';

export type { CareerHousePortfolio };

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
  readonly period: CareerDashaPeriod;
  readonly planet: Planet;
  readonly category: CareerFactorCategory;
  readonly direction: CareerFactorDirection;
  readonly weight: number;
  readonly statement: string;
  readonly houses?: readonly number[];
  readonly evidenceIds?: readonly string[];
  readonly meta?: Record<string, unknown>;
}

export type D10CareerRelationship =
  | 'CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'UNAVAILABLE'
  | VargaRelationship;

export interface D10CareerContext {
  // TODO: Deeper Dasha-planet × D10 planetary-condition synthesis (varga dignity, varga aspect, etc.) is deferred to a future milestone. Currently using varga relationship integration.
  readonly relationship: D10CareerRelationship;
  readonly statement?: string;
}

export interface CareerDashaTiming {
  readonly period: CareerDashaPeriod;
  readonly planet: Planet;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaPlanetInput {
  readonly period: CareerDashaPeriod;
  readonly activation: DashaPlanetActivation;
  readonly housePortfolio: CareerHousePortfolio;
  readonly d10: D10CareerContext;
  readonly confidence?: InterpretationConfidence;
  readonly start?: string;
  readonly end?: string;
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
  readonly start?: string;
  readonly end?: string;
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
  readonly reasoningVersion: 'CW-02';
  readonly timing: {
    readonly md: CareerDashaTiming;
    readonly ad: CareerDashaTiming;
    readonly pd: CareerDashaTiming;
  };
  readonly md: CareerDashaPlanetSynthesis;
  readonly ad: CareerDashaPlanetSynthesis;
  readonly pd: CareerDashaPlanetSynthesis;
  readonly combined: CareerDashaPeriodSynthesis;
  readonly factors: readonly CareerDashaFactor[];
  readonly summary: string;
}

export interface BuildCareerDashaSynthesisParams {
  readonly dashaInterpretation?: DashaInterpretationReport;
  readonly d10Context?: D10CareerContext;
  readonly housePortfolio?: CareerHousePortfolio;
}
