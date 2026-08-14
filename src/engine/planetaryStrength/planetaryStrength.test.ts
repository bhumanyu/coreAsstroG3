import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  AyanamsaType,
  DignityStatus,
  PlanetCondition,
  PlanetFacts,
  PlanetFact,
  Nakshatra,
  Pada,
  ShadbalaComponent,
  ShadbalaSubcomponent,
  ShadbalaAggregationStatus,
  StrengthComponentStatus,
  PlanetaryStrengthInput,
  Relationship
} from '../../types';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../../data/astroData';
import {
  analyzePlanetaryStrength,
  buildShadbalaEvidence,
  NAISARGIKA_BALA_SHASTIAMSA,
  SAPTAVARGAJA_VARGAS,
  circularDistance,
  houseOffset,
  compoundRelationship
} from './planetaryStrength';
import { calculateShadbala } from './shadbala';

function createMockPlanetFacts(customMap?: Partial<Record<Planet, { house: number; eclipticLongitude: number; dignityStatus?: DignityStatus }>>): Record<Planet, PlanetFact> {
  const defaultMap: Record<Planet, { house: number; eclipticLongitude: number; dignityStatus?: DignityStatus }> = {
    [Planet.SUN]: { house: 10, eclipticLongitude: 10 },        // Aries 10° (Exaltation for Sun)
    [Planet.MOON]: { house: 4, eclipticLongitude: 213 },       // Scorpio 3° (Debilitation for Moon)
    [Planet.MARS]: { house: 10, eclipticLongitude: 208 },       // Libra 28°
    [Planet.MERCURY]: { house: 1, eclipticLongitude: 165 },    // Virgo 15°
    [Planet.JUPITER]: { house: 1, eclipticLongitude: 95 },     // Cancer 5°
    [Planet.VENUS]: { house: 4, eclipticLongitude: 357 },     // Pisces 27°
    [Planet.SATURN]: { house: 7, eclipticLongitude: 200 },     // Libra 20°
    [Planet.RAHU]: { house: 8, eclipticLongitude: 45 },
    [Planet.KETU]: { house: 2, eclipticLongitude: 225 }
  };

  const map = { ...defaultMap, ...customMap };

  const result: Partial<Record<Planet, PlanetFact>> = {};
  for (const p of Object.values(Planet)) {
    const house = map[p].house;
    const eclipticLongitude = map[p].eclipticLongitude;
    const signIndex = Math.floor(eclipticLongitude / 30);
    const sign = Object.values(Sign)[signIndex];
    const dignityStatus = map[p].dignityStatus || DignityStatus.NEUTRAL;

    result[p] = ({
      planet: p,
      position: {
        planet: p,
        eclipticLongitude,
        eclipticLatitude: 0,
        motion: { speed: 1, retrograde: false, stationary: false }
      },
      sign,
      signMetadata: SIGNS_METADATA[sign],
      nakshatraResult: { nakshatra: Nakshatra.ASHWINI, pada: Pada.FIRST, padaNumber: 1 },
      nakshatraMetadata: NAKSHATRAS_METADATA[0],
      state: { planet: p, motion: { speed: 1, retrograde: false, stationary: false }, condition: PlanetCondition.NORMAL },
      dignity: { planet: p, sign, status: dignityStatus },
      house
    }) as any;
  }
  return result as Record<Planet, PlanetFact>;
}

function createControlledInput(customMap?: Partial<Record<Planet, { house: number; eclipticLongitude: number; dignityStatus?: DignityStatus }>>): PlanetaryStrengthInput {
  return { planetFacts: createMockPlanetFacts(customMap) };
}

