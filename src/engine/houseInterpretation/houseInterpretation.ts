import {
  Planet,
  Sign,
  AspectType,
  HouseAnalysisReport,
  PlanetAnalysisReport,
  NatalGrahaDrishtiReport,
  PlanetaryStrengthReport,
  PlanetCondition,
  ShadbalaAggregationStatus
} from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { YogaAnalysisReport } from '../yoga/yogaTypes';
import {
  InterpretationConfidence,
  PlanetInterpretationReport
} from '../planetInterpretation/planetInterpretationTypes';
import {
  HouseInterpretationInput,
  HouseInterpretationReport,
  HouseInterpretation,
  HouseInterpretationEvidence,
  HousePlacementInterpretation,
  HouseLordInterpretation,
  HouseOccupantPlanetEvidence,
  HouseOccupantInterpretation,
  HouseReceivedAspect,
  HouseAspectInterpretation,
  HouseYogaReference,
  HouseStrengthInterpretation,
  HouseInterpretationSummary,
  HOUSE_DOMAIN_METADATA
} from './houseInterpretationTypes';

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Performs a deterministic, evidence-first House Interpretation analysis for all 12 houses.
 */
export function analyzeHouseInterpretation(
  input: HouseInterpretationInput
): HouseInterpretationReport {
  if (!input) {
    throw new Error('houseInterpretation input must not be null or undefined.');
  }
  if (!input.houseAnalysis) {
    throw new Error('houseInterpretation input is missing required top-level field: houseAnalysis.');
  }
  if (!input.planetAnalysis) {
    throw new Error('houseInterpretation input is missing required top-level field: planetAnalysis.');
  }
  if (!input.planetInterpretation) {
    throw new Error('houseInterpretation input is missing required top-level field: planetInterpretation.');
  }
  if (!input.functionalRoles) {
    throw new Error('houseInterpretation input is missing required top-level field: functionalRoles.');
  }
  if (!input.natalGrahaDrishti) {
    throw new Error('houseInterpretation input is missing required top-level field: natalGrahaDrishti.');
  }
  if (!input.yogas) {
    throw new Error('houseInterpretation input is missing required top-level field: yogas.');
  }

  for (let house = 1; house <= 12; house++) {
    if (!input.houseAnalysis.houses?.[house]) {
      throw new Error(`houseAnalysis is missing required house: ${house}.`);
    }
    const hAnalysis = input.houseAnalysis.houses[house];
    const lord = hAnalysis.lord;
    if (!input.planetAnalysis.planets?.[lord]) {
      throw new Error(`planetAnalysis is missing required planet: ${lord}.`);
    }
    if (!input.planetInterpretation.planets?.[lord]) {
      throw new Error(`planetInterpretation is missing required planet: ${lord}.`);
    }
    if (!input.functionalRoles.planets?.[lord]) {
      throw new Error(`functionalRoles is missing required planet: ${lord}.`);
    }
    for (const occ of hAnalysis.occupants) {
      if (!input.planetAnalysis.planets?.[occ]) {
        throw new Error(`planetAnalysis is missing required planet: ${occ}.`);
      }
      if (!input.planetInterpretation.planets?.[occ]) {
        throw new Error(`planetInterpretation is missing required planet: ${occ}.`);
      }
      if (!input.functionalRoles.planets?.[occ]) {
        throw new Error(`functionalRoles is missing required planet: ${occ}.`);
      }
    }
  }

  const housesMap: Partial<Record<number, HouseInterpretation>> = {};

  for (let house = 1; house <= 12; house++) {
    const hAnalysis = input.houseAnalysis.houses[house];
    const sign = hAnalysis.sign;
    const lord = hAnalysis.lord;

    const lordPInterp = input.planetInterpretation.planets[lord];
    const lordPAnalysis = input.planetAnalysis.planets[lord];
    const lordFRoles = input.functionalRoles.planets[lord];

    const houseEvidenceList: HouseInterpretationEvidence[] = [];

    // Placement
    const placement: HousePlacementInterpretation = Object.freeze({
      sign,
      signLord: lord,
      house
    });

    const placementStatement = `House ${house} is in ${formatTitleCase(sign)}, ruled by ${formatTitleCase(lord)}.`;
    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_PLACEMENT_001',
        type: 'HOUSE_PLACEMENT',
        house,
        statement: placementStatement,
        effect: 'NEUTRAL',
        source: 'HOUSE_ANALYSIS'
      })
    );

    // Lord
    const occupiedHouse = lordPInterp.placement.house ?? lordPAnalysis.house;
    const lordSign = lordPInterp.placement.sign ?? lordPAnalysis.sign;
    const lordDignity = lordPAnalysis.dignity?.status;
    const lordRoles = lordFRoles.roles;
    const lordNature = lordFRoles.functionalNature;

    const lordStatement = `${formatTitleCase(lord)} is the lord of House ${house}.`;
    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_LORD_001',
        type: 'HOUSE_LORD',
        house,
        planets: Object.freeze([lord]),
        statement: lordStatement,
        effect: 'NEUTRAL',
        source: 'HOUSE_LORD'
      })
    );

    const lordPlacementStatement = `House ${house} lord ${formatTitleCase(lord)} occupies House ${occupiedHouse}.`;
    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_LORD_PLACEMENT_001',
        type: 'HOUSE_LORD_PLACEMENT',
        house,
        planets: Object.freeze([lord]),
        relatedHouses: Object.freeze([house, occupiedHouse]),
        statement: lordPlacementStatement,
        effect: 'NEUTRAL',
        source: 'HOUSE_LORD_PLACEMENT'
      })
    );

    const lordDignityStatement = lordDignity
      ? `Lord of House ${house}, ${formatTitleCase(lord)}, is in ${lordDignity} dignity in ${formatTitleCase(lordSign)}.`
      : `Dignity for ${formatTitleCase(lord)} is unavailable.`;
    let lordDignityEffect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' = 'NEUTRAL';
    if (lordDignity === 'EXALTED' || lordDignity === 'OWN_SIGN' || lordDignity === 'MOOLATRIKONA') {
      lordDignityEffect = 'SUPPORT';
    } else if (lordDignity === 'DEBILITATED') {
      lordDignityEffect = 'CHALLENGE';
    }

    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_LORD_DIGNITY_001',
        type: 'HOUSE_LORD_DIGNITY',
        house,
        planets: Object.freeze([lord]),
        statement: lordDignityStatement,
        effect: lordDignityEffect,
        source: 'DIGNITY'
      })
    );

    const stateParts: string[] = [];
    if (lordPAnalysis.state?.condition === PlanetCondition.COMBUST) {
      stateParts.push('combust');
    } else if (lordPAnalysis.state?.condition === PlanetCondition.DEEPLY_COMBUST) {
      stateParts.push('deeply combust');
    }
    if (lordPAnalysis.state?.motion?.retrograde) {
      stateParts.push('retrograde');
    }
    if (lordPAnalysis.state?.motion?.stationary) {
      stateParts.push('stationary');
    }

    const lordStateDesc = stateParts.length > 0 ? stateParts.join(' and ') : 'in normal state';
    const lordStateStatement = stateParts.length > 0
      ? `House ${house} lord ${formatTitleCase(lord)} is ${lordStateDesc}.`
      : `House ${house} lord ${formatTitleCase(lord)} is in normal state.`;

    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_LORD_STATE_001',
        type: 'HOUSE_LORD_STATE',
        house,
        planets: Object.freeze([lord]),
        statement: lordStateStatement,
        effect: 'NEUTRAL',
        source: 'PLANET_ANALYSIS'
      })
    );

    for (const role of lordRoles) {
      const roleStatement = `${formatTitleCase(lord)} holds functional role ${role} for House ${house}.`;
      houseEvidenceList.push(
        Object.freeze({
          ruleId: `HOUSE_INTERPRETATION_LORD_ROLE_${role}_001`,
          type: 'HOUSE_LORD_ROLE',
          house,
          planets: Object.freeze([lord]),
          statement: roleStatement,
          effect: 'NEUTRAL',
          source: 'FUNCTIONAL_ROLES'
        })
      );
    }

    const lordStrengthStatement = `Lord ${formatTitleCase(lord)} Shadbala status: ${lordPInterp.strength.shadbalaStatus || lordPInterp.strength.availability}.`;
    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_LORD_STRENGTH_001',
        type: 'HOUSE_LORD_STRENGTH',
        house,
        planets: Object.freeze([lord]),
        statement: lordStrengthStatement,
        effect: 'NEUTRAL',
        source: 'PLANETARY_STRENGTH'
      })
    );

    // Yogas
    const houseYogaRefs: HouseYogaReference[] = [];
    for (const y of input.yogas?.yogas ?? []) {
      const operatesOnLord = y.planets.includes(lord);
      const operatesOnOccupant = y.planets.some(p => hAnalysis.occupants.includes(p));
      const operatesOnHouse = y.houses?.includes(house);

      if (operatesOnLord || operatesOnOccupant || operatesOnHouse) {
        const relationship: 'LORD' | 'OCCUPANT' | 'HOUSE' | 'LORD_RELATIONSHIP' = operatesOnLord
          ? 'LORD'
          : operatesOnOccupant
          ? 'OCCUPANT'
          : operatesOnHouse
          ? 'HOUSE'
          : 'LORD_RELATIONSHIP';

        const finalStatus = y.assessment?.finalStatus;
        const strength = y.assessment?.strength;
        const yogaRef: HouseYogaReference = Object.freeze({
          yogaType: y.type,
          ...(y.evidence?.[0]?.ruleId ? { yogaId: y.evidence[0].ruleId } : {}),
          ...(strength ? { strength } : {}),
          ...(finalStatus ? { finalStatus } : {}),
          relationship
        });
        houseYogaRefs.push(yogaRef);

        houseEvidenceList.push(
          Object.freeze({
            ruleId: 'HOUSE_INTERPRETATION_YOGA_001',
            type: 'YOGA',
            house,
            planets: Object.freeze([...y.planets]),
            statement: `House ${house} participates in ${y.type} Yoga (${relationship} relationship).`,
            effect: 'NEUTRAL',
            source: 'YOGA_ENGINE'
          })
        );
      }
    }

    // Lord Interpretation object
    const lordEvidenceList = houseEvidenceList.filter(e => e.planets?.includes(lord));
    const lordInterpretation: HouseLordInterpretation = Object.freeze({
      planet: lord,
      occupiedHouse,
      sign: lordSign,
      dignity: lordDignity,
      functionalRoles: Object.freeze([...lordRoles]),
      functionalNature: lordNature,
      strength: lordPInterp.strength,
      yogaParticipation: Object.freeze(houseYogaRefs.filter(yr => yr.relationship === 'LORD')),
      evidence: Object.freeze(lordEvidenceList)
    });

    // Occupants
    const occupantEvidenceList: HouseOccupantPlanetEvidence[] = [];
    for (const p of hAnalysis.occupants) {
      const pAnalysis = input.planetAnalysis.planets[p];
      const pFRoles = input.functionalRoles.planets[p];
      const pSign = pAnalysis.sign;
      const pDignity = pAnalysis.dignity?.status;

      occupantEvidenceList.push(
        Object.freeze({
          planet: p,
          sign: pSign as Sign,
          dignity: pDignity,
          functionalRoles: Object.freeze([...pFRoles.roles]),
          functionalNature: pFRoles.functionalNature,
          interpretationReference: p
        })
      );

      houseEvidenceList.push(
        Object.freeze({
          ruleId: 'HOUSE_INTERPRETATION_OCCUPANT_001',
          type: 'OCCUPANT',
          house,
          planets: Object.freeze([p]),
          statement: `${formatTitleCase(p)} occupies House ${house}.`,
          effect: 'NEUTRAL',
          source: 'HOUSE_ANALYSIS'
        })
      );

      for (const role of pFRoles.roles) {
        houseEvidenceList.push(
          Object.freeze({
            ruleId: 'HOUSE_INTERPRETATION_OCCUPANT_ROLE_001',
            type: 'OCCUPANT_ROLE',
            house,
            planets: Object.freeze([p]),
            statement: `${formatTitleCase(p)} holds functional role ${role} and occupies House ${house}.`,
            effect: 'NEUTRAL',
            source: 'FUNCTIONAL_ROLES'
          })
        );
      }

      if (pDignity === 'EXALTED' || pDignity === 'OWN_SIGN' || pDignity === 'MOOLATRIKONA') {
        houseEvidenceList.push(
          Object.freeze({
            ruleId: 'HOUSE_INTERPRETATION_OCCUPANT_DIGNITY_001',
            type: 'OCCUPANT_DIGNITY',
            house,
            planets: Object.freeze([p]),
            statement: `Occupant ${formatTitleCase(p)} is in ${pDignity} dignity in House ${house}.`,
            effect: 'SUPPORT',
            source: 'DIGNITY'
          })
        );
      } else if (pDignity === 'DEBILITATED') {
        houseEvidenceList.push(
          Object.freeze({
            ruleId: 'HOUSE_INTERPRETATION_OCCUPANT_DIGNITY_001',
            type: 'OCCUPANT_DIGNITY',
            house,
            planets: Object.freeze([p]),
            statement: `Occupant ${formatTitleCase(p)} is in ${pDignity} dignity in House ${house}.`,
            effect: 'CHALLENGE',
            source: 'DIGNITY'
          })
        );
      }
    }

    const occupantsInterp: HouseOccupantInterpretation = Object.freeze({
      planets: Object.freeze([...hAnalysis.occupants]),
      planetEvidence: Object.freeze(occupantEvidenceList)
    });

    // Aspects
    const aspectsTargetingHouse = input.natalGrahaDrishti?.aspects?.filter(a => a.targetHouse === house) ?? [];
    const groupedMap = new Map<string, { aspectType: AspectType; sourceHouse: number; houseOffset: number; sourcePlanets: Planet[] }>();

    for (const a of aspectsTargetingHouse) {
      const key = `${a.aspectType}_${a.sourceHouse}`;
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          aspectType: a.aspectType,
          sourceHouse: a.sourceHouse,
          houseOffset: a.houseOffset,
          sourcePlanets: []
        });
      }
      const group = groupedMap.get(key)!;
      if (!group.sourcePlanets.includes(a.sourcePlanet)) {
        group.sourcePlanets.push(a.sourcePlanet);
      }
    }

    const receivedAspects: HouseReceivedAspect[] = [];
    for (const group of groupedMap.values()) {
      const item: HouseReceivedAspect = Object.freeze({
        aspectType: group.aspectType,
        sourceHouse: group.sourceHouse,
        sourcePlanets: Object.freeze([...group.sourcePlanets]),
        houseOffset: group.houseOffset
      });
      receivedAspects.push(item);

      houseEvidenceList.push(
        Object.freeze({
          ruleId: 'HOUSE_INTERPRETATION_ASPECT_001',
          type: 'ASPECT',
          house,
          planets: Object.freeze([...group.sourcePlanets]),
          statement: `House ${house} receives ${group.aspectType} aspect from ${group.sourcePlanets.map(formatTitleCase).join(', ')} in House ${group.sourceHouse}.`,
          effect: 'NEUTRAL',
          source: 'NATAL_GRAHA_DRISHTI'
        })
      );
    }

    // House-Lord aspects
    const lordAspects = input.natalGrahaDrishti?.aspects?.filter(a => a.targetPlanet === lord) ?? [];
    for (const a of lordAspects) {
      houseEvidenceList.push(
        Object.freeze({
          ruleId: 'HOUSE_INTERPRETATION_LORD_ASPECT_001',
          type: 'HOUSE_LORD_ASPECT',
          house,
          planets: Object.freeze([a.sourcePlanet, lord]),
          statement: `${formatTitleCase(lord)}, lord of House ${house}, receives ${formatTitleCase(a.sourcePlanet)}'s ${a.aspectType} Graha Drishti.`,
          effect: 'NEUTRAL',
          source: 'NATAL_GRAHA_DRISHTI'
        })
      );
    }

    const aspectsInterp: HouseAspectInterpretation = Object.freeze({
      received: Object.freeze(receivedAspects)
    });

    // Domain
    const domainMeta = HOUSE_DOMAIN_METADATA[house];
    houseEvidenceList.push(
      Object.freeze({
        ruleId: 'HOUSE_INTERPRETATION_DOMAIN_001',
        type: 'DOMAIN',
        house,
        statement: `House ${house} primary domain themes: ${domainMeta.primaryThemes.join(', ')}.`,
        effect: 'NEUTRAL',
        source: 'DOMAIN_METADATA'
      })
    );

    // Strength
    const strengthInterp: HouseStrengthInterpretation = Object.freeze({
      availability: 'NOT_AVAILABLE'
    });

    // Summary
    const primaryFactors = [
      `House ${house} is in ${formatTitleCase(sign)}.`,
      `Lord of House ${house} is ${formatTitleCase(lord)}.`,
      `House ${house} lord ${formatTitleCase(lord)} occupies House ${occupiedHouse}.`,
      `Occupants: ${hAnalysis.occupants.length > 0 ? hAnalysis.occupants.map(formatTitleCase).join(', ') : 'None'}.`
    ];

    const supportingFactors = houseEvidenceList
      .filter(e => e.effect === 'SUPPORT')
      .map(e => e.statement);

    const challengingFactors = houseEvidenceList
      .filter(e => e.effect === 'CHALLENGE')
      .map(e => e.statement);

    const unresolvedFactors: string[] = ['Bhava Bala is not yet available.'];
    if (lordPInterp.strength.availability === 'INCOMPLETE') {
      unresolvedFactors.push(`Lord ${formatTitleCase(lord)} Shadbala strength is incomplete.`);
    }

    const summary: HouseInterpretationSummary = Object.freeze({
      primaryFactors: Object.freeze(primaryFactors),
      supportingFactors: Object.freeze(supportingFactors),
      challengingFactors: Object.freeze(challengingFactors),
      unresolvedFactors: Object.freeze(unresolvedFactors)
    });

    const hasCoreEvidence = Boolean(
      input.houseAnalysis?.houses?.[house] &&
      input.planetInterpretation?.planets?.[lord] &&
      input.functionalRoles?.planets?.[lord] &&
      input.planetAnalysis?.planets?.[lord] &&
      input.natalGrahaDrishti?.aspects &&
      input.yogas?.yogas &&
      hAnalysis.occupants.every(occ =>
        Boolean(input.planetAnalysis?.planets?.[occ]) &&
        Boolean(input.planetInterpretation?.planets?.[occ]) &&
        Boolean(input.functionalRoles?.planets?.[occ])
      )
    );

    let confidence: InterpretationConfidence = 'LOW';
    if (hasCoreEvidence) {
      const lordStrengthData = input.planetaryStrength?.planets?.[lord];
      const isLordStrengthComplete =
        lordPInterp.strength?.availability === 'AVAILABLE' &&
        (!lordStrengthData?.shadbala ||
          lordStrengthData.shadbala.status === ShadbalaAggregationStatus.COMPLETE);

      const areOccupantsStrengthComplete = hAnalysis.occupants.every(occ => {
        const occInterp = input.planetInterpretation.planets[occ];
        const occStrengthData = input.planetaryStrength?.planets?.[occ];
        return (
          occInterp?.strength?.availability === 'AVAILABLE' &&
          (!occStrengthData?.shadbala ||
            occStrengthData.shadbala.status === ShadbalaAggregationStatus.COMPLETE)
        );
      });

      const isOptionalStrengthComplete = Boolean(
        input.planetaryStrength &&
        isLordStrengthComplete &&
        areOccupantsStrengthComplete
      );

      confidence = isOptionalStrengthComplete ? 'HIGH' : 'MEDIUM';
    }

    const houseInterp: HouseInterpretation = Object.freeze({
      house,
      summary,
      placement,
      lord: lordInterpretation,
      occupants: occupantsInterp,
      aspects: aspectsInterp,
      yogas: Object.freeze(houseYogaRefs),
      strength: strengthInterp,
      evidence: Object.freeze(houseEvidenceList),
      confidence
    });

    housesMap[house] = houseInterp;
  }

  const frozenHousesMap = Object.freeze(
    housesMap as Record<number, HouseInterpretation>
  );

  return Object.freeze({
    houses: frozenHousesMap
  });
}
