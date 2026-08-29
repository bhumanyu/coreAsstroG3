import type { ReasoningNode, ReasoningNodeDomain } from '../reasoningTrace/reasoningNode';
import type { ReasoningEdge } from '../reasoningTrace/reasoningEdge';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';

export interface ResolvedGraphContext {
  readonly targetNode: ReasoningNode | undefined;
  readonly connectedConclusionNodes: readonly ReasoningNode[];
  readonly connectedEvidenceNodes: readonly ReasoningNode[];
  readonly relevantEdges: readonly ReasoningEdge[];
}

/**
 * Finds a node in the reasoning trace graph by its canonical subjectKey and optional domain.
 */
export function findNodeBySubjectKey(
  graph: ReasoningTraceGraph,
  subjectKey: string,
  domain?: ReasoningNodeDomain
): ReasoningNode | undefined {
  if (domain) {
    const matched = graph.nodes.find((n) => n.domain === domain && n.subjectKey === subjectKey);
    if (matched) return matched;
  }
  return graph.nodes.find((n) => n.subjectKey === subjectKey);
}

/**
 * Finds a node in the graph by its unique nodeId.
 */
export function findNodeById(
  graph: ReasoningTraceGraph,
  nodeId: string
): ReasoningNode | undefined {
  return graph.nodes.find((n) => n.nodeId === nodeId);
}

/**
 * Gets all incoming edges pointing to a target node.
 */
export function getIncomingEdges(
  graph: ReasoningTraceGraph,
  targetNodeId: string
): readonly ReasoningEdge[] {
  return graph.edges.filter((e) => e.toNodeId === targetNodeId);
}

/**
 * Gets all outgoing edges originating from a source node.
 */
export function getOutgoingEdges(
  graph: ReasoningTraceGraph,
  sourceNodeId: string
): readonly ReasoningEdge[] {
  return graph.edges.filter((e) => e.fromNodeId === sourceNodeId);
}

/**
 * Resolves the graph context around a target subjectKey.
 * For FINAL_SYNTHESIS, transitively traverses through all axis conclusion nodes to collect
 * the evidence nodes feeding them.
 */
export function resolveGraphContext(
  graph: ReasoningTraceGraph,
  targetSubjectKey: string,
  domain: ReasoningNodeDomain
): ResolvedGraphContext {
  const targetNode = findNodeBySubjectKey(graph, targetSubjectKey, domain);
  if (!targetNode) {
    return {
      targetNode: undefined,
      connectedConclusionNodes: [],
      connectedEvidenceNodes: [],
      relevantEdges: []
    };
  }

  if (targetSubjectKey === 'FINAL_SYNTHESIS') {
    const edgesToFinal = getIncomingEdges(graph, targetNode.nodeId);
    const conclusionNodeIds = new Set(edgesToFinal.map((e) => e.fromNodeId));
    const connectedConclusionNodes = graph.nodes.filter((n) => conclusionNodeIds.has(n.nodeId));

    const relevantEdgesList: ReasoningEdge[] = [...edgesToFinal];
    const evidenceNodeMap = new Map<string, ReasoningNode>();

    // For each conclusion node, find incoming edges from evidence nodes
    for (const conclusionNode of connectedConclusionNodes) {
      const edgesToConclusion = getIncomingEdges(graph, conclusionNode.nodeId);
      for (const edge of edgesToConclusion) {
        relevantEdgesList.push(edge);
        const sourceNode = findNodeById(graph, edge.fromNodeId);
        if (sourceNode && (sourceNode.type === 'EVIDENCE' || sourceNode.evidenceId)) {
          evidenceNodeMap.set(sourceNode.nodeId, sourceNode);
        }
      }
    }

    // Also check for any direct evidence nodes to final
    for (const edge of edgesToFinal) {
      const sourceNode = findNodeById(graph, edge.fromNodeId);
      if (sourceNode && (sourceNode.type === 'EVIDENCE' || sourceNode.evidenceId)) {
        evidenceNodeMap.set(sourceNode.nodeId, sourceNode);
      }
    }

    // Sort nodes deterministically by nodeId
    const connectedEvidenceNodes = Array.from(evidenceNodeMap.values()).sort((a, b) =>
      a.nodeId.localeCompare(b.nodeId)
    );

    return {
      targetNode,
      connectedConclusionNodes,
      connectedEvidenceNodes,
      relevantEdges: relevantEdgesList
    };
  }

  // Non-FINAL target node (e.g. NATAL_PROMISE, DASHA_ACTIVATION, D10_CONFIRMATION, etc.)
  const incomingEdges = getIncomingEdges(graph, targetNode.nodeId);
  const evidenceNodeMap = new Map<string, ReasoningNode>();

  for (const edge of incomingEdges) {
    const sourceNode = findNodeById(graph, edge.fromNodeId);
    if (sourceNode && (sourceNode.type === 'EVIDENCE' || sourceNode.evidenceId)) {
      evidenceNodeMap.set(sourceNode.nodeId, sourceNode);
    }
  }

  const connectedEvidenceNodes = Array.from(evidenceNodeMap.values()).sort((a, b) =>
    a.nodeId.localeCompare(b.nodeId)
  );

  return {
    targetNode,
    connectedConclusionNodes: [],
    connectedEvidenceNodes,
    relevantEdges: incomingEdges
  };
}
