import { describe, expect, it } from 'vitest';
import type { DomainEvidence } from '../../interpretation';
import {
  buildReasoningTraceCompleteness,
  type ReasoningTraceEvidenceReference
} from './reasoningTraceCompleteness';
import type { ReasoningTraceGraph } from './reasoningTraceGraph';

function evidence(overrides: Partial<DomainEvidence> = {}): DomainEvidence {
  return {
    id: 'CAREER-NATAL-OCC-1',
    sourceType: 'ASTROLOGY' as DomainEvidence['sourceType'],
    domain: 'CAREER',
    role: 'PRIMARY',
    phase: 'NATAL_PROMISE',
    source: 'D1',
    statement: 'Natal chart input',
    polarity: 'SUPPORTING',
    strength: 'STRONG',
    priority: 1,
    relatedEvidenceIds: [],
    identityKey: 'CAREER-NATAL-SEM-1',
    ruleId: 'CAREER-NATAL-RULE-1',
    planet: 'MARS' as DomainEvidence['planet'],
    house: 10,
    ...overrides
  } as DomainEvidence;
}

describe('A09 — end-to-end reasoning trace completeness', () => {
  it('builds a complete representative Career C11 trace using semantic identities and occurrence IDs separately', () => {
    const natal = evidence();
    const dasha = evidence({
      id: 'CAREER-DASHA-OCC-1',
      identityKey: 'CAREER-DASHA-SEM-1',
      source: 'DASHA',
      phase: 'DASHA_ACTIVATION',
      role: 'TIMING',
      timing: { period: 'MD', planet: 'JUPITER' as DomainEvidence['planet'] },
      relatedEvidenceIds: [natal.id],
      ruleId: 'CAREER-DASHA-RULE-1'
    });
    const refs: readonly ReasoningTraceEvidenceReference[] = [
      { id: natal.identityKey!, namespace: 'IDENTITY' },
      { id: dasha.identityKey!, namespace: 'IDENTITY' }
    ];
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: refs,
      evidence: [natal, dasha]
    });
    expect(result.status).toBe('COMPLETE');
    expect(result.resolvedEvidenceOccurrenceCount).toBe(2);
    expect(result.links.map(link => link.evidenceOccurrenceId)).toEqual([
      'CAREER-DASHA-OCC-1',
      'CAREER-NATAL-OCC-1'
    ]);
    expect(result.links.every(link => link.synthesisEvidenceNamespace === 'IDENTITY')).toBe(true);
    expect(result.links.find(link => link.evidenceOccurrenceId === dasha.id)?.sourceRecordOccurrenceIds).toEqual([natal.id]);
    expect(result.links.find(link => link.evidenceOccurrenceId === dasha.id)?.sourceRuleId).toBe('CAREER-DASHA-RULE-1');
  });

  it('builds a complete representative Wealth CW-05 trace using occurrence references', () => {
    const natal = evidence({
      id: 'WEALTH-NATAL-OCC-1',
      identityKey: 'WEALTH-NATAL-SEM-1',
      domain: 'WEALTH',
      source: 'D1',
      house: 2,
      ruleId: 'WEALTH-NATAL-RULE-1'
    });
    const dasha = evidence({
      id: 'WEALTH-DASHA-OCC-1',
      identityKey: 'WEALTH-DASHA-SEM-1',
      domain: 'WEALTH',
      source: 'DASHA',
      phase: 'DASHA_ACTIVATION',
      role: 'TIMING',
      timing: { period: 'AD', planet: 'VENUS' as DomainEvidence['planet'] },
      relatedEvidenceIds: [natal.id],
      ruleId: 'WEALTH-DASHA-RULE-1'
    });
    const result = buildReasoningTraceCompleteness({
      domain: 'WEALTH',
      conclusionNodeId: 'WEALTH-CW05-FINAL',
      synthesisRuleId: 'CW-05-WEALTH-SYNTHESIS',
      synthesisEvidenceReferences: [
        { id: natal.id, namespace: 'OCCURRENCE' },
        { id: dasha.id, namespace: 'OCCURRENCE' }
      ],
      evidence: [natal, dasha]
    });
    expect(result.status).toBe('COMPLETE');
    expect(result.links.every(link => link.synthesisEvidenceNamespace === 'OCCURRENCE')).toBe(true);
    expect(result.links.map(link => link.evidenceOccurrenceId)).toContain('WEALTH-NATAL-OCC-1');
  });

  it('resolves semantic identities using the canonical trimmed identity convention', () => {
    const paddedIdentity = evidence({ identityKey: '  CAREER-NATAL-SEM-1  ' });
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: ' CAREER-NATAL-SEM-1 ', namespace: 'IDENTITY' }],
      evidence: [paddedIdentity]
    });
    expect(result.status).toBe('COMPLETE');
    expect(result.resolvedEvidenceOccurrenceCount).toBe(1);
    expect(result.links[0].synthesisEvidenceReference).toBe('CAREER-NATAL-SEM-1');
  });

  it('diagnoses a missing producer/source rule', () => {
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'CAREER-NATAL-SEM-1', namespace: 'IDENTITY' }],
      evidence: [evidence({ ruleId: undefined })]
    });
    expect(result.status).toBe('PARTIAL');
    expect(result.diagnostics.some(item => item.code === 'MISSING_SOURCE_RULE')).toBe(true);
  });

  it('diagnoses a missing chart calculation or source-record link', () => {
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'CAREER-NATAL-SEM-1', namespace: 'IDENTITY' }],
      evidence: [evidence({ planet: undefined, house: undefined, timing: undefined, evidenceFamily: undefined })]
    });
    expect(result.diagnostics.some(item => item.code === 'MISSING_CHART_CALCULATION_LINK')).toBe(true);
  });

  it('accepts an explicit source record ID when no planet or house reference exists', () => {
    const sourceRecord = evidence({
      planet: undefined,
      house: undefined,
      timing: undefined,
      evidenceFamily: undefined,
      sourceRecordId: 'CHART-CALCULATION-RECORD-17'
    });
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'CAREER-NATAL-SEM-1', namespace: 'IDENTITY' }],
      evidence: [sourceRecord]
    });
    expect(result.diagnostics.some(item => item.code === 'MISSING_CHART_CALCULATION_LINK')).toBe(false);
    expect(result.links[0].sourceRecordId).toBe('CHART-CALCULATION-RECORD-17');
  });

  it('diagnoses invalid related-evidence links without resolving them through semantic aliases', () => {
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'CAREER-NATAL-SEM-1', namespace: 'IDENTITY' }],
      evidence: [evidence({ relatedEvidenceIds: ['CAREER-NATAL-SEM-1'] })]
    });
    expect(result.diagnostics.some(item => item.code === 'INVALID_RELATED_EVIDENCE_LINK' && item.reference === 'CAREER-NATAL-SEM-1')).toBe(true);
  });

  it('preserves two distinct occurrences sharing one semantic root identity', () => {
    const first = evidence({ id: 'OCCURRENCE-A', identityKey: 'SHARED-SEMANTIC-IDENTITY' });
    const second = evidence({ id: 'OCCURRENCE-B', identityKey: 'SHARED-SEMANTIC-IDENTITY', ruleId: 'RULE-B' });
    const dependent = evidence({
      id: 'OCCURRENCE-C',
      identityKey: 'DEPENDENT-SEMANTIC-IDENTITY',
      ruleId: 'RULE-C',
      rootEvidenceIds: ['SHARED-SEMANTIC-IDENTITY'],
      relatedEvidenceIds: ['OCCURRENCE-A', 'OCCURRENCE-B']
    });
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'SHARED-SEMANTIC-IDENTITY', namespace: 'IDENTITY' }],
      evidence: [first, second, dependent]
    });
    expect(result.resolvedEvidenceOccurrenceCount).toBe(2);
    expect(result.links.map(link => link.evidenceOccurrenceId)).toEqual(['OCCURRENCE-A', 'OCCURRENCE-B', 'OCCURRENCE-C']);
    expect(result.links.filter(link => link.semanticIdentityKey === 'SHARED-SEMANTIC-IDENTITY')).toHaveLength(2);
    expect(result.links.find(link => link.evidenceOccurrenceId === 'OCCURRENCE-C')?.rootEvidenceIdentityKeys).toEqual(['SHARED-SEMANTIC-IDENTITY']);
    expect(result.diagnostics.some(item => item.code === 'UNRESOLVED_ROOT_EVIDENCE_LINK')).toBe(false);
  });

  it('round-trips the trace report through API-style JSON serialization', () => {
    const result = buildReasoningTraceCompleteness({
      domain: 'CAREER',
      conclusionNodeId: 'CAREER-C11-FINAL',
      synthesisRuleId: 'C11',
      synthesisEvidenceReferences: [{ id: 'CAREER-NATAL-SEM-1', namespace: 'IDENTITY' }],
      evidence: [evidence()]
    });
    const graph: ReasoningTraceGraph = {
      traceId: 'CW-TRACE-CAREER',
      nodes: [],
      edges: [],
      traceCompleteness: result
    };
    const roundTrip = JSON.parse(JSON.stringify(graph)) as ReasoningTraceGraph;
    expect(roundTrip.traceCompleteness).toEqual(result);
  });
});
