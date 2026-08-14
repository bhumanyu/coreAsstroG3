import { describe, it, expect } from 'vitest';
import { careerHouseRules } from '../rules/career/careerHouseRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';

describe('careerHouseRules', () => {
  it('triggers CAREER_10H_STRONG_001 when 10th house is strong', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            summary: {
              supportingFactors: ['Benefic occupant in 10th house.'],
              challengingFactors: []
            },
            occupants: { planets: ['JUPITER' as any] },
            placement: { signLord: 'SATURN' as any }
          }
        }
      } as any
    };

    const rule = careerHouseRules.find((r) => r.id === 'CAREER_10H_STRONG_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    expect((res.evidence as any).effect).toBe('SUPPORT');
  });

  it('triggers CAREER_10H_AFFLICTION_001 when 10th house is afflicted', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            summary: {
              supportingFactors: [],
              challengingFactors: ['Malefic aspect on 10th house.']
            },
            occupants: { planets: [] },
            placement: { signLord: 'SATURN' as any }
          }
        }
      } as any
    };

    const rule = careerHouseRules.find((r) => r.id === 'CAREER_10H_AFFLICTION_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    expect((res.evidence as any).effect).toBe('CHALLENGE');
  });

  it('does not trigger CAREER_10H_AFFLICTION_001 when 10th house is neutral or strong', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            summary: {
              supportingFactors: ['Strong lord placement'],
              challengingFactors: []
            },
            occupants: { planets: [] }
          }
        }
      } as any
    };

    const rule = careerHouseRules.find((r) => r.id === 'CAREER_10H_AFFLICTION_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });
});
