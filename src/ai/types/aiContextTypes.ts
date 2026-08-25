import { Planet, Sign, NatalGrahaDrishti } from '../../types';
import type { DashaYogaReference } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { TimingActivationEffect } from '../../domain/interpretation/DomainInterpretationTypes';
import type { WealthSubthemeKey } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { CareerFactorCategory } from '../../domain/career/careerDasha/careerDashaSynthesisTypes';
import type { DomainStrength } from '../../domain/reasoning/reasoningTypes';
import type { TimingEffect, TimingSourceCategory } from '../../domain/timing/careerWealthTiming/careerWealthTimingTypes';
import type { CareerManifestationMode } from '../../domain/career/manifestation/careerManifestationSynthesisTypes';
import type { WealthManifestationDimension } from '../../domain/wealth/manifestation/wealthManifestationTypes';
import {
  AiAvailability,
  AiConfidence,
  AiContextSchemaVersion,
  AiEvidenceEffect
} from './aiTypes';
import type { DomainInterpretationAiProjection } from '../../domain/interpretation';
import type { LifeAnalysisAiProjection } from '../../domain/synthesis';

export type { DomainInterpretationAiProjection, LifeAnalysisAiProjection, TimingActivationEffect, WealthSubthemeKey, TimingSourceCategory };

export type CareerNatalPromise =
  | 'STRONG'
  | 'SUPPORTED'
  | 'MIXED'
  | 'ADVERSE'
  | 'UNAVAILABLE';

export type CareerD10Relationship =
  | 'CONFIRMS'
  | 'PARTIALLY_CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'UNAVAILABLE';

export type AiEvidencePriority =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'CONFIRMATORY'
  | 'TIMING';

export type AiEvidenceDimension =
  | 'NATAL_STRUCTURE'
  | 'MODIFIER'
  | 'CONFIRMATION'
  | 'TIMING';

export type AiEvidenceSource =
  | 'PLANET'
  | 'HOUSE'
  | 'YOGA'
  | 'FUNCTIONAL_ROLE'
  | 'STRENGTH'
  | 'DASHA'
  | 'D9'
  | 'D10'
  | 'CAREER'
  | 'WEALTH'
  | 'LIFE_THEME'
  | 'ASPECT'
  | 'D2'
  | 'TRANSIT'
  | 'UNKNOWN';

export type AiEvidenceStrength = 'STRONG' | 'MODERATE' | 'WEAK' | 'UNKNOWN';

export interface AscendantFact {
  readonly sign: Sign;
  readonly lord: Planet;
  readonly lordHouse?: number;
  readonly lordSign?: Sign;
}

export interface PlanetFactSummary {
  readonly planet: Planet;
  readonly sign: Sign;
  readonly house: number;
  readonly dignity?: string;
  readonly state?: string;
  readonly functionalRoles: readonly string[];
  readonly ownedHouses: readonly number[];
  readonly strengthStatus?: string;
  readonly nakshatra?: string;
  readonly nakshatraPada?: number;
}

export interface HouseFactSummary {
  readonly house: number;
  readonly sign: Sign;
  readonly lord: Planet;
  readonly occupants: readonly Planet[];
  readonly aspectingPlanets: readonly Planet[];
}

export interface YogaFactSummary {
  readonly type: string;
  readonly category: string;
  readonly status:
    | 'PRESENT'
    | 'WEAKENED'
    | 'STRONG'
    | 'CANCELLED'
    | 'UNKNOWN';
  readonly strength?: string;
  readonly planets: readonly Planet[];
  readonly houses: readonly number[];
}

export interface DashaPeriodFact {
  readonly planet: Planet;
  readonly level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly start: string;
  readonly end: string;
}

export interface ActiveDashaFact {
  readonly mahadasha: Planet;
  readonly antardasha?: Planet;
  readonly pratyantardasha?: Planet;
}

export interface DashaPeriodStrengthFacts {
  readonly availability: string;
  readonly totalRupa?: number;
  readonly totalShastiamsa?: number;
  readonly percentageOfMinimum?: number;
  readonly meetsMinimum?: boolean;
  readonly shadbalaStatus?: string;
}

/**
 * Planetary-level directional synthesis only. `effect` here means the planet's overall directional tendency, NOT a domain outcome (Career/Wealth/etc.). Domain direction is a separate contract.
 */
export interface DashaPeriodSynthesisFacts {
  readonly effect: string;
  readonly confidence: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly neutralEvidenceIds: readonly string[];
  readonly summary: string;
}

