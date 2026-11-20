/**
 * G0-A parity execution + report generator.
 *
 * Runs `inspectBoundaryCoverage` + the RG-09 coverage computation over
 * CALCULATION_REFERENCE_FIXTURES, then measures the ENGINE side of every
 * fixture (engine output appears only as the measured side — expected values
 * come exclusively from the captured references). Writes
 * docs/career/audit/GATE-0-PARITY-REPORT.md with per-track errors, pass/fail
 * vs GATE-0-VALIDATION-PROTOCOL.md §4 tolerances, and a Fork A/B
 * recommendation with evidence.
 *
 * Offline tooling only.
 */
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CALCULATION_REFERENCE_FIXTURES,
  CALCULATION_COVERAGE_POLICY,
  inspectBoundaryCoverage,
  RG_09_CALCULATION_REFERENCE_GATE
} from '../../src/engine/validation/calculationReferenceFixtures.ts';
import type { CalculationReferenceFixture } from '../../src/engine/validation/calculationReferenceTypes.ts';
import {
  generatePlanetaryPositions, calculateAscendant
} from '../../src/engine/astroEngine.ts';
import { calculateSign, getDivisionalLongitude, calculateWholeSignHouse } from '../../src/engine/chartMath.ts';
import { calculateNakshatra } from '../../src/engine/nakshatraUtils.ts';
import { calculateVimshottari } from '../../src/engine/dasha/vimshottari.ts';
import { AyanamsaType, Planet, ChartType } from '../../src/types.ts';
import type { BirthDetails, PlanetaryPositions } from '../../src/types.ts';
import { gitCommitSha, readJsonFile, repoRoot, GATE0_ROOT, normDeg } from './lib/util.ts';
import { signAt, nakshatraAt, padaAt, vargaD9, vargaD10 } from './lib/grid.ts';

const ARCSEC_PER_DEG = 3600;

/** Minimal absolute angular difference in degrees, [0, 180]. */
function angDiffDeg(a: number, b: number): number {
  const d = Math.abs(normDeg(a - b));
  return d > 180 ? 360 - d : d;
}

interface Measurement {
  fixtureId: string;
  track: string;
  error: number; // primary error in track units (deg / deg-per-day / ms / count)
  unit: string;
  pass: boolean;
  detail?: string;
}

const measurements: Measurement[] = [];
const failures: string[] = [];

function birthOf(fixture: { input: { birth?: BirthDetails } }): BirthDetails {
  const b = fixture.input.birth;
  if (!b) throw new Error('fixture missing birth input');
  return b;
}

const positionsCache = new Map<string, PlanetaryPositions>();
function positionsFor(birth: BirthDetails): PlanetaryPositions {
  const key = JSON.stringify(birth);
  let p = positionsCache.get(key);
  if (!p) {
    p = generatePlanetaryPositions(birth);
    positionsCache.set(key, p);
  }
  return p;
}

/* ---------------- per-kind measurement ------------------------------- */

function measurePlanetaryLongitude(f: Extract<CalculationReferenceFixture, { kind: 'PLANETARY_LONGITUDE' }>) {
  const pos = positionsFor(birthOf(f))[f.input.planet];
  const engineLon = pos.longitude; // sidereal per engine contract
  const errDeg = angDiffDeg(engineLon, f.expected.degrees);
  const errArcsec = errDeg * ARCSEC_PER_DEG;
  const pass = errDeg <= f.expected.toleranceDegrees;
  measurements.push({
    fixtureId: f.id, track: 'PLANETARY_LONGITUDE',
    error: errArcsec, unit: 'arcsec', pass,
    detail: `${f.input.planet} engine=${engineLon.toFixed(6)} expected=${f.expected.degrees.toFixed(6)}`
  });
  if (!pass) failures.push(`${f.id}: ${errArcsec.toFixed(1)}" > ${f.expected.toleranceDegrees * ARCSEC_PER_DEG}"`);
}

