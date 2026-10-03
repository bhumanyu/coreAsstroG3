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
 */
export function resolveCareerDestination(
  terminalPlanet: Planet,
  terminalHouse: number | undefined,
  isCareerLord: boolean,
  isCareerHouseOccupant: boolean,
  isCareerRelevant: boolean
): CareerDispositorDestination {
  if (terminalPlanet === undefined) {
    return 'UNAVAILABLE';
  }

  // Precedence hierarchy:
  // 1. Career Lord (highest priority)
  if (isCareerLord) {
    return 'CAREER_LORD';
  }

  // 2. Career House Occupant with known house
  if (isCareerHouseOccupant && terminalHouse !== undefined) {
    if (isCareerHouse(terminalHouse)) {
      return 'CAREER_HOUSE_OCCUPANT';
    }
    // Dusthana context (6, 8, 12) - structural context, not negative
    if (terminalHouse === 6 || terminalHouse === 8 || terminalHouse === 12) {
      return 'DUSTHANA_CAREER_CONTEXT';
    }
  }

  // 3. Career House (lord of Career house)
  if (terminalHouse !== undefined && isCareerHouse(terminalHouse)) {
    return 'CAREER_HOUSE';
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
 * - Self-dispositor is NOT a cycle
 * - Cycle + mutualReception → MUTUAL_RECEPTION
 * - Cycle → CYCLE
 * - Self → SELF_DISPOSITOR
 * - Career terminal → CAREER_TERMINAL
 * - Else NON_CAREER_TERMINAL
 * - Missing → UNAVAILABLE
 */
export function resolveTermination(
  cycle: boolean,
  mutualReception: boolean,
  isSelfDispositor: boolean,
  isCareerTerminal: boolean,
  hasTerminalPlanet: boolean
): CareerDispositorTermination {
  if (!hasTerminalPlanet) {
    return 'UNAVAILABLE';
  }

  if (isSelfDispositor) {
    return 'SELF_DISPOSITOR';
  }

  if (cycle && mutualReception) {
    return 'MUTUAL_RECEPTION';
  }

  if (cycle) {
    return 'CYCLE';
  }

  if (isCareerTerminal) {
    return 'CAREER_TERMINAL';
  }

  return 'NON_CAREER_TERMINAL';
}
