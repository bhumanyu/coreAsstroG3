import { ACCEPTANCE_MISSING, type AcceptanceSurface, type ParityDifference, type NormalizedAcceptanceConclusion } from './goldenAcceptanceTypes';

export function deepEqualAcceptance(expected: unknown, actual: unknown): boolean {
  if (Object.is(expected, actual)) return true;
  if (typeof expected !== typeof actual || expected === null || actual === null) return false;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return expected.length === actual.length && expected.every((value, index) => deepEqualAcceptance(value, actual[index]));
  }
  if (typeof expected === 'object' && typeof actual === 'object') {
    const expectedRecord = expected as Record<string, unknown>;
    const actualRecord = actual as Record<string, unknown>;
    const expectedKeys = Object.keys(expectedRecord).sort();
    const actualKeys = Object.keys(actualRecord).sort();
    return deepEqualAcceptance(expectedKeys, actualKeys)
      && expectedKeys.every(key => deepEqualAcceptance(expectedRecord[key], actualRecord[key]));
  }
  return false;
}

export function duplicateEvidenceDifferences(
  surface: string,
  evidence: readonly { readonly id: string; readonly owner?: string }[],
  expectedOwner?: string
): readonly ParityDifference[] {
  const groups = new Map<string, { readonly id: string; readonly owner?: string }[]>();
  for (const item of evidence) {
    const entries = groups.get(item.id) ?? [];
    entries.push(item);
    groups.set(item.id, entries);
  }
  const differences: ParityDifference[] = [];
  for (const [id, entries] of groups) {
    if (entries.length < 2) continue;
    differences.push({
      surface,
      kind: 'DUPLICATE_EVIDENCE',
      path: '$.evidence',
      actual: entries,
      reason: `Evidence ID ${id} occurs ${entries.length} times in the raw conclusion.`
    });
    const owners = new Set(entries.map(item => item.owner));
    if (owners.size > 1) {
      differences.push({
        surface,
        kind: 'OWNER_MISMATCH',
        path: '$.evidence',
        expected: expectedOwner,
        actual: { id, owners: [...owners] },
        reason: `Duplicate evidence ID ${id} has conflicting owners.`
      });
    }
  }
  return differences;
}

