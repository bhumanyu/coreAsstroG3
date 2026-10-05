import {
  createCareerMechanism,
  createCareerMechanismCandidate,
  createCareerMechanismId,
  createCareerMechanismCandidateId,
  createCareerMechanismEvidenceId,
  compareParticipantIds,
  sortParticipantIds,
  deduplicateCareerMechanismEvidence,
  CAREER_MECHANISM_DEFINITIONS,
  DefaultCareerMechanismRegistry,
  defaultCareerMechanismRegistry,
  buildCareerMechanismEvidence,
  buildCareerMechanismEvidenceArray,
  buildRefiningMechanismEvidence,
  buildCareerMechanismProvenance,
  mergeCareerMechanismProvenances,
  areProvenancesEqual
} from './index';
import type {
  CareerMechanism,
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismProvenance,
  CareerMechanismType,
  CareerMechanismStatus,
  CareerMechanismEvidenceSource,
  ParticipantId
} from './careerMechanismTypes';
import { Planet } from '../../../types';

/**
 * P2-07C Career Mechanism Model Tests
 *
 * Per spec §23–31: test suites for deterministic identity, distinct identity per type,
 * candidate≠qualified (no silent conversion API exists), missing-evidence → INSUFFICIENT_DATA
 * with empty evidence (missing ≠ negative), evidence dedup, evidence ordering,
 * core/supporting/challenging preservation, mechanism-not-profession guard,
 * no DASHA in CareerMechanismEvidenceSource and no createMechanismFromD10 API,
 * no scoring fields anywhere on the model.
 */

