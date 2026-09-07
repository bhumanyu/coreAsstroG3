import {
  Planet,
  Sign,
  PlanetState,
  DashaSystem,
  NatalGrahaDrishti,
  NatalGrahaDrishtiReport,
  PlanetAnalysisReport,
  PlanetaryStrengthReport
} from '../../types';
import { VimshottariTimeline } from '../dasha/vimshottari';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { YogaType, YogaStrengthLevel, YogaAnalysisReport } from '../yoga/yogaTypes';
import {
  InterpretationConfidence,
  PlanetStrengthInterpretation,
  PlanetInterpretationReport
} from '../planetInterpretation/planetInterpretationTypes';

export type { InterpretationConfidence };
import {
  HouseInterpretationEvidence,
  HouseInterpretationReport
} from '../houseInterpretation/houseInterpretationTypes';
import { DashaDirectionalSynthesis } from './dashaDirectionalSynthesis';
import { DashaDomainSynthesis } from './dashaDomainSynthesis';

export type { DashaDirectionalSynthesis, DashaDomainSynthesis };

export type DashaInterpretationEvidenceType =
  | 'DASHA_LORD'
  | 'HOUSE_OWNERSHIP'
  | 'HOUSE_PLACEMENT'
  | 'FUNCTIONAL_ROLE'
  | 'FUNCTIONAL_NATURE'
  | 'DIGNITY'
  | 'STATE'
  | 'STRENGTH'
  | 'ASPECT_CAST'
  | 'ASPECT_RECEIVED'
  | 'YOGA'
  | 'HOUSE_DOMAIN'
  | 'PLANETARY_RELATIONSHIP'
  | 'SHARED_HOUSE';

