import type {
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

export const REQUIRED_CALCULATION_REFERENCE_KINDS = Object.freeze([
  'PLANETARY_LONGITUDE',
  'PLANETARY_MOTION',
  'RAHU_KETU_OPPOSITION',
  'SIGN_BOUNDARY',
  'NAKSHATRA_BOUNDARY',
  'HOUSE_POSITION',
  'VARGA_LONGITUDE',
  'VIMSHOTTARI_DASHA'
] as const);

const REQUIRED_PLANETS = Object.freeze([
  'SUN',
  'MOON',
  'MARS',
  'MERCURY',
  'JUPITER',
  'VENUS',
  'SATURN',
  'RAHU',
  'KETU'
] as const);

const missingKinds = REQUIRED_CALCULATION_REFERENCE_KINDS.filter(
  kind => !CALCULATION_REFERENCE_FIXTURES.some(fixture => fixture.kind === kind)
);
const missingLongitudePlanets = REQUIRED_PLANETS.filter(
  planet => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'PLANETARY_LONGITUDE' && String(fixture.input.planet) === planet
  )
);
const requiredMotionScenarios = ['PROGRADE', 'RETROGRADE', 'NEAR_STATIONARY'] as const;
const missingMotionScenarios = requiredMotionScenarios.filter(
  scenario => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'PLANETARY_MOTION' && fixture.scenario === scenario
  )
);
const requiredBoundaryKinds = ['SIGN', 'NAKSHATRA', 'PADA'] as const;
const boundaryPositions = ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'] as const;
const boundaryFixtures = CALCULATION_REFERENCE_FIXTURES.filter(
  fixture => fixture.kind === 'SIGN_BOUNDARY' || fixture.kind === 'NAKSHATRA_BOUNDARY'
);
const boundaryKindForFixture = (
  fixture: (typeof boundaryFixtures)[number]
): (typeof requiredBoundaryKinds)[number] =>
  fixture.kind === 'SIGN_BOUNDARY' ? 'SIGN' : fixture.boundaryKind;
const incompleteBoundaryTriplets: string[] = [];
for (const boundaryKind of requiredBoundaryKinds) {
  const fixturesOfKind = boundaryFixtures.filter(
    fixture => boundaryKindForFixture(fixture) === boundaryKind
  );
  const boundaryIds = new Set(fixturesOfKind.map(fixture => fixture.boundaryId));
  if (boundaryIds.size === 0) {
    incompleteBoundaryTriplets.push(`${boundaryKind}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
    continue;
  }
  for (const boundaryId of boundaryIds) {
    const positions = new Set(
      fixturesOfKind
        .filter(fixture => fixture.boundaryId === boundaryId)
        .map(fixture => fixture.boundaryPosition)
    );
    if (boundaryPositions.some(position => !positions.has(position))) {
      incompleteBoundaryTriplets.push(`${boundaryKind}:${boundaryId}:EPSILON_BEFORE/EXACT/EPSILON_AFTER`);
    }
  }
}
const requiredVargas = ['D9', 'D10'] as const;
const missingVargas = requiredVargas.filter(
  chartType => !CALCULATION_REFERENCE_FIXTURES.some(
    fixture => fixture.kind === 'VARGA_LONGITUDE' && String(fixture.input.chartType) === chartType
  )
);
const missingCoverage = [
  ...missingKinds,
  ...missingLongitudePlanets.map(planet => `PLANETARY_LONGITUDE:${planet}`),
  ...missingMotionScenarios.map(scenario => `PLANETARY_MOTION:${scenario}`),
  ...incompleteBoundaryTriplets.map(boundary => `BOUNDARY_TRIPLET:${boundary}`),
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
