import { describe, expect, it } from 'vitest';
import {
  buildReasoningEdgeId,
  buildReasoningNodeId,
  normalize
} from './reasoningTraceIdentity';

describe('reasoningTraceIdentity - Determinism & Structural IDs (CW-06B)', () => {
  describe('normalize', () => {
    it('normalizes strings by uppercase, converting non-alphanumeric to underscores, stripping edge underscores', () => {
      expect(normalize('  career_6l_10l-link  ')).toBe('CAREER_6L_10L_LINK');
      expect(normalize('___test--case___')).toBe('TEST_CASE');
    });
  });

  describe('buildReasoningNodeId', () => {
    it('produces a stable node ID for conclusion nodes', () => {
      const id1 = buildReasoningNodeId({
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'NATAL',
        subjectKey: 'NATAL_PROMISE'
      });
      const id2 = buildReasoningNodeId({
        type: 'CONCLUSION',
        domain: 'CAREER',
        axis: 'NATAL',
        subjectKey: 'NATAL_PROMISE'
      });

      expect(id1).toBe('CW-TRACE-NODE-CONCLUSION-CAREER-NATAL-NATAL_PROMISE');
      expect(id1).toBe(id2);
    });

    it('produces a stable node ID with evidenceId included for evidence nodes', () => {
      const id = buildReasoningNodeId({
        type: 'EVIDENCE',
        domain: 'CAREER',
        axis: 'NATAL',
        subjectKey: 'L6_L10_LINK',
        evidenceId: 'CW-CAREER-NATAL-D1-CAREER_6L_10L_LINK_001-L6_L10_LINK-SUPPORT-PRIMARY'
      });

      expect(id).toBe(
        'CW-TRACE-NODE-EVIDENCE-CAREER-NATAL-L6_L10_LINK-CW_CAREER_NATAL_D1_CAREER_6L_10L_LINK_001_L6_L10_LINK_SUPPORT_PRIMARY'
      );
    });

    it('throws when subjectKey is empty', () => {
      expect(() =>
        buildReasoningNodeId({
          type: 'CONCLUSION',
          domain: 'CAREER',
          axis: 'NATAL',
          subjectKey: '   '
        })
      ).toThrow(/Reasoning node subjectKey must not be empty/);
    });
  });

  describe('buildReasoningEdgeId', () => {
    it('produces a stable edge ID for identical endpoints and type', () => {
      const from = 'CW-TRACE-NODE-EVIDENCE-CAREER-NATAL-L6_L10_LINK';
      const to = 'CW-TRACE-NODE-CONCLUSION-CAREER-NATAL-NATAL_PROMISE';

      const edgeId1 = buildReasoningEdgeId({
        type: 'SUPPORTS',
        fromNodeId: from,
        toNodeId: to
      });
      const edgeId2 = buildReasoningEdgeId({
        type: 'SUPPORTS',
        fromNodeId: from,
        toNodeId: to
      });

      expect(edgeId1).toBe(
        'CW-TRACE-EDGE-SUPPORTS-CW_TRACE_NODE_EVIDENCE_CAREER_NATAL_L6_L10_LINK-CW_TRACE_NODE_CONCLUSION_CAREER_NATAL_NATAL_PROMISE'
      );
      expect(edgeId1).toBe(edgeId2);
    });

    it('changes edge ID when type changes between SUPPORTS and CHALLENGES', () => {
      const from = 'CW-TRACE-NODE-EVIDENCE-CAREER-NATAL-L6_L10_LINK';
      const to = 'CW-TRACE-NODE-CONCLUSION-CAREER-NATAL-NATAL_PROMISE';

      const supportEdge = buildReasoningEdgeId({
        type: 'SUPPORTS',
        fromNodeId: from,
        toNodeId: to
      });
      const challengeEdge = buildReasoningEdgeId({
        type: 'CHALLENGES',
        fromNodeId: from,
        toNodeId: to
      });

      expect(supportEdge).not.toBe(challengeEdge);
      expect(supportEdge).toContain('SUPPORTS');
      expect(challengeEdge).toContain('CHALLENGES');
    });

    it('throws when fromNodeId or toNodeId is empty', () => {
      expect(() =>
        buildReasoningEdgeId({
          type: 'SUPPORTS',
          fromNodeId: '',
          toNodeId: 'TARGET'
        })
      ).toThrow(/fromNodeId must not be empty/);

      expect(() =>
        buildReasoningEdgeId({
          type: 'SUPPORTS',
          fromNodeId: 'SOURCE',
          toNodeId: '   '
        })
      ).toThrow(/toNodeId must not be empty/);
    });
  });
});
