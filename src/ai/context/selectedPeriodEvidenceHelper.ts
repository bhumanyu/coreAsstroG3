import type { AiContext, AiEvidence, AiSelectedPeriodContext } from '../types/aiContextTypes';

/**
 * Builds an index mapping selected-period evidence IDs to their corresponding
 * projected AiEvidence-shaped records.
 *
 * This is used by both aiExplanationService and localVedicRulesEngine to resolve
 * evidence IDs from selected-period expressions and dimensions back to actual
 * evidence objects for SELECTED_PERIOD_ANALYSIS tasks.
 *
 * The index includes evidence from:
 * - selectedPeriod.availableEvidence (canonical bridge from DomainEvidence collections)
 * - context.evidence (unified DomainInterpretation evidence)
 *
 * Two-namespace contract:
 * - Primary namespace: selectedPeriod.availableEvidence (selected-period-only IDs)
 * - Fallback namespace: context.evidence (unified evidence)
 *
 * Evidence resolution for SELECTED_PERIOD_ANALYSIS must first check
 * selectedPeriod.availableEvidence, then fall back to context.evidence.
 * IDs with no object in either namespace are unresolved (never synthesize placeholders).
 *
 * @param evidence - The unified evidence from context.evidence for fallback lookup
 * @param selectedPeriod - The selected-period context containing availableEvidence
 * @returns A Map from evidence ID to AiEvidence object for all selected-period evidence
 */
export function buildSelectedPeriodEvidenceIndex(
  evidence: readonly AiEvidence[],
  selectedPeriod: AiSelectedPeriodContext | undefined
): Map<string, AiEvidence> {
  const index = new Map<string, AiEvidence>();

  // Pre-populate with context.evidence for fallback lookup
  for (const ev of evidence) {
    index.set(ev.id, ev);
  }

  // If no selectedPeriod, return the base context evidence map
  if (!selectedPeriod) {
    return index;
  }

  const sp = selectedPeriod;

  // Pre-populate with selectedPeriod.availableEvidence (canonical bridge)
  // This takes precedence over context.evidence for selected-period-only IDs
  for (const ev of sp.availableEvidence) {
    index.set(ev.id, ev);
  }

  // Collect all referenced IDs from selected-period structures
  const referencedIds = new Set<string>();

  // Add evidence IDs from selectedPeriod.evidence references
  for (const ref of sp.evidence) {
    if (ref.evidenceId) {
      referencedIds.add(ref.evidenceId);
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
      referencedIds.add(id);
    }
  }

  // Add evidence IDs from wealth dimensions
  for (const dim of Object.values(sp.wealth.dimensions)) {
    for (const id of dim.promiseEvidenceIds ?? []) {
      referencedIds.add(id);
    }
  }

  // Track unresolved IDs (referenced but not in either namespace)
  // These will be reported by consumers as unresolved
  for (const id of referencedIds) {
    if (!index.has(id)) {
      // ID is referenced but has no object in either namespace
      // This is expected for unresolved references - consumers handle this
      // We do NOT synthesize placeholder AiEvidence objects
    }
  }

  return index;
}
