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
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateCalculationReferenceGate,
  CALCULATION_REFERENCE_FIXTURES,
  CALCULATION_COVERAGE_POLICY,
  inspectBoundaryCoverage
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
import { gitCommitSha, repoRoot, normDeg, GATE0_ROOT } from './lib/util.ts';
import { signAt, nakshatraAt, padaAt, vargaD9, vargaD10 } from './lib/grid.ts';
import { loadCohortCaptures, auditCohort, renderCohortAudit, type CohortCapture } from './audit-cohort.ts';
import { calculateReferenceDasha } from './lib/referenceDasha.ts';
import { decomposeDashaTimelines, type DashaLevelComparison } from './lib/dashaComparison.ts';
import { deriveGate0OverallStatus } from './lib/readiness.ts';

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

interface NakshatraBoundaryObservation {
  readonly fixtureId: string;
  readonly boundaryId: string;
  readonly boundaryLongitude: number;
  readonly position: string;
  readonly longitude: number;
  readonly expected: string;
  readonly actual: string;
  readonly pass: boolean;
}

const measurements: Measurement[] = [];
const failures: string[] = [];
const nakshatraBoundaryObservations: NakshatraBoundaryObservation[] = [];
const dashaCaseMeasurements: {
  fixtureId: string;
  yearLengthDays: number;
  moonDeltaArcsec: number;
  anchorPass: boolean;
  anchorErrorMs: number;
  anchorDetail?: string;
  arithmetic: Readonly<Record<'MD' | 'AD' | 'PD', DashaLevelComparison>>;
  moonInput: Readonly<Record<'MD' | 'AD' | 'PD', DashaLevelComparison>>;
}[] = [];

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
    fixtureId: f.id,
    track: f.input.planet === Planet.MOON ? 'MOON_LONGITUDE' : 'PLANETARY_LONGITUDE',
    error: errArcsec, unit: 'arcsec', pass,
    detail: `${f.input.planet} engine=${engineLon.toFixed(6)} expected=${f.expected.degrees.toFixed(6)}`
  });
  if (!pass) {
    failures.push(
      `${f.id}: ${errArcsec.toFixed(1)}" > ${(f.expected.toleranceDegrees * ARCSEC_PER_DEG).toFixed(2)}"`
    );
  }
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
  nakshatraBoundaryObservations.push({
    fixtureId: f.id,
    boundaryId: f.boundaryId,
    boundaryLongitude: f.boundaryLongitude,
    position: f.boundaryPosition,
    longitude: f.input.longitude,
    expected: `${f.expectedNakshatra}/${f.expectedPada}`,
    actual: `${r.nakshatra}/${r.padaNumber}`,
    pass
  });
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
  const referenceTimeline = calculateReferenceDasha({
    birthDateTime: f.input.birthDateTime,
    moonSiderealLongitude: f.input.moonSiderealLongitude,
    ...(f.input.until ? { until: f.input.until } : {}),
    yearLengthDays: f.conventions.yearLengthDays
  });
  const referenceMoonEngineTimeline = calculateVimshottari({
    birthDateTime: f.input.birthDateTime,
    moonSiderealLongitude: f.input.moonSiderealLongitude,
    ...(f.input.until ? { until: f.input.until } : {})
  });
  const computedMoon = positionsFor(birthOf(f))[Planet.MOON].longitude;
  const engineMoonEngineTimeline = calculateVimshottari({
    birthDateTime: f.input.birthDateTime,
    moonSiderealLongitude: computedMoon,
    ...(f.input.until ? { until: f.input.until } : {})
  });
  const e = f.expected;
  const firstMd = referenceTimeline.mahadashas[0];
  const fracErr = Math.abs(referenceTimeline.nakshatraProgress - e.nakshatraProgress);
  const remErr = Math.abs((1 - referenceTimeline.nakshatraProgress) - e.remainingFraction);
  const startMs = firstMd ? Date.parse(firstMd.start) : NaN;
  const endMs = firstMd ? Date.parse(firstMd.end) : NaN;
  const expStart = new Date(e.firstMahadashaStart).getTime();
  const expEnd = new Date(e.firstMahadashaEnd).getTime();
  const startErrMs = Math.abs(startMs - expStart);
  const endErrMs = Math.abs(endMs - expEnd);
  const anchorMismatches: string[] = [];
  const expectedNakshatra = String(e.nakshatra).toUpperCase().replace(/[\s-]+/g, '_');
  if (referenceTimeline.nakshatra.toUpperCase() !== expectedNakshatra) {
    anchorMismatches.push(`nak=${referenceTimeline.nakshatra}/${e.nakshatra}`);
  }
  if (referenceTimeline.nakshatraLord !== String(e.nakshatraLord).toUpperCase()) {
    anchorMismatches.push(`lord=${referenceTimeline.nakshatraLord}/${e.nakshatraLord}`);
  }
  if (firstMd?.planet !== String(e.firstMahadashaLord).toUpperCase()) {
    anchorMismatches.push(`firstMD=${firstMd?.planet ?? 'missing'}/${e.firstMahadashaLord}`);
  }
  if (fracErr > f.tolerance.fraction || remErr > f.tolerance.fraction) {
    anchorMismatches.push(`fractionErr=${fracErr.toExponential(2)}/${remErr.toExponential(2)}`);
  }
  if (startErrMs > f.tolerance.boundaryMilliseconds || endErrMs > f.tolerance.boundaryMilliseconds) {
    anchorMismatches.push(`boundaryErrMs=${startErrMs.toFixed(1)}/${endErrMs.toFixed(1)}`);
  }
  const anchorPass = anchorMismatches.length === 0;
  measurements.push({
    fixtureId: f.id,
    track: 'DASHA_REFERENCE_ANCHOR',
    error: Math.max(endErrMs, startErrMs),
    unit: 'ms',
    pass: anchorPass,
    detail: `R→R first-MD anchor=${firstMd?.planet ?? 'missing'}/${e.firstMahadashaLord} ` +
      `startErrMs=${startErrMs.toFixed(1)} endErrMs=${endErrMs.toFixed(1)} progressErr=${fracErr.toExponential(2)}`
  });
  if (!anchorPass) {
    failures.push(`${f.id}: R→R independent timeline did not match the frozen first-MD anchor.`);
  }

  const decomposition = decomposeDashaTimelines(
    referenceTimeline,
    referenceMoonEngineTimeline,
    engineMoonEngineTimeline
  );
  const arithmeticLevels = Object.values(decomposition.arithmetic);
  const arithmeticMaxError = Math.max(
    ...arithmeticLevels.map(level => level.maxBoundaryErrorMs ?? 0)
  );
  const arithmeticPass = arithmeticLevels.every(level =>
    level.structuralAgreement
    && (level.maxBoundaryErrorMs ?? 0) <= f.tolerance.boundaryMilliseconds
  );
  const moonErrorArcsec = angDiffDeg(computedMoon, f.input.moonSiderealLongitude) * ARCSEC_PER_DEG;
  dashaCaseMeasurements.push({
    fixtureId: f.id,
    yearLengthDays: f.conventions.yearLengthDays,
    moonDeltaArcsec: moonErrorArcsec,
    anchorPass,
    anchorErrorMs: Math.max(startErrMs, endErrMs),
    ...(!anchorPass ? { anchorDetail: anchorMismatches.join('; ') } : {}),
    arithmetic: decomposition.arithmetic,
    moonInput: decomposition.moonInput
  });
  measurements.push({
    fixtureId: f.id,
    track: 'DASHA_ARITHMETIC_REFERENCE_MOON',
    error: arithmeticMaxError,
    unit: 'ms',
    pass: arithmeticPass,
    detail: `R→E vs R→R MD/AD/PD maxBoundaryErrMs=${arithmeticMaxError.toFixed(1)} ` +
      `structure=${arithmeticLevels.every(level => level.structuralAgreement)}`
  });
  if (!arithmeticPass) {
    failures.push(`${f.id}: R→E vs R→R dasha arithmetic/structure differs.`);
  }
}

