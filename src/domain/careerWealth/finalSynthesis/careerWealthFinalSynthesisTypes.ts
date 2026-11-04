import type { DomainStrength } from '../../reasoning/reasoningTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { CareerDashaSynthesis, CareerDashaEffect } from '../../career/careerDasha/careerDashaSynthesisTypes';
import type { CareerTimingSynthesis, WealthTimingSynthesis } from '../../timing/careerWealthTiming/careerWealthTimingTypes';
import type {
  CareerManifestationSynthesis,
  ManifestationStatus
} from '../../career/manifestation/careerManifestationSynthesisTypes';
import type { WealthDimension } from '../../wealth/wealthTypes';
import type {
  WealthManifestationSynthesis,
  WealthManifestationStatus
} from '../../wealth/manifestation/wealthManifestationTypes';

export type FinalDomainStatus =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export type FinalDomainConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type SynthesisAxisStatus =
  | 'SUPPORT'
  | 'CHALLENGE'
  | 'MIXED'
  | 'NEUTRAL'
  | 'INSUFFICIENT_DATA';

export type WealthRiskProfile =
  | 'LOW'
  | 'MODERATE'
  | 'ELEVATED'
  | 'HIGH'
  | 'INSUFFICIENT_DATA';

/**
 * CW-05 risk is a qualitative interpretation of the speculation dimension.
 * It is deliberately not a probability of a financial outcome.
 */
export type WealthRiskReasonCode =
  | 'SPECULATION_NATAL_UNAVAILABLE'
  | 'SPECULATION_CORROBORATION_UNAVAILABLE'
  | 'SPECULATION_CHALLENGED'
  | 'SPECULATION_MIXED'
  | 'SPECULATION_SUPPORTED'
  | 'SPECULATION_TIMING_CHALLENGE'
  | 'D2_UNAVAILABLE'
  | 'CONFLICTING_SPECULATION_EVIDENCE'
  | 'EVIDENCE_IDS_UNAVAILABLE';

export interface WealthRiskQualification {
  readonly classification: WealthRiskProfile;
  readonly dimension: 'SPECULATION';
  readonly evidenceCoverage: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly evidenceFamilies: Readonly<{
    natal: 'AVAILABLE' | 'UNAVAILABLE';
    timing: 'AVAILABLE' | 'UNAVAILABLE';
    manifestation: 'AVAILABLE' | 'UNAVAILABLE';
    d2: 'AVAILABLE' | 'UNAVAILABLE';
  }>;
  readonly missingRequiredEvidenceFamilies: readonly ('NATAL' | 'CORROBORATION')[];
  readonly conflictingEvidence: boolean;
  readonly d2Availability: 'AVAILABLE' | 'UNAVAILABLE';
  readonly evidenceIds: readonly string[];
  readonly reasonCodes: readonly WealthRiskReasonCode[];
  readonly reasons: readonly string[];
}

export type AstrologicalSpeculativePropensity =
  | 'VERY_STRONG'
  | 'STRONG'
  | 'MODERATE'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_DATA';

export interface FinalSynthesisEvidence {
  readonly id: string;
  readonly source: 'NATAL' | 'DASHA' | 'TRANSIT' | 'D10' | 'D2' | 'MANIFESTATION';
  readonly direction: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly statement: string;
  readonly evidenceIds: readonly string[];
  readonly priority: 'PRIMARY' | 'SECONDARY' | 'REFINEMENT';
}

export interface FinalSynthesisActivationHierarchy {
  readonly md: {
    readonly effect: CareerDashaEffect | string;
    readonly role: 'PRIMARY';
  };
  readonly ad: {
    readonly effect: CareerDashaEffect | string;
    readonly role: 'MODIFIER';
  };
  readonly pd: {
    readonly effect: CareerDashaEffect | string;
    readonly role: 'REFINEMENT';
  };
}

export type FinalConfidenceEvidenceQuality = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_APPLICABLE';

export interface FinalConfidenceBreakdownSummary {
  readonly final: FinalDomainConfidence;
  readonly natalEvidenceQuality: FinalConfidenceEvidenceQuality;
  readonly activationQuality: FinalConfidenceEvidenceQuality;
  readonly timingQuality: FinalConfidenceEvidenceQuality;
  readonly divisionalQuality: FinalConfidenceEvidenceQuality;
  readonly manifestationQuality: FinalConfidenceEvidenceQuality;
  readonly evidenceCoverage: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly contradictionLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  readonly dashaConsistency: 'CONSISTENT' | 'INCONSISTENT' | 'UNAVAILABLE';
  readonly consistencyCapApplied: boolean;
  readonly reasons: readonly string[];
}

