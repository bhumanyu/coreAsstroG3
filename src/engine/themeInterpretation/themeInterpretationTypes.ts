import { Planet } from '../../types';
import { ThemeInterpretationContext } from './themeInterpretationContext';

export type ThemeEvidenceEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type ThemeEvidenceStrength = 'WEAK' | 'MODERATE' | 'STRONG';

export type ThemeEvidencePriority = 'PRIMARY' | 'SECONDARY' | 'CONFIRMATORY' | 'TIMING';

export type EvidenceConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ThemeEvidenceFactor {
  readonly label: string;
  readonly value: string;
  readonly role: 'PRIMARY' | 'MODIFIER' | 'CONFIRMATION' | 'CONFLICT';
}

export enum CareerEvidenceFamily {
  TENTH_HOUSE = 'TENTH_HOUSE',
  TENTH_LORD = 'TENTH_LORD',
  SIXTH_HOUSE = 'SIXTH_HOUSE',
  SIXTH_LORD = 'SIXTH_LORD',
  SECOND_HOUSE = 'SECOND_HOUSE',
  SECOND_LORD = 'SECOND_LORD',
  ELEVENTH_HOUSE = 'ELEVENTH_HOUSE',
  ELEVENTH_LORD = 'ELEVENTH_LORD',
  SUN = 'SUN',
  SATURN = 'SATURN',
  MERCURY = 'MERCURY',
  MARS = 'MARS',
  JUPITER = 'JUPITER',
  FUNCTIONAL_ROLE = 'FUNCTIONAL_ROLE',
  PLANETARY_STRENGTH = 'PLANETARY_STRENGTH',
  ASPECT = 'ASPECT',
  YOGA = 'YOGA',
  D10 = 'D10',
  DASHA = 'DASHA'
}

export type VargaRelationship =
  | 'CONFIRMS'
  | 'PARTIALLY_CONFIRMS'
  | 'MODIFIES'
  | 'CONFLICTS'
  | 'UNAVAILABLE';

export interface D10EvaluationDiagnostics {
  readonly d10Lord?: Planet;
  readonly d10LordHouse?: number;
  readonly d10LordDignity?: string;
  readonly natal10Lord?: Planet;
  readonly natal10LordHouse?: number;
  readonly natal10LordDignity?: string;
  readonly d10LordStrong?: boolean;
  readonly d10LordAdverse?: boolean;
  readonly natal10LordStrong?: boolean;
  readonly natal10LordAdverse?: boolean;
  readonly d10SupportFactors?: readonly string[];
  readonly d10ChallengeFactors?: readonly string[];
}

export interface VargaThemeEvidence {
  readonly varga:
    | 'D1'
    | 'D2'
    | 'D3'
    | 'D4'
    | 'D7'
    | 'D9'
    | 'D10'
    | 'D12'
    | 'D16'
    | 'D20'
    | 'D24'
    | 'D27'
    | 'D30'
    | 'D40'
    | 'D45'
    | 'D60'
    | string;
  readonly relationship: VargaRelationship;
  readonly statement: string;
  readonly effect: ThemeEvidenceEffect;
  readonly diagnostics?: D10EvaluationDiagnostics;
}

export interface ThemeTimingEvidence {
  readonly dashaLevel: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly planet: Planet;
  readonly relevanceReason: string;
  readonly houses: readonly number[];
  readonly relevanceType?: string;
}

export interface CareerTimingEvidence extends ThemeTimingEvidence {}

export interface ThemeInterpretationEvidence<TFamily extends string = string> {
  readonly id: string;
  readonly ruleId: string;
  readonly evidenceFamily: TFamily;
  readonly priority: ThemeEvidencePriority;
  readonly strength: ThemeEvidenceStrength;
  readonly effect: ThemeEvidenceEffect;
  readonly statement: string;
  readonly planets?: readonly Planet[];
  readonly houses?: readonly number[];
  readonly factors?: readonly ThemeEvidenceFactor[];
  readonly conditional?: boolean;
  readonly dimension?: 'NATAL_STRUCTURE' | 'MODIFIER' | 'CONFIRMATION' | 'TIMING';
  readonly vargaEvidence?: VargaThemeEvidence;
  readonly timingEvidence?: ThemeTimingEvidence;
}

export interface ThemeRuleResult<TFamily extends string = string> {
  readonly triggered: boolean;
  readonly evidence?: ThemeInterpretationEvidence<TFamily> | readonly ThemeInterpretationEvidence<TFamily>[];
}

export interface ThemeRule<TFamily extends string = string, TContext = ThemeInterpretationContext, TOptions = unknown> {
  readonly id: string;
  readonly evidenceFamily: TFamily;
  readonly priority: ThemeEvidencePriority;
  readonly evaluate: (context: TContext, options?: TOptions) => ThemeRuleResult<TFamily>;
}

export type CareerEvidence = ThemeInterpretationEvidence<CareerEvidenceFamily>;
export type CareerRule = ThemeRule<CareerEvidenceFamily, ThemeInterpretationContext, CareerNatalPromise | undefined>;
export type CareerEvidenceFamilySummary = EvidenceFamilySummary<CareerEvidenceFamily>;

export type CareerThemeStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED_EVIDENCE';

export interface CareerInterpretationConclusion {
  readonly status: CareerThemeStatus;
  readonly confidence: EvidenceConfidence;
  readonly summary: string;
  readonly keySupportingFactors: readonly string[];
  readonly keyChallengingFactors: readonly string[];
  readonly keyConditionalFactors: readonly string[];
}

export interface CareerThemeInterpretationMetadata {
  readonly evaluatedRulesCount: number;
  readonly triggeredRulesCount: number;
  readonly evidenceItemCount: number;
  readonly evidenceFamiliesRepresented: readonly CareerEvidenceFamily[];
  readonly vargaConfirmationStatus: VargaRelationship;
  readonly dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  readonly ruleErrors?: readonly { readonly ruleId: string; readonly error: string }[];
}

export interface EvidenceFamilySummary<TFamily extends string = string> {
  readonly family: TFamily;
  readonly supportingEvidence: readonly ThemeInterpretationEvidence<TFamily>[];
  readonly challengingEvidence: readonly ThemeInterpretationEvidence<TFamily>[];
  readonly neutralEvidence: readonly ThemeInterpretationEvidence<TFamily>[];
  readonly status: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
}

export interface CareerNatalPromise {
  readonly status: 'STRONG' | 'SUPPORTED' | 'MIXED' | 'ADVERSE' | 'UNAVAILABLE';
  readonly structuralEvidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[];
  readonly primarySupport: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[];
  readonly primaryChallenges: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[];
  readonly evidenceConfidence: EvidenceConfidence;
}

export interface CareerThemeInterpretation {
  readonly theme: 'CAREER_STATUS';
  readonly conclusion: CareerInterpretationConclusion;
  readonly careerNatalPromise: CareerNatalPromise;
  readonly evidence: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[];
  readonly groupedEvidence: Readonly<Partial<Record<CareerEvidenceFamily, readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]>>>;
  readonly familySummaries: Readonly<Partial<Record<CareerEvidenceFamily, EvidenceFamilySummary<CareerEvidenceFamily>>>>;
  readonly metadata: CareerThemeInterpretationMetadata;
}
