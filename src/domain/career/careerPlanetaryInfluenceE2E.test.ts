import { describe, expect, it } from 'vitest';
import { Planet, type BirthDetails } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { buildPlanetaryInfluenceTrace } from '../../engine/planetaryInfluence/planetaryInfluenceTrace';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { buildCareerDashaAnalysis } from './careerDasha/careerDashaIntegration';
import { buildCareerD10Analysis } from './careerD10/careerD10Integration';
import { buildCareerExpression } from './careerExpressionIntegration';
import { buildCareerNatalAnalysis } from './careerNatalConvergence';
import { buildCareerFinalAnalysis } from './careerFinalSynthesis/careerFinalSynthesisIntegration';
import { buildCareerPlanetaryCondition } from './careerPlanetaryConditionIntegration';
import type { CareerPlanetaryRelevance } from './careerPlanetaryRelevance';

type FunctionalClassification = 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE';
type ExpectedAspect = {
  sourcePlanet: Planet;
  targetPlanet: Planet;
  aspectType: string;
  houseOffset: number;
  sourceSign: string;
  targetSign: string;
};

const FUNCTIONAL_CLASSIFICATIONS: readonly FunctionalClassification[] = [
  'BENEFIC',
  'MALEFIC',
  'MIXED',
  'NEUTRAL',
  'UNAVAILABLE'
];

const NATURAL_SOURCE_CASES = [
  { planet: Planet.JUPITER, natural: 'BENEFIC' as const },
  { planet: Planet.SATURN, natural: 'MALEFIC' as const }
];

