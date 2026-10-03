import { describe, it, expect } from 'vitest';
import {
  hasDirectHouseRelationship,
  hasDirectedHouseRelationship,
  hasPlanetMediatedRelationship,
  hasCommonLordRelationship,
  isDirectChain,
  getLordsOfHouse,
  buildLordshipMap,
  hasExchangeRelationship,
  hasConjunctionRelationship,
  hasLordAspectRelationship
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

describe('careerPatternPredicates - P2-06A Freeze', () => {
  describe('getLordsOfHouse', () => {
    it('returns empty array for house with no lords', () => {
      const network = makeNetwork({
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(getLordsOfHouse(network.relationships, 10)).toEqual([]);
    });

    it('returns single lord for singly-lorded house', () => {
      const network = makeNetwork({
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(getLordsOfHouse(network.relationships, 6)).toEqual([Planet.SATURN]);
    });

    it('returns all lords for multi-lorded house (preserves multi-lord facts)', () => {
      const network = makeNetwork({
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      const lords = getLordsOfHouse(network.relationships, 6);
      expect(lords).toContain(Planet.SATURN);
      expect(lords).toContain(Planet.MERCURY);
      expect(lords.length).toBe(2);
    });

    it('returns sorted array for determinism', () => {
      const network = makeNetwork({
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:VENUS',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      const lords = getLordsOfHouse(network.relationships, 6);
      expect(lords).toEqual([Planet.MERCURY, Planet.SATURN, Planet.VENUS]);
    });
  });

  describe('buildLordshipMap', () => {
    it('builds correct planet→houses map from LORD_OF edges', () => {
      const network = makeNetwork({
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
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      const map = buildLordshipMap(network.relationships);
      expect(map.get(Planet.SATURN)).toEqual(new Set([6, 10]));
      expect(map.get(Planet.MERCURY)).toEqual(new Set([11]));
    });

    it('only considers LORD_OF edges', () => {
      const network = makeNetwork({
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

      const map = buildLordshipMap(network.relationships);
      expect(map.get(Planet.SATURN)).toEqual(new Set([6]));
    });
  });

  describe('hasCommonLordRelationship', () => {
    it('returns true when same planet lords both houses (undirected)', () => {
      const network = makeNetwork({
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
      expect(hasCommonLordRelationship(network, 10, 6)).toBe(true); // symmetric
    });

    it('returns false when different planets lord each house', () => {
      const network = makeNetwork({
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

    it('returns false when a===b (self-relationship)', () => {
      const network = makeNetwork({
        relationships: [
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:6'
          })
        ]
      });

      expect(hasCommonLordRelationship(network, 6, 6)).toBe(false);
    });

    it('cannot satisfy directed relationship (excluded from hasDirectedHouseRelationship)', () => {
      const network = makeNetwork({
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

      // Common lord is undirected, cannot satisfy directed
      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('cannot satisfy ordered chain (excluded from isDirectChain)', () => {
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      // Common lord cannot satisfy ordered chain
      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });
  });

  describe('hasDirectedHouseRelationship - OCCUPIES', () => {
    it('returns true for lord(from) OCCUPIES→to (directional one-way)', () => {
      const network = makeNetwork({
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

    it('returns false for reverse direction (OCCUPIES is directional)', () => {
      const network = makeNetwork({
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

    it('asymmetry invariant: OCCUPIES direction matters', () => {
      const network = makeNetwork({
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
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });
  });

  describe('hasDirectedHouseRelationship - ASPECTS (house target)', () => {
    it('returns true for lord(from) ASPECTS→toHouse (directional)', () => {
      const network = makeNetwork({
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

    it('returns false for reverse direction (ASPECTS is directional)', () => {
      const network = makeNetwork({
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

    it('asymmetry invariant: ASPECTS direction matters', () => {
      const network = makeNetwork({
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
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });
  });

  describe('hasDirectedHouseRelationship - ASPECTS (planet target)', () => {
    it('returns true for lord(from) ASPECTS→lord(to) with sourceLord !== targetLord', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false when sourceLord === targetLord (self-aspect excluded)', () => {
      const network = makeNetwork({
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
          }),
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:SATURN'
          })
        ]
      });

      // Self-aspect does not establish directed relationship
      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
    });

    it('asymmetry invariant: planet-level ASPECTS direction matters', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });
  });

  describe('hasDirectedHouseRelationship - exclusions', () => {
    it('excludes common lordship (undirected)', () => {
      const network = makeNetwork({
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

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
    });

    it('excludes conjunction (undirected)', () => {
      const network = makeNetwork({
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
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
    });

    it('excludes exchange (bidirectional, not directed)', () => {
      const network = makeNetwork({
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

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(false);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });
  });

  describe('hasConjunctionRelationship', () => {
    it('returns true when lords are in CONJUNCT (undirected)', () => {
      const network = makeNetwork({
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
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasConjunctionRelationship(network, 6, 10)).toBe(true);
      expect(hasConjunctionRelationship(network, 10, 6)).toBe(true); // symmetric
    });

    it('symmetry invariant: CONJUNCT is undirected', () => {
      const network = makeNetwork({
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
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasConjunctionRelationship(network, 6, 10)).toBe(true);
      expect(hasConjunctionRelationship(network, 10, 6)).toBe(true);
    });

    it('cannot satisfy ordered chain (excluded from isDirectChain)', () => {
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
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'PLANET:JUPITER'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });
  });

  describe('hasExchangeRelationship', () => {
    it('returns true when lords have EXCHANGES (bidirectional)', () => {
      const network = makeNetwork({
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

      expect(hasExchangeRelationship(network, 6, 10)).toBe(true);
      expect(hasExchangeRelationship(network, 10, 6)).toBe(true); // symmetric
    });

    it('symmetry invariant: EXCHANGES is bidirectional', () => {
      const network = makeNetwork({
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

      expect(hasExchangeRelationship(network, 6, 10)).toBe(true);
      expect(hasExchangeRelationship(network, 10, 6)).toBe(true);
    });

    it('cannot satisfy ordered chain (excluded from isDirectChain)', () => {
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
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'PLANET:JUPITER'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });
  });

  describe('hasLordAspectRelationship', () => {
    it('returns true when lords have ASPECTS in either direction (undirected for this predicate)', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasLordAspectRelationship(network, 6, 10)).toBe(true);
      expect(hasLordAspectRelationship(network, 10, 6)).toBe(true); // symmetric for this predicate
    });

    it('symmetry invariant: this helper checks both directions', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasLordAspectRelationship(network, 6, 10)).toBe(true);
      expect(hasLordAspectRelationship(network, 10, 6)).toBe(true);
    });
  });

  describe('hasDirectHouseRelationship', () => {
    it('undirected umbrella: includes common lord', () => {
      const network = makeNetwork({
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

    it('undirected umbrella: includes directed relationship either direction', () => {
      const network = makeNetwork({
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
      expect(hasDirectHouseRelationship(network, 10, 6)).toBe(true); // umbrella includes reverse
    });

    it('undirected umbrella: includes conjunction', () => {
      const network = makeNetwork({
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
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('undirected umbrella: includes lord aspect (either direction)', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectHouseRelationship(network, 6, 10)).toBe(true);
    });

    it('undirected umbrella: includes exchange', () => {
      const network = makeNetwork({
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

    it('returns false when no relationship exists', () => {
      const network = makeNetwork({
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

  describe('hasPlanetMediatedRelationship', () => {
    it('returns false when direct relationship exists', () => {
      const network = makeNetwork({
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

    it('returns true for shared lordship when no direct relationship', () => {
      const network = makeNetwork({
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

      // Common lord IS a direct relationship, so this should be false
      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(false);
    });

    it('returns true for shared OCCUPIES participation when no direct relationship', () => {
      const network = makeNetwork({
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
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'OCCUPIES',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(true);
    });

    it('returns true for shared ASPECTS participation when no direct relationship', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:6'
          }),
          makeRelationship({
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:JUPITER',
            targetNodeId: 'HOUSE:10'
          })
        ]
      });

      expect(hasPlanetMediatedRelationship(network, 6, 10)).toBe(true);
    });

    it('returns false when no shared participation', () => {
      const network = makeNetwork({
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

  describe('isDirectChain', () => {
    it('accepts genuine 6→10→11 with directed OCCUPIES chain', () => {
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

    it('rejects reverse direction 10→6→11', () => {
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

    it('rejects partial chain (only 6→10)', () => {
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
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('rejects partial chain (only 10→11)', () => {
      const network = makeNetwork({
        houses: [6, 10, 11],
        relationships: [
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

    it('rejects STAR topology (no directed edges)', () => {
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

    it('rejects TRIANGLE without directed pathway', () => {
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

    it('rejects EXCHANGES-only chain', () => {
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
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          }),
          makeRelationship({
            type: 'EXCHANGES',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'PLANET:JUPITER'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('rejects CONJUNCT-only chain', () => {
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
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          }),
          makeRelationship({
            type: 'CONJUNCT',
            sourceNodeId: 'PLANET:MERCURY',
            targetNodeId: 'PLANET:JUPITER'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('rejects common-lord-only chain', () => {
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
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:10'
          }),
          makeRelationship({
            type: 'LORD_OF',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'HOUSE:11'
          })
        ]
      });

      expect(isDirectChain(network, [6, 10, 11])).toBe(false);
    });

    it('rejects duplicate-house sequence', () => {
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

      expect(isDirectChain(network, [6, 10, 10, 11])).toBe(false);
    });

    it('rejects empty sequence', () => {
      const network = makeNetwork({
        houses: [],
        relationships: []
      });

      expect(isDirectChain(network, [])).toBe(false);
    });

    it('rejects single-house sequence', () => {
      const network = makeNetwork({
        houses: [6],
        relationships: []
      });

      expect(isDirectChain(network, [6])).toBe(false);
    });
  });

  describe('Symmetry invariants', () => {
    it('common lord: symmetric (undirected)', () => {
      const network = makeNetwork({
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
      expect(hasCommonLordRelationship(network, 10, 6)).toBe(true);
    });

    it('exchange: symmetric (bidirectional)', () => {
      const network = makeNetwork({
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

      expect(hasExchangeRelationship(network, 6, 10)).toBe(true);
      expect(hasExchangeRelationship(network, 10, 6)).toBe(true);
    });

    it('OCCUPIES: asymmetric (directional)', () => {
      const network = makeNetwork({
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
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });

    it('planet-level ASPECTS: asymmetric (directional)', () => {
      const network = makeNetwork({
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
            type: 'ASPECTS',
            sourceNodeId: 'PLANET:SATURN',
            targetNodeId: 'PLANET:MERCURY'
          })
        ]
      });

      expect(hasDirectedHouseRelationship(network, 6, 10)).toBe(true);
      expect(hasDirectedHouseRelationship(network, 10, 6)).toBe(false);
    });
  });
});
