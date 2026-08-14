import type { Planet } from '../../types';
import type { ThemeInterpretationContext } from './themeInterpretationContext';
import type {
  ThemeEvidenceEffect,
  ThemeEvidenceStrength,
  ThemeEvidencePriority,
  EvidenceConfidence,
  ThemeEvidenceFactor,
  VargaRelationship,
  ThemeInterpretationEvidence,
  ThemeRuleResult,
  ThemeRule,
  EvidenceFamilySummary
} from './themeInterpretationTypes';

export interface WealthTimingEvidence {
  readonly dashaLevel: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  readonly planet: Planet;
  readonly relevanceReason: string;
  readonly houses: readonly number[];
  readonly relevanceType?: 'WEALTH_LORD' | 'WEALTH_HOUSE_OCCUPANT' | 'WEALTH_HOUSE_ASPECT' | 'WEALTH_LORD_ASPECT';
}

export enum WealthEvidenceFamily {
  SECOND_HOUSE = 'SECOND_HOUSE',
  SECOND_LORD = 'SECOND_LORD',
  FIFTH_HOUSE = 'FIFTH_HOUSE',
  FIFTH_LORD = 'FIFTH_LORD',
  NINTH_HOUSE = 'NINTH_HOUSE',
  NINTH_LORD = 'NINTH_LORD',
  ELEVENTH_HOUSE = 'ELEVENTH_HOUSE',
  ELEVENTH_LORD = 'ELEVENTH_LORD',
  JUPITER = 'JUPITER',
  VENUS = 'VENUS',
  MERCURY = 'MERCURY',
  FUNCTIONAL_ROLE = 'FUNCTIONAL_ROLE',
  PLANETARY_STRENGTH = 'PLANETARY_STRENGTH',
  ASPECT = 'ASPECT',
  YOGA = 'YOGA',
  D2 = 'D2',
  DASHA = 'DASHA',
  TRANSIT = 'TRANSIT'
}

export const WEALTH_FAMILY_RANK: Record<WealthEvidenceFamily, number> = {
  [WealthEvidenceFamily.SECOND_HOUSE]: 0,
  [WealthEvidenceFamily.SECOND_LORD]: 1,
  [WealthEvidenceFamily.ELEVENTH_HOUSE]: 2,
  [WealthEvidenceFamily.ELEVENTH_LORD]: 3,
  [WealthEvidenceFamily.NINTH_HOUSE]: 4,
  [WealthEvidenceFamily.NINTH_LORD]: 5,
  [WealthEvidenceFamily.FIFTH_HOUSE]: 6,
  [WealthEvidenceFamily.FIFTH_LORD]: 7,
  [WealthEvidenceFamily.JUPITER]: 8,
  [WealthEvidenceFamily.VENUS]: 9,
  [WealthEvidenceFamily.MERCURY]: 10,
  [WealthEvidenceFamily.FUNCTIONAL_ROLE]: 11,
  [WealthEvidenceFamily.PLANETARY_STRENGTH]: 12,
  [WealthEvidenceFamily.ASPECT]: 13,
  [WealthEvidenceFamily.YOGA]: 14,
  [WealthEvidenceFamily.D2]: 15,
  [WealthEvidenceFamily.DASHA]: 16,
  [WealthEvidenceFamily.TRANSIT]: 17
};

export type WealthSubthemeKey = 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';

export interface WealthSubthemeSummary {
  readonly key: WealthSubthemeKey;
  readonly title: string;
  readonly houseNumber: number;
  readonly primaryFamily: WealthEvidenceFamily;
  readonly lordFamily: WealthEvidenceFamily;
  readonly status: 'SUPPORT' | 'CHALLENGE' | 'MIXED' | 'NEUTRAL';
  readonly supportingEvidenceCount: number;
  readonly challengingEvidenceCount: number;
  readonly summaryStatement: string;
}

export type WealthThemeStatus =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'LIMITED_EVIDENCE';

export interface WealthInterpretationConclusion {
  readonly status: WealthThemeStatus;
  readonly confidence: EvidenceConfidence;
  readonly summary: string;
  readonly keySupportingFactors: readonly string[];
  readonly keyChallengingFactors: readonly string[];
  readonly keyConditionalFactors: readonly string[];
}

export interface WealthNatalPromise {
  readonly status: 'STRONG' | 'SUPPORTED' | 'MIXED' | 'ADVERSE' | 'UNAVAILABLE';
  readonly structuralEvidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[];
  readonly primarySupport: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[];
  readonly primaryChallenges: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[];
  readonly evidenceConfidence: EvidenceConfidence;
}

export interface WealthThemeInterpretationMetadata {
  readonly evaluatedRulesCount: number;
  readonly triggeredRulesCount: number;
  readonly evidenceItemCount: number;
  readonly evidenceFamiliesRepresented: readonly WealthEvidenceFamily[];
  readonly vargaConfirmationStatus: VargaRelationship;
  readonly yogaConfirmationStatus: 'CONFIRMS' | 'ABSENT' | 'UNAVAILABLE';
  readonly dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  readonly ruleErrors?: readonly { readonly ruleId: string; readonly error: string }[];
}

export interface WealthThemeInterpretation {
  readonly theme: 'WEALTH_PROSPERITY';
  readonly conclusion: WealthInterpretationConclusion;
  readonly wealthNatalPromise: WealthNatalPromise;
  readonly evidence: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[];
  readonly groupedEvidence: Readonly<Partial<Record<WealthEvidenceFamily, readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]>>>;
  readonly familySummaries: Readonly<Partial<Record<WealthEvidenceFamily, EvidenceFamilySummary<WealthEvidenceFamily>>>>;
  readonly subthemes: Readonly<Record<WealthSubthemeKey, WealthSubthemeSummary>>;
  readonly metadata: WealthThemeInterpretationMetadata;
}

export type WealthEvidence = ThemeInterpretationEvidence<WealthEvidenceFamily>;
export type WealthRule = ThemeRule<WealthEvidenceFamily, ThemeInterpretationContext, WealthNatalPromise | undefined>;
export type WealthEvidenceFamilySummary = EvidenceFamilySummary<WealthEvidenceFamily>;
