import type { CareerGraphEdge, CareerGraphProvenance } from './careerAstroGraphTypes';
import type { Planet } from '../../../types';

/**
 * Network topology types for Career house networks.
 * Represents the structural pattern of connectivity between houses.
 */
export type CareerNetworkTopology =
  | 'DIRECT_LINK'
  | 'CHAIN'
  | 'TRIANGLE'
  | 'LOOP'
  | 'STAR'
  | 'CLUSTER';

/**
 * Network direction types for Career house networks.
 * Represents the directional flow of influence through the network.
 */
export type CareerNetworkDirection =
  | 'FORWARD'
  | 'REVERSE'
  | 'BIDIRECTIONAL';

/**
 * A Career house network representation.
 * Represents a set of houses and their structural relationships as a network.
 *
 * Identity is based on sorted house set + topology + direction + structural relationship identity (per §26–27).
 * Identity must NOT include strength/dignity/condition/Dasha.
 *
 * Direction IS part of network identity (it is structural semantics, not qualification).
 */
export interface CareerHouseNetwork {
  readonly networkId: string;
  readonly identityKey: string;
  readonly houses: readonly number[];
  readonly lords: readonly Planet[];
  readonly relationships: readonly CareerGraphEdge[];
  readonly topology: CareerNetworkTopology;
  readonly direction: CareerNetworkDirection;
  readonly provenance: CareerGraphProvenance;
  readonly evidenceIds: readonly string[];
}
