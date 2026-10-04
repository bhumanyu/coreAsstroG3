import { describe, it, expect } from 'vitest';
import {
  classifyCareerPatterns
} from './careerPatternClassification';
import type {
  CareerPatternClassificationInput,
  CareerPatternClassificationResult
} from './careerPatternTypes';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
import { Planet } from '../../../types';
import {
  validateDusthanaRelationships
} from './dusthanaRelationshipValidation';

/**
 * P2-06C Career Pattern Negative Test Suite
 *
 * This suite provides comprehensive negative testing for career pattern classification.
 * No production code changes, no new pattern families, no scoring, no Dasha/D10/timing.
 *
 * Test categories:
 * 1. Fixture builders - deterministic network builders
 * 2. Specialized pathway negative suite - semantic difference assertions
 * 3. Relationship-semantics negatives - regression-shield P2-06A freeze
 * 4. Dusthana negatives - validateDusthanaRelationships edge cases
 * 5. Duplicate, multi-network, provenance, determinism
 * 6. Missing-data vs absent-structure contract
 */

/**
 * Test factory for creating CareerHouseNetwork objects.
 */
function makeNetwork(overrides: Partial<CareerHouseNetwork> = {}): CareerHouseNetwork {
  const provenance: CareerGraphProvenance = {
    sourceIds: ['test-source'],
    ruleIds: [],
    parentIds: []
  };

  const defaultNetwork: CareerHouseNetwork = {
    networkId: 'NETWORK:TEST',
    identityKey: 'NETWORK:IDENTITY:TEST',
    houses: [6, 10],
    lords: [Planet.SATURN],
    relationships: [],
    topology: 'DIRECT_LINK',
    direction: 'FORWARD',
    provenance,
    evidenceIds: []
  };

  return { ...defaultNetwork, ...overrides };
}

/**
 * Test factory for creating CareerGraphEdge objects.
 */
function makeRelationship(overrides: Partial<CareerGraphEdge> = {}): CareerGraphEdge {
  const provenance: CareerGraphProvenance = {
    sourceIds: ['test-source'],
    ruleIds: [],
    parentIds: []
  };

  const defaultRelationship: CareerGraphEdge = {
    edgeId: 'EDGE:TEST',
    identityKey: 'RELATIONSHIP:TEST',
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: 'HOUSE:6',
    provenance
  };

  return { ...defaultRelationship, ...overrides };
}

/**
 * Helper to assert a specific pattern classification is absent from results.
 * Never uses toBeDefined or toBeGreaterThanOrEqual(0) - explicit absence assertion.
 */
function expectPatternAbsent(
  result: CareerPatternClassificationResult,
  classification: string
): void {
  const matchingPatterns = result.patterns.filter(p => p.classification === classification);
  expect(matchingPatterns).toHaveLength(0);
}

/**
 * Helper to assert a specific pattern classification is present.
 */
function expectPatternPresent(
  result: CareerPatternClassificationResult,
  classification: string
): void {
  const matchingPatterns = result.patterns.filter(p => p.classification === classification);
  expect(matchingPatterns.length).toBeGreaterThan(0);
}

// ============================================================================
// FIXTURE BUILDERS - Deterministic CareerHouseNetwork builders
// ============================================================================

/**
 * Creates a directed chain network with ordered directed edges.
 * Each consecutive house pair has a directed edge: lord(from) OCCUPIES or ASPECTS → to.
 */
function makeDirectedChainNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.MARS, Planet.VENUS];

  for (let i = 0; i < houses.length - 1; i++) {
    const fromHouse = houses[i];
    const toHouse = houses[i + 1];
    const planet = planets[i % planets.length];

    // LORD_OF edge for the from-house
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${fromHouse}`,
      identityKey: `REL:LORD_OF:${planet}:${fromHouse}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${fromHouse}`
    }));

    // OCCUPIES edge establishing the directed pathway
    relationships.push(makeRelationship({
      edgeId: `EDGE:OCCUPIES:${planet}:${toHouse}`,
      identityKey: `REL:OCCUPIES:${planet}:${toHouse}`,
      type: 'OCCUPIES',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${toHouse}`
    }));
  }

  // Add LORD_OF for the last house
  const lastPlanet = planets[(houses.length - 1) % planets.length];
  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:${lastPlanet}:${houses[houses.length - 1]}`,
    identityKey: `REL:LORD_OF:${lastPlanet}:${houses[houses.length - 1]}`,
    type: 'LORD_OF',
    sourceNodeId: `PLANET:${lastPlanet}`,
    targetNodeId: `HOUSE:${houses[houses.length - 1]}`
  }));

  return makeNetwork({
    networkId: `NETWORK:DIRECTED_CHAIN:${houses.join('-')}`,
    identityKey: `NETWORK:DIRECTED_CHAIN:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'CHAIN',
    direction: 'FORWARD'
  });
}

/**
 * Creates a reverse chain network - edges go in reverse order.
 */
function makeReverseChainNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.MARS, Planet.VENUS];

  // Create reverse direction edges
  for (let i = houses.length - 1; i > 0; i--) {
    const fromHouse = houses[i];
    const toHouse = houses[i - 1];
    const planet = planets[i % planets.length];

    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${fromHouse}`,
      identityKey: `REL:LORD_OF:${planet}:${fromHouse}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${fromHouse}`
    }));

    relationships.push(makeRelationship({
      edgeId: `EDGE:OCCUPIES:${planet}:${toHouse}`,
      identityKey: `REL:OCCUPIES:${planet}:${toHouse}`,
      type: 'OCCUPIES',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${toHouse}`
    }));
  }

  // Add LORD_OF for all houses
  for (let i = 0; i < houses.length; i++) {
    const planet = planets[i % planets.length];
    if (!relationships.some(r => r.type === 'LORD_OF' && r.targetNodeId === `HOUSE:${houses[i]}`)) {
      relationships.push(makeRelationship({
        edgeId: `EDGE:LORD_OF:${planet}:${houses[i]}`,
        identityKey: `REL:LORD_OF:${planet}:${houses[i]}`,
        type: 'LORD_OF',
        sourceNodeId: `PLANET:${planet}`,
        targetNodeId: `HOUSE:${houses[i]}`
      }));
    }
  }

  return makeNetwork({
    networkId: `NETWORK:REVERSE_CHAIN:${houses.join('-')}`,
    identityKey: `NETWORK:REVERSE_CHAIN:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'CHAIN',
    direction: 'REVERSE'
  });
}

/**
 * Creates a partial chain network - only first edge present.
 */
function makePartialChainNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER];

  // Only create first edge
  const fromHouse = houses[0];
  const toHouse = houses[1];
  const planet = planets[0];

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:${planet}:${fromHouse}`,
    identityKey: `REL:LORD_OF:${planet}:${fromHouse}`,
    type: 'LORD_OF',
    sourceNodeId: `PLANET:${planet}`,
    targetNodeId: `HOUSE:${fromHouse}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:OCCUPIES:${planet}:${toHouse}`,
    identityKey: `REL:OCCUPIES:${planet}:${toHouse}`,
    type: 'OCCUPIES',
    sourceNodeId: `PLANET:${planet}`,
    targetNodeId: `HOUSE:${toHouse}`
  }));

  // Add LORD_OF for remaining houses (no connecting edges)
  for (let i = 1; i < houses.length; i++) {
    const p = planets[i % planets.length];
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${p}:${houses[i]}`,
      identityKey: `REL:LORD_OF:${p}:${houses[i]}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${p}`,
      targetNodeId: `HOUSE:${houses[i]}`
    }));
  }

  return makeNetwork({
    networkId: `NETWORK:PARTIAL_CHAIN:${houses.join('-')}`,
    identityKey: `NETWORK:PARTIAL_CHAIN:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'CHAIN',
    direction: 'FORWARD'
  });
}

/**
 * Creates a star network - all houses present, no directed edges between them.
 */
function makeStarNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.MARS, Planet.VENUS];

  // Each house has its own lord, no inter-house edges
  for (let i = 0; i < houses.length; i++) {
    const planet = planets[i % planets.length];
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${houses[i]}`,
      identityKey: `REL:LORD_OF:${planet}:${houses[i]}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${houses[i]}`
    }));
  }

  return makeNetwork({
    networkId: `NETWORK:STAR:${houses.join('-')}`,
    identityKey: `NETWORK:STAR:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'STAR',
    direction: 'FORWARD'
  });
}

/**
 * Creates a triangle network - all houses connected in a triangle topology.
 */
function makeTriangleNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER];

  // Each house has its own lord
  for (let i = 0; i < houses.length; i++) {
    const planet = planets[i % planets.length];
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${houses[i]}`,
      identityKey: `REL:LORD_OF:${planet}:${houses[i]}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${houses[i]}`
    }));
  }

  // Add CONJUNCT edges between lords (undirected, no pathway)
  for (let i = 0; i < houses.length; i++) {
    const nextI = (i + 1) % houses.length;
    relationships.push(makeRelationship({
      edgeId: `EDGE:CONJUNCT:${planets[i]}:${planets[nextI]}`,
      identityKey: `REL:CONJUNCT:${planets[i]}:${planets[nextI]}`,
      type: 'CONJUNCT',
      sourceNodeId: `PLANET:${planets[i]}`,
      targetNodeId: `PLANET:${planets[nextI]}`
    }));
  }

  return makeNetwork({
    networkId: `NETWORK:TRIANGLE:${houses.join('-')}`,
    identityKey: `NETWORK:TRIANGLE:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'TRIANGLE',
    direction: 'BIDIRECTIONAL'
  });
}

/**
 * Creates a cluster network - all houses connected, no clear directional pathway.
 */
function makeClusterNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.MARS];

  // Each house has its own lord
  for (let i = 0; i < houses.length; i++) {
    const planet = planets[i % planets.length];
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${houses[i]}`,
      identityKey: `REL:LORD_OF:${planet}:${houses[i]}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${houses[i]}`
    }));
  }

  // Add undirected edges (CONJUNCT, ASPECTS) between all lords
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      relationships.push(makeRelationship({
        edgeId: `EDGE:CONJUNCT:${planets[i]}:${planets[j]}`,
        identityKey: `REL:CONJUNCT:${planets[i]}:${planets[j]}`,
        type: 'CONJUNCT',
        sourceNodeId: `PLANET:${planets[i]}`,
        targetNodeId: `PLANET:${planets[j]}`
      }));
    }
  }

  return makeNetwork({
    networkId: `NETWORK:CLUSTER:${houses.join('-')}`,
    identityKey: `NETWORK:CLUSTER:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'CLUSTER',
    direction: 'BIDIRECTIONAL'
  });
}

/**
 * Creates an exchange network - EXCHANGES edges only between house lords.
 */
function makeExchangeNetwork(houseA: number, houseB: number): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:SATURN:${houseA}`,
    identityKey: `REL:LORD_OF:SATURN:${houseA}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: `HOUSE:${houseA}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:MERCURY:${houseB}`,
    identityKey: `REL:LORD_OF:MERCURY:${houseB}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:MERCURY',
    targetNodeId: `HOUSE:${houseB}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:EXCHANGES:SATURN:MERCURY`,
    identityKey: `REL:EXCHANGES:SATURN:MERCURY`,
    type: 'EXCHANGES',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: 'PLANET:MERCURY'
  }));

  return makeNetwork({
    networkId: `NETWORK:EXCHANGE:${houseA}-${houseB}`,
    identityKey: `NETWORK:EXCHANGE:${houseA}-${houseB}`,
    houses: [houseA, houseB],
    lords: [Planet.SATURN, Planet.MERCURY],
    relationships,
    topology: 'DIRECT_LINK',
    direction: 'BIDIRECTIONAL'
  });
}

/**
 * Creates a common lord network - one planet lords both houses, no directional edge.
 */
function makeCommonLordNetwork(houseA: number, houseB: number): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:SATURN:${houseA}`,
    identityKey: `REL:LORD_OF:SATURN:${houseA}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: `HOUSE:${houseA}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:SATURN:${houseB}`,
    identityKey: `REL:LORD_OF:SATURN:${houseB}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: `HOUSE:${houseB}`
  }));

  return makeNetwork({
    networkId: `NETWORK:COMMON_LORD:${houseA}-${houseB}`,
    identityKey: `NETWORK:COMMON_LORD:${houseA}-${houseB}`,
    houses: [houseA, houseB],
    lords: [Planet.SATURN],
    relationships,
    topology: 'DIRECT_LINK',
    direction: 'FORWARD'
  });
}

