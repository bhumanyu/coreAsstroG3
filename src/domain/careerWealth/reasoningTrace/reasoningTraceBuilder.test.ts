import { describe, expect, it } from 'vitest';
import { ReasoningTraceBuilder } from './reasoningTraceBuilder';
import type { EvidenceProvenance } from '../provenance/evidenceProvenance';

describe('ReasoningTraceBuilder (CW-06B)', () => {
  const sampleProvenance: EvidenceProvenance = {
    evidenceId: 'CW-CAREER-NATAL-D1-CAREER_6L_10L_LINK_001-L6_L10_LINK-SUPPORT-PRIMARY',
    ruleId: 'CAREER_6L_10L_LINK_001',
    domain: 'CAREER',
    axis: 'NATAL',
    source: 'D1',
    effect: 'SUPPORT',
    strength: 'PRIMARY'
  };

  it('creates an evidence node correctly', () => {
    const builder = new ReasoningTraceBuilder('CAREER');
    const nodeId = builder.addEvidenceNode({
      provenance: sampleProvenance,
      label: 'Mars aspects 10th lord Saturn',
      subjectKey: 'L6_L10_LINK'
    });

    const graph = builder.build();
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].nodeId).toBe(nodeId);
    expect(graph.nodes[0].type).toBe('EVIDENCE');
    expect(graph.nodes[0].evidenceId).toBe(sampleProvenance.evidenceId);
    expect(graph.nodes[0].axis).toBe('NATAL');
  });

  it('deduplicates identical evidence nodes and returns existing id', () => {
    const builder = new ReasoningTraceBuilder('CAREER');
    const nodeId1 = builder.addEvidenceNode({
      provenance: sampleProvenance,
      label: 'Mars aspects 10th lord Saturn',
      subjectKey: 'L6_L10_LINK'
    });
    const nodeId2 = builder.addEvidenceNode({
      provenance: sampleProvenance,
      label: 'Mars aspects 10th lord Saturn (duplicate call)',
      subjectKey: 'L6_L10_LINK'
    });

    expect(nodeId1).toBe(nodeId2);
    const graph = builder.build();
    expect(graph.nodes).toHaveLength(1);
  });

  it('creates valid edges between existing nodes', () => {
    const builder = new ReasoningTraceBuilder('CAREER');
    const evNodeId = builder.addEvidenceNode({
      provenance: sampleProvenance,
      label: 'Mars aspects 10th lord Saturn',
      subjectKey: 'L6_L10_LINK'
    });
    const concNodeId = builder.addConclusionNode({
      axis: 'NATAL',
      subjectKey: 'NATAL_PROMISE',
      label: 'Strong career promise'
    });

    const edgeId = builder.addEdge({
      fromNodeId: evNodeId,
      toNodeId: concNodeId,
      type: 'SUPPORTS',
      explanation: '6th and 10th lord link supports professional execution'
    });

    const graph = builder.build();
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].edgeId).toBe(edgeId);
    expect(graph.edges[0].fromNodeId).toBe(evNodeId);
    expect(graph.edges[0].toNodeId).toBe(concNodeId);
  });

  it('rejects adding an edge with unknown source or target node', () => {
    const builder = new ReasoningTraceBuilder('CAREER');
    const concNodeId = builder.addConclusionNode({
      axis: 'NATAL',
      subjectKey: 'NATAL_PROMISE',
      label: 'Strong career promise'
    });

    expect(() =>
      builder.addEdge({
        fromNodeId: 'NON_EXISTENT_NODE',
        toNodeId: concNodeId,
        type: 'SUPPORTS',
        explanation: 'Invalid link'
      })
    ).toThrow(/Reasoning node not found: NON_EXISTENT_NODE/);

    expect(() =>
      builder.addEdge({
        fromNodeId: concNodeId,
        toNodeId: 'NON_EXISTENT_TARGET',
        type: 'SUPPORTS',
        explanation: 'Invalid link'
      })
    ).toThrow(/Reasoning node not found: NON_EXISTENT_TARGET/);
  });

  it('deduplicates identical edges and allows distinct-type edges between same nodes', () => {
    const builder = new ReasoningTraceBuilder('CAREER');
    const nodeA = builder.addConclusionNode({
      axis: 'NATAL',
      subjectKey: 'PROMISE',
      label: 'Promise'
    });
    const nodeB = builder.addConclusionNode({
      axis: 'FINAL',
      subjectKey: 'FINAL_SYNTHESIS',
      label: 'Final'
    });

    // Add duplicate SUPPORTS edges
    const edgeId1 = builder.addEdge({
      fromNodeId: nodeA,
      toNodeId: nodeB,
      type: 'SUPPORTS',
      explanation: 'First reason'
    });
    const edgeId2 = builder.addEdge({
      fromNodeId: nodeA,
      toNodeId: nodeB,
      type: 'SUPPORTS',
      explanation: 'Duplicate reason'
    });

    expect(edgeId1).toBe(edgeId2);
    expect(builder.build().edges).toHaveLength(1);

    // Add distinct CHALLENGES edge between the same nodes
    builder.addEdge({
      fromNodeId: nodeA,
      toNodeId: nodeB,
      type: 'CHALLENGES',
      explanation: 'Caveat modifier'
    });

    const graph = builder.build();
    expect(graph.edges).toHaveLength(2);
  });

  it('guarantees deterministic output independent of insertion order (Section 31)', () => {
    const prov1: EvidenceProvenance = {
      evidenceId: 'CW-CAREER-NATAL-D1-CAREER_10H_001-H10_OCCUPATION-SUPPORT-PRIMARY',
      ruleId: 'CAREER_10H_001',
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      effect: 'SUPPORT',
      strength: 'PRIMARY'
    };

    const prov2: EvidenceProvenance = {
      evidenceId: 'CW-CAREER-DASHA-DASHA-CAREER_MD_001-MD_SATURN-ACTIVATES-SECONDARY',
      ruleId: 'CAREER_MD_001',
      domain: 'CAREER',
      axis: 'DASHA',
      source: 'DASHA',
      effect: 'SUPPORT',
      strength: 'SECONDARY'
    };

    // Graph 1: Insertion Order A
    const builder1 = new ReasoningTraceBuilder('CAREER');
    const ev1_g1 = builder1.addEvidenceNode({ provenance: prov1, label: '10th House strong' });
    const ev2_g1 = builder1.addEvidenceNode({ provenance: prov2, label: 'Saturn MD active' });
    const concNatal_g1 = builder1.addConclusionNode({ axis: 'NATAL', subjectKey: 'NATAL_PROMISE', label: 'Natal Promise' });
    const concDasha_g1 = builder1.addConclusionNode({ axis: 'DASHA', subjectKey: 'DASHA_ACTIVATION', label: 'Dasha Activation' });
    const concFinal_g1 = builder1.addConclusionNode({ axis: 'FINAL', subjectKey: 'FINAL_SYNTHESIS', label: 'Final Outcome' });

    builder1.addEdge({ fromNodeId: ev1_g1, toNodeId: concNatal_g1, type: 'SUPPORTS', explanation: 'Supports natal' });
    builder1.addEdge({ fromNodeId: ev2_g1, toNodeId: concDasha_g1, type: 'ACTIVATES', explanation: 'Activates timing' });
    builder1.addEdge({ fromNodeId: concNatal_g1, toNodeId: concFinal_g1, type: 'SUPPORTS', explanation: 'Natal to final' });
    builder1.addEdge({ fromNodeId: concDasha_g1, toNodeId: concFinal_g1, type: 'ACTIVATES', explanation: 'Dasha to final' });
    const graph1 = builder1.build();

    // Graph 2: Inverted / Permuted Insertion Order B
    const builder2 = new ReasoningTraceBuilder('CAREER');
    const concFinal_g2 = builder2.addConclusionNode({ axis: 'FINAL', subjectKey: 'FINAL_SYNTHESIS', label: 'Final Outcome' });
    const concDasha_g2 = builder2.addConclusionNode({ axis: 'DASHA', subjectKey: 'DASHA_ACTIVATION', label: 'Dasha Activation' });
    const ev2_g2 = builder2.addEvidenceNode({ provenance: prov2, label: 'Saturn MD active' });
    const concNatal_g2 = builder2.addConclusionNode({ axis: 'NATAL', subjectKey: 'NATAL_PROMISE', label: 'Natal Promise' });
    const ev1_g2 = builder2.addEvidenceNode({ provenance: prov1, label: '10th House strong' });

    // Reverse order of edges
    builder2.addEdge({ fromNodeId: concDasha_g2, toNodeId: concFinal_g2, type: 'ACTIVATES', explanation: 'Dasha to final' });
    builder2.addEdge({ fromNodeId: concNatal_g2, toNodeId: concFinal_g2, type: 'SUPPORTS', explanation: 'Natal to final' });
    builder2.addEdge({ fromNodeId: ev2_g2, toNodeId: concDasha_g2, type: 'ACTIVATES', explanation: 'Activates timing' });
    builder2.addEdge({ fromNodeId: ev1_g2, toNodeId: concNatal_g2, type: 'SUPPORTS', explanation: 'Supports natal' });
    const graph2 = builder2.build();

    // Deep equality assertion
    expect(graph1).toEqual(graph2);
    expect(graph1.nodes.map((n) => n.nodeId)).toEqual(graph2.nodes.map((n) => n.nodeId));
    expect(graph1.edges.map((e) => e.edgeId)).toEqual(graph2.edges.map((e) => e.edgeId));
  });
});
