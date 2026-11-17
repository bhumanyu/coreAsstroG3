import { describe, expect, it } from 'vitest';
import { calculateHoroscope } from '../../../engine/astroEngine';
import { BOKARO_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { Planet, type Horoscope } from '../../../types';
import {
  buildCareerStructuralReasoning,
  createCareerHouseRelationshipContextFromHoroscope
} from '../careerStructuralReasoningIntegration';
import {
  detectCareerHouseRelationships,
  type CareerHouseRelationship
} from '../careerHouseRelationship';
import { CAREER_HOUSE_PORTFOLIO } from '../careerTypes';
import {
  buildCareerGraphFactsFromStructural,
  buildCareerAstroGraph,
  detectCareerHouseNetworks
} from '../careerGraph';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge } from '../careerGraph/careerAstroGraphTypes';
import {
  classifyTwoSixTenEleven,
  classifyThreeSixTenEleven,
  classifyFiveNineTen,
  classifyNineTen,
  classifyNineTenEleven,
  classifySixTenEleven,
  classifyTwoThreeSixTenEleven,
  classifyTenEleven,
  classifyParivartana,
  classifyGenericCareerNetwork,
  type CareerPatternRuleMatch
} from '../careerPattern/careerPatternClassificationRules';
import { detectDusthanaPatterns } from '../careerPattern/dusthanaTransformationDetector';
import { detectCareerYogaPatterns } from '../careerPattern/careerYogaDetector';
import { detectKendraTrikonaPatterns } from '../careerPattern/kendraTrikonaDetector';

const PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER,
  Planet.VENUS, Planet.SATURN, Planet.RAHU, Planet.KETU
]);

function planetHouse(horoscope: Horoscope, planet: Planet): number | undefined {
  const fact = horoscope.planetFacts?.[planet];
  const house = fact?.house ?? fact?.position?.house;
  return typeof house === 'number' ? house : undefined;
}

function formatRelationship(rel: CareerHouseRelationship): string {
  return [
    `type=${rel.type}`,
    `houses=${rel.houseA}-${rel.houseB}`,
    `lordA=${rel.lordA ?? '(none)'}@${rel.lordAHouse ?? '(?)'}`,
    `lordB=${rel.lordB ?? '(none)'}@${rel.lordBHouse ?? '(?)'}`,
    `reason=${rel.reason}`
  ].join(' ');
}

function formatEdge(edge: CareerGraphEdge): string {
  return `${edge.type} ${edge.sourceNodeId} -> ${edge.targetNodeId} [${edge.identityKey}]`;
}

interface FamilyOutcome {
  readonly family: string;
  readonly matches: readonly CareerPatternRuleMatch[];
}

function evaluateNetworkFamilies(network: CareerHouseNetwork): {
  readonly outcomes: readonly FamilyOutcome[];
  readonly dusthana: number;
  readonly yoga: number;
  readonly kendraTrikona: number;
} {
  const outcomes: FamilyOutcome[] = [
    { family: 'TWO_SIX_TEN_ELEVEN', matches: classifyTwoSixTenEleven(network) },
    { family: 'THREE_SIX_TEN_ELEVEN', matches: classifyThreeSixTenEleven(network) },
    { family: 'FIVE_NINE_TEN', matches: classifyFiveNineTen(network) },
    { family: 'NINE_TEN', matches: classifyNineTen(network) },
    { family: 'NINE_TEN_ELEVEN', matches: classifyNineTenEleven(network) },
    { family: 'SIX_TEN_ELEVEN', matches: classifySixTenEleven(network) },
    { family: 'TWO_THREE_SIX_TEN_ELEVEN', matches: classifyTwoThreeSixTenEleven(network) },
    { family: 'TEN_ELEVEN', matches: classifyTenEleven(network) },
    { family: 'PARIVARTANA', matches: classifyParivartana(network) },
    { family: 'GENERIC_CAREER_HOUSE_NETWORK', matches: classifyGenericCareerNetwork(network) }
  ];
  return {
    outcomes: Object.freeze(outcomes),
    dusthana: detectDusthanaPatterns([network]).length,
    yoga: detectCareerYogaPatterns([network]).length,
    kendraTrikona: detectKendraTrikonaPatterns([network]).length
  };
}

