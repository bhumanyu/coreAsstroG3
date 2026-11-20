/**
 * Generate src/engine/validation/calculationReferenceFixtures.generated.ts
 * from the committed capture artifacts under tools/gate0/captures/.
 *
 * The generated module contains literal invocations of the typed builders in
 * src/engine/validation/calculationReferenceFixtureSchema.ts, so provenance +
 * validation are re-enforced every time the module is imported. Expected
 * values come only from captured reference output (Swiss Ephemeris) or the
 * independent grid-semantics evaluator — never from engine output.
 *
 * Offline tooling only; nothing in src/ imports this script.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BoundaryTripletSpec } from '../../src/engine/validation/calculationReferenceFixtureSchema.ts';
import { gitCommitSha, readJsonFile, repoRoot, GATE0_ROOT } from './lib/util.ts';
import { validateCaptureArtifact, type CaptureManifest } from './lib/captureManifest.ts';

const CAPTURE_DATE = '2026-11-20';
const SE_CAPTURE_IMPL = '@kuntay/swisseph@0.2.2 (WASM port of Swiss Ephemeris 2.10.03)';
const SE_CAPTURE_VERSION = '2.10.03';
const GRID_EVALUATOR_IMPL = 'tools/gate0/lib/grid.ts';
const GRID_EVALUATOR_VERSION = '1.0.0';

const PLANET_NAMES = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'] as const;
const MOTION_PLANETS = ['MERCURY', 'VENUS', 'MARS'] as const;
const SPEED_TOLERANCE = 0.05; // deg/day
const STATIONARY_THRESHOLD = 0.005; // deg/day, documented station threshold
const LONGITUDE_TOLERANCE_DEFAULT = 0.01; // deg, protocol §4
const LONGITUDE_TOLERANCE_MOON_ANCHOR = 0.0001; // deg, protocol §4 Moon-anchor track
const LONGITUDE_TOLERANCE_NODE = 0.005; // deg, protocol §4 mean nodes
const TOLERANCE_RATIONALE =
  'GATE-0-VALIDATION-PROTOCOL.md §4 per-track tolerances; engine analytical series ' +
  'are expected to fail these bounds — the parity report records measured errors.';

/* ---------------- artifact shapes (mirror capture scripts) ------------- */

interface CohortCase {
  id: string; utcInstant: string; latitude: number; longitude: number;
  ianaTimeZone: string; dasha: boolean; motionHint: string | null; note: string;
}
interface SiteInstant {
  latitude: number; longitude: number;
  instant: { utcInstant: string; localRepresentation: string; ianaTimeZone: string };
}
interface CohortArtifact {
  schemaVersion: number; captureId: string; caseId: string;
  site: SiteInstant;
  capture: {
    ayanamsaDegrees: number; julianDayUt: number; deltaTDays: number;
    flagsTropical: string; flagsSidereal: string;
    bodies: Record<string, {
      tropical: { longitude: number; longitudeSpeed: number; ephemeris: string };
      sidereal: { longitude: number; longitudeSpeed: number; ephemeris: string };
      ayanamsaResidualDeg: number;
    }>;
    ascendantTropicalDeg: number | null; ascendantSiderealDeg: number | null;
  };
}
interface BoundaryArtifact {
  schemaVersion: number; captureId: string;
  evaluator: { id: string; version: string; description: string; gridEpsilonDeg: number; vimshottariYearDays: number };
  boundaryEpsilonDegrees: number;
  boundaryVectors: {
    vectorId: string; boundaryKind: 'SIGN' | 'NAKSHATRA' | 'PADA'; boundaryId: string;
    boundaryLongitude: number;
    definition: { name: string; longitude: number; convention: { coordinateFrame: 'SIDEREAL'; ayanamsa: 'LAHIRI' } };
    epsilonDegrees: number;
    positions: Record<string, { inputLongitude: number; expectedSign?: string; expectedNakshatra?: string; expectedPada?: number }>;
    rawLine: string;
  }[];
  vargaVectors: { vectorId: string; chartType: 'D9' | 'D10'; longitude: number; boundaryRole: string; expectedLongitudeDegrees: number; rawLine: string }[];
  houseVectors: { vectorId: string; referenceSign: string; targetSign: string; expectedHouse: number; rawLine: string }[];
  dashaAnchors: {
    vectorId: string; caseId: string; cohortCaptureId: string; moonSiderealLongitude: number;
    birthUtcInstant: string; site: SiteInstant; ayanamsaDegrees: number;
    expected: { nakshatra: string; nakshatraEnglish: string; nakshatraLord: string; nakshatraProgress: number; remainingFraction: number; firstMahadashaLord: string; firstMahadashaStart: string; firstMahadashaEnd: string };
    rawLine: string;
  }[];
}

