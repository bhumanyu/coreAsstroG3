import { describe, it, expect } from 'vitest';
import { wealthPlanetRules } from '../rules/wealth/wealthPlanetRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('wealthPlanetRules', () => {
  it('evaluates dignified Jupiter in 2H to produce SUPPORT in JUPITER family', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.JUPITER, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: DignityStatus.EXALTED }
        }
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.JUPITER);
    expect(ev.effect).toBe('SUPPORT');
    expect(ev.strength).toBe('STRONG');
    expect(ev.priority).toBe('SECONDARY');
  });

  it('evaluates dignified Venus in 11H to produce SUPPORT in VENUS family', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          11: { lord: Planet.VENUS, occupants: [Planet.VENUS] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: DignityStatus.OWN_SIGN }
        }
      } as any
    };

    const venusRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_VENUS_KARAKA_001')!;
    const res = venusRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.VENUS);
    expect(ev.effect).toBe('SUPPORT');
    expect(ev.strength).toBe('STRONG');
  });

  it('evaluates debilitated Mercury in 5H to produce CHALLENGE in MERCURY family', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          5: { lord: Planet.MERCURY, occupants: [Planet.MERCURY] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 5, dignity: DignityStatus.DEBILITATED }
        }
      } as any
    };

    const mercuryRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_MERCURY_KARAKA_001')!;
    const res = mercuryRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.MERCURY);
    expect(ev.effect).toBe('CHALLENGE');
    expect(ev.conditional).toBe(true);
  });

  it('returns triggered: false for Venus when not connected to wealth houses, lords, aspects or yogas', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.JUPITER },
          6: { lord: Planet.MERCURY, occupants: [Planet.VENUS] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.ENEMY_SIGN }
        }
      } as any,
      natalGrahaDrishti: { aspects: [] } as any
    };

    const venusRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_VENUS_KARAKA_001')!;
    const res = venusRule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('returns triggered: false for Jupiter in 1H with no chart-specific wealth linkage despite high dignity', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.VENUS },
          1: { lord: Planet.MOON, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 1, dignity: DignityStatus.EXALTED }
        }
      } as any,
      natalGrahaDrishti: { aspects: [] } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('triggers Jupiter rule when Jupiter in 1H rules 2nd house', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.JUPITER },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.VENUS },
          1: { occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 1, dignity: DignityStatus.EXALTED }
        }
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.JUPITER);
  });

  it('triggers Jupiter rule when Jupiter in 1H aspects 11th house', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.VENUS },
          1: { occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 1, dignity: DignityStatus.EXALTED }
        }
      } as any,
      natalGrahaDrishti: {
        aspects: [
          { sourcePlanet: Planet.JUPITER, targetHouse: 11 }
        ]
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
  });

  it('produces NEUTRAL effect for neutral-dignity planet in a wealth house (relevance does not manufacture SUPPORT)', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.JUPITER);
    expect(ev.effect).toBe('NEUTRAL');
    expect(ev.conditional).toBe(true);
  });

  it('returns triggered: false for Jupiter in a non-wealth yoga (e.g. Hamsa in 1H) with no 2/5/9/11 linkage', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.VENUS },
          1: { lord: Planet.MOON, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 1, dignity: DignityStatus.EXALTED }
        }
      } as any,
      natalGrahaDrishti: { aspects: [] } as any,
      yogas: {
        yogas: [
          {
            type: 'Hamsa Yoga',
            name: 'Hamsa Yoga',
            category: 'MAHAPURUSHA',
            planets: [Planet.JUPITER],
            houses: [1],
            finalStatus: 'STRONG'
          }
        ]
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(false);
  });

  it('returns triggered: true for Jupiter participating in a Dhana yoga', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.SATURN },
          11: { lord: Planet.MARS },
          9: { lord: Planet.SUN },
          5: { lord: Planet.VENUS },
          1: { lord: Planet.MOON, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 1, dignity: DignityStatus.EXALTED }
        }
      } as any,
      natalGrahaDrishti: { aspects: [] } as any,
      yogas: {
        yogas: [
          {
            type: 'Dhana Yoga',
            name: 'Dhana Yoga',
            category: 'DHANA',
            planets: [Planet.JUPITER],
            houses: [1, 2],
            finalStatus: 'STRONG'
          }
        ]
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    expect(ev.evidenceFamily).toBe(WealthEvidenceFamily.JUPITER);
  });

  it('sets Wealth Relevance as PRIMARY factor with specific connection and Natural Significator as MODIFIER', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { lord: Planet.JUPITER },
          11: { lord: Planet.VENUS, occupants: [Planet.JUPITER] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 11, dignity: DignityStatus.FRIEND_SIGN }
        }
      } as any,
      functionalRoles: {
        planets: {
          [Planet.JUPITER]: {
            planet: Planet.JUPITER,
            roles: ['DHANA_KARAKA'],
            ownedHouses: [2],
            isBenefic: true,
            isYogakaraka: false,
            isMaraka: false,
            isDusthanaLord: false,
            isTrikonaLord: false,
            isKendraLord: false,
            isBadhaka: false
          }
        }
      } as any
    };

    const jupiterRule = wealthPlanetRules.find((r) => r.id === 'WEALTH_JUPITER_KARAKA_001')!;
    const res = jupiterRule.evaluate(context);
    expect(res.triggered).toBe(true);
    const ev = res.evidence as any;
    const factors = ev.factors;

    const primaryFactor = factors.find((f: any) => f.role === 'PRIMARY');
    expect(primaryFactor).toBeDefined();
    expect(primaryFactor.label).toBe('Wealth Relevance');
    expect(primaryFactor.value).toContain('rules house 2');
    expect(primaryFactor.value).toContain('occupies house 11');

    const naturalSigFactor = factors.find((f: any) => f.label === 'Natural Significator');
    expect(naturalSigFactor).toBeDefined();
    expect(naturalSigFactor.role).toBe('MODIFIER');
    expect(naturalSigFactor.value).toContain('JUPITER');
  });
});
