import {
  Planet,
  Sign,
  PlanetFact,
  PlanetFacts,
  DignityStatus,
  PlanetCondition,
  NatalGrahaDrishtiReport,
  PlanetAnalysisReport,
  PlanetAnalysis,
  PlanetAnalysisEvidence,
  PlanetAnalysisEvidenceType
} from '../types';

export interface PlanetAnalysisInput {
  readonly planetFacts: Readonly<Record<Planet, PlanetFact>> | Readonly<PlanetFacts>;
  readonly natalGrahaDrishti: NatalGrahaDrishtiReport;
}

function formatTitleCase(str: string | any): string {
  if (!str) return '';
  const s = String(str);
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Performs a deterministic, evidence-only Planet Analysis aggregation for D1/Rasi chart.
 */
export function analyzePlanets(input: PlanetAnalysisInput): PlanetAnalysisReport {
  if (!input) {
    throw new Error('input must not be null or undefined.');
  }
  if (!input.planetFacts) {
    throw new Error('planetFacts must not be null or undefined.');
  }
  if (!input.natalGrahaDrishti) {
    throw new Error('natalGrahaDrishti must not be null or undefined.');
  }

  const allPlanets = Object.values(Planet);

  for (const planet of allPlanets) {
    if (!input.planetFacts[planet]) {
      throw new Error(`planetFacts is missing required planet: ${planet}.`);
    }
  }

  const planetsMap: Partial<Record<Planet, PlanetAnalysis>> = {};

  for (const planet of allPlanets) {
    const facts: any = input.planetFacts[planet];

    const castAspects = Object.freeze(
      (input.natalGrahaDrishti.aspects ?? [])
        .filter((a: any) => a.sourcePlanet === planet)
        .map((a: any) => Object.freeze({ ...a }))
    );
    const receivedAspects = Object.freeze(
      (input.natalGrahaDrishti.aspects ?? [])
        .filter((a: any) => a.targetPlanet === planet)
        .map((a: any) => Object.freeze({ ...a }))
    );

    const evidenceList: PlanetAnalysisEvidence[] = [];

    const planetName = formatTitleCase(planet);
    const sign = facts.sign ?? facts.position?.sign;
    const house = facts.house ?? facts.position?.house;
    const signName = formatTitleCase(sign);

    // 1. SIGN_PLACEMENT
    evidenceList.push(
      Object.freeze({
        type: PlanetAnalysisEvidenceType.SIGN_PLACEMENT,
        ruleId: 'PLANET_SIGN_PLACEMENT',
        reason: `${planetName} occupies ${signName}.`
      })
    );

    // 2. HOUSE_PLACEMENT
    evidenceList.push(
      Object.freeze({
        type: PlanetAnalysisEvidenceType.HOUSE_PLACEMENT,
        ruleId: 'PLANET_HOUSE_PLACEMENT',
        reason: `${planetName} occupies House ${house}.`
      })
    );

    // 3. NAKSHATRA_PLACEMENT
    const nakRes = facts.nakshatraResult;
    if (nakRes) {
      const nakshatraName = formatTitleCase(nakRes.nakshatra);
      const padaNumber = nakRes.padaNumber ?? nakRes.pada;
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.NAKSHATRA_PLACEMENT,
          ruleId: 'PLANET_NAKSHATRA_PLACEMENT',
          reason: `${planetName} occupies ${nakshatraName} Nakshatra, Pada ${padaNumber}.`
        })
      );
    }

    // 4. DIGNITY (only when not NEUTRAL)
    if (facts.dignity?.status && facts.dignity.status !== DignityStatus.NEUTRAL) {
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.DIGNITY,
          ruleId: 'PLANET_DIGNITY',
          reason: `${planetName} is in ${facts.dignity.status} dignity in ${signName}.`
        })
      );
    }

    // 5. RETROGRADE (only when retrograde is true)
    if (facts.state?.motion?.retrograde) {
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.RETROGRADE,
          ruleId: 'PLANET_RETROGRADE',
          reason: `${planetName} is in retrograde motion.`
        })
      );
    }

    // 6. COMBUSTION (only when condition is COMBUST or DEEPLY_COMBUST)
    if (
      facts.state?.condition === PlanetCondition.COMBUST ||
      facts.state?.condition === PlanetCondition.DEEPLY_COMBUST
    ) {
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.COMBUSTION,
          ruleId: 'PLANET_COMBUSTION',
          reason: `${planetName} is in ${facts.state.condition} condition.`
        })
      );
    }

    // 7. ASPECT_CAST
    for (const aspect of castAspects) {
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.ASPECT_CAST,
          ruleId: 'PLANET_ASPECT_CAST',
          reason: (aspect as any).reason
        })
      );
    }

    // 8. ASPECT_RECEIVED
    for (const aspect of receivedAspects) {
      evidenceList.push(
        Object.freeze({
          type: PlanetAnalysisEvidenceType.ASPECT_RECEIVED,
          ruleId: 'PLANET_ASPECT_RECEIVED',
          reason: (aspect as any).reason
        })
      );
    }

    const planetAnalysis: PlanetAnalysis = Object.freeze({
      planet,
      sign,
      house,
      longitude: facts.position?.eclipticLongitude ?? facts.position?.longitude,
      nakshatraResult: facts.nakshatraResult ? Object.freeze({ ...facts.nakshatraResult }) : undefined,
      nakshatraMetadata: facts.nakshatraMetadata ? Object.freeze({ ...facts.nakshatraMetadata }) : undefined,
      dignity: facts.dignity ? Object.freeze({ ...facts.dignity }) : undefined,
      state: facts.state ? Object.freeze({
        ...facts.state,
        motion: facts.state.motion ? Object.freeze({ ...facts.state.motion }) : undefined
      }) : undefined,
      receivedAspects,
      castAspects,
      evidence: Object.freeze(evidenceList)
    });

    planetsMap[planet] = planetAnalysis;
  }

  const frozenPlanets = Object.freeze(planetsMap as Record<Planet, PlanetAnalysis>);

  return Object.freeze({
    planets: frozenPlanets
  });
}
