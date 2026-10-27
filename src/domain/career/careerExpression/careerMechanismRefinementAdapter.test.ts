import { describe, expect, it } from 'vitest';
import type { MechanismRefinement, StageEvidence } from '../orchestration/canonicalCareerContracts';
import { buildCareerMechanismProvenance } from '../careerMechanism/careerMechanismProvenance';
import type {
  CareerMechanism,
  CareerMechanismCandidate,
  CareerMechanismEvidence
} from '../careerMechanism/careerMechanismTypes';
import { adaptCareerMechanismRefinements } from './careerMechanismRefinementAdapter';

const sourceEvidence: CareerMechanismEvidence = Object.freeze({
  evidenceId: 'EVIDENCE_SOURCE',
  mechanismType: 'RESEARCH',
  source: 'PATTERN',
  role: 'ESTABLISHING',
  participantIds: ['PLANET:MERCURY'] as const,
  relationshipIds: ['RELATIONSHIP_1'] as const,
  patternId: 'PATTERN_1',
  explanation: 'Source evidence'
});

function sourceCandidate(): CareerMechanismCandidate {
  return Object.freeze({
    candidateId: 'CANDIDATE_ACTUAL',
    patternId: 'PATTERN_1',
    mechanismType: 'RESEARCH',
    pathway: 'PATTERN',
    evidence: Object.freeze([sourceEvidence]),
    provenance: buildCareerMechanismProvenance({
      patternIds: ['PATTERN_1'],
      relationshipIds: ['RELATIONSHIP_1'],
      participantIds: ['PLANET:MERCURY'],
      evidenceIds: ['EVIDENCE_SOURCE'],
      sourceStages: ['PATTERN']
    }),
    explanation: 'Original candidate'
  });
}

function refinedMechanism(overrides: Partial<CareerMechanism> = {}): CareerMechanism {
  return Object.freeze({
    mechanismId: 'MECHANISM_REFINED',
    patternId: 'PATTERN_1',
    mechanismType: 'RESEARCH',
    pathway: 'DISPOSITOR',
    participants: ['PLANET:MERCURY'] as const,
    coreParticipants: ['PLANET:MERCURY'] as const,
    supportingParticipants: [],
    challengingParticipants: [],
    status: 'REFINED',
    explanation: 'Refined candidate',
    evidence: [sourceEvidence],
    provenance: buildCareerMechanismProvenance({
      patternIds: ['PATTERN_1'],
      relationshipIds: ['RELATIONSHIP_1'],
      participantIds: ['PLANET:MERCURY'],
      evidenceIds: ['EVIDENCE_SOURCE', 'EVIDENCE_REFINED'],
      sourceStages: ['PATTERN', 'DISPOSITOR']
    }),
    ...overrides
  });
}

function refinement(
  overrides: Partial<Extract<MechanismRefinement, { resolution: 'REFINED' }>> = {}
): Extract<MechanismRefinement, { resolution: 'REFINED' }> {
  const mechanism = refinedMechanism();
  return Object.freeze({
    resolution: 'REFINED',
    mechanismId: mechanism.mechanismId,
    candidateId: 'CANDIDATE_ACTUAL',
    mechanismType: 'RESEARCH',
    status: 'REFINED',
    mechanism,
    stageEvidence: Object.freeze([
      {
        evidenceId: 'EVIDENCE_REFINED',
        statement: 'Refinement evidence',
        sourceIds: [],
        ruleIds: []
      } as StageEvidence
    ]),
    ...overrides
  });
}

describe('adaptCareerMechanismRefinements', () => {
  it('preserves actual candidate identity, merges provenance, and deduplicates exact evidence with a diagnostic', () => {
    const source = sourceCandidate();
    const result = adaptCareerMechanismRefinements([source], [refinement()]);

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      candidateId: 'CANDIDATE_ACTUAL',
      patternId: 'PATTERN_1',
      mechanismType: 'RESEARCH',
      pathway: 'DISPOSITOR',
      explanation: 'Refined candidate'
    });
    expect(result.candidates[0].candidateId).not.toBe('MECHANISM_REFINED');
    expect(result.candidates[0].evidence.map(evidence => evidence.evidenceId)).toEqual([
      'EVIDENCE_SOURCE'
    ]);
    expect(result.candidates[0].provenance.evidenceIds).toEqual([
      'EVIDENCE_REFINED',
      'EVIDENCE_SOURCE'
    ]);
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      code: 'DUPLICATE_EVIDENCE_ID',
      severity: 'WARNING',
      evidenceId: 'EVIDENCE_SOURCE'
    }));
  });

  it('passes UNCHANGED source candidates through by reference and emits no candidate for UNRESOLVED', () => {
    const source = sourceCandidate();
    const unchanged: MechanismRefinement = {
      resolution: 'UNCHANGED',
      sourceCandidateId: source.candidateId,
      candidateId: source.candidateId,
      mechanismType: source.mechanismType,
      status: 'UNCHANGED',
      mechanism: null,
      stageEvidence: []
    };
    const unresolved: MechanismRefinement = {
      resolution: 'UNRESOLVED',
      candidateId: 'CANDIDATE_UNRESOLVED',
      mechanismType: 'RESEARCH',
      status: 'UNAVAILABLE',
      mechanism: null,
      stageEvidence: []
    };
    const result = adaptCareerMechanismRefinements(
      [source, { ...source, candidateId: 'CANDIDATE_UNRESOLVED' }],
      [unchanged, unresolved]
    );

    expect(result.candidates).toEqual([source]);
    expect(result.candidates[0]).toBe(source);
    expect(result.diagnostics).toEqual([]);
  });

  it('rejects invalid candidate/pattern references and conflicting evidence IDs', () => {
    const source = sourceCandidate();
    const wrongPattern = refinement({
      mechanism: refinedMechanism({
        patternId: 'PATTERN_FOREIGN',
        provenance: buildCareerMechanismProvenance({ patternIds: ['PATTERN_FOREIGN'] })
      })
    });
    const conflictingEvidence = {
      ...sourceEvidence,
      explanation: 'Conflicting record'
    };
    const conflicting = refinement({
      mechanism: refinedMechanism({ evidence: [conflictingEvidence] })
    });
    const unknown = refinement({ candidateId: 'UNKNOWN_CANDIDATE' });
    const invalidPattern = adaptCareerMechanismRefinements([source], [wrongPattern]);
    const conflictingResult = adaptCareerMechanismRefinements([source], [conflicting]);
    const unknownResult = adaptCareerMechanismRefinements([source], [unknown]);

    expect(invalidPattern.candidates).toEqual([]);
    expect(invalidPattern.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('INVALID_REFINEMENT_REFERENCE');
    expect(conflictingResult.candidates).toEqual([]);
    expect(conflictingResult.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('CONFLICTING_EVIDENCE_ID');
    expect(unknownResult.candidates).toEqual([]);
    expect(unknownResult.diagnostics.map(diagnostic => diagnostic.code))
      .toContain('UNKNOWN_CANDIDATE');
  });

  it('rejects duplicate source candidate IDs and duplicate refinement records', () => {
    const source = sourceCandidate();
    const result = adaptCareerMechanismRefinements(
      [source, source],
      [refinement(), refinement()]
    );

    expect(result.candidates).toEqual([]);
    expect(result.diagnostics.map(diagnostic => diagnostic.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_CANDIDATE_ID', 'DUPLICATE_REFINEMENT'])
    );
  });
});
