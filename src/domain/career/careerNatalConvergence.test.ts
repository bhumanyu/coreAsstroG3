import { buildCareerNatalAnalysis } from './careerNatalConvergence';
import type { CareerNatalAnalysis } from './careerNatalAnalysis';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';

describe('CareerNatalConvergence', () => {
  describe('Integration with real engine', () => {
    it('builds complete aggregate with all C4-C7 components', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(result).toBeDefined();
      expect(result.structural).toBeDefined();
      expect(result.relevance).toBeDefined();
      expect(result.condition).toBeDefined();
      expect(result.lordRelationships).toBeDefined();
      expect(result.direction).toBeDefined();
      expect(result.strength).toBeDefined();
      expect(result.evidence).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.reasoningTrace).toBeDefined();
    });

    it('direction and strength equal structural.direction and structural.strength', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(result.direction).toBe(result.structural.direction);
      expect(result.strength).toBe(result.structural.strength);
    });

    it('C5 relevance preserved exactly into C6 per planet', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      const relevanceByPlanet = new Map(
        result.relevance.map(r => [r.planet, r])
      );

      for (const conditionItem of result.condition) {
        const relevanceItem = relevanceByPlanet.get(conditionItem.planet);
        expect(relevanceItem).toBeDefined();
        expect(conditionItem.relevance).toBe(relevanceItem!.relevance);
      }
    });

    it('every C7 lordRelationships[].relationship exists among structural.evidence[].relationship', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      const structuralRelationships = new Set(
        result.structural.evidence.map(e => JSON.stringify(e.relationship))
      );

      for (const lordRel of result.lordRelationships) {
        const relationshipKey = JSON.stringify(lordRel.relationship);
        expect(structuralRelationships.has(relationshipKey)).toBe(true);
      }
    });

    it('evidence[].evidenceId is unique', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      const evidenceIds = result.evidence.map(e => e.evidenceId);
      const uniqueIds = new Set(evidenceIds);
      expect(uniqueIds.size).toBe(evidenceIds.length);
    });

    it('evidence[].sourceIds is non-empty', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      for (const evidence of result.evidence) {
        expect(evidence.sourceIds.length).toBeGreaterThan(0);
      }
    });

    it('determinism: two runs produce equal results', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result1 = buildCareerNatalAnalysis({ horoscope });
      const result2 = buildCareerNatalAnalysis({ horoscope });

      expect(result1).toEqual(result2);
    });

    it('horoscope not mutated', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const before = JSON.stringify(horoscope);

      buildCareerNatalAnalysis({ horoscope });

      const after = JSON.stringify(horoscope);
      expect(before).toBe(after);
    });

    it('aggregate is frozen', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('array fields are frozen', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(Object.isFrozen(result.relevance)).toBe(true);
      expect(Object.isFrozen(result.condition)).toBe(true);
      expect(Object.isFrozen(result.lordRelationships)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);
      expect(Object.isFrozen(result.conflicts)).toBe(true);
    });

    it('forbidden C8–C11 fields absent', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect('dasha' in result).toBe(false);
      expect('activation' in result).toBe(false);
      expect('activePlanets' in result).toBe(false);
      expect('d10' in result).toBe(false);
      expect('d10Qualification' in result).toBe(false);
      expect('dasamsa' in result).toBe(false);
      expect('transit' in result).toBe(false);
      expect('timing' in result).toBe(false);
      expect('transitStrength' in result).toBe(false);
      expect('expression' in result).toBe(false);
      expect('manifestation' in result).toBe(false);
      expect('expressionMode' in result).toBe(false);
      expect('finalConclusion' in result).toBe(false);
      expect('summary' in result).toBe(false);
      expect('careerOutcome' in result).toBe(false);
      expect('recommendation' in result).toBe(false);
      expect('careerScore' in result).toBe(false);
    });

    it('reasoningTrace.dasha/varga/transit are empty arrays', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(result.reasoningTrace.dasha).toEqual([]);
      expect(result.reasoningTrace.varga).toEqual([]);
      expect(result.reasoningTrace.transit).toEqual([]);
    });

    it('conflicts preserve C4 conflict data', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      for (const conflict of result.conflicts) {
        expect(conflict.supportWeight).toBeDefined();
        expect(conflict.challengeWeight).toBeDefined();
        expect(conflict.ratio).toBeDefined();
        expect(conflict.statement).toBeDefined();
        expect(typeof conflict.supportWeight).toBe('number');
        expect(typeof conflict.challengeWeight).toBe('number');
        expect(typeof conflict.ratio).toBe('number');
        expect(typeof conflict.statement).toBe('string');
      }
    });

    it('conflicts identityKey format', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      for (const conflict of result.conflicts) {
        expect(conflict.identityKey).toMatch(/^CAREER_NATAL_STRUCTURAL_CONFLICT:/);
      }
    });

    it('relevance contains all 9 planets in canonical order', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(result.relevance).toHaveLength(9);
      expect(result.relevance[0].planet).toBe(Planet.SUN);
      expect(result.relevance[1].planet).toBe(Planet.MOON);
      expect(result.relevance[2].planet).toBe(Planet.MARS);
      expect(result.relevance[3].planet).toBe(Planet.MERCURY);
      expect(result.relevance[4].planet).toBe(Planet.JUPITER);
      expect(result.relevance[5].planet).toBe(Planet.VENUS);
      expect(result.relevance[6].planet).toBe(Planet.SATURN);
      expect(result.relevance[7].planet).toBe(Planet.RAHU);
      expect(result.relevance[8].planet).toBe(Planet.KETU);
    });

    it('condition contains all 9 planets in canonical order', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const result = buildCareerNatalAnalysis({ horoscope });

      expect(result.condition).toHaveLength(9);
      expect(result.condition[0].planet).toBe(Planet.SUN);
      expect(result.condition[1].planet).toBe(Planet.MOON);
      expect(result.condition[2].planet).toBe(Planet.MARS);
      expect(result.condition[3].planet).toBe(Planet.MERCURY);
      expect(result.condition[4].planet).toBe(Planet.JUPITER);
      expect(result.condition[5].planet).toBe(Planet.VENUS);
      expect(result.condition[6].planet).toBe(Planet.SATURN);
      expect(result.condition[7].planet).toBe(Planet.RAHU);
      expect(result.condition[8].planet).toBe(Planet.KETU);
    });
  });
});
