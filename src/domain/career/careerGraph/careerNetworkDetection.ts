import type {
  CareerAstroGraph,
  CareerGraphNode,
  CareerGraphEdge,
  CareerGraphProvenance
} from './careerAstroGraphTypes';
import type {
  CareerNetworkDetectionInput,
  CareerNetworkDetectionResult,
  CareerHouseConnection,
  CareerDirectedHouseConnection
} from './careerNetworkDetectionTypes';
import type { CareerHouseNetwork } from './careerHouseNetworkTypes';
import { Planet } from '../../../types';
import { classifyCareerHouse } from '../careerTypes';
import { resolveCareerNetworkTopology, resolveCareerNetworkDirection } from './careerNetworkDetectionRules';
import { buildCareerHouseNetwork } from './careerHouseNetwork';
import { CANONICAL_CAREER_PLANET_ORDER } from './careerGraphConstants';
import { normalizeCareerGraphProvenance, mergeCareerGraphProvenances } from './careerAstroGraphProvenance';

/**
 * P2-02 Career Network Detection
 *
 * This module provides deterministic network detection from CareerAstroGraph to CareerHouseNetwork[].
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 *
 * It is a pure structural adapter over the CareerAstroGraph.
 *
 * Pipeline:
 * 1. Extract HOUSE nodes filtered through classifyCareerHouse (exclude 'NEUTRAL')
 * 2. Extract edges touching those houses
 * 3. Build a house-projection graph marking connections:
 *    - DIRECT: both endpoints are houses, or explicit house-linking relationship
 *    - SHARED_PARTICIPANT: houses connected only via a shared planet node
 * 4. Find connected components over the projected graph (sorted BFS, numeric ordering)
 * 5. Per component: resolve topology (on projected adjacency) and direction (from directed connections)
 * 6. Collect lords via planet-node parsing sorted by canonical planet order
 * 7. Build provenance by unioning edge.provenance.sourceIds/ruleIds/parentIds (never fabricate)
 * 8. Build evidenceIds as unique+sorted union of edge.provenance.sourceIds
 * 9. Call buildCareerHouseNetwork(...)
 * 10. Sort output networks by identityKey
 * 11. Deep-freeze the result
 */

/**
 * Parses a house node ID to extract the house number.
 * Format: HOUSE:{n}
 */
function parseHouseNode(nodeId: string): number {
  const match = nodeId.match(/^HOUSE:(\d+)$/);
  if (!match) {
    throw new Error(`Invalid house node ID: ${nodeId}`);
  }
  const houseNum = parseInt(match[1], 10);
  if (houseNum < 1 || houseNum > 12) {
    throw new Error(`House number out of bounds: ${houseNum}`);
  }
  return houseNum;
}

/**
 * Parses a planet node ID to extract the planet enum.
 * Format: PLANET:{PLANET}
 */
function parsePlanetNode(nodeId: string): Planet {
  const match = nodeId.match(/^PLANET:(.+)$/);
  if (!match) {
    throw new Error(`Invalid planet node ID: ${nodeId}`);
  }
  const planetKey = match[1];

  // Validate against Planet enum
  const validPlanets: Planet[] = [
    Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY,
    Planet.JUPITER, Planet.VENUS, Planet.SATURN, Planet.RAHU, Planet.KETU
  ];

  if (!validPlanets.includes(planetKey as Planet)) {
    throw new Error(`Invalid planet: ${planetKey}`);
  }

  return planetKey as Planet;
}

/**
 * Extracts relevant house nodes from the graph, filtering out NEUTRAL houses.
 */
function extractRelevantHouseNodes(
  graph: CareerAstroGraph
): Map<number, CareerGraphNode> {
  const houseNodes = new Map<number, CareerGraphNode>();

  for (const node of graph.nodes) {
    if (node.type === 'HOUSE') {
      const houseNum = parseHouseNode(node.nodeId);
      const classification = classifyCareerHouse(houseNum);

      // Exclude NEUTRAL houses from network detection
      if (classification !== 'NEUTRAL') {
        houseNodes.set(houseNum, node);
      }
    }
  }

  return houseNodes;
}

/**
 * Extracts edges that touch the relevant house nodes.
 */
