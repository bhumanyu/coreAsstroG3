import { Planet } from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';

export enum House {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5,
  SIXTH = 6,
  SEVENTH = 7,
  EIGHTH = 8,
  NINTH = 9,
  TENTH = 10,
  ELEVENTH = 11,
  TWELFTH = 12
}

/**
 * @deprecated Legacy House Lordship compatibility type.
 * New functional-role consumers must use FunctionalRole from functionalRoleTypes.
 */
export enum PlanetRole {
  NONE = 'NONE',
  LAGNA_LORD = 'LAGNA_LORD',
  KENDRA_LORD = 'KENDRA_LORD',
  TRIKONA_LORD = 'TRIKONA_LORD',
  DUSTHANA_LORD = 'DUSTHANA_LORD',
  MARAKA = 'MARAKA',
  YOGAKARAKA = 'YOGAKARAKA'
}

/**
 * @deprecated Transitional bridge mapping legacy PlanetRole to FunctionalRole.
 * Maps legacy PlanetRole values to the canonical FunctionalRole enum.
 * Returns null for PlanetRole.NONE as FunctionalRole has no NONE equivalent.
 */
export function planetRoleToFunctionalRole(role: PlanetRole): FunctionalRole | null {
  switch (role) {
    case PlanetRole.LAGNA_LORD:
      return FunctionalRole.LAGNA_LORD;
    case PlanetRole.KENDRA_LORD:
      return FunctionalRole.KENDRA_LORD;
    case PlanetRole.TRIKONA_LORD:
      return FunctionalRole.TRIKONA_LORD;
    case PlanetRole.DUSTHANA_LORD:
      return FunctionalRole.DUSTHANA_LORD;
    case PlanetRole.MARAKA:
      return FunctionalRole.MARAKA_LORD;
    case PlanetRole.YOGAKARAKA:
      return FunctionalRole.YOGAKARAKA;
    case PlanetRole.NONE:
    default:
      return null;
  }
}

export const HouseGroups = {
  KENDRA: [1, 4, 7, 10] as const,
  TRIKONA: [1, 5, 9] as const,
  DUSTHANA: [6, 8, 12] as const,
  MARAKA: [2, 7] as const,
  KENDRA_NON_LAGNA: [4, 7, 10] as const,
  TRIKONA_NON_LAGNA: [5, 9] as const,
  UPACHAYA: [3, 6, 10, 11] as const
};

export function ownsAny(owned: readonly number[], group: readonly number[]): boolean {
  return owned.some(h => group.includes(h));
}

export const OWNERSHIP_PLANETS: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN
]);
