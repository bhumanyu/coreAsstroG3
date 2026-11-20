/**
 * Post-capture cohort stratification audit for protocol §3a.
 * Reports measured proximity to categorical boundaries; it does not assert
 * coverage when the captures do not demonstrate it.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATE0_ROOT, readJsonFile } from './lib/util.ts';
import {
  assertCohortManifestComplete,
  validateCohortCaptureArtifact,
  type CaptureManifest,
  type CohortCaptureTimeMath,
  type CohortCaptureDefinition
} from './lib/captureManifest.ts';
import { openSwissEph } from './lib/se.ts';

const BODY_NAMES = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'] as const;
const NAKSHATRA_SPAN = 360 / 27;
const MOON_BRACKET_LIMIT_DEG = 0.01;
// At 0.47°/hour, traversing the 0.01° one-sided band takes about 77s; 120s allows margin.
const MOON_BRACKET_MAX_SEPARATION_MS = 2 * 60 * 1000;
const PROXIMITY_BANDS = [
  { label: '≤0.001°', max: 0.001 },
  { label: '>0.001–0.01°', max: 0.01 },
  { label: '>0.01–0.1°', max: 0.1 },
  { label: '>0.1–1°', max: 1 },
  { label: '>1°', max: Infinity }
] as const;

export interface CohortCase extends CohortCaptureDefinition {
  readonly dasha: boolean;
}

export interface CohortArtifact {
  readonly captureId: string;
  readonly caseId: string;
  readonly site: {
    readonly latitude: number;
    readonly longitude: number;
    readonly instant: {
      readonly utcInstant: string;
      readonly localRepresentation: string;
      readonly ianaTimeZone: string;
    };
  };
  readonly capture: {
    readonly ascendantTropicalDeg: number | null;
    readonly ascendantSiderealDeg: number | null;
    readonly bodies: Readonly<Record<string, {
      readonly tropical: { readonly longitude: number; readonly longitudeSpeed: number };
      readonly sidereal: { readonly longitude: number; readonly longitudeSpeed: number };
    }>>;
  };
}

export interface CohortCapture {
  readonly definition: CohortCase;
  readonly artifact: CohortArtifact;
  readonly sha256: string;
}

export interface BoundaryProximitySummary {
  readonly kind: string;
  readonly counts: Readonly<Record<string, number>>;
  readonly total: number;
}

export interface MoonBoundaryBracket {
  readonly boundaryIndex: number;
  readonly boundaryLongitude: number;
  readonly beforeCaseId?: string;
  readonly beforeDistanceDegrees?: number;
  readonly afterCaseId?: string;
  readonly afterDistanceDegrees?: number;
  readonly bracketed: boolean;
}

export interface CohortAudit {
  readonly captureCount: number;
  readonly bodyCount: number;
  readonly ascendantUnavailableCount: number;
  readonly proximity: readonly BoundaryProximitySummary[];
  readonly moonAnchorCount: number;
  readonly moonBracketLimitDegrees: number;
  readonly moonBracketMaxSeparationMinutes: number;
  readonly moonBoundaryBrackets: readonly MoonBoundaryBracket[];
  readonly missingMoonBrackets: readonly number[];
}

function norm360(value: number): number {
  return ((value % 360) + 360) % 360;
}

function distanceToGridBoundary(longitude: number, gridStep: number): number {
  const offset = norm360(longitude) % gridStep;
  return Math.min(offset, gridStep - offset);
}

function hasAscendantMeasurements(capture: CohortCapture): boolean {
  const { ascendantTropicalDeg, ascendantSiderealDeg } = capture.artifact.capture;
  return typeof ascendantTropicalDeg === 'number'
    && Number.isFinite(ascendantTropicalDeg)
    && typeof ascendantSiderealDeg === 'number'
    && Number.isFinite(ascendantSiderealDeg);
}

export function loadCohortCaptures(timeMath: CohortCaptureTimeMath): readonly CohortCapture[] {
  const cases = readJsonFile<{ cases: CohortCase[] }>(join(GATE0_ROOT, 'cohort/cases.v1.json')).cases;
  const manifest = readJsonFile<CaptureManifest>(join(GATE0_ROOT, 'captures/manifest.json'));
  const activeCases = cases.filter(definition => !definition.utcInstant.startsWith('TBD'));
  const cohortDirectory = join(GATE0_ROOT, 'captures/cohort');
  const artifactPaths = existsSync(cohortDirectory)
    ? readdirSync(cohortDirectory, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => `cohort/${entry.name}`)
    : [];
  assertCohortManifestComplete(activeCases, manifest, artifactPaths);

  const captures: CohortCapture[] = [];
  for (const definition of activeCases) {
    const path = join(GATE0_ROOT, 'captures/cohort', `${definition.id}.json`);
    const validated = validateCohortCaptureArtifact<CohortArtifact>({
      manifest,
      relativePath: `cohort/${definition.id}.json`,
      artifactPath: path,
      caseId: definition.id,
      expectedCaptureId: `CAPTURE-${definition.id}-${definition.utcInstant.slice(0, 10)}`,
      expectedBodies: BODY_NAMES,
      expectedCohortDefinition: definition,
      timeMath
    });
    captures.push({
      definition,
      artifact: validated.artifact,
      sha256: validated.sha256
    });
  }
  return captures;
}

export function auditCohort(captures: readonly CohortCapture[]): CohortAudit {
  const grids = [
    { kind: 'SIGN', step: 30 },
    { kind: 'NAKSHATRA', step: NAKSHATRA_SPAN },
    { kind: 'PADA', step: NAKSHATRA_SPAN / 4 },
    { kind: 'D9', step: 30 / 9 },
    { kind: 'D10', step: 3 }
  ];
  const proximity = grids.map(({ kind, step }) => {
    const counts: Record<string, number> = Object.fromEntries(PROXIMITY_BANDS.map(band => [band.label, 0]));
    let total = 0;
    for (const { artifact } of captures) {
      for (const body of Object.values(artifact.capture.bodies)) {
        const distance = distanceToGridBoundary(body.sidereal.longitude, step);
        const band = PROXIMITY_BANDS.find(candidate => distance <= candidate.max);
        if (!band) throw new Error(`unclassifiable ${kind} boundary distance ${distance}`);
        counts[band.label]++;
        total++;
      }
    }
    return { kind, counts, total };
  });

  const anchors = captures.filter(capture => capture.definition.dasha);
  const ascendantUnavailableCount = captures.filter(capture => !hasAscendantMeasurements(capture)).length;
  const moonBoundaryBrackets = Array.from({ length: 27 }, (_, boundaryIndex) => {
    const boundaryLongitude = boundaryIndex * NAKSHATRA_SPAN;
    let bestPair: {
      before: CohortCapture;
      after: CohortCapture;
      beforeDistance: number;
      afterDistance: number;
      score: number;
    } | undefined;
    for (const anchor of anchors) {
      const longitude = norm360(anchor.artifact.capture.bodies.MOON.sidereal.longitude);
      const beforeDistance = norm360(boundaryLongitude - longitude);
      if (beforeDistance <= 0 || beforeDistance > MOON_BRACKET_LIMIT_DEG) {
        continue;
      }

      for (const after of anchors) {
        if (anchor.definition.id === after.definition.id
          || anchor.artifact.captureId === after.artifact.captureId) {
          continue;
        }
        const afterLongitude = norm360(after.artifact.capture.bodies.MOON.sidereal.longitude);
        const pairedAfterDistance = norm360(afterLongitude - boundaryLongitude);
        const pairedBeforeDistance = norm360(boundaryLongitude - afterLongitude);
        if (pairedAfterDistance <= 0 || pairedAfterDistance > MOON_BRACKET_LIMIT_DEG
          || pairedBeforeDistance <= 0) {
          continue;
        }

        const beforeSite = anchor.artifact.site;
        const afterSite = after.artifact.site;
        if (beforeSite.latitude !== afterSite.latitude
          || beforeSite.longitude !== afterSite.longitude
          || beforeSite.instant.ianaTimeZone !== afterSite.instant.ianaTimeZone) {
          continue;
        }

        const beforeTime = Date.parse(beforeSite.instant.utcInstant);
        const afterTime = Date.parse(afterSite.instant.utcInstant);
        const separation = afterTime - beforeTime;
        if (!Number.isFinite(beforeTime) || !Number.isFinite(afterTime)
          || separation <= 0 || separation > MOON_BRACKET_MAX_SEPARATION_MS) {
          continue;
        }

        const score = beforeDistance + pairedAfterDistance;
        if (!bestPair || score < bestPair.score) {
          bestPair = {
            before: anchor,
            after,
            beforeDistance,
            afterDistance: pairedAfterDistance,
            score
          };
        }
      }
    }
    return {
      boundaryIndex,
      boundaryLongitude,
      ...(bestPair ? {
        beforeCaseId: bestPair.before.definition.id,
        beforeDistanceDegrees: bestPair.beforeDistance,
        afterCaseId: bestPair.after.definition.id,
        afterDistanceDegrees: bestPair.afterDistance
      } : {}),
      bracketed: bestPair !== undefined
    };
  });

  return {
    captureCount: captures.length,
    bodyCount: proximity[0]?.total ?? 0,
    ascendantUnavailableCount,
    proximity,
    moonAnchorCount: anchors.length,
    moonBracketLimitDegrees: MOON_BRACKET_LIMIT_DEG,
    moonBracketMaxSeparationMinutes: MOON_BRACKET_MAX_SEPARATION_MS / 60_000,
    moonBoundaryBrackets,
    missingMoonBrackets: moonBoundaryBrackets
      .filter(bracket => !bracket.bracketed)
      .map(bracket => bracket.boundaryIndex)
  };
}

export function renderCohortAudit(audit: CohortAudit): string {
  const lines = [
    `Captured cases: ${audit.captureCount}; captured planet positions: ${audit.bodyCount}.`,
    `Ascendant unavailable: ${audit.ascendantUnavailableCount} (not counted as successful measurements).`,
    `Moon-anchor cases: ${audit.moonAnchorCount}; bracket threshold: ±${audit.moonBracketLimitDegrees}° per side.`,
    `Bracket pairs require distinct captures at the same site, ordered within ${audit.moonBracketMaxSeparationMinutes} minutes.`,
    `Nakshatra boundaries bracketed on both sides: ${27 - audit.missingMoonBrackets.length}/27.`,
    '| Boundary grid | ≤0.001° | >0.001–0.01° | >0.01–0.1° | >0.1–1° | >1° | total |',
    '|---------------|----------|---------------|-------------|----------|------|-------|'
  ];
  for (const summary of audit.proximity) {
    const cells = PROXIMITY_BANDS.map(band => summary.counts[band.label]);
    lines.push(`| ${summary.kind} | ${cells.join(' | ')} | ${summary.total} |`);
  }
  const missing = audit.missingMoonBrackets.length === 0
    ? 'All 27 nakshatra boundaries are bracketed.'
    : `Not bracketed: ${audit.missingMoonBrackets.map(index => `${index} (${(index * NAKSHATRA_SPAN).toFixed(6)}°)`).join(', ')}.`;
  lines.push('', missing);
  return lines.join('\n');
}

async function main(): Promise<void> {
  const session = await openSwissEph();
  let captures: readonly CohortCapture[];
  try {
    captures = loadCohortCaptures(session.swe);
  } finally {
    session.dispose();
  }
  const audit = auditCohort(captures);
  console.log(renderCohortAudit(audit));
  if (audit.missingMoonBrackets.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
