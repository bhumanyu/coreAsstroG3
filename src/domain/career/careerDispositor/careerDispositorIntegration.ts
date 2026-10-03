import type { Horoscope, Planet } from '../../../types';
import { CANONICAL_CAREER_PLANET_ORDER } from '../careerGraph/careerGraphConstants';
import type { CareerStructuralReasoning } from '../careerStructuralReasoning';
import type {
  CareerDispositorChain,
  CareerDispositorIntegrationInput,
  CareerDispositorProvenance,
  CareerDispositorResult,
  CareerDispositorStart,
  CareerDispositorStartRole
} from './careerDispositorTypes';
import { traverseDispositorChain, detectChainMutualReception } from './careerDispositor';
import { buildCareerDispositorIdentityKey } from './careerDispositorIdentity';
import {
  CAREER_LORD_START_HOUSES,
  isCareerHouse,
  resolveCareerDestination,
  resolveTermination
} from './careerDispositorRules';

/**
 * P2-05 Career Dispositor Integration
 *
 * Integration layer for dispositor chain analysis.
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 * - careerPattern*
 * - careerPatternQualification*
 * - careerAstroGraph* (no DISPOSITOR_OF edge type - P2-01 contract excludes it)
 */

/**
 * Builds start planets from career lord planets and career house occupants.
 * Dedupes by planet (CAREER_LORD wins over CAREER_HOUSE_OCCUPANT).
 * Sorted by CANONICAL_CAREER_PLANET_ORDER (spec §13).
 */
export function buildCareerDispositorStartPlanets(
  careerLordPlanets: readonly Planet[],
  careerHouseOccupants: readonly Planet[]
): readonly CareerDispositorStart[] {
  const startMap = new Map<Planet, CareerDispositorStart>();

  // First, add career lord planets (highest priority)
  for (const planet of careerLordPlanets) {
    startMap.set(planet, Object.freeze({
      planet,
      role: 'CAREER_LORD' as CareerDispositorStartRole,
      sourceIds: Object.freeze([])
    }));
  }

  // Then, add career house occupants (only if not already present)
  for (const planet of careerHouseOccupants) {
    if (!startMap.has(planet)) {
      startMap.set(planet, Object.freeze({
        planet,
        role: 'CAREER_HOUSE_OCCUPANT' as CareerDispositorStartRole,
        sourceIds: Object.freeze([])
      }));
    }
  }

  // Sort by CANONICAL_CAREER_PLANET_ORDER
  const sortedStarts = [...startMap.values()].sort((a, b) => {
    const indexA = CANONICAL_CAREER_PLANET_ORDER.indexOf(a.planet);
    const indexB = CANONICAL_CAREER_PLANET_ORDER.indexOf(b.planet);
    return indexA - indexB;
  });

  return Object.freeze(sortedStarts);
}

/**
 * Builds dispositor start planets from C4 CareerStructuralReasoning evidence.
 * This adapter derives start planets/roles/sourceIds from structural reasoning
 * for the real-engine test (spec §38).
 *
 * Provenance precision: sourceIds are mapped from specific structural.evidence[]
 * entries that produced the lord/occupant classification. Where no specific
 * evidence exists, sourceIds are left empty rather than attaching unrelated IDs.
 */
export function buildCareerDispositorStartsFromStructural(
  horoscope: Horoscope,
  structural: CareerStructuralReasoning
): readonly CareerDispositorStart[] {
  const careerLordPlanets: Planet[] = [];
  const careerHouseOccupants: Planet[] = [];

  // Extract career lord planets from houseAnalysis
  // Lords of Career houses via CAREER_LORD_START_HOUSES
  if (horoscope.houseAnalysis?.houses) {
    for (const house of CAREER_LORD_START_HOUSES) {
      const houseAnalysis = horoscope.houseAnalysis.houses[house];
      if (houseAnalysis?.lord) {
        careerLordPlanets.push(houseAnalysis.lord);
      }
    }
  }

  // Extract career house occupants via isCareerHouse
  if (horoscope.houseAnalysis?.houses) {
    for (const [houseNum, houseAnalysis] of Object.entries(horoscope.houseAnalysis.houses)) {
      const house = parseInt(houseNum, 10);
      if (isCareerHouse(house) && houseAnalysis.occupants) {
        for (const occupant of houseAnalysis.occupants) {
          careerHouseOccupants.push(occupant);
        }
      }
    }
  }

  // Build starts with sourceIds from structural evidence
  const starts = buildCareerDispositorStartPlanets(
    Object.freeze(careerLordPlanets),
    Object.freeze(careerHouseOccupants)
  );

  // Map sourceIds from specific evidence entries
  // Evidence entries contain relationship.lordA/lordB and relationship.houseA/houseB
  // We match these to the planet and house classifications
  const startsWithSourceIds = starts.map(start => {
    const sourceIds: string[] = [];

    for (const evidence of structural.evidence) {
      const rel = evidence.relationship;

      // For CAREER_LORD: match evidence where the planet is a lord of a career lord start house
      if (start.role === 'CAREER_LORD') {
        if (rel.lordA === start.planet && CAREER_LORD_START_HOUSES.includes(rel.houseA)) {
          sourceIds.push(evidence.id);
        }
        if (rel.lordB === start.planet && CAREER_LORD_START_HOUSES.includes(rel.houseB)) {
          sourceIds.push(evidence.id);
        }
      }

      // For CAREER_HOUSE_OCCUPANT: match evidence where the planet is in a career house
      if (start.role === 'CAREER_HOUSE_OCCUPANT') {
        if (rel.lordA === start.planet && rel.lordAHouse !== undefined && isCareerHouse(rel.lordAHouse)) {
          sourceIds.push(evidence.id);
        }
        if (rel.lordB === start.planet && rel.lordBHouse !== undefined && isCareerHouse(rel.lordBHouse)) {
          sourceIds.push(evidence.id);
        }
      }
    }

    return Object.freeze({
      ...start,
      sourceIds: Object.freeze(sourceIds)
    });
  });

  return Object.freeze(startsWithSourceIds);
}

