import { describe, it, expect } from 'vitest';
import { wealthAspectRules } from '../rules/wealth/wealthAspectRules';
import { ThemeInterpretationContext } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { FunctionalRole } from '../../functionalNature/functionalRoleTypes';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('wealthAspectRules', () => {
  it('triggers aspect rule when 2nd house receives aspect and produces evidence in ASPECT family', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.JUPITER],
                  sourceHouse: 8,
                  aspectType: 'FULL'
                }
              ]
            }
          }
        }
      } as any,
      functionalRoles: {
        planets: {
          [Planet.JUPITER]: {
            roles: [FunctionalRole.TRIKONA_LORD, FunctionalRole.SECOND_LORD],
            ownedHouses: [9, 2]
          }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 8, dignity: DignityStatus.OWN_SIGN }
        }
      } as any
    };

    const rule2H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_2H_001')!;
    const res = rule2H.evaluate(context);
    expect(res.triggered).toBe(true);
    const evList = res.evidence as any[];
    expect(evList.length).toBe(1);
    expect(evList[0].evidenceFamily).toBe(WealthEvidenceFamily.ASPECT);
    expect(evList[0].houses).toContain(2);
    expect(evList[0].effect).toBe('SUPPORT');
  });

  it('aspect context test: Saturn aspecting 2H with adverse vs supportive functional role does NOT produce identical evidence', () => {
    // Case A: Saturn is Dusthana / Maraka lord casting aspect on 2H
    const adverseSaturnContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.SATURN],
                  sourceHouse: 8,
                  aspectType: 'FULL'
                }
              ]
            }
          }
        }
      } as any,
      functionalRoles: {
        planets: {
          [Planet.SATURN]: {
            roles: [FunctionalRole.DUSTHANA_LORD, FunctionalRole.MARAKA_LORD],
            ownedHouses: [6, 7]
          }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SATURN]: { planet: Planet.SATURN, house: 8, dignity: DignityStatus.ENEMY_SIGN }
        }
      } as any
    };

    // Case B: Saturn is Yogakaraka (e.g. for Taurus / Libra ascendant) casting aspect on 2H
    const supportiveSaturnContext: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.SATURN],
                  sourceHouse: 8,
                  aspectType: 'FULL'
                }
              ]
            }
          }
        }
      } as any,
      functionalRoles: {
        planets: {
          [Planet.SATURN]: {
            roles: [FunctionalRole.YOGAKARAKA, FunctionalRole.TRIKONA_LORD, FunctionalRole.KENDRA_LORD],
            ownedHouses: [9, 10]
          }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SATURN]: { planet: Planet.SATURN, house: 8, dignity: DignityStatus.OWN_SIGN }
        }
      } as any
    };

    const rule2H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_2H_001')!;

    const adverseRes = rule2H.evaluate(adverseSaturnContext);
    const supportiveRes = rule2H.evaluate(supportiveSaturnContext);

    expect(adverseRes.triggered).toBe(true);
    expect(supportiveRes.triggered).toBe(true);

    const adverseEv = (adverseRes.evidence as any[])[0];
    const supportiveEv = (supportiveRes.evidence as any[])[0];

    // Verify they do NOT produce identical evidence
    expect(adverseEv.effect).toBe('CHALLENGE');
    expect(supportiveEv.effect).toBe('SUPPORT');
    expect(adverseEv.effect).not.toBe(supportiveEv.effect);
  });

  it('triggers aspect rule for 11H, 9H, and 5H when aspects are present', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          11: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.VENUS],
                  sourceHouse: 5,
                  aspectType: 'FULL'
                }
              ]
            }
          },
          9: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.MARS],
                  sourceHouse: 3,
                  aspectType: 'SPECIAL'
                }
              ]
            }
          },
          5: {
            aspects: {
              received: [
                {
                  sourcePlanets: [Planet.JUPITER],
                  sourceHouse: 1,
                  aspectType: 'SPECIAL'
                }
              ]
            }
          }
        }
      } as any
    };

    const rule11H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_11H_001')!;
    const rule9H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_9H_001')!;
    const rule5H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_5H_001')!;

    expect(rule11H.evaluate(context).triggered).toBe(true);
    expect(rule9H.evaluate(context).triggered).toBe(true);
    expect(rule5H.evaluate(context).triggered).toBe(true);
  });

  it('returns triggered: false when no aspects are present on a house', () => {
    const context: ThemeInterpretationContext = {
      houseInterpretation: {
        houses: {
          2: { aspects: { received: [] } }
        }
      } as any
    };

    const rule2H = wealthAspectRules.find((r) => r.id === 'WEALTH_ASPECT_2H_001')!;
    const res = rule2H.evaluate(context);
    expect(res.triggered).toBe(false);
  });
});
