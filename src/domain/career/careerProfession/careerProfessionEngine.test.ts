import { describe, expect, it } from 'vitest';
import type {
  CareerProfessionInput,
  CareerProfessionAnalysis
} from './careerProfessionTypes';
import type {
  CareerExpressionAnalysisResult,
  CareerExpressionCandidate,
  CareerExpressionProvenance
} from '../careerExpression/careerExpressionTypes';
import type {
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismProvenance,
  CareerMechanismType,
  CareerMechanismPathway
} from '../careerMechanism/careerMechanismTypes';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';
import type {
  CareerD10CanonicalAnalysis
} from '../careerD10/careerD10CanonicalTypes';
import type {
  DomainEvidence
} from '../../interpretation/DomainEvidence';
import { buildCareerProfessionAnalysis } from './careerProfessionEngine';

describe('Career Profession Engine (P2-10A)', () => {
  describe('Spec §7.A: Explicit-rule-only emission', () => {
    it('should emit candidates only for rules that match', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].domain).toBe('LEADERSHIP');
      expect(result.candidates[0].family).toBe('EXECUTIVE_MANAGEMENT');
    });

    it('should not emit candidates for expression types with no matching rule', () => {
      const expressions = createMockExpressionAnalysisResult([]);

      const mechanisms = [
        createMockMechanismCandidate('AGENCY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // AGENCY mechanism has no matching profession rule, so no candidate emitted
      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('Spec §7.B: No planet→profession mapping', () => {
    it('should not map planets directly to profession domains', () => {
      // This is enforced by the boundary test, but we verify the engine
      // doesn't create profession candidates from raw planet data
      const expressions = createMockExpressionAnalysisResult([]);

      const mechanisms: CareerMechanismCandidate[] = [];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('Spec §7.C: No cross-pattern combination', () => {
    it('should not combine mechanisms/expressions from different patterns', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_1'),
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_2')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('INNOVATION', 'PATTERN_1'),
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_2')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit separate candidates for each pattern
      // PATTERN_1: INNOVATION → TECHNOLOGY/TECHNICAL_LEADERSHIP
      // PATTERN_2: AUTHORITY → LEADERSHIP/EXECUTIVE_MANAGEMENT
      expect(result.candidates).toHaveLength(2);

      // Verify candidates are pattern-scoped
      const pattern1Candidate = result.candidates.find(c => c.patternIds.includes('PATTERN_1'));
      const pattern2Candidate = result.candidates.find(c => c.patternIds.includes('PATTERN_2'));

      expect(pattern1Candidate).toBeDefined();
      expect(pattern2Candidate).toBeDefined();
      expect(pattern1Candidate!.patternIds).toEqual(['PATTERN_1']);
      expect(pattern2Candidate!.patternIds).toEqual(['PATTERN_2']);
    });

    it('should preserve candidate identity with source-pattern set', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_1'),
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_2')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('INNOVATION', 'PATTERN_1'),
        createMockMechanismCandidate('INNOVATION', 'PATTERN_2')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit separate candidates even though they have the same domain/family
      // because they come from different patterns
      expect(result.candidates).toHaveLength(2);

      const candidateIds = result.candidates.map(c => c.candidateId);
      expect(new Set(candidateIds).size).toBe(2); // Distinct IDs
    });
  });

  describe('Spec §7.D: Source-mechanism-supports-expression check', () => {
    it('should verify that source mechanisms support the expression', () => {
      const expressions = createMockExpressionAnalysisResult([]);

      const mechanisms = [
        createMockMechanismCandidate('INNOVATION', 'PATTERN_1'),
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].mechanismTypes).toContain('INNOVATION');
      expect(result.candidates[0].mechanismTypes).toContain('AUTHORITY');
    });
  });

  describe('Spec §7.E: D10 cannot create candidates', () => {
    it('should not create profession candidates from D10 alone', () => {
      const expressions = createMockExpressionAnalysisResult([]);

      const mechanisms: CareerMechanismCandidate[] = [];

      const mockD10Analysis: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'STRONG' as any,
        natalStrength: 'STRONG' as any,
        d10Effect: 'REINFORCES',
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        qualifiedDirection: 'SUPPORT',
        qualifiedStrength: 'STRONG',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: [],
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 analysis'
      };

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation(),
        careerD10CanonicalAnalysis: mockD10Analysis
      };

      const result = buildCareerProfessionAnalysis(input);

      // D10 alone should not create any candidates
      expect(result.candidates).toHaveLength(0);
      expect(result.status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('Spec §7.F: D10 only qualifies existing candidates', () => {
    it('should mark candidates as UNAVAILABLE when D10 identity namespaces are not reconciled', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms: CareerMechanismCandidate[] = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const mockD10Analysis: CareerD10CanonicalAnalysis = {
        availability: 'AVAILABLE',
        natalDirection: 'STRONG' as any,
        natalStrength: 'STRONG' as any,
        d10Effect: 'REINFORCES',
        d10Direction: 'SUPPORT',
        d10Strength: 'STRONG',
        qualifiedDirection: 'SUPPORT',
        qualifiedStrength: 'STRONG',
        natalPromisePreserved: true,
        relationship: 'REINFORCES',
        evidence: [],
        conflicts: [],
        expressionQualifications: [],
        rootEvidenceIds: [],
        statement: 'D10 analysis'
      };

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation(),
        careerD10CanonicalAnalysis: mockD10Analysis
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      // D10 is provided but identity namespaces are not reconciled
      expect(result.candidates[0].d10Status).toBe('UNAVAILABLE');
    });

    it('should mark candidates as NOT_PROVIDED when D10 is missing', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms: CareerMechanismCandidate[] = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
        // No careerD10CanonicalAnalysis
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].d10Status).toBe('NOT_PROVIDED');
    });
  });

  describe('Spec §7.G: Missing-D10/10H/10L not negative', () => {
    it('should not treat missing D10 as negative evidence', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
        // No careerD10CanonicalAnalysis
      };

      const result = buildCareerProfessionAnalysis(input);

      // Candidate should still be emitted
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].d10Status).toBe('NOT_PROVIDED');
      expect(result.status).toBe('PARTIAL'); // PARTIAL due to missing D10, not INSUFFICIENT_DATA
    });

    it('should not treat missing 10H/10L as negative evidence', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms
        // No career10HFoundation or career10LFoundation
      };

      const result = buildCareerProfessionAnalysis(input);

      // Candidate should still be emitted
      expect(result.candidates).toHaveLength(1);
      expect(result.status).toBe('PARTIAL');
      expect(result.missingInputs).toContain('career10HFoundation');
      expect(result.missingInputs).toContain('career10LFoundation');
    });
  });

  describe('Spec §7.H: Unreferenced DomainEvidence cannot create candidates', () => {
    it('should not create candidates from unreferenced DomainEvidence', () => {
      const expressions = createMockExpressionAnalysisResult([]);

      const mechanisms: CareerMechanismCandidate[] = [];

      const unreferencedDomainEvidence: DomainEvidence = {
        id: 'DOMAIN_EVIDENCE_1',
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Unreferenced evidence',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        relatedEvidenceIds: [] // Not related to any source
      };

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        domainEvidence: [unreferencedDomainEvidence]
      };

      const result = buildCareerProfessionAnalysis(input);

      // Unreferenced DomainEvidence should not create candidates
      expect(result.candidates).toHaveLength(0);
    });

    it('should only include DomainEvidence related to candidate sources', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms: CareerMechanismCandidate[] = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const referencedDomainEvidence: DomainEvidence = {
        id: 'DOMAIN_EVIDENCE_1',
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Referenced evidence',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        relatedEvidenceIds: ['EXPR:AUTHORITY_EXPRESSION:MECH1'] // Related to expression
      };

      const unreferencedDomainEvidence: DomainEvidence = {
        id: 'DOMAIN_EVIDENCE_2',
        sourceType: 'PLANET',
        domain: 'CAREER',
        role: 'PRIMARY',
        phase: 'NATAL_PROMISE',
        source: 'D1',
        statement: 'Unreferenced evidence',
        polarity: 'SUPPORTING',
        strength: 'STRONG',
        priority: 1,
        relatedEvidenceIds: []
      };

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation(),
        domainEvidence: [referencedDomainEvidence, unreferencedDomainEvidence]
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      // Only referenced evidence should be included
      expect(result.candidates[0].domainEvidenceIds).toContain('DOMAIN_EVIDENCE_1');
      expect(result.candidates[0].domainEvidenceIds).not.toContain('DOMAIN_EVIDENCE_2');
    });
  });

  describe('Spec §7.I: ID-namespace separation', () => {
    it('should keep evidenceIds, sourceIds, and ruleIds in separate namespaces', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(result.candidates).toHaveLength(1);
      const candidate = result.candidates[0];

      // Evidence IDs should have EVID: prefix
      const evidenceIds = candidate.evidence.map(e => e.evidenceId);
      expect(evidenceIds.every(id => id.startsWith('EVID:'))).toBe(true);

      // Source IDs should be from upstream (mechanism/expression IDs)
      const sourceIds = candidate.evidence.flatMap(e => e.sourceIds);
      expect(sourceIds.every(id => !id.startsWith('EVID:') && !id.startsWith('PROF:'))).toBe(true);

      // Rule ID should be the rule ID
      expect(candidate.ruleId).toBe('RULE_PROFESSION_AUTHORITY');

      // Provenance should have separate namespaces
      expect(result.provenance.evidenceIds).toBeDefined();
      expect(result.provenance.sourceIds).toBeDefined();
      expect(result.provenance.ruleIds).toBeDefined();
    });
  });

  describe('Spec §7.J: Conflicting candidates preserved', () => {
    it('should preserve conflicting candidates from different rules', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1'),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1'),
        createMockMechanismCandidate('LEADERSHIP', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Both AUTHORITY and LEADERSHIP map to LEADERSHIP/EXECUTIVE_MANAGEMENT
      // but they should be preserved as separate candidates if they have different rule IDs
      expect(result.candidates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Spec §7.K: Determinism under permutation', () => {
    it('should produce identical results under input permutation', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1'),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_2'),
        createMockExpressionCandidate('TEACHING_EXPRESSION', 'PATTERN_3')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1'),
        createMockMechanismCandidate('LEADERSHIP', 'PATTERN_2'),
        createMockMechanismCandidate('TEACHING', 'PATTERN_3')
      ];

      const input1: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const input2: CareerProfessionInput = {
        expressions: {
          ...expressions,
          expressions: [...expressions.expressions].reverse()
        },
        mechanisms: [...mechanisms].reverse(),
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result1 = buildCareerProfessionAnalysis(input1);
      const result2 = buildCareerProfessionAnalysis(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Spec §7.L: Immutability/no input mutation', () => {
    it('should not modify input expressions', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const originalExpressionId = expressions.expressions[0].expressionId;

      const input: CareerProfessionInput = {
        expressions,
        mechanisms: [createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      buildCareerProfessionAnalysis(input);

      expect(expressions.expressions[0].expressionId).toBe(originalExpressionId);
    });

    it('should not modify input mechanisms', () => {
      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const originalCandidateId = mechanisms[0].candidateId;

      const input: CareerProfessionInput = {
        expressions: createMockExpressionAnalysisResult([
          createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
        ]),
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      buildCareerProfessionAnalysis(input);

      expect(mechanisms[0].candidateId).toBe(originalCandidateId);
    });

    it('should return frozen output', () => {
      const input: CareerProfessionInput = {
        expressions: createMockExpressionAnalysisResult([
          createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
        ]),
        mechanisms: [createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.candidates)).toBe(true);
      expect(Object.isFrozen(result.unresolvedExpressionTypes)).toBe(true);
      expect(Object.isFrozen(result.mappedTypes)).toBe(true);
      expect(Object.isFrozen(result.missingInputs)).toBe(true);
      expect(Object.isFrozen(result.provenance)).toBe(true);
    });
  });

  describe('Spec §7.M: Unresolved expression-type reporting', () => {
    it('should report expression types with no matching rule', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // AUTHORITY_EXPRESSION has a matching rule, so unresolved should be empty
      expect(result.unresolvedExpressionTypes).toHaveLength(0);
    });

    it('should compute mappedTypes from actually consumed expression types', () => {
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1'),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_1')
      ]);

      const mechanisms = [
        createMockMechanismCandidate('AUTHORITY', 'PATTERN_1'),
        createMockMechanismCandidate('LEADERSHIP', 'PATTERN_1')
      ];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Both AUTHORITY_EXPRESSION and LEADERSHIP_EXPRESSION are consumed
      expect(result.mappedTypes).toContain('AUTHORITY_EXPRESSION');
      expect(result.mappedTypes).toContain('LEADERSHIP_EXPRESSION');
    });
  });
});

