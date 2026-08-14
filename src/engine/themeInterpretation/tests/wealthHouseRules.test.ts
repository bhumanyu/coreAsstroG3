import { describe, it, expect } from 'vitest';
import { wealthHouseRules, checkWealthHouseLink } from '../rules/wealth/wealthHouseRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('wealthHouseRules', () => {
  it('triggers WEALTH_2H_STRONG_001 when 2nd house is strong', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: {
            house: 2,
            summary: {
              supportingFactors: ['Benefic Jupiter occupies 2nd house.'],
              challengingFactors: []
            },
            occupants: { planets: [Planet.JUPITER] },
            placement: { signLord: Planet.MERCURY }
          }
        }
      } as any
    };

    const rule = wealthHouseRules.find((r) => r.id === 'WEALTH_2H_STRONG_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    expect((res.evidence as any).effect).toBe('SUPPORT');
    expect((res.evidence as any).evidenceFamily).toBe(WealthEvidenceFamily.SECOND_HOUSE);
  });

  it('triggers WEALTH_2H_AFFLICTION_001 when 2nd house is afflicted', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: {
            house: 2,
            summary: {
              supportingFactors: [],
              challengingFactors: ['Severe malefic affliction on 2nd house.']
            },
            occupants: { planets: [] },
            placement: { signLord: Planet.MERCURY }
          }
        }
      } as any
    };

    const rule = wealthHouseRules.find((r) => r.id === 'WEALTH_2H_AFFLICTION_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    expect((res.evidence as any).effect).toBe('CHALLENGE');
    expect((res.evidence as any).evidenceFamily).toBe(WealthEvidenceFamily.SECOND_HOUSE);
  });

  it('triggers 11H, 9H, 5H strong rules correctly', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          11: { house: 11, summary: { supportingFactors: ['11H strong'] }, occupants: { planets: [] } },
          9: { house: 9, summary: { supportingFactors: ['9H strong'] }, occupants: { planets: [] } },
          5: { house: 5, summary: { supportingFactors: ['5H strong'] }, occupants: { planets: [] } }
        }
      } as any
    };

    const r11 = wealthHouseRules.find((r) => r.id === 'WEALTH_11H_STRONG_001')!;
    const r9 = wealthHouseRules.find((r) => r.id === 'WEALTH_9H_STRONG_001')!;
    const r5 = wealthHouseRules.find((r) => r.id === 'WEALTH_5H_STRONG_001')!;

    expect(r11.evaluate(context).triggered).toBe(true);
    expect(r9.evaluate(context).triggered).toBe(true);
    expect(r5.evaluate(context).triggered).toBe(true);
  });

  it('evaluates WEALTH_2H_11H_LINK_001 with STRONG strength when link exists', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.VENUS } },
          11: { placement: { signLord: Planet.MERCURY } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { placement: { house: 11 } },
          [Planet.MERCURY]: { placement: { house: 2 } }
        }
      } as any
    };

    const rule = wealthHouseRules.find((r) => r.id === 'WEALTH_2H_11H_LINK_001')!;
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.priority).toBe('PRIMARY');
    expect(ev.strength).toBe('STRONG');
    expect(ev.effect).toBe('SUPPORT');
  });

  it('downgrades link effect when connecting lord is afflicted', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.VENUS } },
          11: { placement: { signLord: Planet.MERCURY } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { placement: { house: 11 }, dignity: DignityStatus.DEBILITATED },
          [Planet.MERCURY]: { placement: { house: 2 } }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.VENUS]: { dignity: { status: DignityStatus.DEBILITATED } }
        }
      } as any
    };

    const link = checkWealthHouseLink(context, 2, 11);
    expect(link.linked).toBe(true);
    expect(link.effect).toBe('NEUTRAL');
  });

  it('yields CHALLENGE when both connecting lords are afflicted', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.VENUS } },
          11: { placement: { signLord: Planet.MERCURY } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { placement: { house: 11 }, dignity: DignityStatus.DEBILITATED },
          [Planet.MERCURY]: { placement: { house: 2 }, dignity: DignityStatus.DEBILITATED }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.VENUS]: { dignity: { status: DignityStatus.DEBILITATED } },
          [Planet.MERCURY]: { dignity: { status: DignityStatus.DEBILITATED } }
        }
      } as any
    };

    const link = checkWealthHouseLink(context, 2, 11);
    expect(link.linked).toBe(true);
    expect(link.effect).toBe('CHALLENGE');
  });

  it('yields NEUTRAL (conditional=true) when linked but neither lord is supportive nor afflicted', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.MARS } },
          11: { placement: { signLord: Planet.SATURN } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MARS]: { placement: { house: 3 }, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.SATURN]: { placement: { house: 3 }, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.MARS]: { house: 3, dignity: { status: DignityStatus.NEUTRAL_SIGN } },
          [Planet.SATURN]: { house: 3, dignity: { status: DignityStatus.NEUTRAL_SIGN } }
        }
      } as any
    };

    const link = checkWealthHouseLink(context, 2, 11);
    expect(link.linked).toBe(true);
    expect(link.effect).toBe('NEUTRAL');
  });
});
