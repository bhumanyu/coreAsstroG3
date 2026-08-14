import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  DignityStatus,
  PlanetCondition,
  ShadbalaAggregationStatus,
  Nakshatra,
  Pada,
  PlanetFact,
  PlanetFacts,
  PlanetaryStrengthReport,
  NatalGrahaDrishtiReport,
  AspectType
} from '../../types';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../../data/astroData';
import {
  YogaType,
  YogaCategory,
  YogaStrength,
  YogaResult,
  YogaAnalysisInput,
  YogaStrengthLevel
} from './yogaTypes';
import { evaluateYogaModifiers } from './yogaModifiers';
import { FunctionalRole, FunctionalRoleAnalysisReport } from '../functionalNature/functionalRoles';

function createDummyFact(
  planet: Planet,
  house: number,
  sign: Sign,
  condition = PlanetCondition.NORMAL,
  dignityStatus = DignityStatus.NEUTRAL
): PlanetFact {
  return {
    planet,
    position: {
      planet,
      eclipticLongitude: 0,
      eclipticLatitude: 0,
      longitude: 0,
      sign,
      house,
      signLongitude: 0,
      motion: { speed: 1, retrograde: false, stationary: false }
    },
    sign,
    signMetadata: SIGNS_METADATA[sign],
    nakshatraResult: { planet, nakshatra: NAKSHATRAS_METADATA[0], pada: 1, longitude: 0, padaLongitude: 0, degreeInPada: 0 },
    nakshatraMetadata: NAKSHATRAS_METADATA[0],
    state: { planet, motion: { speed: 1, retrograde: false, stationary: false }, condition },
    dignity: { planet, sign, status: dignityStatus },
    house
  };
}

function createDummyYogaResult(planets: Planet[] = [Planet.MOON, Planet.JUPITER]): YogaResult {
  return Object.freeze({
    type: YogaType.GAJA_KESARI,
    category: YogaCategory.PROSPERITY,
    strength: YogaStrength.STRONG,
    planets: Object.freeze(planets),
    houses: Object.freeze([1, 4]),
    evidence: Object.freeze([
      Object.freeze({
        ruleId: 'YOGA_GAJA_KESARI_001',
        reason: 'Moon and Jupiter in Kendra',
        planets: Object.freeze(planets),
        houses: Object.freeze([1, 4])
      })
    ])
  });
}

