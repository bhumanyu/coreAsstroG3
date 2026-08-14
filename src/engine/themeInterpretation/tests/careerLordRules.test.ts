import { describe, it, expect } from 'vitest';
import { careerLordRules } from '../rules/career/careerLordRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';

describe('careerLordRules', () => {
  const rule = careerLordRules.find((r) => r.id === 'CAREER_10L_DIGNITY_001')!;

  it('evaluates all 12 house placements for 10th lord', () => {
    for (let house = 1; house <= 12; house++) {
      const context: ThemeInterpretationContext = {
        houseInterpretation: {
          houses: {
            10: {
              placement: { signLord: Planet.SATURN }
            }
          }
        } as any,
        planetInterpretation: {
          planets: {
            [Planet.SATURN]: {
              placement: { house }
            }
          }
        } as any
      };

      const res = rule.evaluate(context);
      expect(res.triggered).toBe(true);
      const ev = res.evidence as any;

      if (house === 8 || house === 12) {
        expect(ev.effect).toBe('NEUTRAL');
        expect(ev.conditional).toBe(true);
      } else {
        expect(ev.effect).not.toBe('CHALLENGE');
      }
    }
  });

  it('evaluates 10th lord dignities including EXALTED and DEBILITATED', () => {
    const exaltContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: { 10: { placement: { signLord: Planet.SATURN } } }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.SATURN]: { house: 10, dignity: { status: DignityStatus.EXALTED } }
        }
      } as any
    };

    const exaltRes = rule.evaluate(exaltContext);
    expect((exaltRes.evidence as any).effect).toBe('SUPPORT');
    expect((exaltRes.evidence as any).strength).toBe('STRONG');

    const debilContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: { 10: { placement: { signLord: Planet.SATURN } } }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.SATURN]: { house: 10, dignity: { status: DignityStatus.DEBILITATED } }
        }
      } as any
    };

    const debilRes = rule.evaluate(debilContext);
    expect((debilRes.evidence as any).effect).toBe('CHALLENGE');
    expect((debilRes.evidence as any).strength).toBe('STRONG');
  });

  it('emits one TENTH_LORD evidence item containing factors', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: { 10: { placement: { signLord: Planet.SATURN } } }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.SATURN]: { house: 10, dignity: { status: DignityStatus.OWN_SIGN } }
        }
      } as any
    };

    const res = rule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe('TENTH_LORD');
    expect(ev.factors.length).toBeGreaterThanOrEqual(3);
  });
});
