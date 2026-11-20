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
  readonly periodsCompared: number;
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
  readonly planet: string;
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
  for (const [mdIndex, md] of timeline.mahadashas.entries()) {
    if (level === 'MD') {
      points.push(toPoint(`MD${mdIndex + 1}`, md));
    }
    for (const [adIndex, ad] of md.antardashas.entries()) {
      if (level === 'AD') {
        points.push(toPoint(`MD${mdIndex + 1}/AD${adIndex + 1}`, ad));
      }
      for (const [pdIndex, pd] of ad.pratyantardashas.entries()) {
        if (level === 'PD') {
          points.push(toPoint(
            `MD${mdIndex + 1}/AD${adIndex + 1}/PD${pdIndex + 1}`,
            pd
          ));
        }
      }
    }
  }
  return points;
}

function toPoint(
  path: string,
  period: { readonly planet: string; readonly start: string; readonly end: string }
): PeriodPoint {
  return {
    path,
    planet: period.planet,
    startMs: Date.parse(period.start),
    endMs: Date.parse(period.end)
  };
}

function compareLevel(
  expected: readonly PeriodPoint[],
  actual: readonly PeriodPoint[],
  level: DashaLevel
): DashaLevelComparison {
  let structuralDetail: string | undefined;
  if (expected.length !== actual.length) {
    structuralDetail = `${level} period count ${expected.length}/${actual.length}`;
  }
  const compared = Math.min(expected.length, actual.length);
  for (let index = 0; index < compared; index++) {
    if (expected[index].path !== actual[index].path
      || expected[index].planet !== actual[index].planet) {
      structuralDetail ??= `${expected[index].path} ${expected[index].planet}/` +
        `${actual[index].path} ${actual[index].planet}`;
    }
  }

  const errors: number[] = [];
  for (let index = 0; index < compared; index++) {
    if (expected[index].path !== actual[index].path
      || expected[index].planet !== actual[index].planet) continue;
    errors.push(Math.abs(expected[index].startMs - actual[index].startMs));
    errors.push(Math.abs(expected[index].endMs - actual[index].endMs));
  }
  return {
    level,
    structuralAgreement: structuralDetail === undefined,
    expectedPeriodCount: expected.length,
    actualPeriodCount: actual.length,
    periodsCompared: compared,
    boundaryTimestampsCompared: errors.length,
    maxBoundaryErrorMs: errors.length > 0 ? Math.max(...errors) : null,
    meanBoundaryErrorMs: errors.length > 0
      ? errors.reduce((sum, error) => sum + error, 0) / errors.length
      : null,
    ...(structuralDetail ? { structuralDetail } : {})
  };
}
