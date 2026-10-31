import {
  ACCEPTANCE_MISSING,
  type AcceptanceConclusion,
  type AcceptanceEvidence,
  type AcceptanceProvenance,
  type NormalizedAcceptanceConclusion,
  type AcceptanceConflictError,
  type ParityDifference
} from './goldenAcceptanceTypes';
import type { DomainEvidence } from '../domain/interpretation/DomainEvidence';
import type { CareerFinalEvidenceTrace } from '../domain/career/careerFinalSynthesis/careerFinalSynthesisTypes';

export function acceptanceConflict(code: AcceptanceConflictError['code'], conflictingId: string): AcceptanceConflictError {
  const error = Object.assign(new Error(`${code}: ${conflictingId}`), { code, conflictingId });
  return error;
}

function evidenceOwner(item: AcceptanceEvidence): string | undefined {
  return item.owner;
}

export function normalizeAcceptanceConclusion(conclusion: AcceptanceConclusion): NormalizedAcceptanceConclusion {
  const evidenceById = new Map<string, string | undefined>();
  for (const item of conclusion.evidence) {
    const owner = evidenceOwner(item);
    const existing = evidenceById.get(item.id);
    if (evidenceById.has(item.id) && existing !== owner) throw acceptanceConflict('SAME_ID_DIFFERENT_OWNER', item.id);
    evidenceById.set(item.id, owner);
  }

  for (const item of conclusion.provenance) {
    if (!evidenceById.has(item.evidenceId)) {
      throw acceptanceConflict('DANGLING_PROVENANCE', item.evidenceId);
    }
    if (evidenceById.get(item.evidenceId) !== item.owner) {
      throw acceptanceConflict('SAME_ID_DIFFERENT_OWNER', item.evidenceId);
    }
  }

  const evidence = Array.from(new Map(conclusion.evidence.map(item => [item.id, item])).values())
    .sort((a, b) => a.id.localeCompare(b.id));
  const provenanceIdentity = (item: AcceptanceProvenance): string => JSON.stringify([
    item.evidenceId, item.owner, item.source ?? null, item.ruleId ?? null,
    item.occurrence ?? null, item.stage ?? null, item.type ?? null
  ]);
  const provenance = Array.from(new Map(conclusion.provenance.map(item => [
    provenanceIdentity(item), item
  ])).values()).sort((a, b) => provenanceIdentity(a).localeCompare(provenanceIdentity(b)));

  return Object.freeze({
    domain: conclusion.domain,
    scope: conclusion.scope,
    subjectId: conclusion.subjectId,
    status: conclusion.status,
    evidence: Object.freeze(evidence),
    provenance: Object.freeze(provenance),
    ...(conclusion.temporalScope === undefined ? {} : { temporalScope: conclusion.temporalScope }),
    ...(conclusion.conclusionKind === undefined ? {} : { conclusionKind: conclusion.conclusionKind })
  });
}

export function projectDomainEvidenceToAcceptanceProvenance(
  evidence: DomainEvidence,
  owner: string
): AcceptanceProvenance {
  // C11 sourceIds are occurrence-level and ruleIds are independently deduplicated; they are not index-paired to evidenceIds.
  // Trace-only provenance (C11 trace arrays) is intentionally not represented in acceptance contracts.
  return Object.freeze({
    evidenceId: evidence.id,
    owner,
    source: evidence.provenance?.source || evidence.source || undefined,
    ruleId: evidence.provenance?.ruleId || evidence.ruleId || undefined,
    occurrence: evidence.id,
    stage: evidence.provenance?.axis,
    type: evidence.role
  });
}

export function normalizeAcceptanceSurface(
  name: string,
  conclusion: AcceptanceConclusion | undefined,
  allowedDifferenceKinds: readonly ParityDifference['kind'][] = [],
  comparison: {
    readonly compareStatus?: boolean;
    readonly compareConclusionKind?: boolean;
    readonly evidenceContract?: 'CANONICAL' | 'SURFACE_SPECIFIC';
  } = {}
): {
  readonly name: string;
  readonly conclusion: NormalizedAcceptanceConclusion | typeof ACCEPTANCE_MISSING;
  readonly allowedDifferenceKinds: readonly ParityDifference['kind'][];
  readonly compareStatus?: boolean;
  readonly compareConclusionKind?: boolean;
  readonly evidenceContract?: 'CANONICAL' | 'SURFACE_SPECIFIC';
} {
  return Object.freeze({
    name,
    conclusion: conclusion === undefined ? ACCEPTANCE_MISSING : normalizeAcceptanceConclusion(conclusion),
    allowedDifferenceKinds: Object.freeze([...allowedDifferenceKinds]),
    ...comparison
  });
}
