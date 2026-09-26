import {
  buildCareerLordRelationships,
  type CareerLordRelationshipIntegrationInput
} from './careerLordRelationshipIntegration';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { buildCareerStructuralReasoning } from './careerStructuralReasoningIntegration';
import { Planet } from '../../types';
import type { CareerStructuralReasoning, CareerStructuralEvidence } from './careerStructuralReasoning';
import type { CareerHouseRelationship } from './careerHouseRelationship';
import { careerHouseRelationshipKey } from './careerHouseRelationship';

describe('Career Lord Relationship Integration', () => {
  describe('Real-Engine Integration', () => {
    it('produces deterministic lord relationship semantics for canonical chart', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const result1 = buildCareerLordRelationships({ structural });
      const result2 = buildCareerLordRelationships({ structural });

      // Assert results are defined
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);

      // Assert canonical ordering is stable across two runs
      expect(result1).toEqual(result2);

      // Assert each result's relationship identity is preserved
      for (const semantic of result1) {
        expect(semantic.relationship).toBeDefined();
        expect(semantic.relationshipType).toBeDefined();
        expect(semantic.relevance).toBeDefined();
        expect(semantic.effect).toBeDefined();
        expect(semantic.strength).toBeDefined();
        expect(semantic.lordARole).toBeDefined();
        expect(semantic.lordBRole).toBeDefined();
        expect(semantic.conditional).toBeDefined();
        expect(semantic.statement).toBeDefined();

        // Assert the relationship identity key is preserved
        const key = careerHouseRelationshipKey(semantic.relationship);
        expect(key).toBeDefined();
        expect(typeof key).toBe('string');
      }
    });
  });

  describe('C4-Authoritative', () => {
    it('returns empty array when structural evidence is empty', () => {
      const structural: CareerStructuralReasoning = {
        direction: 'UNAVAILABLE',
        strength: 'UNDETERMINED',
        primarySupport: 0,
        primaryChallenge: 0,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 0,
        evidence: [],
        primaryEvidenceIds: [],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'No career house relationships detected'
      };

      const result = buildCareerLordRelationships({ structural });

      // C7 must not rediscover relationships from any other source
      expect(result).toEqual([]);
    });
  });

  describe('No-Mutation', () => {
    it('does not mutate input structural object', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const before = structuredClone(structural);

      buildCareerLordRelationships({ structural });

      const after = structuredClone(structural);
      expect(before).toEqual(after);
    });
  });

  describe('Input-Order Determinism', () => {
    it('produces identical canonical output ordering regardless of input evidence order', () => {
      // Create two structural inputs with same relationships in reversed order
      const relationship1: CareerHouseRelationship = {
        type: 'LORD_ASPECT',
        houseA: 10,
        houseB: 6,
        lordA: Planet.SATURN,
        lordB: Planet.MERCURY,
        lordAHouse: 10,
        lordBHouse: 6,
        reason: 'Lords of house 10 (Saturn) and house 6 (Mercury) have aspect relationship'
      };

      const relationship2: CareerHouseRelationship = {
        type: 'COMMON_LORD',
        houseA: 10,
        houseB: 11,
        lordA: Planet.SATURN,
        lordB: Planet.SATURN,
        lordAHouse: 10,
        lordBHouse: 11,
        reason: 'House 10 and house 11 share the same lord (Saturn)'
      };

      const semantic1 = {
        relationship: relationship1,
        relationshipType: relationship1.type,
        relevance: 'PRIMARY' as const,
        effect: 'SUPPORT' as const,
        strength: 'MODERATE' as const,
        conditional: false,
        statement: 'Support aspect relationship between 10L and 6L'
      };

      const semantic2 = {
        relationship: relationship2,
        relationshipType: relationship2.type,
        relevance: 'PRIMARY' as const,
        effect: 'SUPPORT' as const,
        strength: 'STRONG' as const,
        conditional: false,
        statement: 'Strong common lord relationship between 10 and 11'
      };

      const evidence1: CareerStructuralEvidence = {
        id: 'CAREER_STRUCTURAL:10:6:LORD_ASPECT:SATURN:MERCURY:PRIMARY:SUPPORT:MODERATE:false',
        relationship: relationship1,
        semantic: semantic1,
        role: 'PRIMARY',
        direction: 'SUPPORT',
        weight: 2,
        statement: 'Support aspect relationship between 10L and 6L'
      };

      const evidence2: CareerStructuralEvidence = {
        id: 'CAREER_STRUCTURAL:10:11:COMMON_LORD:SATURN:SATURN:PRIMARY:SUPPORT:STRONG:false',
        relationship: relationship2,
        semantic: semantic2,
        role: 'PRIMARY',
        direction: 'SUPPORT',
        weight: 3,
        statement: 'Strong common lord relationship between 10 and 11'
      };

      const structural1: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 5,
        primaryChallenge: 0,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 0,
        evidence: [evidence1, evidence2],
        primaryEvidenceIds: [evidence1.id, evidence2.id],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Support structural reasoning'
      };

      const structural2: CareerStructuralReasoning = {
        direction: 'SUPPORT',
        strength: 'STRONG',
        primarySupport: 5,
        primaryChallenge: 0,
        supportingSupport: 0,
        supportingChallenge: 0,
        challengingSupport: 0,
        challengingChallenge: 0,
        mixedWeight: 0,
        evidence: [evidence2, evidence1], // Reversed order
        primaryEvidenceIds: [evidence2.id, evidence1.id],
        supportingEvidenceIds: [],
        challengingEvidenceIds: [],
        conflicts: [],
        statement: 'Support structural reasoning'
      };

      const result1 = buildCareerLordRelationships({ structural: structural1 });
      const result2 = buildCareerLordRelationships({ structural: structural2 });

      // Assert identical canonical output ordering
      expect(result1).toEqual(result2);
    });
  });

  describe('Boundary/Leakage', () => {
    it('result objects contain no later-wave properties', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const result = buildCareerLordRelationships({ structural });

      for (const semantic of result) {
        // Assert C7 semantic fields are present
        expect(semantic.relationship).toBeDefined();
        expect(semantic.relationshipType).toBeDefined();
        expect(semantic.lordARole).toBeDefined();
        expect(semantic.lordBRole).toBeDefined();
        expect(semantic.relevance).toBeDefined();
        expect(semantic.effect).toBeDefined();
        expect(semantic.strength).toBeDefined();
        expect(semantic.conditional).toBeDefined();
        expect(semantic.statement).toBeDefined();

        // Assert later-wave properties are NOT present
        expect((semantic as any).dasha).toBeUndefined();
        expect((semantic as any).md).toBeUndefined();
        expect((semantic as any).ad).toBeUndefined();
        expect((semantic as any).pd).toBeUndefined();
        expect((semantic as any).d10).toBeUndefined();
        expect((semantic as any).transit).toBeUndefined();
        expect((semantic as any).timing).toBeUndefined();
        expect((semantic as any).c8).toBeUndefined();
        expect((semantic as any).c9).toBeUndefined();
        expect((semantic as any).c10).toBeUndefined();
        expect((semantic as any).c11).toBeUndefined();
        expect((semantic as any).conclusion).toBeUndefined();
      }
    });
  });

  describe('Immutability', () => {
    it('returns frozen array', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const result = buildCareerLordRelationships({ structural });

      expect(Object.isFrozen(result)).toBe(true);

      for (const semantic of result) {
        expect(Object.isFrozen(semantic)).toBe(true);
      }
    });
  });
});
