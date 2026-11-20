/**
 * Scan 1900-2100 for Mercury/Venus/Mars retrograde windows and station points
 * using the Swiss Ephemeris capture session. Output feeds case selection for
 * the PLANETARY_MOTION scenario coverage (PROGRADE / RETROGRADE /
 * NEAR_STATIONARY). Offline tooling only.
 */
import { openSwissEph, SE_BODY_MAP } from './lib/se.ts';
import { writeJsonFile, repoRoot } from './lib/util.ts';
import { join } from 'node:path';

const BODIES = ['MERCURY', 'VENUS', 'MARS'] as const;
const START_JD = 2415020; // ~1900-01-01
const END_JD = 2488069; // ~2100-12-31 (approx; refined below via Date.UTC)
const COARSE_STEP_DAYS = 10;
const FINE_STEP_DAYS = 0.25;

function jdFromIso(iso: string): number {
  const d = new Date(iso);
  // Julian day via engine formula (UTC)
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const h = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
  return julianDay(y, m, day + h / 24);
}

function julianDay(y: number, m: number, d: number): number {
  // Meeus algorithm, valid for Gregorian dates
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jdn = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
    - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  return jdn - 0.5 + (d - Math.floor(d));
}

async function main() {
  const root = repoRoot();
  const session = await openSwissEph();
  const { swe } = session;
  const results: Record<string, unknown> = {};

  for (const name of BODIES) {
    const bodyId = SE_BODY_MAP[name];
    // coarse scan
    const samples: { jd: number; speed: number }[] = [];
    for (let jd = START_JD; jd <= END_JD; jd += COARSE_STEP_DAYS) {
      const p = swe.calc(jd, bodyId);
      samples.push({ jd, speed: p.longitudeSpeed });
    }
    // find sign changes -> station events; refine each with fine scan
    const stations: { jd: number; speed: number; kind: 'DIRECT_TO_RETRO' | 'RETRO_TO_DIRECT' }[] = [];
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i];
      if ((a.speed < 0) !== (b.speed < 0)) {
        // refine between a.jd and b.jd
        let best = { jd: b.jd, speed: b.speed, kind: (b.speed < 0 ? 'DIRECT_TO_RETRO' : 'RETRO_TO_DIRECT') as const };
        let minAbs = Math.abs(b.speed);
        for (let jd = a.jd; jd <= b.jd; jd += FINE_STEP_DAYS) {
          const p = swe.calc(jd, bodyId);
          if (Math.abs(p.longitudeSpeed) < minAbs) {
            minAbs = Math.abs(p.longitudeSpeed);
            best = { jd, speed: p.longitudeSpeed, kind: best.kind };
          }
        }
        stations.push(best);
      }
    }
    // retrograde windows: contiguous negative-speed regions from coarse+fine samples
    const retrogradeWindows: { startIso: string; endIso: string; minSpeed: number }[] = [];
    let inRetro = false;
    let winStart = 0;
    let minSpeed = 0;
    for (const s of samples) {
      if (s.speed < 0 && !inRetro) { inRetro = true; winStart = s.jd; minSpeed = s.speed; }
      else if (s.speed < 0) { minSpeed = Math.min(minSpeed, s.speed); }
      else if (inRetro) {
        inRetro = false;
        retrogradeWindows.push({
          startIso: jdToIso(winStart), endIso: jdToIso(s.jd), minSpeed
        });
      }
    }
    if (inRetro) retrogradeWindows.push({ startIso: jdToIso(winStart), endIso: jdToIso(END_JD), minSpeed });
    // near-stationary candidates: stations with |speed| < 0.02 deg/day
    const nearStationary = stations.filter(s => Math.abs(s.speed) < 0.02);
    results[name] = {
      stationCount: stations.length,
      stations: stations.map(s => ({ jd: s.jd, iso: jdToIso(s.jd), speed: s.speed, kind: s.kind })),
      retrogradeWindows,
      retrogradeWindowCount: retrogradeWindows.length,
      nearStationaryCandidates: nearStationary.map(s => ({ jd: s.jd, iso: jdToIso(s.jd), speed: s.speed, kind: s.kind }))
    };
  }

  writeJsonFile(join(root, 'tools/gate0/cohort/stations.v1.json'), {
    schemaVersion: 1,
    generatedBy: 'tools/gate0/scan-stations.ts',
    referenceImplementation: '@kuntay/swisseph 0.2.2 / Swiss Ephemeris 2.10.03',
    scan: { startJd: START_JD, endJd: END_JD, coarseStepDays: COARSE_STEP_DAYS, fineStepDays: FINE_STEP_DAYS },
    results
  });
  session.dispose();
  console.log('wrote cohort/stations.v1.json');
  for (const name of BODIES) {
    const r = results[name] as { stationCount: number; retrogradeWindowCount: number; nearStationaryCandidates: unknown[] };
    console.log(name, 'stations:', r.stationCount, 'retro windows:', r.retrogradeWindowCount, 'near-stationary:', r.nearStationaryCandidates.length);
  }
}

function jdToIso(jd: number): string {
  // Julian day -> UTC ISO (Meeus inverse)
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const dayInt = Math.floor(day);
  const frac = day - dayInt;
  const hh = Math.floor(frac * 24);
  const mm = Math.floor((frac * 24 - hh) * 60);
  const ss = Math.floor((((frac * 24 - hh) * 60) - mm) * 60);
  const ms = Math.round(((((frac * 24 - hh) * 60) - mm) * 60 - ss) * 1000);
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `${year}-${p(month)}-${p(dayInt)}T${p(hh)}:${p(mm)}:${p(ss)}.${String(ms).padStart(3, '0')}Z`;
}

main().catch(err => { console.error(err); process.exit(1); });