/* ------------------------- helpers ------------------------------------ */

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function rawBodyLine(planet: string, b: CohortArtifact['capture']['bodies'][string]): string {
  return `${planet} tropical_lon=${b.tropical.longitude.toFixed(10)} tropical_speed=${b.tropical.longitudeSpeed.toFixed(10)} ` +
    `sidereal_lon=${b.sidereal.longitude.toFixed(10)} sidereal_speed=${b.sidereal.longitudeSpeed.toFixed(10)} ` +
    `eph=${b.tropical.ephemeris}`;
}

/** Marker for values that must be emitted as TS enum/member expressions. */
class TsExpr {
  constructor(readonly code: string) {}
}
const E = (code: string) => new TsExpr(code);

const PLANET_EXPR: Record<string, TsExpr> = Object.fromEntries(
  PLANET_NAMES.map(p => [p, E(`Planet.${p}`)])
);
const SIGN_EXPR: Record<string, TsExpr> = {
  ARIES: E('Sign.ARIES'), TAURUS: E('Sign.TAURUS'), GEMINI: E('Sign.GEMINI'),
  CANCER: E('Sign.CANCER'), LEO: E('Sign.LEO'), VIRGO: E('Sign.VIRGO'),
  LIBRA: E('Sign.LIBRA'), SCORPIO: E('Sign.SCORPIO'), SAGITTARIUS: E('Sign.SAGITTARIUS'),
  CAPRICORN: E('Sign.CAPRICORN'), AQUARIUS: E('Sign.AQUARIUS'), PISCES: E('Sign.PISCES')
};
const NAK_EXPR: Record<string, TsExpr> = {
  ASHWINI: E('Nakshatra.ASHWINI'), BHARANI: E('Nakshatra.BHARANI'), KRITTIKA: E('Nakshatra.KRITTIKA'),
  ROHINI: E('Nakshatra.ROHINI'), MRIGASHIRA: E('Nakshatra.MRIGASHIRA'), ARDRA: E('Nakshatra.ARDRA'),
  PUNARVASU: E('Nakshatra.PUNARVASU'), PUSHYA: E('Nakshatra.PUSHYA'), ASHLESHA: E('Nakshatra.ASHLESHA'),
  MAGHA: E('Nakshatra.MAGHA'), PURVA_PHALGUNI: E('Nakshatra.PURVA_PHALGUNI'), UTTARA_PHALGUNI: E('Nakshatra.UTTARA_PHALGUNI'),
  HASTA: E('Nakshatra.HASTA'), CHITRA: E('Nakshatra.CHITRA'), SWATI: E('Nakshatra.SWATI'),
  VISHAKHA: E('Nakshatra.VISHAKHA'), ANURADHA: E('Nakshatra.ANURADHA'), JYESHTHA: E('Nakshatra.JYESHTHA'),
  MULA: E('Nakshatra.MULA'), PURVA_ASHADHA: E('Nakshatra.PURVA_ASHADHA'), UTTARA_ASHADHA: E('Nakshatra.UTTARA_ASHADHA'),
  SHRAVANA: E('Nakshatra.SHRAVANA'), DHANISHTA: E('Nakshatra.DHANISHTA'), SHATABHISHA: E('Nakshatra.SHATABHISHA'),
  PURVA_BHADRAPADA: E('Nakshatra.PURVA_BHADRAPADA'), UTTARA_BHADRAPADA: E('Nakshatra.UTTARA_BHADRAPADA'),
  REVATI: E('Nakshatra.REVATI')
};
const PADA_EXPR: Record<number, TsExpr> = {
  1: E('Pada.FIRST'), 2: E('Pada.SECOND'), 3: E('Pada.THIRD'), 4: E('Pada.FOURTH')
};
const AYAN_EXPR = E('AyanamsaType.LAHIRI');

export interface BuilderCall {
  fn: string;
  args: Record<string, unknown>;
}
const calls: BuilderCall[] = [];
const call = (fn: string, args: Record<string, unknown>) => calls.push({ fn, args });

