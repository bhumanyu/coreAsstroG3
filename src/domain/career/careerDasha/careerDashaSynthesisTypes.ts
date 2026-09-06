import type { Planet } from '../../../types';
import type { InterpretationConfidence } from '../../../engine/planetInterpretation/planetInterpretationTypes';
import type {
  DashaPlanetActivation,
  DashaInterpretationReport,
  DashaPairInterpretation
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
  | 'RECEIVED_ASPECT'
  | 'YOGA'
  | 'KARAKA'
  | 'D10'
  | 'DASHA_ACTIVATION'
  | 'CAREER_HOUSE_RULE'
  | 'RELATIONSHIP';

/**
 * Semantic career contribution categories (spec §17).
 * Closed enum drawn from existing CoreAstro career vocabulary.
 */
export enum CareerContributionCategory {
  CAREER_STATUS = 'CAREER_STATUS',
  AUTHORITY = 'AUTHORITY',
  RESPONSIBILITY = 'RESPONSIBILITY',
  NETWORK = 'NETWORK',
  GAINS = 'GAINS',
  SERVICE = 'SERVICE',
  SKILL = 'SKILL',
  COMMUNICATION = 'COMMUNICATION',
  LEADERSHIP = 'LEADERSHIP',
  FOREIGN = 'FOREIGN',
  INSTITUTIONAL = 'INSTITUTIONAL',
  TRANSITION = 'TRANSITION',
  STABILITY = 'STABILITY',
  CREATIVE_COUNSEL = 'CREATIVE_COUNSEL',
  ADVISORY = 'ADVISORY',
  TRANSFORMATION = 'TRANSFORMATION',
  RESEARCH = 'RESEARCH',
  PARTNERSHIP = 'PARTNERSHIP'
}

/**
 * Individual career relevance evidence item (spec §6).
 */
export interface CareerRelevanceEvidence {
  readonly factor: string;
  readonly source: string;
  readonly strength: 'STRONG' | 'MODERATE' | 'WEAK';
  readonly explanationKey: string;
  readonly ruleId: string;
  readonly houses?: readonly number[];
  readonly planets?: readonly Planet[];
}

/**
 * Career relevance model (spec §6).
 */
export interface CareerRelevance {
  readonly careerLinked: boolean;
  readonly relevanceScore: number;
  readonly relevanceLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  readonly evidence: readonly CareerRelevanceEvidence[];
  readonly d10ReferenceAvailable?: boolean;
}

/**
 * Separation of Planetary Strength and Career Relevance (spec §14).
 */
export interface CareerDashaImpact {
  readonly relevanceLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'NONE';
  readonly strengthLevel: 'STRONG' | 'MODERATE' | 'AVERAGE' | 'WEAK' | 'UNKNOWN';
  readonly overallImpact: 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
  readonly statement: string;
}

export type EvidenceDirection = CareerFactorDirection;

export type EvidenceRole =
  | 'PRIMARY'
  | 'SUPPORTING'
  | 'QUALIFYING'
  | 'TERTIARY'
  | 'MODIFIER'
  | 'CONFIRMATION'
  | 'TIMING';

/**
 * Relationship between Dasha period lords (spec §8–9).
 */
export type DashaRelationshipType =
  | 'FRIEND'
  | 'GREAT_FRIEND'
  | 'NEUTRAL'
  | 'ENEMY'
  | 'GREAT_ENEMY';

export type DashaRelationshipCareerImpact =
  | 'SUPPORTIVE'
  | 'CONFLICTING'
  | 'NEUTRAL'
  | 'MIXED';

export interface DashaPlanetRelationship {
  readonly sourcePlanet: Planet;
  readonly targetPlanet: Planet;
  readonly sourcePeriod: CareerDashaPeriod;
  readonly targetPeriod: CareerDashaPeriod;
  readonly fromPeriod?: CareerDashaPeriod;
  readonly toPeriod?: CareerDashaPeriod;
  readonly fromPlanet?: Planet;
  readonly toPlanet?: Planet;
  readonly relationshipType: DashaRelationshipType;
  readonly careerImpact: DashaRelationshipCareerImpact;
  readonly sharedHouses?: readonly number[];
  readonly combinedHouseSet?: readonly number[];
  readonly careerHouseOverlap?: readonly number[];
  readonly relevanceSummary?: string;
  readonly functionalInteraction?: string;
  readonly evidence: readonly CareerDashaFactor[];
  readonly ruleId: string;
  readonly summary: string;
}

export interface CareerDashaFactor {
  readonly id: string;
  readonly period: CareerDashaPeriod;
  readonly planet: Planet;
  readonly category: CareerFactorCategory;
  readonly direction: CareerFactorDirection;
  readonly weight: number;
  readonly statement: string;
  readonly ruleId?: string;
  readonly role?: EvidenceRole;
  readonly evidenceDirection?: EvidenceDirection;
  readonly contributionCategory?: CareerContributionCategory;
  readonly candidateContributionCategories?: readonly CareerContributionCategory[];
  readonly houses?: readonly number[];
  readonly planets?: readonly Planet[];
  readonly evidenceIds?: readonly string[];
  readonly derivedFromIds?: readonly string[];
  readonly meta?: Record<string, unknown>;
}

export type D10CareerRelationship =
  | 'CONFIRMS'
  | 'PARTIALLY_CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'UNAVAILABLE'
  | VargaRelationship;

export interface D10CareerContext {
  readonly relationship: D10CareerRelationship;
  readonly statement?: string;
  readonly available?: boolean;
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
  readonly d10?: D10CareerContext;
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
  readonly careerLinked: boolean;
  readonly relevance?: CareerRelevance;
  readonly impact?: CareerDashaImpact;
  readonly factors: readonly CareerDashaFactor[];
  readonly supportingFactorIds: readonly string[];
  readonly challengingFactorIds: readonly string[];
  readonly neutralFactorIds: readonly string[];
  readonly supportingEvidenceIds?: readonly string[];
  readonly challengingEvidenceIds?: readonly string[];
  readonly neutralEvidenceIds?: readonly string[];
  readonly qualifyingEvidenceIds?: readonly string[];
  readonly activatedCareerHouses: readonly number[];
  readonly d10Effect: 'SUPPORTS' | 'CHALLENGES' | 'NEUTRAL';
  readonly summary: string;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaHierarchyRole {
  readonly mdRole: 'PRIMARY' | 'PRIMARY_DRIVER';
  readonly adRole: 'MODIFIER';
  readonly pdRole: 'REFINEMENT' | 'TRIGGER';
}

export interface CareerDashaPeriodSynthesis {
  readonly hierarchy: CareerDashaHierarchyRole;
  readonly md: CareerDashaPlanetSynthesis;
  readonly ad: CareerDashaPlanetSynthesis;
  readonly pd: CareerDashaPlanetSynthesis;
  readonly relationships?: readonly DashaPlanetRelationship[];
  readonly mdAdRelationship?: DashaPlanetRelationship;
  readonly mdPdRelationship?: DashaPlanetRelationship;
  readonly adPdRelationship?: DashaPlanetRelationship;
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
  readonly primaryEvidence: readonly CareerDashaFactor[];
  readonly supportingEvidence: readonly CareerDashaFactor[];
  readonly qualifyingEvidence: readonly CareerDashaFactor[];
  readonly tertiaryEvidence?: readonly CareerDashaFactor[];
  readonly relationships?: readonly DashaPlanetRelationship[];
  readonly summary: string;
}

export interface BuildCareerDashaSynthesisParams {
  readonly dashaInterpretation?: DashaInterpretationReport;
  readonly d10Context?: D10CareerContext;
  readonly housePortfolio?: CareerHousePortfolio;
  readonly pairInterpretation?: DashaPairInterpretation;
}
