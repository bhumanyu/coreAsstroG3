import { describe, it, expect } from 'vitest';
import { careerHouseRules } from '../rules/career/careerHouseRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet } from '../../../types';

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
            occupants: { planets: [Planet.JUPITER] },
            placement: { signLord: Planet.SATURN }
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
            placement: { signLord: Planet.SATURN }
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
      // Precedence rule: bhavaFacts (canonical house structure) takes precedence over planetFacts
      // when determining house lords and occupants. This ensures house-based structural
      // relationships are correctly identified even when planet placement data is incomplete.
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            SATURN: { house: 6 } as any,
            MARS: { house: 10 } as any
          },
          bhavaFacts: {
            6: { lord: Planet.SATURN, occupants: [] } as any,
            10: { lord: Planet.SATURN, occupants: [] } as any
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
      // bhavaFacts precedence: house structure from bhavaFacts determines lord relationships
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            SATURN: { house: 10 } as any,
            MARS: { house: 5 } as any
          },
          bhavaFacts: {
            6: { lord: Planet.SATURN, occupants: [] } as any,
            10: { lord: Planet.MARS, occupants: [Planet.SATURN] } as any
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
              occupants: { planets: [Planet.SATURN] },
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

    it('preserves lord-in-house detection from house occupants when planet house is unavailable', () => {
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            MARS: { house: 5 } as any
          },
          bhavaFacts: {
            6: {
              lord: Planet.SATURN,
              occupants: []
            } as any,

            10: {
              lord: Planet.MARS,
              occupants: [Planet.SATURN]
            } as any
          }
        } as any,

        houseInterpretation: {
          houses: {
            6: {
              house: 6,
              occupants: { planets: [] },
              summary: {
                supportingFactors: [],
                challengingFactors: []
              }
            },

            10: {
              house: 10,
              occupants: {
                planets: [Planet.SATURN]
              },
              summary: {
                supportingFactors: [],
                challengingFactors: []
              }
            }
          }
        } as any,

        natalGrahaDrishti: {
          aspects: []
        }
      };

      const rule = careerHouseRules.find(
        (r) => r.id === 'CAREER_6H_10H_LINK_001'
      )!;

      const result = rule.evaluate(context);

      expect(result.triggered).toBe(true);
    });
  });

  describe('CAREER_10H_11H_LINK_001 regression', () => {
    it('triggers CAREER_10H_11H_LINK_001 with common lord relationship', () => {
      // bhavaFacts precedence: house structure determines lord relationships
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            JUPITER: { house: 11 } as any,
            MARS: { house: 10 } as any
          },
          bhavaFacts: {
            10: { lord: Planet.JUPITER, occupants: [] } as any,
            11: { lord: Planet.JUPITER, occupants: [] } as any
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
      // bhavaFacts precedence: exchange relationships are detected from bhavaFacts structure
      const context: ThemeInterpretationContext = {
        horoscope: {
          planetFacts: {
            JUPITER: { house: 11 } as any,
            MARS: { house: 10 } as any
          },
          bhavaFacts: {
            10: { lord: Planet.JUPITER, occupants: [Planet.MARS] } as any,
            11: { lord: Planet.MARS, occupants: [Planet.JUPITER] } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            10: {
              house: 10,
              occupants: { planets: [Planet.MARS] },
              summary: { supportingFactors: [], challengingFactors: [] }
            },
            11: {
              house: 11,
              occupants: { planets: [Planet.JUPITER] },
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
