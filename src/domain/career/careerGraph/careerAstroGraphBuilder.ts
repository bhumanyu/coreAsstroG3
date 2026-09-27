import type {
  CareerAstroGraph,
  CareerAstroGraphInput,
  CareerGraphNode,
  CareerGraphEdge,
  CareerGraphProvenance
} from './careerAstroGraphTypes';
import {
  buildCareerGraphNodeId,
  buildCareerGraphEdgeIdentityKey
} from './careerAstroGraphIdentity';
import {
  normalizeCareerGraphProvenance,
  mergeCareerGraphProvenances
} from './careerAstroGraphProvenance';
import {
  validateGraphReferences as validateGraphReferencesFn,
  freezeGraph as freezeGraphFn,
  compareCareerGraphNodes as compareCareerGraphNodesFn,
  compareCareerGraphEdges as compareCareerGraphEdgesFn
} from './careerAstroGraph';

/**
 * Builds a CareerAstroGraph from structural facts.
 *
 * Algorithm (per spec §31–32):
 * 1. Normalize node refs into unique nodes keyed by nodeId
 * 2. Build unique edges keyed by identityKey
 * 3. When the same edge identity recurs, keep ONE edge and MERGE provenance sourceIds/ruleIds
 *    (do NOT sum weights or accumulate strength — construction is structural only)
 * 4. Validate referential integrity (every edge.sourceNodeId and edge.targetNodeId must exist among nodes)
 *    and throw on violation
 * 5. Sort nodes and edges canonically
 * 6. Deep-freeze
 *
 * @param input - The input facts for building the graph
 * @returns A frozen CareerAstroGraph
 * @throws Error if referential integrity is violated
 */
export function buildCareerAstroGraph(
  input: CareerAstroGraphInput
): CareerAstroGraph {
  const { facts } = input;

  // Step 1: Build unique nodes from node refs
  const nodeMap = new Map<string, CareerGraphNode>();

  for (const fact of facts) {
    // Process source node
    const sourceNodeId = buildCareerGraphNodeId(fact.sourceNode.type, fact.sourceNode.key);
    if (!nodeMap.has(sourceNodeId)) {
      const node: CareerGraphNode = Object.freeze({
        nodeId: sourceNodeId,
        type: fact.sourceNode.type,
        key: fact.sourceNode.key,
        label: fact.sourceNode.key,
        provenance: normalizeCareerGraphProvenance(fact.provenance)
      });
      nodeMap.set(sourceNodeId, node);
    } else {
      // Merge provenance if node already exists
      const existingNode = nodeMap.get(sourceNodeId)!;
      const mergedProvenance = mergeCareerGraphProvenances([
        existingNode.provenance,
        fact.provenance
      ]);
      const updatedNode: CareerGraphNode = Object.freeze({
        ...existingNode,
        provenance: mergedProvenance
      });
      nodeMap.set(sourceNodeId, updatedNode);
    }

    // Process target node if present
    if (fact.targetNode) {
      const targetNodeId = buildCareerGraphNodeId(fact.targetNode.type, fact.targetNode.key);
      if (!nodeMap.has(targetNodeId)) {
        const node: CareerGraphNode = Object.freeze({
          nodeId: targetNodeId,
          type: fact.targetNode.type,
          key: fact.targetNode.key,
          label: fact.targetNode.key,
          provenance: normalizeCareerGraphProvenance(fact.provenance)
        });
        nodeMap.set(targetNodeId, node);
      } else {
        // Merge provenance if node already exists
        const existingNode = nodeMap.get(targetNodeId)!;
        const mergedProvenance = mergeCareerGraphProvenances([
          existingNode.provenance,
          fact.provenance
        ]);
        const updatedNode: CareerGraphNode = Object.freeze({
          ...existingNode,
          provenance: mergedProvenance
        });
        nodeMap.set(targetNodeId, updatedNode);
      }
    }
  }

  // Step 2: Build unique edges, merging duplicates by identityKey
  const edgeMap = new Map<string, CareerGraphEdge>();

  for (const fact of facts) {
    if (!fact.targetNode) {
      continue; // Skip facts without target node (cannot form edge)
    }

    const sourceNodeId = buildCareerGraphNodeId(fact.sourceNode.type, fact.sourceNode.key);
    const targetNodeId = buildCareerGraphNodeId(fact.targetNode.type, fact.targetNode.key);
    const identityKey = buildCareerGraphEdgeIdentityKey(
      fact.relationship,
      sourceNodeId,
      targetNodeId
    );

    const edgeId = identityKey; // edgeId is the same as identityKey

    if (edgeMap.has(identityKey)) {
      // Merge provenance for duplicate edge
      const existingEdge = edgeMap.get(identityKey)!;
      const mergedProvenance = mergeCareerGraphProvenances([
        existingEdge.provenance,
        fact.provenance
      ]);
      const updatedEdge: CareerGraphEdge = Object.freeze({
        ...existingEdge,
        provenance: mergedProvenance
      });
      edgeMap.set(identityKey, updatedEdge);
    } else {
      // Create new edge
      const edge: CareerGraphEdge = Object.freeze({
        edgeId,
        type: fact.relationship,
        sourceNodeId,
        targetNodeId,
        identityKey,
        provenance: normalizeCareerGraphProvenance(fact.provenance)
      });
      edgeMap.set(identityKey, edge);
    }
  }

  // Step 3: Convert maps to arrays
  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  // Step 4: Sort nodes and edges canonically
  nodes.sort(compareCareerGraphNodesFn);
  edges.sort(compareCareerGraphEdgesFn);

  // Step 5: Build graph object
  const graph: CareerAstroGraph = Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges)
  });

  // Step 6: Validate referential integrity
  validateGraphReferencesFn(graph);

  // Step 7: Deep freeze
  return freezeGraphFn(graph);
}