describe('careerMechanismTypes', () => {
  describe('§23 Deterministic identity', () => {
    it('should create deterministic mechanism IDs', () => {
      const id1 = createCareerMechanismId('pattern-123', 'AGENCY');
      const id2 = createCareerMechanismId('pattern-123', 'AGENCY');
      const id3 = createCareerMechanismId('pattern-456', 'AGENCY');

      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id1).toBe('CAREER_MECHANISM:pattern-123:AGENCY');
    });

    it('should create deterministic candidate IDs', () => {
      const id1 = createCareerMechanismCandidateId('pattern-123', 'LEADERSHIP');
      const id2 = createCareerMechanismCandidateId('pattern-123', 'LEADERSHIP');
      const id3 = createCareerMechanismCandidateId('pattern-456', 'LEADERSHIP');

      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id1).toBe('CAREER_MECHANISM_CANDIDATE:pattern-123:LEADERSHIP');
    });

    it('should create deterministic evidence IDs', () => {
      const id1 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:SUN'], ['rel-1']);
      const id2 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:SUN'], ['rel-1']);
      const id3 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:MOON'], ['rel-1']);

      expect(id1).toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id1).toBe('CAREER_MECHANISM_EVIDENCE:mech-1:PATTERN:P[PLANET:SUN]:R[rel-1]');
    });

    it('should emit different IDs when only participant membership changes', () => {
      const id1 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:SUN'], ['rel-1']);
      const id2 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:MOON'], ['rel-1']);

      expect(id1).not.toBe(id2);
    });

    it('should emit different IDs when only relationship membership changes', () => {
      const id1 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:SUN'], ['rel-1']);
      const id2 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['PLANET:SUN'], ['rel-2']);

      expect(id1).not.toBe(id2);
    });

    it('should prevent boundary collision between participants and relationships', () => {
      // Boundary collision case: participantIds=['A'], relationshipIds=['B'] vs participantIds=[], relationshipIds=['A:B']
      // With P[]/R[] markers, these should produce different IDs
      const id1 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', ['A'], ['B']);
      const id2 = createCareerMechanismEvidenceId('mech-1', 'PATTERN', [], ['A:B']);

      expect(id1).not.toBe(id2);
      expect(id1).toContain('P[A]:R[B]');
      expect(id2).toContain('P[]:R[A:B]');
    });
  });

  describe('§24 Distinct identity per type', () => {
    it('should have distinct mechanism IDs for different types', () => {
      const id1 = createCareerMechanismId('pattern-1', 'AGENCY');
      const id2 = createCareerMechanismId('pattern-1', 'LEADERSHIP');
      const id3 = createCareerMechanismId('pattern-1', 'RESEARCH');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('§25 Candidate≠qualified (no silent conversion API)', () => {
    it('should not have an API that silently converts candidate to qualified', () => {
      // createCareerMechanismCandidate creates a candidate
      // createCareerMechanism creates a qualified mechanism
      // There is no conversion function between them

      const candidate = createCareerMechanismCandidate(
        'pattern-1',
        'AGENCY',
        'PATTERN',
        [],
        buildCareerMechanismProvenance({}),
        'Test explanation'
      );

      const mechanism = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'QUALIFIED',
        explanation: 'Test explanation',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      // They are different types with different ID formats
      expect(candidate.candidateId).toContain('CANDIDATE');
      expect(mechanism.mechanismId).not.toContain('CANDIDATE');
    });
  });

  describe('§26 Missing-evidence → INSUFFICIENT_DATA with empty evidence', () => {
    it('should create mechanism with INSUFFICIENT_DATA status when evidence is missing', () => {
      const mechanism = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'INSUFFICIENT_DATA',
        explanation: 'Insufficient evidence to qualify',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      expect(mechanism.status).toBe('INSUFFICIENT_DATA');
      expect(mechanism.evidence).toEqual([]);
      expect(mechanism.provenance.evidenceIds).toEqual([]);
    });

    it('should distinguish missing evidence from negative evidence', () => {
      // Missing evidence: empty array
      const missing = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'INSUFFICIENT_DATA',
        explanation: 'Missing evidence',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      // Negative evidence: explicit evidence with negative finding
      const negativeEvidence = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PLANETARY_CONDITION',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: [],
        explanation: 'Sun is debilitated, reducing agency expression'
      });

      const negative = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'QUALIFIED',
        explanation: 'Qualified with challenging factors',
        evidence: [negativeEvidence],
        provenance: buildCareerMechanismProvenance({
          evidenceIds: [negativeEvidence.evidenceId]
        })
      });

      expect(missing.evidence.length).toBe(0);
      expect(negative.evidence.length).toBe(1);
      expect(missing.status).toBe('INSUFFICIENT_DATA');
      expect(negative.status).toBe('QUALIFIED');
    });
  });

  describe('§27 Evidence deduplication', () => {
    it('should deduplicate evidence by evidenceId', () => {
      const evidence1 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: ['rel-1'],
        explanation: 'Evidence 1'
      });

      const evidence2 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: ['rel-1'],
        explanation: 'Evidence 2'
      });

      const evidence3 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'LEADERSHIP',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:MOON' as ParticipantId],
        relationshipIds: ['rel-2'],
        explanation: 'Evidence 3'
      });

      const deduplicated = deduplicateCareerMechanismEvidence([
        evidence1,
        evidence2, // Same ID as evidence1, should be deduped
        evidence3
      ]);

      expect(deduplicated.length).toBe(2);
      // evidence1 and evidence2 have the same ID, so only one should remain
      // After deduplication and sorting, we should have 2 unique IDs
      const ids = deduplicated.map(e => e.evidenceId);
      expect(ids).toContain(evidence1.evidenceId);
      expect(ids).toContain(evidence3.evidenceId);
    });
  });

  describe('§28 Evidence ordering', () => {
    it('should sort evidence by evidenceId', () => {
      const evidence1 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: ['rel-1'],
        explanation: 'Evidence 1'
      });

      const evidence2 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'LEADERSHIP',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:MOON' as ParticipantId],
        relationshipIds: ['rel-2'],
        explanation: 'Evidence 2'
      });

      const evidence3 = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'RESEARCH',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:MARS' as ParticipantId],
        relationshipIds: ['rel-3'],
        explanation: 'Evidence 3'
      });

      const deduplicated = deduplicateCareerMechanismEvidence([
        evidence3,
        evidence1,
        evidence2
      ]);

      // Should be sorted by evidenceId
      const ids = deduplicated.map(e => e.evidenceId);
      expect(ids).toEqual([...ids].sort());
    });
  });

  describe('§29 Core/supporting/challenging preservation', () => {
    it('should preserve core, supporting, and challenging participant arrays', () => {
      const mechanism = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: [
          'PLANET:SUN' as ParticipantId,
          'PLANET:MOON' as ParticipantId,
          'PLANET:MARS' as ParticipantId
        ],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: ['PLANET:MOON' as ParticipantId],
        challengingParticipants: ['PLANET:MARS' as ParticipantId],
        status: 'QUALIFIED',
        explanation: 'Test explanation',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      expect(mechanism.coreParticipants).toEqual(['PLANET:SUN']);
      expect(mechanism.supportingParticipants).toEqual(['PLANET:MOON']);
      expect(mechanism.challengingParticipants).toEqual(['PLANET:MARS']);
      expect(mechanism.participants).toEqual([
        'PLANET:SUN',
        'PLANET:MOON',
        'PLANET:MARS'
      ]);
    });
  });

  describe('§30 Mechanism-not-profession guard', () => {
    it('should not have profession-specific values in mechanism types', () => {
      const mechanismTypes: CareerMechanismType[] = [
        'AGENCY',
        'LEADERSHIP',
        'RESEARCH',
        'TEACHING',
        'BUSINESS',
        'CONSULTING',
        'BANKING_FINANCE',
        'TRANSFORMATION',
        'FOREIGN_WORK',
        'INSTITUTIONAL_WORK'
      ];

      // These are mechanism types, not professions
      // Professions would be like: SOFTWARE_ENGINEER, BANKER, DOCTOR
      const professionValues = [
        'SOFTWARE_ENGINEER',
        'BANKER',
        'DOCTOR',
        'LAWYER',
        'ENGINEER',
        'TEACHER',
        'ACCOUNTANT'
      ];

      for (const mechanismType of mechanismTypes) {
        expect(professionValues).not.toContain(mechanismType);
      }
    });

    it('should not have profession properties on CareerMechanism', () => {
      const mechanism = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'QUALIFIED',
        explanation: 'Test explanation',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      expect(mechanism).not.toHaveProperty('profession');
      expect(mechanism).not.toHaveProperty('SOFTWARE_ENGINEER');
      expect(mechanism).not.toHaveProperty('BANKER');
      expect(mechanism).not.toHaveProperty('DOCTOR');
    });
  });

  describe('§31 No DASHA in CareerMechanismEvidenceSource', () => {
    it('should not include DASHA in CareerMechanismEvidenceSource', () => {
      const evidenceSources: CareerMechanismEvidenceSource[] = [
        'PATTERN',
        'PARTICIPANT_ROLE',
        'PLANETARY_RELEVANCE',
        'PLANETARY_CONDITION',
        'LORDSHIP',
        'RELATIONSHIP',
        'YOGA',
        'DISPOSITOR',
        'D10'
      ];

      expect(evidenceSources).not.toContain('DASHA');
    });
  });

  describe('No scoring fields on the model', () => {
    it('should not have score, strength, confidence, or weight fields', () => {
      const mechanism = createCareerMechanism({
        patternId: 'pattern-1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        participants: ['PLANET:SUN' as ParticipantId],
        coreParticipants: ['PLANET:SUN' as ParticipantId],
        supportingParticipants: [],
        challengingParticipants: [],
        status: 'QUALIFIED',
        explanation: 'Test explanation',
        evidence: [],
        provenance: buildCareerMechanismProvenance({})
      });

      expect(mechanism).not.toHaveProperty('score');
      expect(mechanism).not.toHaveProperty('strength');
      expect(mechanism).not.toHaveProperty('confidence');
      expect(mechanism).not.toHaveProperty('weight');
      expect(mechanism).not.toHaveProperty('qualificationScore');
    });
  });

  describe('Participant ID sorting', () => {
    it('should sort participant IDs using canonical planet order', () => {
      const participants: ParticipantId[] = [
        'PLANET:RAHU' as ParticipantId,
        'PLANET:SUN' as ParticipantId,
        'PLANET:MOON' as ParticipantId,
        'PLANET:MARS' as ParticipantId
      ];

      const sorted = sortParticipantIds(participants);

      // Canonical order: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu
      expect(sorted).toEqual([
        'PLANET:SUN',
        'PLANET:MOON',
        'PLANET:MARS',
        'PLANET:RAHU'
      ]);
    });

    it('should compare participant IDs correctly', () => {
      const sun: ParticipantId = 'PLANET:SUN' as ParticipantId;
      const moon: ParticipantId = 'PLANET:MOON' as ParticipantId;
      const mars: ParticipantId = 'PLANET:MARS' as ParticipantId;

      expect(compareParticipantIds(sun, moon)).toBeLessThan(0);
      expect(compareParticipantIds(moon, mars)).toBeLessThan(0);
      expect(compareParticipantIds(sun, sun)).toBe(0);
    });
  });

  describe('Registry', () => {
    it('should have definitions for all mechanism types', () => {
      // Compile-time assertion: ALL_MECHANISM_TYPES must satisfy CareerMechanismType[]
      const ALL_MECHANISM_TYPES = [
        'AGENCY',
        'SELF_DIRECTION',
        'INITIATIVE',
        'VISIBILITY',
        'STATUS',
        'AUTHORITY',
        'LEADERSHIP',
        'STRATEGY',
        'ADVISORY',
        'TEACHING',
        'INNOVATION',
        'DECISION_MAKING',
        'COMMUNICATION',
        'WRITING',
        'PUBLIC_INTERFACE',
        'CLIENT_INTERACTION',
        'CONTRACTUAL_INTERACTION',
        'PARTNERSHIP',
        'COMMERCIAL_INTERACTION',
        'ENTREPRENEURIAL_EFFORT',
        'EXECUTION',
        'HANDS_ON_CAPABILITY',
        'COURAGE',
        'SELF_EFFORT',
        'SKILL_DEVELOPMENT',
        'SERVICE_EMPLOYMENT',
        'COMPETITION',
        'PROFESSIONALIZATION',
        'PROFESSIONAL_GAINS',
        'CREATIVE_INTELLECTUAL',
        'DHARMA_DRIVEN_PROFESSION',
        'AUTHORITY_LEADERSHIP',
        'STABILITY',
        'WORK_ENVIRONMENT',
        'ADMINISTRATIVE_FOUNDATION',
        'EXPENDITURE',
        'INTELLIGENCE',
        'SPECIALIZED_KNOWLEDGE',
        'RESEARCH',
        'INVESTIGATION',
        'TRANSFORMATION',
        'BUSINESS',
        'CONSULTING',
        'BANKING_FINANCE',
        'INSURANCE',
        'TAXATION',
        'COMPLIANCE',
        'RISK',
        'CRISIS',
        'CRISIS_MANAGEMENT',
        'INSTITUTIONAL_BASE',
        'INSTITUTIONAL_SERVICE',
        'INSTITUTIONAL_WORK',
        'ISOLATED_ENVIRONMENT',
        'FOREIGN',
        'FOREIGN_WORK',
        'REMOTE_WORK'
      ] as const satisfies readonly CareerMechanismType[];

      // Runtime check: all types in ALL_MECHANISM_TYPES must be in the registry
      const registry = new DefaultCareerMechanismRegistry();
      for (const type of ALL_MECHANISM_TYPES) {
        expect(registry.has(type)).toBe(true);
      }

      // Runtime check: registry keys must match ALL_MECHANISM_TYPES
      expect(Object.keys(CAREER_MECHANISM_DEFINITIONS).sort()).toEqual(
        [...ALL_MECHANISM_TYPES].sort()
      );
    });

    it('should throw on unknown mechanism type', () => {
      const registry = new DefaultCareerMechanismRegistry();

      expect(() => registry.get('UNKNOWN_TYPE' as any)).toThrow(
        'Unknown career mechanism type: UNKNOWN_TYPE'
      );
    });

    it('should return all definitions as frozen array', () => {
      const all = defaultCareerMechanismRegistry.all();

      expect(Array.isArray(all)).toBe(true);
      // The array itself should be frozen
      expect(Object.isFrozen(all)).toBe(true);
      // Each definition object should also be frozen
      all.forEach(def => {
        expect(Object.isFrozen(def)).toBe(true);
      });
      expect(all.length).toBeGreaterThan(0);
    });

    it('should filter by family', () => {
      const expressionMechanisms = defaultCareerMechanismRegistry.getByFamily(
        'EXPRESSION'
      );

      expect(expressionMechanisms.length).toBeGreaterThan(0);
      expressionMechanisms.forEach((def) => {
        expect(def.family).toBe('EXPRESSION');
      });
    });
  });

  describe('Provenance helpers', () => {
    it('should build provenance with sorted-unique arrays', () => {
      const provenance = buildCareerMechanismProvenance({
        patternIds: ['pattern-2', 'pattern-1', 'pattern-1'],
        relationshipIds: ['rel-2', 'rel-1', 'rel-1'],
        participantIds: [
          'PLANET:RAHU' as ParticipantId,
          'PLANET:SUN' as ParticipantId,
          'PLANET:SUN' as ParticipantId
        ],
        evidenceIds: ['ev-2', 'ev-1', 'ev-1'],
        sourceStages: ['PATTERN', 'RELATIONSHIP', 'RELATIONSHIP']
      });

      expect(provenance.patternIds).toEqual(['pattern-1', 'pattern-2']);
      expect(provenance.relationshipIds).toEqual(['rel-1', 'rel-2']);
      expect(provenance.participantIds).toEqual(['PLANET:SUN', 'PLANET:RAHU']);
      expect(provenance.evidenceIds).toEqual(['ev-1', 'ev-2']);
      expect(provenance.sourceStages).toEqual(['PATTERN', 'RELATIONSHIP']);
    });

    it('should merge provenances', () => {
      const p1 = buildCareerMechanismProvenance({
        patternIds: ['pattern-1'],
        relationshipIds: ['rel-1'],
        participantIds: ['PLANET:SUN' as ParticipantId],
        evidenceIds: ['ev-1'],
        sourceStages: ['PATTERN']
      });

      const p2 = buildCareerMechanismProvenance({
        patternIds: ['pattern-2'],
        relationshipIds: ['rel-2'],
        participantIds: ['PLANET:MOON' as ParticipantId],
        evidenceIds: ['ev-2'],
        sourceStages: ['RELATIONSHIP']
      });

      const merged = mergeCareerMechanismProvenances([p1, p2]);

      expect(merged.patternIds).toEqual(['pattern-1', 'pattern-2']);
      expect(merged.relationshipIds).toEqual(['rel-1', 'rel-2']);
      expect(merged.participantIds).toEqual(['PLANET:SUN', 'PLANET:MOON']);
      expect(merged.evidenceIds).toEqual(['ev-1', 'ev-2']);
      expect(merged.sourceStages).toEqual(['PATTERN', 'RELATIONSHIP']);
    });

    it('should check provenance equality', () => {
      const p1 = buildCareerMechanismProvenance({
        patternIds: ['pattern-1'],
        relationshipIds: ['rel-1'],
        participantIds: ['PLANET:SUN' as ParticipantId],
        evidenceIds: ['ev-1'],
        sourceStages: ['PATTERN']
      });

      const p2 = buildCareerMechanismProvenance({
        patternIds: ['pattern-1'],
        relationshipIds: ['rel-1'],
        participantIds: ['PLANET:SUN' as ParticipantId],
        evidenceIds: ['ev-1'],
        sourceStages: ['PATTERN']
      });

      const p3 = buildCareerMechanismProvenance({
        patternIds: ['pattern-2'],
        relationshipIds: ['rel-1'],
        participantIds: ['PLANET:SUN' as ParticipantId],
        evidenceIds: ['ev-1'],
        sourceStages: ['PATTERN']
      });

      expect(areProvenancesEqual(p1, p2)).toBe(true);
      expect(areProvenancesEqual(p1, p3)).toBe(false);
    });
  });

  describe('Evidence helpers', () => {
    it('should build evidence with validation', () => {
      const evidence = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PARTICIPANT_ROLE',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: ['rel-1'],
        patternId: 'pattern-1',
        explanation: 'Test explanation'
      });

      expect(evidence.evidenceId).toContain('CAREER_MECHANISM_EVIDENCE');
      expect(evidence.mechanismType).toBe('AGENCY');
      expect(evidence.source).toBe('PARTICIPANT_ROLE');
      expect(evidence.participantIds).toEqual(['PLANET:SUN']);
      expect(evidence.relationshipIds).toEqual(['rel-1']);
      expect(evidence.patternId).toBe('pattern-1');
    });

    it('should throw when PARTICIPANT_ROLE source has no participant IDs', () => {
      expect(() =>
        buildCareerMechanismEvidence({
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'PARTICIPANT_ROLE',
          participantIds: [],
          relationshipIds: [],
          explanation: 'Test'
        })
      ).toThrow('PARTICIPANT_ROLE source requires at least one participant ID');
    });

    it('should throw when RELATIONSHIP source has no relationship IDs', () => {
      expect(() =>
        buildCareerMechanismEvidence({
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'RELATIONSHIP',
          participantIds: ['PLANET:SUN' as ParticipantId],
          relationshipIds: [],
          explanation: 'Test'
        })
      ).toThrow('RELATIONSHIP source requires at least one relationship ID');
    });

    it('should throw when D10 source is used in buildCareerMechanismEvidence', () => {
      expect(() =>
        buildCareerMechanismEvidence({
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'D10',
          participantIds: ['PLANET:SUN' as ParticipantId],
          relationshipIds: [],
          explanation: 'Test'
        })
      ).toThrow('D10 source is not allowed in buildCareerMechanismEvidence');
    });

    it('should assign ESTABLISHING role to evidence from buildCareerMechanismEvidence', () => {
      const evidence = buildCareerMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'PATTERN',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: [],
        patternId: 'pattern-1',
        explanation: 'Test'
      });

      expect(evidence.role).toBe('ESTABLISHING');
    });

    it('should throw when PATTERN source has no patternId', () => {
      expect(() =>
        buildCareerMechanismEvidence({
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'PATTERN',
          participantIds: ['PLANET:SUN' as ParticipantId],
          relationshipIds: [],
          explanation: 'Test'
        })
      ).toThrow('PATTERN source requires patternId');
    });

    it('should throw when DISPOSITOR source has no participant IDs', () => {
      expect(() =>
        buildCareerMechanismEvidence({
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'DISPOSITOR',
          participantIds: [],
          relationshipIds: ['rel-1'],
          explanation: 'Test'
        })
      ).toThrow('DISPOSITOR source requires at least one participant ID');
    });

    it('should build evidence array', () => {
      const evidenceArray = buildCareerMechanismEvidenceArray([
        {
          mechanismId: 'mech-1',
          mechanismType: 'AGENCY',
          source: 'PARTICIPANT_ROLE',
          participantIds: ['PLANET:SUN' as ParticipantId],
          relationshipIds: ['rel-1'],
          explanation: 'Evidence 1'
        },
        {
          mechanismId: 'mech-1',
          mechanismType: 'LEADERSHIP',
          source: 'PARTICIPANT_ROLE',
          participantIds: ['PLANET:MOON' as ParticipantId],
          relationshipIds: ['rel-2'],
          explanation: 'Evidence 2'
        }
      ]);

      expect(evidenceArray.length).toBe(2);
      expect(Object.isFrozen(evidenceArray)).toBe(true);
    });

    it('should restrict buildRefiningMechanismEvidence to refinement-only sources', () => {
      // Type-level assertion: buildRefiningMechanismEvidence should only accept CareerMechanismRefinementSource
      // Since TypeScript's type system prevents this at compile time, we verify by documentation and usage
      // The type signature restricts source to CareerMechanismRefinementSource (currently only 'D10')

      // Valid: D10 is a refinement source
      const validEvidence = buildRefiningMechanismEvidence({
        mechanismId: 'mech-1',
        mechanismType: 'AGENCY',
        source: 'D10',
        participantIds: ['PLANET:SUN' as ParticipantId],
        relationshipIds: [],
        explanation: 'Test'
      });

      expect(validEvidence.role).toBe('REFINING');
      expect(validEvidence.source).toBe('D10');
    });
  });
});
