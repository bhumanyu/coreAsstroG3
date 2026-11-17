import { describe, expect, it } from 'vitest';
import {
  Planet,
  type BirthDetails,
  type Horoscope
} from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import {
  CANONICAL_BIRTH_DETAILS,
  VAISHALI_BIRTH_DETAILS
} from '../../test/fixtures/canonicalChart';
import type {
  CareerPlanetaryConditionResult,
  CareerPlanetaryConditionFactor
} from './careerPlanetaryCondition';
import type { PlanetaryAspectInfluence } from '../../engine/planetaryInfluence/aspectInfluence';
import { buildCareerNatalAnalysis } from './careerNatalConvergence';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';

const PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
]);

/**
 * Expected Vedic drishti table (1-based aspect numbers, source house counted as 1).
 * Mars: 4/7/8, Jupiter: 5/7/9, Saturn: 3/7/10, all others: 7 only.
 */
const EXPECTED_DRISHTI: Readonly<Record<string, readonly number[]>> = Object.freeze({
  [Planet.MARS]: Object.freeze([4, 7, 8]),
  [Planet.JUPITER]: Object.freeze([5, 7, 9]),
  [Planet.SATURN]: Object.freeze([3, 7, 10])
});

const ASPECT_TYPE_TO_DRISHTI: Readonly<Record<string, number>> = Object.freeze({
  FULL_7TH: 7,
  SPECIAL_3RD: 3,
  SPECIAL_4TH: 4,
  SPECIAL_5TH: 5,
  SPECIAL_8TH: 8,
  SPECIAL_9TH: 9,
  SPECIAL_10TH: 10
});

function drishtiFor(sourcePlanet: Planet): readonly number[] {
  return EXPECTED_DRISHTI[sourcePlanet] ?? Object.freeze([7]);
}

function planetHouse(horoscope: Horoscope, planet: Planet): number | undefined {
  const fact = horoscope.planetFacts?.[planet];
  const house = fact?.house ?? fact?.position?.house;
  return typeof house === 'number' && Number.isInteger(house) && house >= 1 && house <= 12
    ? house
    : undefined;
}

/** House that `sourcePlanet` aspects via drishti number `d` (1-based, source = 1). */
function aspectedHouse(sourceHouse: number, drishti: number): number {
  return ((sourceHouse + drishti - 2) % 12) + 1;
}

function formatFactor(factor: CareerPlanetaryConditionFactor): string {
  return `${factor.type}:${factor.effect} — ${factor.statement}`;
}

function formatFactors(
  factors: readonly CareerPlanetaryConditionFactor[] | undefined
): string {
  if (!factors || factors.length === 0) {
    return '(none)';
  }
  return factors.map(formatFactor).join(' | ');
}

function formatAspectSource(source: PlanetaryAspectInfluence): string {
  return [
    `sourcePlanet=${source.sourcePlanet}`,
    `aspectType=${source.aspectType}`,
    `houseOffset=${source.houseOffset ?? '(unset)'}`,
    `sourceHouse=${source.sourceHouse ?? '(unset)'}`,
    `targetHouse=${source.targetHouse ?? '(unset)'}`,
    `sourceSign=${source.sourceSign ?? '(unset)'}`,
    `targetSign=${source.targetSign ?? '(unset)'}`,
    `sourceNature=${source.sourceNature}`,
    `naturalNature=${source.naturalNature ?? '(unset)'}`,
    `functionalNature=${source.functionalNature ?? '(unset)'}`,
    `naturalRule=${source.classificationBasis.naturalRule}`,
    `functionalSource=${source.classificationBasis.functionalSource}`,
    `consumedBy=[${source.classificationBasis.consumedBy.join(', ')}]`
  ].join(' ');
}

interface AspectAuditEntry {
  readonly planet: Planet;
  readonly factorType: CareerPlanetaryConditionFactor['type'];
  readonly factorStatement: string;
  readonly status: 'RESOLVED' | 'NO_ASPECT_PROVENANCE' | 'ILLEGITIMATE_ASPECT_SOURCE';
  readonly detail: string;
}

/**
 * Cross-checks each aspect-derived negative factor (MALEFIC_PRESSURE) against the
 * expected Vedic drishti table computed from actual house positions, and against the
 * aspect-source records carried on the C6 result's planetaryInfluenceTrace.
 */
