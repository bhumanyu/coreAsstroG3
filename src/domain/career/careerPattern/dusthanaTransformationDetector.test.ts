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
    identityKey: 'REL:TEST',
    type: 'LORD_OF',
    sourceNodeId: 'PLANET:SATURN',
    targetNodeId: 'HOUSE:6',
    provenance
  };

  return { ...defaultRelationship, ...overrides };
}

describe('Dusthana Transformation Detector', () => {
  describe('8↔10 detection', () => {
    it('detects 8-10 network as dusthana transformation with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].family).toBe('DUSTHANA_TRANSFORMATION');
      expect(patterns[0].classification).toBe('DUSTHANA_CAREER_TRANSFORMATION');
      expect(patterns[0].houses).toEqual([8, 10]);
    });

    it('infers mechanisms from Saturn for 8-10 with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-SATURN',
        identityKey: 'NETWORK:8-10-SATURN',
        houses: [8, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('RESEARCH');
      expect(patterns[0].mechanisms).toContain('INVESTIGATION');
      expect(patterns[0].mechanisms).toContain('TRANSFORMATION');
    });

    it('infers structural mechanisms when no planets present with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-NO-PLANETS',
        identityKey: 'NETWORK:8-10-NO-PLANETS',
        houses: [8, 10],
        lords: [],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:CONJUNCT:SATURN:MARS'
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
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].direction).not.toBe('NEGATIVE');
      expect(patterns[0].direction).toBe('FORWARD');
    });
  });

  describe('12↔10 detection', () => {
    it('detects 12-10 network as dusthana transformation with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10',
        identityKey: 'NETWORK:12-10',
        houses: [12, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12',
            identityKey: 'REL:LORD_OF:SATURN:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].family).toBe('DUSTHANA_TRANSFORMATION');
      expect(patterns[0].classification).toBe('DUSTHANA_CAREER_TRANSFORMATION');
      expect(patterns[0].houses).toEqual([12, 10]);
    });

    it('infers mechanisms from Saturn for 12-10 with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10-SATURN',
        identityKey: 'NETWORK:12-10-SATURN',
        houses: [12, 10],
        lords: [Planet.SATURN],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12',
            identityKey: 'REL:LORD_OF:SATURN:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
          })
        ]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('INSTITUTIONAL_WORK');
      expect(patterns[0].mechanisms).toContain('REMOTE_WORK');
    });

    it('infers FOREIGN_WORK from Jupiter for 12-10 with validated relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10-JUPITER',
        identityKey: 'NETWORK:12-10-JUPITER',
        houses: [12, 10],
        lords: [Planet.JUPITER],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:12',
            identityKey: 'REL:LORD_OF:JUPITER:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:JUPITER:10'
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
            targetNodeId: 'HOUSE:12',
            identityKey: 'REL:LORD_OF:SATURN:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:SATURN:10'
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
  it('produces no pattern when 8-10 relationship is not validated', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:8-10-NO-RELATIONSHIP',
      identityKey: 'NETWORK:8-10-NO-RELATIONSHIP',
      houses: [8, 10],
      lords: [Planet.SATURN, Planet.MARS],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:8',
          identityKey: 'REL:LORD_OF:SATURN:8'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:LORD_OF:MARS:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network]);

    expect(patterns).toHaveLength(0);
  });

  it('produces no pattern when 12-10 relationship is not validated', () => {
    const network = makeNetwork({
      networkId: 'NETWORK:12-10-NO-RELATIONSHIP',
      identityKey: 'NETWORK:12-10-NO-RELATIONSHIP',
      houses: [12, 10],
      lords: [Planet.SATURN, Planet.MARS],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:12',
          identityKey: 'REL:LORD_OF:SATURN:12'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:LORD_OF:MARS:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network]);

    expect(patterns).toHaveLength(0);
  });

  it('produces pattern only when validation returns VALIDATED status', () => {
    const networkWithRelationship = makeNetwork({
      networkId: 'NETWORK:8-10-VALIDATED',
      identityKey: 'NETWORK:8-10-VALIDATED',
      houses: [8, 10],
      lords: [Planet.SATURN],
      relationships: [
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:8',
          identityKey: 'REL:LORD_OF:SATURN:8'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:LORD_OF:MARS:10'
        }),
        makeRelationship({
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:OCCUPIES:SATURN:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([networkWithRelationship]);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].family).toBe('DUSTHANA_TRANSFORMATION');
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
          targetNodeId: 'HOUSE:12',
          identityKey: 'REL:LORD_OF:SATURN:12'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:LORD_OF:MARS:10'
        }),
        makeRelationship({
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:OCCUPIES:SATURN:10'
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
          targetNodeId: 'HOUSE:8',
          identityKey: 'REL:LORD_OF:SATURN:8'
        }),
        makeRelationship({
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:LORD_OF:MARS:10'
        }),
        makeRelationship({
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:OCCUPIES:SATURN:10'
        })
      ]
    });

    const patterns = detectDusthanaPatterns([network2, network1]);

    // Verify patterns are sorted by identityKey
    expect(patterns[0].identityKey.localeCompare(patterns[1].identityKey)).toBeLessThan(0);
  });
});

