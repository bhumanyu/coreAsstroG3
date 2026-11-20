/**
 * Capture constructed calculation-boundary vectors (§3b) and deterministic
 * grid fixtures (house-position, varga, Vimshottari anchors) into
 * tools/gate0/captures/boundary-vectors.v1.json.
 *
 * Expected categorical values come from the independent grid-semantics
 * evaluator in lib/grid.ts (documented half-open conventions) — never from
 * engine output. Vimshottari anchors additionally lock the Moon sidereal
 * longitude to the Swiss Ephemeris cohort captures.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { boundaryTripletLongitudes, type BoundaryTripletSpec } from '../../src/engine/validation/calculationReferenceFixtureSchema.ts';
import {
  SIGNS, NAKSHATRA_DEFS, NAKSHATRA_SPAN_DEG, PADA_SPAN_DEG, SIGN_SPAN_DEG,
  signAt, padaAt, vargaD9, vargaD10, wholeSignHouse, vimshottariAnchor,
  type SignName
} from './lib/grid.ts';
import { canonicalJson, gitCommitSha, readJsonFile, repoRoot, sha256Hex, GATE0_ROOT } from './lib/util.ts';

/** Must match boundaryTripletLongitudes' internal normalize exactly. */
const norm360 = (d: number) => ((d % 360) + 360) % 360;

const EVALUATOR_ID = 'tools/gate0/lib/grid.ts';
const EVALUATOR_VERSION = '1.0.0';
const CAPTURE_ID = 'CAPTURE-BOUNDARY-VECTORS-2026-11-20';
/** Single epsilon per boundary kind, inside release-policy 1e-6..1e-4 deg. */
const EPSILON_DEG = 0.00001;

interface BoundaryVectorRecord {
  vectorId: string;
  boundaryKind: 'SIGN' | 'NAKSHATRA' | 'PADA';
  boundaryId: string;
  boundaryLongitude: number;
  definition: { name: string; longitude: number; convention: { coordinateFrame: 'SIDEREAL'; ayanamsa: 'LAHIRI' } };
  epsilonDegrees: number;
  positions: Record<string, {
    inputLongitude: number;
    expectedSign?: string;
    expectedNakshatra?: string;
    expectedPada?: number;
  }>;
  rawLine: string;
}

function buildBoundaryVectors(): BoundaryVectorRecord[] {
  const policy = (JSON.parse(readFileSync(
    join(repoRoot(), 'docs/release/release-policy.json'), 'utf8'
  )) as { calculationCoverage: { boundaryEpsilonDegrees: { min: number; max: number } } })
    .calculationCoverage.boundaryEpsilonDegrees;

  const vectors: BoundaryVectorRecord[] = [];

  const emit = (
    boundaryKind: 'SIGN' | 'NAKSHATRA' | 'PADA',
    boundaryId: string,
    boundaryLongitude: number
  ) => {
    const definition = {
      name: boundaryId,
      longitude: boundaryLongitude,
      convention: { coordinateFrame: 'SIDEREAL' as const, ayanamsa: 'LAHIRI' as const }
    };
    const spec: BoundaryTripletSpec = {
      boundaryId,
      boundaryKind,
      boundaryLongitude,
      definition,
      epsilonDegrees: EPSILON_DEG,
      policy
    };
    const longitudes = boundaryTripletLongitudes(spec);
    const positions: BoundaryVectorRecord['positions'] = {};
    for (const position of ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'] as const) {
      const lon = longitudes[position];
      if (boundaryKind === 'SIGN') {
        positions[position] = { inputLongitude: lon, expectedSign: signAt(lon) };
      } else {
        const p = padaAt(lon);
        positions[position] = {
          inputLongitude: lon,
          expectedNakshatra: p.nak,
          expectedPada: p.pada
        };
      }
    }
    const rawLine = canonicalJson({
      vectorId: `${boundaryKind}:${boundaryId}`, boundaryKind, boundaryId,
      boundaryLongitude, epsilonDegrees: EPSILON_DEG, positions
    });
    vectors.push({
      vectorId: `${boundaryKind}:${boundaryId}`,
      boundaryKind, boundaryId, boundaryLongitude, definition,
      epsilonDegrees: EPSILON_DEG, positions, rawLine
    });
  };

  // SIGN: all 12 sign-start boundaries (0,30,...,330).
  for (let k = 0; k < 12; k++) emit('SIGN', `SIGN-BOUNDARY-${k * 30}`, k * 30);
  // NAKSHATRA: all 27 nakshatra-start boundaries.
  for (let j = 0; j < 27; j++) {
    emit('NAKSHATRA', `NAKSHATRA-BOUNDARY-${j + 1}-${NAKSHATRA_DEFS[j].english.toUpperCase().replace(/ /g, '_')}`,
      norm360(j * NAKSHATRA_SPAN_DEG));
  }
  // PADA: all 108 pada-start boundaries.
  for (let p = 0; p < 108; p++) emit('PADA', `PADA-BOUNDARY-${p + 1}`, norm360(p * PADA_SPAN_DEG));

  return vectors;
}