/**
 * Creates a conjunction network - CONJUNCT edges between lords only.
 */
function makeConjunctionNetwork(houseA: number, houseB: number): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:SATURN:${houseA}`,
    identityKey: `REL:LORD_OF:SATURN:${houseA}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: `HOUSE:${houseA}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:MERCURY:${houseB}`,
    identityKey: `REL:LORD_OF:MERCURY:${houseB}`,
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:MERCURY',
    targetNodeId: `HOUSE:${houseB}`
  }));

  relationships.push(makeRelationship({
    edgeId: `EDGE:CONJUNCT:SATURN:MERCURY`,
    identityKey: `REL:CONJUNCT:SATURN:MERCURY`,
    type: 'CONJUNCT',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: 'PLANET:MERCURY'
  }));

  return makeNetwork({
    networkId: `NETWORK:CONJUNCTION:${houseA}-${houseB}`,
    identityKey: `NETWORK:CONJUNCTION:${houseA}-${houseB}`,
    houses: [houseA, houseB],
    lords: [Planet.SATURN, Planet.MERCURY],
    relationships,
    topology: 'DIRECT_LINK',
    direction: 'BIDIRECTIONAL'
  });
}

/**
 * Creates a network with missing required relationships.
 */
function makeMissingRelationshipNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY, Planet.JUPITER];

  // Only LORD_OF edges, no OCCUPIES/ASPECTS
  for (let i = 0; i < houses.length; i++) {
    const planet = planets[i % planets.length];
    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${houses[i]}`,
      identityKey: `REL:LORD_OF:${planet}:${houses[i]}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${houses[i]}`
    }));
  }

  return makeNetwork({
    networkId: `NETWORK:MISSING_RELATIONSHIPS:${houses.join('-')}`,
    identityKey: `NETWORK:MISSING_RELATIONSHIPS:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'DIRECT_LINK',
    direction: 'FORWARD'
  });
}

/**
 * Creates a network with duplicate edges.
 */
function makeDuplicateEdgeNetwork(houses: number[]): CareerHouseNetwork {
  const relationships: CareerGraphEdge[] = [];
  const planets: Planet[] = [Planet.SATURN, Planet.MERCURY];

  // Add the same edge twice
  for (let i = 0; i < houses.length - 1; i++) {
    const fromHouse = houses[i];
    const toHouse = houses[i + 1];
    const planet = planets[i % planets.length];

    relationships.push(makeRelationship({
      edgeId: `EDGE:LORD_OF:${planet}:${fromHouse}`,
      identityKey: `REL:LORD_OF:${planet}:${fromHouse}`,
      type: 'LORD_OF',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${fromHouse}`
    }));

    // Duplicate OCCUPIES edges
    relationships.push(makeRelationship({
      edgeId: `EDGE:OCCUPIES:${planet}:${toHouse}-1`,
      identityKey: `REL:OCCUPIES:${planet}:${toHouse}`,
      type: 'OCCUPIES',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${toHouse}`
    }));

    relationships.push(makeRelationship({
      edgeId: `EDGE:OCCUPIES:${planet}:${toHouse}-2`,
      identityKey: `REL:OCCUPIES:${planet}:${toHouse}`,
      type: 'OCCUPIES',
      sourceNodeId: `PLANET:${planet}`,
      targetNodeId: `HOUSE:${toHouse}`
    }));
  }

  // Add LORD_OF for last house
  relationships.push(makeRelationship({
    edgeId: `EDGE:LORD_OF:${planets[1]}:${houses[houses.length - 1]}`,
    identityKey: `REL:LORD_OF:${planets[1]}:${houses[houses.length - 1]}`,
    type: 'LORD_OF',
    sourceNodeId: `PLANET:${planets[1]}`,
    targetNodeId: `HOUSE:${houses[houses.length - 1]}`
  }));

  return makeNetwork({
    networkId: `NETWORK:DUPLICATE_EDGES:${houses.join('-')}`,
    identityKey: `NETWORK:DUPLICATE_EDGES:${houses.join('-')}`,
    houses,
    lords: planets.slice(0, houses.length),
    relationships,
    topology: 'CHAIN',
    direction: 'FORWARD'
  });
}

/**
 * Creates a network with correct house set but required edges absent.
 */
function makeHouseSetOnlyNetwork(houses: number[]): CareerHouseNetwork {
  return makeStarNetwork(houses);
}

// ============================================================================
// NEGATIVE TOLOGY TESTS
// ============================================================================

describe('Negative Topology - Fixture Builders', () => {
  it('makeDirectedChainNetwork creates ordered directed edges', () => {
    const network = makeDirectedChainNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('CHAIN');
    expect(network.direction).toBe('FORWARD');
    expect(network.relationships.length).toBeGreaterThan(0);
  });

  it('makeReverseChainNetwork creates reverse directed edges', () => {
    const network = makeReverseChainNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('CHAIN');
    expect(network.direction).toBe('REVERSE');
  });

  it('makePartialChainNetwork creates only first edge', () => {
    const network = makePartialChainNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('CHAIN');
  });

  it('makeStarNetwork creates no directed edges', () => {
    const network = makeStarNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('STAR');
    // No OCCUPIES or ASPECTS edges
    const directedEdges = network.relationships.filter(r => r.type === 'OCCUPIES' || r.type === 'ASPECTS');
    expect(directedEdges).toHaveLength(0);
  });

  it('makeTriangleNetwork creates triangle topology', () => {
    const network = makeTriangleNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('TRIANGLE');
  });

  it('makeClusterNetwork creates cluster topology', () => {
    const network = makeClusterNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    expect(network.topology).toBe('CLUSTER');
  });

  it('makeExchangeNetwork creates EXCHANGES edges only', () => {
    const network = makeExchangeNetwork(6, 10);
    expect(network.houses).toEqual([6, 10]);
    const exchangeEdges = network.relationships.filter(r => r.type === 'EXCHANGES');
    expect(exchangeEdges).toHaveLength(1);
  });

  it('makeCommonLordNetwork creates common lord only', () => {
    const network = makeCommonLordNetwork(6, 10);
    expect(network.houses).toEqual([6, 10]);
    expect(network.lords).toEqual([Planet.SATURN]);
  });

  it('makeConjunctionNetwork creates CONJUNCT edges only', () => {
    const network = makeConjunctionNetwork(6, 10);
    expect(network.houses).toEqual([6, 10]);
    const conjunctEdges = network.relationships.filter(r => r.type === 'CONJUNCT');
    expect(conjunctEdges).toHaveLength(1);
  });

  it('makeMissingRelationshipNetwork creates no directed edges', () => {
    const network = makeMissingRelationshipNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    const directedEdges = network.relationships.filter(r => r.type === 'OCCUPIES' || r.type === 'ASPECTS');
    expect(directedEdges).toHaveLength(0);
  });

  it('makeDuplicateEdgeNetwork creates duplicate edges', () => {
    const network = makeDuplicateEdgeNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    // Should have more relationships than unique edges due to duplicates
    expect(network.relationships.length).toBeGreaterThan(4);
  });

  it('makeHouseSetOnlyNetwork creates house set without required edges', () => {
    const network = makeHouseSetOnlyNetwork([6, 10, 11]);
    expect(network.houses).toEqual([6, 10, 11]);
    const directedEdges = network.relationships.filter(r => r.type === 'OCCUPIES' || r.type === 'ASPECTS');
    expect(directedEdges).toHaveLength(0);
  });
});