// Helper function to create mock expression analysis result
function createMockExpressionAnalysisResult(
  expressions: CareerExpressionCandidate[]
): CareerExpressionAnalysisResult {
  const provenance: CareerExpressionProvenance = {
    mechanismIds: expressions.flatMap(e => e.sourceMechanismIds),
    patternIds: expressions.flatMap(e => e.provenance.patternIds),
    relationshipIds: expressions.flatMap(e => e.provenance.relationshipIds),
    evidenceIds: expressions.flatMap(e => e.provenance.evidenceIds),
    sourceStages: ['PATTERN']
  };

  return {
    expressions,
    status: expressions.length > 0 ? 'COMPLETE' : 'INSUFFICIENT_DATA',
    sourceMechanismIds: expressions.flatMap(e => e.sourceMechanismIds),
    missingInputs: [],
    unmappedMechanismTypes: [],
    provenance
  };
}

// Helper function to create mock expression candidate
function createMockExpressionCandidate(
  expressionType: string,
  patternId: string
): CareerExpressionCandidate {
  const expressionId = `EXPR:${expressionType}:MECH1`;

  const provenance: CareerExpressionProvenance = {
    mechanismIds: ['MECH1'],
    patternIds: [patternId],
    relationshipIds: [],
    evidenceIds: ['EVID1'],
    sourceStages: ['PATTERN']
  };

  return {
    expressionId,
    expressionType: expressionType as any,
    sourceMechanismIds: ['MECH1'],
    mechanismTypes: ['AUTHORITY' as CareerMechanismType],
    status: 'CANDIDATE',
    pathway: 'PATTERN' as any,
    evidence: [],
    provenance
  };
}