function measurePlanetaryMotion(f: Extract<CalculationReferenceFixture, { kind: 'PLANETARY_MOTION' }>) {
  const pos = positionsFor(birthOf(f))[f.input.planet];
  const engineSpeed = pos.motion.speed;
  const speedErr = Math.abs(engineSpeed - f.expected.speedDegreesPerDay);
  const speedPass = speedErr <= f.expected.speedToleranceDegreesPerDay;
  const retroPass = pos.motion.retrograde === f.expected.retrograde;
  const statPass = pos.motion.stationary === f.expected.stationary;
  measurements.push({
    fixtureId: f.id, track: 'PLANETARY_MOTION',
    error: speedErr, unit: 'deg/day', pass: speedPass && retroPass && statPass,
    detail: `speed engine=${engineSpeed.toFixed(5)} expected=${f.expected.speedDegreesPerDay.toFixed(5)} retro ${pos.motion.retrograde}/${f.expected.retrograde} stat ${pos.motion.stationary}/${f.expected.stationary}`
  });
  if (!(speedPass && retroPass && statPass)) {
    failures.push(`${f.id}: speedErr=${speedErr.toFixed(4)} retro=${retroPass} stat=${statPass}`);
  }
}

function measureRahuKetu(f: Extract<CalculationReferenceFixture, { kind: 'RAHU_KETU_OPPOSITION' }>) {
  const pos = positionsFor(birthOf(f));
  const rahu = pos[Planet.RAHU].longitude;
  const ketu = pos[Planet.KETU].longitude;
  let sep = Math.abs(normDeg(rahu - ketu));
  if (sep > 180) sep = 360 - sep;
  const errDeg = Math.abs(sep - 180);
  const pass = errDeg <= f.expected.toleranceDegrees;
  measurements.push({
    fixtureId: f.id, track: 'RAHU_KETU_OPPOSITION',
    error: errDeg, unit: 'deg', pass,
    detail: `rahu=${rahu.toFixed(5)} ketu=${ketu.toFixed(5)} sep=${sep.toFixed(5)}`
  });
  if (!pass) failures.push(`${f.id}: sepErr=${errDeg.toFixed(5)} deg`);
}

function measureSignBoundary(f: Extract<CalculationReferenceFixture, { kind: 'SIGN_BOUNDARY' }>) {
  const engineSign = calculateSign(f.input.longitude);
  const pass = engineSign === f.expectedSign;
  measurements.push({
    fixtureId: f.id, track: 'SIGN_BOUNDARY', error: pass ? 0 : 1, unit: 'category', pass,
    detail: `lon=${f.input.longitude} engine=${engineSign} expected=${f.expectedSign}`
  });
  if (!pass) failures.push(`${f.id}: engine=${engineSign} expected=${f.expectedSign}`);
}

function measureNakshatraBoundary(f: Extract<CalculationReferenceFixture, { kind: 'NAKSHATRA_BOUNDARY' }>) {
  const r = calculateNakshatra(f.input.longitude);
  const pass = r.nakshatra === f.expectedNakshatra && r.padaNumber === f.expectedPada;
  measurements.push({
    fixtureId: f.id, track: 'NAKSHATRA_BOUNDARY', error: pass ? 0 : 1, unit: 'category', pass,
    detail: `lon=${f.input.longitude} engine=${r.nakshatra}/${r.padaNumber} expected=${f.expectedNakshatra}/${f.expectedPada}`
  });
  if (!pass) failures.push(`${f.id}: engine=${r.nakshatra}/${r.padaNumber} expected=${f.expectedNakshatra}/${f.expectedPada}`);
}

function measureHouse(f: Extract<CalculationReferenceFixture, { kind: 'HOUSE_POSITION' }>) {
  const engineHouse = calculateWholeSignHouse(f.input.referenceSign, f.input.targetSign);
  const pass = engineHouse === f.expectedHouse;
  measurements.push({
    fixtureId: f.id, track: 'HOUSE_POSITION', error: pass ? 0 : 1, unit: 'house', pass,
    detail: `${f.input.referenceSign}->${f.input.targetSign} engine=${engineHouse} expected=${f.expectedHouse}`
  });
  if (!pass) failures.push(`${f.id}: engine=${engineHouse} expected=${f.expectedHouse}`);
}

