import { describe, expect, it } from 'vitest';
import { calculateMissingCalculationCoverage } from '../../scripts/release/calculationCoverage.mjs';
import {
  CALCULATION_COVERAGE_POLICY,
  inspectBoundaryCoverage
} from '../engine/validation/calculationReferenceFixtures';
import type { CalculationCoveragePolicy } from '../engine/validation/calculationReferenceTypes';

const boundaryPolicy: CalculationCoveragePolicy = {
  ...CALCULATION_COVERAGE_POLICY,
  requiredKinds: [],
  requiredPlanets: [],
  requiredMotionScenarios: [],
  requiredBoundaryKinds: ['NAKSHATRA'],
  requiredBoundaryPositions: ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'],
  requiredVargaTypes: []
};

function nakshatraWrapTriplet(exactPada = 1) {
  const definition = {
    name: 'NAKSHATRA-0',
    longitude: 0,
    convention: { coordinateFrame: 'SIDEREAL', ayanamsa: 'LAHIRI' }
  } as const;
  const provenance = { expectedValuesProducedIndependently: true } as const;
  const common = {
    kind: 'NAKSHATRA_BOUNDARY',
    boundaryKind: 'NAKSHATRA',
    boundaryId: 'NAKSHATRA-0',
    boundaryLongitude: 0,
    boundaryDefinition: definition,
    conventions: definition.convention,
    provenance
  };
  return [
    {
      ...common,
      boundaryPosition: 'EPSILON_BEFORE',
      expectedNakshatra: 'REVATI',
      expectedPada: 4,
      input: { longitude: 359.99999 }
    },
    {
      ...common,
      boundaryPosition: 'EXACT',
      expectedNakshatra: 'ASHWINI',
      expectedPada: exactPada,
      input: { longitude: 0 }
    },
    {
      ...common,
      boundaryPosition: 'EPSILON_AFTER',
      expectedNakshatra: 'ASHWINI',
      expectedPada: 1,
      input: { longitude: 0.00001 }
    }
  ];
}

describe('runner calculation coverage uses production fixture validation', () => {
  it('accepts a zero-degree wraparound triplet through the runner coverage path', () => {
    expect(calculateMissingCalculationCoverage(
      nakshatraWrapTriplet(),
      boundaryPolicy,
      inspectBoundaryCoverage
    )).toEqual([]);
  });

  it('rejects a wrong nakshatra-boundary pada through the runner coverage path', () => {
    expect(calculateMissingCalculationCoverage(
      nakshatraWrapTriplet(2),
      boundaryPolicy,
      inspectBoundaryCoverage
    )).toContain(
      'BOUNDARY_DIRECTION:NAKSHATRA:NAKSHATRA-0:nakshatra values must transition in increasing-longitude order'
    );
  });

  it('reports enum drift as a coverage issue instead of throwing during import', () => {
    const issues = inspectBoundaryCoverage([], boundaryPolicy, {
      sign: { ARIES: 'ARIES' }
    });
    expect(issues).toContain(
      'ENUM_DRIFT:ZODIAC_SIGNS_ORDER must match the Sign enum set.'
    );
  });
});