export interface ManifestationSummary {
  readonly mode: string;
  readonly status: ManifestationStatus | WealthManifestationStatus;
  readonly confidence: FinalDomainConfidence;
}

export interface WealthDimensionFinalSynthesis {
  readonly dimension?: WealthDimension;
  readonly status: FinalDomainStatus;
  readonly finalStatus: FinalDomainStatus;
  readonly promiseStatus: FinalDomainStatus;
  readonly activationStatus: SynthesisAxisStatus;
  readonly activationConfidence?: FinalDomainConfidence;
  readonly activationStrength?: number;
  readonly activationSummary?: string;
  readonly activationHierarchy?: FinalSynthesisActivationHierarchy;
  readonly timingStatus: SynthesisAxisStatus;
  readonly divisionalStatus: VargaRelationship;
  readonly manifestationStatus: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
  readonly confidenceBreakdown?: FinalConfidenceBreakdownSummary;
  readonly primaryPromise: DomainStrength;
  readonly dashaEffect: string;
  readonly timingEffect: string;
  readonly divisionalEffect: string;
  readonly summary: string;
  readonly ruleIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly natalEvidenceIds: readonly string[];
  readonly natalRuleIds: readonly string[];
}

export interface CareerWealthFinalSynthesis {
  readonly reasoningVersion: 'CW-05';
  readonly domain: 'CAREER' | 'WEALTH';
  readonly status: FinalDomainStatus;
  readonly finalStatus: FinalDomainStatus;
  readonly promiseStatus: FinalDomainStatus;
  readonly activationStatus: SynthesisAxisStatus;
  readonly activationConfidence?: FinalDomainConfidence;
  readonly activationStrength?: number;
  readonly activationSummary?: string;
  readonly activationHierarchy?: FinalSynthesisActivationHierarchy;
  readonly timingStatus: SynthesisAxisStatus;
  readonly divisionalStatus: VargaRelationship;
  readonly d2AvailabilityReason?: string;
  readonly manifestationStatus: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
  readonly confidenceBreakdown?: FinalConfidenceBreakdownSummary;
  readonly primaryPromise: DomainStrength | string;
  readonly manifestationSummary: readonly ManifestationSummary[];
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
  readonly natalEvidenceIds: readonly string[];
  readonly natalRuleIds: readonly string[];
  readonly dimensions?: Readonly<Record<WealthDimension, WealthDimensionFinalSynthesis>>;
  /** Chart-derived indication only; never a measure of actual exposure or suitability. */
  readonly speculativePropensity?: AstrologicalSpeculativePropensity;
  readonly riskProfile?: WealthRiskProfile;
  readonly riskQualification?: WealthRiskQualification;
  readonly primaryStrength?: DomainStrength;
  readonly secondaryStrengths?: readonly WealthDimension[];
  readonly d10Evidence?: readonly DomainEvidence[];
  readonly d2Evidence?: readonly DomainEvidence[];
  readonly dashaFactors?: readonly any[];
  readonly timingFactors?: readonly any[];
  readonly manifestationFactors?: readonly any[];
}

/**
 * @deprecated Use CareerFinalSynthesisInput from src/domain/career/careerFinalSynthesis/careerFinalSynthesisTypes.ts instead.
 * This type is kept for legacy compatibility contract retained during C11 migration.
 * The runtime still uses this legacy synthesis; the canonical C11 boundary will be wired in a future patch.
 */
export interface CareerFinalSynthesisInput {
  readonly natalPromise: DomainStrength;
  readonly dashaSynthesis?: CareerDashaSynthesis;
  readonly timingSynthesis?: CareerTimingSynthesis;
  readonly manifestationSynthesis?: readonly CareerManifestationSynthesis[];
  readonly d10Synthesis?: readonly DomainEvidence[];
  readonly d10Relationship?: VargaRelationship;
  readonly natalEvidenceIds?: readonly string[];
  readonly natalRuleIds?: readonly string[];
}

export interface WealthFinalSynthesisInput {
  readonly natalPromise: Partial<Record<WealthDimension, DomainStrength>>;
  readonly timingSynthesis?: WealthTimingSynthesis;
  readonly manifestationSynthesis?: WealthManifestationSynthesis;
  readonly d2Synthesis?: readonly DomainEvidence[];
  readonly d2Relationship?: VargaRelationship;
  readonly natalEvidenceIds?: Partial<Record<WealthDimension, readonly string[]>> | readonly string[];
  readonly natalRuleIds?: Partial<Record<WealthDimension, readonly string[]>> | readonly string[];
}
