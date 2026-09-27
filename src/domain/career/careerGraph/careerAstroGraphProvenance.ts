import type { CareerGraphProvenance } from './careerAstroGraphTypes';

/**
 * Normalizes provenance by deduplicating and deterministically sorting arrays.
 * Ensures consistent provenance representation regardless of input order.
 *
 * @param provenance - The provenance to normalize
 * @returns A frozen, normalized provenance object
 */
export function normalizeCareerGraphProvenance(
  provenance: CareerGraphProvenance
): CareerGraphProvenance {
  const uniqueSourceIds = Array.from(new Set(provenance.sourceIds));
  const uniqueRuleIds = Array.from(new Set(provenance.ruleIds));
  const uniqueParentIds = Array.from(new Set(provenance.parentIds));

  return Object.freeze({
    sourceIds: Object.freeze(uniqueSourceIds.sort()),
    ruleIds: Object.freeze(uniqueRuleIds.sort()),
    parentIds: Object.freeze(uniqueParentIds.sort())
  });
}

/**
 * Merges provenance from multiple occurrences of the same edge identity.
 * Unions sourceIds, ruleIds, and parentIds, then normalizes the result.
 *
 * Used for duplicate-edge merging in the graph builder.
 *
 * @param provenances - Array of provenances to merge
 * @returns A frozen, merged and normalized provenance object
 */
export function mergeCareerGraphProvenances(
  provenances: readonly CareerGraphProvenance[]
): CareerGraphProvenance {
  const allSourceIds = provenances.flatMap(p => p.sourceIds);
  const allRuleIds = provenances.flatMap(p => p.ruleIds);
  const allParentIds = provenances.flatMap(p => p.parentIds);

  return normalizeCareerGraphProvenance({
    sourceIds: allSourceIds,
    ruleIds: allRuleIds,
    parentIds: allParentIds
  });
}
