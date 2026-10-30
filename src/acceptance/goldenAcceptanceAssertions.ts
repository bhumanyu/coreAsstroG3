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
  const groups = new Map<string, number>();
  conclusionSet.forEach(conclusion => {
    if (!conclusion) return;
    const key = `${conclusion.domain}:${conclusion.scope}:${conclusion.subjectId}:${conclusion.status}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  });
  for (const [key, count] of groups) {
    if (count > 1) differences.push({ surface: 'runner', kind: 'DUPLICATE_CONCLUSION', path: '$', actual: count, reason: `${key} has ${count} conclusions.` });
  }
  return Object.freeze(differences);
}
