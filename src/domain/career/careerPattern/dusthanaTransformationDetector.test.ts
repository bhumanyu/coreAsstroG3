import { detectDusthanaPatterns } from './dusthanaTransformationDetector';
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
    lords: ['SATURN' as Planet],
    relationships: [],
    topology: 'DIRECT_LINK',
    direction: 'FORWARD',
    provenance,
    evidenceIds: []
  };

  return { ...defaultNetwork, ...overrides } as CareerHouseNetwork;
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

  return { ...defaultRelationship, ...overrides } as CareerGraphEdge;
}

describe('Dusthana Transformation Detector', () => {
  describe('8↔10 detection', () => {
    it('detects 8-10 network as dusthana transformation', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: ['SATURN' as Planet]
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
        lords: ['SATURN' as Planet]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toContain('RESEARCH');
      expect(patterns[0].mechanisms).toContain('INVESTIGATION');
      expect(patterns[0].mechanisms).toContain('TRANSFORMATION');
    });

    it('infers MIXED mechanism when no planets present', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10-NO-PLANETS',
        identityKey: 'NETWORK:8-10-NO-PLANETS',
        houses: [8, 10],
        lords: []
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].mechanisms).toEqual(['MIXED']);
    });

    it('never produces NEGATIVE direction for 8-10', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: ['SATURN' as Planet],
        direction: 'FORWARD'
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
        lords: ['SATURN' as Planet]
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
        lords: ['SATURN' as Planet]
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
        lords: ['JUPITER' as Planet]
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
        lords: ['SATURN' as Planet],
        direction: 'REVERSE'
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns[0].direction).not.toBe('NEGATIVE');
      expect(patterns[0].direction).toBe('REVERSE');
    });
  });

  describe('Missing relationship handling', () => {
    it('produces no pattern when 8-10 relationship is missing', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10',
        identityKey: 'NETWORK:6-10',
        houses: [6, 10],
        lords: ['SATURN' as Planet]
      });

      const patterns = detectDusthanaPatterns([network]);

      expect(patterns).toHaveLength(0);
    });

    it('produces no pattern when 12-10 relationship is missing', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10',
        identityKey: 'NETWORK:6-10',
        houses: [6, 10],
        lords: ['SATURN' as Planet]
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
        lords: ['SATURN' as Planet]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        lords: ['SATURN' as Planet]
      });

      const patterns = detectDusthanaPatterns([network2, network1]);

      expect(patterns[0].identityKey).toBe(patterns[0].identityKey);
      expect(patterns[1].identityKey).toBe(patterns[1].identityKey);
    });
  });
});