export function assertParity(expected: NormalizedAcceptanceConclusion, surfaces: readonly AcceptanceSurface[]): readonly ParityDifference[] {
  const differences: ParityDifference[] = [];
  const identity = (value: NormalizedAcceptanceConclusion): string => `${value.domain}:${value.scope}:${value.subjectId}`;

  for (const surface of surfaces) {
    if (surface.conclusion === ACCEPTANCE_MISSING) {
      differences.push({ surface: surface.name, kind: 'MISSING', path: '$', reason: 'Required production surface did not produce a conclusion.' });
      continue;
    }
    const conclusion = surface.conclusion;
    differences.push(...duplicateEvidenceDifferences(surface.name, surface.rawEvidence ?? conclusion.evidence, conclusion.domain));
    if (identity(conclusion) !== identity(expected)) {
      differences.push({ surface: surface.name, kind: 'VALUE_MISMATCH', path: '$.subject', expected: identity(expected), actual: identity(conclusion), reason: 'Conclusion identity differs from the canonical fixture.' });
    }
    const invalidSurfaceConclusionKind = conclusion.conclusionKind !== undefined
      && surface.expectedConclusionKind !== undefined
      && conclusion.conclusionKind !== surface.expectedConclusionKind;
    const invalidCanonicalConclusionKind = surface.expectedConclusionKind === undefined
      && surface.compareConclusionKind !== false
      && conclusion.conclusionKind === 'SYNTHESIS_FINAL'
      && conclusion.conclusionKind !== expected.conclusionKind;
    if (invalidSurfaceConclusionKind || invalidCanonicalConclusionKind) {
      differences.push({
        surface: surface.name,
        kind: 'VALUE_MISMATCH',
        path: '$.conclusionKind',
        expected: surface.expectedConclusionKind ?? expected.conclusionKind,
        actual: conclusion.conclusionKind,
        reason: 'Conclusion kind does not match the surface contract.'
      });
    }
    if (surface.compareStatus !== false && conclusion.status !== expected.status) {
      differences.push({ surface: surface.name, kind: 'STATUS_MISMATCH', path: '$.status', expected: expected.status, actual: conclusion.status, reason: 'Native conclusion status differs.' });
    }

    const expectedEvidenceById = new Map(expected.evidence.map(item => [item.id, item]));
    // A reference already dangling in the canonical expectation is not a surface mismatch if reproduced exactly.
    for (const evidence of conclusion.evidence) {
      if (evidence.resolution === 'DANGLING') {
        const expectedEvidence = expectedEvidenceById.get(evidence.id);
        if (expectedEvidence?.resolution === 'DANGLING') continue;
        differences.push({
          surface: surface.name,
          kind: 'DANGLING_REFERENCE',
          path: '$.evidence',
          actual: evidence.id,
          reason: `Evidence ID ${evidence.id} does not resolve to any record in the universe.`
        });
      } else if (evidence.resolution === 'AMBIGUOUS') {
        differences.push({
          surface: surface.name,
          kind: 'AMBIGUOUS_EVIDENCE',
          path: '$.evidence',
          actual: evidence.id,
          reason: `Evidence ID ${evidence.id} resolves to multiple records in the universe (duplicate IDs).`
        });
      } else if (evidence.resolution === 'OWNER_MISMATCH') {
        differences.push({
          surface: surface.name,
          kind: 'OWNER_MISMATCH',
          path: '$.evidence',
          actual: evidence.id,
          expected: conclusion.domain,
          reason: `Evidence ID ${evidence.id} owner ${evidence.owner ?? 'unavailable'} does not match expected domain ${conclusion.domain}.`
        });
      } else if (evidence.resolution === 'EXTERNAL') {
        if (evidence.owner !== evidence.namespaceOwner) {
          differences.push({
            surface: surface.name,
            kind: 'OWNER_MISMATCH',
            path: '$.evidence',
            actual: evidence.id,
            expected: evidence.namespaceOwner,
            reason: `External evidence ${evidence.id} owner does not match its declared namespace owner.`
          });
        }
        const externalProvenance = conclusion.provenance.filter(item => item.evidenceId === evidence.id);
        if (externalProvenance.length === 0) {
          differences.push({
            surface: surface.name,
            kind: 'DANGLING_REFERENCE',
            path: '$.provenance',
            actual: evidence.id,
            reason: `External evidence ${evidence.id} has no provenance reference.`
          });
        } else if (externalProvenance.length > 1) {
          differences.push({
            surface: surface.name,
            kind: 'AMBIGUOUS_EVIDENCE',
            path: '$.provenance',
            actual: evidence.id,
            reason: `External evidence ${evidence.id} has multiple provenance references.`
          });
        } else if (!evidence.resolvedProvenance
          || externalProvenance[0].owner !== evidence.owner
          || externalProvenance[0].occurrence !== evidence.id
          || !deepEqualAcceptance(externalProvenance[0], evidence.resolvedProvenance)) {
          differences.push({
            surface: surface.name,
            kind: externalProvenance[0].owner !== evidence.owner
              ? 'OWNER_MISMATCH'
              : 'PROVENANCE_MISMATCH',
            path: '$.provenance',
            expected: evidence.resolvedProvenance,
            actual: externalProvenance[0],
            reason: `External evidence ${evidence.id} provenance is inconsistent with its resolved record.`
          });
        }
        differences.push({
          surface: surface.name,
          kind: 'EXTERNAL_EVIDENCE',
          path: '$.evidence',
          actual: {
            id: evidence.id,
            owner: evidence.owner,
            namespaceOwner: evidence.namespaceOwner,
            provenance: externalProvenance.length === 1 ? externalProvenance[0] : undefined,
            resolvedProvenance: evidence.resolvedProvenance
          },
          reason: `Evidence ID ${evidence.id} resolves only in a declared external namespace.`
        });
      }
    }

    if (surface.evidenceContract === 'SURFACE_SPECIFIC') {
      for (const evidence of conclusion.evidence) {
        if (evidence.resolution !== 'RESOLVED') continue;
        const provenanceEntries = conclusion.provenance.filter(item => item.evidenceId === evidence.id);
        if (provenanceEntries.length === 0 || !evidence.resolvedProvenance) {
          differences.push({
            surface: surface.name,
            kind: 'DANGLING_REFERENCE',
            path: '$.provenance',
            actual: evidence.id,
            reason: `Surface-specific evidence ${evidence.id} has no resolved provenance reference.`
          });
        } else if (provenanceEntries.length > 1) {
          differences.push({
            surface: surface.name,
            kind: 'AMBIGUOUS_EVIDENCE',
            path: '$.provenance',
            actual: evidence.id,
            reason: `Surface-specific evidence ${evidence.id} has multiple provenance references.`
          });
        } else if (provenanceEntries[0].owner !== evidence.owner) {
          differences.push({
            surface: surface.name,
            kind: 'OWNER_MISMATCH',
            path: '$.provenance',
            actual: evidence.id,
            expected: evidence.owner,
            reason: `Surface-specific provenance owner does not match evidence ${evidence.id}.`
          });
        } else if (provenanceEntries[0].occurrence !== evidence.id
          || !deepEqualAcceptance(provenanceEntries[0], evidence.resolvedProvenance)) {
          differences.push({
            surface: surface.name,
            kind: 'PROVENANCE_MISMATCH',
            path: '$.provenance',
            expected: evidence.resolvedProvenance,
            actual: provenanceEntries[0],
            reason: `Surface-specific provenance differs from resolved evidence ${evidence.id}.`
          });
        }
      }
    }

    const evidenceParityView = (items: NormalizedAcceptanceConclusion['evidence']) =>
      items.map(({ id, owner, resolution }) => ({ id, owner, resolution }));
    if (surface.evidenceContract !== 'SURFACE_SPECIFIC'
      && !deepEqualAcceptance(evidenceParityView(expected.evidence), evidenceParityView(conclusion.evidence))) {
      differences.push({
        surface: surface.name,
        kind: 'EVIDENCE_MISMATCH',
        path: '$.evidence',
        expected: expected.evidence,
        actual: conclusion.evidence,
        reason: 'Evidence IDs, owners, or resolution metadata differ after normalization.'
      });
    }

    const expectedEvidenceIds = new Set(expected.evidence.map(item => item.id));
    const sharedExpectedProvenance = expected.provenance.filter(item => expectedEvidenceIds.has(item.evidenceId));
    const sharedActualProvenance = conclusion.provenance.filter(item => expectedEvidenceIds.has(item.evidenceId));
    if (surface.evidenceContract !== 'SURFACE_SPECIFIC'
      && !deepEqualAcceptance(sharedExpectedProvenance, sharedActualProvenance)) {
      differences.push({
        surface: surface.name,
        kind: 'PROVENANCE_MISMATCH',
        path: '$.provenance',
        expected: sharedExpectedProvenance,
        actual: sharedActualProvenance,
        reason: 'Provenance differs for evidence shared with the canonical conclusion.'
      });
    }
    if (!deepEqualAcceptance(expected.temporalScope, conclusion.temporalScope)) {
      differences.push({
        surface: surface.name,
        kind: 'TEMPORAL_MISMATCH',
        path: '$.temporalScope',
        expected: expected.temporalScope,
        actual: conclusion.temporalScope,
        reason: 'Temporal scope differs after normalization.'
      });
    }
  }
  return Object.freeze(differences);
}

