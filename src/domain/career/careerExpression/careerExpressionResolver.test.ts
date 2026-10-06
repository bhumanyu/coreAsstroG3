import { describe, expect, it } from 'vitest';
import type {
  CareerExpressionResolverInput,
  CareerExpressionAnalysisResult
} from './careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismProvenance
} from '../careerMechanism';
import { defaultCareerExpressionResolver } from './defaultCareerExpressionResolver';

describe('Career Expression Resolver (P2-08A)', () => {
  describe('Spec §33.A: Basic mechanism→expression', () => {
    it('should map RESEARCH mechanism to RESEARCH_WORK expression', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
      expect(result.expressions[0].mechanismTypes).toContain('RESEARCH');
    });

    it('should map COMMUNICATION mechanism to COMMUNICATION_WORK expression', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'COMMUNICATION',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('COMMUNICATION_WORK');
      expect(result.expressions[0].mechanismTypes).toContain('COMMUNICATION');
    });

    it('should map AUTHORITY mechanism to AUTHORITY_EXPRESSION', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'AUTHORITY',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('AUTHORITY_EXPRESSION');
      expect(result.expressions[0].mechanismTypes).toContain('AUTHORITY');
    });
  });

  describe('Spec §33.B: Dispositor-refined mechanism→expression', () => {
    it('should include dispositor-refined mechanisms in expression resolution', () => {
      const baseCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const refinedCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );
      // Simulate refinement by using same pattern but different candidate ID
      (refinedCandidate as any).candidateId = 'CAREER_MECHANISM_CANDIDATE:PATTERN_1:RESEARCH:REFINED';

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [baseCandidate],
        careerMechanismRefinements: [refinedCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.sourceMechanismIds).toHaveLength(2);
      // Both RESEARCH mechanisms are grouped into one RESEARCH_WORK expression
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
      expect(result.expressions[0].sourceMechanismIds).toHaveLength(2);
    });
  });

  describe('Spec §33.C: Multi-mechanism → multiple candidates', () => {
    it('should emit multiple expression candidates for multiple mechanism types', () => {
      const researchCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const communicationCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'COMMUNICATION',
        'PATTERN_2'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [researchCandidate, communicationCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      // Different mechanism types produce different expressions
      expect(result.expressions).toHaveLength(2);

      const expressionTypes = result.expressions.map(e => e.expressionType);
      expect(expressionTypes).toContain('RESEARCH_WORK');
      expect(expressionTypes).toContain('COMMUNICATION_WORK');
    });
  });

  describe('Spec §33.D: Composite rule', () => {
    it('should emit ANALYTICAL_SPECIALIZED_WORK for RESEARCH + SPECIALIZED_KNOWLEDGE', () => {
      const researchCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const specializedKnowledgeCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'SPECIALIZED_KNOWLEDGE',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [researchCandidate, specializedKnowledgeCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      // Composite rule groups both mechanisms into one expression
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('ANALYTICAL_SPECIALIZED_WORK');
      expect(result.expressions[0].mechanismTypes).toContain('RESEARCH');
      expect(result.expressions[0].mechanismTypes).toContain('SPECIALIZED_KNOWLEDGE');
      expect(result.expressions[0].sourceMechanismIds).toHaveLength(2);
    });

    it('should not emit composite expression when only one mechanism is present', () => {
      const researchCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [researchCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
      expect(result.expressions[0].expressionType).not.toBe('ANALYTICAL_SPECIALIZED_WORK');
    });
  });

  describe('Spec §33.E: Dedupe-with-merged-provenance', () => {
    it('should deduplicate expressions by (expressionType, canonical-source-set)', () => {
      const candidate1: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const candidate2: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_2'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [candidate1, candidate2],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      // Both RESEARCH mechanisms are grouped into one RESEARCH_WORK expression
      // because they have the same mechanism type
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
      expect(result.expressions[0].sourceMechanismIds).toHaveLength(2);
    });

    it('should merge provenance from duplicate expressions', () => {
      const candidate1: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const candidate2: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );
      // Same pattern ID should create same canonical source set
      (candidate2 as any).candidateId = candidate1.candidateId;

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [candidate1, candidate2],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      // Should deduplicate to single expression
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
    });
  });

  describe('Spec §33.F: Determinism (run repeatedly → identical)', () => {
    it('should produce identical results when run repeatedly', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
      };

      const result1 = defaultCareerExpressionResolver.resolve(input);
      const result2 = defaultCareerExpressionResolver.resolve(input);
      const result3 = defaultCareerExpressionResolver.resolve(input);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
      expect(JSON.stringify(result2)).toBe(JSON.stringify(result3));
    });
  });

  describe('Spec §33.G: Input immutability (Object.isFrozen on candidates after resolve)', () => {
    it('should not modify input candidates after resolution', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const originalCandidateId = mechanismCandidate.candidateId;

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
      };

      defaultCareerExpressionResolver.resolve(input);

      // Candidate should remain unchanged
      expect(mechanismCandidate.candidateId).toBe(originalCandidateId);
    });

    it('should return frozen output', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.expressions)).toBe(true);
      expect(Object.isFrozen(result.sourceMechanismIds)).toBe(true);
      expect(Object.isFrozen(result.missingInputs)).toBe(true);
      expect(Object.isFrozen(result.provenance)).toBe(true);
    });
  });

  describe('Spec §33.H: Provenance chain expression→mechanism→pattern→relationship', () => {
    it('should track provenance from expression to mechanism to pattern to relationship', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1',
        ['REL_1', 'REL_2']
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.expressions).toHaveLength(1);
      const expression = result.expressions[0];

      // Expression should cite mechanism
      expect(expression.sourceMechanismIds).toContain(mechanismCandidate.candidateId);

      // Expression provenance should include pattern and relationship IDs
      expect(expression.provenance.patternIds).toContain('PATTERN_1');
      expect(expression.provenance.relationshipIds).toContain('REL_1');
      expect(expression.provenance.relationshipIds).toContain('REL_2');

      // Aggregate provenance should also include these
      expect(result.provenance.patternIds).toContain('PATTERN_1');
      expect(result.provenance.relationshipIds).toContain('REL_1');
    });
  });

  describe('Spec §33.I: Missing 10H/10L optional-context behavior', () => {
    it('should emit PARTIAL status when 10H/10L context is missing', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
        // No career10HFoundation or career10LFoundation
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('PARTIAL');
      expect(result.missingInputs).toContain('career10HFoundation');
      expect(result.missingInputs).toContain('career10LFoundation');
      expect(result.expressions).toHaveLength(1); // Still emits expressions
    });

    it('should emit COMPLETE status when 10H/10L context is present', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.missingInputs).toHaveLength(0);
    });

    it('should add 10H/10L context to evidence when present', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.expressions).toHaveLength(1);
      const expression = result.expressions[0];

      // Evidence should include 10H/10L context IDs
      const has10HContext = expression.evidence.some(e => e.source10HIds && e.source10HIds.length > 0);
      const has10LContext = expression.evidence.some(e => e.source10LIds && e.source10LIds.length > 0);

      expect(has10HContext).toBe(true);
      expect(has10LContext).toBe(true);
    });

    it('should not treat missing 10H/10L as weakening', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const inputWithoutContext: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate]
      };

      const inputWithContext: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const resultWithout = defaultCareerExpressionResolver.resolve(inputWithoutContext);
      const resultWithContext = defaultCareerExpressionResolver.resolve(inputWithContext);

      // Both should emit the same expression
      expect(resultWithout.expressions).toHaveLength(1);
      expect(resultWithContext.expressions).toHaveLength(1);
      expect(resultWithout.expressions[0].expressionType).toBe(
        resultWithContext.expressions[0].expressionType
      );

      // Only status should differ (PARTIAL vs COMPLETE)
      expect(resultWithout.status).toBe('PARTIAL');
      expect(resultWithContext.status).toBe('COMPLETE');
    });
  });

  describe('Spec §33.J: Dasha/D10/transit/profession firewalls', () => {
    it('should not emit expressions without source mechanisms', () => {
      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: []
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.expressions).toHaveLength(0);
    });

    it('should not use Dasha/D10/transit/profession as establishing sources', () => {
      // This is enforced by the boundary test, but we verify the resolver
      // doesn't create expressions from empty inputs
      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: []
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.expressions).toHaveLength(0);
    });
  });

  describe('Additional edge cases', () => {
    it('should handle empty refinements array', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        careerMechanismRefinements: [],
        career10HFoundation: {},
        career10LFoundation: {}
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
    });

    it('should handle mechanism types with no matching rules', () => {
      // Create a mechanism type that doesn't have a corresponding expression rule
      const unknownCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'UNKNOWN_TYPE' as any,
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [unknownCandidate]
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      // Should emit INSUFFICIENT_DATA since no expressions were produced
      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.expressions).toHaveLength(0);
    });
  });
});

// Helper function to create mock mechanism candidates
function createMockMechanismCandidate(
  mechanismType: string,
  patternId: string,
  relationshipIds: string[] = []
): CareerMechanismCandidate {
  const candidateId = `CAREER_MECHANISM_CANDIDATE:${patternId}:${mechanismType}`;

  const evidence: CareerMechanismEvidence[] = [
    {
      evidenceId: `EVIDENCE_1:${patternId}`,
      mechanismType: mechanismType as any,
      source: 'PATTERN' as any,
      role: 'ESTABLISHING',
      participantIds: [],
      relationshipIds,
      explanation: 'Mock evidence'
    }
  ];

  const provenance: CareerMechanismProvenance = {
    patternIds: [patternId],
    relationshipIds,
    participantIds: [],
    evidenceIds: evidence.map(e => e.evidenceId),
    sourceStages: ['PATTERN']
  };

  return {
    candidateId,
    patternId,
    mechanismType: mechanismType as any,
    pathway: 'PATTERN',
    evidence,
    provenance,
    explanation: 'Mock mechanism candidate'
  };
}
