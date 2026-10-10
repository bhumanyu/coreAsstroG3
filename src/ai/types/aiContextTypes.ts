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
import type { CareerFinalSynthesisResult } from '../../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerProfessionAnalysis,
  CareerProfessionCandidate,
  CareerProfessionEvidence,
  CareerProfessionD10Status
} from '../../domain/career/careerProfession/careerProfessionTypes';

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
import type {
  FinalDomainStatus,
  FinalDomainConfidence,
  WealthRiskProfile,
  SynthesisAxisStatus,
  FinalSynthesisActivationHierarchy
} from '../../domain/careerWealth/finalSynthesis/careerWealthFinalSynthesisTypes';
import type { VargaRelationship } from '../../domain/interpretation/DomainInterpretationTypes';

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

export interface ManifestationSummaryFact {
  readonly mode: string;
  readonly status: string;
  readonly confidence: string;
}

export interface WealthDimensionFinalSynthesisFact {
  readonly status: FinalDomainStatus;
  readonly finalStatus?: FinalDomainStatus;
  readonly promiseStatus?: FinalDomainStatus;
  readonly activationStatus?: SynthesisAxisStatus;
  readonly activationConfidence?: FinalDomainConfidence;
  readonly activationStrength?: number;
  readonly activationSummary?: string;
  readonly activationHierarchy?: FinalSynthesisActivationHierarchy;
  readonly timingStatus?: SynthesisAxisStatus;
  readonly divisionalStatus?: VargaRelationship;
  readonly manifestationStatus?: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
  readonly primaryPromise: DomainStrength;
  readonly dashaEffect: string;
  readonly timingEffect: string;
  readonly divisionalEffect: string;
  readonly summary: string;
  readonly ruleIds?: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly natalEvidenceIds?: readonly string[];
  readonly natalRuleIds?: readonly string[];
}

export interface CareerWealthFinalSynthesisFact {
  readonly reasoningVersion: 'CW-05';
  readonly domain: 'CAREER' | 'WEALTH';
  readonly status: FinalDomainStatus;
  readonly finalStatus?: FinalDomainStatus;
  readonly promiseStatus?: FinalDomainStatus;
  readonly activationStatus?: SynthesisAxisStatus;
  readonly activationConfidence?: FinalDomainConfidence;
  readonly activationStrength?: number;
  readonly activationSummary?: string;
  readonly activationHierarchy?: FinalSynthesisActivationHierarchy;
  readonly timingStatus?: SynthesisAxisStatus;
  readonly divisionalStatus?: VargaRelationship;
  readonly manifestationStatus?: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
  readonly primaryPromise: DomainStrength | string;
  readonly primaryStrength?: DomainStrength;
  readonly secondaryStrengths?: readonly WealthDimension[];
  readonly manifestationSummary: readonly ManifestationSummaryFact[];
  readonly strongestAreas: readonly string[];
  readonly challengedAreas: readonly string[];
  readonly dashaEffect: string;
  readonly timingEffect: string;
  readonly divisionalEffect: string;
  readonly keySupport: readonly string[];
  readonly keyChallenges: readonly string[];
  readonly summary: string;
  readonly ruleIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly natalEvidenceIds?: readonly string[];
  readonly natalRuleIds?: readonly string[];
  readonly dimensions?: Partial<Record<WealthDimension, WealthDimensionFinalSynthesisFact>>;
  readonly riskProfile?: WealthRiskProfile;
}

/**
 * P2-10B AI DTO: Career canonical expression fact.
 * Projects a C11 expression into AI context.
 */
export interface AiCareerCanonicalExpressionFact {
  readonly mode: string;
  readonly direction: string;
  readonly strength: string;
  readonly statement: string;
}

/**
 * P2-10B AI DTO: Career canonical conflict fact.
 * Projects a C11 conflict into AI context.
 */
