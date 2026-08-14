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
  Polarity,
  AyanamsaType,
  BirthDetails
} from '../../types';
import { calculateVimshottari, VimshottariTimeline, getActiveDasha } from '../dasha/vimshottari';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';
import { analyzeFunctionalRoles, FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';
import { FunctionalRole } from '../functionalNature/functionalRoleTypes';
import { FunctionalNature } from '../functionalNature/functionalNature';
import { YogaAnalysisReport, YogaType, YogaCategory, YogaStrength, YogaStrengthLevel } from '../yoga/yogaTypes';
import { analyzePlanetInterpretation } from '../planetInterpretation/planetInterpretation';
import { analyzeHouseInterpretation } from '../houseInterpretation/houseInterpretation';
import { analyzePlanets } from '../planetAnalysis';
import { analyzeHouses } from '../houseAnalysis';
import { analyzeDashaInterpretation, analyzeActiveDasha } from './dashaInterpretation';
import { DashaInterpretationInput } from './dashaInterpretationTypes';
import { calculateHoroscope } from '../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

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
      longitude: 15,
      sign,
      house,
      signLongitude: 15,
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
      index: 1,
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
  };
}

function createDashaFixture(overrides?: {
  vimshottari?: Partial<VimshottariTimeline>;
  aspects?: NatalGrahaDrishti[];
  yogas?: any[];
  planetaryStrength?: PlanetaryStrengthReport;
  factOverrides?: Partial<Record<Planet, Partial<PlanetFact>>>;
}): DashaInterpretationInput {
  const defaultTimeline = calculateVimshottari({
    birthDateTime: '1990-01-01T00:00:00.000Z',
    moonSiderealLongitude: 45
  });

  const vimshottari: VimshottariTimeline = {
    ...defaultTimeline,
    ...(overrides?.vimshottari ?? {})
  };

  const planetFacts: Record<Planet, PlanetFact> = {
    [Planet.SUN]: createDummyFact(Planet.SUN, 1, Sign.ARIES, overrides?.factOverrides?.[Planet.SUN]),
    [Planet.MOON]: createDummyFact(Planet.MOON, 2, Sign.TAURUS, overrides?.factOverrides?.[Planet.MOON]),
    [Planet.MARS]: createDummyFact(Planet.MARS, 1, Sign.ARIES, overrides?.factOverrides?.[Planet.MARS]),
    [Planet.MERCURY]: createDummyFact(Planet.MERCURY, 3, Sign.GEMINI, overrides?.factOverrides?.[Planet.MERCURY]),
    [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER, overrides?.factOverrides?.[Planet.JUPITER]),
    [Planet.VENUS]: createDummyFact(Planet.VENUS, 5, Sign.LEO, overrides?.factOverrides?.[Planet.VENUS]),
    [Planet.SATURN]: createDummyFact(Planet.SATURN, 10, Sign.CAPRICORN, {
      dignity: { planet: Planet.SATURN, sign: Sign.CAPRICORN, status: DignityStatus.OWN_SIGN },
      ...overrides?.factOverrides?.[Planet.SATURN]
    }),
    [Planet.RAHU]: createDummyFact(Planet.RAHU, 11, Sign.AQUARIUS, overrides?.factOverrides?.[Planet.RAHU]),
    [Planet.KETU]: createDummyFact(Planet.KETU, 5, Sign.LEO, overrides?.factOverrides?.[Planet.KETU])
  };

  const houseLordship = analyzeHouseLordship(Sign.ARIES);
  const natalGrahaDrishti: NatalGrahaDrishtiReport = { aspects: overrides?.aspects ?? [] };
  const yogas: YogaAnalysisReport = { yogas: overrides?.yogas ?? [] };
  const planetAnalysis = analyzePlanets({ planetFacts: planetFacts as any, natalGrahaDrishti });
  const houseAnalysis = analyzeHouses({ planetFacts: planetFacts as any, planetAnalysis, houseLordship });
  const functionalRoles = analyzeFunctionalRoles(Sign.ARIES, houseLordship);

  const planetInterpretation = analyzePlanetInterpretation({
    planetFacts: planetFacts as any,
    planetAnalysis,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetaryStrength: overrides?.planetaryStrength
  });

  const houseInterpretation = analyzeHouseInterpretation({
    houseAnalysis,
    planetAnalysis,
    planetInterpretation,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetaryStrength: overrides?.planetaryStrength
  });

  return {
    vimshottari,
    planetInterpretation,
    houseInterpretation,
    functionalRoles,
    natalGrahaDrishti,
    yogas,
    planetAnalysis,
    planetaryStrength: overrides?.planetaryStrength
  };
}

