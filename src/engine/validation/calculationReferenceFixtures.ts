import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GENERATED_CALCULATION_REFERENCE_FIXTURES } from './calculationReferenceFixtures.generated.ts';
import type {
  CalculationCoveragePolicy,
  CalculationReferenceFixture,
  CalculationReferenceGate
} from './calculationReferenceTypes.ts';
// Keep this module executable under Node's built-in TypeScript strip-only loader.
// Runtime enum parity is asserted in calculationValidation.test.ts under Vitest.

/**
 * RG-09 calculation reference fixtures.
 *
 * Populated exclusively from `./calculationReferenceFixtures.generated.ts`,
 * an auto-generated module assembled through the typed builders in
 * `./calculationReferenceFixtureSchema.ts` from independently captured
 * reference artifacts (Swiss Ephemeris captures + the independent
 * grid-semantics evaluator under tools/gate0/). Expected values are never
 * copied from engine output; regenerate via tools/gate0/gen-fixtures.ts.
 */
export const CALCULATION_REFERENCE_FIXTURES: readonly CalculationReferenceFixture[] =
  GENERATED_CALCULATION_REFERENCE_FIXTURES;

const policyJson = JSON.parse(readFileSync(
  resolve(process.cwd(), 'docs/release/release-policy.json'),
  'utf8'
)) as { readonly calculationCoverage?: CalculationCoveragePolicy };

if (!policyJson.calculationCoverage) {
  throw new Error('release-policy.json must declare calculationCoverage.');
}

export const CALCULATION_COVERAGE_POLICY = Object.freeze(policyJson.calculationCoverage);
export const REQUIRED_CALCULATION_REFERENCE_KINDS = Object.freeze([
  ...CALCULATION_COVERAGE_POLICY.requiredKinds
]);

export interface BoundaryCoverageRecord {
  readonly kind: string;
  readonly boundaryKind?: string;
  readonly boundaryId?: string;
  readonly boundaryPosition?: string;
  readonly boundaryLongitude?: number;
  readonly boundaryDefinition?: {
    readonly name?: string;
    readonly longitude?: number;
    readonly convention?: {
      readonly coordinateFrame?: string;
      readonly ayanamsa?: string | null;
    };
  };
  readonly conventions?: {
    readonly coordinateFrame?: string;
    readonly ayanamsa?: string | null;
  };
  readonly provenance?: object;
  readonly expectedSign?: string;
  readonly expectedNakshatra?: string;
  readonly expectedPada?: number;
  readonly input?: unknown;
}

export const ZODIAC_SIGNS_ORDER = Object.freeze([
  'ARIES',
  'TAURUS',
  'GEMINI',
  'CANCER',
  'LEO',
  'VIRGO',
  'LIBRA',
  'SCORPIO',
  'SAGITTARIUS',
  'CAPRICORN',
  'AQUARIUS',
  'PISCES'
] as const);

export const NAKSHATRAS_ORDER = Object.freeze([
  'ASHWINI',
  'BHARANI',
  'KRITTIKA',
  'ROHINI',
  'MRIGASHIRA',
  'ARDRA',
  'PUNARVASU',
  'PUSHYA',
  'ASHLESHA',
  'MAGHA',
  'PURVA_PHALGUNI',
  'UTTARA_PHALGUNI',
  'HASTA',
  'CHITRA',
  'SWATI',
  'VISHAKHA',
  'ANURADHA',
  'JYESHTHA',
  'MULA',
  'PURVA_ASHADHA',
  'UTTARA_ASHADHA',
  'SHRAVANA',
  'DHANISHTA',
  'SHATABHISHA',
  'PURVA_BHADRAPADA',
  'UTTARA_BHADRAPADA',
  'REVATI'
] as const);

const SIGN_ENUM_CONTRACT = Object.freeze(Object.fromEntries(
  ZODIAC_SIGNS_ORDER.map(value => [value, value])
));
const NAKSHATRA_ENUM_CONTRACT = Object.freeze(Object.fromEntries(
  NAKSHATRAS_ORDER.map(value => [value, value])
));

function sameEnumSet(values: readonly string[], enumeration: object): boolean {
  const enumValues = [...new Set(Object.values(enumeration)
    .filter((value): value is string => typeof value === 'string'))].sort();
  return JSON.stringify([...values].sort()) === JSON.stringify(enumValues);
}

