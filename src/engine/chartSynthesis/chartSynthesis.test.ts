import { describe, it, expect } from 'vitest';
import { Planet, Sign } from '../../types';
import { LifeTheme, LifeThemeInput, LifeThemeReport } from '../lifeThemes/lifeThemeTypes';
import { analyzeLifeThemes } from '../lifeThemes/lifeThemes';
import { ChartSynthesisInput, ThemeSynthesis } from './chartSynthesisTypes';
import { synthesizeChart } from './chartSynthesis';
import { calculateHoroscope } from '../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { CHART_SYNTHESIS_THEME_ORDER } from './chartSynthesisMetadata';

function createDummyLifeThemeInput(overrides?: Partial<LifeThemeInput>): LifeThemeInput {
  const defaultInput: LifeThemeInput = {
    planetInterpretation: { planets: {} as any },
    houseInterpretation: { houses: [] as any },
    functionalRoles: { ascendantSign: Sign.ARIES, badhakaHouse: 11, badhakaLord: Planet.SATURN, planets: {} as any },
    yogas: { yogas: [] },
    natalGrahaDrishti: { aspects: [] },
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

function createDummySynthesisInput(
  overrides?: Partial<ChartSynthesisInput>,
  lifeThemeOverrides?: Partial<LifeThemeInput>
): ChartSynthesisInput {
  const dummyLifeThemeInput = createDummyLifeThemeInput(lifeThemeOverrides);
  const lifeThemes = analyzeLifeThemes(dummyLifeThemeInput);

  const defaultInput: ChartSynthesisInput = {
    lifeThemes
  };

  return { ...defaultInput, ...overrides };
}

describe('P-20 Chart Synthesis Layer', () => {
  describe('Input Validation', () => {
    it('should throw TypeError when input is null or undefined', () => {
      expect(() => synthesizeChart(null as any)).toThrow(TypeError);
      expect(() => synthesizeChart(null as any)).toThrow('chartSynthesis input must not be null or undefined.');
      expect(() => synthesizeChart(undefined as any)).toThrow(TypeError);
    });

    it('should throw TypeError when required top-level report lifeThemes is missing', () => {
      const valid = createDummySynthesisInput();

      const missingLifeThemes = { ...valid } as any;
      delete missingLifeThemes.lifeThemes;
      expect(() => synthesizeChart(missingLifeThemes)).toThrow('chartSynthesis input is missing required field: lifeThemes.');
    });
  });

  describe('State Detection', () => {
    it('should assign INSUFFICIENT_EVIDENCE when theme has no non-neutral evidence', () => {
      const input = createDummySynthesisInput();
      const report = synthesizeChart(input);
      const selfTheme = report.themes.find((t) => t.theme === LifeTheme.SELF_IDENTITY)!;
      expect(selfTheme.state).toBe('INSUFFICIENT_EVIDENCE');
      expect(selfTheme.supportingFactors.length).toBe(0);
      expect(selfTheme.weakeningFactors.length).toBe(0);
      expect(selfTheme.conclusion).toContain('Insufficient astrological evidence');
    });

    it('should assign SUPPORTED when theme has SUPPORT from a single evidence family', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRONG',
                  source: 'HOUSE_INTERPRETATION',
                  statement: 'Strong 10th house',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        }
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.state).toBe('SUPPORTED');
      expect(careerTheme.repeatedSupport).toBe(false);
      expect(careerTheme.evidenceFamiliesPresent).toEqual(['STRUCTURAL']);
      expect(careerTheme.conclusion).toContain('shows clear supporting indicators');
    });

    it('should assign STRONGLY_SUPPORTED when theme has SUPPORT from >= 2 distinct evidence families', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRONG',
                  source: 'HOUSE_INTERPRETATION',
                  statement: 'Strong 10th house',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        },
        yogas: {
          yogas: [
            {
              type: 'Raja Yoga',
              planets: [Planet.SUN, Planet.MERCURY],
              houses: [10],
              strength: 'STRONG',
              assessment: { finalStatus: 'STRONG' }
            } as any
          ]
        }
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.state).toBe('STRONGLY_SUPPORTED');
      expect(careerTheme.repeatedSupport).toBe(true);
      expect(careerTheme.evidenceFamiliesPresent).toEqual(['STRUCTURAL', 'YOGA']);
      expect(careerTheme.conclusion).toContain('strongly supported across multiple independent astrological factors');
    });

    it('should assign CHALLENGED when theme has only CHALLENGE evidence', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SATURN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 12, sign: Sign.PISCES },
              evidence: [
                {
                  ruleId: 'EV_H10_WEAK',
                  source: 'HOUSE_INTERPRETATION',
                  statement: '10th lord in 12th house afflicted',
                  effect: 'CHALLENGE',
                  house: 10,
                  planets: [Planet.SATURN]
                }
              ]
            } as any
          ]
        }
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.state).toBe('CHALLENGED');
      expect(careerTheme.weakeningFactors.length).toBe(1);
      expect(careerTheme.conclusion).toContain('faces challenging influences');
    });

    it('should assign MIXED when both SUPPORT and CHALLENGE evidence exist', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRONG',
                  source: 'HOUSE_INTERPRETATION',
                  statement: 'Strong 10th house occupant',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                },
                {
                  ruleId: 'EV_H10_AFFLICTION',
                  source: 'HOUSE_INTERPRETATION',
                  statement: 'Malefic aspect on 10th house',
                  effect: 'CHALLENGE',
                  house: 10,
                  planets: [Planet.SATURN]
                }
              ]
            } as any
          ]
        }
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.state).toBe('MIXED');
      expect(careerTheme.conflictingIndicators).toBe(true);
      expect(careerTheme.conclusion).toContain('presents a mixed picture');
    });
  });

  describe('Repeated vs Duplicate Support', () => {
    it('should distinguish duplicate single-family support from multi-family repeated support', () => {
      // Duplicate support in single family (PLANETARY)
      const duplicateInput = createDummySynthesisInput(undefined, {
        planetInterpretation: {
          planets: {
            [Planet.SUN]: {
              planet: Planet.SUN,
              placement: { house: 10, sign: Sign.CAPRICORN },
              dignity: 'OWN_SIGN',
              strength: 'STRONG',
              evidence: [
                {
                  ruleId: 'EV_SUN_10_A',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Sun in 10th house strong',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                },
                {
                  ruleId: 'EV_SUN_10_B',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Sun in 10th house dignifying career',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            }
          } as any
        }
      });

      const duplicateReport = synthesizeChart(duplicateInput);
      const dupCareer = duplicateReport.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(dupCareer.supportingFactors.length).toBe(2);
      expect(dupCareer.repeatedSupport).toBe(false); // Only 1 family (PLANETARY)
      expect(dupCareer.state).toBe('SUPPORTED');

      // Multi-family repeated support (STRUCTURAL + PLANETARY)
      const multiFamilyInput = createDummySynthesisInput(undefined, {
        planetInterpretation: {
          planets: {
            [Planet.SUN]: {
              planet: Planet.SUN,
              placement: { house: 10, sign: Sign.CAPRICORN },
              dignity: 'OWN_SIGN',
              strength: 'STRONG',
              evidence: [
                {
                  ruleId: 'EV_SUN_10_A',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Sun in 10th house strong',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            }
          } as any
        },
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRUCT',
                  source: 'HOUSE_INTERPRETATION',
                  statement: '10th house well fortified',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        }
      });

      const multiReport = synthesizeChart(multiFamilyInput);
      const multiCareer = multiReport.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(multiCareer.repeatedSupport).toBe(true); // 2 families (PLANETARY + STRUCTURAL)
      expect(multiCareer.state).toBe('STRONGLY_SUPPORTED');
    });
  });

  describe('Mixed Golden Test', () => {
    it('should evaluate HOUSE + D10 SUPPORT with DASHA CHALLENGE as MIXED and timingDependent', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRUCT',
                  source: 'HOUSE_INTERPRETATION',
                  statement: '10th house strong',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        },
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
            evidence: [
              {
                ruleId: 'EV_D10_CAREER',
                source: 'D10_INTERPRETATION',
                statement: 'D10 10th house exalted lord',
                effect: 'SUPPORT',
                house: 10,
                planets: [Planet.SATURN],
                varga: 'D10'
              }
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d1Comparisons: {} as any
        } as any,
        dashaInterpretation: {
          system: 'VIMSHOTTARI' as any,
          birthAnchor: {} as any,
          confidence: 'HIGH',
          mahadashas: [
            {
              planet: Planet.RAHU,
              start: '2020-01-01',
              end: '2038-01-01',
              natal: { house: 10 } as any,
              evidence: [
                {
                  ruleId: 'EV_DASHA_RAHU_10',
                  source: 'DASHA_INTERPRETATION',
                  statement: 'Rahu Mahadasha creates temporary career obstruction',
                  effect: 'CHALLENGE',
                  house: 10,
                  planets: [Planet.RAHU],
                  level: 'MAHADASHA'
                }
              ]
            } as any
          ]
        } as any
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;

      expect(careerTheme.state).toBe('MIXED');
      expect(careerTheme.conflictingIndicators).toBe(true);
      expect(careerTheme.timingDependent).toBe(true);
      expect(careerTheme.timingFactors.length).toBe(1);
      expect(careerTheme.timingFactors[0].ruleId).toBe('EV_DASHA_RAHU_10');
      expect(careerTheme.evidenceFamiliesPresent).toEqual(['STRUCTURAL', 'DIVISIONAL', 'DASHA']);
    });
  });

  describe('Provenance Preservation', () => {
    it('should preserve D9, D10, Yoga, FunctionalRole, and Dasha details in synthesis evidence', () => {
      const input = createDummySynthesisInput(undefined, {
        functionalRoles: {
          ascendantSign: Sign.ARIES,
          badhakaHouse: 11,
          badhakaLord: Planet.SATURN,
          planets: {
            [Planet.JUPITER]: {
              planet: Planet.JUPITER,
              roles: ['YOGAKARAKA'],
              evidence: [
                {
                  ruleId: 'EV_FUNC_JUP',
                  source: 'FUNCTIONAL_ROLE',
                  statement: 'Jupiter is Yogakaraka for Aries',
                  effect: 'SUPPORT',
                  houses: [9],
                  planets: [Planet.JUPITER],
                  role: 'YOGAKARAKA'
                }
              ]
            }
          } as any
        },
        yogas: {
          yogas: [
            {
              type: 'Dhana Yoga',
              planets: [Planet.JUPITER, Planet.MERCURY],
              houses: [9],
              strength: 'STRONG',
              assessment: { finalStatus: 'STRONG' }
            } as any
          ]
        },
        divisionalInterpretation: {
          d9: {
            ascendant: { sign: Sign.ARIES, eclipticLongitude: 0 },
            houseLords: {} as any,
            planets: {} as any,
            houses: {} as any,
            evidence: [
              {
                ruleId: 'EV_D9_H9',
                source: 'D9_INTERPRETATION',
                statement: 'D9 9th house auspicious placement',
                effect: 'SUPPORT',
                house: 9,
                planets: [Planet.JUPITER],
                varga: 'D9'
              }
            ],
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
        } as any,
        dashaInterpretation: {
          system: 'VIMSHOTTARI' as any,
          birthAnchor: {} as any,
          confidence: 'HIGH',
          mahadashas: [
            {
              planet: Planet.JUPITER,
              start: '2020-01-01',
              end: '2036-01-01',
              natal: { house: 9 } as any,
              evidence: [
                {
                  ruleId: 'EV_DASHA_JUP_9',
                  source: 'DASHA_INTERPRETATION',
                  statement: 'Jupiter Mahadasha activates 9th house dharma',
                  effect: 'SUPPORT',
                  house: 9,
                  planets: [Planet.JUPITER],
                  level: 'MAHADASHA'
                }
              ]
            } as any
          ]
        } as any
      });

      const report = synthesizeChart(input);
      const dharmaTheme = report.themes.find((t) => t.theme === LifeTheme.DHARMA_BELIEFS)!;

      const funcEv = dharmaTheme.evidence.find((e) => e.ruleId === 'EV_FUNC_JUP');
      expect(funcEv?.family).toBe('STRUCTURAL');

      const yogaEv = dharmaTheme.evidence.find((e) => e.ruleId === 'YOGA_Dhana Yoga');
      expect(yogaEv?.family).toBe('YOGA');

      const d9Ev = dharmaTheme.evidence.find((e) => e.ruleId === 'EV_D9_H9');
      expect(d9Ev?.varga).toBe('D9');
      expect(d9Ev?.family).toBe('DIVISIONAL');

      const dashaEv = dharmaTheme.evidence.find((e) => e.ruleId === 'EV_DASHA_JUP_9');
      expect(dashaEv?.dashaLevel).toBe('MAHADASHA');
      expect(dashaEv?.family).toBe('DASHA');
    });
  });

  describe('Relevant Collectors', () => {
    it('should collect relevant planets, houses, vargas, and dasha levels in deterministic order', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.VENUS, Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_MIX',
                  source: 'HOUSE_INTERPRETATION',
                  statement: 'Venus and Sun in 10th house',
                  effect: 'SUPPORT',
                  relatedHouses: [2],
                  planets: [Planet.VENUS, Planet.SUN]
                }
              ]
            } as any
          ]
        },
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
                {
                  ruleId: 'EV_DASHA_SUN',
                  source: 'DASHA_INTERPRETATION',
                  statement: 'Sun Mahadasha active',
                  effect: 'SUPPORT',
                  houses: [10],
                  planets: [Planet.SUN],
                  level: 'MAHADASHA'
                }
              ]
            } as any
          ]
        } as any
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;

      expect(careerTheme.relevantPlanets).toEqual([Planet.SUN, Planet.VENUS]); // Deterministic Planet order
      expect(careerTheme.relevantHouses).toEqual([2, 10]); // Ascending numeric order
      expect(careerTheme.relevantVargas).toEqual([]); // Non-divisional evidence keeps varga undefined
      expect(careerTheme.relevantDashaLevels).toEqual(['MAHADASHA']);
    });

    it('should not label ordinary natal evidence as D1 unless explicitly marked', () => {
      const input = createDummySynthesisInput(undefined, {
        houseInterpretation: {
          houses: [
            {
              house: 10,
              sign: Sign.CAPRICORN,
              occupants: [Planet.SUN],
              aspects: [],
              lord: Planet.SATURN,
              lordPlacement: { house: 10, sign: Sign.CAPRICORN },
              evidence: [
                {
                  ruleId: 'EV_H10_STRUCT',
                  source: 'HOUSE_INTERPRETATION',
                  statement: '10th house well fortified',
                  effect: 'SUPPORT',
                  house: 10,
                  planets: [Planet.SUN]
                }
              ]
            } as any
          ]
        },
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
            evidence: [
              {
                ruleId: 'EV_D10_CAREER',
                source: 'D10_INTERPRETATION',
                statement: 'D10 10th house exalted lord',
                effect: 'SUPPORT',
                house: 10,
                planets: [Planet.SATURN],
                varga: 'D10'
              }
            ],
            yogasAvailability: 'NOT_CALCULATED'
          } as any,
          d1Comparisons: {} as any
        } as any
      });

      const report = synthesizeChart(input);
      const careerTheme = report.themes.find((t) => t.theme === LifeTheme.CAREER_STATUS)!;
      expect(careerTheme.relevantVargas).toEqual(['D10']);
    });
  });

  describe('Immutability and Determinism', () => {
    it('should freeze report and all nested objects and arrays', () => {
      const input = createDummySynthesisInput();
      const report = synthesizeChart(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.themes)).toBe(true);
      expect(Object.isFrozen(report.strongestThemes)).toBe(true);
      expect(Object.isFrozen(report.keyObservations)).toBe(true);

      const theme = report.themes[0];
      expect(Object.isFrozen(theme)).toBe(true);
      expect(Object.isFrozen(theme.supportingFactors)).toBe(true);
      expect(Object.isFrozen(theme.relevantPlanets)).toBe(true);
    });

    it('should produce identical reports when run twice on identical input', () => {
      const input = createDummySynthesisInput();
      const report1 = synthesizeChart(input);
      const report2 = synthesizeChart(input);

      expect(JSON.stringify(report1)).toEqual(JSON.stringify(report2));
    });

    it('should satisfy property restrictions (no score, rank, probability, prediction, event, timing)', () => {
      const input = createDummySynthesisInput();
      const report = synthesizeChart(input);

      for (const theme of report.themes) {
        expect(theme).not.toHaveProperty('score');
        expect(theme).not.toHaveProperty('rank');
        expect(theme).not.toHaveProperty('probability');
        expect(theme).not.toHaveProperty('prediction');
        expect(theme).not.toHaveProperty('event');
        expect(theme).not.toHaveProperty('timing');
      }
    });
  });

  describe('Cross-Theme Observations', () => {
    it('should create cross-theme observation without claiming independence when single shared rule spans themes', () => {
      const input = createDummySynthesisInput(undefined, {
        planetInterpretation: {
          planets: {
            [Planet.JUPITER]: {
              planet: Planet.JUPITER,
              placement: { house: 10, sign: Sign.SAGITTARIUS },
              dignity: 'OWN_SIGN',
              strength: 'STRONG',
              evidence: [
                {
                  ruleId: 'EV_JUP_SHARED',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Jupiter in 10th house supports career and dharma',
                  effect: 'SUPPORT',
                  houses: [10, 9],
                  planets: [Planet.JUPITER]
                }
              ]
            }
          } as any
        }
      });

      const report = synthesizeChart(input);
      const crossPlanetObs = report.keyObservations.find(
        (o) => o.type === 'CROSS_THEME_SUPPORT' && o.id.includes('JUPITER')
      );

      expect(crossPlanetObs).toBeDefined();
      expect(crossPlanetObs?.relatedThemes.length).toBeGreaterThanOrEqual(2);
      expect(crossPlanetObs?.summary).toContain('JUPITER contributes supporting evidence to multiple life themes');
      expect(crossPlanetObs?.summary).not.toContain('independent factors');
    });

    it('should create independent cross-theme observation when distinct rules support different themes', () => {
      const input = createDummySynthesisInput(undefined, {
        planetInterpretation: {
          planets: {
            [Planet.JUPITER]: {
              planet: Planet.JUPITER,
              placement: { house: 10, sign: Sign.SAGITTARIUS },
              dignity: 'OWN_SIGN',
              strength: 'STRONG',
              evidence: [
                {
                  ruleId: 'EV_JUP_CAREER',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Jupiter in 10th house supports career',
                  effect: 'SUPPORT',
                  houses: [10],
                  planets: [Planet.JUPITER]
                },
                {
                  ruleId: 'EV_JUP_DHARMA',
                  source: 'PLANET_INTERPRETATION',
                  statement: 'Jupiter in own sign supports dharma',
                  effect: 'SUPPORT',
                  houses: [9],
                  planets: [Planet.JUPITER]
                }
              ]
            }
          } as any
        }
      });

      const report = synthesizeChart(input);
      const crossPlanetObs = report.keyObservations.find(
        (o) => o.type === 'CROSS_THEME_SUPPORT' && o.id.includes('JUPITER')
      );

      expect(crossPlanetObs).toBeDefined();
      expect(crossPlanetObs?.relatedThemes.length).toBeGreaterThanOrEqual(2);
      expect(crossPlanetObs?.summary).toContain('JUPITER acts as a supporting planet across multiple independent factors');
    });
  });

  describe('Overall Confidence Policy', () => {
    it('should return HIGH when all meaningful themes are HIGH confidence', () => {
      const lifeThemes: LifeThemeReport = {
        themes: CHART_SYNTHESIS_THEME_ORDER.map((themeKey) => ({
          theme: themeKey,
          label: themeKey,
          confidence: 'HIGH',
          evidence: [
            {
              ruleId: 'RULE_1',
              source: 'HOUSE_INTERPRETATION',
              statement: 'Test support 1',
              effect: 'SUPPORT',
              theme: themeKey,
              planets: [Planet.SUN]
            },
            {
              ruleId: 'RULE_2',
              source: 'YOGA',
              statement: 'Test support 2',
              effect: 'SUPPORT',
              theme: themeKey,
              planets: [Planet.SUN]
            }
          ]
        }))
      } as any;

      const report = synthesizeChart({ lifeThemes });
      expect(report.overallConfidence).toBe('HIGH');
    });

    it('should return MEDIUM for mixed HIGH and MEDIUM confidence meaningful themes', () => {
      const lifeThemes: LifeThemeReport = {
        themes: CHART_SYNTHESIS_THEME_ORDER.map((themeKey, idx) => ({
          theme: themeKey,
          label: themeKey,
          confidence: idx % 2 === 0 ? 'HIGH' : 'MEDIUM',
          evidence: [
            {
              ruleId: `RULE_${idx}`,
              source: 'HOUSE_INTERPRETATION',
              statement: 'Test support',
              effect: 'SUPPORT',
              theme: themeKey,
              planets: [Planet.SUN]
            }
          ]
        }))
      } as any;

      const report = synthesizeChart({ lifeThemes });
      expect(report.overallConfidence).toBe('MEDIUM');
    });

    it('should return LOW when majority of meaningful themes are LOW confidence', () => {
      const lifeThemes: LifeThemeReport = {
        themes: CHART_SYNTHESIS_THEME_ORDER.map((themeKey, idx) => ({
          theme: themeKey,
          label: themeKey,
          confidence: idx < 7 ? 'LOW' : 'HIGH',
          evidence: [
            {
              ruleId: `RULE_${idx}`,
              source: 'HOUSE_INTERPRETATION',
              statement: 'Test support',
              effect: 'SUPPORT',
              theme: themeKey,
              planets: [Planet.SUN]
            }
          ]
        }))
      } as any;

      const report = synthesizeChart({ lifeThemes });
      expect(report.overallConfidence).toBe('LOW');
    });

    it('should return LOW when there are no meaningful themes (all INSUFFICIENT_EVIDENCE)', () => {
      const lifeThemes: LifeThemeReport = {
        themes: CHART_SYNTHESIS_THEME_ORDER.map((themeKey) => ({
          theme: themeKey,
          label: themeKey,
          confidence: 'LOW',
          evidence: []
        }))
      } as any;

      const report = synthesizeChart({ lifeThemes });
      expect(report.overallConfidence).toBe('LOW');
    });
  });

  describe('Canonical Horoscope Integration Test', () => {
    it('should generate valid chartSynthesis report in canonical horoscope', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      expect(horoscope.chartSynthesis).toBeDefined();
      const synthesis = horoscope.chartSynthesis;

      expect(synthesis.themes.length).toBe(12);
      expect(synthesis.overallConfidence).toBeDefined();
      expect(synthesis.overallConclusion).toBeDefined();

      const career = synthesis.themes.find((t: any) => t.theme === LifeTheme.CAREER_STATUS);
      const wealth = synthesis.themes.find((t: any) => t.theme === LifeTheme.WEALTH_FINANCE);
      const partnership = synthesis.themes.find((t: any) => t.theme === LifeTheme.PARTNERSHIP);

      expect(career).toBeDefined();
      expect(wealth).toBeDefined();
      expect(partnership).toBeDefined();

      // Check that evidence from divisional/yoga/dasha is preserved if present
      const allEvidence = synthesis.themes.flatMap((t: any) => t.evidence);
      expect(allEvidence.length).toBeGreaterThan(0);
      const familiesPresent = new Set(allEvidence.map((e: any) => e.family));
      expect(familiesPresent.size).toBeGreaterThan(0);
    });
  });
});