export interface DashaDomainSynthesisFacts {
  readonly domain: string;
  readonly effect: string;
  readonly confidence: number;
  readonly supportingEvidenceIds: readonly string[];
  readonly challengingEvidenceIds: readonly string[];
  readonly neutralEvidenceIds: readonly string[];
  readonly activatedHouses: readonly number[];
  readonly summary: string;
}

export interface DashaPeriodFacts {
  readonly level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly placement: {
    readonly house: number;
    readonly sign: string;
  };
  readonly ownedHouses: readonly number[];
  readonly functionalRoles: readonly string[];
  readonly functionalNature?: string;
  readonly dignity?: string;
  readonly state?: string;
  readonly strength?: DashaPeriodStrengthFacts;
  readonly castAspects?: readonly NatalGrahaDrishti[];
  readonly receivedAspects?: readonly NatalGrahaDrishti[];
  readonly yogaParticipation?: readonly DashaYogaReference[];
  readonly evidenceIds: readonly string[];
  readonly confidence: string;
  readonly planetarySynthesis?: DashaPeriodSynthesisFacts;
  readonly domainSynthesis?: readonly DashaDomainSynthesisFacts[];
}

export interface DashaPairFacts {
  readonly mahadashaLord: Planet;
  readonly antardashaLord: Planet;
  readonly sharedHouses: readonly number[];
  readonly combinedHouseSet: readonly number[];
  readonly relationshipEvidenceIds: readonly string[];
}

export interface DashaInterpretationFacts {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
  readonly mahadasha?: DashaPeriodFacts;
  readonly antardasha?: DashaPeriodFacts;
  readonly pratyantardasha?: DashaPeriodFacts;
  readonly pair?: DashaPairFacts;
  readonly evidenceIds: readonly string[];
  readonly confidence?: string;
  readonly asOf?: string;
}

export interface DashaFacts {
  readonly system: 'VIMSHOTTARI';
  readonly periods: readonly DashaPeriodFact[];
  readonly active?: ActiveDashaFact;
  readonly asOf?: string;
  readonly interpretation?: DashaInterpretationFacts;
}

export interface DivisionalFact {
  readonly varga: 'D9' | 'D10' | 'D2';
  readonly status: AiAvailability;
  readonly ascendantSign?: Sign;
  readonly confidence?: AiConfidence;
}

export interface DivisionalFacts {
  readonly d9: DivisionalFact;
  readonly d10: DivisionalFact;
  readonly d2?: DivisionalFact;
}

