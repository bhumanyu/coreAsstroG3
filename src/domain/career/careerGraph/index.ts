/**
 * P2-01 CareerAstroGraph Foundation
 *
 * Public API surface for the CareerAstroGraph foundation layer.
 * This layer provides structural graph representation of Career astrological relationships,
 * sitting ABOVE the canonical C4–C7 Career facts and BELOW the future P2-02 network-detection
 * and P2-03 pattern-classification layers.
 */

// Main graph builder
export { buildCareerAstroGraph } from './careerAstroGraphBuilder';

// C4→graph adapter
export { buildCareerGraphFactsFromStructural } from './careerAstroGraphAdapter';

// Core graph types
export type {
  CareerAstroGraph,
  CareerGraphNode,
  CareerGraphEdge,
  CareerGraphNodeType,
  CareerGraphEdgeType,
  CareerGraphFact,
  CareerAstroGraphInput,
  CareerGraphProvenance,
  CareerGraphNodeRef
} from './careerAstroGraphTypes';

// Network types
export type {
  CareerHouseNetwork,
  CareerNetworkTopology,
  CareerNetworkDirection
} from './careerHouseNetworkTypes';

// Network builders
export {
  buildCareerHouseNetwork,
  buildCareerHouseNetworkIdentityKey
} from './careerHouseNetwork';

// P2-02 Network detection
export {
  detectCareerHouseNetworks
} from './careerNetworkDetection';

export type {
  CareerNetworkDetectionInput,
  CareerNetworkDetectionResult,
  CareerHouseConnection,
  CareerHouseConnectionKind
} from './careerNetworkDetectionTypes';
