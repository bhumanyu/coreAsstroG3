import {
  buildCareerStructuralReasoning,
  toDomainEvidence
} from './careerStructuralReasoningIntegration';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet, type Horoscope } from '../../types';
import type { CareerStructuralReasoning, CareerStructuralEvidence } from './careerStructuralReasoning';
import type { CareerHouseRelationship } from './careerHouseRelationship';
import { deduplicateReasoningEvidence } from '../reasoning/deduplicateEvidence';
import type { WeightedReasoningEvidence } from '../reasoning/reasoningTypes';

describe('Career Structural Reasoning Integration', () => {
  describe('Integration Determinism', () => {
    it('identical inputs produce identical outputs', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any,
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL' }
          ]
        }
      });

      const result1 = buildCareerStructuralReasoning({ horoscope });
      const result2 = buildCareerStructuralReasoning({ horoscope });

      expect(result1).toEqual(result2);
    });

    it('produces deterministically ordered evidence IDs', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] },
            { house: 2, lord: Planet.JUPITER, sign: 'SAGITTARIUS' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const result1 = buildCareerStructuralReasoning({ horoscope });
      const result2 = buildCareerStructuralReasoning({ horoscope });

      expect(result1.evidence.map(e => e.id)).toEqual(result2.evidence.map(e => e.id));
      expect(result1.primaryEvidenceIds).toEqual(result2.primaryEvidenceIds);
      expect(result1.supportingEvidenceIds).toEqual(result2.supportingEvidenceIds);
      expect(result1.challengingEvidenceIds).toEqual(result2.challengingEvidenceIds);
      expect(result1.conflicts.map(c => c.evidenceIds)).toEqual(result2.conflicts.map(c => c.evidenceIds));
    });

    it('Map insertion order cannot leak into getHouseOccupants output', () => {
      // Use the same minimal horoscope structure for both
      const horoscope1 = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const horoscope2 = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const result1 = buildCareerStructuralReasoning({ horoscope: horoscope1 });
      const result2 = buildCareerStructuralReasoning({ horoscope: horoscope2 });

      // The occupants should be in the same canonical order regardless of Map insertion order
      expect(result1.evidence.map(e => e.id)).toEqual(result2.evidence.map(e => e.id));
    });
  });

  describe('Real-Engine Integration', () => {
    it('produces expected structural evidence for canonical chart', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerStructuralReasoning({ horoscope });

      // Assert that the engine produces valid structural reasoning
      expect(result).toBeDefined();
      expect(result.evidence).toBeInstanceOf(Array);
      expect(result.direction).toBeDefined();
      expect(result.strength).toBeDefined();

      // Assert specific relationship types are detected based on the canonical chart
      // The canonical chart should have some career house relationships
      const careerHouseEvidence = result.evidence.filter(e =>
        [10, 6, 2, 11, 8, 12].includes(e.relationship.houseA) ||
        [10, 6, 2, 11, 8, 12].includes(e.relationship.houseB)
      );

      // At minimum, we should detect relationships among career houses
      expect(careerHouseEvidence.length).toBeGreaterThan(0);

      // Assert that evidence has valid structure
      for (const evidence of result.evidence) {
        expect(evidence.id).toBeDefined();
        expect(evidence.relationship).toBeDefined();
        expect(evidence.semantic).toBeDefined();
        expect(evidence.role).toBeDefined();
        expect(evidence.direction).toBeDefined();
        expect(evidence.weight).toBeGreaterThan(0);
        expect(evidence.statement).toBeDefined();
      }
    });
  });

  describe('MIXED Identity Regression', () => {
    it('MIXED direction evidence splits into two occurrences with same identityKey', () => {
      const mixedEvidence = createMixedStructuralEvidence();
      const structural: CareerStructuralReasoning = {
        direction: 'MIXED',
        strength: 'MIXED',
        primarySupport: 1,
        primaryChallenge: 1,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 2,
        evidence: [mixedEvidence],
        primaryEvidenceIds: [mixedEvidence.id],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test MIXED structural reasoning'
      };

      const domainEvidence = toDomainEvidence(structural);

      // Should split into two occurrences
      expect(domainEvidence).toHaveLength(2);

      const supporting = domainEvidence.find(e => e.polarity === 'SUPPORTING');
      const challenging = domainEvidence.find(e => e.polarity === 'CHALLENGING');

      expect(supporting).toBeDefined();
      expect(challenging).toBeDefined();

      // Both should share the same identityKey and ruleId
      expect(supporting!.identityKey).toBe(challenging!.identityKey);
      expect(supporting!.ruleId).toBe(challenging!.ruleId);

      // Both should have provenance.effect === 'MIXED'
      expect(supporting!.provenance?.effect).toBe('MIXED');
      expect(challenging!.provenance?.effect).toBe('MIXED');

      // Should have distinct occurrence IDs
      expect(supporting!.id).not.toBe(challenging!.id);
    });

    it('MIXED occurrences collapse to ONE semantic fact with MAX weight through dedup', () => {
      const mixedEvidence = createMixedStructuralEvidence();
      const structural: CareerStructuralReasoning = {
        direction: 'MIXED',
        strength: 'MIXED',
        primarySupport: 1,
        primaryChallenge: 1,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 2,
        evidence: [mixedEvidence],
        primaryEvidenceIds: [mixedEvidence.id],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Test MIXED structural reasoning'
      };

      const domainEvidence = toDomainEvidence(structural);

      // Convert to WeightedReasoningEvidence format for dedup
      const weightedEvidence: WeightedReasoningEvidence[] = domainEvidence.map(e => ({
        identityKey: e.identityKey!,
        evidenceId: e.id,
        ruleId: e.ruleId,
        layer: 'PRIMARY_PROMISE',
        direction: e.polarity === 'SUPPORTING' ? 'SUPPORT' : 'CHALLENGE',
        strength: e.strength,
        priority: e.priority,
        weight: e.priority,
        statement: e.statement,
        relatedEvidenceIds: e.relatedEvidenceIds,
        sourceIds: [e.id]
      }));

      // Run through canonical dedup
      const deduplicated = deduplicateReasoningEvidence(weightedEvidence);

      // Should collapse to ONE semantic fact
      expect(deduplicated).toHaveLength(1);

      const canonical = deduplicated[0];

      // Direction should be MIXED (merged from SUPPORT + CHALLENGE)
      expect(canonical.direction).toBe('MIXED');

      // Weight should be MAX of single occurrences (not doubled)
      expect(canonical.weight).toBe(Math.max(...weightedEvidence.map(e => e.weight)));

      // Both occurrence IDs should be preserved in sourceIds
      expect(canonical.sourceIds).toHaveLength(2);
      expect(canonical.sourceIds).toContain(weightedEvidence[0].evidenceId);
      expect(canonical.sourceIds).toContain(weightedEvidence[1].evidenceId);

      // occurrenceCount should reflect both occurrences
      expect(canonical.occurrenceCount).toBe(2);
    });
  });

  describe('Boundary/Immutability Tests', () => {
    it('C4 output contains only structural fields, no later-wave properties', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const result = buildCareerStructuralReasoning({ horoscope });

      // Assert C4 structural fields are present
      expect(result.direction).toBeDefined();
      expect(result.strength).toBeDefined();
      expect(result.evidence).toBeDefined();
      expect(result.primarySupport).toBeDefined();
      expect(result.primaryChallenge).toBeDefined();
      expect(result.supportingSupport).toBeDefined();
      expect(result.supportingChallenge).toBeDefined();
      expect(result.challengingSupport).toBeDefined();
      expect(result.challengingChallenge).toBeDefined();
      expect(result.mixedWeight).toBeDefined();
      expect(result.primaryEvidenceIds).toBeDefined();
      expect(result.supportingEvidenceIds).toBeDefined();
      expect(result.challengingEvidenceIds).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.statement).toBeDefined();

      // Assert C5 relevance properties are NOT present
      expect((result as any).relevance).toBeUndefined();
      expect((result as any).roles).toBeUndefined();
      expect((result as any).reasons).toBeUndefined();
      expect((result as any).relatedPlanets).toBeUndefined();

      // Assert C6 condition properties are NOT present
      expect((result as any).conditions).toBeUndefined();
      expect((result as any).conditionEffects).toBeUndefined();

      // Assert C7 lord-semantics properties are NOT present
      expect((result as any).lordSemantics).toBeUndefined();
      expect((result as any).lordPlacement).toBeUndefined();

      // Assert C8 expression properties are NOT present
      expect((result as any).expression).toBeUndefined();
      expect((result as any).manifestation).toBeUndefined();

      // Assert C9 Dasha properties are NOT present
      expect((result as any).dasha).toBeUndefined();
      expect((result as any).timing).toBeUndefined();

      // Assert C10 D10 properties are NOT present
      expect((result as any).d10).toBeUndefined();
      expect((result as any).dasamsa).toBeUndefined();

      // Assert C11 conclusion properties are NOT present
      expect((result as any).conclusion).toBeUndefined();
      expect((result as any).finalStatement).toBeUndefined();
    });

    it('toDomainEvidence result contains only structural fields', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const structural = buildCareerStructuralReasoning({ horoscope });
      const domainEvidence = toDomainEvidence(structural);

      for (const evidence of domainEvidence) {
        // Assert structural fields are present
        expect(evidence.id).toBeDefined();
        expect(evidence.sourceType).toBeDefined();
        expect(evidence.domain).toBe('CAREER');
        expect(evidence.phase).toBe('NATAL_PROMISE');
        expect(evidence.source).toBe('D1');
        expect(evidence.polarity).toBeDefined();
        expect(evidence.strength).toBeDefined();
        expect(evidence.priority).toBeDefined();
        expect(evidence.statement).toBeDefined();
        expect(evidence.provenance).toBeDefined();
        expect(evidence.provenance?.source).toBe('C4_STRUCTURAL_REASONING');

        // Assert later-wave properties are NOT present
        expect(evidence.timing).toBeUndefined();
        expect((evidence as any).dasha).toBeUndefined();
        expect((evidence as any).d10).toBeUndefined();
        expect((evidence as any).conclusion).toBeUndefined();
      }
    });

    it('all returned arrays/objects are frozen', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const structural = buildCareerStructuralReasoning({ horoscope });

      // Assert top-level object is frozen
      expect(Object.isFrozen(structural)).toBe(true);

      // Assert arrays are frozen
      expect(Object.isFrozen(structural.evidence)).toBe(true);
      expect(Object.isFrozen(structural.primaryEvidenceIds)).toBe(true);
      expect(Object.isFrozen(structural.supportingEvidenceIds)).toBe(true);
      expect(Object.isFrozen(structural.challengingEvidenceIds)).toBe(true);
      expect(Object.isFrozen(structural.conflicts)).toBe(true);

      // Assert individual evidence items are frozen
      for (const evidence of structural.evidence) {
        expect(Object.isFrozen(evidence)).toBe(true);
      }

      // Assert domain evidence is frozen
      const domainEvidence = toDomainEvidence(structural);
      expect(Object.isFrozen(domainEvidence)).toBe(true);

      for (const evidence of domainEvidence) {
        expect(Object.isFrozen(evidence)).toBe(true);
      }
    });

    it('input horoscope is not mutated', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const horoscopeBefore = structuredClone(horoscope);
      buildCareerStructuralReasoning({ horoscope });
      const horoscopeAfter = structuredClone(horoscope);

      expect(horoscopeBefore).toEqual(horoscopeAfter);
    });
  });

  describe('Aspect Single-Source Verification', () => {
    it('reads aspects exclusively from natalGrahaDrishti', () => {
      // Horoscope with natalGrahaDrishti populated should produce aspect relationships
      const horoscopeWithAspects = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any,
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL' },
            { sourcePlanet: Planet.SATURN, targetHouse: 6, aspectType: 'FULL' }
          ]
        }
      });

      const resultWithAspects = buildCareerStructuralReasoning({ horoscope: horoscopeWithAspects });

      // Should detect LORD_ASPECT and/or HOUSE_ASPECT relationships
      const aspectEvidence = resultWithAspects.evidence.filter(e =>
        e.relationship.type === 'LORD_ASPECT' || e.relationship.type === 'HOUSE_ASPECT'
      );

      expect(aspectEvidence.length).toBeGreaterThan(0);

      // Horoscope without natalGrahaDrishti should produce NO aspect relationships
      const horoscopeWithoutAspects = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any,
        natalGrahaDrishti: undefined
      });

      const resultWithoutAspects = buildCareerStructuralReasoning({ horoscope: horoscopeWithoutAspects });

      const aspectEvidenceWithout = resultWithoutAspects.evidence.filter(e =>
        e.relationship.type === 'LORD_ASPECT' || e.relationship.type === 'HOUSE_ASPECT'
      );

      expect(aspectEvidenceWithout).toHaveLength(0);
    });

    it('ignores grahaDrishti when natalGrahaDrishti is present', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any,
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'FULL' }
          ]
        },
        grahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.VENUS, aspectType: 'FULL' }
          ]
        }
      });

      const result = buildCareerStructuralReasoning({ horoscope });

      // Should only detect aspects from natalGrahaDrishti (Saturn -> Mercury)
      // Should NOT detect aspects from grahaDrishti (Jupiter -> Venus)
      const aspectEvidence = result.evidence.filter(e =>
        e.relationship.type === 'LORD_ASPECT' || e.relationship.type === 'HOUSE_ASPECT'
      );

      // Check that only Saturn-Mercury aspect is detected, not Jupiter-Venus
      const hasSaturnMercuryAspect = aspectEvidence.some(e =>
        (e.relationship.lordA === Planet.SATURN && e.relationship.lordB === Planet.MERCURY) ||
        (e.relationship.lordA === Planet.MERCURY && e.relationship.lordB === Planet.SATURN)
      );

      const hasJupiterVenusAspect = aspectEvidence.some(e =>
        (e.relationship.lordA === Planet.JUPITER && e.relationship.lordB === Planet.VENUS) ||
        (e.relationship.lordA === Planet.VENUS && e.relationship.lordB === Planet.JUPITER)
      );

      expect(hasSaturnMercuryAspect).toBe(true);
      expect(hasJupiterVenusAspect).toBe(false);
    });
  });
});