function extractRelevantEdges(
  graph: CareerAstroGraph,
  relevantHouseNodeIds: Set<string>
): CareerGraphEdge[] {
  const relevantEdges: CareerGraphEdge[] = [];

  for (const edge of graph.edges) {
    // Include edge if it touches any relevant house node
    if (relevantHouseNodeIds.has(edge.sourceNodeId) ||
      relevantHouseNodeIds.has(edge.targetNodeId)) {
      relevantEdges.push(edge);
    }
  }

  return relevantEdges;
}

/**
 * Builds a house-projection graph with DIRECT and SHARED_PARTICIPANT connections.
 * Records directed connections to preserve flow through projection.
 */
function buildHouseProjection(
  relevantHouseNodes: Map<number, CareerGraphNode>,
  relevantEdges: CareerGraphEdge[]
): Map<string, CareerHouseConnection> {
  const connections = new Map<string, CareerHouseConnection>();
  const relevantHouseNodeIds = new Set(
    Array.from(relevantHouseNodes.values()).map(n => n.nodeId)
  );

  // Track planet nodes that connect to houses, with direction info
  // Map: planetNodeId -> Set<{houseNum, direction: 'PLANET_TO_HOUSE' | 'HOUSE_TO_PLANET'}>
  const planetToHouses = new Map<string, Set<{ houseNum: number, direction: 'PLANET_TO_HOUSE' | 'HOUSE_TO_PLANET' }>>();

  for (const edge of relevantEdges) {
    const sourceNode = edge.sourceNodeId;
    const targetNode = edge.targetNodeId;

    // Check if this is a direct house-to-house connection
    const sourceIsHouse = relevantHouseNodeIds.has(sourceNode);
    const targetIsHouse = relevantHouseNodeIds.has(targetNode);

    if (sourceIsHouse && targetIsHouse) {
      // DIRECT connection between houses
      const houseA = parseHouseNode(sourceNode);
      const houseB = parseHouseNode(targetNode);
      const key = `${Math.min(houseA, houseB)}-${Math.max(houseA, houseB)}`;

      const existing = connections.get(key);
      const directedConnection: CareerDirectedHouseConnection = {
        sourceHouse: houseA,
        targetHouse: houseB,
        sourceEdgeIds: [edge.edgeId]
      };

      connections.set(key, {
        houseA: Math.min(houseA, houseB),
        houseB: Math.max(houseA, houseB),
        kind: 'DIRECT',
        sourceEdgeIds: existing
          ? [...existing.sourceEdgeIds, edge.edgeId]
          : [edge.edgeId],
        participantNodeIds: existing?.participantNodeIds ?? [],
        directedConnections: existing
          ? [...existing.directedConnections, directedConnection]
          : [directedConnection]
      });
    } else if (sourceIsHouse || targetIsHouse) {
      // One endpoint is a house, the other is a planet
      const houseNodeId = sourceIsHouse ? sourceNode : targetNode;
      const planetNodeId = sourceIsHouse ? targetNode : sourceNode;

      const houseNum = parseHouseNode(houseNodeId);
      const direction = sourceIsHouse ? 'HOUSE_TO_PLANET' : 'PLANET_TO_HOUSE';

      // Track this planet-house connection with direction
      if (!planetToHouses.has(planetNodeId)) {
        planetToHouses.set(planetNodeId, new Set());
      }
      planetToHouses.get(planetNodeId)!.add({ houseNum, direction });
    }
  }

  // Build SHARED_PARTICIPANT connections from planet-to-houses mappings
  for (const [planetNodeId, houseInfos] of planetToHouses.entries()) {
    const houseArray = Array.from(houseInfos).map(h => h.houseNum).sort((a, b) => a - b);

    // Create pairwise connections between all houses sharing this planet
    for (let i = 0; i < houseArray.length; i++) {
      for (let j = i + 1; j < houseArray.length; j++) {
        const houseA = houseArray[i];
        const houseB = houseArray[j];
        const key = `${houseA}-${houseB}`;

        // Build directed connections based on planet edge directions
        // Rule: PLANET→HOUSE edges mean flow into each house
        // For SHARED_PARTICIPANT, we record both directions if both houses have PLANET→HOUSE edges
        // Otherwise, we record the dominant direction or HOUSE_TO_PLANET if that's the only direction
        const houseAInfo = Array.from(houseInfos).find(h => h.houseNum === houseA);
        const houseBInfo = Array.from(houseInfos).find(h => h.houseNum === houseB);

        const directedConnections: CareerDirectedHouseConnection[] = [];

        // If both have PLANET→HOUSE, this indicates flow into both houses (bidirectional participant flow)
        if (houseAInfo?.direction === 'PLANET_TO_HOUSE' && houseBInfo?.direction === 'PLANET_TO_HOUSE') {
          // Record both directions as the planet flows into both houses
          directedConnections.push({
            sourceHouse: houseA,
            targetHouse: houseB,
            sourceEdgeIds: []
          });
          directedConnections.push({
            sourceHouse: houseB,
            targetHouse: houseA,
            sourceEdgeIds: []
          });
        } else if (houseAInfo?.direction === 'PLANET_TO_HOUSE') {
          // Flow from planet to houseA, so treat as houseA receiving influence
          directedConnections.push({
            sourceHouse: houseB,
            targetHouse: houseA,
            sourceEdgeIds: []
          });
        } else if (houseBInfo?.direction === 'PLANET_TO_HOUSE') {
          // Flow from planet to houseB, so treat as houseB receiving influence
          directedConnections.push({
            sourceHouse: houseA,
            targetHouse: houseB,
            sourceEdgeIds: []
          });
        } else {
          // Both are HOUSE_TO_PLANET, treat as no clear directional flow
          // Default to houseA→houseB for determinism
          directedConnections.push({
            sourceHouse: houseA,
            targetHouse: houseB,
            sourceEdgeIds: []
          });
        }

        const existing = connections.get(key);
        connections.set(key, {
          houseA,
          houseB,
          kind: existing?.kind === 'DIRECT' ? 'DIRECT' : 'SHARED_PARTICIPANT',
          sourceEdgeIds: existing?.sourceEdgeIds ?? [],
          participantNodeIds: existing
            ? [...existing.participantNodeIds, planetNodeId]
            : [planetNodeId],
          directedConnections: existing
            ? [...existing.directedConnections, ...directedConnections]
            : directedConnections
        });
      }
    }
  }

  return connections;
}

