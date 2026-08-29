import { describe, expect, it } from 'vitest';
import {
  validateEvidenceNodes,
  validateReasoningTrace
} from './reasoningTraceValidator';
import type { ReasoningTraceGraph } from './reasoningTraceGraph';
import type { ReasoningNode } from './reasoningNode';
import type { ReasoningEdge } from './reasoningEdge';

describe('reasoningTraceValidator (CW-06B)', () => {
  const nodeA: ReasoningNode = {
    nodeId: 'CW-TRACE-NODE-EVIDENCE-CAREER-NATAL-10H-EVID_1',
    type: 'EVIDENCE',
    domain: 'CAREER',
    axis: 'NATAL',
    subjectKey: '10H',
    evidenceId: 'EVID_1',
    label: '10th house evidence'
  };

  const nodeB: ReasoningNode = {
    nodeId: 'CW-TRACE-NODE-CONCLUSION-CAREER-NATAL-NATAL_PROMISE',
    type: 'CONCLUSION',
    domain: 'CAREER',
    axis: 'NATAL',
    subjectKey: 'NATAL_PROMISE',
    label: 'Natal career promise'
  };

  const validEdge: ReasoningEdge = {
    edgeId: 'CW-TRACE-EDGE-SUPPORTS-NODEA-NODEB',
    fromNodeId: nodeA.nodeId,
    toNodeId: nodeB.nodeId,
    type: 'SUPPORTS',
    explanation: 'Evidence supports conclusion'
  };

  it('accepts a structurally valid reasoning trace graph', () => {
    const validGraph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [nodeA, nodeB],
      edges: [validEdge]
    };

    expect(() => validateReasoningTrace(validGraph)).not.toThrow();
  });

  it('rejects an edge referencing a missing source node', () => {
    const invalidGraph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [nodeB],
      edges: [validEdge]
    };

    expect(() => validateReasoningTrace(invalidGraph)).toThrow(
      /Unknown edge source node: CW-TRACE-NODE-EVIDENCE-CAREER-NATAL-10H-EVID_1/
    );
  });

  it('rejects an edge referencing a missing target node', () => {
    const invalidGraph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [nodeA],
      edges: [validEdge]
    };

    expect(() => validateReasoningTrace(invalidGraph)).toThrow(
      /Unknown edge target node: CW-TRACE-NODE-CONCLUSION-CAREER-NATAL-NATAL_PROMISE/
    );
  });

  it('rejects a self-edge', () => {
    const selfEdge: ReasoningEdge = {
      edgeId: 'CW-TRACE-EDGE-SUPPORTS-NODEA-NODEA',
      fromNodeId: nodeA.nodeId,
      toNodeId: nodeA.nodeId,
      type: 'SUPPORTS',
      explanation: 'Loops onto itself'
    };

    const invalidGraph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [nodeA],
      edges: [selfEdge]
    };

    expect(() => validateReasoningTrace(invalidGraph)).toThrow(
      /Self-edge detected on node/
    );
  });

  describe('validateEvidenceNodes', () => {
    it('accepts graph when all evidence nodes reference known evidenceIds', () => {
      const graph: ReasoningTraceGraph = {
        traceId: 'CW-TRACE-CAREER',
        nodes: [nodeA, nodeB],
        edges: [validEdge]
      };

      const knownEvidenceIds = new Set(['EVID_1', 'EVID_2']);
      expect(() => validateEvidenceNodes(graph, knownEvidenceIds)).not.toThrow();
    });

    it('rejects graph when an evidence node references an unknown evidenceId', () => {
      const graph: ReasoningTraceGraph = {
        traceId: 'CW-TRACE-CAREER',
        nodes: [nodeA, nodeB],
        edges: [validEdge]
      };

      const knownEvidenceIds = new Set(['SOME_OTHER_EVID']);
      expect(() => validateEvidenceNodes(graph, knownEvidenceIds)).toThrow(
        /Evidence node references unknown evidenceId: EVID_1/
      );
    });
  });
});
