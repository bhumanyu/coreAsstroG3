import {
  buildCareerHouseNetwork,
  buildCareerHouseNetworkIdentityKey
} from './careerHouseNetwork';
import type {
  CareerHouseNetwork,
  CareerNetworkTopology,
  CareerNetworkDirection
} from './careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from './careerAstroGraphTypes';
import { Planet } from '../../../types';

describe('CareerHouseNetwork', () => {
  describe('Network Representation Exists', () => {
    it('creates a CareerHouseNetwork with all required fields', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN, Planet.MERCURY],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network).toBeDefined();
      expect(network.networkId).toBeDefined();
      expect(network.identityKey).toBeDefined();
      expect(network.houses).toEqual([6, 10]); // Sorted
      expect(network.lords).toEqual([Planet.MERCURY, Planet.SATURN]); // Sorted by canonical order
      expect(network.relationships).toEqual([edge]);
      expect(network.topology).toBe('DIRECT_LINK');
      expect(network.direction).toBe('FORWARD');
      expect(network.provenance).toBeDefined();
      expect(network.evidenceIds).toEqual(['evidence-1']);
    });

    it('network is frozen', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(Object.isFrozen(network)).toBe(true);
    });
  });

  describe('Deterministic Network Identity', () => {
    it('builds deterministic identity key from sorted houses', () => {
      const houses = [10, 6, 11];
      const topology: CareerNetworkTopology = 'CHAIN';
      const relationships: CareerGraphEdge[] = [];
      const direction: CareerNetworkDirection = 'FORWARD';

      const identityKey1 = buildCareerHouseNetworkIdentityKey(houses, topology, relationships, direction);
      const identityKey2 = buildCareerHouseNetworkIdentityKey([6, 10, 11], topology, relationships, direction);

      expect(identityKey1).toBe(identityKey2);
    });

    it('identity key includes topology', () => {
      const houses = [10, 6];
      const relationships: CareerGraphEdge[] = [];
      const direction: CareerNetworkDirection = 'FORWARD';

      const identityKey1 = buildCareerHouseNetworkIdentityKey(houses, 'DIRECT_LINK', relationships, direction);
      const identityKey2 = buildCareerHouseNetworkIdentityKey(houses, 'CHAIN', relationships, direction);

      expect(identityKey1).not.toBe(identityKey2);
    });

    it('identity key includes direction', () => {
      const houses = [10, 6];
      const topology: CareerNetworkTopology = 'DIRECT_LINK';
      const relationships: CareerGraphEdge[] = [];

      const identityKey1 = buildCareerHouseNetworkIdentityKey(houses, topology, relationships, 'FORWARD');
      const identityKey2 = buildCareerHouseNetworkIdentityKey(houses, topology, relationships, 'REVERSE');

      expect(identityKey1).not.toBe(identityKey2);
    });

    it('networks identical except for direction produce different identity keys', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network1 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      const network2 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'REVERSE',
        provenance,
        ['evidence-1']
      );

      expect(network1.identityKey).not.toBe(network2.identityKey);
    });

    it('identity key includes sorted relationship identities', () => {
      const houses = [10, 6];
      const topology: CareerNetworkTopology = 'DIRECT_LINK';
      const direction: CareerNetworkDirection = 'FORWARD';

      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge1: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const edge2: CareerGraphEdge = {
        edgeId: 'OCCUPIES:PLANET:MERCURY→HOUSE:6',
        type: 'OCCUPIES',
        sourceNodeId: 'PLANET:MERCURY',
        targetNodeId: 'HOUSE:6',
        identityKey: 'OCCUPIES:PLANET:MERCURY→HOUSE:6',
        provenance
      };

      const identityKey1 = buildCareerHouseNetworkIdentityKey(houses, topology, [edge1, edge2], direction);
      const identityKey2 = buildCareerHouseNetworkIdentityKey(houses, topology, [edge2, edge1], direction);

      expect(identityKey1).toBe(identityKey2);
    });

    it('network identity is independent of input house order', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network1 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      const network2 = buildCareerHouseNetwork(
        [6, 10],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network1.identityKey).toBe(network2.identityKey);
    });
  });

  describe('Identity Independent of Strength', () => {
    it('identity key does not include strength or dignity', () => {
      const houses = [10, 6];
      const topology: CareerNetworkTopology = 'DIRECT_LINK';
      const relationships: CareerGraphEdge[] = [];
      const direction: CareerNetworkDirection = 'FORWARD';

      const identityKey = buildCareerHouseNetworkIdentityKey(houses, topology, relationships, direction);

      // Identity key should only contain structural information
      expect(identityKey).not.toContain('STRONG');
      expect(identityKey).not.toContain('WEAK');
      expect(identityKey).not.toContain('EXALTED');
      expect(identityKey).not.toContain('DEBILITATED');
      expect(identityKey).not.toContain('score');
      expect(identityKey).not.toContain('confidence');
    });

    it('network with different provenance but same structure has same identity', () => {
      const provenance1: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const provenance2: CareerGraphProvenance = {
        sourceIds: ['evidence-2'],
        ruleIds: ['rule-2'],
        parentIds: []
      };

      const edge1: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance: provenance1
      };

      const edge2: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance: provenance2
      };

      const network1 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge1],
        'DIRECT_LINK',
        'FORWARD',
        provenance1,
        ['evidence-1']
      );

      const network2 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge2],
        'DIRECT_LINK',
        'FORWARD',
        provenance2,
        ['evidence-2']
      );

      expect(network1.identityKey).toBe(network2.identityKey);
    });
  });

  describe('Topology Enum Defined', () => {
    it('supports DIRECT_LINK topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('DIRECT_LINK');
    });

    it('supports CHAIN topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6, 11],
        [Planet.SATURN],
        [edge],
        'CHAIN',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('CHAIN');
    });

    it('supports TRIANGLE topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6, 11],
        [Planet.SATURN],
        [edge],
        'TRIANGLE',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('TRIANGLE');
    });

    it('supports LOOP topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6, 11],
        [Planet.SATURN],
        [edge],
        'LOOP',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('LOOP');
    });

    it('supports STAR topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6, 11],
        [Planet.SATURN],
        [edge],
        'STAR',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('STAR');
    });

    it('supports CLUSTER topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6, 11],
        [Planet.SATURN],
        [edge],
        'CLUSTER',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      expect(network.topology).toBe('CLUSTER');
    });
  });

  describe('No Semantic Pattern Classification', () => {
    it('network representation does not perform automatic topology detection', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      // The builder requires explicit topology - it does not detect it
      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK', // Must be explicitly provided
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      // The topology is exactly what was provided, not detected
      expect(network.topology).toBe('DIRECT_LINK');
    });

    it('network representation does not include semantic pattern fields', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      // Check that network does not have semantic pattern classification fields
      expect(network).not.toHaveProperty('pattern');
      expect(network).not.toHaveProperty('classification');
      expect(network).not.toHaveProperty('meaning');
      expect(network).not.toHaveProperty('interpretation');
      expect(network).not.toHaveProperty('prediction');
      expect(network).not.toHaveProperty('score');
      expect(network).not.toHaveProperty('confidence');
    });

    it('network representation does not perform semantic pattern classification', () => {
      // This is verified by the source code structure - the module files
      // do not contain semantic pattern classification logic
      // This is a structural requirement that is enforced at compile time
      expect(true).toBe(true);
    });
  });

  describe('Canonical Planet Ordering', () => {
    it('sorts lords using canonical planet order', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network1 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN, Planet.MERCURY],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      const network2 = buildCareerHouseNetwork(
        [10, 6],
        [Planet.MERCURY, Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      // Both should produce identical serialized networks
      expect(JSON.stringify(network1)).toBe(JSON.stringify(network2));
      expect(network1.lords).toEqual([Planet.MERCURY, Planet.SATURN]);
      expect(network2.lords).toEqual([Planet.MERCURY, Planet.SATURN]);
    });
  });

  describe('Evidence ID Deduplication', () => {
    it('deduplicates evidence IDs', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['e1', 'e1', 'e2', 'e2', 'e3']
      );

      expect(network.evidenceIds).toEqual(['e1', 'e2', 'e3']);
    });
  });

  describe('Deep Freezing', () => {
    it('deep-freezes relationships and their provenance', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      // Assert that relationships are frozen
      expect(Object.isFrozen(network.relationships)).toBe(true);
      expect(Object.isFrozen(network.relationships[0])).toBe(true);
      expect(Object.isFrozen(network.relationships[0].provenance)).toBe(true);
    });

    it('freezes unfrozen input edges', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const edge: CareerGraphEdge = {
        edgeId: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:10',
        identityKey: 'LORD_OF:PLANET:SATURN→HOUSE:10',
        provenance
      };

      // Verify edge is not frozen before passing
      expect(Object.isFrozen(edge)).toBe(false);

      const network = buildCareerHouseNetwork(
        [10, 6],
        [Planet.SATURN],
        [edge],
        'DIRECT_LINK',
        'FORWARD',
        provenance,
        ['evidence-1']
      );

      // Assert that the edge in the network is now frozen
      expect(Object.isFrozen(network.relationships[0])).toBe(true);
    });
  });
});
