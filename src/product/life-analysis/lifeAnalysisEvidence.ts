import type { AiEvidence } from '../../ai';
import type { LifeAnalysis } from '../../domain/synthesis';
import type { LifeAnalysisEvidenceViewModel } from './lifeAnalysisTypes';
import { deepFreeze } from '../../ai/context/deepFreeze';

/**
 * Resolves deterministic LifeAnalysis evidence IDs against available AiContext evidence items.
 *
 * Invariant: Never emits an entry for an ID not present in contextEvidence.
 * Invariant: Infers role (SUPPORTING vs. CHALLENGING vs. NEUTRAL) from domain evidence sets.
 */
export function resolveLifeAnalysisEvidence(
  analysis: LifeAnalysis,
  contextEvidence: readonly AiEvidence[]
): readonly LifeAnalysisEvidenceViewModel[] {
  if (!analysis || !contextEvidence || contextEvidence.length === 0) {
    return Object.freeze([]);
  }

  const contextMap = new Map<string, AiEvidence>();
  for (const item of contextEvidence) {
    if (item && item.id) {
      contextMap.set(item.id, item);
    }
  }

  const supportingIds = new Set<string>();
  const challengingIds = new Set<string>();

  for (const d of analysis.domains ?? []) {
    for (const sId of d.supportingEvidenceIds ?? []) {
      supportingIds.add(sId);
    }
    for (const cId of d.challengingEvidenceIds ?? []) {
      challengingIds.add(cId);
    }
  }

  const resolved: LifeAnalysisEvidenceViewModel[] = [];
  const seenIds = new Set<string>();

  for (const id of analysis.evidenceIds ?? []) {
    if (!id || seenIds.has(id)) {
      continue;
    }
    const raw = contextMap.get(id);
    if (!raw) {
      continue;
    }

    seenIds.add(id);

    let role: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' = 'NEUTRAL';
    if (supportingIds.has(id)) {
      role = 'SUPPORTING';
    } else if (challengingIds.has(id)) {
      role = 'CHALLENGING';
    } else if (raw.effect === 'CHALLENGE') {
      role = 'CHALLENGING';
    } else if (raw.effect === 'SUPPORT') {
      role = 'SUPPORTING';
    }

    resolved.push({
      id: raw.id,
      role,
      statement: raw.statement,
      source: raw.source
    });
  }

  return deepFreeze(resolved);
}
