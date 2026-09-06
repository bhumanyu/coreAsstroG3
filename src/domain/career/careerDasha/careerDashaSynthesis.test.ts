import { describe, it, expect } from 'vitest';
import { Planet } from '../../../types';
import type { DashaPlanetActivation } from '../../../engine/dashaInterpretation/dashaInterpretationTypes';
import { FunctionalRole } from '../../../engine/functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../../../engine/functionalNature/functionalNature';
import {
  buildCareerDashaSynthesis,
  classifyCareerHouseOwnership,
  scoreCareerDashaPlanet,
  isCareerRelevantYoga,
  type D10CareerContext
} from './index';
import { getCareerHousePortfolio } from '../careerTypes';

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
      house: 10,
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

  describe('isCareerRelevantYoga fallback hierarchy', () => {
    it('returns true when yoga has no participatingHouses but dasha planet owns H10 (career primary house)', () => {
      const yoga = { yogaType: 'Raja Yoga', finalStatus: 'STRONG' };
      const activation: DashaPlanetActivation = {
        planet: Planet.SATURN,
        house: 5,
        sign: 'CAPRICORN' as any,
        ownedHouses: [10],
        functionalRoles: [FunctionalRole.YOGAKARAKA],
        functionalNature: FunctionalNature.BENEFIC,
        dignity: 'OWN_SIGN',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };
      expect(isCareerRelevantYoga(yoga, activation)).toBe(true);
    });

    it('returns false when yoga has no participatingHouses and dasha planet owns only non-career house', () => {
      const yoga = { yogaType: 'Raja Yoga', finalStatus: 'STRONG' };
      const activation: DashaPlanetActivation = {
        planet: Planet.SATURN,
        house: 5,
        sign: 'CAPRICORN' as any,
        ownedHouses: [4],
        functionalRoles: [],
        functionalNature: FunctionalNature.NEUTRAL,
        dignity: 'NEUTRAL',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };
      expect(isCareerRelevantYoga(yoga, activation)).toBe(false);
    });
  });

  describe('Evidence Partitioning & Relationships (CW-09 Convergence)', () => {
    it('partitions primary, supporting, qualifying, and tertiary evidence accurately', () => {
      const mdAct = createMockActivation(Planet.JUPITER, [10], FunctionalRole.YOGAKARAKA);
      const adAct = createMockActivation(Planet.SATURN, [6], FunctionalRole.TRIKONA_LORD);
      const pdAct = createMockActivation(Planet.MERCURY, [2], FunctionalRole.KENDRA_LORD);

      const mockDashaInterp: any = {
        current: {
          at: '2026-09-01T00:00:00.000Z',
          status: 'AVAILABLE',
          mahadasha: { natal: mdAct, start: '2020-01-01', end: '2036-01-01' },
          antardasha: { natal: adAct, start: '2025-01-01', end: '2027-01-01' },
          pratyantardasha: { natal: pdAct, start: '2026-01-01', end: '2026-06-01' },
          evidence: [],
          confidence: 'HIGH'
        }
      };

      const synthesis = buildCareerDashaSynthesis({
        dashaInterpretation: mockDashaInterp,
        d10Context: mockD10Context
      });

      expect(synthesis.primaryEvidence).toBeDefined();
      expect(synthesis.supportingEvidence).toBeDefined();
      expect(synthesis.tertiaryEvidence).toBeDefined();
      expect(synthesis.qualifyingEvidence).toBeDefined();

      expect(synthesis.primaryEvidence?.length).toBe(mdAct ? synthesis.md.factors.length : 0);
      expect(synthesis.supportingEvidence?.length).toBe(adAct ? synthesis.ad.factors.length : 0);
      expect(synthesis.tertiaryEvidence?.length).toBe(pdAct ? synthesis.pd.factors.length : 0);

      // Verify all primary evidence belongs to MD period
      for (const factor of synthesis.primaryEvidence ?? []) {
        expect(factor.period).toBe('MD');
        expect(factor.planet).toBe('JUPITER');
        expect(factor.ruleId).toBeDefined();
      }

      // Verify all supporting evidence belongs to AD period
      for (const factor of synthesis.supportingEvidence ?? []) {
        expect(factor.period).toBe('AD');
        expect(factor.planet).toBe('SATURN');
      }

      // Verify relationships modeling
      expect(synthesis.relationships).toBeDefined();
      expect(synthesis.relationships?.length).toBe(3);
      expect(synthesis.relationships?.[0].fromPeriod).toBe('MD');
      expect(synthesis.relationships?.[0].toPeriod).toBe('AD');
      expect(synthesis.relationships?.[0].fromPlanet).toBe('JUPITER');
      expect(synthesis.relationships?.[0].toPlanet).toBe('SATURN');
    });

    it('models separation of planetary strength and career relevance (spec §14)', () => {
      // Planet with high strength but ZERO career relevance
      const strongUnlinkedAct: DashaPlanetActivation = {
        planet: Planet.MARS,
        house: 4,
        sign: 'ARIES' as any,
        ownedHouses: [4, 5],
        functionalRoles: [FunctionalRole.TRIKONA_LORD],
        functionalNature: FunctionalNature.BENEFIC,
        strength: {
          score: 95,
          level: 'STRONG',
          rawShadbala: 1.8,
          meetsMinimum: true
        } as any,
        dignity: 'EXALTED',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };

      const unlinkedSynthesis = scoreCareerDashaPlanet('MD', strongUnlinkedAct);
      expect(unlinkedSynthesis.careerLinked).toBe(false);
      expect(unlinkedSynthesis.effect).toBe('DOES_NOT_ACTIVATE');
      expect(unlinkedSynthesis.relevance?.relevanceLevel).toBe('NONE');
      expect(unlinkedSynthesis.impact?.overallImpact).toBe('NEGLIGIBLE');
      expect(unlinkedSynthesis.relevance?.relevanceScore).toBe(0);

      // Planet with moderate strength but HIGH career relevance (owns 10th house)
      const moderateLinkedAct: DashaPlanetActivation = {
        planet: Planet.SUN,
        house: 10,
        sign: 'LEO' as any,
        ownedHouses: [10],
        functionalRoles: [FunctionalRole.KENDRA_LORD],
        functionalNature: FunctionalNature.BENEFIC,
        strength: {
          score: 55,
          level: 'AVERAGE',
          rawShadbala: 1.0,
          meetsMinimum: true
        } as any,
        dignity: 'OWN_SIGN',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };

      const linkedSynthesis = scoreCareerDashaPlanet('MD', moderateLinkedAct);
      expect(linkedSynthesis.careerLinked).toBe(true);
      expect(linkedSynthesis.relevance?.relevanceLevel).toBe('HIGH');
      expect(linkedSynthesis.relevance?.relevanceScore).toBeGreaterThan(0);
      expect(linkedSynthesis.impact?.relevanceLevel).toBe('HIGH');
      expect(linkedSynthesis.impact?.strengthLevel).toBe('AVERAGE');
    });

    it('Golden Case A: Pure Support (10th lord exalted, high relevance, strong impact)', () => {
      const saturnAct = createMockActivation(Planet.SATURN, [10, 11], FunctionalRole.YOGAKARAKA);
      const synthesis = scoreCareerDashaPlanet('MD', saturnAct, mockD10Context);

      expect(synthesis.careerLinked).toBe(true);
      expect(synthesis.effect).toBe('STRONGLY_SUPPORTS');
      expect(synthesis.relevance?.relevanceLevel).toBe('HIGH');
      expect(synthesis.relevance?.evidence.some((e) => e.houses?.includes(10))).toBe(true);
      expect(synthesis.impact?.overallImpact).toBe('HIGH');
    });

    it('Golden Case B: Unlinked MD with Linked AD (hierarchy preserved)', () => {
      const unlinkedMd: DashaPlanetActivation = {
        planet: Planet.MOON,
        house: 4,
        sign: 'CANCER' as any,
        ownedHouses: [4],
        functionalRoles: [],
        functionalNature: FunctionalNature.NEUTRAL,
        strength: undefined,
        dignity: 'OWN_SIGN',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };

      const linkedAd = createMockActivation(Planet.SUN, [10], FunctionalRole.KENDRA_LORD);

      const dashaInterp: any = {
        current: {
          at: '2026-09-01T00:00:00.000Z',
          status: 'AVAILABLE',
          mahadasha: { natal: unlinkedMd, start: '2020-01-01', end: '2030-01-01' },
          antardasha: { natal: linkedAd, start: '2025-01-01', end: '2026-06-01' },
          pratyantardasha: { natal: linkedAd, start: '2026-01-01', end: '2026-03-01' },
          evidence: [],
          confidence: 'HIGH'
        }
      };

      const synthesis = buildCareerDashaSynthesis({
        dashaInterpretation: dashaInterp
      });

      expect(synthesis.md.careerLinked).toBe(false);
      expect(synthesis.md.effect).toBe('DOES_NOT_ACTIVATE');
      expect(synthesis.ad.careerLinked).toBe(true);
      expect(synthesis.ad.effect).toBe('STRONGLY_SUPPORTS');
      expect(synthesis.combined.summary).toContain('does not establish a primary Career theme');
    });

    it('Golden Case C: Mixed / Afflicted (10th lord debilitated in 8th house)', () => {
      const afflictedAct: DashaPlanetActivation = {
        planet: Planet.MARS,
        house: 8,
        sign: 'CANCER' as any,
        ownedHouses: [10, 3],
        functionalRoles: [FunctionalRole.MARAKA_LORD],
        functionalNature: FunctionalNature.MALEFIC,
        strength: {
          score: 25,
          level: 'WEAK',
          rawShadbala: 0.6,
          meetsMinimum: false
        } as any,
        dignity: 'DEBILITATED',
        castAspects: [],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };

      const synthesis = scoreCareerDashaPlanet('MD', afflictedAct);
      expect(synthesis.careerLinked).toBe(true);
      expect(synthesis.challengeScore).toBeGreaterThan(0);
      expect(synthesis.qualifyingEvidenceIds || synthesis.challengingFactorIds).toBeDefined();
      expect(synthesis.impact?.overallImpact).toBe('MODERATE');
    });

    it('Golden Case D: D10 Confirming vs Conflicting modulation', () => {
      const act = createMockActivation(Planet.JUPITER, [10], FunctionalRole.KENDRA_LORD);

      const confirmsSynth = scoreCareerDashaPlanet('MD', act, {
        relationship: 'CONFIRMS',
        available: true,
        statement: 'D10 confirms'
      });
      expect(confirmsSynth.d10Effect).toBe('SUPPORTS');
      expect(confirmsSynth.supportScore).toBeGreaterThan(0);

      const conflictsSynth = scoreCareerDashaPlanet('MD', act, {
        relationship: 'CONFLICTS',
        available: true,
        statement: 'D10 conflicts'
      });
      expect(conflictsSynth.d10Effect).toBe('CHALLENGES');
      expect(conflictsSynth.challengeScore).toBeGreaterThan(0);
    });

    it('Golden Case E: Semantic contribution category mapping for multi-house activation', () => {
      const multiHouseAct: DashaPlanetActivation = {
        planet: Planet.SATURN,
        house: 10,
        sign: 'CAPRICORN' as any,
        ownedHouses: [10, 11],
        functionalRoles: [FunctionalRole.YOGAKARAKA],
        functionalNature: FunctionalNature.BENEFIC,
        strength: {
          score: 80,
          level: 'STRONG',
          rawShadbala: 1.4,
          meetsMinimum: true
        } as any,
        dignity: 'OWN_SIGN',
        castAspects: [{ targetHouse: 2 } as any],
        receivedAspects: [],
        yogaParticipation: [],
        houseEvidence: [],
        evidence: []
      };

      const synthesis = scoreCareerDashaPlanet('MD', multiHouseAct);
      const h10Factor = synthesis.factors.find((f) => f.houses?.includes(10) && f.category === 'HOUSE_OWNERSHIP');
      const h11Factor = synthesis.factors.find((f) => f.houses?.includes(11) && f.category === 'HOUSE_OWNERSHIP');

      expect(h10Factor?.contributionCategory).toBe('CAREER_STATUS');
      expect(h11Factor?.contributionCategory).toBe('GAINS');
    });
  });
});

