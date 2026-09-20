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

  describe('CAREER_6H_10H_LINK_001 regression', () => {
    it('triggers CAREER_6H_10H_LINK_001 with common lord relationship', () => {
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            SATURN: { house: 6 } as any,
            MARS: { house: 10 } as any
          },
          bhavaFacts: {
            6: { lord: 'SATURN' as any, occupants: [] } as any,
            10: { lord: 'SATURN' as any, occupants: [] } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            6: {
              house: 6,
              occupants: { planets: [] },
              summary: { supportingFactors: [], challengingFactors: [] }
            },
            10: {
              house: 10,
              occupants: { planets: [] },
              summary: { supportingFactors: [], challengingFactors: [] }
            }
          }
        } as any,
        natalGrahaDrishti: { aspects: [] }
      };

      const rule = careerHouseRules.find((r) => r.id === 'CAREER_6H_10H_LINK_001')!;
      const res = rule.evaluate(context);

      expect(res.triggered).toBe(true);
      expect(res.evidence).toMatchObject({
        ruleId: 'CAREER_6H_10H_LINK_001',
        houses: [6, 10],
        effect: 'SUPPORT',
        dimension: 'NATAL_STRUCTURE'
      });
    });

    it('triggers CAREER_6H_10H_LINK_001 with lord placement relationship', () => {
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            SATURN: { house: 10 } as any,
            MARS: { house: 5 } as any
          },
          bhavaFacts: {
            6: { lord: 'SATURN' as any, occupants: [] } as any,
            10: { lord: 'MARS' as any, occupants: ['SATURN' as any] } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            6: {
              house: 6,
              occupants: { planets: [] },
              summary: { supportingFactors: [], challengingFactors: [] }
            },
            10: {
              house: 10,
              occupants: { planets: ['SATURN' as any] },
              summary: { supportingFactors: [], challengingFactors: [] }
            }
          }
        } as any,
        natalGrahaDrishti: { aspects: [] }
      };

      const rule = careerHouseRules.find((r) => r.id === 'CAREER_6H_10H_LINK_001')!;
      const res = rule.evaluate(context);

      expect(res.triggered).toBe(true);
      expect(res.evidence).toMatchObject({
        ruleId: 'CAREER_6H_10H_LINK_001',
        houses: [6, 10],
        effect: 'SUPPORT',
        dimension: 'NATAL_STRUCTURE'
      });
    });
  });

  describe('CAREER_10H_11H_LINK_001 regression', () => {
    it('triggers CAREER_10H_11H_LINK_001 with common lord relationship', () => {
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            JUPITER: { house: 11 } as any,
            MARS: { house: 10 } as any
          },
          bhavaFacts: {
            10: { lord: 'JUPITER' as any, occupants: [] } as any,
            11: { lord: 'JUPITER' as any, occupants: [] } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            10: {
              house: 10,
              occupants: { planets: [] },
              summary: { supportingFactors: [], challengingFactors: [] }
            },
            11: {
              house: 11,
              occupants: { planets: [] },
              summary: { supportingFactors: [], challengingFactors: [] }
            }
          }
        } as any,
        natalGrahaDrishti: { aspects: [] }
      };

      const rule = careerHouseRules.find((r) => r.id === 'CAREER_10H_11H_LINK_001')!;
      const res = rule.evaluate(context);

      expect(res.triggered).toBe(true);
      expect(res.evidence).toMatchObject({
        ruleId: 'CAREER_10H_11H_LINK_001',
        houses: [10, 11],
        effect: 'SUPPORT',
        dimension: 'NATAL_STRUCTURE',
        strength: 'STRONG'
      });
    });

    it('triggers CAREER_10H_11H_LINK_001 with exchange relationship', () => {
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            JUPITER: { house: 10 } as any,
            MARS: { house: 11 } as any
          },
          bhavaFacts: {
            10: { lord: 'JUPITER' as any, occupants: ['MARS' as any] } as any,
            11: { lord: 'MARS' as any, occupants: ['JUPITER' as any] } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            10: {
              house: 10,
              occupants: { planets: ['MARS' as any] },
              summary: { supportingFactors: [], challengingFactors: [] }
            },
            11: {
              house: 11,
              occupants: { planets: ['JUPITER' as any] },
              summary: { supportingFactors: [], challengingFactors: [] }
            }
          }
        } as any,
        natalGrahaDrishti: { aspects: [] }
      };

      const rule = careerHouseRules.find((r) => r.id === 'CAREER_10H_11H_LINK_001')!;
      const res = rule.evaluate(context);

      expect(res.triggered).toBe(true);
      expect(res.evidence).toMatchObject({
        ruleId: 'CAREER_10H_11H_LINK_001',
        houses: [10, 11],
        effect: 'SUPPORT',
        dimension: 'NATAL_STRUCTURE',
        strength: 'STRONG'
      });
    });
  });
});
