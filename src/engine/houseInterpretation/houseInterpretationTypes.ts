import {
  Planet,
  Sign,
  AspectType,
  HouseAnalysisReport,
  PlanetAnalysisReport,
  NatalGrahaDrishtiReport,
  PlanetaryStrengthReport
} from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { YogaType, YogaStrengthLevel, YogaAnalysisReport } from '../yoga/yogaTypes';
import {
  InterpretationConfidence,
  PlanetStrengthInterpretation,
  PlanetInterpretationReport
} from '../planetInterpretation/planetInterpretationTypes';

export type HouseInterpretationEvidenceType =
  | 'HOUSE_PLACEMENT'
  | 'HOUSE_LORD'
  | 'HOUSE_LORD_PLACEMENT'
  | 'HOUSE_LORD_DIGNITY'
  | 'HOUSE_LORD_STATE'
  | 'HOUSE_LORD_ROLE'
  | 'HOUSE_LORD_STRENGTH'
  | 'OCCUPANT'
  | 'OCCUPANT_ROLE'
  | 'OCCUPANT_DIGNITY'
  | 'ASPECT'
  | 'HOUSE_LORD_ASPECT'
  | 'YOGA'
  | 'KARAKA'
  | 'DOMAIN';

export interface HouseInterpretationEvidence {
  readonly ruleId: string;
  readonly type: HouseInterpretationEvidenceType;
  readonly house: number;
  readonly planets?: readonly Planet[];
  readonly relatedHouses?: readonly number[];
  readonly statement: string;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly source?: string;
}

export interface HousePlacementInterpretation {
  readonly sign: Sign;
  readonly signLord: Planet;
  readonly house: number;
}

export interface HouseYogaReference {
  readonly yogaType: YogaType;
  readonly yogaId?: string;
  readonly strength?: YogaStrengthLevel;
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  readonly relationship: 'LORD' | 'OCCUPANT' | 'HOUSE' | 'LORD_RELATIONSHIP';
}

export interface HouseLordInterpretation {
  readonly planet: Planet;
  readonly occupiedHouse: number;
  readonly sign: Sign;
  readonly dignity?: string;
  readonly functionalRoles: readonly FunctionalRole[];
  readonly functionalNature?: FunctionalNature;
  readonly strength: PlanetStrengthInterpretation;
  readonly yogaParticipation: readonly HouseYogaReference[];
  readonly evidence: readonly HouseInterpretationEvidence[];
}

export interface HouseOccupantPlanetEvidence {
  readonly planet: Planet;
  readonly sign: Sign;
  readonly dignity?: string;
  readonly functionalRoles: readonly FunctionalRole[];
  readonly functionalNature?: FunctionalNature;
  readonly interpretationReference?: Planet;
}

export interface HouseOccupantInterpretation {
  readonly planets: readonly Planet[];
  readonly planetEvidence: readonly HouseOccupantPlanetEvidence[];
}

export interface HouseReceivedAspect {
  readonly aspectType: AspectType;
  readonly sourceHouse: number;
  readonly sourcePlanets: readonly Planet[];
  readonly houseOffset: number;
}

export interface HouseAspectInterpretation {
  readonly received: readonly HouseReceivedAspect[];
}

export interface HouseStrengthInterpretation {
  readonly availability: 'NOT_AVAILABLE' | 'AVAILABLE' | 'INCOMPLETE';
}

export interface HouseDomainMetadata {
  readonly primaryThemes: readonly string[];
}

export const HOUSE_DOMAIN_METADATA: Readonly<Record<number, HouseDomainMetadata>> = Object.freeze({
  1: Object.freeze({ primaryThemes: Object.freeze(['Self', 'Physical Body', 'Vitality', 'Appearance', 'Personality']) }),
  2: Object.freeze({ primaryThemes: Object.freeze(['Wealth', 'Family', 'Speech', 'Face', 'Stored Assets']) }),
  3: Object.freeze({ primaryThemes: Object.freeze(['Siblings', 'Courage', 'Initiative', 'Communication', 'Short Travels']) }),
  4: Object.freeze({ primaryThemes: Object.freeze(['Mother', 'Home', 'Vehicles', 'Emotional Security', 'Real Estate']) }),
  5: Object.freeze({ primaryThemes: Object.freeze(['Children', 'Intellect', 'Past Karma (Purva Punya)', 'Speculation', 'Creativity']) }),
  6: Object.freeze({ primaryThemes: Object.freeze(['Enemies', 'Debts', 'Disease', 'Service', 'Daily Work', 'Obstacles']) }),
  7: Object.freeze({ primaryThemes: Object.freeze(['Spouse', 'Partnership', 'Business Relations', 'Public Facing', 'Contracts']) }),
  8: Object.freeze({ primaryThemes: Object.freeze(['Longevity', 'Transformation', 'Hidden Knowledge', 'Sudden Events', 'Shared Assets']) }),
  9: Object.freeze({ primaryThemes: Object.freeze(['Dharma', 'Higher Learning', 'Father', 'Fortune/Luck', 'Long Travels']) }),
  10: Object.freeze({ primaryThemes: Object.freeze(['Career', 'Public Status', 'Profession', 'Authority', 'Actions (Karma)']) }),
  11: Object.freeze({ primaryThemes: Object.freeze(['Gains', 'Income', 'Elder Siblings', 'Social Networks', 'Aspirations']) }),
  12: Object.freeze({ primaryThemes: Object.freeze(['Losses', 'Expenses', 'Moksha', 'Isolation', 'Foreign Lands', 'Sleep/Bed Pleasures']) })
});

export interface HouseInterpretationSummary {
  readonly primaryFactors: readonly string[];
  readonly supportingFactors: readonly string[];
  readonly challengingFactors: readonly string[];
  readonly unresolvedFactors: readonly string[];
}

export interface HouseInterpretation {
  readonly house: number;
  readonly summary: HouseInterpretationSummary;
  readonly placement: HousePlacementInterpretation;
  readonly lord: HouseLordInterpretation;
  readonly occupants: HouseOccupantInterpretation;
  readonly aspects: HouseAspectInterpretation;
  readonly yogas: readonly HouseYogaReference[];
  readonly strength: HouseStrengthInterpretation;
  readonly evidence: readonly HouseInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
}

export interface HouseInterpretationReport {
  readonly houses: Readonly<Record<number, HouseInterpretation>>;
}

export interface HouseInterpretationInput {
  readonly houseAnalysis: HouseAnalysisReport;
  readonly planetAnalysis: PlanetAnalysisReport;
  readonly planetInterpretation: PlanetInterpretationReport;
  readonly functionalRoles: FunctionalRoleAnalysisReport;
  readonly natalGrahaDrishti: NatalGrahaDrishtiReport;
  readonly yogas: YogaAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
}
