import { describe, it, expect } from 'vitest';
import type { DashaPlanetActivation, HoroscopeDashaInterpretation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import {
  buildCareerDashaSynthesis,
  getCareerHousePortfolio,
  classifyCareerHouseOwnership,
  scoreCareerDashaPlanet,
  type D10CareerContext
} from './index';

describe('Career Dasha Synthesis', () => {
  const mockD10Context: D10CareerContext = {
    relationship: 'CONFIRMS',
    statement: 'D10 Dasamsa confirms strong career growth potential.'
  };

  const createMockActivation = (
    planet: 'SUN' | 'MOON' | 'MARS' | 'MERCURY' | 'JUPITER' | 'VENUS' | 'SATURN' | 'RAHU' | 'KETU',
    ownedHouses: number[],
    functionalRole: FunctionalRole = FunctionalRole.YOGAKARAKA
  ): DashaPlanetActivation => ({
    planet,
    house: 10,
    sign: 'CAPRICORN' as any,
    ownedHouses,
    functionalRoles: [functionalRole],
    functionalNature: FunctionalNature.BENEFIC,
    strength: {
      score: 75,
      level: 'STRONG',
      rawShadbala: 1.3
    } as any,
    dignity: 'EXALTED',
    castAspects: [],
    receivedAspects: [],
    yogaParticipation: [],
    houseEvidence: [],
    evidence: []
  });

  it('correctly provides the canonical career house portfolio', () => {
    const portfolio = getCareerHousePortfolio();
    expect(portfolio.primary).toEqual([10]);
    expect(portfolio.supporting).toEqual([6, 2, 11]);
    expect(portfolio.secondary).toEqual([]);
  });

  it('classifies house ownership accurately', () => {
    const portfolio = getCareerHousePortfolio();
    expect(classifyCareerHouseOwnership(10, portfolio)).toEqual({ direction: 'SUPPORT', weight: 3.0 });
    expect(classifyCareerHouseOwnership(6, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(2, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(11, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(8, portfolio)).toEqual({ direction: 'CHALLENGE', weight: 1.5 });
    expect(classifyCareerHouseOwnership(12, portfolio)).toEqual({ direction: 'CHALLENGE', weight: 1.5 });
    expect(classifyCareerHouseOwnership(3, portfolio)).toEqual({ direction: 'NEUTRAL', weight: 0 });
  });

  it('scores a supportive planet synthesis correctly', () => {
    const saturnActivation = createMockActivation('SATURN', [10, 11], FunctionalRole.YOGAKARAKA);
    const synthesis = scoreCareerDashaPlanet('MD', saturnActivation, mockD10Context);

    expect(synthesis.planet).toBe('SATURN');
    expect(synthesis.period).toBe('MD');
    expect(synthesis.effect).toBe('STRONGLY_SUPPORTS');
    expect(synthesis.supportScore).toBeGreaterThan(0);
    expect(synthesis.challengeScore).toBe(0);
    expect(synthesis.netScore).toBeGreaterThan(0);
    expect(synthesis.factors.length).toBeGreaterThan(0);

    const factorIds = synthesis.factors.map((f) => f.id);
    expect(factorIds).toContain('CAREER_DASHA_MD_SATURN_FUNCTIONAL_ROLE_YOGAKARAKA');
    expect(factorIds).toContain('CAREER_DASHA_MD_SATURN_DIGNITY_EXALTED');
  });

  it('scores a challenging planet synthesis correctly', () => {
    const rahuActivation: DashaPlanetActivation = {
      planet: 'RAHU',
      house: 8,
      sign: 'SCORPIO' as any,
      ownedHouses: [8, 12],
      functionalRoles: [FunctionalRole.MARAKA],
      functionalNature: FunctionalNature.MALEFIC,
      strength: {
        score: 30,
        level: 'WEAK',
        rawShadbala: 0.7
      } as any,
      dignity: 'DEBILITATED',
      castAspects: [],
      receivedAspects: [],
      yogaParticipation: [],
      houseEvidence: [],
      evidence: []
    };

    const synthesis = scoreCareerDashaPlanet('AD', rahuActivation, {
      relationship: 'CONFLICTS',
      statement: 'D10 conflicts'
    });

    expect(synthesis.planet).toBe('RAHU');
    expect(synthesis.period).toBe('AD');
    expect(synthesis.effect).toBe('STRONGLY_CHALLENGES');
    expect(synthesis.challengeScore).toBeGreaterThan(0);
  });

  it('builds a complete CareerDashaSynthesis hierarchy with MD, AD, and PD', () => {
    const mockDashaInterpretation: HoroscopeDashaInterpretation = {
      current: {
        at: '2026-08-23T12:00:00.000Z',
        status: 'AVAILABLE',
        mahadasha: createMockActivation('SATURN', [10, 11], FunctionalRole.YOGAKARAKA),
        antardasha: createMockActivation('MERCURY', [2, 5], FunctionalRole.TRIKONA_LORD),
        pratyantardasha: createMockActivation('SUN', [6], FunctionalRole.NEUTRAL),
        evidence: [],
        confidence: 'HIGH'
      }
    };

    const synthesis = buildCareerDashaSynthesis({
      dashaInterpretation: mockDashaInterpretation,
      d10Context: mockD10Context
    });

    expect(synthesis.asOf).toBe('2026-08-23T12:00:00.000Z');
    expect(synthesis.combined.hierarchy.mdRole).toBe('PRIMARY');
    expect(synthesis.combined.hierarchy.adRole).toBe('MODIFIER');
    expect(synthesis.combined.hierarchy.pdRole).toBe('REFINEMENT');

    expect(synthesis.md.planet).toBe('SATURN');
    expect(synthesis.ad.planet).toBe('MERCURY');
    expect(synthesis.pd.planet).toBe('SUN');

    expect(synthesis.combined.combinedEffect).toBe('STRONGLY_SUPPORTS');
    expect(synthesis.combined.combinedConfidence).toBe('HIGH');
    expect(synthesis.combined.summary).toContain('SATURN');
    expect(synthesis.factors.length).toBe(
      synthesis.md.factors.length + synthesis.ad.factors.length + synthesis.pd.factors.length
    );
  });

  it('handles missing or insufficient dasha data gracefully', () => {
    const synthesis = buildCareerDashaSynthesis({
      dashaInterpretation: undefined,
      d10Context: undefined
    });

    expect(synthesis.combined.combinedEffect).toBe('INSUFFICIENT_DATA');
    expect(synthesis.combined.combinedConfidence).toBe('LOW');
    expect(synthesis.factors).toEqual([]);
    expect(synthesis.md.effect).toBe('INSUFFICIENT_DATA');
  });

  it('produces deeply frozen objects ensuring immutability', () => {
    const mockDashaInterpretation: HoroscopeDashaInterpretation = {
      current: {
        at: '2026-08-23T12:00:00.000Z',
        status: 'AVAILABLE',
        mahadasha: createMockActivation('SATURN', [10]),
        antardasha: createMockActivation('VENUS', [2]),
        pratyantardasha: createMockActivation('JUPITER', [11]),
        evidence: [],
        confidence: 'HIGH'
      }
    };

    const synthesis = buildCareerDashaSynthesis({
      dashaInterpretation: mockDashaInterpretation,
      d10Context: mockD10Context
    });

    expect(Object.isFrozen(synthesis)).toBe(true);
    expect(Object.isFrozen(synthesis.factors)).toBe(true);
    expect(Object.isFrozen(synthesis.md)).toBe(true);
    expect(Object.isFrozen(synthesis.combined)).toBe(true);
  });
});