/* ------------------------- provenance ---------------------------------- */

const SE_SITE_EPHEMERIS = {
  positionConvention: 'GEOCENTRIC',
  apparentConvention: 'APPARENT',
  nodeConvention: 'MEAN'
};
const NOMINAL_SITE = {
  latitude: 0, longitude: 0,
  instant: { utcInstant: `${CAPTURE_DATE}T00:00:00Z`, localRepresentation: '1970-01-01T00:00:00+00:00', ianaTimeZone: 'UTC' }
};

function provBase(args: {
  sourceType: string; sourceName: string; citation: string; sourceVersion: string;
  methodology: string; coordinateConvention: string; timeStandard: string;
  ayanamsa: string; nodeConvention: string; tolerance: string; toleranceRationale: string;
  independenceStatement: string; retrievedAt: string;
  captureId: string; sourceArtifactSha256: string; referenceImplementation: string;
  referenceImplementationVersion: string; referenceFlags: string[];
  rawCapturedOutput: string; engineCommitSha: string; site: SiteInstant;
  ephemeris: typeof SE_SITE_EPHEMERIS;
  derivedFrom?: readonly {
    captureId: string; sourceArtifactSha256: string;
    referenceImplementation: string; referenceImplementationVersion: string;
  }[];
}) {
  return {
    sourceType: args.sourceType,
    sourceName: args.sourceName,
    citation: args.citation,
    sourceVersion: args.sourceVersion,
    methodology: args.methodology,
    coordinateConvention: args.coordinateConvention,
    timeStandard: args.timeStandard,
    ayanamsa: args.ayanamsa,
    nodeConvention: args.nodeConvention,
    tolerance: args.tolerance,
    toleranceRationale: args.toleranceRationale,
    independenceStatement: args.independenceStatement,
    independentlyProduced: true,
    retrievedAt: args.retrievedAt,
    expectedValuesProducedIndependently: true,
    capture: {
      captureId: args.captureId,
      sourceArtifactSha256: args.sourceArtifactSha256,
      referenceImplementation: args.referenceImplementation,
      referenceImplementationVersion: args.referenceImplementationVersion,
      referenceFlags: args.referenceFlags,
      rawCapturedOutput: args.rawCapturedOutput,
      engineCommitSha: args.engineCommitSha,
      ...(args.derivedFrom ? { derivedFrom: args.derivedFrom } : {})
    },
    site: args.site,
    ephemeris: args.ephemeris
  };
}

function seProvenance(args: {
  artifact: CohortArtifact; artifactPath: string; planet: string;
  engineCommitSha: string; tolerance: string;
}) {
  const body = args.artifact.capture.bodies[args.planet];
  return provBase({
    sourceType: 'EXTERNAL_EPHEMERIS',
    sourceName: 'Swiss Ephemeris 2.10.03 via @kuntay/swisseph WASM (DE441-derived .se1, 1800-2399 CE)',
    citation: 'Swiss Ephemeris, Astrodienst AG / Dieter Koch & Alois Treindl; ephemeris data DE441-derived @kuntay/swisseph-data 0.2.2',
    sourceVersion: SE_CAPTURE_VERSION,
    methodology: 'swe_calc geocentric apparent position; tropical frame captured raw, sidereal frame via SEFLG_SIDEREAL + ayanamsa mode LAHIRI (1); mean node for Rahu/Ketu (Ketu = node+180); UTC instant authoritative.',
    coordinateConvention: 'GEOCENTRIC APPARENT ecliptic-of-date; tropical + sidereal(LAHIRI) both captured',
    timeStandard: 'UTC (TT via internal deltaT)',
    ayanamsa: 'LAHIRI',
    nodeConvention: 'MEAN',
    tolerance: args.tolerance,
    toleranceRationale: TOLERANCE_RATIONALE,
    independenceStatement: 'Expected values produced by Swiss Ephemeris offline capture (tools/gate0); cross-checked against astronomy-engine 2.1.19 (MIT) recorded in the same artifact; no engine output used.',
    retrievedAt: CAPTURE_DATE,
    captureId: args.artifact.captureId,
    sourceArtifactSha256: sha256File(args.artifactPath),
    referenceImplementation: SE_CAPTURE_IMPL,
    referenceImplementationVersion: SE_CAPTURE_VERSION,
    referenceFlags: ['SEFLG_SIDEREAL', 'SEFLG_SPEED', 'SEFLG_SWIEPH'],
    rawCapturedOutput: rawBodyLine(args.planet, body),
    engineCommitSha: args.engineCommitSha,
    site: args.artifact.site,
    ephemeris: SE_SITE_EPHEMERIS
  });
}