describe('yogaModifiers', () => {
  it('shouldNotReturnStrongByDefault', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(assessment.formationPresent).toBe(true);
    expect(assessment.strength).toBe(YogaStrengthLevel.MODERATE);
    expect(assessment.finalStatus).toBe('PRESENT');
    expect(assessment.supportingFactors).toHaveLength(0);
    expect(assessment.weakeningFactors).toHaveLength(0);
    expect(assessment.cancellationFactors).toHaveLength(0);
  });

  it('shouldNotCancelYogaFromWeakeningFactorAlone', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.SCORPIO, PlanetCondition.NORMAL, DignityStatus.DEBILITATED),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CAPRICORN, PlanetCondition.NORMAL, DignityStatus.DEBILITATED)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(assessment.cancellationFactors).toHaveLength(0);
    expect(assessment.weakeningFactors.length).toBeGreaterThan(0);
    expect(assessment.finalStatus).toBe('WEAKENED');
    expect(assessment.finalStatus).not.toBe('CANCELLED');
  });

  it('shouldRemainDeterministicWhenShadbalaIncomplete', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER)
      } as Record<Planet, PlanetFact>,
      planetaryStrength: {
        at: '2026-01-01',
        planets: {
          [Planet.MOON]: { planet: Planet.MOON, shadbala: { status: ShadbalaAggregationStatus.INCOMPLETE } },
          [Planet.JUPITER]: { planet: Planet.JUPITER, shadbala: { status: ShadbalaAggregationStatus.INCOMPLETE } }
        }
      } as unknown as PlanetaryStrengthReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const strengthMods = assessment.supportingFactors.filter(m => m.source === 'PLANETARY_STRENGTH');
    expect(strengthMods).toHaveLength(0);
    expect(assessment.strength).toBe(YogaStrengthLevel.MODERATE);
    expect(assessment.confidence).toBe('LOW');
  });

  it('shouldUseFunctionalRoleAsEvidence', () => {
    const yoga = createDummyYogaResult([Planet.MARS, Planet.JUPITER]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MARS]: createDummyFact(Planet.MARS, 1, Sign.LEO),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 5, Sign.SAGITTARIUS)
      } as unknown as Record<Planet, PlanetFact>,
      functionalRoles: {
        ascendantSign: Sign.LEO,
        badhakaHouse: 9,
        badhakaLord: Planet.MARS,
        planets: {
          [Planet.MARS]: {
            planet: Planet.MARS,
            isYogakaraka: true,
            roles: [FunctionalRole.YOGAKARAKA, FunctionalRole.KENDRA_LORD, FunctionalRole.TRIKONA_LORD],
            ownedHouses: [4, 9],
            evidence: []
          },
          [Planet.JUPITER]: {
            planet: Planet.JUPITER,
            isYogakaraka: false,
            roles: [FunctionalRole.TRIKONA_LORD],
            ownedHouses: [5, 8],
            evidence: []
          }
        }
      } as unknown as FunctionalRoleAnalysisReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const roleMods = assessment.supportingFactors.filter(m => m.source === 'FUNCTIONAL_ROLE');
    expect(roleMods.length).toBeGreaterThanOrEqual(1);
    expect(roleMods.some(m => m.planets.includes(Planet.MARS))).toBe(true);
  });

  it('shouldNotTreatEveryKendraOrLagnaLordAsGenericYogaSupport', () => {
    const yoga = createDummyYogaResult([Planet.MERCURY, Planet.JUPITER]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MERCURY]: createDummyFact(Planet.MERCURY, 1, Sign.GEMINI),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.SAGITTARIUS)
      } as unknown as Record<Planet, PlanetFact>,
      functionalRoles: {
        ascendantSign: Sign.GEMINI,
        badhakaHouse: 7,
        badhakaLord: Planet.JUPITER,
        planets: {
          [Planet.MERCURY]: {
            planet: Planet.MERCURY,
            isYogakaraka: false,
            roles: [FunctionalRole.LAGNA_LORD, FunctionalRole.KENDRA_LORD],
            ownedHouses: [1, 4],
            evidence: []
          },
          [Planet.JUPITER]: {
            planet: Planet.JUPITER,
            isYogakaraka: false,
            roles: [FunctionalRole.KENDRA_LORD],
            ownedHouses: [7, 10],
            evidence: []
          }
        }
      } as unknown as FunctionalRoleAnalysisReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const roleMods = assessment.supportingFactors.filter(m => m.source === 'FUNCTIONAL_ROLE');
    expect(roleMods).toHaveLength(0);
  });

  it('shouldUseNatalGrahaDrishtiForQualifyingAffliction', () => {
    const yoga = createDummyYogaResult([Planet.MOON, Planet.JUPITER]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER),
        [Planet.SATURN]: createDummyFact(Planet.SATURN, 7, Sign.LIBRA)
      } as Record<Planet, PlanetFact>,
      natalGrahaDrishti: {
        aspects: [
          {
            sourcePlanet: Planet.SATURN,
            targetPlanet: Planet.MOON,
            sourceHouse: 7,
            targetHouse: 1,
            sourceSign: Sign.LIBRA,
            targetSign: Sign.ARIES,
            houseOffset: 6,
            aspectType: AspectType.FULL_7TH,
            description: 'Saturn in House 7 casts 7th aspect on Moon in House 1.',
            reason: 'Saturn 7th aspect'
          }
        ]
      } as NatalGrahaDrishtiReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const drishtiMod = assessment.weakeningFactors.find(m => m.ruleId === 'YOGA_AFFLICTION_GRAHA_DRISHTI_001');
    expect(drishtiMod).toBeDefined();
    expect(drishtiMod!.planets).toEqual([Planet.SATURN, Planet.MOON]);
    expect(drishtiMod!.type).toBe('AFFLICTION');
  });

  it('shouldNotTreatEveryNatalAspectAsAffliction', () => {
    const yoga = createDummyYogaResult([Planet.MOON, Planet.MARS]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.MARS]: createDummyFact(Planet.MARS, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 5, Sign.LEO)
      } as Record<Planet, PlanetFact>,
      natalGrahaDrishti: {
        aspects: [
          {
            sourcePlanet: Planet.JUPITER,
            targetPlanet: Planet.MOON,
            sourceHouse: 5,
            targetHouse: 1,
            sourceSign: Sign.LEO,
            targetSign: Sign.ARIES,
            houseOffset: 8,
            aspectType: AspectType.SPECIAL_9TH,
            description: 'Jupiter in House 5 casts 9th aspect on Moon in House 1.',
            reason: 'Jupiter 9th aspect'
          }
        ]
      } as NatalGrahaDrishtiReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const drishtiMods = assessment.weakeningFactors.filter(m => m.ruleId === 'YOGA_AFFLICTION_GRAHA_DRISHTI_001');
    expect(drishtiMods).toHaveLength(0);
  });

  it('shouldReturnNoCancellationWhenNoApplicableRuleExists', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(assessment.cancellationFactors).toEqual([]);
  });

  it('shouldDetectDignitySupportAndCombustionWeakening', () => {
    const yoga = createDummyYogaResult([Planet.SUN, Planet.MERCURY]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.SUN]: createDummyFact(Planet.SUN, 1, Sign.ARIES, PlanetCondition.NORMAL, DignityStatus.EXALTED),
        [Planet.MERCURY]: createDummyFact(Planet.MERCURY, 1, Sign.ARIES, PlanetCondition.COMBUST, DignityStatus.NEUTRAL)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    const dignityMod = assessment.supportingFactors.find(m => m.ruleId === 'YOGA_SUPPORT_DIGNITY_001');
    const combustionMod = assessment.weakeningFactors.find(m => m.ruleId === 'YOGA_MODIFIER_COMBUSTION_001');

    expect(dignityMod).toBeDefined();
    expect(dignityMod!.planets).toEqual([Planet.SUN]);
    expect(combustionMod).toBeDefined();
    expect(combustionMod!.planets).toEqual([Planet.MERCURY]);
  });

  it('shouldMaintainLegacyStrengthPropertyWhileAssessmentStrengthMayDiffer', () => {
    const yoga = createDummyYogaResult([Planet.MOON, Planet.JUPITER]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.SCORPIO, PlanetCondition.NORMAL, DignityStatus.DEBILITATED),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CAPRICORN, PlanetCondition.NORMAL, DignityStatus.DEBILITATED)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(yoga.strength).toBe(YogaStrength.STRONG);
    expect(assessment.strength).toBe(YogaStrengthLevel.VERY_WEAK);
    expect(assessment.finalStatus).toBe('WEAKENED');
  });

  it('shouldBeImmutable', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.TAURUS, PlanetCondition.NORMAL, DignityStatus.EXALTED),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER, PlanetCondition.NORMAL, DignityStatus.EXALTED)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(Object.isFrozen(assessment)).toBe(true);
    expect(Object.isFrozen(assessment.supportingFactors)).toBe(true);
    expect(Object.isFrozen(assessment.weakeningFactors)).toBe(true);
    expect(Object.isFrozen(assessment.cancellationFactors)).toBe(true);
    if (assessment.supportingFactors.length > 0) {
      expect(Object.isFrozen(assessment.supportingFactors[0])).toBe(true);
    }
  });

  it('shouldBeInputImmutableViaStructuredClone', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.ARIES),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER)
      } as unknown as Record<Planet, PlanetFact>
    };

    const clonedInput = structuredClone(input);
    const assessment1 = evaluateYogaModifiers(yoga, input);

    clonedInput.planetFacts[Planet.MOON].dignity.status = DignityStatus.DEBILITATED;
    const assessment2 = evaluateYogaModifiers(yoga, input);

    expect(assessment1).toEqual(assessment2);
  });

  it('shouldNotNeutralizeSingleMajorSupportWithMinorWeakeningToPresent', () => {
    const yoga = createDummyYogaResult([Planet.SUN, Planet.MERCURY]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.SUN]: createDummyFact(Planet.SUN, 1, Sign.ARIES, PlanetCondition.NORMAL, DignityStatus.EXALTED),
        [Planet.MERCURY]: createDummyFact(Planet.MERCURY, 1, Sign.ARIES, PlanetCondition.NORMAL, DignityStatus.NEUTRAL),
        [Planet.SATURN]: createDummyFact(Planet.SATURN, 7, Sign.LIBRA)
      } as Record<Planet, PlanetFact>,
      natalGrahaDrishti: {
        aspects: [
          {
            sourcePlanet: Planet.SATURN,
            targetPlanet: Planet.SUN,
            sourceHouse: 7,
            targetHouse: 1,
            sourceSign: Sign.LIBRA,
            targetSign: Sign.ARIES,
            houseOffset: 6,
            aspectType: AspectType.FULL_7TH,
            description: 'Saturn in House 7 casts 7th aspect on Sun in House 1.',
            reason: 'Saturn 7th aspect'
          }
        ]
      } as NatalGrahaDrishtiReport
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(assessment.supportingFactors.some(f => f.category === 'MAJOR_SUPPORT')).toBe(true);
    expect(assessment.weakeningFactors.some(f => f.category === 'MINOR_WEAKENING')).toBe(true);
    expect(assessment.weakeningFactors.some(f => f.category === 'MAJOR_WEAKENING')).toBe(false);
    expect(assessment.strength).toBe(YogaStrengthLevel.STRONG);
    expect(assessment.finalStatus).toBe('STRONG');
    expect(assessment.finalStatus).not.toBe('PRESENT');
  });

  it('shouldMajorWeakeningOverrideMajorSupportForFinalStatus', () => {
    const yoga = createDummyYogaResult([Planet.MOON, Planet.JUPITER]);
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.TAURUS, PlanetCondition.NORMAL, DignityStatus.EXALTED),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CAPRICORN, PlanetCondition.NORMAL, DignityStatus.DEBILITATED)
      } as unknown as Record<Planet, PlanetFact>
    };

    const assessment = evaluateYogaModifiers(yoga, input);
    expect(assessment.supportingFactors.length).toBeGreaterThanOrEqual(1);
    expect(assessment.supportingFactors.some(f => f.category === 'MAJOR_SUPPORT')).toBe(true);
    expect(assessment.weakeningFactors.length).toBeGreaterThanOrEqual(1);
    expect(assessment.weakeningFactors.some(f => f.category === 'MAJOR_WEAKENING')).toBe(true);
    expect(assessment.finalStatus).toBe('WEAKENED');
    expect(assessment.strength).toBe(YogaStrengthLevel.WEAK);
  });

  it('shouldBeDeterministicAcrossMultipleRuns', () => {
    const yoga = createDummyYogaResult();
    const input: YogaAnalysisInput = {
      planetFacts: {
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, Sign.TAURUS, PlanetCondition.NORMAL, DignityStatus.EXALTED),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, Sign.CANCER, PlanetCondition.NORMAL, DignityStatus.EXALTED)
      } as unknown as Record<Planet, PlanetFact>
    };

    const run1 = evaluateYogaModifiers(yoga, input);
    const run2 = evaluateYogaModifiers(yoga, input);
    expect(run1).toEqual(run2);
  });
});
