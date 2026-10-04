import {
  buildPatternProvenance,
  canonicalizeProvenance,
  RelationshipNotFoundError
} from './careerPatternProvenance';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
import { Planet } from '../../../types';

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
    identityKey: 'REL:LORD_OF:SATURN:10',
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: 'HOUSE:10',
    provenance
  };

  return { ...defaultRelationship, ...overrides };
}

describe('careerPatternProvenance', () => {
  describe('buildPatternProvenance', () => {
    it('builds provenance with exact establishing IDs on pattern', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.provenance.establishingRelationshipIds).toEqual([
        'REL:LORD_OF:SATURN:10',
        'REL:LORD_OF:SATURN:6'
      ]);
      expect(result.provenance.supportingRelationshipIds).toEqual([]);
      expect(result.evidence).toHaveLength(2);
    });

    it('excludes unrelated network edges from establishing IDs', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const unrelated = makeRelationship({ identityKey: 'REL:OCCUPIES:MARS:11' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2, unrelated]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.provenance.establishingRelationshipIds).toEqual([
        'REL:LORD_OF:SATURN:10',
        'REL:LORD_OF:SATURN:6'
      ]);
      expect(result.provenance.establishingRelationshipIds).not.toContain('REL:OCCUPIES:MARS:11');
    });

    it('collapses duplicate establishing IDs to one', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.provenance.establishingRelationshipIds).toEqual(['REL:LORD_OF:SATURN:10']);
      expect(result.evidence).toHaveLength(1);
    });

    it('produces identical provenance from input permutations', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2]
      });

      const result1 = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      const result2 = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10', 'REL:LORD_OF:SATURN:6']
        },
        network
      );

      expect(result1.provenance).toEqual(result2.provenance);
      expect(result1.evidence).toEqual(result2.evidence);
    });

    it('throws RelationshipNotFoundError for fabricated establishing relationship ID', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      expect(() => {
        buildPatternProvenance(
          {
            ruleId: 'RULE_TEST',
            networkId: 'NETWORK:TEST',
            establishingRelationshipIds: ['REL:LORD_OF:SATURN:10', 'REL:DOES_NOT_EXIST']
          },
          network
        );
      }).toThrow(RelationshipNotFoundError);
    });

    it('throws RelationshipNotFoundError for fabricated supporting relationship ID', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      expect(() => {
        buildPatternProvenance(
          {
            ruleId: 'RULE_TEST',
            networkId: 'NETWORK:TEST',
            establishingRelationshipIds: ['REL:LORD_OF:SATURN:10'],
            supportingRelationshipIds: ['REL:DOES_NOT_EXIST']
          },
          network
        );
      }).toThrow(RelationshipNotFoundError);
    });

    it('rejects relationship from network-B when building pattern on network-A', () => {
      const relationshipA = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const networkA = makeNetwork({
        networkId: 'NETWORK:A',
        identityKey: 'NETWORK:A',
        relationships: [relationshipA]
      });

      const relationshipB = makeRelationship({ identityKey: 'REL:LORD_OF:MARS:6' });
      const networkB = makeNetwork({
        networkId: 'NETWORK:B',
        identityKey: 'NETWORK:B',
        relationships: [relationshipB]
      });

      expect(() => {
        buildPatternProvenance(
          {
            ruleId: 'RULE_TEST',
            networkId: 'NETWORK:A',
            establishingRelationshipIds: ['REL:LORD_OF:SATURN:10', 'REL:LORD_OF:MARS:6']
          },
          networkA
        );
      }).toThrow(RelationshipNotFoundError);
    });

    it('derives evidence IDs using frozen deterministic formula', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.evidence[0].evidenceId).toBe('P2-06D-EVIDENCE:REL:LORD_OF:SATURN:10');
      expect(result.evidence[0].relationshipId).toBe('REL:LORD_OF:SATURN:10');
    });

    it('creates one evidence record per establishing relationship', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.evidence).toHaveLength(2);
      expect(result.evidence[0].relationshipId).toBe('REL:LORD_OF:SATURN:10');
      expect(result.evidence[1].relationshipId).toBe('REL:LORD_OF:SATURN:6');
    });

    it('ensures every evidenceId resolves to a real establishingRelationshipId', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      const evidenceRelationshipIds = result.evidence.map(e => e.relationshipId);
      expect(evidenceRelationshipIds).toEqual(result.provenance.establishingRelationshipIds);
    });

    it('ensures no orphan evidence IDs (every establishing has evidence)', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10']
        },
        network
      );

      for (const establishingId of result.provenance.establishingRelationshipIds) {
        const hasEvidence = result.evidence.some(e => e.relationshipId === establishingId);
        expect(hasEvidence).toBe(true);
      }
    });

    it('deep freezes provenance collections', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(() => {
        (result.provenance.sourceNetworkIds as string[]).push('NEW_ID');
      }).toThrow();

      expect(() => {
        (result.provenance.establishingRelationshipIds as string[]).push('NEW_ID');
      }).toThrow();

      expect(() => {
        (result.provenance as any).newField = 'value';
      }).toThrow();
    });

    it('deep freezes evidence collections', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(() => {
        (result.evidence as any).push({} as any);
      }).toThrow();

      expect(() => {
        (result.evidence[0] as any).newField = 'value';
      }).toThrow();
    });

    it('populates relationshipIds as establishing ∪ supporting for backward compatibility', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const relationship3 = makeRelationship({ identityKey: 'REL:ASPECTS:SATURN:11' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2, relationship3]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:6', 'REL:LORD_OF:SATURN:10'],
          supportingRelationshipIds: ['REL:ASPECTS:SATURN:11']
        },
        network
      );

      expect(result.provenance.relationshipIds).toEqual([
        'REL:ASPECTS:SATURN:11',
        'REL:LORD_OF:SATURN:10',
        'REL:LORD_OF:SATURN:6'
      ]);
    });

    it('defaults supportingRelationshipIds to empty array when not provided', () => {
      const relationship = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const network = makeNetwork({
        relationships: [relationship]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10']
        },
        network
      );

      expect(result.provenance.supportingRelationshipIds).toEqual([]);
    });

    it('sorts all ID collections deterministically', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:6' });
      const relationship2 = makeRelationship({ identityKey: 'REL:LORD_OF:SATURN:10' });
      const relationship3 = makeRelationship({ identityKey: 'REL:ASPECTS:SATURN:11' });
      const network = makeNetwork({
        relationships: [relationship1, relationship2, relationship3]
      });

      const result = buildPatternProvenance(
        {
          ruleId: 'RULE_TEST',
          networkId: 'NETWORK:TEST',
          establishingRelationshipIds: ['REL:LORD_OF:SATURN:10', 'REL:LORD_OF:SATURN:6'],
          supportingRelationshipIds: ['REL:ASPECTS:SATURN:11']
        },
        network
      );

      expect(result.provenance.establishingRelationshipIds).toEqual([
        'REL:LORD_OF:SATURN:10',
        'REL:LORD_OF:SATURN:6'
      ]);
      expect(result.provenance.supportingRelationshipIds).toEqual(['REL:ASPECTS:SATURN:11']);
    });
  });

  describe('canonicalizeProvenance', () => {
    it('deduplicates and sorts sourceNetworkIds', () => {
      const provenance = {
        sourceNetworkIds: ['B', 'A', 'A'],
        relationshipIds: [],
        ruleIds: [],
        establishingRelationshipIds: [],
        supportingRelationshipIds: []
      };

      const result = canonicalizeProvenance(provenance);

      expect(result.sourceNetworkIds).toEqual(['A', 'B']);
    });

    it('deduplicates and sorts establishingRelationshipIds', () => {
      const provenance = {
        sourceNetworkIds: [],
        relationshipIds: [],
        ruleIds: [],
        establishingRelationshipIds: ['Z', 'Y', 'X', 'Y'],
        supportingRelationshipIds: []
      };

      const result = canonicalizeProvenance(provenance);

      expect(result.establishingRelationshipIds).toEqual(['X', 'Y', 'Z']);
    });

    it('deduplicates and sorts supportingRelationshipIds', () => {
      const provenance = {
        sourceNetworkIds: [],
        relationshipIds: [],
        ruleIds: [],
        establishingRelationshipIds: [],
        supportingRelationshipIds: ['B', 'A', 'B']
      };

      const result = canonicalizeProvenance(provenance);

      expect(result.supportingRelationshipIds).toEqual(['A', 'B']);
    });

    it('deduplicates and sorts ruleIds', () => {
      const provenance = {
        sourceNetworkIds: [],
        relationshipIds: [],
        ruleIds: ['RULE_2', 'RULE_1', 'RULE_2'],
        establishingRelationshipIds: [],
        supportingRelationshipIds: []
      };

      const result = canonicalizeProvenance(provenance);

      expect(result.ruleIds).toEqual(['RULE_1', 'RULE_2']);
    });

    it('produces identical canonical provenance from input permutations', () => {
      const provenance1 = {
        sourceNetworkIds: ['B', 'A'],
        relationshipIds: [],
        ruleIds: ['RULE_2', 'RULE_1'],
        establishingRelationshipIds: ['Z', 'Y', 'X'],
        supportingRelationshipIds: ['B', 'A']
      };

      const provenance2 = {
        sourceNetworkIds: ['A', 'B'],
        relationshipIds: [],
        ruleIds: ['RULE_1', 'RULE_2'],
        establishingRelationshipIds: ['X', 'Y', 'Z'],
        supportingRelationshipIds: ['A', 'B']
      };

      const result1 = canonicalizeProvenance(provenance1);
      const result2 = canonicalizeProvenance(provenance2);

      expect(result1).toEqual(result2);
    });

    it('deep freezes canonicalized provenance', () => {
      const provenance = {
        sourceNetworkIds: ['B', 'A'],
        relationshipIds: [],
        ruleIds: [],
        establishingRelationshipIds: [],
        supportingRelationshipIds: []
      };

      const result = canonicalizeProvenance(provenance);

      expect(() => {
        (result.sourceNetworkIds as string[]).push('C');
      }).toThrow();

      expect(() => {
        (result as any).newField = 'value';
      }).toThrow();
    });
  });

  describe('RelationshipNotFoundError', () => {
    it('has correct error message', () => {
      const error = new RelationshipNotFoundError('REL:MISSING', 'NETWORK:TEST');

      expect(error.message).toBe('Relationship ID "REL:MISSING" not found in network "NETWORK:TEST"');
      expect(error.name).toBe('RelationshipNotFoundError');
      expect(error.relationshipId).toBe('REL:MISSING');
      expect(error.networkId).toBe('NETWORK:TEST');
    });
  });
});
