import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  ChartType,
  Chart,
  Position,
  DignityStatus,
  PlanetFacts,
  PlanetFact,
  Element,
  Modality,
  Gender,
  Polarity,
  Nakshatra,
  Pada,
  PlanetCondition
} from '../../types';
import { analyzeDivisionalInterpretation } from './divisionalInterpretation';
import { DivisionalInterpretationInput } from './divisionalInterpretationTypes';
import { calculateHoroscope } from '../astroEngine';
import { calculateSign, calculateWholeSignHouse } from '../chartMath';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

function createDummyChart(
  type: ChartType,
  ascendantSign: Sign = Sign.ARIES,
  ascendantLongitude: number = 0,
  planetLongitudes?: Partial<Record<Planet, number>>
): Chart {
  const allPlanets = Object.values(Planet);
  const defaultLongitudes: Record<Planet, number> = {
    [Planet.SUN]: 15,
    [Planet.MOON]: 45,
    [Planet.MARS]: 75,
    [Planet.MERCURY]: 105,
    [Planet.JUPITER]: 135,
    [Planet.VENUS]: 165,
    [Planet.SATURN]: 195,
    [Planet.RAHU]: 225,
    [Planet.KETU]: 45
  };

  const positions = {} as Record<Planet, any>;
  for (const p of allPlanets) {
    const lon = planetLongitudes?.[p] ?? defaultLongitudes[p];
    positions[p] = {
      planet: p,
      eclipticLongitude: lon,
      longitude: lon,
      sign: calculateSign(lon),
      house: calculateWholeSignHouse(ascendantSign, calculateSign(lon)),
      signLongitude: lon % 30,
      eclipticLatitude: 0,
      motion: { speed: 1, retrograde: false, stationary: false }
    };
  }

  return {
    type,
    chartType: type,
    ascendantSign,
    ascendantLongitude,
    positions: positions as Record<Planet, Position>
  } as unknown as Chart;
}

function createDummyFact(planet: Planet, house: number, sign: Sign = Sign.ARIES): PlanetFact {
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
      endDegree: 13.3333,
      deity: 'Ashvins',
      symbol: 'Horse head'
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
    }
  };
}

function createDummyInput(overrides?: Partial<DivisionalInterpretationInput>): DivisionalInterpretationInput {
  const allPlanets = Object.values(Planet);

  const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
  for (const p of allPlanets) {
    planetFacts[p] = createDummyFact(p, 1, Sign.ARIES);
  }

  const defaultInput: DivisionalInterpretationInput = {
    d1Chart: createDummyChart(ChartType.RASI, Sign.ARIES, 0),
    d9Chart: createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0),
    d10Chart: createDummyChart(ChartType.DASAMSA, Sign.ARIES, 0),
    planetFacts,
    planetInterpretation: { planets: {} as any },
    functionalRoles: { ascendantSign: Sign.ARIES, badhakaHouse: 11, badhakaLord: Planet.SATURN, planets: {} as any }
  };

  return { ...defaultInput, ...overrides };
}

