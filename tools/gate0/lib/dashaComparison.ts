export type DashaLevel = 'MD' | 'AD' | 'PD';

export interface DashaTimelineLike {
  readonly mahadashas: readonly {
    readonly planet: string;
    readonly start: string;
    readonly end: string;
    readonly antardashas: readonly {
      readonly planet: string;
      readonly start: string;
      readonly end: string;
      readonly pratyantardashas: readonly {
        readonly planet: string;
        readonly start: string;
        readonly end: string;
      }[];
    }[];
  }[];
}

export interface DashaLevelComparison {
  readonly level: DashaLevel;
  readonly structuralAgreement: boolean;
  readonly expectedPeriodCount: number;
  readonly actualPeriodCount: number;
  readonly matchedPeriods: number;
  readonly unmatchedExpectedPeriods: number;
  readonly unmatchedActualPeriods: number;
  readonly structuralMismatchCount: number;
  readonly boundaryTimestampsCompared: number;
  readonly maxBoundaryErrorMs: number | null;
  readonly meanBoundaryErrorMs: number | null;
  readonly structuralDetail?: string;
}

export interface DashaTimelineDecomposition {
  readonly arithmetic: Readonly<Record<DashaLevel, DashaLevelComparison>>;
  readonly moonInput: Readonly<Record<DashaLevel, DashaLevelComparison>>;
}

interface PeriodPoint {
  readonly path: string;
  readonly lordPath: string;
  readonly occurrence: number;
  readonly startMs: number;
  readonly endMs: number;
}

export function decomposeDashaTimelines(
  referenceMoonReference: DashaTimelineLike,
  referenceMoonEngine: DashaTimelineLike,
  engineMoonEngine: DashaTimelineLike
): DashaTimelineDecomposition {
  return {
    arithmetic: compareDashaTimelines(referenceMoonReference, referenceMoonEngine),
    moonInput: compareDashaTimelines(referenceMoonEngine, engineMoonEngine)
  };
}

export function compareDashaTimelines(
  expected: DashaTimelineLike,
  actual: DashaTimelineLike
): Readonly<Record<DashaLevel, DashaLevelComparison>> {
  return {
    MD: compareLevel(flattenLevel(expected, 'MD'), flattenLevel(actual, 'MD'), 'MD'),
    AD: compareLevel(flattenLevel(expected, 'AD'), flattenLevel(actual, 'AD'), 'AD'),
    PD: compareLevel(flattenLevel(expected, 'PD'), flattenLevel(actual, 'PD'), 'PD')
  };
}

function flattenLevel(timeline: DashaTimelineLike, level: DashaLevel): PeriodPoint[] {
  const points: PeriodPoint[] = [];
  const occurrences = new Map<string, number>();
  const add = (
    path: string,
    lordPath: string,
    period: { readonly start: string; readonly end: string }
  ) => {
    const occurrence = occurrences.get(lordPath) ?? 0;
    occurrences.set(lordPath, occurrence + 1);
    points.push({
      path,
      lordPath,
      occurrence,
      startMs: Date.parse(period.start),
      endMs: Date.parse(period.end)
    });
  };
  for (const [mdIndex, md] of timeline.mahadashas.entries()) {
    if (level === 'MD') {
      add(`MD${mdIndex + 1}`, md.planet, md);
    }
    for (const [adIndex, ad] of md.antardashas.entries()) {
      if (level === 'AD') {
        add(
          `MD${mdIndex + 1}/AD${adIndex + 1}`,
          `${md.planet}/${ad.planet}`,
          ad
        );
      }
      for (const [pdIndex, pd] of ad.pratyantardashas.entries()) {
        if (level === 'PD') {
          add(
            `MD${mdIndex + 1}/AD${adIndex + 1}/PD${pdIndex + 1}`,
            `${md.planet}/${ad.planet}/${pd.planet}`,
            pd
          );
        }
      }
    }
  }
  return points;
}

function compareLevel(
  expected: readonly PeriodPoint[],
  actual: readonly PeriodPoint[],
  level: DashaLevel
): DashaLevelComparison {
  const identity = (point: PeriodPoint) => `${point.lordPath}#${point.occurrence}`;
  const actualByIdentity = new Map(actual.map(point => [identity(point), point]));
  const expectedIdentities = expected.map(identity);
  const actualIdentities = actual.map(identity);
  const expectedIdentitySet = new Set(expectedIdentities);
  const actualIdentitySet = new Set(actualIdentities);
  const matched = expected
    .map(point => ({ expected: point, actual: actualByIdentity.get(identity(point)) }))
    .filter((pair): pair is { expected: PeriodPoint; actual: PeriodPoint } =>
      pair.actual !== undefined
    );
  const unmatchedExpectedPeriods = expected.length - matched.length;
  const unmatchedActualPeriods = actual.length - matched.length;
  const sequenceMismatches = Math.abs(expected.length - actual.length)
    + Array.from({ length: Math.min(expected.length, actual.length) }, (_, index) =>
      expectedIdentities[index] === actualIdentities[index] ? 0 : 1
    ).reduce((sum, mismatch) => sum + mismatch, 0);
  const structuralMismatchCount = sequenceMismatches;
  const structuralDetail = structuralMismatchCount === 0
    ? undefined
    : firstStructuralDifference(
        expected, actual, expectedIdentitySet, actualIdentitySet, expectedIdentities, actualIdentities
      );
  const errors: number[] = [];
  for (const pair of matched) {
    errors.push(Math.abs(pair.expected.startMs - pair.actual.startMs));
    errors.push(Math.abs(pair.expected.endMs - pair.actual.endMs));
  }
  return {
    level,
    structuralAgreement: structuralMismatchCount === 0,
    expectedPeriodCount: expected.length,
    actualPeriodCount: actual.length,
    matchedPeriods: matched.length,
    unmatchedExpectedPeriods,
    unmatchedActualPeriods,
    structuralMismatchCount,
    boundaryTimestampsCompared: errors.length,
    maxBoundaryErrorMs: errors.length > 0 ? Math.max(...errors) : null,
    meanBoundaryErrorMs: errors.length > 0
      ? errors.reduce((sum, error) => sum + error, 0) / errors.length
      : null,
    ...(structuralDetail ? { structuralDetail } : {})
  };
}

function firstStructuralDifference(
  expected: readonly PeriodPoint[],
  actual: readonly PeriodPoint[],
  expectedIdentitySet: ReadonlySet<string>,
  actualIdentitySet: ReadonlySet<string>,
  expectedIdentities: readonly string[],
  actualIdentities: readonly string[]
): string {
  const missing = expected.find(point => !actualIdentitySet.has(
    `${point.lordPath}#${point.occurrence}`
  ));
  const extra = actual.find(point => !expectedIdentitySet.has(
    `${point.lordPath}#${point.occurrence}`
  ));
  if (missing && extra) {
    return `unmatched expected ${missing.path} (${missing.lordPath}); ` +
      `unmatched actual ${extra.path} (${extra.lordPath})`;
  }
  if (missing) return `unmatched expected ${missing.path} (${missing.lordPath})`;
  if (extra) return `unmatched actual ${extra.path} (${extra.lordPath})`;
  const mismatchIndex = expectedIdentities.findIndex(
    (identity, index) => identity !== actualIdentities[index]
  );
  return mismatchIndex >= 0
    ? `lord-path order differs at ${expected[mismatchIndex]?.path ?? actual[mismatchIndex]?.path}`
    : `period count ${expected.length}/${actual.length}`;
}
