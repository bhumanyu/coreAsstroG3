import type {
  CareerDispositorChain,
  CareerDispositorContext
} from './careerMechanismDispositorTypes';
import type { CareerMechanismCandidate } from '../careerMechanismTypes';
import { sortParticipantIds as sortCanonicalParticipantIds } from '../careerMechanismUtils';
import { createParticipantId } from '../../careerParticipantRoles/participantRoleUtils';

// Type alias for internal use - matches the adapter's import
type NormalizedDispositorChain = CareerDispositorChain;

/**
 * P2-07E Career Mechanism Dispositor Utility Functions
 *
 * This module provides utility functions for dispositor-based mechanism refinement.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerD10
 * - careerDasha
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 */

/**
 * Sorts an array of strings lexicographically.
 */
export function sortStrings(arr: readonly string[]): readonly string[] {
  return [...arr].sort();
}

/**
 * Sorts participant IDs using canonical order.
 * Reuses sortParticipantIds from careerMechanismUtils.
 */
export function sortParticipantIds(arr: readonly string[]): readonly string[] {
  return sortCanonicalParticipantIds(arr as any);
}

/**
 * Deduplicates and sorts an array of numbers.
 */
export function uniqueNumbers(arr: readonly number[]): readonly number[] {
  return Array.from(new Set(arr)).sort((a, b) => a - b);
}

/**
 * Checks if a dispositor context is usable for refinement.
 * Requires sufficientData + non-empty chain + outcome is not INSUFFICIENT_DATA.
 */
export function hasUsableDispositorContext(
  context: CareerDispositorContext
): boolean {
  return (
    context.sufficientData &&
    context.chain.length > 0 &&
    context.outcome !== 'INSUFFICIENT_DATA'
  );
}

/**
 * Checks if a dispositor chain has a terminal planet.
 */
export function hasTerminalPlanet(chain: NormalizedDispositorChain): boolean {
  return chain.terminalPlanetId !== undefined;
}

/**
 * Checks if a dispositor chain is a cycle (CYCLE or MUTUAL_RECEPTION).
 */
export function isCycle(chain: NormalizedDispositorChain): boolean {
  return chain.outcome === 'CYCLE' || chain.outcome === 'MUTUAL_RECEPTION';
}

/**
 * Checks if a dispositor chain is a self-dispositor.
 */
export function isSelfDispositor(chain: NormalizedDispositorChain): boolean {
  return chain.outcome === 'SELF_DISPOSITOR';
}

/**
 * Gets the depth of a dispositor chain.
 */
export function getChainDepth(chain: NormalizedDispositorChain): number {
  return chain.depth;
}

/**
 * Collects relevant dispositor contexts for a candidate.
 * Intersects with participant IDs, sorted by startPlanetId.
 */
export function collectRelevantDispositorContexts(
  candidate: CareerMechanismCandidate,
  dispositorContexts: readonly CareerDispositorContext[]
): readonly CareerDispositorContext[] {
  // Extract participant IDs from candidate provenance
  const candidateParticipantIds = new Set(candidate.provenance.participantIds);

  // Filter contexts where startPlanetId is in candidate participants
  // Convert startPlanetId to participant ID format for comparison
  const relevant = dispositorContexts.filter(context => {
    const planetParticipantId = createParticipantId(context.startPlanetId);
    return candidateParticipantIds.has(planetParticipantId);
  });

  // Sort by startPlanetId
  const sorted = [...relevant].sort((a, b) =>
    a.startPlanetId.localeCompare(b.startPlanetId)
  );

  return Object.freeze(sorted);
}

/**
 * Asserts that the dispositor refinement source is valid.
 * Throws if source is D10, DASHA, TRANSIT, TIMING, FINAL_SYNTHESIS, or AI.
 * This is the spec §18 firewall.
 */
export function assertValidDispositorRefinementSource(source: string): void {
  const forbiddenSources = [
    'D10',
    'DASHA',
    'TRANSIT',
    'TIMING',
    'FINAL_SYNTHESIS',
    'AI'
  ];

  if (forbiddenSources.includes(source)) {
    throw new Error(
      `Invalid dispositor refinement source: ${source}. Sources ${forbiddenSources.join(', ')} are forbidden per spec §18.`
    );
  }
}
