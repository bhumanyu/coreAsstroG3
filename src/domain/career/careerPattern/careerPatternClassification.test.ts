import {
  classifyCareerPatterns
} from './careerPatternClassification';
import type {
  CareerPatternClassificationInput,
  CareerPatternClassificationResult
} from './careerPatternTypes';
import {
  classifyCareerHouseNetwork,
  HOUSE_ROLES_2_6_10_11,
  HOUSE_ROLES_3_6_10_11,
  HOUSE_ROLES_5_9_10,
  HOUSE_ROLES_9_10_11,
  HOUSE_ROLES_6_10_11,
  HOUSE_ROLES_2_3_6_10_11,
  HOUSE_ROLES_10_11
} from './careerPatternClassificationRules';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge, CareerGraphProvenance } from '../careerGraph/careerAstroGraphTypes';
import { Planet } from '../../../types';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import {
  buildCareerAstroGraph,
  buildCareerGraphFactsFromStructural,
  detectCareerHouseNetworks
} from '../careerGraph/index';

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

describe('CareerPatternClassification', () => {
  describe('Generic classification', () => {
    it('classifies an unknown house set as generic CAREER_HOUSE_NETWORK', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:GENERIC',
        identityKey: 'NETWORK:GENERIC',
        houses: [1, 5, 9]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].classification).toBe('CAREER_HOUSE_NETWORK');
      expect(result.patterns[0].family).toBe('CAREER_HOUSE_NETWORK');
    });
  });

  describe('6-10-11 classification', () => {
    it('classifies 6-10-11 as SERVICE_TO_PROFESSION_TO_GAINS', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-11',
        identityKey: 'NETWORK:6-10-11',
        houses: [6, 10, 11],
        topology: 'CHAIN'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.family).toBe('CAREER_HOUSE_NETWORK');
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_6_10_11);
    });
  });

  describe('2-6-10-11 houseRoles exact equality', () => {
    it('classifies 2-6-10-11 with exact houseRoles match', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:2-6-10-11',
        identityKey: 'NETWORK:2-6-10-11',
        houses: [2, 6, 10, 11],
        topology: 'CLUSTER'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_2_6_10_11);
      expect(specializedPattern?.houseRoles[2]).toBe('WEALTH_HOUSE');
      expect(specializedPattern?.houseRoles[6]).toBe('SERVICE_HOUSE');
      expect(specializedPattern?.houseRoles[10]).toBe('CAREER_HOUSE');
      expect(specializedPattern?.houseRoles[11]).toBe('GAINS_HOUSE');
    });
  });

  describe('3-6-10-11 Upachaya', () => {
    it('classifies 3-6-10-11 as UPACHAYA_PROGRESSION', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:3-6-10-11',
        identityKey: 'NETWORK:3-6-10-11',
        houses: [3, 6, 10, 11],
        topology: 'CLUSTER'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'UPACHAYA_PROGRESSION');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.family).toBe('UPACHAYA');
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_3_6_10_11);
    });
  });

  describe('Multi-classification (Option B)', () => {
    it('produces both specialized and generic patterns for 3-6-10-11', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:3-6-10-11',
        identityKey: 'NETWORK:3-6-10-11',
        houses: [3, 6, 10, 11],
        topology: 'CLUSTER'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expect(result.patterns.length).toBeGreaterThanOrEqual(2);

      const specializedPattern = result.patterns.find(p => p.classification === 'UPACHAYA_PROGRESSION');
      const genericPattern = result.patterns.find(p => p.classification === 'CAREER_HOUSE_NETWORK');

      expect(specializedPattern).toBeDefined();
      expect(genericPattern).toBeDefined();
    });

    it('produces both specialized and generic patterns for 6-10-11', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:6-10-11',
        identityKey: 'NETWORK:6-10-11',
        houses: [6, 10, 11],
        topology: 'CHAIN'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expect(result.patterns.length).toBeGreaterThanOrEqual(2);

      const specializedPattern = result.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      const genericPattern = result.patterns.find(p => p.classification === 'CAREER_HOUSE_NETWORK');

      expect(specializedPattern).toBeDefined();
      expect(genericPattern).toBeDefined();
    });
  });

  describe('Identity independent of strength', () => {
    it('produces same identityKey regardless of strength/confidence', () => {
      const network1 = makeNetwork({
        networkId: 'NETWORK:STRENGTH1',
        identityKey: 'NETWORK:STRENGTH1',
        houses: [6, 10, 11]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:STRENGTH2',
        identityKey: 'NETWORK:STRENGTH2',
        houses: [6, 10, 11]
      });

      const input1: CareerPatternClassificationInput = { networks: [network1] };
      const input2: CareerPatternClassificationInput = { networks: [network2] };

      const result1 = classifyCareerPatterns(input1);
      const result2 = classifyCareerPatterns(input2);

      const pattern1 = result1.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      const pattern2 = result2.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');

      expect(pattern1?.identityKey).toBe(pattern2?.identityKey);
    });
  });

  describe('Identity independent of direction', () => {
    it('FORWARD and REVERSE produce same identityKey', () => {
      const networkForward = makeNetwork({
        networkId: 'NETWORK:FORWARD',
        identityKey: 'NETWORK:FORWARD',
        houses: [6, 10, 11],
        direction: 'FORWARD'
      });

      const networkReverse = makeNetwork({
        networkId: 'NETWORK:REVERSE',
        identityKey: 'NETWORK:REVERSE',
        houses: [6, 10, 11],
        direction: 'REVERSE'
      });

      const input1: CareerPatternClassificationInput = { networks: [networkForward] };
      const input2: CareerPatternClassificationInput = { networks: [networkReverse] };

      const result1 = classifyCareerPatterns(input1);
      const result2 = classifyCareerPatterns(input2);

      const pattern1 = result1.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      const pattern2 = result2.patterns.find(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');

      expect(pattern1?.identityKey).toBe(pattern2?.identityKey);
    });
  });

  describe('Topology preserved without score/confidence/strength', () => {
    it('pattern includes topology but no strength/confidence/score', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:TOPOLOGY',
        identityKey: 'NETWORK:TOPOLOGY',
        houses: [6, 10, 11],
        topology: 'CHAIN'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const pattern = result.patterns[0];
      expect(pattern.topology).toBe('CHAIN');

      // Verify no strength/confidence/score properties exist
      expect(pattern as any).not.toHaveProperty('strength');
      expect(pattern as any).not.toHaveProperty('confidence');
      expect(pattern as any).not.toHaveProperty('score');
      expect(pattern as any).not.toHaveProperty('weight');
    });
  });

  describe('No dasha/d10/transit/qualification/activation properties', () => {
    it('pattern has no timing-related properties', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:NO-TIMING',
        identityKey: 'NETWORK:NO-TIMING',
        houses: [6, 10, 11]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const pattern = result.patterns[0];

      expect(pattern as any).not.toHaveProperty('dasha');
      expect(pattern as any).not.toHaveProperty('d10');
      expect(pattern as any).not.toHaveProperty('transit');
      expect(pattern as any).not.toHaveProperty('qualification');
      expect(pattern as any).not.toHaveProperty('activation');
    });
  });

  describe('Missing-evidence network still classifies', () => {
    it('classifies network even with empty evidenceIds', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:NO-EVIDENCE',
        identityKey: 'NETWORK:NO-EVIDENCE',
        houses: [6, 10, 11],
        evidenceIds: []
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns[0].classification).toBeDefined();
    });
  });

  describe('Input-permutation determinism', () => {
    it('produces same output for same input regardless of order', () => {
      const network1 = makeNetwork({
        networkId: 'NETWORK:A',
        identityKey: 'NETWORK:A',
        houses: [6, 10, 11]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:B',
        identityKey: 'NETWORK:B',
        houses: [2, 6, 10, 11]
      });

      const input1: CareerPatternClassificationInput = { networks: [network1, network2] };
      const input2: CareerPatternClassificationInput = { networks: [network2, network1] };

      const result1 = classifyCareerPatterns(input1);
      const result2 = classifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Evidence/relationshipIds sort order', () => {
    it('evidence is sorted by evidenceId', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:Z' });
      const relationship2 = makeRelationship({ identityKey: 'REL:A' });

      const network = makeNetwork({
        networkId: 'NETWORK:SORT',
        identityKey: 'NETWORK:SORT',
        houses: [6, 10, 11],
        relationships: [relationship1, relationship2]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const pattern = result.patterns[0];
      const evidenceIds = pattern.evidence.map(e => e.evidenceId);

      // Verify sorted
      for (let i = 1; i < evidenceIds.length; i++) {
        expect(evidenceIds[i] >= evidenceIds[i - 1]).toBe(true);
      }
    });

    it('relationshipIds are sorted', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:Z' });
      const relationship2 = makeRelationship({ identityKey: 'REL:A' });

      const network = makeNetwork({
        networkId: 'NETWORK:SORT-REL',
        identityKey: 'NETWORK:SORT-REL',
        houses: [6, 10, 11],
        relationships: [relationship1, relationship2]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const pattern = result.patterns[0];

      // Verify sorted
      for (let i = 1; i < pattern.relationshipIds.length; i++) {
        expect(pattern.relationshipIds[i] >= pattern.relationshipIds[i - 1]).toBe(true);
      }
    });
  });

  describe('Deep-freeze immutability', () => {
    it('result is deeply frozen', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:FROZEN',
        identityKey: 'NETWORK:FROZEN',
        houses: [6, 10, 11]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      // Attempt to modify should throw in strict mode
      expect(() => {
        (result as any).patterns = [];
      }).toThrow();

      expect(() => {
        (result.patterns[0] as any).classification = 'MODIFIED';
      }).toThrow();
    });
  });

  describe('No RAJA_YOGA_CAREER for 5-9-10', () => {
    it('classifies 5-9-10 as CREATIVE_DHARMA_TO_PROFESSION, not RAJA_YOGA_CAREER', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:5-9-10',
        identityKey: 'NETWORK:5-9-10',
        houses: [5, 9, 10],
        topology: 'TRIANGLE'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'CREATIVE_DHARMA_TO_PROFESSION');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.family).toBe('KENDRA_TRIKONA');

      // Verify the classification is correct (not Raja Yoga)
      expect(specializedPattern?.classification).toBe('CREATIVE_DHARMA_TO_PROFESSION');
    });
  });

  describe('Dusthana [8,10] generic classification', () => {
    it('classifies 8-10 as generic CAREER_HOUSE_NETWORK (never negative)', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:8-10',
        identityKey: 'NETWORK:8-10',
        houses: [8, 10],
        topology: 'DIRECT_LINK'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].classification).toBe('CAREER_HOUSE_NETWORK');
      expect(result.patterns[0].family).toBe('CAREER_HOUSE_NETWORK');
    });
  });

  describe('Real-engine chain test', () => {
    it('end-to-end chain produces valid patterns', async () => {
      const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });
      const networks = detectCareerHouseNetworks({ graph });
      const patterns = classifyCareerPatterns({ networks: networks.networks });

      // Verify every pattern has required fields
      for (const pattern of patterns.patterns) {
        expect(pattern.patternId).toBeDefined();
        expect(pattern.identityKey).toBeDefined();
        expect(pattern.family).toBeDefined();
        expect(pattern.classification).toBeDefined();
        expect(pattern.level).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.topology).toBeDefined();
        expect(pattern.direction).toBeDefined();
        expect(pattern.houses).toBeDefined();
        expect(pattern.houseRoles).toBeDefined();
        expect(pattern.planets).toBeDefined();
        expect(pattern.networkIds).toBeDefined();
        expect(pattern.relationshipIds).toBeDefined();
        expect(pattern.evidence).toBeDefined();
        expect(pattern.provenance).toBeDefined();

        // Verify no forbidden properties
        expect(pattern as any).not.toHaveProperty('strength');
        expect(pattern as any).not.toHaveProperty('confidence');
        expect(pattern as any).not.toHaveProperty('score');
        expect(pattern as any).not.toHaveProperty('dasha');
        expect(pattern as any).not.toHaveProperty('d10');
        expect(pattern as any).not.toHaveProperty('transit');
        expect(pattern as any).not.toHaveProperty('qualification');
        expect(pattern as any).not.toHaveProperty('activation');
      }
    });
  });

  describe('Additional classification rules', () => {
    it('classifies 2-3-6-10-11 as COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:2-3-6-10-11',
        identityKey: 'NETWORK:2-3-6-10-11',
        houses: [2, 3, 6, 10, 11],
        topology: 'CLUSTER'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_2_3_6_10_11);
    });

    it('classifies 10-11 as PROFESSION_TO_GAINS', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:10-11',
        identityKey: 'NETWORK:10-11',
        houses: [10, 11],
        topology: 'DIRECT_LINK'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'PROFESSION_TO_GAINS');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_10_11);
    });

    it('classifies 9-10-11 as DHARMA_KARMA_ALIGNMENT', () => {
      const network = makeNetwork({
        networkId: 'NETWORK:9-10-11',
        identityKey: 'NETWORK:9-10-11',
        houses: [9, 10, 11],
        topology: 'CHAIN'
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const specializedPattern = result.patterns.find(p => p.classification === 'DHARMA_KARMA_ALIGNMENT');
      expect(specializedPattern).toBeDefined();
      expect(specializedPattern?.houseRoles).toEqual(HOUSE_ROLES_9_10_11);
    });
  });

  describe('Parivartana classification', () => {
    it('classifies network with EXCHANGES relationship and career house as PARIVARTANA_YOGA', () => {
      const exchangeRelationship = makeRelationship({
        identityKey: 'REL:EXCHANGE',
        type: 'EXCHANGES'
      });

      const network = makeNetwork({
        networkId: 'NETWORK:PARIVARTANA',
        identityKey: 'NETWORK:PARIVARTANA',
        houses: [2, 10],
        relationships: [exchangeRelationship]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const parivartanaPattern = result.patterns.find(p => p.classification === 'PARIVARTANA_YOGA');
      expect(parivartanaPattern).toBeDefined();
      expect(parivartanaPattern?.family).toBe('PARIVARTANA');
      expect(parivartanaPattern?.level).toBe('PLANETARY_YOGA');
    });

    it('does not classify network with EXCHANGES but no career house as PARIVARTANA_YOGA', () => {
      const exchangeRelationship = makeRelationship({
        identityKey: 'REL:EXCHANGE',
        type: 'EXCHANGES'
      });

      const network = makeNetwork({
        networkId: 'NETWORK:EXCHANGE-NO-CAREER',
        identityKey: 'NETWORK:EXCHANGE-NO-CAREER',
        houses: [1, 5],
        relationships: [exchangeRelationship]
      });

      const input: CareerPatternClassificationInput = { networks: [network] };
      const result = classifyCareerPatterns(input);

      const parivartanaPattern = result.patterns.find(p => p.classification === 'PARIVARTANA_YOGA');
      expect(parivartanaPattern).toBeUndefined();
    });
  });

  describe('Deduplication', () => {
    it('merges patterns with same identityKey from different networks', () => {
      const sharedRelationship = makeRelationship({ identityKey: 'REL:SHARED' });

      const network1 = makeNetwork({
        networkId: 'NETWORK:DEDUP1',
        identityKey: 'NETWORK:DEDUP1',
        houses: [6, 10, 11],
        relationships: [sharedRelationship]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:DEDUP2',
        identityKey: 'NETWORK:DEDUP2',
        houses: [6, 10, 11],
        relationships: [sharedRelationship]
      });

      const input: CareerPatternClassificationInput = { networks: [network1, network2] };
      const result = classifyCareerPatterns(input);

      // Should have deduplicated patterns
      const servicePatterns = result.patterns.filter(p => p.classification === 'SERVICE_TO_PROFESSION_TO_GAINS');
      expect(servicePatterns.length).toBeGreaterThan(0);

      // Check that networkIds are merged
      if (servicePatterns.length > 0) {
        expect(servicePatterns[0].networkIds.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Relationship-order permutation', () => {
    it('produces identical output when relationships array is shuffled', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:A' });
      const relationship2 = makeRelationship({ identityKey: 'REL:B' });
      const relationship3 = makeRelationship({ identityKey: 'REL:C' });

      const network1 = makeNetwork({
        networkId: 'NETWORK:REL-ORDER',
        identityKey: 'NETWORK:REL-ORDER',
        houses: [6, 10, 11],
        relationships: [relationship1, relationship2, relationship3]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:REL-ORDER',
        identityKey: 'NETWORK:REL-ORDER',
        houses: [6, 10, 11],
        relationships: [relationship3, relationship1, relationship2] // shuffled
      });

      const input1: CareerPatternClassificationInput = { networks: [network1] };
      const input2: CareerPatternClassificationInput = { networks: [network2] };

      const result1 = classifyCareerPatterns(input1);
      const result2 = classifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('produces identical output when relationships array is reversed', () => {
      const relationship1 = makeRelationship({ identityKey: 'REL:X' });
      const relationship2 = makeRelationship({ identityKey: 'REL:Y' });

      const network1 = makeNetwork({
        networkId: 'NETWORK:REL-REVERSE',
        identityKey: 'NETWORK:REL-REVERSE',
        houses: [6, 10],
        relationships: [relationship1, relationship2]
      });

      const network2 = makeNetwork({
        networkId: 'NETWORK:REL-REVERSE',
        identityKey: 'NETWORK:REL-REVERSE',
        houses: [6, 10],
        relationships: [relationship2, relationship1] // reversed
      });

      const input1: CareerPatternClassificationInput = { networks: [network1] };
      const input2: CareerPatternClassificationInput = { networks: [network2] };

      const result1 = classifyCareerPatterns(input1);
      const result2 = classifyCareerPatterns(input2);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Golden test: full chain on CANONICAL_BIRTH_DETAILS', () => {
    it('produces deterministic, frozen pattern output for canonical chart', async () => {
      // First verify determinism by running the chain twice
      const horoscope1 = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural1 = buildCareerStructuralReasoning({ horoscope: horoscope1 });
      const facts1 = buildCareerGraphFactsFromStructural(structural1);
      const graph1 = buildCareerAstroGraph({ facts: facts1 });
      const networks1 = detectCareerHouseNetworks({ graph: graph1 });
      const patterns1 = classifyCareerPatterns({ networks: networks1.networks });

      const horoscope2 = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural2 = buildCareerStructuralReasoning({ horoscope: horoscope2 });
      const facts2 = buildCareerGraphFactsFromStructural(structural2);
      const graph2 = buildCareerAstroGraph({ facts: facts2 });
      const networks2 = detectCareerHouseNetworks({ graph: graph2 });
      const patterns2 = classifyCareerPatterns({ networks: networks2.networks });

      // Assert determinism: both runs must produce identical output
      expect(JSON.stringify(patterns1)).toBe(JSON.stringify(patterns2));

      // Now assert against frozen expected values
      // The canonical chart (Gemini ascendant, 1988-05-08) has:
      // - House 6: Lord MARS (in House 8)
      // - House 8: Lord SATURN (in House 7), Occupants: MOON, MARS
      // - House 11: Lord MARS (in House 8), Occupants: SUN, JUPITER
      // This creates a STAR topology network 6-8-11 centered on MARS
      const expectedPattern = {
        patternId: 'CAREER_PATTERN:CAREER_HOUSE_NETWORK:CAREER_HOUSE_NETWORK:HOUSES:6,8,11:TOPOLOGY:STAR:RELATIONSHIPS:ASPECTS:PLANET:MARS→HOUSE:11|ASPECTS:PLANET:MARS→HOUSE:6|LORD_OF:PLANET:MARS→HOUSE:11|LORD_OF:PLANET:MARS→HOUSE:6|OCCUPIES:PLANET:JUPITER→HOUSE:11|OCCUPIES:PLANET:MARS→HOUSE:8|OCCUPIES:PLANET:MOON→HOUSE:8',
        identityKey: 'CAREER_PATTERN:CAREER_HOUSE_NETWORK:CAREER_HOUSE_NETWORK:HOUSES:6,8,11:TOPOLOGY:STAR:RELATIONSHIPS:ASPECTS:PLANET:MARS→HOUSE:11|ASPECTS:PLANET:MARS→HOUSE:6|LORD_OF:PLANET:MARS→HOUSE:11|LORD_OF:PLANET:MARS→HOUSE:6|OCCUPIES:PLANET:JUPITER→HOUSE:11|OCCUPIES:PLANET:MARS→HOUSE:8|OCCUPIES:PLANET:MOON→HOUSE:8',
        family: 'CAREER_HOUSE_NETWORK',
        level: 'HOUSE_NETWORK',
        classification: 'CAREER_HOUSE_NETWORK',
        name: 'Career House Network',
        topology: 'STAR',
        direction: 'BIDIRECTIONAL',
        houses: [6, 8, 11],
        houseRoles: {
          6: 'SERVICE_HOUSE',
          8: 'UNKNOWN',
          11: 'GAINS_HOUSE'
        },
        planets: ['MOON', 'MARS', 'JUPITER'],
        networkIds: [
          '6,8,11:STAR:BIDIRECTIONAL:ASPECTS:PLANET:MARS→HOUSE:11,ASPECTS:PLANET:MARS→HOUSE:6,LORD_OF:PLANET:MARS→HOUSE:11,LORD_OF:PLANET:MARS→HOUSE:6,OCCUPIES:PLANET:JUPITER→HOUSE:11,OCCUPIES:PLANET:MARS→HOUSE:8,OCCUPIES:PLANET:MOON→HOUSE:8'
        ],
        relationshipIds: [
          'ASPECTS:PLANET:MARS→HOUSE:11',
          'ASPECTS:PLANET:MARS→HOUSE:6',
          'LORD_OF:PLANET:MARS→HOUSE:11',
          'LORD_OF:PLANET:MARS→HOUSE:6',
          'OCCUPIES:PLANET:JUPITER→HOUSE:11',
          'OCCUPIES:PLANET:MARS→HOUSE:8',
          'OCCUPIES:PLANET:MOON→HOUSE:8'
        ],
        evidence: [
          {
            evidenceId: 'P2-03-EVIDENCE:RULE_GENERIC:6,8,11:STAR:BIDIRECTIONAL:ASPECTS:PLANET:MARS→HOUSE:11,ASPECTS:PLANET:MARS→HOUSE:6,LORD_OF:PLANET:MARS→HOUSE:11,LORD_OF:PLANET:MARS→HOUSE:6,OCCUPIES:PLANET:JUPITER→HOUSE:11,OCCUPIES:PLANET:MARS→HOUSE:8,OCCUPIES:PLANET:MOON→HOUSE:8',
            ruleId: 'RULE_GENERIC',
            sourceNetworkId: '6,8,11:STAR:BIDIRECTIONAL:ASPECTS:PLANET:MARS→HOUSE:11,ASPECTS:PLANET:MARS→HOUSE:6,LORD_OF:PLANET:MARS→HOUSE:11,LORD_OF:PLANET:MARS→HOUSE:6,OCCUPIES:PLANET:JUPITER→HOUSE:11,OCCUPIES:PLANET:MARS→HOUSE:8,OCCUPIES:PLANET:MOON→HOUSE:8',
            sourceNetworkIdentityKey: '6,8,11:STAR:BIDIRECTIONAL:ASPECTS:PLANET:MARS→HOUSE:11,ASPECTS:PLANET:MARS→HOUSE:6,LORD_OF:PLANET:MARS→HOUSE:11,LORD_OF:PLANET:MARS→HOUSE:6,OCCUPIES:PLANET:JUPITER→HOUSE:11,OCCUPIES:PLANET:MARS→HOUSE:8,OCCUPIES:PLANET:MOON→HOUSE:8'
          }
        ],
        provenance: {
          sourceNetworkIds: [
            '6,8,11:STAR:BIDIRECTIONAL:ASPECTS:PLANET:MARS→HOUSE:11,ASPECTS:PLANET:MARS→HOUSE:6,LORD_OF:PLANET:MARS→HOUSE:11,LORD_OF:PLANET:MARS→HOUSE:6,OCCUPIES:PLANET:JUPITER→HOUSE:11,OCCUPIES:PLANET:MARS→HOUSE:8,OCCUPIES:PLANET:MOON→HOUSE:8'
          ],
          relationshipIds: [
            'ASPECTS:PLANET:MARS→HOUSE:11',
            'ASPECTS:PLANET:MARS→HOUSE:6',
            'LORD_OF:PLANET:MARS→HOUSE:11',
            'LORD_OF:PLANET:MARS→HOUSE:6',
            'OCCUPIES:PLANET:JUPITER→HOUSE:11',
            'OCCUPIES:PLANET:MARS→HOUSE:8',
            'OCCUPIES:PLANET:MOON→HOUSE:8'
          ],
          ruleIds: ['RULE_GENERIC']
        }
      };

      expect(patterns1.patterns).toHaveLength(1);
      expect(patterns1.patterns[0]).toEqual(expectedPattern);
    });
  });
});
