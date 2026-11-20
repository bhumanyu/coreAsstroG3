/**
 * Post-capture cohort stratification audit for protocol §3a.
 * Reports measured proximity to categorical boundaries; it does not assert
 * coverage when the captures do not demonstrate it.
 */
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATE0_ROOT, readJsonFile } from './lib/util.ts';
import { validateCaptureArtifact, type CaptureManifest } from './lib/captureManifest.ts';

const BODY_NAMES = ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU'] as const;
const NAKSHATRA_SPAN = 360 / 27;
const MOON_BRACKET_LIMIT_DEG = 0.01;
const PROXIMITY_BANDS = [
  { label: '≤0.001°', max: 0.001 },
  { label: '>0.001–0.01°', max: 0.01 },
  { label: '>0.01–0.1°', max: 0.1 },
  { label: '>0.1–1°', max: 1 },
  { label: '>1°', max: Infinity }
] as const;

export interface CohortCase {
  readonly id: string;
  readonly utcInstant: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ianaTimeZone: string;
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
  readonly proximity: readonly BoundaryProximitySummary[];
  readonly moonAnchorCount: number;
  readonly moonBracketLimitDegrees: number;
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

export function loadCohortCaptures(): readonly CohortCapture[] {
  const cases = readJsonFile<{ cases: CohortCase[] }>(join(GATE0_ROOT, 'cohort/cases.v1.json')).cases;
  const manifest = readJsonFile<CaptureManifest>(join(GATE0_ROOT, 'captures/manifest.json'));
  const captures: CohortCapture[] = [];
  for (const definition of cases) {
    if (definition.utcInstant.startsWith('TBD')) continue;
    const path = join(GATE0_ROOT, 'captures/cohort', `${definition.id}.json`);
    const validated = validateCaptureArtifact<CohortArtifact>({
      manifest,
      relativePath: `cohort/${definition.id}.json`,
      artifactPath: path,
      caseId: definition.id,
      expectedCaptureId: `CAPTURE-${definition.id}-${definition.utcInstant.slice(0, 10)}`,
      expectedBodies: BODY_NAMES
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
  const moonBoundaryBrackets = Array.from({ length: 27 }, (_, boundaryIndex) => {
    const boundaryLongitude = boundaryIndex * NAKSHATRA_SPAN;
    let before: { caseId: string; distance: number } | undefined;
    let after: { caseId: string; distance: number } | undefined;
    for (const anchor of anchors) {
      const longitude = norm360(anchor.artifact.capture.bodies.MOON.sidereal.longitude);
      const beforeDistance = norm360(boundaryLongitude - longitude);
      const afterDistance = norm360(longitude - boundaryLongitude);
      if (beforeDistance <= MOON_BRACKET_LIMIT_DEG
        && (!before || beforeDistance < before.distance)) {
        before = { caseId: anchor.definition.id, distance: beforeDistance };
      }
      if (afterDistance <= MOON_BRACKET_LIMIT_DEG
        && (!after || afterDistance < after.distance)) {
        after = { caseId: anchor.definition.id, distance: afterDistance };
      }
    }
    return {
      boundaryIndex,
      boundaryLongitude,
      ...(before ? { beforeCaseId: before.caseId, beforeDistanceDegrees: before.distance } : {}),
      ...(after ? { afterCaseId: after.caseId, afterDistanceDegrees: after.distance } : {}),
      bracketed: Boolean(before && after)
    };
  });

  return {
    captureCount: captures.length,
    bodyCount: proximity[0]?.total ?? 0,
    proximity,
    moonAnchorCount: anchors.length,
    moonBracketLimitDegrees: MOON_BRACKET_LIMIT_DEG,
    moonBoundaryBrackets,
    missingMoonBrackets: moonBoundaryBrackets
      .filter(bracket => !bracket.bracketed)
      .map(bracket => bracket.boundaryIndex)
  };
}

export function renderCohortAudit(audit: CohortAudit): string {
  const lines = [
    `Captured cases: ${audit.captureCount}; captured planet positions: ${audit.bodyCount}.`,
    `Moon-anchor cases: ${audit.moonAnchorCount}; bracket threshold: ±${audit.moonBracketLimitDegrees}° per side.`,
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

function main(): void {
  const audit = auditCohort(loadCohortCaptures());
  console.log(renderCohortAudit(audit));
  if (audit.missingMoonBrackets.length > 0) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
