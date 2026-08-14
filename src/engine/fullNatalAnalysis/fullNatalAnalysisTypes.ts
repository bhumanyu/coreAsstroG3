/** READ-ONLY FULL NATAL ANALYSIS REPORT LAYER. MUST NOT RECALCULATE ASTROLOGY OR PRODUCE NUMERIC SCORES/PROBABILITIES/PREDICTIONS. */

import {
  Planet,
  Sign,
  BirthDetails,
  FunctionalRole,
  InterpretationConfidence,
  DignityStatus,
  PlanetState,
  NakshatraResult,
  NakshatraMetadata,
  NatalGrahaDrishti,
  Horoscope,
  LifeThemeReport,
  ChartSynthesisReport,
  LifeTheme,
  ThemeSynthesis,
  SynthesisObservation
} from '../../types';
import { YogaCategory, YogaType, YogaEvidence, YogaModifier } from '../yoga/yogaTypes';
import { DivisionalInterpretationEvidence, DivisionalDomainMetadata } from '../divisionalInterpretation/divisionalInterpretationTypes';
import { DashaBirthAnchor, ActiveDashaInterpretation, DashaMahadashaInterpretation } from '../dashaInterpretation/dashaInterpretationTypes';
import type { CareerThemeInterpretation } from '../themeInterpretation/themeInterpretationTypes';
import type { WealthThemeInterpretation } from '../themeInterpretation/wealthThemeInterpretationTypes';

export type AnalysisAvailability = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';

export interface BirthInformationSection {
  readonly status: AnalysisAvailability;
  readonly details: BirthDetails;
}

export interface MethodologySection {
  readonly status: AnalysisAvailability;
  readonly zodiac: 'SIDEREAL' | string;
  readonly ayanamsa: 'LAHIRI' | string;
  readonly houseSystem: 'WHOLE_SIGN' | string;
  readonly dashaSystem: 'VIMSHOTTARI' | string;
  readonly aspectSystem: 'PARASHARI' | string;
  readonly divisionalCharts: readonly string[];
  readonly limitations?: readonly string[];
}

export interface ExecutiveSummarySection {
  readonly status: AnalysisAvailability;
  readonly headline: string;
  readonly overallConclusion: string;
  readonly overallConfidence: InterpretationConfidence;
  readonly strongestThemes: readonly LifeTheme[];
  readonly challengedThemes: readonly LifeTheme[];
  readonly mixedThemes: readonly LifeTheme[];
  readonly keyObservations: readonly SynthesisObservation[];
}

export interface AscendantSection {
  readonly status: AnalysisAvailability;
  readonly sign?: Sign;
  readonly longitude?: number;
  readonly lord?: Planet;
  readonly lordHouse?: number;
  readonly lordSign?: Sign;
  readonly occupants: readonly Planet[];
  readonly receivedAspects: readonly NatalGrahaDrishti[];
}

export interface PlanetReportItem {
  readonly planet: Planet;
  readonly sign: Sign;
  readonly house: number;
  readonly longitude: number;
  readonly nakshatraResult: NakshatraResult;
  readonly nakshatraMetadata: NakshatraMetadata;
  readonly dignity: DignityStatus;
  readonly state: PlanetState;
  readonly functionalRoles: readonly FunctionalRole[];
  readonly receivedAspects: readonly NatalGrahaDrishti[];
  readonly castAspects: readonly NatalGrahaDrishti[];
  readonly evidence: readonly any[];
}

export interface PlanetAnalysisSection {
  readonly status: AnalysisAvailability;
  readonly planets: readonly PlanetReportItem[];
}

export interface HouseReportItem {
  readonly house: number;
  readonly sign: Sign;
  readonly lord: Planet;
  readonly lordHouse?: number;
  readonly lordSign?: Sign;
  readonly occupants: readonly Planet[];
  readonly receivedAspects: readonly any[];
  readonly evidence: readonly any[];
}

export interface HouseAnalysisSection {
  readonly status: AnalysisAvailability;
  readonly houses: readonly HouseReportItem[];
}

export interface FunctionalRoleReportItem {
  readonly planet: Planet;
  readonly ownedHouses: readonly number[];
  readonly roles: readonly FunctionalRole[];
  readonly functionalNature: string;
  readonly isYogakaraka: boolean;
  readonly evidence: readonly any[];
}

export interface FunctionalRolesSection {
  readonly status: AnalysisAvailability;
  readonly ascendantSign?: Sign;
  readonly badhakaHouse?: number;
  readonly badhakaLord?: Planet;
  readonly items: readonly FunctionalRoleReportItem[];
}