function auditMaleficPressureFactors(
  result: CareerPlanetaryConditionResult,
  horoscope: Horoscope
): AspectAuditEntry[] {
  const entries: AspectAuditEntry[] = [];
  const targetHouse = planetHouse(horoscope, result.planet);

  // Expected legitimate aspect sources for this planet, per the Vedic table.
  const expectedSources = PLANET_ORDER.filter((source) => {
    if (source === result.planet) return false;
    const sourceHouse = planetHouse(horoscope, source);
    if (sourceHouse === undefined || targetHouse === undefined) return false;
    return drishtiFor(source).some((d) => aspectedHouse(sourceHouse, d) === targetHouse);
  });

  const trace = result.planetaryInfluenceTrace;
  const maleficSources = trace?.environmentalInfluence.maleficAspectSources ?? [];

  for (const factor of result.negativeFactors) {
    if (factor.type !== 'MALEFIC_PRESSURE') {
      continue;
    }

    // Intrinsic negative factors (DIGNITY/AFFLICTION/COMBUSTION) are not aspect-derived
    // and are intentionally skipped here.
    const candidates = maleficSources.filter(
      (source) => source.targetPlanet === result.planet
    );

    if (candidates.length === 0) {
      entries.push({
        planet: result.planet,
        factorType: factor.type,
        factorStatement: factor.statement,
        status: 'NO_ASPECT_PROVENANCE',
        detail:
          'MALEFIC_PRESSURE reported but no maleficAspectSources record targets this planet ' +
          `(expected legitimate sources per drishti table: [${expectedSources.join(', ')}] ` +
          `or trace unavailable: ${trace === undefined})`
      });
      continue;
    }

    // Verify each candidate aspect source is geometrically legitimate per the drishti table.
    const legitimate = candidates.filter((source) => {
      const sourceHouse = planetHouse(horoscope, source.sourcePlanet);
      const drishti = ASPECT_TYPE_TO_DRISHTI[source.aspectType];
      if (sourceHouse === undefined || drishti === undefined) return false;
      if (!drishtiFor(source.sourcePlanet).includes(drishti)) return false;
      const declaredTargetHouse =
        source.targetHouse ?? aspectedHouse(sourceHouse, drishti);
      return declaredTargetHouse === targetHouse;
    });

    if (legitimate.length === 0) {
      entries.push({
        planet: result.planet,
        factorType: factor.type,
        factorStatement: factor.statement,
        status: 'ILLEGITIMATE_ASPECT_SOURCE',
        detail:
          `aspect sources present but none match the expected drishti table ` +
          `(expected sources: [${expectedSources.join(', ')}]; ` +
          `records: ${candidates.map(formatAspectSource).join(' ;; ')})`
      });
      continue;
    }

    entries.push({
      planet: result.planet,
      factorType: factor.type,
      factorStatement: factor.statement,
      status: 'RESOLVED',
      detail:
        `legitimate sources: ${legitimate
          .map((source) => `${source.sourcePlanet} ${source.aspectType}`)
          .join(', ')} ` +
        `(expected sources: [${expectedSources.join(', ')}])`
    });
  }

  return entries;
}

function printConditionResult(
  result: CareerPlanetaryConditionResult,
  horoscope: Horoscope
): void {
  const fact = horoscope.planetFacts?.[result.planet];
  console.log(`    - planet: ${result.planet}`);
  console.log(`      placement: sign=${fact?.sign ?? fact?.position?.sign ?? '(unset)'} house=${planetHouse(horoscope, result.planet) ?? '(unset)'}`);
  console.log(`      relevance: ${result.relevance}`);
  console.log(`      condition: ${result.condition}`);
  console.log(`      assessment: ${result.assessment ?? '(unset)'}`);
  console.log(`      assessmentDetails: ${JSON.stringify(result.assessmentDetails ?? null)}`);
  console.log(`      dignity: ${result.dignity}`);
  console.log(`      affliction: ${result.affliction}`);
  console.log(`      combustion: ${result.combustion}`);
  console.log(`      motion: ${result.motion}`);
  console.log(`      afflictionAssessed: ${result.afflictionAssessed ?? '(unset)'}`);
  console.log(`      conditional: ${result.conditional}`);
  console.log(`      positiveFactors: ${formatFactors(result.positiveFactors)}`);
  console.log(`      negativeFactors: ${formatFactors(result.negativeFactors)}`);
  console.log(`      relatedPlanets: [${result.relatedPlanets.join(', ')}]`);
  console.log(`      statement: ${result.statement}`);

  const trace = result.planetaryInfluenceTrace;
  if (!trace) {
    console.log('      planetaryInfluenceTrace: MISSING — aspect provenance unavailable');
  } else {
    const env = trace.environmentalInfluence;
    console.log(`      aspectSources.benefic: [${env.beneficAspectSources.map(formatAspectSource).join(' ;; ') || '(none)'}]`);
    console.log(`      aspectSources.malefic: [${env.maleficAspectSources.map(formatAspectSource).join(' ;; ') || '(none)'}]`);
    console.log(`      aspectSources.mixed: [${env.mixedAspectSources.map(formatAspectSource).join(' ;; ') || '(none)'}]`);
    console.log(`      aspectSources.unassessed: [${env.unassessedAspectSources.map(formatAspectSource).join(' ;; ') || '(none)'}]`);
    console.log(`      evidenceAvailability.status: ${trace.evidenceAvailability.status}`);
    console.log(`      evidenceAvailability.missingFactors: [${trace.evidenceAvailability.missingFactors.join(', ')}]`);
  }

  const audit = auditMaleficPressureFactors(result, horoscope);
  for (const entry of audit) {
    console.log(`      AUDIT ${entry.status}: ${entry.factorStatement}`);
    console.log(`        detail: ${entry.detail}`);
  }
}

