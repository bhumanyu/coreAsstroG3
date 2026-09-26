import { describe, it, expect } from 'vitest';
import {
  normalizeDegree,
  calculateSign,
  calculateNakshatra,
  calculateJulianDay,
  getAyanamsaOffset,
  calculateAscendant,
  generatePlanetaryPositions,
  calculateHoroscope,
  calculateCombustion
} from './astroEngine';
import { Planet, Sign, Nakshatra, Pada, AyanamsaType, BirthDetails, AspectType, ShadbalaComponent, ShadbalaSubcomponent, StrengthComponentStatus, ShadbalaAggregationStatus, ChartType, PlanetMotion, PlanetPosition } from '../types';
import { House } from './houseLordship/houseGroups';
import { FunctionalRole } from './functionalNature/functionalRoleTypes';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import { YogaType } from './yoga/yogaTypes';
import { LifeTheme } from './lifeThemes/lifeThemeTypes';
import { calculateWholeSignHouse } from './chartMath';

describe('astroEngine', () => {
  it('normalizes degrees correctly into [0, 360)', () => {
    expect(normalizeDegree(370)).toBe(10);
    expect(normalizeDegree(-30)).toBe(330);
    expect(normalizeDegree(0)).toBe(0);
    expect(normalizeDegree(360)).toBe(0);
  });

  it('calculates sign correctly from ecliptic longitude', () => {
    expect(calculateSign(15)).toBe(Sign.ARIES);
    expect(calculateSign(45)).toBe(Sign.TAURUS);
    expect(calculateSign(355)).toBe(Sign.PISCES);
  });

  it('calculates nakshatra and pada correctly', () => {
    const res = calculateNakshatra(0);
    expect(res.nakshatra).toBe(Nakshatra.ASHWINI);
    expect(res.pada).toBe(Pada.FIRST);
  });

  it('calculates Julian Day for May 8, 1988 04:00 UTC', () => {
    const date = new Date('1988-05-08T04:00:00Z');
    const jd = calculateJulianDay(date);
    expect(jd).toBeCloseTo(2447289.66667, 3);
  });

  it('calculates Lahiri ayanamsa offset for 1988', () => {
    const date = new Date('1988-05-08T04:00:00Z');
    const ayanamsa = getAyanamsaOffset(AyanamsaType.LAHIRI, date);
    expect(ayanamsa).toBeGreaterThan(23);
    expect(ayanamsa).toBeLessThan(24);
  });

  it('calculates ascendant for Vaishali test chart', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1988-05-08T09:30:00+05:30',
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI
    };
    const ascDegree = calculateAscendant(birth);
    expect(ascDegree).toBeGreaterThanOrEqual(0);
    expect(ascDegree).toBeLessThan(360);
  });

  it('generates planetary positions and complete horoscope', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1988-05-08T09:30:00+05:30',
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI
    };
    const positions = generatePlanetaryPositions(birth);
    expect(positions[Planet.SUN]).toBeDefined();
    expect(positions[Planet.MOON]).toBeDefined();

    const horoscope = calculateHoroscope(birth);
    expect(horoscope.rasiChart).toBeDefined();
    expect(horoscope.rasiChart.ascendantSign).toBeDefined();
    expect(horoscope.vimshottari).toBeDefined();
    expect(horoscope.vimshottari.mahadashas.length).toBeGreaterThan(0);
    expect(horoscope.houseLordship).toBeDefined();
    expect(horoscope.houseLordship.ascendantSign).toBe(horoscope.rasiChart.ascendantSign);
    expect(horoscope.functionalRoles).toBeDefined();
    expect(horoscope.functionalRoles.planets[Planet.SUN].evidence.length).toBeGreaterThan(0);
    expect(horoscope.yogas).toBeDefined();
  });

  it('detects GAJA_KESARI in calculateHoroscope with custom positions where Moon and Jupiter are in Kendra to each other', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1988-05-08T09:30:00+05:30',
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI
    };
    const basePositions = generatePlanetaryPositions(birth);
    const customPositions = {
      ...basePositions,
      [Planet.MOON]: {
        ...basePositions[Planet.MOON],
        eclipticLongitude: 15 // Aries (house 1 or whatever house Aries corresponds to)
      },
      [Planet.JUPITER]: {
        ...basePositions[Planet.JUPITER],
        eclipticLongitude: 105 // Cancer (4th sign / 4th house from Moon)
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();
    const hasGajaKesari = horoscope.yogas!.yogas.some((y: any) => y.type === 'GAJA_KESARI');
    expect(hasGajaKesari).toBe(true);
  });

  it('detects Pancha Mahapurusha Yoga in calculateHoroscope through full production pipeline', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1988-05-08T09:30:00+05:30',
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI
    };
    const basePositions = generatePlanetaryPositions(birth);
    const baseHoroscope = calculateHoroscope(birth);
    const ascSign = baseHoroscope.rasiChart.ascendantSign;
    const signList = Object.values(Sign);
    const ascIndex = signList.indexOf(ascSign);

    const planetQualifyingSigns: { planet: Planet; sign: Sign; yoga: YogaType }[] = [
      { planet: Planet.MARS, sign: Sign.ARIES, yoga: YogaType.RUCHAKA },
      { planet: Planet.MARS, sign: Sign.SCORPIO, yoga: YogaType.RUCHAKA },
      { planet: Planet.MARS, sign: Sign.CAPRICORN, yoga: YogaType.RUCHAKA },
      { planet: Planet.MERCURY, sign: Sign.GEMINI, yoga: YogaType.BHADRA },
      { planet: Planet.MERCURY, sign: Sign.VIRGO, yoga: YogaType.BHADRA },
      { planet: Planet.JUPITER, sign: Sign.SAGITTARIUS, yoga: YogaType.HAMSA },
      { planet: Planet.JUPITER, sign: Sign.PISCES, yoga: YogaType.HAMSA },
      { planet: Planet.JUPITER, sign: Sign.CANCER, yoga: YogaType.HAMSA },
      { planet: Planet.VENUS, sign: Sign.TAURUS, yoga: YogaType.MALAVYA },
      { planet: Planet.VENUS, sign: Sign.LIBRA, yoga: YogaType.MALAVYA },
      { planet: Planet.VENUS, sign: Sign.PISCES, yoga: YogaType.MALAVYA },
      { planet: Planet.SATURN, sign: Sign.CAPRICORN, yoga: YogaType.SHASHA },
      { planet: Planet.SATURN, sign: Sign.AQUARIUS, yoga: YogaType.SHASHA },
      { planet: Planet.SATURN, sign: Sign.LIBRA, yoga: YogaType.SHASHA }
    ];

    // Kendras relative to ascIndex are offsets 0, 3, 6, 9
    const kendraSignIndices = [0, 3, 6, 9].map(k => (ascIndex + k) % 12);

    // Find a planet/sign pair where the sign lands in a Kendra for this ascendant
    const match = planetQualifyingSigns.find(p => kendraSignIndices.includes(signList.indexOf(p.sign)))!;
    const targetSignIndex = signList.indexOf(match.sign);

    const customPositions = {
      ...basePositions,
      [match.planet]: {
        ...basePositions[match.planet],
        eclipticLongitude: targetSignIndex * 30 + 15
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();

    const hasYoga = horoscope.yogas!.yogas.some((y: any) => y.type === match.yoga);
    expect(hasYoga).toBe(true);
  });

  it('detects DHANA_YOGA in calculateHoroscope through full production pipeline', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1988-05-08T09:30:00+05:30',
      latitude: 25.75,
      longitude: 85.4167,
      timeZone: 'Asia/Kolkata',
      ayanamsa: AyanamsaType.LAHIRI
    };
    const basePositions = generatePlanetaryPositions(birth);
    const baseHoroscope = calculateHoroscope(birth);
    const ascSign = baseHoroscope.rasiChart.ascendantSign;
    const signList = Object.values(Sign);
    const ascIndex = signList.indexOf(ascSign);

    const p2nd = baseHoroscope.houseLordship.houseLords[2];
    const p11th = baseHoroscope.houseLordship.houseLords[11];

    const targetLongitude = ascIndex * 30 + 15;

    const customPositions = {
      ...basePositions,
      [p2nd]: {
        ...(basePositions as any)[p2nd],
        eclipticLongitude: targetLongitude
      },
      [p11th]: {
        ...(basePositions as any)[p11th],
        eclipticLongitude: targetLongitude
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();

    const dhanaYoga = horoscope.yogas!.yogas.find(
      (y: any) => y.type === YogaType.DHANA_YOGA && y.evidence[0]?.ruleId === 'YOGA_DHANA_001'
    );
    expect(dhanaYoga).toBeDefined();
    expect(dhanaYoga!.evidence[0].ruleId).toBe('YOGA_DHANA_001');
    expect(dhanaYoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(dhanaYoga!.evidence[0].lordshipHouses).toEqual([2, 11]);
  });

  it('detects CHANDRA_MANGALA_YOGA in calculateHoroscope through full production pipeline', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1990-01-01T12:00:00Z',
      timeZone: 'UTC',
      latitude: 28.6139,
      longitude: 77.2090,
      ayanamsa: AyanamsaType.LAHIRI
    };

    const basePositions = generatePlanetaryPositions(birth);
    const targetLongitude = 45; // Taurus (Sign.TAURUS)

    const customPositions = {
      ...basePositions,
      [Planet.MOON]: {
        ...basePositions[Planet.MOON],
        eclipticLongitude: targetLongitude
      },
      [Planet.MARS]: {
        ...basePositions[Planet.MARS],
        eclipticLongitude: targetLongitude
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();

    const cmYoga = horoscope.yogas!.yogas.find(
      (y: any) => y.type === YogaType.CHANDRA_MANGALA_YOGA
    );
    expect(cmYoga).toBeDefined();
    expect(cmYoga!.evidence[0].ruleId).toBe('YOGA_CHANDRA_MANGALA_001');
    expect(cmYoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(cmYoga!.planets).toEqual([Planet.MOON, Planet.MARS]);
  });

  it('detects LAKSHMI_YOGA in calculateHoroscope through full production pipeline', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1990-01-01T12:00:00Z',
      timeZone: 'UTC',
      latitude: 28.6139,
      longitude: 77.2090,
      ayanamsa: AyanamsaType.LAHIRI
    };

    const baseHoroscope = calculateHoroscope(birth);
    const ascSign = baseHoroscope.rasiChart.ascendantSign;
    const signList = Object.values(Sign);
    const ascIndex = signList.indexOf(ascSign);

    const lagnaLord = baseHoroscope.houseLordship.houseLords[1];
    const ninthLord = baseHoroscope.houseLordship.houseLords[9];

    const h1Long = ascIndex * 30 + 15;
    const h9Long = ((ascIndex + 8) % 12) * 30 + 15;

    const basePositions = generatePlanetaryPositions(birth);
    const customPositions = {
      ...basePositions,
      [lagnaLord]: {
        ...(basePositions as any)[lagnaLord],
        eclipticLongitude: h1Long
      },
      [ninthLord]: {
        ...(basePositions as any)[ninthLord],
        eclipticLongitude: h9Long
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();

    const lakshmiYoga = horoscope.yogas!.yogas.find(
      (y: any) => y.type === YogaType.LAKSHMI_YOGA
    );
    expect(lakshmiYoga).toBeDefined();
    expect(lakshmiYoga!.evidence[0].ruleId).toBe('YOGA_LAKSHMI_001');
    expect(lakshmiYoga!.evidence[0].classicalReference).toBe('BPHS_LAKSHMI_YOGA');
  });

  it('detects VASUMATI_YOGA in calculateHoroscope through full production pipeline', () => {
    const birth: BirthDetails = {
      dateTimeStr: '1990-01-01T12:00:00Z',
      timeZone: 'UTC',
      latitude: 28.6139,
      longitude: 77.2090,
      ayanamsa: AyanamsaType.LAHIRI
    };

    const baseHoroscope = calculateHoroscope(birth);
    const ascSign = baseHoroscope.rasiChart.ascendantSign;
    const signList = Object.values(Sign);
    const ascIndex = signList.indexOf(ascSign);

    const h3Long = ((ascIndex + 2) % 12) * 30 + 15;
    const h6Long = ((ascIndex + 5) % 12) * 30 + 15;
    const h7Long = ((ascIndex + 6) % 12) * 30 + 15;
    const h10Long = ((ascIndex + 9) % 12) * 30 + 15;
    const h11Long = ((ascIndex + 10) % 12) * 30 + 15;

    const basePositions = generatePlanetaryPositions(birth);
    const customPositions = {
      ...basePositions,
      [Planet.SUN]: {
        ...basePositions[Planet.SUN],
        eclipticLongitude: h7Long
      },
      [Planet.MERCURY]: {
        ...basePositions[Planet.MERCURY],
        eclipticLongitude: h3Long
      },
      [Planet.VENUS]: {
        ...basePositions[Planet.VENUS],
        eclipticLongitude: h6Long
      },
      [Planet.JUPITER]: {
        ...basePositions[Planet.JUPITER],
        eclipticLongitude: h10Long
      },
      [Planet.MOON]: {
        ...basePositions[Planet.MOON],
        eclipticLongitude: h11Long
      }
    };

    const horoscope = calculateHoroscope(birth, customPositions);
    expect(horoscope.yogas).toBeDefined();

    const vasumatiYoga = horoscope.yogas!.yogas.find(
      (y: any) => y.type === YogaType.VASUMATI_YOGA
    );
    expect(vasumatiYoga).toBeDefined();
    expect(vasumatiYoga!.evidence[0].ruleId).toBe('YOGA_VASUMATI_001');
    expect(vasumatiYoga!.evidence[0].referenceFrame).toBe('LAGNA');
    expect(vasumatiYoga!.evidence[0].classicalReference).toBe('PHALADEPIKA_VASUMATI_YOGA');
  });

  it('shouldIncludeNatalGrahaDrishtiInHoroscope', () => {
    // Repository engine golden baseline snapshot — current engine output for canonical chart, NOT an externally validated ephemeris benchmark.
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.natalGrahaDrishti).toBeDefined();

    // Targeted relationship check: Mars casts 4th aspect on Sun in canonical chart
    const marsToSun = horoscope.natalGrahaDrishti?.aspects?.find(
      (a: any) => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.SUN
    );
    expect(marsToSun).toBeDefined();
    expect(marsToSun!.aspectType).toBe(AspectType.SPECIAL_4TH);

    // Exact production aspect set snapshot check for canonical chart
    const actualAspectsFormatted = (horoscope.natalGrahaDrishti?.aspects ?? [])
      .map((a: any) => `${a.sourcePlanet}->${a.targetPlanet}:${a.aspectType}`)
      .sort();

    const expectedAspectsFormatted = [
      'JUPITER->KETU:SPECIAL_5TH',
      'JUPITER->SATURN:SPECIAL_9TH',
      'KETU->RAHU:FULL_7TH',
      'MARS->JUPITER:SPECIAL_4TH',
      'MARS->KETU:SPECIAL_8TH',
      'MARS->SUN:SPECIAL_4TH',
      'RAHU->KETU:FULL_7TH',
      'SATURN->RAHU:SPECIAL_3RD',
      'SATURN->VENUS:FULL_7TH',
      'VENUS->SATURN:FULL_7TH'
    ];

    expect(actualAspectsFormatted).toEqual(expectedAspectsFormatted);
  });

  it('shouldIncludePlanetAnalysisInHoroscope', () => {
    // Repository engine golden baseline snapshot for canonical chart
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.planetAnalysis).toBeDefined();

    const planetKeys = Object.keys(horoscope.planetAnalysis.planets);
    expect(planetKeys.length).toBe(9);

    for (const p of Object.values(Planet)) {
      const pa = horoscope.planetAnalysis.planets[p];
      const pf = horoscope.planetFacts[p];
      expect(pa).toBeDefined();
      expect(pa.sign).toBe(pf.sign);
      expect(pa.house).toBe(pf.house);
      expect(pa.longitude).toBe(pf.position.eclipticLongitude);
    }

    // Verify cast and received aspect relationships on Mars and Sun
    const marsAnalysis = horoscope.planetAnalysis.planets[Planet.MARS];
    const sunAnalysis = horoscope.planetAnalysis.planets[Planet.SUN];

    const marsCastSun = marsAnalysis.castAspects.find((a: any) => a.targetPlanet === Planet.SUN);
    expect(marsCastSun).toBeDefined();
    expect(marsCastSun?.aspectType).toBe(AspectType.SPECIAL_4TH);

    const sunRecMars = sunAnalysis.receivedAspects.find((a: any) => a.sourcePlanet === Planet.MARS);
    expect(sunRecMars).toBeDefined();
    expect(sunRecMars?.aspectType).toBe(AspectType.SPECIAL_4TH);
  });

  it('shouldIncludeHouseAnalysisInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.houseAnalysis).toBeDefined();
    expect(Object.keys(horoscope.houseAnalysis!.houses)).toHaveLength(12);

    for (let h = 1; h <= 12; h++) {
      const houseAnalysis = horoscope.houseAnalysis!.houses[h];
      expect(houseAnalysis).toBeDefined();
      expect(houseAnalysis.house).toBe(h);
      expect(houseAnalysis.lord).toBe(horoscope.houseLordship.houseLords[h as House]);

      const expectedOccupants = Object.values(Planet).filter(
        p => horoscope.planetAnalysis.planets[p].house === h
      );
      expect(houseAnalysis.occupants).toEqual(expectedOccupants);
    }
  });

  it('shouldIncludeFunctionalNatureIntegrationInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.functionalNatureIntegration).toBeDefined();
    expect(Object.keys(horoscope.functionalNatureIntegration.planets)).toHaveLength(9);

    for (const planet of Object.values(Planet)) {
      const fnAnalysis = horoscope.functionalNatureIntegration.planets[planet];
      expect(fnAnalysis).toBeDefined();
      expect(fnAnalysis.planet).toBe(planet);
      expect(fnAnalysis.ownedHouses).toEqual(horoscope.houseLordship.planetLordships[planet].ownedHouses);
      expect(fnAnalysis.roles).toEqual(horoscope.functionalRoles.planets[planet].roles);
      expect(fnAnalysis.functionalNature).toBeDefined();
      expect(fnAnalysis.evidence.length).toBeGreaterThan(0);
    }
  });

  it('shouldIncludePlanetaryStrengthInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.planetaryStrength).toBeDefined();
    expect(Object.keys(horoscope.planetaryStrength.planets)).toHaveLength(9);

    const testPlanets = [Planet.SUN, Planet.JUPITER, Planet.SATURN];
    for (const p of testPlanets) {
      const ps = horoscope.planetaryStrength.planets[p];
      expect(ps).toBeDefined();
      expect(ps.planet).toBe(p);
      expect(ps.components.length).toBeGreaterThanOrEqual(10);
      expect(ps.evidence.length).toBeGreaterThan(0);

      // Sthana Bala subcomponents
      const uchcha = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.UCHCHA_BALA
      );
      expect(uchcha?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof uchcha?.value).toBe('number');

      const saptavargaja = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.SAPTAVARGAJA_BALA
      );
      expect(saptavargaja?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof saptavargaja?.value).toBe('number');

      const ojaYugma = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.OJA_YUGMA_BALA
      );
      expect(ojaYugma?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof ojaYugma?.value).toBe('number');

      const kendradi = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.KENDRADI_BALA
      );
      expect(kendradi?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof kendradi?.value).toBe('number');

      const drekkana = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.DREKKANA_BALA
      );
      expect(drekkana?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof drekkana?.value).toBe('number');

      // Sthana Bala aggregate
      const sthanaAggregate = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.STHANA_BALA && c.subcomponent === ShadbalaSubcomponent.STHANA_BALA
      );
      expect(sthanaAggregate?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof sthanaAggregate?.value).toBe('number');

      const dig = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.DIG_BALA && c.subcomponent === ShadbalaSubcomponent.DIG_BALA
      );
      expect(dig?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof dig?.value).toBe('number');

      const naisargika = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.NAISARGIKA_BALA && c.subcomponent === ShadbalaSubcomponent.NAISARGIKA_BALA
      );
      expect(naisargika?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof naisargika?.value).toBe('number');
    }
  });

  it('shouldIncludeCheshtaBalaInCanonicalPlanetaryStrength', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const classicalSeven = [
      Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
    ];

    for (const p of classicalSeven) {
      const ps = horoscope.planetaryStrength.planets[p];
      const cheshtaComp = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.CHESHTA_BALA
      );
      expect(cheshtaComp).toBeDefined();
      expect(cheshtaComp?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(typeof cheshtaComp?.value).toBe('number');
      expect(cheshtaComp?.value).toBeGreaterThanOrEqual(0);
      expect(cheshtaComp?.value).toBeLessThanOrEqual(60);
    }

    // Cross-checks (§33/§34)
    const sunPS = horoscope.planetaryStrength.planets[Planet.SUN];
    const sunCheshta = sunPS.components.find((c: any) => c.component === ShadbalaComponent.CHESHTA_BALA)?.value;
    const sunAyana = sunPS.components.find((c: any) => c.subcomponent === ShadbalaSubcomponent.AYANA_BALA)?.value;
    expect(sunCheshta).toBeDefined();
    expect(sunAyana).toBeDefined();
    expect(sunCheshta).toBeCloseTo(sunAyana!, 2);

    const moonPS = horoscope.planetaryStrength.planets[Planet.MOON];
    const moonCheshta = moonPS.components.find((c: any) => c.component === ShadbalaComponent.CHESHTA_BALA)?.value;
    const moonPaksha = moonPS.components.find((c: any) => c.subcomponent === ShadbalaSubcomponent.PAKSHA_BALA)?.value;
    expect(moonCheshta).toBeDefined();
    expect(moonPaksha).toBeDefined();
    expect(moonCheshta).toBeCloseTo(moonPaksha!, 2);

    // Nodes
    const nodes = [Planet.RAHU, Planet.KETU];
    for (const node of nodes) {
      const ps = horoscope.planetaryStrength.planets[node];
      const cheshtaComp = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.CHESHTA_BALA
      );
      expect(cheshtaComp).toBeDefined();
      expect(cheshtaComp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      expect(cheshtaComp?.value).toBeUndefined();
    }
  });

  it('shouldIncludeDrikBalaInCanonicalPlanetaryStrength', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const classicalSeven = [
      Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
    ];

    for (const p of classicalSeven) {
      const ps = horoscope.planetaryStrength.planets[p];
      const cheshtaComp = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.CHESHTA_BALA
      );
      expect(cheshtaComp).toBeDefined();
      expect(cheshtaComp?.status).toBe(StrengthComponentStatus.CALCULATED);

      const drikComp = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.DRIK_BALA
      );
      expect(drikComp).toBeDefined();
      expect(drikComp?.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(drikComp?.subcomponent).toBe(ShadbalaSubcomponent.DRIK_BALA);
      expect(typeof drikComp?.value).toBe('number');
      expect(Number.isFinite(drikComp?.value)).toBe(true);

      const drikEvidence = ps.evidence.find(
        (e: any) => e.component === ShadbalaComponent.DRIK_BALA
      );
      expect(drikEvidence).toBeDefined();
      expect(drikEvidence?.ruleId).toBe('SHADBALA_DRIK_BALA_001');
    }

    const nodes = [Planet.RAHU, Planet.KETU];
    for (const node of nodes) {
      const ps = horoscope.planetaryStrength.planets[node];
      const drikComp = ps.components.find(
        (c: any) => c.component === ShadbalaComponent.DRIK_BALA
      );
      expect(drikComp).toBeDefined();
      expect(drikComp?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      expect(drikComp?.value).toBeUndefined();

      const drikEvidence = ps.evidence.find(
        (e: any) => e.component === ShadbalaComponent.DRIK_BALA
      );
      expect(drikEvidence).toBeDefined();
      expect(drikEvidence?.ruleId).toBe('SHADBALA_DRIK_BALA_NOT_IMPLEMENTED');
    }
  });

  it('shouldExposeShadbalaAggregationForClassicalPlanets', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const classicalSeven = [
      Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY, Planet.JUPITER, Planet.VENUS, Planet.SATURN
    ];

    for (const p of classicalSeven) {
      const ps = horoscope.planetaryStrength.planets[p];
      expect(ps.shadbala).toBeDefined();
      expect(ps.shadbala?.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(ps.shadbala?.missingComponents).toContain(ShadbalaComponent.KALA_BALA);
      expect(ps.shadbala?.totalShastiamsa).toBeUndefined();
    }

    for (const node of [Planet.RAHU, Planet.KETU]) {
      const ps = horoscope.planetaryStrength.planets[node];
      expect(ps.shadbala).toBeDefined();
      expect(ps.shadbala?.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);
      expect(ps.shadbala?.missingComponents.length).toBe(6);
    }
  });

  it('shouldExposeYuddhaBalaEvidenceAndKeepCompleteKalaBalaIncomplete', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    const mars = horoscope.planetaryStrength.planets[Planet.MARS];

    const yuddhaComponent = mars.components.find(
      (c: any) =>
        c.component === ShadbalaComponent.KALA_BALA &&
        c.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA
    );

    expect(yuddhaComponent).toBeDefined();
    expect(yuddhaComponent?.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);

    expect(mars.completeKalaBala).toBeUndefined();
    expect(mars.shadbala?.status).toBe(ShadbalaAggregationStatus.INCOMPLETE);

    const yuddhaEvidence = mars.evidence.find(
      (e: any) => e.subcomponent === ShadbalaSubcomponent.YUDDHA_BALA
    );
    expect(yuddhaEvidence).toBeDefined();
    expect(['YUDDHA_BALA_001', 'YUDDHA_BALA_NO_WAR']).toContain(yuddhaEvidence?.ruleId);
  });

  it('shouldExposeFunctionalRolesInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.functionalRoles).toBeDefined();
    expect(horoscope.functionalRoles.ascendantSign).toBe(horoscope.rasiChart.ascendantSign);

    const allPlanets = Object.values(Planet);

    for (const planet of allPlanets) {
      const pRole = horoscope.functionalRoles.planets[planet];
      expect(pRole).toBeDefined();
      expect(pRole.planet).toBe(planet);
      expect(pRole.ownedHouses).toEqual(
        horoscope.houseLordship.planetLordships[planet].ownedHouses
      );
      expect(pRole.functionalNature).toBeDefined();
      expect(pRole.roles).toBeDefined();
      expect(pRole.evidence).toBeDefined();
      expect(pRole.evidence.length).toBeGreaterThan(0);
    }

    const lagnaLordPlanet = horoscope.houseLordship.houseLords[House.FIRST];
    expect(horoscope.functionalRoles.planets[lagnaLordPlanet].roles).toContain(
      FunctionalRole.LAGNA_LORD
    );

    const badhakaLordPlanet = horoscope.functionalRoles.badhakaLord;
    expect(horoscope.functionalRoles.planets[badhakaLordPlanet].roles).toContain(
      FunctionalRole.BADHAKA_LORD
    );
  });

  it('shouldExposeYogaAssessmentInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.yogas).toBeDefined();
    expect(horoscope.yogas!.yogas.length).toBeGreaterThan(0);

    for (const yoga of horoscope.yogas!.yogas) {
      expect(yoga.assessment).toBeDefined();
      expect(yoga.assessment!.formationPresent).toBe(true);
      expect(yoga.assessment!.strength).toBeDefined();
      expect(yoga.assessment!.finalStatus).toBeDefined();
      expect(yoga.assessment!.confidence).toBeDefined();
    }
  });

  it('shouldIncludePlanetInterpretationInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.planetInterpretation).toBeDefined();

    const allPlanets = Object.values(Planet);
    for (const planet of allPlanets) {
      const interp = horoscope.planetInterpretation.planets[planet];
      expect(interp).toBeDefined();
      expect(interp.planet).toBe(planet);
      expect(interp.placement).toBeDefined();
      expect(interp.placement.house).toBe(horoscope.planetAnalysis.planets[planet].house);
      expect(interp.placement.sign).toBe(horoscope.planetAnalysis.planets[planet].sign);
      expect(interp.functionalRole).toBeDefined();
      expect(interp.nakshatra).toBeDefined();
      expect(interp.evidence.length).toBeGreaterThan(0);
    }

    const sunInterp = horoscope.planetInterpretation.planets[Planet.SUN];
    expect(sunInterp.placement).toBeDefined();
    expect(sunInterp.functionalRole).toBeDefined();
    expect(sunInterp.nakshatra).toBeDefined();
    expect(sunInterp.evidence.length).toBeGreaterThan(0);
  });

  it('shouldIncludeHouseInterpretationInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.houseInterpretation).toBeDefined();

    for (let h = 1; h <= 12; h++) {
      const houseInterp = horoscope.houseInterpretation.houses[h];
      expect(houseInterp).toBeDefined();
      expect(houseInterp.house).toBe(h);
      expect(houseInterp.placement).toBeDefined();
      expect(houseInterp.lord).toBeDefined();
      expect(houseInterp.occupants).toBeDefined();
      expect(houseInterp.aspects).toBeDefined();
      expect(houseInterp.yogas).toBeDefined();
      expect(houseInterp.strength).toBeDefined();
      expect(houseInterp.evidence.length).toBeGreaterThan(0);
    }

    const house1Interp = horoscope.houseInterpretation.houses[1];
    expect(house1Interp.placement.house).toBe(1);
    expect(house1Interp.lord.planet).toBe(horoscope.houseAnalysis!.houses[1].lord);
    expect(house1Interp.evidence.length).toBeGreaterThan(0);
  });

  it('shouldIncludeDashaInterpretationInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.vimshottari).toBeDefined();
    expect(horoscope.dashaInterpretation).toBeDefined();

    const dashaInterp = horoscope.dashaInterpretation;
    expect(dashaInterp.birthAnchor).toBeDefined();
    expect(dashaInterp.mahadashas.length).toBeGreaterThan(0);

    const firstMD = dashaInterp.mahadashas[0];
    expect(firstMD.planet).toBeDefined();
    expect(firstMD.natal).toBeDefined();
    expect(firstMD.antardashas.length).toBeGreaterThan(0);

    const firstAD = firstMD.antardashas[0];
    expect(firstAD.planet).toBeDefined();
    expect(firstAD.natal).toBeDefined();
    expect(firstAD.pratyantardashas.length).toBeGreaterThan(0);

    const firstPD = firstAD.pratyantardashas[0];
    expect(firstPD.planet).toBeDefined();
    expect(firstPD.natal).toBeDefined();
  });

  it('shouldIncludeLifeThemesInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.lifeThemes).toBeDefined();
    expect(horoscope.lifeThemes.themes.length).toBe(Object.values(LifeTheme).length);

    const careerTheme = horoscope.lifeThemes.themes.find(
      (t: any) => t.theme === LifeTheme.CAREER_STATUS
    );
    expect(careerTheme).toBeDefined();
    expect(careerTheme?.evidence.length).toBeGreaterThan(0);

    const partnershipTheme = horoscope.lifeThemes.themes.find(
      (t: any) => t.theme === LifeTheme.PARTNERSHIP
    );
    expect(partnershipTheme).toBeDefined();
    expect(partnershipTheme?.evidence.length).toBeGreaterThan(0);

    const wealthTheme = horoscope.lifeThemes.themes.find(
      (t: any) => t.theme === LifeTheme.WEALTH_FINANCE
    );
    expect(wealthTheme).toBeDefined();
    expect(wealthTheme?.evidence.length).toBeGreaterThan(0);
  });

  it('shouldIncludeThemeInterpretationV2WithCareerAndWealthInHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.themeInterpretationV2).toBeDefined();
    expect(horoscope.themeInterpretationV2?.career).toBeDefined();
    expect(horoscope.themeInterpretationV2?.career?.careerNatalPromise).toBeDefined();

    const wealth = horoscope.themeInterpretationV2?.wealth;
    expect(wealth).toBeDefined();
    expect(wealth?.wealthNatalPromise).toBeDefined();
    expect(wealth?.conclusion).toBeDefined();
    expect(wealth?.subthemes).toBeDefined();
    expect(wealth?.evidence).toBeDefined();
    expect(wealth?.evidence.length).toBeGreaterThan(0);
    expect(wealth?.metadata).toBeDefined();
  });

  it('guardrail: verifies absence of birth-date fallback and independence of natal fields from analysis asOf', () => {
    // 1. Without asOf, dasha current is undefined (no fallback to birthDetails.dateTimeStr)
    const horoscopeWithoutAsOf = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscopeWithoutAsOf.dashaInterpretation?.current).toBeUndefined();

    // 2. With asOf at birth time (1988-05-08T09:30:00+05:30), Moon mahadasha was running
    const horoscopeAtBirth = calculateHoroscope(
      CANONICAL_BIRTH_DETAILS,
      undefined,
      CANONICAL_BIRTH_DETAILS.dateTimeStr
    );
    expect(horoscopeAtBirth.dashaInterpretation?.current).toBeDefined();
    expect(horoscopeAtBirth.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.MOON);

    // 3. With explicit asOf distinct from birth time (2024-06-01), Jupiter mahadasha is running
    const analysisAsOf = '2024-06-01T00:00:00.000Z';
    const horoscopeWithAsOf = calculateHoroscope(
      CANONICAL_BIRTH_DETAILS,
      undefined,
      analysisAsOf
    );
    expect(horoscopeWithAsOf.dashaInterpretation?.current).toBeDefined();
    expect(horoscopeWithAsOf.dashaInterpretation?.current?.at).toBe(analysisAsOf);
    expect(horoscopeWithAsOf.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
    expect(horoscopeWithAsOf.dashaInterpretation?.current?.mahadasha.planet).not.toBe(
      horoscopeAtBirth.dashaInterpretation?.current?.mahadasha.planet
    );

    // 4. Assert that all natal fields (ascendant, rasi chart, divisional charts, planetary positions)
    // are completely identical and unaffected by asOf
    expect(horoscopeWithAsOf.positions).toEqual(horoscopeWithoutAsOf.positions);
    expect(horoscopeWithAsOf.ascendant).toEqual(horoscopeWithoutAsOf.ascendant);
    expect(horoscopeWithAsOf.rasiChart).toEqual(horoscopeWithoutAsOf.rasiChart);
    expect(horoscopeWithAsOf.charts).toEqual(horoscopeWithoutAsOf.charts);
    expect(horoscopeWithAsOf.planetFacts).toEqual(horoscopeWithoutAsOf.planetFacts);
    expect(horoscopeWithAsOf.houseLordship).toEqual(horoscopeWithoutAsOf.houseLordship);
    expect(horoscopeWithAsOf.functionalRoles).toEqual(horoscopeWithoutAsOf.functionalRoles);
  });

  describe('canonical PlanetMotion propagation', () => {
    it('calculateCombustion preserves the exact motion object reference and values for direct, retrograde, and stationary states', () => {
      const directMotion: PlanetMotion = { speed: 1.25, retrograde: false, stationary: false };
      const retroMotion: PlanetMotion = { speed: -0.45, retrograde: true, stationary: false };
      const stationaryMotion: PlanetMotion = { speed: 0.002, retrograde: false, stationary: true };

      // Normal combust planet (Saturn)
      const saturnState = calculateCombustion(Planet.SATURN, 100, 105, retroMotion);
      expect(saturnState.motion).toBe(retroMotion);
      expect(saturnState.motion.retrograde).toBe(true);
      expect(saturnState.motion.speed).toBe(-0.45);
      expect(saturnState.motion.stationary).toBe(false);

      // Sun branch
      const sunState = calculateCombustion(Planet.SUN, 50, 50, directMotion);
      expect(sunState.motion).toBe(directMotion);
      expect(sunState.motion.retrograde).toBe(false);
      expect(sunState.motion.speed).toBe(1.25);
      expect(sunState.motion.stationary).toBe(false);

      // Rahu / Ketu branch
      const rahuState = calculateCombustion(Planet.RAHU, 180, 50, retroMotion);
      expect(rahuState.motion).toBe(retroMotion);
      expect(rahuState.motion.retrograde).toBe(true);

      const ketuState = calculateCombustion(Planet.KETU, 0, 50, stationaryMotion);
      expect(ketuState.motion).toBe(stationaryMotion);
      expect(ketuState.motion.stationary).toBe(true);
      expect(ketuState.motion.speed).toBe(0.002);
    });

    it('production golden test: verifies state.motion matches position.motion for all planets in horoscope', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const saturnFacts = horoscope.planetFacts[Planet.SATURN];
      expect(saturnFacts).toBeDefined();

      // Saturn is retrograde in the canonical fixture
      expect(saturnFacts.position.motion.retrograde).toBe(true);
      expect(saturnFacts.position.motion.speed).toBeLessThan(0);
      expect(saturnFacts.state.motion).toBe(saturnFacts.position.motion);
      expect(saturnFacts.state.motion).toEqual(saturnFacts.position.motion);
      expect(saturnFacts.state.motion.retrograde).toBe(saturnFacts.position.motion.retrograde);
      expect(saturnFacts.state.motion.speed).toBe(saturnFacts.position.motion.speed);
      expect(saturnFacts.state.motion.stationary).toBe(saturnFacts.position.motion.stationary);

      // Assert state.motion is identical to position.motion for every planet
      for (const planet of Object.values(Planet)) {
        const pf = horoscope.planetFacts[planet];
        expect(pf.state.motion).toBe(pf.position.motion);
        expect(pf.state.motion).toEqual(pf.position.motion);
      }
    });

    it('divisional regression: charts[RASI].positions[SATURN].motion is identical object to NAVAMSA and DASAMSA while eclipticLongitude differs', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const rasiSaturn = horoscope.charts[ChartType.RASI].positions[Planet.SATURN];
      const navamsaSaturn = horoscope.charts[ChartType.NAVAMSA].positions[Planet.SATURN];
      const dasamsaSaturn = horoscope.charts[ChartType.DASAMSA].positions[Planet.SATURN];

      expect(rasiSaturn.motion).toBeDefined();
      expect(rasiSaturn.motion).toBe(navamsaSaturn.motion);
      expect(rasiSaturn.motion).toBe(dasamsaSaturn.motion);

      // Ecliptic longitudes in divisional charts must differ according to harmonic mapping
      expect(rasiSaturn.eclipticLongitude).not.toBe(navamsaSaturn.eclipticLongitude);
      expect(rasiSaturn.eclipticLongitude).not.toBe(dasamsaSaturn.eclipticLongitude);
    });
  });

  describe('P0-06 Divisional Chart Positional Metadata Consistency', () => {
    it('derives D9 sign from D9 longitude and D10 sign from D10 longitude', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d9Chart = horoscope.charts[ChartType.NAVAMSA];
      const d10Chart = horoscope.charts[ChartType.DASAMSA];

      for (const planet of Object.values(Planet)) {
        const d9Pos = d9Chart.positions[planet];
        const d10Pos = d10Chart.positions[planet];

        expect(d9Pos.sign).toBe(calculateSign(d9Pos.eclipticLongitude!));
        expect(d10Pos.sign).toBe(calculateSign(d10Pos.eclipticLongitude!));
      }
    });

    it('derives D9 house and D10 house via calculateWholeSignHouse(chart.ascendantSign, calculateSign(pos.eclipticLongitude))', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d9Chart = horoscope.charts[ChartType.NAVAMSA];
      const d10Chart = horoscope.charts[ChartType.DASAMSA];

      for (const planet of Object.values(Planet)) {
        const d9Pos = d9Chart.positions[planet];
        const d10Pos = d10Chart.positions[planet];

        const expectedD9House = calculateWholeSignHouse(
          d9Chart.ascendantSign,
          calculateSign(d9Pos.eclipticLongitude!)
        );
        const expectedD10House = calculateWholeSignHouse(
          d10Chart.ascendantSign,
          calculateSign(d10Pos.eclipticLongitude!)
        );

        expect(d9Pos.house).toBe(expectedD9House);
        expect(d10Pos.house).toBe(expectedD10House);
      }
    });

    it('ensures signLongitude equals eclipticLongitude % 30 for D3/D9/D10', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const vargas = [ChartType.DREKKANA, ChartType.NAVAMSA, ChartType.DASAMSA];

      for (const varga of vargas) {
        const chart = horoscope.charts[varga];
        for (const planet of Object.values(Planet)) {
          const pos = chart.positions[planet];
          expect(pos.signLongitude).toBeCloseTo(pos.eclipticLongitude! % 30, 10);
        }
      }
    });

    it('maintains internally consistent positional metadata in every Varga (RASI/DREKKANA/NAVAMSA/DASAMSA)', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const allVargas = [ChartType.RASI, ChartType.DREKKANA, ChartType.NAVAMSA, ChartType.DASAMSA];
      const d1Chart = horoscope.charts[ChartType.RASI];

      for (const varga of allVargas) {
        const chart = horoscope.charts[varga];
        expect(chart.ascendantSign).toBe(calculateSign(chart.ascendantLongitude));

        for (const planet of Object.values(Planet)) {
          const pos = chart.positions[planet];
          const long = pos.eclipticLongitude ?? pos.longitude;
          expect(long).toBeDefined();
          expect(pos.sign).toBe(calculateSign(long!));
          expect(pos.signLongitude).toBeCloseTo(long! % 30, 10);

          if (varga !== ChartType.RASI) {
            expect(pos.house).toBe(calculateWholeSignHouse(chart.ascendantSign, calculateSign(long!)));
          } else {
            expect(pos.house).toBe(d1Chart.positions[planet].house);
          }
        }
      }
    });

    it('ensures D1 metadata does not leak into D9/D10 (sign/house match divisional derivation, not D1)', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d1Chart = horoscope.charts[ChartType.RASI];
      const d9Chart = horoscope.charts[ChartType.NAVAMSA];
      const d10Chart = horoscope.charts[ChartType.DASAMSA];

      let foundD9Diff = false;
      let foundD10Diff = false;

      for (const planet of Object.values(Planet)) {
        const d1Pos = d1Chart.positions[planet];
        const d9Pos = d9Chart.positions[planet];
        const d10Pos = d10Chart.positions[planet];

        // Positional metadata matches divisional derivation, not D1
        expect(d9Pos.sign).toBe(calculateSign(d9Pos.eclipticLongitude!));
        expect(d9Pos.house).toBe(calculateWholeSignHouse(d9Chart.ascendantSign, d9Pos.sign));
        expect(d10Pos.sign).toBe(calculateSign(d10Pos.eclipticLongitude!));
        expect(d10Pos.house).toBe(calculateWholeSignHouse(d10Chart.ascendantSign, d10Pos.sign));

        if (d9Pos.sign !== d1Pos.sign || d9Pos.house !== d1Pos.house) {
          foundD9Diff = true;
        }
        if (d10Pos.sign !== d1Pos.sign || d10Pos.house !== d1Pos.house) {
          foundD10Diff = true;
        }
      }

      // Prove that at least one planet has different sign/house in D9 and D10 than in D1,
      // confirming D1 does not leak into D9/D10
      expect(foundD9Diff).toBe(true);
      expect(foundD10Diff).toBe(true);
    });

    it('protects P0-05: motion is canonical reference from D1 to D3, D9, and D10', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d1Chart = horoscope.charts[ChartType.RASI];
      const d3Chart = horoscope.charts[ChartType.DREKKANA];
      const d9Chart = horoscope.charts[ChartType.NAVAMSA];
      const d10Chart = horoscope.charts[ChartType.DASAMSA];

      for (const planet of Object.values(Planet)) {
        const d1Motion = d1Chart.positions[planet].motion;
        expect(d3Chart.positions[planet].motion).toBe(d1Motion);
        expect(d9Chart.positions[planet].motion).toBe(d1Motion);
        expect(d10Chart.positions[planet].motion).toBe(d1Motion);
      }
    });

    it('confirms distinct divisional longitude transformations exist across planets', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d1Positions = horoscope.charts[ChartType.RASI].positions;
      const d9Positions = horoscope.charts[ChartType.NAVAMSA].positions;
      const d10Positions = horoscope.charts[ChartType.DASAMSA].positions;

      let d9LongitudeDiffers = false;
      let d10LongitudeDiffers = false;

      for (const planet of Object.values(Planet)) {
        if (d9Positions[planet].eclipticLongitude !== d1Positions[planet].eclipticLongitude) {
          d9LongitudeDiffers = true;
        }
        if (d10Positions[planet].eclipticLongitude !== d1Positions[planet].eclipticLongitude) {
          d10LongitudeDiffers = true;
        }
      }

      expect(d9LongitudeDiffers).toBe(true);
      expect(d10LongitudeDiffers).toBe(true);
    });

    it('leaves D1 unchanged and consistent with canonical astronomical positions', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d1Positions = horoscope.charts[ChartType.RASI].positions;
      const rawPositions = generatePlanetaryPositions(CANONICAL_BIRTH_DETAILS);

      for (const planet of Object.values(Planet)) {
        // D1 positions must remain the original canonical positions
        expect(d1Positions[planet].eclipticLongitude).toBe(rawPositions[planet].eclipticLongitude);
        expect(d1Positions[planet].sign).toBe(rawPositions[planet].sign);
        expect(d1Positions[planet].signLongitude).toBeCloseTo(rawPositions[planet].signLongitude, 10);
      }
    });

    it('enforces object non-aliasing between D1 and D9/D10 positions', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const d1Positions = horoscope.charts[ChartType.RASI].positions;
      const d9Positions = horoscope.charts[ChartType.NAVAMSA].positions;
      const d10Positions = horoscope.charts[ChartType.DASAMSA].positions;

      for (const planet of Object.values(Planet)) {
        expect(d9Positions[planet]).not.toBe(d1Positions[planet]);
        expect(d10Positions[planet]).not.toBe(d1Positions[planet]);
      }
    });

    it('deterministic fixture test: forcing SUN to 15° Aries yields Aries in D1 and non-Aries (Virgo) in D10', () => {
      const basePositions = generatePlanetaryPositions(CANONICAL_BIRTH_DETAILS);
      const sunLongitude = 15; // 15° Aries
      const customPositions: Record<Planet, PlanetPosition> = {
        ...basePositions,
        [Planet.SUN]: {
          ...basePositions[Planet.SUN],
          longitude: sunLongitude,
          eclipticLongitude: sunLongitude,
          siderealLongitude: sunLongitude,
          sign: Sign.ARIES,
          signLongitude: 15
        }
      };

      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, customPositions);
      const d1Sun = horoscope.charts[ChartType.RASI].positions[Planet.SUN];
      const d10Sun = horoscope.charts[ChartType.DASAMSA].positions[Planet.SUN];

      expect(d1Sun.sign).toBe(Sign.ARIES);
      expect(d10Sun.sign).not.toBe(Sign.ARIES);
      expect(d10Sun.sign).toBe(Sign.VIRGO);
      expect(d10Sun.eclipticLongitude).toBeCloseTo(150, 6);
    });
  });
});


