import type { CareerMechanismType } from '../careerMechanismTypes';
import type {
  CareerMechanismResolutionInput,
  CareerMechanismResolutionRule
} from './careerMechanismResolverTypes';

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
 * Helper to check if a pattern has a relationship involving specific houses.
 * Checks pattern.provenance.establishingRelationshipIds (or pattern.relationshipIds)
 * for the required houses/edges — never just pattern.houses.
 *
 * This is a simplified check for the dusthana rules. In a full implementation,
 * this would parse relationship IDs to extract house information.
 * For now, we check if the pattern's houses contain the required houses AND
 * the pattern has establishing relationship IDs (ensuring it's not just a house membership).
 */
function hasHouseRelationship(
  input: CareerMechanismResolutionInput,
  requiredHouses: readonly number[]
): boolean {
  const { pattern } = input;

  // Check if pattern has the required houses
  const hasHouses = requiredHouses.every((house) => pattern.houses.includes(house));
  if (!hasHouses) {
    return false;
  }

  // Check if pattern has establishing relationship IDs (not just house membership)
  const hasEstablishingRelationships =
    pattern.provenance.establishingRelationshipIds.length > 0 ||
    pattern.relationshipIds.length > 0;

  return hasEstablishingRelationships;
}

/**
 * Rule for 8↔10 dusthana transformation patterns.
 * Emits RESEARCH, INVESTIGATION, TRANSFORMATION, INSURANCE, TAXATION,
 * BANKING_FINANCE, COMPLIANCE, CRISIS_MANAGEMENT.
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_8_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_8_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for 8↔10 relationship (houses 8 and 10 present with establishing relationships)
    return hasHouseRelationship(input, [8, 10]);
  },

  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[] {
    return MECHANISMS_8_TO_10;
  }
});

/**
 * Rule for 12↔10 dusthana transformation patterns.
 * Emits FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT.
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_12_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_12_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for 12↔10 relationship (houses 12 and 10 present with establishing relationships)
    return hasHouseRelationship(input, [12, 10]);
  },

  resolve(input: CareerMechanismResolutionInput): readonly CareerMechanismType[] {
    return MECHANISMS_12_TO_10;
  }
});

/**
 * Rule for composite 8-12-10 dusthana transformation patterns.
 * Emits union of both 8↔10 and 12↔10 mechanism sets (no MIXED, no duplicates).
 */
const RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10: CareerMechanismResolutionRule = Object.freeze({
  ruleId: 'RULE_MECHANISM_PATTERN_DUSTHANA_COMPOSITE_8_12_10',
  pathway: 'PATTERN',

  applies(input: CareerMechanismResolutionInput): boolean {
    // Check for composite 8-12-10 relationship (houses 8, 12, and 10 present with establishing relationships)
    return hasHouseRelationship(input, [8, 12, 10]);
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
