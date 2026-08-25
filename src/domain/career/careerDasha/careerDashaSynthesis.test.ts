import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
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
    planet: Planet,
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
    expect(classifyCareerHouseOwnership(10, portfolio)).toEqual({ direction: 'SUPPORT', weight: 2.5 });
    expect(classifyCareerHouseOwnership(6, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(2, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(11, portfolio)).toEqual({ direction: 'SUPPORT', weight: 1.5 });
    expect(classifyCareerHouseOwnership(8, portfolio)).toEqual({ direction: 'CHALLENGE', weight: 0.75 });
    expect(classifyCareerHouseOwnership(12, portfolio)).toEqual({ direction: 'CHALLENGE', weight: 0.75 });
    expect(classifyCareerHouseOwnership(3, portfolio)).toEqual({ direction: 'NEUTRAL', weight: 0 });
  });

  it('scores a supportive planet synthesis correctly', () => {
    const saturnActivation = createMockActivation(Planet.SATURN, [10, 11], FunctionalRole.YOGAKARAKA);
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
    expect(synthesis.factors[0].period).toBe('MD');
    expect(synthesis.factors[0].planet).toBe('SATURN');
  });

  it('scores a challenging planet synthesis correctly', () => {
    const rahuActivation: DashaPlanetActivation = {
      planet: Planet.RAHU,
      house: 8,
      sign: 'SCORPIO' as any,
      ownedHouses: [8, 12],
      functionalRoles: [FunctionalRole.MARAKA_LORD],
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
    const mockDashaInterpretation: any = {
      current: {
        at: '2026-08-23T12:00:00.000Z',
        status: 'AVAILABLE',
        mahadasha: createMockActivation(Planet.SATURN, [10, 11], FunctionalRole.YOGAKARAKA),
        antardasha: createMockActivation(Planet.MERCURY, [2, 5], FunctionalRole.TRIKONA_LORD),
        pratyantardasha: createMockActivation(Planet.SUN, [6], FunctionalRole.THIRD_LORD),
        evidence: [],
        confidence: 'HIGH'
      }
    };

    const synthesis = buildCareerDashaSynthesis({
      dashaInterpretation: mockDashaInterpretation,
      d10Context: mockD10Context
    });

    expect(synthesis.asOf).toBe('2026-08-23T12:00:00.000Z');
    expect(synthesis.reasoningVersion).toBe('CW-02');
    expect(synthesis.timing.md.period).toBe('MD');
    expect(synthesis.timing.md.planet).toBe('SATURN');
    expect(synthesis.timing.ad.period).toBe('AD');
    expect(synthesis.timing.ad.planet).toBe('MERCURY');
    expect(synthesis.timing.pd.period).toBe('PD');
    expect(synthesis.timing.pd.planet).toBe('SUN');

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
    const mockDashaInterpretation: any = {
      current: {
        at: '2026-08-23T12:00:00.000Z',
        status: 'AVAILABLE',
        mahadasha: createMockActivation(Planet.SATURN, [10]),
        antardasha: createMockActivation(Planet.VENUS, [2]),
        pratyantardasha: createMockActivation(Planet.JUPITER, [11]),
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

  it('Issue 8: gates combined effect to MIXED when MD does not activate career', () => {
    const unlinkedActivation: DashaPlanetActivation = {
      planet: Planet.MOON,
      house: 4,
      sign: 'CANCER' as any,
      ownedHouses: [4],
      functionalRoles: [],
      functionalNature: FunctionalNature.NEUTRAL,
      strength: undefined,
      dignity: undefined,
      castAspects: [],
      receivedAspects: [],
      yogaParticipation: [],
      houseEvidence: [],
      evidence: []
    };

    const supportiveActivation = createMockActivation(Planet.SATURN, [10, 11], FunctionalRole.YOGAKARAKA);

    const mockDashaInterpretation: any = {
      current: {
        at: '2026-08-23T12:00:00.000Z',
        status: 'AVAILABLE',
        mahadasha: { natal: unlinkedActivation, start: '2020-01-01', end: '2030-01-01' },
        antardasha: { natal: supportiveActivation, start: '2025-01-01', end: '2026-06-01' },
        pratyantardasha: { natal: supportiveActivation, start: '2026-01-01', end: '2026-03-01' },
        evidence: [],
        confidence: 'HIGH'
      }
    };

    const synthesis = buildCareerDashaSynthesis({
      dashaInterpretation: mockDashaInterpretation,
      d10Context: mockD10Context
    });

    expect(synthesis.md.effect).toBe('DOES_NOT_ACTIVATE');
    expect(synthesis.ad.effect).toBe('STRONGLY_SUPPORTS');
    expect(synthesis.combined.combinedEffect).toBe('MIXED');
    expect(synthesis.combined.summary).toContain('does not establish a primary Career theme');
    expect(synthesis.md.start).toBe('2020-01-01');
    expect(synthesis.md.end).toBe('2030-01-01');
    expect(synthesis.ad.start).toBe('2025-01-01');
    expect(synthesis.ad.end).toBe('2026-06-01');
  });

  it('Issue 4 & 6: ignores unlinked yogas and karakas for unlinked planets', () => {
    const unlinkedPlanetActivation: DashaPlanetActivation = {
      planet: Planet.VENUS,
      house: 5,
      sign: 'TAURUS' as any,
      ownedHouses: [5, 12],
      functionalRoles: [FunctionalRole.TRIKONA_LORD],
      functionalNature: FunctionalNature.BENEFIC,
      strength: undefined,
      dignity: 'OWN_SIGN',
      castAspects: [],
      receivedAspects: [],
      yogaParticipation: [
        {
          yogaType: 'MALAVYA_YOGA' as any,
          participatingPlanets: [Planet.VENUS],
          participatingHouses: [5],
          description: 'Malavya Mahapurusha Yoga in house 5'
        } as any
      ],
      houseEvidence: [],
      evidence: []
    };

    const synthesis = scoreCareerDashaPlanet('MD', unlinkedPlanetActivation);
    // Venus has house 5, 12. Neither is career primary/supporting (10, 6, 2, 11).
    // Yoga on house 5 is not career linked.
    // Venus as creative karaka is not linked to career house.
    const yogaFactor = synthesis.factors.find((f) => f.category === 'YOGA');
    expect(yogaFactor).toBeUndefined();

    const karakaFactor = synthesis.factors.find((f) => f.category === 'KARAKA');
    expect(karakaFactor).toBeUndefined();
  });

  it('handles MODIFIES relationship in D10 career context as NEUTRAL with no directional D10 factor', () => {
    const activation = createMockActivation(Planet.SATURN, [10]);
    const synthesis = scoreCareerDashaPlanet('MD', activation, {
      relationship: 'MODIFIES',
      statement: 'D10 modifies trajectory'
    });

    expect(synthesis.d10Effect).toBe('NEUTRAL');
    const d10Factor = synthesis.factors.find((f) => f.category === 'D10');
    expect(d10Factor).toBeUndefined();
  });

  it('handles CONFLICTS relationship in D10 career context yielding CHALLENGES and a CHALLENGE D10 factor', () => {
    const activation = createMockActivation(Planet.SATURN, [10]);
    const synthesis = scoreCareerDashaPlanet('MD', activation, {
      relationship: 'CONFLICTS',
      statement: 'D10 conflicts trajectory'
    });

    expect(synthesis.d10Effect).toBe('CHALLENGES');
    const d10Factor = synthesis.factors.find((f) => f.category === 'D10');
    expect(d10Factor?.weight).toBe(1.5);
    expect(d10Factor?.direction).toBe('CHALLENGE');
  });
});
