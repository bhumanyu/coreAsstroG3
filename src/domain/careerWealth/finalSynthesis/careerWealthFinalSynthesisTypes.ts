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

export interface FinalConfidenceBreakdownSummary {
  readonly final: FinalDomainConfidence;
  readonly natalEvidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly activationQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly timingQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly divisionalQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly manifestationQuality: 'HIGH' | 'MEDIUM' | 'LOW';
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
  readonly riskProfile?: WealthRiskProfile;
  readonly primaryStrength?: DomainStrength;
  readonly secondaryStrengths?: readonly WealthDimension[];
  readonly d10Evidence?: readonly DomainEvidence[];
  readonly d2Evidence?: readonly DomainEvidence[];
  readonly dashaFactors?: readonly any[];
  readonly timingFactors?: readonly any[];
  readonly manifestationFactors?: readonly any[];
}

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
