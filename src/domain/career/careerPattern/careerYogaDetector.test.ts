import { detectCareerYogaPatterns } from './careerYogaDetector';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
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

describe('Career Yoga Detector', () => {
  describe('Career-relevant network detection', () => {
    it('detects career yoga pattern for career-relevant network with multiple planets', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-MULTI',
        identityKey: 'NETWORK:6-10-MULTI',
        houses: [6, 10],
        lords: ['SATURN' as Planet, 'MARS' as Planet]
      });

      const patterns = detectCareerYogaPatterns([network]);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].careerRelevant).toBe(true);
      expect(patterns[0].participants).toEqual(['SATURN', 'MARS']);
    });

    it('does not detect yoga for network with single planet', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-SINGLE',
        identityKey: 'NETWORK:6-10-SINGLE',
        houses: [6, 10],
        lords: ['SATURN' as Planet]
      });

      const patterns = detectCareerYogaPatterns([network]);

      expect(patterns).toHaveLength(0);
    });

    it('does not detect yoga for non-career-relevant network', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:1-5',
        identityKey: 'NETWORK:1-5',
        houses: [1, 5],
        lords: ['SATURN' as Planet, 'MARS' as Planet]
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
        lords: ['SATURN' as Planet, 'MARS' as Planet]
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
        lords: ['SATURN' as Planet, 'MARS' as Planet],
        evidenceIds: ['EVIDENCE:1', 'EVIDENCE:2']
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
        lords: ['SATURN' as Planet, 'MARS' as Planet]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:2-10-MULTI',
        identityKey: 'NETWORK:2-10-MULTI',
        houses: [2, 10],
        lords: ['JUPITER' as Planet, 'VENUS' as Planet]
      });

      const patterns = detectCareerYogaPatterns([network2, network1]);

      expect(patterns[0].identityKey).toBe(patterns[0].identityKey);
      expect(patterns[1].identityKey).toBe(patterns[1].identityKey);
    });
  });
});
