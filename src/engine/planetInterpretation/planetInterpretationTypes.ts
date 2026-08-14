import {
  Planet,
  Sign,
  Nakshatra,
  Pada,
  PlanetFact,
  PlanetFacts,
  NatalGrahaDrishtiReport,
  PlanetAnalysisReport,
  PlanetaryStrengthReport,
  ShadbalaAggregationStatus,
  AspectType
} from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { FunctionalNature } from '../functionalNature/functionalNature';
import {
  YogaAnalysisReport,
  YogaStrengthLevel,
  YogaStrength,
  YogaType,
  YogaCategory
} from '../yoga/yogaTypes';

export type PlanetInterpretationEvidenceType =
  | 'PLACEMENT'
  | 'FUNCTIONAL_ROLE'
  | 'DIGNITY'
  | 'STATE'
  | 'STRENGTH'
  | 'DRISHTI_RECEIVED'
  | 'DRISHTI_CAST'
  | 'YOGA'
  | 'NAKSHATRA'
  | 'NATURAL_RELATIONSHIP'
  | 'CONJUNCTION';

export interface PlanetInterpretationEvidence {
  readonly ruleId: string;
  readonly type: PlanetInterpretationEvidenceType;
  readonly planet: Planet;
  readonly houses?: readonly number[];
  readonly relatedPlanets?: readonly Planet[];
  readonly statement: string;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly source?: string;
}

export type InterpretationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PlanetPlacementInterpretation {
  readonly sign: Sign;
  readonly house: number;
  readonly eclipticLongitude: number;
  readonly nakshatra: Nakshatra;
  readonly pada: Pada;
}

export interface PlanetRoleInterpretation {
  readonly ownedHouses: readonly number[];
  readonly roles: readonly FunctionalRole[];
  readonly functionalNature: FunctionalNature;
}

export interface PlanetStrengthInterpretation {
  readonly availability: 'AVAILABLE' | 'INCOMPLETE';
  readonly shadbalaStatus?: ShadbalaAggregationStatus;
  readonly totalRupa?: number;
  readonly totalShastiamsa?: number;
  readonly percentageOfMinimum?: number;
  readonly meetsMinimum?: boolean;
  readonly missingComponents?: readonly string[];
}

export interface ReceivedDrishtiAspect {
  readonly sourcePlanet: Planet;
  readonly aspectType: AspectType;
  readonly sourceHouse: number;
  readonly targetHouse: number;
}

export interface CastDrishtiAspect {
  readonly targetPlanet: Planet;
  readonly targetHouse: number;
  readonly aspectType: AspectType;
}

export interface PlanetDrishtiInterpretation {
  readonly received: readonly ReceivedDrishtiAspect[];
  readonly cast: readonly CastDrishtiAspect[];
}

export interface PlanetYogaItem {
  readonly type: YogaType;
  readonly category: YogaCategory;
  readonly strength: YogaStrengthLevel | YogaStrength;
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
}

export interface PlanetNakshatraInterpretation {
  readonly name: Nakshatra;
  readonly pada: Pada;
  readonly lord: Planet;
}

export interface PlanetInterpretationSummary {
  readonly primaryFactors: readonly string[];
  readonly supportingFactors: readonly string[];
  readonly challengingFactors: readonly string[];
  readonly unresolvedFactors: readonly string[];
}

export interface PlanetInterpretation {
  readonly planet: Planet;
  readonly summary: PlanetInterpretationSummary;
  readonly placement: PlanetPlacementInterpretation;
  readonly house?: number;
  readonly functionalRole: PlanetRoleInterpretation;
  readonly strength: PlanetStrengthInterpretation;
  readonly drishti: PlanetDrishtiInterpretation;
  readonly yogas: readonly PlanetYogaItem[];
  readonly nakshatra: PlanetNakshatraInterpretation;
  readonly evidence: readonly PlanetInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
}

export interface PlanetInterpretationReport {
  readonly planets: Readonly<Record<Planet, PlanetInterpretation>>;
}

export interface PlanetInterpretationInput {
  readonly planetFacts: Readonly<Record<Planet, PlanetFact>> | Readonly<PlanetFacts>;
  readonly planetAnalysis: PlanetAnalysisReport;
  readonly functionalRoles: FunctionalRoleAnalysisReport;
  readonly natalGrahaDrishti: NatalGrahaDrishtiReport;
  readonly yogas: YogaAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
}