interface VargaVector {
  vectorId: string;
  chartType: 'D9' | 'D10';
  longitude: number;
  boundaryRole: 'GENERIC' | 'EXACT_DIVISION_BOUNDARY' | 'NEAR_BOUNDARY';
  expectedLongitudeDegrees: number;
  rawLine: string;
}

function buildVargaVectors(): VargaVector[] {
  const out: VargaVector[] = [];
  const push = (chartType: 'D9' | 'D10', longitude: number, role: VargaVector['boundaryRole']) => {
    const expected = chartType === 'D9' ? vargaD9(longitude) : vargaD10(longitude);
    const rawLine = canonicalJson({
      vectorId: `VARGA-${chartType}-${out.length + 1}`, chartType,
      longitude, boundaryRole: role, expectedLongitudeDegrees: expected
    });
    out.push({
      vectorId: `VARGA-${chartType}-${out.length + 1}`,
      chartType, longitude, boundaryRole: role,
      expectedLongitudeDegrees: expected, rawLine
    });
  };
  // Generic coverage: every sign at several intra-sign positions.
  const genericPositions = [0.5, 1.7, 5.2, 11.3, 17.9, 22.4, 27.8];
  for (let s = 0; s < 12; s++) {
    for (const pos of genericPositions) {
      push('D9', s * 30 + pos, 'GENERIC');
      push('D10', s * 30 + pos, 'GENERIC');
    }
  }
  // Exact D9 division boundaries: posInSign = k*(10/3), k=0..8, for one sign of
  // each modality (Aries=movable, Taurus=fixed, Gemini=dual).
  for (const signIndex of [0, 1, 2]) {
    for (let k = 0; k <= 8; k++) {
      push('D9', signIndex * 30 + k * (10 / 3), 'EXACT_DIVISION_BOUNDARY');
    }
  }
  // Near-boundary D9 (epsilon below/above a division boundary).
  for (const signIndex of [0, 1, 2]) {
    for (const k of [1, 4, 7]) {
      const b = signIndex * 30 + k * (10 / 3);
      push('D9', norm360(b - 0.00005), 'NEAR_BOUNDARY');
      push('D9', norm360(b + 0.00005), 'NEAR_BOUNDARY');
    }
  }
  // Exact D10 division boundaries: posInSign = 3k, k=0..9, odd+even signs.
  for (const signIndex of [0, 1]) {
    for (let k = 0; k <= 9; k++) {
      push('D10', signIndex * 30 + k * 3, 'EXACT_DIVISION_BOUNDARY');
    }
  }
  for (const signIndex of [0, 1]) {
    for (const k of [1, 4, 7]) {
      const b = signIndex * 30 + k * 3;
      push('D10', norm360(b - 0.00005), 'NEAR_BOUNDARY');
      push('D10', norm360(b + 0.00005), 'NEAR_BOUNDARY');
    }
  }
  return out;
}

interface HouseVector {
  vectorId: string;
  referenceSign: SignName;
  targetSign: SignName;
  expectedHouse: number;
  rawLine: string;
}

function buildHouseVectors(): HouseVector[] {
  const out: HouseVector[] = [];
  for (const ref of SIGNS) {
    for (const tgt of SIGNS) {
      const expected = wholeSignHouse(ref, tgt);
      out.push({
        vectorId: `HOUSE-${ref}-${tgt}`,
        referenceSign: ref, targetSign: tgt, expectedHouse: expected,
        rawLine: canonicalJson({ vectorId: `HOUSE-${ref}-${tgt}`, referenceSign: ref, targetSign: tgt, expectedHouse: expected })
      });
    }
  }
  return out;
}