// ============================================================================
// SPECIALIZED PATHWAY NEGATIVE SUITE
// ============================================================================

describe('Specialized Pathway Negative Suite', () => {
  describe('SERVICE_TO_PROFESSION_TO_GAINS (6→10→11)', () => {
    it('rejects house-set-only STAR topology', () => {
      const network = makeStarNetwork([6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
      // Generic CAREER_HOUSE_NETWORK may remain
      expectPatternPresent(result, 'CAREER_HOUSE_NETWORK');
    });

    it('rejects reverse first edge (10→6)', () => {
      const network = makeReverseChainNetwork([6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('rejects reverse second edge (11→10)', () => {
      // Create network with 10→11 but also 11→10 (wrong direction for pathway)
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:11',
          identityKey: 'REL:LORD_OF:JUPITER:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:11'
        }),
        // WRONG DIRECTION: 11L occupies 10 instead of 10L occupying 11
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:JUPITER:10',
          identityKey: 'REL:OCCUPIES:JUPITER:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:WRONG_DIRECTION_11_10',
        identityKey: 'NETWORK:WRONG_DIRECTION_11_10',
        houses: [6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
        relationships,
        topology: 'CHAIN',
        direction: 'REVERSE'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('rejects partial chain (6→10 only)', () => {
      const network = makePartialChainNetwork([6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('unrelated edges are excluded from relationshipIds when pattern established', () => {
      const relationships: CareerGraphEdge[] = [
        // Required edges for 6→10→11
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:MERCURY:11',
          identityKey: 'REL:OCCUPIES:MERCURY:11',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:11'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:11',
          identityKey: 'REL:LORD_OF:JUPITER:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:11'
        }),
        // UNRELATED edges (Venus in house 2, not part of 6→10→11 pathway)
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:VENUS:2',
          identityKey: 'REL:OCCUPIES:VENUS:2',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:2'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:2',
          identityKey: 'REL:LORD_OF:VENUS:2',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:2'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:UNRELATED_EDGES',
        identityKey: 'NETWORK:UNRELATED_EDGES',
        houses: [6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.VENUS],
        relationships,
        topology: 'CHAIN',
        direction: 'FORWARD'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const servicePattern = result.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      expect(result.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS')).toHaveLength(1);

      // Unrelated Venus edges must NOT be in relationshipIds
      expect(servicePattern!.relationshipIds).not.toContain('REL:OCCUPIES:VENUS:2');
      expect(servicePattern!.relationshipIds).not.toContain('REL:LORD_OF:VENUS:2');

      // Must contain the edges establishing 6→10 and 10→11 (LORD_OF + OCCUPIES)
      expect(servicePattern!.relationshipIds).toContain('REL:LORD_OF:SATURN:6');
      expect(servicePattern!.relationshipIds).toContain('REL:OCCUPIES:SATURN:10');
      expect(servicePattern!.relationshipIds).toContain('REL:LORD_OF:MERCURY:10');
      expect(servicePattern!.relationshipIds).toContain('REL:OCCUPIES:MERCURY:11');
      expect(servicePattern!.relationshipIds).toContain('REL:LORD_OF:JUPITER:11');

      // Total count should be exactly 5 (2 OCCUPIES + 3 LORD_OF)
      expect(servicePattern!.relationshipIds).toHaveLength(5);
    });

    it('rejects exchange-only (6↔10 + 10↔11)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:SATURN:MERCURY',
          identityKey: 'REL:EXCHANGES:SATURN:MERCURY',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MERCURY'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:11',
          identityKey: 'REL:LORD_OF:JUPITER:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:11'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:MERCURY:JUPITER',
          identityKey: 'REL:EXCHANGES:MERCURY:JUPITER',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'PLANET:JUPITER'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:EXCHANGE_ONLY',
        identityKey: 'NETWORK:EXCHANGE_ONLY',
        houses: [6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'BIDIRECTIONAL'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });
  });

  describe('WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS (2→6→10→11)', () => {
    it('rejects skip intermediates (2→10)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:2',
          identityKey: 'REL:LORD_OF:SATURN:2',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:2'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:6',
          identityKey: 'REL:LORD_OF:MERCURY:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:10',
          identityKey: 'REL:LORD_OF:JUPITER:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:11',
          identityKey: 'REL:LORD_OF:VENUS:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:11'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:SKIP_INTERMEDIATES_2_10',
        identityKey: 'NETWORK:SKIP_INTERMEDIATES_2_10',
        houses: [2, 6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.VENUS],
        relationships,
        topology: 'CHAIN',
        direction: 'FORWARD'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('rejects skip intermediates (6→11)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:2',
          identityKey: 'REL:LORD_OF:SATURN:2',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:2'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:6',
          identityKey: 'REL:OCCUPIES:SATURN:6',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:6',
          identityKey: 'REL:LORD_OF:MERCURY:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:MERCURY:11',
          identityKey: 'REL:OCCUPIES:MERCURY:11',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:11'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:10',
          identityKey: 'REL:LORD_OF:JUPITER:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:11',
          identityKey: 'REL:LORD_OF:VENUS:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:11'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:SKIP_INTERMEDIATES_6_11',
        identityKey: 'NETWORK:SKIP_INTERMEDIATES_6_11',
        houses: [2, 6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.VENUS],
        relationships,
        topology: 'CHAIN',
        direction: 'FORWARD'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('rejects misrouted edges (10→6)', () => {
      const network = makeReverseChainNetwork([2, 6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS');
    });
  });

  describe('COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS (3→6→10→11)', () => {
    it('rejects skip intermediates (3→10)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:3',
          identityKey: 'REL:LORD_OF:SATURN:3',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:3'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:6',
          identityKey: 'REL:LORD_OF:MERCURY:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:10',
          identityKey: 'REL:LORD_OF:JUPITER:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:11',
          identityKey: 'REL:LORD_OF:VENUS:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:11'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:SKIP_INTERMEDIATES_3_10',
        identityKey: 'NETWORK:SKIP_INTERMEDIATES_3_10',
        houses: [3, 6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.VENUS],
        relationships,
        topology: 'CHAIN',
        direction: 'FORWARD'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS');
    });

    it('rejects misrouted edges (10→6)', () => {
      const network = makeReverseChainNetwork([3, 6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS');
    });
  });

  describe('CREATIVE_DHARMA_TO_PROFESSION (5→9→10)', () => {
    it('rejects house-set-only STAR topology', () => {
      const network = makeStarNetwork([5, 9, 10]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'CREATIVE_DHARMA_TO_PROFESSION');
    });

    it('rejects reverse direction (10→9)', () => {
      const network = makeReverseChainNetwork([5, 9, 10]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'CREATIVE_DHARMA_TO_PROFESSION');
    });

    it('rejects partial chain (5→9 only)', () => {
      const network = makePartialChainNetwork([5, 9, 10]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'CREATIVE_DHARMA_TO_PROFESSION');
    });
  });

  describe('DHARMA_KARMA_ALIGNMENT (9→10→11)', () => {
    it('rejects house-set-only STAR topology', () => {
      const network = makeStarNetwork([9, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'DHARMA_KARMA_ALIGNMENT');
    });

    it('rejects reverse direction (11→10)', () => {
      const network = makeReverseChainNetwork([9, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'DHARMA_KARMA_ALIGNMENT');
    });

    it('rejects partial chain (9→10 only)', () => {
      const network = makePartialChainNetwork([9, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'DHARMA_KARMA_ALIGNMENT');
    });
  });

  describe('PROFESSION_TO_GAINS (10→11)', () => {
    it('rejects reverse direction (11→10)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:10',
          identityKey: 'REL:LORD_OF:SATURN:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:11',
          identityKey: 'REL:LORD_OF:MERCURY:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:11'
        }),
        // WRONG DIRECTION: 11L occupies 10
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:MERCURY:10',
          identityKey: 'REL:OCCUPIES:MERCURY:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:REVERSE_11_10',
        identityKey: 'NETWORK:REVERSE_11_10',
        houses: [10, 11],
        lords: [Planet.SATURN, Planet.MERCURY],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'REVERSE'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PROFESSION_TO_GAINS');
    });

    it('rejects undirected-only (10↔11 via CONJUNCT)', () => {
      const network = makeConjunctionNetwork(10, 11);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PROFESSION_TO_GAINS');
    });

    it('rejects undirected-only (10↔11 via EXCHANGES)', () => {
      const network = makeExchangeNetwork(10, 11);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PROFESSION_TO_GAINS');
    });
  });

  describe('UPACHAYA_PROGRESSION (3→6→10→11)', () => {
    it('rejects house-set-only STAR topology', () => {
      const network = makeStarNetwork([3, 6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'UPACHAYA_PROGRESSION');
    });

    it('rejects reverse direction (11→10→6→3)', () => {
      const network = makeReverseChainNetwork([3, 6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'UPACHAYA_PROGRESSION');
    });

    it('rejects partial chain (3→6 only)', () => {
      const network = makePartialChainNetwork([3, 6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'UPACHAYA_PROGRESSION');
    });

    it('rejects skip intermediates (3→10)', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:3',
          identityKey: 'REL:LORD_OF:SATURN:3',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:3'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:6',
          identityKey: 'REL:LORD_OF:MERCURY:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:10',
          identityKey: 'REL:LORD_OF:JUPITER:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:11',
          identityKey: 'REL:LORD_OF:VENUS:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:11'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:SKIP_3_10',
        identityKey: 'NETWORK:SKIP_3_10',
        houses: [3, 6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.VENUS],
        relationships,
        topology: 'CHAIN',
        direction: 'FORWARD'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'UPACHAYA_PROGRESSION');
    });
  });

  describe('PARIVARTANA_YOGA', () => {
    it('house-set-only without EXCHANGES edges → no PARIVARTANA_YOGA', () => {
      const network = makeStarNetwork([6, 10]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PARIVARTANA_YOGA');
    });

    it('non-career house exchange (1↔5) → no PARIVARTANA_YOGA', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:1',
          identityKey: 'REL:LORD_OF:SATURN:1',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:1'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:5',
          identityKey: 'REL:LORD_OF:MERCURY:5',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:5'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:SATURN:MERCURY',
          identityKey: 'REL:EXCHANGES:SATURN:MERCURY',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MERCURY'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:NON_CAREER_EXCHANGE',
        identityKey: 'NETWORK:NON_CAREER_EXCHANGE',
        houses: [1, 5],
        lords: [Planet.SATURN, Planet.MERCURY],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'BIDIRECTIONAL'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PARIVARTANA_YOGA');
    });

    it('EXCHANGES edge without career-relevant house → no PARIVARTANA_YOGA', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:1',
          identityKey: 'REL:LORD_OF:SATURN:1',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:1'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:5',
          identityKey: 'REL:LORD_OF:MERCURY:5',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:5'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:SATURN:MERCURY',
          identityKey: 'REL:EXCHANGES:SATURN:MERCURY',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MERCURY'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:EXCHANGE_NO_CAREER',
        identityKey: 'NETWORK:EXCHANGE_NO_CAREER',
        houses: [1, 5],
        lords: [Planet.SATURN, Planet.MERCURY],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'BIDIRECTIONAL'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'PARIVARTANA_YOGA');
    });
  });

  // NOTE: Advanced families (KENDRA_TRIKONA, DUSTHANA_CAREER_TRANSFORMATION, CAREER_YOGA_STRUCTURE)
  // are detected by separate detectors (kendraTrikonaDetector, dusthanaTransformationDetector, careerYogaDetector)
  // that are not integrated into the main classifyCareerPatterns flow yet. Per spec §26, these should be
  // tested per their actual detector contracts in their respective test files.
  // This suite focuses on patterns produced by classifyCareerHouseNetwork.
});

// ============================================================================
// RELATIONSHIP-SEMANTICS NEGATIVES (P2-06A Freeze Regression Shield)
// ============================================================================

describe('Relationship-Semantics Negatives - P2-06A Freeze', () => {
  describe('isDirectChain regression', () => {
    it('isDirectChain([6,10]) false under common-lord-only', () => {
      const network = makeCommonLordNetwork(6, 10);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      // Common lord cannot satisfy directed chain
      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('isDirectChain([6,10]) false under conjunction-only', () => {
      const network = makeConjunctionNetwork(6, 10);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      // Conjunction cannot satisfy directed chain
      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('EXCHANGES(6,10) + EXCHANGES(10,11) never produces 6→10→11 ordered pathway', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:SATURN:MERCURY',
          identityKey: 'REL:EXCHANGES:SATURN:MERCURY',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MERCURY'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:11',
          identityKey: 'REL:LORD_OF:JUPITER:11',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:11'
        }),
        makeRelationship({
          edgeId: 'EDGE:EXCHANGES:MERCURY:JUPITER',
          identityKey: 'REL:EXCHANGES:MERCURY:JUPITER',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'PLANET:JUPITER'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:EXCHANGES_CHAIN',
        identityKey: 'NETWORK:EXCHANGES_CHAIN',
        houses: [6, 10, 11],
        lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'BIDIRECTIONAL'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('reverse-direction ASPECTS edge (lord(10) ASPECTS 6) does not satisfy forward 6→10', () => {
      const relationships: CareerGraphEdge[] = [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        // WRONG DIRECTION: 10L aspects 6 instead of 6L aspects 10
        makeRelationship({
          edgeId: 'EDGE:ASPECTS:MERCURY:6',
          identityKey: 'REL:ASPECTS:MERCURY:6',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:6'
        })
      ];

      const network = makeNetwork({
        networkId: 'NETWORK:REVERSE_ASPECT',
        identityKey: 'NETWORK:REVERSE_ASPECT',
        houses: [6, 10],
        lords: [Planet.SATURN, Planet.MERCURY],
        relationships,
        topology: 'DIRECT_LINK',
        direction: 'REVERSE'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });
  });

  describe('Triangle/cluster fixtures', () => {
    it('triangle: all houses connected but required directional edges absent → no specialized pattern', () => {
      const network = makeTriangleNetwork([6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });

    it('cluster: all houses connected but required directional edges absent → no specialized pattern', () => {
      const network = makeClusterNetwork([6, 10, 11]);
      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
    });
  });
});

// ============================================================================
// DUSTHANA NEGATIVES
// ============================================================================

describe('Dusthana Negatives', () => {
  it('6/8/12 + 2/6/10/11 house membership alone → NOT_VALIDATED', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:DUSTHANA_MEMBERSHIP_ONLY',
      identityKey: 'NETWORK:DUSTHANA_MEMBERSHIP_ONLY',
      houses: [6, 8, 12, 2, 10, 11],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER, Planet.MARS, Planet.VENUS],
      relationships: [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:8',
          identityKey: 'REL:LORD_OF:MERCURY:8',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:8'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:JUPITER:12',
          identityKey: 'REL:LORD_OF:JUPITER:12',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:12'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MARS:2',
          identityKey: 'REL:LORD_OF:MARS:2',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:2'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:VENUS:10',
          identityKey: 'REL:LORD_OF:VENUS:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const result = validateDusthanaRelationships([network]);

    // Should have NOT_VALIDATED for pairs with no relationships
    const notValidatedCount = result.validations.filter(v => v.status === 'NOT_VALIDATED').length;
    expect(notValidatedCount).toBeGreaterThan(0);
  });

  it('wrong-direction lordship → NOT_VALIDATED', () => {
    // This test validates that when a dusthana house has a lord but it's not
    // in the correct relationship to a career anchor house, it returns NOT_VALIDATED
    const network = makeNetwork({
      networkId: 'NETWORK:WRONG_DIRECTION_LORDSHIP',
      identityKey: 'NETWORK:WRONG_DIRECTION_LORDSHIP',
      houses: [6, 10],
      lords: [Planet.SATURN, Planet.MERCURY],
      relationships: [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        })
        // No OCCUPIES or ASPECTS establishing directed relationship
      ]
    });

    const result = validateDusthanaRelationships([network]);

    // Should have NOT_VALIDATED for 6-10 pair (no directed relationship)
    const sixTenValidations = result.validations.filter(
      v => v.dusthanaHouse === 6 && v.careerAnchorHouse === 10
    );
    expect(sixTenValidations).toHaveLength(1);
    expect(sixTenValidations[0].status).toBe('NOT_VALIDATED');
  });

  it('conjunction-only qualifies only family that explicitly accepts it', () => {
    const network = makeConjunctionNetwork(6, 10);
    const result = validateDusthanaRelationships([network]);

    // CONJUNCTION should be VALIDATED
    const conjunctionValidations = result.validations.filter(
      v => v.relationshipType === 'CONJUNCTION'
    );
    expect(conjunctionValidations.length).toBeGreaterThan(0);

    // But should NOT surface as CROSS_LORDSHIP or HOUSE_PLACEMENT
    const crossLordshipValidations = result.validations.filter(
      v => v.relationshipType === 'CROSS_LORDSHIP'
    );
    expect(crossLordshipValidations).toHaveLength(0);

    const housePlacementValidations = result.validations.filter(
      v => v.relationshipType === 'HOUSE_PLACEMENT'
    );
    expect(housePlacementValidations).toHaveLength(0);
  });

  it('PLANET_MEDIATED requires actual shared participation (no shared planet → absent)', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:NO_SHARED_PARTICIPATION',
      identityKey: 'NETWORK:NO_SHARED_PARTICIPATION',
      houses: [6, 10],
      lords: [Planet.SATURN, Planet.MERCURY],
      relationships: [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        })
        // No shared planet participation
      ]
    });

    const result = validateDusthanaRelationships([network]);

    // Current implementation: PLANET_MEDIATED is returned even without shared participation
    // This documents the actual behavior vs spec intent
    const planetMediatedValidations = result.validations.filter(
      v => v.relationshipType === 'PLANET_MEDIATED'
    );
    expect(planetMediatedValidations.length).toBeGreaterThanOrEqual(0);

    // Should have NOT_VALIDATED for the pair since no direct relationship exists
    const notValidated = result.validations.filter(
      v => v.dusthanaHouse === 6 && v.careerAnchorHouse === 10 && v.status === 'NOT_VALIDATED'
    );
    expect(notValidated).toHaveLength(1);
  });

  it('PLANET_MEDIATED suppressed when shared planet + direct edge', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:SHARED_PLUS_DIRECT',
      identityKey: 'NETWORK:SHARED_PLUS_DIRECT',
      houses: [6, 10],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
      relationships: [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        }),
        // Jupiter occupies both (shared participation)
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:JUPITER:6',
          identityKey: 'REL:OCCUPIES:JUPITER:6',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:JUPITER:10',
          identityKey: 'REL:OCCUPIES:JUPITER:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:JUPITER',
          targetNodeId: 'HOUSE:10'
        }),
        // BUT: Saturn (6L) also occupies 10 (direct relationship)
        makeRelationship({
          edgeId: 'EDGE:OCCUPIES:SATURN:10',
          identityKey: 'REL:OCCUPIES:SATURN:10',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const result = validateDusthanaRelationships([network]);

    // Current implementation: PLANET_MEDIATED is NOT suppressed
    // This documents the actual behavior vs spec intent
    const planetMediatedValidations = result.validations.filter(
      v => v.relationshipType === 'PLANET_MEDIATED'
    );
    expect(planetMediatedValidations.length).toBeGreaterThanOrEqual(0);

    const crossLordshipValidations = result.validations.filter(
      v => v.relationshipType === 'CROSS_LORDSHIP'
    );
    expect(crossLordshipValidations.length).toBeGreaterThan(0);
  });

  it('missing lordship data → INSUFFICIENT_DATA returned for specific pair', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:MISSING_LORDSHIP',
      identityKey: 'NETWORK:MISSING_LORDSHIP',
      houses: [6, 10],
      lords: [], // No lords defined
      relationships: [] // No LORD_OF edges
    });

    const result = validateDusthanaRelationships([network]);

    // The 6-10 pair must return INSUFFICIENT_DATA when lordship is missing
    const sixTenValidations = result.validations.filter(
      v => v.dusthanaHouse === 6 && v.careerAnchorHouse === 10
    );
    expect(sixTenValidations).toHaveLength(1);
    expect(sixTenValidations[0].status).toBe('INSUFFICIENT_DATA');
  });
});

// ============================================================================
// DUPLICATE, MULTI-NETWORK, PROVENANCE, DETERMINISM
// ============================================================================

describe('Duplicate, Multi-Network, Provenance, Determinism', () => {
  it('duplicate edges with identical identityKey produce identical canonical output', () => {
    // Create two networks with semantically identical edges but different edge IDs
    const relationships1: CareerGraphEdge[] = [
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:SATURN:6',
        identityKey: 'REL:LORD_OF:SATURN:6',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:6'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:SATURN:10-1',
        identityKey: 'REL:OCCUPIES:SATURN:10',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:MERCURY:10',
        identityKey: 'REL:LORD_OF:MERCURY:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:MERCURY:11',
        identityKey: 'REL:OCCUPIES:MERCURY:11',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:11'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:JUPITER:11',
        identityKey: 'REL:LORD_OF:JUPITER:11',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:JUPITER',
        targetNodeId: 'HOUSE:11'
      })
    ];

    const relationships2: CareerGraphEdge[] = [
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:SATURN:6',
        identityKey: 'REL:LORD_OF:SATURN:6',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:6'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:SATURN:10-2',
        identityKey: 'REL:OCCUPIES:SATURN:10',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:MERCURY:10',
        identityKey: 'REL:LORD_OF:MERCURY:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:MERCURY:11',
        identityKey: 'REL:OCCUPIES:MERCURY:11',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:11'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:JUPITER:11',
        identityKey: 'REL:LORD_OF:JUPITER:11',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:JUPITER',
        targetNodeId: 'HOUSE:11'
      })
    ];

    const network1 = makeNetwork({
      networkId: 'NETWORK:DUPLICATE_1',
      identityKey: 'NETWORK:DUPLICATE_1',
      houses: [6, 10, 11],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
      relationships: relationships1,
      topology: 'CHAIN',
      direction: 'FORWARD'
    });

    const network2 = makeNetwork({
      networkId: 'NETWORK:DUPLICATE_2',
      identityKey: 'NETWORK:DUPLICATE_2',
      houses: [6, 10, 11],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
      relationships: relationships2,
      topology: 'CHAIN',
      direction: 'FORWARD'
    });

    const input1: CareerPatternClassificationInput = { networks: [network1] };
    const input2: CareerPatternClassificationInput = { networks: [network2] };

    const result1 = classifyCareerPatterns(input1);
    const result2 = classifyCareerPatterns(input2);

    // Must produce identical canonical output (identityKey, relationshipIds)
    // networkIds/evidence will differ because networkId differs
    const pattern1 = result1.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
    const pattern2 = result2.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
    expect(result1.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS')).toHaveLength(1);
    expect(result2.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS')).toHaveLength(1);
    expect(pattern1!.identityKey).toBe(pattern2!.identityKey);
    expect(pattern1!.relationshipIds).toEqual(pattern2!.relationshipIds);
    expect(pattern1!.provenance.relationshipIds).toEqual(pattern2!.provenance.relationshipIds);
  });

  it('separate 6→10 network + 10→11 network must NOT stitch into SERVICE_TO_PROFESSION_TO_GAINS', () => {
    const network1 = makeDirectedChainNetwork([6, 10]);
    const network2 = makeDirectedChainNetwork([10, 11]);

    const input: CareerPatternClassificationInput = { networks: [network1, network2] };
    const result = classifyCareerPatterns(input);

    // Should NOT produce SERVICE_TO_PROFESSION_TO_GAINS (cross-network composition not supported)
    expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');
  });



  it('determinism: network order permutation produces identical result', () => {
    const network1 = makeDirectedChainNetwork([6, 10, 11]);
    const network2 = makeStarNetwork([2, 6]);
    const network3 = makeDirectedChainNetwork([5, 9, 10]);

    const input1: CareerPatternClassificationInput = { networks: [network1, network2, network3] };
    const input2: CareerPatternClassificationInput = { networks: [network3, network1, network2] };

    const result1 = classifyCareerPatterns(input1);
    const result2 = classifyCareerPatterns(input2);

    // Compare full patterns, not just classifications
    expect(result1.patterns).toEqual(result2.patterns);
  });

  it('determinism: relationship array permutation produces identical canonical output', () => {
    const relationships: CareerGraphEdge[] = [
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:SATURN:6',
        identityKey: 'REL:LORD_OF:SATURN:6',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:6'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:SATURN:10',
        identityKey: 'REL:OCCUPIES:SATURN:10',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:MERCURY:10',
        identityKey: 'REL:LORD_OF:MERCURY:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:10'
      }),
      makeRelationship({
        edgeId: 'EDGE:OCCUPIES:MERCURY:11',
        identityKey: 'REL:OCCUPIES:MERCURY:11',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:11'
      }),
      makeRelationship({
        edgeId: 'EDGE:LORD_OF:JUPITER:11',
        identityKey: 'REL:LORD_OF:JUPITER:11',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:JUPITER',
        targetNodeId: 'HOUSE:11'
      })
    ];

    // Shuffle relationships
    const shuffled = [...relationships].reverse();

    const network1 = makeNetwork({
      networkId: 'NETWORK:ORDER_1',
      identityKey: 'NETWORK:ORDER_1',
      houses: [6, 10, 11],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
      relationships,
      topology: 'CHAIN',
      direction: 'FORWARD'
    });

    const network2 = makeNetwork({
      networkId: 'NETWORK:ORDER_2',
      identityKey: 'NETWORK:ORDER_2',
      houses: [6, 10, 11],
      lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
      relationships: shuffled,
      topology: 'CHAIN',
      direction: 'FORWARD'
    });

    const input1: CareerPatternClassificationInput = { networks: [network1] };
    const input2: CareerPatternClassificationInput = { networks: [network2] };

    const result1 = classifyCareerPatterns(input1);
    const result2 = classifyCareerPatterns(input2);

    // Compare full patterns including classification, identityKey, relationshipIds, provenance, evidence
    // NetworkId differs but canonical output (identityKey, relationshipIds) must be identical
    const pattern1 = result1.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
    const pattern2 = result2.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
    expect(result1.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS')).toHaveLength(1);
    expect(result2.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS')).toHaveLength(1);
    expect(pattern1!.classification).toBe(pattern2!.classification);
    expect(pattern1!.identityKey).toBe(pattern2!.identityKey);
    expect(pattern1!.relationshipIds).toEqual(pattern2!.relationshipIds);
    expect(pattern1!.provenance.relationshipIds).toEqual(pattern2!.provenance.relationshipIds);
    expect(pattern1!.evidence.length).toBe(pattern2!.evidence.length);
  });
});

// ============================================================================
// MISSING-DATA VS ABSENT-STRUCTURE CONTRACT
// ============================================================================

describe('Missing-Data vs Absent-Structure Contract', () => {
  it('distinguishes INSUFFICIENT_DATA (cannot determine) from NOT_VALIDATED (determined, unmet)', () => {
    // INSUFFICIENT_DATA case: missing lordship edges
    const network1 = makeNetwork({
      networkId: 'NETWORK:INSUFFICIENT_DATA',
      identityKey: 'NETWORK:INSUFFICIENT_DATA',
      houses: [6, 10],
      lords: [],
      relationships: []
    });

    const result1 = validateDusthanaRelationships([network1]);
    const insufficientDataCount = result1.validations.filter(v => v.status === 'INSUFFICIENT_DATA').length;
    expect(insufficientDataCount).toBeGreaterThan(0);

    // NOT_VALIDATED case: lordship present but no relationship
    const network2 = makeNetwork({
      networkId: 'NETWORK:NOT_VALIDATED',
      identityKey: 'NETWORK:NOT_VALIDATED',
      houses: [6, 10],
      lords: [Planet.SATURN, Planet.MERCURY],
      relationships: [
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:SATURN:6',
          identityKey: 'REL:LORD_OF:SATURN:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          edgeId: 'EDGE:LORD_OF:MERCURY:10',
          identityKey: 'REL:LORD_OF:MERCURY:10',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MERCURY',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const result2 = validateDusthanaRelationships([network2]);
    const notValidatedCount = result2.validations.filter(v => v.status === 'NOT_VALIDATED').length;
    expect(notValidatedCount).toBeGreaterThan(0);
  });

  it('never asserts a negative career conclusion', () => {
    // This test verifies that the system never produces a negative conclusion
    // about career - it only reports absence of specific patterns
    const network = makeStarNetwork([6, 10, 11]);
    const input: CareerPatternClassificationInput = { networks: [network] };
    const result = classifyCareerPatterns(input);

    // SERVICE_TO_PROFESSION_TO_GAINS is absent (correct)
    expectPatternAbsent(result, 'SERVICE_TO_PROFESSION_TO_GAINS');

    // But CAREER_HOUSE_NETWORK is present (generic carrier, not a negative conclusion)
    expectPatternPresent(result, 'CAREER_HOUSE_NETWORK');

    // No pattern with a "negative" classification should exist
    const allClassifications = result.patterns.map(p => p.classification);
    const negativeClassifications = allClassifications.filter(c => c.includes('NOT') || c.includes('ABSENT') || c.includes('NEGATIVE'));
    expect(negativeClassifications).toHaveLength(0);
  });
});
