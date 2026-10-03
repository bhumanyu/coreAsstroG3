import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPattern } from './careerPatternTypes';
import type { CareerPatternClassificationEvidence, CareerPatternClassificationProvenance } from './careerPatternTypes';
import type { CareerPatternHouseRole } from './careerPatternTypes';
import type { CareerMechanism } from './careerPatternTypes';
import { buildCareerPatternIdentityKey, buildCareerPatternId } from './careerPatternIdentity';
import type { CareerNetworkTopology, CareerNetworkDirection } from '../careerGraph/careerHouseNetworkTypes';
import type { Planet } from '../../../types';

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
 * Missing relationship → no pattern
 * Missing planet data → mechanism MIXED (not negative)
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
 * Mechanism mapping for 8↔10 patterns based on participating planets.
 * Per spec §15: inferred from participating planets, not house negativity.
 */
function inferMechanismsFor8to10(planets: readonly Planet[]): readonly CareerMechanism[] {
  if (planets.length === 0) {
    return ['MIXED'];
  }

  const mechanisms: Set<CareerMechanism> = new Set();

  // Mechanism inference based on planetary nature
  // This is a simplified mapping - full implementation would use planetary attributes
  // from C5/C6 relevance/condition data
  for (const planet of planets) {
    switch (planet) {
      case 'SATURN':
        mechanisms.add('RESEARCH');
        mechanisms.add('INVESTIGATION');
        mechanisms.add('TRANSFORMATION');
        mechanisms.add('COMPLIANCE');
        break;
      case 'MARS':
        mechanisms.add('CRISIS_MANAGEMENT');
        mechanisms.add('TRANSFORMATION');
        mechanisms.add('INVESTIGATION');
        break;
      case 'MERCURY':
        mechanisms.add('TAXATION');
        mechanisms.add('BANKING_FINANCE');
        mechanisms.add('COMPLIANCE');
        mechanisms.add('RESEARCH');
        break;
      case 'JUPITER':
        mechanisms.add('BANKING_FINANCE');
        mechanisms.add('INSURANCE');
        mechanisms.add('COMPLIANCE');
        break;
      case 'VENUS':
        mechanisms.add('BANKING_FINANCE');
        mechanisms.add('INSURANCE');
        break;
      default:
        mechanisms.add('MIXED');
    }
  }

  return mechanisms.size > 0 ? Array.from(mechanisms).sort() : ['MIXED'];
}

/**
 * Mechanism mapping for 12↔10 patterns based on participating planets.
 * Per spec §16: inferred from participating planets, not house negativity.
 */
function inferMechanismsFor12to10(planets: readonly Planet[]): readonly CareerMechanism[] {
  if (planets.length === 0) {
    return ['MIXED'];
  }

  const mechanisms: Set<CareerMechanism> = new Set();

  // Mechanism inference based on planetary nature
  for (const planet of planets) {
    switch (planet) {
      case 'SATURN':
        mechanisms.add('INSTITUTIONAL_WORK');
        mechanisms.add('REMOTE_WORK');
        mechanisms.add('ISOLATED_ENVIRONMENT' as CareerMechanism);
        break;
      case 'JUPITER':
        mechanisms.add('FOREIGN_WORK');
        mechanisms.add('INSTITUTIONAL_WORK');
        break;
      case 'RAHU':
        mechanisms.add('FOREIGN_WORK');
        mechanisms.add('REMOTE_WORK');
        mechanisms.add('INSTITUTIONAL_WORK');
        break;
      case 'KETU':
        mechanisms.add('ISOLATED_ENVIRONMENT' as CareerMechanism);
        mechanisms.add('REMOTE_WORK');
        mechanisms.add('INSTITUTIONAL_WORK');
        break;
      default:
        mechanisms.add('MIXED');
    }
  }

  return mechanisms.size > 0 ? Array.from(mechanisms).sort() : ['MIXED'];
}

/**
 * Checks if a network contains an 8↔10 relationship.
 */
function has8to10Relationship(network: CareerHouseNetwork): boolean {
  const houses = network.houses;
  return houses.includes(8) && houses.includes(10);
}

/**
 * Checks if a network contains a 12↔10 relationship.
 */
function has12to10Relationship(network: CareerHouseNetwork): boolean {
  const houses = network.houses;
  return houses.includes(12) && houses.includes(10);
}

/**
 * Builds a dusthana transformation pattern from a network.
 */
function buildDusthanaPattern(
  network: CareerHouseNetwork,
  dusthanaHouse: 8 | 12
): CareerPattern {
  const family = 'DUSTHANA_TRANSFORMATION';
  const classification = 'DUSTHANA_CAREER_TRANSFORMATION';
  const topology = network.topology;
  const direction = network.direction;

  const identityKey = buildCareerPatternIdentityKey(
    family,
    classification,
    network.houses,
    topology,
    network.relationships.map(r => r.identityKey)
  );

  const patternId = buildCareerPatternId(identityKey);
  const name = 'Dusthana Career Transformation';

  // Infer mechanisms based on participating planets
  const mechanisms = dusthanaHouse === 8
    ? inferMechanismsFor8to10(network.lords)
    : inferMechanismsFor12to10(network.lords);

  const relationshipIds = network.relationships.map(r => r.identityKey).sort();

  const evidence: readonly CareerPatternClassificationEvidence[] = Object.freeze([{
    evidenceId: `P2-06B-EVIDENCE:DUSTHANA_${dusthanaHouse}_TO_10:${network.identityKey}`,
    ruleId: `RULE_DUSTHANA_${dusthanaHouse}_TO_10`,
    sourceNetworkId: network.networkId,
    sourceNetworkIdentityKey: network.identityKey
  }]);

  const provenance: CareerPatternClassificationProvenance = {
    sourceNetworkIds: [network.networkId],
    relationshipIds,
    ruleIds: [`RULE_DUSTHANA_${dusthanaHouse}_TO_10`]
  };

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
    evidence,
    provenance
  });
}

/**
 * Detects dusthana transformation patterns from career house networks.
 * Per spec §13–16: detects 8↔10 and 12↔10 relationships with mechanism classification.
 *
 * Hard rule: never maps house 8/12/6 to NEGATIVE direction.
 * Missing relationship → no pattern.
 * Missing planet data → mechanism MIXED (not negative).
 *
 * @param networks - The career house networks to analyze
 * @returns Array of dusthana transformation patterns
 */
export function detectDusthanaPatterns(
  networks: readonly CareerHouseNetwork[]
): readonly CareerPattern[] {
  const patterns: CareerPattern[] = [];

  for (const network of networks) {
    // Check for 8↔10 relationship
    if (has8to10Relationship(network)) {
      const pattern = buildDusthanaPattern(network, 8);
      patterns.push(pattern);
    }

    // Check for 12↔10 relationship
    if (has12to10Relationship(network)) {
      const pattern = buildDusthanaPattern(network, 12);
      patterns.push(pattern);
    }
  }

  // Sort by identityKey for deterministic output
  return patterns.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}
