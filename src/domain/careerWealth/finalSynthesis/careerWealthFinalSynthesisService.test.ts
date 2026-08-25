import { describe, it, expect } from 'vitest';
import { DefaultCareerWealthFinalSynthesisService } from './careerWealthFinalSynthesisService';

describe('DefaultCareerWealthFinalSynthesisService (CW-05)', () => {
  const service = new DefaultCareerWealthFinalSynthesisService();

  it('synthesizes career domain correctly through service interface', () => {
    const res = service.synthesizeCareer({
      natalPromise: 'STRONG',
      d10Relationship: 'CONFIRMS'
    });

    expect(res.domain).toBe('CAREER');
    expect(res.reasoningVersion).toBe('CW-05');
    expect(res.status).toBe('STRONG');
  });

  it('synthesizes wealth domain correctly through service interface', () => {
    const res = service.synthesizeWealth({
      natalPromise: {
        ACCUMULATION: 'STRONG',
        GAINS: 'STRONG',
        FORTUNE: 'STRONG',
        SPECULATION: 'STRONG'
      },
      d2Relationship: 'CONFIRMS'
    });

    expect(res.domain).toBe('WEALTH');
    expect(res.reasoningVersion).toBe('CW-05');
    expect(res.status).toBe('STRONG');
    expect(res.riskProfile).toBe('LOW');
  });
});