export interface AiCareerCanonicalConflictFact {
  readonly layers: readonly string[];
  readonly description: string;
}

/**
 * P2-10B AI DTO: Career canonical evidence trace.
 * Mirrors CareerFinalSynthesisResult.evidenceTrace.
 */
export interface AiCareerCanonicalEvidenceTrace {
  readonly evidenceIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

/**
 * P2-10B AI DTO: Career canonical C11 fact.
 * Projects the authoritative C11 result into AI context.
 */
export interface AiCareerCanonicalC11Fact {
  readonly reasoningVersion: 'C11';
  readonly finalStatus: string;
  readonly finalDirection: string;
  readonly finalStrength: string;
  readonly confidence: string;
  readonly natalDirection: string;
  readonly natalStrength: string;
  readonly expressionStatus: string;
  readonly d10Direction: string;
  readonly d10Effect: string;
  readonly dashaEffect: string;
  readonly dashaDirection: string;
  readonly timingStatus: string;
  readonly transitDirection: string;
  readonly currentPressure: string;
  readonly expressions: readonly AiCareerCanonicalExpressionFact[];
  readonly strongestExpressions: readonly string[];
  readonly challengedExpressions: readonly string[];
  readonly conflicts: readonly AiCareerCanonicalConflictFact[];
  readonly statement: string;
  // Canonical provenance fields (distinct identity namespace from AI evidence)
  readonly canonicalEvidenceIds: readonly string[];
  readonly canonicalSourceIds: readonly string[];
  readonly canonicalRuleIds: readonly string[];
  readonly canonicalEvidenceTrace: AiCareerCanonicalEvidenceTrace;
}

/**
 * P2-10B AI DTO: Career profession evidence fact.
 * Projects profession evidence into AI context.
 */
export interface AiCareerProfessionEvidenceFact {
  readonly evidenceId: string;
  readonly basis: string;
  readonly sourceIds: readonly string[];
  readonly ruleId: string;
  readonly statement: string;
  readonly linkage?: 'COMPLETE' | 'PARTIAL';
  readonly resolvedMechanismIds?: readonly string[];
  readonly unresolvedMechanismIds?: readonly string[];
}

/**
 * P2-10B AI DTO: Career profession candidate fact.
 * Projects a profession candidate into AI context.
 */
export interface AiCareerProfessionCandidateFact {
  readonly candidateId: string;
  readonly domain: string;
  readonly family: string;
  readonly basis: string;
  readonly expressionTypes: readonly string[];
  readonly mechanismTypes: readonly string[];
  readonly patternIds: readonly string[];
  readonly d10Status: CareerProfessionD10Status;
  readonly evidence: readonly AiCareerProfessionEvidenceFact[];
  readonly domainEvidenceIds: readonly string[];
  readonly relatedEvidenceIds: readonly string[];
  readonly ruleId: string;
}

/**
 * P2-10B AI DTO: Career profession status.
 * Status of profession analysis in AI context.
 */
export type AiCareerProfessionStatus = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';

/**
 * P2-10B AI DTO: Career profession fact.
 * Projects the precomputed P2-10A CareerProfessionAnalysis into AI context.
 */
export interface AiCareerProfessionFact {
  readonly availability: AiAvailability;
  readonly status: AiCareerProfessionStatus;
  readonly candidates: readonly AiCareerProfessionCandidateFact[];
  readonly unresolvedExpressionTypes: readonly string[];
  readonly mappedTypes: readonly string[];
  readonly missingInputs: readonly string[];
  readonly d10Status: CareerProfessionD10Status;
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
  readonly finalSynthesis?: CareerWealthFinalSynthesisFact;
  readonly canonicalC11?: AiCareerCanonicalC11Fact;
  readonly profession: AiCareerProfessionFact;
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
  readonly finalSynthesis?: CareerWealthFinalSynthesisFact;
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
  readonly identityKey?: string;
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
  readonly derivedFromIds?: readonly string[];
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
