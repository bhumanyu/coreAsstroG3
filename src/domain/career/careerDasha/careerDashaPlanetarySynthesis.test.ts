import { describe, it, expect } from 'vitest';
import { Planet, Sign } from '../../../types';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import { CAREER_HOUSE_PORTFOLIO } from '../careerTypes';
import { synthesizeCareerDashaPlanetary } from './careerDashaPlanetarySynthesis';
import { buildCareerDashaD10PlanetContext } from './careerDashaD10Context';
import { effectScore } from './careerDashaPlanetaryScoring';

function createActivation(
  overrides?: Partial<DashaPlanetActivation>
): DashaPlanetActivation {
  return {
    planet: Planet.SATURN,
    house: 1,
    sign: Sign.ARIES,
    ownedHouses: [],
    functionalRoles: [],
    functionalNature: FunctionalNature.NEUTRAL,
    dignity: 'NEUTRAL',
    state: 'DIRECT' as any,
    strength: {
      availability: 'AVAILABLE',
      meetsMinimum: true,
      percentageOfMinimum: 100
    } as any,
    castAspects: [],
    receivedAspects: [],
    yogaParticipation: [],
    houseEvidence: [],
    evidence: [],
    ...overrides
  };
}

describe('CW-09: Career Dasha Planetary Synthesis', () => {
  it('1. activates career when dasha planet owns H10', () => {
    const activation = createActivation({
      planet: Planet.SATURN,
      house: 1,
      ownedHouses: [10, 11]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.activatedCareerHouses).toContain(10);
    expect(synthesis.activatedCareerHouses).toContain(11);
    expect(synthesis.supportScore).toBeGreaterThan(0);
    expect(synthesis.effect).toBe('STRONGLY_SUPPORTS');
  });

  it('2. recognizes supporting career houses (H6/H11)', () => {
    const activation = createActivation({
      planet: Planet.MERCURY,
      house: 6,
      ownedHouses: [2, 11]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'AD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.activatedCareerHouses).toEqual([2, 6, 11]);
    expect(synthesis.supportingEvidenceIds.length).toBeGreaterThan(0);
    expect(synthesis.effect).toBe('STRONGLY_SUPPORTS');
  });

  it('3. records challenging career-house ownership (H8/H12)', () => {
    const activation = createActivation({
      planet: Planet.MARS,
      house: 8,
      ownedHouses: [8, 12],
      strength: {
        availability: 'AVAILABLE',
        meetsMinimum: false,
        percentageOfMinimum: 60
      } as any
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    // Unlinked because 8 and 12 are challenging houses, not primary/supporting
    expect(synthesis.careerLinked).toBe(false);
    expect(synthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.challengeScore).toBeGreaterThan(0);
  });

  it('4. does not allow D10 confirmation alone to create career activation', () => {
    const activation = createActivation({
      planet: Planet.JUPITER,
      house: 3,
      ownedHouses: [3, 9],
      strength: undefined
    });

    const d10Context = {
      planet: Planet.JUPITER,
      available: true,
      house: 10,
      isD10TenthLord: true,
      relationship: 'CONFIRMS' as const
    };

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO,
      d10: d10Context
    });

    expect(synthesis.careerLinked).toBe(false);
    expect(synthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.d10Effect).toBe('SUPPORTS');
  });

  it('5. uses D10 confirmation after natal career linkage exists', () => {
    const activation = createActivation({
      planet: Planet.SUN,
      house: 10,
      ownedHouses: [5]
    });

    const d10Context = {
      planet: Planet.SUN,
      available: true,
      house: 10,
      isD10TenthHouse: true,
      relationship: 'CONFIRMS' as const
    };

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO,
      d10: d10Context
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.d10Effect).toBe('SUPPORTS');
    expect(synthesis.factors.some((f) => f.source === 'D10_PLANET')).toBe(true);
    expect(synthesis.supportScore).toBeGreaterThan(3);
  });

  it('6. records D10 planetary conflict without deleting natal promise', () => {
    const activation = createActivation({
      planet: Planet.VENUS,
      house: 10,
      ownedHouses: [2, 7]
    });

    const d10Context = {
      planet: Planet.VENUS,
      available: true,
      house: 6,
      dignity: 'DEBILITATED',
      relationship: 'CONFLICTS' as const
    };

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO,
      d10: d10Context
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.d10Effect).toBe('CHALLENGES');
    expect(synthesis.challengeScore).toBeGreaterThan(0);
    expect(synthesis.supportScore).toBeGreaterThan(0);
  });

  it('7. returns DOES_NOT_ACTIVATE for a genuinely unlinked planet', () => {
    const activation = createActivation({
      planet: Planet.KETU,
      house: 3,
      ownedHouses: [3, 9],
      functionalRoles: []
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'PD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(false);
    expect(synthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.confidence).toBe('LOW');
  });

  it('8. returns INSUFFICIENT_DATA when factors.length === 0 for a career-linked planet', () => {
    const activation = createActivation({
      planet: Planet.RAHU,
      house: 4,
      ownedHouses: [],
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL,
      dignity: undefined,
      state: undefined,
      strength: undefined,
      receivedAspects: [
        { targetHouse: 10, aspectingPlanet: Planet.SATURN, aspectType: 'MUTUAL', weight: 0.1 } as any
      ]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'PD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.factors.length).toBe(0);
    expect(synthesis.effect).toBe('INSUFFICIENT_DATA');
  });

  it('9. generates deterministic evidence IDs', () => {
    const activation = createActivation({
      planet: Planet.SATURN,
      house: 10,
      ownedHouses: [10, 11]
    });

    const synthesis1 = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    const synthesis2 = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis1.factors.map((f) => f.id)).toEqual(
      synthesis2.factors.map((f) => f.id)
    );
    expect(synthesis1.factors[0].id).toMatch(/^CW09_MD_SATURN_/);
  });

  it('10. returns immutable CW-09 synthesis and frozen factors', () => {
    const activation = createActivation({
      planet: Planet.JUPITER,
      house: 10,
      ownedHouses: [9, 12],
      functionalRoles: [FunctionalRole.YOGAKARAKA]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(Object.isFrozen(synthesis)).toBe(true);
    expect(Object.isFrozen(synthesis.factors)).toBe(true);
    expect(Object.isFrozen(synthesis.activatedCareerHouses)).toBe(true);
    expect(Object.isFrozen(synthesis.supportingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(synthesis.challengingEvidenceIds)).toBe(true);
    expect(Object.isFrozen(synthesis.neutralEvidenceIds)).toBe(true);
  });

  it('11. builds D10 context correctly from horoscope', () => {
    const mockHoroscope = {
      divisionalInterpretation: {
        d10: {
          planets: {
            [Planet.SUN]: {
              house: 10,
              sign: Sign.ARIES,
              dignity: 'EXALTED'
            }
          },
          houses: [
            { house: 10, lord: Planet.SUN }
          ]
        },
        d1Comparisons: {
          [Planet.SUN]: {
            isD10Vargottama: true
          }
        }
      }
    };

    const d10Context = buildCareerDashaD10PlanetContext(
      mockHoroscope,
      Planet.SUN
    );

    expect(d10Context.available).toBe(true);
    expect(d10Context.isD10TenthHouse).toBe(true);
    expect(d10Context.isD10TenthLord).toBe(true);
    expect(d10Context.isVargottama).toBe(true);
    expect(d10Context.relationship).toBe('CONFIRMS');
  });

  it('12. calculates effect score correctly', () => {
    expect(effectScore('STRONGLY_SUPPORTS')).toBe(2);
    expect(effectScore('SUPPORTS')).toBe(1);
    expect(effectScore('MIXED')).toBe(0);
    expect(effectScore('CHALLENGES')).toBe(-1);
    expect(effectScore('STRONGLY_CHALLENGES')).toBe(-2);
    expect(effectScore('DOES_NOT_ACTIVATE')).toBe(0);
    expect(effectScore('INSUFFICIENT_DATA')).toBe(0);
  });

  it('13. Yogakaraka role alone does not establish career linkage and leaks zero score weight', () => {
    const activation = createActivation({
      planet: Planet.VENUS,
      house: 5,
      ownedHouses: [4, 9], // Not in primary (10) or supporting (2, 6, 7, 11)
      functionalRoles: [FunctionalRole.YOGAKARAKA],
      functionalNature: FunctionalNature.BENEFIC,
      strength: undefined
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(false);
    expect(synthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.confidence).toBe('LOW');
    expect(synthesis.supportScore).toBe(0);
    expect(synthesis.challengeScore).toBe(0);
    expect(synthesis.netScore).toBe(0);
    expect(synthesis.factors.some((f) => f.source === 'FUNCTIONAL_ROLE')).toBe(false);
  });

  it('14. neutral evidence does not inflate confidence to MEDIUM', () => {
    const activation = createActivation({
      planet: Planet.MERCURY,
      house: 10,
      ownedHouses: [10],
      // Only 2 directional factors (house 10 placement + house 10 ownership)
      // plus neutral factors
      receivedAspects: [
        { aspectingPlanet: Planet.JUPITER, aspectType: 'MUTUAL', weight: 0.1 } as any,
        { aspectingPlanet: Planet.VENUS, aspectType: 'MUTUAL', weight: 0.1 } as any,
        { aspectingPlanet: Planet.SATURN, aspectType: 'MUTUAL', weight: 0.1 } as any
      ]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'AD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    // Total factors might be 5+ including neutral aspects, but directional factor count is < 5
    expect(synthesis.confidence).toBe('LOW');
  });

  it('15. D10 confirmation strictly requires isD10Vargottama and ignores generic isVargottama', () => {
    const mockHoroscopeGenericOnly = {
      divisionalInterpretation: {
        d10: {
          planets: {
            [Planet.MARS]: {
              house: 3,
              sign: Sign.GEMINI,
              dignity: 'NEUTRAL'
            }
          }
        },
        d1Comparisons: {
          [Planet.MARS]: {
            isVargottama: true // Generic flag, NOT isD10Vargottama
          } as any
        }
      }
    };

    const d10Context = buildCareerDashaD10PlanetContext(
      mockHoroscopeGenericOnly,
      Planet.MARS
    );

    expect(d10Context.isVargottama).toBe(false);
    expect(d10Context.relationship).toBe('MODIFIES');
  });

  it('16. D10 dignity normalizes whitespace and casing for debilitation', () => {
    const mockHoroscopeDebilitated = {
      divisionalInterpretation: {
        d10: {
          planets: {
            [Planet.JUPITER]: {
              house: 10,
              sign: Sign.CAPRICORN,
              dignity: ' debilitated ' // Non-standard whitespace/casing
            }
          }
        }
      }
    };

    const d10Context = buildCareerDashaD10PlanetContext(
      mockHoroscopeDebilitated,
      Planet.JUPITER
    );

    // Tenth house in D10 normally CONFIRMS, but debilitation drops it to PARTIALLY_CONFIRMS
    expect(d10Context.isD10TenthHouse).toBe(true);
    expect(d10Context.relationship).toBe('PARTIALLY_CONFIRMS');
  });

  it('17. returns INSUFFICIENT_DATA when career-linked planet has only zero/neutral scores', () => {
    // A planet linked through received aspect to house 10 with 0 support and 0 challenge
    const activation = createActivation({
      planet: Planet.RAHU,
      house: 4,
      ownedHouses: [],
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL,
      dignity: undefined,
      state: undefined,
      strength: undefined,
      receivedAspects: [
        { targetHouse: 10, aspectingPlanet: Planet.SATURN, aspectType: 'MUTUAL', weight: 0.1 } as any
      ]
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(true);
    expect(synthesis.supportScore).toBe(0);
    expect(synthesis.challengeScore).toBe(0);
    expect(synthesis.effect).toBe('INSUFFICIENT_DATA');
  });

  it('18. functional malefic nature does not leak challenge score into non-linked planet', () => {
    const activation = createActivation({
      planet: Planet.MARS,
      house: 3,
      ownedHouses: [3, 9],
      functionalRoles: [FunctionalRole.MARAKA_LORD],
      functionalNature: FunctionalNature.MALEFIC,
      strength: undefined
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    expect(synthesis.careerLinked).toBe(false);
    expect(synthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.challengeScore).toBe(0);
    expect(synthesis.supportScore).toBe(0);
    expect(synthesis.netScore).toBe(0);
    expect(synthesis.factors.some((f) => f.source === 'FUNCTIONAL_ROLE')).toBe(false);
  });

  it('19. validates monotonic relative ordering across tier activations without freezing constant values', () => {
    // 1. Strong career linkage tier
    const strongActivation = createActivation({
      planet: Planet.SATURN,
      house: 10,
      ownedHouses: [10, 11],
      dignity: 'EXALTED',
      functionalRoles: [FunctionalRole.YOGAKARAKA],
      functionalNature: FunctionalNature.BENEFIC
    });

    // 2. Moderate career linkage tier
    const moderateActivation = createActivation({
      planet: Planet.VENUS,
      house: 5,
      ownedHouses: [11],
      dignity: 'NEUTRAL',
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL
    });

    // 3. Mixed career tier (support from H10, but challenged by debilitation and combustion)
    const mixedActivation = createActivation({
      planet: Planet.SUN,
      house: 8,
      ownedHouses: [10],
      dignity: 'DEBILITATED',
      state: 'COMBUST' as any,
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL
    });

    // 4. Weak / Challenging career tier (occupies supporting house but severely challenged by H8/H12 ownership, debilitation, weak strength, and malefic nature)
    const weakActivation = createActivation({
      planet: Planet.MARS,
      house: 6,
      ownedHouses: [8, 12],
      dignity: 'DEBILITATED',
      state: 'COMBUST' as any,
      strength: {
        availability: 'AVAILABLE',
        meetsMinimum: false,
        percentageOfMinimum: 50
      } as any,
      functionalRoles: [FunctionalRole.DUSTHANA_LORD],
      functionalNature: FunctionalNature.MALEFIC
    });

    // 5. Non-linked tier (no career houses owned, occupied, or aspected)
    const nonLinkedActivation = createActivation({
      planet: Planet.JUPITER,
      house: 3,
      ownedHouses: [3, 9],
      dignity: 'NEUTRAL',
      functionalRoles: [FunctionalRole.YOGAKARAKA],
      functionalNature: FunctionalNature.BENEFIC,
      strength: undefined
    });

    const strongSynthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation: strongActivation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    const moderateSynthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation: moderateActivation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    const mixedSynthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation: mixedActivation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    const weakSynthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation: weakActivation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    const nonLinkedSynthesis = synthesizeCareerDashaPlanetary({
      period: 'MD',
      activation: nonLinkedActivation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

    // Net score monotonic ordering: strong > moderate > mixed > weak
    expect(strongSynthesis.netScore).toBeGreaterThan(moderateSynthesis.netScore);
    expect(moderateSynthesis.netScore).toBeGreaterThan(mixedSynthesis.netScore);
    expect(mixedSynthesis.netScore).toBeGreaterThan(weakSynthesis.netScore);

    // Effect monotonic ordering: strong >= moderate >= mixed >= weak
    expect(effectScore(strongSynthesis.effect)).toBeGreaterThanOrEqual(effectScore(moderateSynthesis.effect));
    expect(effectScore(moderateSynthesis.effect)).toBeGreaterThanOrEqual(effectScore(mixedSynthesis.effect));
    expect(effectScore(mixedSynthesis.effect)).toBeGreaterThanOrEqual(effectScore(weakSynthesis.effect));

    // Specific expected directional effects per tier definition
    expect(strongSynthesis.effect).toBe('STRONGLY_SUPPORTS');
    expect(weakSynthesis.effect).toBe('STRONGLY_CHALLENGES');

    // Non-linked tier validation: linkage gate prevents score leakage and activation
    expect(nonLinkedSynthesis.careerLinked).toBe(false);
    expect(nonLinkedSynthesis.effect).toBe('DOES_NOT_ACTIVATE');
    expect(nonLinkedSynthesis.supportScore).toBe(0);
    expect(nonLinkedSynthesis.challengeScore).toBe(0);
    expect(nonLinkedSynthesis.netScore).toBe(0);
  });
});