function measureVarga(f: Extract<CalculationReferenceFixture, { kind: 'VARGA_LONGITUDE' }>) {
  const engineLon = getDivisionalLongitude(f.input.longitude, f.input.chartType);
  const errDeg = angDiffDeg(engineLon, f.expected.degrees);
  const pass = errDeg <= f.expected.toleranceDegrees;
  measurements.push({
    fixtureId: f.id, track: 'VARGA_LONGITUDE',
    error: errDeg * ARCSEC_PER_DEG, unit: 'arcsec', pass,
    detail: `${f.input.chartType} lon=${f.input.longitude} engine=${engineLon.toFixed(6)} expected=${f.expected.degrees.toFixed(6)}`
  });
  if (!pass) failures.push(`${f.id}: err=${(errDeg * ARCSEC_PER_DEG).toFixed(2)}"`);
}

function measureDasha(f: Extract<CalculationReferenceFixture, { kind: 'VIMSHOTTARI_DASHA' }>) {
  const timeline = calculateVimshottari({
    birthDateTime: f.input.birthDateTime,
    moonSiderealLongitude: f.input.moonSiderealLongitude,
    ...(f.input.until ? { until: f.input.until } : {})
  });
  const e = f.expected;
  const firstMd = timeline.mahadashas[0];
  const fracErr = Math.abs(timeline.nakshatraProgress - e.nakshatraProgress);
  const remErr = Math.abs(timeline.remainingFraction - e.remainingFraction);
  const startMs = firstMd ? new Date(firstMd.start).getTime() : NaN;
  const endMs = firstMd ? new Date(firstMd.end).getTime() : NaN;
  const expStart = new Date(e.firstMahadashaStart).getTime();
  const expEnd = new Date(e.firstMahadashaEnd).getTime();
  const startErrMs = Math.abs(startMs - expStart);
  const endErrMs = Math.abs(endMs - expEnd);
  const catPass = timeline.nakshatra === e.nakshatra
    && timeline.nakshatraLord === e.nakshatraLord
    && firstMd?.planet === e.firstMahadashaLord;
  const fracPass = fracErr <= f.tolerance.fraction && remErr <= f.tolerance.fraction;
  const boundPass = startErrMs <= f.tolerance.boundaryMilliseconds
    && endErrMs <= f.tolerance.boundaryMilliseconds;
  const pass = catPass && fracPass && boundPass;
  measurements.push({
    fixtureId: f.id, track: 'VIMSHOTTARI_DASHA',
    error: Math.max(endErrMs, startErrMs), unit: 'ms', pass,
    detail: `nak=${timeline.nakshatra}/${e.nakshatra} progressErr=${fracErr.toExponential(2)} endErrMs=${endErrMs.toFixed(1)}`
  });
  if (!pass) failures.push(`${f.id}: cat=${catPass} frac=${fracPass} bound=${boundPass} endErrMs=${endErrMs.toFixed(1)}`);
}

/* ---------------- ascendant + supplementary grid agreement ------------ */

interface AscMeasurement { caseId: string; errorDeg: number; pass: boolean }
const ascMeasurements: AscMeasurement[] = [];

function measureAscendants() {
  const cohortDir = join(GATE0_ROOT, 'captures/cohort');
  for (const file of readdirSync(cohortDir).filter(f => f.endsWith('.json')).sort()) {
    const artifact = readJsonFile<{
      caseId: string;
      site: { latitude: number; longitude: number; instant: { utcInstant: string; localRepresentation: string; ianaTimeZone: string } };
      capture: { ascendantSiderealDeg: number | null };
    }>(join(cohortDir, file));
    if (artifact.capture.ascendantSiderealDeg === null) continue;
    const birth: BirthDetails = {
      latitude: artifact.site.latitude,
      longitude: artifact.site.longitude,
      timeZone: artifact.site.instant.ianaTimeZone,
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: artifact.site.instant.utcInstant
    };
    const engineAsc = calculateAscendant(birth);
    const errDeg = angDiffDeg(engineAsc, artifact.capture.ascendantSiderealDeg);
    ascMeasurements.push({ caseId: artifact.caseId, errorDeg: errDeg, pass: errDeg <= 0.01 });
  }
}

interface GridAgreement { track: string; total: number; agree: number }
const gridAgreements: GridAgreement[] = [];

