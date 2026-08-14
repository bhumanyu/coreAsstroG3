import { describe, it, expect } from 'vitest';
import { interpretWealthTheme } from '../wealthThemeInterpretation';
import type { ThemeInterpretationContextInput } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { WealthEvidenceFamily } from '../wealthThemeInterpretationTypes';

describe('Wealth Theme Interpretation Engine', () => {
  const baseWealthContext: ThemeInterpretationContextInput = {
    horoscope: {
      planetFacts: {
        [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: { status: DignityStatus.EXALTED } } as any,
        [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: { status: DignityStatus.OWN_SIGN } } as any,
        [Planet.MERCURY]: { planet: Planet.MERCURY, house: 5, dignity: { status: DignityStatus.FRIEND_SIGN } } as any,
        [Planet.MARS]: { planet: Planet.MARS, house: 9, dignity: { status: DignityStatus.FRIEND_SIGN } } as any,
        [Planet.SUN]: { planet: Planet.SUN, house: 1, dignity: { status: DignityStatus.OWN_SIGN } } as any,
        [Planet.SATURN]: { planet: Planet.SATURN, house: 6, dignity: { status: DignityStatus.NEUTRAL_SIGN } } as any,
        [Planet.MOON]: { planet: Planet.MOON, house: 4, dignity: { status: DignityStatus.FRIEND_SIGN } } as any
      }
    } as any,
    houseInterpretation: {
      houses: {
        2: { house: 2, lord: Planet.JUPITER, occupants: [Planet.JUPITER], status: 'STRONG' },
        11: { house: 11, lord: Planet.VENUS, occupants: [Planet.VENUS], status: 'STRONG' },
        9: { house: 9, lord: Planet.MARS, occupants: [], status: 'STRONG' },
        5: { house: 5, lord: Planet.MERCURY, occupants: [], status: 'STRONG' },
        1: { house: 1, lord: Planet.SUN, occupants: [] }
      }
    } as any,
    planetInterpretation: {
      planets: {
        [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: DignityStatus.EXALTED },
        [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: DignityStatus.OWN_SIGN },
        [Planet.MERCURY]: { planet: Planet.MERCURY, house: 5, dignity: DignityStatus.FRIEND_SIGN },
        [Planet.MARS]: { planet: Planet.MARS, house: 9, dignity: DignityStatus.FRIEND_SIGN },
        [Planet.SUN]: { planet: Planet.SUN, house: 1, dignity: DignityStatus.OWN_SIGN },
        [Planet.SATURN]: { planet: Planet.SATURN, house: 6, dignity: DignityStatus.NEUTRAL_SIGN },
        [Planet.MOON]: { planet: Planet.MOON, house: 4, dignity: DignityStatus.FRIEND_SIGN }
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
    divisionalInterpretation: {
      d9: { varga: 'D9', houses: [], planets: {} }
    } as any,
    functionalRoles: { roles: {} } as any,
    planetaryStrength: { strengths: {} } as any,
    dashaInterpretation: {
      current: {
        mahadasha: { planet: Planet.JUPITER },
        antardasha: { planet: Planet.VENUS }
      }
    } as any,
    natalGrahaDrishti: { aspects: [] } as any
  };

  it('runs complete Wealth Theme Interpretation successfully', () => {
    const result = interpretWealthTheme(baseWealthContext);
    expect(result.theme).toBe('WEALTH_PROSPERITY');
    expect(result.conclusion.status).toBe('STRONGLY_SUPPORTED');
    expect(result.conclusion.confidence).toBe('HIGH');
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.wealthNatalPromise.status).toBe('STRONG');
  });

  it('explicitly sets metadata.vargaConfirmationStatus to UNAVAILABLE in v1', () => {
    const result = interpretWealthTheme(baseWealthContext);
    expect(result.metadata.vargaConfirmationStatus).toBe('UNAVAILABLE');
  });

  it('populates all 4 wealth subthemes with accurate house numbers and status', () => {
    const result = interpretWealthTheme(baseWealthContext);
    const { subthemes } = result;

    expect(subthemes.ACCUMULATION).toBeDefined();
    expect(subthemes.ACCUMULATION.houseNumber).toBe(2);
    expect(subthemes.ACCUMULATION.primaryFamily).toBe(WealthEvidenceFamily.SECOND_HOUSE);
    expect(subthemes.ACCUMULATION.lordFamily).toBe(WealthEvidenceFamily.SECOND_LORD);

    expect(subthemes.GAINS).toBeDefined();
    expect(subthemes.GAINS.houseNumber).toBe(11);
    expect(subthemes.GAINS.primaryFamily).toBe(WealthEvidenceFamily.ELEVENTH_HOUSE);

    expect(subthemes.FORTUNE).toBeDefined();
    expect(subthemes.FORTUNE.houseNumber).toBe(9);

    expect(subthemes.SPECULATION).toBeDefined();
    expect(subthemes.SPECULATION.houseNumber).toBe(5);
  });

  it('produces deep immutable output and does not mutate input context', () => {
    const contextCopy = JSON.parse(JSON.stringify(baseWealthContext));
    const result = interpretWealthTheme(baseWealthContext);
    expect(JSON.stringify(baseWealthContext)).toBe(JSON.stringify(contextCopy));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.conclusion)).toBe(true);
    expect(Object.isFrozen(result.subthemes)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
  });

  it('downgrades completeness to PARTIAL when optional upstream objects are missing', () => {
    const partialInput: ThemeInterpretationContextInput = {
      ...baseWealthContext,
      functionalRoles: undefined,
      planetaryStrength: undefined
    };
    const result = interpretWealthTheme(partialInput);
    expect(result.metadata.dataCompleteness).toBe('PARTIAL');
  });

  it('correctly tracks evaluatedRulesCount and evidenceItemCount', () => {
    const result = interpretWealthTheme(baseWealthContext);
    expect(result.metadata.evaluatedRulesCount).toBeGreaterThan(0);
    expect(result.metadata.triggeredRulesCount).toBeLessThanOrEqual(result.metadata.evaluatedRulesCount);
    expect(result.metadata.evidenceItemCount).toBe(result.evidence.length);
  });

  describe('Full-Pipeline Separation Regression (NatalPromise ≠ Yoga ≠ Dasha)', () => {
    it('positive case: strong 2H + strong 11H + strong Dhana Yoga + active Jupiter Mahadasha', () => {
      const positiveContext: ThemeInterpretationContextInput = {
        horoscope: {
          planetFacts: {
            [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: { status: DignityStatus.EXALTED } } as any,
            [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: { status: DignityStatus.OWN_SIGN } } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            2: { house: 2, lord: Planet.JUPITER, occupants: [Planet.JUPITER], status: 'STRONG' },
            11: { house: 11, lord: Planet.VENUS, occupants: [Planet.VENUS], status: 'STRONG' }
          }
        } as any,
        planetInterpretation: {
          planets: {
            [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: DignityStatus.EXALTED },
            [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: DignityStatus.OWN_SIGN }
          }
        } as any,
        yogas: {
          yogas: [
            {
              type: 'Dhana Yoga',
              category: 'DHANA',
              finalStatus: 'STRONG',
              assessment: { status: 'ACTIVE', strength: 'STRONG' }
            }
          ]
        } as any,
        dashaInterpretation: {
          current: {
            mahadasha: { planet: Planet.JUPITER },
            antardasha: { planet: Planet.VENUS }
          }
        } as any
      };

      const result = interpretWealthTheme(positiveContext);

      // 1. Structural natal promise is STRONG
      expect(result.wealthNatalPromise.status).toBe('STRONG');

      // 2. Yoga evidence is CONFIRMATION (not structural)
      const yogaEvidence = result.evidence.filter((e) => e.evidenceFamily === WealthEvidenceFamily.YOGA);
      expect(yogaEvidence.length).toBeGreaterThan(0);
      expect(yogaEvidence.every((e) => e.dimension === 'CONFIRMATION')).toBe(true);

      // 3. Dasha evidence is TIMING
      const dashaEvidence = result.evidence.filter((e) => e.evidenceFamily === WealthEvidenceFamily.DASHA);
      expect(dashaEvidence.length).toBeGreaterThan(0);
      expect(dashaEvidence.every((e) => e.dimension === 'TIMING')).toBe(true);

      // 4. Overall conclusion is STRONGLY_SUPPORTED
      expect(result.conclusion.status).toBe('STRONGLY_SUPPORTED');
    });

    it('negative case: adverse 2H + adverse 11H (challenged) + strong Dhana Yoga + active Jupiter Mahadasha', () => {
      const negativeContext: ThemeInterpretationContextInput = {
        horoscope: {
          planetFacts: {
            [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: { status: DignityStatus.DEBILITATED } } as any,
            [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: { status: DignityStatus.DEBILITATED } } as any
          }
        } as any,
        houseInterpretation: {
          houses: {
            2: {
              house: 2,
              lord: Planet.JUPITER,
              occupants: [Planet.JUPITER],
              status: 'AFFLICTED',
              summary: { challengingFactors: ['Malefic affliction in 2H'], supportingFactors: [] }
            },
            11: {
              house: 11,
              lord: Planet.VENUS,
              occupants: [Planet.VENUS],
              status: 'AFFLICTED',
              summary: { challengingFactors: ['Debilitated lord in 11H'], supportingFactors: [] }
            }
          }
        } as any,
        planetInterpretation: {
          planets: {
            [Planet.JUPITER]: { planet: Planet.JUPITER, house: 2, dignity: DignityStatus.DEBILITATED },
            [Planet.VENUS]: { planet: Planet.VENUS, house: 11, dignity: DignityStatus.DEBILITATED }
          }
        } as any,
        yogas: {
          yogas: [
            {
              type: 'Dhana Yoga',
              category: 'DHANA',
              finalStatus: 'STRONG',
              assessment: { status: 'ACTIVE', strength: 'STRONG' }
            }
          ]
        } as any,
        dashaInterpretation: {
          current: {
            mahadasha: { planet: Planet.JUPITER },
            antardasha: { planet: Planet.VENUS }
          }
        } as any
      };

      const result = interpretWealthTheme(negativeContext);

      // Invariant: Yoga and Dasha cannot manufacture a STRONG natal promise
      expect(result.wealthNatalPromise.status).not.toBe('STRONG');
      expect(['ADVERSE', 'MIXED']).toContain(result.wealthNatalPromise.status);

      // Final conclusion cannot be STRONGLY_SUPPORTED
      expect(result.conclusion.status).not.toBe('STRONGLY_SUPPORTED');
    });
  });
});
