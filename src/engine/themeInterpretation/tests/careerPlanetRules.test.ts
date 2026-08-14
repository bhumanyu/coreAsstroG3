import { describe, it, expect } from 'vitest';
import { careerPlanetRules } from '../rules/career/careerPlanetRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';

describe('careerPlanetRules', () => {
  it('evaluates gated natural karaka planet rules based on career relevance', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          10: { lord: Planet.JUPITER, occupants: [Planet.SUN, Planet.SATURN, Planet.MARS] }
        }
      } as any,
      planetAnalysis: {
        planets: {
          [Planet.SUN]: { house: 10, dignity: { status: DignityStatus.EXALTED } },
          [Planet.SATURN]: { house: 10, dignity: { status: DignityStatus.OWN_SIGN } },
          [Planet.MERCURY]: { house: 1, dignity: { status: DignityStatus.FRIEND_SIGN } },
          [Planet.MARS]: { house: 10, dignity: { status: DignityStatus.OWN_SIGN } },
          [Planet.JUPITER]: { house: 9, dignity: { status: DignityStatus.OWN_SIGN } }
        }
      } as any
    };

    expect(careerPlanetRules.length).toBe(5);

    // Sun, Saturn, Mars are in 10H -> trigger
    // Jupiter is 10th lord -> triggers
    // Mercury is in 1H with no 10H link -> triggered: false
    const sunRule = careerPlanetRules.find((r) => r.id === 'CAREER_SUN_RELEVANCE_001')!;
    const saturnRule = careerPlanetRules.find((r) => r.id === 'CAREER_SATURN_RELEVANCE_001')!;
    const marsRule = careerPlanetRules.find((r) => r.id === 'CAREER_MARS_RELEVANCE_001')!;
    const jupiterRule = careerPlanetRules.find((r) => r.id === 'CAREER_JUPITER_RELEVANCE_001')!;
    const mercuryRule = careerPlanetRules.find((r) => r.id === 'CAREER_MERCURY_RELEVANCE_001')!;

    expect(sunRule.evaluate(context).triggered).toBe(true);
    expect(saturnRule.evaluate(context).triggered).toBe(true);
    expect(marsRule.evaluate(context).triggered).toBe(true);
    expect(jupiterRule.evaluate(context).triggered).toBe(true);

    // Mercury has no 10H/10L connection
    const mercRes = mercuryRule.evaluate(context);
    expect(mercRes.triggered).toBe(false);
  });
});
