/**
 * Capture cohort birth instants from Swiss Ephemeris (+ astronomy-engine
 * cross-check) into tools/gate0/captures/cohort/<caseId>.json and update
 * captures/manifest.json. Offline tooling only.
 *
 * A case whose capture fails or whose ephemeris model is not 'swiss' is
 * recorded as BLOCKED in the manifest — fixtures are never generated from
 * incomplete captures.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openSwissEph, captureInstant, SE_PACKAGE, SE_PACKAGE_VERSION, SE_CORE_VERSION, SE_DATA_PACKAGE, SE_DATA_VERSION, SE_DATA_JPL, SE_LICENSE_NOTE, rawBodyLine, type SeInstantCapture } from './lib/se.ts';
import { captureAstronomyEngine, AE_PACKAGE, AE_VERSION, AE_LICENSE_NOTE } from './lib/ae.ts';
import {
  assertInstantConsistency, gitCommitSha, localRepresentationFor,
  readJsonFile, repoRoot, sha256Hex, writeJsonFile, GATE0_ROOT
} from './lib/util.ts';

interface CohortCase {
  id: string;
  utcInstant: string;
  latitude: number;
  longitude: number;
  ianaTimeZone: string;
  dasha: boolean;
  motionHint: string | null;
  note: string;
}

interface CohortFile {
  schemaVersion: number;
  track: string;
  ayanamsa: string;
  cases: CohortCase[];
}

const CAPTURES_DIR = join(GATE0_ROOT, 'captures');
const COHORT_DIR = join(CAPTURES_DIR, 'cohort');
const MANIFEST_PATH = join(CAPTURES_DIR, 'manifest.json');

interface Manifest {
  schemaVersion: number;
  generatedAtTool: string;
  engineCommitSha: string;
  icuVersion: string;
  files: Record<string, { sha256: string; bytes: number; captureId: string; status: 'CAPTURED' | 'BLOCKED'; reason?: string }>;
}

function loadManifest(): Manifest {
  if (existsSync(MANIFEST_PATH)) return readJsonFile<Manifest>(MANIFEST_PATH);
  return {
    schemaVersion: 1,
    generatedAtTool: 'tools/gate0/capture-cohort.ts',
    engineCommitSha: gitCommitSha(repoRoot()),
    icuVersion: process.versions.icu ?? 'unknown',
    files: {}
  };
}

function diffSummary(se: SeInstantCapture, ae: Record<string, { eclipticLongitudeDeg: number }>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const name of Object.keys(ae)) {
    const seLon = se.bodies[name]?.tropical.longitude;
    if (seLon === undefined) continue;
    let d = Math.abs(seLon - ae[name].eclipticLongitudeDeg);
    if (d > 180) d = 360 - d;
    out[name] = d;
  }
  return out;
}

async function main() {
  const root = repoRoot();
  const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const cohort = readJsonFile<CohortFile>(join(GATE0_ROOT, 'cohort/cases.v1.json'));
  const manifest = loadManifest();
  manifest.engineCommitSha = gitCommitSha(root);
  manifest.icuVersion = process.versions.icu ?? 'unknown';

  const session = await openSwissEph();
  const pending = cohort.cases.filter(c => !c.utcInstant.startsWith('TBD'));
  const skippedTbd = cohort.cases.length - pending.length;
  if (skippedTbd > 0) console.log(`skipping ${skippedTbd} TBD placeholder case(s)`);

  const targets = only.length > 0 ? pending.filter(c => only.includes(c.id)) : pending;
  if (only.length > 0 && targets.length === 0) {
    console.error('no matching case ids:', only.join(','));
    process.exit(1);
  }

  for (const c of targets) {
    const captureId = `CAPTURE-${c.id}-${c.utcInstant.slice(0, 10)}`;
    const outPath = join(COHORT_DIR, `${c.id}.json`);
    try {
      // Consistency: localRepresentation derived from ICU must round-trip.
      const localRepresentation = localRepresentationFor(c.utcInstant, c.ianaTimeZone);
      assertInstantConsistency({
        utcInstant: c.utcInstant,
        localRepresentation,
        ianaTimeZone: c.ianaTimeZone
      });
      const instant = captureInstant(session.swe, c.utcInstant, {
        latitude: c.latitude, longitude: c.longitude
      });
      const ae = captureAstronomyEngine(c.utcInstant);
      const crossDiffDeg = diffSummary(instant, ae);
      const maxCrossDiff = Math.max(0, ...Object.values(crossDiffDeg));
      const nonSwiss = Object.entries(instant.bodies)
        .filter(([, b]) => b.tropical.ephemeris !== 'swiss' || b.sidereal.ephemeris !== 'swiss')
        .map(([n]) => n);
      if (nonSwiss.length > 0 || instant.warnings.length > 0) {
        throw new Error(`ephemeris fallback/warnings: models=${nonSwiss.join(',')} warnings=${instant.warnings.join('; ')}`);
      }
      const artifact = {
        schemaVersion: 1,
        captureId,
        track: 'BIRTH_INSTANT_COHORT',
        caseId: c.id,
        note: c.note,
        dasha: c.dasha,
        motionHint: c.motionHint,
        site: {
          latitude: c.latitude,
          longitude: c.longitude,
          instant: {
            utcInstant: c.utcInstant,
            localRepresentation,
            ianaTimeZone: c.ianaTimeZone
          }
        },
        referenceImplementation: {
          name: `${SE_PACKAGE}@${SE_PACKAGE_VERSION} (WASM port of Swiss Ephemeris ${SE_CORE_VERSION})`,
          swissephVersion: SE_CORE_VERSION,
          license: SE_LICENSE_NOTE,
          ephemerisFiles: session.ephemerisFiles,
          ephemerisData: SE_DATA_PACKAGE,
          ephemerisDataVersion: SE_DATA_VERSION,
          ephemerisDataJpl: SE_DATA_JPL
        },
        conventions: {
          positionConvention: 'GEOCENTRIC',
          apparentConvention: 'APPARENT (light-time + aberration + nutation; no topoctr, no truepos)',
          nodeConvention: 'MEAN (Ketu = mean node + 180 deg)',
          frameTropical: 'tropical, mean equinox of date',
          frameSidereal: 'sidereal, SEFLG_SIDEREAL, ayanamsa mode LAHIRI (1)',
          timeStandard: 'UTC input -> UT JD; swe_calc_ut applies deltaT internally',
          flagsTropical: instant.flagsTropical,
          flagsSidereal: instant.flagsSidereal
        },
        capture: instant,
        crossCheck: {
          source: `${AE_PACKAGE}@${AE_VERSION}`,
          license: AE_LICENSE_NOTE,
          conventions: 'geocentric, astrometric+aberration, tropical ecliptic-of-date (EQJ->ECT)',
          independentlyIdentifiable: true,
          bodies: ae,
          absDiffDegVsSeTropical: crossDiffDeg,
          maxAbsDiffDeg: maxCrossDiff
        }
      };
      const json = JSON.stringify(artifact, null, 2) + '\n';
      const { writeFileSync, mkdirSync } = await import('node:fs');
      mkdirSync(COHORT_DIR, { recursive: true });
      writeFileSync(outPath, json, 'utf8');
      manifest.files[`cohort/${c.id}.json`] = {
        sha256: sha256Hex(json),
        bytes: Buffer.byteLength(json),
        captureId,
        status: 'CAPTURED'
      };
      const moon = instant.bodies.MOON;
      console.log(`${c.id} OK  jd=${instant.julianDayUt.toFixed(5)} ayan=${instant.ayanamsaDegrees.toFixed(5)} ` +
        `moon_sid=${moon.sidereal.longitude.toFixed(5)} maxAEdiff=${maxCrossDiff.toFixed(5)}deg`);
    } catch (err) {
      manifest.files[`cohort/${c.id}.json`] = {
        sha256: '', bytes: 0, captureId, status: 'BLOCKED',
        reason: err instanceof Error ? err.message : String(err)
      };
      console.error(`${c.id} BLOCKED: ${err instanceof Error ? err.message : err}`);
    }
  }

  writeJsonFile(MANIFEST_PATH, manifest);
  const capturedTargets = targets.filter(c => manifest.files[`cohort/${c.id}.json`]?.status === 'CAPTURED');
  writeJsonFile(join(CAPTURES_DIR, 'cohort-raw-lines.txt'),
    capturedTargets.map(c => `${c.id}\n${Object.values(
      // re-read artifact for raw lines
      (JSON.parse(readFileSync(join(COHORT_DIR, `${c.id}.json`), 'utf8')) as { capture: SeInstantCapture }).capture.bodies
    ).map(rawBodyLine).join('\n')}`).join('\n\n') + '\n');
  session.dispose();
  console.log('manifest updated:', MANIFEST_PATH);
  const blocked = targets.filter(c => manifest.files[`cohort/${c.id}.json`]?.status !== 'CAPTURED');
  if (blocked.length > 0) {
    console.error(`blocked cohort cases: ${blocked.map(c => c.id).join(', ')}`);
    process.exitCode = 1;
  }
}

main().catch(err => { console.error(err); process.exit(1); });