describe('dashaInterpretation Engine', () => {
  it('shouldPreserveBirthAnchor', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    expect(report.birthAnchor).toBeDefined();
    expect(report.birthAnchor.nakshatra).toBe(input.vimshottari.nakshatra);
    expect(report.birthAnchor.nakshatraLord).toBe(input.vimshottari.nakshatraLord);
    expect(report.birthAnchor.nakshatraProgress).toBe(input.vimshottari.nakshatraProgress);
    expect(report.birthAnchor.remainingFraction).toBe(input.vimshottari.remainingFraction);
  });

  it('shouldInterpretAllMahadashas', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    expect(report.mahadashas.length).toBe(input.vimshottari.mahadashas.length);
    expect(report.mahadashas.length).toBeGreaterThan(0);
  });

  it('shouldPreserveMahadashaDatesExactly', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    for (let i = 0; i < report.mahadashas.length; i++) {
      expect(report.mahadashas[i].start).toBe(input.vimshottari.mahadashas[i].start);
      expect(report.mahadashas[i].end).toBe(input.vimshottari.mahadashas[i].end);
      expect(report.mahadashas[i].planet).toBe(input.vimshottari.mahadashas[i].planet);
    }
  });

  it('shouldPreserveAntardashasExactly', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const md0 = report.mahadashas[0];
    const inputMD0 = input.vimshottari.mahadashas[0];

    expect(md0.antardashas.length).toBe(inputMD0.antardashas.length);
    for (let j = 0; j < md0.antardashas.length; j++) {
      expect(md0.antardashas[j].start).toBe(inputMD0.antardashas[j].start);
      expect(md0.antardashas[j].end).toBe(inputMD0.antardashas[j].end);
      expect(md0.antardashas[j].planet).toBe(inputMD0.antardashas[j].planet);
    }
  });

  it('shouldPreservePratyantardashasExactly', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const ad0 = report.mahadashas[0].antardashas[0];
    const inputAD0 = input.vimshottari.mahadashas[0].antardashas[0];

    expect(ad0.pratyantardashas.length).toBe(inputAD0.pratyantardashas.length);
    for (let k = 0; k < ad0.pratyantardashas.length; k++) {
      expect(ad0.pratyantardashas[k].start).toBe(inputAD0.pratyantardashas[k].start);
      expect(ad0.pratyantardashas[k].end).toBe(inputAD0.pratyantardashas[k].end);
      expect(ad0.pratyantardashas[k].planet).toBe(inputAD0.pratyantardashas[k].planet);
    }
  });

  it('shouldInterpretDashaLordPlacement', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.house).toBe(10);
    expect(saturnMD!.natal.sign).toBe(Sign.CAPRICORN);

    const placementEv = saturnMD!.natal.evidence.find(e => e.type === 'HOUSE_PLACEMENT');
    expect(placementEv).toBeDefined();
    expect(placementEv?.houses).toEqual([10]);
  });

  it('shouldPreserveDashaLordHouseOwnership', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.ownedHouses).toEqual([10, 11]);

    const ownershipEv = saturnMD!.natal.evidence.filter(e => e.type === 'HOUSE_OWNERSHIP');
    expect(ownershipEv.length).toBe(2);
  });

  it('shouldPreserveFunctionalRoles', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.functionalRoles.length).toBeGreaterThan(0);

    const roleEv = saturnMD!.natal.evidence.filter(e => e.type === 'FUNCTIONAL_ROLE');
    expect(roleEv.length).toBe(saturnMD!.natal.functionalRoles.length);
  });

  it('shouldPreserveFunctionalNature', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const marsMD = report.mahadashas.find(md => md.planet === Planet.MARS);
    expect(marsMD).toBeDefined();
    expect(marsMD!.natal.functionalNature).toBeDefined();

    const natureEv = marsMD!.natal.evidence.find(e => e.type === 'FUNCTIONAL_NATURE');
    expect(natureEv).toBeDefined();
  });

  it('shouldPreserveDignity', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.dignity).toBe('OWN_SIGN');

    const dignityEv = saturnMD!.natal.evidence.find(e => e.type === 'DIGNITY');
    expect(dignityEv).toBeDefined();
  });

  it('shouldPreservePlanetaryState', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.state).toBeDefined();

    const stateEv = saturnMD!.natal.evidence.find(e => e.type === 'STATE');
    expect(stateEv).toBeDefined();
  });

  it('shouldPreservePlanetaryStrength', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN);
    expect(saturnMD).toBeDefined();
    expect(saturnMD!.natal.strength).toBeDefined();

    const strengthEv = saturnMD!.natal.evidence.find(e => e.type === 'STRENGTH');
    expect(strengthEv).toBeDefined();
  });

  it('shouldUseNatalGrahaDrishtiAsCanonicalSource', () => {
    const testAspect: NatalGrahaDrishti = {
      sourcePlanet: Planet.MARS,
      sourceHouse: 1,
      sourceSign: Sign.ARIES,
      targetHouse: 10,
      targetSign: Sign.CAPRICORN,
      targetPlanet: Planet.SATURN,
      houseOffset: 10,
      aspectType: AspectType.SPECIAL_10TH,
      description: 'Mars aspects Saturn in House 10',
      reason: 'Mars 10th aspect'
    };

    const input = createDashaFixture({ aspects: [testAspect] });
    const report = analyzeDashaInterpretation(input);

    const marsMD = report.mahadashas.find(md => md.planet === Planet.MARS)!;
    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;

    expect(marsMD.natal.castAspects).toEqual([testAspect]);
    expect(saturnMD.natal.receivedAspects).toEqual([testAspect]);
  });

  it('shouldPreserveCastAspects', () => {
    const testAspect: NatalGrahaDrishti = {
      sourcePlanet: Planet.MARS,
      sourceHouse: 1,
      sourceSign: Sign.ARIES,
      targetHouse: 10,
      targetSign: Sign.CAPRICORN,
      targetPlanet: Planet.SATURN,
      houseOffset: 10,
      aspectType: AspectType.SPECIAL_10TH,
      description: 'Mars aspects Saturn in House 10',
      reason: 'Mars 10th aspect'
    };

    const input = createDashaFixture({ aspects: [testAspect] });
    const report = analyzeDashaInterpretation(input);

    const marsMD = report.mahadashas.find(md => md.planet === Planet.MARS)!;
    const castEv = marsMD.natal.evidence.find(e => e.type === 'ASPECT_CAST');
    expect(castEv).toBeDefined();
    expect(castEv?.houses).toEqual([10]);
  });

  it('shouldPreserveReceivedAspects', () => {
    const testAspect: NatalGrahaDrishti = {
      sourcePlanet: Planet.MARS,
      sourceHouse: 1,
      sourceSign: Sign.ARIES,
      targetHouse: 10,
      targetSign: Sign.CAPRICORN,
      targetPlanet: Planet.SATURN,
      houseOffset: 10,
      aspectType: AspectType.SPECIAL_10TH,
      description: 'Mars aspects Saturn in House 10',
      reason: 'Mars 10th aspect'
    };

    const input = createDashaFixture({ aspects: [testAspect] });
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const receivedEv = saturnMD.natal.evidence.find(e => e.type === 'ASPECT_RECEIVED');
    expect(receivedEv).toBeDefined();
    expect(receivedEv?.planets).toContain(Planet.MARS);
  });

  it('shouldPreserveYogaParticipation', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.JUPITER, Planet.MOON],
      houses: [4, 2],
      evidence: [],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDashaFixture({ yogas: [yoga] });
    const report = analyzeDashaInterpretation(input);

    const jupiterMD = report.mahadashas.find(md => md.planet === Planet.JUPITER)!;
    expect(jupiterMD.natal.yogaParticipation.length).toBe(1);
    expect(jupiterMD.natal.yogaParticipation[0].yogaType).toBe(YogaType.GAJA_KESARI);

    const yogaEv = jupiterMD.natal.evidence.find(e => e.type === 'YOGA');
    expect(yogaEv).toBeDefined();
  });

  it('shouldNotInventYogaActivation', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.JUPITER, Planet.MOON],
      houses: [4, 2],
      evidence: [],
      assessment: {
        formationPresent: true,
        strength: YogaStrengthLevel.STRONG,
        finalStatus: 'STRONG',
        confidence: 'HIGH'
      }
    };

    const input = createDashaFixture({ yogas: [yoga] });
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    expect(saturnMD.natal.yogaParticipation.length).toBe(0);
  });

  it('shouldPreserveCancelledYoga', () => {
    const yoga = {
      type: YogaType.GAJA_KESARI,
      category: YogaCategory.RAJA,
      strength: YogaStrength.STRONG,
      planets: [Planet.SATURN],
      houses: [10],
      evidence: [],
      assessment: {
        formationPresent: false,
        strength: YogaStrengthLevel.WEAK,
        finalStatus: 'CANCELLED',
        confidence: 'LOW'
      }
    };

    const input = createDashaFixture({ yogas: [yoga] });
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    expect(saturnMD.natal.yogaParticipation.length).toBe(1);
    expect(saturnMD.natal.yogaParticipation[0].finalStatus).toBe('CANCELLED');
  });

  it('shouldPreserveHouseDomains', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const domainEv = saturnMD.natal.evidence.find(e => e.type === 'HOUSE_DOMAIN');
    expect(domainEv).toBeDefined();
    expect(domainEv?.statement).toContain('Career');
  });

  it('shouldBuildMahadashaAntardashaRelationship', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const md0 = report.mahadashas[0];
    const ad0 = md0.antardashas[0];

    expect(ad0.pairInterpretation).toBeDefined();
    expect(ad0.pairInterpretation?.mahadashaLord).toBe(md0.planet);
    expect(ad0.pairInterpretation?.antardashaLord).toBe(ad0.planet);
  });

  it('shouldPreserveSharedHouses', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const saturnAD = saturnMD.antardashas.find(ad => ad.planet === Planet.SATURN)!;

    expect(saturnAD.pairInterpretation?.sharedHouses).toEqual([10, 11]);
    const sharedEv = saturnAD.pairInterpretation?.relationshipEvidence.find(e => e.type === 'SHARED_HOUSE');
    expect(sharedEv).toBeDefined();
  });

  it('shouldPreservePlanetaryRelationship', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const md0 = report.mahadashas[0];
    const ad0 = md0.antardashas[0];

    const relEv = ad0.pairInterpretation?.relationshipEvidence.find(e => e.type === 'PLANETARY_RELATIONSHIP');
    expect(relEv).toBeDefined();
  });

  it('shouldHandleIncompleteStrength', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    expect(report.confidence).toBe('MEDIUM');
  });

  it('shouldReturnUndefinedCurrentStateWithoutReferenceDate', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    expect(report.current).toBeUndefined();
  });

  it('shouldResolveExplicitActiveDasha', () => {
    const input = createDashaFixture();
    const targetDate = '2000-01-01T00:00:00.000Z';

    const active = analyzeActiveDasha(input, targetDate);
    const rawActive = getActiveDasha(input.vimshottari, targetDate);

    expect(active).not.toBeNull();
    expect(rawActive).not.toBeNull();

    expect(active?.mahadasha.planet).toBe(rawActive?.mahadasha.planet);
    expect(active?.antardasha.planet).toBe(rawActive?.antardasha.planet);
    expect(active?.pratyantardasha.planet).toBe(rawActive?.pratyantardasha.planet);
    expect(active?.at).toBe(targetDate);
  });

  it('shouldNotUseCurrentSystemTime', () => {
    const input = createDashaFixture();
    const targetDate = '2015-06-15T12:00:00.000Z';

    const active1 = analyzeActiveDasha(input, targetDate);
    const active2 = analyzeActiveDasha(input, targetDate);

    expect(active1).toEqual(active2);
  });

  it('shouldRemainImmutable', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.birthAnchor)).toBe(true);
    expect(Object.isFrozen(report.mahadashas)).toBe(true);
    expect(Object.isFrozen(report.mahadashas[0])).toBe(true);
    expect(Object.isFrozen(report.mahadashas[0].natal)).toBe(true);
    expect(Object.isFrozen(report.mahadashas[0].natal.evidence)).toBe(true);
  });

  it('shouldNotMutateInput', () => {
    const input = createDashaFixture();
    const inputCopy = structuredClone(input);

    analyzeDashaInterpretation(input);

    expect(input).toEqual(inputCopy);
  });

  it('shouldBeDeterministic', () => {
    const input = createDashaFixture();

    const report1 = analyzeDashaInterpretation(input);
    const report2 = analyzeDashaInterpretation(input);

    expect(report1).toEqual(report2);
  });

  it('shouldRejectMissingInput', () => {
    expect(() => analyzeDashaInterpretation(null as any)).toThrow(TypeError);
    expect(() => analyzeDashaInterpretation(undefined as any)).toThrow(TypeError);
  });

  it('shouldRejectMissingPlanetInterpretation', () => {
    const input = createDashaFixture();
    const invalidInput = { ...input, planetInterpretation: undefined as any };
    expect(() => analyzeDashaInterpretation(invalidInput)).toThrow(TypeError);
  });

  it('shouldRejectMissingFunctionalRoles', () => {
    const input = createDashaFixture();
    const invalidInput = { ...input, functionalRoles: undefined as any };
    expect(() => analyzeDashaInterpretation(invalidInput)).toThrow(TypeError);
  });

  it('shouldRejectMissingHouseInterpretation', () => {
    const input = createDashaFixture();
    const invalidInput = { ...input, houseInterpretation: undefined as any };
    expect(() => analyzeDashaInterpretation(invalidInput)).toThrow(TypeError);
  });

  it('shouldRejectMissingPlanetAnalysis', () => {
    const input = createDashaFixture();
    const invalidInput = { ...input, planetAnalysis: undefined as any };
    expect(() => analyzeDashaInterpretation(invalidInput)).toThrow(TypeError);
  });

  it('shouldRejectMalformedTimeline', () => {
    const input = createDashaFixture();
    const invalidTimelineInput = {
      ...input,
      vimshottari: {
        ...input.vimshottari,
        mahadashas: []
      }
    };
    expect(() => analyzeDashaInterpretation(invalidTimelineInput)).toThrow(TypeError);
  });

  it('shouldConsumeHouseInterpretationEvidence', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const expectedHouseEvidence = input.houseInterpretation.houses[saturnMD.natal.house].evidence;

    expect(saturnMD.natal.houseEvidence).toEqual(expectedHouseEvidence);
    expect(saturnMD.natal.houseEvidence.length).toBeGreaterThan(0);
  });

  it('shouldPreferHouseInterpretationOverStaticDomain', () => {
    const input = createDashaFixture();
    const report = analyzeDashaInterpretation(input);

    const saturnMD = report.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const domainEv = saturnMD.natal.evidence.find(e => e.type === 'HOUSE_DOMAIN');
    expect(domainEv).toBeDefined();
    expect(domainEv?.source).toBe('House Interpretation');

    const inputWithoutHouseInterp = {
      ...input,
      houseInterpretation: { houses: {} as any }
    };
    const fallbackReport = analyzeDashaInterpretation(inputWithoutHouseInterp);
    const fallbackSaturnMD = fallbackReport.mahadashas.find(md => md.planet === Planet.SATURN)!;
    const fallbackDomainEv = fallbackSaturnMD.natal.evidence.find(e => e.type === 'HOUSE_DOMAIN');
    expect(fallbackDomainEv).toBeDefined();
    expect(fallbackDomainEv?.source).toBe('House Domain Metadata');
  });

  it('shouldComputeHighConfidenceWithoutPlanetaryStrengthInput', () => {
    const input = createDashaFixture();
    const planetsWithAvailableStrength = Object.fromEntries(
      Object.entries(input.planetInterpretation.planets).map(([p, interp]) => [
        p,
        {
          ...interp,
          strength: {
            availability: 'AVAILABLE' as const,
            score: 100
          }
        }
      ])
    ) as any;
    const inputNoStrength = {
      ...input,
      planetInterpretation: {
        ...input.planetInterpretation,
        planets: planetsWithAvailableStrength
      },
      planetaryStrength: undefined
    };
    const report = analyzeDashaInterpretation(inputNoStrength);
    expect(report.confidence).toBe('HIGH');
  });

  it('shouldReturnMediumConfidenceForIncompleteStrength', () => {
    const input = createDashaFixture();
    const incompletePlanetInterp = {
      ...input.planetInterpretation,
      planets: {
        ...input.planetInterpretation.planets,
        [Planet.SUN]: {
          ...input.planetInterpretation.planets[Planet.SUN],
          strength: {
            ...input.planetInterpretation.planets[Planet.SUN].strength,
            availability: 'INCOMPLETE' as const
          }
        }
      }
    };
    const inputIncomplete = {
      ...input,
      planetInterpretation: incompletePlanetInterp
    };
    const report = analyzeDashaInterpretation(inputIncomplete);
    expect(report.confidence).toBe('MEDIUM');
  });

  it('shouldRejectMalformedTimelineDates', () => {
    const input = createDashaFixture();
    const badDateInput = {
      ...input,
      vimshottari: {
        ...input.vimshottari,
        mahadashas: [
          {
            ...input.vimshottari.mahadashas[0],
            start: 'not-a-date'
          },
          ...input.vimshottari.mahadashas.slice(1)
        ]
      }
    };
    expect(() => analyzeDashaInterpretation(badDateInput)).toThrow(/invalid Mahadasha date/);
  });

  it('shouldRejectNonContiguousTimeline', () => {
    const input = createDashaFixture();

    const mds = structuredClone(input.vimshottari.mahadashas) as any[];
    mds[0].end = '1998-01-01T00:00:00.000Z';
    const lastADIndex = mds[0].antardashas.length - 1;
    mds[0].antardashas[lastADIndex].end = '1998-01-01T00:00:00.000Z';
    const lastPDIndex = mds[0].antardashas[lastADIndex].pratyantardashas.length - 1;
    mds[0].antardashas[lastADIndex].pratyantardashas[lastPDIndex].end = '1998-01-01T00:00:00.000Z';

    const gapMDInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mds }
    };
    expect(() => analyzeDashaInterpretation(gapMDInput)).toThrow(/non-contiguous Mahadasha boundaries/);

    const mdsAD = structuredClone(input.vimshottari.mahadashas) as any[];
    mdsAD[0].antardashas[0].end = '1991-01-01T00:00:00.000Z';
    const lastAD0PD = mdsAD[0].antardashas[0].pratyantardashas.length - 1;
    mdsAD[0].antardashas[0].pratyantardashas[lastAD0PD].end = '1991-01-01T00:00:00.000Z';

    const gapADInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsAD }
    };
    expect(() => analyzeDashaInterpretation(gapADInput)).toThrow(/non-contiguous Antardasha boundaries/);

    const mdsPD = structuredClone(input.vimshottari.mahadashas) as any[];
    mdsPD[0].antardashas[0].pratyantardashas[0].end = '1990-02-01T00:00:00.000Z';
    const gapPDInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsPD }
    };
    expect(() => analyzeDashaInterpretation(gapPDInput)).toThrow(/non-contiguous Pratyantardasha boundaries/);
  });

  it('shouldValidateInputInActiveDashaApi', () => {
    const input = createDashaFixture();
    const missingFieldInput = { ...input, planetInterpretation: undefined as any };
    expect(() => analyzeActiveDasha(missingFieldInput, '2020-01-01')).toThrow(TypeError);

    const badTimelineInput = {
      ...input,
      vimshottari: {
        ...input.vimshottari,
        mahadashas: []
      }
    };
    expect(() => analyzeActiveDasha(badTimelineInput, '2020-01-01')).toThrow(TypeError);
  });

  it('shouldComputeActiveDashaConfidenceFromAllThreeLevels', () => {
    const input = createDashaFixture();
    const activeAt = '1995-01-01T00:00:00.000Z';
    const baseActive = analyzeActiveDasha(input, activeAt)!;
    expect(baseActive).not.toBeNull();

    const mdLord = baseActive.mahadasha.planet;

    // Make all 3 planets HIGH -> activeConfidence HIGH
    const highPlanets = Object.fromEntries(
      Object.entries(input.planetInterpretation.planets).map(([p, interp]) => [
        p,
        {
          ...interp,
          strength: { availability: 'AVAILABLE' as const, score: 100 }
        }
      ])
    ) as any;
    const highInput = {
      ...input,
      planetInterpretation: { ...input.planetInterpretation, planets: highPlanets }
    };
    expect(analyzeActiveDasha(highInput, activeAt)?.confidence).toBe('HIGH');

    // Downgrade MD lord to INCOMPLETE -> activeConfidence MEDIUM
    const mediumPlanets = {
      ...highPlanets,
      [mdLord]: {
        ...highPlanets[mdLord],
        strength: { availability: 'INCOMPLETE' as const, score: 50 }
      }
    };
    const mediumInput = {
      ...input,
      planetInterpretation: { ...input.planetInterpretation, planets: mediumPlanets }
    };
    expect(analyzeActiveDasha(mediumInput, activeAt)?.confidence).toBe('MEDIUM');
  });

  it('shouldDowngradeActiveConfidenceWhenOnlyAntardashaIsIncomplete', () => {
    const input = createDashaFixture();
    const activeAt = '1994-08-15T00:00:00.000Z';

    const highPlanets = Object.fromEntries(
      Object.entries(input.planetInterpretation.planets).map(([p, interp]) => [
        p,
        {
          ...interp,
          strength: { availability: 'AVAILABLE' as const, score: 100 }
        }
      ])
    ) as any;
    const highInput = {
      ...input,
      planetInterpretation: { ...input.planetInterpretation, planets: highPlanets }
    };

    const activeState = getActiveDasha(highInput.vimshottari, activeAt)!;
    expect(activeState).not.toBeNull();

    const mdLord = activeState.mahadasha.planet;
    const adLord = activeState.antardasha.planet;
    const pdLord = activeState.pratyantardasha.planet;

    expect(mdLord).not.toBe(adLord);
    expect(adLord).not.toBe(pdLord);
    expect(mdLord).not.toBe(pdLord);

    const adIncompletePlanets = {
      ...highPlanets,
      [adLord]: {
        ...highPlanets[adLord],
        strength: { availability: 'INCOMPLETE' as const, score: 50 }
      }
    };
    const adIncompleteInput = {
      ...highInput,
      planetInterpretation: { ...highInput.planetInterpretation, planets: adIncompletePlanets }
    };

    const activeReport = analyzeActiveDasha(adIncompleteInput, activeAt)!;
    expect(activeReport).not.toBeNull();
    expect(activeReport.confidence).toBe('MEDIUM');
    expect(activeReport.antardasha.confidence).toBe('MEDIUM');
    expect(activeReport.mahadasha.confidence).toBe('HIGH');
    expect(activeReport.pratyantardasha.confidence).toBe('HIGH');
  });

  it('shouldDowngradeActiveConfidenceWhenOnlyPratyantardashaIsIncomplete', () => {
    const input = createDashaFixture();
    const activeAt = '1994-08-15T00:00:00.000Z';

    const highPlanets = Object.fromEntries(
      Object.entries(input.planetInterpretation.planets).map(([p, interp]) => [
        p,
        {
          ...interp,
          strength: { availability: 'AVAILABLE' as const, score: 100 }
        }
      ])
    ) as any;
    const highInput = {
      ...input,
      planetInterpretation: { ...input.planetInterpretation, planets: highPlanets }
    };

    const activeState = getActiveDasha(highInput.vimshottari, activeAt)!;
    expect(activeState).not.toBeNull();

    const mdLord = activeState.mahadasha.planet;
    const adLord = activeState.antardasha.planet;
    const pdLord = activeState.pratyantardasha.planet;

    expect(mdLord).not.toBe(adLord);
    expect(adLord).not.toBe(pdLord);
    expect(mdLord).not.toBe(pdLord);

    const pdIncompletePlanets = {
      ...highPlanets,
      [pdLord]: {
        ...highPlanets[pdLord],
        strength: { availability: 'INCOMPLETE' as const, score: 50 }
      }
    };
    const pdIncompleteInput = {
      ...highInput,
      planetInterpretation: { ...highInput.planetInterpretation, planets: pdIncompletePlanets }
    };

    const activeReport = analyzeActiveDasha(pdIncompleteInput, activeAt)!;
    expect(activeReport).not.toBeNull();
    expect(activeReport.confidence).toBe('MEDIUM');
    expect(activeReport.pratyantardasha.confidence).toBe('MEDIUM');
    expect(activeReport.mahadasha.confidence).toBe('HIGH');
    expect(activeReport.antardasha.confidence).toBe('HIGH');
  });

  it('shouldRejectAntardashaSequenceNotCoveringMahadasha', () => {
    const input = createDashaFixture();

    const mdsStart = structuredClone(input.vimshottari.mahadashas) as any[];
    mdsStart[0].antardashas[0].start = '1980-01-05T00:00:00.000Z';
    const badStartInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsStart }
    };
    expect(() => analyzeDashaInterpretation(badStartInput)).toThrow(/Antardasha sequence does not start at Mahadasha start/);

    const mdsEnd = structuredClone(input.vimshottari.mahadashas) as any[];
    const lastAD = mdsEnd[0].antardashas.length - 1;
    mdsEnd[0].antardashas[lastAD].end = '1998-01-01T00:00:00.000Z';
    const badEndInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsEnd }
    };
    expect(() => analyzeDashaInterpretation(badEndInput)).toThrow(/Antardasha sequence does not end at Mahadasha end/);
  });

  it('shouldRejectPratyantardashaSequenceNotCoveringAntardasha', () => {
    const input = createDashaFixture();

    const mdsStart = structuredClone(input.vimshottari.mahadashas) as any[];
    mdsStart[0].antardashas[0].pratyantardashas[0].start = '1980-01-05T00:00:00.000Z';
    const badStartInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsStart }
    };
    expect(() => analyzeDashaInterpretation(badStartInput)).toThrow(/Pratyantardasha sequence does not start at Antardasha start/);

    const mdsEnd = structuredClone(input.vimshottari.mahadashas) as any[];
    const lastPD = mdsEnd[0].antardashas[0].pratyantardashas.length - 1;
    mdsEnd[0].antardashas[0].pratyantardashas[lastPD].end = '1982-01-01T00:00:00.000Z';
    const badEndInput = {
      ...input,
      vimshottari: { ...input.vimshottari, mahadashas: mdsEnd }
    };
    expect(() => analyzeDashaInterpretation(badEndInput)).toThrow(/Pratyantardasha sequence does not end at Antardasha end/);
  });

  it('shouldAnalyzeCanonicalChartDashaInterpretation', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.dashaInterpretation).toBeDefined();

    const report = horoscope.dashaInterpretation;
    expect(report.mahadashas.length).toBe(horoscope.vimshottari.mahadashas.length);
    expect(report.birthAnchor.nakshatra).toBe(horoscope.vimshottari.nakshatra);

    const activeAtBirth = analyzeActiveDasha(
      {
        vimshottari: horoscope.vimshottari,
        planetInterpretation: horoscope.planetInterpretation,
        houseInterpretation: horoscope.houseInterpretation,
        functionalRoles: horoscope.functionalRoles,
        natalGrahaDrishti: (horoscope.natalGrahaDrishti ?? { aspects: [] }) as any,
        yogas: horoscope.yogas,
        planetAnalysis: horoscope.planetAnalysis,
        planetaryStrength: horoscope.planetaryStrength
      },
      CANONICAL_BIRTH_DETAILS.dateTimeStr
    );

    expect(activeAtBirth).not.toBeNull();
    expect(activeAtBirth?.mahadasha.planet).toBe(horoscope.vimshottari.mahadashas[0].planet);
  });
});
