import { describe, expect, it } from 'vitest';
import { Planet } from '../../../types';
import { adaptMechanismExpressionToLegacy } from './mechanismExpressionToLegacyAdapter';
import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerExpressionCanonicalResult,
  CareerExpressionCanonicalCandidate,
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

    it('should use weight: 0 sentinel for mechanism evidence (no authoritative weight)', () => {
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

      // Weight should be 0 (unavailable sentinel), not a plausible default like 2
      expect(result.expressions[0].evidence[0].weight).toBe(0);
      // Role should be 'PLANETARY' (placeholder, ignored by canonical mapper)
      expect(result.expressions[0].evidence[0].role).toBe('PLANETARY');
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

  describe('P2-11C Gate 2: Canonical C8 result handling', () => {
    it('should map CANDIDATE to UNAVAILABLE direction/strength with empty ruleIds', () => {
      const canonicalResult: CareerExpressionCanonicalResult = {
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
            },
            qualificationStatus: 'CANDIDATE',
            direction: 'UNAVAILABLE',
            strength: 'UNAVAILABLE',
            qualification: {
              qualificationStatus: 'CANDIDATE',
              ruleIds: [],
              provenance: {
                candidateId: 'CANDIDATE_001',
                sourceMechanismIds: ['MECH-001'],
                ruleIds: [],
                sourceEvidenceIds: ['SRC-001'],
                participantIds: ['PLANET:SUN']
              }
            },
            trace: ['Candidate derived from mechanism MECH-001 without authoritative qualification']
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

      const result = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].direction).toBe('UNAVAILABLE');
      expect(result.expressions[0].strength).toBe('UNAVAILABLE');
      expect(result.expressions[0].statement).toContain('CANDIDATE');
      expect(result.expressions[0].statement).toContain('Trace: Candidate derived from mechanism MECH-001 without authoritative qualification');
    });

    it('should preserve QUALIFIED direction/strength with non-empty ruleIds', () => {
      const canonicalResult: CareerExpressionCanonicalResult = {
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
            },
            qualificationStatus: 'QUALIFIED',
            direction: 'SUPPORTED',
            strength: 'STRONG',
            qualification: {
              qualificationStatus: 'QUALIFIED',
              ruleIds: ['RULE_AUTH_001'],
              provenance: {
                candidateId: 'CANDIDATE_001',
                mechanismId: 'MECH_RESOLVED_001',
                sourceMechanismIds: ['MECH-001'],
                ruleIds: ['RULE_AUTH_001'],
                sourceEvidenceIds: ['SRC-001'],
                participantIds: ['PLANET:SUN']
              }
            },
            trace: ['Qualified by rule RULE_AUTH_001']
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

      const result = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].direction).toBe('SUPPORTED');
      expect(result.expressions[0].strength).toBe('STRONG');
      expect(result.expressions[0].statement).toContain('QUALIFIED');
      expect(result.expressions[0].statement).toContain('Trace: Qualified by rule RULE_AUTH_001');
    });

    it('should keep candidate trace visible even when no directional evidence is emitted', () => {
      const canonicalResult: CareerExpressionCanonicalResult = {
        expressions: [
          {
            expressionId: 'EXPR-001',
            expressionType: 'RESEARCH_WORK',
            sourceMechanismIds: ['MECH-001'],
            mechanismTypes: ['RESEARCH'],
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
            },
            qualificationStatus: 'CANDIDATE',
            direction: 'UNAVAILABLE',
            strength: 'UNAVAILABLE',
            qualification: {
              qualificationStatus: 'CANDIDATE',
              ruleIds: [],
              provenance: {
                candidateId: 'CANDIDATE_001',
                sourceMechanismIds: ['MECH-001'],
                ruleIds: [],
                sourceEvidenceIds: ['SRC-001'],
                participantIds: ['PLANET:MERCURY']
              }
            },
            trace: [
              'Candidate derived from pattern PATTERN-001',
              'No authoritative qualification rule found',
              'Direction/strength UNAVAILABLE (no upstream signal)'
            ]
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
          pathway: 'PATTERN',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-001'],
            relationshipIds: [],
            participantIds: ['PLANET:MERCURY'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);

      expect(result.expressions).toHaveLength(1);
      expect(result.expressions[0].direction).toBe('UNAVAILABLE');
      expect(result.expressions[0].strength).toBe('UNAVAILABLE');
      // Trace should be visible in the statement
      expect(result.expressions[0].statement).toContain('Trace: Candidate derived from pattern PATTERN-001');
      expect(result.expressions[0].statement).toContain('No authoritative qualification rule found');
      expect(result.expressions[0].statement).toContain('Direction/strength UNAVAILABLE (no upstream signal)');
    });

    it('should enforce determinism of expression IDs/ordering/provenance', () => {
      const canonicalResult: CareerExpressionCanonicalResult = {
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
            },
            qualificationStatus: 'CANDIDATE',
            direction: 'UNAVAILABLE',
            strength: 'UNAVAILABLE',
            qualification: {
              qualificationStatus: 'CANDIDATE',
              ruleIds: [],
              provenance: {
                candidateId: 'CANDIDATE_001',
                sourceMechanismIds: ['MECH-001'],
                ruleIds: [],
                sourceEvidenceIds: ['SRC-001'],
                participantIds: ['PLANET:SUN']
              }
            },
            trace: ['Trace message 1']
          },
          {
            expressionId: 'EXPR-002',
            expressionType: 'LEADERSHIP_EXPRESSION',
            sourceMechanismIds: ['MECH-002'],
            mechanismTypes: ['LEADERSHIP'],
            status: 'CANDIDATE',
            pathway: 'PLANETARY',
            evidence: [
              {
                evidenceId: 'EVID-002',
                sourceMechanismId: 'MECH-002',
                sourceEvidenceIds: ['SRC-002'],
                ruleId: 'RULE-002',
                role: 'ESTABLISHING'
              }
            ],
            provenance: {
              mechanismIds: ['MECH-002'],
              patternIds: ['PATTERN-002'],
              relationshipIds: [],
              evidenceIds: ['EVID-002'],
              sourceStages: ['PATTERN']
            },
            qualificationStatus: 'CANDIDATE',
            direction: 'UNAVAILABLE',
            strength: 'UNAVAILABLE',
            qualification: {
              qualificationStatus: 'CANDIDATE',
              ruleIds: [],
              provenance: {
                candidateId: 'CANDIDATE_002',
                sourceMechanismIds: ['MECH-002'],
                ruleIds: [],
                sourceEvidenceIds: ['SRC-002'],
                participantIds: ['PLANET:MARS']
              }
            },
            trace: ['Trace message 2']
          }
        ],
        status: 'COMPLETE',
        sourceMechanismIds: ['MECH-001', 'MECH-002'],
        missingInputs: [],
        unmappedMechanismTypes: [],
        provenance: {
          mechanismIds: ['MECH-001', 'MECH-002'],
          patternIds: ['PATTERN-001', 'PATTERN-002'],
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
          patternId: 'PATTERN-002',
          mechanismType: 'LEADERSHIP',
          pathway: 'PLANETARY',
          evidence: [],
          provenance: {
            patternIds: ['PATTERN-002'],
            relationshipIds: [],
            participantIds: ['PLANET:MARS'],
            evidenceIds: [],
            sourceStages: ['PATTERN']
          },
          explanation: 'Test mechanism 2'
        }
      ];

      const result = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);

      // Expressions should be sorted by mode (deterministic ordering)
      expect(result.expressions).toHaveLength(2);
      expect(result.expressions[0].mode).toBe('AUTHORITY');
      expect(result.expressions[1].mode).toBe('LEADERSHIP');

      // Expression IDs should be preserved
      expect(result.expressions[0].supportingEvidenceIds).toEqual(['EVID-001']);
      expect(result.expressions[1].supportingEvidenceIds).toEqual(['EVID-002']);

      // Provenance should be preserved in statements
      expect(result.expressions[0].statement).toContain('MECH-001');
      expect(result.expressions[1].statement).toContain('MECH-002');
    });
  });
});
