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
 * See docs/career/phase2/P2-06B-DUSTHANA-RELATIONSHIP-VALIDATION.md for detailed semantics.
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
 * LORD_OF edges are included only as supporting context alongside establishing edges, never alone.
 */
function detectCrossLordship(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  const establishingIds: string[] = [];
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
          establishingIds.push(edge.identityKey);
        }
      }
    }

    // (2) ASPECTS: dusthana lord aspects anchor house
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (dusthanaLords.includes(planet) && house === careerAnchorHouse) {
          establishingIds.push(edge.identityKey);
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
              establishingIds.push(edge.identityKey);
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
          establishingIds.push(edge.identityKey);
        }
      }
    }

    // (2) ASPECTS: anchor lord aspects dusthana house
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        if (anchorLords.includes(planet) && house === dusthanaHouse) {
          establishingIds.push(edge.identityKey);
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
              establishingIds.push(edge.identityKey);
            }
          }
        }
      }
    }
  }

  // If no establishing edge exists, return [] (do NOT include LORD_OF alone)
  if (establishingIds.length === 0) {
    return Object.freeze([]);
  }

  // Append LORD_OF edges as supporting context for the establishing edges
  const lordIds: string[] = [];
  for (const edge of network.relationships) {
    if (edge.type === 'LORD_OF') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);

      if (planet && house !== null) {
        // Include lords of dusthana house that participate in establishing edges
        if (dusthanaLords.includes(planet) && house === dusthanaHouse) {
          lordIds.push(edge.identityKey);
        }
        // Include lords of career anchor house for planet-level ASPECTS establishing edges
        if (anchorLords.includes(planet) && house === careerAnchorHouse) {
          lordIds.push(edge.identityKey);
        }
      }
    }
  }

  return Object.freeze(Array.from(new Set([...establishingIds, ...lordIds])).sort());
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
 * Returns the establishing edge IDs: the shared planet's LORD_OF/OCCUPIES/ASPECTS edges
 * into both dusthanaHouse and careerAnchorHouse. These shared-participation edges are the
 * establishing evidence for the PLANET_MEDIATED relationship.
 */
function detectPlanetMediated(
  network: CareerHouseNetwork,
  dusthanaHouse: number,
  careerAnchorHouse: number
): readonly string[] {
  if (!hasPlanetMediatedRelationship(network, dusthanaHouse, careerAnchorHouse)) {
    return Object.freeze([]);
  }

  const matchedKeys: string[] = [];
  const sharedPlanets: Set<Planet> = new Set();

  // Find planets that participate in both houses via OCCUPIES
  const occupiedByDusthana: Set<Planet> = new Set();
  const occupiedByAnchor: Set<Planet> = new Set();
  for (const edge of network.relationships) {
    if (edge.type === 'OCCUPIES') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && house !== null) {
        if (house === dusthanaHouse) occupiedByDusthana.add(planet);
        if (house === careerAnchorHouse) occupiedByAnchor.add(planet);
      }
    }
  }
  for (const planet of occupiedByDusthana) {
    if (occupiedByAnchor.has(planet)) {
      sharedPlanets.add(planet);
    }
  }

  // Find planets that participate in both houses via ASPECTS
  const aspectedByDusthana: Set<Planet> = new Set();
  const aspectedByAnchor: Set<Planet> = new Set();
  for (const edge of network.relationships) {
    if (edge.type === 'ASPECTS') {
      const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
      const house = parseHouseFromNodeKey(edge.targetNodeId);
      if (planet && house !== null) {
        if (house === dusthanaHouse) aspectedByDusthana.add(planet);
        if (house === careerAnchorHouse) aspectedByAnchor.add(planet);
      }
    }
  }
  for (const planet of aspectedByDusthana) {
    if (aspectedByAnchor.has(planet)) {
      sharedPlanets.add(planet);
    }
  }

  // Collect all edges from shared planets to either house
  // P2-06B freeze: LORD_OF edges from shared planets ARE included when lordship is the participation mechanism
  // OCCUPIES/ASPECTS edges from shared planets also count as establishing evidence
  for (const edge of network.relationships) {
    const planet = parsePlanetFromNodeKey(edge.sourceNodeId);
    const house = parseHouseFromNodeKey(edge.targetNodeId);

    if (planet && house !== null && sharedPlanets.has(planet)) {
      if (house === dusthanaHouse || house === careerAnchorHouse) {
        if (edge.type === 'LORD_OF' || edge.type === 'OCCUPIES' || edge.type === 'ASPECTS') {
          matchedKeys.push(edge.identityKey);
        }
      }
    }
  }

  return Object.freeze(Array.from(new Set(matchedKeys)).sort());
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
 * Structured evidence candidate for a detected relationship.
 * Tracks which edge established the relationship in which network.
 */
