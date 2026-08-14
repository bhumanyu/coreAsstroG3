import {
  Planet,
  DignityStatus,
  PlanetCondition,
  ShadbalaAggregationStatus,
  AspectType
} from '../../types';
import { calculateNaturalRelationship } from '../chartMath';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../functionalNature/functionalNature';
import {
  PlanetInterpretationInput,
  PlanetInterpretationReport,
  PlanetInterpretation,
  PlanetInterpretationEvidence,
  PlanetPlacementInterpretation,
  PlanetRoleInterpretation,
  PlanetStrengthInterpretation,
  PlanetDrishtiInterpretation,
  PlanetNakshatraInterpretation,
  PlanetYogaItem,
  PlanetInterpretationSummary,
  InterpretationConfidence,
  ReceivedDrishtiAspect,
  CastDrishtiAspect
} from './planetInterpretationTypes';

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatAspectType(aspectType: AspectType): string {
  switch (aspectType) {
    case AspectType.FULL_7TH:
      return '7th';
    case AspectType.SPECIAL_4TH:
      return '4th';
    case AspectType.SPECIAL_8TH:
      return '8th';
    case AspectType.SPECIAL_5TH:
      return '5th';
    case AspectType.SPECIAL_9TH:
      return '9th';
    case AspectType.SPECIAL_3RD:
      return '3rd';
    case AspectType.SPECIAL_10TH:
      return '10th';
    default:
      return String(aspectType).toLowerCase();
  }
}

/**
 * Performs a deterministic, evidence-first Planet Interpretation analysis for all 9 planets.
 */