function gridProvenance(args: {
  captureId: string; artifactSha: string; rawLine: string;
  methodology: string; tolerance: string; engineCommitSha: string;
  derivedFrom?: readonly {
    captureId: string; sourceArtifactSha256: string;
    referenceImplementation: string; referenceImplementationVersion: string;
  }[];
}) {
  return provBase({
    sourceType: 'INDEPENDENT_CALCULATION',
    sourceName: 'tools/gate0 independent grid-semantics evaluator',
    citation: 'docs/career/audit/GATE-0-VALIDATION-PROTOCOL.md §3b; documented half-open grid conventions (sign 30°, nakshatra 13°20\', pada 3°20\', D9/D10 varga rules, whole-sign houses, standard Vimshottari)',
    sourceVersion: GRID_EVALUATOR_VERSION,
    methodology: args.methodology,
    coordinateConvention: 'SIDEREAL constructed longitude input (LAHIRI frame); no ephemeris lookup — input longitude is the fixture variable',
    timeStandard: 'N/A (constructed longitude); nominal UTC observation site recorded for schema completeness',
    ayanamsa: 'LAHIRI',
    nodeConvention: 'N/A',
    tolerance: args.tolerance,
    toleranceRationale: 'Categorical grid membership / deterministic varga arithmetic; tolerance covers only floating-point representation.',
    independenceStatement: 'Expected values computed by tools/gate0/lib/grid.ts from documented grid rules; expected values are not derived from engine output.',
    retrievedAt: CAPTURE_DATE,
    captureId: args.captureId,
    sourceArtifactSha256: args.artifactSha,
    referenceImplementation: GRID_EVALUATOR_IMPL,
    referenceImplementationVersion: GRID_EVALUATOR_VERSION,
    referenceFlags: ['HALF_OPEN_INTERVALS', 'GRID_EPSILON_1E-12', 'VIMSHOTTARI_YEAR_365.25D'],
    rawCapturedOutput: args.rawLine,
    engineCommitSha: args.engineCommitSha,
    site: NOMINAL_SITE,
    ephemeris: SE_SITE_EPHEMERIS,
    derivedFrom: args.derivedFrom
  });
}

/* ------------------------- TS literal serializer ----------------------- */

