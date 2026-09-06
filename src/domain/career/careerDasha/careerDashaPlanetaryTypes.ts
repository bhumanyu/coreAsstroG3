import type { Planet } from '../../../types';
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { CareerHousePortfolio } from '../careerTypes';
import type {
  CareerContributionCategory,
  CareerRelevance,
  CareerDashaImpact,
  EvidenceDirection,
  EvidenceRole
} from './careerDashaSynthesisTypes';

export type CareerDashaPlanetaryPeriod = 'MD' | 'AD' | 'PD';

export type CareerDashaPlanetaryDirection =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'NEUTRAL';

export type CareerDashaPlanetaryEffect =
  | 'STRONGLY_SUPPORTS'
  | 'SUPPORTS'
  | 'MIXED'
  | 'CHALLENGES'
  | 'STRONGLY_CHALLENGES'
  | 'DOES_NOT_ACTIVATE'
  | 'INSUFFICIENT_DATA';

export type CareerDashaPlanetaryFactorCategory =
  | 'HOUSE_OWNERSHIP'
  | 'HOUSE_PLACEMENT'
  | 'FUNCTIONAL_ROLE'
  | 'FUNCTIONAL_NATURE'
  | 'DIGNITY'
  | 'STATE'
  | 'STRENGTH'
  | 'ASPECT'
  | 'RECEIVED_ASPECT'
  | 'YOGA'
  | 'KARAKA'
  | 'D10';

export type CareerDashaPlanetaryEvidenceSource =
  | 'DASHA_ACTIVATION'
  | 'CAREER_HOUSE_RULE'
  | 'FUNCTIONAL_ROLE'
  | 'PLANETARY_DIGNITY'
  | 'PLANETARY_STATE'
  | 'PLANETARY_STRENGTH'
  | 'NATAL_ASPECT'
  | 'NATAL_YOGA'
  | 'CAREER_KARAKA'
  | 'D10_PLANET'
  | 'D10_COMPARISON';

export interface CareerDashaPlanetaryEvidence {
  readonly id: string;
  readonly period?: CareerDashaPlanetaryPeriod;
  readonly planet?: Planet;
  readonly source: CareerDashaPlanetaryEvidenceSource;
  readonly category?: CareerDashaPlanetaryFactorCategory;
  readonly statement: string;
  readonly direction: CareerDashaPlanetaryDirection;
  readonly weight: number;
  readonly role?: EvidenceRole;
  readonly evidenceDirection?: EvidenceDirection;
  readonly contributionCategory?: CareerContributionCategory;
  readonly houses?: readonly number[];
  readonly planets?: readonly Planet[];
  readonly ruleId?: string;
  readonly evidenceIds?: readonly string[];
  readonly meta?: Record<string, unknown>;
}

export interface CareerDashaD10PlanetContext {
  readonly planet: Planet;
  readonly available: boolean;
  readonly house?: number;
  readonly sign?: string;
  readonly dignity?: string;
  readonly isVargottama?: boolean;
  readonly isD10TenthLord?: boolean;
  readonly isD10TenthHouse?: boolean;
  readonly relationship:
    | 'CONFIRMS'
    | 'PARTIALLY_CONFIRMS'
    | 'MODIFIES'
    | 'CONFLICTS'
    | 'UNAVAILABLE';
}

export interface CareerDashaPlanetaryInput {
  readonly period: CareerDashaPlanetaryPeriod;
  readonly activation: DashaPlanetActivation;
  readonly housePortfolio: CareerHousePortfolio;
  readonly d10?: CareerDashaD10PlanetContext;
  readonly confidence?: InterpretationConfidence;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaPlanetarySynthesis {
  readonly period: CareerDashaPlanetaryPeriod;
  readonly planet: Planet;

  readonly effect: CareerDashaPlanetaryEffect;
  readonly confidence: InterpretationConfidence;

  readonly supportScore: number;
  readonly challengeScore: number;
  readonly netScore: number;

  readonly careerLinked: boolean;
  readonly relevance?: CareerRelevance;
  readonly impact?: CareerDashaImpact;

  /**
   * Distinct list of primary and supporting career houses directly owned or occupied
   * by the Dasha planet in the natal chart (distinct from aspect-based or D10 linkage).
   */
  readonly activatedCareerHouses: readonly number[];

  readonly factors: readonly CareerDashaPlanetaryEvidence[];

  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly neutralEvidenceIds: readonly string[];

  readonly supportingFactorIds?: readonly string[];
  readonly challengingFactorIds?: readonly string[];
  readonly neutralFactorIds?: readonly string[];

  readonly d10Effect:
    | 'SUPPORTS'
    | 'CHALLENGES'
    | 'NEUTRAL';

  readonly summary: string;

  readonly start?: string;
  readonly end?: string;
}