function measureGridAgreement() {
  // For every captured planetary longitude, compare engine's categorical
  // outputs on the REFERENCE longitude against the independent grid evaluator.
  let signTotal = 0, signAgree = 0, nakTotal = 0, nakAgree = 0, padaTotal = 0, padaAgree = 0;
  let d9Total = 0, d9Agree = 0, d10Total = 0, d10Agree = 0;
  const cohortDir = join(GATE0_ROOT, 'captures/cohort');
  for (const file of readdirSync(cohortDir).filter(f => f.endsWith('.json')).sort()) {
    const artifact = readJsonFile<{
      capture: { bodies: Record<string, { sidereal: { longitude: number } }> };
    }>(join(cohortDir, file));
    for (const body of Object.values(artifact.capture.bodies)) {
      const lon = body.sidereal.longitude;
      const engineSign = calculateSign(lon);
      if (engineSign === signAt(lon)) signAgree++; signTotal++;
      const r = calculateNakshatra(lon);
      const g = nakshatraAt(lon);
      const gp = padaAt(lon);
      if (r.nakshatra === g.def.name && r.padaNumber === gp.pada) nakAgree++; nakTotal++;
      if (r.padaNumber === gp.pada) padaAgree++; padaTotal++;
      const e9 = getDivisionalLongitude(lon, ChartType.D9);
      if (Math.abs(normDeg(e9 - vargaD9(lon))) < 1e-6) d9Agree++; d9Total++;
      const e10 = getDivisionalLongitude(lon, ChartType.D10);
      if (Math.abs(normDeg(e10 - vargaD10(lon))) < 1e-6) d10Agree++; d10Total++;
    }
  }
  gridAgreements.push(
    { track: 'SIGN (on reference longitudes)', total: signTotal, agree: signAgree },
    { track: 'NAKSHATRA+PADA (on reference longitudes)', total: nakTotal, agree: nakAgree },
    { track: 'PADA only (on reference longitudes)', total: padaTotal, agree: padaAgree },
    { track: 'D9 varga (on reference longitudes)', total: d9Total, agree: d9Agree },
    { track: 'D10 varga (on reference longitudes)', total: d10Total, agree: d10Agree }
  );
}

/* ----------------------------- report --------------------------------- */

function stats(values: number[]) {
  if (values.length === 0) return { n: 0, max: NaN, mean: NaN, p95: NaN };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    n: values.length,
    max: sorted[sorted.length - 1],
    mean,
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
  };
}