const REAL_CHART_ASPECT_EXPECTATIONS: readonly {
  readonly dateTimeStr: string;
  readonly ascendant: string;
  readonly aspects: readonly ExpectedAspect[];
}[] = [
  {
    dateTimeStr: '1988-05-08T09:30:00+05:30',
    ascendant: 'GEMINI',
    aspects: [
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.SUN, aspectType: 'SPECIAL_4TH', houseOffset: 3, sourceSign: 'CAPRICORN', targetSign: 'ARIES' },
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.JUPITER, aspectType: 'SPECIAL_4TH', houseOffset: 3, sourceSign: 'CAPRICORN', targetSign: 'ARIES' },
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.KETU, aspectType: 'SPECIAL_8TH', houseOffset: 7, sourceSign: 'CAPRICORN', targetSign: 'LEO' },
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.SATURN, aspectType: 'SPECIAL_9TH', houseOffset: 8, sourceSign: 'ARIES', targetSign: 'SAGITTARIUS' },
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.KETU, aspectType: 'SPECIAL_5TH', houseOffset: 4, sourceSign: 'ARIES', targetSign: 'LEO' },
      { sourcePlanet: Planet.VENUS, targetPlanet: Planet.SATURN, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'GEMINI', targetSign: 'SAGITTARIUS' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.VENUS, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'SAGITTARIUS', targetSign: 'GEMINI' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.RAHU, aspectType: 'SPECIAL_3RD', houseOffset: 2, sourceSign: 'SAGITTARIUS', targetSign: 'AQUARIUS' },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.KETU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'AQUARIUS', targetSign: 'LEO' },
      { sourcePlanet: Planet.KETU, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'LEO', targetSign: 'AQUARIUS' }
    ]
  },
  {
    dateTimeStr: '1991-08-15T10:15:00+05:30',
    ascendant: 'LIBRA',
    aspects: [
      { sourcePlanet: Planet.SUN, targetPlanet: Planet.SATURN, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CANCER', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.RAHU, aspectType: 'SPECIAL_5TH', houseOffset: 4, sourceSign: 'LEO', targetSign: 'SAGITTARIUS' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.SUN, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CAPRICORN', targetSign: 'CANCER' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MOON, aspectType: 'SPECIAL_10TH', houseOffset: 9, sourceSign: 'CAPRICORN', targetSign: 'LIBRA' },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.KETU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'SAGITTARIUS', targetSign: 'GEMINI' },
      { sourcePlanet: Planet.KETU, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'GEMINI', targetSign: 'SAGITTARIUS' }
    ]
  },
  {
    dateTimeStr: '2000-01-20T21:15:00+05:30',
    ascendant: 'LEO',
    aspects: [
      { sourcePlanet: Planet.SUN, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CAPRICORN', targetSign: 'CANCER' },
      { sourcePlanet: Planet.MOON, targetPlanet: Planet.VENUS, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'GEMINI', targetSign: 'SAGITTARIUS' },
      { sourcePlanet: Planet.MERCURY, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CAPRICORN', targetSign: 'CANCER' },
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.VENUS, aspectType: 'SPECIAL_9TH', houseOffset: 8, sourceSign: 'ARIES', targetSign: 'SAGITTARIUS' },
      { sourcePlanet: Planet.VENUS, targetPlanet: Planet.MOON, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'SAGITTARIUS', targetSign: 'GEMINI' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.SUN, aspectType: 'SPECIAL_10TH', houseOffset: 9, sourceSign: 'ARIES', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MOON, aspectType: 'SPECIAL_3RD', houseOffset: 2, sourceSign: 'ARIES', targetSign: 'GEMINI' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'SPECIAL_10TH', houseOffset: 9, sourceSign: 'ARIES', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.KETU, aspectType: 'SPECIAL_10TH', houseOffset: 9, sourceSign: 'ARIES', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.SUN, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CANCER', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.MERCURY, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CANCER', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.KETU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CANCER', targetSign: 'CAPRICORN' },
      { sourcePlanet: Planet.KETU, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6, sourceSign: 'CAPRICORN', targetSign: 'CANCER' }
    ]
  }
];

function sortedAspectRecords(aspects: readonly any[] | undefined): ExpectedAspect[] {
  return (aspects ?? [])
    .map((aspect) => ({
      sourcePlanet: aspect.sourcePlanet,
      targetPlanet: aspect.targetPlanet,
      aspectType: aspect.aspectType,
      houseOffset: aspect.houseOffset,
      sourceSign: aspect.sourceSign,
      targetSign: aspect.targetSign
    }))
    .sort((a, b) => [
      a.sourcePlanet, a.targetPlanet, a.aspectType, a.houseOffset, a.sourceSign, a.targetSign
    ].join('|').localeCompare([
      b.sourcePlanet, b.targetPlanet, b.aspectType, b.houseOffset, b.sourceSign, b.targetSign
    ].join('|')));
}

function makePrimaryMercuryRelevance(): CareerPlanetaryRelevance {
  return {
    planet: Planet.MERCURY,
    relevance: 'PRIMARY',
    roles: ['CAREER_LORD'],
    reasons: ['EXPLICIT_RULE'],
    effect: 'NEUTRAL',
    expressionHints: [],
    relatedHouses: [10],
    relatedPlanets: [],
    conditional: false,
    statement: 'Synthetic primary relevance for C6 contract validation.'
  };
}

function configureFunctionalNature(
  horoscope: ReturnType<typeof calculateHoroscope>,
  source: Planet,
  functional: FunctionalClassification
): void {
  const resolvedNature = functional === 'UNAVAILABLE' ? undefined : functional;
  const integration = horoscope.functionalNatureIntegration ?? {};
  const integrationPlanets = integration.planets ?? {};
  horoscope.functionalNatureIntegration = {
    ...integration,
    planets: {
      ...integrationPlanets,
      [source]: {
        ...integrationPlanets[source],
        functionalNature: resolvedNature
      }
    }
  };

  const roles = horoscope.functionalRoles ?? {};
  const rolePlanets = roles.planets ?? {};
  horoscope.functionalRoles = {
    ...roles,
    planets: {
      ...rolePlanets,
      [source]: {
        ...rolePlanets[source],
        functionalNature: resolvedNature
      }
    }
  };
}

function expectedSourceNature(
  natural: 'BENEFIC' | 'MALEFIC',
  functional: FunctionalClassification
): 'NATURAL_BENEFIC' | 'NATURAL_MALEFIC' | 'MIXED' {
  if (functional === 'MIXED' ||
      (natural === 'BENEFIC' && functional === 'MALEFIC') ||
      (natural === 'MALEFIC' && functional === 'BENEFIC')) {
    return 'MIXED';
  }
  return natural === 'BENEFIC' ? 'NATURAL_BENEFIC' : 'NATURAL_MALEFIC';
}

function expectedC6Consumption(
  natural: 'BENEFIC' | 'MALEFIC',
  functional: FunctionalClassification
): boolean {
  return functional !== 'MIXED' &&
    !((natural === 'BENEFIC' && functional === 'MALEFIC') ||
      (natural === 'MALEFIC' && functional === 'BENEFIC'));
}

describe('CW-10N independent multi-chart verification', () => {
  describe('synthetic aspect provenance and C6 combinatorial coverage', () => {
  it('executes horoscope → trace → C6 → C8 → C9 across the natural × functional grid', () => {
    const birthTimes = [
      '1988-05-08T03:30:00+05:30',
      '1991-08-15T10:15:00+05:30',
      '2000-01-20T21:15:00+05:30'
    ] as const;
    const baseHoroscopes = birthTimes.map((dateTimeStr) =>
      calculateHoroscope({
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr
      } as BirthDetails)
    );
    const ascendantSigns = new Set(baseHoroscopes.map((horoscope) =>
      horoscope.rasiChart?.ascendantSign
    ));
    expect(ascendantSigns.size).toBeGreaterThan(1);

    let scenario = 0;
    for (const sourceCase of NATURAL_SOURCE_CASES) {
      for (const functional of FUNCTIONAL_CLASSIFICATIONS) {
        const horoscope = structuredClone(baseHoroscopes[scenario % baseHoroscopes.length]);
        scenario += 1;
        configureFunctionalNature(horoscope, sourceCase.planet, functional);
        horoscope.natalGrahaDrishti = {
          ...horoscope.natalGrahaDrishti,
          computationStatus: 'COMPLETE',
          diagnostics: [],
          computationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1',
          aspects: [{
            sourcePlanet: sourceCase.planet,
            targetPlanet: Planet.MERCURY,
            aspectType: 'FULL_7TH',
            houseOffset: 7
          }]
        };

        const trace = buildPlanetaryInfluenceTrace(horoscope).find(
          (item) => item.planet === Planet.MERCURY
        )!;
        const source = [
          ...trace.environmentalInfluence.beneficAspectSources,
          ...trace.environmentalInfluence.maleficAspectSources,
          ...trace.environmentalInfluence.mixedAspectSources,
          ...trace.environmentalInfluence.unassessedAspectSources
        ].find((item) => item.sourcePlanet === sourceCase.planet)!;
        expect(source.sourceNature).toBe(
          expectedSourceNature(sourceCase.natural, functional)
        );
        expect(source.classificationBasis.naturalRule).toBe('NATURAL_BENEFIC_TABLE');
        expect(source.classificationBasis.functionalSource).toBe(
          functional === 'UNAVAILABLE' ? 'NONE' : 'FUNCTIONAL_NATURE_INTEGRATION'
        );

        const c6 = buildCareerPlanetaryCondition({
          horoscope,
          relevance: [makePrimaryMercuryRelevance()]
        }).find((item) => item.planet === Planet.MERCURY)!;
        const c6ConsumesAspect = expectedC6Consumption(sourceCase.natural, functional);
        expect(c6.positiveFactors.some((factor) => factor.type === 'BENEFIC_SUPPORT'))
          .toBe(c6ConsumesAspect && sourceCase.natural === 'BENEFIC');
        expect(c6.negativeFactors.some((factor) => factor.type === 'MALEFIC_PRESSURE'))
          .toBe(c6ConsumesAspect && sourceCase.natural === 'MALEFIC');
        const c6AspectSource = [
          ...(c6.planetaryInfluenceTrace?.environmentalInfluence.beneficAspectSources ?? []),
          ...(c6.planetaryInfluenceTrace?.environmentalInfluence.maleficAspectSources ?? []),
          ...(c6.planetaryInfluenceTrace?.environmentalInfluence.mixedAspectSources ?? []),
          ...(c6.planetaryInfluenceTrace?.environmentalInfluence.unassessedAspectSources ?? [])
        ].find((item) => item.sourcePlanet === sourceCase.planet);
        expect(c6AspectSource?.classificationBasis.consumedBy).toEqual(
          c6ConsumesAspect
            ? [sourceCase.natural === 'BENEFIC'
                ? 'CAREER_C6_BENEFIC_SUPPORT'
                : 'CAREER_C6_MALEFIC_PRESSURE']
            : []
        );
        if (!c6ConsumesAspect) {
          expect(c6.nonConsumedInfluence).toEqual([
            expect.objectContaining({ reason: 'MIXED_CLASSIFICATION' })
          ]);
        }

        const natal = buildCareerNatalAnalysis({ horoscope });
        const c8 = buildCareerExpression({ natal });
        const c9 = buildCareerDashaAnalysis({ horoscope, natal, expression: c8 });
        expect(natal.condition).toHaveLength(9);
        expect(c8).toHaveProperty('expressions');
        expect(c9).toMatchObject({ md: expect.any(Object), ad: expect.any(Object), pd: expect.any(Object) });

        const changedIntrinsic = structuredClone(horoscope);
        changedIntrinsic.planetFacts[Planet.MERCURY].dignity.status = 'DEBILITATED' as never;
        changedIntrinsic.planetFacts[Planet.MERCURY].state.condition = undefined as never;
        const changedTrace = buildPlanetaryInfluenceTrace(changedIntrinsic).find(
          (item) => item.planet === Planet.MERCURY
        )!;
        expect(changedTrace.environmentalInfluence).toMatchObject({
          beneficAspectSources: trace.environmentalInfluence.beneficAspectSources,
          maleficAspectSources: trace.environmentalInfluence.maleficAspectSources,
          mixedAspectSources: trace.environmentalInfluence.mixedAspectSources,
          unassessedAspectSources: trace.environmentalInfluence.unassessedAspectSources
        });
      }
    }
    expect(scenario).toBe(10);
  });
  });

  describe('real chart and aspect-engine regression expectations', () => {
  it('matches full computed aspect records for three explicitly specified charts', () => {
    for (const fixture of REAL_CHART_ASPECT_EXPECTATIONS) {
      const horoscope = calculateHoroscope({
        ...CANONICAL_BIRTH_DETAILS,
        dateTimeStr: fixture.dateTimeStr
      } as BirthDetails);
      const trace = buildPlanetaryInfluenceTrace(horoscope);
      const tracedAspectRecords = trace.flatMap((planetTrace) => [
        ...planetTrace.environmentalInfluence.beneficAspectSources,
        ...planetTrace.environmentalInfluence.maleficAspectSources,
        ...planetTrace.environmentalInfluence.mixedAspectSources,
        ...planetTrace.environmentalInfluence.unassessedAspectSources
      ]);

      expect(horoscope.rasiChart?.ascendantSign).toBe(fixture.ascendant);
      expect(sortedAspectRecords(horoscope.natalGrahaDrishti?.aspects))
        .toEqual(sortedAspectRecords(fixture.aspects));
      expect(sortedAspectRecords(tracedAspectRecords)).toEqual(
        sortedAspectRecords(fixture.aspects)
      );
      expect(horoscope.natalGrahaDrishti?.computationStatus).toBe('COMPLETE');
      expect(trace).toHaveLength(9);
    }
  });

  it('checks concrete live-chart Mercury provenance and Venus C6 condition basis', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const traces = buildPlanetaryInfluenceTrace(horoscope);
    const mercury = traces.find((trace) => trace.planet === Planet.MERCURY)!;
    const natal = buildCareerNatalAnalysis({ horoscope });
    const venus = natal.condition.find((item) => item.planet === Planet.VENUS)!;

    expect(horoscope.natalGrahaDrishti?.computationMethod)
      .toBe('GRAHA_DRISHTI_HOUSE_BASED_V1');
    expect(mercury.calculationContext.aspectComputationMethod)
      .toBe(horoscope.natalGrahaDrishti?.computationMethod);
    expect(venus.planetaryInfluenceTrace?.calculationContext.aspectComputationMethod)
      .toBe(horoscope.natalGrahaDrishti?.computationMethod);
    expect(mercury.environmentalInfluence).toMatchObject({
      beneficAspectSources: [],
      maleficAspectSources: [],
      mixedAspectSources: [],
      unassessedAspectSources: []
    });
    expect(mercury.calculationContext).toEqual({
      zodiac: 'SIDEREAL',
      ayanamsa: { value: 'LAHIRI', status: 'DECLARED' },
      houseSystem: { value: 'WHOLE_SIGN', status: 'DEFAULTED' },
      engineVersion: 'P-21-v1',
      aspectSource: 'natalGrahaDrishti',
      aspectComputationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1'
    });
    expect(mercury.evidenceAvailability.factors.aspectSources).toMatchObject({
      status: 'AVAILABLE',
      producerStatus: 'COMPLETE'
    });
    expect(venus).toMatchObject({
      condition: 'INSUFFICIENT_DATA',
      dignity: 'NEUTRAL_SIGN',
      affliction: 'UNAVAILABLE',
      motion: 'DIRECT',
      combustion: 'NOT_COMBUST',
      positiveFactors: [],
      negativeFactors: [],
      assessmentDetails: {
        status: 'PARTIAL',
        missingFactors: [],
        partiallyResolvedFactors: ['aspectSources']
      }
    });
    expect(venus.planetaryInfluenceTrace?.environmentalInfluence.mixedAspectSources)
      .toEqual([expect.objectContaining({
        sourcePlanet: Planet.SATURN,
        targetPlanet: Planet.VENUS,
        aspectType: 'FULL_7TH',
        houseOffset: 6,
        sourceSign: 'SAGITTARIUS',
        targetSign: 'GEMINI',
        sourceNature: 'MIXED',
        naturalNature: 'MALEFIC',
        functionalNature: 'MIXED',
        classificationBasis: {
          naturalRule: 'NATURAL_BENEFIC_TABLE',
          functionalSource: 'FUNCTIONAL_NATURE_INTEGRATION',
          consumedBy: []
        }
      })]);
  });

  it('derives functional classification from distinct ascendants at different birth times', () => {
    const sameLocation = {
      latitude: CANONICAL_BIRTH_DETAILS.latitude,
      longitude: CANONICAL_BIRTH_DETAILS.longitude,
      timeZone: CANONICAL_BIRTH_DETAILS.timeZone,
      ayanamsa: CANONICAL_BIRTH_DETAILS.ayanamsa
    };
    const earlyChart = calculateHoroscope({
      ...sameLocation,
      dateTimeStr: '1988-05-08T03:30:00+05:30'
    });
    const lateChart = calculateHoroscope({
      ...sameLocation,
      dateTimeStr: '1988-05-08T09:30:00+05:30'
    });
    const earlyAscendant = earlyChart.rasiChart?.ascendantSign;
    const lateAscendant = lateChart.rasiChart?.ascendantSign;
    const earlyNature = earlyChart.functionalNatureIntegration?.planets?.[Planet.MERCURY]
      ?.functionalNature;
    const lateNature = lateChart.functionalNatureIntegration?.planets?.[Planet.MERCURY]
      ?.functionalNature;
    const aspect = [{
      sourcePlanet: Planet.MERCURY,
      targetPlanet: Planet.JUPITER,
      aspectType: 'FULL_7TH'
    }];
    earlyChart.natalGrahaDrishti = {
      ...earlyChart.natalGrahaDrishti,
      computationStatus: 'COMPLETE',
      diagnostics: [],
      computationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1',
      aspects: aspect
    };
    lateChart.natalGrahaDrishti = {
      ...lateChart.natalGrahaDrishti,
      computationStatus: 'COMPLETE',
      diagnostics: [],
      computationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1',
      aspects: aspect
    };
    const earlyJupiter = buildPlanetaryInfluenceTrace(earlyChart).find(
      (item) => item.planet === Planet.JUPITER
    )!;
    const lateJupiter = buildPlanetaryInfluenceTrace(lateChart).find(
      (item) => item.planet === Planet.JUPITER
    )!;

    expect(earlyAscendant).toBeDefined();
    expect(lateAscendant).toBeDefined();
    expect(earlyAscendant).not.toBe(lateAscendant);
    expect(earlyNature).not.toBe(lateNature);
    expect(
      [
        ...earlyJupiter.environmentalInfluence.beneficAspectSources,
        ...earlyJupiter.environmentalInfluence.maleficAspectSources,
        ...earlyJupiter.environmentalInfluence.mixedAspectSources,
        ...earlyJupiter.environmentalInfluence.unassessedAspectSources
      ].find((item) => item.sourcePlanet === Planet.MERCURY)?.functionalNature
    ).toBe(earlyNature);
    expect(
      [
        ...lateJupiter.environmentalInfluence.beneficAspectSources,
        ...lateJupiter.environmentalInfluence.maleficAspectSources,
        ...lateJupiter.environmentalInfluence.mixedAspectSources,
        ...lateJupiter.environmentalInfluence.unassessedAspectSources
      ].find((item) => item.sourcePlanet === Planet.MERCURY)?.functionalNature
    ).toBe(lateNature);
  });
  });

  describe('C6 → C8 → C9 outcome and evidence contract', () => {
    it('asserts actual MD, AD, and PD effects, directions, and evidence IDs', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      horoscope.dashaInterpretation = {
        current: {
          mahadasha: { planet: Planet.SATURN, start: '2020-01-01', end: '2025-01-01' },
          antardasha: { planet: Planet.JUPITER, start: '2022-01-01', end: '2023-01-01' },
          pratyantardasha: { planet: Planet.MERCURY, start: '2022-06-01', end: '2022-08-01' }
        }
      };
      const natal = buildCareerNatalAnalysis({ horoscope });
      const venus = natal.condition.find((item) => item.planet === Planet.VENUS)!;
      const expression = buildCareerExpression({ natal });
      const dasha = buildCareerDashaAnalysis({ horoscope, natal, expression });

      expect(venus).toMatchObject({
        condition: 'INSUFFICIENT_DATA',
        assessment: 'PARTIAL',
        assessmentDetails: {
          missingFactors: [],
          partiallyResolvedFactors: ['aspectSources']
        }
      });
      expect(expression.expressions.map((item) => ({
        mode: item.mode,
        direction: item.direction,
        evidenceIds: item.evidence.map((evidence) => evidence.id)
      }))).toEqual([
        { mode: 'MANAGEMENT', direction: 'CONDITIONAL', evidenceIds: ['CAREER.EXPRESSION.MANAGEMENT'] },
        { mode: 'TECHNICAL_SPECIALIZATION', direction: 'SUPPORTED', evidenceIds: ['CAREER.EXPRESSION.TECHNICAL_SPECIALIZATION'] },
        { mode: 'PUBLIC_INSTITUTIONAL', direction: 'CONDITIONAL', evidenceIds: ['CAREER.EXPRESSION.PUBLIC_INSTITUTIONAL'] },
        { mode: 'EMPLOYMENT', direction: 'CONDITIONAL', evidenceIds: ['CAREER.EXPRESSION.EMPLOYMENT'] }
      ]);
      expect([
        { level: 'MD', effect: dasha.md.effect, direction: dasha.md.direction },
        { level: 'AD', effect: dasha.ad.effect, direction: dasha.ad.direction },
        { level: 'PD', effect: dasha.pd.effect, direction: dasha.pd.direction }
      ]).toEqual([
        { level: 'MD', effect: 'DOES_NOT_ACTIVATE', direction: 'NEUTRAL' },
        { level: 'AD', effect: 'CHALLENGES', direction: 'CHALLENGE' },
        { level: 'PD', effect: 'ACTIVATES', direction: 'NEUTRAL' }
      ]);
      expect([dasha.md, dasha.ad, dasha.pd].map((period) =>
        dasha.evidence.find((item) => item.level === period.level)?.id
      )).toEqual([
        'CAREER_DASHA:MD:SATURN:PRIMARY_DRIVER:DOES_NOT_ACTIVATE',
        'CAREER_DASHA:AD:JUPITER:MODIFIER:CHALLENGES',
        'CAREER_DASHA:PD:MERCURY:REFINEMENT:ACTIVATES'
      ]);
    });

    it('produces independent MD/AD/PD outcomes from C6/C8 inputs and preserves generated IDs through C11', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      horoscope.dashaInterpretation = {
        current: {
          mahadasha: { planet: Planet.SATURN, start: '2020-01-01', end: '2025-01-01' },
          antardasha: { planet: Planet.JUPITER, start: '2022-01-01', end: '2023-01-01' },
          pratyantardasha: { planet: Planet.MERCURY, start: '2022-06-01', end: '2022-08-01' }
        }
      };

      const baseNatal = buildCareerNatalAnalysis({ horoscope });
      const getRelevantPlanet = (planet: Planet) => {
        const relevance = baseNatal.relevance.find(item => item.planet === planet);
        const condition = baseNatal.condition.find(item => item.planet === planet);
        if (!relevance || !condition) {
          throw new Error(`Missing C5/C6 producer evidence for ${planet}`);
        }
        return { relevance, condition };
      };
      const saturn = getRelevantPlanet(Planet.SATURN);
      const mercury = getRelevantPlanet(Planet.MERCURY);

      const producerNatal = Object.freeze({
        ...baseNatal,
        relevance: Object.freeze(baseNatal.relevance
          .filter(item => item.planet !== Planet.JUPITER)
          .map(item => item.planet === Planet.SATURN || item.planet === Planet.MERCURY
            ? { ...item, relevance: 'PRIMARY' as const }
            : item)),
        condition: Object.freeze([
          ...baseNatal.condition.filter(item =>
            item.planet !== Planet.SATURN && item.planet !== Planet.MERCURY
          ),
          { ...saturn.condition, condition: 'STRONG' as const, assessment: 'FULL' as const, afflictionAssessed: true },
          { ...mercury.condition, condition: 'STRONG' as const, assessment: 'PARTIAL' as const, afflictionAssessed: false }
        ])
      });
      const expression = Object.freeze({
        expressions: Object.freeze([]),
        statement: 'C8 analysis executed; no expression evidence was emitted.',
        analysisStatus: 'EXECUTED' as const
      });

      const generatedDasha = buildCareerDashaAnalysis({
        horoscope,
        natal: producerNatal,
        expression
      });
      const d10 = buildCareerD10Analysis({
        horoscope,
        natal: producerNatal,
        expression
      });
      const c11 = buildCareerFinalAnalysis({
        natal: producerNatal,
        expression,
        dasha: generatedDasha,
        d10
      });

      expect([generatedDasha.md, generatedDasha.ad, generatedDasha.pd].map(period => ({
        level: period.level,
        expressionAnalysisStatus: period.expressionAnalysisStatus,
        conditionAssessment: period.conditionAssessment,
        diagnostics: period.diagnostics
      }))).toEqual([
        {
          level: 'MD',
          expressionAnalysisStatus: 'EXECUTED',
          conditionAssessment: 'FULL',
          diagnostics: ['C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE']
        },
        {
          level: 'AD',
          expressionAnalysisStatus: 'UNAVAILABLE',
          conditionAssessment: 'UNAVAILABLE',
          diagnostics: ['C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE']
        },
        {
          level: 'PD',
          expressionAnalysisStatus: 'EXECUTED',
          conditionAssessment: 'PARTIAL',
          diagnostics: [
            'C9_EFFECTS_BASED_ON_PARTIAL_CONDITION_ASSESSMENT',
            'C9_PROVENANCE_INCOMPLETE_UPSTREAM_IDS_UNAVAILABLE'
          ]
        }
      ]);
      expect(generatedDasha.hierarchy?.diagnosticTrace?.planetContextResolution).toEqual([
        { level: 'MD', planet: Planet.SATURN, resolved: true },
        { level: 'AD', planet: Planet.JUPITER, resolved: false },
        { level: 'PD', planet: Planet.MERCURY, resolved: true }
      ]);

      const expectedC9IdentityKeys = [
        'CAREER_DASHA:MD:SATURN:PRIMARY_DRIVER',
        'CAREER_DASHA:AD:JUPITER:MODIFIER',
        'CAREER_DASHA:PD:MERCURY:REFINEMENT'
      ];
      expect([generatedDasha.md, generatedDasha.ad, generatedDasha.pd]
        .map(period => generatedDasha.evidence.find(item => item.level === period.level)?.identityKey))
        .toEqual(expectedC9IdentityKeys);
      expect(c11.evidenceIds).toEqual(expect.arrayContaining([
        expectedC9IdentityKeys[0],
        expectedC9IdentityKeys[2]
      ]));
      expect(c11.evidenceIds).not.toContain(expectedC9IdentityKeys[1]);
      expect(c11.sourceIds).toEqual(expect.arrayContaining(
        generatedDasha.evidence.flatMap(item => item.sourceIds)
      ));
    });

    it('propagation fixture: carries independent MD/AD/PD statuses and provenance through D10 and C11', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      horoscope.dashaInterpretation = {
        current: {
          mahadasha: { planet: Planet.SATURN, start: '2020-01-01', end: '2025-01-01' },
          antardasha: { planet: Planet.JUPITER, start: '2022-01-01', end: '2023-01-01' },
          pratyantardasha: { planet: Planet.MERCURY, start: '2022-06-01', end: '2022-08-01' }
        }
      };

      const natal = buildCareerNatalAnalysis({ horoscope });
      expect(natal.condition.length).toBeGreaterThan(0);
      const expression = buildCareerExpression({ natal });
      const generatedDasha = buildCareerDashaAnalysis({ horoscope, natal, expression });
      const d10 = buildCareerD10Analysis({ horoscope, natal, expression });

      const perLevel = {
        MD: {
          expressionAnalysisStatus: 'EXECUTED' as const,
          conditionAssessment: 'FULL' as const,
          diagnostics: [] as const
        },
        AD: {
          expressionAnalysisStatus: 'UNAVAILABLE' as const,
          conditionAssessment: 'UNAVAILABLE' as const,
          diagnostics: ['C9_PRIMARY_FALLBACK_EXPRESSION_ANALYSIS_UNAVAILABLE'] as const
        },
        PD: {
          expressionAnalysisStatus: 'EXECUTED' as const,
          conditionAssessment: 'PARTIAL' as const,
          diagnostics: ['C9_EFFECTS_BASED_ON_PARTIAL_CONDITION_ASSESSMENT'] as const
        }
      };
      const mappableEvidence = ([
        ['MD', 'SUPPORT', 'ACTIVATES'],
        ['AD', 'CHALLENGE', 'CHALLENGES'],
        ['PD', 'SUPPORT', 'ACTIVATES']
      ] as const).map(([level, direction, effect]) => {
        const source = generatedDasha.evidence.find(item => item.level === level);
        if (!source) {
          throw new Error(`Missing generated C9 evidence for ${level}`);
        }
        return {
          ...source,
          identityKey: `cross-layer:${level}`,
          id: `cross-layer-occurrence:${level}`,
          direction,
          effect,
          strength: 'MODERATE' as const,
          statement: `Cross-layer ${level} evidence fixture.`,
          sourceIds: [`cross-layer-source:${level}`],
          provenance: {
            ...source.provenance,
            activationLevel: level,
            ruleIds: [`cross-layer-rule:${level}`]
          }
        };
      });
      const independentlyAssessedDasha = {
        ...generatedDasha,
        md: { ...generatedDasha.md, ...perLevel.MD },
        ad: { ...generatedDasha.ad, ...perLevel.AD },
        pd: { ...generatedDasha.pd, ...perLevel.PD },
        evidence: [
          ...generatedDasha.evidence.map(item => ({
            ...item,
            ...(item.level === 'MD' ? perLevel.MD :
              item.level === 'AD' ? perLevel.AD : perLevel.PD)
          })),
          ...mappableEvidence.map(item => ({
            ...item,
            ...(item.level === 'MD' ? perLevel.MD :
              item.level === 'AD' ? perLevel.AD : perLevel.PD)
          }))
        ]
      };

      expect([
        independentlyAssessedDasha.md,
        independentlyAssessedDasha.ad,
        independentlyAssessedDasha.pd
      ].map(({ expressionAnalysisStatus, conditionAssessment, diagnostics }) => ({
        expressionAnalysisStatus,
        conditionAssessment,
        diagnostics
      }))).toEqual([
        perLevel.MD,
        perLevel.AD,
        perLevel.PD
      ]);

      for (const [level, period] of [
        ['MD', independentlyAssessedDasha.md],
        ['AD', independentlyAssessedDasha.ad],
        ['PD', independentlyAssessedDasha.pd]
      ] as const) {
        const levelEvidence = independentlyAssessedDasha.evidence.filter(item => item.level === level);
        expect(levelEvidence.length).toBeGreaterThan(0);
        expect(levelEvidence.every(item =>
          item.expressionAnalysisStatus === perLevel[level].expressionAnalysisStatus &&
          item.conditionAssessment === perLevel[level].conditionAssessment
        )).toBe(true);
        expect(levelEvidence.map(item => item.diagnostics)).toEqual(
          Array.from({ length: levelEvidence.length }, () => [...perLevel[level].diagnostics])
        );
        expect(period.expressionAnalysisStatus).toBe(perLevel[level].expressionAnalysisStatus);
      }

      const c11 = buildCareerFinalAnalysis({
        natal,
        expression,
        dasha: independentlyAssessedDasha,
        d10
      });
      const allC9SourceIds = independentlyAssessedDasha.evidence.flatMap(item => item.sourceIds);
      expect(c11.sourceIds).toEqual(expect.arrayContaining(allC9SourceIds));
      for (const level of ['MD', 'AD', 'PD'] as const) {
        expect(c11.evidenceIds).toContain(`cross-layer:${level}`);
      }
      expect(independentlyAssessedDasha.ad.expressionAnalysisStatus).toBe('UNAVAILABLE');
      expect(independentlyAssessedDasha.md.expressionAnalysisStatus).toBe('EXECUTED');
      expect(independentlyAssessedDasha.pd.expressionAnalysisStatus).toBe('EXECUTED');
    });
  });

  describe('missing and conflicting inputs preserve uncertainty', () => {
    it('quarantines malformed aspects and keeps C6/C9 direction unavailable', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      horoscope.dashaInterpretation = {
        current: {
          mahadasha: { planet: Planet.SATURN, start: '2020-01-01', end: '2025-01-01' },
          antardasha: { planet: Planet.JUPITER, start: '2022-01-01', end: '2023-01-01' },
          pratyantardasha: { planet: Planet.MERCURY, start: '2022-06-01', end: '2022-08-01' }
        }
      };
      horoscope.natalGrahaDrishti = {
        ...horoscope.natalGrahaDrishti,
        computationStatus: 'PARTIAL',
        diagnostics: [],
        computationMethod: 'GRAHA_DRISHTI_HOUSE_BASED_V1',
        aspects: [{
          sourcePlanet: 'NOT_A_PLANET',
          targetPlanet: Planet.SATURN,
          aspectType: 'FULL_7TH',
          houseOffset: 6
        }] as any[]
      };
      const trace = buildPlanetaryInfluenceTrace(horoscope).find(
        (item) => item.planet === Planet.SATURN
      )!;
      const natal = buildCareerNatalAnalysis({ horoscope });
      const saturn = natal.condition.find((item) => item.planet === Planet.SATURN)!;
      const expression = buildCareerExpression({ natal });
      const dasha = buildCareerDashaAnalysis({ horoscope, natal, expression });
      const mdEvidence = dasha.evidence.find((item) => item.level === 'MD');

      expect(trace.evidenceAvailability.factors.aspectSources.status).toBe('PARTIAL');
      expect(trace.environmentalInfluence).toMatchObject({
        beneficAspectSources: [],
        maleficAspectSources: [],
        mixedAspectSources: [],
        unassessedAspectSources: []
      });
      expect(trace.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ factor: 'aspectSources', reason: 'INVALID_SOURCE_PLANET' })
      ]));
      expect(saturn).toMatchObject({
        condition: 'INSUFFICIENT_DATA',
        assessment: 'PARTIAL',
        assessmentDetails: { missingFactors: ['aspectSources'] },
        positiveFactors: [],
        negativeFactors: []
      });
      expect(dasha.md.direction).toBe('UNAVAILABLE');
      expect(dasha.md.effect).toBe('DOES_NOT_ACTIVATE');
      expect(dasha.md.effect).not.toBe('CHALLENGES');
      expect(mdEvidence).toMatchObject({
        direction: 'UNAVAILABLE',
        conditionAssessment: 'PARTIAL'
      });
      expect(mdEvidence?.sourceIds).toContain(
        'MD:SATURN:PRIMARY_DRIVER:UNAVAILABLE:CONDITION:INSUFFICIENT_DATA'
      );
    });
  });
});
