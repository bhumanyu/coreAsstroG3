import { describe, it, expect } from 'vitest';
import { Planet, Sign } from '../../types';
import { LifeTheme, LifeThemeInput } from './lifeThemeTypes';
import { LIFE_THEME_METADATA, getThemesForHouse } from './lifeThemeMetadata';
import { analyzeLifeThemes } from './lifeThemes';
import { calculateHoroscope } from '../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

function createDummyLifeThemeInput(overrides?: Partial<LifeThemeInput>): LifeThemeInput {
  const defaultInput: LifeThemeInput = {
    planetInterpretation: { planets: {} as any },
    houseInterpretation: { houses: [] as any },
    functionalRoles: { ascendantSign: Sign.ARIES, badhakaHouse: 11, badhakaLord: Planet.SATURN, planets: {} as any },
    yogas: { yogas: [] },
    natalGrahaDrishti: { aspects: [] } as any,
    dashaInterpretation: { mahadashas: [] } as any,
    divisionalInterpretation: {
      d9: {
        ascendant: { sign: Sign.ARIES, eclipticLongitude: 0 },
        houseLords: {} as any,
        planets: {} as any,
        houses: {} as any,
        evidence: [],
        yogasAvailability: 'NOT_CALCULATED'
      } as any,
      d10: {
        ascendant: { sign: Sign.ARIES, eclipticLongitude: 0 },
        houseLords: {} as any,
        planets: {} as any,
        houses: {} as any,
        evidence: [],
        yogasAvailability: 'NOT_CALCULATED'
      } as any,
      d1Comparisons: {} as any
    } as any
  };

  return { ...defaultInput, ...overrides };
}