function serialize(value: unknown, indent: string): string {
  if (value instanceof TsExpr) return value.code;
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value.map(v => `${indent}  ${serialize(v, indent + '  ')}`).join(',\n');
    return `[\n${inner}\n${indent}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}';
  const inner = entries.map(([k, v]) =>
    `${indent}  ${JSON.stringify(k)}: ${serialize(v, indent + '  ')}`
  ).join(',\n');
  return `{\n${inner}\n${indent}}`;
}

/* ------------------------- fixture assembly ---------------------------- */

function birthDetails(c: { latitude: number; longitude: number; ianaTimeZone: string; utcInstant: string }) {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    timeZone: c.ianaTimeZone,
    ayanamsa: AYAN_EXPR,
    dateTimeStr: c.utcInstant
  };
}

function main() {
  const root = repoRoot();
  const engineCommitSha = gitCommitSha(root);
  const cohortDir = join(GATE0_ROOT, 'captures/cohort');
  const cohortFile = readJsonFile<{ cases: CohortCase[] }>(join(GATE0_ROOT, 'cohort/cases.v1.json'));
  const manifest = readJsonFile<CaptureManifest>(join(GATE0_ROOT, 'captures/manifest.json'));
  const boundaryPath = join(GATE0_ROOT, 'captures/boundary-vectors.v1.json');
  const boundaryCapture = validateCaptureArtifact<BoundaryArtifact>({
    manifest,
    relativePath: 'boundary-vectors.v1.json',
    artifactPath: boundaryPath,
    caseId: 'boundary-vectors.v1'
  });
  const boundary = boundaryCapture.artifact;
  const boundarySha = boundaryCapture.sha256;

  const siderealConventions = {
    coordinateFrame: 'SIDEREAL',
    ayanamsa: AYAN_EXPR,
    timeStandard: 'UTC'
  };

  const activeCases = cohortFile.cases.filter(c => !c.utcInstant.startsWith('TBD'));
  const cohortCaptures = new Map<string, {
    artifact: CohortArtifact; artifactPath: string; sha256: string;
  }>();

  // --- cohort: planetary longitudes, motion, Rahu/Ketu opposition ---------
  for (const c of activeCases) {
    const artifactPath = join(cohortDir, `${c.id}.json`);
    const validated = validateCaptureArtifact<CohortArtifact>({
      manifest,
      relativePath: `cohort/${c.id}.json`,
      artifactPath,
      caseId: c.id,
      expectedCaptureId: `CAPTURE-${c.id}-${c.utcInstant.slice(0, 10)}`,
      expectedBodies: PLANET_NAMES
    });
    const artifact = validated.artifact;
    cohortCaptures.set(c.id, { artifact, artifactPath, sha256: validated.sha256 });
    const birth = birthDetails({
      latitude: c.latitude, longitude: c.longitude,
      ianaTimeZone: c.ianaTimeZone, utcInstant: c.utcInstant
    });

    for (const planetName of PLANET_NAMES) {
      const body = artifact.capture.bodies[planetName];
      if (!body) throw new Error(`capture ${c.id} missing body ${planetName}`);
      if (body.tropical.ephemeris !== 'swiss' || body.sidereal.ephemeris !== 'swiss') {
        throw new Error(`capture ${c.id}/${planetName} ephemeris model not 'swiss': BLOCKED`);
      }
      const tol = planetName === 'MOON'
        ? LONGITUDE_TOLERANCE_MOON_ANCHOR
        : planetName === 'RAHU' || planetName === 'KETU'
          ? LONGITUDE_TOLERANCE_NODE : LONGITUDE_TOLERANCE_DEFAULT;
      call('buildPlanetaryLongitudeFixture', {
        id: `PL-${c.id}-${planetName}`,
        entryPoint: 'generatePlanetaryPositions',
        description: `Captured ${planetName} sidereal longitude at ${c.utcInstant} (${c.note})`,
        birth, planet: PLANET_EXPR[planetName],
        provenance: seProvenance({
          artifact, artifactPath, planet: planetName, engineCommitSha,
          tolerance: `<= ${tol} deg`
        }),
        conventions: siderealConventions,
        expectedLongitudeDegrees: body.sidereal.longitude,
        toleranceDegrees: tol
      });
    }

    for (const planetName of MOTION_PLANETS) {
      const body = artifact.capture.bodies[planetName];
      const speed = body.sidereal.longitudeSpeed;
      const scenario = Math.abs(speed) < STATIONARY_THRESHOLD
        ? 'NEAR_STATIONARY'
        : speed < 0 ? 'RETROGRADE' : 'PROGRADE';
      call('buildPlanetaryMotionFixture', {
        id: `PM-${c.id}-${planetName}`,
        entryPoint: 'generatePlanetaryPositions',
        description: `Captured ${planetName} motion state at ${c.utcInstant} (scenario ${scenario})`,
        birth, planet: PLANET_EXPR[planetName], scenario,
        provenance: seProvenance({
          artifact, artifactPath, planet: planetName, engineCommitSha,
          tolerance: `speed <= ${SPEED_TOLERANCE} deg/day; retrograde/stationary flags exact`
        }),
        conventions: siderealConventions,
        expectedSpeedDegreesPerDay: speed,
        expectedRetrograde: speed < 0,
        expectedStationary: Math.abs(speed) < STATIONARY_THRESHOLD,
        speedToleranceDegreesPerDay: SPEED_TOLERANCE
      });
    }

    call('buildRahuKetuOppositionFixture', {
      id: `RK-${c.id}`,
      entryPoint: 'generatePlanetaryPositions',
      description: `Rahu/Ketu 180-degree opposition at ${c.utcInstant}`,
      birth,
      provenance: seProvenance({
        artifact, artifactPath, planet: 'RAHU', engineCommitSha,
        tolerance: '<= 0.01 deg separation tolerance'
      }),
      conventions: siderealConventions,
      toleranceDegrees: 0.01
    });
  }

  // --- constructed boundary vectors (sign / nakshatra / pada) -------------
  for (const v of boundary.boundaryVectors) {
    const spec: Record<string, unknown> = {
      boundaryId: v.boundaryId,
      boundaryKind: v.boundaryKind,
      boundaryLongitude: v.boundaryLongitude,
      definition: {
        name: v.definition.name,
        longitude: v.definition.longitude,
        convention: { coordinateFrame: 'SIDEREAL', ayanamsa: AYAN_EXPR }
      },
      epsilonDegrees: v.epsilonDegrees,
      policy: { min: 1e-6, max: 1e-4 }
    };
    void (spec as unknown as BoundaryTripletSpec); // shape verified by builder at import time
    const conventions = {
      coordinateFrame: 'SIDEREAL',
      ayanamsa: AYAN_EXPR,
      timeStandard: 'N/A (constructed longitude)'
    };
    for (const position of ['EPSILON_BEFORE', 'EXACT', 'EPSILON_AFTER'] as const) {
      const p = v.positions[position];
      if (!p) throw new Error(`boundary vector ${v.vectorId} missing position ${position}`);
      const provenance = gridProvenance({
        captureId: boundary.captureId,
        artifactSha: boundarySha,
        rawLine: v.rawLine,
        methodology: `Constructed ${v.boundaryKind} boundary vector; expected category from independent grid evaluator (${boundary.evaluator.id} v${boundary.evaluator.version}); epsilon ${v.epsilonDegrees} deg inside policy [1e-6, 1e-4].`,
        tolerance: 'categorical (exact grid membership)',
        engineCommitSha
      });
      if (v.boundaryKind === 'SIGN') {
        call('buildSignBoundaryFixture', {
          spec, position, provenance, conventions,
          expectedSign: SIGN_EXPR[p.expectedSign as string]
        });
      } else {
        call('buildNakshatraBoundaryFixture', {
          spec,
          boundaryKind: v.boundaryKind,
          position, provenance, conventions,
          expectedNakshatra: NAK_EXPR[p.expectedNakshatra as string],
          expectedPada: PADA_EXPR[p.expectedPada as number]
        });
      }
    }
  }

  // --- varga vectors ------------------------------------------------------
  for (const v of boundary.vargaVectors) {
    call('buildVargaLongitudeFixture', {
      id: v.vectorId,
      entryPoint: 'getDivisionalLongitude',
      description: `Constructed ${v.chartType} vector (${v.boundaryRole}) at longitude ${v.longitude}`,
      longitude: v.longitude,
      chartType: E(`ChartType.${v.chartType}`),
      provenance: gridProvenance({
        captureId: boundary.captureId, artifactSha: boundarySha, rawLine: v.rawLine,
        methodology: `Constructed ${v.chartType} varga vector (${v.boundaryRole}); expected divisional longitude from documented varga grid semantics via independent evaluator.`,
        tolerance: '<= 1e-6 deg (deterministic grid arithmetic)',
        engineCommitSha
      }),
      conventions: {
        coordinateFrame: 'SIDEREAL', ayanamsa: AYAN_EXPR,
        timeStandard: 'N/A (constructed longitude)'
      },
      expectedLongitudeDegrees: v.expectedLongitudeDegrees,
      toleranceDegrees: 1e-6
    });
  }

  // --- house-position vectors ---------------------------------------------
  for (const v of boundary.houseVectors) {
    call('buildHousePositionFixture', {
      id: v.vectorId,
      entryPoint: 'calculateWholeSignHouse',
      description: `Whole-sign house: ${v.referenceSign} -> ${v.targetSign}`,
      referenceSign: SIGN_EXPR[v.referenceSign],
      targetSign: SIGN_EXPR[v.targetSign],
      provenance: gridProvenance({
        captureId: boundary.captureId, artifactSha: boundarySha, rawLine: v.rawLine,
        methodology: 'Whole-sign house arithmetic ((target-ref) mod 12)+1 per documented convention.',
        tolerance: 'exact integer',
        engineCommitSha
      }),
      conventions: {
        coordinateFrame: 'SIDEREAL', ayanamsa: AYAN_EXPR,
        timeStandard: 'N/A (constructed sign pair)'
      },
      expectedHouse: v.expectedHouse
    });
  }

  // --- Vimshottari anchors -------------------------------------------------
  for (const v of boundary.dashaAnchors) {
    const cohortCapture = cohortCaptures.get(v.caseId);
    if (!cohortCapture) {
      throw new Error(`dasha anchor ${v.vectorId}: no validated cohort capture for ${v.caseId}`);
    }
    call('buildVimshottariDashaFixture', {
      id: v.vectorId,
      entryPoint: 'calculateVimshottari',
      description: `Vimshottari birth anchor at ${v.birthUtcInstant} (Moon nakshatra ${v.expected.nakshatraEnglish})`,
      birthDateTime: v.birthUtcInstant,
      birth: birthDetails({
        latitude: v.site.latitude,
        longitude: v.site.longitude,
        ianaTimeZone: v.site.instant.ianaTimeZone,
        utcInstant: v.birthUtcInstant
      }),
      moonSiderealLongitude: v.moonSiderealLongitude,
      provenance: gridProvenance({
        captureId: boundary.captureId, artifactSha: boundarySha, rawLine: v.rawLine,
        methodology: `Moon sidereal longitude locked from Swiss Ephemeris cohort capture ${v.cohortCaptureId}; nakshatra/progress/dasha anchor computed by independent Vimshottari implementation (365.25-day year convention).`,
        tolerance: 'fraction <= 1e-6; MD boundary <= 1000 ms (conditional on identical year-length convention per protocol §4)',
        engineCommitSha,
        derivedFrom: [
          {
            captureId: v.cohortCaptureId,
            sourceArtifactSha256: cohortCapture.sha256,
            referenceImplementation: SE_CAPTURE_IMPL,
            referenceImplementationVersion: SE_CAPTURE_VERSION
          },
          {
            captureId: boundary.captureId,
            sourceArtifactSha256: boundarySha,
            referenceImplementation: GRID_EVALUATOR_IMPL,
            referenceImplementationVersion: GRID_EVALUATOR_VERSION
          }
        ]
      }),
      conventions: {
        coordinateFrame: 'SIDEREAL', ayanamsa: AYAN_EXPR,
        timeStandard: 'UTC', yearLengthDays: 365.25
      },
      expected: {
        nakshatra: v.expected.nakshatraEnglish,
        nakshatraLord: PLANET_EXPR[v.expected.nakshatraLord],
        nakshatraProgress: v.expected.nakshatraProgress,
        remainingFraction: v.expected.remainingFraction,
        firstMahadashaLord: PLANET_EXPR[v.expected.firstMahadashaLord],
        firstMahadashaStart: v.expected.firstMahadashaStart,
        firstMahadashaEnd: v.expected.firstMahadashaEnd
      },
      tolerance: { fraction: 1e-6, boundaryMilliseconds: 1000 }
    });
  }

  emit(calls);
  console.log(`emitted ${calls.length} builder calls`);
}

/* ------------------------- emission ------------------------------------- */

function emit(builderCalls: readonly BuilderCall[]): void {
  const out = renderFixtureModule(builderCalls);
  const outPath = join(GATE0_ROOT, '../../src/engine/validation/calculationReferenceFixtures.generated.ts');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out, 'utf8');
  console.log(`wrote ${outPath} (${out.length} bytes)`);
}

export function renderFixtureModule(builderCalls: readonly BuilderCall[]): string {
  const header = `/**
 * AUTO-GENERATED FILE — do not edit by hand.
 *
 * Generated by tools/gate0/gen-fixtures.ts from independently captured
 * reference artifacts under tools/gate0/captures/ (see tools/gate0/README.md
 * and docs/career/audit/GATE-0-VALIDATION-PROTOCOL.md).
 *
 * Every entry is a literal invocation of the typed builders in
 * ./calculationReferenceFixtureSchema.ts; expected values come only from
 * Swiss Ephemeris captures or the independent grid-semantics evaluator —
 * never from engine output.
 */
import {
  buildPlanetaryLongitudeFixture,
  buildPlanetaryMotionFixture,
  buildRahuKetuOppositionFixture,
  buildSignBoundaryFixture,
  buildNakshatraBoundaryFixture,
  buildHousePositionFixture,
  buildVargaLongitudeFixture,
  buildVimshottariDashaFixture
} from './calculationReferenceFixtureSchema.ts';
import type { CalculationReferenceFixture } from './calculationReferenceTypes.ts';
import { AyanamsaType, Planet, Sign, Nakshatra, Pada, ChartType } from '../../types.ts';
import type { BirthDetails } from '../../types.ts';

`;

  const body = builderCalls.map(c =>
    `  ${c.fn}(${serialize(c.args, '  ')})`
  ).join(',\n');

  return `${header}export const GENERATED_CALCULATION_REFERENCE_FIXTURES: readonly CalculationReferenceFixture[] = Object.freeze([\n${body}\n]);\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
