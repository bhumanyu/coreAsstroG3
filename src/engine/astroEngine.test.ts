import { describe, it, expect } from 'vitest';
import {
  normalizeDegree,
  calculateSign,
  calculateNakshatra,
  calculateJulianDay,
  getAyanamsaOffset,
  calculateAscendant,
  generatePlanetaryPositions,
  calculateHoroscope
} from './astroEngine';
import { Planet, Sign, Nakshatra, Pada, AyanamsaType, BirthDetails, AspectType, ShadbalaComponent, ShadbalaSubcomponent, StrengthComponentStatus, ShadbalaAggregationStatus } from '../types';
import { House } from './houseLordship/houseGroups';
import { FunctionalRole } from './functionalNature/functionalRoleTypes';
import { CANONICAL_BIRTH_DETAILS } from '../test/fixtures/canonicalChart';
import { YogaType } from './yoga/yogaTypes';
import { LifeTheme } from './lifeThemes/lifeThemeTypes';

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
    const hasGajaKesari = horoscope.yogas.yogas.some((y: any) => y.type === 'GAJA_KESARI');
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

    const hasYoga = horoscope.yogas.yogas.some((y: any) => y.type === match.yoga);
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

    const dhanaYoga = horoscope.yogas.yogas.find(
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

    const cmYoga = horoscope.yogas.yogas.find(
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

    const lakshmiYoga = horoscope.yogas.yogas.find(
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

    const vasumatiYoga = horoscope.yogas.yogas.find(
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
    expect(Object.keys(horoscope.houseAnalysis.houses)).toHaveLength(12);

    for (let h = 1; h <= 12; h++) {
      const houseAnalysis = horoscope.houseAnalysis.houses[h];
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
    expect(horoscope.yogas.yogas.length).toBeGreaterThan(0);

    for (const yoga of horoscope.yogas.yogas) {
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
    expect(house1Interp.lord.planet).toBe(horoscope.houseAnalysis.houses[1].lord);
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
});