interface CohortArtifact {
  captureId: string;
  caseId: string;
  site: { latitude: number; longitude: number; instant: { utcInstant: string; localRepresentation: string; ianaTimeZone: string } };
  capture: { ayanamsaDegrees: number; bodies: Record<string, { sidereal: { longitude: number; longitudeSpeed: number } }> };
}

function buildDashaAnchors(): unknown[] {
  const cohortDir = join(GATE0_ROOT, 'captures/cohort');
  const cases = readJsonFile<{ cases: { id: string; dasha: boolean; utcInstant: string }[] }>(
    join(GATE0_ROOT, 'cohort/cases.v1.json')
  ).cases.filter(c => c.dasha);
  const out: unknown[] = [];
  for (const c of cases) {
    const path = join(cohortDir, `${c.id}.json`);
    let artifact: CohortArtifact;
    try {
      artifact = readJsonFile<CohortArtifact>(path);
    } catch {
      continue; // capture missing -> skip; gen-fixtures will BLOCK if needed
    }
    const moonLon = artifact.capture.bodies.MOON.sidereal.longitude;
    const birthMs = new Date(c.utcInstant).getTime();
    const anchor = vimshottariAnchor(moonLon, birthMs);
    const rawLine = canonicalJson({
      caseId: c.id, moonSiderealLongitude: moonLon, birthUtc: c.utcInstant,
      nakshatra: anchor.nakshatra, nakshatraLord: anchor.nakshatraLord,
      nakshatraProgress: anchor.nakshatraProgress, remainingFraction: anchor.remainingFraction,
      firstMahadashaLord: anchor.firstMahadashaLord,
      firstMahadashaStart: new Date(anchor.firstMahadashaStartMs).toISOString(),
      firstMahadashaEnd: new Date(anchor.firstMahadashaEndMs).toISOString()
    });
    out.push({
      vectorId: `DASHA-${c.id}`,
      caseId: c.id,
      cohortCaptureId: artifact.captureId,
      moonSiderealLongitude: moonLon,
      birthUtcInstant: c.utcInstant,
      site: artifact.site,
      ayanamsaDegrees: artifact.capture.ayanamsaDegrees,
      expected: {
        nakshatra: anchor.nakshatra,
        nakshatraEnglish: anchor.nakshatraEnglish,
        nakshatraLord: anchor.nakshatraLord,
        nakshatraProgress: anchor.nakshatraProgress,
        remainingFraction: anchor.remainingFraction,
        firstMahadashaLord: anchor.firstMahadashaLord,
        firstMahadashaStart: new Date(anchor.firstMahadashaStartMs).toISOString(),
        firstMahadashaEnd: new Date(anchor.firstMahadashaEndMs).toISOString()
      },
      rawLine
    });
  }
  return out;
}

async function main() {
  const root = repoRoot();
  const vectors = buildBoundaryVectors();
  const vargaVectors = buildVargaVectors();
  const houseVectors = buildHouseVectors();
  const dashaAnchors = buildDashaAnchors();

  const artifact = {
    schemaVersion: 1,
    captureId: CAPTURE_ID,
    track: 'CALCULATION_BOUNDARY_VECTORS',
    protocol: 'docs/career/audit/GATE-0-VALIDATION-PROTOCOL.md §3b',
    evaluator: {
      id: EVALUATOR_ID,
      version: EVALUATOR_VERSION,
      description: 'Independent grid-semantics evaluator: half-open sign/nakshatra/pada intervals, documented D9/D10 varga rules, whole-sign houses, standard Vimshottari anchor rules. Not derived from engine output.',
      gridEpsilonDeg: 1e-12,
      vimshottariYearDays: 365.25
    },
    engineCommitSha: gitCommitSha(root),
    boundaryEpsilonDegrees: EPSILON_DEG,
    boundaryVectors: vectors,
    vargaVectors,
    houseVectors,
    dashaAnchors
  };

  const json = JSON.stringify(artifact, null, 2) + '\n';
  const outPath = join(GATE0_ROOT, 'captures/boundary-vectors.v1.json');
  const { writeFileSync, mkdirSync } = await import('node:fs');
  mkdirSync(join(GATE0_ROOT, 'captures'), { recursive: true });
  writeFileSync(outPath, json, 'utf8');
  const sha = sha256Hex(json);
  console.log(`wrote ${outPath}`);
  console.log(`sha256=${sha}`);
  console.log(`boundaryVectors=${vectors.length} vargaVectors=${vargaVectors.length} houseVectors=${houseVectors.length} dashaAnchors=${dashaAnchors.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
