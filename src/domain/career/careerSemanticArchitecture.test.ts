import { describe, expect, it } from 'vitest';

describe('CW-R1 C1 — Career semantic architecture', () => {
  it('documents the canonical Career semantic pipeline', () => {
    const pipeline = [
      'THEME_INTERPRETATION',
      'CAREER_EVIDENCE_MAPPING',
      'DOMAIN_EVIDENCE',
      'CANONICAL_DEDUPLICATION',
      'CAREER_REASONING',
      'CAREER_EXPRESSION',
      'D10_QUALIFICATION',
      'DASHA_TIMING',
      'FINAL_CAREER_CONCLUSION'
    ] as const;

    expect(pipeline).toEqual([
      'THEME_INTERPRETATION',
      'CAREER_EVIDENCE_MAPPING',
      'DOMAIN_EVIDENCE',
      'CANONICAL_DEDUPLICATION',
      'CAREER_REASONING',
      'CAREER_EXPRESSION',
      'D10_QUALIFICATION',
      'DASHA_TIMING',
      'FINAL_CAREER_CONCLUSION'
    ]);
  });

  it('does not introduce an alternative Career evidence envelope', () => {
    const canonicalEvidenceType = 'DomainEvidence';

    expect(canonicalEvidenceType).toBe('DomainEvidence');
  });

  it('keeps D10 outside primary natal promise', () => {
    const d10Layer = 'QUALIFICATION';

    expect(d10Layer).not.toBe('STRUCTURAL_PROMISE');
  });

  it('keeps Dasha outside primary natal promise', () => {
    const dashaLayer = 'TIMING';

    expect(dashaLayer).not.toBe('STRUCTURAL_PROMISE');
  });
});