export function inspectBoundaryCoverage(
  fixtures: readonly BoundaryCoverageRecord[],
  policy: CalculationCoveragePolicy,
  enums: { readonly sign?: object; readonly nakshatra?: object } = {}
): readonly string[] {
  const issues: string[] = [];
  if (!sameEnumSet(ZODIAC_SIGNS_ORDER, enums.sign ?? SIGN_ENUM_CONTRACT)) {
    issues.push('ENUM_DRIFT:ZODIAC_SIGNS_ORDER must match the Sign enum set.');
  }
  if (!sameEnumSet(NAKSHATRAS_ORDER, enums.nakshatra ?? NAKSHATRA_ENUM_CONTRACT)) {
    issues.push('ENUM_DRIFT:NAKSHATRAS_ORDER must match the Nakshatra enum set.');
  }
  const epsilon = policy.boundaryEpsilonDegrees;
  const validEpsilon = Number.isFinite(epsilon?.min)
    && Number.isFinite(epsilon?.max)
    && epsilon.min > 0
    && epsilon.max >= epsilon.min;
  if (!validEpsilon) issues.push('BOUNDARY_EPSILON_POLICY:invalid minimum/maximum degree range');
  const relevant = fixtures.filter(fixture =>
    fixture.kind === 'SIGN_BOUNDARY' || fixture.kind === 'NAKSHATRA_BOUNDARY'
  );
  const normalizedKind = (fixture: BoundaryCoverageRecord): string =>
    fixture.kind === 'SIGN_BOUNDARY' ? 'SIGN' : fixture.boundaryKind ?? '';
  const normalizeLongitude = (longitude: number): number =>
    ((longitude % 360) + 360) % 360;
  const signs: readonly string[] = ZODIAC_SIGNS_ORDER;
  const nakshatras: readonly string[] = NAKSHATRAS_ORDER;
  const padas = ['1', '2', '3', '4'];
  const grids: Readonly<Record<string, number>> = {
    SIGN: 30,
    NAKSHATRA: 360 / 27,
    PADA: 360 / 108
  };
  const longitudeFor = (fixture: BoundaryCoverageRecord | undefined): number | undefined => {
    if (!fixture || !fixture.input || typeof fixture.input !== 'object'
      || !('longitude' in fixture.input)) return undefined;
    const longitude = fixture.input.longitude;
    return typeof longitude === 'number' ? longitude : undefined;
  };
  const tupleKeys = new Set<string>();
  const groups = new Map<string, BoundaryCoverageRecord[]>();

  for (const fixture of relevant) {
    const kind = normalizedKind(fixture);
    const id = fixture.boundaryId ?? '';
    const position = fixture.boundaryPosition ?? '';
    const tuple = `${kind}:${id}:${position}`;
    if (tupleKeys.has(tuple)) issues.push(`DUPLICATE_BOUNDARY_POSITION:${tuple}`);
    tupleKeys.add(tuple);
    const groupKey = `${kind}:${id}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), fixture]);
    const definition = fixture.boundaryDefinition;
    const convention = definition?.convention;
    const provenance = fixture.provenance as
      { readonly expectedValuesProducedIndependently?: unknown } | undefined;
    if (provenance?.expectedValuesProducedIndependently !== true) {
      issues.push(`BOUNDARY_PROVENANCE:${groupKey}:expectedValuesProducedIndependently must be true`);
    }
    if (!definition
      || typeof definition.name !== 'string'
      || definition.name.trim().length === 0
      || definition.name !== id
      || typeof definition.longitude !== 'number'
      || definition.longitude !== fixture.boundaryLongitude
      || !convention
      || !['SIDEREAL', 'TROPICAL'].includes(convention.coordinateFrame ?? '')
      || (convention.coordinateFrame === 'SIDEREAL'
        ? !convention.ayanamsa || convention.ayanamsa === 'TROPICAL'
        : convention.ayanamsa !== null)
      || (fixture.conventions?.coordinateFrame !== undefined
        && fixture.conventions.coordinateFrame !== convention?.coordinateFrame)
      || (fixture.conventions?.ayanamsa !== undefined
        && fixture.conventions.ayanamsa !== convention?.ayanamsa)) {
      issues.push(`BOUNDARY_IDENTITY:${groupKey}:definition must match the declared longitude and coordinate convention`);
    } else {
      const longitude = definition.longitude;
      const grid = grids[kind];
      const normalized = normalizeLongitude(longitude);
      if (!Number.isFinite(longitude) || longitude < 0 || longitude >= 360
        || grid === undefined
        || Math.abs(normalized / grid - Math.round(normalized / grid)) > 1e-9) {
        issues.push(`BOUNDARY_IDENTITY:${groupKey}:longitude is not on the ${kind} boundary grid`);
      }
    }
  }

  for (const kind of policy.requiredBoundaryKinds) {
    const groupsOfKind = [...groups.entries()].filter(([key]) => key.startsWith(`${kind}:`));
    if (groupsOfKind.length === 0) {
      issues.push(`BOUNDARY_TRIPLET:${kind}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
      continue;
    }
    for (const [groupKey, items] of groupsOfKind) {
      const byPosition = new Map(items.map(item => [item.boundaryPosition, item]));
      if (policy.requiredBoundaryPositions.some(position => !byPosition.has(position))) {
        issues.push(`BOUNDARY_TRIPLET:${groupKey}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
        continue;
      }
      const before = byPosition.get('EPSILON_BEFORE');
      const exact = byPosition.get('EXACT');
      const after = byPosition.get('EPSILON_AFTER');
      const boundary = exact?.boundaryLongitude;
      const beforeLongitude = longitudeFor(before);
      const exactLongitude = longitudeFor(exact);
      const afterLongitude = longitudeFor(after);
      const beforeDistance = beforeLongitude === undefined || boundary === undefined
        ? undefined
        : normalizeLongitude(boundary - beforeLongitude);
      const afterDistance = afterLongitude === undefined || boundary === undefined
        ? undefined
        : normalizeLongitude(afterLongitude - boundary);
      if (beforeLongitude === undefined
        || exactLongitude === undefined
        || afterLongitude === undefined
        || boundary === undefined
        || !Number.isFinite(boundary)
        || exactLongitude !== boundary
        || beforeDistance === undefined
        || afterDistance === undefined
        || beforeDistance === 0
        || afterDistance === 0
        || [before, exact, after].some(item => item?.boundaryLongitude !== boundary)) {
        issues.push(`BOUNDARY_ORDER:${groupKey}:input longitudes must be strictly ordered around boundaryLongitude`);
      } else if (validEpsilon
        && (beforeDistance < epsilon.min
          || beforeDistance > epsilon.max
          || afterDistance < epsilon.min
          || afterDistance > epsilon.max)) {
        issues.push(`BOUNDARY_EPSILON:${groupKey}:before/after distances must be within ${epsilon.min}-${epsilon.max} degrees`);
      }

      if (kind === 'SIGN'
        && (!before?.expectedSign || !after?.expectedSign
          || before.expectedSign === after.expectedSign)) {
        issues.push(`BOUNDARY_TRANSITION:${groupKey}:expectedSign must differ before and after`);
      } else if (kind === 'SIGN') {
        const index = Math.round(normalizeLongitude(boundary ?? 0) / grids.SIGN) % signs.length;
        if (![before?.expectedSign, exact?.expectedSign, after?.expectedSign]
          .every(value => signs.includes(value ?? ''))
          || before?.expectedSign !== signs[(index + signs.length - 1) % signs.length]
          || exact?.expectedSign !== signs[index]
          || after?.expectedSign !== signs[index]) {
          issues.push(`BOUNDARY_DIRECTION:${groupKey}:sign values must transition in increasing-longitude order`);
        }
      } else if (kind === 'NAKSHATRA'
        && (!before?.expectedNakshatra || !after?.expectedNakshatra
          || before.expectedNakshatra === after.expectedNakshatra)) {
        issues.push(`BOUNDARY_TRANSITION:${groupKey}:expectedNakshatra must differ before and after`);
      } else if (kind === 'NAKSHATRA') {
        const interval = grids.NAKSHATRA;
        const index = Math.round(normalizeLongitude(boundary ?? 0) / interval) % nakshatras.length;
        if (![before?.expectedNakshatra, exact?.expectedNakshatra, after?.expectedNakshatra]
          .every(value => nakshatras.includes(value ?? ''))
          || before?.expectedNakshatra !== nakshatras[(index + nakshatras.length - 1) % nakshatras.length]
          || exact?.expectedNakshatra !== nakshatras[index]
          || after?.expectedNakshatra !== nakshatras[index]
          || before?.expectedPada !== 4
          || exact?.expectedPada !== 1
          || after?.expectedPada !== 1) {
          issues.push(`BOUNDARY_DIRECTION:${groupKey}:nakshatra values must transition in increasing-longitude order`);
        }
      } else if (kind === 'PADA'
        && (before?.expectedPada === undefined || after?.expectedPada === undefined
          || before.expectedPada === after.expectedPada)) {
        issues.push(`BOUNDARY_TRANSITION:${groupKey}:expectedPada must differ before and after`);
      } else if (kind === 'PADA') {
        const index = Math.round(normalizeLongitude(boundary ?? 0) / grids.PADA) % 4;
        const beforePada = ((index + 3) % 4) + 1;
        const afterPada = index + 1;
        const nakshatraIndex = Math.floor(
          Math.round(normalizeLongitude(boundary ?? 0) / grids.PADA) / 4
        ) % nakshatras.length;
        const beforeNakshatraIndex = (
          Math.floor((Math.round(normalizeLongitude(boundary ?? 0) / grids.PADA) - 1) / 4)
          + nakshatras.length
        ) % nakshatras.length;
        if (![before?.expectedPada, exact?.expectedPada, after?.expectedPada]
          .every(value => padas.includes(String(value)))
          || before?.expectedPada !== beforePada
          || exact?.expectedPada !== afterPada
          || after?.expectedPada !== afterPada
          || before?.expectedNakshatra !== nakshatras[beforeNakshatraIndex]
          || exact?.expectedNakshatra !== nakshatras[nakshatraIndex]
          || after?.expectedNakshatra !== nakshatras[nakshatraIndex]) {
          issues.push(`BOUNDARY_DIRECTION:${groupKey}:pada values must transition in increasing-longitude order`);
        }
      }
    }
  }
  return issues;
}

const missingKinds = CALCULATION_COVERAGE_POLICY.requiredKinds.filter(
  kind => !CALCULATION_REFERENCE_FIXTURES.some(fixture => fixture.kind === kind)
);
const missingLongitudePlanets = CALCULATION_COVERAGE_POLICY.requiredPlanets.filter(
  planet => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'PLANETARY_LONGITUDE' && String(fixture.input.planet) === planet
  )
);
const missingMotionScenarios = CALCULATION_COVERAGE_POLICY.requiredMotionScenarios.filter(
  scenario => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'PLANETARY_MOTION' && fixture.scenario === scenario
  )
);
const boundaryIssues = inspectBoundaryCoverage(CALCULATION_REFERENCE_FIXTURES, CALCULATION_COVERAGE_POLICY);
const missingVargas = CALCULATION_COVERAGE_POLICY.requiredVargaTypes.filter(
  chartType => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'VARGA_LONGITUDE' && String(fixture.input.chartType) === chartType
  )
);
const missingCoverage = [
  ...missingKinds,
  ...missingLongitudePlanets.map(planet => `PLANETARY_LONGITUDE:${planet}`),
  ...missingMotionScenarios.map(scenario => `PLANETARY_MOTION:${scenario}`),
  ...boundaryIssues,
  ...missingVargas.map(chartType => `VARGA_LONGITUDE:${chartType}`)
];
const coverageComplete = missingCoverage.length === 0;
const fixtureCount = CALCULATION_REFERENCE_FIXTURES.length;

export const RG_09_CALCULATION_REFERENCE_GATE: CalculationReferenceGate = Object.freeze({
  id: 'RG-09',
  status: fixtureCount > 0 && coverageComplete ? 'READY' : 'BLOCKED',
  fixtureCount,
  coverageComplete,
  reason: coverageComplete
    ? 'Approved independent calculation references cover all required kinds and motion cases.'
    : `Missing approved independent calculation references for: ${missingCoverage.join(', ')}.`
});