describe('P-19 Life Themes Engine', () => {
  describe('House to Theme Mapping', () => {
    it('should map House 1 to SELF_IDENTITY', () => {
      expect(getThemesForHouse(1)).toEqual([LifeTheme.SELF_IDENTITY]);
    });

    it('should map House 2 to FAMILY_HOME and WEALTH_FINANCE', () => {
      expect(getThemesForHouse(2)).toEqual([LifeTheme.FAMILY_HOME, LifeTheme.WEALTH_FINANCE]);
    });

    it('should map House 3 to COMMUNICATION', () => {
      expect(getThemesForHouse(3)).toEqual([LifeTheme.COMMUNICATION]);
    });

    it('should map House 4 to FAMILY_HOME', () => {
      expect(getThemesForHouse(4)).toEqual([LifeTheme.FAMILY_HOME]);
    });

    it('should map House 5 to CHILDREN_CREATIVITY', () => {
      expect(getThemesForHouse(5)).toEqual([LifeTheme.CHILDREN_CREATIVITY]);
    });

    it('should map House 6 to HEALTH_SERVICE', () => {
      expect(getThemesForHouse(6)).toEqual([LifeTheme.HEALTH_SERVICE]);
    });

    it('should map House 7 to PARTNERSHIP', () => {
      expect(getThemesForHouse(7)).toEqual([LifeTheme.PARTNERSHIP]);
    });

    it('should map House 8 to TRANSFORMATION', () => {
      expect(getThemesForHouse(8)).toEqual([LifeTheme.TRANSFORMATION]);
    });

    it('should map House 9 to DHARMA_BELIEFS', () => {
      expect(getThemesForHouse(9)).toEqual([LifeTheme.DHARMA_BELIEFS]);
    });

    it('should map House 10 to CAREER_STATUS', () => {
      expect(getThemesForHouse(10)).toEqual([LifeTheme.CAREER_STATUS]);
    });

    it('should map House 11 to WEALTH_FINANCE and NETWORKS_GAINS', () => {
      expect(getThemesForHouse(11)).toEqual([LifeTheme.WEALTH_FINANCE, LifeTheme.NETWORKS_GAINS]);
    });

    it('should map House 12 to SPIRITUALITY_RELEASE', () => {
      expect(getThemesForHouse(12)).toEqual([LifeTheme.SPIRITUALITY_RELEASE]);
    });

    it('should return empty array for invalid house numbers', () => {
      expect(getThemesForHouse(0)).toEqual([]);
      expect(getThemesForHouse(13)).toEqual([]);
      expect(getThemesForHouse(-1)).toEqual([]);
    });
  });

  describe('Input Validation', () => {
    it('should RejectMissingInput', () => {
      expect(() => analyzeLifeThemes(null as any)).toThrow(TypeError);
      expect(() => analyzeLifeThemes(null as any)).toThrow('lifeTheme input must not be null or undefined.');
      expect(() => analyzeLifeThemes(undefined as any)).toThrow('lifeTheme input must not be null or undefined.');
    });

    it('should RejectMissingRequiredReport', () => {
      const base = createDummyLifeThemeInput();
      const fields: Array<keyof LifeThemeInput> = [
        'planetInterpretation',
        'houseInterpretation',
        'functionalRoles',
        'yogas',
        'natalGrahaDrishti',
        'dashaInterpretation',
        'divisionalInterpretation'
      ];

      for (const field of fields) {
        const invalidInput = { ...base, [field]: undefined };
        expect(() => analyzeLifeThemes(invalidInput as any)).toThrow(
          `lifeTheme input is missing required field: ${field}.`
        );
      }
    });
  });

  describe('Evidence Collectors', () => {
    it('shouldConsumeHouseEvidence', () => {
      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              lord: Planet.SATURN,
              occupants: [Planet.SUN],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_10_EVID_01',
                  statement: 'Sun in 10th house boosts career visibility.',
                  effect: 'SUPPORT',
                  planets: [Planet.SUN]
                }
              ]
            }
          ] as any
        } as any
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const houseEv = careerTheme.evidence.find((e) => e.ruleId === 'HOUSE_10_EVID_01');
      expect(houseEv).toBeDefined();
      expect(houseEv?.source).toBe('HOUSE_INTERPRETATION');
      expect(houseEv?.effect).toBe('SUPPORT');
      expect(houseEv?.houses).toEqual([10]);
    });

    it('shouldConsumePlanetEvidence', () => {
      const input = createDummyLifeThemeInput({
        planetInterpretation: {
          planets: {
            [Planet.SUN]: {
              planet: Planet.SUN,
              placement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'PLANET_SUN_10_01',
                  statement: 'Sun placed in 10th house.',
                  effect: 'SUPPORT',
                  houses: [10]
                }
              ]
            }
          } as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const planetEv = careerTheme.evidence.find((e) => e.ruleId === 'PLANET_SUN_10_01');
      expect(planetEv).toBeDefined();
      expect(planetEv?.source).toBe('PLANET_INTERPRETATION');
      expect(planetEv?.planets).toEqual([Planet.SUN]);
    });

    it('shouldConsumeFunctionalRoleEvidence', () => {
      const input = createDummyLifeThemeInput({
        functionalRoles: {
          ascendantSign: Sign.ARIES,
          badhakaHouse: 11,
          badhakaLord: Planet.SATURN,
          planets: {
            [Planet.SATURN]: {
              planet: Planet.SATURN,
              roles: ['BADHAKA'],
              ownedHouses: [10, 11],
              evidence: [
                {
                  ruleId: 'FUNC_SATURN_01',
                  reason: 'Saturn rules 10th and 11th houses as Badhaka for Aries.',
                  houses: [10, 11]
                }
              ]
            }
          } as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const funcEv = careerTheme.evidence.find((e) => e.ruleId === 'FUNC_SATURN_01');
      expect(funcEv).toBeDefined();
      expect(funcEv?.source).toBe('FUNCTIONAL_ROLE');
      expect(funcEv?.effect).toBe('NEUTRAL'); // FunctionalRole evidence must be NEUTRAL
      expect(funcEv?.statement).toBe('Saturn rules 10th and 11th houses as Badhaka for Aries.');
    });

    it('shouldConsumeYogaEvidence', () => {
      const input = createDummyLifeThemeInput({
        yogas: {
          yogas: [
            {
              type: 'Raja Yoga',
              planets: [Planet.SUN, Planet.MERCURY],
              houses: [10],
              strength: 'STRONG',
              assessment: { finalStatus: 'STRONG', strength: 'STRONG' }
            } as any,
            {
              type: 'Dhana Yoga',
              planets: [Planet.JUPITER, Planet.VENUS],
              houses: [10],
              strength: 'WEAKENED',
              assessment: { finalStatus: 'WEAKENED' }
            } as any,
            {
              type: 'Lakshmi Yoga',
              planets: [Planet.VENUS],
              houses: [10],
              strength: 'CANCELLED',
              assessment: { finalStatus: 'CANCELLED' }
            } as any
          ]
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const strongEv = careerTheme.evidence.find((e) => e.ruleId === 'YOGA_Raja Yoga');
      expect(strongEv).toBeDefined();
      expect(strongEv?.source).toBe('YOGA');
      expect(strongEv?.effect).toBe('SUPPORT');
      expect(strongEv?.yogaStatus).toBe('STRONG');

      const weakEv = careerTheme.evidence.find((e) => e.ruleId === 'YOGA_Dhana Yoga');
      expect(weakEv?.effect).toBe('CHALLENGE');
      expect(weakEv?.yogaStatus).toBe('WEAKENED');

      const cancelledEv = careerTheme.evidence.find((e) => e.ruleId === 'YOGA_Lakshmi Yoga');
      expect(cancelledEv?.effect).toBe('NEUTRAL');
      expect(cancelledEv?.yogaStatus).toBe('CANCELLED');
    });

    it('shouldConsumeNatalDrishtiEvidence', () => {
      const input = createDummyLifeThemeInput({
        natalGrahaDrishti: {
          aspects: [
            {
              sourcePlanet: Planet.MARS,
              targetPlanet: Planet.SATURN,
              targetHouse: 10,
              description: 'Mars aspects 10th house.',
              reason: '4th house aspect'
            } as any
          ]
        } as any
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const drishtiEv = careerTheme.evidence.find((e) => e.ruleId === 'NATAL_DRISHTI_MARS_H10');
      expect(drishtiEv).toBeDefined();
      expect(drishtiEv?.source).toBe('NATAL_DRISHTI');
      expect(drishtiEv?.effect).toBe('NEUTRAL');
      expect(drishtiEv?.statement).toBe('Mars aspects 10th house.');
    });

    it('shouldConsumeD9AndD10Evidence', () => {
      const input = createDummyLifeThemeInput({
        divisionalInterpretation: {
          d9: {
            ascendant: { sign: Sign.LIBRA, eclipticLongitude: 180 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              {
                ruleId: 'D9_MARRIAGE_01',
                statement: 'Venus exalted in D9 7th house.',
                effect: 'SUPPORT',
                house: 7,
                planet: Planet.VENUS
              } as any
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d10: {
            ascendant: { sign: Sign.CAPRICORN, eclipticLongitude: 270 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              {
                ruleId: 'D10_CAREER_01',
                statement: 'Sun placed in D10 10th house.',
                effect: 'SUPPORT',
                house: 10,
                planet: Planet.SUN
              } as any
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d1Comparisons: {} as any
        } as any
      });

      const report = analyzeLifeThemes(input);

      const marriageTheme = report.themes.find((t) => t.theme === LifeTheme.PARTNERSHIP)!;
      const d9Ev = marriageTheme.evidence.find((e) => e.ruleId === 'D9_MARRIAGE_01');
      expect(d9Ev).toBeDefined();
      expect(d9Ev?.source).toBe('D9_INTERPRETATION');
      expect(d9Ev?.varga).toBe('D9');

      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const d10Ev = careerTheme.evidence.find((e) => e.ruleId === 'D10_CAREER_01');
      expect(d10Ev).toBeDefined();
      expect(d10Ev?.source).toBe('D10_INTERPRETATION');
      expect(d10Ev?.varga).toBe('D10');
    });

    it('shouldConsumeDashaEvidence', () => {
      const input = createDummyLifeThemeInput({
        dashaInterpretation: {
          mahadashas: [
            {
              planet: Planet.SUN,
              natal: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'DASHA_SUN_10',
                  statement: 'Sun Mahadasha activates 10th house themes.',
                  effect: 'SUPPORT',
                  houses: [10],
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        } as any
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const dashaEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_SUN_10');
      expect(dashaEv).toBeDefined();
      expect(dashaEv?.source).toBe('DASHA_INTERPRETATION');
      expect(dashaEv?.effect).toBe('SUPPORT');
    });
  });

  describe('Aggregation & Rule Constraints', () => {
    it('shouldAggregateSupportAndChallengeAsMixed', () => {
      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              lord: Planet.SATURN,
              occupants: [Planet.SUN, Planet.SATURN],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_10_SUP',
                  statement: 'Benefic placement.',
                  effect: 'SUPPORT'
                },
                {
                  ruleId: 'HOUSE_10_CHAL',
                  statement: 'Affliction present.',
                  effect: 'CHALLENGE'
                }
              ]
            }
          ] as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.effect).toBe('MIXED');
    });

    it('shouldAggregateOnlySupport', () => {
      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              lord: Planet.SATURN,
              occupants: [Planet.SUN],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_10_SUP',
                  statement: 'Benefic placement.',
                  effect: 'SUPPORT'
                }
              ]
            }
          ] as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.effect).toBe('SUPPORT');
    });

    it('shouldAggregateOnlyChallenge', () => {
      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              lord: Planet.SATURN,
              occupants: [Planet.SATURN],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_10_CHAL',
                  statement: 'Affliction present.',
                  effect: 'CHALLENGE'
                }
              ]
            }
          ] as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.effect).toBe('CHALLENGE');
    });

    it('shouldNotUseNumericThemeScore', () => {
      const input = createDummyLifeThemeInput();
      const report = analyzeLifeThemes(input);

      for (const t of report.themes) {
        expect(t).not.toHaveProperty('score');
        expect(t).not.toHaveProperty('strength');
        expect(t).not.toHaveProperty('probability');
        expect(t).not.toHaveProperty('rank');
      }
    });

    it('shouldDeduplicateIdenticalEvidence', () => {
      const duplicateEv = {
        ruleId: 'DUP_RULE_01',
        statement: 'Duplicate statement',
        effect: 'SUPPORT' as const,
        planets: [Planet.SUN],
        houses: [10]
      };

      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              lord: Planet.SATURN,
              occupants: [Planet.SUN],
              aspects: [],
              evidence: [duplicateEv, duplicateEv]
            }
          ] as any
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      const matchingEv = careerTheme.evidence.filter((e) => e.ruleId === 'DUP_RULE_01');
      expect(matchingEv.length).toBe(1);
    });

    it('shouldPreserveDistinctEvidenceForSameTheme', () => {
      // House 2 and House 11 both map to WEALTH_FINANCE
      const input = createDummyLifeThemeInput({
        houseInterpretation: {
          houses: [
            {
              house: 2,
              sign: Sign.TAURUS,
              lord: Planet.VENUS,
              occupants: [],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_2_EVID',
                  statement: '2nd house accumulated wealth statement.',
                  effect: 'SUPPORT'
                }
              ]
            },
            {
              house: 11,
              sign: Sign.AQUARIUS,
              lord: Planet.SATURN,
              occupants: [],
              aspects: [],
              evidence: [
                {
                  ruleId: 'HOUSE_11_EVID',
                  statement: '11th house gains statement.',
                  effect: 'SUPPORT'
                }
              ]
            }
          ] as any
        }
      });

      const report = analyzeLifeThemes(input);
      const wealthTheme = report.themes.find((t) => t.theme === LifeTheme.WEALTH_FINANCE)!;

      const ev2 = wealthTheme.evidence.find((e) => e.ruleId === 'HOUSE_2_EVID');
      const ev11 = wealthTheme.evidence.find((e) => e.ruleId === 'HOUSE_11_EVID');

      expect(ev2).toBeDefined();
      expect(ev11).toBeDefined();
      expect(wealthTheme.evidence.length).toBeGreaterThanOrEqual(3); // Domain + H2 + H11
    });

    it('shouldReturnDeterministicOrder', () => {
      const input = createDummyLifeThemeInput();
      const report1 = analyzeLifeThemes(input);
      const report2 = analyzeLifeThemes(input);

      expect(report1).toEqual(report2);

      const themesInEnumOrder = LIFE_THEME_METADATA.map((m) => m.theme);
      const reportThemesOrder = report1.themes.map((t) => t.theme);
      expect(reportThemesOrder).toEqual(themesInEnumOrder);
    });

    it('shouldRemainImmutable', () => {
      const input = createDummyLifeThemeInput();
      const report = analyzeLifeThemes(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.themes)).toBe(true);

      for (const theme of report.themes) {
        expect(Object.isFrozen(theme)).toBe(true);
        expect(Object.isFrozen(theme.evidence)).toBe(true);
      }
    });

    it('shouldNotMutateInput', () => {
      const input = createDummyLifeThemeInput();
      const inputCopy = JSON.parse(JSON.stringify(input));

      analyzeLifeThemes(input);

      expect(JSON.parse(JSON.stringify(input))).toEqual(inputCopy);
    });

    it('shouldNotRecalculateAstrologyOrProduceNewFields', () => {
      const input = createDummyLifeThemeInput();
      const report = analyzeLifeThemes(input);

      // Verify report contains strictly only the expected LifeThemeReport fields
      const reportKeys = Object.keys(report).sort();
      expect(reportKeys).toEqual(['confidence', 'themes']);

      // Ensure no astrological calculation fields (Yogas, Drishti, D9, D10, Shadbala) are produced or added
      expect((report as any).yogas).toBeUndefined();
      expect((report as any).natalGrahaDrishti).toBeUndefined();
      expect((report as any).shadbala).toBeUndefined();
      expect((report as any).d9).toBeUndefined();
      expect((report as any).d10).toBeUndefined();
      expect((report as any).planetaryStrength).toBeUndefined();
    });

    it('shouldSupportVargaAwareHouseThemeRouting', () => {
      // D10 House 6 routes to HEALTH_SERVICE (d10Houses: [6])
      const d10Themes = getThemesForHouse(6, 'D10');
      expect(d10Themes).toContain(LifeTheme.HEALTH_SERVICE);

      // D9 House 7 routes to PARTNERSHIP (d9Houses: [7])
      const d9Themes = getThemesForHouse(7, 'D9');
      expect(d9Themes).toContain(LifeTheme.PARTNERSHIP);

      // Verify D9 and D10 evidence collector routing distinction
      const input = createDummyLifeThemeInput({
        divisionalInterpretation: {
          d9: {
            ascendant: { sign: Sign.ARIES, eclipticLongitude: 0 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              { ruleId: 'EV_D9_H7', statement: 'D9 H7 evidence', effect: 'SUPPORT', house: 7 } as any
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d10: {
            ascendant: { sign: Sign.CAPRICORN, eclipticLongitude: 270 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              { ruleId: 'EV_D10_H6', statement: 'D10 H6 evidence', effect: 'SUPPORT', house: 6 } as any
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d1Comparisons: {} as any
        } as any
      });

      const report = analyzeLifeThemes(input);
      const partnershipTheme = report.themes.find((t) => t.theme === LifeTheme.PARTNERSHIP);
      const healthTheme = report.themes.find((t) => t.theme === LifeTheme.HEALTH_SERVICE);

      const partnershipEv = partnershipTheme?.evidence.find((e) => e.ruleId === 'EV_D9_H7');
      const healthEv = healthTheme?.evidence.find((e) => e.ruleId === 'EV_D10_H6');

      expect(partnershipEv).toBeDefined();
      expect(partnershipEv?.varga).toBe('D9');
      expect(healthEv).toBeDefined();
      expect(healthEv?.varga).toBe('D10');
    });

    it('shouldNotUseD1HouseMappingForD10', () => {
      const d10H7Themes = getThemesForHouse(7, 'D10');
      expect(d10H7Themes).not.toContain(LifeTheme.PARTNERSHIP);
      expect(d10H7Themes).toContain(LifeTheme.CAREER_STATUS);

      const input = createDummyLifeThemeInput({
        divisionalInterpretation: {
          d9: {
            ascendant: { sign: Sign.ARIES, eclipticLongitude: 0 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d10: {
            ascendant: { sign: Sign.CAPRICORN, eclipticLongitude: 270 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              { ruleId: 'EV_D10_H7_CONTRACT', statement: 'D10 H7 contract evidence', effect: 'SUPPORT', house: 7 } as any
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d1Comparisons: {} as any
        } as any
      });

      const report = analyzeLifeThemes(input);
      const partnershipTheme = report.themes.find((t) => t.theme === LifeTheme.PARTNERSHIP);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS);

      const partnershipEv = partnershipTheme?.evidence.find((e) => e.ruleId === 'EV_D10_H7_CONTRACT');
      const careerEv = careerTheme?.evidence.find((e) => e.ruleId === 'EV_D10_H7_CONTRACT');

      expect(partnershipEv).toBeUndefined();
      expect(careerEv).toBeDefined();
      expect(careerEv?.varga).toBe('D10');
    });

    it('shouldConsumeAllDashaLevelsWithCorrectDashaLevelTag', () => {
      const input = createDummyLifeThemeInput({
        dashaInterpretation: {
          system: 'VIMSHOTTARI' as any,
          birthAnchor: {} as any,
          confidence: 'HIGH',
          mahadashas: [
            {
              planet: Planet.SUN,
              start: '2020-01-01',
              end: '2026-01-01',
              natal: { house: 10 } as any,
              evidence: [
                { ruleId: 'DASHA_MD_SUN_10', statement: 'MD Sun in 10', effect: 'SUPPORT', house: 10, level: 'MAHADASHA' } as any
              ],
              antardashas: [
                {
                  planet: Planet.MOON,
                  start: '2020-01-01',
                  end: '2020-07-01',
                  natal: { house: 10 } as any,
                  evidence: [
                    { ruleId: 'DASHA_AD_MOON_10', statement: 'AD Moon in 10', effect: 'SUPPORT', house: 10, level: 'ANTARDASHA' } as any
                  ],
                  pairInterpretation: {
                    mahadashaLord: Planet.SUN,
                    antardashaLord: Planet.MOON,
                    sharedHouses: [10],
                    combinedHouseSet: [10],
                    relationshipEvidence: [
                      { ruleId: 'DASHA_PAIR_SUN_MOON', statement: 'Sun-Moon Pair in 10', effect: 'SUPPORT', houses: [10], level: 'PAIR' } as any
                    ]
                  },
                  pratyantardashas: [
                    {
                      planet: Planet.MARS,
                      start: '2020-01-01',
                      end: '2020-02-01',
                      natal: { house: 10 } as any,
                      evidence: [
                        { ruleId: 'DASHA_PD_MARS_10', statement: 'PD Mars in 10', effect: 'SUPPORT', house: 10, level: 'PRATYANTARDASHA' } as any
                      ]
                    } as any
                  ]
                } as any
              ]
            } as any
          ],
          current: {
            at: '2020-01-15',
            mahadasha: {} as any,
            antardasha: {} as any,
            pratyantardasha: {} as any,
            confidence: 'HIGH',
            evidence: [
              { ruleId: 'DASHA_CURR_10', statement: 'Current Dasha in 10', effect: 'SUPPORT', houses: [10], level: 'CURRENT' } as any
            ]
          }
        }
      });

      const report = analyzeLifeThemes(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;

      const mdEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_MD_SUN_10');
      const adEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_AD_MOON_10');
      const pairEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_PAIR_SUN_MOON');
      const pdEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_PD_MARS_10');
      const currEv = careerTheme.evidence.find((e) => e.ruleId === 'DASHA_CURR_10');

      expect(mdEv?.dashaLevel).toBe('MAHADASHA');
      expect(adEv?.dashaLevel).toBe('ANTARDASHA');
      expect(pairEv?.dashaLevel).toBe('PAIR');
      expect(pdEv?.dashaLevel).toBe('PRATYANTARDASHA');
      expect(currEv?.dashaLevel).toBe('CURRENT');
    });
  });

  describe('Integration with Full Horoscope', () => {
    it('shouldProduceLifeThemesInFullHoroscope', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      expect(horoscope.lifeThemes).toBeDefined();
      expect(horoscope.lifeThemes.themes.length).toBe(12);
      expect(horoscope.lifeThemes.confidence).toBeDefined();
    });
  });
});
