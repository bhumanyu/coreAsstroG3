import { describe, expect, it } from 'vitest';
import {
  DignityStatus,
  Planet,
  PlanetStateCondition,
  Sign,
  type Horoscope,
  type PlanetFact
} from '../../../types';
import { calculateHoroscope } from '../../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import {
  resolvePlanetaryAspects,
  type PlanetaryAspectInfluence
} from '../aspectInfluence';
import { resolvePlanetaryRelationships } from '../planetaryRelationships';
import { buildPlanetaryInfluenceTrace } from '../planetaryInfluenceTrace';
import { analyzeHouseLordship } from '../../houseLordship/houseLordship';
import { analyzeFunctionalRoles } from '../../functionalNature/functionalRoles';

const PLANETS: readonly Planet[] = [
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
];

type SyntheticOptions = {
  readonly aspects?: readonly Record<string, unknown>[];
  readonly missingAspects?: boolean;
  readonly missingPlanet?: Planet;
  readonly missingCombustion?: Planet;
  readonly dignity?: Partial<Record<Planet, DignityStatus>>;
  readonly functionalNature?: Partial<Record<Planet, 'BENEFIC' | 'MALEFIC' | 'MIXED' | 'NEUTRAL'>>;
  readonly coLocated?: readonly Planet[];
  readonly yogaEvidence?: readonly {
    readonly relationship: 'CONJUNCTION' | 'MUTUAL_ASPECT' | 'EXCHANGE';
    readonly planets: readonly Planet[];
    readonly ruleId: string;
    readonly reason: string;
  }[];
  readonly includeShadbala?: boolean;
  readonly includeStructuralRoles?: boolean;
  readonly ownedHouses?: readonly number[];
  readonly motion?: { readonly retrograde: boolean; readonly stationary: boolean };
  readonly combustion?: PlanetStateCondition;
  readonly unassessedNaturalSource?: Planet;
};

function makePlanetFact(planet: Planet, house: number, longitude: number): PlanetFact {
  return {
    planet,
    position: {
      planet,
      longitude,
      eclipticLongitude: longitude,
      sign: Sign.ARIES,
      house,
      signLongitude: longitude % 30,
      motion: { speed: 1, retrograde: false, stationary: false }
    },
    dignity: { planet, sign: Sign.ARIES, status: DignityStatus.NEUTRAL },
    state: {
      planet,
      condition: PlanetStateCondition.NORMAL,
      motion: { speed: 1, retrograde: false, stationary: false }
    },
    sign: Sign.ARIES,
    house
  };
}

function makeHoroscope(options: SyntheticOptions = {}): Horoscope {
  const planetFacts = Object.fromEntries(
    PLANETS.map((planet, index) => {
      const isMissing = planet === options.missingPlanet;
      const house = options.coLocated
        ? options.coLocated.includes(planet) ? 1 : index + 2
        : index + 1;
      const longitude = options.coLocated?.includes(planet) ? index * 2 : index * 40;
      const fact = makePlanetFact(planet, house, longitude);
      if (options.missingCombustion === planet) {
        fact.state = {
          ...fact.state,
          condition: undefined as unknown as PlanetStateCondition
        };
      }
      if (options.combustion && planet === Planet.MERCURY) {
        fact.state = { ...fact.state, condition: options.combustion };
      }
      if (options.motion && planet === Planet.MERCURY) {
        fact.state = {
          ...fact.state,
          motion: {
            speed: options.motion.stationary ? 0 : options.motion.retrograde ? -1 : 1,
            retrograde: options.motion.retrograde,
            stationary: options.motion.stationary
          }
        };
      }
      if (options.unassessedNaturalSource === planet) {
        fact.position = { ...fact.position, eclipticLongitude: undefined };
      }
      if (options.dignity?.[planet]) {
        fact.dignity = { ...fact.dignity, status: options.dignity[planet]! };
      }
      return [planet, isMissing ? undefined : fact];
    })
  );
  const functionalNature = Object.fromEntries(
    PLANETS.map((planet) => [
      planet,
      {
        planet,
        ownedHouses: options.includeStructuralRoles === false
          ? undefined
          : [...(options.ownedHouses ?? [1, 10])],
        functionalNature: options.functionalNature?.[planet] ?? 'NEUTRAL'
      }
    ])
  );
  const horoscope = {
    planetFacts,
    natalGrahaDrishti: options.missingAspects
      ? undefined
      : { aspects: [...(options.aspects ?? [])] },
    functionalNatureIntegration: { planets: functionalNature },
    houseLordship: options.includeStructuralRoles === false
      ? undefined
      : {
          planetLordships: Object.fromEntries(
            PLANETS.map((planet) => [
              planet,
              { ownedHouses: [...(options.ownedHouses ?? [1, 10])] }
            ])
          )
        },
    yogas: {
      yogas: options.yogaEvidence?.length
        ? [{
            type: 'SYNTHETIC_RELATIONSHIP',
            category: 'RAJA',
            strength: 'STRONG',
            planets: [...new Set(options.yogaEvidence.flatMap((evidence) => evidence.planets))],
            houses: [],
            evidence: options.yogaEvidence
          }]
        : []
    },
    planetaryStrength: options.includeShadbala === false
      ? undefined
      : {
          planets: Object.fromEntries(
            PLANETS.map((planet) => [
              planet,
              { shadbala: { status: 'COMPLETE', totalRupa: 6, totalShastiamsa: 360, meetsMinimum: true } }
            ])
          )
        }
  };
  return horoscope as unknown as Horoscope;
}

