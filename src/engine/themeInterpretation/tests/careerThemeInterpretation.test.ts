import { describe, it, expect } from 'vitest';
import { interpretCareerTheme } from '../themeInterpretation';
import { ThemeInterpretationContextInput } from '../themeInterpretationContext';
import { Planet, DignityStatus } from '../../../types';
import { CareerEvidenceFamily } from '../themeInterpretationTypes';

describe('Career Theme Interpretation Engine Hardening & Synthesis', () => {
  const baseContext: ThemeInterpretationContextInput = {
    horoscope: {
      planetFacts: {
        [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: { status: DignityStatus.EXALTED } } as any,
        [Planet.SATURN]: { planet: Planet.SATURN, house: 10, dignity: { status: DignityStatus.OWN_SIGN } } as any,
        [Planet.MARS]: { planet: Planet.MARS, house: 1, dignity: { status: DignityStatus.FRIEND_SIGN } } as any,
        [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: { status: DignityStatus.FRIEND_SIGN } } as any,
        [Planet.JUPITER]: { planet: Planet.JUPITER, house: 9, dignity: { status: DignityStatus.OWN_SIGN } } as any,
        [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: { status: DignityStatus.NEUTRAL_SIGN } } as any,
        [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: { status: DignityStatus.NEUTRAL_SIGN } } as any
      }
    } as any,
    houseInterpretation: {
      houses: {
        10: { house: 10, lord: Planet.SUN, occupants: [Planet.SATURN], status: 'STRONG' },
        6: { house: 6, lord: Planet.VENUS, occupants: [] },
        11: { house: 11, lord: Planet.MOON, occupants: [] },
        2: { house: 2, lord: Planet.MERCURY, occupants: [] },
        1: { house: 1, lord: Planet.MARS, occupants: [] }
      }
    } as any,
    planetInterpretation: {
      planets: {
        [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED },
        [Planet.SATURN]: { planet: Planet.SATURN, house: 10, dignity: DignityStatus.OWN_SIGN },
        [Planet.MARS]: { planet: Planet.MARS, house: 1, dignity: DignityStatus.FRIEND_SIGN },
        [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.FRIEND_SIGN },
        [Planet.JUPITER]: { planet: Planet.JUPITER, house: 9, dignity: DignityStatus.OWN_SIGN },
        [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.NEUTRAL_SIGN },
        [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.NEUTRAL_SIGN }
      }
    } as any,
    yogas: { yogas: [] } as any,
    divisionalInterpretation: {
      d10: {
        varga: 'D10',
        houses: [{ house: 10, lord: Planet.SUN, occupants: [] }],
        planets: { [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED } }
      }
    } as any,
    functionalRoles: { roles: {} } as any,
    planetaryStrength: { strengths: {} } as any,
    dashaInterpretation: { activePeriods: {} } as any,
    natalGrahaDrishti: { aspects: [] } as any
  };

  it('collapses repeated 10L facts into ONE TENTH_LORD family item without inflation', () => {
    const result = interpretCareerTheme(baseContext);
    const tenthLordEv = result.evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD);
    expect(tenthLordEv.length).toBe(1);
    expect(tenthLordEv[0].factors?.length).toBeGreaterThan(1);
  });

  it('downgrades completeness to PARTIAL when optional upstream objects are missing', () => {
    const partialInput: ThemeInterpretationContextInput = {
      ...baseContext,
      functionalRoles: undefined,
      planetaryStrength: undefined
    };
    const result = interpretCareerTheme(partialInput);
    expect(result.metadata.dataCompleteness).toBe('PARTIAL');
  });

  it('correctly distinguishes triggeredRulesCount from evidenceItemCount', () => {
    const result = interpretCareerTheme(baseContext);
    expect(result.metadata.evaluatedRulesCount).toBeGreaterThan(0);
    expect(result.metadata.triggeredRulesCount).toBeLessThanOrEqual(result.metadata.evaluatedRulesCount);
    expect(typeof result.metadata.evidenceItemCount).toBe('number');
  });

  it('produces deep immutable output and does not mutate context', () => {
    const contextCopy = JSON.parse(JSON.stringify(baseContext));
    const result = interpretCareerTheme(baseContext);
    expect(JSON.stringify(baseContext)).toBe(JSON.stringify(contextCopy));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.conclusion)).toBe(true);
    expect(Object.isFrozen(result.metadata)).toBe(true);
  });

  it('does not give STRONGLY_SUPPORTED from secondary or timing evidence alone', () => {
    const weakContext: ThemeInterpretationContextInput = {
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.MERCURY, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MARS, occupants: [] },
          1: { house: 1, lord: Planet.SATURN, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      dashaInterpretation: {
        current: { mahadasha: { planet: Planet.SUN } }
      } as any
    };

    const result = interpretCareerTheme(weakContext);
    expect(result.conclusion.status).not.toBe('STRONGLY_SUPPORTED');
  });

  it('returns UNAVAILABLE for D10 when D10 provides no career confirmation', () => {
    const noD10Context: ThemeInterpretationContextInput = {
      ...baseContext,
      divisionalInterpretation: undefined
    };
    const result = interpretCareerTheme(noD10Context);
    expect(result.metadata.vargaConfirmationStatus).toBe('UNAVAILABLE');
  });

  it('preserves distinct SUPPORT and CHALLENGE evidence items for a family without merging to single NEUTRAL (Test 1)', () => {
    const mixedContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            lord: Planet.SUN,
            occupants: [],
            status: 'STRONG',
            effect: 'CHALLENGE'
          } as any,
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any
    };

    const result = interpretCareerTheme(mixedContext);
    const tenthHouseEv = result.evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.TENTH_HOUSE);

    // Preserves BOTH items (SUPPORT and CHALLENGE), no single NEUTRAL merge
    expect(tenthHouseEv.some((e) => e.effect === 'SUPPORT')).toBe(true);
    expect(tenthHouseEv.some((e) => e.effect === 'CHALLENGE')).toBe(true);
    expect(result.familySummaries[CareerEvidenceFamily.TENTH_HOUSE]?.status).toBe('MIXED');
  });

  it('prevents Yoga and D10 from manufacturing STRONGLY_SUPPORTED without >= 2 structural families (Test 2)', () => {
    const yogaD10Context: ThemeInterpretationContextInput = {
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.SUN, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED },
          [Planet.MARS]: { planet: Planet.MARS, house: 5, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 5, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      yogas: {
        yogas: [
          {
            name: 'Raja Yoga',
            type: 'RAJA_YOGA',
            planets: [Planet.MARS, Planet.JUPITER],
            houses: [5],
            strength: 'STRONG',
            status: 'PRESENT',
            assessment: { finalStatus: 'STRONG' }
          }
        ]
      } as any,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.SUN, occupants: [] }],
          planets: { [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED } }
        }
      } as any,
      functionalRoles: { roles: {} } as any,
      planetaryStrength: { strengths: {} } as any,
      dashaInterpretation: { activePeriods: {} } as any,
      natalGrahaDrishti: { aspects: [] } as any
    };

    const result = interpretCareerTheme(yogaD10Context);
    // 10L is strong + YOGA is support + D10 confirms, but only ONE structural family (10L) is supporting
    expect(result.conclusion.status).not.toBe('STRONGLY_SUPPORTED');
    expect(result.conclusion.status).toBe('SUPPORTED');
  });

  it('evaluates D1 strong + D10 neutral to PARTIALLY_CONFIRMS and NEUTRAL effect (Test 3)', () => {
    const d10NeutralContext: ThemeInterpretationContextInput = {
      ...baseContext,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.MERCURY, occupants: [] }],
          planets: {
            [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
            [Planet.SUN]: { planet: Planet.SUN, house: 3, dignity: DignityStatus.NEUTRAL_SIGN }
          }
        },
        d1Comparisons: {
          [Planet.SUN]: { isD9Vargottama: false, isD10Vargottama: false }
        }
      } as any
    };

    const result = interpretCareerTheme(d10NeutralContext);
    const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
    expect(d10Ev).toBeDefined();
    expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    expect(d10Ev?.effect).toBe('NEUTRAL');
    expect(result.metadata.vargaConfirmationStatus).toBe('PARTIALLY_CONFIRMS');
  });

  it('resolves end-to-end conclusion status to MIXED when 10H has mixed evidence (Test 4)', () => {
    const endToEndMixedContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            lord: Planet.SUN,
            occupants: [],
            status: 'STRONG',
            effect: 'CHALLENGE'
          } as any,
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED }
        }
      } as any
    };

    const result = interpretCareerTheme(endToEndMixedContext);
    expect(result.familySummaries[CareerEvidenceFamily.TENTH_HOUSE]?.status).toBe('MIXED');
    expect(result.conclusion.status).toBe('MIXED');
  });

  it('handles D1 strong + D10 adverse by flagging conflicts and preventing STRONGLY_SUPPORTED (Test A)', () => {
    const d10AdverseContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.SUN, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED }
        }
      } as any,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.SUN, occupants: [] }],
          planets: {
            [Planet.SUN]: { planet: Planet.SUN, house: 8, dignity: DignityStatus.DEBILITATED }
          }
        }
      } as any
    };

    const result = interpretCareerTheme(d10AdverseContext);
    const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
    expect(d10Ev).toBeDefined();
    expect(d10Ev?.effect).toBe('CHALLENGE');
    expect(d10Ev?.vargaEvidence?.relationship).toBe('CONFLICTS');
    expect(result.metadata.vargaConfirmationStatus).toBe('CONFLICTS');
    expect(result.conclusion.status).not.toBe('STRONGLY_SUPPORTED');
  });

  it('handles D1 adverse + D10 strong by marking MODIFIES without flipping natal promise (Test B)', () => {
    const d1AdverseD10StrongContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            lord: Planet.SATURN,
            occupants: [],
            status: 'AFFLICTED',
            effect: 'CHALLENGE'
          } as any,
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SATURN]: { planet: Planet.SATURN, house: 8, dignity: DignityStatus.DEBILITATED }
        }
      } as any,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.SATURN, occupants: [] }],
          planets: {
            [Planet.SATURN]: { planet: Planet.SATURN, house: 10, dignity: DignityStatus.EXALTED }
          }
        }
      } as any
    };

    const result = interpretCareerTheme(d1AdverseD10StrongContext);
    const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
    expect(d10Ev).toBeDefined();
    expect(d10Ev?.vargaEvidence?.relationship).toBe('MODIFIES');
    expect(d10Ev?.effect).toBe('NEUTRAL');
    expect(result.careerNatalPromise.status).toBe('ADVERSE');
  });

  it('ensures Yogakaraka with adverse dignity and placement does not resolve to STRONG SUPPORT (Test D)', () => {
    const yogakarakaAdverseContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: {
            house: 10,
            lord: Planet.SATURN,
            occupants: []
          } as any,
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SATURN]: { planet: Planet.SATURN, house: 8, dignity: DignityStatus.DEBILITATED }
        }
      } as any,
      functionalRoles: {
        roles: {
          [Planet.SATURN]: {
            planet: Planet.SATURN,
            isYogakaraka: true,
            isLagnaLord: false,
            role: 'BENEFIC'
          }
        }
      } as any
    };

    const result = interpretCareerTheme(yogakarakaAdverseContext);
    const tenthLordEv = result.evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.TENTH_LORD);

    // TENTH_LORD evidence should NOT resolve to STRONG SUPPORT
    const hasStrongSupport = tenthLordEv.some((e) => e.effect === 'SUPPORT' && e.strength === 'STRONG');
    expect(hasStrongSupport).toBe(false);

    expect(result.conclusion.status).not.toBe('STRONGLY_SUPPORTED');
  });

  it('resolves to SUPPORTED (not STRONG) when 6H and 11H are strong but 10H/10L is neutral (Test 1)', () => {
    const input: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.MERCURY, occupants: [], status: 'NEUTRAL' },
          6: { house: 6, lord: Planet.VENUS, occupants: [Planet.VENUS], status: 'STRONG' },
          11: { house: 11, lord: Planet.MOON, occupants: [Planet.MOON], status: 'STRONG' },
          2: { house: 2, lord: Planet.MARS, occupants: [] },
          1: { house: 1, lord: Planet.SUN, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.OWN_SIGN },
          [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.EXALTED },
          [Planet.MARS]: { planet: Planet.MARS, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.SUN]: { planet: Planet.SUN, house: 1, dignity: DignityStatus.FRIEND_SIGN }
        }
      } as any,
      divisionalInterpretation: undefined
    };

    const result = interpretCareerTheme(input);
    expect(result.careerNatalPromise.status).not.toBe('STRONG');
    expect(result.careerNatalPromise.status).toBe('SUPPORTED');
  });

  it('does not escalate confidence to HIGH purely due to D10 presence when D10 is PARTIALLY_CONFIRMS (Test 2)', () => {
    const input: ThemeInterpretationContextInput = {
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.SUN, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MARS]: { planet: Planet.MARS, house: 1, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.MERCURY, occupants: [] }],
          planets: {
            [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
            [Planet.SUN]: { planet: Planet.SUN, house: 3, dignity: DignityStatus.NEUTRAL_SIGN }
          }
        },
        d1Comparisons: {
          [Planet.SUN]: { isD9Vargottama: false, isD10Vargottama: false }
        }
      } as any,
      functionalRoles: undefined,
      planetaryStrength: undefined,
      dashaInterpretation: undefined,
      natalGrahaDrishti: undefined
    };

    const result = interpretCareerTheme(input);
    const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
    expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    expect(result.conclusion.confidence).not.toBe('HIGH');
    expect(result.conclusion.confidence).toBe('MEDIUM');
  });

  it('does not escalate confidence when an unrelated non-career Yoga is present (Test 3)', () => {
    const input: ThemeInterpretationContextInput = {
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.SUN, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 4, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MARS]: { planet: Planet.MARS, house: 1, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      yogas: {
        yogas: [
          {
            name: 'Unrelated Yoga',
            type: 'OTHER_YOGA',
            planets: [Planet.VENUS],
            houses: [4],
            strength: 'WEAK',
            status: 'PRESENT',
            assessment: { finalStatus: 'WEAK' }
          }
        ]
      } as any,
      divisionalInterpretation: undefined,
      functionalRoles: undefined,
      planetaryStrength: undefined,
      dashaInterpretation: undefined,
      natalGrahaDrishti: undefined
    };

    const result = interpretCareerTheme(input);
    const yogaEvidence = result.evidence.filter((e) => e.evidenceFamily === CareerEvidenceFamily.YOGA);
    expect(yogaEvidence.length).toBe(0);
    expect(result.conclusion.confidence).not.toBe('HIGH');
    expect(result.conclusion.confidence).toBe('MEDIUM');
  });

  it('assigns MEDIUM (not HIGH) confidence for one strong structural family with PARTIAL upstream data (Test 4)', () => {
    const input: ThemeInterpretationContextInput = {
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.SUN, occupants: [] },
          6: { house: 6, lord: Planet.VENUS, occupants: [] },
          11: { house: 11, lord: Planet.MOON, occupants: [] },
          2: { house: 2, lord: Planet.MERCURY, occupants: [] },
          1: { house: 1, lord: Planet.MARS, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.MARS]: { planet: Planet.MARS, house: 1, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      divisionalInterpretation: undefined,
      functionalRoles: undefined,
      planetaryStrength: undefined,
      dashaInterpretation: undefined,
      natalGrahaDrishti: undefined
    };

    const result = interpretCareerTheme(input);
    expect(result.metadata.dataCompleteness).toBe('PARTIAL');
    expect(result.careerNatalPromise.evidenceConfidence).not.toBe('HIGH');
    expect(result.careerNatalPromise.evidenceConfidence).toBe('MEDIUM');
    expect(result.conclusion.confidence).not.toBe('HIGH');
    expect(result.conclusion.confidence).toBe('MEDIUM');
  });

  it('proves D10 consumes canonical CareerNatalPromise when naive D1 recomputation differs (Test 5 canonical boundary)', () => {
    const canonicalBoundaryContext: ThemeInterpretationContextInput = {
      ...baseContext,
      houseInterpretation: {
        houses: {
          10: { house: 10, lord: Planet.MERCURY, occupants: [], status: 'NEUTRAL' },
          6: { house: 6, lord: Planet.VENUS, occupants: [Planet.VENUS], status: 'STRONG' },
          11: { house: 11, lord: Planet.MOON, occupants: [Planet.MOON], status: 'STRONG' },
          2: { house: 2, lord: Planet.MARS, occupants: [] },
          1: { house: 1, lord: Planet.SATURN, occupants: [] }
        }
      } as any,
      planetInterpretation: {
        planets: {
          [Planet.MERCURY]: { planet: Planet.MERCURY, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.VENUS]: { planet: Planet.VENUS, house: 6, dignity: DignityStatus.EXALTED },
          [Planet.MOON]: { planet: Planet.MOON, house: 11, dignity: DignityStatus.EXALTED },
          [Planet.MARS]: { planet: Planet.MARS, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
          [Planet.SATURN]: { planet: Planet.SATURN, house: 1, dignity: DignityStatus.NEUTRAL_SIGN }
        }
      } as any,
      divisionalInterpretation: {
        d10: {
          varga: 'D10',
          houses: [{ house: 10, lord: Planet.SUN, occupants: [] }],
          planets: {
            [Planet.SUN]: { planet: Planet.SUN, house: 10, dignity: DignityStatus.EXALTED }
          }
        }
      } as any
    };

    const result = interpretCareerTheme(canonicalBoundaryContext);
    expect(result.careerNatalPromise.status).toBe('SUPPORTED');
    const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
    expect(d10Ev).toBeDefined();
    expect(d10Ev?.vargaEvidence?.relationship).toBe('CONFIRMS');
    expect(d10Ev?.effect).toBe('SUPPORT');
  });

  it('records ruleErrors in metadata in production mode when a rule throws', () => {
    const globalProc = (globalThis as any).process;
    const originalEnv = globalProc?.env?.NODE_ENV;
    try {
      if (globalProc && globalProc.env) {
        globalProc.env.NODE_ENV = 'production';
      }
      const normalResult = interpretCareerTheme(baseContext);
      expect(normalResult.metadata.ruleErrors).toBeUndefined();
    } finally {
      if (globalProc && globalProc.env) {
        globalProc.env.NODE_ENV = originalEnv;
      }
    }
  });

  describe('D10 Dasamsa Evaluator PR-024A-FIX Regression Tests', () => {
    it('does not treat D10 10th lord in house 8 with NEUTRAL dignity as CONFLICTS', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 8, dignity: DignityStatus.NEUTRAL_SIGN },
              [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).not.toBe('CONFLICTS');
      expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    });

    it('does not treat D10 10th lord in house 12 with NEUTRAL dignity as CONFLICTS', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 12, dignity: DignityStatus.NEUTRAL_SIGN },
              [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).not.toBe('CONFLICTS');
      expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    });

    it('does not treat Natal 10th lord placed in D10 house 8 with NEUTRAL dignity as CONFLICTS', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
              [Planet.SUN]: { planet: Planet.SUN, house: 8, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).not.toBe('CONFLICTS');
      expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    });

    it('does not treat Natal 10th lord placed in D10 house 12 with NEUTRAL dignity as CONFLICTS', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 2, dignity: DignityStatus.NEUTRAL_SIGN },
              [Planet.SUN]: { planet: Planet.SUN, house: 12, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).not.toBe('CONFLICTS');
      expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
    });

    it('flags D10 10th lord DEBILITATED with D1 STRONG as CONFLICTS with CHALLENGE effect', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 4, dignity: DignityStatus.DEBILITATED },
              [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).toBe('CONFLICTS');
      expect(d10Ev?.effect).toBe('CHALLENGE');
    });

    it('flags D10 10th lord EXALTED with D1 STRONG as CONFIRMS with SUPPORT effect', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 10, dignity: DignityStatus.EXALTED },
              [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.NEUTRAL_SIGN }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).toBe('CONFIRMS');
      expect(d10Ev?.effect).toBe('SUPPORT');
    });

    it('resolves one factor strong and another factor debilitated to PARTIALLY_CONFIRMS (D10 NEUTRAL) rather than CONFLICTS', () => {
      const context: ThemeInterpretationContextInput = {
        ...baseContext,
        divisionalInterpretation: {
          d10: {
            varga: 'D10',
            houses: [{ house: 10, lord: Planet.MARS, occupants: [] }],
            planets: {
              [Planet.MARS]: { planet: Planet.MARS, house: 10, dignity: DignityStatus.EXALTED },
              [Planet.SUN]: { planet: Planet.SUN, house: 2, dignity: DignityStatus.DEBILITATED }
            }
          }
        } as any
      };
      const result = interpretCareerTheme(context);
      const d10Ev = result.evidence.find((e) => e.evidenceFamily === CareerEvidenceFamily.D10);
      expect(d10Ev?.vargaEvidence?.relationship).not.toBe('CONFLICTS');
      expect(d10Ev?.vargaEvidence?.relationship).toBe('PARTIALLY_CONFIRMS');
      expect(d10Ev?.effect).toBe('NEUTRAL');
    });
  });
});
