import { describe, it, expect } from 'vitest';
import { wealthDashaRules } from '../rules/wealth/wealthDashaRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet } from '../../../types';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('wealthDashaRules', () => {
  it('triggers timing evidence when Mahadasha lord rules a wealth house', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER } },
          11: { placement: { signLord: Planet.VENUS } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.JUPITER },
          antardasha: { planet: Planet.VENUS }
        }
      } as any
    };

    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const evList = res.evidence as any[];
    expect(evList.length).toBe(2);
    expect(evList[0].evidenceFamily).toBe(WealthEvidenceFamily.DASHA);
    expect(evList[0].priority).toBe('TIMING');
    expect(evList[0].conditional).toBe(true);
  });

  it('does NOT trigger timing evidence when Mahadasha lord is a natural wealth karaka with NO wealth linkage (false positive regression fix)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.SATURN } },
          11: { placement: { signLord: Planet.MARS } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.JUPITER }
        }
      } as any
    };

    // Jupiter has no ownership of 2/11/9/5, no occupancy, no aspect to wealth house/lord
    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('triggers timing evidence when Mahadasha lord is a natural karaka WITH a wealth house linkage', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.JUPITER }
        }
      } as any
    };

    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const evList = res.evidence as any[];
    expect(evList.length).toBe(1);
    expect(evList[0].statement).toContain('JUPITER is lord of house 2');
    expect(evList[0].statement).toContain('natural wealth significator');
  });

  it('does NOT trigger dasha evidence solely from 1st house lordship (house 1 excluded from wealth houses)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          1: { placement: { signLord: Planet.SUN } },
          2: { placement: { signLord: Planet.MERCURY } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.SUN }
        }
      } as any
    };

    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('returns not triggered when no active periods match wealth factors', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.SATURN }
        }
      } as any
    };

    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('assigns relevanceType WEALTH_LORD when period lord rules a wealth house, preferring lordship over occupancy/aspect', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { placement: { signLord: Planet.JUPITER }, occupants: [Planet.JUPITER] },
          11: { placement: { signLord: Planet.VENUS } }
        }
      } as any,
      dashaInterpretation: {
        current: {
          mahadasha: { planet: Planet.JUPITER }
        }
      } as any
    };

    const rule = wealthDashaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const evList = res.evidence as any[];
    expect(evList[0].timingEvidence?.relevanceType).toBe('WEALTH_LORD');
  });
});
