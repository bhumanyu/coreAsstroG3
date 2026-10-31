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

export function assertParity(expected: NormalizedAcceptanceConclusion, surfaces: readonly AcceptanceSurface[]): readonly ParityDifference[] {
  const differences: ParityDifference[] = [];
  const identity = (value: NormalizedAcceptanceConclusion): string => `${value.domain}:${value.scope}:${value.subjectId}`;

  for (const surface of surfaces) {
    if (surface.conclusion === ACCEPTANCE_MISSING) {
      differences.push({ surface: surface.name, kind: 'MISSING', path: '$', reason: 'Required production surface did not produce a conclusion.' });
      continue;
    }
    const conclusion = surface.conclusion;
    if (identity(conclusion) !== identity(expected)) {
      differences.push({ surface: surface.name, kind: 'VALUE_MISMATCH', path: '$.subject', expected: identity(expected), actual: identity(conclusion), reason: 'Conclusion identity differs from the canonical fixture.' });
    }
    if (conclusion.status !== expected.status) {
      differences.push({ surface: surface.name, kind: 'VALUE_MISMATCH', path: '$.status', expected: expected.status, actual: conclusion.status, reason: 'Native conclusion status differs.' });
    }
    if (conclusion.conclusionKind !== expected.conclusionKind) {
      differences.push({
        surface: surface.name,
        kind: 'VALUE_MISMATCH',
        path: '$.conclusionKind',
        expected: expected.conclusionKind,
        actual: conclusion.conclusionKind,
        reason: 'Conclusion kinds differ; only SYNTHESIS_FINAL surfaces are comparable to the canonical synthesis.'
      });
    }

    // Report unresolved IDs and external-namespace evidence explicitly.
    for (const evidence of conclusion.evidence) {
      if (evidence.resolution === 'DANGLING') {
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
        differences.push({
          surface: surface.name,
          kind: 'EXTERNAL_EVIDENCE',
          path: '$.evidence',
          actual: evidence.id,
          reason: `Evidence ID ${evidence.id} resolves only in a declared external namespace.`
        });
      }
    }

    for (const key of ['evidence', 'provenance', 'temporalScope'] as const) {
      if (!deepEqualAcceptance(expected[key], conclusion[key])) {
        differences.push({ surface: surface.name, kind: 'VALUE_MISMATCH', path: `$.${key}`, expected: expected[key], actual: conclusion[key], reason: `${key} differs after normalization.` });
      }
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
