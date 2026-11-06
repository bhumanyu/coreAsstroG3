import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from './__tests__/testHelpers';
import { selectCareerViewModel } from './careerViewModel';
import { selectWealthViewModel } from './wealthViewModel';
import { selectEvidenceExperience } from './evidenceExperienceViewModel';

describe('D03 evidence experience projection', () => {
  it('projects Career confidence from C11-owned metadata and resolves only known evidence occurrences', () => {
    const source = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        promise: { ...createProductAnalysis().career.promise, confidence: 'LOW' },
        evidence: [
          { id: 'ev-a', title: 'Career support', statement: 'A supportive factor.', direction: 'SUPPORT', role: 'PRIMARY', source: 'D1 Natal', ruleId: 'CAREER_RULE_01', derivedFromIds: ['ev-b', 'missing'] },
          { id: 'ev-b', title: 'Related factor', statement: 'A related occurrence.', direction: 'CHALLENGE', role: 'CHALLENGING', source: 'Dasha' }
        ]
      }
    });
    const vm = selectCareerViewModel(source);
    const result = selectEvidenceExperience(source, 'CAREER', vm.confidenceCompleteness);
    expect(result.owner).toBe('C11');
    expect(result.confidence).toBe('LOW');
    expect(result.evidence[0].resolvedRelatedEvidence).toEqual([{ id: 'ev-b', title: 'Related factor' }]);
    expect(result.evidence[0].unresolvedRelatedCount).toBe(1);
    expect(result.conflicts).toHaveLength(0);
    expect(result.evidence[1].direction).toBe('CHALLENGE');
  });

  it('keeps Wealth D2 unavailable and reports that state as a limitation, not an adverse factor', () => {
    const source = createProductAnalysis();
    const vm = selectWealthViewModel(source);
    const result = selectEvidenceExperience(source, 'WEALTH', vm.confidenceCompleteness);
    const d2 = result.layers.find(layer => layer.id === 'D2');
    expect(d2).toMatchObject({ state: 'UNAVAILABLE', stateLabel: 'Unavailable' });
    expect(d2?.reason).toMatch(/D2 remains unavailable/);
    expect(result.confidenceReasons.some(reason => /not negative evidence/i.test(reason))).toBe(true);
    expect(result.evidence.every(item => item.direction !== 'UNAVAILABLE')).toBe(true);
  });

  it('shows explicit conflicting evidence and does not classify all challenges as conflicts', () => {
    const base = createProductAnalysis();
    const source = createProductAnalysis({
      career: {
        ...base.career,
        evidence: [
          { id: 'support', title: 'Support', statement: 'Supports the claim.', direction: 'SUPPORT', role: 'PRIMARY', source: 'D1' },
          { id: 'challenge', title: 'Challenge', statement: 'Challenges the claim.', direction: 'CHALLENGE', role: 'CHALLENGING', source: 'D1' },
          { id: 'conflict', title: 'Mixed signal', statement: 'Evidence is mixed.', direction: 'MIXED', role: 'CONFLICTING', source: 'Synthesis' }
        ]
      }
    });
    const result = selectEvidenceExperience(source, 'CAREER');
    expect(result.conflicts.map(item => item.id)).toEqual(['conflict']);
    expect(result.evidence.map(item => item.id)).toEqual(['support', 'challenge', 'conflict']);
  });
});
