import { describe, it, expect } from 'vitest';
import { wealthLordRules } from '../rules/wealth/wealthLordRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('wealthLordRules', () => {
  const rule2L = wealthLordRules.find((r) => r.id === 'WEALTH_2L_DIGNITY_001')!;

  it('gates neutral lord: 2L that merely exists with neutral condition in non-wealth house produces NO evidence', () => {
    const neutralContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.MARS } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MARS]: { placement: { house: 3 }, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.MARS]: { house: 3, dignity: { status: DignityStatus.NEUTRAL_SIGN } }
        }
      } as any
    };

    const res = rule2L.evaluate(neutralContext);
    expect(res.triggered).toBe(false);
  });

  it('triggers when 2L is exalted (strong dignity)', () => {
    const exaltContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { placement: { house: 4 }, dignity: DignityStatus.EXALTED }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.JUPITER]: { house: 4, dignity: { status: DignityStatus.EXALTED } }
        }
      } as any
    };

    const res = rule2L.evaluate(exaltContext);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.effect).toBe('SUPPORT');
    expect(ev.strength).toBe('STRONG');
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.SECOND_LORD);
  });

  it('triggers when 2L is debilitated (affliction)', () => {
    const debilContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { placement: { house: 8 }, dignity: DignityStatus.DEBILITATED }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.JUPITER]: { house: 8, dignity: { status: DignityStatus.DEBILITATED } }
        }
      } as any
    };

    const res = rule2L.evaluate(debilContext);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.effect).toBe('CHALLENGE');
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.SECOND_LORD);
  });

  it('triggers when 2L is placed in a wealth house (2, 5, 9, 11)', () => {
    const wealthHouseContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.MERCURY } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { placement: { house: 11 }, dignity: DignityStatus.FRIEND_SIGN }
        }
      } as any
    };

    const res = rule2L.evaluate(wealthHouseContext);
    expect(res.triggered).toBe(true);
  });

  it('evaluates lord link rules with same lord as STRONG strength', () => {
    const sameLordContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.VENUS } },
          9: { placement: { signLord: Planet.VENUS } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { placement: { house: 9 }, dignity: DignityStatus.OWN_SIGN }
        }
      } as any
    };

    const rule2L9L = wealthLordRules.find((r) => r.id === 'WEALTH_2L_9L_LINK_001')!;
    const res = rule2L9L.evaluate(sameLordContext);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.strength).toBe('STRONG');
    expect(ev.effect).toBe('SUPPORT');
  });

  it('yields NEUTRAL when linked lords have neutral condition (neither supportive nor afflicted)', () => {
    const neutralLinkContext: ThemeInterpretationContext = {
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

    const rule2L11L = wealthLordRules.find((r) => r.id === 'WEALTH_2L_11L_LINK_001')!;
    const res = rule2L11L.evaluate(neutralLinkContext);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.effect).toBe('NEUTRAL');
    expect(ev.conditional).toBe(true);
  });

  it('yields CHALLENGE when both linked lords are afflicted', () => {
    const afflictedLinkContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.MARS } },
          11: { placement: { signLord: Planet.SATURN } }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MARS]: { placement: { house: 3 }, dignity: DignityStatus.DEBILITATED },
          [Planet.SATURN]: { placement: { house: 3 }, dignity: DignityStatus.DEBILITATED }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.MARS]: { house: 3, dignity: { status: DignityStatus.DEBILITATED } },
          [Planet.SATURN]: { house: 3, dignity: { status: DignityStatus.DEBILITATED } }
        }
      } as any
    };

    const rule2L11L = wealthLordRules.find((r) => r.id === 'WEALTH_2L_11L_LINK_001')!;
    const res = rule2L11L.evaluate(afflictedLinkContext);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.effect).toBe('CHALLENGE');
  });
});