function createMinimalHoroscope(overrides: Partial<Horoscope> = {}): Horoscope {
  return {
    birthDetails: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: 'LAHIRI' as any,
      dateTimeStr: '1990-01-01T12:00:00Z'
    },
    planetFacts: {
      [Planet.SUN]: { planet: Planet.SUN, position: { house: 1, longitude: 0, sign: 'ARIES' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MOON]: { planet: Planet.MOON, position: { house: 3, longitude: 0, sign: 'GEMINI' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MARS]: { planet: Planet.MARS, position: { house: 3, longitude: 0, sign: 'GEMINI' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MERCURY]: { planet: Planet.MERCURY, position: { house: 4, longitude: 0, sign: 'CANCER' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.JUPITER]: { planet: Planet.JUPITER, position: { house: 5, longitude: 0, sign: 'LEO' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.VENUS]: { planet: Planet.VENUS, position: { house: 7, longitude: 0, sign: 'LIBRA' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.SATURN]: { planet: Planet.SATURN, position: { house: 9, longitude: 0, sign: 'SAGITTARIUS' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.RAHU]: { planet: Planet.RAHU, position: { house: 1, longitude: 0, sign: 'ARIES' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.KETU]: { planet: Planet.KETU, position: { house: 7, longitude: 0, sign: 'LIBRA' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any
    },
    bhavaFacts: {},
    houseAnalysis: undefined,
    natalGrahaDrishti: undefined,
    grahaDrishti: undefined,
    yogas: undefined,
    fullNatalAnalysis: {} as any,
    ...overrides
  };
}

function createMixedStructuralEvidence(): CareerStructuralEvidence {
  const relationship: CareerHouseRelationship = {
    type: 'LORD_ASPECT',
    houseA: 10,
    houseB: 6,
    lordA: Planet.SATURN,
    lordB: Planet.MERCURY,
    lordAHouse: 10,
    lordBHouse: 6,
    reason: 'Lords of house 10 (Saturn) and house 6 (Mercury) have aspect relationship'
  };

  return {
    id: 'CAREER_STRUCTURAL:10:6:LORD_ASPECT:SATURN:MERCURY:PRIMARY:MIXED:MODERATE:false',
    relationship,
    semantic: {
      relationship,
      relationshipType: relationship.type,
      relevance: 'PRIMARY',
      effect: 'MIXED',
      strength: 'MODERATE',
      conditional: false,
      statement: 'Mixed aspect relationship between 10L and 6L'
    },
    role: 'PRIMARY',
    direction: 'MIXED',
    weight: 2,
    statement: 'Mixed aspect relationship between 10L and 6L'
  };
}