export function assertConclusionInventory(
  conclusionSet: readonly (NormalizedAcceptanceConclusion | undefined)[]
): readonly ParityDifference[] {
  const differences: ParityDifference[] = [];
  const groups = new Map<string, NormalizedAcceptanceConclusion[]>();
  conclusionSet.forEach(conclusion => {
    if (!conclusion) return;
    const key = `${conclusion.domain}:${conclusion.scope}:${conclusion.subjectId}`;
    groups.set(key, [...(groups.get(key) ?? []), conclusion]);
  });
  for (const [key, conclusions] of groups) {
    if (conclusions.length < 2) continue;
    const statuses = new Set(conclusions.map(conclusion => conclusion.status));
    if (statuses.size > 1) {
      differences.push({
        surface: 'runner', kind: 'CONFLICT', path: '$.status', actual: [...statuses].sort(),
        reason: `${key} has conflicting conclusion statuses.`
      });
      continue;
    }
    const first = conclusions[0];
    if (conclusions.every(conclusion => deepEqualAcceptance(first.evidence, conclusion.evidence)
      && deepEqualAcceptance(first.provenance, conclusion.provenance)
      && deepEqualAcceptance(first.temporalScope, conclusion.temporalScope)
      && conclusion.conclusionKind === first.conclusionKind)) {
      differences.push({ surface: 'runner', kind: 'DUPLICATE_CONCLUSION', path: '$', actual: conclusions.length,
        reason: `${key} has ${conclusions.length} identical conclusions.` });
    }
  }
  return Object.freeze(differences);
}