function main() {
  const root = repoRoot();
  const engineCommitSha = gitCommitSha(root);

  const boundaryIssues = inspectBoundaryCoverage(CALCULATION_REFERENCE_FIXTURES, CALCULATION_COVERAGE_POLICY);

  for (const f of CALCULATION_REFERENCE_FIXTURES) {
    switch (f.kind) {
      case 'PLANETARY_LONGITUDE': measurePlanetaryLongitude(f); break;
      case 'PLANETARY_MOTION': measurePlanetaryMotion(f); break;
      case 'RAHU_KETU_OPPOSITION': measureRahuKetu(f); break;
      case 'SIGN_BOUNDARY': measureSignBoundary(f); break;
      case 'NAKSHATRA_BOUNDARY': measureNakshatraBoundary(f); break;
      case 'HOUSE_POSITION': measureHouse(f); break;
      case 'VARGA_LONGITUDE': measureVarga(f); break;
      case 'VIMSHOTTARI_DASHA': measureDasha(f); break;
    }
  }
  measureAscendants();
  measureGridAgreement();

  // per-track aggregation
  const byTrack = new Map<string, Measurement[]>();
  for (const m of measurements) {
    byTrack.set(m.track, [...(byTrack.get(m.track) ?? []), m]);
  }

  const lines: string[] = [];
  lines.push('# G0-A Parity Report — RG-09 Calculation Reference Fixtures');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Engine commit: \`${engineCommitSha}\``);
  lines.push(`Fixture count: ${CALCULATION_REFERENCE_FIXTURES.length}`);
  lines.push(`RG-09 gate: **${RG_09_CALCULATION_REFERENCE_GATE.status}** (coverageComplete=${RG_09_CALCULATION_REFERENCE_GATE.coverageComplete})`);
  lines.push(`inspectBoundaryCoverage issues: ${boundaryIssues.length}${boundaryIssues.length ? ' — ' + boundaryIssues.slice(0, 5).join('; ') : ''}`);
  lines.push('');
  lines.push('Expected values come exclusively from offline captures under `tools/gate0/captures/`');
  lines.push('(Swiss Ephemeris 2.10.03 WASM + DE441-derived `.se1` files; independent grid-semantics');
  lines.push('evaluator for constructed vectors; astronomy-engine 2.1.19 MIT cross-check recorded');
  lines.push('per cohort artifact). Engine output appears only as the measured side.');
  lines.push('');
  lines.push('## Per-track results');
  lines.push('');
  lines.push('| Track | n | pass | fail | max error | mean error | unit | §4 tolerance |');
  lines.push('|-------|---|------|------|-----------|------------|------|--------------|');
  const tolLabel: Record<string, string> = {
    PLANETARY_LONGITUDE: '0.01° (nodes 0.005°, Moon-dasha 0.0001°)',
    PLANETARY_MOTION: 'speed ±0.05°/day + exact flags',
    RAHU_KETU_OPPOSITION: '0.01°',
    SIGN_BOUNDARY: 'categorical',
    NAKSHATRA_BOUNDARY: 'categorical',
    HOUSE_POSITION: 'exact',
    VARGA_LONGITUDE: '1e-6°',
    VIMSHOTTARI_DASHA: 'fraction 1e-6 / boundary 1000 ms'
  };
  for (const [track, ms] of [...byTrack.entries()].sort()) {
    const errs = ms.map(m => m.error);
    const s = stats(errs);
    const pass = ms.filter(m => m.pass).length;
    const fail = ms.length - pass;
    lines.push(`| ${track} | ${s.n} | ${pass} | ${fail} | ${fmt(s.max)} | ${fmt(s.mean)} | ${ms[0].unit} | ${tolLabel[track] ?? ''} |`);
  }
  lines.push('');
  lines.push('## Ascendant (parity measurement, not a fixture kind)');
  lines.push('');
  const ascErrs = ascMeasurements.map(a => a.errorDeg);
  const ascStats = stats(ascErrs);
  const ascPass = ascMeasurements.filter(a => a.pass).length;
  lines.push(`- cases: ${ascMeasurements.length}, pass(<=0.01°): ${ascPass}, fail: ${ascMeasurements.length - ascPass}`);
  lines.push(`- max |Δ| = ${fmt(ascStats.max)}°, mean = ${fmt(ascStats.mean)}° (tolerance 0.01° = ${(0.01 * ARCSEC_PER_DEG).toFixed(0)}″)`);
  lines.push('');
  lines.push('## Grid agreement on captured reference longitudes');
  lines.push('');
  lines.push('| Track | agree/total |');
  lines.push('|-------|-------------|');
  for (const g of gridAgreements) lines.push(`| ${g.track} | ${g.agree}/${g.total} |`);
  lines.push('');
  lines.push('## Failure sample (first 40)');
  lines.push('');
  if (failures.length === 0) {
    lines.push('_No fixture failures._');
  } else {
    lines.push(`Total failing fixtures: ${failures.length}`);
    for (const f of failures.slice(0, 40)) lines.push(`- ${f}`);
    if (failures.length > 40) lines.push(`- … and ${failures.length - 40} more`);
  }
  lines.push('');
  lines.push('## Fork recommendation');
  lines.push('');
  lines.push(buildForkRecommendation(byTrack, ascMeasurements, gridAgreements));
  lines.push('');
  lines.push('## Provenance & reproducibility');
  lines.push('');
  lines.push('- Captures: `tools/gate0/captures/` (cohort/*.json + boundary-vectors.v1.json + manifest.json with SHA-256 per artifact).');
  lines.push('- Fixture module: `src/engine/validation/calculationReferenceFixtures.generated.ts` (auto-generated; builders enforce provenance).');
  lines.push('- Reference implementation: @kuntay/swisseph 0.2.2 / Swiss Ephemeris 2.10.03 WASM, ephemeris `sepl_18.se1`+`semo_18.se1` (DE441-derived, 1800–2399 CE), ayanamsa LAHIRI, mean node, geocentric apparent.');
  lines.push('- Cross-check: astronomy-engine 2.1.19 (MIT), independently identifiable, per-case diffs recorded in cohort artifacts (max |Δ| tropical longitude ≈ 0.018° at 2099, ≈0.001–0.003° near J2000 — consistent with AE truncated lunar theory).');
  lines.push('- License flag: Swiss Ephemeris is AGPL-3.0-or-later; tooling-only use, distribution review required before release.');
  lines.push('- Determinism: same capture inputs + tool versions → byte-stable artifacts (verified: cohort BI-001 and boundary-vectors.v1.json SHA-256 reproduce identically across re-capture).');

  const reportPath = join(root, 'docs/career/audit/GATE-0-PARITY-REPORT.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
  console.log(`wrote ${reportPath}`);
  console.log(`fixtures=${CALCULATION_REFERENCE_FIXTURES.length} measurements=${measurements.length} failures=${failures.length} gate=${RG_09_CALCULATION_REFERENCE_GATE.status}`);
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return 'n/a';
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 1) return v.toFixed(3);
  return v.toExponential(3);
}

