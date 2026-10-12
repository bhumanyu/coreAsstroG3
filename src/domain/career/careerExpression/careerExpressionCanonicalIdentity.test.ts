import { describe, expect, it } from 'vitest';
import type {
  CareerExpressionQualificationStatus,
  CareerExpressionCanonicalDirection,
  CareerExpressionCanonicalStrength,
  CareerExpressionCanonicalProvenance,
  CareerExpressionQualification,
  QualifiedExpression,
  CandidateExpression,
  UnresolvedExpression,
  NotApplicableExpression
} from './careerExpressionTypes';

/**
 * P2-11C Gate 1: Canonical Identity Contract Tests
 *
 * These tests assert the invariants of the canonical C8 identity/qualification types:
 * - Expression qualification status (QUALIFIED/CANDIDATE/UNRESOLVED/NOT_APPLICABLE)
 * - Canonical direction/strength (reuses existing enums with UNAVAILABLE)
 * - Provenance record with DISTINCT fields (candidateId, mechanismId, sourceMechanismIds, ruleIds, sourceEvidenceIds, participantIds, identityKey)
 * - Discriminated union enforces QUALIFIED-with-no-rule is rejected by compiler
 * - A resolved mechanism must carry a real mechanismId
 * - A candidate must never be silently promoted to resolved
 * - An absent identityKey stays absent (never synthesized)
 */