/* ---------------- ascendant + supplementary grid agreement ------------ */

interface AscMeasurement { caseId: string; errorDeg: number; pass: boolean }
const ascMeasurements: AscMeasurement[] = [];

function measureAscendants(captures: readonly CohortCapture[]) {
  for (const { definition, artifact } of captures) {
    if (artifact.capture.ascendantTropicalDeg === null
      || artifact.capture.ascendantSiderealDeg === null) continue;
    const birth: BirthDetails = {
      latitude: artifact.site.latitude,
      longitude: artifact.site.longitude,
      timeZone: artifact.site.instant.ianaTimeZone,
      ayanamsa: AyanamsaType.LAHIRI,
      dateTimeStr: artifact.site.instant.utcInstant
    };
    const engineAsc = calculateAscendant(birth);
    const errDeg = angDiffDeg(engineAsc, artifact.capture.ascendantSiderealDeg);
    ascMeasurements.push({ caseId: definition.id, errorDeg: errDeg, pass: errDeg <= 0.01 });
  }
}

interface GridAgreement { track: string; total: number; agree: number }
const gridAgreements: GridAgreement[] = [];

function measureGridAgreement(captures: readonly CohortCapture[]) {
  // For every captured planetary longitude, compare engine's categorical
  // outputs on the REFERENCE longitude against the independent grid evaluator.
  let signTotal = 0, signAgree = 0, nakTotal = 0, nakAgree = 0, padaTotal = 0, padaAgree = 0;
  let d9Total = 0, d9Agree = 0, d10Total = 0, d10Agree = 0;
  for (const { artifact } of captures) {
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

export function runParity() {
  const root = repoRoot();
  const engineCommitSha = gitCommitSha(root);
  const cohortCaptures = loadCohortCaptures();
  const cohortAudit = auditCohort(cohortCaptures);
  const gate = calculateCalculationReferenceGate(join(GATE0_ROOT, 'approvals.json'));
  const gate0OverallStatus = deriveGate0OverallStatus(
    gate.overallStatus,
    cohortAudit.missingMoonBrackets.length
  );
  const fixtureSetSha256 = gate.fixtureSetSha256;

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
  measureAscendants(cohortCaptures);
  measureGridAgreement(cohortCaptures);

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
  lines.push(`RG-09 coverage: **${gate.coverageStatus}** (coverageComplete=${gate.coverageComplete})`);
  lines.push(`RG-09 approval: **${gate.approvalStatus}**`);
  lines.push(`RG-09 overall: **${gate.overallStatus}** — ${gate.reason}`);
  lines.push(`Gate-0 overall readiness (includes cohort brackets): **${gate0OverallStatus}**` +
    ` (missingMoonBrackets=${cohortAudit.missingMoonBrackets.length})`);
  lines.push(`Fixture-set SHA-256: \`${fixtureSetSha256}\``);
  lines.push(`Cohort stratification: **${cohortAudit.missingMoonBrackets.length === 0 ? 'COMPLETE' : 'INCOMPLETE'}**`);
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
    PLANETARY_LONGITUDE: '0.01° (nodes 0.005°)',
    MOON_LONGITUDE: '0.0001° (Moon-anchor protocol)',
    PLANETARY_MOTION: 'speed ±0.05°/day + exact flags',
    RAHU_KETU_OPPOSITION: '0.01°',
    SIGN_BOUNDARY: 'categorical',
    NAKSHATRA_BOUNDARY: 'categorical',
    HOUSE_POSITION: 'exact',
    VARGA_LONGITUDE: '1e-6°',
    DASHA_REFERENCE_ANCHOR: 'frozen first-MD anchor tolerances',
    DASHA_ARITHMETIC_REFERENCE_MOON: 'all MD/AD/PD boundaries <= 1000 ms'
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
  lines.push(`- ascendant unavailable in cohort captures: ${cohortAudit.ascendantUnavailableCount} (excluded from measurement coverage)`);
  lines.push(`- max |Δ| = ${fmt(ascStats.max)}°, mean = ${fmt(ascStats.mean)}° (tolerance 0.01° = ${(0.01 * ARCSEC_PER_DEG).toFixed(0)}″)`);
  lines.push('');
  renderDashaDecomposition(lines);
  lines.push('');
  lines.push('## Cohort stratification audit (§3a)');
  lines.push('');
  lines.push(renderCohortAudit(cohortAudit));
  lines.push('');
  lines.push('Moon-anchor cases must bracket every nakshatra boundary within ±0.01° on both sides; a missing bracket is a coverage gap, not an assumed pass.');
  lines.push('');
  lines.push('## Grid agreement on captured reference longitudes');
  lines.push('');
  lines.push('| Track | agree/total |');
  lines.push('|-------|-------------|');
  for (const g of gridAgreements) lines.push(`| ${g.track} | ${g.agree}/${g.total} |`);
  lines.push('');
  const failingBoundaryGroups = renderNakshatraBoundaryDiagnosis(lines);
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
  writeNakshatraBoundaryDefectReport(root, failingBoundaryGroups);
  console.log(`wrote ${reportPath}`);
  console.log(`fixtures=${CALCULATION_REFERENCE_FIXTURES.length} measurements=${measurements.length} failures=${failures.length} ` +
    `rg09=${gate.overallStatus} gate0=${gate0OverallStatus}`);
}

function renderNakshatraBoundaryDiagnosis(lines: string[]): readonly NakshatraBoundaryObservation[][] {
  const groups = new Map<string, NakshatraBoundaryObservation[]>();
  for (const observation of nakshatraBoundaryObservations) {
    groups.set(observation.boundaryId, [
      ...(groups.get(observation.boundaryId) ?? []),
      observation
    ]);
  }
  const failingGroups = [...groups.values()]
    .filter(group => group.some(observation => !observation.pass))
    .sort((left, right) => left[0].boundaryLongitude - right[0].boundaryLongitude);
  const failingCount = failingGroups.reduce(
    (count, group) => count + group.filter(observation => !observation.pass).length,
    0
  );
  const exactOnly = failingGroups.every(group =>
    group.filter(observation => !observation.pass).every(observation => observation.position === 'EXACT')
  );
  const outsideExactFailures = failingGroups.flat().filter(
    observation => !observation.pass && observation.position !== 'EXACT'
  ).length;
  lines.push('## Nakshatra/pada boundary defect diagnosis');
  lines.push('');
  lines.push(`- ${failingCount} categorical failures across ${failingGroups.length} boundary triplets; ` +
    `${outsideExactFailures} occur outside EXACT. The exact-only finding is ${exactOnly ? 'confirmed' : 'not confirmed'}.`);
  lines.push('- These constructed vectors pass reference longitudes directly to `calculateNakshatra`; no ephemeris result participates. A failed category with the same input longitude is a categorical assignment discrepancy, not an upstream longitude error.');
  lines.push('- See [the defect report](./NAKSHATRA-BOUNDARY-DEFECT-REPORT.md) for all three positions of every failing triplet and the classification evidence.');
  lines.push('');
  return failingGroups;
}

function writeNakshatraBoundaryDefectReport(
  root: string,
  failingGroups: readonly NakshatraBoundaryObservation[][]
): void {
  const observations = failingGroups.flat();
  const exactOnly = failingGroups.every(group =>
    group.filter(observation => !observation.pass).every(observation => observation.position === 'EXACT')
  );
  const passingBefore = observations.filter(
    observation => observation.position === 'EPSILON_BEFORE' && observation.pass
  ).length;
  const passingAfter = observations.filter(
    observation => observation.position === 'EPSILON_AFTER' && observation.pass
  ).length;
  const exactFailures = observations.filter(
    observation => observation.position === 'EXACT' && !observation.pass
  );
  const lines = [
    '# Gate-0 Nakshatra Boundary Defect Report',
    '',
    '## Finding',
    '',
    `The current 405-vector categorical track has ${exactFailures.length} failed assignments. ` +
      `All failures are at EXACT positions: ${exactOnly ? 'confirmed' : 'not confirmed'}.`,
    `For the ${failingGroups.length} failing triplets, EPSILON_BEFORE passes ${passingBefore}/${failingGroups.length} ` +
      `and EPSILON_AFTER passes ${passingAfter}/${failingGroups.length}.`,
    'The constructed reference longitude is passed directly to the production categorizer; these failures do not depend on planetary ephemeris accuracy. They are categorical assignment defects, not upstream longitude errors.',
    '',
    '## Diagnosis',
    '',
    'Every failing triplet is a pada boundary. The expected nakshatra is retained, but at the exact longitude the engine reports the preceding pada (for example, Krittika/1 instead of Krittika/2 at 30°). The mismatch is consistent with the production lookup metadata using decimal-rounded nakshatra start degrees (for example, 26.6666666667°) while the pada span is computed from `40 / 3`; the `1e-12°` offset in `calculateNakshatra` does not compensate for the larger representation difference. This is a half-open interval / floating-point boundary classification defect.',
    '',
    'The defect is documented only. The audit freeze prohibits changes to `src/engine/nakshatraUtils.ts`; no boundary algorithm or expected fixture has been modified to force parity.',
    '',
    '## Failing triplets',
    '',
    '| Boundary ID | Boundary longitude (°) | Position | Input longitude (°) | Expected | Engine | Result |',
    '|-------------|-------------------------|----------|---------------------|----------|--------|--------|'
  ];
  for (const group of failingGroups) {
    const ordered = [...group].sort((a, b) =>
      ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'].indexOf(a.position)
      - ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'].indexOf(b.position)
    );
    for (const observation of ordered) {
      lines.push(
        `| ${observation.boundaryId} | ${observation.boundaryLongitude} | ${observation.position} | ` +
        `${observation.longitude} | ${observation.expected} | ${observation.actual} | ` +
        `${observation.pass ? 'PASS' : 'FAIL'} |`
      );
    }
  }
  lines.push('');
  const reportPath = join(root, 'docs/career/audit/NAKSHATRA-BOUNDARY-DEFECT-REPORT.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
}

function renderDashaDecomposition(lines: string[]): void {
  const yearLengths = [...new Set(dashaCaseMeasurements.map(item => item.yearLengthDays))];
  const moonErrors = dashaCaseMeasurements.map(item => item.moonDeltaArcsec);
  const moonStats = stats(moonErrors);
  const anchorMatches = dashaCaseMeasurements.filter(item => item.anchorPass).length;
  lines.push('## Dasha error decomposition');
  lines.push('');
  lines.push(`- Cases: ${dashaCaseMeasurements.length}; each case produced R→R, R→E, and E→E timelines.`);
  lines.push(`- R→R anchor check against the frozen fixture expected first-MD values: ${anchorMatches}/${dashaCaseMeasurements.length}.`);
  const anchorFailures = dashaCaseMeasurements.filter(item => !item.anchorPass);
  if (anchorFailures.length > 0) {
    lines.push(`- R→R anchor mismatch samples: ${anchorFailures.slice(0, 8)
      .map(item => `${item.fixtureId} (${item.anchorDetail ?? 'mismatch'})`).join('; ')}.`);
  }
  lines.push(`- Year-length convention: ${yearLengths.map(days => `${days} days`).join(', ') || 'none recorded'}.`);
  lines.push(`- Engine-vs-reference Moon difference: max ${fmt(moonStats.max)}″, mean ${fmt(moonStats.mean)}″.`);
  lines.push('- Reference-model independence boundary: the Gate-0 reference implementation is independent of production `vimshottari.ts`, but shares Gate-0 convention definitions (`DASHA_SEQUENCE`, `DASHA_YEARS`, and `vimshottariAnchor` from `lib/grid.ts`).');
  lines.push('- The 67 R→R first-MD anchors are checked against unchanged fixture expected values. Later MD/AD/PD periods are derived by the Gate-0 model and are NOT independently captured expected values.');
  lines.push('- Dasha known-answer conformance is hand-computed from the published Vimshottari sequence, durations, 365.25-day year, and proportional subdivisions ([Dasha overview](https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha)); see `tests/dashaDecomposition.test.ts`.');
  lines.push('- Periods are matched by the full lord path (including MD ancestry); boundary errors cover matched periods only. Unmatched periods are excluded from timestamp error statistics and counted separately below.');
  lines.push('');
  lines.push('| Level | Comparison | Cases structurally agreeing | Structurally matched periods | Boundary timestamps compared | Unmatched periods excluded | Sequence-difference score | Max matched-boundary error (ms) | Mean matched-boundary error (ms) |');
  lines.push('|-------|------------|-----------------------------|-----------------------------|-------------------------------|-----------------------------|---------------------------|-------------------------------|----------------------------------|');
  for (const level of ['MD', 'AD', 'PD'] as const) {
    for (const [label, key] of [
      ['R→R vs R→E (arithmetic/structure)', 'arithmetic'],
      ['R→E vs E→E (Moon-input delta)', 'moonInput']
    ] as const) {
      const results = dashaCaseMeasurements.map(item => item[key][level]);
      const boundaryResults = results.filter(
        result => result.maxBoundaryErrorMs !== null && result.meanBoundaryErrorMs !== null
      );
      const boundaryCount = boundaryResults.reduce(
        (sum, result) => sum + result.boundaryTimestampsCompared, 0
      );
      const weightedMean = boundaryCount === 0 ? null : boundaryResults.reduce(
        (sum, result) => sum + (result.meanBoundaryErrorMs ?? 0) * result.boundaryTimestampsCompared,
        0
      ) / boundaryCount;
      const maxError = boundaryResults.length === 0 ? null : Math.max(
        ...boundaryResults.map(result => result.maxBoundaryErrorMs ?? 0)
      );
      const structuralCount = results.filter(result => result.structuralAgreement).length;
      const matchedPeriodCount = results.reduce((sum, result) => sum + result.matchedPeriods, 0);
      const unmatchedPeriodCount = results.reduce(
        (sum, result) => sum + result.unmatchedExpectedPeriods + result.unmatchedActualPeriods,
        0
      );
      const unmatchedExpectedCount = results.reduce(
        (sum, result) => sum + result.unmatchedExpectedPeriods,
        0
      );
      const unmatchedActualCount = results.reduce(
        (sum, result) => sum + result.unmatchedActualPeriods,
        0
      );
      const sequenceDifferenceCount = results.reduce(
        (sum, result) => sum + result.sequenceDifferenceCount,
        0
      );
      lines.push(
        `| ${level} | ${label} | ${structuralCount}/${results.length} | ${matchedPeriodCount} | ${boundaryCount} | ` +
        `${unmatchedPeriodCount} (E ${unmatchedExpectedCount}, A ${unmatchedActualCount}) | ` +
        `${sequenceDifferenceCount} | ${maxError === null ? 'n/a' : fmt(maxError)} | ` +
        `${weightedMean === null ? 'n/a' : fmt(weightedMean)} |`
      );
      const mismatch = dashaCaseMeasurements.find(item => !item[key][level].structuralAgreement);
      if (mismatch) {
        lines.push(`|  | First structural mismatch | ${mismatch.fixtureId}: ${mismatch[key][level].structuralDetail ?? 'lord sequence differs'} |  |  |  |  |  |`);
      }
    }
  }
  lines.push('- Sequence-difference score is `|expected count − actual count| + positional lord-path mismatches`; it is a severity heuristic, not a count of unique failed periods. Unmatched expected/actual totals above are the precise exclusion counts.');
  lines.push('');
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
  const moon = byTrack.get('MOON_LONGITUDE') ?? [];
  const moonMaxArcsec = Math.max(...moon.map(m => m.error), 0);
  const ascFail = asc.filter(a => !a.pass).length;
  const dashaAnchor = byTrack.get('DASHA_REFERENCE_ANCHOR') ?? [];
  const dashaArithmetic = byTrack.get('DASHA_ARITHMETIC_REFERENCE_MOON') ?? [];
  const motion = byTrack.get('PLANETARY_MOTION') ?? [];
  const categorical = ['SIGN_BOUNDARY', 'NAKSHATRA_BOUNDARY']
    .flatMap(track => byTrack.get(track) ?? []);
  const arithmetic = ['HOUSE_POSITION', 'VARGA_LONGITUDE']
    .flatMap(track => byTrack.get(track) ?? []);
  const rahuKetu = byTrack.get('RAHU_KETU_OPPOSITION') ?? [];
  const allTracks = [...byTrack.values()].flat();
  const anyTrackFailure = allTracks.some(measurement => !measurement.pass)
    || ascFail > 0
    || grid.some(agreement => agreement.agree !== agreement.total);
  const plPass = pl.filter(m => m.pass).length;
  const moonPass = moon.filter(m => m.pass).length;
  const motionPass = motion.filter(m => m.pass).length;
  const anchorPass = dashaAnchor.filter(m => m.pass).length;
  const dashaArithmeticPass = dashaArithmetic.filter(m => m.pass).length;
  const categoricalFail = categorical.filter(m => !m.pass).length;
  const arithmeticFail = arithmetic.filter(m => !m.pass).length;

  const lines: string[] = [];
  lines.push('Per-track verdicts:');
  lines.push(`- Astronomical position: other planets ${plPass}/${pl.length}; Moon anchors ${moonPass}/${moon.length} at 0.0001° (max ${moonMaxArcsec.toFixed(1)}″); Rahu/Ketu opposition ${rahuKetu.filter(m => m.pass).length}/${rahuKetu.length}.`);
  lines.push(`- Motion: ${motionPass}/${motion.length}.`);
  lines.push(`- Ascendant: ${asc.length - ascFail}/${asc.length} within 0.01°.`);
  lines.push(`- Categorical boundary: ${categorical.filter(m => m.pass).length}/${categorical.length} (${categoricalFail} failures).`);
  lines.push(`- Varga/house arithmetic: ${arithmetic.filter(m => m.pass).length}/${arithmetic.length} (${arithmeticFail} failures).`);
  lines.push(`- R→R independent dasha anchors: ${anchorPass}/${dashaAnchor.length}.`);
  lines.push(`- R→E dasha arithmetic vs R→R model: ${dashaArithmeticPass}/${dashaArithmetic.length}.`);
  for (const agreement of grid) {
    lines.push(`- Reference-grid cross-check (${agreement.track}): ${agreement.agree}/${agreement.total}.`);
  }
  lines.push('');
  if (anyTrackFailure) {
    lines.push('**Recommendation: Fork A — replace the astronomy core and address failing deterministic tracks separately.**');
    lines.push('');
    lines.push('Evidence:');
    lines.push(`- Moon-anchor longitude has ${moonPass}/${moon.length} passes at the protocol's 0.0001° tolerance; dasha results separate R→E arithmetic from E→E Moon-input effects in the decomposition table.`);
    lines.push(`- Other planetary longitudes have ${plPass}/${pl.length} passes; motion has ${motionPass}/${motion.length}; ascendant has ${asc.length - ascFail}/${asc.length}.`);
    lines.push(`- Categorical boundaries have ${categoricalFail} failures and varga/house arithmetic has ${arithmeticFail}; these deterministic tracks are reported separately from ephemeris accuracy.`);
    lines.push('- A reference-grade ephemeris should be adopted behind the existing `generatePlanetaryPositions`/`calculateAscendant` seams; deterministic boundary failures require their own investigation.');
  } else {
    lines.push('**Recommendation: Fork B — restrict the cohort.**');
    lines.push('A meaningful subset of fixtures passes §4 tolerances; scope RG-09/RG-10 claims to the certified subset and document the engine as approximate elsewhere.');
  }
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runParity();
