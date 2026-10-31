export interface CalculationCoveragePolicy {
  readonly requiredKinds: readonly string[];
  readonly requiredPlanets: readonly string[];
  readonly requiredMotionScenarios: readonly string[];
  readonly requiredVargaTypes: readonly string[];
  readonly requiredBoundaryKinds: readonly string[];
  readonly requiredBoundaryPositions: readonly string[];
  readonly boundaryEpsilonDegrees: {
    readonly min: number;
    readonly max: number;
  };
}

export function calculateMissingCalculationCoverage<T extends {
  readonly kind?: unknown;
  readonly scenario?: unknown;
  readonly input?: object;
}, Policy extends CalculationCoveragePolicy>(
  fixtures: readonly T[],
  coveragePolicy: Policy,
  inspectBoundaryCoverage: (
    fixtures: readonly T[],
    policy: Policy
  ) => readonly string[]
): string[];
