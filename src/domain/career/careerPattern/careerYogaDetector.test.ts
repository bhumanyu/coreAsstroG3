import { detectCareerYogaPatterns } from './careerYogaDetector';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
import { Planet } from '../../../types';

/**
 * Type guard to check if a string is a valid Planet enum value.
 */
function isPlanet(value: string): value is Planet {
  return Object.values(Planet).includes(value as Planet);
}

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
    relationships: [
      {
        edgeId: 'EDGE:TEST',
        identityKey: 'RELATIONSHIP:TEST',
        type: 'LORD_OF',
        sourceNodeId: 'PLANET:SATURN',
        targetNodeId: 'HOUSE:6',
        provenance
      }
    ],
    topology: 'DIRECT_LINK',
    direction: 'FORWARD',
    provenance,
    evidenceIds: []
  };

  return { ...defaultNetwork, ...overrides } as CareerHouseNetwork;
}

describe('Career Yoga Detector', () => {
  describe('Career-relevant network detection', () => {
    it('detects career yoga pattern for career-relevant network with multiple planets', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-MULTI',
        identityKey: 'NETWORK:6-10-MULTI',
        houses: [6, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          {
            edgeId: 'EDGE:SATURN-6',
            identityKey: 'REL:SATURN-6',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          },
          {
            edgeId: 'EDGE:MARS-10',
            identityKey: 'REL:MARS-10',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          }
        ]
      });

      const patterns = detectCareerYogaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].careerRelevant).toBe(true);
      // Participants are sorted alphabetically
      expect(patterns[0].participants).toEqual(['MARS', 'SATURN']);
    });

    it('does not detect yoga for network with single planet', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-SINGLE',
        identityKey: 'NETWORK:6-10-SINGLE',
        houses: [6, 10],
        lords: [Planet.SATURN]
      });

      const patterns = detectCareerYogaPatterns([network]);

      expect(patterns).toHaveLength(0);
    });

    it('does not detect yoga for non-career-relevant network', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:1-5',
        identityKey: 'NETWORK:1-5',
        houses: [1, 5],
        lords: [Planet.SATURN, Planet.MARS]
      });

      const patterns = detectCareerYogaPatterns([network]);

      expect(patterns).toHaveLength(0);
    });
  });

  describe('Structural-only representation', () => {
    it('contains no strength/condition/dasha/d10 fields', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-MULTI',
        identityKey: 'NETWORK:6-10-MULTI',
        houses: [6, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          {
            edgeId: 'EDGE:SATURN-6',
            identityKey: 'REL:SATURN-6',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          },
          {
            edgeId: 'EDGE:MARS-10',
            identityKey: 'REL:MARS-10',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          }
        ]
      });

      const patterns = detectCareerYogaPatterns([network]);

      const pattern = patterns[0];

      expect(pattern as any).not.toHaveProperty('strength');
      expect(pattern as any).not.toHaveProperty('condition');
      expect(pattern as any).not.toHaveProperty('dasha');
      expect(pattern as any).not.toHaveProperty('d10');
      expect(pattern as any).not.toHaveProperty('qualification');
    });

    it('contains participants, houseRelationships, lordships, careerRelevant, evidenceIds, ruleIds', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-MULTI',
        identityKey: 'NETWORK:6-10-MULTI',
        houses: [6, 10],
        lords: [Planet.SATURN, Planet.MARS],
        evidenceIds: ['EVIDENCE:1', 'EVIDENCE:2'],
        relationships: [
          {
            edgeId: 'EDGE:SATURN-6',
            identityKey: 'REL:SATURN-6',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          },
          {
            edgeId: 'EDGE:MARS-10',
            identityKey: 'REL:MARS-10',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          }
        ]
      });

      const patterns = detectCareerYogaPatterns([network]);

      const pattern = patterns[0];

      expect(pattern.participants).toBeDefined();
      expect(pattern.houseRelationships).toBeDefined();
      expect(pattern.lordships).toBeDefined();
      expect(pattern.careerRelevant).toBeDefined();
      expect(pattern.evidenceIds).toBeDefined();
      expect(pattern.ruleIds).toBeDefined();
    });
  });

  describe('Deterministic sorting', () => {
    it('sorts patterns by identityKey deterministically', () => {
      const network1 = makeNetwork({
        networkId: 'NETWORK:6-10-MULTI',
        identityKey: 'NETWORK:6-10-MULTI',
        houses: [6, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          {
            edgeId: 'EDGE:SATURN-6',
            identityKey: 'REL:SATURN-6',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          },
          {
            edgeId: 'EDGE:MARS-10',
            identityKey: 'REL:MARS-10',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          }
        ]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:2-10-MULTI',
        identityKey: 'NETWORK:2-10-MULTI',
        houses: [2, 10],
        lords: [Planet.JUPITER, Planet.VENUS],
        relationships: [
          {
            edgeId: 'EDGE:JUPITER-2',
            identityKey: 'REL:JUPITER-2',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:2',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          },
          {
            edgeId: 'EDGE:VENUS-10',
            identityKey: 'REL:VENUS-10',
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:10',
            provenance: { sourceIds: ['test'], ruleIds: [], parentIds: [] }
          }
        ]
      });

      const patterns = detectCareerYogaPatterns([network2, network1]);

      // Verify patterns are sorted by identityKey
      expect(patterns[0].identityKey.localeCompare(patterns[1].identityKey)).toBeLessThan(0);
    });
  });
});
