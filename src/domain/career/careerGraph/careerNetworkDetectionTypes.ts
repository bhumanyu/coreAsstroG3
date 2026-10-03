import type { CareerAstroGraph } from './careerAstroGraphTypes';
import type { CareerHouseNetwork } from './careerHouseNetworkTypes';

/**
 * P2-02 Career Network Detection Types
 *
 * This module defines the type system for the network detection layer that sits
 * ABOVE the CareerAstroGraph (P2-01) and BELOW the pattern-classification layer (P2-03).
 *
 * This layer is structural and deterministic only - it does NOT classify patterns,
 * calculate scores, produce predictions, or depend on C8/C9/C10/Timing/C11 or Dasha/D10/Transit.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Input for career house network detection.
 * Contains the CareerAstroGraph from which networks will be detected.
 */
export interface CareerNetworkDetectionInput {
  readonly graph: CareerAstroGraph;
}

/**
 * Result of career house network detection.
 * Contains the detected networks in deterministic order.
 */
export interface CareerNetworkDetectionResult {
  readonly networks: readonly CareerHouseNetwork[];
}

/**
 * Internal type representing the kind of connection between two houses.
 * Not exported - used only within the detection layer.
 */
export type CareerHouseConnectionKind = 'DIRECT' | 'SHARED_PARTICIPANT';

/**
 * Internal type representing a directed connection between two houses.
 * Preserves the actual source/target from the original edge.
 */
export interface CareerDirectedHouseConnection {
  readonly sourceHouse: number;
  readonly targetHouse: number;
  readonly sourceEdgeIds: readonly string[];
}

/**
 * Internal type representing a connection between two houses.
 * Exported for use in detection rules module.
 */
export interface CareerHouseConnection {
  readonly houseA: number;
  readonly houseB: number;
  readonly kind: CareerHouseConnectionKind;
  readonly sourceEdgeIds: readonly string[];
  readonly participantNodeIds: readonly string[];
  readonly directedConnections: readonly CareerDirectedHouseConnection[];
}