export interface YogaReportItem {
  readonly type: YogaType;
  readonly category: YogaCategory;
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  readonly strength?: string;
  readonly planets: readonly Planet[];
  readonly houses: readonly number[];
  readonly supportingFactors?: readonly YogaModifier[];
  readonly weakeningFactors?: readonly YogaModifier[];
  readonly cancellationFactors?: readonly YogaModifier[];
  readonly evidence: readonly YogaEvidence[];
}

export interface YogasSection {
  readonly status: AnalysisAvailability;
  readonly detected: readonly YogaReportItem[];
  readonly strong: readonly YogaReportItem[];
  readonly weakened: readonly YogaReportItem[];
  readonly cancelled: readonly YogaReportItem[];
  readonly neutral: readonly YogaReportItem[];
}

export interface PlanetaryStrengthReportItem {
  readonly planet: Planet;
  readonly components: readonly any[];
  /** Upstream Shadbala total; not a P-21 synthesis score. */
  readonly calculatedTotal?: number;
  readonly shadbalaStatus?: string;
  readonly meetsMinimum?: boolean;
}

export interface PlanetaryStrengthSection {
  readonly status: AnalysisAvailability;
  readonly planets: readonly PlanetaryStrengthReportItem[];
}

export interface DivisionalReportItem {
  readonly varga: 'D9' | 'D10';
  readonly ascendantSign: Sign;
  readonly houseLords: Readonly<Record<number, Planet>>;
  readonly domainMetadata?: Readonly<Record<number, DivisionalDomainMetadata>>;
  readonly evidence: readonly DivisionalInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
}

export interface D9Section {
  readonly status: AnalysisAvailability;
  readonly details?: DivisionalReportItem;
}

export interface D10Section {
  readonly status: AnalysisAvailability;
  readonly details?: DivisionalReportItem;
}

export interface VimshottariSection {
  readonly status: AnalysisAvailability;
  readonly birthAnchor?: DashaBirthAnchor;
  readonly confidence?: InterpretationConfidence;
  readonly mahadashas?: readonly DashaMahadashaInterpretation[];
}

export interface CurrentDashaSection {
  readonly status: AnalysisAvailability;
  readonly current?: ActiveDashaInterpretation;
}

export interface CurrentTransitSection {
  readonly status: AnalysisAvailability;
  readonly reason: string;
}

export interface LifeThemesSection {
  readonly status: AnalysisAvailability;
  readonly themes: readonly ThemeSynthesis[];
  readonly synthesis: readonly SynthesisObservation[];
  readonly career?: CareerThemeInterpretation;
  readonly wealth?: WealthThemeInterpretation;
}

export interface MajorLifePeriod {
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly primaryFocusHouses: readonly number[];
  readonly keyThemes: readonly LifeTheme[];
  readonly confidence: InterpretationConfidence;
}

export interface MajorLifePeriodsSection {
  readonly status: AnalysisAvailability;
  readonly periods: readonly MajorLifePeriod[];
}

export interface OverallSynthesisSection {
  readonly status: AnalysisAvailability;
  readonly overallConclusion: string;
  readonly overallConfidence: InterpretationConfidence;
  readonly strongestThemes: readonly LifeTheme[];
  readonly challengedThemes: readonly LifeTheme[];
  readonly mixedThemes: readonly LifeTheme[];
  readonly repeatedSupportThemes: readonly LifeTheme[];
  readonly timingDependentThemes: readonly LifeTheme[];
  readonly keyObservations: readonly SynthesisObservation[];
}

export interface FullNatalAnalysisInput {
  readonly horoscope: Horoscope;
  readonly lifeThemes: LifeThemeReport;
  readonly chartSynthesis: ChartSynthesisReport;
}

export interface FullNatalAnalysisReport {
  readonly version: 'P-21-v1';
  readonly birthInformation: BirthInformationSection;
  readonly methodology: MethodologySection;
  readonly executiveSummary: ExecutiveSummarySection;
  readonly ascendant: AscendantSection;
  readonly planets: PlanetAnalysisSection;
  readonly houses: HouseAnalysisSection;
  readonly functionalRoles: FunctionalRolesSection;
  readonly yogas: YogasSection;
  readonly planetaryStrength: PlanetaryStrengthSection;
  readonly d9: D9Section;
  readonly d10: D10Section;
  readonly vimshottari: VimshottariSection;
  readonly currentDasha: CurrentDashaSection;
  readonly currentTransit: CurrentTransitSection;
  readonly lifeThemes: LifeThemesSection;
  readonly majorLifePeriods: MajorLifePeriodsSection;
  readonly overallSynthesis: OverallSynthesisSection;
}
