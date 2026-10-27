import type { MechanismRefinement } from '../orchestration/canonicalCareerContracts';
import { buildCareerMechanismProvenance, mergeCareerMechanismProvenances } from '../careerMechanism/careerMechanismProvenance';
import type {
  CareerMechanismCandidate,
  CareerMechanismEvidence
} from '../careerMechanism/careerMechanismTypes';

export interface CareerMechanismRefinementDiagnostic {
  readonly code:
    | 'DUPLICATE_CANDIDATE_ID'
    | 'DUPLICATE_REFINEMENT'
    | 'UNKNOWN_CANDIDATE'
    | 'INVALID_REFINEMENT_REFERENCE'
    | 'DUPLICATE_EVIDENCE_ID'
    | 'CONFLICTING_EVIDENCE_ID';
  readonly severity: 'WARNING' | 'ERROR';
  readonly candidateId: string;
  readonly evidenceId?: string;
  readonly message: string;
}

export interface CareerMechanismRefinementAdapterResult {
  readonly candidates: readonly CareerMechanismCandidate[];
  readonly diagnostics: readonly CareerMechanismRefinementDiagnostic[];
}

/**
 * Adapts orchestration refinements to expression candidates without changing candidate identity.
 * A refined record must match an indexed source candidate and agree on its candidate, pattern,
 * mechanism ID, and mechanism type. Exact repeated evidence IDs are reported and deduplicated;
 * conflicting records for one evidence ID reject that candidate's projection.
 */
export function adaptCareerMechanismRefinements(
  originalCandidates: readonly CareerMechanismCandidate[],
  refinements: readonly MechanismRefinement[]
): CareerMechanismRefinementAdapterResult {
  const diagnostics: CareerMechanismRefinementDiagnostic[] = [];
  const candidatesById = new Map<string, CareerMechanismCandidate[]>();
  const refinementsById = new Map<string, MechanismRefinement[]>();

  for (const candidate of originalCandidates) {
    const indexed = candidatesById.get(candidate.candidateId) ?? [];
    candidatesById.set(candidate.candidateId, [...indexed, candidate]);
  }
  for (const refinement of refinements) {
    const indexed = refinementsById.get(refinement.candidateId) ?? [];
    refinementsById.set(refinement.candidateId, [...indexed, refinement]);
  }

  const candidates: CareerMechanismCandidate[] = [];
  for (const [candidateId, candidateRecords] of candidatesById) {
    if (candidateRecords.length > 1) {
      diagnostics.push({
        code: 'DUPLICATE_CANDIDATE_ID',
        severity: 'ERROR',
        candidateId,
        message: `More than one source candidate has candidateId ${candidateId}`
      });
    }
  }

  for (const [candidateId, records] of [...refinementsById].sort(([a], [b]) => a.localeCompare(b))) {
    if (records.length > 1) {
      diagnostics.push({
        code: 'DUPLICATE_REFINEMENT',
        severity: 'ERROR',
        candidateId,
        message: `More than one refinement targets candidateId ${candidateId}`
      });
      continue;
    }

    const sourceCandidates = candidatesById.get(candidateId);
    if (!sourceCandidates?.length) {
      diagnostics.push({
        code: 'UNKNOWN_CANDIDATE',
        severity: 'ERROR',
        candidateId,
        message: `Refinement references unknown candidateId ${candidateId}`
      });
      continue;
    }
    if (sourceCandidates.length !== 1) {
      continue;
    }

    const source = sourceCandidates[0];
    const refinement = records[0];
    if (refinement.mechanismType !== source.mechanismType) {
      diagnostics.push(invalidReference(candidateId, 'Refinement mechanism type does not match its source candidate'));
      continue;
    }

    if (refinement.resolution === 'UNRESOLVED') {
      continue;
    }

    if (refinement.resolution === 'UNCHANGED') {
      if (refinement.sourceCandidateId !== source.candidateId) {
        diagnostics.push(invalidReference(candidateId, 'UNCHANGED sourceCandidateId does not match its source candidate'));
        continue;
      }
      candidates.push(source);
      continue;
    }

    const mechanism = refinement.mechanism;
    if (
      !refinement.mechanismId.trim() ||
      mechanism.mechanismId !== refinement.mechanismId ||
      refinement.candidateId !== source.candidateId ||
      mechanism.patternId !== source.patternId ||
      mechanism.mechanismType !== source.mechanismType ||
      !mechanism.provenance.patternIds.includes(source.patternId)
    ) {
      diagnostics.push(invalidReference(candidateId, 'REFINED mechanism identity, type, or pattern does not match its source candidate'));
      continue;
    }

    const mergedEvidence = mergeEvidenceById(candidateId, source.evidence, mechanism.evidence, diagnostics);
    if (mergedEvidence.conflicted) {
      continue;
    }

    const stageEvidenceIds = refinement.stageEvidence.map(evidence => evidence.evidenceId);
    if (stageEvidenceIds.some(evidenceId => evidenceId.trim().length === 0)) {
      diagnostics.push(invalidReference(candidateId, 'Refinement stage evidence contains an empty evidenceId'));
      continue;
    }

    const provenance = mergeCareerMechanismProvenances([
      source.provenance,
      mechanism.provenance,
      buildCareerMechanismProvenance({ evidenceIds: stageEvidenceIds })
    ]);

    candidates.push(Object.freeze({
      ...source,
      candidateId: source.candidateId,
      patternId: source.patternId,
      mechanismType: source.mechanismType,
      pathway: mechanism.pathway,
      evidence: Object.freeze(mergedEvidence.evidence),
      provenance,
      explanation: mechanism.explanation
    }));
  }

  candidates.sort((a, b) => a.candidateId.localeCompare(b.candidateId));
  diagnostics.sort((a, b) =>
    a.candidateId.localeCompare(b.candidateId) ||
    a.code.localeCompare(b.code) ||
    (a.evidenceId ?? '').localeCompare(b.evidenceId ?? '')
  );
  return Object.freeze({
    candidates: Object.freeze(candidates),
    diagnostics: Object.freeze(diagnostics.map(diagnostic => Object.freeze(diagnostic)))
  });
}

