import type { Horoscope, Planet, Sign } from '../../../types';

/**
 * P2-05 Career Dispositor Types
 *
 * This module defines the type system for deterministic natal dispositor chain analysis
 * for Career-relevant planets. This is a Phase 2 module that models dispositor chains
 * independently of the CareerAstroGraph (P2-01) - no DISPOSITOR_OF edge type is created.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 * - careerPattern*
 * - careerPatternQualification*
 * - careerAstroGraph* (no DISPOSITOR_OF edge type - P2-01 contract excludes it)
 *
 * This module does NOT include:
 * - DispositorStrength / DispositorScore / scores / confidence
 * - cycleMeaning
 * - Negative dusthana inference (dusthana is structural context, not negative)
 * - Dasha/D10/transit/timing/C11 inputs
 */

/**
 * Role of the starting planet in the dispositor chain.
 */
export type CareerDispositorStartRole =
  | 'CAREER_LORD'
  | 'CAREER_HOUSE_OCCUPANT'
  | 'CAREER_RELEVANT_PLANET';

/**
 * Relationship type between planets in the dispositor chain.
 */
export type CareerDispositorRelationship =
  | 'DISPOSITOR_OF'
  | 'SELF_DISPOSITOR';

/**
 * Termination condition for the dispositor chain.
 */
export type CareerDispositorTermination =
  | 'SELF_DISPOSITOR'
  | 'CYCLE'
  | 'MUTUAL_RECEPTION'
  | 'CAREER_TERMINAL'
  | 'NON_CAREER_TERMINAL'
  | 'UNAVAILABLE';

/**
 * Destination classification for the terminal planet.
 * Never includes NEGATIVE or CAREER_LOSS - dusthana is structural context,
 * not negative inference (per spec §14).
 *
 * CAREER_LORD: Terminal planet is a lord of a career house (5, 6, 9, 10, 11)
 * CAREER_HOUSE_OCCUPANT: Terminal planet occupies a career house (6, 10, 11)
 * CAREER_RELEVANT_PLANET: Terminal planet is career-relevant (currently unused)
 * DUSTHANA_CAREER_CONTEXT: Terminal planet occupies a dusthana house (8, 12) - structural context only
 * NON_CAREER: Terminal planet is not career-relevant
 * UNAVAILABLE: Terminal planet is undefined (missing data)
 */
export type CareerDispositorDestination =
  | 'CAREER_LORD'
  | 'CAREER_HOUSE_OCCUPANT'
  | 'CAREER_RELEVANT_PLANET'
  | 'DUSTHANA_CAREER_CONTEXT'
  | 'NON_CAREER'
  | 'UNAVAILABLE';

/**
 * A single link in the dispositor chain.
 * targetSign may be undefined if the target planet's fact is missing.
 */
export interface CareerDispositorLink {
  readonly sourcePlanet: Planet;
  readonly targetPlanet: Planet;
  readonly sourceSign: Sign;
  readonly targetSign: Sign | undefined;
  readonly relationship: CareerDispositorRelationship;
}

/**
 * A complete dispositor chain from start to termination.
 * identityKey is computed at build time and frozen for stable identity.
 */
export interface CareerDispositorChain {
  readonly startPlanet: Planet;
  readonly startRole: CareerDispositorStartRole;
  readonly links: readonly CareerDispositorLink[];
  readonly terminalPlanet: Planet | undefined;
  readonly termination: CareerDispositorTermination;
  readonly destination: CareerDispositorDestination;
  readonly cycleStartPlanet: Planet | undefined;
  readonly mutualReception: boolean;
  readonly depth: number;
  readonly identityKey: string;
  readonly provenance: CareerDispositorProvenance;
}

/**
 * Provenance tracking for dispositor analysis.
 */
export interface CareerDispositorProvenance {
  readonly ruleIds: readonly string[];
  readonly sourceIds: readonly string[];
}

/**
 * Starting point configuration for dispositor chain traversal.
 * sourceIds carry real upstream evidence ids or [], never fabricated (spec §17).
 */
export interface CareerDispositorStart {
  readonly planet: Planet;
  readonly role: CareerDispositorStartRole;
  readonly sourceIds: readonly string[];
}

/**
 * Input for dispositor integration.
 */
export interface CareerDispositorIntegrationInput {
  readonly horoscope: Horoscope;
  readonly starts: readonly CareerDispositorStart[];
}

/**
 * Result of dispositor chain analysis.
 */
export interface CareerDispositorResult {
  readonly chains: readonly CareerDispositorChain[];
}
