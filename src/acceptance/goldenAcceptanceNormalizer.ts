import {
  ACCEPTANCE_MISSING,
  type AcceptanceConclusion,
  type AcceptanceEvidence,
  type AcceptanceProvenance,
  type NormalizedAcceptanceConclusion,
  type AcceptanceConflictError
} from './goldenAcceptanceTypes';

export function acceptanceConflict(code: AcceptanceConflictError['code'], conflictingId: string): AcceptanceConflictError {
  const error = Object.assign(new Error(`${code}: ${conflictingId}`), { code, conflictingId });
  return error;
}

function evidenceOwner(item: AcceptanceEvidence): string {
  return item.owner;
}

export function normalizeAcceptanceConclusion(conclusion: AcceptanceConclusion): NormalizedAcceptanceConclusion {
  const evidenceById = new Map<string, string>();
  for (const item of conclusion.evidence) {
    const owner = evidenceOwner(item);
    const existing = evidenceById.get(item.id);
    if (existing !== undefined && existing !== owner) throw acceptanceConflict('SAME_ID_DIFFERENT_OWNER', item.id);
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
    ...(conclusion.temporalScope === undefined ? {} : { temporalScope: conclusion.temporalScope })
  });
}

export function normalizeAcceptanceSurface(
  name: string,
  conclusion: AcceptanceConclusion | undefined
): { readonly name: string; readonly conclusion: NormalizedAcceptanceConclusion | typeof ACCEPTANCE_MISSING } {
  return Object.freeze({
    name,
    conclusion: conclusion === undefined ? ACCEPTANCE_MISSING : normalizeAcceptanceConclusion(conclusion)
  });
}