/**
 * Builds a single dispositor chain from a start configuration.
 * Orchestration per spec §16 with sourceIds and ruleIds sorted (spec §17).
 */
function buildCareerDispositorChain(
  horoscope: Horoscope,
  start: CareerDispositorStart
): CareerDispositorChain {
  const { chain, links, terminalPlanet, cycleStartPlanet, depth } =
    traverseDispositorChain(horoscope, start.planet);

  const cycle = cycleStartPlanet !== undefined;
  const mutualReception = detectChainMutualReception(horoscope, chain);

  // Determine if it's a self-dispositor
  const isSelfDispositor = !cycle && terminalPlanet === start.planet && depth === 0;

  // Determine if terminal is career-relevant
  let isCareerTerminal = false;
  let isCareerLord = false;
  let isCareerHouseOccupant = false;
  let isCareerRelevant = false;

  if (terminalPlanet !== undefined) {
    const terminalFact = horoscope.planetFacts[terminalPlanet];
    if (terminalFact) {
      const terminalHouse = terminalFact.position?.house;

      // Check if terminal is a career lord
      if (horoscope.houseAnalysis?.houses) {
        for (const house of CAREER_LORD_START_HOUSES) {
          const houseAnalysis = horoscope.houseAnalysis.houses[house];
          if (houseAnalysis?.lord === terminalPlanet) {
            isCareerLord = true;
            break;
          }
        }
      }

      // Check if terminal is a career house occupant
      if (terminalHouse !== undefined && isCareerHouse(terminalHouse)) {
        isCareerHouseOccupant = true;
      }

      // Career relevant if either career lord or career house occupant
      isCareerRelevant = isCareerLord || isCareerHouseOccupant;
    }

    // Career terminal if the destination is career-relevant
    isCareerTerminal = isCareerRelevant;
  }

  const termination = resolveTermination(
    cycle,
    mutualReception,
    isSelfDispositor,
    isCareerTerminal,
    terminalPlanet !== undefined
  );

  const terminalHouse = terminalPlanet !== undefined
    ? horoscope.planetFacts[terminalPlanet]?.position?.house
    : undefined;

  const destination = resolveCareerDestination(
    terminalPlanet,
    terminalHouse,
    isCareerLord,
    isCareerHouseOccupant,
    isCareerRelevant
  );

  // Build provenance with sorted sourceIds and ruleIds (spec §17)
  const provenance: CareerDispositorProvenance = Object.freeze({
    ruleIds: Object.freeze([
      'DISPOSITOR_TRAVERSAL',
      'DISPOSITOR_TERMINATION',
      'DISPOSITOR_DESTINATION'
    ].sort()),
    sourceIds: Object.freeze([...new Set(start.sourceIds)].sort())
  });

  // Compute identityKey at build time (spec §6)
  const identityKey = buildCareerDispositorIdentityKey(
    start.planet,
    start.role,
    chain,
    cycle,
    mutualReception
  );

  return Object.freeze({
    startPlanet: start.planet,
    startRole: start.role,
    links,
    terminalPlanet,
    termination,
    destination,
    cycleStartPlanet,
    mutualReception,
    depth,
    identityKey,
    provenance
  });
}

/**
 * Builds the complete dispositor analysis.
 * Chains sorted by identityKey.localeCompare, deeply frozen (spec §16).
 */
export function buildCareerDispositorAnalysis(
  input: CareerDispositorIntegrationInput
): CareerDispositorResult {
  const { horoscope, starts } = input;

  const chains = starts.map(start =>
    buildCareerDispositorChain(horoscope, start)
  );

  // Sort chains by identityKey.localeCompare (uses pre-computed identityKey)
  const sortedChains = [...chains].sort((a, b) => {
    return a.identityKey.localeCompare(b.identityKey);
  });

  // Deep freeze the result
  return Object.freeze({
    chains: Object.freeze(sortedChains.map(chain =>
      Object.freeze({
        ...chain,
        links: Object.freeze(chain.links.map(link => Object.freeze(link)))
      })
    ))
  });
}