function mergeEvidenceById(
  candidateId: string,
  originalEvidence: readonly CareerMechanismEvidence[],
  refinedEvidence: readonly CareerMechanismEvidence[],
  diagnostics: CareerMechanismRefinementDiagnostic[]
): { readonly evidence: readonly CareerMechanismEvidence[]; readonly conflicted: boolean } {
  const byId = new Map<string, CareerMechanismEvidence>();
  let conflicted = false;

  for (const evidence of [...originalEvidence, ...refinedEvidence]) {
    const existing = byId.get(evidence.evidenceId);
    if (!existing) {
      byId.set(evidence.evidenceId, evidence);
      continue;
    }
    const identical = sameEvidence(existing, evidence);
    diagnostics.push({
      code: identical ? 'DUPLICATE_EVIDENCE_ID' : 'CONFLICTING_EVIDENCE_ID',
      severity: identical ? 'WARNING' : 'ERROR',
      candidateId,
      evidenceId: evidence.evidenceId,
      message: identical
        ? `Evidence ${evidence.evidenceId} occurs more than once for candidate ${candidateId}`
        : `Conflicting evidence records share evidenceId ${evidence.evidenceId} for candidate ${candidateId}`
    });
    conflicted ||= !identical;
  }

  return {
    evidence: [...byId.values()].sort((a, b) => a.evidenceId.localeCompare(b.evidenceId)),
    conflicted
  };
}

function sameEvidence(a: CareerMechanismEvidence, b: CareerMechanismEvidence): boolean {
  return a.evidenceId === b.evidenceId &&
    a.mechanismType === b.mechanismType &&
    a.source === b.source &&
    a.role === b.role &&
    a.patternId === b.patternId &&
    a.explanation === b.explanation &&
    sameArray(a.participantIds, b.participantIds) &&
    sameArray(a.relationshipIds, b.relationshipIds);
}

function sameArray<T>(a: readonly T[], b: readonly T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function invalidReference(candidateId: string, message: string): CareerMechanismRefinementDiagnostic {
  return { code: 'INVALID_REFINEMENT_REFERENCE', severity: 'ERROR', candidateId, message };
}
