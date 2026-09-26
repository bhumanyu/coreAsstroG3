import {
  createCareerNatalAnalysis,
  EMPTY_CAREER_NATAL_ANALYSIS,
  type CareerNatalAnalysisInput,
  type CareerNatalConflict
} from './careerNatalAnalysis';

import type {
  CareerStructuralReasoning
} from './careerStructuralReasoning';

import type {
  CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

import type {
  CareerPlanetaryConditionResult
} from './careerPlanetaryCondition';

import type {
  CareerLordRelationshipSemantic
} from './careerLordRelationshipSemantics';

import type {
  ReasoningDirection,
  DomainStrength,
  WeightedReasoningEvidence,
  ReasoningTrace
} from '../reasoning/reasoningTypes';

describe('CareerNatalAnalysis', () => {
  const mockStructural: CareerStructuralReasoning = {
    direction: 'SUPPORT',
    strength: 'STRONG',
    primarySupport: 10,
    primaryChallenge: 2,
    supportingSupport: 5,
    supportingChallenge: 1,
    challengingSupport: 1,
    challengingChallenge: 3,
    mixedWeight: 0,
    evidence: [],
    primaryEvidenceIds: ['ev1'],
    supportingEvidenceIds: ['ev2'],
    challengingEvidenceIds: ['ev3'],
    conflicts: [],
    statement: 'Test structural statement'
  };

  const mockRelevance: CareerPlanetaryRelevance[] = [];

  const mockCondition: CareerPlanetaryConditionResult[] = [];

  const mockLordRelationships: CareerLordRelationshipSemantic[] = [];

  const mockEvidence: WeightedReasoningEvidence[] = [
    {
      identityKey: 'test-key-1',
      evidenceId: 'ev1',
      ruleId: 'RULE_1',
      layer: 'PRIMARY_PROMISE',
      direction: 'SUPPORT',
      strength: 'STRONG',
      priority: 1,
      weight: 3,
      statement: 'Test evidence 1',
      relatedEvidenceIds: [],
      sourceIds: ['src1']
    }
  ];

  const mockConflicts: CareerNatalConflict[] = [
    {
      identityKey: 'conflict-1',
      supportingEvidenceIds: ['ev1'],
      challengingEvidenceIds: ['ev2'],
      supportWeight: 5,
      challengeWeight: 3,
      ratio: 0.375,
      statement: 'Test conflict statement'
    }
  ];

  const mockReasoningTrace: ReasoningTrace = {
    primaryPromise: mockEvidence,
    secondarySupport: [],
    modifiers: [],
    yogas: [],
    varga: [],
    dasha: [],
    transit: []
  };

  const mockInput: CareerNatalAnalysisInput = {
    structural: mockStructural,
    relevance: mockRelevance,
    condition: mockCondition,
    lordRelationships: mockLordRelationships,
    direction: 'SUPPORT' as ReasoningDirection,
    strength: 'STRONG' as DomainStrength,
    evidence: mockEvidence,
    conflicts: mockConflicts,
    reasoningTrace: mockReasoningTrace
  };

  describe('Construction', () => {
    it('should return an object whose sections equal the input sections', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(result.structural).toEqual(mockInput.structural);
      expect(result.relevance).toEqual(mockInput.relevance);
      expect(result.condition).toEqual(mockInput.condition);
      expect(result.lordRelationships).toEqual(mockInput.lordRelationships);
      expect(result.direction).toEqual(mockInput.direction);
      expect(result.strength).toEqual(mockInput.strength);
      expect(result.evidence).toEqual(mockInput.evidence);
      expect(result.conflicts).toEqual(mockInput.conflicts);
      expect(result.reasoningTrace).toEqual(mockInput.reasoningTrace);
    });
  });

  describe('Preservation', () => {
    it('should preserve direction, strength, evidence, conflicts, and reasoningTrace', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(result.direction).toBe('SUPPORT');
      expect(result.strength).toBe('STRONG');
      expect(result.evidence).toEqual(mockEvidence);
      expect(result.conflicts).toEqual(mockConflicts);
      expect(result.reasoningTrace).toEqual(mockReasoningTrace);
    });

    it('should preserve new conflict fields (supportWeight, challengeWeight, ratio, statement)', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(result.conflicts[0].supportWeight).toBe(5);
      expect(result.conflicts[0].challengeWeight).toBe(3);
      expect(result.conflicts[0].ratio).toBe(0.375);
      expect(result.conflicts[0].statement).toBe('Test conflict statement');
    });
  });

  describe('Immutability', () => {
    it('should return a frozen object', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should copy array fields to prevent downstream mutation', () => {
      const result = createCareerNatalAnalysis(mockInput);

      // Array fields should be different references
      expect(result.evidence).not.toBe(mockInput.evidence);
      expect(result.conflicts).not.toBe(mockInput.conflicts);

      // But should have equal content
      expect(result.evidence).toEqual(mockInput.evidence);
      expect(result.conflicts).toEqual(mockInput.conflicts);
    });

    it('should prevent mutation of returned evidence array', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(() => {
        (result.evidence as any).push({} as WeightedReasoningEvidence);
      }).toThrow();
    });

    it('should prevent mutation of returned conflicts array', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(() => {
        (result.conflicts as any).push({} as CareerNatalConflict);
      }).toThrow();
    });

    it('should freeze reasoningTrace output', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(Object.isFrozen(result.reasoningTrace)).toBe(true);
    });

    it('should prevent mutation of reasoningTrace.primaryPromise', () => {
      const result = createCareerNatalAnalysis(mockInput);

      expect(() => {
        (result.reasoningTrace.primaryPromise as any).push({} as WeightedReasoningEvidence);
      }).toThrow();
    });
  });

  describe('Empty-state', () => {
    it('should have empty arrays for all array fields', () => {
      expect(EMPTY_CAREER_NATAL_ANALYSIS.relevance).toEqual([]);
      expect(EMPTY_CAREER_NATAL_ANALYSIS.condition).toEqual([]);
      expect(EMPTY_CAREER_NATAL_ANALYSIS.lordRelationships).toEqual([]);
      expect(EMPTY_CAREER_NATAL_ANALYSIS.evidence).toEqual([]);
      expect(EMPTY_CAREER_NATAL_ANALYSIS.conflicts).toEqual([]);
    });

    it('should have non-negative direction (NEUTRAL, not CHALLENGE)', () => {
      expect(EMPTY_CAREER_NATAL_ANALYSIS.direction).toBe('NEUTRAL');
      expect(EMPTY_CAREER_NATAL_ANALYSIS.direction).not.toBe('CHALLENGE');
    });

    it('should be frozen', () => {
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS)).toBe(true);
    });

    it('should have deep-immutable array fields', () => {
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.relevance)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.condition)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.lordRelationships)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.evidence)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.conflicts)).toBe(true);
    });

    it('should have deep-immutable reasoningTrace', () => {
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.primaryPromise)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.secondarySupport)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.modifiers)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.yogas)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.varga)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.dasha)).toBe(true);
      expect(Object.isFrozen(EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.transit)).toBe(true);
    });

    it('should prevent mutation of reasoningTrace.dasha', () => {
      expect(() => {
        (EMPTY_CAREER_NATAL_ANALYSIS.reasoningTrace.dasha as any).push({});
      }).toThrow();
    });
  });

  describe('Architectural negative check', () => {
    it('should not have dasha field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('dasha' in result).toBe(false);
    });

    it('should not have activation field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('activation' in result).toBe(false);
    });

    it('should not have activePlanets field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('activePlanets' in result).toBe(false);
    });

    it('should not have d10 field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('d10' in result).toBe(false);
    });

    it('should not have d10Qualification field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('d10Qualification' in result).toBe(false);
    });

    it('should not have dasamsa field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('dasamsa' in result).toBe(false);
    });

    it('should not have transit field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('transit' in result).toBe(false);
    });

    it('should not have timing field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('timing' in result).toBe(false);
    });

    it('should not have transitStrength field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('transitStrength' in result).toBe(false);
    });

    it('should not have expression field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('expression' in result).toBe(false);
    });

    it('should not have manifestation field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('manifestation' in result).toBe(false);
    });

    it('should not have expressionMode field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('expressionMode' in result).toBe(false);
    });

    it('should not have finalConclusion field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('finalConclusion' in result).toBe(false);
    });

    it('should not have summary field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('summary' in result).toBe(false);
    });

    it('should not have careerOutcome field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('careerOutcome' in result).toBe(false);
    });

    it('should not have recommendation field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('recommendation' in result).toBe(false);
    });

    it('should not have careerScore field', () => {
      const result = createCareerNatalAnalysis(mockInput);
      expect('careerScore' in result).toBe(false);
    });
  });
});
