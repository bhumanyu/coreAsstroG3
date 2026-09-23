import type {
  ConfidenceLevel,
  TimingActivationEffect,
  ManifestationMode,
  DomainStrength,
  VargaRelationship
} from '../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { Planet } from '../../types';
import type { CareerDashaSynthesis } from './careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis } from '../timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerManifestationSynthesis } from './manifestation/careerManifestationSynthesisTypes';
import type { CareerWealthFinalSynthesis } from '../careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import type { ReasoningTraceGraph } from '../careerWealth/reasoningTrace';

/**
 * Canonical Career Manifestation Mode Taxonomy
 *
 * This type defines the 7 canonical manifestation modes for Career expression.
 * These are the only modes that are actively implemented in the C8 expression pipeline.
 *
 * Previous duplicate entries have been collapsed to their canonical forms:
 * - ENTREPRENEURSHIP → collapsed into BUSINESS_ENTREPRENEURSHIP
 * - SPECIALIZATION → collapsed into TECHNICAL_SPECIALIZATION
 * - EMPLOYMENT → collapsed into SERVICE_EMPLOYMENT
 * - PUBLIC_INSTITUTIONAL → collapsed into AUTHORITY
 *
 * The 7 canonical modes are derived from the C1 semantic freeze and represent
 * the manifestation vocabulary that is actively mapped in CAREER_MANIFESTATION_RULES.
 */
export type CareerManifestationMode =
  | 'LEADERSHIP'
  | 'MANAGEMENT'
  | 'TECHNICAL_SPECIALIZATION'
  | 'SERVICE_EMPLOYMENT'
  | 'AUTHORITY'
  | 'INDEPENDENT_WORK'
  | 'BUSINESS_ENTREPRENEURSHIP';

export const CAREER_PRIMARY_HOUSES: ReadonlySet<number> = new Set([10]);
export const CAREER_SUPPORTING_HOUSES: ReadonlySet<number> = new Set([6, 2, 11]);
export const CAREER_CHALLENGING_HOUSES: ReadonlySet<number> = new Set([8, 12]);
export const CAREER_PRIMARY_LORDS: ReadonlySet<string> = new Set(['10L']);
export const CAREER_SUPPORTING_LORDS: ReadonlySet<string> = new Set(['6L', '2L', '11L']);
export const CAREER_CHALLENGING_LORDS: ReadonlySet<string> = new Set(['8L', '12L']);

export interface CareerHousePortfolio {
  readonly primary: readonly number[];
  readonly supporting: readonly number[];
  readonly challenging: readonly number[];
  readonly secondary?: readonly number[];
}

export const CAREER_HOUSE_PORTFOLIO: CareerHousePortfolio = Object.freeze({
  primary: Object.freeze([10]),
  supporting: Object.freeze([6, 2, 11]),
  challenging: Object.freeze([8, 12]),
  secondary: Object.freeze([])
});

export function getCareerHousePortfolio(): CareerHousePortfolio {
  return CAREER_HOUSE_PORTFOLIO;
}

export type CareerHouseDirection = 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';

export function classifyCareerHouse(
  house: number,
  portfolio: CareerHousePortfolio = CAREER_HOUSE_PORTFOLIO
): CareerHouseDirection {
  if (portfolio.primary.includes(house)) {
    return 'PRIMARY';
  }
  if (portfolio.supporting.includes(house)) {
    return 'SUPPORTING';
  }
  if (portfolio.challenging.includes(house)) {
    return 'CHALLENGING';
  }
  return 'NEUTRAL';
}

export interface CareerManifestation {
  readonly mode: ManifestationMode;
  readonly confidence: ConfidenceLevel;
  readonly evidenceIds: readonly string[];
  readonly statement: string;
}

export interface CareerTimingActivation {
  readonly period?: 'MD' | 'AD' | 'PD' | string;
  readonly level?: 'MD' | 'AD' | 'PD' | 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | string;
  readonly planet?: Planet;
  readonly effect: TimingActivationEffect;
  readonly activatedPromiseEvidenceIds?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly statement?: string;
  readonly source?: string;
  readonly periodKey?: string;
  readonly active?: boolean;
  readonly dimension?: string;
}

export interface CareerDataCompleteness {
  readonly primaryFactors: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  readonly d10: 'AVAILABLE' | 'UNAVAILABLE';
  readonly dasha: 'AVAILABLE' | 'UNAVAILABLE';
  readonly transit: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface CareerEvidenceClassification {
  readonly primary: readonly DomainEvidence[];
  readonly supporting: readonly DomainEvidence[];
  readonly challenging: readonly DomainEvidence[];
  readonly modifiers: readonly DomainEvidence[];
}

export interface CareerConclusionData {
  readonly natalStatus: DomainStrength;
  readonly currentActivation: 'ACTIVE' | 'PARTIALLY_ACTIVE' | 'INACTIVE' | 'STRONG' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_DATA' | 'UNKNOWN';
  readonly currentPressure: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'STRONG' | 'UNKNOWN';
  readonly d10Relationship: VargaRelationship;
  readonly dominantManifestations: readonly ManifestationMode[];
  readonly headline: string;
  readonly supportingSourceIds: readonly string[];
  readonly challengingSourceIds: readonly string[];
  readonly careerDashaSynthesis?: CareerDashaSynthesis;
  readonly careerTimingSynthesis?: CareerTimingSynthesis;
  readonly careerManifestationSynthesis?: readonly CareerManifestationSynthesis[];
  readonly careerFinalSynthesis?: CareerWealthFinalSynthesis;
  readonly reasoningTraceGraph?: ReasoningTraceGraph;
}