function sourceFor(
  horoscope: Horoscope,
  planet: Planet
): PlanetaryAspectInfluence | undefined {
  return [
    ...resolvePlanetaryAspects(horoscope, Planet.MERCURY).beneficSources,
    ...resolvePlanetaryAspects(horoscope, Planet.MERCURY).maleficSources,
    ...resolvePlanetaryAspects(horoscope, Planet.MERCURY).mixedSources,
    ...resolvePlanetaryAspects(horoscope, Planet.MERCURY).unassessedSources
  ].find((source) => source.sourcePlanet === planet);
}

describe('CW-10E synthetic planetary influence matrix', () => {
  it.each([
    [DignityStatus.EXALTED, PlanetStateCondition.NORMAL, false, false],
    [DignityStatus.DEBILITATED, PlanetStateCondition.COMBUST, true, false],
    [DignityStatus.OWN_SIGN, PlanetStateCondition.DEEP_COMBUST, false, true]
  ] as const)(
    'retains dignity, combustion, and motion independently (%s / %s)',
    (dignity, combustion, retrograde, stationary) => {
      const horoscope = makeHoroscope({
        dignity: { [Planet.JUPITER]: dignity },
        includeShadbala: true
      });
      const fact = horoscope.planetFacts[Planet.JUPITER];
      fact.state = {
        ...fact.state,
        condition: combustion,
        motion: { speed: stationary ? 0 : retrograde ? -1 : 1, retrograde, stationary }
      };

      const trace = buildPlanetaryInfluenceTrace(horoscope).find(
        (item) => item.planet === Planet.JUPITER
      )!;
      expect(trace.intrinsicStrength).toMatchObject({
        dignity,
        combustion,
        motion: { retrograde, stationary }
      });
    }
  );

  it.each([
    ['natural benefic', Planet.JUPITER, undefined, 'NATURAL_BENEFIC'],
    ['natural malefic', Planet.SATURN, undefined, 'NATURAL_MALEFIC'],
    ['conflicting function', Planet.SATURN, 'BENEFIC', 'MIXED'],
    ['mixed function', Planet.JUPITER, 'MIXED', 'MIXED']
  ] as const)('classifies aspect provenance without collapsing a conflict (%s)', (_label, sourcePlanet, functional, expectedNature) => {
    const horoscope = makeHoroscope({
      aspects: [{
        sourcePlanet,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SPECIAL',
        houseOffset: 4,
        description: 'Synthetic aspect provenance'
      }],
      ...(functional ? { functionalNature: { [sourcePlanet]: functional } } : {})
    });

    expect(sourceFor(horoscope, sourcePlanet)?.sourceNature).toBe(expectedNature);
    expect(sourceFor(horoscope, sourcePlanet)?.aspectType).toBe('SPECIAL');
    expect(sourceFor(horoscope, sourcePlanet)?.houseOffset).toBe(4);
    expect(sourceFor(horoscope, sourcePlanet)?.classificationBasis).toMatchObject({
      naturalRule: 'NATURAL_BENEFIC_TABLE',
      consumedBy: []
    });
  });

  it('preserves multiple benefic, malefic, and mixed aspect sources independently', () => {
    const horoscope = makeHoroscope({
      aspects: [
        { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'FULL' },
        { sourcePlanet: Planet.VENUS, targetPlanet: Planet.MERCURY, aspectType: 'FULL' },
        { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY, aspectType: 'SPECIAL' }
      ],
      functionalNature: { [Planet.SATURN]: 'BENEFIC' }
    });
    const result = resolvePlanetaryAspects(horoscope, Planet.MERCURY);

    expect(result.beneficSources.map((source) => source.sourcePlanet)).toEqual([
      Planet.JUPITER,
      Planet.VENUS
    ]);
    expect(result.mixedSources.map((source) => source.sourcePlanet)).toEqual([Planet.SATURN]);
    expect(result.maleficSources).toEqual([]);
  });

  it('distinguishes functional-only and unassessed aspect sources', () => {
    const functionalOnly = makeHoroscope({
      aspects: [{
        sourcePlanet: Planet.MOON,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SYNTHETIC'
      }],
      functionalNature: { [Planet.MOON]: 'BENEFIC' }
    });
    functionalOnly.planetFacts[Planet.SUN].position = {
      ...functionalOnly.planetFacts[Planet.SUN].position,
      eclipticLongitude: undefined
    };
    functionalOnly.planetFacts[Planet.MOON].position = {
      ...functionalOnly.planetFacts[Planet.MOON].position,
      eclipticLongitude: undefined
    };
    const unassessed = resolvePlanetaryAspects(functionalOnly, Planet.MERCURY);

    expect(unassessed.beneficSources[0]).toMatchObject({
      sourcePlanet: Planet.MOON,
      sourceNature: 'FUNCTIONAL_BENEFIC',
      functionalNature: 'BENEFIC'
    });
    expect(unassessed.beneficSources[0].classificationBasis).toMatchObject({
      naturalRule: 'MOON_PHASE',
      functionalSource: 'FUNCTIONAL_NATURE_INTEGRATION',
      consumedBy: []
    });

    functionalOnly.functionalNatureIntegration = undefined;
    functionalOnly.functionalRoles = undefined;
    const noClassification = resolvePlanetaryAspects(functionalOnly, Planet.MERCURY);
    expect(noClassification.unassessedSources[0]?.sourceNature).toBe('UNASSESSED');
  });

  it('distinguishes no aspects from unavailable aspect input and ignores legacy aspect data', () => {
    const noAspects = resolvePlanetaryAspects(makeHoroscope(), Planet.MERCURY);
    const unavailable = resolvePlanetaryAspects(
      makeHoroscope({ missingAspects: true }),
      Planet.MERCURY
    );
    const legacyOnly = makeHoroscope({ missingAspects: true }) as Horoscope & {
      grahaDrishti: { aspects: readonly Record<string, unknown>[] };
    };
    legacyOnly.grahaDrishti = {
      aspects: [{
        sourcePlanet: Planet.SATURN,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SYNTHETIC'
      }]
    };

    expect(noAspects.availability).toBe('AVAILABLE');
    expect(noAspects.beneficSources).toEqual([]);
    expect(noAspects.ignoredRecords).toEqual([]);
    expect(unavailable.availability).toBe('UNAVAILABLE');
    expect(resolvePlanetaryAspects(legacyOnly, Planet.MERCURY).maleficSources).toEqual([]);
  });

  it('reports malformed canonical aspect records and preserves valid records as PARTIAL', () => {
    const result = resolvePlanetaryAspects(makeHoroscope({
      aspects: [
        { sourcePlanet: 'PLUTO', targetPlanet: Planet.MERCURY, aspectType: 'INVALID' },
        { sourcePlanet: Planet.JUPITER, targetPlanet: 'PLUTO', aspectType: 'INVALID' },
        { sourcePlanet: Planet.SATURN, targetPlanet: Planet.MERCURY },
        { sourcePlanet: Planet.JUPITER, targetPlanet: Planet.MERCURY, aspectType: 'VALID' }
      ]
    }), Planet.MERCURY);

    expect(result.availability).toBe('PARTIAL');
    expect(result.ignoredRecords.map((item) => item.reason)).toEqual([
      'INVALID_SOURCE_PLANET',
      'INVALID_TARGET',
      'MISSING_FIELDS'
    ]);
    expect(result.beneficSources.map((item) => item.sourcePlanet)).toEqual([Planet.JUPITER]);
  });

  it.each([
    ['benefic conjunction', [Planet.JUPITER], 1],
    ['malefic conjunction', [Planet.SATURN], 1],
    ['mixed conjunction', [Planet.JUPITER, Planet.SATURN], 2],
    ['multiple conjunction', [Planet.JUPITER, Planet.SATURN, Planet.VENUS], 3]
  ] as const)('records co-location only as provenance (%s)', (_label, members, count) => {
    const horoscope = makeHoroscope({ coLocated: [Planet.MERCURY, ...members] });
    const result = resolvePlanetaryRelationships(horoscope, Planet.MERCURY);

    expect(result.coLocatedPlanets).toHaveLength(count);
    expect(result.coLocatedPlanets.every((item) => item.house === 1 && item.sign === Sign.ARIES))
      .toBe(true);
    expect(result.coLocatedPlanets.every((item) => typeof item.angularSeparation === 'number'))
      .toBe(true);
  });

  it('uses one canonical placement source and diagnoses conflicting fact-level houses', () => {
    const horoscope = makeHoroscope({ coLocated: [Planet.MERCURY, Planet.JUPITER] });
    const jupiter = horoscope.planetFacts[Planet.JUPITER];
    jupiter.house = 1;
    jupiter.sign = Sign.ARIES;
    jupiter.position.house = 2;
    jupiter.position.sign = Sign.TAURUS;

    const positioned = resolvePlanetaryRelationships(horoscope, Planet.MERCURY);
    expect(positioned.coLocatedPlanets.map((item) => item.planet)).not.toContain(Planet.JUPITER);
    expect(positioned.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: 'POSITION_HOUSE_MISMATCH',
        record: expect.objectContaining({
          planet: Planet.JUPITER,
          factHouse: 1,
          positionHouse: 2
        })
      })
    ]));
    expect(positioned.availability.coLocatedPlanets.status).toBe('PARTIAL');

    jupiter.position.house = undefined as never;
    const missingPositionHouse = resolvePlanetaryRelationships(horoscope, Planet.MERCURY);
    expect(missingPositionHouse.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: 'POSITION_HOUSE_MISMATCH',
        record: expect.objectContaining({
          planet: Planet.JUPITER,
          factHouse: 1,
          positionHouse: undefined
        })
      })
    ]));

    jupiter.position = undefined as never;
    const fallback = resolvePlanetaryRelationships(horoscope, Planet.MERCURY);
    expect(fallback.coLocatedPlanets.map((item) => item.planet)).toContain(Planet.JUPITER);
    expect(fallback.coLocatedPlanets.find((item) => item.planet === Planet.JUPITER))
      .not.toHaveProperty('angularSeparation');
  });

  it('captures only existing exchange and relationship evidence; it does not synthesize exchanges', () => {
    const noEvidence = resolvePlanetaryRelationships(makeHoroscope(), Planet.MERCURY);
    const withExchange = resolvePlanetaryRelationships(
      makeHoroscope({
        yogaEvidence: [{
          relationship: 'EXCHANGE',
          planets: [Planet.MERCURY, Planet.JUPITER],
          ruleId: 'SYNTHETIC_EXCHANGE',
          reason: 'Existing engine relationship evidence'
        }]
      }),
      Planet.MERCURY
    );

    expect(noEvidence.exchanges).toEqual([]);
    expect(noEvidence.availability.exchanges.status).toBe('AVAILABLE');
    expect(withExchange.exchanges).toHaveLength(1);
    expect(withExchange.exchanges[0]).toMatchObject({
      relationship: 'EXCHANGE',
      planets: [Planet.MERCURY, Planet.JUPITER],
      ruleId: 'SYNTHETIC_EXCHANGE',
      validationStatus: 'OBSERVED'
    });
  });

  it('validates observed exchanges only when independent house ownership and placement confirm them', () => {
    const horoscope = makeHoroscope({
      yogaEvidence: [{
        relationship: 'EXCHANGE',
        planets: [Planet.MERCURY, Planet.JUPITER],
        ruleId: 'VALIDATED_EXCHANGE',
        reason: 'Existing engine relationship evidence'
      }]
    });
    horoscope.functionalNatureIntegration.planets[Planet.MERCURY].ownedHouses = [5];
    horoscope.functionalNatureIntegration.planets[Planet.JUPITER].ownedHouses = [4];

    expect(resolvePlanetaryRelationships(horoscope, Planet.MERCURY).exchanges[0])
      .toMatchObject({ validationStatus: 'VALIDATED' });
  });

  it('validates relationship participant arrays, deduplicates identity, and does not throw', () => {
    const horoscope = makeHoroscope({
      yogaEvidence: [
        {
          relationship: 'CONJUNCTION',
          planets: [Planet.MERCURY, Planet.JUPITER],
          ruleId: 'DUPLICATE_RELATION',
          reason: 'First observation'
        },
        {
          relationship: 'CONJUNCTION',
          planets: [Planet.JUPITER, Planet.MERCURY],
          ruleId: 'DUPLICATE_RELATION',
          reason: 'Duplicate observation'
        }
      ]
    });
    const yogaReport = horoscope.yogas as unknown as {
      yogas: Array<{ evidence: unknown[] }>;
    };
    yogaReport.yogas[0].evidence.push({
      relationship: 'EXCHANGE',
      planets: 'not-an-array',
      ruleId: 'INVALID_RELATION',
      reason: 'Malformed participants'
    });

    const result = resolvePlanetaryRelationships(horoscope, Planet.MERCURY);

    expect(result.relationshipEvidence).toHaveLength(1);
    expect(result.availability.relationships.status).toBe('PARTIAL');
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: 'INVALID_PLANETS' })
    ]));
  });

  it('builds nine traces in canonical order and exposes all five independent dimensions', () => {
    const horoscope = makeHoroscope({
      aspects: [{
        sourcePlanet: Planet.JUPITER,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SYNTHETIC'
      }],
      coLocated: [Planet.MERCURY, Planet.VENUS],
      yogaEvidence: [{
        relationship: 'MUTUAL_ASPECT',
        planets: [Planet.MERCURY, Planet.JUPITER],
        ruleId: 'REL_1',
        reason: 'Observed relationship'
      }]
    });
    const traces = buildPlanetaryInfluenceTrace(horoscope);
    const mercury = traces.find((trace) => trace.planet === Planet.MERCURY)!;

    expect(traces.map((trace) => trace.planet)).toEqual(PLANETS);
    expect(mercury.intrinsicStrength.dignity).toBe(DignityStatus.NEUTRAL);
    expect(mercury.structuralRelationships.ownedHouses).toEqual([1, 10]);
    expect(mercury.structuralRelationships.yogas).toHaveLength(1);
    expect(mercury.environmentalInfluence.beneficAspectSources).toHaveLength(1);
    expect(mercury.environmentalInfluence.coLocatedPlanets).toEqual([
      expect.objectContaining({ planet: Planet.VENUS })
    ]);
  });

  it('uses ascendant-specific functional classification without replacing natural provenance', () => {
    const aspect = [{
      sourcePlanet: Planet.MERCURY,
      targetPlanet: Planet.JUPITER,
      aspectType: 'FULL'
    }];
    const aries = makeHoroscope({ aspects: aspect });
    const taurus = makeHoroscope({ aspects: aspect });
    aries.functionalRoles = {
      planets: analyzeFunctionalRoles(Sign.ARIES, analyzeHouseLordship(Sign.ARIES)).planets
    } as Horoscope['functionalRoles'];
    taurus.functionalRoles = {
      planets: analyzeFunctionalRoles(Sign.TAURUS, analyzeHouseLordship(Sign.TAURUS)).planets
    } as Horoscope['functionalRoles'];
    aries.functionalNatureIntegration = undefined;
    taurus.functionalNatureIntegration = undefined;

    const ariesAspect = resolvePlanetaryAspects(aries, Planet.JUPITER).mixedSources[0];
    const taurusAspect = resolvePlanetaryAspects(taurus, Planet.JUPITER).beneficSources[0];

    expect(ariesAspect).toMatchObject({
      sourcePlanet: Planet.MERCURY,
      naturalNature: 'BENEFIC',
      functionalNature: 'MALEFIC',
      sourceNature: 'MIXED'
    });
    expect(ariesAspect?.classificationBasis.functionalSource).toBe('FUNCTIONAL_ROLES');
    expect(taurusAspect).toMatchObject({
      sourcePlanet: Planet.MERCURY,
      naturalNature: 'BENEFIC',
      functionalNature: 'BENEFIC',
      sourceNature: 'NATURAL_BENEFIC'
    });
  });

  it('records Mercury association as the natural classification rule', () => {
    const aspect = resolvePlanetaryAspects(makeHoroscope({
      aspects: [{
        sourcePlanet: Planet.MERCURY,
        targetPlanet: Planet.JUPITER,
        aspectType: 'SYNTHETIC'
      }]
    }), Planet.JUPITER).beneficSources[0];

    expect(aspect.classificationBasis.naturalRule).toBe('MERCURY_ASSOCIATION');
  });

  it('does not erase aspect provenance when combustion is missing', () => {
    const horoscope = makeHoroscope({
      aspects: [{
        sourcePlanet: Planet.JUPITER,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SYNTHETIC'
      }],
      missingCombustion: Planet.MERCURY
    });
    const trace = buildPlanetaryInfluenceTrace(horoscope).find(
      (item) => item.planet === Planet.MERCURY
    )!;

    expect(trace.intrinsicStrength.combustion).toBeUndefined();
    expect(trace.assessment.missingFactors).toContain('combustion');
    expect(trace.environmentalInfluence.beneficAspectSources).toHaveLength(1);
  });

  it('does not erase dignity when a malefic aspect is added', () => {
    const baseline = buildPlanetaryInfluenceTrace(makeHoroscope()).find(
      (item) => item.planet === Planet.MERCURY
    )!;
    const withAspect = buildPlanetaryInfluenceTrace(makeHoroscope({
      aspects: [{
        sourcePlanet: Planet.SATURN,
        targetPlanet: Planet.MERCURY,
        aspectType: 'SYNTHETIC'
      }]
    })).find((item) => item.planet === Planet.MERCURY)!;

    expect(withAspect.intrinsicStrength.dignity).toBe(baseline.intrinsicStrength.dignity);
    expect(withAspect.environmentalInfluence.maleficAspectSources).toHaveLength(1);
  });

  it('marks missing inputs PARTIAL/UNAVAILABLE explicitly and never treats them as adverse', () => {
    const partial = buildPlanetaryInfluenceTrace(makeHoroscope({
      missingCombustion: Planet.MERCURY,
      missingAspects: true
    })).find((trace) => trace.planet === Planet.MERCURY)!;
    const unavailableHoroscope = makeHoroscope({
      missingPlanet: Planet.MERCURY,
      missingAspects: true,
      includeShadbala: false,
      includeStructuralRoles: false
    });
    unavailableHoroscope.planetFacts = {} as Horoscope['planetFacts'];
    unavailableHoroscope.yogas = undefined;
    const unavailable = buildPlanetaryInfluenceTrace(unavailableHoroscope).find(
      (trace) => trace.planet === Planet.MERCURY
    )!;

    expect(partial.assessment.status).toBe('PARTIAL');
    expect(partial.assessment.missingFactors).toEqual(expect.arrayContaining([
      'combustion',
      'aspectSources'
    ]));
    expect(unavailable.assessment.status).toBe('UNAVAILABLE');
    expect(unavailable.environmentalInfluence.maleficAspectSources).toEqual([]);
  });

  it('does not consume divisional data as D1 structural or environmental evidence', () => {
    const horoscope = makeHoroscope();
    (horoscope as unknown as { vargas?: unknown }).vargas = {
      D10: { [Planet.MERCURY]: { house: 10, sign: Sign.GEMINI } }
    };
    const trace = buildPlanetaryInfluenceTrace(horoscope).find(
      (item) => item.planet === Planet.MERCURY
    )!;

    expect(trace.structuralRelationships.occupiedHouse).toBe(4);
    expect(trace.environmentalInfluence.coLocatedPlanets).toEqual([]);
  });

  it('marks a fully resolved synthetic chart FULL and records unavailable shadbala by name', () => {
    const fullTrace = buildPlanetaryInfluenceTrace(makeHoroscope()).find(
      (trace) => trace.planet === Planet.MERCURY
    )!;
    const partialTrace = buildPlanetaryInfluenceTrace(makeHoroscope({
      includeShadbala: false
    })).find((trace) => trace.planet === Planet.MERCURY)!;

    expect(fullTrace.assessment).toMatchObject({ status: 'FULL', missingFactors: [] });
    expect(partialTrace.assessment.status).toBe('PARTIAL');
    expect(partialTrace.assessment.missingFactors).toContain('shadbala');
    expect(Object.keys(fullTrace.assessment.factors)).toEqual([
      'dignity',
      'combustion',
      'motion',
      'shadbala',
      'ownedHouses',
      'occupiedHouse',
      'aspectSources',
      'coLocatedPlanets',
      'relationships',
      'yogas'
    ]);
    expect(fullTrace.structuralRelationships.exchangeAvailability.status).toBe('AVAILABLE');
  });

  it.each([
    ['negative total', -1, 360],
    ['non-finite total', 6, Number.NaN],
    ['missing total', undefined, 360]
  ])('rejects inconsistent COMPLETE Shadbala: %s', (_label, totalRupa, totalShastiamsa) => {
    const horoscope = makeHoroscope();
    horoscope.planetaryStrength.planets[Planet.MERCURY].shadbala = {
      status: 'COMPLETE',
      totalRupa,
      totalShastiamsa
    } as never;

    const trace = buildPlanetaryInfluenceTrace(horoscope).find(
      (item) => item.planet === Planet.MERCURY
    )!;

    expect(trace.assessment.factors.shadbala.status).toBe('PARTIAL');
    expect(trace.assessment.missingFactors).toContain('shadbala');
    expect(trace.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        factor: 'shadbala',
        reason: 'INVALID_SHADBALA_TOTALS'
      })
    ]));
  });

  it('covers the Cartesian influence matrix across all independent dimensions', () => {
    const dignityCases = [
      DignityStatus.EXALTED,
      DignityStatus.NEUTRAL,
      DignityStatus.DEBILITATED
    ] as const;
    const combustionCases = [PlanetStateCondition.NORMAL, PlanetStateCondition.COMBUST] as const;
    const motionCases = [
      { retrograde: false, stationary: false },
      { retrograde: true, stationary: false },
      { retrograde: false, stationary: true }
    ] as const;
    type AspectCase = {
      readonly sources: readonly Planet[];
      readonly benefic: number;
      readonly malefic: number;
      readonly mixed: number;
      readonly unassessed: number;
      readonly functional?: 'BENEFIC';
      readonly unassessedNaturalSource?: Planet;
    };
    const aspectCases: readonly AspectCase[] = [
      { sources: [Planet.JUPITER], benefic: 1, malefic: 0, mixed: 0, unassessed: 0 },
      { sources: [Planet.SATURN], benefic: 0, malefic: 1, mixed: 0, unassessed: 0 },
      { sources: [Planet.SATURN], functional: 'BENEFIC' as const, benefic: 0, malefic: 0, mixed: 1, unassessed: 0 },
      { sources: [Planet.JUPITER, Planet.SATURN], benefic: 1, malefic: 1, mixed: 0, unassessed: 0 },
      { sources: [] as Planet[], benefic: 0, malefic: 0, mixed: 0, unassessed: 0 },
      { sources: [Planet.MOON], unassessedNaturalSource: Planet.MOON, benefic: 0, malefic: 0, mixed: 0, unassessed: 1 }
    ] as const;
    const conjunctionCases = [
      [Planet.JUPITER],
      [Planet.SATURN],
      [Planet.JUPITER, Planet.SATURN],
      [Planet.JUPITER, Planet.VENUS, Planet.SATURN]
    ] as const;
    const structuralRoles = [[], [10], [5, 10]] as const;
    const completenessCases = ['FULL', 'PARTIAL'] as const;
    let scenarioCount = 0;

    for (const dignity of dignityCases) {
      for (const combustion of combustionCases) {
        for (const motion of motionCases) {
          for (const aspectCase of aspectCases) {
            for (const conjunction of conjunctionCases) {
              for (const ownedHouses of structuralRoles) {
                for (const completeness of completenessCases) {
                  scenarioCount += 1;
                  const horoscope = makeHoroscope({
                    dignity: { [Planet.MERCURY]: dignity },
                    combustion,
                    motion,
                    aspects: aspectCase.sources.map((sourcePlanet) => ({
                      sourcePlanet,
                      targetPlanet: Planet.MERCURY,
                      aspectType: 'MATRIX'
                    })),
                    ...(aspectCase.functional
                      ? { functionalNature: { [Planet.SATURN]: aspectCase.functional } }
                      : {}),
                    ...(aspectCase.unassessedNaturalSource
                      ? { unassessedNaturalSource: aspectCase.unassessedNaturalSource }
                      : {}),
                    coLocated: [Planet.MERCURY, ...conjunction],
                    ownedHouses,
                    includeShadbala: completeness === 'FULL',
                    includeStructuralRoles: true
                  });
                  const trace = buildPlanetaryInfluenceTrace(horoscope).find(
                    (item) => item.planet === Planet.MERCURY
                  )!;

                  expect(trace.intrinsicStrength).toMatchObject({
                    dignity,
                    combustion,
                    motion: {
                      retrograde: motion.retrograde,
                      stationary: motion.stationary
                    }
                  });
                  expect(trace.structuralRelationships.ownedHouses).toEqual(ownedHouses);
                  expect(trace.environmentalInfluence.coLocatedPlanets).toHaveLength(conjunction.length);
                  expect(trace.environmentalInfluence.beneficAspectSources).toHaveLength(aspectCase.benefic);
                  expect(trace.environmentalInfluence.maleficAspectSources).toHaveLength(aspectCase.malefic);
                  expect(trace.environmentalInfluence.mixedAspectSources).toHaveLength(aspectCase.mixed);
                  expect(trace.environmentalInfluence.unassessedAspectSources).toHaveLength(aspectCase.unassessed);
                  expect(trace.assessment.status).toBe(
                    completeness === 'PARTIAL' || aspectCase.unassessed > 0 ? 'PARTIAL' : 'FULL'
                  );
                }
              }
            }
          }
        }
      }
    }

    expect(scenarioCount).toBe(3 * 2 * 3 * 6 * 4 * 3 * 2);
  });

  it('includes the live chart as an ordinary nine-planet trace fixture', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const traces = buildPlanetaryInfluenceTrace(horoscope);

    expect(traces).toHaveLength(9);
    expect(traces.map((trace) => trace.planet)).toEqual(PLANETS);
    expect(traces.find((trace) => trace.planet === Planet.MERCURY)?.assessment.status)
      .not.toBe('UNAVAILABLE');
  });
});
