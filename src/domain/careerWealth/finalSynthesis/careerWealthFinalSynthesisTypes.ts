import type { DomainStrength } from '../../reasoning/reasoningTypes';
import type { VargaRelationship } from '../../interpretation/DomainInterpretationTypes';
import type { DomainEvidence } from '../../interpretation/DomainEvidence';
import type { CareerDashaSynthesis } from '../../career/careerDasha/careerDashaSynthesisTypes';
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

export interface ManifestationSummary {
  readonly mode: string;
  readonly status: ManifestationStatus | WealthManifestationStatus;
  readonly confidence: FinalDomainConfidence;
}

export interface WealthDimensionFinalSynthesis {
  readonly status: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
  readonly primaryPromise: DomainStrength;
  readonly dashaEffect: string;
  readonly timingEffect: string;
  readonly divisionalEffect: string;
  readonly summary: string;
  readonly evidenceIds: readonly string[];
}

export interface CareerWealthFinalSynthesis {
  readonly reasoningVersion: 'CW-05';
  readonly domain: 'CAREER' | 'WEALTH';
  readonly status: FinalDomainStatus;
  readonly confidence: FinalDomainConfidence;
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
  readonly dimensions?: Readonly<Record<WealthDimension, WealthDimensionFinalSynthesis>>;
  readonly riskProfile?: WealthRiskProfile;
}

export interface CareerFinalSynthesisInput {
  readonly natalPromise: DomainStrength;
  readonly dashaSynthesis?: CareerDashaSynthesis;
  readonly timingSynthesis?: CareerTimingSynthesis;
  readonly manifestationSynthesis: readonly CareerManifestationSynthesis[];
  readonly d10Synthesis?: readonly DomainEvidence[];
  readonly d10Relationship?: VargaRelationship;
}

export interface WealthFinalSynthesisInput {
  readonly natalPromise: Partial<Record<WealthDimension, DomainStrength>>;
  readonly timingSynthesis?: WealthTimingSynthesis;
  readonly manifestationSynthesis: WealthManifestationSynthesis;
  readonly d2Synthesis?: readonly DomainEvidence[];
  readonly d2Relationship?: VargaRelationship;
}
