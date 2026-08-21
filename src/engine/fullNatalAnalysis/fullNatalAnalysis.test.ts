/** READ-ONLY FULL NATAL ANALYSIS REPORT LAYER TESTS */

import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../astroEngine';
import { buildFullNatalAnalysis, validateInput } from './fullNatalAnalysis';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { EXPECTED_PLANET_ORDER } from './fullNatalAnalysisMetadata';
import { LifeTheme, Planet, BirthDetails, AyanamsaType } from '../../types';

describe('P-21 FullNatalAnalysis Engine', () => {
  it('should throw TypeError when input is null or missing required fields', () => {
    expect(() => validateInput(null as any)).toThrowError(
      'fullNatalAnalysis input must not be null or undefined.'
    );
    expect(() => validateInput({} as any)).toThrowError(
      'fullNatalAnalysis input is missing required field: horoscope.'
    );
    expect(() => validateInput({ horoscope: {} } as any)).toThrowError(
      'fullNatalAnalysis input is missing required field: lifeThemes.'
    );
    expect(() => validateInput({ horoscope: {}, lifeThemes: {} } as any)).toThrowError(
      'fullNatalAnalysis input is missing required field: chartSynthesis.'
    );
  });

  it('should build a complete FullNatalAnalysisReport for canonical chart', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report).toBeDefined();
    expect(report.version).toBe('P-21-v1');
  });

  it('should contain exact section key order including version (18 keys total)', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    const expectedKeys = [
      'version',
      'birthInformation',
      'methodology',
      'executiveSummary',
      'ascendant',
      'planets',
      'houses',
      'functionalRoles',
      'yogas',
      'planetaryStrength',
      'd9',
      'd10',
      'vimshottari',
      'currentDasha',
      'currentTransit',
      'lifeThemes',
      'majorLifePeriods',
      'overallSynthesis'
    ];

    expect(Object.keys(report)).toEqual(expectedKeys);
  });

  it('should output planets in EXACTLY EXPECTED_PLANET_ORDER', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    const planetList = report.planets.planets.map((p) => p.planet);
    expect(planetList).toEqual(EXPECTED_PLANET_ORDER);
  });

  it('should output houses [1..12]', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    const houseList = report.houses.houses.map((h) => h.house);
    expect(houseList).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('should output all life themes matching LifeTheme enum length', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.lifeThemes.themes.length).toBe(Object.values(LifeTheme).length);
  });

  it('should preserve P-20 chartSynthesis order and data passthrough', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.overallSynthesis.strongestThemes).toEqual(
      horoscope.chartSynthesis.strongestThemes.map((t: any) => t.theme)
    );
    expect(report.overallSynthesis.overallConclusion).toBe(
      horoscope.chartSynthesis.overallConclusion
    );
    expect(report.overallSynthesis.overallConfidence).toBe(
      horoscope.chartSynthesis.overallConfidence
    );
  });

  it('should retain evidence provenance with exact deep equality to upstream sources', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    // 1. Planet
    const sunReport = report.planets.planets.find((p) => p.planet === Planet.SUN);
    const sunUpstream = horoscope.planetAnalysis.planets.SUN;
    if (sunUpstream?.evidence && sunUpstream.evidence.length > 0) {
      expect(sunReport!.evidence).toEqual(sunUpstream.evidence);
    }

    // 2. House
    const house1Report = report.houses.houses.find((h) => h.house === 1);
    const house1Upstream = horoscope.houseAnalysis.houses[1];
    if (house1Upstream?.evidence && house1Upstream.evidence.length > 0) {
      expect(house1Report!.evidence).toEqual(house1Upstream.evidence);
    }

    // 3. D9
    if (report.d9.status !== 'UNAVAILABLE' && horoscope.divisionalInterpretation?.d9?.evidence?.length > 0) {
      expect(report.d9.details!.evidence).toEqual(horoscope.divisionalInterpretation.d9.evidence);
    }

    // 4. D10
    if (report.d10.status !== 'UNAVAILABLE' && horoscope.divisionalInterpretation?.d10?.evidence?.length > 0) {
      expect(report.d10.details!.evidence).toEqual(horoscope.divisionalInterpretation.d10.evidence);
    }

    // 5. Yoga
    const upstreamYoga = horoscope.yogas?.yogas?.find((y: any) => y.evidence && y.evidence.length > 0);
    if (upstreamYoga && upstreamYoga.evidence.length > 0) {
      const reportYoga = report.yogas.detected.find((y: any) => y.type === upstreamYoga.type);
      expect(reportYoga!.evidence).toEqual(upstreamYoga.evidence);
    }

    // 6. Dasha
    const upstreamMahadasha = horoscope.dashaInterpretation?.mahadashas?.find((m: any) => m.evidence && m.evidence.length > 0);
    if (upstreamMahadasha && upstreamMahadasha.evidence.length > 0) {
      const reportMahadasha = report.vimshottari.mahadashas?.find((m: any) => m.planet === upstreamMahadasha.planet);
      expect(reportMahadasha!.evidence).toEqual(upstreamMahadasha.evidence);
    }
  });

  it('should set correct status for unavailable or partial sections without fabricating data', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.currentTransit.status).toBe('UNAVAILABLE');

    // Test with missing divisional interpretation
    const modifiedHoroscope = {
      ...horoscope,
      divisionalInterpretation: { d9: null as any, d10: null as any, d1Comparisons: {} as any, confidence: 'LOW' as const }
    };
    const mockReport = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(mockReport.d9.status).toBe('UNAVAILABLE');
    expect(mockReport.d10.status).toBe('UNAVAILABLE');
  });

  it('should produce deep-frozen immutable report without mutating input', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.birthInformation)).toBe(true);
    expect(Object.isFrozen(report.planets)).toBe(true);

    expect(() => {
      (report as any).version = 'MODIFIED';
    }).toThrow();
  });

  it('should be deterministic', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const reportA = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });
    const reportB = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(JSON.stringify(reportA)).toEqual(JSON.stringify(reportB));
  });

  it('should NOT contain forbidden predictive or speculative keywords in serialized output', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    const serialized = JSON.stringify(report);
    const forbiddenKeywords = ['"prediction"', '"probability"', '"eventDate"', '"score"', '"rank"'];

    for (const keyword of forbiddenKeywords) {
      expect(serialized).not.toContain(keyword);
    }
  });

  it('should verify fullNatalAnalysis is embedded on Horoscope via calculateHoroscope', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    expect(horoscope.fullNatalAnalysis).toBeDefined();
    expect(horoscope.fullNatalAnalysis.version).toBe('P-21-v1');
    expect(horoscope.fullNatalAnalysis.birthInformation.details.dateTimeStr).toBe(
      CANONICAL_BIRTH_DETAILS.dateTimeStr
    );
  });

  it('should not infer keyThemes for major life periods even if theme evidence mentions mahadasha planet', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    for (const period of report.majorLifePeriods.periods) {
      expect(period.keyThemes).toEqual([]);
    }
  });

  it('should populate lifeThemes section with both themes and synthesis observations', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.lifeThemes.themes).toEqual(horoscope.chartSynthesis.themes);
    expect(report.lifeThemes.synthesis).toEqual(horoscope.chartSynthesis.keyObservations);
    expect(report.lifeThemes.status).toBe('AVAILABLE');
  });

  it('should reflect PARTIAL status for partial planets (8 planets)', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const partialHoroscope = {
      ...horoscope,
      planetAnalysis: {
        planets: Object.fromEntries(
          Object.entries(horoscope.planetAnalysis.planets).slice(0, 8)
        ) as any
      }
    };
    const report = buildFullNatalAnalysis({
      horoscope: partialHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.planets.status).toBe('PARTIAL');
    expect(report.planets.planets.length).toBe(8);
  });

  it('should reflect PARTIAL status for partial houses (11 houses)', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const partialHouses = { ...horoscope.houseAnalysis.houses };
    delete (partialHouses as any)[12];

    const partialHoroscope = {
      ...horoscope,
      houseAnalysis: {
        ...horoscope.houseAnalysis,
        houses: partialHouses
      }
    };

    const report = buildFullNatalAnalysis({
      horoscope: partialHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.houses.status).toBe('PARTIAL');
    expect(report.houses.houses.length).toBe(11);
  });

  it('should handle missing lordFacts by setting lordHouse and lordSign to undefined and section status to PARTIAL', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const planetFactsWithoutSaturn = { ...horoscope.planetFacts };
    delete (planetFactsWithoutSaturn as any).SATURN;

    const modifiedHoroscope = {
      ...horoscope,
      planetFacts: planetFactsWithoutSaturn
    };

    const report = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    const saturnHouseItem = report.houses.houses.find((h) => h.lord === 'SATURN');
    if (saturnHouseItem) {
      expect(saturnHouseItem.lordHouse).toBeUndefined();
      expect(saturnHouseItem.lordSign).toBeUndefined();
    }
    expect(report.houses.status).toBe('PARTIAL');
  });

  describe('D01 — Dasha Report Wiring', () => {
    it('wires the calculated Vimshottari result into FullNatalAnalysis', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const report = horoscope.fullNatalAnalysis;

      expect(report.vimshottari.status).toBe('AVAILABLE');
      expect(report.vimshottari.mahadashas).toEqual(horoscope.dashaInterpretation?.mahadashas);
      expect(report.vimshottari.birthAnchor).toEqual(horoscope.dashaInterpretation?.birthAnchor);
      expect(report.vimshottari.mahadashas).toBeDefined();
      expect(report.vimshottari.mahadashas!.length).toBeGreaterThan(0);
      expect(report.vimshottari.birthAnchor).toBeDefined();
      expect(report.vimshottari.birthAnchor!.nakshatra).toBeDefined();
      expect(report.vimshottari.birthAnchor!.nakshatraLord).toBeDefined();

      const mahadashas = report.vimshottari.mahadashas!;
      const firstMahadasha = mahadashas[0];
      const lastMahadasha = mahadashas[mahadashas.length - 1];

      expect(firstMahadasha.start).toBeDefined();
      expect(firstMahadasha.end).toBeDefined();
      expect(typeof firstMahadasha.start).toBe('string');
      expect(typeof firstMahadasha.end).toBe('string');
      expect(Date.parse(firstMahadasha.start)).not.toBeNaN();
      expect(Date.parse(firstMahadasha.end)).not.toBeNaN();

      expect(lastMahadasha.start).toBeDefined();
      expect(lastMahadasha.end).toBeDefined();
      expect(typeof lastMahadasha.start).toBe('string');
      expect(typeof lastMahadasha.end).toBe('string');
      expect(Date.parse(lastMahadasha.start)).not.toBeNaN();
      expect(Date.parse(lastMahadasha.end)).not.toBeNaN();
    });

    it('produces deep-equal fullNatalAnalysis.vimshottari for two calculateHoroscope calls (determinism)', () => {
      const horoscope1 = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const horoscope2 = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

      expect(horoscope1.fullNatalAnalysis.vimshottari).toEqual(horoscope2.fullNatalAnalysis.vimshottari);
    });

    it('produces different report.vimshottari.birthAnchor and mahadashas for two distinct birth details (chart sensitivity)', () => {
      const alternativeBirthDetails: BirthDetails = {
        name: 'Sample New Delhi',
        placeOfBirth: 'New Delhi, India',
        dateTimeStr: '1995-10-24T06:30:00+05:30',
        timeZone: 'Asia/Kolkata',
        latitude: 28.6139,
        longitude: 77.2090,
        ayanamsa: CANONICAL_BIRTH_DETAILS.ayanamsa
      };

      const horoscope1 = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const horoscope2 = calculateHoroscope(alternativeBirthDetails);

      const report1 = horoscope1.fullNatalAnalysis;
      const report2 = horoscope2.fullNatalAnalysis;

      expect(report1.vimshottari.birthAnchor).not.toEqual(report2.vimshottari.birthAnchor);
      expect(report1.vimshottari.mahadashas).not.toEqual(report2.vimshottari.mahadashas);
    });

    it('should handle missing dashaInterpretation gracefully with status UNAVAILABLE', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const modifiedHoroscope = {
        ...horoscope,
        dashaInterpretation: undefined as any
      };

      const report = buildFullNatalAnalysis({
        horoscope: modifiedHoroscope,
        lifeThemes: horoscope.lifeThemes,
        chartSynthesis: horoscope.chartSynthesis
      });

      expect(report.vimshottari.status).toBe('UNAVAILABLE');
      expect(report.vimshottari.birthAnchor).toBeUndefined();
      expect(report.vimshottari.mahadashas).toBeUndefined();
    });
  });

  it('should reflect PARTIAL status for mix of COMPLETE and PARTIAL Shadbala status', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const modifiedPlanets = { ...horoscope.planetaryStrength.planets };
    if (modifiedPlanets.SUN) {
      modifiedPlanets.SUN = {
        ...modifiedPlanets.SUN,
        shadbala: {
          ...modifiedPlanets.SUN.shadbala,
          status: 'PARTIAL'
        } as any
      };
    }

    const modifiedHoroscope = {
      ...horoscope,
      planetaryStrength: {
        ...horoscope.planetaryStrength,
        planets: modifiedPlanets
      }
    };

    const report = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.planetaryStrength.status).toBe('PARTIAL');
  });

  it('should not use house 0 when functional roles are unavailable', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const modifiedHoroscope = {
      ...horoscope,
      functionalRoles: undefined as any
    };

    const report = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.functionalRoles.status).toBe('UNAVAILABLE');
    expect(report.functionalRoles.badhakaHouse).toBeUndefined();
    expect(report.functionalRoles.ascendantSign).toBeUndefined();
    expect(report.functionalRoles.badhakaLord).toBeUndefined();
    expect(report.functionalRoles.items).toEqual([]);
  });

  it('should report lifeThemes as UNAVAILABLE when no themes exist', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    const emptySynthesis = {
      ...horoscope.chartSynthesis,
      themes: []
    };

    const reportEmpty = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: emptySynthesis
    });

    expect(reportEmpty.lifeThemes.status).toBe('UNAVAILABLE');

    const reportFull = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(reportFull.lifeThemes.status).toBe('AVAILABLE');
  });

  it('should not fabricate Yoga strength when upstream does not provide it', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const mockYogas = [
      {
        type: 'GAJA_KESARI' as any,
        category: 'RAJA' as any,
        assessment: { finalStatus: 'PRESENT' as const },
        planets: ['JUPITER' as any, 'MOON' as any],
        houses: [1, 4],
        evidence: []
      }
    ];

    const modifiedHoroscope = {
      ...horoscope,
      yogas: {
        yogas: mockYogas as any
      }
    };

    const report = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.yogas.detected[0].strength).toBeUndefined();
  });

  it('should report majorLifePeriods as UNAVAILABLE when mahadashas array is empty', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const modifiedHoroscope = {
      ...horoscope,
      dashaInterpretation: {
        ...horoscope.dashaInterpretation,
        mahadashas: []
      }
    };

    const report = buildFullNatalAnalysis({
      horoscope: modifiedHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.majorLifePeriods.status).toBe('UNAVAILABLE');
    expect(report.majorLifePeriods.periods).toEqual([]);
  });

  it('should distinguish AVAILABLE vs PARTIAL for D9 and D10', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const report = buildFullNatalAnalysis({
      horoscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(report.d9.status).toBe('AVAILABLE');
    expect(report.d10.status).toBe('AVAILABLE');

    const partialHoroscope = {
      ...horoscope,
      divisionalInterpretation: {
        ...horoscope.divisionalInterpretation,
        d9: {
          ...horoscope.divisionalInterpretation.d9,
          houseLords: {},
          evidence: []
        },
        d10: {
          ...horoscope.divisionalInterpretation.d10,
          houseLords: {},
          evidence: []
        }
      }
    };

    const partialReport = buildFullNatalAnalysis({
      horoscope: partialHoroscope,
      lifeThemes: horoscope.lifeThemes,
      chartSynthesis: horoscope.chartSynthesis
    });

    expect(partialReport.d9.status).toBe('PARTIAL');
    expect(partialReport.d9.details).toBeDefined();
    expect(partialReport.d10.status).toBe('PARTIAL');
    expect(partialReport.d10.details).toBeDefined();
  });
});
