import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPattern } from './careerPatternTypes';
import type { CareerPatternClassificationEvidence, CareerPatternClassificationProvenance } from './careerPatternTypes';
import type { CareerPatternHouseRole } from './careerPatternTypes';
import type { CareerMechanismType } from '../careerMechanism/careerMechanismTypes';
import { buildCareerPatternIdentityKey, buildCareerPatternId } from './careerPatternIdentity';
import type { CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';
import { hasDirectHouseRelationship } from './careerPatternPredicates';
import {
  validateDusthanaRelationships
} from './dusthanaRelationshipValidation';
import type {
  DusthanaRelationshipValidationResult
} from './dusthanaRelationshipTypes';
import { buildPatternProvenance } from './careerPatternProvenance';

/**
 * P2-06B Dusthana Transformation Detector
 *
 * This module detects dusthana transformation patterns for 8↔10 and 12↔10 relationships.
 * Per spec §13–16: dusthana involvement produces mechanism classifications, never negative direction.
 *
 * Mechanism classifications:
 * - 8↔10: RESEARCH, INVESTIGATION, TRANSFORMATION, INSURANCE, TAXATION, BANKING_FINANCE, COMPLIANCE, CRISIS_MANAGEMENT
 * - 12↔10: FOREIGN_WORK, REMOTE_WORK, INSTITUTIONAL_WORK, ISOLATED_ENVIRONMENT
 *
 * DESIGN CHOICE: Mechanisms are derived from structural facts (house relationship types),
 * not from per-planet hardcoded tables. Planet-level mechanism refinement is deferred to
 * the qualification wave (P2-04 layer) which consumes C5 CareerPlanetaryRelevance[] and
 * C6 CareerPlanetaryConditionResult[] to apply planet-specific modifiers.
 *
 * Methodology chain: dusthana → relationship → condition → career connection → mechanism
 *
 * MISSING RELATIONSHIP → no pattern (changed from membership-only to validation-based)
 * Missing planet data → emit multiple mechanism candidates (structurally represent mixed resolution)
 *
 * VALIDATION REQUIREMENT: Emits patterns ONLY for pairs with VALIDATED status from
 * validateDusthanaRelationships. Attaches validation's relationshipIds/evidenceIds/network
 * provenance to pattern.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * House role mapping for dusthana patterns.
 */
const DUSTHANA_HOUSE_ROLES: Readonly<Record<number, CareerPatternHouseRole>> = Object.freeze({
  8: 'UNKNOWN',
  10: 'CAREER_HOUSE',
  12: 'UNKNOWN'
});

/**
 * Mechanism candidates for 8↔10 structural relationship.
 * Derived from the structural fact that house 8 (transformation/death) connects to house 10 (career).
 * These are candidate mechanisms; planet-level refinement happens in P2-04 qualification.
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
 * Mechanism candidates for 12↔10 structural relationship.
 * Derived from the structural fact that house 12 (loss/foreign) connects to house 10 (career).
 * These are candidate mechanisms; planet-level refinement happens in P2-04 qualification.
 */
const MECHANISMS_12_TO_10: readonly CareerMechanismType[] = Object.freeze([
  'FOREIGN_WORK',
  'REMOTE_WORK',
  'INSTITUTIONAL_WORK',
  'ISOLATED_ENVIRONMENT'
]);

/**
 * Checks if a network contains a VALIDATED 8↔10 relationship.
 * Uses validation output to confirm VALIDATED status.
 */
function hasValidated8to10Relationship(
  validationResult: DusthanaRelationshipValidationResult,
  networkId: string
): boolean {
  return validationResult.validations.some(
    v =>
      v.dusthanaHouse === 8 &&
      v.careerAnchorHouse === 10 &&
      v.status === 'VALIDATED' &&
      v.sourceNetworkIds.includes(networkId)
  );
}

/**
 * Checks if a network contains a VALIDATED 12↔10 relationship.
 * Uses validation output to confirm VALIDATED status.
 */
function hasValidated12to10Relationship(
  validationResult: DusthanaRelationshipValidationResult,
  networkId: string
): boolean {
  return validationResult.validations.some(
    v =>
      v.dusthanaHouse === 12 &&
      v.careerAnchorHouse === 10 &&
      v.status === 'VALIDATED' &&
      v.sourceNetworkIds.includes(networkId)
  );
}

/**
 * Builds a dusthana transformation pattern from a network with validation.
 * Mechanisms are derived from structural facts (dusthana-house↔career-house relationship),
 * not from participating planets. Planet-level refinement is deferred to P2-04 qualification.
 *
 * Uses buildPatternProvenance for strict validation and canonical provenance construction.
 */
function buildDusthanaPattern(
  network: CareerHouseNetwork,
  dusthanaHouse: 8 | 12,
  validationResult: DusthanaRelationshipValidationResult
): CareerPattern {
  const family = 'DUSTHANA_TRANSFORMATION';
  const classification = 'DUSTHANA_CAREER_TRANSFORMATION';
  const topology = network.topology;
  const direction = network.direction;

  // Get validated relationship IDs for this pair
  const validatedRelationships = validationResult.validations.filter(
    (v) =>
      v.dusthanaHouse === dusthanaHouse &&
      v.careerAnchorHouse === 10 &&
      v.status === 'VALIDATED' &&
      v.sourceNetworkIds.includes(network.networkId)
  );

  const establishingRelationshipIds: string[] = Array.from(
    new Set(validatedRelationships.flatMap((v) => v.relationshipIds))
  ).sort();

  const ruleIds = Array.from(new Set(validatedRelationships.flatMap((v) => v.provenance.ruleIds))).sort();
  const ruleId = ruleIds[0] || `RULE_DUSTHANA_${dusthanaHouse}_TO_10`;

  // Use buildPatternProvenance for validation and canonical construction
  const provenanceResult = buildPatternProvenance(
    {
      sourceNetworkIds: [network.networkId],
      ruleId,
      establishingRelationshipIds,
      supportingRelationshipIds: []
    },
    network
  );

  const relationshipIds = provenanceResult.provenance.relationshipIds;

  // P2-06D: Identity consumes establishingRelationshipIds ONLY (not all network edges)
  const identityKey = buildCareerPatternIdentityKey(
    family,
    classification,
    network.houses,
    topology,
    establishingRelationshipIds
  );

  const patternId = buildCareerPatternId(identityKey);
  const name = 'Dusthana Career Transformation';

  // Derive mechanisms from structural relationship type (8↔10 or 12↔10)
  // Planet-level refinement happens in P2-04 qualification
  const mechanisms = dusthanaHouse === 8 ? MECHANISMS_8_TO_10 : MECHANISMS_12_TO_10;

  return Object.freeze({
    patternId,
    identityKey,
    family,
    level: 'HOUSE_NETWORK',
    classification,
    name,
    topology,
    direction,
    houses: network.houses,
    houseRoles: DUSTHANA_HOUSE_ROLES,
    planets: network.lords,
    networkIds: [network.networkId],
    relationshipIds,
    mechanisms,
    relationships: [],
    evidence: provenanceResult.evidence,
    provenance: provenanceResult.provenance
  });
}

/**
 * Detects dusthana transformation patterns from career house networks.
 * Per spec §13–16: detects 8↔10 and 12↔10 relationships with mechanism classification.
 *
 * Hard rule: never maps house 8/12/6 to NEGATIVE direction.
 * Missing relationship → no pattern.
 * Missing planet data → emit multiple mechanism candidates (structurally represent mixed resolution)
 *
 * VALIDATION REQUIREMENT: Emits patterns ONLY for pairs with VALIDATED status from
 * validateDusthanaRelationships.
 *
 * DOUBLE-EMISSION CONTRACT:
 * For networks containing both 8-10 and 12-10 relationships (e.g., 8-10-12),
 * emit ONE composite pattern with the full house set, not separate patterns for each dusthana-house pair.
 * The mechanisms are the union of both 8↔10 and 12↔10 mechanism sets.
 * This ensures deterministic output and avoids duplication.
 *
 * @param networks - The career house networks to analyze
 * @returns Array of dusthana transformation patterns
 */
export function detectDusthanaPatterns(
  networks: readonly CareerHouseNetwork[]
): readonly CareerPattern[] {
  const patterns: CareerPattern[] = [];

  // Run validation first
  const validationResult = validateDusthanaRelationships(networks);

  for (const network of networks) {
    const has8to10 = hasValidated8to10Relationship(validationResult, network.networkId);
    const has12to10 = hasValidated12to10Relationship(validationResult, network.networkId);

    // If neither relationship is validated, skip
    if (!has8to10 && !has12to10) {
      continue;
    }

    // If both relationships are validated, emit one composite pattern
    if (has8to10 && has12to10) {
      const pattern = buildCompositeDusthanaPattern(network, validationResult);
      patterns.push(pattern);
    } else if (has8to10) {
      const pattern = buildDusthanaPattern(network, 8, validationResult);
      patterns.push(pattern);
    } else if (has12to10) {
      const pattern = buildDusthanaPattern(network, 12, validationResult);
      patterns.push(pattern);
    }
  }

  // Sort by identityKey for deterministic output
  return patterns.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}

/**
 * Builds a composite dusthana pattern for networks with both 8↔10 and 12↔10 relationships.
 * Mechanisms are the union of both mechanism sets.
 *
 * Uses buildPatternProvenance for strict validation and canonical provenance construction.
 */
function buildCompositeDusthanaPattern(
  network: CareerHouseNetwork,
  validationResult: DusthanaRelationshipValidationResult
): CareerPattern {
  const family = 'DUSTHANA_TRANSFORMATION';
  const classification = 'DUSTHANA_CAREER_TRANSFORMATION';
  const topology = network.topology;
  const direction = network.direction;

  // Get validated relationship IDs for both pairs
  const validatedRelationships = validationResult.validations.filter(
    (v) =>
    ((v.dusthanaHouse === 8 || v.dusthanaHouse === 12) &&
      v.careerAnchorHouse === 10 &&
      v.status === 'VALIDATED' &&
      v.sourceNetworkIds.includes(network.networkId))
  );

  const establishingRelationshipIds: string[] = Array.from(
    new Set(validatedRelationships.flatMap((v) => v.relationshipIds))
  ).sort();

  const ruleIds = Array.from(new Set(validatedRelationships.flatMap((v) => v.provenance.ruleIds))).sort();
  const ruleId = ruleIds[0] || 'RULE_DUSTHANA_COMPOSITE_8_12_TO_10';

  // Use buildPatternProvenance for validation and canonical construction
  const provenanceResult = buildPatternProvenance(
    {
      sourceNetworkIds: [network.networkId],
      ruleId,
      establishingRelationshipIds,
      supportingRelationshipIds: []
    },
    network
  );

  const relationshipIds = provenanceResult.provenance.relationshipIds;

  // P2-06D: Identity consumes establishingRelationshipIds ONLY (not all network edges)
  const identityKey = buildCareerPatternIdentityKey(
    family,
    classification,
    network.houses,
    topology,
    establishingRelationshipIds
  );

  const patternId = buildCareerPatternId(identityKey);
  const name = 'Dusthana Career Transformation (Composite)';

  // Union of both mechanism sets
  const mechanisms = [...new Set([...MECHANISMS_8_TO_10, ...MECHANISMS_12_TO_10])].sort();

  return Object.freeze({
    patternId,
    identityKey,
    family,
    level: 'HOUSE_NETWORK',
    classification,
    name,
    topology,
    direction,
    houses: network.houses,
    houseRoles: DUSTHANA_HOUSE_ROLES,
    planets: network.lords,
    networkIds: [network.networkId],
    relationshipIds,
    mechanisms,
    relationships: [],
    evidence: provenanceResult.evidence,
    provenance: provenanceResult.provenance
  });
}
