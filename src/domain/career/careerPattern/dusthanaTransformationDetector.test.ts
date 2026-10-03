import { detectDusthanaPatterns } from './dusthanaTransformationDetector';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
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
    sourceNodeId: 'NODE:PLANET:SATURN',
    targetNodeId: 'NODE:HOUSE:6',
    provenance
  };

  return { ...defaultRelationship, ...overrides };
}

describe('Dusthana Transformation Detector', () => {
  describe('8↔10 detection', () => {
    it('detects 8-10 network as dusthana transformation', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].family).toBe('DUSTHANA_TRANSFORMATION');
      expect(patterns[0].classification).toBe('DUSTHANA_CAREER_TRANSFORMATION');
      expect(patterns[0].houses).toEqual([8, 10]);
    });

    it('infers mechanisms from Saturn for 8-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-SATURN',
        identityKey: 'NETWORK:8-10-SATURN',
        houses: [8, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('RESEARCH');
      expect(patterns[0].mechanisms).toContain('INVESTIGATION');
      expect(patterns[0].mechanisms).toContain('TRANSFORMATION');
    });

    it('infers structural mechanisms when no planets present', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-NO-PLANETS',
        identityKey: 'NETWORK:8-10-NO-PLANETS',
        houses: [8, 10],
        lords: [],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      // Mechanisms are derived from structural relationship type (8↔10), not from planets
      expect(patterns[0].mechanisms).toContain('RESEARCH');
      expect(patterns[0].mechanisms).toContain('INVESTIGATION');
      expect(patterns[0].mechanisms).toContain('TRANSFORMATION');
    });

    it('never produces NEGATIVE direction for 8-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: [Planet.SATURN],
        direction: 'FORWARD',
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].direction).not.toBe('NEGATIVE');
      expect(patterns[0].direction).toBe('FORWARD');
    });
  });

  describe('12↔10 detection', () => {
    it('detects 12-10 network as dusthana transformation', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10',
        identityKey: 'NETWORK:12-10',
        houses: [12, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].family).toBe('DUSTHANA_TRANSFORMATION');
      expect(patterns[0].classification).toBe('DUSTHANA_CAREER_TRANSFORMATION');
      expect(patterns[0].houses).toEqual([12, 10]);
    });

    it('infers mechanisms from Saturn for 12-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10-SATURN',
        identityKey: 'NETWORK:12-10-SATURN',
        houses: [12, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('INSTITUTIONAL_WORK');
      expect(patterns[0].mechanisms).toContain('REMOTE_WORK');
    });

    it('infers FOREIGN_WORK from Jupiter for 12-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10-JUPITER',
        identityKey: 'NETWORK:12-10-JUPITER',
        houses: [12, 10],
        lords: [Planet.JUPITER],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('FOREIGN_WORK');
      expect(patterns[0].mechanisms).toContain('INSTITUTIONAL_WORK');
    });

    it('never produces NEGATIVE direction for 12-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10',
        identityKey: 'NETWORK:12-10',
        houses: [12, 10],
        lords: [Planet.SATURN],
        direction: 'REVERSE',
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].direction).not.toBe('NEGATIVE');
      expect(patterns[0].direction).toBe('REVERSE');
    });
  });
});

describe('Missing relationship handling', () => {
  it('produces no pattern when 8-10 relationship is missing', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:6-10',
      identityKey: 'NETWORK:6-10',
      houses: [6, 10],
      lords: [Planet.SATURN],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network]);

    expect(patterns).toHaveLength(0);
  });

  it('produces no pattern when 12-10 relationship is missing', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:6-10',
      identityKey: 'NETWORK:6-10',
      houses: [6, 10],
      lords: [Planet.SATURN],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:6'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network]);

    expect(patterns).toHaveLength(0);
  });
});

describe('Deterministic sorting', () => {
  it('sorts patterns by identityKey deterministically', () => {
    const network1 = makeNetwork({
      networkId: 'NETWORK:12-10',
      identityKey: 'NETWORK:12-10',
      houses: [12, 10],
      lords: [Planet.SATURN],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:12'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const network2 = makeNetwork({
      networkId: 'NETWORK:8-10',
      identityKey: 'NETWORK:8-10',
      houses: [8, 10],
      lords: [Planet.SATURN],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:8'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network2, network1]);

    // Verify patterns are sorted by identityKey
    expect(patterns[0].identityKey.localeCompare(patterns[1].identityKey)).toBeLessThan(0);
  });
});