export interface DashaHierarchyLevelFact {
  readonly level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly role: 'PRIMARY' | 'MODIFIER' | 'TRIGGER';
  readonly planet?: Planet;
  readonly effect: TimingActivationEffect;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerHierarchyFact {
  readonly primary: DashaHierarchyLevelFact;
  readonly modifier: DashaHierarchyLevelFact;
  readonly trigger: DashaHierarchyLevelFact;
  readonly overallEffect: TimingActivationEffect;
  readonly confidence?: number;
  readonly evidenceIds?: readonly string[];
  readonly summary?: string;
}

export interface CareerPeriodTimingFact {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect: string;
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
  readonly start?: string;
  readonly end?: string;
}

export interface CareerDashaSynthesisFactorFact {
  readonly id: string;
  readonly category: CareerFactorCategory;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly statement: string;
  readonly houses?: readonly number[];
  readonly evidenceIds?: readonly string[];
}

export interface CareerDashaSynthesisPeriodFact {
  readonly planet: Planet;
  readonly effect: string;
  readonly factors: readonly CareerDashaSynthesisFactorFact[];
}

export interface CareerDashaSynthesisHierarchyFact {
  readonly mdRole: string;
  readonly adRole: string;
  readonly pdRole: string;
  readonly combinedEffect: string;
}

export interface CareerDashaSynthesisFact {
  readonly reasoningVersion: 'CW-02';
  readonly md: CareerDashaSynthesisPeriodFact;
  readonly ad: CareerDashaSynthesisPeriodFact;
  readonly pd: CareerDashaSynthesisPeriodFact;
  readonly hierarchy: CareerDashaSynthesisHierarchyFact;
  readonly summary: string;
}

import type { WealthDimension } from '../../domain/wealth/wealthTypes';

export interface CareerTimingFactorFact {
  readonly id: string;
  readonly planet: Planet;
  readonly category: TimingSourceCategory;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly statement: string;
  readonly houses?: readonly number[];
  readonly natalEvidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitingPlanet?: Planet;
  readonly targetPlanet?: Planet;
  readonly dashaPlanet?: Planet;
}

export interface CareerTimingSynthesisFact {
  readonly reasoningVersion: 'CW-03';
  readonly natalPromise: DomainStrength;
  readonly dashaEffect: string;
  readonly transitEffect: string;
  readonly overallEffect: TimingEffect;
  readonly confidence: number;
  readonly factors: readonly CareerTimingFactorFact[];
  readonly summary: string;
}

export interface CareerTimingFact {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
  readonly asOf?: string;
  readonly mahadasha?: CareerPeriodTimingFact;
  readonly antardasha?: CareerPeriodTimingFact;
  readonly pratyantardasha?: CareerPeriodTimingFact;
  readonly hierarchy?: CareerHierarchyFact;
  readonly dashaSynthesis?: CareerDashaSynthesisFact;
  readonly timingSynthesis?: CareerTimingSynthesisFact;
}

export interface CareerManifestationFactorFact {
  readonly id: string;
  readonly mode: CareerManifestationMode;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly source: 'NATAL' | 'DASHA' | 'TRANSIT' | 'D10';
  readonly statement: string;
  readonly evidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitEvidenceIds?: readonly string[];
}

export interface CareerManifestationSynthesisFact {
  readonly reasoningVersion: 'CW-04';
  readonly mode: CareerManifestationMode;
  readonly status:
    | 'STRONGLY_SUPPORTED'
    | 'SUPPORTED'
    | 'MIXED'
    | 'CHALLENGED'
    | 'INSUFFICIENT_DATA';
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly natalSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly dashaSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly transitSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly d10Support: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly factors: readonly CareerManifestationFactorFact[];
  readonly summary: string;
}

export interface CareerFact {
  readonly status:
    | 'STRONGLY_SUPPORTED'
    | 'SUPPORTED'
    | 'NEUTRAL'
    | 'MIXED'
    | 'CHALLENGED'
    | 'LIMITED_EVIDENCE';
  readonly confidence: AiConfidence;
  readonly natalPromise: CareerNatalPromise;
  readonly d10Relationship: CareerD10Relationship;
  readonly supportingFactors: readonly string[];
  readonly challengingFactors: readonly string[];
  readonly conditionalFactors?: readonly string[];
  readonly timing?: CareerTimingFact;
  readonly dashaSynthesis?: CareerDashaSynthesisFact;
  readonly manifestationSynthesis?: readonly CareerManifestationSynthesisFact[];
}

export interface WealthDimensionHierarchyFact {
  readonly dimension: WealthSubthemeKey;
  readonly primary: TimingActivationEffect;
  readonly modifier: TimingActivationEffect;
  readonly trigger: TimingActivationEffect;
  readonly overallEffect: TimingActivationEffect;
  readonly confidence?: number;
}

export interface WealthHierarchyFact {
  readonly primary: DashaHierarchyLevelFact;
  readonly modifier: DashaHierarchyLevelFact;
  readonly trigger: DashaHierarchyLevelFact;
  readonly dimensions: readonly WealthDimensionHierarchyFact[];
  readonly evidenceIds?: readonly string[];
  readonly summary?: string;
}

export interface WealthPeriodTimingFact {
  readonly period: 'MD' | 'AD' | 'PD';
  readonly planet?: Planet;
  readonly effect?: string;
  readonly dimensions: {
    readonly accumulation: string;
    readonly gains: string;
    readonly fortune: string;
    readonly speculation: string;
  };
  readonly evidenceIds: readonly string[];
  readonly statement?: string;
}

export interface WealthTimingFactorFact {
  readonly id: string;
  readonly planet: Planet;
  readonly category: TimingSourceCategory;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly statement: string;
  readonly dimension: WealthDimension | string;
  readonly houses?: readonly number[];
  readonly natalEvidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitingPlanet?: Planet;
  readonly targetPlanet?: Planet;
  readonly dashaPlanet?: Planet;
}

export interface WealthTimingSynthesisFact {
  readonly reasoningVersion: 'CW-03';
  readonly dimensions: Record<WealthDimension | string, {
    readonly dimension: WealthDimension | string;
    readonly natalPromise: DomainStrength;
    readonly dashaEffect: string;
    readonly transitEffect: string;
    readonly overallEffect: TimingEffect;
    readonly confidence: number;
    readonly factors: readonly WealthTimingFactorFact[];
    readonly summary: string;
  }>;
  readonly overallSummary: string;
}

export interface WealthTimingFact {
  readonly status: 'AVAILABLE' | 'UNAVAILABLE';
  readonly asOf?: string;
  readonly mahadasha?: WealthPeriodTimingFact;
  readonly antardasha?: WealthPeriodTimingFact;
  readonly pratyantardasha?: WealthPeriodTimingFact;
  readonly hierarchy?: WealthHierarchyFact;
  readonly timingSynthesis?: WealthTimingSynthesisFact;
}

export interface WealthSubthemeFact {
  readonly subtheme: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly house: number;
  readonly status:
    | 'STRONGLY_SUPPORTED'
    | 'SUPPORTED'
    | 'NEUTRAL'
    | 'MIXED'
    | 'CHALLENGED'
    | 'LIMITED_EVIDENCE';
  readonly primaryFamily: string;
  readonly supportingCount: number;
  readonly challengingCount: number;
  readonly summary: string;
}

export interface WealthManifestationFactorFact {
  readonly id: string;
  readonly dimension: WealthManifestationDimension;
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly weight: number;
  readonly source: 'NATAL' | 'DASHA' | 'TRANSIT' | 'D2';
  readonly statement: string;
  readonly evidenceIds?: readonly string[];
  readonly dashaEvidenceIds?: readonly string[];
  readonly transitEvidenceIds?: readonly string[];
}

export interface WealthDimensionManifestationSynthesisFact {
  readonly reasoningVersion: 'CW-04';
  readonly dimension: WealthManifestationDimension;
  readonly status:
    | 'STRONGLY_SUPPORTED'
    | 'SUPPORTED'
    | 'MIXED'
    | 'CHALLENGED'
    | 'INSUFFICIENT_DATA';
  readonly confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  readonly natalSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly dashaSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly transitSupport: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly d2Support: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';
  readonly factors: readonly WealthManifestationFactorFact[];
  readonly summary: string;
}

export interface WealthManifestationSynthesisFact {
  readonly reasoningVersion: 'CW-04';
  readonly dimensions: Partial<
    Record<
      WealthManifestationDimension,
      WealthDimensionManifestationSynthesisFact
    >
  >;
  readonly summary: string;
}

export interface WealthFact {
  readonly status:
    | 'STRONGLY_SUPPORTED'
    | 'SUPPORTED'
    | 'NEUTRAL'
    | 'MIXED'
    | 'CHALLENGED'
    | 'LIMITED_EVIDENCE';
  readonly confidence: AiConfidence;
  readonly subthemes?: readonly WealthSubthemeFact[];
  readonly supportingFactors: readonly string[];
  readonly challengingFactors: readonly string[];
  readonly conditionalFactors?: readonly string[];
  readonly timing?: WealthTimingFact;
  readonly manifestationSynthesis?: WealthManifestationSynthesisFact;
}

export interface LifeThemeFact {
  readonly theme: string;
  readonly effect: AiEvidenceEffect;
  readonly confidence: AiConfidence;
  readonly evidenceCount: number;
}

export interface AiEvidence {
  readonly id: string;
  readonly source: AiEvidenceSource;
  readonly effect: AiEvidenceEffect;
  readonly strength: AiEvidenceStrength;
  readonly statement: string;
  readonly planets?: readonly Planet[];
  readonly houses?: readonly number[];
  readonly ruleId?: string;
  readonly priority?: AiEvidencePriority;
  readonly dimension?: AiEvidenceDimension;
  readonly conditional?: boolean;
  readonly varga?: 'D9' | 'D10';
  readonly dashaLevel?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly timingPlanet?: Planet;
  readonly vargaRelationship?:
    | 'CONFIRMS'
    | 'PARTIALLY_CONFIRMS'
    | 'MODIFIES'
    | 'CONFLICTS'
    | 'UNAVAILABLE';
  readonly timingHouses?: readonly number[];
  readonly timingReason?: string;
  readonly timingRelevanceType?: string;
}

export interface AiContextSource {
  readonly engine: 'CORE_ASTRO';
  readonly deterministic: true;
  readonly astrologySystem: 'VEDIC';
}

export interface AiContextMethodology {
  readonly zodiac: 'SIDEREAL';
  readonly ayanamsa: 'LAHIRI';
  readonly houseSystem: 'WHOLE_SIGN';
  readonly dashaSystem: 'VIMSHOTTARI';
  readonly aspectSystem: 'PARASHARI';
}

export interface AiContext {
  readonly schemaVersion: AiContextSchemaVersion;
  readonly source: AiContextSource;
  readonly ascendant: AscendantFact;
  readonly planets: readonly PlanetFactSummary[];
  readonly houses: readonly HouseFactSummary[];
  readonly yogas: readonly YogaFactSummary[];
  readonly dasha: DashaFacts;
  readonly divisional: DivisionalFacts;
  readonly career?: CareerFact;
  readonly wealth?: WealthFact;
  readonly lifeThemes: readonly LifeThemeFact[];
  readonly evidence: readonly AiEvidence[];
  readonly methodology: AiContextMethodology;
  readonly domainInterpretations?: readonly DomainInterpretationAiProjection[];
  readonly lifeAnalysis?: LifeAnalysisAiProjection;
}
