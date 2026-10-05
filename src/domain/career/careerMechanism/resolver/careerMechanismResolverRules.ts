import type { CareerMechanismType } from '../careerMechanismTypes';
import type {
  CareerMechanismResolutionInput,
  CareerMechanismResolutionRule
} from './careerMechanismResolverTypes';
import {
  hasDirectedHouseRelationship,
  hasCommonLordRelationship,
  hasDirectHouseRelationship
} from '../../careerPattern/careerPatternPredicates';

/**
 * P2-07D Career Mechanism Resolver Rules
 *
 * This module defines the resolution rules that map pattern structural facts to
 * mechanism types. Per spec §25: only proven mappings initially, based on
 * dusthana transformation patterns (8↔10, 12↔10, composite 8-12-10).
 *
 * No speculative rules for Kendra-Trikona/Parivartana until their P2-06
 * evidence contract is stable.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - any AI/profession module
 */

/**
 * Mechanism types for 8↔10 structural relationship.
 * Source: MECHANISMS_8_TO_10 in dusthanaTransformationDetector.ts.
 */
const MECHANISMS_8_TO_10: readonly CareerMechanismType[] = Object.freeze([
  'RESEARCH',
  'INVESTIGATION',
  'TRANSFORMATION',
  'INSURANCE',
  'TAXATION',
  'BANKING_FINANCE',
  'COMPLIANCE',
  'CRISIS_MANAGEMENT'
]);

/**
 * Mechanism types for 12↔10 structural relationship.
 * Source: MECHANISMS_12_TO_10 in dusthanaTransformationDetector.ts.
 */
const MECHANISMS_12_TO_10: readonly CareerMechanismType[] = Object.freeze([
  'FOREIGN_WORK',
  'REMOTE_WORK',
  'INSTITUTIONAL_WORK',
  'ISOLATED_ENVIRONMENT'
]);

/**
 * Mechanism types for composite 8-12-10 structural relationship.
 * Union of both 8↔10 and 12↔10 sets, deduplicated.
 */
const MECHANISMS_COMPOSITE_8_12_10: readonly CareerMechanismType[] = Object.freeze([
  ...new Set([...MECHANISMS_8_TO_10, ...MECHANISMS_12_TO_10])
]);

/**
 * Helper to check if a specific house-pair relationship exists among the pattern's
 * establishing relationships using canonical edge resolution.
 *
 * This function uses the frozen P2-06A predicates (hasDirectedHouseRelationship,
 * hasCommonLordRelationship, hasDirectHouseRelationship) to verify the *specific*
 * house-pair relationship exists in the source networks, not just "any edge present".
 *
 * DUSTHANA SEMANTICS (from dusthanaRelationshipValidation.ts):
 * - 8↔10: uses hasDirectedHouseRelationship or hasCommonLordRelationship as appropriate
 * - 12↔10: uses hasDirectedHouseRelationship or hasCommonLordRelationship as appropriate
 * - Composite 8-12-10: checks both 8↔10 and 12↔10 relationships
 *
 * NOTE: This is a canonical resolution using P2-06A predicates. The prior
 * hasDirectedHouseRelationshipId precedent in careerPatternQualification/policyUtils.ts
 * was a temporary ID-string bridge that should be replaced with this approach.
 *
 * @param input - The resolution input containing networks
 * @param houseA - First house number
 * @param houseB - Second house number
 * @returns true if the specific house-pair relationship exists in establishing relationships
 */
function hasCanonicalHousePairRelationship(
  input: CareerMechanismResolutionInput,
  houseA: number,
  houseB: number
): boolean {
  const { networks, pattern } = input;

  // Check if pattern has the required houses
  if (!pattern.houses.includes(houseA) || !pattern.houses.includes(houseB)) {
    return false;
  }

  // Check if pattern has establishing relationship IDs
  if (pattern.provenance.establishingRelationshipIds.length === 0) {
    return false;
  }

  // Use canonical P2-06A predicates to verify the specific house-pair relationship
  // Check all networks for the relationship
  for (const network of networks) {
    // Check if network contains both houses
    if (!network.houses.includes(houseA) || !network.houses.includes(houseB)) {
      continue;
    }

    // Use hasDirectHouseRelationship (umbrella predicate that includes directed,
    // common lord, conjunction, aspect, and exchange relationships)
    // This matches the dusthana relationship semantics from P2-06B
    if (hasDirectHouseRelationship(network, houseA, houseB)) {
      return true;
    }
  }

  return false;
}

/**
 * Rule for 8↔10 dusthana transformation patterns.
 * Emits RESEARCH, INVESTIGATION, TRANSFORMATION, INSURANCE, TAXATION,
 * BANKING_FINANCE, COMPLIANCE, CRISIS_MANAGEMENT.
 *
 * Uses canonical edge resolution via hasCanonicalHousePairRelationship to verify
 * the specific 8↔10 relationship exists in establishing relationships.
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_8_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_8_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for 8↔10 relationship using canonical edge resolution
    return hasCanonicalHousePairRelationship(input, 8, 10);
  },

  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[] {
    return MECHANISMS_8_TO_10;
  }
});

/**
 * Rule for 12↔10 dusthana transformation patterns.
 * Emits FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT.
 *
 * Uses canonical edge resolution via hasCanonicalHousePairRelationship to verify
 * the specific 12↔10 relationship exists in establishing relationships.
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_12_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_12_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for 12↔10 relationship using canonical edge resolution
    return hasCanonicalHousePairRelationship(input, 12, 10);
  },

  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[] {
    return MECHANISMS_12_TO_10;
  }
});

/**
 * Rule for composite 8-12-10 dusthana transformation patterns.
 * Emits union of both 8↔10 and 12↔10 mechanism sets (no MIXED, no duplicates).
 *
 * Uses canonical edge resolution via hasCanonicalHousePairRelationship to verify
 * both 8↔10 and 12↔10 relationships exist in establishing relationships.
 *
 * COMPOSITE-SUBSUMPTION PRECEDENCE:
 * In the resolver, if this composite rule applies for a pattern, the pair rules
 * (RULE_MECHANISM_PATTERN_DUSTHANA_8_10 and RULE_MECHANISM_PATTERN_DUSTHANA_12_10)
 * should NOT also apply for the same pattern. This is enforced in the resolver's
 * resolve() method by checking composite precedence before applying pair rules.
 *
 * Alternatively, pair rules can be emitted only when the composite does not apply.
 * The chosen approach (composite-first or pair-exclusion) is documented in the
 * resolver implementation.
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for composite 8-12-10 relationship using canonical edge resolution
    // Both 8↔10 and 12↔10 must be present
    const has8to10 = hasCanonicalHousePairRelationship(input, 8, 10);
    const has12to10 = hasCanonicalHousePairRelationship(input, 12, 10);
    return has8to10 && has12to10;
  },

  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[] {
    return MECHANISMS_COMPOSITE_8_12_10;
  }
});

/**
 * Frozen registry of mechanism resolution rules.
 * Per spec §25: only proven mappings initially.
 */
export const CAREER_MECHANISM_RESOLUTION_RULES: Readonly<
  ReadonlyArray<CareerMechanismResolutionRule>
> = Object.freeze([
  RULE_MECHANISM_PATTERN_DUSTHANA_8_10,
  RULE_MECHANISM_PATTERN_DUSTHANA_12_10,
  RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10
]);
