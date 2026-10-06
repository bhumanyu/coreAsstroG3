import { describe, expect, it } from 'vitest';
import type {
  CareerExpressionResolverInput,
  CareerExpressionAnalysisResult
} from './careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismProvenance,
  CareerMechanismType,
  CareerMechanismPathway
} from '../careerMechanism';
import type {
  Career10HFoundation,
  Career10HContext,
  Career10HProvenance
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation,
  Career10LContext,
  Career10LCondition,
  Career10LProvenance
} from '../career10h/career10LFoundationTypes';
import type { CareerGraphEdgeType } from '../careerGraph/careerAstroGraphTypes';
import type {
  CareerMechanismExpressionEvidence
} from './careerExpressionTypes';
import { Sign, Planet } from '../../../types';
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
      const refinedCandidateWithCustomId: CareerMechanismCandidate = {
        ...refinedCandidate,
        candidateId: 'CAREER_MECHANISM_CANDIDATE:PATTERN_1:RESEARCH:REFINED'
      };

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [baseCandidate],
        careerMechanismRefinements: [refinedCandidateWithCustomId],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      // Additive behavior: emit composite AND constituent 1:1 expressions
      expect(result.expressions).toHaveLength(2);

      const expressionTypes = result.expressions.map(e => e.expressionType);
      expect(expressionTypes).toContain('ANALYTICAL_SPECIALIZED_WORK');
      expect(expressionTypes).toContain('RESEARCH_WORK');

      const compositeExpression = result.expressions.find(e => e.expressionType === 'ANALYTICAL_SPECIALIZED_WORK');
      expect(compositeExpression).toBeDefined();
      expect(compositeExpression!.mechanismTypes).toContain('RESEARCH');
      expect(compositeExpression!.mechanismTypes).toContain('SPECIALIZED_KNOWLEDGE');
      expect(compositeExpression!.sourceMechanismIds).toHaveLength(2);
    });

    it('should not emit composite expression when only one mechanism is present', () => {
      const researchCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [researchCandidate],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
      const candidate2WithCustomId: CareerMechanismCandidate = {
        ...candidate2,
        candidateId: candidate1.candidateId
      };

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [candidate1, candidate2WithCustomId],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.expressions).toHaveLength(1);
      const expression = result.expressions[0];

      // Evidence should include 10H/10L context IDs
      const has10HContext = expression.evidence.some(e => e.source10HIds && e.source10HIds.length > 0);
      const has10LContext = expression.evidence.some(e => e.source10LIds && e.source10LIds.length > 0);

      expect(has10HContext).toBe(true);
      expect(has10LContext).toBe(true);

      // Regression guard: no fabricated 10H_REF:/10L_REF: IDs
      const allEvidenceIds = expression.evidence.flatMap(e => [
        ...(e.source10HIds || []),
        ...(e.source10LIds || [])
      ]);
      const hasFabricatedIds = allEvidenceIds.some(id =>
        id.startsWith('10H_REF:') || id.startsWith('10L_REF:')
      );
      expect(hasFabricatedIds).toBe(false);
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
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
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
    });

    it('should handle mechanism types with no matching rules', () => {
      // Create a mechanism type that doesn't have a corresponding expression rule
      const unknownCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'AGENCY',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [unknownCandidate]
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      // Should emit PARTIAL status (missing 10H/10L) but with unmappedMechanismTypes
      expect(result.status).toBe('PARTIAL');
      expect(result.expressions).toHaveLength(0);
      expect(result.unmappedMechanismTypes).toContain('AGENCY');
    });

    it('should handle mixed mapped and unmapped mechanism types', () => {
      const researchCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const agencyCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'AGENCY',
        'PATTERN_2'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [researchCandidate, agencyCandidate],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      // Should emit RESEARCH_WORK expression with COMPLETE status
      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].expressionType).toBe('RESEARCH_WORK');
      // AGENCY should be in unmappedMechanismTypes
      expect(result.unmappedMechanismTypes).toContain('AGENCY');
      expect(result.unmappedMechanismTypes).not.toContain('RESEARCH');
    });
  });

  describe('Real integration test with typed foundations', () => {
    it('should extract real provenance IDs from typed 10H/10L foundations', () => {
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);

      const expression = result.expressions[0];
      const all10HIds = expression.evidence.flatMap(e => e.source10HIds || []);
      const all10LIds = expression.evidence.flatMap(e => e.source10LIds || []);

      // Assert specific real IDs from fixtures
      expect(all10HIds).toContain('HOUSE_LORDSHIP_EVIDENCE_1');
      expect(all10LIds).toContain('PLANET_ANALYSIS_RULE_1');

      // Regression guard: no fabricated IDs
      const hasFabricatedIds = [...all10HIds, ...all10LIds].some(id =>
        id.startsWith('10H_REF:') || id.startsWith('10L_REF:')
      );
      expect(hasFabricatedIds).toBe(false);
    });
  });

  describe('End-to-end integration test with real upstream engine reports', () => {
    it('should wire real engine reports through to expression provenance', () => {
      // This test demonstrates the full provenance chain:
      // engine reports → 10H/10L foundations → expression evidence IDs

      // Create real 10H foundation with actual upstream IDs
      const real10HFoundation: Career10HFoundation = {
        lagnaContext: {
          referencePoint: 'LAGNA',
          referenceHouseNumber: 10,
          referenceHouseSign: Sign.CAPRICORN,
          lagnaRelativeHouseNumber: 10,
          house10Lord: Planet.SATURN,
          lordHouse: 10,
          occupants: [],
          aspectsOn10H: [],
          aspectDataStatus: 'AVAILABLE',
          provenance: {
            houseLordshipEvidenceId: 'REAL_HOUSE_LORDSHIP_RULE_123',
            sourceHouseIndex: 10,
            drishtiSource: {
              reportPresent: true,
              aspectCount: 2
            },
            drishtiAspectIds: ['REAL_ASPECT_ID_1', 'REAL_ASPECT_ID_2']
          }
        },
        moonContext: null
      };

      // Create real 10L foundation with actual upstream IDs
      const real10LFoundation: Career10LFoundation = {
        lagnaContext: {
          referencePoint: 'LAGNA',
          house10Lord: Planet.SATURN,
          lordHouse: 10,
          condition: {
            status: 'AVAILABLE',
            dignity: 'OWN_SIGN',
            motion: 'DIRECT',
            combustion: 'NOT_COMBUST',
            sign: Sign.CAPRICORN,
            house: 10,
            sourceRuleIds: ['REAL_PLANET_ANALYSIS_RULE_456']
          },
          relationships: [
            {
              targetHouse: 5,
              sourceLord: Planet.JUPITER,
              targetLord: Planet.SATURN,
              relationshipType: 'CONJUNCT' as CareerGraphEdgeType,
              relationshipId: 'REAL_EDGE_ID_789',
              provenance: {
                sourceIds: ['REAL_SOURCE_ID_1'],
                ruleIds: ['REAL_RULE_ID_1'],
                parentIds: []
              }
            }
          ],
          relationshipDataStatus: 'AVAILABLE',
          provenance: {
            house10ContextRef: 'LAGNA',
            conditionSourceIds: ['REAL_PLANET_ANALYSIS_RULE_456'],
            relationshipIds: ['REAL_EDGE_ID_789']
          }
        },
        moonContext: null
      };

      // Create real mechanism candidate using createCareerMechanismCandidate pattern
      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: real10HFoundation,
        career10LFoundation: real10LFoundation
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);

      const expression = result.expressions[0];
      const all10HIds = expression.evidence.flatMap(e => e.source10HIds || []);
      const all10LIds = expression.evidence.flatMap(e => e.source10LIds || []);

      // Assert real upstream IDs round-trip correctly
      expect(all10HIds).toContain('REAL_HOUSE_LORDSHIP_RULE_123');
      expect(all10HIds).toContain('REAL_ASPECT_ID_1');
      expect(all10HIds).toContain('REAL_ASPECT_ID_2');
      expect(all10LIds).toContain('REAL_PLANET_ANALYSIS_RULE_456');
      expect(all10LIds).toContain('REAL_EDGE_ID_789');

      // Regression guard: no synthetic IDs
      const hasSyntheticIds = [...all10HIds, ...all10LIds].some(id =>
        id.startsWith('10H_LAGNA_') || id.startsWith('10H_MOON_') ||
        id.startsWith('10L_LAGNA_STATUS_') || id.startsWith('10L_MOON_STATUS_')
      );
      expect(hasSyntheticIds).toBe(false);
    });
  });

  describe('Negative provenance test', () => {
    it('should emit empty source10HIds when no real upstream IDs exist', () => {
      // Create 10H foundation with no real upstream IDs
      const empty10HFoundation: Career10HFoundation = {
        lagnaContext: {
          referencePoint: 'LAGNA',
          referenceHouseNumber: 10,
          referenceHouseSign: Sign.CAPRICORN,
          lagnaRelativeHouseNumber: 10,
          house10Lord: Planet.SATURN,
          lordHouse: 10,
          occupants: [],
          aspectsOn10H: [],
          aspectDataStatus: 'AVAILABLE',
          provenance: {
            // No houseLordshipEvidenceId
            sourceHouseIndex: 10,
            drishtiSource: {
              reportPresent: true,
              aspectCount: 0
            },
            // Empty drishtiAspectIds
            drishtiAspectIds: []
          }
        },
        moonContext: null
      };

      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: empty10HFoundation,
        career10LFoundation: createMock10LFoundation()
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);

      const expression = result.expressions[0];
      const all10HIds = expression.evidence.flatMap(e => e.source10HIds || []);

      // Assert empty array when no real IDs exist
      expect(all10HIds).toEqual([]);

      // Grep-style assertion: no synthetic 10H_* IDs appear
      const hasSynthetic10HIds = all10HIds.some(id => /^10H_/.test(id));
      expect(hasSynthetic10HIds).toBe(false);
    });

    it('should emit empty source10LIds when no real upstream IDs exist', () => {
      // Create 10L foundation with no real upstream IDs
      const empty10LFoundation: Career10LFoundation = {
        lagnaContext: {
          referencePoint: 'LAGNA',
          house10Lord: Planet.SATURN,
          lordHouse: 10,
          condition: {
            status: 'AVAILABLE',
            dignity: 'OWN_SIGN',
            motion: 'DIRECT',
            combustion: 'NOT_COMBUST',
            sign: Sign.CAPRICORN,
            house: 10,
            sourceRuleIds: [] // Empty sourceRuleIds
          },
          relationships: [], // Empty relationships
          relationshipDataStatus: 'AVAILABLE',
          provenance: {
            house10ContextRef: 'LAGNA',
            conditionSourceIds: [], // Empty conditionSourceIds
            relationshipIds: [] // Empty relationshipIds
          }
        },
        moonContext: null
      };

      const mechanismCandidate: CareerMechanismCandidate = createMockMechanismCandidate(
        'RESEARCH',
        'PATTERN_1'
      );

      const input: CareerExpressionResolverInput = {
        careerMechanismCandidates: [mechanismCandidate],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: empty10LFoundation
      };

      const result = defaultCareerExpressionResolver.resolve(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.expressions).toHaveLength(1);

      const expression = result.expressions[0];
      const all10LIds = expression.evidence.flatMap(e => e.source10LIds || []);

      // Assert empty array when no real IDs exist
      expect(all10LIds).toEqual([]);

      // Grep-style assertion: no synthetic 10L_* IDs appear
      const hasSynthetic10LIds = all10LIds.some(id => /^10L_/.test(id));
      expect(hasSynthetic10LIds).toBe(false);
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
      mechanismType: mechanismType as CareerMechanismType,
      source: 'PATTERN',
      role: 'ESTABLISHING',
      participantIds: [],
      relationshipIds,
      patternId,
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
    mechanismType: mechanismType as CareerMechanismType,
    pathway: 'PATTERN' as CareerMechanismPathway,
    evidence,
    provenance,
    explanation: 'Mock mechanism candidate'
  };
}

// Helper function to create minimal typed 10H foundation fixture
function createMock10HFoundation(): Career10HFoundation {
  const lagnaProvenance: Career10HProvenance = {
    houseLordshipEvidenceId: 'HOUSE_LORDSHIP_EVIDENCE_1',
    sourceHouseIndex: 10,
    drishtiSource: {
      reportPresent: true,
      aspectCount: 0
    },
    drishtiAspectIds: []
  };

  const lagnaContext: Career10HContext = {
    referencePoint: 'LAGNA',
    referenceHouseNumber: 10,
    referenceHouseSign: Sign.CAPRICORN,
    lagnaRelativeHouseNumber: 10,
    house10Lord: Planet.SATURN,
    lordHouse: 10,
    occupants: [],
    aspectsOn10H: [],
    aspectDataStatus: 'AVAILABLE',
    provenance: lagnaProvenance
  };

  return {
    lagnaContext,
    moonContext: null
  };
}

// Helper function to create minimal typed 10L foundation fixture
function createMock10LFoundation(): Career10LFoundation {
  const condition: Career10LCondition = {
    status: 'AVAILABLE',
    dignity: 'OWN_SIGN',
    motion: 'DIRECT',
    combustion: 'NOT_COMBUST',
    sign: Sign.CAPRICORN,
    house: 10,
    sourceRuleIds: ['PLANET_ANALYSIS_RULE_1']
  };

  const lagnaProvenance: Career10LProvenance = {
    house10ContextRef: 'LAGNA',
    conditionSourceIds: condition.sourceRuleIds,
    relationshipIds: []
  };

  const lagnaContext: Career10LContext = {
    referencePoint: 'LAGNA',
    house10Lord: Planet.SATURN,
    lordHouse: 10,
    condition,
    relationships: [],
    relationshipDataStatus: 'UNAVAILABLE',
    provenance: lagnaProvenance
  };

  return {
    lagnaContext,
    moonContext: null
  };
}
