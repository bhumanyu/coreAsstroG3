import type { ReasoningNode, ReasoningNodeDomain } from '../reasoningTrace/reasoningNode';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';
import type { CounterReasoningEvidenceResolution } from './counterReasoningTypes';
import { resolveGraphContext } from './reasoningGraphResolver';

const SUPPORTING_EDGE_TYPES = new Set(['SUPPORTS', 'CONFIRMS', 'ACTIVATES', 'MANIFESTS']);
const CHALLENGING_EDGE_TYPES = new Set(['CHALLENGES', 'CONTRADICTS']);

/**
 * Resolves supporting and challenging evidence IDs and nodes for a target subjectKey in the graph.
 * Enforces disjoint, deduplicated, and deterministically sorted results.
 */
export function resolveEvidence(
  graph: ReasoningTraceGraph,
  targetSubjectKey: string,
  domain: ReasoningNodeDomain
): CounterReasoningEvidenceResolution {
  const context = resolveGraphContext(graph, targetSubjectKey, domain);

  if (!context.targetNode || context.connectedEvidenceNodes.length === 0) {
    return {
      supportingEvidenceIds: [],
      challengingEvidenceIds: [],
      supportingNodes: [],
      challengingNodes: []
    };
  }

  const supportingIdSet = new Set<string>();
  const challengingIdSet = new Set<string>();
  const supportingNodeMap = new Map<string, ReasoningNode>();
  const challengingNodeMap = new Map<string, ReasoningNode>();

  for (const evNode of context.connectedEvidenceNodes) {
    const evidenceId = evNode.evidenceId ?? evNode.nodeId;

    // Find outgoing edges from this evidence node within the relevant edges
    const outgoingEdges = context.relevantEdges.filter((e) => e.fromNodeId === evNode.nodeId);

    let isChallenging = false;
    let isSupporting = false;

    for (const edge of outgoingEdges) {
      if (CHALLENGING_EDGE_TYPES.has(edge.type)) {
        isChallenging = true;
      } else if (SUPPORTING_EDGE_TYPES.has(edge.type)) {
        isSupporting = true;
      }
    }

    if (isChallenging) {
      challengingIdSet.add(evidenceId);
      challengingNodeMap.set(evidenceId, evNode);
    } else if (isSupporting) {
      supportingIdSet.add(evidenceId);
      supportingNodeMap.set(evidenceId, evNode);
    }
  }

  // Ensure disjoint sets: if an ID is challenging, remove it from supporting
  for (const id of challengingIdSet) {
    supportingIdSet.delete(id);
    supportingNodeMap.delete(id);
  }

  const supportingEvidenceIds = Array.from(supportingIdSet).sort((a, b) => a.localeCompare(b));
  const challengingEvidenceIds = Array.from(challengingIdSet).sort((a, b) => a.localeCompare(b));

  const supportingNodes = supportingEvidenceIds
    .map((id) => supportingNodeMap.get(id)!)
    .filter(Boolean);

  const challengingNodes = challengingEvidenceIds
    .map((id) => challengingNodeMap.get(id)!)
    .filter(Boolean);

  return {
    supportingEvidenceIds,
    challengingEvidenceIds,
    supportingNodes,
    challengingNodes
  };
}
