/**
 * Produce reproducible cohort case definitions immediately before and after
 * each sidereal nakshatra boundary. Output is reviewed and added to
 * cohort/cases.v1.json; this command never edits the case file itself.
 */
import { Body, Flag } from '@kuntay/swisseph';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { openSwissEph } from './lib/se.ts';

const START_UTC = '2026-01-01T00:00:00Z';
const SEARCH_DAYS = 32;
const SCAN_STEP_MS = 3 * 60 * 60 * 1000;
const BRACKET_OFFSET_MS = 30_000;
const NAKSHATRA_SPAN = 360 / 27;

function norm360(value: number): number {
  return ((value % 360) + 360) % 360;
}

function moonSidereal(swe: Awaited<ReturnType<typeof openSwissEph>>['swe'], timeMs: number): number {
  const date = new Date(timeMs);
  const hour = date.getUTCHours()
    + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3600
    + date.getUTCMilliseconds() / 3_600_000;
  const jd = swe.julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hour);
  return norm360(swe.calc(jd, Body.Moon, { flags: Flag.Sidereal | Flag.Speed }).longitude);
}

async function main(): Promise<void> {
  const session = await openSwissEph();
  try {
    const startMs = new Date(START_UTC).getTime();
    const endMs = startMs + SEARCH_DAYS * 24 * 60 * 60 * 1000;
    let previousMs = startMs;
    let previousLongitude = moonSidereal(session.swe, previousMs);
    let previousUnwrapped = previousLongitude;
    const crossings = new Map<number, number>();

    for (let nextMs = Math.min(previousMs + SCAN_STEP_MS, endMs); nextMs <= endMs;) {
      const nextLongitude = moonSidereal(session.swe, nextMs);
      const nextUnwrapped = previousUnwrapped + norm360(nextLongitude - previousLongitude);
      const firstBoundaryIndex = Math.floor(previousUnwrapped / NAKSHATRA_SPAN) + 1;
      const lastBoundaryIndex = Math.floor(nextUnwrapped / NAKSHATRA_SPAN);

      for (let unwrappedIndex = firstBoundaryIndex; unwrappedIndex <= lastBoundaryIndex; unwrappedIndex++) {
        const boundaryIndex = unwrappedIndex % 27;
        if (crossings.has(boundaryIndex)) continue;
        const target = unwrappedIndex * NAKSHATRA_SPAN;
        let lowMs = previousMs;
        let highMs = nextMs;
        while (highMs - lowMs > 1) {
          const middleMs = Math.floor((lowMs + highMs) / 2);
          const middleLongitude = moonSidereal(session.swe, middleMs);
          const middleUnwrapped = previousUnwrapped + norm360(middleLongitude - previousLongitude);
          if (middleUnwrapped < target) lowMs = middleMs;
          else highMs = middleMs;
        }
        crossings.set(boundaryIndex, highMs);
      }

      previousMs = nextMs;
      previousLongitude = nextLongitude;
      previousUnwrapped = nextUnwrapped;
      if (nextMs === endMs) break;
      nextMs = Math.min(nextMs + SCAN_STEP_MS, endMs);
    }

    const missing = Array.from({ length: 27 }, (_, index) => index)
      .filter(index => !crossings.has(index));
    if (missing.length > 0) {
      throw new Error(`Could not bracket nakshatra boundary indices: ${missing.join(', ')}`);
    }

    const cases = Array.from({ length: 27 }, (_, boundaryIndex) => {
      const crossingMs = crossings.get(boundaryIndex);
      if (crossingMs === undefined) throw new Error(`missing crossing for boundary ${boundaryIndex}`);
      const boundaryLabel = String(boundaryIndex + 1).padStart(2, '0');
      return (['BEFORE', 'AFTER'] as const).map(side => {
        const direction = side === 'BEFORE' ? -1 : 1;
        const utcInstant = new Date(crossingMs + direction * BRACKET_OFFSET_MS).toISOString();
        return {
          id: `MB-${boundaryLabel}-${side}`,
          utcInstant,
          latitude: 0,
          longitude: 0,
          ianaTimeZone: 'UTC',
          dasha: true,
          motionHint: null,
          note: `Moon anchor ${side.toLowerCase()} nakshatra boundary ${(boundaryIndex + 1)}`
        };
      });
    }).flat();

    console.log(JSON.stringify(cases, null, 2));
  } finally {
    session.dispose();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
