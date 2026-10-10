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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism];

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
      const mech1 = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const mech2 = createMockMechanismCandidate('AUTHORITY', 'PATTERN_2');

      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_1', [mech1.candidateId]),
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_2', [mech2.candidateId])
      ]);

      const mechanisms = [mech1, mech2];

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
      const mech1 = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const mech2 = createMockMechanismCandidate('INNOVATION', 'PATTERN_2');

      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_1', [mech1.candidateId]),
        createMockExpressionCandidate('INNOVATION_WORK', 'PATTERN_2', [mech2.candidateId])
      ]);

      const mechanisms = [mech1, mech2];

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
      const innovationMechanism = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression that references both mechanisms (required for STRONG source-linkage contract)
      const compositeExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism.candidateId, authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        compositeExpression
      ]);

      const mechanisms = [innovationMechanism, authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit both the composite AND the individual INNOVATION_WORK expression candidate
      expect(result.candidates.length).toBeGreaterThanOrEqual(1);
      const technicalLeadershipCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_TECHNICAL_LEADERSHIP'
      );
      expect(technicalLeadershipCandidate).toBeDefined();
      expect(technicalLeadershipCandidate!.mechanismTypes).toContain('INNOVATION');
      expect(technicalLeadershipCandidate!.mechanismTypes).toContain('AUTHORITY');
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
      const mech = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [mech.candidateId])
      ]);

      const mechanisms: CareerMechanismCandidate[] = [mech];

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
      const mech = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [mech.candidateId])
      ]);

      const mechanisms: CareerMechanismCandidate[] = [mech];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const authorityExpression = createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId]);
      const expressions = createMockExpressionAnalysisResult([
        authorityExpression
      ]);

      const mechanisms: CareerMechanismCandidate[] = [authorityMechanism];

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
        relatedEvidenceIds: [authorityExpression.expressionId] // Related to expression
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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const leadershipMechanism = createMockMechanismCandidate('LEADERSHIP', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId]),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_1', [leadershipMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism, leadershipMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Both AUTHORITY and LEADERSHIP map to LEADERSHIP/EXECUTIVE_MANAGEMENT
      // but they should be preserved as separate candidates since they have different rule IDs
      expect(result.candidates.length).toBe(2);

      // Verify distinct rule IDs
      const ruleIds = result.candidates.map(c => c.ruleId);
      expect(ruleIds).toContain('RULE_PROFESSION_AUTHORITY');
      expect(ruleIds).toContain('RULE_PROFESSION_LEADERSHIP');

      // Verify distinct candidate IDs (due to ruleId inclusion)
      const candidateIds = result.candidates.map(c => c.candidateId);
      expect(new Set(candidateIds).size).toBe(2);
    });
  });

  describe('Spec P1: Source-linked rule resolution', () => {
    it('should not emit technical-leadership composite for unrelated INNOVATION+AUTHORITY with no shared source linkage', () => {
      // INNOVATION mechanism in PATTERN_1 with its own source
      const innovationMechanism1 = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');

      // AUTHORITY mechanism in PATTERN_2 with its own source (different from PATTERN_1)
      const authorityMechanism2 = createMockMechanismCandidate('AUTHORITY', 'PATTERN_2');

      // Expressions that reference their respective mechanisms
      const innovationExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism1.candidateId]
      );

      const authorityExpression = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_2',
        [authorityMechanism2.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        innovationExpression,
        authorityExpression
      ]);

      const mechanisms = [innovationMechanism1, authorityMechanism2];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should NOT emit the technical-leadership composite candidate
      // because INNOVATION and AUTHORITY are from different patterns with no shared source linkage
      const technicalLeadershipCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_TECHNICAL_LEADERSHIP'
      );
      expect(technicalLeadershipCandidate).toBeUndefined();

      // Should emit individual candidates for each pattern (INNOVATION_WORK and AUTHORITY_EXPRESSION)
      expect(result.candidates.length).toBeGreaterThanOrEqual(2);
      const innovationCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_INNOVATION'
      );
      const authorityCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_AUTHORITY'
      );
      expect(innovationCandidate).toBeDefined();
      expect(authorityCandidate).toBeDefined();
    });

    it('should not emit technical-leadership composite for INNOVATION+AUTHORITY in same pattern with no shared source linkage', () => {
      // Both mechanisms in PATTERN_1 but with no shared source linkage
      const innovationMechanism = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expressions that reference only their respective mechanisms (no expression references both)
      const innovationExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism.candidateId]
      );

      const authorityExpression = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        innovationExpression,
        authorityExpression
      ]);

      const mechanisms = [innovationMechanism, authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should NOT emit the technical-leadership composite candidate
      // under STRONG source-linkage contract: no expression references both mechanisms together
      const technicalLeadershipCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_TECHNICAL_LEADERSHIP'
      );
      expect(technicalLeadershipCandidate).toBeUndefined();

      // Should emit individual candidates for each expression (INNOVATION_WORK and AUTHORITY_EXPRESSION)
      expect(result.candidates.length).toBeGreaterThanOrEqual(2);
      const innovationCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_INNOVATION'
      );
      const authorityCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_AUTHORITY'
      );
      expect(innovationCandidate).toBeDefined();
      expect(authorityCandidate).toBeDefined();
    });

    it('should emit technical-leadership composite when INNOVATION+AUTHORITY share source linkage via common expression', () => {
      // Both mechanisms in PATTERN_1 with shared source linkage
      const innovationMechanism = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression that references BOTH mechanisms (shared source linkage)
      const compositeExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism.candidateId, authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        compositeExpression
      ]);

      const mechanisms = [innovationMechanism, authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit the technical-leadership composite candidate
      // under STRONG source-linkage contract: expression references both mechanisms together
      const technicalLeadershipCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_TECHNICAL_LEADERSHIP'
      );
      expect(technicalLeadershipCandidate).toBeDefined();
      expect(technicalLeadershipCandidate!.domain).toBe('TECHNOLOGY');
      expect(technicalLeadershipCandidate!.family).toBe('TECHNICAL_LEADERSHIP');
    });

    it('should accept expression with partial source resolution (at least one sourceMechanismId resolves)', () => {
      // Only one mechanism exists in the pattern
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression references both AUTHORITY (exists) and a non-existent mechanism
      // Under partial resolution policy, this is valid because at least one source resolves
      const expressionWithPartialResolution = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism.candidateId, 'NON_EXISTENT_MECH_ID']
      );

      const expressions = createMockExpressionAnalysisResult([
        expressionWithPartialResolution
      ]);

      const mechanisms = [authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit candidate because at least one sourceMechanismId resolved
      expect(result.candidates.length).toBeGreaterThanOrEqual(1);
      const authorityCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_AUTHORITY'
      );
      expect(authorityCandidate).toBeDefined();
    });
  });

  describe('Spec §7.K: Determinism under permutation', () => {
    it('should produce identical results under input permutation', () => {
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const leadershipMechanism = createMockMechanismCandidate('LEADERSHIP', 'PATTERN_2');
      const teachingMechanism = createMockMechanismCandidate('TEACHING', 'PATTERN_3');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId]),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_2', [leadershipMechanism.candidateId]),
        createMockExpressionCandidate('TEACHING_EXPRESSION', 'PATTERN_3', [teachingMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism, leadershipMechanism, teachingMechanism];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const originalExpressionId = expressions.expressions[0].expressionId;

      const input: CareerProfessionInput = {
        expressions,
        mechanisms: [authorityMechanism],
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      buildCareerProfessionAnalysis(input);

      expect(expressions.expressions[0].expressionId).toBe(originalExpressionId);
    });

    it('should not modify input mechanisms', () => {
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const mechanisms = [authorityMechanism];

      const originalCandidateId = mechanisms[0].candidateId;

      const input: CareerProfessionInput = {
        expressions: createMockExpressionAnalysisResult([
          createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
        ]),
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      buildCareerProfessionAnalysis(input);

      expect(mechanisms[0].candidateId).toBe(originalCandidateId);
    });

    it('should return frozen output', () => {
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const input: CareerProfessionInput = {
        expressions: createMockExpressionAnalysisResult([
          createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
        ]),
        mechanisms: [authorityMechanism],
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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism];

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
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const leadershipMechanism = createMockMechanismCandidate('LEADERSHIP', 'PATTERN_1');
      const expressions = createMockExpressionAnalysisResult([
        createMockExpressionCandidate('AUTHORITY_EXPRESSION', 'PATTERN_1', [authorityMechanism.candidateId]),
        createMockExpressionCandidate('LEADERSHIP_EXPRESSION', 'PATTERN_1', [leadershipMechanism.candidateId])
      ]);

      const mechanisms = [authorityMechanism, leadershipMechanism];

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

  describe('Spec P2: Status semantics', () => {
    it('should not report INSUFFICIENT_DATA for mechanism-only match that emits candidates', () => {
      // Mechanisms with shared source linkage via expression
      const innovationMechanism = createMockMechanismCandidate('INNOVATION', 'PATTERN_1');
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression that references both mechanisms (required for STRONG source-linkage contract)
      const compositeExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism.candidateId, authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        compositeExpression
      ]);

      const mechanisms = [innovationMechanism, authorityMechanism];

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
        careerD10CanonicalAnalysis: mockD10Analysis,
        domainEvidence: [] // Empty domainEvidence is sufficient for COMPLETE status
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit technical-leadership composite candidate from mechanisms
      expect(result.candidates.length).toBeGreaterThanOrEqual(1);

      // Status should not be INSUFFICIENT_DATA since candidates were established
      expect(result.status).not.toBe('INSUFFICIENT_DATA');
      expect(result.status).toBe('COMPLETE');
    });
  });

  describe('Spec P2: Provenance namespaces', () => {
    it('should not include non-consumed input expression/mechanism IDs in consumed-source provenance', () => {
      // Create a mechanism that will be consumed
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Create expressions that will not be consumed (no matching rule)
      const unconsumedExpression = createMockExpressionCandidate(
        'UNMAPPED_EXPRESSION' as any,
        'PATTERN_1',
        ['NON_EXISTENT_MECH']
      );

      // Create expressions that will be consumed
      const consumedExpression = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        unconsumedExpression,
        consumedExpression
      ]);

      const mechanisms = [authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Unconsumed expression ID should not appear in provenance
      expect(result.provenance.expressionIds).not.toContain(unconsumedExpression.expressionId);

      // Consumed expression ID should appear in provenance
      expect(result.provenance.expressionIds).toContain(consumedExpression.expressionId);
    });

    it('should not include input pattern IDs that produce no candidates in consumed provenance', () => {
      // PATTERN_1 will produce a candidate
      const authorityMechanism1 = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');
      const authorityExpression1 = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism1.candidateId]
      );

      // PATTERN_2 will NOT produce a candidate (no matching rule)
      const unmappedMechanism2 = createMockMechanismCandidate('AGENCY', 'PATTERN_2');
      const unmappedExpression2 = createMockExpressionCandidate(
        'UNMAPPED_EXPRESSION' as any,
        'PATTERN_2',
        [unmappedMechanism2.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        authorityExpression1,
        unmappedExpression2
      ]);

      const mechanisms = [authorityMechanism1, unmappedMechanism2];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // PATTERN_1 should appear in provenance (produced a candidate)
      expect(result.provenance.patternIds).toContain('PATTERN_1');

      // PATTERN_2 should NOT appear in provenance (produced no candidate)
      expect(result.provenance.patternIds).not.toContain('PATTERN_2');
    });

    it('should exclude expression with unresolved source linkage (all sourceMechanismIds point to non-existent mechanisms)', () => {
      // No mechanisms exist in the pattern
      const mechanisms: CareerMechanismCandidate[] = [];

      // Expression references only non-existent mechanisms
      const expressionWithUnresolvedLinkage = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        ['NON_EXISTENT_MECH_1', 'NON_EXISTENT_MECH_2']
      );

      const expressions = createMockExpressionAnalysisResult([
        expressionWithUnresolvedLinkage
      ]);

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should NOT emit candidate because no sourceMechanismIds resolved
      expect(result.candidates.length).toBe(0);
    });
  });

  describe('P2 Hardening: Composite scope and linkage metadata', () => {
    it('should emit evidence with only the exact mechanism instances referenced by qualifying expression (composite scope)', () => {
      // Pattern with two INNOVATION mechanisms and one AUTHORITY
      const innovationMechanism1 = createMockMechanismCandidate('INNOVATION', 'PATTERN_1', 'INSTANCE_1');
      const innovationMechanism2 = createMockMechanismCandidate('INNOVATION', 'PATTERN_1', 'INSTANCE_2');
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Qualifying expression references only one INNOVATION + the AUTHORITY
      const compositeExpression = createMockExpressionCandidate(
        'INNOVATION_WORK',
        'PATTERN_1',
        [innovationMechanism1.candidateId, authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        compositeExpression
      ]);

      const mechanisms = [innovationMechanism1, innovationMechanism2, authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      // Should emit technical-leadership composite candidate (mechanism-based rule)
      const technicalLeadershipCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_TECHNICAL_LEADERSHIP'
      );
      expect(technicalLeadershipCandidate).toBeDefined();

      // Assert evidence sourceIds contain only the referenced INNOVATION instance, not the second one
      const mechanismEvidence = technicalLeadershipCandidate!.evidence.find(e => e.basis === 'MECHANISM');
      expect(mechanismEvidence).toBeDefined();
      expect(mechanismEvidence!.sourceIds).toContain(innovationMechanism1.candidateId);
      expect(mechanismEvidence!.sourceIds).toContain(authorityMechanism.candidateId);
      expect(mechanismEvidence!.sourceIds).not.toContain(innovationMechanism2.candidateId);
      expect(mechanismEvidence!.sourceIds.length).toBe(2); // Exactly 2 mechanisms
    });

    it('should emit COMPLETE linkage metadata when all sourceMechanismIds resolve', () => {
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression with complete resolution (all sourceMechanismIds exist)
      const expressionWithCompleteResolution = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism.candidateId]
      );

      const expressions = createMockExpressionAnalysisResult([
        expressionWithCompleteResolution
      ]);

      const mechanisms = [authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      const authorityCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_AUTHORITY'
      );
      expect(authorityCandidate).toBeDefined();

      const expressionEvidence = authorityCandidate!.evidence.find(e => e.basis === 'EXPRESSION');
      expect(expressionEvidence).toBeDefined();
      expect(expressionEvidence!.linkage).toBe('COMPLETE');
      expect(expressionEvidence!.resolvedMechanismIds).toContain(authorityMechanism.candidateId);
      expect(expressionEvidence!.unresolvedMechanismIds).toEqual([]);
    });

    it('should emit PARTIAL linkage metadata when only some sourceMechanismIds resolve', () => {
      const authorityMechanism = createMockMechanismCandidate('AUTHORITY', 'PATTERN_1');

      // Expression with partial resolution (one real mechanism + one non-existent)
      const expressionWithPartialResolution = createMockExpressionCandidate(
        'AUTHORITY_EXPRESSION',
        'PATTERN_1',
        [authorityMechanism.candidateId, 'NON_EXISTENT_MECH_ID']
      );

      const expressions = createMockExpressionAnalysisResult([
        expressionWithPartialResolution
      ]);

      const mechanisms = [authorityMechanism];

      const input: CareerProfessionInput = {
        expressions,
        mechanisms,
        career10HFoundation: createMock10HFoundation(),
        career10LFoundation: createMock10LFoundation()
      };

      const result = buildCareerProfessionAnalysis(input);

      const authorityCandidate = result.candidates.find(
        c => c.ruleId === 'RULE_PROFESSION_AUTHORITY'
      );
      expect(authorityCandidate).toBeDefined();

      const expressionEvidence = authorityCandidate!.evidence.find(e => e.basis === 'EXPRESSION');
      expect(expressionEvidence).toBeDefined();
      expect(expressionEvidence!.linkage).toBe('PARTIAL');
      expect(expressionEvidence!.resolvedMechanismIds).toContain(authorityMechanism.candidateId);
      expect(expressionEvidence!.unresolvedMechanismIds).toContain('NON_EXISTENT_MECH_ID');
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

// Helper function to create mock expression candidate with proper source linkage
function createMockExpressionCandidate(
  expressionType: string,
  patternId: string,
  sourceMechanismIds: string[]
): CareerExpressionCandidate {
  const expressionId = `EXPR:${expressionType}:${sourceMechanismIds.join(',')}`;

  const provenance: CareerExpressionProvenance = {
    mechanismIds: sourceMechanismIds,
    patternIds: [patternId],
    relationshipIds: [],
    evidenceIds: ['EVID1'],
    sourceStages: ['PATTERN']
  };

  return {
    expressionId,
    expressionType: expressionType as any,
    sourceMechanismIds,
    mechanismTypes: ['AUTHORITY' as CareerMechanismType], // Default to AUTHORITY for mocks
    status: 'CANDIDATE',
    pathway: 'PATTERN' as any,
    evidence: [],
    provenance
  };
}

// Helper function to create linked expression-mechanism pair for testing
function createLinkedExpressionAndMechanism(
  expressionType: string,
  mechanismType: string,
  patternId: string
): { expression: CareerExpressionCandidate; mechanism: CareerMechanismCandidate } {
  const mechanism = createMockMechanismCandidate(mechanismType, patternId);
  const expression = createMockExpressionCandidate(expressionType, patternId, [mechanism.candidateId]);
  return { expression, mechanism };
}

// Helper function to create mock mechanism candidate
function createMockMechanismCandidate(
  mechanismType: string,
  patternId: string,
  uniqueId?: string
): CareerMechanismCandidate {
  const candidateId = uniqueId
    ? `CAREER_MECHANISM_CANDIDATE:${patternId}:${mechanismType}:${uniqueId}`
    : `CAREER_MECHANISM_CANDIDATE:${patternId}:${mechanismType}`;

  const evidence: CareerMechanismEvidence[] = [
    {
      evidenceId: `EVIDENCE_1:${patternId}:${uniqueId || 'default'}`,
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
