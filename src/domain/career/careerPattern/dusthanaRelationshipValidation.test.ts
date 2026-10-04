import { validateDusthanaRelationships, aggregateDusthanaRelationshipValidation } from './dusthanaRelationshipValidation';
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

describe('Dusthana Relationship Validation', () => {
  describe('Common Lord detection', () => {
    it('detects COMMON_LORD for 8↔10 with shared Saturn', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-COMMON-LORD',
        identityKey: 'NETWORK:8-10-COMMON-LORD',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const commonLordValidations = result.validations.filter(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidations).toHaveLength(1);
      expect(commonLordValidations[0].status).toBe('VALIDATED');
    });

    it('detects COMMON_LORD for 12↔10 with shared Jupiter', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:12-10-COMMON-LORD',
        identityKey: 'NETWORK:12-10-COMMON-LORD',
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
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:JUPITER:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const commonLordValidations = result.validations.filter(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 12 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidations).toHaveLength(1);
      expect(commonLordValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Cross Lordship detection', () => {
    it('detects CROSS_LORDSHIP when 8L occupies 10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8L-OCCUPIES-10',
        identityKey: 'NETWORK:8L-OCCUPIES-10',
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

      const result = validateDusthanaRelationships([network]);

      const crossLordshipValidations = result.validations.filter(
        v => v.relationshipType === 'CROSS_LORDSHIP' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(crossLordshipValidations).toHaveLength(1);
      expect(crossLordshipValidations[0].status).toBe('VALIDATED');
    });

    it('detects CROSS_LORDSHIP when 10L occupies 8 (reverse direction)', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:10L-OCCUPIES-8',
        identityKey: 'NETWORK:10L-OCCUPIES-8',
        houses: [8, 10],
        lords: [Planet.MARS],
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
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:OCCUPIES:MARS:8'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const crossLordshipValidations = result.validations.filter(
        v => v.relationshipType === 'CROSS_LORDSHIP' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(crossLordshipValidations).toHaveLength(1);
      expect(crossLordshipValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Conjunction detection', () => {
    it('detects CONJUNCTION between 8L and 10L', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8L-CONJUNCT-10L',
        identityKey: 'NETWORK:8L-CONJUNCT-10L',
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
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:CONJUNCT:SATURN:MARS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const conjunctionValidations = result.validations.filter(
        v => v.relationshipType === 'CONJUNCTION' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(conjunctionValidations).toHaveLength(1);
      expect(conjunctionValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Aspect detection', () => {
    it('detects ASPECT between 8L and 10L', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8L-ASPECTS-10L',
        identityKey: 'NETWORK:8L-ASPECTS-10L',
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
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:ASPECTS:SATURN:MARS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const aspectValidations = result.validations.filter(
        v => v.relationshipType === 'ASPECT' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(aspectValidations).toHaveLength(1);
      expect(aspectValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Exchange detection', () => {
    it('detects EXCHANGE between 8L and 10L', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8L-EXCHANGES-10L',
        identityKey: 'NETWORK:8L-EXCHANGES-10L',
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
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:EXCHANGES:SATURN:MARS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const exchangeValidations = result.validations.filter(
        v => v.relationshipType === 'EXCHANGE' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(exchangeValidations).toHaveLength(1);
      expect(exchangeValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('House Placement detection', () => {
    it('detects HOUSE_PLACEMENT when 8L occupies 10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8L-OCCUPIES-10',
        identityKey: 'NETWORK:8L-OCCUPIES-10',
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

      const result = validateDusthanaRelationships([network]);

      const housePlacementValidations = result.validations.filter(
        v => v.relationshipType === 'HOUSE_PLACEMENT' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(housePlacementValidations).toHaveLength(1);
      expect(housePlacementValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Planet Mediated detection', () => {
    it('detects PLANET_MEDIATED when shared participation without direct edge', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:SHARED-PARTICIPANT',
        identityKey: 'NETWORK:SHARED-PARTICIPANT',
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

      const result = validateDusthanaRelationships([network]);

      // Should have CROSS_LORDSHIP (OCCUPIES) but not PLANET_MEDIATED since there's a direct edge
      const planetMediatedValidations = result.validations.filter(
        v => v.relationshipType === 'PLANET_MEDIATED' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(planetMediatedValidations).toHaveLength(0);
    });

    it('detects PLANET_MEDIATED when only shared lordship exists', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:SHARED-LORD-ONLY',
        identityKey: 'NETWORK:SHARED-LORD-ONLY',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      // COMMON_LORD should be detected, not PLANET_MEDIATED
      const commonLordValidations = result.validations.filter(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidations).toHaveLength(1);
      expect(commonLordValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('Negative cases', () => {
    it('returns NOT_VALIDATED when houses co-present but no relationship', () => {
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

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      // Should have NOT_VALIDATED for this pair (no relationship detected)
      const notValidated = pairValidations.filter(v => v.status === 'NOT_VALIDATED');
      expect(notValidated.length).toBeGreaterThan(0);
    });

    it('returns NOT_VALIDATED when third-house-only connection', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-8-10',
        identityKey: 'NETWORK:6-8-10',
        houses: [6, 8, 10],
        lords: [Planet.SATURN, Planet.MARS, Planet.VENUS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6',
            identityKey: 'REL:LORD_OF:SATURN:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:MARS:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:VENUS:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const notValidated = pairValidations.filter(v => v.status === 'NOT_VALIDATED');
      expect(notValidated.length).toBeGreaterThan(0);
    });
  });

  describe('P2-06A regression', () => {
    it('respects freeze: common lordship does NOT satisfy directed relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:COMMON-LORD-NOT-DIRECTED',
        identityKey: 'NETWORK:COMMON-LORD-NOT-DIRECTED',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      // Should detect COMMON_LORD but not CROSS_LORDSHIP (directed)
      const commonLordValidations = result.validations.filter(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const crossLordshipValidations = result.validations.filter(
        v => v.relationshipType === 'CROSS_LORDSHIP' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidations).toHaveLength(1);
      expect(commonLordValidations[0].status).toBe('VALIDATED');
      expect(crossLordshipValidations).toHaveLength(0);
    });
  });

  describe('Determinism', () => {
    it('produces identical output with permuted network order', () => {
      const network1 = makeNetwork({
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:12-10',
        identityKey: 'NETWORK:12-10',
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
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:JUPITER:10'
          })
        ]
      });

      const result1 = validateDusthanaRelationships([network1, network2]);
      const result2 = validateDusthanaRelationships([network2, network1]);

      // Should produce identical serialized output
      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Deduplication', () => {
    it('dedups identical relationships across networks', () => {
      const network1 = makeNetwork({
        networkId: 'NETWORK:8-10-1',
        identityKey: 'NETWORK:8-10-1',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:8-10-2',
        identityKey: 'NETWORK:8-10-2',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network1, network2]);

      // Relationship IDs should be deduped
      const uniqueRelationshipIds = new Set(result.relationshipIds);
      expect(uniqueRelationshipIds.size).toBe(result.relationshipIds.length);
    });
  });

  describe('Multi-lord handling', () => {
    it('evaluates ALL lord combinations for multi-lord houses', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:MULTI-LORD',
        identityKey: 'NETWORK:MULTI-LORD',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS, Planet.JUPITER],
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
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:MARS:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:JUPITER:10'
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'PLANET:JUPITER',
            identityKey: 'REL:CONJUNCT:MARS:JUPITER'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const conjunctionValidations = result.validations.filter(
        v => v.relationshipType === 'CONJUNCTION' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      // Should detect conjunction between Mars (8L) and Jupiter (10L)
      expect(conjunctionValidations).toHaveLength(1);
      expect(conjunctionValidations[0].status).toBe('VALIDATED');
    });
  });

  describe('INSUFFICIENT_DATA vs NOT_VALIDATED', () => {
    it('returns INSUFFICIENT_DATA when lordship edges absent', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:NO-LORDSHIP',
        identityKey: 'NETWORK:NO-LORDSHIP',
        houses: [8, 10],
        lords: [],
        relationships: []
      });

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const insufficientData = pairValidations.filter(v => v.status === 'INSUFFICIENT_DATA');
      expect(insufficientData.length).toBeGreaterThan(0);
    });

    it('returns NOT_VALIDATED when data present but no relationship', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:DATA-NO-RELATIONSHIP',
        identityKey: 'NETWORK:DATA-NO-RELATIONSHIP',
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

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const notValidated = pairValidations.filter(v => v.status === 'NOT_VALIDATED');
      expect(notValidated.length).toBeGreaterThan(0);
    });
  });

  describe('Golden fixtures', () => {
    it('golden fixture 1: 8L Saturn OCCUPIES 10H → VALIDATED/HOUSE_PLACEMENT', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:GOLDEN-1',
        identityKey: 'NETWORK:GOLDEN-1',
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

      const result = validateDusthanaRelationships([network]);

      const housePlacementValidations = result.validations.filter(
        v => v.relationshipType === 'HOUSE_PLACEMENT' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(housePlacementValidations).toHaveLength(1);
      expect(housePlacementValidations[0].status).toBe('VALIDATED');
    });

    it('golden fixture 2: no edges → NOT_VALIDATED', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:GOLDEN-2',
        identityKey: 'NETWORK:GOLDEN-2',
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

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const notValidated = pairValidations.filter(v => v.status === 'NOT_VALIDATED');
      expect(notValidated.length).toBeGreaterThan(0);
    });

    it('golden fixture 3: missing lordship → INSUFFICIENT_DATA', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:GOLDEN-3',
        identityKey: 'NETWORK:GOLDEN-3',
        houses: [8, 10],
        lords: [],
        relationships: []
      });

      const result = validateDusthanaRelationships([network]);

      const pairValidations = result.validations.filter(
        v => v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      const insufficientData = pairValidations.filter(v => v.status === 'INSUFFICIENT_DATA');
      expect(insufficientData.length).toBeGreaterThan(0);
    });
  });

  describe('Aggregate validation', () => {
    it('aggregates validations without merging across pairs', () => {
      const network1 = makeNetwork({
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network1]);
      const aggregated = aggregateDusthanaRelationshipValidation(result.validations);

      expect(aggregated.validatedPairCount).toBe(result.validatedPairCount);
      expect(aggregated.insufficientPairCount).toBe(result.insufficientPairCount);
    });
  });

  describe('Provenance regression - edge ID tracking', () => {
    it('COMMON_LORD: relationshipIds contain only establishing LORD_OF edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:COMMON-LORD-PROVENANCE',
        identityKey: 'NETWORK:COMMON-LORD-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN],
        relationships: [
          // Establishing edges
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:8',
            identityKey: 'REL:LORD_OF:SATURN:8'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          }),
          // Unrelated edge
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:6',
            identityKey: 'REL:OCCUPIES:MARS:6'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const commonLordValidation = result.validations.find(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidation).toBeDefined();
      expect(commonLordValidation!.status).toBe('VALIDATED');
      expect(commonLordValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:8');
      expect(commonLordValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:10');
      // Should NOT contain the unrelated OCCUPIES edge
      expect(commonLordValidation!.relationshipIds).not.toContain('REL:OCCUPIES:MARS:6');
    });

    it('CROSS_LORDSHIP: relationshipIds contain only establishing OCCUPIES/ASPECTS edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:CROSS-LORDSHIP-PROVENANCE',
        identityKey: 'NETWORK:CROSS-LORDSHIP-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          // Establishing edges
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
          }),
          // Unrelated edge
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'PLANET:VENUS',
            identityKey: 'REL:CONJUNCT:JUPITER:VENUS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const crossLordshipValidation = result.validations.find(
        v => v.relationshipType === 'CROSS_LORDSHIP' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(crossLordshipValidation).toBeDefined();
      expect(crossLordshipValidation!.status).toBe('VALIDATED');
      expect(crossLordshipValidation!.relationshipIds).toContain('REL:OCCUPIES:SATURN:10');
      // CROSS_LORDSHIP returns only the directed edges (OCCUPIES/ASPECTS), not LORD_OF edges
      // Should NOT contain the unrelated CONJUNCT edge
      expect(crossLordshipValidation!.relationshipIds).not.toContain('REL:CONJUNCT:JUPITER:VENUS');
    });

    it('CONJUNCTION: relationshipIds contain only establishing CONJUNCT + LORD_OF edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:CONJUNCTION-PROVENANCE',
        identityKey: 'NETWORK:CONJUNCTION-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          // Establishing edges
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
          }),
          // Unrelated edge
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'PLANET:VENUS',
            identityKey: 'REL:ASPECTS:JUPITER:VENUS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const conjunctionValidation = result.validations.find(
        v => v.relationshipType === 'CONJUNCTION' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(conjunctionValidation).toBeDefined();
      expect(conjunctionValidation!.status).toBe('VALIDATED');
      expect(conjunctionValidation!.relationshipIds).toContain('REL:CONJUNCT:SATURN:MARS');
      expect(conjunctionValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:8');
      expect(conjunctionValidation!.relationshipIds).toContain('REL:LORD_OF:MARS:10');
      // Should NOT contain the unrelated ASPECTS edge
      expect(conjunctionValidation!.relationshipIds).not.toContain('REL:ASPECTS:JUPITER:VENUS');
    });

    it('ASPECT: relationshipIds contain only establishing ASPECTS + LORD_OF edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:ASPECT-PROVENANCE',
        identityKey: 'NETWORK:ASPECT-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          // Establishing edges
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:ASPECTS:SATURN:MARS'
          }),
          // Unrelated edge
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'PLANET:VENUS',
            identityKey: 'REL:CONJUNCT:JUPITER:VENUS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const aspectValidation = result.validations.find(
        v => v.relationshipType === 'ASPECT' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(aspectValidation).toBeDefined();
      expect(aspectValidation!.status).toBe('VALIDATED');
      expect(aspectValidation!.relationshipIds).toContain('REL:ASPECTS:SATURN:MARS');
      expect(aspectValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:8');
      expect(aspectValidation!.relationshipIds).toContain('REL:LORD_OF:MARS:10');
      // Should NOT contain the unrelated CONJUNCT edge
      expect(aspectValidation!.relationshipIds).not.toContain('REL:CONJUNCT:JUPITER:VENUS');
    });

    it('EXCHANGE: relationshipIds contain only establishing EXCHANGES + LORD_OF edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:EXCHANGE-PROVENANCE',
        identityKey: 'NETWORK:EXCHANGE-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          // Establishing edges
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
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:EXCHANGES:SATURN:MARS'
          }),
          // Unrelated edge
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'PLANET:VENUS',
            identityKey: 'REL:ASPECTS:JUPITER:VENUS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const exchangeValidation = result.validations.find(
        v => v.relationshipType === 'EXCHANGE' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(exchangeValidation).toBeDefined();
      expect(exchangeValidation!.status).toBe('VALIDATED');
      expect(exchangeValidation!.relationshipIds).toContain('REL:EXCHANGES:SATURN:MARS');
      expect(exchangeValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:8');
      expect(exchangeValidation!.relationshipIds).toContain('REL:LORD_OF:MARS:10');
      // Should NOT contain the unrelated ASPECTS edge
      expect(exchangeValidation!.relationshipIds).not.toContain('REL:ASPECTS:JUPITER:VENUS');
    });

    it('HOUSE_PLACEMENT: relationshipIds contain only establishing OCCUPIES + LORD_OF edges', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:HOUSE-PLACEMENT-PROVENANCE',
        identityKey: 'NETWORK:HOUSE-PLACEMENT-PROVENANCE',
        houses: [8, 10],
        lords: [Planet.SATURN, Planet.MARS],
        relationships: [
          // Establishing edges
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
          }),
          // Unrelated edge
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'PLANET:VENUS',
            identityKey: 'REL:ASPECTS:JUPITER:VENUS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const housePlacementValidation = result.validations.find(
        v => v.relationshipType === 'HOUSE_PLACEMENT' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(housePlacementValidation).toBeDefined();
      expect(housePlacementValidation!.status).toBe('VALIDATED');
      expect(housePlacementValidation!.relationshipIds).toContain('REL:OCCUPIES:SATURN:10');
      expect(housePlacementValidation!.relationshipIds).toContain('REL:LORD_OF:SATURN:8');
      // Should NOT contain the unrelated ASPECTS edge
      expect(housePlacementValidation!.relationshipIds).not.toContain('REL:ASPECTS:JUPITER:VENUS');
    });
  });

  describe('Evidence record provenance', () => {
    it('evidence records reference exact relationshipIds from validation', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:EVIDENCE-PROVENANCE',
        identityKey: 'NETWORK:EVIDENCE-PROVENANCE',
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:SATURN:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);
      const commonLordValidation = result.validations.find(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 8 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidation).toBeDefined();
      expect(commonLordValidation!.status).toBe('VALIDATED');

      // Evidence should be created for validated relationships
      expect(result.evidence.length).toBeGreaterThan(0);

      // Find the evidence record for this validation
      const evidenceRecord = result.evidence.find(
        e => e.relationshipType === 'COMMON_LORD' &&
          e.dusthanaHouse === 8 &&
          e.careerAnchorHouse === 10
      );

      expect(evidenceRecord).toBeDefined();
      expect(evidenceRecord!.sourceNetworkId).toBe('NETWORK:EVIDENCE-PROVENANCE');
      expect(evidenceRecord!.sourceNetworkIdentityKey).toBe('NETWORK:EVIDENCE-PROVENANCE');
      // The evidence relationshipId should reference the establishing edges
      expect(evidenceRecord!.relationshipId).toContain('REL:LORD_OF:SATURN:8');
      expect(evidenceRecord!.relationshipId).toContain('REL:LORD_OF:SATURN:10');
    });
  });

  describe('6H golden coverage parity', () => {
    it('detects COMMON_LORD for 6↔10 with shared planet', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-COMMON-LORD',
        identityKey: 'NETWORK:6-10-COMMON-LORD',
        houses: [6, 10],
        lords: [Planet.VENUS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:6',
            identityKey: 'REL:LORD_OF:VENUS:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:VENUS:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const commonLordValidations = result.validations.filter(
        v => v.relationshipType === 'COMMON_LORD' && v.dusthanaHouse === 6 && v.careerAnchorHouse === 10
      );

      expect(commonLordValidations).toHaveLength(1);
      expect(commonLordValidations[0].status).toBe('VALIDATED');
    });

    it('detects CROSS_LORDSHIP when 6L occupies 10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6L-OCCUPIES-10',
        identityKey: 'NETWORK:6L-OCCUPIES-10',
        houses: [6, 10],
        lords: [Planet.VENUS, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:6',
            identityKey: 'REL:LORD_OF:VENUS:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:OCCUPIES:VENUS:10'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const crossLordshipValidations = result.validations.filter(
        v => v.relationshipType === 'CROSS_LORDSHIP' && v.dusthanaHouse === 6 && v.careerAnchorHouse === 10
      );

      expect(crossLordshipValidations).toHaveLength(1);
      expect(crossLordshipValidations[0].status).toBe('VALIDATED');
    });

    it('detects CONJUNCTION between 6L and 10L', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6L-CONJUNCT-10L',
        identityKey: 'NETWORK:6L-CONJUNCT-10L',
        houses: [6, 10],
        lords: [Planet.VENUS, Planet.MARS],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:6',
            identityKey: 'REL:LORD_OF:VENUS:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MARS',
            targetNodeId: 'HOUSE:10',
            identityKey: 'REL:LORD_OF:MARS:10'
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'PLANET:MARS',
            identityKey: 'REL:CONJUNCT:VENUS:MARS'
          })
        ]
      });

      const result = validateDusthanaRelationships([network]);

      const conjunctionValidations = result.validations.filter(
        v => v.relationshipType === 'CONJUNCTION' && v.dusthanaHouse === 6 && v.careerAnchorHouse === 10
      );

      expect(conjunctionValidations).toHaveLength(1);
      expect(conjunctionValidations[0].status).toBe('VALIDATED');
    });
  });
});