describe('Planetary Strength Engine (P-07 Complete Sthana Bala)', () => {
  describe('1. Uchcha Bala', () => {
    it('shouldCalculateUchchaBalaAtDebilitationExaltationAndMidpoint', () => {
      const input = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 190 },  // Sun at debilitation -> 0
        [Planet.MOON]: { house: 1, eclipticLongitude: 33 },   // Moon at exaltation -> 60
        [Planet.MARS]: { house: 1, eclipticLongitude: 208 }   // Mars at 208° -> 30
      });

      const report = analyzePlanetaryStrength(input);

      const sunUchcha = report.planets[Planet.SUN].components.find(
        c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA
      );
      expect(sunUchcha?.value).toBe(0);

      const moonUchcha = report.planets[Planet.MOON].components.find(
        c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA
      );
      expect(moonUchcha?.value).toBe(60);

      const marsUchcha = report.planets[Planet.MARS].components.find(
        c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA
      );
      expect(marsUchcha?.value).toBe(30);
    });

    it('shouldHandleWrapAroundNear0And360Degrees', () => {
      const input = createControlledInput({
        [Planet.SATURN]: { house: 1, eclipticLongitude: 350 }
      });

      const report = analyzePlanetaryStrength(input);
      const saturnUchcha = report.planets[Planet.SATURN].components.find(
        c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA
      );
      expect(saturnUchcha?.value).toBe(10);
    });
  });

  describe('2. Saptavargaja Bala', () => {
    it('shouldUseExactlySevenVargasAndExcludeD10', () => {
      expect(SAPTAVARGAJA_VARGAS).toEqual(['D1', 'D2', 'D3', 'D7', 'D9', 'D12', 'D30']);
      expect(SAPTAVARGAJA_VARGAS).not.toContain('D10');

      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of Object.values(Planet)) {
        const psEv = report.planets[p].evidence.find(
          e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
        );
        if (p === Planet.RAHU || p === Planet.KETU) {
          expect(psEv?.ruleId).toBe('SHADBALA_SAPTAVARGAJA_BALA_NOT_IMPLEMENTED');
          continue;
        }
        expect(psEv?.inputs).toBeDefined();
        expect(psEv?.inputs?.D10_sign).toBeUndefined();
        expect(psEv?.inputs?.D10_category).toBeUndefined();
        expect(psEv?.inputs?.D10_points).toBeUndefined();

        for (const v of SAPTAVARGAJA_VARGAS) {
          expect(psEv?.inputs?.[`${v}_sign`]).toBeDefined();
          expect(psEv?.inputs?.[`${v}_category`]).toBeDefined();
          expect(psEv?.inputs?.[`${v}_points`]).toBeDefined();
        }
      }
    });

    it('shouldDirectlyTestCompoundRelationshipHelperForAllFiveTiers', () => {
      // 1. Friend + Temp Friend -> GREAT_FRIEND (22.5)
      expect(compoundRelationship(Relationship.FRIEND, true)).toEqual({
        category: 'GREAT_FRIEND',
        points: 22.5
      });
      // 2. Friend + Temp Enemy -> NEUTRAL (7.5)
      expect(compoundRelationship(Relationship.FRIEND, false)).toEqual({
        category: 'NEUTRAL',
        points: 7.5
      });
      // 3. Neutral + Temp Friend -> FRIEND (15.0)
      expect(compoundRelationship(Relationship.NEUTRAL, true)).toEqual({
        category: 'FRIEND',
        points: 15.0
      });
      // 4. Neutral + Temp Enemy -> ENEMY (3.75)
      expect(compoundRelationship(Relationship.NEUTRAL, false)).toEqual({
        category: 'ENEMY',
        points: 3.75
      });
      // 5. Enemy + Temp Friend -> NEUTRAL (7.5)
      expect(compoundRelationship(Relationship.ENEMY, true)).toEqual({
        category: 'NEUTRAL',
        points: 7.5
      });
      // 6. Enemy + Temp Enemy -> GREAT_ENEMY (1.875)
      expect(compoundRelationship(Relationship.ENEMY, false)).toEqual({
        category: 'GREAT_ENEMY',
        points: 1.875
      });
    });

    it('shouldCalculateCompoundRelationshipsInSaptavargajaForControlledPlacements', () => {
      // Great Friend (22.5): Mars at Leo (125° - Sun-ruled), Sun at Libra (200° - 3rd house from Leo -> Temp Friend)
      const inputGF = createControlledInput({
        [Planet.MARS]: { house: 5, eclipticLongitude: 125 },
        [Planet.SUN]: { house: 7, eclipticLongitude: 200 }
      });
      const reportGF = analyzePlanetaryStrength(inputGF);
      const evGF = reportGF.planets[Planet.MARS].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evGF?.inputs?.D1_category).toBe('GREAT_FRIEND');
      expect(evGF?.inputs?.D1_points).toBe(22.5);

      // Friend (15.0): Saturn at Sagittarius (245° - Jupiter-ruled), Jupiter at Aquarius (305° - 3rd house from Sag -> Temp Friend)
      const inputF = createControlledInput({
        [Planet.SATURN]: { house: 9, eclipticLongitude: 245 },
        [Planet.JUPITER]: { house: 11, eclipticLongitude: 305 }
      });
      const reportF = analyzePlanetaryStrength(inputF);
      const evF = reportF.planets[Planet.SATURN].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evF?.inputs?.D1_category).toBe('FRIEND');
      expect(evF?.inputs?.D1_points).toBe(15.0);

      // Neutral (7.5): Mars at Leo (125° - Sun-ruled), Sun at Leo (125° - 1st house -> Temp Enemy)
      const inputN = createControlledInput({
        [Planet.MARS]: { house: 5, eclipticLongitude: 125 },
        [Planet.SUN]: { house: 5, eclipticLongitude: 125 }
      });
      const reportN = analyzePlanetaryStrength(inputN);
      const evN = reportN.planets[Planet.MARS].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evN?.inputs?.D1_category).toBe('NEUTRAL');
      expect(evN?.inputs?.D1_points).toBe(7.5);

      // Enemy (3.75): Saturn at Sagittarius (245° - Jupiter-ruled), Jupiter at Aries (5° - 5th house from Sag -> Temp Enemy)
      const inputE = createControlledInput({
        [Planet.SATURN]: { house: 9, eclipticLongitude: 245 },
        [Planet.JUPITER]: { house: 1, eclipticLongitude: 5 }
      });
      const reportE = analyzePlanetaryStrength(inputE);
      const evE = reportE.planets[Planet.SATURN].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evE?.inputs?.D1_category).toBe('ENEMY');
      expect(evE?.inputs?.D1_points).toBe(3.75);

      // Great Enemy (1.875): Sun at Capricorn (275° - Saturn-ruled), Saturn at Taurus (35° - 5th house from Cap -> Temp Enemy)
      const inputGE = createControlledInput({
        [Planet.SUN]: { house: 10, eclipticLongitude: 275 },
        [Planet.SATURN]: { house: 2, eclipticLongitude: 35 }
      });
      const reportGE = analyzePlanetaryStrength(inputGE);
      const evGE = reportGE.planets[Planet.SUN].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evGE?.inputs?.D1_category).toBe('GREAT_ENEMY');
      expect(evGE?.inputs?.D1_points).toBe(1.875);
    });

    it('shouldMatchD1SaptavargajaDignityWithP03Dignity', () => {
      // Sun at Leo 5° -> Moolatrikona in P-03
      const inputMoo = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 125, dignityStatus: DignityStatus.MOOLATRIKONA }
      });
      const reportMoo = analyzePlanetaryStrength(inputMoo);
      const evMoo = reportMoo.planets[Planet.SUN].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evMoo?.inputs?.D1_category).toBe('MOOLATRIKONA');
      expect(evMoo?.inputs?.D1_points).toBe(45.0);

      // Sun at Leo 20° -> Own sign in P-03
      const inputOwn = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 140, dignityStatus: DignityStatus.OWN_SIGN }
      });
      const reportOwn = analyzePlanetaryStrength(inputOwn);
      const evOwn = reportOwn.planets[Planet.SUN].evidence.find(
        e => e.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(evOwn?.inputs?.D1_category).toBe('OWN_SIGN');
      expect(evOwn?.inputs?.D1_points).toBe(30.0);
    });
  });

  describe('3. Oja-Yugma Bala', () => {
    it('shouldCalculateOjaYugmaBalaForOddAndEvenGroups', () => {
      // Sun (Odd-preferring): Sun in Aries (1, Odd) -> +15, Navamsa in Aries (Odd) -> +15 -> 30
      // Sun in Taurus (2, Even) -> +0, Navamsa in Capricorn (Even) -> +0 -> 0
      const inputMax = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 1 }, // Aries 1° -> D1 Aries (Odd), D9 Aries (Odd)
        [Planet.VENUS]: { house: 1, eclipticLongitude: 31 } // Taurus 1° -> D1 Taurus (Even), D9 Capricorn (Even)
      });
      const reportMax = analyzePlanetaryStrength(inputMax);

      const sunOja = reportMax.planets[Planet.SUN].components.find(
        c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA
      );
      expect(sunOja?.value).toBe(30);

      const venOja = reportMax.planets[Planet.VENUS].components.find(
        c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA
      );
      expect(venOja?.value).toBe(30);

      const inputMin = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 31 }, // D1 Taurus (Even), D9 Capricorn (Even) -> 0 for Sun
        [Planet.VENUS]: { house: 1, eclipticLongitude: 1 } // D1 Aries (Odd), D9 Aries (Odd) -> 0 for Venus
      });
      const reportMin = analyzePlanetaryStrength(inputMin);

      expect(reportMin.planets[Planet.SUN].components.find(c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA)?.value).toBe(0);
      expect(reportMin.planets[Planet.VENUS].components.find(c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA)?.value).toBe(0);
    });
  });

  describe('4. Kendradi Bala', () => {
    it('shouldCalculateKendradiBalaForKendraPanaparaAndApoklimaHouses', () => {
      const input = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 10 },    // Kendra -> 60
        [Planet.MOON]: { house: 5, eclipticLongitude: 213 },  // Panapara -> 30
        [Planet.MARS]: { house: 9, eclipticLongitude: 208 }   // Apoklima -> 15
      });
      const report = analyzePlanetaryStrength(input);

      expect(report.planets[Planet.SUN].components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA)?.value).toBe(60);
      expect(report.planets[Planet.MOON].components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA)?.value).toBe(30);
      expect(report.planets[Planet.MARS].components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA)?.value).toBe(15);
    });

    it('shouldCalculateKendradiBalaForAll12Houses', () => {
      for (let h = 1; h <= 12; h++) {
        const input = createControlledInput({
          [Planet.SUN]: { house: h, eclipticLongitude: 10 }
        });
        const report = analyzePlanetaryStrength(input);
        const val = report.planets[Planet.SUN].components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA)?.value;
        if ([1, 4, 7, 10].includes(h)) {
          expect(val).toBe(60);
        } else if ([2, 5, 8, 11].includes(h)) {
          expect(val).toBe(30);
        } else {
          expect(val).toBe(15);
        }
      }
    });
  });

  describe('5. Drekkana Bala', () => {
    it('shouldCalculateDrekkanaBalaForMaleNeutralFemaleGroupsAndBoundaryCases', () => {
      // Male group (Sun): prefers Drekkana 1 (0..10°) -> 15
      // Neutral group (Mercury): prefers Drekkana 2 (10..20°) -> 15
      // Female group (Moon): prefers Drekkana 3 (20..30°) -> 15

      const input1 = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 5 },      // Drekkana 1 (5°) -> 15
        [Planet.MERCURY]: { house: 1, eclipticLongitude: 15 }, // Drekkana 2 (15°) -> 15
        [Planet.MOON]: { house: 1, eclipticLongitude: 25 }     // Drekkana 3 (25°) -> 15
      });
      const report1 = analyzePlanetaryStrength(input1);

      expect(report1.planets[Planet.SUN].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(15);
      expect(report1.planets[Planet.MERCURY].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(15);
      expect(report1.planets[Planet.MOON].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(15);

      // Test exact boundary points: 10.0° is Drekkana 2, 20.0° is Drekkana 3
      const inputBoundary = createControlledInput({
        [Planet.SUN]: { house: 1, eclipticLongitude: 10.0 },     // 10.0° = Drekkana 2 -> 0 for Sun
        [Planet.MERCURY]: { house: 1, eclipticLongitude: 10.0 }, // 10.0° = Drekkana 2 -> 15 for Mercury
        [Planet.MOON]: { house: 1, eclipticLongitude: 20.0 }     // 20.0° = Drekkana 3 -> 15 for Moon
      });
      const reportBoundary = analyzePlanetaryStrength(inputBoundary);

      expect(reportBoundary.planets[Planet.SUN].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(0);
      expect(reportBoundary.planets[Planet.MERCURY].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(15);
      expect(reportBoundary.planets[Planet.MOON].components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value).toBe(15);
    });
  });

  describe('6. Sthana Bala Total Aggregation', () => {
    it('shouldAggregateSthanaBalaTotalWhenAllFiveSubcomponentsCalculated', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of [Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN]) {
        const ps = report.planets[p];
        const uchcha = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA)?.value || 0;
        const sap = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA)?.value || 0;
        const oja = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA)?.value || 0;
        const ken = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA)?.value || 0;
        const drek = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA)?.value || 0;

        const aggregate = ps.components.find(
          c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.STHANA_BALA
        );

        expect(aggregate?.status).toBe(StrengthComponentStatus.CALCULATED);
        const expectedTotal = Number((uchcha + sap + oja + ken + drek).toFixed(2));
        expect(aggregate?.value).toBe(expectedTotal);
      }
    });

    it('shouldNotEmitSthanaBalaTotalForNodesWithUnimplementedSubcomponents', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const node of [Planet.RAHU, Planet.KETU]) {
        const ps = report.planets[node];
        const aggregate = ps.components.find(
          c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.STHANA_BALA
        );
        expect(aggregate).toBeUndefined();

        const aggEv = ps.evidence.find(
          e => e.component === ShadbalaComponent.STHANA_BALA && e.subcomponent === ShadbalaSubcomponent.STHANA_BALA
        );
        expect(aggEv).toBeUndefined();
      }
    });

    it('shouldGenericallyNotEmitSthanaBalaTotalIfAnyOfTheFiveSubcomponentsIsNotCalculated', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      const sthanaSubcomponents = [
        ShadbalaSubcomponent.UCHCHA_BALA,
        ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
        ShadbalaSubcomponent.OJA_YUGMA_BALA,
        ShadbalaSubcomponent.KENDRADI_BALA,
        ShadbalaSubcomponent.DREKKANA_BALA
      ];

      for (const p of Object.values(Planet)) {
        const ps = report.planets[p];
        const calculatedSubs = ps.components.filter(
          c => c.component === ShadbalaComponent.STHANA_BALA &&
               c.subcomponent &&
               sthanaSubcomponents.includes(c.subcomponent) &&
               c.status === StrengthComponentStatus.CALCULATED
        );

        const sthanaAggregate = ps.components.find(
          c => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.STHANA_BALA
        );

        if (calculatedSubs.length < 5) {
          expect(sthanaAggregate).toBeUndefined();
          const sthanaEv = ps.evidence.find(
            e => e.component === ShadbalaComponent.STHANA_BALA && e.subcomponent === ShadbalaSubcomponent.STHANA_BALA
          );
          expect(sthanaEv).toBeUndefined();
        } else {
          expect(sthanaAggregate).toBeDefined();
          expect(sthanaAggregate?.status).toBe(StrengthComponentStatus.CALCULATED);
        }
      }
    });
  });

  describe('7. Rahu and Ketu Explicit Policy', () => {
    it('shouldHandleRahuExplicitlyAndKetuExplicitly', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const node of [Planet.RAHU, Planet.KETU]) {
        const ps = report.planets[node];
        expect(ps).toBeDefined();

        const kendradi = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA);
        expect(kendradi?.status).toBe(StrengthComponentStatus.CALCULATED);

        const uchcha = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA);
        expect(uchcha?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);

        const sap = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA);
        expect(sap?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);

        const oja = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA);
        expect(oja?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);

        const drek = ps.components.find(c => c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA);
        expect(drek?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      }
    });
  });

  describe('8. Architecture Boundaries & Total Shadbala', () => {
    it('shouldNotCalculateTotalShadbala', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of Object.values(Planet)) {
        expect(report.planets[p].calculatedTotal).toBeUndefined();
        expect(report.planets[p].unit).toBeUndefined();
      }
    });

    it('shouldNotContainInterpretationFields', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of Object.values(Planet)) {
        const ps = report.planets[p] as any;
        expect(ps.interpretation).toBeUndefined();
        expect(ps.description).toBeUndefined();
        expect(ps.summary).toBeUndefined();
      }
    });

    it('shouldReturnDeterministicReport', () => {
      const input = createControlledInput();
      const report1 = analyzePlanetaryStrength(input);
      const report2 = analyzePlanetaryStrength(input);
      expect(report1).toEqual(report2);
    });
  });

  describe('9. Immutability & Input Validation', () => {
    it('shouldNotMutateInputs', () => {
      const input = createControlledInput();
      const inputCopy = JSON.parse(JSON.stringify(input));
      analyzePlanetaryStrength(input);
      expect(JSON.parse(JSON.stringify(input))).toEqual(inputCopy);
    });

    it('shouldBeImmutable', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.planets)).toBe(true);
      expect(Object.isFrozen(report.planets[Planet.SUN])).toBe(true);
      expect(Object.isFrozen(report.planets[Planet.SUN].components)).toBe(true);
      expect(Object.isFrozen(report.planets[Planet.SUN].components[0])).toBe(true);
      expect(Object.isFrozen(report.planets[Planet.SUN].evidence)).toBe(true);
      expect(Object.isFrozen(report.planets[Planet.SUN].evidence[0])).toBe(true);
    });

    it('shouldRejectNullOrUndefinedInput', () => {
      expect(() => analyzePlanetaryStrength(null as any)).toThrow('input must not be null or undefined.');
      expect(() => analyzePlanetaryStrength(undefined as any)).toThrow('input must not be null or undefined.');
    });

    it('shouldRejectMissingRequiredInputs', () => {
      const input = createControlledInput();
      expect(() => analyzePlanetaryStrength({ ...input, planetFacts: null as any })).toThrow('planetFacts must not be null or undefined.');
    });

    it('shouldRejectInvalidEclipticLongitude', () => {
      const input = createControlledInput();
      const badFacts = {
        ...input.planetFacts,
        [Planet.SUN]: {
          ...input.planetFacts[Planet.SUN],
          position: {
            ...input.planetFacts[Planet.SUN].position,
            eclipticLongitude: NaN
          }
        }
      };
      expect(() => analyzePlanetaryStrength({ ...input, planetFacts: badFacts })).toThrow('eclipticLongitude for planet SUN is invalid or missing.');
    });

    it('shouldRejectInvalidHouse', () => {
      const input = createControlledInput();
      const badFacts = {
        ...input.planetFacts,
        [Planet.SUN]: {
          ...input.planetFacts[Planet.SUN],
          house: 13
        }
      };
      expect(() => analyzePlanetaryStrength({ ...input, planetFacts: badFacts })).toThrow('house for planet SUN must be an integer between 1 and 12.');
    });

    it('shouldCalculateCheshtaBalaForClassicalSevenPlanets', () => {
      const input = {
        ...createControlledInput(),
        birthDetails: {
          dateTimeStr: '2023-01-01T12:00:00Z',
          latitude: 28.6139,
          longitude: 77.2090,
          timeZone: 'UTC',
          ayanamsa: AyanamsaType.LAHIRI
        }
      };
      const report = analyzePlanetaryStrength(input);

      const classicalSeven = [
        Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
      ];

      for (const p of classicalSeven) {
        const str = report.planets[p];
        const comp = str.components.find(c => c.component === ShadbalaComponent.CHESHTA_BALA);
        expect(comp).toBeDefined();
        expect(comp?.status).toBe(StrengthComponentStatus.CALCULATED);
        expect(typeof comp?.value).toBe('number');
        expect(comp?.value).toBeGreaterThanOrEqual(0);
        expect(comp?.value).toBeLessThanOrEqual(60);
      }

      const nodes = [Planet.RAHU, Planet.KETU];
      for (const node of nodes) {
        const str = report.planets[node];
        const comp = str.components.find(c => c.component === ShadbalaComponent.CHESHTA_BALA);
        expect(comp).toBeDefined();
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
        expect(comp?.value).toBeUndefined();
      }
    });

    it('shouldCalculateDrikBalaForSevenClassicalPlanets', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      const classicalSeven = [
        Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
      ];

      for (const p of classicalSeven) {
        const str = report.planets[p];
        const comp = str.components.find(c => c.component === ShadbalaComponent.DRIK_BALA);
        expect(comp).toBeDefined();
        expect(comp?.status).toBe(StrengthComponentStatus.CALCULATED);
        expect(comp?.subcomponent).toBe(ShadbalaSubcomponent.DRIK_BALA);
        expect(typeof comp?.value).toBe('number');
        expect(Number.isFinite(comp?.value)).toBe(true);

        const ev = str.evidence.find(e => e.component === ShadbalaComponent.DRIK_BALA);
        expect(ev).toBeDefined();
        expect(ev?.ruleId).toBe('SHADBALA_DRIK_BALA_001');
        expect(ev?.details).toBeDefined();
        expect(typeof ev?.details?.beneficTotal).toBe('number');
        expect(typeof ev?.details?.maleficTotal).toBe('number');
        expect(typeof ev?.details?.netValue).toBe('number');
        expect(ev?.details?.netValue).toBe(comp?.value);
        expect(Array.isArray(ev?.details?.contributions)).toBe(true);
        expect(ev?.details?.contributions.length).toBeGreaterThan(0);

        for (const contrib of ev!.details!.contributions) {
          expect(contrib.targetPlanet).toBe(p);
          expect(typeof contrib.sourcePlanet).toBe('string');
          expect(typeof contrib.sourceLongitude).toBe('number');
          expect(typeof contrib.targetLongitude).toBe('number');
          expect(typeof contrib.aspectAngle).toBe('number');
          expect(typeof contrib.sphutaValue).toBe('number');
          expect(['BENEFIC', 'MALEFIC']).toContain(contrib.naturalClassification);
          expect([1.25, 0.75]).toContain(contrib.rectificationFactor);
          expect(typeof contrib.rectifiedValue).toBe('number');
          expect(contrib.ruleId).toBe(`DRIK_CONTRIBUTION_${contrib.sourcePlanet}`);
          expect(typeof contrib.reason).toBe('string');
        }
      }

      const nodes = [Planet.RAHU, Planet.KETU];
      for (const node of nodes) {
        const str = report.planets[node];
        const comp = str.components.find(c => c.component === ShadbalaComponent.DRIK_BALA);
        expect(comp).toBeDefined();
        expect(comp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
        expect(comp?.value).toBeUndefined();

        const ev = str.evidence.find(e => e.component === ShadbalaComponent.DRIK_BALA);
        expect(ev).toBeDefined();
        expect(ev?.ruleId).toBe('SHADBALA_DRIK_BALA_NOT_IMPLEMENTED');
        expect(ev?.details).toBeUndefined();
      }
    });

    it('shouldExposeShadbalaAggregation', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      const classicalSeven = [
        Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
      ];

      for (const p of classicalSeven) {
        const str = report.planets[p];
        expect(str.shadbala).toBeDefined();
        expect(str.shadbala?.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
        expect(str.shadbala?.missingComponents).toContain(ShadbalaComponent.KALA_BALA);
        expect(str.shadbala?.totalShastiamsa).toBeUndefined();
      }

      for (const node of [Planet.RAHU, Planet.KETU]) {
        const str = report.planets[node];
        expect(str.shadbala).toBeDefined();
        expect(str.shadbala?.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
        expect(str.shadbala?.missingComponents?.length).toBe(6);
      }
    });

    it('shouldKeepCalculatedTotalUndefinedWhenKalaIsIncomplete', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of Object.values(Planet)) {
        const str = report.planets[p];
        expect(str.calculatedTotal).toBeUndefined();
        expect(str.unit).toBeUndefined();
      }
    });

    it('shouldNotUseKalaCoreAsCompleteKala', () => {
      const input: PlanetaryStrengthInput = {
        planetFacts: createMockPlanetFacts() as unknown as Record<Planet, PlanetFact>,
        birthDetails: {
          dateTimeStr: '2024-01-01T12:00:00Z',
          timeZone: 'UTC',
          latitude: 13.0827,
          longitude: 80.2707,
          ayanamsa: AyanamsaType.LAHIRI
        }
      };
      const report = analyzePlanetaryStrength(input);

      const sun = report.planets[Planet.SUN];
      expect(sun.kalaBalaCoreTotal).toBeDefined();
      expect(typeof sun.kalaBalaCoreTotal).toBe('number');
      expect(sun.completeKalaBala).toBeUndefined();
      expect(sun.calculatedTotal).toBeUndefined();
      expect(sun.shadbala?.missingComponents).toContain(ShadbalaComponent.KALA_BALA);
    });

    it('shouldExposeMissingComponentsWhenIncomplete', () => {
      const input = createControlledInput();
      const report = analyzePlanetaryStrength(input);

      for (const p of [Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN]) {
        const str = report.planets[p];
        expect(str.shadbala?.missingComponents).toBeDefined();
        expect(str.shadbala?.missingComponents?.length).toBeGreaterThan(0);
        expect(str.shadbala?.reason).toContain('incomplete');

        const ev = str.evidence.find(e => e.subcomponent === ShadbalaSubcomponent.SHADBALA_TOTAL);
        expect(ev).toBeDefined();
        expect(ev?.ruleId).toBe('SHADBALA_TOTAL_INCOMPLETE');
        expect(ev?.inputs?.missingComponents).toBeDefined();
      }
    });

    it('shouldDetectYuddhaBalaInPlanetaryStrengthAnalysis', () => {
      const facts = createMockPlanetFacts();
      (facts[Planet.MARS] as any).position.eclipticLongitude = 100.0;
      (facts[Planet.MERCURY] as any).position.eclipticLongitude = 100.4;

      const input: PlanetaryStrengthInput = {
        planetFacts: facts as unknown as Record<Planet, PlanetFact>,
        birthDetails: {
          dateTimeStr: '2024-01-01T12:00:00Z',
          timeZone: 'UTC',
          latitude: 13.0827,
          longitude: 80.2707,
          ayanamsa: AyanamsaType.LAHIRI
        }
      };

      const report = analyzePlanetaryStrength(input);

      const marsStr = report.planets[Planet.MARS];
      const marsYuddhaEv = marsStr.evidence.find(e => e.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
      expect(marsYuddhaEv).toBeDefined();
      expect(marsYuddhaEv?.ruleId).toBe('YUDDHA_BALA_001');
      expect(marsYuddhaEv?.inputs?.opponent).toBe(Planet.MERCURY);
      expect(marsYuddhaEv?.inputs?.separation).toBe(0.4);

      const sunStr = report.planets[Planet.SUN];
      const sunYuddhaEv = sunStr.evidence.find(e => e.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA);
      expect(sunYuddhaEv).toBeDefined();
      expect(sunYuddhaEv?.ruleId).toBe('YUDDHA_BALA_NOT_APPLICABLE');
    });

    it('shouldEmitAllFourEvidenceRuleIdsAndUseSthanaAggregateInCompleteBranch', () => {
      const components = [
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.UCHCHA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 40.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.SAPTAVARGAJA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 80.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.OJA_YUGMA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 30.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.KENDRADI_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 30.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.DREKKANA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 20.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.STHANA_BALA,
          subcomponent: ShadbalaSubcomponent.STHANA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 200.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.DIG_BALA,
          subcomponent: ShadbalaSubcomponent.DIG_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 50.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.KALA_BALA,
          subcomponent: ShadbalaSubcomponent.KALA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 120.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.CHESHTA_BALA,
          subcomponent: ShadbalaSubcomponent.CHESHTA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 40.0,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.NAISARGIKA_BALA,
          subcomponent: ShadbalaSubcomponent.NAISARGIKA_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 34.29,
          unit: 'SHASTIAMSA' as const
        },
        {
          component: ShadbalaComponent.DRIK_BALA,
          subcomponent: ShadbalaSubcomponent.DRIK_BALA,
          status: StrengthComponentStatus.CALCULATED,
          value: 15.0,
          unit: 'SHASTIAMSA' as const
        }
      ];

      const completeKalaBala = 120.0;
      const shadbala = calculateShadbala({
        planet: Planet.JUPITER,
        components,
        completeKalaBala
      });

      expect(shadbala.status).toBe(ShadbalaAggregationStatus.COMPLETE);

      const evidence = buildShadbalaEvidence(Planet.JUPITER, components, completeKalaBala, shadbala);

      expect(evidence.some(e => e.ruleId === 'SHADBALA_TOTAL_001')).toBe(true);
      expect(evidence.some(e => e.ruleId === 'SHADBALA_RUPA_CONVERSION_001')).toBe(true);
      expect(evidence.some(e => e.ruleId === 'SHADBALA_MINIMUM_REQUIREMENT_001')).toBe(true);
      expect(evidence.some(e => e.ruleId === 'SHADBALA_MINIMUM_RATIO_001')).toBe(true);

      const total001 = evidence.find(e => e.ruleId === 'SHADBALA_TOTAL_001');
      expect(total001?.shadbalaDetails?.sthanaBala).toBe(200.0);
      expect(total001?.shadbalaDetails?.sthanaBala).not.toBe(40.0);
      expect(total001?.shadbalaDetails?.digBala).toBe(50.0);
      expect(total001?.shadbalaDetails?.kalaBala).toBe(120.0);
      expect(total001?.shadbalaDetails?.cheshtaBala).toBe(40.0);
      expect(total001?.shadbalaDetails?.naisargikaBala).toBe(34.29);
      expect(total001?.shadbalaDetails?.drikBala).toBe(15.0);
      expect(total001?.shadbalaDetails?.totalShastiamsa).toBe(459.29);
      expect(total001?.shadbalaDetails?.totalRupa).toBe(7.65);
      expect(total001?.shadbalaDetails?.meetsMinimum).toBe(true);

      const rupaEv = evidence.find(e => e.ruleId === 'SHADBALA_RUPA_CONVERSION_001');
      expect(rupaEv?.inputs?.totalShastiamsa).toBe(459.29);
      expect(rupaEv?.inputs?.divisor).toBe(60);
      expect(rupaEv?.inputs?.totalRupa).toBe(7.65);

      const minEv = evidence.find(e => e.ruleId === 'SHADBALA_MINIMUM_REQUIREMENT_001');
      expect(minEv?.inputs?.requiredShastiamsa).toBe(390);
      expect(minEv?.inputs?.requiredRupa).toBe(6.5);

      const ratioEv = evidence.find(e => e.ruleId === 'SHADBALA_MINIMUM_RATIO_001');
      expect(ratioEv?.inputs?.totalShastiamsa).toBe(459.29);
      expect(ratioEv?.inputs?.requiredShastiamsa).toBe(390);
      expect(ratioEv?.inputs?.ratioToMinimum).toBe(1.1777);
      expect(ratioEv?.inputs?.percentageOfMinimum).toBe(117.77);
      expect(ratioEv?.inputs?.meetsMinimum).toBe(true);

      // Verify immutability
      expect(Object.isFrozen(evidence)).toBe(true);
      for (const ev of evidence) {
        expect(Object.isFrozen(ev)).toBe(true);
        if (ev.inputs) expect(Object.isFrozen(ev.inputs)).toBe(true);
        if (ev.shadbalaDetails) expect(Object.isFrozen(ev.shadbalaDetails)).toBe(true);
      }
    });
  });
});
