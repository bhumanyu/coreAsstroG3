import {
  Planet,
  PlanetFact,
  PlanetFacts,
  Sign,
  PlanetAnalysisReport,
  NatalGrahaDrishtiReport,
  PlanetaryStrengthReport
} from '../../types';
import { HouseLordshipReport } from '../houseLordship/houseLordship';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';

export enum YogaType {
  GAJA_KESARI = 'GAJA_KESARI',
  RUCHAKA = 'RUCHAKA',
  BHADRA = 'BHADRA',
  HAMSA = 'HAMSA',
  MALAVYA = 'MALAVYA',
  SHASHA = 'SHASHA',
  RAJA_YOGA = 'RAJA_YOGA',
  DHANA_YOGA = 'DHANA_YOGA',
  LAKSHMI_YOGA = 'LAKSHMI_YOGA',
  CHANDRA_MANGALA_YOGA = 'CHANDRA_MANGALA_YOGA',
  VASUMATI_YOGA = 'VASUMATI_YOGA'
}

export enum YogaCategory {
  RAJA = 'RAJA',
  DHANA = 'DHANA',
  PROSPERITY = 'PROSPERITY'
}

/**
 * @deprecated Use assessment.strength.
 */
export enum YogaStrength {
  STRONG = 'STRONG'
}

export enum YogaStrengthLevel {
  VERY_WEAK = 'VERY_WEAK',
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG'
}

export enum YogaDignity {
  OWN_SIGN = 'OWN_SIGN',
  EXALTATION = 'EXALTATION'
}

export type YogaModifierCategory =
  | 'MAJOR_SUPPORT'
  | 'MINOR_SUPPORT'
  | 'MAJOR_WEAKENING'
  | 'MINOR_WEAKENING'
  | 'CANCELLATION';

export interface YogaModifier {
  readonly ruleId: string;
  readonly type: 'SUPPORT' | 'WEAKEN' | 'AFFLICTION' | 'CANCELLATION';
  readonly category?: YogaModifierCategory;
  readonly effect: 'POSITIVE' | 'NEGATIVE' | 'CANCELLED';
  readonly planets: readonly Planet[];
  readonly houses?: readonly number[];
  readonly reason: string;
  readonly source?: string;
}

export interface YogaAssessment {
  readonly formationPresent: boolean;
  readonly strength: YogaStrengthLevel;
  readonly supportingFactors: readonly YogaModifier[];
  readonly weakeningFactors: readonly YogaModifier[];
  readonly cancellationFactors: readonly YogaModifier[];
  readonly finalStatus: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface YogaEvidence {
  readonly ruleId: string;
  readonly reason: string;
  readonly planets: readonly Planet[];
  readonly houses: readonly (number | undefined)[];
  readonly relativeHouseDistance?: number;
  readonly dignity?: YogaDignity;
  readonly sign?: Sign;
  readonly house?: number;
  readonly planet?: Planet;
  readonly relationship?: 'CONJUNCTION' | 'MUTUAL_ASPECT' | 'EXCHANGE';
  readonly kendraHouses?: readonly number[];
  readonly trikonaHouses?: readonly number[];
  readonly lordshipHouses?: readonly number[];
  readonly classicalReference?: string;
  readonly referenceFrame?: 'LAGNA' | 'MOON';
  readonly evidenceType?: 'FORMATION' | 'SUPPORTING' | 'WEAKENING' | 'AFFLICTION' | 'CANCELLATION' | 'MODIFIER';
  readonly source?: string;
}

export interface YogaResult {
  readonly type: YogaType;
  readonly category: YogaCategory;
  readonly name?: string;
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  /**
   * @deprecated Use assessment.strength.
   */
  readonly strength: YogaStrength;
  readonly planets: readonly Planet[];
  readonly houses: readonly (number | undefined)[];
  readonly evidence: readonly YogaEvidence[];
  readonly assessment?: YogaAssessment;
  readonly modifiers?: readonly YogaModifier[];
  readonly supportingFactors?: readonly YogaModifier[];
  readonly weakeningFactors?: readonly YogaModifier[];
  readonly cancellationFactors?: readonly YogaModifier[];
  readonly classicalReference?: string;
}

export interface YogaAnalysisReport {
  readonly yogas: readonly YogaResult[];
}

export interface YogaAnalysisInput {
  readonly planetFacts: Readonly<Record<Planet, PlanetFact>>;
  readonly houseLordship?: HouseLordshipReport;
  readonly functionalRoles?: FunctionalRoleAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
  readonly planetAnalysis?: PlanetAnalysisReport;
  readonly natalGrahaDrishti?: NatalGrahaDrishtiReport;
}

export interface YogaRule {
  readonly id: string;
  readonly type: YogaType;
  readonly requiredPlanets: readonly Planet[];
  readonly requiresHouseLordship?: boolean;
  evaluate(input: YogaAnalysisInput): YogaResult | readonly YogaResult[] | null;
}