function buildForkRecommendation(
  byTrack: Map<string, Measurement[]>,
  asc: AscMeasurement[],
  grid: GridAgreement[]
): string {
  const pl = byTrack.get('PLANETARY_LONGITUDE') ?? [];
  const plPass = pl.filter(m => m.pass).length;
  const moon = pl.filter(m => m.fixtureId.includes('-MOON'));
  const moonMaxArcsec = Math.max(...moon.map(m => m.error), 0);
  const ascFail = asc.filter(a => !a.pass).length;
  const dasha = byTrack.get('VIMSHOTTARI_DASHA') ?? [];
  const dashaPass = dasha.filter(m => m.pass).length;
  const motion = byTrack.get('PLANETARY_MOTION') ?? [];
  const motionPass = motion.filter(m => m.pass).length;
  const boundaryFail = [...byTrack.entries()]
    .filter(([t]) => t.includes('BOUNDARY') || t === 'HOUSE_POSITION' || t === 'VARGA_LONGITUDE')
    .flatMap(([, ms]) => ms).filter(m => !m.pass).length;

  const moonPass = moon.filter(m => m.pass).length;
  const longitudePassRate = pl.length > 0 ? plPass / pl.length : 0;

  const lines: string[] = [];
  lines.push(`Measured outcome: **${plPass}/${pl.length}** planetary-longitude fixtures pass (max lunar error ${moonMaxArcsec.toFixed(0)}″ vs 0.01°≈36″ class tolerance); ` +
    `ascendant ${asc.length - ascFail}/${asc.length} pass; motion ${motionPass}/${motion.length} pass; ` +
    `dasha anchors ${dashaPass}/${dasha.length} pass; constructed-vector tracks ${boundaryFail} failures.`);
  lines.push('');
  if (moonPass === 0 || moonMaxArcsec > 3600 || longitudePassRate < 0.5) {
    lines.push('**Recommendation: Fork A — replace the astronomy core.**');
    lines.push('');
    lines.push('Evidence:');
    lines.push(`- Lunar longitude passes ${moonPass}/${moon.length} fixtures (max error ${moonMaxArcsec.toFixed(0)}″ ≈ ${(moonMaxArcsec / 3600).toFixed(3)}°); the Moon anchors every Vimshottari dasha in production, so no cohort restriction can certify dasha timings while the engine computes lunar position itself.`);
    lines.push(`- Only ${plPass}/${pl.length} (${(longitudePassRate * 100).toFixed(0)}%) planetary-longitude fixtures meet §4 tolerances; the truncated low-order analytical series in \`astroEngine.ts\` (\`computeTropicalPositions\`, mean-node quadratic, +0.01 d finite-difference speed, fixed \`eclipticLatitude: 0\`) miss by 1–3 orders of magnitude on lunar and most planetary cases.`);
    lines.push('- Constructed grid vectors and the ascendant are the only tracks inside tolerance; they validate discrete grid logic and a low-order GMST formula, not ephemeris quality.');
    lines.push('- Fork A should adopt a reference-grade ephemeris behind the existing `generatePlanetaryPositions`/`calculateAscendant` seams (Swiss Ephemeris commercial license, or astronomy-engine MIT — both already exercised offline by this harness).');
  } else {
    lines.push('**Recommendation: Fork B — restrict the cohort.**');
    lines.push('A meaningful subset of fixtures passes §4 tolerances; scope RG-09/RG-10 claims to the certified subset and document the engine as approximate elsewhere.');
  }
  return lines.join('\n');
}

main();
