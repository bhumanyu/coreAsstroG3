import type {
  WeightedReasoningEvidence,
  ReasoningLayer,
  ReasoningDirection,
  EvidenceStrength
} from './reasoningTypes';
import { mergeEvidenceDirection, mergeEvidenceStrength } from './mergeEvidence';

/**
 * Fixed precedence order for reasoning layers.
 * Used for deterministic canonical layer selection and canonicalization of the layers array.
 */
const REASONING_LAYER_PRECEDENCE: readonly ReasoningLayer[] = [
  'PRIMARY_PROMISE',
  'SECONDARY_SUPPORT',
  'MODIFIER',
  'YOGA',
  'VARGA',
  'DASHA',
  'TRANSIT'
];

/**
 * Canonical evidence record with occurrence metadata.
 * Extends WeightedReasoningEvidence to track how many times the same
 * semantic fact appeared across different layers/representations.
 */
export interface CanonicalReasoningEvidence {
  readonly identityKey: string;
  readonly evidenceId: string;
  readonly ruleId?: string;
  readonly layer: ReasoningLayer;
  readonly direction: ReasoningDirection;
  readonly strength: EvidenceStrength;
  readonly priority: number;
  readonly weight: number;
  readonly statement: string;
  readonly relatedEvidenceIds: readonly string[];
  readonly occurrenceCount: number;
  readonly sourceIds: readonly string[];
  readonly layers: readonly ReasoningLayer[];
}

/**
 * Derives an identity key from a WeightedReasoningEvidence instance.
 *
 * The identity key is based on the semantic fields that define what the evidence
 * represents, excluding direction/strength/layer/prose which can vary across occurrences.
 *
 * For evidence with an identityKey, we use it directly (computed at classification time).
 * For evidence without an identityKey, we fall back to using the evidenceId itself
 * to ensure no evidence is lost.
 */
function deriveIdentityKey(evidence: WeightedReasoningEvidence): string {
  // Use the pre-computed identityKey if available
  if (evidence.identityKey) {
    return evidence.identityKey;
  }

  // Fallback to evidenceId for legacy evidence without identityKey
  return evidence.evidenceId;
}

/**
 * Deduplicates reasoning evidence by canonical identity key.
 *
 * Groups evidence by semantic identity (same rule/subject/object regardless of
 * direction/strength/layer/prose), merges conflicting directions and strengths,
 * accumulates occurrence metadata, and returns the strongest single-occurrence weight.
 *
 * Duplicate occurrences do NOT increase evidentiary weight - the max single-occurrence
 * weight is retained. This ensures one underlying astrological fact contributes once,
 * regardless of how many representations/layers reference it.
 *
 * @param evidence - The weighted reasoning evidence to deduplicate
 * @returns A deterministically ordered, frozen array of canonical evidence
 */
export function deduplicateReasoningEvidence(
  evidence: readonly WeightedReasoningEvidence[]
): readonly CanonicalReasoningEvidence[] {
  // Group by identity key
  const groups = new Map<string, WeightedReasoningEvidence[]>();

  for (const item of evidence) {
    const identityKey = deriveIdentityKey(item);

    if (!groups.has(identityKey)) {
      groups.set(identityKey, []);
    }

    groups.get(identityKey)!.push(item);
  }

  // Merge each group into a canonical evidence record
  const canonical: CanonicalReasoningEvidence[] = [];

  for (const [identityKey, group] of groups) {
    // Merge direction and strength across occurrences
    let mergedDirection: ReasoningDirection = 'NEUTRAL';
    let mergedStrength: EvidenceStrength = 'WEAK';
    let maxWeight = 0;
    let maxPriority = 0;
    const sourceIds: Set<string> = new Set();
    const layers: Set<ReasoningLayer> = new Set();
    let statement = '';
    let statementEvidenceId = '';
    let statementWeight = 0;
    const relatedEvidenceIds: Set<string> = new Set();
    let ruleId: string | undefined;

    for (const item of group) {
      // Merge direction
      mergedDirection = mergeEvidenceDirection(mergedDirection, item.direction);

      // Merge strength (take max)
      mergedStrength = mergeEvidenceStrength(mergedStrength, item.strength);

      // Track max weight (never sum duplicates)
      if (item.weight > maxWeight) {
        maxWeight = item.weight;
      }

      // Track max priority
      if (item.priority > maxPriority) {
        maxPriority = item.priority;
      }

      // Accumulate source IDs (distinct occurrence IDs)
      sourceIds.add(item.evidenceId);

      // Accumulate layers
      layers.add(item.layer);

      // Track statement for deterministic selection (highest weight, tie-break by evidenceId)
      if (item.statement) {
        if (!statement || item.weight > statementWeight || (item.weight === statementWeight && item.evidenceId.localeCompare(statementEvidenceId) < 0)) {
          statement = item.statement;
          statementEvidenceId = item.evidenceId;
          statementWeight = item.weight;
        }
      }

      // Accumulate related evidence IDs
      for (const relatedId of item.relatedEvidenceIds) {
        relatedEvidenceIds.add(relatedId);
      }

      // Use the first ruleId if available
      if (!ruleId && item.ruleId) {
        ruleId = item.ruleId;
      }
    }

    // Select canonical layer deterministically based on fixed precedence
    // layer = deterministically-chosen canonical layer, layers = full set of all occurrence layers
    const primaryLayer = REASONING_LAYER_PRECEDENCE.find(l => layers.has(l)) ?? group[0].layer;

    const canonicalItem: CanonicalReasoningEvidence = Object.freeze({
      identityKey,
      evidenceId: identityKey, // Use identityKey as the canonical ID for determinism
      ruleId,
      layer: primaryLayer,
      direction: mergedDirection,
      strength: mergedStrength,
      priority: maxPriority,
      weight: maxWeight,
      statement,
      relatedEvidenceIds: Object.freeze(Array.from(relatedEvidenceIds).sort((a, b) => a.localeCompare(b))),
      occurrenceCount: group.length,
      // sourceIds = distinct occurrence IDs; occurrenceCount = total occurrences (including duplicates)
      sourceIds: Object.freeze(Array.from(sourceIds).sort((a, b) => a.localeCompare(b))),
      layers: Object.freeze(REASONING_LAYER_PRECEDENCE.filter(l => layers.has(l)))
    });

    canonical.push(canonicalItem);
  }

  // Sort deterministically by identity key
  canonical.sort((a, b) => a.identityKey.localeCompare(b.identityKey));

  // Freeze the entire array
  return Object.freeze(canonical);
}

/**
 * Converts CanonicalReasoningEvidence back to WeightedReasoningEvidence format.
 * This is used when downstream functions expect WeightedReasoningEvidence but
 * we want to benefit from deduplication.
 */
export function canonicalToWeighted(
  canonical: readonly CanonicalReasoningEvidence[]
): readonly WeightedReasoningEvidence[] {
  return Object.freeze(
    canonical.map((item) =>
      Object.freeze({
        identityKey: item.identityKey,
        evidenceId: item.evidenceId,
        ruleId: item.ruleId,
        layer: item.layer,
        direction: item.direction,
        strength: item.strength,
        priority: item.priority,
        weight: item.weight,
        statement: item.statement,
        relatedEvidenceIds: item.relatedEvidenceIds,
        sourceIds: item.sourceIds,
        occurrenceCount: item.occurrenceCount
      })
    )
  );
}
