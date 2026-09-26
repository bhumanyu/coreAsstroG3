import {
  describe,
  expect,
  it
} from 'vitest';

import {
  buildCareerExpression,
  buildCareerExpressionContext,
  buildCareerExpressions,
  getCareerExpressionPlanetOrder,
  type CareerExpressionIntegrationInput
} from './careerExpressionIntegration';

import {
  EMPTY_CAREER_NATAL_ANALYSIS
} from './careerNatalAnalysis';

import {
  buildCareerNatalAnalysis
} from './careerNatalConvergence';

import {
  calculateHoroscope
} from '../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../test/fixtures/canonicalChart';

import {
  Planet
} from '../../types';

import type {
  CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from './careerPlanetaryCondition';

import type {
  CareerStructuralReasoning
} from './careerStructuralReasoning';

import type {
  CareerLordRelationshipSemantic
} from './careerLordRelationshipSemantics';

import type {
  ReasoningDirection,
  DomainStrength,
  WeightedReasoningEvidence,
  ReasoningTrace
} from '../reasoning/reasoningTypes';

describe('Career Expression Integration (C8)', () => {
  describe('EMPTY_CAREER_NATAL_ANALYSIS → immutable context', () => {
    it('should produce frozen context from empty natal analysis', () => {
      const input: CareerExpressionIntegrationInput = {
        natal: EMPTY_CAREER_NATAL_ANALYSIS
      };

      const context = buildCareerExpressionContext(input);

      expect(Object.isFrozen(context)).toBe(true);
      expect(Object.isFrozen(context.relevantPlanets)).toBe(true);
    });

    it('should have no relevant planets from empty natal analysis', () => {
      const input: CareerExpressionIntegrationInput = {
        natal: EMPTY_CAREER_NATAL_ANALYSIS
      };

      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets).toHaveLength(0);
    });

    it('should map NEUTRAL structural direction from empty natal analysis', () => {
      const input: CareerExpressionIntegrationInput = {
        natal: EMPTY_CAREER_NATAL_ANALYSIS
      };

      const context = buildCareerExpressionContext(input);

      expect(context.structuralDirection).toBe('NEUTRAL');
      expect(context.structuralStrength).toBe('UNDETERMINED');
      expect(context.structuralPrimarySupport).toBe(0);
      expect(context.structuralPrimaryChallenge).toBe(0);
    });
  });

  describe('No expression when structural direction is UNAVAILABLE', () => {
    it('should return empty expressions when structural direction is UNAVAILABLE', () => {
      const mockNatal: any = {
        structural: {
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
          statement: 'Test'
        },
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'UNAVAILABLE' as ReasoningDirection,
        strength: 'UNDETERMINED' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const result = buildCareerExpression(input);

      expect(result.expressions).toHaveLength(0);
      expect(result.primaryExpression).toBeUndefined();
      expect(result.statement).toContain('UNAVAILABLE');
    });
  });

  describe('C4 direction/strength/primarySupport mapping', () => {
    it('should map C4 structural fields to expression context', () => {
      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 5,
          primaryChallenge: 1,
          supportingSupport: 2,
          supportingChallenge: 0,
          challengingSupport: 0,
          challengingChallenge: 1,
          mixedWeight: 0,
          evidence: [],
          primaryEvidenceIds: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          conflicts: [],
          statement: 'Test'
        },
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.structuralDirection).toBe('SUPPORT');
      expect(context.structuralStrength).toBe('STRONG');
      expect(context.structuralPrimarySupport).toBe(5);
      expect(context.structuralPrimaryChallenge).toBe(1);
    });
  });

  describe('C5 relevance preserved exactly', () => {
    it('should preserve C5 relevance values exactly', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10, 6],
        relatedPlanets: [Planet.JUPITER],
        conditional: false,
        statement: 'Saturn is 10L with career relevance.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets).toHaveLength(1);
      expect(context.relevantPlanets[0].planet).toBe(Planet.SATURN);
      expect(context.relevantPlanets[0].relevance).toBe('PRIMARY');
      expect(context.relevantPlanets[0].roles).toEqual(['CAREER_LORD']);
      expect(context.relevantPlanets[0].effect).toBe('SUPPORT');
    });
  });

  describe('C6 condition preserved exactly', () => {
    it('should preserve C6 condition values exactly', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockCondition: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is strong.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [mockCondition],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets[0].condition).toBe('STRONG');
    });
  });

  describe('Missing C6 condition → UNAVAILABLE', () => {
    it('should default to UNAVAILABLE when C6 condition is missing', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [], // No condition for Saturn
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets[0].condition).toBe('UNAVAILABLE');
    });

    it('should preserve existing UNAVAILABLE condition from C6', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockCondition: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'UNAVAILABLE',
        dignity: 'UNAVAILABLE',
        affliction: 'UNAVAILABLE',
        motion: 'UNKNOWN',
        combustion: 'UNAVAILABLE',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: true,
        statement: 'Saturn condition unavailable.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [mockCondition],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets[0].condition).toBe('UNAVAILABLE');
    });
  });

  describe('C5/C6 separation', () => {
    it('should keep C5 relevance and C6 condition as separate concerns', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [Planet.JUPITER],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockCondition: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'WEAK',
        dignity: 'ENEMY_SIGN',
        affliction: 'MILD',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [Planet.MARS],
        conditional: false,
        statement: 'Saturn is weak.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [mockCondition],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets[0].relevance).toBe('PRIMARY');
      expect(context.relevantPlanets[0].condition).toBe('WEAK');
      expect(context.relevantPlanets[0].relatedPlanets).toContain(Planet.JUPITER);
      expect(context.relevantPlanets[0].relatedPlanets).toContain(Planet.MARS);
    });
  });

  describe('Canonical planet ordering', () => {
    it('should process planets in canonical order', () => {
      const mockRelevance1: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockRelevance2: CareerPlanetaryRelevance = {
        planet: Planet.SUN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['LEADERSHIP'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Sun is 10L.'
      };

      const mockCondition1: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is strong.'
      };

      const mockCondition2: CareerPlanetaryConditionResult = {
        planet: Planet.SUN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Sun is strong.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance1, mockRelevance2], // Out of order
        condition: [mockCondition1, mockCondition2], // Out of order
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets).toHaveLength(2);
      expect(context.relevantPlanets[0].planet).toBe(Planet.SUN); // Sun comes before Saturn in canonical order
      expect(context.relevantPlanets[1].planet).toBe(Planet.SATURN);
    });

    it('getCareerExpressionPlanetOrder should return canonical order', () => {
      const order = getCareerExpressionPlanetOrder();

      expect(order).toEqual([
        Planet.SUN,
        Planet.MOON,
        Planet.MARS,
        Planet.MERCURY,
        Planet.JUPITER,
        Planet.VENUS,
        Planet.SATURN,
        Planet.RAHU,
        Planet.KETU
      ]);
    });
  });

  describe('Determinism regardless of C5 input ordering', () => {
    it('should produce identical context regardless of relevance array order', () => {
      const mockRelevance1: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockRelevance2: CareerPlanetaryRelevance = {
        planet: Planet.SUN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['LEADERSHIP'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Sun is 10L.'
      };

      const mockCondition1: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is strong.'
      };

      const mockCondition2: CareerPlanetaryConditionResult = {
        planet: Planet.SUN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Sun is strong.'
      };

      const createMockNatal = (relevanceOrder: CareerPlanetaryRelevance[], conditionOrder: CareerPlanetaryConditionResult[]): any => ({
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: relevanceOrder,
        condition: conditionOrder,
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      });

      const input1: CareerExpressionIntegrationInput = {
        natal: createMockNatal([mockRelevance1, mockRelevance2], [mockCondition1, mockCondition2])
      };

      const input2: CareerExpressionIntegrationInput = {
        natal: createMockNatal([mockRelevance2, mockRelevance1], [mockCondition2, mockCondition1])
      };

      const context1 = buildCareerExpressionContext(input1);
      const context2 = buildCareerExpressionContext(input2);

      expect(context1).toEqual(context2);
    });
  });

  describe('No mutation of the natal aggregate', () => {
    it('should not mutate the input natal aggregate', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const originalRelevance = [...mockNatal.relevance];
      const originalCondition = [...mockNatal.condition];

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      buildCareerExpressionContext(input);

      expect(mockNatal.relevance).toEqual(originalRelevance);
      expect(mockNatal.condition).toEqual(originalCondition);
    });
  });

  describe('Absence of C9/C10/timing/C11/score fields', () => {
    it('should not include C9/C10/timing/C11/score fields in expression context', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      // C8 context should only have structural fields and relevantPlanets
      expect(context).toHaveProperty('structuralDirection');
      expect(context).toHaveProperty('structuralStrength');
      expect(context).toHaveProperty('structuralPrimarySupport');
      expect(context).toHaveProperty('structuralPrimaryChallenge');
      expect(context).toHaveProperty('relevantPlanets');

      // Should NOT have timing, D10, C11, or score fields
      expect(context).not.toHaveProperty('dasha');
      expect(context).not.toHaveProperty('d10');
      expect(context).not.toHaveProperty('timing');
      expect(context).not.toHaveProperty('score');
      expect(context).not.toHaveProperty('natalPromise');
    });
  });

  describe('Batch processing', () => {
    it('should process multiple inputs and preserve order', () => {
      const mockRelevance1: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockNatal1: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test 1'
        },
        relevance: [mockRelevance1],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const mockNatal2: any = {
        structural: {
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
          statement: 'Test 2'
        },
        relevance: [],
        condition: [],
        lordRelationships: [],
        direction: 'UNAVAILABLE' as ReasoningDirection,
        strength: 'UNDETERMINED' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const inputs: CareerExpressionIntegrationInput[] = [
        { natal: mockNatal1 },
        { natal: mockNatal2 }
      ];

      const results = buildCareerExpressions(inputs);

      expect(results).toHaveLength(2);
      expect(results[0].expressions).toBeDefined();
      expect(results[1].statement).toContain('UNAVAILABLE');
    });

    it('should return frozen results array', () => {
      const inputs: CareerExpressionIntegrationInput[] = [
        { natal: EMPTY_CAREER_NATAL_ANALYSIS }
      ];

      const results = buildCareerExpressions(inputs);

      expect(Object.isFrozen(results)).toBe(true);
    });
  });

  describe('Real-engine determinism test', () => {
    it('calculateHoroscope → buildCareerNatalAnalysis → buildCareerExpression should be deterministic', () => {
      // Call calculateHoroscope synchronously (no await)
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      expect(horoscope).toBeDefined();

      // Build natal analysis using static import
      const natalAnalysis = buildCareerNatalAnalysis({ horoscope });

      expect(natalAnalysis).toBeDefined();

      // Build expression
      const input: CareerExpressionIntegrationInput = { natal: natalAnalysis };
      const result1 = buildCareerExpression(input);

      expect(result1).toBeDefined();

      // Run again to verify determinism
      const result2 = buildCareerExpression(input);

      expect(result1).toEqual(result2);

      // Verify immutability
      expect(Object.isFrozen(result1)).toBe(true);
      expect(Object.isFrozen(result1.expressions)).toBe(true);

      // Verify boundary correctness (do NOT assert non-empty expressions)
      expect(result1.expressions).toBeDefined();
      expect(Array.isArray(result1.expressions)).toBe(true);
    });
  });

  describe('Related planets merging and sorting', () => {
    it('should merge relatedPlanets from relevance and condition, deduped and sorted by canonical order', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [Planet.JUPITER, Planet.MARS],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockCondition: CareerPlanetaryConditionResult = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        condition: 'STRONG',
        dignity: 'OWN_SIGN',
        affliction: 'NONE',
        motion: 'DIRECT',
        combustion: 'NOT_COMBUST',
        positiveFactors: [],
        negativeFactors: [],
        relatedPlanets: [Planet.MERCURY, Planet.JUPITER], // Jupiter is duplicate
        conditional: false,
        statement: 'Saturn is strong.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [mockCondition],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      // Should have deduped planets: Mars, Mercury, Jupiter (sorted by canonical order)
      expect(context.relevantPlanets[0].relatedPlanets).toEqual([
        Planet.MARS,
        Planet.MERCURY,
        Planet.JUPITER
      ]);
    });
  });

  describe('Related houses sorting', () => {
    it('should sort relatedHouses numerically', () => {
      const mockRelevance: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10, 2, 6], // Unsorted
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets[0].relatedHouses).toEqual([2, 6, 10]);
    });
  });

  describe('Skipping planets with no C5 relevance', () => {
    it('should skip planets with NEUTRAL relevance', () => {
      const mockRelevance1: CareerPlanetaryRelevance = {
        planet: Planet.SATURN,
        relevance: 'PRIMARY',
        roles: ['CAREER_LORD'],
        reasons: ['PRIMARY_LORDSHIP'],
        effect: 'SUPPORT',
        expressionHints: ['MANAGEMENT'],
        relatedHouses: [10],
        relatedPlanets: [],
        conditional: false,
        statement: 'Saturn is 10L.'
      };

      const mockRelevance2: CareerPlanetaryRelevance = {
        planet: Planet.VENUS,
        relevance: 'NEUTRAL',
        roles: [],
        reasons: [],
        effect: 'NEUTRAL',
        expressionHints: [],
        relatedHouses: [],
        relatedPlanets: [],
        conditional: false,
        statement: 'Venus has no career relevance.'
      };

      const mockNatal: any = {
        structural: {
          direction: 'SUPPORT',
          strength: 'STRONG',
          primarySupport: 3,
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
          statement: 'Test'
        },
        relevance: [mockRelevance1, mockRelevance2],
        condition: [],
        lordRelationships: [],
        direction: 'SUPPORT' as ReasoningDirection,
        strength: 'STRONG' as DomainStrength,
        evidence: [],
        conflicts: [],
        reasoningTrace: { primaryPromise: [], secondarySupport: [], modifiers: [], yogas: [], varga: [], dasha: [], transit: [] } as ReasoningTrace
      };

      const input: CareerExpressionIntegrationInput = { natal: mockNatal };
      const context = buildCareerExpressionContext(input);

      expect(context.relevantPlanets).toHaveLength(1);
      expect(context.relevantPlanets[0].planet).toBe(Planet.SATURN);
    });
  });
});