describe('Dusthana Detector Negative Suite', () => {
  describe('House-set-only (no relationship)', () => {
    it('rejects 8-10 house set without any relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8_10_HOUSE_SET_ONLY',
        identityKey: 'NETWORK:8_10_HOUSE_SET_ONLY',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          })
          // No OCCUPIES/ASPECTS/EXCHANGES/CONJUNCT relationship
        ],
        topology: 'DIRECT_LINK',
        direction: 'FORWARD'
      });

      const patterns = detectDusthanaPatterns([network]);
      expect(patterns).toHaveLength(0);
    });

    it('rejects 12-10 house set without any relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12_10_HOUSE_SET_ONLY',
        identityKey: 'NETWORK:12_10_HOUSE_SET_ONLY',
        houses: [12, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:12',
            identityKey: 'REL:LORD_OF:SATURN:12'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          })
        ],
        topology: 'DIRECT_LINK',
        direction: 'FORWARD'
      });

      const patterns = detectDusthanaPatterns([network]);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('Wrong relationship', () => {
    it('rejects 8-10 with wrong relationship type (ASPECTS on wrong house)', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8_10_WRONG_RELATIONSHIP',
        identityKey: 'NETWORK:8_10_WRONG_RELATIONSHIP',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          // Wrong: Mars (10L) aspects 8 instead of 8L connecting to 10
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:ASPECTS:MARS:8'
          })
        ],
        topology: 'DIRECT_LINK',
        direction: 'FORWARD'
      });

      const patterns = detectDusthanaPatterns([network]);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('No relationship', () => {
    it('rejects 8-10 with only LORD_OF edges, no connecting relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8_10_NO_RELATIONSHIP',
        identityKey: 'NETWORK:8_10_NO_RELATIONSHIP',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          })
          // No OCCUPIES/ASPECTS/EXCHANGES/CONJUNCT connecting the houses
        ],
        topology: 'DIRECT_LINK',
        direction: 'FORWARD'
      });

      const patterns = detectDusthanaPatterns([network]);
      expect(patterns).toHaveLength(0);
    });
  });

  describe('Missing data', () => {
    it('rejects 8-10 with missing lordship data', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8_10_MISSING_DATA',
        identityKey: 'NETWORK:8_10_MISSING_DATA',
        houses: [8, 10],
        lords: [], // No lords defined
        relationships: [], // No LORD_OF edges
        topology: 'DIRECT_LINK',
        direction: 'FORWARD'
      });

      const patterns = detectDusthanaPatterns([network]);
      expect(patterns).toHaveLength(0);
    });
  });
});
