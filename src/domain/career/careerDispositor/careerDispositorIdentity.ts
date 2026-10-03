import type { Planet } from '../../../types';
import type {
  CareerDispositorChain,
  CareerDispositorStartRole
} from './careerDispositorTypes';

/**
 * P2-05 Career Dispositor Identity
 *
 * Identity functions for dispositor chains.
 * Identity excludes condition/dignity/Dasha/D10/timing/strength/qualification (spec §6).
 */

/**
 * Builds the identity key for a dispositor chain.
 * Format: CAREER_DISPOSITOR:<startRole>:<startPlanet>:<chain.join('>')>:CYCLE:Y|N:MUTUAL:Y|N
 */
export function buildCareerDispositorIdentityKey(
  startPlanet: Planet,
  startRole: CareerDispositorStartRole,
  chain: readonly Planet[],
  cycle: boolean,
  mutualReception: boolean
): string {
  const chainStr = chain.join('>');
  const cycleStr = cycle ? 'Y' : 'N';
  const mutualStr = mutualReception ? 'Y' : 'N';

  return `CAREER_DISPOSITOR:${startRole}:${startPlanet}:${chainStr}:CYCLE:${cycleStr}:MUTUAL:${mutualStr}`;
}

/**
 * Builds the chain ID for a dispositor chain.
 * This is a simpler identifier that doesn't include role or flags.
 */
export function buildCareerDispositorChainId(
  startPlanet: Planet,
  chain: readonly Planet[]
): string {
  const chainStr = chain.join('>');
  return `CAREER_DISPOSITOR_CHAIN:${startPlanet}:${chainStr}`;
}