export function analyzePlanetInterpretation(
  input: PlanetInterpretationInput
): PlanetInterpretationReport {
  if (!input) {
    throw new Error('planetInterpretation input must not be null or undefined.');
  }
  if (!input.planetFacts) {
    throw new Error('planetFacts must not be null or undefined.');
  }
  if (!input.planetAnalysis) {
    throw new Error('planetAnalysis must not be null or undefined.');
  }
  if (!input.functionalRoles) {
    throw new Error('functionalRoles must not be null or undefined.');
  }
  if (!input.natalGrahaDrishti) {
    throw new Error('natalGrahaDrishti must not be null or undefined.');
  }
  if (!input.yogas) {
    throw new Error('yogas must not be null or undefined.');
  }

  const allPlanets = Object.values(Planet);
  for (const planet of allPlanets) {
    if (!input.planetFacts[planet]) {
      throw new Error(`planetFacts is missing required planet: ${planet}.`);
    }
    if (!input.planetAnalysis.planets[planet]) {
      throw new Error(`planetAnalysis is missing required planet: ${planet}.`);
    }
    if (!input.functionalRoles.planets[planet]) {
      throw new Error(`functionalRoles is missing required planet: ${planet}.`);
    }
  }

  const planetsMap: Partial<Record<Planet, PlanetInterpretation>> = {};

  for (const planet of allPlanets) {
    const facts: any = input.planetFacts[planet];
    const analysis = input.planetAnalysis.planets[planet];
    const roleAnalysis = input.functionalRoles.planets[planet];

    const evidenceList: PlanetInterpretationEvidence[] = [];

    // 1. Placement
    const placement: PlanetPlacementInterpretation = Object.freeze({
      sign: facts.sign ?? facts.position.sign,
      house: facts.house ?? facts.position.house,
      eclipticLongitude: facts.position.eclipticLongitude ?? facts.position.longitude,
      nakshatra: facts.nakshatraResult?.nakshatra ?? (analysis as any).nakshatraResult?.nakshatra,
      pada: facts.nakshatraResult?.pada ?? (analysis as any).nakshatraResult?.pada
    });

    const placementStatement = `${formatTitleCase(planet)} occupies House ${placement.house} in ${formatTitleCase(placement.sign)}.`;
    evidenceList.push(
      Object.freeze({
        ruleId: 'PLANET_INTERPRETATION_PLACEMENT_001',
        type: 'PLACEMENT',
        planet,
        houses: Object.freeze([placement.house]),
        statement: placementStatement,
        effect: 'NEUTRAL',
        source: 'PLANET_FACTS'
      })
    );

    // 2. Functional Role(s)
    const roleInterp: PlanetRoleInterpretation = Object.freeze({
      ownedHouses: Object.freeze([...roleAnalysis.ownedHouses]),
      roles: Object.freeze([...roleAnalysis.roles]),
      functionalNature: roleAnalysis.functionalNature
    });

    for (const role of roleInterp.roles) {
      const isYogakaraka = role === FunctionalRole.YOGAKARAKA;
      evidenceList.push(
        Object.freeze({
          ruleId: `PLANET_INTERPRETATION_ROLE_${role}_001`,
          type: 'FUNCTIONAL_ROLE',
          planet,
          houses: Object.freeze([...roleInterp.ownedHouses]),
          statement: `${formatTitleCase(planet)} holds functional role ${role}.`,
          effect: isYogakaraka ? 'SUPPORT' : 'NEUTRAL',
          source: 'FUNCTIONAL_ROLES'
        })
      );
    }

    const natureEffect =
      roleInterp.functionalNature === FunctionalNature.BENEFIC
        ? 'SUPPORT'
        : roleInterp.functionalNature === FunctionalNature.MALEFIC
        ? 'CHALLENGE'
        : roleInterp.functionalNature === FunctionalNature.MIXED
        ? 'MIXED'
        : 'NEUTRAL';

    evidenceList.push(
      Object.freeze({
        ruleId: 'PLANET_INTERPRETATION_FUNCTIONAL_NATURE_001',
        type: 'FUNCTIONAL_ROLE',
        planet,
        statement: `${formatTitleCase(planet)} holds ${roleInterp.functionalNature} functional nature.`,
        effect: natureEffect,
        source: 'FUNCTIONAL_ROLES'
      })
    );

    // 3. Dignity
    const dignityStatus = (analysis as any).dignity?.status ?? (facts as any).dignity?.status ?? DignityStatus.NEUTRAL;
    let dignityEffect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' = 'NEUTRAL';
    if (
      dignityStatus === DignityStatus.EXALTED ||
      dignityStatus === DignityStatus.OWN_SIGN ||
      dignityStatus === DignityStatus.MOOLATRIKONA
    ) {
      dignityEffect = 'SUPPORT';
    } else if (dignityStatus === DignityStatus.DEBILITATED) {
      dignityEffect = 'CHALLENGE';
    }

    evidenceList.push(
      Object.freeze({
        ruleId: 'PLANET_INTERPRETATION_DIGNITY_001',
        type: 'DIGNITY',
        planet,
        statement: `${formatTitleCase(planet)} is in ${dignityStatus} dignity.`,
        effect: dignityEffect,
        source: 'DIGNITY'
      })
    );

    // 4. State (Combustion / Retrograde)
    const condition = facts.state?.condition ?? PlanetCondition.NORMAL;
    const isRetrograde = facts.state?.motion?.retrograde ?? false;

    if (condition === PlanetCondition.COMBUST || condition === PlanetCondition.DEEPLY_COMBUST) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_STATE_COMBUST_001',
          type: 'STATE',
          planet,
          statement: `${formatTitleCase(planet)} is ${condition === PlanetCondition.DEEPLY_COMBUST ? 'deeply combust' : 'combust'}.`,
          effect: 'CHALLENGE',
          source: 'PLANET_FACTS'
        })
      );
    }

    if (isRetrograde) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_STATE_RETROGRADE_001',
          type: 'STATE',
          planet,
          statement: `${formatTitleCase(planet)} is in retrograde motion.`,
          effect: 'NEUTRAL',
          source: 'PLANET_FACTS'
        })
      );
    }

    if (condition === PlanetCondition.NORMAL && !isRetrograde) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_STATE_NORMAL_001',
          type: 'STATE',
          planet,
          statement: `${formatTitleCase(planet)} state is normal.`,
          effect: 'NEUTRAL',
          source: 'PLANET_FACTS'
        })
      );
    }

    // 5. Strength
    let strengthInterp: PlanetStrengthInterpretation;
    const pStrength = input.planetaryStrength?.planets[planet];
    if (pStrength?.shadbala) {
      const sb = pStrength.shadbala;
      if (sb.status === ShadbalaAggregationStatus.COMPLETE) {
        strengthInterp = Object.freeze({
          availability: 'AVAILABLE',
          shadbalaStatus: sb.status,
          totalRupa: sb.totalRupa,
          totalShastiamsa: sb.totalShastiamsa,
          percentageOfMinimum: sb.percentageOfMinimum,
          meetsMinimum: sb.meetsMinimum,
          missingComponents: Object.freeze([...(sb.missingComponents ?? [])])
        });

        evidenceList.push(
          Object.freeze({
            ruleId: 'PLANET_INTERPRETATION_STRENGTH_001',
            type: 'STRENGTH',
            planet,
            statement: `Planetary strength assessment is available (Shadbala total: ${sb.totalRupa ?? 0} Rupa).`,
            effect: 'NEUTRAL',
            source: 'PLANETARY_STRENGTH'
          })
        );
      } else {
        strengthInterp = Object.freeze({
          availability: 'INCOMPLETE',
          shadbalaStatus: sb.status,
          totalRupa: sb.totalRupa,
          totalShastiamsa: sb.totalShastiamsa,
          percentageOfMinimum: sb.percentageOfMinimum,
          meetsMinimum: sb.meetsMinimum,
          missingComponents: Object.freeze([...(sb.missingComponents ?? [])])
        });

        evidenceList.push(
          Object.freeze({
            ruleId: 'PLANET_INTERPRETATION_STRENGTH_001',
            type: 'STRENGTH',
            planet,
            statement: 'Planetary strength assessment is incomplete because the Shadbala aggregate is incomplete.',
            effect: 'NEUTRAL',
            source: 'PLANETARY_STRENGTH'
          })
        );
      }
    } else {
      strengthInterp = Object.freeze({
        availability: 'INCOMPLETE'
      });

      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_STRENGTH_001',
          type: 'STRENGTH',
          planet,
          statement: 'Planetary strength source is not provided.',
          effect: 'NEUTRAL',
          source: 'PLANETARY_STRENGTH'
        })
      );
    }

    // 6. Nakshatra
    const nakRes = (analysis as any).nakshatraResult ?? (facts as any).nakshatraResult;
    const nakMeta = (analysis as any).nakshatraMetadata ?? (facts as any).nakshatraMetadata;
    const nakshatraInterp: PlanetNakshatraInterpretation = Object.freeze({
      name: nakRes?.nakshatra ?? '',
      pada: nakRes?.pada ?? '',
      lord: nakMeta?.lord ?? Planet.SUN
    });

    evidenceList.push(
      Object.freeze({
        ruleId: 'PLANET_INTERPRETATION_NAKSHATRA_001',
        type: 'NAKSHATRA',
        planet,
        statement: `${formatTitleCase(planet)} occupies ${formatTitleCase(nakshatraInterp.name)} Pada ${nakRes?.padaNumber ?? 1}, whose Nakshatra Lord is ${formatTitleCase(nakshatraInterp.lord)}.`,
        effect: 'NEUTRAL',
        source: 'NAKSHATRA'
      })
    );

    evidenceList.push(
      Object.freeze({
        ruleId: 'PLANET_INTERPRETATION_NAKSHATRA_LORD_001',
        type: 'NAKSHATRA',
        planet,
        relatedPlanets: Object.freeze([nakshatraInterp.lord]),
        statement: `${formatTitleCase(planet)} is ruled by Nakshatra Lord ${formatTitleCase(nakshatraInterp.lord)}.`,
        effect: 'NEUTRAL',
        source: 'NAKSHATRA'
      })
    );

    // 7. Received Drishti
    const receivedAspectsList: ReceivedDrishtiAspect[] = [];
    const drishtiAspects: any[] = input.natalGrahaDrishti?.aspects ?? input.natalGrahaDrishti?.planetToPlanetAspects ?? [];
    const receivedAspects = drishtiAspects.filter(
      aspect => (aspect.targetPlanet ?? aspect.target) === planet
    );
    for (const aspect of receivedAspects) {
      const srcP = aspect.sourcePlanet ?? aspect.aspectingPlanet;
      receivedAspectsList.push(
        Object.freeze({
          sourcePlanet: srcP,
          aspectType: aspect.aspectType,
          sourceHouse: aspect.sourceHouse,
          targetHouse: aspect.targetHouse
        })
      );

      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_DRISHTI_RECEIVED_001',
          type: 'DRISHTI_RECEIVED',
          planet,
          relatedPlanets: Object.freeze([srcP]),
          houses: Object.freeze([aspect.sourceHouse, aspect.targetHouse]),
          statement: `${formatTitleCase(planet)} receives ${formatTitleCase(srcP)}'s ${formatAspectType(aspect.aspectType)} Graha Drishti.`,
          effect: 'NEUTRAL',
          source: 'NATAL_GRAHA_DRISHTI'
        })
      );
    }

    // 8. Cast Drishti
    const castAspectsList: CastDrishtiAspect[] = [];
    const castAspects = drishtiAspects.filter(
      aspect => (aspect.sourcePlanet ?? aspect.aspectingPlanet) === planet
    );
    for (const aspect of castAspects) {
      const tgtP = aspect.targetPlanet ?? aspect.target;
      castAspectsList.push(
        Object.freeze({
          targetPlanet: tgtP,
          targetHouse: aspect.targetHouse,
          aspectType: aspect.aspectType
        })
      );

      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_DRISHTI_CAST_001',
          type: 'DRISHTI_CAST',
          planet,
          relatedPlanets: Object.freeze([tgtP]),
          houses: Object.freeze([aspect.sourceHouse, aspect.targetHouse]),
          statement: `${formatTitleCase(planet)} casts ${formatAspectType(aspect.aspectType)} Graha Drishti on ${formatTitleCase(tgtP)}.`,
          effect: 'NEUTRAL',
          source: 'NATAL_GRAHA_DRISHTI'
        })
      );
    }

    const drishtiInterp: PlanetDrishtiInterpretation = Object.freeze({
      received: Object.freeze(receivedAspectsList),
      cast: Object.freeze(castAspectsList)
    });

    // 9. Yogas
    const yogaItems: PlanetYogaItem[] = [];
    const matchingYogas = input.yogas.yogas.filter(y => y.planets.includes(planet));

    for (const yoga of matchingYogas) {
      const strengthVal = yoga.assessment?.strength ?? yoga.strength;
      const item: PlanetYogaItem = Object.freeze({
        type: yoga.type,
        category: yoga.category,
        strength: strengthVal,
        ...(yoga.assessment?.finalStatus ? { finalStatus: yoga.assessment.finalStatus } : {})
      });
      yogaItems.push(item);

      const otherYogaPlanets = yoga.planets.filter(p => p !== planet);
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_YOGA_001',
          type: 'YOGA',
          planet,
          relatedPlanets: Object.freeze([...otherYogaPlanets]),
          houses: Object.freeze([...yoga.houses.filter((h: any) => typeof h === 'number')]) as readonly number[],
          statement: `${formatTitleCase(planet)} participates in ${formatTitleCase(yoga.type)} (${formatTitleCase(yoga.category)}).`,
          effect: 'NEUTRAL',
          source: 'YOGA_ENGINE'
        })
      );
    }

    // 10. Natural Relationships
    for (const otherPlanet of allPlanets) {
      if (otherPlanet === planet) continue;
      const relationship = calculateNaturalRelationship(planet, otherPlanet);
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_NATURAL_RELATIONSHIP_001',
          type: 'NATURAL_RELATIONSHIP',
          planet,
          relatedPlanets: Object.freeze([otherPlanet]),
          statement: `${formatTitleCase(planet)} holds natural ${relationship} relationship towards ${formatTitleCase(otherPlanet)}.`,
          effect: 'NEUTRAL',
          source: 'NATURAL_RELATIONSHIP'
        })
      );
    }

    // 11. Conjunctions
    const planetHouse = facts.house ?? facts.position?.house;
    const conjoinedPlanets = allPlanets.filter(
      p => p !== planet && (input.planetFacts[p].house ?? input.planetFacts[p].position?.house) === planetHouse
    );

    if (conjoinedPlanets.length > 0 && planetHouse !== undefined) {
      evidenceList.push(
        Object.freeze({
          ruleId: 'PLANET_INTERPRETATION_CONJUNCTION_001',
          type: 'CONJUNCTION',
          planet,
          relatedPlanets: Object.freeze([...conjoinedPlanets]),
          houses: Object.freeze([planetHouse]),
          statement: `${formatTitleCase(planet)} is conjoined with ${conjoinedPlanets.map(p => formatTitleCase(p)).join(', ')} in House ${planetHouse}.`,
          effect: 'NEUTRAL',
          source: 'PLANET_FACTS'
        })
      );
    }

    // Summary Construction
    const primaryTypes: ReadonlySet<string> = new Set(['PLACEMENT', 'FUNCTIONAL_ROLE', 'DIGNITY']);
    const primaryFactors = evidenceList
      .filter(e => primaryTypes.has(e.type))
      .map(e => e.statement);

    const supportingFactors = evidenceList
      .filter(e => e.effect === 'SUPPORT')
      .map(e => e.statement);

    const challengingFactors = evidenceList
      .filter(e => e.effect === 'CHALLENGE')
      .map(e => e.statement);

    const unresolvedFactors = evidenceList
      .filter(
        e =>
          e.type === 'STRENGTH' &&
          (e.statement.toLowerCase().includes('incomplete') ||
            e.statement.toLowerCase().includes('not provided'))
      )
      .map(e => e.statement);

    const summary: PlanetInterpretationSummary = Object.freeze({
      primaryFactors: Object.freeze(primaryFactors),
      supportingFactors: Object.freeze(supportingFactors),
      challengingFactors: Object.freeze(challengingFactors),
      unresolvedFactors: Object.freeze(unresolvedFactors)
    });

    let confidence: InterpretationConfidence = 'MEDIUM';
    if (
      input.planetaryStrength?.planets[planet]?.shadbala?.status ===
      ShadbalaAggregationStatus.COMPLETE
    ) {
      confidence = 'HIGH';
    }

    const planetInterp: PlanetInterpretation = Object.freeze({
      planet,
      summary,
      placement,
      functionalRole: roleInterp,
      strength: strengthInterp,
      drishti: drishtiInterp,
      yogas: Object.freeze(yogaItems),
      nakshatra: nakshatraInterp,
      evidence: Object.freeze(evidenceList),
      confidence
    });

    planetsMap[planet] = planetInterp;
  }

  const frozenPlanetsMap = Object.freeze(
    planetsMap as Record<Planet, PlanetInterpretation>
  );

  return Object.freeze({
    planets: frozenPlanetsMap
  });
}