interface EvidenceCandidate {
  networkId: string;
  networkIdentityKey: string;
  relationshipId: string;
  relationshipType: DusthanaRelationshipType;
  dusthanaHouse: number;
  careerAnchorHouse: number;
}

/**
 * Validates relationships for a specific dusthana-anchor pair across all networks.
 * Returns validations with structured evidence candidates attached.
 */
function validatePair(
  networks: readonly CareerHouseNetwork[],
  dusthanaHouse: number,
  careerAnchorHouse: number
): { validations: DusthanaRelationshipValidation[]; evidenceCandidates: EvidenceCandidate[] } {
  const validations: DusthanaRelationshipValidation[] = [];
  const evidenceCandidates: EvidenceCandidate[] = [];
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
    return { validations, evidenceCandidates };
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
    return { validations, evidenceCandidates };
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

        // Create one evidence candidate per (edge, network) pair
        for (const relationshipId of ids) {
          evidenceCandidates.push({
            networkId: network.networkId,
            networkIdentityKey: network.identityKey,
            relationshipId,
            relationshipType: relType,
            dusthanaHouse,
            careerAnchorHouse
          });
        }
      }
    }

    if (detected) {
      // Dedup relationshipIds
      const uniqueRelationshipIds = Array.from(new Set(detectedRelationshipIds)).sort();

      // Generate evidenceIds deterministically from evidence candidates
      // Validation-level evidenceId is a per-network key (omits relationshipId) for grouping evidence by network
      // Evidence record evidenceId is a per-edge key (includes relationshipId) for identifying specific edges
      // Both are opaque deterministic identity keys; consumers must use structured fields and must not parse the string
      const evidenceIds: string[] = [];
      const uniqueNetworkIds = Array.from(new Set(detectedNetworkIds)).sort();

      for (const networkId of uniqueNetworkIds) {
        // For each network that detected this relationship, create an evidenceId
        // Format: EVIDENCE|<type>|H<dusthana>|H<anchor>|<networkId>
        const evidenceId = `EVIDENCE|${relType}|H${dusthanaHouse}|H${careerAnchorHouse}|${networkId}`;
        evidenceIds.push(evidenceId);
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

  return { validations, evidenceCandidates };
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
  const allEvidenceCandidates: EvidenceCandidate[] = [];

  // Validate each dusthana-anchor pair
  for (const dusthanaHouse of config.dusthanaHouses) {
    for (const careerAnchorHouse of config.careerAnchorHouses) {
      const { validations, evidenceCandidates } = validatePair(networks, dusthanaHouse, careerAnchorHouse);
      allValidations.push(...validations);
      allEvidenceCandidates.push(...evidenceCandidates);
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

  // Deduplicate evidence candidates by tuple (relationshipType, dusthanaHouse, careerAnchorHouse, networkId, relationshipId)
  // This ensures exactly one DusthanaRelationshipEvidence per unique establishing edge
  const dedupedCandidatesMap = new Map<string, EvidenceCandidate>();
  for (const candidate of allEvidenceCandidates) {
    const dedupKey = `${candidate.relationshipType}|${candidate.dusthanaHouse}|${candidate.careerAnchorHouse}|${candidate.networkId}|${candidate.relationshipId}`;
    if (!dedupedCandidatesMap.has(dedupKey)) {
      dedupedCandidatesMap.set(dedupKey, candidate);
    }
  }

  // Sort deduplicated candidates deterministically before evidence construction
  // Order: relationshipType, dusthanaHouse, careerAnchorHouse, networkId, relationshipId
  const dedupedCandidates = Array.from(dedupedCandidatesMap.values()).sort((a, b) => {
    if (a.relationshipType !== b.relationshipType) return a.relationshipType.localeCompare(b.relationshipType);
    if (a.dusthanaHouse !== b.dusthanaHouse) return a.dusthanaHouse - b.dusthanaHouse;
    if (a.careerAnchorHouse !== b.careerAnchorHouse) return a.careerAnchorHouse - b.careerAnchorHouse;
    if (a.networkId !== b.networkId) return a.networkId.localeCompare(b.networkId);
    return a.relationshipId.localeCompare(b.relationshipId);
  });

  // Construct evidence records from deduplicated, sorted candidates - one per relationshipId
  // evidenceId is an opaque deterministic identity key; consumers must use structured fields
  // (relationshipType, dusthanaHouse, careerAnchorHouse, sourceNetworkId, relationshipId) and must not parse the string
  const evidence: DusthanaRelationshipEvidence[] = [];
  for (const candidate of dedupedCandidates) {
    // Generate evidenceId deterministically from structured fields
    const evidenceId = `EVIDENCE|${candidate.relationshipType}|H${candidate.dusthanaHouse}|H${candidate.careerAnchorHouse}|${candidate.networkId}|${candidate.relationshipId}`;

    const evidenceRecord: DusthanaRelationshipEvidence = {
      evidenceId,
      relationshipId: candidate.relationshipId, // Single relationshipId, no commas
      relationshipType: candidate.relationshipType,
      dusthanaHouse: candidate.dusthanaHouse,
      careerAnchorHouse: candidate.careerAnchorHouse,
      sourceNetworkId: candidate.networkId,
      sourceNetworkIdentityKey: candidate.networkIdentityKey
    };
    evidence.push(evidenceRecord);
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
 * Summarizes dusthana relationship validation results.
 *
 * This is a summary-only projection that computes counts and provenance from validations.
 * It does NOT reconstruct evidence records since it only has validations, not the original networks.
 * Evidence construction requires network access to resolve sourceNetworkIdentityKey.
 *
 * For the canonical validation object with full evidence, use validateDusthanaRelationships directly.
 *
 * Per-pair results are never merged across pairs.
 * Returns counts + deduped sorted relationshipIds.
 * No overall score.
 *
 * @param validations - The validations to summarize
 * @returns Summary validation result (evidence array is empty)
 */
export function summarizeDusthanaRelationshipValidation(
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

  // Note: summarizeDusthanaRelationshipValidation does not reconstruct evidence records
  // since it only has validations, not the original networks. Evidence construction
  // requires network access to resolve sourceNetworkIdentityKey.
  // This is a summary-only projection; for full evidence use validateDusthanaRelationships.
  return Object.freeze({
    validations: Object.freeze(validations),
    validatedPairCount: validatedPairs.size,
    insufficientPairCount: insufficientPairs.size,
    relationshipIds: Object.freeze(allRelationshipIds),
    provenance,
    evidence: Object.freeze([])
  });
}

/**
 * @deprecated Use summarizeDusthanaRelationshipValidation instead.
 * This function is kept for backward compatibility but will be removed in a future version.
 */
export function aggregateDusthanaRelationshipValidation(
  validations: readonly DusthanaRelationshipValidation[]
): DusthanaRelationshipValidationResult {
  return summarizeDusthanaRelationshipValidation(validations);
}