describe('Career pattern detection — live-chart report-only audit (Bokaro/Virgo lagna)', () => {
  it('dumps C4 relationships, detected networks, and per-network pattern-family outcomes', () => {
    const horoscope = calculateHoroscope(BOKARO_BIRTH_DETAILS);
    console.log('\n########## LIVE CHART: BOKARO (Virgo lagna) ##########');
    console.log(`ascendantSign: ${horoscope.rasiChart?.ascendantSign ?? '(unset)'}`);
    console.log(`ascendantLongitude: ${horoscope.rasiChart?.ascendantLongitude ?? '(unset)'}`);
    console.log('natal placements:');
    for (const planet of PLANET_ORDER) {
      const fact = horoscope.planetFacts?.[planet];
      const longitude = fact?.position?.eclipticLongitude ?? fact?.position?.longitude;
      console.log(
        `  ${planet}: sign=${fact?.sign ?? fact?.position?.sign ?? '(unset)'} ` +
        `house=${planetHouse(horoscope, planet) ?? '(unset)'} ` +
        `longitude=${typeof longitude === 'number' ? longitude.toFixed(4) : '(unset)'} ` +
        `dignity=${fact?.dignity?.status ?? '(unset)'} condition=${fact?.state?.condition ?? '(unset)'}`
      );
    }

    // (a) All C4 structural relationships emitted for the career house portfolio.
    console.log('\n===== (a) C4 STRUCTURAL RELATIONSHIPS =====');
    const context = createCareerHouseRelationshipContextFromHoroscope(horoscope);
    const careerHouses = [
      ...CAREER_HOUSE_PORTFOLIO.primary,
      ...CAREER_HOUSE_PORTFOLIO.supporting,
      ...CAREER_HOUSE_PORTFOLIO.challenging
    ];
    const relationships: CareerHouseRelationship[] = [];
    for (let i = 0; i < careerHouses.length; i++) {
      for (let j = i + 1; j < careerHouses.length; j++) {
        relationships.push(
          ...detectCareerHouseRelationships(context, careerHouses[i], careerHouses[j])
        );
      }
    }
    console.log(`total relationships emitted: ${relationships.length}`);
    for (const rel of relationships) {
      console.log(`  - ${formatRelationship(rel)}`);
    }

    // (b) Every network formed by careerNetworkDetection, with member houses and edge types.
    console.log('\n===== (b) CAREER HOUSE NETWORKS =====');
    const structural = buildCareerStructuralReasoning({ horoscope });
    const facts = buildCareerGraphFactsFromStructural(structural);
    console.log(`graph facts emitted: ${facts.length}`);
    const graph = buildCareerAstroGraph({ facts });
    console.log(`graph nodes: ${graph.nodes.length}, edges: ${graph.edges.length}`);
    console.log('all graph edges:');
    for (const edge of graph.edges) {
      console.log(`  - ${formatEdge(edge)}`);
    }

    // House-projection preview: detectCareerHouseNetworks links houses only via
    // DIRECT house-house edges or SHARED_PARTICIPANT planets touching >=2 houses.
    const planetHouseTouches = new Map<string, Set<number>>();
    for (const edge of graph.edges) {
      const planetEndpoint = edge.sourceNodeId.startsWith('PLANET:')
        ? edge.sourceNodeId
        : edge.targetNodeId.startsWith('PLANET:')
          ? edge.targetNodeId
          : undefined;
      const houseEndpoint = edge.sourceNodeId.startsWith('HOUSE:')
        ? edge.sourceNodeId
        : edge.targetNodeId.startsWith('HOUSE:')
          ? edge.targetNodeId
          : undefined;
      if (!planetEndpoint || !houseEndpoint) continue;
      const houseNum = parseInt(houseEndpoint.slice('HOUSE:'.length), 10);
      if (!planetHouseTouches.has(planetEndpoint)) {
        planetHouseTouches.set(planetEndpoint, new Set());
      }
      planetHouseTouches.get(planetEndpoint)!.add(houseNum);
    }
    console.log('planet -> touched career-house projection:');
    for (const [planetNode, houses] of [...planetHouseTouches.entries()].sort()) {
      console.log(`  ${planetNode}: houses [${[...houses].sort((a, b) => a - b).join(', ')}]`);
    }
    const multiHousePlanets = [...planetHouseTouches.values()].filter((h) => h.size >= 2).length;
    console.log(
      `planets touching >=2 career houses (SHARED_PARTICIPANT candidates): ${multiHousePlanets}`
    );

    const networks = detectCareerHouseNetworks({ graph }).networks;
    console.log(`networks detected: ${networks.length}`);
    for (const network of networks) {
      console.log(`\n  NETWORK ${network.networkId}`);
      console.log(`    identityKey: ${network.identityKey}`);
      console.log(`    houses: [${[...network.houses].sort((a, b) => a - b).join(', ')}]`);
      console.log(`    lords: [${network.lords.join(', ')}]`);
      console.log(`    topology: ${network.topology}  direction: ${network.direction}`);
      console.log(`    relationships (${network.relationships.length}):`);
      for (const edge of network.relationships) {
        console.log(`      - ${formatEdge(edge)}`);
      }
      console.log(`    evidenceIds: [${network.evidenceIds.join(', ')}]`);
    }

    // (c) Per-network pattern-detection outcome.
    console.log('\n===== (c) PER-NETWORK PATTERN-DETECTION OUTCOME =====');
    for (const network of networks) {
      const { outcomes, dusthana, yoga, kendraTrikona } = evaluateNetworkFamilies(network);
      console.log(`\n  NETWORK ${network.networkId} houses=[${[...network.houses].sort((a, b) => a - b).join(', ')}]`);
      for (const outcome of outcomes) {
        if (outcome.matches.length === 0) {
          console.log(`    family ${outcome.family}: 0 candidates`);
        } else {
          for (const match of outcome.matches) {
            console.log(
              `    family ${outcome.family}: ${match.classification} ` +
              `ruleId=${match.ruleId} establishing=[${match.establishingRelationshipIds.join(', ')}]`
            );
          }
        }
      }
      console.log(`    detector DUSTHANA_TRANSFORMATION: ${dusthana} pattern(s)`);
      console.log(`    detector CAREER_YOGA: ${yoga} pattern(s)`);
      console.log(`    detector KENDRA_TRIKONA: ${kendraTrikona} pattern(s)`);
      const edgeTypes = [...new Set(network.relationships.map((e) => e.type))].sort();
      console.log(`    edge types present: [${edgeTypes.join(', ')}]`);
      const houseEdges = network.relationships.filter(
        (e) => e.sourceNodeId.startsWith('HOUSE:') || e.targetNodeId.startsWith('HOUSE:')
      );
      console.log(`    house-involved edges: ${houseEdges.length}/${network.relationships.length}`);
    }

    // Report-only audit: assert the pipeline ran, not a specific network count.
    expect(relationships.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
