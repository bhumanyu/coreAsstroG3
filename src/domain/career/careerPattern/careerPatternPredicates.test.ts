import {
  hasDirectHouseRelationship,
  hasDirectedHouseRelationship,
  hasPlanetMediatedRelationship,
  hasCommonLordRelationship,
  isDirectChain
} from './careerPatternPredicates';
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
    identityKey: 'RELATIONSHIP:TEST',
    type: 'LORD_OF',
    sourceNodeId: 'NODE:PLANET:SATURN',
    targetNodeId: 'NODE:HOUSE:6',
    provenance
  };

  return { ...defaultRelationship, ...overrides };
}

describe('careerPatternPredicates', () => {
  describe('hasDirectHouseRelationship', () => {
    it('returns true for LORD_OF edge where planet lords both houses', () => {
      const network = makeNetwork({
        houses: [6, 10],
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

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns true for OCCUPIES edge where planet lords one house and occupies another', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns true for ASPECTS edge where planet lords one house and aspects another', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns true for EXCHANGES edge between planets that lord the two houses', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false when no direct house relationship exists', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(false);
    });
  });

  describe('hasDirectedHouseRelationship', () => {
    it('returns true for directed LORD_OF edge where planet lords both houses', () => {
      const network = makeNetwork({
        houses: [6, 10],
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

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns true for directed OCCUPIES edge where planet lords fromHouse and occupies toHouse', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false for OCCUPIES edge in reverse direction', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('returns true for directed ASPECTS edge where planet lords fromHouse and aspects toHouse', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false for ASPECTS edge in reverse direction', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('returns false for EXCHANGES edge (bidirectional only, not directed)', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      // EXCHANGES is bidirectional only, cannot satisfy directed relationships
      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('returns false when no directed relationship exists', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
    });

    it('returns true for planet-mediated-only (SATURN lords 6, occupies 10)', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      // This yields directed 6→10 via occupies-from-lord semantics
      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
    });
  });

  describe('hasPlanetMediatedRelationship', () => {
    it('returns true when same planet lords both houses but no direct house-to-house edge', () => {
      const network = makeNetwork({
        houses: [6, 10],
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

      // LORD_OF where planet lords both houses IS a direct relationship, not planet-mediated-only
      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(false);
    });

    it('returns false when direct relationship exists', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(false);
    });

    it('returns false when no shared planet participation', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(false);
    });
  });

  describe('hasCommonLordRelationship', () => {
    it('returns true when same planet lords both houses', () => {
      const network = makeNetwork({
        houses: [6, 10],
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

      expect(hasCommonLordRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false when different planets lord each house', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasCommonLordRelationship(network, 6, 10)).toBe(false);
    });

    it('returns false when only one house has a lord', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(hasCommonLordRelationship(network, 6, 10)).toBe(false);
    });
  });

  describe('isDirectChain', () => {
    it('returns true for valid directed chain 6→10→11', () => {
      const network = makeNetwork({
        houses: [6, 10, 11],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(true);
    });

    it('returns false when 6→10 edge is missing', () => {
      const network = makeNetwork({
        houses: [6, 10, 11],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('returns false when 10→11 edge is missing', () => {
      const network = makeNetwork({
        houses: [6, 10, 11],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('returns false for reverse chain 10→6→11 (wrong direction)', () => {
      const network = makeNetwork({
        houses: [6, 10, 11],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [10, 6, 11])).toBe(false);
    });

    it('returns false for single house', () => {
      const network = makeNetwork({
        houses: [6],
        relationships: []
      });

      expect(isDirectChain(network, [6])).toBe(false);
    });

    it('returns false for empty array', () => {
      const network = makeNetwork({
        houses: [],
        relationships: []
      });

      expect(isDirectChain(network, [])).toBe(false);
    });

    it('returns true for longer chain 2→6→10→11', () => {
      const network = makeNetwork({
        houses: [2, 6, 10, 11],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:2'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [2, 6, 10, 11])).toBe(true);
    });
  });

  describe('Synthetic tests for ordered pathway validation', () => {
    describe('6-10-11 pattern', () => {
      it('6-10-11 + STAR topology → no specialized (not SERVICE_TO_PROFESSION_TO_GAINS)', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          topology: 'STAR',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + TRIANGLE topology → no specialized', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          topology: 'TRIANGLE',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + CLUSTER topology → no specialized', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          topology: 'CLUSTER',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + missing 6→10 edge → no specialized', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + reverse 10→6 only → no specialized (proves ordered, not undirected)', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + unrelated edges → no specialized', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(false);
      });

      it('6-10-11 + real LORD_OF/OCCUPIES chain → specialized DOES fire', () => {
        const network = makeNetwork({
          houses: [6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [6, 10, 11])).toBe(true);
      });
    });

    describe('9-10-11 pattern', () => {
      it('9-10-11 + STAR topology → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          topology: 'STAR',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + TRIANGLE topology → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          topology: 'TRIANGLE',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + CLUSTER topology → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          topology: 'CLUSTER',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + missing 9→10 edge → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + reverse 10→9 only → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + unrelated edges → no specialized', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(false);
      });

      it('9-10-11 + real LORD_OF/OCCUPIES chain → specialized DOES fire', () => {
        const network = makeNetwork({
          houses: [9, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:9'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [9, 10, 11])).toBe(true);
      });
    });

    describe('2-6-10-11 pattern', () => {
      it('2-6-10-11 + STAR topology → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          topology: 'STAR',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:VENUS',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + TRIANGLE topology → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          topology: 'TRIANGLE',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:VENUS',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + CLUSTER topology → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          topology: 'CLUSTER',
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:VENUS',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + missing 2→6 edge → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + reverse 6→2 only → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + unrelated edges → no specialized', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:VENUS',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(false);
      });

      it('2-6-10-11 + real LORD_OF/OCCUPIES chain → specialized DOES fire', () => {
        const network = makeNetwork({
          houses: [2, 6, 10, 11],
          relationships: [
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:2'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:JUPITER',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:6'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:SATURN',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'LORD_OF',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:10'
            }),
            makeRelationship({
              type: 'OCCUPIES',
              sourceNodeId: 'PLANET:MERCURY',
              targetNodeId: 'HOUSE:11'
            })
          ]
        });

        expect(isDirectChain(network, [2, 6, 10, 11])).toBe(true);
      });
    });
  });

  describe('EXCHANGES-only network tests', () => {
    it('EXCHANGES-only network: isDirectChain([6,10]) false', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      // EXCHANGES cannot satisfy ordered pathways
      expect(isDirectChain(network, [6, 10])).toBe(false);
    });

    it('EXCHANGES-only network: hasDirectedHouseRelationship false for both directions', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      // EXCHANGES is bidirectional only, cannot satisfy directed relationships
      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('EXCHANGES-only network: hasCommonLordRelationship false (different lords)', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      // Different planets lord each house, no common lord
      expect(hasCommonLordRelationship(network, 6, 10)).toBe(false);
    });

    it('EXCHANGES-only network: hasDirectHouseRelationship true (bidirectional union)', () => {
      const network = makeNetwork({
        houses: [6, 10],
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      // hasDirectHouseRelationship includes EXCHANGES in the union
      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });
  });
});
