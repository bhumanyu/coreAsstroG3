import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  Nakshatra,
  Pada,
  DignityStatus,
  PlanetCondition,
  PlanetFact,
  PlanetAnalysisReport,
  PlanetAnalysis,
  NatalGrahaDrishtiReport,
  NatalGrahaDrishti,
  PlanetaryStrengthReport,
  ShadbalaAggregationStatus,
  AspectType,
  Element,
  Modality,
  Gender,
  Polarity
} from '../../types';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalRoleAnalysisReport, FunctionalRoleAnalysis } from '../functionalNature/functionalRoles';
import { FunctionalNature } from '../functionalNature/functionalNature';
import {
  YogaAnalysisReport,
  YogaType,
  YogaCategory,
  YogaStrength,
  YogaStrengthLevel
} from '../yoga/yogaTypes';
import { analyzePlanetInterpretation } from './planetInterpretation';
import { PlanetInterpretationInput } from './planetInterpretationTypes';

function createDummyFact(
  planet: Planet,
  house: number,
  sign: Sign = Sign.ARIES,
  overrides?: Partial<PlanetFact>
): PlanetFact {
  return {
    planet,
    house,
    sign,
    signMetadata: {
      sign,
      number: 1,
      englishName: 'Aries',
      sanskritName: 'Mesha',
      startDegree: 0,
      endDegree: 30,
      element: Element.FIRE,
      modality: Modality.MOVABLE,
      gender: Gender.MASCULINE,
      polarity: Polarity.POSITIVE,
      ruler: Planet.MARS
    },
    position: {
      planet,
      eclipticLongitude: 15,
      eclipticLatitude: 0,
      motion: { speed: 1, retrograde: false, stationary: false }
    },
    nakshatraResult: {
      nakshatra: Nakshatra.ASHWINI,
      pada: Pada.FIRST,
      padaNumber: 1
    },
    nakshatraMetadata: {
      nakshatra: Nakshatra.ASHWINI,
      number: 1,
      englishName: 'Ashwini',
      sanskritName: 'Ashwini',
      lord: Planet.KETU,
      startDegree: 0,
      endDegree: 13.333333,
      symbol: 'Horse head',
      deity: 'Ashwini Kumaras'
    },
    state: {
      planet,
      motion: { speed: 1, retrograde: false, stationary: false },
      condition: PlanetCondition.NORMAL
    },
    dignity: {
      planet,
      sign,
      status: DignityStatus.NEUTRAL
    },
    ...overrides
  } as any;
}

function createDummyInput(
  factsOverrides?: Partial<Record<Planet, Partial<PlanetFact>>>,
  aspects: any[] = [],
  yogas: any[] = [],
  strengthReport?: PlanetaryStrengthReport
): PlanetInterpretationInput {
  const allPlanets = Object.values(Planet);

  const planetFacts = {} as Record<Planet, PlanetFact>;
  const planetAnalysisMap = {} as Record<Planet, PlanetAnalysis>;
  const functionalRolesMap = {} as Record<Planet, FunctionalRoleAnalysis>;

  allPlanets.forEach((p, idx) => {
    const house = (idx % 12) + 1;
    const overrides = factsOverrides?.[p];
    const facts = createDummyFact(p, house, Sign.ARIES, overrides);
    planetFacts[p] = facts;

    planetAnalysisMap[p] = {
      planet: p,
      sign: facts.sign,
      house: facts.house,
      longitude: facts.position.eclipticLongitude,
      nakshatraResult: facts.nakshatraResult,
      nakshatraMetadata: facts.nakshatraMetadata,
      dignity: (facts.dignity as any),
      state: facts.state,
      receivedAspects: aspects.filter(a => a.targetPlanet === p),
      castAspects: aspects.filter(a => a.sourcePlanet === p),
      evidence: []
    };

    functionalRolesMap[p] = {
      planet: p,
      ownedHouses: [house],
      roles: [FunctionalRole.KENDRA_LORD],
      kendraHouses: [house],
      trikonaHouses: [],
      dusthanaHouses: [],
      marakaHouses: [],
      functionalNature: FunctionalNature.NEUTRAL,
      isYogakaraka: false,
      evidence: []
    };
  });

  return {
    planetFacts: Object.freeze(planetFacts),
    planetAnalysis: Object.freeze({ planets: Object.freeze(planetAnalysisMap) }),
    functionalRoles: Object.freeze({
      ascendantSign: Sign.ARIES,
      badhakaHouse: 11,
      badhakaLord: Planet.SATURN,
      planets: Object.freeze(functionalRolesMap)
    }),
    natalGrahaDrishti: Object.freeze({ aspects: Object.freeze(aspects) }) as any,
    yogas: Object.freeze({ yogas: Object.freeze(yogas) }),
    ...(strengthReport ? { planetaryStrength: strengthReport } : {})
  };
}

