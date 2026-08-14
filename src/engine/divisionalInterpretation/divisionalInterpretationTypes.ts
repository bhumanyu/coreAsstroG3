import {
  Planet,
  Sign,
  ChartType,
  Chart,
  PlanetFacts,
  PlanetFact,
  DignityStatus
} from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import {
  PlanetInterpretationReport,
  InterpretationConfidence
} from '../planetInterpretation/planetInterpretationTypes';

export type DivisionalInterpretationEvidenceType =
  | 'ASCENDANT'
  | 'SIGN_PLACEMENT'
  | 'HOUSE_PLACEMENT'
  | 'HOUSE_LORD'
  | 'HOUSE_LORD_PLACEMENT'
  | 'DIGNITY'
  | 'OCCUPANT'
  | 'D1_COMPARISON'
  | 'DOMAIN_METADATA';

export interface DivisionalInterpretationEvidence {
  readonly ruleId: string;
  readonly type: DivisionalInterpretationEvidenceType;
  readonly varga: 'D9' | 'D10';
  readonly planet?: Planet;
  readonly house?: number;
  readonly relatedPlanets?: readonly Planet[];
  readonly relatedHouses?: readonly number[];
  readonly statement: string;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly source?: string;
}

export interface DivisionalAscendant {
  readonly sign: Sign;
  readonly eclipticLongitude: number;
}

export interface D1PlanetAnchor {
  readonly sign: Sign;
  readonly house: number;
  readonly dignity: DignityStatus;
  readonly functionalRoles: readonly FunctionalRole[];
  readonly strengthAvailability: 'AVAILABLE' | 'INCOMPLETE';
}

export interface DivisionalPlanetInterpretation {
  readonly planet: Planet;
  readonly sign: Sign;
  readonly house: number;
  readonly eclipticLongitude: number;
  readonly dignity?: DignityStatus;
  readonly retrograde: boolean;
  readonly d1Anchor: D1PlanetAnchor;
  readonly evidence: readonly DivisionalInterpretationEvidence[];
}

export interface DivisionalHouseInterpretation {
  readonly house: number;
  readonly sign: Sign;
  readonly lord: Planet;
  readonly occupants: readonly Planet[];
  readonly evidence: readonly DivisionalInterpretationEvidence[];
}

export interface DivisionalDomainMetadata {
  readonly varga: 'D9' | 'D10';
  readonly house: number;
  readonly domains: readonly string[];
  readonly source: string;
}

export interface D1DivisionalComparison {
  readonly planet: Planet;
  readonly d1: {
    readonly sign: Sign;
    readonly house: number;
  };
  readonly d9: {
    readonly sign: Sign;
    readonly house: number;
  };
  readonly d10: {
    readonly sign: Sign;
    readonly house: number;
  };
  readonly isD9Vargottama: boolean;
  readonly isD10Vargottama: boolean;
  readonly evidence: readonly DivisionalInterpretationEvidence[];
}

export interface DivisionalChartInterpretation {
  readonly varga: 'D9' | 'D10';
  readonly chartType: ChartType;
  readonly ascendant: DivisionalAscendant;
  readonly houseLords: Readonly<Record<number, Planet>>;
  readonly planets: Readonly<Record<Planet, DivisionalPlanetInterpretation>>;
  readonly houses: readonly DivisionalHouseInterpretation[];
  readonly domainMetadata: Readonly<Record<number, DivisionalDomainMetadata>>;
  readonly yogasAvailability: 'NOT_CALCULATED';
  readonly evidence: readonly DivisionalInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
}

export interface DivisionalInterpretationReport {
  readonly d9: DivisionalChartInterpretation;
  readonly d10: DivisionalChartInterpretation;
  readonly d1Comparisons: Readonly<Record<Planet, D1DivisionalComparison>>;
  readonly confidence: InterpretationConfidence;
}

export interface DivisionalInterpretationInput {
  readonly d1Chart: Chart;
  readonly d9Chart: Chart;
  readonly d10Chart: Chart;
  readonly planetFacts: Readonly<Record<Planet, PlanetFact>>;
  readonly planetInterpretation: PlanetInterpretationReport;
  readonly functionalRoles: FunctionalRoleAnalysisReport;
}

export const D9_DOMAIN_METADATA: Readonly<Record<number, readonly string[]>> = Object.freeze({
  1: Object.freeze(['identity', 'dharma orientation']),
  2: Object.freeze(['family values', 'sustenance', 'speech']),
  3: Object.freeze(['courage', 'initiative', 'skills']),
  4: Object.freeze(['inner peace', 'emotional stability', 'foundations']),
  5: Object.freeze(['purva punya', 'creativity', 'higher intelligence']),
  6: Object.freeze(['discipline', 'overcoming obstacles', 'service']),
  7: Object.freeze(['partnership', 'spouse', 'relational dynamics']),
  8: Object.freeze(['transformation', 'longevity', 'hidden depth']),
  9: Object.freeze(['dharma', 'fortune', 'higher principles']),
  10: Object.freeze(['actions', 'public destiny', 'duty']),
  11: Object.freeze(['gains', 'fulfillment of desires', 'networks']),
  12: Object.freeze(['liberation', 'spiritual retreat', 'letting go'])
});

export const D10_DOMAIN_METADATA: Readonly<Record<number, readonly string[]>> = Object.freeze({
  1: Object.freeze(['professional identity', 'career disposition']),
  2: Object.freeze(['financial gains from career', 'professional assets']),
  3: Object.freeze(['professional initiative', 'communications', 'contracts']),
  4: Object.freeze(['office environment', 'commercial property', 'stability']),
  5: Object.freeze(['professional creativity', 'counsel', 'merit']),
  6: Object.freeze(['service', 'work environment', 'overcoming competition']),
  7: Object.freeze(['public interaction', 'professional relationships', 'contracts']),
  8: Object.freeze(['career research', 'unforeseen changes', 'legacy work']),
  9: Object.freeze(['professional ethics', 'guidance', 'higher career pursuits']),
  10: Object.freeze(['profession', 'authority', 'public role']),
  11: Object.freeze(['gains', 'recognition', 'professional networks']),
  12: Object.freeze(['foreign professional assignments', 'institutional work', 'retirement'])
});
