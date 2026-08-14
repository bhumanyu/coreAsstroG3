import { describe, it, expect } from 'vitest';
import { wealthYogaRules } from '../rules/wealth/wealthYogaRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { computeWealthNatalPromise, interpretWealthTheme } from '../wealthThemeInterpretation';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';
import { buildFamilySummaries } from '../themeInterpretationUtils';
import { Planet, DignityStatus } from '../../../types';

describe('wealthYogaRules', () => {
  it('triggers YOGA rule when wealth-relevant Dhana/Lakshmi yogas are present', () => {
    const context: ThemeInterpretationContext = {
      yogas: {
        yogas: [
          {
            type: 'Dhana Yoga',
            category: 'DHANA',
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = (res.evidence as any[])[0];
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.YOGA);
    expect(ev.priority).toBe('CONFIRMATORY');
    expect(ev.effect).toBe('SUPPORT');
    expect(ev.conditional).toBe(true);
    expect(ev.dimension).toBe('CONFIRMATION');
  });

  it('ignores unrelated yogas or cancelled yogas', () => {
    const context: ThemeInterpretationContext = {
      yogas: {
        yogas: [
          {
            type: 'Viparita Raja Yoga',
            category: 'DUSTHANA',
            finalStatus: 'CANCELLED'
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('does NOT trigger for Raja Yoga involving Jupiter when no 2/11 house or 2L/11L lord is touched', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.VENUS },
          11: { lord: Planet.MERCURY }
        }
      } as any,
      yogas: {
        yogas: [
          {
            type: 'Raja Yoga',
            category: 'RAJA',
            planets: [Planet.JUPITER, Planet.MARS],
            houses: [1, 10],
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('does NOT trigger for Hamsa Mahapurusha Yoga in 1H (house 1 removed from wealth houses)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          1: { lord: Planet.JUPITER },
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS }
        }
      } as any,
      yogas: {
        yogas: [
          {
            type: 'Hamsa Yoga',
            category: 'MAHAPURUSHA',
            planets: [Planet.JUPITER],
            houses: [1],
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('does NOT trigger for non-wealth yoga touching ONLY 9H (no 2H/11H, no 2L/11L)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MERCURY },
          9: { lord: Planet.MARS }
        }
      } as any,
      yogas: {
        yogas: [
          {
            type: 'Dharma Karmadhipati Yoga',
            category: 'RAJA',
            planets: [Planet.MARS, Planet.SUN],
            houses: [9, 10],
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('does NOT trigger for cancelled Dhana Yoga', () => {
    const context: ThemeInterpretationContext = {
      yogas: {
        yogas: [
          {
            type: 'Dhana Yoga',
            category: 'DHANA',
            finalStatus: 'CANCELLED'
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('detected Dhana Yoga does NOT change computeWealthNatalPromise status (confirmation family, not structural)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { house: 2, lord: Planet.MERCURY, occupants: [], status: 'STRONG' },
          11: { house: 11, lord: Planet.VENUS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.OWN_SIGN },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: DignityStatus.FRIEND_SIGN }
        }
      } as any,
      yogas: {
        yogas: [
          {
            type: 'Lakshmi Yoga',
            category: 'LAKSHMI',
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any,
      divisionalInterpretation: {} as any,
      functionalRoles: {} as any,
      planetaryStrength: {} as any,
      dashaInterpretation: {} as any,
      natalGrahaDrishti: {} as any
    };

    const result = interpretWealthTheme(context);
    // Yoga is present in evidence
    const yogaEv = result.evidence.filter((e) => e.evidenceFamily === WealthEvidenceFamily.YOGA);
    expect(yogaEv.length).toBeGreaterThan(0);

    // Structural promise is calculated from structural evidence only
    expect(result.wealthNatalPromise.structuralEvidence.every((e) => e.evidenceFamily !== WealthEvidenceFamily.YOGA)).toBe(true);
  });

  it('does NOT trigger for Raja Yoga involving Jupiter in 5H/9H when it is not a wealth category and has no 2L/11L participation', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          5: { lord: Planet.SUN },
          9: { lord: Planet.VENUS }
        }
      } as any,
      yogas: {
        yogas: [
          {
            type: 'Raja Yoga',
            category: 'RAJA',
            planets: [Planet.JUPITER, Planet.SUN],
            houses: [5, 9],
            finalStatus: 'STRONG',
            assessment: { status: 'ACTIVE', strength: 'STRONG' }
          }
        ]
      } as any
    };

    const rule = wealthYogaRules[0];
    const res = rule.evaluate(context);
    expect(res.triggered).toBe(false);
  });
});
