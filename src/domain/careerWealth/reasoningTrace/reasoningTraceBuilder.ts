import type {
  ReasoningNode,
  ReasoningNodeAxis,
  ReasoningNodeDomain,
  ReasoningNodeType
} from './reasoningNode';
import type { ReasoningEdge, ReasoningEdgeType } from './reasoningEdge';
import {
  type ReasoningTraceGraph,
  buildReasoningTraceId
} from './reasoningTraceGraph';
import {
  buildReasoningEdgeId,
  buildReasoningNodeId
} from './reasoningTraceIdentity';
import type { EvidenceProvenance } from '../provenance/evidenceProvenance';

export interface AddEvidenceNodeInput {
  readonly provenance: EvidenceProvenance;
  readonly label: string;
  readonly subjectKey?: string;
  readonly domain?: ReasoningNodeDomain;
}

export interface AddConclusionNodeInput {
  readonly type?: ReasoningNodeType;
  readonly domain?: ReasoningNodeDomain;
  readonly axis: ReasoningNodeAxis;
  readonly subjectKey: string;
  readonly label: string;
}

export interface AddEdgeInput {
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly type: ReasoningEdgeType;
  readonly explanation: string;
}

export class ReasoningTraceBuilder {
  private readonly domain: ReasoningNodeDomain;
  private readonly nodes = new Map<string, ReasoningNode>();
  private readonly edges = new Map<string, ReasoningEdge>();

  constructor(domain: ReasoningNodeDomain) {
    this.domain = domain;
  }

  private requireNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Reasoning node not found: ${nodeId}`);
    }
  }

  /**
   * Adds an EVIDENCE node directly from an EvidenceProvenance instance.
   * Dedups by nodeId and returns existing/new nodeId.
   */
  public addEvidenceNode(input: AddEvidenceNodeInput): string {
    const domain = input.domain ?? input.provenance.domain ?? this.domain;
    const subjectKey = input.subjectKey ?? input.provenance.ruleId;
    const nodeId = buildReasoningNodeId({
      type: 'EVIDENCE',
      domain,
      axis: input.provenance.axis,
      subjectKey,
      evidenceId: input.provenance.evidenceId
    });

    if (this.nodes.has(nodeId)) {
      return nodeId;
    }

    const node: ReasoningNode = Object.freeze({
      nodeId,
      type: 'EVIDENCE',
      domain,
      axis: input.provenance.axis,
      evidenceId: input.provenance.evidenceId,
      subjectKey,
      label: input.label
    });

    this.nodes.set(nodeId, node);
    return nodeId;
  }

  /**
   * Adds a CONCLUSION / SYNTHESIS / MANIFESTATION node.
   * Dedups by nodeId and returns existing/new nodeId.
   */
  public addConclusionNode(input: AddConclusionNodeInput): string {
    const type: ReasoningNodeType = input.type ?? 'CONCLUSION';
    const domain = input.domain ?? this.domain;
    const nodeId = buildReasoningNodeId({
      type,
      domain,
      axis: input.axis,
      subjectKey: input.subjectKey
    });

    if (this.nodes.has(nodeId)) {
      return nodeId;
    }

    const node: ReasoningNode = Object.freeze({
      nodeId,
      type,
      domain,
      axis: input.axis,
      subjectKey: input.subjectKey,
      label: input.label
    });

    this.nodes.set(nodeId, node);
    return nodeId;
  }

  /**
   * Adds a directional edge between two existing nodes.
   * Throws 'Reasoning node not found: <id>' if either fromNodeId or toNodeId does not exist.
   * Dedups identical (type, fromNodeId, toNodeId) edge definitions.
   */
  public addEdge(input: AddEdgeInput): string {
    this.requireNode(input.fromNodeId);
    this.requireNode(input.toNodeId);

    const edgeId = buildReasoningEdgeId({
      type: input.type,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId
    });

    if (this.edges.has(edgeId)) {
      return edgeId;
    }

    const edge: ReasoningEdge = Object.freeze({
      edgeId,
      fromNodeId: input.fromNodeId,
      toNodeId: input.toNodeId,
      type: input.type,
      explanation: input.explanation
    });

    this.edges.set(edgeId, edge);
    return edgeId;
  }

  /**
   * Builds the finalized ReasoningTraceGraph.
   * Nodes and edges are deterministically sorted by id before freezing.
   */
  public build(): ReasoningTraceGraph {
    const sortedNodes = Array.from(this.nodes.values()).sort((a, b) =>
      a.nodeId.localeCompare(b.nodeId)
    );
    const sortedEdges = Array.from(this.edges.values()).sort((a, b) =>
      a.edgeId.localeCompare(b.edgeId)
    );

    return Object.freeze({
      traceId: buildReasoningTraceId(this.domain),
      nodes: Object.freeze(sortedNodes),
      edges: Object.freeze(sortedEdges)
    });
  }
}
