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
 * Returns the exact edge identity keys that establish the directed relationship in each direction.
 */
function detectCrossLordship(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const matchedKeys: string[] = [];
  const dusthanaLords = getLordsOfHouse(network.relationships, dusthanaHouse);
  const anchorLords = getLordsOfHouse(network.relationships, careerAnchorHouse);

  // Check dusthana -> anchor direction
  for (const edge of network.relationships) {
    // (1) OCCUPIES: dusthana lord occupies anchor
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (dusthanaLords.includes(planet) && house === careerAnchorHouse) {
          matchedKeys.push(edge.identityKey);
        }
      }
    }

    // (2) ASPECTS: dusthana lord aspects anchor house
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (dusthanaLords.includes(planet) && house === careerAnchorHouse) {
          matchedKeys.push(edge.identityKey);
        }
      }
    }
  }

  // (3) Planet-level ASPECTS: dusthana lord aspects anchor lord
  for (const sourceLord of dusthanaLords) {
    for (const targetLord of anchorLords) {
      if (sourceLord !== targetLord) {
        for (const edge of network.relationships) {
          if (edge.type === 'ASPECTS') {
            const edgePlanet = parsePlanetFromNodeKey(edge.sourceNodeId);
            const edgeTarget = parsePlanetFromNodeKey(edge.targetNodeId);
            if (edgePlanet === sourceLord && edgeTarget === targetLord) {
              matchedKeys.push(edge.identityKey);
            }
          }
        }
      }
    }
  }

  // Check anchor -> dusthana direction (same logic, swapped houses)
  for (const edge of network.relationships) {
    // (1) OCCUPIES: anchor lord occupies dusthana
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (anchorLords.includes(planet) && house === dusthanaHouse) {
          matchedKeys.push(edge.identityKey);
        }
      }
    }

    // (2) ASPECTS: anchor lord aspects dusthana house
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (anchorLords.includes(planet) && house === dusthanaHouse) {
          matchedKeys.push(edge.identityKey);
        }
      }
    }
  }

  // (3) Planet-level ASPECTS: anchor lord aspects dusthana lord
  for (const sourceLord of anchorLords) {
    for (const targetLord of dusthanaLords) {
      if (sourceLord !== targetLord) {
        for (const edge of network.relationships) {
          if (edge.type === 'ASPECTS') {
            const edgePlanet = parsePlanetFromNodeKey(edge.sourceNodeId);
            const edgeTarget = parsePlanetFromNodeKey(edge.targetNodeId);
            if (edgePlanet === sourceLord && edgeTarget === targetLord) {
              matchedKeys.push(edge.identityKey);
            }
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects CONJUNCTION relationship between lords of two houses.
 * Returns the CONJUNCT edges between the two houses' lord pairs plus the two LORD_OF edges identifying those lords.
 */
function detectConjunction(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const matchedKeys: string[] = [];
  const lordsA = getLordsOfHouse(network.relationships, dusthanaHouse);
  const lordsB = getLordsOfHouse(network.relationships, careerAnchorHouse);

  // First, collect all LORD_OF edges for the lords of both houses
  const lordOfEdges = new Map<Planet, string>();
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && (house === dusthanaHouse || house === careerAnchorHouse)) {
        lordOfEdges.set(planet, edge.identityKey);
      }
    }
  }

  // Then, check for CONJUNCT edges between lords
  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      const nodeA = `PLANET:${lordA}`;
      const nodeB = `PLANET:${lordB}`;

      for (const edge of network.relationships) {
        if (edge.type === 'CONJUNCT') {
          const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
          const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;
          if (connectsAToB || connectsBToA) {
            // Add the CONJUNCT edge
            matchedKeys.push(edge.identityKey);
            // Add the LORD_OF edges for both lords
            if (lordOfEdges.has(lordA)) {
              matchedKeys.push(lordOfEdges.get(lordA)!);
            }
            if (lordOfEdges.has(lordB)) {
              matchedKeys.push(lordOfEdges.get(lordB)!);
            }
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects ASPECT relationship between lords of two houses.
 * Returns the ASPECTS edges between the two houses' lord pairs plus the two LORD_OF edges identifying those lords.
 */
function detectAspect(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const matchedKeys: string[] = [];
  const lordsA = getLordsOfHouse(network.relationships, dusthanaHouse);
  const lordsB = getLordsOfHouse(network.relationships, careerAnchorHouse);

  // First, collect all LORD_OF edges for the lords of both houses
  const lordOfEdges = new Map<Planet, string>();
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && (house === dusthanaHouse || house === careerAnchorHouse)) {
        lordOfEdges.set(planet, edge.identityKey);
      }
    }
  }

  // Then, check for ASPECTS edges between lords (either direction)
  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      const nodeA = `PLANET:${lordA}`;
      const nodeB = `PLANET:${lordB}`;

      for (const edge of network.relationships) {
        if (edge.type === 'ASPECTS') {
          const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
          const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;
          if (connectsAToB || connectsBToA) {
            // Add the ASPECTS edge
            matchedKeys.push(edge.identityKey);
            // Add the LORD_OF edges for both lords
            if (lordOfEdges.has(lordA)) {
              matchedKeys.push(lordOfEdges.get(lordA)!);
            }
            if (lordOfEdges.has(lordB)) {
              matchedKeys.push(lordOfEdges.get(lordB)!);
            }
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects EXCHANGE relationship between lords of two houses.
 * Returns the EXCHANGES edges between the two houses' lord pairs plus the two LORD_OF edges identifying those lords.
 */
function detectExchange(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const matchedKeys: string[] = [];
  const lordsA = getLordsOfHouse(network.relationships, dusthanaHouse);
  const lordsB = getLordsOfHouse(network.relationships, careerAnchorHouse);

  // First, collect all LORD_OF edges for the lords of both houses
  const lordOfEdges = new Map<Planet, string>();
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && (house === dusthanaHouse || house === careerAnchorHouse)) {
        lordOfEdges.set(planet, edge.identityKey);
      }
    }
  }

  // Then, check for EXCHANGES edges between lords (bidirectional)
  for (const lordA of lordsA) {
    for (const lordB of lordsB) {
      const nodeA = `PLANET:${lordA}`;
      const nodeB = `PLANET:${lordB}`;

      for (const edge of network.relationships) {
        if (edge.type === 'EXCHANGES') {
          const connectsAToB = edge.sourceNodeId === nodeA && edge.targetNodeId === nodeB;
          const connectsBToA = edge.sourceNodeId === nodeB && edge.targetNodeId === nodeA;
          if (connectsAToB || connectsBToA) {
            // Add the EXCHANGES edge
            matchedKeys.push(edge.identityKey);
            // Add the LORD_OF edges for both lords
            if (lordOfEdges.has(lordA)) {
              matchedKeys.push(lordOfEdges.get(lordA)!);
            }
            if (lordOfEdges.has(lordB)) {
              matchedKeys.push(lordOfEdges.get(lordB)!);
            }
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects HOUSE_PLACEMENT relationship.
 * Returns the OCCUPIES edge(s) + the dusthana LORD_OF edge.
 */
function detectHousePlacement(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const matchedKeys: string[] = [];
  const dusthanaLords = getLordsOfHouse(network.relationships, dusthanaHouse);

  // First, collect all LORD_OF edges for dusthana lords
  const lordOfEdges = new Map<Planet, string>();
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && house === dusthanaHouse) {
        lordOfEdges.set(planet, edge.identityKey);
      }
    }
  }

  // Then, check for OCCUPIES edges
  for (const edge of network.relationships) {
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        // Check if dusthana lord occupies career anchor house
        if (dusthanaLords.includes(planet) && house === careerAnchorHouse) {
          // Add the OCCUPIES edge
          matchedKeys.push(edge.identityKey);
          // Add the LORD_OF edge for this dusthana lord
          if (lordOfEdges.has(planet)) {
            matchedKeys.push(lordOfEdges.get(planet)!);
          }
        }
      }
    }
  }

  return Object.freeze(matchedKeys);
}

/**
 * Detects PLANET_MEDIATED relationship.
 * Shared planet participation with no direct edge.
 * Uses hasPlanetMediatedRelationship from P2-06A predicates.
 *
 * NOTE: This detector stays coarse (returns empty array when detected) because PLANET_MEDIATED
 * is defined by the ABSENCE of direct house-to-house relationships. Collecting edge IDs would
 * require tracking all participating edges (lordship, OCCUPIES, ASPECTS) that establish the
 * shared participation, which is complex and potentially misleading since the relationship
 * is semantically about what's NOT present rather than what IS present.
 */
function detectPlanetMediated(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  if (hasPlanetMediatedRelationship(network, dusthanaHouse, careerAnchorHouse)) {
    // Return empty array to indicate detection without specific edge IDs
    return Object.freeze([]);
  }
  return Object.freeze([]);
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
      relationshipType: 'NONE',
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
      relationshipType: 'NONE',
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
      let ids: readonly string[] = [];

      switch (relType) {
        case 'COMMON_LORD':
          ids = detectCommonLord(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'CROSS_LORDSHIP':
          ids = detectCrossLordship(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'CONJUNCTION':
          ids = detectConjunction(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'ASPECT':
          ids = detectAspect(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'EXCHANGE':
          ids = detectExchange(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'HOUSE_PLACEMENT':
          ids = detectHousePlacement(network, dusthanaHouse, careerAnchorHouse);
          break;
        case 'PLANET_MEDIATED':
          ids = detectPlanetMediated(network, dusthanaHouse, careerAnchorHouse);
          break;
        default:
          ids = [];
      }

      if (ids.length > 0) {
        detected = true;
        detectedNetworkIds.push(network.networkId);
        detectedRelationshipIds.push(...ids);
      }
    }

    if (detected) {
      // Dedup relationshipIds
      const uniqueRelationshipIds = Array.from(new Set(detectedRelationshipIds)).sort();

      // Construct evidence records for each detected relationship
      const evidenceIds: string[] = [];
      const uniqueNetworkIds = Array.from(new Set(detectedNetworkIds)).sort();

      for (const networkId of uniqueNetworkIds) {
        // For each network that detected this relationship, create an evidence record
        const networkIndex = relevantNetworks.findIndex(n => n.networkId === networkId);
        if (networkIndex !== -1) {
          const network = relevantNetworks[networkIndex];
          // Use a unique delimiter that won't appear in network IDs
          const evidenceId = `EVIDENCE|${relType}|H${dusthanaHouse}|H${careerAnchorHouse}|${networkId}`;
          evidenceIds.push(evidenceId);
        }
      }

      const validation: DusthanaRelationshipValidation = {
        validationId: generateValidationId(relType, dusthanaHouse, careerAnchorHouse, 'AGGREGATED'),
        dusthanaHouse,
        careerAnchorHouse,
        relationshipType: relType,
        status: 'VALIDATED',
        relationshipIds: uniqueRelationshipIds,
        evidenceIds,
        sourceNetworkIds: uniqueNetworkIds,
        provenance: {
          sourceNetworkIds: uniqueNetworkIds,
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
      relationshipType: 'NONE',
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

  // Construct evidence records for all validated relationships
  const evidence: DusthanaRelationshipEvidence[] = [];
  for (const validation of allValidations) {
    if (validation.status === 'VALIDATED') {
      for (const evidenceId of validation.evidenceIds) {
        // Parse the networkId from the evidenceId (format: EVIDENCE|TYPE|H#|H#|NETWORK_ID)
        const parts = evidenceId.split('|');
        const networkId = parts[4];
        const network = networks.find(n => n.networkId === networkId);

        if (network) {
          const evidenceRecord: DusthanaRelationshipEvidence = {
            evidenceId,
            relationshipId: validation.relationshipIds.join(','), // Reference the establishing edges
            relationshipType: validation.relationshipType,
            dusthanaHouse: validation.dusthanaHouse,
            careerAnchorHouse: validation.careerAnchorHouse,
            sourceNetworkId: networkId,
            sourceNetworkIdentityKey: network.identityKey
          };
          evidence.push(evidenceRecord);
        }
      }
    }
  }

  return Object.freeze({
    validations: Object.freeze(allValidations),
    validatedPairCount: validatedPairs.size,
    insufficientPairCount: insufficientPairs.size,
    relationshipIds: Object.freeze(allRelationshipIds),
    provenance,
    evidence: Object.freeze(evidence)
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

  // Note: aggregateDusthanaRelationshipValidation does not reconstruct evidence records
  // since it only has validations, not the original networks. Evidence construction
  // requires network access to resolve sourceNetworkIdentityKey.
  // In this case, we return an empty evidence array.
  return Object.freeze({
    validations: Object.freeze(validations),
    validatedPairCount: validatedPairs.size,
    insufficientPairCount: insufficientPairs.size,
    relationshipIds: Object.freeze(allRelationshipIds),
    provenance,
    evidence: Object.freeze([])
  });
}
