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

  it('8. returns INSUFFICIENT_DATA when factors.length === 0', () => {
    const activation = createActivation({
      planet: Planet.RAHU,
      house: 4,
      ownedHouses: [],
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL,
      dignity: undefined,
      state: undefined,
      strength: undefined
    });

    const synthesis = synthesizeCareerDashaPlanetary({
      period: 'PD',
      activation,
      housePortfolio: CAREER_HOUSE_PORTFOLIO
    });

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
});
