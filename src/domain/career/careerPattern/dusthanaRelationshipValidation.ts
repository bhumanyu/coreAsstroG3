import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import { Planet } from '../../../types';
import {
  hasCommonLordRelationship,
  hasConjunctionRelationship,
  hasLordAspectRelationship,
  hasExchangeRelationship,
  hasDirectedHouseRelationship,
  hasPlanetMediatedRelationship,
  getLordsOfHouse,
  buildLordshipMap
} from './careerPatternPredicates';
import type {
  DusthanaRelationshipType,
  DusthanaRelationshipStatus,
  DusthanaRelationshipValidation,
  DusthanaRelationshipEvidence,
  DusthanaRelationshipProvenance,
  DusthanaRelationshipValidationConfig,
  DusthanaRelationshipValidationResult
} from './dusthanaRelationshipTypes';
import {
  DEFAULT_DUSTHANA_RELATIONSHIP_VALIDATION_CONFIG
} from './dusthanaRelationshipTypes';

/**
 * P2-06B Dusthana Relationship Validation
 *
 * This module validates structural relationships between dusthana houses (6,8,12) and
 * career anchor houses (2,6,10,11). This is a structural relationship VALIDATOR — no scoring,
 * no confidence numbers, no mechanism inference, no dignity/Dasha/D10/transit/timing.
 *
 * Follows P2-06A's frozen relationship semantics in careerPatternPredicates.ts.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 */

/**
 * Normalizes provenance by deduplicating and deterministically sorting arrays.
 * Local implementation to avoid cross-module provenance shape compatibility issues.
 */
function normalizeProvenance(
  sourceNetworkIds: readonly string[],
  relationshipIds: readonly string[],
  ruleIds: readonly string[],
  parentIds: readonly string[]
): DusthanaRelationshipProvenance {
  return Object.freeze({
    sourceNetworkIds: Object.freeze(Array.from(new Set(sourceNetworkIds)).sort()),
    relationshipIds: Object.freeze(Array.from(new Set(relationshipIds)).sort()),
    ruleIds: Object.freeze(Array.from(new Set(ruleIds)).sort()),
    parentIds: Object.freeze(Array.from(new Set(parentIds)).sort())
  });
}

/**
 * Helper to extract house number from a node key.
 */
function parseHouseFromNodeKey(key: string): number | null {
  if (key.startsWith('HOUSE:')) {
    return parseInt(key.slice(6), 10);
  }
  return null;
}

/**
 * Helper to extract planet name from a node key.
 */
function parsePlanetFromNodeKey(key: string): Planet | null {
  if (key.startsWith('PLANET:')) {
    const planetName = key.slice(7);
    if (Object.values(Planet).includes(planetName as Planet)) {
      return planetName as Planet;
    }
  }
  return null;
}

/**
 * Normalizes a relationship identity key for undirected relationship types.
 * For undirected types, endpoints are sorted canonically (e.g., REL:CONJUNCT:MERCURY:SATURN).
 * For directed types, order is preserved (e.g., REL:HOUSE_PLACEMENT:H8:H10).
 */
function normalizeRelationshipIdentity(
  relationshipType: DusthanaRelationshipType,
  source: string,
  target: string
): string {
  const undirectedTypes: Set<DusthanaRelationshipType> = new Set([
    'COMMON_LORD',
    'CONJUNCTION',
    'ASPECT',
    'EXCHANGE',
    'PLANET_MEDIATED'
  ]);

  if (undirectedTypes.has(relationshipType)) {
    // Sort endpoints for undirected types
    const [a, b] = [source, target].sort();
    return `REL:${relationshipType}:${a}:${b}`;
  } else {
    // Preserve order for directed types
    return `REL:${relationshipType}:${source}:${target}`;
  }
}

/**
 * Generates a deterministic validationId from normalized identity + pair.
 */
function generateValidationId(
  relationshipType: DusthanaRelationshipType,
  dusthanaHouse: number,
  careerAnchorHouse: number,
  networkId: string
): string {
  const pair = relationshipType === 'HOUSE_PLACEMENT' || relationshipType === 'CROSS_LORDSHIP'
    ? `H${dusthanaHouse}:H${careerAnchorHouse}`
    : `H${Math.min(dusthanaHouse, careerAnchorHouse)}:H${Math.max(dusthanaHouse, careerAnchorHouse)}`;
  return `VALIDATION:${relationshipType}:${pair}:${networkId}`;
}

/**
 * Detects COMMON_LORD relationship between two houses.
 * Returns the exact LORD_OF edge identity keys for the shared planet.
 * Uses hasCommonLordRelationship from P2-06A predicates.
 */
