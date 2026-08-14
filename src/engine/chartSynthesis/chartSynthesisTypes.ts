/** READ-ONLY CHART SYNTHESIS LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import { Planet } from '../../types';
import { LifeTheme, LifeThemeReport } from '../lifeThemes/lifeThemeTypes';
import { InterpretationConfidence } from '../planetInterpretation/planetInterpretationTypes';

export type SynthesisState =
  | 'STRONGLY_SUPPORTED'
  | 'SUPPORTED'
  | 'MIXED'
  | 'CHALLENGED'
  | 'INSUFFICIENT_EVIDENCE';

export type SynthesisEvidenceFamily =
  | 'STRUCTURAL'
  | 'PLANETARY'
  | 'YOGA'
  | 'DIVISIONAL'
  | 'DASHA';

export interface SynthesisEvidence {
  readonly id: string;
  readonly sourceEvidenceId: string;
  readonly theme: LifeTheme;
  readonly source: 'LIFE_THEME' | 'CROSS_THEME' | 'DASHA' | 'DIVISIONAL' | 'YOGA' | 'PLANET' | 'HOUSE';
  readonly family: SynthesisEvidenceFamily;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly statement: string;
  readonly ruleId: string;
  readonly sourceReference?: string;
  readonly planets: readonly Planet[];
  readonly houses: readonly number[];
  readonly varga?: 'D1' | 'D9' | 'D10';
  readonly dashaLevel?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT';
}

export interface SynthesisObservation {
  readonly id: string;
  readonly type:
    | 'REPEATED_SUPPORT'
    | 'CROSS_THEME_SUPPORT'
    | 'CROSS_THEME_CONFLICT'
    | 'TIMING_DEPENDENT'
    | 'LIMITED_EVIDENCE';
  readonly summary: string;
  readonly relatedThemes: readonly LifeTheme[];
  readonly evidenceReferences: readonly string[];
}

export interface ThemeSynthesis {
  readonly theme: LifeTheme;
  readonly label: string;
  readonly state: SynthesisState;
  readonly confidence: InterpretationConfidence;
  readonly repeatedSupport: boolean;
  readonly conflictingIndicators: boolean;
  readonly timingDependent: boolean;
  readonly supportingFactors: readonly SynthesisEvidence[];
  readonly weakeningFactors: readonly SynthesisEvidence[];
  readonly timingFactors: readonly SynthesisEvidence[];
  readonly evidence: readonly SynthesisEvidence[];
  readonly evidenceFamiliesPresent: readonly SynthesisEvidenceFamily[];
  readonly relevantPlanets: readonly Planet[];
  readonly relevantHouses: readonly number[];
  readonly relevantVargas: readonly ('D1' | 'D9' | 'D10')[];
  readonly relevantDashaLevels: readonly (
    | 'MAHADASHA'
    | 'ANTARDASHA'
    | 'PRATYANTARDASHA'
    | 'PAIR'
    | 'CURRENT'
  )[];
  readonly conclusion: string;
}

export interface ChartSynthesisReport {
  readonly themes: readonly ThemeSynthesis[];
  readonly strongestThemes: readonly ThemeSynthesis[];
  readonly weakestThemes: readonly ThemeSynthesis[];
  readonly mixedThemes: readonly ThemeSynthesis[];
  readonly repeatedSupportThemes: readonly ThemeSynthesis[];
  readonly timingDependentThemes: readonly ThemeSynthesis[];
  readonly keyObservations: readonly SynthesisObservation[];
  readonly overallConfidence: InterpretationConfidence;
  readonly overallConclusion: string;
}

export interface ChartSynthesisInput {
  readonly lifeThemes: LifeThemeReport;
}
