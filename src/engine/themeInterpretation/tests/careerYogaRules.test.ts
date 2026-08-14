import { describe, it, expect } from 'vitest';
import { careerYogaRules } from '../rules/career/careerYogaRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';

describe('careerYogaRules', () => {
  it('triggers YOGA rule when career-relevant yogas are present in YogaAnalysisReport', () => {
    const context: ThemeInterpretationContext = {
      yogas: {
        yogas: [
          {
            type: 'Gaja Kesari Yoga',
            category: 'RAJA',
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = careerYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = (res.evidence as any[])[0];
    expect(ev.evidenceFamily).toBe('YOGA');
    expect(ev.priority).toBe('CONFIRMATORY');
    expect(ev.effect).toBe('SUPPORT');
  });

  it('ignores non-career yogas or cancelled yogas', () => {
    const context: ThemeInterpretationContext = {
      yogas: {
        yogas: [
          {
            type: 'Kemadruma Yoga',
            category: 'INSP',
            finalStatus: 'CANCELLED'
          }
        ]
      } as any
    };

    const rule = careerYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });
});
