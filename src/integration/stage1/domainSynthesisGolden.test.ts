import { describe, it, expect } from 'vitest';
import {
  buildLifeAnalysis,
  assertLifeAnalysisTraceability
} from '../../domain/synthesis';
import {
  STAGE1_GOLDEN_CAREER,
  STAGE1_GOLDEN_WEALTH
} from './stage1GoldenFixture';

describe('Domain Synthesis Golden Integration (P-028)', () => {
  it('synthesizes canonical Career V2 and Wealth V2 interpretations cleanly', () => {
    const analysis = buildLifeAnalysis([
      STAGE1_GOLDEN_CAREER,
      STAGE1_GOLDEN_WEALTH
    ]);

    expect(analysis).toBeDefined();

    // 1. Data Completeness & Confidence
    expect(analysis.dataCompleteness.career).toBe('AVAILABLE');
    expect(analysis.dataCompleteness.wealth).toBe('AVAILABLE');
    expect(analysis.dataCompleteness.overall).toBe('COMPLETE');
    expect(['HIGH', 'MODERATE']).toContain(analysis.confidence);

    // 2. Domain Summaries
    expect(analysis.domains.length).toBe(2);
    const careerSummary = analysis.domains.find((d) => d.domain === 'CAREER');
    const wealthSummary = analysis.domains.find((d) => d.domain === 'WEALTH');

    expect(careerSummary).toBeDefined();
    expect(careerSummary?.strength).toBe('VERY_STRONG');
    expect(careerSummary?.primaryConclusion.length).toBeGreaterThan(0);

    expect(wealthSummary).toBeDefined();
    expect(
      wealthSummary?.strength === 'VERY_STRONG' ||
        wealthSummary?.strength === 'STRONG'
    ).toBe(true);
    expect(wealthSummary?.primaryConclusion.length).toBeGreaterThan(0);

    // 3. Strongest Domains
    expect(analysis.strongestDomains).toContain('CAREER');
    expect(analysis.strongestDomains).toContain('WEALTH');

    // 4. Overall Conclusion
    expect(analysis.conclusion.status).toBeDefined();
    expect(analysis.conclusion.statement.length).toBeGreaterThan(0);
    expect(analysis.conclusion.summaryPoints.length).toBeGreaterThanOrEqual(2);

    // 5. Evidence Traceability
    expect(analysis.evidenceIds.length).toBeGreaterThan(0);
    expect(() =>
      assertLifeAnalysisTraceability(analysis, [
        STAGE1_GOLDEN_CAREER,
        STAGE1_GOLDEN_WEALTH
      ])
    ).not.toThrow();
  });
});