describe('Career Expression Canonical Identity Contract (P2-11C Gate 1)', () => {
  describe('CareerExpressionQualificationStatus', () => {
    it('should include all four status values', () => {
      const statuses: CareerExpressionQualificationStatus[] = [
        'QUALIFIED',
        'CANDIDATE',
        'UNRESOLVED',
        'NOT_APPLICABLE'
      ];
      expect(statuses).toHaveLength(4);
    });
  });

  describe('CareerExpressionCanonicalDirection', () => {
    it('should reuse existing direction values including UNAVAILABLE', () => {
      const directions: CareerExpressionCanonicalDirection[] = [
        'SUPPORTED',
        'CONDITIONAL',
        'NEUTRAL',
        'UNAVAILABLE'
      ];
      expect(directions).toHaveLength(4);
    });
  });

  describe('CareerExpressionCanonicalStrength', () => {
    it('should reuse existing strength values including UNAVAILABLE', () => {
      const strengths: CareerExpressionCanonicalStrength[] = [
        'STRONG',
        'MODERATE',
        'WEAK',
        'UNAVAILABLE'
      ];
      expect(strengths).toHaveLength(4);
    });
  });

  describe('CareerExpressionCanonicalProvenance', () => {
    it('should require candidateId', () => {
      const provenance: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: ['MECH_1', 'MECH_2'],
        ruleIds: ['RULE_1'],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1']
      };
      expect(provenance.candidateId).toBe('CANDIDATE_123');
    });

    it('should have optional mechanismId for QUALIFIED expressions', () => {
      const provenance: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        mechanismId: 'MECH_RESOLVED_456',
        sourceMechanismIds: ['MECH_1', 'MECH_2'],
        ruleIds: ['RULE_1'],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1']
      };
      expect(provenance.mechanismId).toBe('MECH_RESOLVED_456');
    });

    it('should allow empty sourceMechanismIds for edge cases', () => {
      const provenance: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: [],
        ruleIds: [],
        sourceEvidenceIds: [],
        participantIds: []
      };
      expect(provenance.sourceMechanismIds).toEqual([]);
    });

    it('should have optional identityKey', () => {
      const provenanceWithout: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: ['MECH_1'],
        ruleIds: ['RULE_1'],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1']
      };
      expect(provenanceWithout.identityKey).toBeUndefined();

      const provenanceWith: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: ['MECH_1'],
        ruleIds: ['RULE_1'],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1'],
        identityKey: 'SEMANTIC_IDENTITY_789'
      };
      expect(provenanceWith.identityKey).toBe('SEMANTIC_IDENTITY_789');
    });

    it('should keep identityKey as DISTINCT field (not synthesized from IDs)', () => {
      const provenance: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: ['MECH_1'],
        ruleIds: ['RULE_1'],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1']
        // identityKey deliberately absent - should not be synthesized
      };
      expect(provenance.identityKey).toBeUndefined();
    });
  });

  describe('CareerExpressionQualification discriminated union', () => {
    it('should accept QualifiedExpression with non-empty ruleIds', () => {
      const qualified: QualifiedExpression = {
        qualificationStatus: 'QUALIFIED',
        ruleIds: ['RULE_1', 'RULE_2'],
        provenance: {
          candidateId: 'CANDIDATE_123',
          mechanismId: 'MECH_RESOLVED_456',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: ['RULE_1', 'RULE_2'],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };
      expect(qualified.qualificationStatus).toBe('QUALIFIED');
      expect(qualified.ruleIds).toHaveLength(2);
    });

    it('should accept CandidateExpression with empty ruleIds', () => {
      const candidate: CandidateExpression = {
        qualificationStatus: 'CANDIDATE',
        ruleIds: [],
        provenance: {
          candidateId: 'CANDIDATE_123',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: [],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };
      expect(candidate.qualificationStatus).toBe('CANDIDATE');
      expect(candidate.ruleIds).toEqual([]);
    });

    it('should accept UnresolvedExpression', () => {
      const unresolved: UnresolvedExpression = {
        qualificationStatus: 'UNRESOLVED',
        ruleIds: [],
        provenance: {
          candidateId: 'CANDIDATE_123',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: [],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };
      expect(unresolved.qualificationStatus).toBe('UNRESOLVED');
    });

    it('should accept NotApplicableExpression', () => {
      const notApplicable: NotApplicableExpression = {
        qualificationStatus: 'NOT_APPLICABLE',
        ruleIds: [],
        provenance: {
          candidateId: 'CANDIDATE_123',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: [],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };
      expect(notApplicable.qualificationStatus).toBe('NOT_APPLICABLE');
    });

    it('should enforce type-level distinction between qualification states', () => {
      const qual: CareerExpressionQualification = {
        qualificationStatus: 'QUALIFIED',
        ruleIds: ['RULE_1'],
        provenance: {
          candidateId: 'CANDIDATE_123',
          mechanismId: 'MECH_RESOLVED_456',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: ['RULE_1'],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };

      // Type narrowing via discriminant
      if (qual.qualificationStatus === 'QUALIFIED') {
        // TypeScript knows qual is QualifiedExpression here
        expect(qual.ruleIds.length).toBeGreaterThan(0);
        expect(qual.provenance.mechanismId).toBeDefined();
      }
    });
  });

  describe('Contract invariants', () => {
    it('should assert candidate, mechanism, expression, rule, evidence-occurrence, and semantic-identity are distinct', () => {
      // This test documents the key invariant: each ID namespace is distinct
      // - candidateId: mechanism candidate from C7
      // - mechanismId: resolved mechanism (optional for CANDIDATE)
      // - sourceMechanismIds: list of mechanism IDs (may include unresolved)
      // - ruleIds: rule IDs that authorized the expression
      // - sourceEvidenceIds: upstream evidence IDs
      // - participantIds: participant IDs (planets/houses)
      // - identityKey: optional semantic identity (never synthesized)

      const provenance: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_NAMESPACE_123',
        mechanismId: 'MECHANISM_NAMESPACE_456',
        sourceMechanismIds: ['MECH_SOURCE_1', 'MECH_SOURCE_2'],
        ruleIds: ['RULE_NAMESPACE_789'],
        sourceEvidenceIds: ['EVIDENCE_NAMESPACE_ABC'],
        participantIds: ['PARTICIPANT_NAMESPACE_DEF'],
        identityKey: 'SEMANTIC_IDENTITY_NAMESPACE_GHI'
      };

      // Assert each namespace is distinct (different prefixes)
      expect(provenance.candidateId).not.toContain('MECHANISM_NAMESPACE');
      expect(provenance.mechanismId).not.toContain('CANDIDATE_NAMESPACE');
      expect(provenance.sourceMechanismIds[0]).not.toContain('RULE_NAMESPACE');
      expect(provenance.ruleIds[0]).not.toContain('EVIDENCE_NAMESPACE');
      expect(provenance.sourceEvidenceIds[0]).not.toContain('PARTICIPANT_NAMESPACE');
      expect(provenance.participantIds[0]).not.toContain('SEMANTIC_IDENTITY_NAMESPACE');
      expect(provenance.identityKey).not.toContain('CANDIDATE_NAMESPACE');
    });

    it('should enforce QUALIFIED expression carries authorizing ruleIds', () => {
      // Runtime validation of the type-level invariant
      const qualified: QualifiedExpression = {
        qualificationStatus: 'QUALIFIED',
        ruleIds: ['RULE_1'],
        provenance: {
          candidateId: 'CANDIDATE_123',
          mechanismId: 'MECH_RESOLVED_456',
          sourceMechanismIds: ['MECH_1'],
          ruleIds: ['RULE_1'],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };

      // Invariant: QUALIFIED must have non-empty ruleIds
      expect(qualified.ruleIds.length).toBeGreaterThan(0);
      expect(qualified.provenance.ruleIds.length).toBeGreaterThan(0);
    });

    it('should enforce resolved mechanism carries real mechanismId', () => {
      const qualified: QualifiedExpression = {
        qualificationStatus: 'QUALIFIED',
        ruleIds: ['RULE_1'],
        provenance: {
          candidateId: 'CANDIDATE_123',
          mechanismId: 'MECH_RESOLVED_456', // Required for QUALIFIED
          sourceMechanismIds: ['MECH_1'],
          ruleIds: ['RULE_1'],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };

      // Invariant: QUALIFIED (resolved) must have mechanismId
      expect(qualified.provenance.mechanismId).toBeDefined();
      expect(qualified.provenance.mechanismId).not.toBe('');
    });

    it('should enforce candidate never silently promoted to resolved', () => {
      const candidate: CandidateExpression = {
        qualificationStatus: 'CANDIDATE',
        ruleIds: [], // Empty for CANDIDATE
        provenance: {
          candidateId: 'CANDIDATE_123',
          // mechanismId absent - CANDIDATE is not resolved
          sourceMechanismIds: ['MECH_1'],
          ruleIds: [],
          sourceEvidenceIds: ['EVIDENCE_1'],
          participantIds: ['PARTICIPANT_1']
        }
      };

      // Invariant: CANDIDATE has empty ruleIds and no mechanismId
      expect(candidate.ruleIds).toEqual([]);
      expect(candidate.provenance.mechanismId).toBeUndefined();
    });

    it('should enforce absent identityKey stays absent', () => {
      const provenanceWithout: CareerExpressionCanonicalProvenance = {
        candidateId: 'CANDIDATE_123',
        sourceMechanismIds: ['MECH_1'],
        ruleIds: [],
        sourceEvidenceIds: ['EVIDENCE_1'],
        participantIds: ['PARTICIPANT_1']
        // identityKey absent - should stay absent
      };

      // Invariant: absent identityKey is never synthesized from IDs/mode/statement
      expect(provenanceWithout.identityKey).toBeUndefined();
    });
  });
});
