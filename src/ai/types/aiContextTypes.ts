import { Planet, Sign } from '../../types';
import {
  AiAvailability,
  AiConfidence,
  AiContextSchemaVersion,
  AiEvidenceEffect
} from './aiTypes';

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

export interface DashaFacts {
  readonly system: 'VIMSHOTTARI';
  readonly periods: readonly DashaPeriodFact[];
  readonly active?: ActiveDashaFact;
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

export interface AiDomainInterpretation {
  readonly domain: string;
  readonly conclusion: string;
  readonly natalPromise: string;
  readonly dashaActivation: string;
  readonly transitTrigger: string;
  readonly confidence: string;
  readonly evidenceIds: readonly string[];
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
  readonly domainInterpretations?: readonly (AiDomainInterpretation | import('../../domain/interpretation').DomainInterpretationAiProjection)[];
}