describe('planetInterpretation', () => {
  it('shouldBuildInterpretationForAllNinePlanets', () => {
    const input = createDummyInput();
    const report = analyzePlanetInterpretation(input);

    expect(report.planets).toBeDefined();
    const allPlanets = Object.values(Planet);
    expect(Object.keys(report.planets).length).toBe(9);

    for (const p of allPlanets) {
      const interp = report.planets[p];
      expect(interp).toBeDefined();
      expect(interp.planet).toBe(p);
      expect(interp.summary).toBeDefined();
      expect(interp.placement).toBeDefined();
      expect(interp.functionalRole).toBeDefined();
      expect(interp.strength).toBeDefined();
      expect(interp.drishti).toBeDefined();
      expect(interp.yogas).toBeDefined();
      expect(interp.nakshatra).toBeDefined();
      expect(interp.evidence.length).toBeGreaterThan(0);
      expect(interp.confidence).toBeDefined();
    }
  });

  it('shouldPreservePlanetPlacement', () => {
    const input = createDummyInput({
      [Planet.SUN]: { house: 10, sign: Sign.LEO }
    });
    const report = analyzePlanetInterpretation(input);
    const sunInterp = report.planets[Planet.SUN];

    expect(sunInterp.placement.house).toBe(10);
    expect(sunInterp.placement.sign).toBe(Sign.LEO);
    expect(sunInterp.evidence.some(e => e.type === 'PLACEMENT' && e.statement.includes('House 10 in Leo'))).toBe(true);
  });

  it('shouldPreserveSignAndHouse', () => {
    const input = createDummyInput({
      [Planet.JUPITER]: { house: 9, sign: Sign.SAGITTARIUS }
    });
    const report = analyzePlanetInterpretation(input);
    const jupInterp = report.planets[Planet.JUPITER];

    expect(jupInterp.placement.sign).toBe(Sign.SAGITTARIUS);
    expect(jupInterp.placement.house).toBe(9);
  });

  it('shouldPreserveNakshatraAndPada', () => {
    const input = createDummyInput({
      [Planet.MOON]: {
        nakshatraResult: { nakshatra: Nakshatra.ROHINI, pada: Pada.SECOND, padaNumber: 2 } as any,
        nakshatraMetadata: {
          nakshatra: Nakshatra.ROHINI,
          number: 4,
          englishName: 'Rohini',
          sanskritName: 'Rohini',
          lord: Planet.MOON,
          startDegree: 40,
          endDegree: 53.33,
          symbol: 'Cart',
          deity: 'Brahma'
        } as any
      }
    });
    const report = analyzePlanetInterpretation(input);
    const moonInterp = report.planets[Planet.MOON];

    expect(moonInterp.nakshatra.name).toBe(Nakshatra.ROHINI);
    expect(moonInterp.nakshatra.pada).toBe(Pada.SECOND);
    expect(moonInterp.nakshatra.lord).toBe(Planet.MOON);
  });

  it('shouldPreserveFunctionalRoles', () => {
    const input = createDummyInput();

    // Override Mars roles in input to have LAGNA_LORD and MARAKA_LORD
    const rolesMap = { ...input.functionalRoles.planets };
    rolesMap[Planet.MARS] = {
      ...rolesMap[Planet.MARS],
      ownedHouses: [1, 8],
      roles: [FunctionalRole.LAGNA_LORD, FunctionalRole.MARAKA_LORD]
    };
    const customInput: PlanetInterpretationInput = {
      ...input,
      functionalRoles: {
        ...input.functionalRoles,
        planets: rolesMap
      }
    };

    const report = analyzePlanetInterpretation(customInput);
    const marsInterp = report.planets[Planet.MARS];

    expect(marsInterp.functionalRole.roles).toContain(FunctionalRole.LAGNA_LORD);
    expect(marsInterp.functionalRole.roles).toContain(FunctionalRole.MARAKA_LORD);
    expect(marsInterp.functionalRole.roles.length).toBe(2);
  });

  it('shouldPreserveFunctionalNature', () => {
    const input = createDummyInput();
    const rolesMap = { ...input.functionalRoles.planets };
    rolesMap[Planet.JUPITER] = {
      ...rolesMap[Planet.JUPITER],
      functionalNature: FunctionalNature.BENEFIC
    };
    const customInput: PlanetInterpretationInput = {
      ...input,
      functionalRoles: {
        ...input.functionalRoles,
        planets: rolesMap
      }
    };

    const report = analyzePlanetInterpretation(customInput);
    const jupInterp = report.planets[Planet.JUPITER];

    expect(jupInterp.functionalRole.functionalNature).toBe(FunctionalNature.BENEFIC);
    expect(jupInterp.evidence.some(e => e.type === 'FUNCTIONAL_ROLE' && e.effect === 'SUPPORT')).toBe(true);
  });

  it('shouldPreserveDignity', () => {
    const input = createDummyInput({
      [Planet.SUN]: { dignity: { planet: Planet.SUN, sign: Sign.ARIES, status: DignityStatus.EXALTED } },
      [Planet.SATURN]: { dignity: { planet: Planet.SATURN, sign: Sign.ARIES, status: DignityStatus.DEBILITATED } }
    });

    const report = analyzePlanetInterpretation(input);
    const sunEvidence = report.planets[Planet.SUN].evidence.find(e => e.type === 'DIGNITY');
    const saturnEvidence = report.planets[Planet.SATURN].evidence.find(e => e.type === 'DIGNITY');

    expect(sunEvidence?.effect).toBe('SUPPORT');
    expect(saturnEvidence?.effect).toBe('CHALLENGE');
  });

  it('shouldPreservePlanetaryState', () => {
    const input = createDummyInput({
      [Planet.MERCURY]: {
        state: {
          planet: Planet.MERCURY,
          motion: { speed: -0.5, retrograde: true, stationary: false },
          condition: PlanetCondition.COMBUST
        }
      }
    });

    const report = analyzePlanetInterpretation(input);
    const mercEv = report.planets[Planet.MERCURY].evidence.filter(e => e.type === 'STATE');

    expect(mercEv.some(e => e.statement.includes('combust') && e.effect === 'CHALLENGE')).toBe(true);
    expect(mercEv.some(e => e.statement.includes('retrograde') && e.effect === 'NEUTRAL')).toBe(true);
  });

  it('shouldConsumePlanetaryStrength', () => {
    const strengthReport: PlanetaryStrengthReport = {
      planets: {
        [Planet.SUN]: {
          planet: Planet.SUN,
          components: [],
          evidence: [],
          shadbala: {
            status: ShadbalaAggregationStatus.COMPLETE,
            totalShastiamsa: 420,
            totalRupa: 7.0,
            percentageOfMinimum: 107.69,
            meetsMinimum: true,
            missingComponents: [],
            reason: 'Complete Shadbala'
          }
        }
      } as any
    };

    const input = createDummyInput(undefined, [], [], strengthReport);
    const report = analyzePlanetInterpretation(input);

    expect(report.planets[Planet.SUN].strength.availability).toBe('AVAILABLE');
    expect(report.planets[Planet.SUN].strength.shadbalaStatus).toBe(ShadbalaAggregationStatus.COMPLETE);
    expect(report.planets[Planet.SUN].confidence).toBe('HIGH');
  });

  it('shouldHandleIncompletePlanetaryStrength', () => {
    const input = createDummyInput();
    const report = analyzePlanetInterpretation(input);

    expect(report.planets[Planet.SUN].strength.availability).toBe('INCOMPLETE');
    expect(report.planets[Planet.SUN].summary.unresolvedFactors.length).toBeGreaterThan(0);
    expect(report.planets[Planet.SUN].confidence).not.toBe('HIGH');
  });

  it('shouldPreserveReceivedDrishti', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars casts 4th aspect on Saturn',
      reason: 'Special 4th aspect'
    };

    const input = createDummyInput(undefined, [aspect]);
    const report = analyzePlanetInterpretation(input);

    const saturnInterp = report.planets[Planet.SATURN];
    expect(saturnInterp.drishti.received.length).toBe(1);
    expect(saturnInterp.drishti.received[0].sourcePlanet).toBe(Planet.MARS);
    expect(saturnInterp.drishti.received[0].aspectType).toBe(AspectType.SPECIAL_4TH);
    expect(saturnInterp.evidence.some(e => e.type === 'DRISHTI_RECEIVED' && e.relatedPlanets?.includes(Planet.MARS))).toBe(true);
  });

  it('shouldPreserveCastDrishti', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars casts 4th aspect on Saturn',
      reason: 'Special 4th aspect'
    };

    const input = createDummyInput(undefined, [aspect]);
    const report = analyzePlanetInterpretation(input);

    const marsInterp = report.planets[Planet.MARS];
    expect(marsInterp.drishti.cast.length).toBe(1);
    expect(marsInterp.drishti.cast[0].targetPlanet).toBe(Planet.SATURN);
    expect(marsInterp.evidence.some(e => e.type === 'DRISHTI_CAST' && e.relatedPlanets?.includes(Planet.SATURN))).toBe(true);
  });

  it('shouldPreserveYogaParticipation', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.MOON, Planet.JUPITER],
      houses: [1, 4],
      evidence: [],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDummyInput(undefined, [], [yoga]);
    const report = analyzePlanetInterpretation(input);

    const moonInterp = report.planets[Planet.MOON];
    expect(moonInterp.yogas.length).toBe(1);
    expect(moonInterp.yogas[0].type).toBe(YogaType.GAJA_KESARI);
    expect(moonInterp.yogas[0].finalStatus).toBe('STRONG');
    expect(moonInterp.evidence.some(e => e.type === 'YOGA' && e.relatedPlanets?.includes(Planet.JUPITER))).toBe(true);
  });

  it('shouldPreserveYogaAssessment', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.MOON, Planet.JUPITER],
      houses: [1, 4],
      evidence: [],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.VERY_WEAK,
        finalStatus: 'CANCELLED',
        confidence: 'HIGH'
      }
    };

    const input = createDummyInput(undefined, [], [yoga]);
    const report = analyzePlanetInterpretation(input);

    const jupInterp = report.planets[Planet.JUPITER];
    expect(jupInterp.yogas[0].finalStatus).toBe('CANCELLED');
    expect(jupInterp.yogas[0].strength).toBe(YogaStrengthLevel.VERY_WEAK);
  });

  it('shouldPreserveNaturalRelationshipEvidence', () => {
    const input = createDummyInput();
    const report = analyzePlanetInterpretation(input);

    const sunInterp = report.planets[Planet.SUN];
    const relEv = sunInterp.evidence.filter(e => e.type === 'NATURAL_RELATIONSHIP');
    expect(relEv.length).toBe(8); // 8 other planets
    expect(relEv.some(e => e.relatedPlanets?.includes(Planet.MOON))).toBe(true);
  });

  it('shouldPreserveConjunctionEvidence', () => {
    const input = createDummyInput({
      [Planet.SUN]: { house: 1 },
      [Planet.MERCURY]: { house: 1 }
    });

    const report = analyzePlanetInterpretation(input);
    const sunEv = report.planets[Planet.SUN].evidence.filter(e => e.type === 'CONJUNCTION');

    expect(sunEv.length).toBe(1);
    expect(sunEv[0].relatedPlanets).toContain(Planet.MERCURY);
  });

  it('shouldProduceDeterministicOutput', () => {
    const input = createDummyInput();
    const report1 = analyzePlanetInterpretation(input);
    const report2 = analyzePlanetInterpretation(input);

    expect(report1).toEqual(report2);
  });

  it('shouldRemainImmutable', () => {
    const input = createDummyInput();
    const report = analyzePlanetInterpretation(input);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.planets)).toBe(true);

    const sunInterp = report.planets[Planet.SUN];
    expect(Object.isFrozen(sunInterp)).toBe(true);
    expect(Object.isFrozen(sunInterp.summary)).toBe(true);
    expect(Object.isFrozen(sunInterp.placement)).toBe(true);
    expect(Object.isFrozen(sunInterp.functionalRole)).toBe(true);
    expect(Object.isFrozen(sunInterp.strength)).toBe(true);
    expect(Object.isFrozen(sunInterp.drishti)).toBe(true);
    expect(Object.isFrozen(sunInterp.yogas)).toBe(true);
    expect(Object.isFrozen(sunInterp.nakshatra)).toBe(true);
    expect(Object.isFrozen(sunInterp.evidence)).toBe(true);
  });

  it('shouldNotMutateInput', () => {
    const input = createDummyInput();
    const inputCopy = structuredClone(input);

    analyzePlanetInterpretation(input);

    expect(input).toEqual(inputCopy);
  });

  it('shouldRejectMissingInput', () => {
    expect(() => analyzePlanetInterpretation(null as any)).toThrow(
      'planetInterpretation input must not be null or undefined.'
    );
    expect(() => analyzePlanetInterpretation({} as any)).toThrow(
      'planetFacts must not be null or undefined.'
    );
  });

  it('shouldRejectMissingPlanet', () => {
    const input = createDummyInput();
    const incompleteFacts = { ...input.planetFacts };
    delete (incompleteFacts as any)[Planet.SUN];

    const badInput = { ...input, planetFacts: incompleteFacts };
    expect(() => analyzePlanetInterpretation(badInput)).toThrow(
      `planetFacts is missing required planet: ${Planet.SUN}.`
    );
  });

  // Additional Regression Tests

  it('shouldHandleMultipleRolesWithoutCollapsingToMixed', () => {
    const input = createDummyInput();
    const rolesMap = { ...input.functionalRoles.planets };
    rolesMap[Planet.MARS] = {
      ...rolesMap[Planet.MARS],
      ownedHouses: [1, 8],
      roles: [FunctionalRole.LAGNA_LORD, FunctionalRole.MARAKA_LORD],
      functionalNature: FunctionalNature.MIXED
    };

    const customInput = { ...input, functionalRoles: { ...input.functionalRoles, planets: rolesMap } };
    const report = analyzePlanetInterpretation(customInput);
    const marsRole = report.planets[Planet.MARS].functionalRole;

    expect(marsRole.roles).toContain(FunctionalRole.LAGNA_LORD);
    expect(marsRole.roles).toContain(FunctionalRole.MARAKA_LORD);
    expect(marsRole.functionalNature).toBe(FunctionalNature.MIXED);

    const lagnaLordEv = report.planets[Planet.MARS].evidence.find(e => e.statement.includes('LAGNA_LORD'));
    const marakaLordEv = report.planets[Planet.MARS].evidence.find(e => e.statement.includes('MARAKA_LORD'));
    expect(lagnaLordEv).toBeDefined();
    expect(marakaLordEv).toBeDefined();
  });

  it('shouldEmitSupportForYogakarakaFixture', () => {
    const input = createDummyInput();
    const rolesMap = { ...input.functionalRoles.planets };
    rolesMap[Planet.SATURN] = {
      ...rolesMap[Planet.SATURN],
      ownedHouses: [9, 10],
      roles: [FunctionalRole.YOGAKARAKA],
      isYogakaraka: true,
      functionalNature: FunctionalNature.BENEFIC
    };

    const customInput = { ...input, functionalRoles: { ...input.functionalRoles, planets: rolesMap } };
    const report = analyzePlanetInterpretation(customInput);

    const saturnEv = report.planets[Planet.SATURN].evidence.filter(e => e.type === 'FUNCTIONAL_ROLE');
    expect(saturnEv.some(e => e.effect === 'SUPPORT')).toBe(true);
  });

  it('shouldEmitDrishtiAspectsCorrectlyForMarsSaturnFixture', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars casts 4th aspect on Saturn',
      reason: 'Special 4th aspect'
    };

    const input = createDummyInput(undefined, [aspect]);
    const report = analyzePlanetInterpretation(input);

    const saturnReceived = report.planets[Planet.SATURN].drishti.received;
    const marsCast = report.planets[Planet.MARS].drishti.cast;

    expect(saturnReceived.length).toBe(1);
    expect(saturnReceived[0].sourcePlanet).toBe(Planet.MARS);
    expect(saturnReceived[0].aspectType).toBe(AspectType.SPECIAL_4TH);

    expect(marsCast.length).toBe(1);
    expect(marsCast[0].targetPlanet).toBe(Planet.SATURN);
  });

  it('shouldContainNoPredictionOrFutureEventFields', () => {
    const input = createDummyInput();
    const report = analyzePlanetInterpretation(input);

    const reportKeys = Object.keys(report);
    expect(reportKeys).not.toContain('careerPrediction');
    expect(reportKeys).not.toContain('marriagePrediction');
    expect(reportKeys).not.toContain('wealthPrediction');
    expect(reportKeys).not.toContain('healthPrediction');
    expect(reportKeys).not.toContain('futureEvent');

    for (const p of Object.values(Planet)) {
      const pKeys = Object.keys(report.planets[p]);
      expect(pKeys).not.toContain('careerPrediction');
      expect(pKeys).not.toContain('marriagePrediction');
      expect(pKeys).not.toContain('wealthPrediction');
      expect(pKeys).not.toContain('healthPrediction');
      expect(pKeys).not.toContain('futureEvent');
    }
  });

  it('shouldDeriveDrishtiFromNatalGrahaDrishtiNotPlanetAnalysis', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars casts 4th aspect on Saturn',
      reason: 'Special 4th aspect'
    };

    const input = createDummyInput();
    const customInput: PlanetInterpretationInput = {
      ...input,
      natalGrahaDrishti: Object.freeze({ aspects: Object.freeze([aspect]) }) as any
    };

    const report = analyzePlanetInterpretation(customInput);

    expect(report.planets[Planet.SATURN].drishti.received.length).toBe(1);
    expect(report.planets[Planet.SATURN].drishti.received[0].sourcePlanet).toBe(Planet.MARS);

    expect(report.planets[Planet.MARS].drishti.cast.length).toBe(1);
    expect(report.planets[Planet.MARS].drishti.cast[0].targetPlanet).toBe(Planet.SATURN);

    expect(
      report.planets[Planet.SATURN].evidence.some(
        e => e.type === 'DRISHTI_RECEIVED' && e.relatedPlanets?.includes(Planet.MARS)
      )
    ).toBe(true);

    expect(
      report.planets[Planet.MARS].evidence.some(
        e => e.type === 'DRISHTI_CAST' && e.relatedPlanets?.includes(Planet.SATURN)
      )
    ).toBe(true);
  });

  it('shouldThrowWhenPlanetAnalysisMissingRequiredPlanet', () => {
    const input = createDummyInput();
    const incompleteAnalysisPlanets = { ...input.planetAnalysis.planets };
    delete (incompleteAnalysisPlanets as any)[Planet.SUN];

    const badInput: PlanetInterpretationInput = {
      ...input,
      planetAnalysis: {
        ...input.planetAnalysis,
        planets: incompleteAnalysisPlanets
      }
    };

    expect(() => analyzePlanetInterpretation(badInput)).toThrow(
      `planetAnalysis is missing required planet: ${Planet.SUN}.`
    );
  });

  it('shouldThrowWhenFunctionalRolesMissingRequiredPlanet', () => {
    const input = createDummyInput();
    const incompleteRolesPlanets = { ...input.functionalRoles.planets };
    delete (incompleteRolesPlanets as any)[Planet.SUN];

    const badInput: PlanetInterpretationInput = {
      ...input,
      functionalRoles: {
        ...input.functionalRoles,
        planets: incompleteRolesPlanets
      }
    };

    expect(() => analyzePlanetInterpretation(badInput)).toThrow(
      `functionalRoles is missing required planet: ${Planet.SUN}.`
    );
  });

  it('shouldSourcePlacementFromPlanetFactsNotPlanetAnalysis', () => {
    const input = createDummyInput({
      [Planet.SUN]: {
        sign: Sign.ARIES,
        house: 1,
        position: {
          planet: Planet.SUN,
          eclipticLongitude: 10,
          eclipticLatitude: 0,
          motion: { speed: 1, retrograde: false, stationary: false }
        } as any
      }
    });

    // Deliberately make planetAnalysis disagree
    const modifiedAnalysisPlanets = { ...input.planetAnalysis.planets };
    modifiedAnalysisPlanets[Planet.SUN] = {
      ...modifiedAnalysisPlanets[Planet.SUN],
      sign: Sign.TAURUS,
      house: 2,
      longitude: 40
    } as any;

    const customInput: PlanetInterpretationInput = {
      ...input,
      planetAnalysis: {
        ...input.planetAnalysis,
        planets: modifiedAnalysisPlanets
      }
    };

    const report = analyzePlanetInterpretation(customInput);
    const sunPlacement = report.planets[Planet.SUN].placement;

    expect(sunPlacement.sign).toBe(Sign.ARIES);
    expect(sunPlacement.house).toBe(1);
    expect(sunPlacement.eclipticLongitude).toBe(10);

    const placementEv = report.planets[Planet.SUN].evidence.find(e => e.type === 'PLACEMENT');
    expect(placementEv?.source).toBe('PLANET_FACTS');
  });
});
