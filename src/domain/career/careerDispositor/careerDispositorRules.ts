import type { Planet, Sign } from '../../../types';
import type {
  CareerDispositorDestination,
  CareerDispositorTermination
} from './careerDispositorTypes';

/**
 * P2-05 Career Dispositor Rules
 *
 * Constants and rule functions for dispositor chain analysis.
 */

/**
 * Career houses (6, 10, 11) as per spec.
 */
export const CAREER_HOUSES: readonly number[] = Object.freeze([6, 10, 11]);

/**
 * Houses whose lords are considered Career Lord start points (5, 6, 9, 10, 11).
 */
export const CAREER_LORD_START_HOUSES: readonly number[] = Object.freeze([5, 6, 9, 10, 11]);

/**
 * Maximum dispositor depth.
 * Documented as technical guard for the nine modeled planets, NOT an astrological strength rule (spec §9).
 */
export const MAX_DISPOSITOR_DEPTH = 9;

/**
 * Checks if a house is a Career house.
 */
export function isCareerHouse(house: number): boolean {
  return CAREER_HOUSES.includes(house);
}

/**
 * Resolves the destination classification for a terminal planet.
 * Documents precedence hierarchy as implementation convention, not classical rule (spec §7).
 *
 * Precedence hierarchy:
 * 1. Career Lord (highest priority) - lord of career lord start houses (5, 6, 9, 10, 11)
 * 2. Career House Occupant in career house (6, 10, 11) - planet occupies a career house
 * 3. Dusthana context (8, 12) - structural context, not negative
 * 4. House 6 is both career house and dusthana - CAREER_HOUSE_OCCUPANT takes precedence
 * 5. Career Relevant Planet
 * 6. Non-Career
 * 7. UNAVAILABLE (when terminalPlanet is undefined)
 *
 * Note: CAREER_HOUSE destination type has been removed - it was redundant with CAREER_LORD.
 * CAREER_LORD covers lords of career houses (5, 6, 9, 10, 11).
 * CAREER_HOUSE_OCCUPANT covers planets occupying career houses (6, 10, 11).
 */
export function resolveCareerDestination(
  terminalPlanet: Planet | undefined,
  terminalHouse: number | undefined,
  isCareerLord: boolean,
  isCareerHouseOccupant: boolean,
  isCareerRelevant: boolean
): CareerDispositorDestination {
  if (terminalPlanet === undefined) {
    return 'UNAVAILABLE';
  }

  // 1. Career Lord (highest priority)
  if (isCareerLord) {
    return 'CAREER_LORD';
  }

  // 2. Career House Occupant in career house (6, 10, 11)
  if (isCareerHouseOccupant && terminalHouse !== undefined && isCareerHouse(terminalHouse)) {
    return 'CAREER_HOUSE_OCCUPANT';
  }

  // 3. Dusthana context (8, 12) - evaluated after career-lord and career-house checks
  // This branch is now reachable for terminals in 8/12 (non-career houses)
  // House 6 is excluded here as it's handled by CAREER_HOUSE_OCCUPANT above
  if (terminalHouse !== undefined && (terminalHouse === 8 || terminalHouse === 12)) {
    return 'DUSTHANA_CAREER_CONTEXT';
  }

  // 4. Career Relevant Planet
  if (isCareerRelevant) {
    return 'CAREER_RELEVANT_PLANET';
  }

  // 5. Non-Career
  return 'NON_CAREER';
}

/**
 * Resolves the termination condition for a dispositor chain.
 * Precedence hierarchy:
 * 1. cycle && mutualReception → MUTUAL_RECEPTION
 * 2. cycle → CYCLE
 * 3. isSelfDispositor → SELF_DISPOSITOR
 * 4. !hasTerminalPlanet → UNAVAILABLE
 * 5. isCareerTerminal → CAREER_TERMINAL
 * 6. else NON_CAREER_TERMINAL
 */
export function resolveTermination(
  cycle: boolean,
  mutualReception: boolean,
  isSelfDispositor: boolean,
  isCareerTerminal: boolean,
  hasTerminalPlanet: boolean
): CareerDispositorTermination {
  if (cycle && mutualReception) {
    return 'MUTUAL_RECEPTION';
  }

  if (cycle) {
    return 'CYCLE';
  }

  if (isSelfDispositor) {
    return 'SELF_DISPOSITOR';
  }

  if (!hasTerminalPlanet) {
    return 'UNAVAILABLE';
  }

  if (isCareerTerminal) {
    return 'CAREER_TERMINAL';
  }

  return 'NON_CAREER_TERMINAL';
}