function detectCommonLord(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  if (!hasCommonLordRelationship(network, dusthanaHouse, careerAnchorHouse)) {
    return [];
  }

  const lordshipMap = buildLordshipMap(network.relationships);
  const matchedKeys: string[] = [];

  for (const [planet, houses] of lordshipMap) {
    if (houses.has(dusthanaHouse) && houses.has(careerAnchorHouse)) {
      // Find the LORD_OF edges for this planet to both houses
      for (const edge of network.relationships) {
        if (edge.type === 'LORD_OF') {
          const edgePlanet = parsePlanetFromNodeKey(edge.sourceNodeId);
          const edgeHouse = parseHouseFromNodeKey(edge.targetNodeId);
          if (edgePlanet === planet && (edgeHouse === dusthanaHouse || edgeHouse === careerAnchorHouse)) {
            matchedKeys.push(edge.identityKey);
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects CROSS_LORDSHIP relationship.
 * Planet lords dusthana and occupies/aspects career anchor (and reverse).
 */
function detectCrossLordship(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  // Check if dusthana lord occupies career anchor
  if (hasDirectedHouseRelationship(network, dusthanaHouse, careerAnchorHouse)) {
    return true;
  }
  // Check if career anchor lord occupies dusthana
  if (hasDirectedHouseRelationship(network, careerAnchorHouse, dusthanaHouse)) {
    return true;
  }
  return false;
}

/**
 * Detects CONJUNCTION relationship between lords of two houses.
 * Uses hasConjunctionRelationship from P2-06A predicates.
 */
function detectConjunction(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  return hasConjunctionRelationship(network, dusthanaHouse, careerAnchorHouse);
}

/**
 * Detects ASPECT relationship between lords of two houses.
 * Uses hasLordAspectRelationship from P2-06A predicates.
 */
function detectAspect(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  return hasLordAspectRelationship(network, dusthanaHouse, careerAnchorHouse);
}

/**
 * Detects EXCHANGE relationship between lords of two houses.
 * Uses hasExchangeRelationship from P2-06A predicates.
 */
function detectExchange(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  return hasExchangeRelationship(network, dusthanaHouse, careerAnchorHouse);
}

/**
 * Detects HOUSE_PLACEMENT relationship.
 * OCCUPIES of dusthana body/lord in anchor house.
 */
function detectHousePlacement(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  const dusthanaLords = getLordsOfHouse(network.relationships, dusthanaHouse);

  for (const edge of network.relationships) {
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        // Check if dusthana lord occupies career anchor house
        if (dusthanaLords.includes(planet) && house === careerAnchorHouse) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Detects PLANET_MEDIATED relationship.
 * Shared planet participation with no direct edge.
 * Uses hasPlanetMediatedRelationship from P2-06A predicates.
 */
function detectPlanetMediated(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  return hasPlanetMediatedRelationship(network, dusthanaHouse, careerAnchorHouse);
}

/**
 * Checks if there is sufficient data to detect relationships.
 * Returns true if lordship edges are present for both houses.
 */
function hasSufficientData(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): boolean {
  const dusthanaLords = getLordsOfHouse(network.relationships, dusthanaHouse);
  const anchorLords = getLordsOfHouse(network.relationships, careerAnchorHouse);

  // If both houses have at least one lord, we have sufficient data
  return dusthanaLords.length > 0 && anchorLords.length > 0;
}

/**
 * Validates relationships for a specific dusthana-anchor pair across all networks.
 */
function validatePair(
  networks: readonly CareerHouseNetwork[],
  dusthanaHouse: number,
  careerAnchorHouse: number
): DusthanaRelationshipValidation[] {
  const validations: DusthanaRelationshipValidation[] = [];
  const pairKey = `H${dusthanaHouse}:H${careerAnchorHouse}`;

  // Find networks containing both houses
  const relevantNetworks = networks.filter(
    net => net.houses.includes(dusthanaHouse) && net.houses.includes(careerAnchorHouse)
  );

  // If no networks contain both houses, emit NOT_VALIDATED
  if (relevantNetworks.length === 0) {
    const validation: DusthanaRelationshipValidation = {
      validationId: `VALIDATION:NO_NETWORK:${pairKey}`,
      dusthanaHouse,
      careerAnchorHouse,
      relationshipType: 'COMMON_LORD', // Placeholder - no relationship detected
      status: 'NOT_VALIDATED',
      relationshipIds: [],
      evidenceIds: [],
      sourceNetworkIds: [],
      provenance: {
        sourceNetworkIds: [],
        relationshipIds: [],
        ruleIds: ['RULE_NO_SHARED_NETWORK'],
        parentIds: []
      }
    };
    validations.push(validation);
    return validations;
  }

  // Check for sufficient data in relevant networks
  const hasData = relevantNetworks.some(net =>
    hasSufficientData(net, dusthanaHouse, careerAnchorHouse)
  );

  if (!hasData) {
    // INSUFFICIENT_DATA: lordship edges absent
    const validation: DusthanaRelationshipValidation = {
      validationId: `VALIDATION:INSUFFICIENT_DATA:${pairKey}`,
      dusthanaHouse,
      careerAnchorHouse,
      relationshipType: 'COMMON_LORD', // Placeholder
      status: 'INSUFFICIENT_DATA',
      relationshipIds: [],
      evidenceIds: [],
      sourceNetworkIds: relevantNetworks.map(n => n.networkId),
      provenance: {
        sourceNetworkIds: relevantNetworks.map(n => n.networkId),
        relationshipIds: [],
        ruleIds: ['RULE_INSUFFICIENT_DATA'],
        parentIds: []
      }
    };
    validations.push(validation);
    return validations;
  }

  // Detect each relationship type across all relevant networks
  const relationshipTypes: readonly DusthanaRelationshipType[] = Object.freeze([
    'COMMON_LORD',
    'CROSS_LORDSHIP',
    'CONJUNCTION',
    'ASPECT',
    'EXCHANGE',
    'HOUSE_PLACEMENT',
    'PLANET_MEDIATED'
  ]);

  for (const relType of relationshipTypes) {
    let detected = false;
    const detectedNetworkIds: string[] = [];
    const detectedRelationshipIds: string[] = [];

    for (const network of relevantNetworks) {
      let isDetected = false;

      switch (relType) {
        case 'COMMON_LORD':
          isDetected = detectCommonLord(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'CROSS_LORDSHIP':
          isDetected = detectCrossLordship(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'CONJUNCTION':
          isDetected = detectConjunction(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'ASPECT':
          isDetected = detectAspect(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'EXCHANGE':
          isDetected = detectExchange(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'HOUSE_PLACEMENT':
          isDetected = detectHousePlacement(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'PLANET_MEDIATED':
          isDetected = detectPlanetMediated(network, dusthanaHouse, careerAnchorHouse);
          break;
        default:
          isDetected = false;
      }

      if (isDetected) {
        detected = true;
        detectedNetworkIds.push(network.networkId);
        detectedRelationshipIds.push(...network.relationships.map(r => r.identityKey));
      }
    }

    if (detected) {
      // Dedup relationshipIds
      const uniqueRelationshipIds = Array.from(new Set(detectedRelationshipIds)).sort();

      const validation: DusthanaRelationshipValidation = {
        validationId: generateValidationId(relType, dusthanaHouse, careerAnchorHouse, 'AGGREGATED'),
        dusthanaHouse,
        careerAnchorHouse,
        relationshipType: relType,
        status: 'VALIDATED',
        relationshipIds: uniqueRelationshipIds,
        evidenceIds: [
          `EVIDENCE:${relType}:H${dusthanaHouse}:H${careerAnchorHouse}`
        ],
        sourceNetworkIds: Array.from(new Set(detectedNetworkIds)).sort(),
        provenance: {
          sourceNetworkIds: Array.from(new Set(detectedNetworkIds)).sort(),
          relationshipIds: uniqueRelationshipIds,
          ruleIds: [`RULE_DETECT_${relType}`],
          parentIds: []
        }
      };
      validations.push(validation);
    }
  }

  // If no relationships detected but data is sufficient, emit NOT_VALIDATED
  if (validations.length === 0) {
    const validation: DusthanaRelationshipValidation = {
      validationId: `VALIDATION:NOT_VALIDATED:${pairKey}`,
      dusthanaHouse,
      careerAnchorHouse,
      relationshipType: 'COMMON_LORD', // Placeholder
      status: 'NOT_VALIDATED',
      relationshipIds: [],
      evidenceIds: [],
      sourceNetworkIds: relevantNetworks.map(n => n.networkId),
      provenance: {
        sourceNetworkIds: relevantNetworks.map(n => n.networkId),
        relationshipIds: [],
        ruleIds: ['RULE_NO_RELATIONSHIP_DETECTED'],
        parentIds: []
      }
    };
    validations.push(validation);
  }

  return validations;
}

/**
 * Validates dusthana relationships for all dusthana-anchor pairs across networks.
 *
 * For every D×A pair:
 * - Find networks containing both houses → none → NOT_VALIDATED
 * - Run detectors over network.relationships and network.lords
 * - Emit one relationship fact per type actually established
 *
 * Multiple relationship types per pair coexist (never collapse to one).
 * Multi-lord houses evaluate ALL lord combinations.
 * Identity normalization: undirected types normalize endpoints canonically; directed types keep order.
 * Dedup by relationshipId across networks.
 *
 * @param networks - The career house networks to validate
 * @param config - Configuration for dusthana and anchor houses
 * @returns Dusthana relationship validation result
 */
export function validateDusthanaRelationships(
  networks: readonly CareerHouseNetwork[],
  config: DusthanaRelationshipValidationConfig = DEFAULT_DUSTHANA_RELATIONSHIP_VALIDATION_CONFIG
): DusthanaRelationshipValidationResult {
  const allValidations: DusthanaRelationshipValidation[] = [];

  // Validate each dusthana-anchor pair
  for (const dusthanaHouse of config.dusthanaHouses) {
    for (const careerAnchorHouse of config.careerAnchorHouses) {
      const pairValidations = validatePair(networks, dusthanaHouse, careerAnchorHouse);
      allValidations.push(...pairValidations);
    }
  }

  // Count validated and insufficient pairs
  const validatedPairs = new Set<string>();
  const insufficientPairs = new Set<string>();

  for (const validation of allValidations) {
    const pairKey = `H${validation.dusthanaHouse}:H${validation.careerAnchorHouse}`;
    if (validation.status === 'VALIDATED') {
      validatedPairs.add(pairKey);
    } else if (validation.status === 'INSUFFICIENT_DATA') {
      insufficientPairs.add(pairKey);
    }
  }

  // Collect all relationshipIds (deduped and sorted)
  const allRelationshipIds = Array.from(
    new Set(allValidations.flatMap(v => v.relationshipIds))
  ).sort();

  // Build provenance
  const allSourceNetworkIds = networks.map(n => n.networkId);
  const allRuleIds = Array.from(new Set(allValidations.flatMap(v => v.provenance.ruleIds)));
  const allParentIds = Array.from(new Set(allValidations.flatMap(v => v.provenance.parentIds)));

  const provenance = normalizeProvenance(
    allSourceNetworkIds,
    allRelationshipIds,
    allRuleIds,
    allParentIds
  );

  return Object.freeze({
    validations: Object.freeze(allValidations),
    validatedPairCount: validatedPairs.size,
    insufficientPairCount: insufficientPairs.size,
    relationshipIds: Object.freeze(allRelationshipIds),
    provenance
  });
}

/**
 * Aggregates dusthana relationship validation results.
 *
 * Per-pair results are never merged across pairs.
 * Returns counts + deduped sorted relationshipIds.
 * No overall score.
 *
 * @param validations - The validations to aggregate
 * @returns Aggregated validation result
 */
export function aggregateDusthanaRelationshipValidation(
  validations: readonly DusthanaRelationshipValidation[]
): DusthanaRelationshipValidationResult {
  // Count validated and insufficient pairs
  const validatedPairs = new Set<string>();
  const insufficientPairs = new Set<string>();

  for (const validation of validations) {
    const pairKey = `H${validation.dusthanaHouse}:H${validation.careerAnchorHouse}`;
    if (validation.status === 'VALIDATED') {
      validatedPairs.add(pairKey);
    } else if (validation.status === 'INSUFFICIENT_DATA') {
      insufficientPairs.add(pairKey);
    }
  }

  // Collect all relationshipIds (deduped and sorted)
  const allRelationshipIds = Array.from(
    new Set(validations.flatMap(v => v.relationshipIds))
  ).sort();

  // Collect all sourceNetworkIds (deduped and sorted)
  const allSourceNetworkIds = Array.from(
    new Set(validations.flatMap(v => v.sourceNetworkIds))
  ).sort();

  // Collect all ruleIds (deduped and sorted)
  const allRuleIds = Array.from(
    new Set(validations.flatMap(v => v.provenance.ruleIds))
  ).sort();

  // Collect all parentIds (deduped and sorted)
  const allParentIds = Array.from(
    new Set(validations.flatMap(v => v.provenance.parentIds))
  ).sort();

  const provenance = normalizeProvenance(
    allSourceNetworkIds,
    allRelationshipIds,
    allRuleIds,
    allParentIds
  );

  return Object.freeze({
    validations: Object.freeze(validations),
    validatedPairCount: validatedPairs.size,
    insufficientPairCount: insufficientPairs.size,
    relationshipIds: Object.freeze(allRelationshipIds),
    provenance
  });
}
