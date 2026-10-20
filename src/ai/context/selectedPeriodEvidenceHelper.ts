import type { AiContext, AiEvidence, AiSelectedPeriodContext } from '../types/aiContextTypes';

/**
 * Comparator for detecting conflicts between evidence records.
 * Adapted from selectedPeriodSynthesis.areEvidenceRecordsIdentical for AiEvidence.
 * Fields compared: source, effect, strength, statement, dimension, ruleId, identityKey.
 * Note: AiEvidence uses arrays for planets/houses and lacks some DomainEvidence fields.
 *
 * Array comparison semantics: planets and houses are compared as unordered sets (sorted for comparison).
 * This means [Sun, Moon] is considered identical to [Moon, Sun].
 */
function areAiEvidenceRecordsIdentical(a: AiEvidence, b: AiEvidence): boolean {
  // Core identity fields
  if (a.id !== b.id) return false;
  if (a.source !== b.source) return false;
  if (a.effect !== b.effect) return false;
  if (a.strength !== b.strength) return false;
  if (a.statement !== b.statement) return false;
  if (a.dimension !== b.dimension) return false;
  if (a.ruleId !== b.ruleId) return false;
  if (a.identityKey !== b.identityKey) return false;

  // Array comparisons (planets, houses) - compare as sorted sets
  if (a.planets !== b.planets) {
    if (a.planets && b.planets) {
      if (a.planets.length !== b.planets.length) return false;
      const sortedA = [...a.planets].sort();
      const sortedB = [...b.planets].sort();
      for (let i = 0; i < sortedA.length; i++) {
        if (sortedA[i] !== sortedB[i]) return false;
      }
    } else if (a.planets !== b.planets) {
      return false;
    }
  }

  if (a.houses !== b.houses) {
    if (a.houses && b.houses) {
      if (a.houses.length !== b.houses.length) return false;
      const sortedA = [...a.houses].sort();
      const sortedB = [...b.houses].sort();
      for (let i = 0; i < sortedA.length; i++) {
        if (sortedA[i] !== sortedB[i]) return false;
      }
    } else if (a.houses !== b.houses) {
      return false;
    }
  }

  return true;
}

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
 * Conflict detection:
 * - When the same ID exists in both namespaces with materially different fields,
 *   it is recorded as ambiguous and resolved like an unresolved ID.
 * - Identical records across namespaces are the documented legitimate overlap;
 *   availableEvidence wins silently (takes precedence).
 *
 * @param evidence - The unified evidence from context.evidence for fallback lookup
 * @param selectedPeriod - The selected-period context containing availableEvidence
 * @returns An object containing the evidence index and a list of ambiguous IDs
 */
export function buildSelectedPeriodEvidenceIndex(
  evidence: readonly AiEvidence[],
  selectedPeriod: AiSelectedPeriodContext | undefined
): { index: Map<string, AiEvidence>; ambiguousIds: readonly string[] } {
  // Namespace representative maps: first record per ID within each namespace
  const contextById = new Map<string, AiEvidence>();
  const availableById = new Map<string, AiEvidence>();
  // Final merged index with unchanged resolution semantics
  const index = new Map<string, AiEvidence>();
  const ambiguousIds = new Set<string>();

  // Process context.evidence namespace
  for (const ev of evidence) {
    const existing = contextById.get(ev.id);
    if (existing) {
      // Intra-namespace duplicate in context.evidence
      if (!areAiEvidenceRecordsIdentical(existing, ev)) {
        // Conflicting duplicate - record as ambiguous
        ambiguousIds.add(ev.id);
      }
      // If identical, skip silently (dedup)
    } else {
      // First occurrence of this ID in context.evidence
      contextById.set(ev.id, ev);
      index.set(ev.id, ev);
    }
  }

  // If no selectedPeriod, return the base context evidence map
  if (!selectedPeriod) {
    return { index, ambiguousIds: Array.from(ambiguousIds) };
  }

  const sp = selectedPeriod;

  // Process selectedPeriod.availableEvidence namespace
  for (const ev of sp.availableEvidence) {
    const existingInAvailable = availableById.get(ev.id);
    if (existingInAvailable) {
      // Intra-namespace duplicate in availableEvidence
      if (!areAiEvidenceRecordsIdentical(existingInAvailable, ev)) {
        // Conflicting duplicate - record as ambiguous
        ambiguousIds.add(ev.id);
      }
      // If identical, skip silently (dedup)
    } else {
      // First occurrence of this ID in availableEvidence
      availableById.set(ev.id, ev);

      const existingInContext = contextById.get(ev.id);
      if (existingInContext) {
        // Cross-namespace check: compare namespace representatives
        if (!areAiEvidenceRecordsIdentical(existingInContext, ev)) {
          // Materially different fields - record as ambiguous
          ambiguousIds.add(ev.id);
          // Do NOT overwrite - keep the context.evidence version
        } else {
          // Identical records - availableEvidence wins silently (overwrite)
          index.set(ev.id, ev);
        }
      } else {
        // ID only in availableEvidence - add it
        index.set(ev.id, ev);
      }
    }
  }

  return { index, ambiguousIds: Array.from(ambiguousIds) };
}
