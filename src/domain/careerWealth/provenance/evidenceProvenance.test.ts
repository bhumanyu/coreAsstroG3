import { describe, expect, it } from 'vitest';
import {
  assertUniqueEvidenceIds,
  createEvidenceProvenance,
  type EvidenceIdentityInput
} from './index';

describe('CW-06A Evidence Provenance & Factory', () => {
  const sampleInput: EvidenceIdentityInput = {
    domain: 'CAREER',
    axis: 'NATAL',
    source: 'D1',
    ruleId: 'CAREER_10TH_LORD_SUPPORT',
    subjectKey: 'SATURN',
    effect: 'SUPPORT',
    strength: 'PRIMARY'
  };

  it('creates complete provenance with expected literal evidenceId', () => {
    const provenance = createEvidenceProvenance(sampleInput);

    expect(provenance.evidenceId).toBe(
      'CW-CAREER-NATAL-D1-CAREER_10TH_LORD_SUPPORT-SATURN-SUPPORT-PRIMARY'
    );
    expect(provenance.domain).toBe('CAREER');
    expect(provenance.axis).toBe('NATAL');
    expect(provenance.source).toBe('D1');
    expect(provenance.ruleId).toBe('CAREER_10TH_LORD_SUPPORT');
    expect(provenance.effect).toBe('SUPPORT');
    expect(provenance.strength).toBe('PRIMARY');
  });

  it('returns a frozen immutable object', () => {
    const provenance = createEvidenceProvenance(sampleInput);
    expect(Object.isFrozen(provenance)).toBe(true);
  });

  it('maintains ruleId distinct from evidenceId, but evidenceId embeds ruleId', () => {
    const provenance = createEvidenceProvenance(sampleInput);
    expect(provenance.ruleId).not.toBe(provenance.evidenceId);
    expect(provenance.evidenceId).toContain(provenance.ruleId);
  });

  it('assertUniqueEvidenceIds succeeds for unique collections', () => {
    const p1 = createEvidenceProvenance({
      ...sampleInput,
      subjectKey: 'SATURN'
    });
    const p2 = createEvidenceProvenance({
      ...sampleInput,
      subjectKey: 'JUPITER'
    });

    expect(() => assertUniqueEvidenceIds([p1, p2])).not.toThrow();
  });

  it('assertUniqueEvidenceIds throws on duplicate evidenceId with exact error message format', () => {
    const p1 = createEvidenceProvenance(sampleInput);
    const p2 = createEvidenceProvenance(sampleInput);

    expect(() => assertUniqueEvidenceIds([p1, p2])).toThrowError(
      /Duplicate evidenceId detected: CW-CAREER-NATAL-D1-CAREER_10TH_LORD_SUPPORT-SATURN-SUPPORT-PRIMARY/
    );
  });
});
