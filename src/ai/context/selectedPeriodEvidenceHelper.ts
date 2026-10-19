import type { AiContext, AiEvidence } from '../types/aiContextTypes';

/**
 * Builds an index mapping selected-period evidence IDs to their corresponding
 * projected AiEvidence-shaped records.
 *
 * This is used by both aiExplanationService and localVedicRulesEngine to resolve
 * evidence IDs from selected-period expressions and dimensions back to actual
 * evidence objects for SELECTED_PERIOD_ANALYSIS tasks.
 *
 * The index includes evidence from:
 * - selectedPeriod.evidence references
 * - career expressions (expressionEvidenceIds, qualifiedEvidenceIds, unqualifiedEvidenceIds, mdDashaEvidenceIds, adDashaEvidenceIds)
 * - wealth dimensions (promiseEvidenceIds)
 *
 * For SELECTED_PERIOD_ANALYSIS, evidence resolution should first check this index,
 * then fall back to context.evidence.
 *
 * @param context - The AI context containing selectedPeriod information
 * @returns A Map from evidence ID to AiEvidence object for all selected-period evidence
 */
export function buildSelectedPeriodEvidenceIndex(
  context: AiContext
): Map<string, AiEvidence> {
  const index = new Map<string, AiEvidence>();

  // Pre-populate with context.evidence for fallback lookup
  for (const evidence of context.evidence) {
    index.set(evidence.id, evidence);
  }

  // If no selectedPeriod, return the base context evidence map
  if (!context.selectedPeriod) {
    return index;
  }

  const sp = context.selectedPeriod;

  // Add evidence IDs from selectedPeriod.evidence references
  for (const ref of sp.evidence) {
    if (ref.evidenceId) {
      // Look up the evidence in context.evidence and add to index
      const evidence = context.evidence.find((e) => e.id === ref.evidenceId);
      if (evidence) {
        index.set(ref.evidenceId, evidence);
      }
    }
  }

  // Add evidence IDs from career expressions
  for (const expr of sp.career.expressions) {
    const idsToAdd = [
      ...(expr.expressionEvidenceIds ?? []),
      ...(expr.qualifiedEvidenceIds ?? []),
      ...(expr.unqualifiedEvidenceIds ?? []),
      ...(expr.mdDashaEvidenceIds ?? []),
      ...(expr.adDashaEvidenceIds ?? [])
    ];

    for (const id of idsToAdd) {
      // Look up the evidence in context.evidence and add to index
      const evidence = context.evidence.find((e) => e.id === id);
      if (evidence) {
        index.set(id, evidence);
      }
    }
  }

  // Add evidence IDs from wealth dimensions
  for (const dim of Object.values(sp.wealth.dimensions)) {
    for (const id of dim.promiseEvidenceIds ?? []) {
      // Look up the evidence in context.evidence and add to index
      const evidence = context.evidence.find((e) => e.id === id);
      if (evidence) {
        index.set(id, evidence);
      }
    }
  }

  return index;
}
