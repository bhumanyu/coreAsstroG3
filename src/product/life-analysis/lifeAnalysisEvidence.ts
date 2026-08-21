import type { AiEvidence } from '../../ai';
import type { LifeAnalysis } from '../../domain/synthesis';
import type { LifeAnalysisEvidenceViewModel } from './lifeAnalysisTypes';
import { deepFreeze } from '../../ai/context/deepFreeze';

/**
 * Resolves deterministic LifeAnalysis evidence IDs against available AiContext evidence items.
 *
 * Invariant: Never emits an entry for an ID not present in contextEvidence.
 * Invariant: Classifies role (SUPPORTING vs. CHALLENGING vs. CONFLICTING vs. NEUTRAL) from domain evidence sets.
 * - CONFLICTING: evidence appears in both supporting and challenging sets
 * - SUPPORTING: evidence appears only in supporting set
 * - CHALLENGING: evidence appears only in challenging set
 * - NEUTRAL: evidence not in either set (derived from effect if available)
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

    // Determine role based on which evidence sets contain this ID
    let role: 'SUPPORTING' | 'CHALLENGING' | 'CONFLICTING' | 'NEUTRAL' = 'NEUTRAL';
    const inSupporting = supportingIds.has(id);
    const inChallenging = challengingIds.has(id);

    if (inSupporting && inChallenging) {
      // Evidence appears in both sets = CONFLICTING
      role = 'CONFLICTING';
    } else if (inSupporting) {
      role = 'SUPPORTING';
    } else if (inChallenging) {
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
