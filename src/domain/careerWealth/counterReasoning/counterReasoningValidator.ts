import type { CounterReasoningOutput } from './counterReasoningTypes';

/**
 * Validates that a CounterReasoningOutput obeys all CW-07 structural invariants:
 * - Non-empty question
 * - Valid targetSubjectKey
 * - Immutable conclusion (conclusionChanged strictly false)
 * - Unique and disjoint evidence IDs
 */
export function validateCounterReasoning(output: CounterReasoningOutput): void {
  if (!output.claim || !output.claim.question || output.claim.question.trim() === '') {
    throw new Error('Question cannot be empty');
  }

  if (!output.claim.targetSubjectKey || output.claim.targetSubjectKey.trim() === '') {
    throw new Error('targetSubjectKey is required on claim');
  }

  if (output.conclusionChanged !== false) {
    throw new Error('conclusionChanged must strictly be false (immutable conclusion invariant)');
  }

  if (output.evaluatedFactors !== undefined && !Array.isArray(output.evaluatedFactors)) {
    throw new Error('evaluatedFactors must be an array');
  }

  // Validate duplicate supporting IDs
  const supportingSet = new Set<string>();
  for (const id of output.supportingEvidenceIds) {
    if (supportingSet.has(id)) {
      throw new Error(`Duplicate evidence ID found in supportingEvidenceIds: ${id}`);
    }
    supportingSet.add(id);
  }

  // Validate duplicate challenging IDs
  const challengingSet = new Set<string>();
  for (const id of output.challengingEvidenceIds) {
    if (challengingSet.has(id)) {
      throw new Error(`Duplicate evidence ID found in challengingEvidenceIds: ${id}`);
    }
    challengingSet.add(id);
  }

  // Validate disjointness
  for (const id of output.supportingEvidenceIds) {
    if (challengingSet.has(id)) {
      throw new Error(`Evidence ID ${id} cannot be in both supporting and challenging sets`);
    }
  }
}
