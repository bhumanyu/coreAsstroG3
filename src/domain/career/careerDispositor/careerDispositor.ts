import type { Horoscope, Planet, Sign } from '../../../types';
import { SIGNS_METADATA } from '../../../data/astroData';
import type {
  CareerDispositorChain,
  CareerDispositorLink,
  CareerDispositorRelationship
} from './careerDispositorTypes';
import { MAX_DISPOSITOR_DEPTH } from './careerDispositorRules';

/**
 * P2-05 Career Dispositor Chain Traversal
 *
 * Core dispositor chain traversal logic.
 * Uses SIGNS_METADATA[sign].ruler from src/data/astroData.ts (spec §5).
 */

/**
 * Reads the sign from a PlanetFact.
 * Sign read as fact.sign ?? fact.position?.sign.
 */
function readPlanetSign(fact: any): Sign | undefined {
  return fact.sign ?? fact.position?.sign;
}

/**
 * Gets the dispositor (ruler) of a sign.
 */
function getSignRuler(sign: Sign): Planet | undefined {
  return SIGNS_METADATA[sign]?.ruler;
}

/**
 * Detects mutual reception between two planets.
 * Two planets are in mutual reception if each occupies the sign ruled by the other.
 */
export function detectMutualReception(
  horoscope: Horoscope,
  a: Planet,
  b: Planet
): boolean {
  const factA = horoscope.planetFacts[a];
  const factB = horoscope.planetFacts[b];

  if (!factA || !factB) {
    return false;
  }

  const signA = readPlanetSign(factA);
  const signB = readPlanetSign(factB);

  if (!signA || !signB) {
    return false;
  }

  const rulerA = getSignRuler(signA);
  const rulerB = getSignRuler(signB);

  if (!rulerA || !rulerB) {
    return false;
  }

  // Mutual reception: A rules B's sign and B rules A's sign
  return rulerA === b && rulerB === a;
}

/**
 * Traverses the dispositor chain starting from a given planet.
 * Returns the chain with cycle detection.
 * - depth = number of dispositor transitions (links.length), not planet count (spec §4)
 * - visited-set cycle detection returning cycleStartPlanet and terminalPlanet: undefined on cycle (spec §18)
 * - missing planetFact/sign/ruler → terminate with terminalPlanet: undefined
 */
export function traverseDispositorChain(
  horoscope: Horoscope,
  startPlanet: Planet
): {
  chain: readonly Planet[];
  links: readonly CareerDispositorLink[];
  terminalPlanet: Planet | undefined;
  cycleStartPlanet: Planet | undefined;
  depth: number;
} {
  const chain: Planet[] = [startPlanet];
  const links: CareerDispositorLink[] = [];
  const visited = new Set<Planet>();
  visited.add(startPlanet);

  let currentPlanet = startPlanet;
  let cycleStartPlanet: Planet | undefined = undefined;
  let terminalPlanet: Planet | undefined = undefined;

  while (chain.length <= MAX_DISPOSITOR_DEPTH) {
    const fact = horoscope.planetFacts[currentPlanet];

    if (!fact) {
      // Missing planet fact - terminate
      terminalPlanet = undefined;
      break;
    }

    const sign = readPlanetSign(fact);

    if (!sign) {
      // Missing sign - terminate
      terminalPlanet = undefined;
      break;
    }

    const ruler = getSignRuler(sign);

    if (!ruler) {
      // Missing ruler - terminate
      terminalPlanet = undefined;
      break;
    }

    // Check for self-dispositor
    if (ruler === currentPlanet) {
      // Self-dispositor is NOT a cycle
      terminalPlanet = currentPlanet;
      break;
    }

    // Check for cycle
    if (visited.has(ruler)) {
      // Cycle detected - terminalPlanet is undefined per spec §18
      cycleStartPlanet = ruler;
      terminalPlanet = undefined;
      break;
    }

    // Create link
    const link: CareerDispositorLink = Object.freeze({
      sourcePlanet: currentPlanet,
      targetPlanet: ruler,
      sourceSign: sign,
      targetSign: readPlanetSign(horoscope.planetFacts[ruler]) ?? sign,
      relationship: 'DISPOSITOR_OF' as CareerDispositorRelationship
    });

    links.push(link);
    chain.push(ruler);
    visited.add(ruler);
    currentPlanet = ruler;
  }

  // If we exited due to depth limit without finding a terminal
  if (terminalPlanet === undefined && cycleStartPlanet === undefined) {
    terminalPlanet = currentPlanet;
  }

  // depth = number of dispositor transitions (links.length), not planet count
  const depth = links.length;

  return Object.freeze({
    chain: Object.freeze(chain),
    links: Object.freeze(links),
    terminalPlanet,
    cycleStartPlanet,
    depth
  });
}

/**
 * Detects if mutual reception exists anywhere in the chain.
 * Internal helper - not exported
 */
function detectChainMutualReception(
  horoscope: Horoscope,
  chain: readonly Planet[]
): boolean {
  for (let i = 0; i < chain.length - 1; i++) {
    for (let j = i + 1; j < chain.length; j++) {
      if (detectMutualReception(horoscope, chain[i], chain[j])) {
        return true;
      }
    }
  }
  return false;
}