/**
 * Finds connected components in the house projection graph using BFS.
 * Returns components sorted by their minimum house number for determinism.
 */
function findConnectedComponents(
  connections: Map<string, CareerHouseConnection>
): number[][] {
  // Build adjacency map
  const adjacency = new Map<number, Set<number>>();
  const allHouses = new Set<number>();

  for (const conn of connections.values()) {
    allHouses.add(conn.houseA);
    allHouses.add(conn.houseB);

    if (!adjacency.has(conn.houseA)) {
      adjacency.set(conn.houseA, new Set());
    }
    if (!adjacency.has(conn.houseB)) {
      adjacency.set(conn.houseB, new Set());
    }

    adjacency.get(conn.houseA)!.add(conn.houseB);
    adjacency.get(conn.houseB)!.add(conn.houseA);
  }

  // Find connected components using BFS
  const visited = new Set<number>();
  const components: number[][] = [];

  for (const house of Array.from(allHouses).sort((a, b) => a - b)) {
    if (visited.has(house)) {
      continue;
    }

    // BFS to find the component
    const component: number[] = [];
    const queue: number[] = [house];
    visited.add(house);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);

      const neighbors = adjacency.get(current) ?? new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Sort component numerically for determinism
    component.sort((a, b) => a - b);
    components.push(component);
  }

  // Sort components by their minimum house number for determinism
  components.sort((a, b) => {
    const minA = Math.min(...a);
    const minB = Math.min(...b);
    return minA - minB;
  });

  return components;
}

/**
 * Extracts lords (planets) from edges touching the houses in a component.
 * Returns lords sorted by canonical planet order.
 */
function extractLordsForComponent(
  componentHouses: number[],
  relevantEdges: CareerGraphEdge[]
): Planet[] {
  const lords = new Set<Planet>();
  const componentHouseNodeIds = new Set(
    componentHouses.map(h => `HOUSE:${h}`)
  );

  for (const edge of relevantEdges) {
    // Check if edge touches any house in this component
    if (componentHouseNodeIds.has(edge.sourceNodeId) ||
      componentHouseNodeIds.has(edge.targetNodeId)) {
      // Extract planet nodes from this edge
      if (edge.sourceNodeId.startsWith('PLANET:')) {
        lords.add(parsePlanetNode(edge.sourceNodeId));
      }
      if (edge.targetNodeId.startsWith('PLANET:')) {
        lords.add(parsePlanetNode(edge.targetNodeId));
      }
    }
  }

  // Sort by canonical planet order
  const lordsArray = Array.from(lords);
  lordsArray.sort((a, b) => {
    const indexA = CANONICAL_CAREER_PLANET_ORDER.indexOf(a);
    const indexB = CANONICAL_CAREER_PLANET_ORDER.indexOf(b);
    return indexA - indexB;
  });

  return lordsArray;
}

