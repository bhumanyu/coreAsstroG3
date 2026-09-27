/**
 * P2-01 CareerAstroGraph Foundation Types
 *
 * This module defines the type system for the CareerAstroGraph, a graph/topology
 * foundation layer that sits ABOVE the canonical C4–C7 Career facts and BELOW
 * the future P2-02 network-detection and P2-03 pattern-classification layers.
 *
 * This layer is structural only - it does NOT classify patterns, calculate astrology,
 * produce predictions/scores, or depend on C8/C9/C10/Timing/C11 or Dasha/D10/Transit.
 */

/**
 * Node types in the CareerAstroGraph.
 * Limited to HOUSE and PLANET only - no KARAKA/YOGA/VARGA/NAKSHATRA.
 */
export type CareerGraphNodeType = 'HOUSE' | 'PLANET';

/**
 * Edge types in the CareerAstroGraph.
 * Limited to core structural relationships - no DISPOSITOR_OF/NAKSHATRA_LORD_OF/ARGALA_ON/JAMINI_ASPECTS.
 */
export type CareerGraphEdgeType =
  | 'LORD_OF'
  | 'OCCUPIES'
  | 'ASPECTS'
  | 'CONJUNCT'
  | 'EXCHANGES';

/**
 * Provenance information for graph elements.
 * Tracks the source of evidence and rules that led to this element.
 *
 * IMPORTANT: Do not manufacture provenance - populate sourceIds/ruleIds only from
 * real upstream C4 evidence ids (e.g., CareerStructuralEvidence.id).
 * Leave parentIds empty unless a real parent id exists.
 */
export interface CareerGraphProvenance {
  readonly sourceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly parentIds: readonly string[];
}

/**
 * Reference to a graph node used as fact input.
 * A simple type/key pair that identifies a node without requiring the full node object.
 */
export interface CareerGraphNodeRef {
  readonly type: CareerGraphNodeType;
  readonly key: string;
}

/**
 * A node in the CareerAstroGraph.
 * Represents either a house or a planet with its structural identity and provenance.
 */
export interface CareerGraphNode {
  readonly nodeId: string;
  readonly type: CareerGraphNodeType;
  readonly key: string;
  readonly label?: string;
  readonly provenance: CareerGraphProvenance;
}

/**
 * An edge in the CareerAstroGraph.
 * Represents a structural relationship between two nodes.
 */
export interface CareerGraphEdge {
  readonly edgeId: string;
  readonly type: CareerGraphEdgeType;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly identityKey: string;
  readonly provenance: CareerGraphProvenance;
}

/**
 * A fact input for building the CareerAstroGraph.
 * Represents a structural relationship between nodes as input to the graph builder.
 */
export interface CareerGraphFact {
  readonly sourceNode: CareerGraphNodeRef;
  readonly targetNode?: CareerGraphNodeRef;
  readonly relationship: CareerGraphEdgeType;
  readonly provenance: CareerGraphProvenance;
}

/**
 * Input for building a CareerAstroGraph.
 * Contains a collection of structural facts that will be converted into nodes and edges.
 */
export interface CareerAstroGraphInput {
  readonly facts: readonly CareerGraphFact[];
}

/**
 * The CareerAstroGraph structure.
 * A frozen, immutable graph containing nodes and edges representing the structural
 * topology of Career astrological relationships.
 *
 * No graphId/version fields - no existing versioning convention.
 * Absolutely NO numeric score/confidence fields anywhere.
 */
export interface CareerAstroGraph {
  readonly nodes: readonly CareerGraphNode[];
  readonly edges: readonly CareerGraphEdge[];
}
