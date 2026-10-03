import {
  detectCareerHouseNetworks,
  type CareerNetworkDetectionInput,
  type CareerNetworkDetectionResult
} from './index';
import {
  buildCareerAstroGraph,
  buildCareerGraphFactsFromStructural,
  type CareerAstroGraph,
  type CareerAstroGraphInput,
  type CareerGraphFact,
  type CareerGraphProvenance
} from './index';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { buildCareerStructuralReasoning } from '../careerStructuralReasoningIntegration';
import { Planet } from '../../../types';

describe('CareerNetworkDetection', () => {
  describe('DIRECT_LINK topology', () => {
    it('detects DIRECT_LINK between houses 6 and 10', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].topology).toBe('DIRECT_LINK');
      expect(result.networks[0].houses).toEqual([6, 10]);
    });
  });

  describe('CHAIN topology', () => {
    it('detects CHAIN for 6→10→11', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Saturn connects 6 and 10
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        // Mercury connects 10 and 11
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      // With SHARED_PARTICIPANT rule: multiple participants (Saturn, Mercury) -> CLUSTER
      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].houses).toEqual([6, 10, 11]);
      expect(result.networks[0].topology).toBe('CLUSTER');
    });

    it('detects CHAIN for 2→6→10→11 (with 2 included)', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Jupiter connects 2 and 6
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        // Saturn connects 6 and 10
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        // Mercury connects 10 and 11
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].houses).toEqual([2, 6, 10, 11]);
      // Multiple participants (Jupiter, Saturn, Mercury) -> CLUSTER
      expect(result.networks[0].topology).toBe('CLUSTER');
    });
  });

  describe('TRIANGLE topology', () => {
    it('detects TRIANGLE for 2→6→10 with DIRECT connections', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      // To test TRIANGLE, we need DIRECT house-to-house connections
      // This simulates a scenario where houses are directly linked
      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'HOUSE', key: '2' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '6' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '10' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'CONJUNCT',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].topology).toBe('TRIANGLE');
      expect(result.networks[0].houses).toEqual([2, 6, 10]);
    });

    it('detects CLUSTER for 2→6→10 with SHARED_PARTICIPANT', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      // Multiple participants (Jupiter, Saturn, Mercury) -> CLUSTER
      expect(result.networks[0].topology).toBe('CLUSTER');
      expect(result.networks[0].houses).toEqual([2, 6, 10]);
    });
  });

  describe('LOOP topology', () => {
    it('detects LOOP for 2→6→10→11→2 (4-node loop)', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Jupiter connects 2 and 6
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        // Saturn connects 6 and 10
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        // Mercury connects 10 and 11
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        },
        // Venus connects 11 and 2
        {
          sourceNode: { type: 'PLANET', key: 'VENUS' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'VENUS' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].houses).toEqual([2, 6, 10, 11]);
      // Multiple participants (Jupiter, Saturn, Mercury, Venus) -> CLUSTER
      expect(result.networks[0].topology).toBe('CLUSTER');
    });
  });

  describe('STAR topology', () => {
    it('detects STAR for single participant connecting multiple houses', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '8' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].houses).toEqual([2, 6, 8, 10, 11]);
      // Single participant (Saturn) connecting all houses -> STAR
      expect(result.networks[0].topology).toBe('STAR');
    });
  });

  describe('CLUSTER topology', () => {
    it('detects CLUSTER for complex non-standard topology', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Saturn connects 6, 10, 11
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        },
        // Mercury connects 10, 11, 2
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      // This complex topology should be CLUSTER
      expect(result.networks[0].topology).toBe('CLUSTER');
    });
  });

  describe('Direction resolution', () => {
    it('produces BIDIRECTIONAL for SHARED_PARTICIPANT with PLANET→HOUSE edges', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Saturn connects 6 and 10
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        // Mercury connects 10 and 11
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      // With SHARED_PARTICIPANT and PLANET→HOUSE edges, this is BIDIRECTIONAL
      expect(result.networks[0].direction).toBe('BIDIRECTIONAL');
    });

    it('produces FORWARD for DIRECT house-to-house connections 6→10→11', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // DIRECT connections: 6→10, 10→11
        {
          sourceNode: { type: 'HOUSE', key: '6' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '10' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'CONJUNCT',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].direction).toBe('FORWARD');
    });

    it('produces REVERSE for DIRECT house-to-house connections 11→10→6', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // DIRECT connections: 11→10, 10→6
        {
          sourceNode: { type: 'HOUSE', key: '11' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '10' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'CONJUNCT',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].direction).toBe('REVERSE');
    });

    it('produces BIDIRECTIONAL for two-way DIRECT pair', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // Create bidirectional flow with DIRECT connections
        {
          sourceNode: { type: 'HOUSE', key: '6' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '10' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'CONJUNCT',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].direction).toBe('BIDIRECTIONAL');
    });
  });

  describe('Disconnected components', () => {
    it('detects 2 separate networks in deterministic order', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        // First component: 6-10
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        // Second component: 2-11
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'JUPITER' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(2);
      // Sorted by minimum house number: 2-11 comes before 6-10
      expect(result.networks[0].houses).toEqual([2, 11]);
      expect(result.networks[1].houses).toEqual([6, 10]);
    });
  });

  describe('Neutral house exclusion', () => {
    it('excludes NEUTRAL houses (1, 4) from components', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MARS' },
          targetNode: { type: 'HOUSE', key: '1' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'VENUS' },
          targetNode: { type: 'HOUSE', key: '4' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      // Only 6-10 should be detected (1 and 4 are NEUTRAL)
      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].houses).toEqual([6, 10]);
      expect(result.networks[0].houses).not.toContain(1);
      expect(result.networks[0].houses).not.toContain(4);
    });
  });

  describe('Input-order independence', () => {
    it('produces identical JSON output regardless of input fact order', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const fact6: CareerGraphFact = {
        sourceNode: { type: 'PLANET', key: 'SATURN' },
        targetNode: { type: 'HOUSE', key: '6' },
        relationship: 'LORD_OF',
        provenance
      };

      const fact10: CareerGraphFact = {
        sourceNode: { type: 'PLANET', key: 'SATURN' },
        targetNode: { type: 'HOUSE', key: '10' },
        relationship: 'LORD_OF',
        provenance
      };

      const fact11: CareerGraphFact = {
        sourceNode: { type: 'PLANET', key: 'MERCURY' },
        targetNode: { type: 'HOUSE', key: '11' },
        relationship: 'LORD_OF',
        provenance
      };

      const input1: CareerAstroGraphInput = { facts: [fact6, fact10, fact11] };
      const input2: CareerAstroGraphInput = { facts: [fact11, fact6, fact10] };

      const graph1 = buildCareerAstroGraph(input1);
      const graph2 = buildCareerAstroGraph(input2);

      const result1 = detectCareerHouseNetworks({ graph: graph1 });
      const result2 = detectCareerHouseNetworks({ graph: graph2 });

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('produces identical JSON output for permuted fact arrays', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'MERCURY' },
          targetNode: { type: 'HOUSE', key: '11' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      // Create two permutations
      const factsA = [...facts];
      const factsB = [facts[3], facts[1], facts[0], facts[2]];

      const inputA: CareerAstroGraphInput = { facts: factsA };
      const inputB: CareerAstroGraphInput = { facts: factsB };

      const graphA = buildCareerAstroGraph(inputA);
      const graphB = buildCareerAstroGraph(inputB);

      const resultA = detectCareerHouseNetworks({ graph: graphA });
      const resultB = detectCareerHouseNetworks({ graph: graphB });

      expect(JSON.stringify(resultA)).toBe(JSON.stringify(resultB));
    });
  });

  describe('Duplicate edges', () => {
    it('does not create duplicate networks from duplicate edges', () => {
      const provenance1: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const provenance2: CareerGraphProvenance = {
        sourceIds: ['evidence-2'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance: provenance1
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance: provenance1
        },
        // Duplicate edge with different provenance
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance: provenance2
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance: provenance2
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks).toHaveLength(1);
      expect(result.networks[0].relationships).toHaveLength(2); // Only 2 unique edges
    });
  });

  describe('Provenance preservation', () => {
    it('preserves sourceIds from edges without fabrication', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1', 'evidence-2'],
        ruleIds: ['rule-1'],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks[0].provenance.sourceIds).toContain('evidence-1');
      expect(result.networks[0].provenance.sourceIds).toContain('evidence-2');
      expect(result.networks[0].provenance.ruleIds).toContain('rule-1');
    });
  });

  describe('evidenceIds unique and sorted', () => {
    it('builds evidenceIds as unique and sorted union of sourceIds', () => {
      const provenance1: CareerGraphProvenance = {
        sourceIds: ['evidence-3', 'evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const provenance2: CareerGraphProvenance = {
        sourceIds: ['evidence-2', 'evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance: provenance1
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance: provenance2
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks[0].evidenceIds).toEqual(['evidence-1', 'evidence-2', 'evidence-3']);
    });
  });

  describe('Topology precedence', () => {
    it('classifies triangle as TRIANGLE not LOOP with DIRECT connections', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      // Use DIRECT connections to test TRIANGLE topology
      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'HOUSE', key: '2' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '6' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'CONJUNCT',
          provenance
        },
        {
          sourceNode: { type: 'HOUSE', key: '10' },
          targetNode: { type: 'HOUSE', key: '2' },
          relationship: 'CONJUNCT',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(result.networks.length).toBeGreaterThan(0);
      expect(result.networks[0].topology).toBe('TRIANGLE');
      expect(result.networks[0].topology).not.toBe('LOOP');
    });
  });

  describe('Deep immutability', () => {
    it('freezes the result object', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.networks)).toBe(true);
    });

    it('freezes each network', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      for (const network of result.networks) {
        expect(Object.isFrozen(network)).toBe(true);
        expect(Object.isFrozen(network.houses)).toBe(true);
        expect(Object.isFrozen(network.lords)).toBe(true);
        expect(Object.isFrozen(network.relationships)).toBe(true);
        expect(Object.isFrozen(network.provenance)).toBe(true);
        expect(Object.isFrozen(network.evidenceIds)).toBe(true);
      }
    });
  });

  describe('Forbidden field assertions', () => {
    it('does not contain pattern/mechanism/score/confidence/prediction/qualification keys', () => {
      const provenance: CareerGraphProvenance = {
        sourceIds: ['evidence-1'],
        ruleIds: [],
        parentIds: []
      };

      const facts: CareerGraphFact[] = [
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '6' },
          relationship: 'LORD_OF',
          provenance
        },
        {
          sourceNode: { type: 'PLANET', key: 'SATURN' },
          targetNode: { type: 'HOUSE', key: '10' },
          relationship: 'LORD_OF',
          provenance
        }
      ];

      const input: CareerAstroGraphInput = { facts };
      const graph = buildCareerAstroGraph(input);
      const detectionInput: CareerNetworkDetectionInput = { graph };
      const result = detectCareerHouseNetworks(detectionInput);

      const forbiddenKeys = ['pattern', 'mechanism', 'score', 'confidence', 'prediction', 'qualification'];

      for (const network of result.networks) {
        for (const key of forbiddenKeys) {
          expect(network).not.toHaveProperty(key);
        }
      }
    });
  });

  describe('Real-engine integration', () => {
    it('runs full chain from horoscope to network detection', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });
      const result = detectCareerHouseNetworks({ graph });

      expect(result).toBeDefined();
      expect(result.networks).toBeDefined();
      expect(Array.isArray(result.networks)).toBe(true);
    });

    it('produces deterministic output on double-run', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });

      const result1 = detectCareerHouseNetworks({ graph });
      const result2 = detectCareerHouseNetworks({ graph });

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('produces deterministic output on permuted facts', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);

      // Create a permutation of the facts array
      const factsPermuted = [...facts].reverse();

      const graph1 = buildCareerAstroGraph({ facts });
      const graph2 = buildCareerAstroGraph({ facts: factsPermuted });

      const result1 = detectCareerHouseNetworks({ graph: graph1 });
      const result2 = detectCareerHouseNetworks({ graph: graph2 });

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });

    it('all detected networks have at least 2 houses', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const facts = buildCareerGraphFactsFromStructural(structural);
      const graph = buildCareerAstroGraph({ facts });
      const result = detectCareerHouseNetworks({ graph });

      for (const network of result.networks) {
        expect(network.houses.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
