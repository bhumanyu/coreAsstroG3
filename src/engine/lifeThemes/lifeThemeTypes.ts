import { Planet, NatalGrahaDrishtiReport } from '../../types';
import {
  InterpretationConfidence,
  PlanetInterpretationReport
} from '../planetInterpretation/planetInterpretationTypes';
import { HouseInterpretationReport } from '../houseInterpretation/houseInterpretationTypes';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { YogaAnalysisReport, YogaStrengthLevel } from '../yoga/yogaTypes';
import { DashaInterpretationReport } from '../dashaInterpretation/dashaInterpretationTypes';
import { DivisionalInterpretationReport } from '../divisionalInterpretation/divisionalInterpretationTypes';

export enum LifeTheme {
  SELF_IDENTITY = 'SELF_IDENTITY',
  FAMILY_HOME = 'FAMILY_HOME',
  WEALTH_FINANCE = 'WEALTH_FINANCE',
  COMMUNICATION = 'COMMUNICATION',
  CHILDREN_CREATIVITY = 'CHILDREN_CREATIVITY',
  HEALTH_SERVICE = 'HEALTH_SERVICE',
  PARTNERSHIP = 'PARTNERSHIP',
  TRANSFORMATION = 'TRANSFORMATION',
  DHARMA_BELIEFS = 'DHARMA_BELIEFS',
  CAREER_STATUS = 'CAREER_STATUS',
  NETWORKS_GAINS = 'NETWORKS_GAINS',
  SPIRITUALITY_RELEASE = 'SPIRITUALITY_RELEASE'
}

export type LifeThemeEvidenceSource =
  | 'PLANET_INTERPRETATION'
  | 'HOUSE_INTERPRETATION'
  | 'FUNCTIONAL_ROLE'
  | 'YOGA'
  | 'NATAL_DRISHTI'
  | 'DASHA_INTERPRETATION'
  | 'D9_INTERPRETATION'
  | 'D10_INTERPRETATION'
  | 'DOMAIN_METADATA';

export type LifeThemeEvidenceEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';

export interface LifeThemeEvidence {
  readonly ruleId: string;
  readonly source: LifeThemeEvidenceSource;
  readonly theme: LifeTheme;
  readonly statement: string;
  readonly effect: LifeThemeEvidenceEffect;
  readonly sourceReference?: string;
  readonly planets?: readonly Planet[];
  readonly houses?: readonly number[];
  readonly varga?: 'D9' | 'D10';
  readonly dashaLevel?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT';
  readonly yogaStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  readonly yogaStrength?: YogaStrengthLevel;
  readonly functionalRole?: FunctionalRole;
}

export interface LifeThemeAnalysis {
  readonly theme: LifeTheme;
  readonly label: string;
  readonly description: string;
  readonly effect: LifeThemeEvidenceEffect;
  readonly confidence: InterpretationConfidence;
  readonly evidenceCount: number;
  readonly evidence: readonly LifeThemeEvidence[];
}

export interface LifeThemeReport {
  readonly themes: readonly LifeThemeAnalysis[];
  readonly confidence: InterpretationConfidence;
}

export interface LifeThemeInput {
  readonly planetInterpretation: PlanetInterpretationReport;
  readonly houseInterpretation: HouseInterpretationReport;
  readonly functionalRoles: FunctionalRoleAnalysisReport;
  readonly yogas: YogaAnalysisReport;
  readonly natalGrahaDrishti: NatalGrahaDrishtiReport;
  readonly dashaInterpretation: DashaInterpretationReport;
  readonly divisionalInterpretation: DivisionalInterpretationReport;
}
