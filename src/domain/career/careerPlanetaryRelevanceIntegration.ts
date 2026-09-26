import type { Horoscope, HouseAnalysis, BhavaFact, PlanetFact, NatalGrahaDrishtiReport, YogaResult, YogaAnalysisReport, HouseAnalysisReport } from '../../types';
import { Planet } from '../../types';

import type { CareerStructuralReasoning } from './careerStructuralReasoning';
import type { CareerStructuralEvidence } from './careerStructuralReasoning';

import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES
} from './careerTypes';

import {
  interpretCareerPlanetaryRelevanceBatch,
  type CareerPlanetaryRelevanceContext,
  type CareerPlanetaryRelevance
} from './careerPlanetaryRelevance';

export interface CareerPlanetaryRelevanceIntegrationInput {
  readonly horoscope: Horoscope;
  readonly structural: CareerStructuralReasoning;
}

const CANONICAL_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
] as const);

function getHouseLord(horoscope: Horoscope, house: number): Planet | undefined {
  const houseAnalysis = horoscope.houseAnalysis;
  if (houseAnalysis?.houses) {
    const houses = houseAnalysis.houses;
    if (Array.isArray(houses)) {
      const houseData = houses.find((h: HouseAnalysis) => h.house === house);
      if (houseData?.lord) {
        return houseData.lord;
      }
    } else if (houses[house]) {
      return houses[house].lord;
    }
  }

  const bhavaFacts = horoscope.bhavaFacts ?? horoscope.bhavas;
  if (bhavaFacts?.[house]) {
    return bhavaFacts[house].lord;
  }

  return undefined;
}

function getPlanetHouse(horoscope: Horoscope, planet: Planet): number | undefined {
  const planetFact = horoscope.planetFacts[planet];
  if (planetFact?.house !== undefined) {
    return planetFact.house;
  }

  if (planetFact?.position && planetFact.position.house !== undefined) {
    return planetFact.position.house;
  }

  return undefined;
}

function getCareerRuledHouses(horoscope: Horoscope, planet: Planet): readonly number[] {
  const ruledHouses: number[] = [];

  for (const house of CAREER_PRIMARY_HOUSES) {
    const lord = getHouseLord(horoscope, house);
    if (lord === planet) {
      ruledHouses.push(house);
    }
  }

  for (const house of CAREER_SUPPORTING_HOUSES) {
    const lord = getHouseLord(horoscope, house);
    if (lord === planet) {
      ruledHouses.push(house);
    }
  }

  for (const house of CAREER_CHALLENGING_HOUSES) {
    const lord = getHouseLord(horoscope, house);
    if (lord === planet) {
      ruledHouses.push(house);
    }
  }

  return Object.freeze(ruledHouses.sort((a, b) => a - b));
}

function getCareerAspectHouses(horoscope: Horoscope, planet: Planet): readonly number[] {
  const careerHouses = new Set<number>();
  for (const house of CAREER_PRIMARY_HOUSES) {
    careerHouses.add(house);
  }
  for (const house of CAREER_SUPPORTING_HOUSES) {
    careerHouses.add(house);
  }
  for (const house of CAREER_CHALLENGING_HOUSES) {
    careerHouses.add(house);
  }

  const aspectHouses = new Set<number>();

  // Read from natalGrahaDrishti (authoritative) with grahaDrishti as compatibility fallback
  const natalGrahaDrishti = horoscope.natalGrahaDrishti;
  const grahaDrishti = horoscope.grahaDrishti;

  const aspects = natalGrahaDrishti?.aspects ?? grahaDrishti?.aspects ?? [];

  for (const aspect of aspects) {
    if (aspect.sourcePlanet === planet && aspect.targetHouse !== undefined) {
      if (careerHouses.has(aspect.targetHouse)) {
        aspectHouses.add(aspect.targetHouse);
      }
    }
  }

  return Object.freeze([...aspectHouses].sort((a, b) => a - b));
}

function getCareerRelationshipPlanets(
  structural: CareerStructuralReasoning,
  planet: Planet
): readonly Planet[] {
  const relatedPlanets = new Set<Planet>();

  for (const evidence of structural.evidence) {
    const relationship = evidence.relationship;
    if (!relationship.lordA || !relationship.lordB) {
      continue;
    }

    if (relationship.lordA === planet && relationship.lordB !== planet) {
      relatedPlanets.add(relationship.lordB);
    } else if (relationship.lordB === planet && relationship.lordA !== planet) {
      relatedPlanets.add(relationship.lordA);
    }
  }

  return Object.freeze([...relatedPlanets].sort((a, b) => String(a).localeCompare(String(b))));
}

function hasCareerYogaParticipation(horoscope: Horoscope, planet: Planet): boolean {
  const yogas = horoscope.yogas;
  if (!yogas?.yogas) {
    return false;
  }

  for (const yoga of yogas.yogas) {
    if (yoga.planets && yoga.planets.includes(planet)) {
      return true;
    }
  }

  return false;
}

export function buildCareerPlanetaryRelevanceContext(
  horoscope: Horoscope,
  structural: CareerStructuralReasoning,
  planet: Planet
): CareerPlanetaryRelevanceContext {
  const ruledHouses = getCareerRuledHouses(horoscope, planet);
  const occupiedHouse = getPlanetHouse(horoscope, planet);
  const aspectsCareerHouse = getCareerAspectHouses(horoscope, planet);
  const careerRelationshipPlanets = getCareerRelationshipPlanets(structural, planet);
  const careerYogaParticipation = hasCareerYogaParticipation(horoscope, planet);

  return Object.freeze({
    planet,
    ruledHouses,
    occupiedHouse,
    aspectsCareerHouse,
    careerRelationshipPlanets,
    careerYogaParticipation,
    naturalCareerKaraka: false,
    explicitCareerRelevant: false
  });
}

export function buildCareerPlanetaryRelevanceContexts(
  input: CareerPlanetaryRelevanceIntegrationInput
): readonly CareerPlanetaryRelevanceContext[] {
  const { horoscope, structural } = input;

  return Object.freeze(
    CANONICAL_PLANET_ORDER.map(planet =>
      buildCareerPlanetaryRelevanceContext(horoscope, structural, planet)
    )
  );
}

export function buildCareerPlanetaryRelevance(
  input: CareerPlanetaryRelevanceIntegrationInput
): readonly CareerPlanetaryRelevance[] {
  const contexts = buildCareerPlanetaryRelevanceContexts(input);
  return interpretCareerPlanetaryRelevanceBatch(contexts);
}