// Helper function to create mock mechanism candidate
function createMockMechanismCandidate(
  mechanismType: string,
  patternId: string
): CareerMechanismCandidate {
  const candidateId = `CAREER_MECHANISM_CANDIDATE:${patternId}:${mechanismType}`;

  const evidence: CareerMechanismEvidence[] = [
    {
      evidenceId: `EVIDENCE_1:${patternId}`,
      mechanismType: mechanismType as CareerMechanismType,
      source: 'PATTERN',
      role: 'ESTABLISHING',
      participantIds: [],
      relationshipIds: [],
      patternId,
      explanation: 'Mock evidence'
    }
  ];

  const provenance: CareerMechanismProvenance = {
    patternIds: [patternId],
    relationshipIds: [],
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
  return {
    lagnaContext: {
      referencePoint: 'LAGNA',
      referenceHouseNumber: 10,
      referenceHouseSign: 'CAPRICORN' as any,
      lagnaRelativeHouseNumber: 10,
      house10Lord: 'SATURN' as any,
      lordHouse: 10,
      occupants: [],
      aspectsOn10H: [],
      aspectDataStatus: 'AVAILABLE',
      provenance: {
        houseLordshipEvidenceId: 'HOUSE_LORDSHIP_EVIDENCE_1',
        sourceHouseIndex: 10,
        drishtiSource: {
          reportPresent: true,
          aspectCount: 0
        },
        drishtiAspectIds: []
      }
    },
    moonContext: null
  };
}

// Helper function to create minimal typed 10L foundation fixture
function createMock10LFoundation(): Career10LFoundation {
  return {
    lagnaContext: {
      referencePoint: 'LAGNA',
      house10Lord: 'SATURN' as any,
      lordHouse: 10,
      condition: {
        status: 'AVAILABLE',
        dignity: 'OWN_SIGN' as any,
        motion: 'DIRECT' as any,
        combustion: 'NOT_COMBUST' as any,
        sign: 'CAPRICORN' as any,
        house: 10,
        sourceRuleIds: ['PLANET_ANALYSIS_RULE_1']
      },
      relationships: [],
      relationshipDataStatus: 'UNAVAILABLE',
      provenance: {
        house10ContextRef: 'LAGNA',
        conditionSourceIds: ['PLANET_ANALYSIS_RULE_1'],
        relationshipIds: []
      }
    },
    moonContext: null
  };
}
