import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  Nakshatra,
  Pada,
  DignityStatus,
  PlanetCondition,
  PlanetFacts,
  PlanetFact,
  PlanetAnalysisReport,
  HouseAnalysisReport,
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
import { FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { FunctionalNature } from '../functionalNature/functionalNature';
import {
  YogaAnalysisReport,
  YogaType,
  YogaCategory,
  YogaStrength,
  YogaStrengthLevel
} from '../yoga/yogaTypes';
import { analyzePlanetInterpretation } from '../planetInterpretation/planetInterpretation';
import { analyzeHouseInterpretation } from './houseInterpretation';
import { HouseInterpretationInput } from './houseInterpretationTypes';

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

function createDummyHouseInput(
  houseLordMap?: Record<number, { sign: Sign; lord: Planet; occupants: Planet[] }>,
  planetFactsOverrides?: Partial<Record<Planet, Partial<PlanetFact>>>,
  aspects: any[] = [],
  yogas: any[] = [],
  strengthReport?: PlanetaryStrengthReport
): HouseInterpretationInput {
  const allPlanets = Object.values(Planet);

  // Default house mapping
  const defaultHouseLords: Record<number, Planet> = {
    1: Planet.MARS,
    2: Planet.VENUS,
    3: Planet.MERCURY,
    4: Planet.MOON,
    5: Planet.SUN,
    6: Planet.MERCURY,
    7: Planet.VENUS,
    8: Planet.MARS,
    9: Planet.JUPITER,
    10: Planet.SATURN,
    11: Planet.SATURN,
    12: Planet.JUPITER
  };

  const defaultHouseSigns: Record<number, Sign> = {
    1: Sign.ARIES,
    2: Sign.TAURUS,
    3: Sign.GEMINI,
    4: Sign.CANCER,
    5: Sign.LEO,
    6: Sign.VIRGO,
    7: Sign.LIBRA,
    8: Sign.SCORPIO,
    9: Sign.SAGITTARIUS,
    10: Sign.CAPRICORN,
    11: Sign.AQUARIUS,
    12: Sign.PISCES
  };

  const planetFacts = {} as Record<Planet, PlanetFact>;
  const planetAnalysisMap = {} as Record<string, any>;
  const functionalRolesMap = {} as Record<string, any>;

  allPlanets.forEach((p, idx) => {
    let house = (idx % 12) + 1;
    // Check if planet is specified as occupant in houseLordMap
    if (houseLordMap) {
      for (const [hNum, cfg] of Object.entries(houseLordMap)) {
        if (cfg.occupants.includes(p)) {
          house = Number(hNum);
          break;
        }
      }
    }

    const overrides = planetFactsOverrides?.[p];
    const sign = defaultHouseSigns[house];
    const facts = createDummyFact(p, house, sign, overrides);
    planetFacts[p] = facts;

    planetAnalysisMap[p] = {
      planet: p,
      sign: facts.sign,
      house: facts.house,
      longitude: facts.position.eclipticLongitude,
      nakshatraResult: facts.nakshatraResult,
      nakshatraMetadata: facts.nakshatraMetadata,
      dignity: facts.dignity,
      state: facts.state,
      receivedAspects: aspects.filter(a => (a.targetPlanet ?? a.target) === p),
      castAspects: aspects.filter(a => (a.sourcePlanet ?? a.source) === p),
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

  const housesAnalysisMap: Record<number, any> = {};
  for (let h = 1; h <= 12; h++) {
    const cfg = houseLordMap?.[h];
    const sign = cfg?.sign ?? defaultHouseSigns[h];
    const lord = cfg?.lord ?? defaultHouseLords[h];
    const occupants = cfg?.occupants ?? allPlanets.filter(p => planetFacts[p].house === h);

    housesAnalysisMap[h] = {
      house: h,
      sign,
      occupants,
      lord,
      lordAnalysis: planetAnalysisMap[lord],
      receivedAspects: [],
      evidence: []
    };
  }

  const pAnalysisReport: PlanetAnalysisReport = Object.freeze({ planets: Object.freeze(planetAnalysisMap) }) as any;
  const fRolesReport: FunctionalRoleAnalysisReport = Object.freeze({
    ascendantSign: Sign.ARIES,
    badhakaHouse: 11,
    badhakaLord: Planet.SATURN,
    planets: Object.freeze(functionalRolesMap)
  });

  const pInterpReport = analyzePlanetInterpretation({
    planetFacts: Object.freeze(planetFacts),
    planetAnalysis: pAnalysisReport,
    functionalRoles: fRolesReport,
    natalGrahaDrishti: Object.freeze({ aspects: Object.freeze(aspects) }) as any,
    yogas: Object.freeze({ yogas: Object.freeze(yogas) }),
    ...(strengthReport ? { planetaryStrength: strengthReport } : {})
  });

  return {
    houseAnalysis: Object.freeze({ houses: Object.freeze(housesAnalysisMap) }) as any,
    planetAnalysis: pAnalysisReport,
    planetInterpretation: pInterpReport,
    functionalRoles: fRolesReport,
    natalGrahaDrishti: Object.freeze({ aspects: Object.freeze(aspects) }) as any,
    yogas: Object.freeze({ yogas: Object.freeze(yogas) }),
    ...(strengthReport ? { planetaryStrength: strengthReport } : {})
  };
}

describe('houseInterpretation', () => {
  it('shouldBuildInterpretationForAll12Houses', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);

    expect(report.houses).toBeDefined();
    expect(Object.keys(report.houses).length).toBe(12);

    for (let h = 1; h <= 12; h++) {
      const houseInterp = report.houses[h];
      expect(houseInterp).toBeDefined();
      expect(houseInterp.house).toBe(h);
      expect(houseInterp.summary).toBeDefined();
      expect(houseInterp.placement).toBeDefined();
      expect(houseInterp.lord).toBeDefined();
      expect(houseInterp.occupants).toBeDefined();
      expect(houseInterp.aspects).toBeDefined();
      expect(houseInterp.yogas).toBeDefined();
      expect(houseInterp.strength).toBeDefined();
      expect(houseInterp.evidence).toBeDefined();
      expect(houseInterp.confidence).toBeDefined();
    }
  });

  it('shouldUseNatalGrahaDrishtiAsCanonicalSource', () => {
    // §50: construct natalGrahaDrishti with Mars -> House 10 but leave houseAnalysis.houses[10].receivedAspects empty
    const aspect: NatalGrahaDrishti = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 4,
      targetHouse: 10,
      sourceSign: Sign.CANCER,
      targetSign: Sign.CAPRICORN,
      houseOffset: 6,
      aspectType: AspectType.FULL_7TH,
      description: 'Mars aspects House 10',
      reason: '7th aspect'
    };

    const input = createDummyHouseInput(undefined, undefined, [aspect]);
    // Explicitly verify houseAnalysis.houses[10].receivedAspects is empty
    expect(input.houseAnalysis.houses[10].receivedAspects.length).toBe(0);

    const report = analyzeHouseInterpretation(input);
    const house10 = report.houses[10];

    expect(house10.aspects.received.length).toBe(1);
    expect(house10.aspects.received[0].sourcePlanets).toContain(Planet.MARS);
    expect(house10.aspects.received[0].sourceHouse).toBe(4);
    expect(house10.aspects.received[0].houseOffset).toBe(6);
  });

  it('shouldPreserveHouseLordPlacement', () => {
    // §51: House 10 lord Venus occupying House 4 -> house.lord.planet === Venus, house.lord.occupiedHouse === 4, and evidence statement 'House 10 lord Venus occupies House 4.'
    const houseLordMap = {
      10: { sign: Sign.CAPRICORN, lord: Planet.VENUS, occupants: [] },
      4: { sign: Sign.CANCER, lord: Planet.MOON, occupants: [Planet.VENUS] }
    };
    const input = createDummyHouseInput(houseLordMap);

    const report = analyzeHouseInterpretation(input);
    const house10 = report.houses[10];

    expect(house10.lord.planet).toBe(Planet.VENUS);
    expect(house10.lord.occupiedHouse).toBe(4);

    const lordPlacementEv = house10.evidence.find(
      e => e.type === 'HOUSE_LORD_PLACEMENT' && e.ruleId === 'HOUSE_INTERPRETATION_LORD_PLACEMENT_001'
    );
    expect(lordPlacementEv).toBeDefined();
    expect(lordPlacementEv?.statement).toBe('House 10 lord Venus occupies House 4.');
    expect(lordPlacementEv?.effect).toBe('NEUTRAL');
  });

  it('shouldHandleEmptyHouse', () => {
    // §52: House 7 occupants [] but lord/placement/aspects still present
    const houseLordMap = {
      7: { sign: Sign.LIBRA, lord: Planet.VENUS, occupants: [] }
    };
    const input = createDummyHouseInput(houseLordMap);

    const report = analyzeHouseInterpretation(input);
    const house7 = report.houses[7];

    expect(house7.occupants.planets).toEqual([]);
    expect(house7.occupants.planetEvidence).toEqual([]);
    expect(house7.lord).toBeDefined();
    expect(house7.placement).toBeDefined();
    expect(house7.aspects).toBeDefined();
  });

  it('shouldHandleMultiOccupantHouse', () => {
    // §53: House 10 = Saturn + Mars, both preserved separately
    const houseLordMap = {
      10: { sign: Sign.CAPRICORN, lord: Planet.SATURN, occupants: [Planet.SATURN, Planet.MARS] }
    };
    const input = createDummyHouseInput(houseLordMap);

    const report = analyzeHouseInterpretation(input);
    const house10 = report.houses[10];

    expect(house10.occupants.planets).toContain(Planet.SATURN);
    expect(house10.occupants.planets).toContain(Planet.MARS);
    expect(house10.occupants.planets.length).toBe(2);

    const saturnEv = house10.occupants.planetEvidence.find(e => e.planet === Planet.SATURN);
    const marsEv = house10.occupants.planetEvidence.find(e => e.planet === Planet.MARS);
    expect(saturnEv).toBeDefined();
    expect(marsEv).toBeDefined();
  });

  it('shouldPreserveHouseLordAspect', () => {
    // §54: HOUSE_INTERPRETATION_LORD_ASPECT_001 present when Mars aspects the 10th lord
    const houseLordMap = {
      10: { sign: Sign.CAPRICORN, lord: Planet.SATURN, occupants: [] }
    };
    const aspect: NatalGrahaDrishti = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 4,
      targetHouse: 10,
      sourceSign: Sign.CANCER,
      targetSign: Sign.CAPRICORN,
      houseOffset: 6,
      aspectType: AspectType.FULL_7TH,
      description: 'Mars aspects Saturn',
      reason: '7th aspect'
    };

    const input = createDummyHouseInput(houseLordMap, undefined, [aspect]);
    const report = analyzeHouseInterpretation(input);
    const house10 = report.houses[10];

    const lordAspectEv = house10.evidence.find(e => e.ruleId === 'HOUSE_INTERPRETATION_LORD_ASPECT_001');
    expect(lordAspectEv).toBeDefined();
    expect(lordAspectEv?.planets).toContain(Planet.MARS);
    expect(lordAspectEv?.planets).toContain(Planet.SATURN);
  });

  it('shouldPreserveYogaParticipation', () => {
    // §55: yoga participation with §26 strength/finalStatus passthrough
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.MARS], // Mars is lord of house 1
      houses: [1, 4],
      evidence: [{ ruleId: 'YOGA_GK_001', reason: 'Test' }],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.VERY_STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDummyHouseInput(undefined, undefined, [], [yoga]);
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    expect(house1.yogas.length).toBeGreaterThan(0);
    const yRef = house1.yogas.find(y => y.yogaType === YogaType.GAJA_KESARI);
    expect(yRef).toBeDefined();
    expect(yRef?.strength).toBe(YogaStrengthLevel.VERY_STRONG);
    expect(yRef?.finalStatus).toBe('STRONG');
    expect(yRef?.relationship).toBe('LORD');

    const yogaEv = house1.evidence.find(e => e.type === 'YOGA');
    expect(yogaEv).toBeDefined();
    expect(yogaEv?.effect).toBe('NEUTRAL');
  });

  it('shouldSetHouseYogaRelationshipLabel', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.VENUS, Planet.SATURN],
      houses: [5],
      evidence: [{ ruleId: 'YOGA_GK_001', reason: 'Test' }],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.VERY_STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDummyHouseInput(undefined, undefined, [], [yoga]);
    const report = analyzeHouseInterpretation(input);
    const house5 = report.houses[5];

    const yRef = house5.yogas.find(y => y.yogaType === YogaType.GAJA_KESARI);
    expect(yRef).toBeDefined();
    expect(yRef?.relationship).toBe('HOUSE');

    const yogaEv = house5.evidence.find(e => e.type === 'YOGA' && e.house === 5);
    expect(yogaEv).toBeDefined();
    expect(yogaEv?.effect).toBe('NEUTRAL');
    expect(yogaEv?.statement).toBe('House 5 participates in GAJA_KESARI Yoga (HOUSE relationship).');
  });

  it('shouldHandleUnavailableLordDignity', () => {
    const input = createDummyHouseInput();
    const pAnalysisPlanetsCopy = {
      ...input.planetAnalysis.planets,
      [Planet.MARS]: {
        ...input.planetAnalysis.planets[Planet.MARS],
        dignity: { ...input.planetAnalysis.planets[Planet.MARS].dignity, status: undefined as any }
      }
    };
    const modifiedInput: HouseInterpretationInput = {
      ...input,
      planetAnalysis: { planets: pAnalysisPlanetsCopy }
    };

    const report = analyzeHouseInterpretation(modifiedInput);
    const house1 = report.houses[1];

    expect(house1.lord.dignity).toBeUndefined();
    const dignityEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_DIGNITY');
    expect(dignityEv).toBeDefined();
    expect(dignityEv?.statement).toBe('Dignity for Mars is unavailable.');
    expect(dignityEv?.effect).toBe('NEUTRAL');
  });

  it('shouldEmitOccupantRoleEvidence', () => {
    const houseLordMap = {
      1: { sign: Sign.ARIES, lord: Planet.MARS, occupants: [Planet.SUN] }
    };
    const input = createDummyHouseInput(houseLordMap);
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const occupantRoleEv = house1.evidence.find(e => e.type === 'OCCUPANT_ROLE');
    expect(occupantRoleEv).toBeDefined();
    expect(occupantRoleEv?.effect).toBe('NEUTRAL');
    expect(occupantRoleEv?.statement).toContain('Sun holds functional role');
  });

  it('shouldEmitHouseLordStateEvidence', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const lordStateEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_STATE');
    expect(lordStateEv).toBeDefined();
    expect(lordStateEv?.effect).toBe('NEUTRAL');
    expect(lordStateEv?.statement).toBe('House 1 lord Mars is in normal state.');
  });

  it('shouldSetLordRoleEffectToNeutral', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const lordRoleEvs = house1.evidence.filter(e => e.type === 'HOUSE_LORD_ROLE');
    expect(lordRoleEvs.length).toBeGreaterThan(0);
    for (const ev of lordRoleEvs) {
      expect(ev.effect).toBe('NEUTRAL');
    }
  });

  it('shouldReturnNotAvailableForHouseStrength', () => {
    // §56: house.strength.availability === 'NOT_AVAILABLE'
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);

    for (let h = 1; h <= 12; h++) {
      expect(report.houses[h].strength.availability).toBe('NOT_AVAILABLE');
    }
  });

  it('shouldProduceDeterministicOutput', () => {
    const input = createDummyHouseInput();
    const report1 = analyzeHouseInterpretation(input);
    const report2 = analyzeHouseInterpretation(input);

    expect(report1).toEqual(report2);
  });

  it('shouldRemainImmutable', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.houses)).toBe(true);

    const house1 = report.houses[1];
    expect(Object.isFrozen(house1)).toBe(true);
    expect(Object.isFrozen(house1.summary)).toBe(true);
    expect(Object.isFrozen(house1.placement)).toBe(true);
    expect(Object.isFrozen(house1.lord)).toBe(true);
    expect(Object.isFrozen(house1.occupants)).toBe(true);
    expect(Object.isFrozen(house1.aspects)).toBe(true);
    expect(Object.isFrozen(house1.yogas)).toBe(true);
    expect(Object.isFrozen(house1.strength)).toBe(true);
    expect(Object.isFrozen(house1.evidence)).toBe(true);
  });

  it('shouldPreserveHouseLordDignity', () => {
    const input = createDummyHouseInput(undefined, {
      [Planet.MARS]: { dignity: { planet: Planet.MARS, sign: Sign.ARIES, status: DignityStatus.EXALTED } }
    });
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    expect(house1.lord.dignity).toBe('EXALTED');
    const lordDignityEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_DIGNITY');
    expect(lordDignityEv).toBeDefined();
    expect(lordDignityEv?.statement).toContain('in EXALTED dignity');
    expect(lordDignityEv?.effect).toBe('SUPPORT');
  });

  it('shouldPreserveHouseLordState', () => {
    const input = createDummyHouseInput(undefined, {
      [Planet.MARS]: { state: { planet: Planet.MARS, motion: { speed: 1, retrograde: true, stationary: false }, condition: PlanetCondition.COMBUST } }
    });
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const lordStateEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_STATE');
    expect(lordStateEv).toBeDefined();
    expect(lordStateEv?.statement).toContain('combust and retrograde');
    expect(lordStateEv?.effect).toBe('NEUTRAL');
  });

  it('shouldPreserveHouseLordRoles', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    expect(house1.lord.functionalRoles).toBeDefined();
    expect(house1.lord.functionalRoles.length).toBeGreaterThan(0);
    const lordRoleEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_ROLE');
    expect(lordRoleEv).toBeDefined();
  });

  it('shouldPreserveHouseLordStrength', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    expect(house1.lord.strength).toBeDefined();
    const lordStrengthEv = house1.evidence.find(e => e.type === 'HOUSE_LORD_STRENGTH');
    expect(lordStrengthEv).toBeDefined();
  });

  it('shouldPreserveOccupantRoles', () => {
    const houseLordMap = {
      1: { sign: Sign.ARIES, lord: Planet.MARS, occupants: [Planet.SUN] }
    };
    const input = createDummyHouseInput(houseLordMap);
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const occEvidence = house1.occupants.planetEvidence.find(e => e.planet === Planet.SUN);
    expect(occEvidence).toBeDefined();
    expect(occEvidence?.functionalRoles.length).toBeGreaterThan(0);

    const occRoleEv = house1.evidence.find(e => e.type === 'OCCUPANT_ROLE' && e.planets?.includes(Planet.SUN));
    expect(occRoleEv).toBeDefined();
  });

  it('shouldPreserveOccupantDignity', () => {
    const houseLordMap = {
      1: { sign: Sign.ARIES, lord: Planet.MARS, occupants: [Planet.SUN] }
    };
    const input = createDummyHouseInput(houseLordMap, {
      [Planet.SUN]: { dignity: { planet: Planet.SUN, sign: Sign.ARIES, status: DignityStatus.EXALTED } }
    });
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const occDignityEv = house1.evidence.find(e => e.type === 'OCCUPANT_DIGNITY' && e.planets?.includes(Planet.SUN));
    expect(occDignityEv).toBeDefined();
    expect(occDignityEv?.effect).toBe('SUPPORT');
  });

  it('shouldPreserveHouseDomainMetadata', () => {
    const input = createDummyHouseInput();
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const domainEv = house1.evidence.find(e => e.type === 'DOMAIN');
    expect(domainEv).toBeDefined();
    expect(domainEv?.statement).toContain('Self, Physical Body, Vitality');
  });

  it('shouldHandleYogaDirectlyLinkedToHouse', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.VENUS, Planet.SATURN],
      houses: [5],
      evidence: [{ ruleId: 'YOGA_GK_001', reason: 'Test' }],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.VERY_STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDummyHouseInput(undefined, undefined, [], [yoga]);
    const report = analyzeHouseInterpretation(input);
    const house5 = report.houses[5];

    const yRef = house5.yogas.find(y => y.yogaType === YogaType.GAJA_KESARI);
    expect(yRef).toBeDefined();
    expect(yRef?.relationship).toBe('HOUSE');
  });

  it('shouldHandleCancelledYoga', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.MARS],
      houses: [1],
      evidence: [{ ruleId: 'YOGA_GK_001', reason: 'Test' }],
      assessment: {
        formationPresent: false,
        strength: YogaStrengthLevel.WEAK,
        finalStatus: 'CANCELLED',
        confidence: 'LOW'
      }
    };

    const input = createDummyHouseInput(undefined, undefined, [], [yoga]);
    const report = analyzeHouseInterpretation(input);
    const house1 = report.houses[1];

    const yRef = house1.yogas.find(y => y.yogaType === YogaType.GAJA_KESARI);
    expect(yRef).toBeDefined();
    expect(yRef?.finalStatus).toBe('CANCELLED');
  });

  it('shouldNotClassifyLordPlacementFromDignity', () => {
    const houseLordMap = {
      10: { sign: Sign.CAPRICORN, lord: Planet.MARS, occupants: [] },
      1: { sign: Sign.ARIES, lord: Planet.MARS, occupants: [Planet.MARS] }
    };
    const input = createDummyHouseInput(houseLordMap, {
      [Planet.MARS]: { dignity: { planet: Planet.MARS, sign: Sign.CAPRICORN, status: DignityStatus.EXALTED } }
    });

    const report = analyzeHouseInterpretation(input);
    const house10 = report.houses[10];

    const lordPlacementEv = house10.evidence.find(e => e.type === 'HOUSE_LORD_PLACEMENT');
    expect(lordPlacementEv).toBeDefined();
    expect(lordPlacementEv?.effect).toBe('NEUTRAL');
  });

  it('shouldComputeConfidenceLevelsCorrectly', () => {
    // 1. Without planetaryStrength -> MEDIUM
    const inputMedium = createDummyHouseInput();
    const reportMedium = analyzeHouseInterpretation(inputMedium);
    expect(reportMedium.houses[1].confidence).toBe('MEDIUM');

    // 2. With complete planetaryStrength -> HIGH
    const dummyStrengthReport: PlanetaryStrengthReport = {
      planets: Object.fromEntries(
        Object.values(Planet).map(p => [
          p,
          {
            planet: p,
            components: [],
            evidence: [],
            shadbala: {
              status: ShadbalaAggregationStatus.COMPLETE,
              missingComponents: [],
              reason: 'Complete'
            }
          }
        ])
      ) as Record<Planet, any>
    };
    const inputHigh = createDummyHouseInput(undefined, undefined, [], [], dummyStrengthReport);
    const reportHigh = analyzeHouseInterpretation(inputHigh);
    expect(reportHigh.houses[1].confidence).toBe('HIGH');

    // 3. Missing core aspect evidence -> LOW
    const inputLow = {
      ...inputMedium,
      natalGrahaDrishti: { aspects: undefined as any }
    };
    const reportLow = analyzeHouseInterpretation(inputLow);
    expect(reportLow.houses[1].confidence).toBe('LOW');
  });

  it('shouldNotMutateInput', () => {
    const input = createDummyHouseInput();
    const inputCopy = structuredClone(input);

    analyzeHouseInterpretation(input);

    expect(input).toEqual(inputCopy);
  });

  it('shouldRejectMissingInput', () => {
    expect(() => analyzeHouseInterpretation(null as any)).toThrow(
      'houseInterpretation input must not be null or undefined.'
    );
    expect(() => analyzeHouseInterpretation({} as any)).toThrow(
      'houseInterpretation input is missing required top-level field: houseAnalysis.'
    );
  });

  it('shouldRejectMissingHouse', () => {
    const input = createDummyHouseInput();
    const housesCopy = { ...input.houseAnalysis.houses };
    delete (housesCopy as any)[1];

    const badInput: HouseInterpretationInput = {
      ...input,
      houseAnalysis: {
        houses: housesCopy
      }
    };

    expect(() => analyzeHouseInterpretation(badInput)).toThrow(
      'houseAnalysis is missing required house: 1.'
    );
  });

  it('shouldRejectMissingPlanetDependency', () => {
    const input = createDummyHouseInput();
    const pInterpPlanetsCopy = { ...input.planetInterpretation.planets };
    delete (pInterpPlanetsCopy as any)[Planet.MARS]; // Mars is lord of house 1

    const badInput: HouseInterpretationInput = {
      ...input,
      planetInterpretation: {
        planets: pInterpPlanetsCopy
      }
    };

    expect(() => analyzeHouseInterpretation(badInput)).toThrow(
      `planetInterpretation is missing required planet: ${Planet.MARS}.`
    );
  });

  it('shouldRejectMissingPlanetAnalysisDependency', () => {
    const input = createDummyHouseInput();
    const pAnalysisPlanetsCopy = { ...input.planetAnalysis.planets };
    delete (pAnalysisPlanetsCopy as any)[Planet.MARS]; // Mars is lord of house 1

    const badInput: HouseInterpretationInput = {
      ...input,
      planetAnalysis: {
        planets: pAnalysisPlanetsCopy
      }
    };

    expect(() => analyzeHouseInterpretation(badInput)).toThrow(
      `planetAnalysis is missing required planet: ${Planet.MARS}.`
    );
  });
});
