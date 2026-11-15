import { describe, expect, it } from 'vitest';
import { Planet, type BirthDetails } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { buildPlanetaryInfluenceTrace } from '../../engine/planetaryInfluence/planetaryInfluenceTrace';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { buildCareerDashaAnalysis } from './careerDasha/careerDashaIntegration';
import { buildCareerExpression } from './careerExpressionIntegration';
import { buildCareerNatalAnalysis } from './careerNatalConvergence';
import { buildCareerPlanetaryCondition } from './careerPlanetaryConditionIntegration';
import type { CareerPlanetaryRelevance } from './careerPlanetaryRelevance';

type FunctionalClassification = 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL' | 'UNAVAILABLE';

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

describe('CW-10J planetary influence career end-to-end matrix', () => {
  it('executes horoscope → trace → C6 → C8 → C9 across the natural × functional grid', () => {
    const locations = [
      { latitude: -30, longitude: -120 },
      { latitude: 5, longitude: 0 },
      { latitude: 40, longitude: 120 }
    ] as const;
    const baseHoroscopes = locations.map((location) =>
      calculateHoroscope({
        ...CANONICAL_BIRTH_DETAILS,
        ...location
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

  it('checks concrete live-chart Mercury provenance and Venus C6 condition basis', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const traces = buildPlanetaryInfluenceTrace(horoscope);
    const mercury = traces.find((trace) => trace.planet === Planet.MERCURY)!;
    const natal = buildCareerNatalAnalysis({ horoscope });
    const venus = natal.condition.find((item) => item.planet === Planet.VENUS)!;

    const actualAspectSet = (horoscope.natalGrahaDrishti?.aspects ?? [])
      .map((item: any) => ({
        sourcePlanet: item.sourcePlanet,
        targetPlanet: item.targetPlanet,
        aspectType: item.aspectType,
        houseOffset: item.houseOffset
      }))
      .sort((a: any, b: any) =>
        `${a.sourcePlanet}->${a.targetPlanet}:${a.aspectType}:${a.houseOffset}`
          .localeCompare(`${b.sourcePlanet}->${b.targetPlanet}:${b.aspectType}:${b.houseOffset}`)
      );
    expect(actualAspectSet).toEqual([
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.KETU, aspectType: 'SPECIAL_5TH', houseOffset: 4 },
      { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.SATURN, aspectType: 'SPECIAL_9TH', houseOffset: 8 },
      { sourcePlanet: Planet.KETU, targetPlanet: Planet.RAHU, aspectType: 'FULL_7TH', houseOffset: 6 },
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.JUPITER, aspectType: 'SPECIAL_4TH', houseOffset: 3 },
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.KETU, aspectType: 'SPECIAL_8TH', houseOffset: 7 },
      { sourcePlanet: Planet.MARS, targetPlanet: Planet.SUN, aspectType: 'SPECIAL_4TH', houseOffset: 3 },
      { sourcePlanet: Planet.RAHU, targetPlanet: Planet.KETU, aspectType: 'FULL_7TH', houseOffset: 6 },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.RAHU, aspectType: 'SPECIAL_3RD', houseOffset: 2 },
      { sourcePlanet: Planet.SATURN, targetPlanet: Planet.VENUS, aspectType: 'FULL_7TH', houseOffset: 6 },
      { sourcePlanet: Planet.VENUS, targetPlanet: Planet.SATURN, aspectType: 'FULL_7TH', houseOffset: 6 }
    ]);
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
      aspectSource: 'natalGrahaDrishti'
    });
    expect(mercury.evidenceAvailability.factors.aspectSources).toMatchObject({
      status: 'AVAILABLE',
      producerStatus: 'ASSUMED_COMPLETE'
    });
    expect(venus).toMatchObject({
      condition: 'UNAVAILABLE',
      dignity: 'NEUTRAL_SIGN',
      affliction: 'UNAVAILABLE',
      motion: 'DIRECT',
      combustion: 'NOT_COMBUST',
      positiveFactors: [],
      negativeFactors: [],
      assessmentDetails: {
        status: 'PARTIAL',
        missingFactors: ['career.affliction']
      }
    });
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
    earlyChart.natalGrahaDrishti = { ...earlyChart.natalGrahaDrishti, aspects: aspect };
    lateChart.natalGrahaDrishti = { ...lateChart.natalGrahaDrishti, aspects: aspect };
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
