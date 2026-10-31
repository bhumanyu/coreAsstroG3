import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  CalculationCoveragePolicy,
  CalculationReferenceFixture,
  CalculationReferenceGate
} from './calculationReferenceTypes.ts';

/**
 * RG-09 calculation reference fixtures.
 *
 * This list is intentionally empty: no approved, independent expected values
 * for the required production calculations are currently available here.
 * Existing engine snapshots and analytically constructed Vimshottari cases do
 * not independently validate planetary positions, speed/retrograde, or node
 * opposition. Add entries only with source provenance, conventions, approved
 * expected values, and tolerances; never copy values from engine output.
 */
export const CALCULATION_REFERENCE_FIXTURES: readonly CalculationReferenceFixture[] =
  Object.freeze([]);

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
  readonly input?: unknown;
}

export function inspectBoundaryCoverage(
  fixtures: readonly BoundaryCoverageRecord[],
  policy: CalculationCoveragePolicy
): readonly string[] {
  const issues: string[] = [];
  const relevant = fixtures.filter(fixture =>
    fixture.kind === 'SIGN_BOUNDARY' || fixture.kind === 'NAKSHATRA_BOUNDARY'
  );
  const normalizedKind = (fixture: BoundaryCoverageRecord): string =>
    fixture.kind === 'SIGN_BOUNDARY' ? 'SIGN' : fixture.boundaryKind ?? '';
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
      if (beforeLongitude === undefined
        || exactLongitude === undefined
        || afterLongitude === undefined
        || boundary === undefined
        || !Number.isFinite(boundary)
        || exactLongitude !== boundary
        || !(beforeLongitude < exactLongitude
          && exactLongitude < afterLongitude)
        || [before, exact, after].some(item => item?.boundaryLongitude !== boundary)) {
        issues.push(`BOUNDARY_ORDER:${groupKey}:input longitudes must be strictly ordered around boundaryLongitude`);
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