function runFixture(label: string, birthDetails: BirthDetails): void {
  console.log(`\n########## FIXTURE: ${label} ##########`);
  console.log(`birthDetails: ${JSON.stringify(birthDetails)}`);

  const horoscope = calculateHoroscope(birthDetails);
  console.log(`ascendantSign: ${horoscope.rasiChart?.ascendantSign ?? '(unset)'}`);
  console.log(`ascendantLongitude: ${horoscope.rasiChart?.ascendantLongitude ?? '(unset)'}`);
  console.log('natal placements:');
  for (const planet of PLANET_ORDER) {
    const fact = horoscope.planetFacts?.[planet];
    console.log(
      `  ${planet}: sign=${fact?.sign ?? fact?.position?.sign ?? '(unset)'} ` +
      `house=${planetHouse(horoscope, planet) ?? '(unset)'} ` +
      `longitude=${fact?.position?.eclipticLongitude ?? fact?.position?.longitude ?? '(unset)'}`
    );
  }

  // C6 output array — the exact condition records handed to the canonical career
  // foundation builder via preComputedInputs.condition inside interpretCareerV2.
  // interpretCareerV2 internally calls buildCareerNatalAnalysis({ horoscope }) and
  // passes canonicalNatalAnalysis.condition into buildCanonicalCareerFoundation as
  // preComputedInputs.condition. This diagnostic re-runs the same builder on the
  // same horoscope, so the records printed here are content-identical to the array
  // the foundation consumes.
  const natal = buildCareerNatalAnalysis({ horoscope });
  const condition = natal.condition;
  console.log(`\nC6 CareerPlanetaryConditionResult count: ${condition.length}`);
  for (const result of condition) {
    printConditionResult(result, horoscope);
  }

  // Cross-check: participant conditionSource records inside the orchestrator's
  // QualifiedCareerPattern must carry the same C6 content as the array above.
  // interpretCareerV2 builds its own natal analysis internally, so object identity
  // is not expected — compare serialized content instead.
  const context = createAnalysisContext({
    methodology: {
      zodiacSystem: 'SIDEREAL',
      houseSystem: 'WHOLE_SIGN',
      ayanamsa: 'LAHIRI',
      calculationEngine: 'ASTRO_CORE_V1',
      rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
      vargaRules: 'PARASHARA_D10_D2',
      dashaSystem: 'VIMSHOTTARI'
    }
  });
  const temporalState = resolveAnalysisTemporalState(horoscope, context);
  const options: DomainReasoningOptions = { context, temporalState };
  const interpretation = interpretCareerV2(horoscope, options);
  const qualifications =
    interpretation.conclusionData?.canonicalCareerFoundation?.patternQualifications ?? [];

  const conditionByPlanet = new Map(
    condition.map((record) => [record.planet, record] as const)
  );
  let crossCheckTotal = 0;
  let crossCheckMatched = 0;
  for (const patternQualification of qualifications) {
    const qualified = patternQualification.qualifiedPattern;
    for (const participant of qualified.participants) {
      crossCheckTotal += 1;
      const expected = conditionByPlanet.get(participant.planet);
      const matched =
        participant.conditionSource !== undefined &&
        expected !== undefined &&
        JSON.stringify(participant.conditionSource) === JSON.stringify(expected);
      if (matched) {
        crossCheckMatched += 1;
      } else {
        console.log(
          `  CROSS-CHECK MISMATCH: pattern=${qualified.patternId} planet=${participant.planet} ` +
          `conditionSource present=${participant.conditionSource !== undefined}`
        );
      }
    }
  }
  console.log(
    `foundation participant conditionSource cross-check: ${crossCheckMatched}/${crossCheckTotal} content-identical to C6 output records`
  );
}

describe('Career Planetary Condition — C6 live-chart diagnostic', () => {
  it('prints the full CareerPlanetaryConditionResult for all nine planets on both fixtures', () => {
    for (const [label, birthDetails] of [
      ['CANONICAL_BIRTH_DETAILS (Patna)', CANONICAL_BIRTH_DETAILS],
      ['VAISHALI_BIRTH_DETAILS (Vaishali, Bihar)', VAISHALI_BIRTH_DETAILS]
    ] as const) {
      runFixture(label, birthDetails);
    }
    expect(true).toBe(true);
  });
});