describe('P-18 Divisional Interpretation Engine', () => {
  describe('Input Validation', () => {
    it('should throw TypeError if input is null or undefined', () => {
      expect(() => analyzeDivisionalInterpretation(null as any)).toThrow(
        TypeError
      );
      expect(() => analyzeDivisionalInterpretation(null as any)).toThrow(
        'Divisional interpretation input must not be null or undefined.'
      );
      expect(() => analyzeDivisionalInterpretation(undefined as any)).toThrow(
        'Divisional interpretation input must not be null or undefined.'
      );
    });

    it('should throw TypeError if top-level properties are missing', () => {
      const base = createDummyInput();

      const requiredProps: Array<keyof DivisionalInterpretationInput> = [
        'd1Chart',
        'd9Chart',
        'd10Chart',
        'planetFacts',
        'planetInterpretation',
        'functionalRoles'
      ];

      for (const prop of requiredProps) {
        const invalidInput = { ...base, [prop]: undefined };
        expect(() => analyzeDivisionalInterpretation(invalidInput as any)).toThrow(
          `Divisional interpretation input is missing required property: ${prop}.`
        );
      }
    });

    it('should throw TypeError if chartType is invalid', () => {
      const inputWrongD1 = createDummyInput({
        d1Chart: createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0)
      });
      expect(() => analyzeDivisionalInterpretation(inputWrongD1)).toThrow(
        'Invalid d1Chart chartType. Expected RASI.'
      );

      const inputWrongD9 = createDummyInput({
        d9Chart: createDummyChart(ChartType.RASI, Sign.ARIES, 0)
      });
      expect(() => analyzeDivisionalInterpretation(inputWrongD9)).toThrow(
        'Invalid d9Chart chartType. Expected NAVAMSA.'
      );

      const inputWrongD10 = createDummyInput({
        d10Chart: createDummyChart(ChartType.RASI, Sign.ARIES, 0)
      });
      expect(() => analyzeDivisionalInterpretation(inputWrongD10)).toThrow(
        'Invalid d10Chart chartType. Expected DASAMSA.'
      );
    });

    it('should throw TypeError if chart ascendant is invalid', () => {
      const invalidLonD1 = createDummyInput({
        d1Chart: { ...createDummyChart(ChartType.RASI, Sign.ARIES, -10) }
      });
      expect(() => analyzeDivisionalInterpretation(invalidLonD1)).toThrow(
        'd1Chart has invalid ascendantLongitude.'
      );

      const invalidSignD9 = createDummyInput({
        d9Chart: { ...createDummyChart(ChartType.NAVAMSA, 'INVALID_SIGN' as any, 10) }
      });
      expect(() => analyzeDivisionalInterpretation(invalidSignD9)).toThrow(
        'd9Chart has invalid ascendantSign.'
      );
    });

    it('should throw TypeError if a planet is missing or has invalid longitude in varga charts', () => {
      const base = createDummyInput();
      const badD9Positions = { ...base.d9Chart.positions };
      delete (badD9Positions as any)[Planet.SUN];

      const inputMissingD9Planet = {
        ...base,
        d9Chart: { ...base.d9Chart, positions: badD9Positions }
      };
      expect(() => analyzeDivisionalInterpretation(inputMissingD9Planet as any)).toThrow(
        'd9Chart is missing required planet: SUN.'
      );

      const invalidLonD9Positions = {
        ...base.d9Chart.positions,
        [Planet.SUN]: {
          planet: Planet.SUN,
          eclipticLongitude: 400,
          longitude: 400,
          sign: Sign.TAURUS,
          house: 2,
          signLongitude: 10,
          eclipticLatitude: 0,
          motion: { speed: 1, retrograde: false, stationary: false }
        }
      };
      const inputInvalidLonD9 = {
        ...base,
        d9Chart: { ...base.d9Chart, positions: invalidLonD9Positions }
      };
      expect(() => analyzeDivisionalInterpretation(inputInvalidLonD9 as any)).toThrow(
        'd9Chart has invalid eclipticLongitude for SUN.'
      );
    });
  });

  describe('D1 Independence and Varga Logic', () => {
    it('shouldTreatD9HousesIndependentlyFromD1', () => {
      // D1 ascendant Aries, Sun at 15° (Aries, House 1 in D1)
      const d1Chart = createDummyChart(ChartType.RASI, Sign.ARIES, 0, { [Planet.SUN]: 15 });
      // D9 ascendant Taurus, Sun at 15° (Aries, House 12 relative to Taurus ascendant in D9)
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.TAURUS, 30, { [Planet.SUN]: 15 });
      const d10Chart = createDummyChart(ChartType.DASAMSA, Sign.ARIES, 0);

      const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
      for (const p of Object.values(Planet)) {
        planetFacts[p] = createDummyFact(p, p === Planet.SUN ? 1 : 2, p === Planet.SUN ? Sign.ARIES : Sign.TAURUS);
      }

      const input = createDummyInput({ d1Chart, d9Chart, d10Chart, planetFacts });
      const report = analyzeDivisionalInterpretation(input);

      expect(report.d9.planets[Planet.SUN].house).toBe(12);
      expect(report.d9.planets[Planet.SUN].sign).toBe(Sign.ARIES);
      expect(report.d9.planets[Planet.SUN].d1Anchor.house).toBe(1);
    });

    it('shouldTreatD10HousesIndependentlyFromD1', () => {
      // D1 ascendant Aries, Sun at 15° (Aries, House 1 in D1)
      const d1Chart = createDummyChart(ChartType.RASI, Sign.ARIES, 0, { [Planet.SUN]: 15 });
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0);
      // D10 ascendant Gemini, Sun at 15° (Aries, House 11 relative to Gemini ascendant in D10)
      const d10Chart = createDummyChart(ChartType.DASAMSA, Sign.GEMINI, 60, { [Planet.SUN]: 15 });

      const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
      for (const p of Object.values(Planet)) {
        planetFacts[p] = createDummyFact(p, 1, Sign.ARIES);
      }

      const input = createDummyInput({ d1Chart, d9Chart, d10Chart, planetFacts });
      const report = analyzeDivisionalInterpretation(input);

      expect(report.d10.planets[Planet.SUN].house).toBe(11);
      expect(report.d10.planets[Planet.SUN].sign).toBe(Sign.ARIES);
      expect(report.d10.planets[Planet.SUN].d1Anchor.house).toBe(1);
    });

    it('shouldNotCopyD1FunctionalRoleIntoVarga', () => {
      const input = createDummyInput();
      const report = analyzeDivisionalInterpretation(input);

      const sunD9 = report.d9.planets[Planet.SUN];
      expect(sunD9.d1Anchor.functionalRoles).toBeDefined();

      // Varga evidence must not contain D1 functional roles as varga evidence statements or rules
      const funcRoleEvidence = sunD9.evidence.filter((e) => e.statement.includes('Functional'));
      expect(funcRoleEvidence.length).toBe(0);
    });

    it('shouldNotProjectD1DrishtiIntoD9OrD10', () => {
      const input = createDummyInput();
      const report = analyzeDivisionalInterpretation(input);

      const d9AspectEvidence = report.d9.evidence.filter(
        (e) => e.statement.includes('aspect') || e.statement.includes('Drishti')
      );
      expect(d9AspectEvidence.length).toBe(0);

      const d10AspectEvidence = report.d10.evidence.filter(
        (e) => e.statement.includes('aspect') || e.statement.includes('Drishti')
      );
      expect(d10AspectEvidence.length).toBe(0);
    });

    it('shouldNotProjectD1YogaIntoVargas', () => {
      const input = createDummyInput();
      const report = analyzeDivisionalInterpretation(input);

      expect(report.d9.yogasAvailability).toBe('NOT_CALCULATED');
      expect(report.d10.yogasAvailability).toBe('NOT_CALCULATED');

      const yogaEvidence = report.d9.evidence.filter((e) => e.statement.toLowerCase().includes('yoga'));
      expect(yogaEvidence.length).toBe(0);
    });

    it('shouldDetectVargottama', () => {
      // Sun at 15° Aries in D1, Sun at 15° Aries in D9 -> same sign Aries -> Vargottama
      const d1Chart = createDummyChart(ChartType.RASI, Sign.ARIES, 0, { [Planet.SUN]: 15 });
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0, { [Planet.SUN]: 15 });
      const d10Chart = createDummyChart(ChartType.DASAMSA, Sign.ARIES, 0, { [Planet.SUN]: 45 }); // Taurus in D10

      const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
      for (const p of Object.values(Planet)) {
        planetFacts[p] = createDummyFact(p, 1, p === Planet.SUN ? Sign.ARIES : Sign.TAURUS);
      }

      const input = createDummyInput({ d1Chart, d9Chart, d10Chart, planetFacts });
      const report = analyzeDivisionalInterpretation(input);

      const sunComp = report.d1Comparisons[Planet.SUN];
      expect(sunComp.isD9Vargottama).toBe(true);
      expect(sunComp.isD10Vargottama).toBe(false);
      const vargottamaEv = sunComp.evidence.find((e) => e.ruleId === 'D9_VARGOTTAMA_001');
      expect(vargottamaEv).toBeDefined();
      expect(vargottamaEv?.effect).toBe('NEUTRAL');
    });

    it('shouldNotBeVargottamaWhenSignsDiffer', () => {
      // Sun in Aries in D1, Sun in Taurus (45°) in D9
      const d1Chart = createDummyChart(ChartType.RASI, Sign.ARIES, 0, { [Planet.SUN]: 15 });
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0, { [Planet.SUN]: 45 });
      const d10Chart = createDummyChart(ChartType.DASAMSA, Sign.ARIES, 0, { [Planet.SUN]: 45 });

      const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
      for (const p of Object.values(Planet)) {
        planetFacts[p] = createDummyFact(p, 1, Sign.ARIES);
      }

      const input = createDummyInput({ d1Chart, d9Chart, d10Chart, planetFacts });
      const report = analyzeDivisionalInterpretation(input);

      const sunComp = report.d1Comparisons[Planet.SUN];
      expect(sunComp.isD9Vargottama).toBe(false);
      expect(sunComp.isD10Vargottama).toBe(false);
      const vargottamaEv = sunComp.evidence.find((e) => e.ruleId === 'D9_VARGOTTAMA_001');
      expect(vargottamaEv).toBeUndefined();
    });

    it('shouldConstructAscendantAndHouseLords', () => {
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.LEO, 125);
      const input = createDummyInput({ d9Chart });
      const report = analyzeDivisionalInterpretation(input);

      expect(report.d9.ascendant.sign).toBe(Sign.LEO);
      expect(report.d9.ascendant.eclipticLongitude).toBe(125);
      // Leo ascendant: House 1 lord = Sun, House 9 lord = Mars, House 10 lord = Venus
      expect(report.d9.houseLords[1]).toBe(Planet.SUN);
      expect(report.d9.houseLords[9]).toBe(Planet.MARS);
      expect(report.d9.houseLords[10]).toBe(Planet.VENUS);
    });

    it('shouldUseDivisionalLongitudeForVargaPlacement', () => {
      // D9 Mars at 15° Aries
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0, { [Planet.MARS]: 15 });
      const input = createDummyInput({ d9Chart });
      const report = analyzeDivisionalInterpretation(input);

      expect(report.d9.planets[Planet.MARS].sign).toBe(Sign.ARIES);
      expect(report.d9.planets[Planet.MARS].dignity).toBe(DignityStatus.OWN_SIGN);
    });

    it('shouldKeepD1AnchorIndependentFromVargaPlacement', () => {
      // D1 Mars in Cancer (Debilitated, House 4)
      const planetFacts: Record<Planet, PlanetFact> = {} as Record<Planet, PlanetFact>;
      for (const p of Object.values(Planet)) {
        planetFacts[p] = createDummyFact(
          p,
          p === Planet.MARS ? 4 : 1,
          p === Planet.MARS ? Sign.CANCER : Sign.ARIES
        );
      }
      planetFacts[Planet.MARS].dignity = {
        planet: Planet.MARS,
        sign: Sign.CANCER,
        status: DignityStatus.DEBILITATED
      };

      // D9 Mars in Aries (Own Sign, House 1)
      const d9Chart = createDummyChart(ChartType.NAVAMSA, Sign.ARIES, 0, { [Planet.MARS]: 15 });

      const input = createDummyInput({ d9Chart, planetFacts });
      const report = analyzeDivisionalInterpretation(input);

      const marsD9 = report.d9.planets[Planet.MARS];
      expect(marsD9.sign).toBe(Sign.ARIES);
      expect(marsD9.dignity).toBe(DignityStatus.OWN_SIGN);

      // D1 Anchor retains D1 state
      expect(marsD9.d1Anchor.sign).toBe(Sign.CANCER);
      expect(marsD9.d1Anchor.house).toBe(4);
      expect(marsD9.d1Anchor.dignity).toBe(DignityStatus.DEBILITATED);
    });

    it('shouldEnsureImmutabilityAndFrozenObjects', () => {
      const input = createDummyInput();
      const report = analyzeDivisionalInterpretation(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.d9)).toBe(true);
      expect(Object.isFrozen(report.d10)).toBe(true);
      expect(Object.isFrozen(report.d1Comparisons)).toBe(true);
      expect(Object.isFrozen(report.d9.planets)).toBe(true);
      expect(Object.isFrozen(report.d9.houses)).toBe(true);
      expect(Object.isFrozen(report.d9.evidence)).toBe(true);
      expect(Object.isFrozen(report.d1Comparisons[Planet.SUN])).toBe(true);
    });

    it('shouldNotMutateInput', () => {
      const input = createDummyInput();
      const inputCopy = JSON.parse(JSON.stringify(input));

      analyzeDivisionalInterpretation(input);

      expect(JSON.parse(JSON.stringify(input))).toEqual(inputCopy);
    });

    it('shouldBeDeterministic', () => {
      const input = createDummyInput();
      const report1 = analyzeDivisionalInterpretation(input);
      const report2 = analyzeDivisionalInterpretation(input);

      expect(report1).toEqual(report2);
    });
  });

  describe('Integration with Full Horoscope', () => {
    it('shouldConsumeExistingD9AndD10ChartPositionsWithoutRecalculation', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      for (const planet of Object.values(Planet)) {
        expect(horoscope.divisionalInterpretation.d9.planets[planet].eclipticLongitude)
          .toBe(horoscope.charts[ChartType.NAVAMSA].positions[planet].eclipticLongitude);
        expect(horoscope.divisionalInterpretation.d10.planets[planet].eclipticLongitude)
          .toBe(horoscope.charts[ChartType.DASAMSA].positions[planet].eclipticLongitude);
      }
    });

    it('shouldIncludeDivisionalInterpretationInHoroscope', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      expect(horoscope.divisionalInterpretation).toBeDefined();
      expect(horoscope.divisionalInterpretation.d9).toBeDefined();
      expect(horoscope.divisionalInterpretation.d10).toBeDefined();
      expect(horoscope.divisionalInterpretation.d1Comparisons).toBeDefined();

      expect(horoscope.divisionalInterpretation.d9.ascendant.sign).toBe(
        horoscope.charts[ChartType.NAVAMSA].ascendantSign
      );
      expect(horoscope.divisionalInterpretation.d10.ascendant.sign).toBe(
        horoscope.charts[ChartType.DASAMSA].ascendantSign
      );

      for (const p of Object.values(Planet)) {
        expect(horoscope.divisionalInterpretation.d9.planets[p]).toBeDefined();
        expect(horoscope.divisionalInterpretation.d10.planets[p]).toBeDefined();
        expect(horoscope.divisionalInterpretation.d1Comparisons[p]).toBeDefined();
      }

      const navamsa = horoscope.charts[ChartType.NAVAMSA];
      expect(horoscope.divisionalInterpretation.d9.planets[Planet.SUN].sign)
        .toBe(calculateSign(navamsa.positions[Planet.SUN].eclipticLongitude));
      const dasamsa = horoscope.charts[ChartType.DASAMSA];
      expect(horoscope.divisionalInterpretation.d10.planets[Planet.SATURN].house)
        .toBe(calculateWholeSignHouse(dasamsa.ascendantSign, calculateSign(dasamsa.positions[Planet.SATURN].eclipticLongitude)));
    });
  });
});