export interface DashaInterpretationEvidence {
  readonly ruleId: string;
  readonly type: DashaInterpretationEvidenceType;
  readonly level: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA' | 'PAIR' | 'CURRENT';
  readonly planets: readonly Planet[];
  readonly houses?: readonly number[];
  readonly statement: string;
  readonly effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';
  readonly source: string;
  /** Structured provenance capturing contributing source records (e.g. from merged yogas). */
  readonly provenance?: DashaYogaProvenance;
  /** Extensible metadata payload. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/**
 * Structured provenance capturing contributing source records from the yoga engine.
 */
export interface DashaYogaProvenance {
  readonly contributingRuleIds: readonly string[];
  readonly formationRuleIds?: readonly string[];
  readonly cancellationRuleIds?: readonly string[];
}

/**
 * Semantic representation of a yoga participating in a dasha lord's activation.
 *
 * Semantic Contract (Option A - Information Preservation):
 * - `strength`: Reflects the intrinsic/formational strength of the yoga upon initial
 *   formation (independent of operational validity).
 * - `finalStatus`: Reflects operational validity. 'CANCELLED' indicates that the yoga
 *   is invalidated (e.g. by bhanga, combustion, or planetary affliction).
 * - 'CANCELLED' + 'VERY_STRONG' is a legitimate combination meaning "strongly-formed but
 *   invalidated."
 * - Downstream consumers evaluating yoga effectiveness MUST gate on `finalStatus !== 'CANCELLED'`.
 */
export interface DashaYogaReference {
  readonly yogaType: YogaType;
  readonly yogaId: string;
  /**
   * Intrinsic/formational strength of the yoga (independent of validity).
   * Downstream consumers MUST gate on `finalStatus !== 'CANCELLED'` before utilizing this strength.
   */
  readonly strength?: YogaStrengthLevel;
  /**
   * Operational validity of the yoga. 'CANCELLED' indicates the yoga is invalidated.
   * Legitimate combinations include CANCELLED + VERY_STRONG (strongly formed but invalidated).
   */
  readonly finalStatus?: 'PRESENT' | 'WEAKENED' | 'STRONG' | 'CANCELLED';
  /**
   * Planetary participation mode in the yoga. If contributing records indicate multiple
   * distinct relationship roles (e.g. both direct planetary and lordship/occupancy),
   * this resolves to 'MIXED'.
   */
  readonly relationship: 'PLANET' | 'HOUSE_LORD' | 'OCCUPANT' | 'MIXED';
  readonly houses?: readonly number[];
  /** Structured provenance distinguishing contributing, formation, and cancellation source rules. */
  readonly provenance?: DashaYogaProvenance;
}

export interface DashaPlanetActivation {
  readonly planet: Planet;
  readonly house: number;
  readonly sign: Sign;
  readonly ownedHouses: readonly number[];
  readonly functionalRoles: readonly FunctionalRole[];
  readonly functionalNature?: FunctionalNature;
  readonly dignity?: string;
  readonly state?: PlanetState;
  readonly strength?: PlanetStrengthInterpretation;
  readonly castAspects: readonly NatalGrahaDrishti[];
  readonly receivedAspects: readonly NatalGrahaDrishti[];
  readonly yogaParticipation: readonly DashaYogaReference[];
  readonly houseInterpretationReference?: number;
  readonly houseEvidence: readonly HouseInterpretationEvidence[];
  readonly evidence: readonly DashaInterpretationEvidence[];
}

export interface DashaInterpretationSummary {
  readonly primaryFactors: readonly string[];
  readonly supportingFactors: readonly string[];
  readonly challengingFactors: readonly string[];
  readonly unresolvedFactors: readonly string[];
}

export interface DashaPairInterpretation {
  readonly mahadashaLord: Planet;
  readonly antardashaLord: Planet;
  readonly sharedHouses: readonly number[];
  readonly combinedHouseSet: readonly number[];
  readonly relationshipEvidence: readonly DashaInterpretationEvidence[];
}

export interface DashaPratyantardashaInterpretation {
  readonly planet: Planet;
  readonly lord?: Planet;
  readonly start: string;
  readonly end: string;
  readonly natal: DashaPlanetActivation;
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
  readonly summary?: DashaInterpretationSummary;
  readonly planetarySynthesis?: DashaDirectionalSynthesis;
  readonly domainSynthesis?: readonly DashaDomainSynthesis[];
}

export interface DashaAntardashaInterpretation {
  readonly planet: Planet;
  readonly lord?: Planet;
  readonly start: string;
  readonly end: string;
  readonly natal: DashaPlanetActivation;
  readonly pratyantardashas: readonly DashaPratyantardashaInterpretation[];
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
  readonly summary?: DashaInterpretationSummary;
  readonly pairInterpretation?: DashaPairInterpretation;
  readonly planetarySynthesis?: DashaDirectionalSynthesis;
  readonly domainSynthesis?: readonly DashaDomainSynthesis[];
}

export interface DashaMahadashaInterpretation {
  readonly planet: Planet;
  readonly lord?: Planet;
  readonly start: string;
  readonly end: string;
  readonly natal: DashaPlanetActivation;
  readonly antardashas: readonly DashaAntardashaInterpretation[];
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
  readonly summary?: DashaInterpretationSummary;
  readonly planetarySynthesis?: DashaDirectionalSynthesis;
  readonly domainSynthesis?: readonly DashaDomainSynthesis[];
}

export interface DashaBirthAnchor {
  readonly nakshatra: string;
  readonly nakshatraLord: Planet;
  readonly nakshatraProgress: number;
  readonly remainingFraction: number;
}

export interface ActiveDashaInterpretation {
  readonly at: string;
  readonly mahadasha: DashaMahadashaInterpretation;
  readonly antardasha: DashaAntardashaInterpretation;
  readonly pratyantardasha: DashaPratyantardashaInterpretation;
  readonly evidence: readonly DashaInterpretationEvidence[];
  readonly confidence: InterpretationConfidence;
  readonly planetarySynthesis?: DashaDirectionalSynthesis;
  readonly domainSynthesis?: readonly DashaDomainSynthesis[];
}

export interface DashaInterpretationReport {
  readonly system: DashaSystem;
  readonly birthAnchor: DashaBirthAnchor;
  readonly mahadashas: readonly DashaMahadashaInterpretation[];
  readonly current?: ActiveDashaInterpretation;
  readonly activePeriods?: ActiveDashaInterpretation;
  readonly confidence: InterpretationConfidence;
}

export interface DashaInterpretationInput {
  readonly vimshottari: VimshottariTimeline;
  readonly planetInterpretation: PlanetInterpretationReport;
  readonly houseInterpretation: HouseInterpretationReport;
  readonly functionalRoles: FunctionalRoleAnalysisReport;
  readonly natalGrahaDrishti: NatalGrahaDrishtiReport;
  readonly yogas: YogaAnalysisReport;
  readonly planetAnalysis: PlanetAnalysisReport;
  readonly planetaryStrength?: PlanetaryStrengthReport;
}
