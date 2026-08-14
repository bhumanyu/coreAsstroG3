import { Planet, PlanetAnalysisReport, HouseAnalysisReport } from '../../types';
import { FunctionalNature } from './functionalNature';
import { FunctionalRole } from './functionalRoleTypes';
import { FunctionalRoleAnalysisReport } from './functionalRoles';

export interface FunctionalNatureIntegrationInput {
  readonly functionalRoles: FunctionalRoleAnalysisReport;
  readonly planetAnalysis: PlanetAnalysisReport;
  readonly houseAnalysis: HouseAnalysisReport;
}

export enum FunctionalNatureEvidenceType {
  HOUSE_LORDSHIP = 'HOUSE_LORDSHIP',
  FUNCTIONAL_ROLE = 'FUNCTIONAL_ROLE',
  FUNCTIONAL_NATURE = 'FUNCTIONAL_NATURE',
}

export interface FunctionalNatureEvidence {
  readonly type: FunctionalNatureEvidenceType;
  readonly ruleId: string;
  readonly planet: Planet;
  readonly ownedHouses: readonly number[];
  readonly roles: readonly FunctionalRole[];
  readonly reason: string;
}

export interface FunctionalPlanetAnalysis {
  readonly planet: Planet;
  readonly ownedHouses: readonly number[];
  readonly roles: readonly FunctionalRole[];
  readonly functionalNature: FunctionalNature;
  readonly evidence: readonly FunctionalNatureEvidence[];
}

export interface FunctionalNatureIntegrationReport {
  readonly planets: Readonly<Record<Planet, FunctionalPlanetAnalysis>>;
}

export function analyzeFunctionalNatureIntegration(
  input: FunctionalNatureIntegrationInput
): FunctionalNatureIntegrationReport {
  if (!input) {
    throw new Error('input must not be null or undefined.');
  }
  if (!input.functionalRoles) {
    throw new Error('functionalRoles must not be null or undefined.');
  }
  if (!input.planetAnalysis) {
    throw new Error('planetAnalysis must not be null or undefined.');
  }
  if (!input.houseAnalysis) {
    throw new Error('houseAnalysis must not be null or undefined.');
  }

  if (!input.functionalRoles.planets) {
    throw new Error('functionalRoles is missing planets.');
  }
  if (!input.planetAnalysis.planets) {
    throw new Error('planetAnalysis is missing planets.');
  }

  const allPlanets: readonly Planet[] = Object.values(Planet);

  for (const planet of allPlanets) {
    if (!input.functionalRoles.planets[planet]) {
      throw new Error(`functionalRoles is missing required planet: ${planet}.`);
    }
    if (!input.planetAnalysis.planets[planet]) {
      throw new Error(`planetAnalysis is missing required planet: ${planet}.`);
    }
  }

  // Validate ownedHouses values
  for (const planet of allPlanets) {
    const roleAnalysis = input.functionalRoles.planets[planet];
    for (const h of roleAnalysis.ownedHouses) {
      if (typeof h !== 'number' || !Number.isInteger(h) || h < 1 || h > 12) {
        throw new Error(`invalid ownedHouse ${h} for planet ${planet}.`);
      }
    }
  }

  const planetsResult: Partial<Record<Planet, FunctionalPlanetAnalysis>> = {};

  for (const planet of allPlanets) {
    const roleAnalysis = input.functionalRoles.planets[planet];
    const ownedHouses = Object.freeze([...roleAnalysis.ownedHouses]);
    const roles = Object.freeze([...roleAnalysis.roles]);
    const fnNature = roleAnalysis.functionalNature;
    if (fnNature === undefined) {
      throw new Error(`Functional Nature is missing required planet: ${planet}.`);
    }

    const rawEvidence: FunctionalNatureEvidence[] = [];

    // 1. HOUSE_LORDSHIP evidence
    const lordshipReason = ownedHouses.length > 0
      ? `House Lordship analysis records ${planet} as owning house(s) [${ownedHouses.join(', ')}].`
      : `House Lordship analysis records ${planet} as owning no houses.`;

    rawEvidence.push(Object.freeze({
      type: FunctionalNatureEvidenceType.HOUSE_LORDSHIP,
      ruleId: `FN_LORDSHIP_${planet}`,
      planet,
      ownedHouses,
      roles,
      reason: lordshipReason
    }));

    // 2. FUNCTIONAL_ROLE evidence
    if (roles.length > 0) {
      rawEvidence.push(Object.freeze({
        type: FunctionalNatureEvidenceType.FUNCTIONAL_ROLE,
        ruleId: `FN_ROLE_${planet}`,
        planet,
        ownedHouses,
        roles,
        reason: `For this Ascendant, ${planet} holds functional role(s): ${roles.join(', ')}.`
      }));
    }

    // 3. FUNCTIONAL_NATURE evidence
    rawEvidence.push(Object.freeze({
      type: FunctionalNatureEvidenceType.FUNCTIONAL_NATURE,
      ruleId: `FN_NATURE_${planet}_${fnNature}`,
      planet,
      ownedHouses,
      roles,
      reason: `For this Ascendant, the existing Functional Nature rules classify ${planet} as ${fnNature} based on its recorded house roles.`
    }));

    // Deduplicate evidence by type|ruleId|planet|ownedHouses|roles
    const seen = new Set<string>();
    const deduplicatedEvidence: FunctionalNatureEvidence[] = [];
    for (const ev of rawEvidence) {
      const key = `${ev.type}|${ev.ruleId}|${ev.planet}|${ev.ownedHouses.join(',')}|${ev.roles.join(',')}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedEvidence.push(ev);
      }
    }

    const planetAnalysisItem: FunctionalPlanetAnalysis = Object.freeze({
      planet,
      ownedHouses,
      roles,
      functionalNature: fnNature,
      evidence: Object.freeze(deduplicatedEvidence)
    });

    planetsResult[planet] = planetAnalysisItem;
  }

  const planetsContainer = Object.freeze(planetsResult as Record<Planet, FunctionalPlanetAnalysis>);

  return Object.freeze({
    planets: planetsContainer
  });
}