/**
 * Extracts relationships (edges) for a component.
 */
function extractRelationshipsForComponent(
  componentHouses: number[],
  relevantEdges: CareerGraphEdge[]
): CareerGraphEdge[] {
  const componentHouseNodeIds = new Set(
    componentHouses.map(h => `HOUSE:${h}`)
  );

  const relationships: CareerGraphEdge[] = [];
  const seenEdgeIds = new Set<string>();

  for (const edge of relevantEdges) {
    // Include edge if it touches any house in this component
    if (componentHouseNodeIds.has(edge.sourceNodeId) ||
      componentHouseNodeIds.has(edge.targetNodeId)) {
      if (!seenEdgeIds.has(edge.edgeId)) {
        seenEdgeIds.add(edge.edgeId);
        relationships.push(edge);
      }
    }
  }

  return relationships;
}

/**
 * Detects career house networks from the CareerAstroGraph.
 *
 * @param input - The detection input containing the graph
 * @returns A frozen detection result with networks sorted by identityKey
 */
export function detectCareerHouseNetworks(
  input: CareerNetworkDetectionInput
): CareerNetworkDetectionResult {
  const { graph } = input;

  // Step 1: Extract relevant house nodes (exclude NEUTRAL)
  const relevantHouseNodes = extractRelevantHouseNodes(graph);
  const relevantHouseNodeIds = new Set(
    Array.from(relevantHouseNodes.values()).map(n => n.nodeId)
  );

  // Step 2: Extract edges touching those houses
  const relevantEdges = extractRelevantEdges(graph, relevantHouseNodeIds);

  // Step 3: Build house projection graph
  const connections = buildHouseProjection(relevantHouseNodes, relevantEdges);

  // Step 4: Find connected components
  const components = findConnectedComponents(connections);

  // Step 5-9: Build networks for each component
  const networks: CareerHouseNetwork[] = [];

  for (const component of components) {
    if (component.length < 2) {
      // Skip single-house components (not a network)
      continue;
    }

    // Build adjacency for this component
    const componentAdjacency = new Map<number, Set<number>>();
    for (const house of component) {
      componentAdjacency.set(house, new Set());
    }

    for (const conn of connections.values()) {
      if (component.includes(conn.houseA) && component.includes(conn.houseB)) {
        componentAdjacency.get(conn.houseA)!.add(conn.houseB);
        componentAdjacency.get(conn.houseB)!.add(conn.houseA);
      }
    }

    // Resolve direction from connections
    const componentConnections = Array.from(connections.values()).filter(
      conn => component.includes(conn.houseA) && component.includes(conn.houseB)
    );

    // Resolve topology
    const topology = resolveCareerNetworkTopology(component, componentAdjacency, componentConnections);

    const direction = resolveCareerNetworkDirection(componentConnections);

    // Extract lords
    const lords = extractLordsForComponent(component, relevantEdges);

    // Extract relationships
    const relationships = extractRelationshipsForComponent(component, relevantEdges);

    // Build provenance by merging all relationship provenances
    const mergedProvenance = mergeCareerGraphProvenances(
      relationships.map(r => r.provenance)
    );

    // Build evidenceIds as unique+sorted union of sourceIds
    const evidenceIds = Array.from(
      new Set(
        relationships.flatMap(r => r.provenance.sourceIds)
      )
    ).sort();

    // Build the network
    const network = buildCareerHouseNetwork(
      component,
      lords,
      relationships,
      topology,
      direction,
      mergedProvenance,
      evidenceIds
    );

    networks.push(network);
  }

  // Step 10: Sort networks by identityKey
  networks.sort((a, b) => a.identityKey.localeCompare(b.identityKey));

  // Step 11: Deep-freeze the result
  const result: CareerNetworkDetectionResult = Object.freeze({
    networks: Object.freeze(networks)
  });

  return result;
}
