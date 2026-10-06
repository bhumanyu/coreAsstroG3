import type {
  Sign,
  Planet,
  Horoscope,
  HouseAnalysisReport,
  NatalGrahaDrishtiReport
} from '../../../types';
import type { HouseLordshipReport } from '../../../engine/houseLordship/houseLordship';
import type { ParticipantId } from '../careerParticipantRoles/participantRoleTypes';

/**
 * P2-07F Career 10H Structural Context Types
 *
 * This module defines the structural types for 10th house analysis from Lagna and Moon
 * reference points. This is a FACTS-ONLY layer that composes existing engine reports
 * (HouseLordshipReport, HouseAnalysisReport, NatalGrahaDrishtiReport) into a canonical
 * 10H/10L context for Lagna and Moon reference points.
 *
 * This layer adds NO new astrology logic - it only composes and reorganizes existing facts.
 *
 *BOUNDARY ENFORCEMENT: This module must NOT:
 * - Implement any new astrology calculations or interpretations
 * - Import from careerDasha, careerD10, careerFinalSynthesis, careerExpression
 * - Import from domain/timing
 * - Import careerMechanism, careerProfession
 * - Perform strength/score calculations
 * - Generate evidence or interpretations
 * - Process Dasha/D10/transit/profession/domain inference
 * - Make AI calls or generate yoga
 *
 * Facts ≠ derived evidence ≠ interpretation - Career10HEvidence is a later phase.
 */

/**
 * Reference point for 10th house analysis.
 * Lagna = 10th house from Ascendant
 * MOON = 10th house from Moon sign
 */
export type CareerReferencePoint = 'LAGNA' | 'MOON';

/**
 * Structural context for the 10th house from a reference point.
 * Contains all raw facts needed for 10H analysis without interpretation.
 */
export interface Career10HContext {
  /** The reference point (LAGNA or MOON) */
  readonly referencePoint: CareerReferencePoint;
  /** The house number (1-12) that is the 10th house from the reference point */
  readonly house10Number: number;
  /** The sign occupying the 10th house */
  readonly house10Sign: Sign;
  /** The lord of the 10th house (10L) */
  readonly house10Lord: Planet;
  /** The house number where the 10L is placed */
  readonly lordHouse: number;
  /** Planets occupying the 10th house (as ParticipantId array) */
  readonly occupants: readonly ParticipantId[];
  /** Aspects on the 10th house from NatalGrahaDrishtiReport */
  readonly aspectsOn10H: readonly Career10HAspect[];
  /** Provenance tracking - source report IDs */
  readonly provenance: Career10HProvenance;
}

/**
 * Aspect information on the 10th house.
 * Composed from NatalGrahaDrishtiReport aspects targeting the 10th house.
 */
export interface Career10HAspect {
  readonly sourcePlanet: Planet;
  readonly sourceHouse: number;
  readonly targetHouse: number;
  readonly aspectType: string;
  readonly houseOffset: number;
  readonly reason: string;
}

/**
 * Provenance tracking for 10H context.
 * Tracks which engine reports contributed to this context.
 */
export interface Career10HProvenance {
  readonly houseLordshipEvidenceId?: string;
  readonly houseAnalysisHouseId?: string;
  readonly drishtiAspectIds: readonly string[];
}

/**
 * Complete 10H foundation containing both Lagna and Moon contexts.
 * This is the primary output of the structural layer.
 *
 * NOTE: NO convergence field - that's P2-07I (later phase).
 */
export interface Career10HFoundation {
  /** 10th house context from Lagna reference point */
  readonly lagnaContext: Career10HContext | null;
  /** 10th house context from Moon reference point */
  readonly moonContext: Career10HContext | null;
}

/**
 * Input for resolving 10H foundation.
 * Can be either a horoscope or a bundle of pre-computed reports.
 */
export interface Career10HFoundationInput {
  /** Horoscope with pre-computed reports */
  readonly horoscope?: Horoscope;
  /** Pre-computed house lordship report (optional if horoscope provided) */
  readonly houseLordship?: HouseLordshipReport;
  /** Pre-computed house analysis report (optional if horoscope provided) */
  readonly houseAnalysis?: HouseAnalysisReport;
  /** Pre-computed natal graha drishti report (optional if horoscope provided) */
  readonly natalGrahaDrishti?: NatalGrahaDrishtiReport;
}

/**
 * Status for 10H foundation resolution.
 */
export type Career10HFoundationStatus =
  | 'COMPLETE'
  | 'INSUFFICIENT_DATA';

/**
 * Result of 10H foundation resolution.
 */
export interface Career10HFoundationResult {
  readonly status: Career10HFoundationStatus;
  readonly foundation: Career10HFoundation;
  readonly missingInputs: readonly string[];
}
