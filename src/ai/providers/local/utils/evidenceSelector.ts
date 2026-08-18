import type {
  AiContext,
  AiEvidence,
  AiEvidenceSource
} from '../../../types/aiContextTypes';
import type { AiEvidenceEffect } from '../../../types/aiTypes';

export interface PartitionedEvidence {
  readonly supporting: readonly AiEvidence[];
  readonly challenging: readonly AiEvidence[];
  readonly neutral: readonly AiEvidence[];
}

/**
 * Partitions context evidence into supporting, challenging, and neutral groups.
 * The neutral group includes evidence with 'NEUTRAL', 'MIXED', or 'UNKNOWN' effects.
 */
export function selectEvidence(
  context: AiContext,
  predicate?: (evidence: AiEvidence) => boolean
): PartitionedEvidence {
  const evidenceList = predicate
    ? context.evidence.filter(predicate)
    : context.evidence;

  const supporting: AiEvidence[] = [];
  const challenging: AiEvidence[] = [];
  const neutral: AiEvidence[] = [];

  for (const item of evidenceList) {
    if (item.effect === 'SUPPORT') {
      supporting.push(item);
    } else if (item.effect === 'CHALLENGE') {
      challenging.push(item);
    } else {
      neutral.push(item);
    }
  }

  return {
    supporting: Object.freeze(supporting),
    challenging: Object.freeze(challenging),
    neutral: Object.freeze(neutral)
  };
}

/**
 * Filters evidence items by source.
 */
export function filterEvidenceBySource(
  context: AiContext,
  sources: readonly AiEvidenceSource[]
): readonly AiEvidence[] {
  const sourceSet = new Set(sources);
  return context.evidence.filter((e) => sourceSet.has(e.source));
}

/**
 * Extracts IDs of evidence matching a filter predicate.
 */
export function filterEvidenceIds(
  context: AiContext,
  predicate: (evidence: AiEvidence) => boolean
): readonly string[] {
  return context.evidence.filter(predicate).map((e) => e.id);
}

/**
 * Filters evidence by specific criteria (source, effect, varga, dashaLevel).
 */
export function queryEvidence(
  context: AiContext,
  criteria: {
    readonly sources?: readonly AiEvidenceSource[];
    readonly effects?: readonly AiEvidenceEffect[];
    readonly varga?: 'D9' | 'D10';
    readonly dashaLevel?: 'MAHADASHA' | 'ANTARDASHA' | 'PRATYANTARDASHA';
  }
): readonly AiEvidence[] {
  return context.evidence.filter((e) => {
    if (criteria.sources && !criteria.sources.includes(e.source)) {
      return false;
    }
    if (criteria.effects && !criteria.effects.includes(e.effect)) {
      return false;
    }
    if (criteria.varga && e.varga !== criteria.varga) {
      return false;
    }
    if (criteria.dashaLevel && e.dashaLevel !== criteria.dashaLevel) {
      return false;
    }
    return true;
  });
}
