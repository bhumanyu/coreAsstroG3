import { describe, it, expect } from 'vitest';
import type { DomainInterpretation } from '../../domain/interpretation';
import type {
  CareerFinalSynthesisResult,
  CareerFinalStatus,
  CareerFinalDirection,
  CareerFinalStrength,
  CareerFinalConfidence,
  CareerFinalTimingStatus
} from '../../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';
import type {
  CareerProfessionAnalysis,
  CareerProfessionCandidate,
  CareerProfessionEvidence,
  CareerProfessionD10Status,
  CareerProfessionDomain,
  CareerProfessionFamily,
  CareerProfessionBasis
} from '../../domain/career/careerProfession/careerProfessionTypes';
import type { CareerExpressionType } from '../../domain/career/careerExpression/careerExpressionTypes';
import type {
  CareerD10QualificationEffect,
  CareerDashaActivationEffect
} from '../../domain/career';
import {
  projectCanonicalCareerC11,
  projectCareerProfessionAnalysis,
  isCareerFinalSynthesisResult
} from './careerIntelligenceProjection';

describe('careerIntelligenceProjection', () => {
  describe('isCareerFinalSynthesisResult', () => {
    it('should return true for valid canonical C11 result', () => {
      const validC11: CareerFinalSynthesisResult = {
        reasoningVersion: 'C11',
        domain: 'CAREER',
        finalStatus: 'SUPPORTED' as CareerFinalStatus,
        finalDirection: 'SUPPORT' as CareerFinalDirection,
        finalStrength: 'STRONG' as CareerFinalStrength,
        confidence: 'HIGH' as CareerFinalConfidence,
        natalDirection: 'SUPPORT' as CareerFinalDirection,
        natalStrength: 'STRONG' as CareerFinalStrength,
        expressionStatus: 'SUPPORT' as CareerFinalDirection,
        d10Direction: 'SUPPORT' as CareerFinalDirection,
        d10Effect: 'QUALIFIES' as CareerD10QualificationEffect,
        dashaEffect: 'ACTIVATES' as CareerDashaActivationEffect,
        dashaDirection: 'SUPPORT' as CareerFinalDirection,
        timingStatus: 'ACTIVE' as CareerFinalTimingStatus,
        transitDirection: 'SUPPORT' as CareerFinalDirection,
        currentPressure: 'LOW',
        expressions: [],
        strongestExpressions: [],
        challengedExpressions: [],
        conflicts: [],
        evidenceIds: [],
        sourceIds: [],
        ruleIds: [],
        evidenceTrace: {
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        },
        statement: 'Test statement'
      };

      expect(isCareerFinalSynthesisResult(validC11)).toBe(true);
    });

    it('should return false for missing reasoningVersion', () => {
      const invalid = { domain: 'CAREER' } as any;
      expect(isCareerFinalSynthesisResult(invalid)).toBe(false);
    });

    it('should return false for wrong reasoningVersion', () => {
      const invalid = { reasoningVersion: 'C10', domain: 'CAREER' } as any;
      expect(isCareerFinalSynthesisResult(invalid)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isCareerFinalSynthesisResult(null)).toBe(false);
      expect(isCareerFinalSynthesisResult(undefined)).toBe(false);
    });

    it('should return false for missing required fields', () => {
      const partial = {
        reasoningVersion: 'C11',
        domain: 'CAREER'
        // Missing finalStatus, finalDirection, etc.
      } as any;
      expect(isCareerFinalSynthesisResult(partial)).toBe(false);
    });
  });

  describe('projectCanonicalCareerC11', () => {
    it('should project valid canonical C11 result', () => {
      const interpretation: DomainInterpretation = {
        domain: 'CAREER',
        conclusionData: {
          canonicalCareerFinalSynthesis: {
            reasoningVersion: 'C11',
            domain: 'CAREER',
            finalStatus: 'SUPPORTED' as CareerFinalStatus,
            finalDirection: 'SUPPORT' as CareerFinalDirection,
            finalStrength: 'STRONG' as CareerFinalStrength,
            confidence: 'HIGH' as CareerFinalConfidence,
            natalDirection: 'SUPPORT' as CareerFinalDirection,
            natalStrength: 'STRONG' as CareerFinalStrength,
            expressionStatus: 'SUPPORT' as CareerFinalDirection,
            d10Direction: 'SUPPORT' as CareerFinalDirection,
            d10Effect: 'QUALIFIES' as CareerD10QualificationEffect,
            dashaEffect: 'ACTIVATES' as CareerDashaActivationEffect,
            dashaDirection: 'SUPPORT' as CareerFinalDirection,
            timingStatus: 'ACTIVE' as CareerFinalTimingStatus,
            transitDirection: 'SUPPORT' as CareerFinalDirection,
            currentPressure: 'LOW',
            expressions: [
              {
                mode: 'LEADERSHIP',
                direction: 'SUPPORT' as CareerFinalDirection,
                strength: 'STRONG' as CareerFinalStrength,
                qualified: true,
                evidenceIds: []
              }
            ],
            strongestExpressions: ['LEADERSHIP'],
            challengedExpressions: [],
            conflicts: [
              {
                source: 'NATAL',
                direction: 'CHALLENGE',
                severity: 'MODERATE',
                evidenceIds: [],
                statement: 'Conflict between natal and D10'
              }
            ],
            evidenceIds: ['ev1', 'ev2'],
            sourceIds: ['src1'],
            ruleIds: ['rule1'],
            evidenceTrace: {
              evidenceIds: ['ev1', 'ev2'],
              sourceIds: ['src1'],
              ruleIds: ['rule1']
            },
            statement: 'Strong career potential'
          }
        }
      } as any;

      const result = projectCanonicalCareerC11(interpretation);

      expect(result).toBeDefined();
      expect(result?.reasoningVersion).toBe('C11');
      expect(result?.finalStatus).toBe('SUPPORTED');
      expect(result?.finalDirection).toBe('SUPPORT');
      expect(result?.finalStrength).toBe('STRONG');
      expect(result?.confidence).toBe('HIGH');
      expect(result?.expressions).toHaveLength(1);
      expect(result?.expressions[0].mode).toBe('LEADERSHIP');
      expect(result?.conflicts).toHaveLength(1);
      expect(result?.conflicts[0].layers).toEqual(['NATAL', 'CHALLENGE', 'MODERATE']);
      expect(result?.statement).toBe('Strong career potential');
    });

    it('should return undefined when canonicalCareerFinalSynthesis is missing', () => {
      const interpretation: DomainInterpretation = {
        domain: 'CAREER',
        conclusionData: {}
      } as any;

      const result = projectCanonicalCareerC11(interpretation);
      expect(result).toBeUndefined();
    });

    it('should return undefined when interpretation is undefined', () => {
      const result = projectCanonicalCareerC11(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined when canonicalCareerFinalSynthesis fails type guard', () => {
      const interpretation: DomainInterpretation = {
        domain: 'CAREER',
        conclusionData: {
          canonicalCareerFinalSynthesis: {
            reasoningVersion: 'C10', // Wrong version
            domain: 'CAREER'
          }
        }
      } as any;

      const result = projectCanonicalCareerC11(interpretation);
      expect(result).toBeUndefined();
    });

    it('should never read legacy careerFinalSynthesis', () => {
      const interpretation: DomainInterpretation = {
        domain: 'CAREER',
        conclusionData: {
          // Legacy synthesis present but should be ignored
          careerFinalSynthesis: {
            reasoningVersion: 'C10',
            domain: 'CAREER',
            finalStatus: 'WEAK',
            statement: 'Legacy result'
          }
        }
      } as any;

      const result = projectCanonicalCareerC11(interpretation);
      expect(result).toBeUndefined();
    });

    it('should return undefined when only legacy synthesis is present', () => {
      const interpretation: DomainInterpretation = {
        domain: 'CAREER',
        conclusionData: {
          careerFinalSynthesis: {
            reasoningVersion: 'C10',
            domain: 'CAREER',
            finalStatus: 'WEAK',
            finalDirection: 'CHALLENGE',
            finalStrength: 'WEAK',
            confidence: 'LOW',
            natalDirection: 'CHALLENGE',
            natalStrength: 'WEAK',
            expressionStatus: 'SUPPRESSED',
            d10Direction: 'CHALLENGE',
            d10Effect: 'CONFLICTS',
            dashaEffect: 'CHALLENGE',
            dashaDirection: 'CHALLENGE',
            timingStatus: 'UNFAVORABLE',
            transitDirection: 'CHALLENGE',
            currentPressure: 'HIGH',
            expressions: [],
            strongestExpressions: [],
            challengedExpressions: [],
            conflicts: [],
            evidenceIds: [],
            sourceIds: [],
            ruleIds: [],
            statement: 'Legacy synthesis only'
          }
        }
      } as any;

      const result = projectCanonicalCareerC11(interpretation);
      expect(result).toBeUndefined();
    });
  });

  describe('projectCareerProfessionAnalysis', () => {
    it('should return UNAVAILABLE/INSUFFICIENT_DATA stub when analysis is undefined', () => {
      const result = projectCareerProfessionAnalysis(undefined);

      expect(result).toEqual({
        availability: 'UNAVAILABLE',
        status: 'INSUFFICIENT_DATA',
        candidates: [],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: ['careerProfessionAnalysis'],
        d10Status: 'NOT_PROVIDED'
      });
    });

    it('should project valid analysis with candidates', () => {
      const evidence: CareerProfessionEvidence = {
        evidenceId: 'ev1',
        basis: 'EXPRESSION' as CareerProfessionBasis,
        sourceIds: ['src1'],
        ruleId: 'rule1',
        statement: 'Jupiter in 10th house'
      };

      const candidate: CareerProfessionCandidate = {
        candidateId: 'cand1',
        domain: 'LEADERSHIP' as CareerProfessionDomain,
        family: 'EXECUTIVE_MANAGEMENT' as CareerProfessionFamily,
        basis: 'EXPRESSION' as CareerProfessionBasis,
        expressionTypes: ['LEADERSHIP' as CareerExpressionType],
        mechanismTypes: ['AUTHORITY'],
        patternIds: ['pattern1'],
        d10Status: 'QUALIFIED' as CareerProfessionD10Status,
        evidence: [evidence],
        domainEvidenceIds: ['domain1'],
        relatedEvidenceIds: ['related1'],
        ruleId: 'rule1'
      };

      const analysis: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate],
        unresolvedExpressionTypes: [],
        mappedTypes: ['LEADERSHIP' as CareerExpressionType],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };

      const result = projectCareerProfessionAnalysis(analysis);

      expect(result).toEqual({
        availability: 'AVAILABLE',
        status: 'COMPLETE',
        candidates: [
          {
            candidateId: 'cand1',
            domain: 'LEADERSHIP',
            family: 'EXECUTIVE_MANAGEMENT',
            basis: 'EXPRESSION',
            expressionTypes: ['LEADERSHIP'],
            mechanismTypes: ['AUTHORITY'],
            patternIds: ['pattern1'],
            d10Status: 'QUALIFIED',
            evidence: [
              {
                evidenceId: 'ev1',
                basis: 'EXPRESSION',
                sourceIds: ['src1'],
                ruleId: 'rule1',
                statement: 'Jupiter in 10th house'
              }
            ],
            domainEvidenceIds: ['domain1'],
            relatedEvidenceIds: ['related1'],
            ruleId: 'rule1'
          }
        ],
        unresolvedExpressionTypes: [],
        mappedTypes: ['LEADERSHIP'],
        missingInputs: [],
        d10Status: 'QUALIFIED'
      });
    });

    it('should aggregate d10Status: QUALIFIED > UNAVAILABLE > NOT_PROVIDED > NOT_APPLICABLE', () => {
      const candidate1: CareerProfessionCandidate = {
        candidateId: 'c1',
        domain: 'LEADERSHIP' as CareerProfessionDomain,
        family: 'EXECUTIVE_MANAGEMENT' as CareerProfessionFamily,
        basis: 'EXPRESSION' as CareerProfessionBasis,
        expressionTypes: [],
        mechanismTypes: [],
        patternIds: [],
        d10Status: 'NOT_PROVIDED' as CareerProfessionD10Status,
        evidence: [],
        domainEvidenceIds: [],
        relatedEvidenceIds: [],
        ruleId: 'rule1'
      };

      const candidate2: CareerProfessionCandidate = {
        ...candidate1,
        candidateId: 'c2',
        d10Status: 'UNAVAILABLE' as CareerProfessionD10Status
      };

      const candidate3: CareerProfessionCandidate = {
        ...candidate1,
        candidateId: 'c3',
        d10Status: 'QUALIFIED' as CareerProfessionD10Status
      };

      const candidate4: CareerProfessionCandidate = {
        ...candidate1,
        candidateId: 'c4',
        d10Status: 'NOT_APPLICABLE' as CareerProfessionD10Status
      };

      // Test with QUALIFIED present
      const analysis1: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate1, candidate2, candidate3],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };
      expect(projectCareerProfessionAnalysis(analysis1).d10Status).toBe('QUALIFIED');

      // Test with UNAVAILABLE but no QUALIFIED
      const analysis2: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate1, candidate2],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };
      expect(projectCareerProfessionAnalysis(analysis2).d10Status).toBe('UNAVAILABLE');

      // Test with NOT_PROVIDED but no QUALIFIED or UNAVAILABLE
      const analysis3: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate1],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };
      expect(projectCareerProfessionAnalysis(analysis3).d10Status).toBe('NOT_PROVIDED');

      // Test with NOT_APPLICABLE only
      const analysis4: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate4],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };
      expect(projectCareerProfessionAnalysis(analysis4).d10Status).toBe('NOT_APPLICABLE');
    });

    it('should pass through evidence with linkage and mechanism IDs', () => {
      const evidence: CareerProfessionEvidence = {
        evidenceId: 'ev1',
        basis: 'EXPRESSION' as CareerProfessionBasis,
        sourceIds: ['src1'],
        ruleId: 'rule1',
        statement: 'Test evidence',
        linkage: 'COMPLETE',
        resolvedMechanismIds: ['mech1', 'mech2'],
        unresolvedMechanismIds: ['mech3']
      };

      const candidate: CareerProfessionCandidate = {
        candidateId: 'c1',
        domain: 'LEADERSHIP' as CareerProfessionDomain,
        family: 'EXECUTIVE_MANAGEMENT' as CareerProfessionFamily,
        basis: 'EXPRESSION' as CareerProfessionBasis,
        expressionTypes: [],
        mechanismTypes: [],
        patternIds: [],
        d10Status: 'QUALIFIED' as CareerProfessionD10Status,
        evidence: [evidence],
        domainEvidenceIds: [],
        relatedEvidenceIds: [],
        ruleId: 'rule1'
      };

      const analysis: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [candidate],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };

      const result = projectCareerProfessionAnalysis(analysis);
      expect(result.candidates[0].evidence[0]).toEqual({
        evidenceId: 'ev1',
        basis: 'EXPRESSION',
        sourceIds: ['src1'],
        ruleId: 'rule1',
        statement: 'Test evidence',
        linkage: 'COMPLETE',
        resolvedMechanismIds: ['mech1', 'mech2'],
        unresolvedMechanismIds: ['mech3']
      });
    });

    it('should preserve all analysis fields in projection', () => {
      const analysis: CareerProfessionAnalysis = {
        status: 'PARTIAL',
        candidates: [],
        unresolvedExpressionTypes: ['LEADERSHIP' as CareerExpressionType],
        mappedTypes: ['LEADERSHIP' as CareerExpressionType, 'MANAGEMENT' as CareerExpressionType],
        missingInputs: ['INPUT_1', 'INPUT_2'],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };

      const result = projectCareerProfessionAnalysis(analysis);

      expect(result.status).toBe('PARTIAL');
      expect(result.unresolvedExpressionTypes).toEqual(['LEADERSHIP']);
      expect(result.mappedTypes).toEqual(['LEADERSHIP', 'MANAGEMENT']);
      expect(result.missingInputs).toEqual(['INPUT_1', 'INPUT_2']);
      expect(result.d10Status).toBe('NOT_PROVIDED'); // No candidates
    });

    it('should be deterministic: same input produces same output', () => {
      const analysis: CareerProfessionAnalysis = {
        status: 'COMPLETE',
        candidates: [],
        unresolvedExpressionTypes: [],
        mappedTypes: [],
        missingInputs: [],
        provenance: {
          expressionIds: [],
          mechanismIds: [],
          patternIds: [],
          evidenceIds: [],
          sourceIds: [],
          ruleIds: []
        }
      };

      const result1 = projectCareerProfessionAnalysis(analysis);
      const result2 = projectCareerProfessionAnalysis(analysis);

      expect(result1).toEqual(result2);
    });
  });
});
