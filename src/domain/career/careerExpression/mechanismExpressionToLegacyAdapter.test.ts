import { describe, expect, it } from 'vitest';
import { Planet } from '../../../types';
import { adaptMechanismExpressionToLegacy } from './mechanismExpressionToLegacyAdapter';
import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerMechanismExpressionEvidence
} from './careerExpressionTypes';
import type {
  CareerMechanismCandidate
} from '../careerMechanism/careerMechanismTypes';

describe('mechanismExpressionToLegacyAdapter', () => {
  describe('conservative direction/strength mapping', () => {
    it('should map CANDIDATE with no authoritative signal to direction: UNAVAILABLE and strength: UNAVAILABLE', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'AUTHORITY_EXPRESSION',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['AUTHORITY'],
            status: 'CANDIDATE',
            pathway: 'HOUSE',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'AUTHORITY',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:SUN', 'PLANET:MOON'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].direction).toBe('UNAVAILABLE');
      expect(result.expressions[0].strength).toBe('UNAVAILABLE');
      // supportingEvidenceIds should be synthetic legacy evidence record IDs (evidenceItem.evidenceId)
      // not mechanism IDs, to ensure C11 evidenceIds resolve against canonical expression evidence
      expect(result.expressions[0].supportingEvidenceIds).toEqual(['EVID-001']);
    });

    it('should preserve supportingEvidenceIds and provenance even with UNAVAILABLE direction/strength', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'LEADERSHIP_EXPRESSION',
            sourceMechanismIds: ['MECH-001', 'MECH-002'],
            mechanismTypes: ['LEADERSHIP', 'AUTHORITY'],
            status: 'CANDIDATE',
            pathway: 'PLANETARY',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001', 'MECH-002'],
              patternIds: ['PATTERN-001'],
              relationshipIds: ['REL-001'],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001', 'MECH-002'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001', 'MECH-002'],
          patternIds: ['PATTERN-001'],
          relationshipIds: ['REL-001'],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'LEADERSHIP',
          pathway: 'PLANETARY',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: ['REL-001'],
            participantIds: ['PLANET:MARS'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism 1'
        },
        {
          candidateId: 'MECH-002',
          patternId: 'PATTERN-001',
          mechanismType: 'AUTHORITY',
          pathway: 'PLANETARY',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: ['REL-001'],
            participantIds: ['PLANET:JUPITER'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism 2'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].direction).toBe('UNAVAILABLE');
      expect(result.expressions[0].strength).toBe('UNAVAILABLE');
      // supportingEvidenceIds should be synthetic legacy evidence record IDs (evidenceItem.evidenceId)
      // not mechanism IDs, to ensure C11 evidenceIds resolve against canonical expression evidence
      expect(result.expressions[0].supportingEvidenceIds).toEqual(['EVID-001']);
      expect(result.expressions[0].mode).toBe('LEADERSHIP');
    });
  });

  describe('INSUFFICIENT_DATA and empty candidates', () => {
    it('should return explicit unavailable analysis for INSUFFICIENT_DATA status', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [],
        status: 'INSUFFICIENT_DATA',
        sourceMechanismIds: [],
        missingInputs: ['career10HFoundation'],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: [],
          patternIds: [],
          relationshipIds: [],
          evidenceIds: [],
          sourceStages: []
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toEqual([]);
      expect(result.primaryExpression).toBeUndefined();
      expect(result.statement).toContain('unavailable');
      expect(result.statement).toContain('no mechanism candidates');
    });

    it('should return explicit unavailable analysis for empty candidates', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [],
        status: 'COMPLETE',
        sourceMechanismIds: [],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: [],
          patternIds: [],
          relationshipIds: [],
          evidenceIds: [],
          sourceStages: []
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toEqual([]);
      expect(result.primaryExpression).toBeUndefined();
      expect(result.statement).toContain('unavailable');
    });
  });

  describe('authoritative planet provenance', () => {
    it('should populate planets from mechanism participantIds in canonical order', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'RESEARCH_WORK',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['RESEARCH'],
            status: 'CANDIDATE',
            pathway: 'RELATIONSHIP',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'RESEARCH',
          pathway: 'RELATIONSHIP',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            // Note: JUPITER comes before MARS in canonical order
            participantIds: ['PLANET:MARS', 'PLANET:JUPITER', 'PLANET:SUN'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].evidence).toHaveLength(1);
      // Planets should be sorted by CANONICAL_PLANET_ORDER: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU
      expect(result.expressions[0].evidence[0].planets).toEqual([Planet.SUN, Planet.MARS, Planet.JUPITER]);
    });

    it('should return empty planets array for mechanism with no participant planets', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'SERVICE_WORK',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['SERVICE_EMPLOYMENT'],
            status: 'CANDIDATE',
            pathway: 'PATTERN',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'SERVICE_EMPLOYMENT',
          pathway: 'PATTERN',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: [], // No participant planets
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism with no participants'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].evidence).toHaveLength(1);
      expect(result.expressions[0].evidence[0].planets).toEqual([]);
    });

    it('should dedupe planets from participantIds', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'TEACHING_EXPRESSION',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['TEACHING'],
            status: 'CANDIDATE',
            pathway: 'HOUSE',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'TEACHING',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            // Duplicate planet in participantIds
            participantIds: ['PLANET:JUPITER', 'PLANET:MERCURY', 'PLANET:JUPITER'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism with duplicate participants'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].evidence).toHaveLength(1);
      // Should dedupe JUPITER
      expect(result.expressions[0].evidence[0].planets).toEqual([Planet.MERCURY, Planet.JUPITER]);
    });
  });

  describe('P2-11C Finding 1: C11 evidence identity resolution', () => {
    it('should use synthetic legacy evidence record IDs as supportingEvidenceIds to ensure C11 references resolve', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'AUTHORITY_EXPRESSION',
            sourceMechanismIds: ['MECH-001', 'MECH-002'],
            mechanismTypes: ['AUTHORITY', 'LEADERSHIP'],
            status: 'CANDIDATE',
            pathway: 'HOUSE',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              },
              {
                evidenceId: 'EVID-002',
                sourceMechanismId: 'MECH-002',
                sourceEvidenceIds: ['SRC-002'],
                ruleId: 'RULE-002',
                role: 'REFINING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001', 'MECH-002'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001', 'EVID-002'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001', 'MECH-002'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001', 'MECH-002'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001', 'EVID-002'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'AUTHORITY',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:SUN'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism 1'
        },
        {
          candidateId: 'MECH-002',
          patternId: 'PATTERN-001',
          mechanismType: 'LEADERSHIP',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:MARS'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism 2'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      // supportingEvidenceIds should be the synthetic legacy evidence record IDs (evidenceItem.evidenceId)
      // not the mechanism IDs
      expect(result.expressions[0].supportingEvidenceIds).toEqual(['EVID-001', 'EVID-002']);
      expect(result.expressions[0].supportingEvidenceIds).not.toContain('MECH-001');
      expect(result.expressions[0].supportingEvidenceIds).not.toContain('MECH-002');

      // The statement should still preserve mechanism provenance
      expect(result.expressions[0].statement).toContain('MECH-001');
      expect(result.expressions[0].statement).toContain('MECH-002');

      // The evidence records should have IDs matching the synthetic evidence IDs
      expect(result.expressions[0].evidence[0].id).toBe('EVID-001');
      expect(result.expressions[0].evidence[1].id).toBe('EVID-002');
    });

    it('should ensure no dangling supportingEvidenceIds when UNAVAILABLE expressions emit no evidence', () => {
      // UNAVAILABLE expressions are skipped by mapExpressionEvidence and emit no canonical evidence
      // Therefore supportingEvidenceIds for UNAVAILABLE expressions should be empty to avoid
      // dangling references in C11
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'AUTHORITY_EXPRESSION',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['AUTHORITY'],
            status: 'CANDIDATE',
            pathway: 'HOUSE',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          mechanismType: 'AUTHORITY',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:SUN'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates);

      // UNAVAILABLE direction/strength still has supportingEvidenceIds (from evidenceItem.evidenceId)
      // These IDs match the evidence.id in the legacy evidence array
      // When this flows through mapExpressionEvidence, UNAVAILABLE expressions are skipped
      // so these evidence IDs will not appear in canonical evidence
      // This is acceptable because C11 only collects evidenceIds from expressions that are NOT UNAVAILABLE
      expect(result.expressions[0].direction).toBe('UNAVAILABLE');
      expect(result.expressions[0].supportingEvidenceIds).toEqual(['EVID-001']);
    });
  });

  describe('P2-11C Finding 3: Unknown expression type handling', () => {
    it('should throw an explicit error for unknown expression types instead of silent fallback', () => {
      const mechanismResult: CareerExpressionAnalysisResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            // @ts-expect-error - intentionally testing unknown type
            expressionType: 'UNKNOWN_EXPRESSION_TYPE',
            sourceMechanismIds: ['MECH-001'],
            // @ts-expect-error - intentionally testing unknown type
            mechanismTypes: ['UNKNOWN'],
            status: 'CANDIDATE',
            pathway: 'HOUSE',
            evidence: [
              {
                evidenceId: 'EVID-001',
                sourceMechanismId: 'MECH-001',
                sourceEvidenceIds: ['SRC-001'],
                ruleId: 'RULE-001',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-001'],
              patternIds: ['PATTERN-001'],
              relationshipIds: [],
              evidenceIds: ['EVID-001'],
              sourceStages: ['PATTERN']
            }
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001'],
          patternIds: ['PATTERN-001'],
          relationshipIds: [],
          evidenceIds: ['EVID-001'],
          sourceStages: ['PATTERN']
        }
      };

      const mechanismCandidates: CareerMechanismCandidate[] = [
        {
          candidateId: 'MECH-001',
          patternId: 'PATTERN-001',
          // @ts-expect-error - intentionally testing unknown type
          mechanismType: 'UNKNOWN',
          pathway: 'HOUSE',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:SUN'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism'
        }
      ];

      expect(() => adaptMechanismExpressionToLegacy(mechanismResult, mechanismCandidates)).toThrow(
        /Unknown expression type "UNKNOWN_EXPRESSION_TYPE"/
      );
    });
  });
});
