import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerYogaPattern } from './careerPatternTypes';
import type { Planet } from '../../../types';

/**
 * P2-06C Career Yoga Detector
 *
 * This module detects Career Yoga structural patterns.
 * Per spec §20: structural-only representation with no strength/condition/dasha/d10 fields.
 *
 * This detector identifies planetary yoga formations that are career-relevant based on
 * house relationships and lordships. It does NOT calculate strength, qualification, or
 * activation potential - those are handled by P2-04 and later layers.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Checks if a network is career-relevant.
 * A network is career-relevant if it includes any career house (2, 6, 10, 11).
 */
function isCareerRelevantNetwork(network: CareerHouseNetwork): boolean {
  const careerHouses = [2, 6, 10, 11];
  return network.houses.some(h => careerHouses.includes(h));
}

/**
 * Builds a CareerYogaPattern from a network.
 * Per spec §20: structural-only with participants, houseRelationships, lordships, careerRelevant, evidenceIds, ruleIds.
 */
function buildCareerYogaPattern(
  network: CareerHouseNetwork,
  ruleId: string
): CareerYogaPattern {
  const yogaId = `CAREER_YOGA:${network.identityKey}`;
  const identityKey = yogaId;
  const name = 'Career Yoga Structure';

  // Extract participants (planets involved)
  const participants = network.lords;

  // Build house relationships map
  const houseRelationships: Record<string, readonly number[]> = {};
  for (const house of network.houses) {
    houseRelationships[`HOUSE_${house}`] = network.houses.filter(h => h !== house);
  }

  // Build lordships map
  const lordships: Partial<Record<Planet, readonly number[]>> = {};
  for (const planet of network.lords) {
    lordships[planet] = network.houses;
  }

  const careerRelevant = isCareerRelevantNetwork(network);

  return Object.freeze({
    yogaId,
    identityKey,
    name,
    participants,
    houseRelationships: Object.freeze(houseRelationships),
    lordships: Object.freeze(lordships),
    careerRelevant,
    evidenceIds: network.evidenceIds,
    ruleIds: [ruleId]
  });
}

/**
 * Detects Career Yoga patterns from career house networks.
 * Per spec §20: structural-only detection based on house relationships and lordships.
 *
 * This is a simplified detector that identifies basic yoga formations.
 * Full implementation would consume existing CareerYoga infrastructure from P2-03
 * but P2-06 only emits the structural pattern without strength/qualification.
 *
 * @param networks - The career house networks to analyze
 * @returns Array of Career Yoga patterns
 */
export function detectCareerYogaPatterns(
  networks: readonly CareerHouseNetwork[]
): readonly CareerYogaPattern[] {
  const patterns: CareerYogaPattern[] = [];

  for (const network of networks) {
    // Only consider networks with multiple planets (yoga formations)
    if (network.lords.length < 2) {
      continue;
    }

    // Only consider career-relevant networks
    if (!isCareerRelevantNetwork(network)) {
      continue;
    }

    // Build yoga pattern
    const pattern = buildCareerYogaPattern(network, 'RULE_CAREER_YOGA_STRUCTURE');
    patterns.push(pattern);
  }

  // Sort by identityKey for deterministic output
  return patterns.sort((a, b) => a.identityKey.localeCompare(b.identityKey));
}
