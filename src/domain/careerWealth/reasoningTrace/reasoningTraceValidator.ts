import type { ReasoningTraceGraph } from './reasoningTraceGraph';

/**
 * Validates structural integrity of a ReasoningTraceGraph.
 * Throws an Error if duplicates, self-edges, or missing endpoint nodes are detected.
 */
export function validateReasoningTrace(trace: ReasoningTraceGraph): void {
  const nodeIds = new Set<string>();

  for (const node of trace.nodes) {
    if (nodeIds.has(node.nodeId)) {
      throw new Error(`Duplicate node id detected in reasoning trace: ${node.nodeId}`);
    }
    nodeIds.add(node.nodeId);
  }

  const edgeIds = new Set<string>();

  for (const edge of trace.edges) {
    if (edgeIds.has(edge.edgeId)) {
      throw new Error(`Duplicate edge id detected in reasoning trace: ${edge.edgeId}`);
    }
    edgeIds.add(edge.edgeId);

    if (edge.fromNodeId === edge.toNodeId) {
      throw new Error(`Self-edge detected on node: ${edge.fromNodeId}`);
    }

    if (!nodeIds.has(edge.fromNodeId)) {
      throw new Error(`Unknown edge source node: ${edge.fromNodeId}`);
    }

    if (!nodeIds.has(edge.toNodeId)) {
      throw new Error(`Unknown edge target node: ${edge.toNodeId}`);
    }
  }
}

/**
 * Validates that every node with type 'EVIDENCE' contains a valid evidenceId
 * that exists in the supplied evidenceIds set.
 */
export function validateEvidenceNodes(
  trace: ReasoningTraceGraph,
  evidenceIds: ReadonlySet<string>
): void {
  for (const node of trace.nodes) {
    if (node.type === 'EVIDENCE') {
      if (!node.evidenceId || !evidenceIds.has(node.evidenceId)) {
        throw new Error(
          `Evidence node references unknown evidenceId: ${node.evidenceId ?? 'undefined'}`
        );
      }
    }
  }
}
