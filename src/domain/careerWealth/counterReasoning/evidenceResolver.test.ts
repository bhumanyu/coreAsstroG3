import { describe, expect, it } from 'vitest';
import { resolveEvidence } from './evidenceResolver';
import type { ReasoningTraceGraph } from '../reasoningTrace/reasoningTraceGraph';

describe('evidenceResolver (CW-07)', () => {
  const sampleGraph: ReasoningTraceGraph = {
    traceId: 'CW-TRACE-CAREER',
    nodes: [
      // Evidence Nodes
      {
        nodeId: 'node_ev_1',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'NATAL',
        evidenceId: 'EV_NATAL_1',
        subjectKey: 'RULE_SUN_10H',
        label: 'Sun in 10th'
      },
      {
        nodeId: 'node_ev_2',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'NATAL',
        evidenceId: 'EV_NATAL_2',
        subjectKey: 'RULE_SATURN_AFFLICTION',
        label: 'Saturn aspects 10th'
      },
      {
        nodeId: 'node_ev_3',
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'DASHA',
        evidenceId: 'EV_DASHA_1',
        subjectKey: 'RULE_RAHU_DASHA',
        label: 'Rahu Dasha active'
      },
      // Conclusion / Axis Nodes
      {
        nodeId: 'node_natal_promise',
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'NATAL',
        subjectKey: 'NATAL_PROMISE',
        label: 'Natal Promise'
      },
      {
        nodeId: 'node_dasha_activation',
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'DASHA',
        subjectKey: 'DASHA_ACTIVATION',
        label: 'Dasha Activation'
      },
      // Synthesis Node
      {
        nodeId: 'node_final_synthesis',
        type: 'SYNTHESIS',
        domain: 'CAREER',
        axis: 'FINAL',
        subjectKey: 'FINAL_SYNTHESIS',
        label: 'Final Career Synthesis'
      }
    ],
    edges: [
      // Evidence -> Axis conclusion edges
      {
        edgeId: 'e1',
        fromNodeId: 'node_ev_1',
        toNodeId: 'node_natal_promise',
        type: 'SUPPORTS',
        explanation: 'Sun supports career promise'
      },
      {
        edgeId: 'e2',
        fromNodeId: 'node_ev_2',
        toNodeId: 'node_natal_promise',
        type: 'CHALLENGES',
        explanation: 'Saturn challenges promise'
      },
      {
        edgeId: 'e3',
        fromNodeId: 'node_ev_3',
        toNodeId: 'node_dasha_activation',
        type: 'ACTIVATES',
        explanation: 'Rahu dasha activates career'
      },
      // Axis conclusion -> FINAL edges
      {
        edgeId: 'e4',
        fromNodeId: 'node_natal_promise',
        toNodeId: 'node_final_synthesis',
        type: 'SUPPORTS',
        explanation: 'Natal promise supports final'
      },
      {
        edgeId: 'e5',
        fromNodeId: 'node_dasha_activation',
        toNodeId: 'node_final_synthesis',
        type: 'ACTIVATES',
        explanation: 'Dasha activates final'
      }
    ]
  };

  it('transitively resolves evidence for FINAL_SYNTHESIS through axis conclusion nodes', () => {
    const res = resolveEvidence(sampleGraph, 'FINAL_SYNTHESIS', 'CAREER');

    expect(res.supportingEvidenceIds).toEqual(['EV_DASHA_1', 'EV_NATAL_1']);
    expect(res.challengingEvidenceIds).toEqual(['EV_NATAL_2']);
    expect(res.factors.length).toBeGreaterThan(0);
    expect(res.factors.some((f) => f.edgeType === 'ACTIVATES' && f.relation === 'SUPPORT')).toBe(true);
    expect(res.factors.some((f) => f.edgeType === 'CHALLENGES' && f.relation === 'CHALLENGE')).toBe(true);
  });

  it('directly resolves evidence for a specific axis conclusion node (NATAL_PROMISE)', () => {
    const res = resolveEvidence(sampleGraph, 'NATAL_PROMISE', 'CAREER');

    expect(res.supportingEvidenceIds).toEqual(['EV_NATAL_1']);
    expect(res.challengingEvidenceIds).toEqual(['EV_NATAL_2']);
  });

  it('directly resolves evidence for DASHA_ACTIVATION', () => {
    const res = resolveEvidence(sampleGraph, 'DASHA_ACTIVATION', 'CAREER');

    expect(res.supportingEvidenceIds).toEqual(['EV_DASHA_1']);
    expect(res.challengingEvidenceIds).toEqual([]);
  });

  it('returns empty evidence lists when target subject does not exist in graph', () => {
    const res = resolveEvidence(sampleGraph, 'NON_EXISTENT_KEY', 'CAREER');

    expect(res.supportingEvidenceIds).toEqual([]);
    expect(res.challengingEvidenceIds).toEqual([]);
  });
});
