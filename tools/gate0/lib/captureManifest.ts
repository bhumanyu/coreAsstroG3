import { existsSync, readFileSync } from 'node:fs';
import { SE_BODY_MAP } from './seBodyMap.ts';
import { sha256Hex } from './util.ts';

export const CAPTURE_MANIFEST_SCHEMA_VERSION = 1;
export const CAPTURE_ARTIFACT_SCHEMA_VERSION = 1;

export interface CaptureManifestEntry {
  readonly sha256: string;
  readonly bytes: number;
  readonly captureId: string;
  readonly status: 'CAPTURED' | 'BLOCKED';
  readonly reason?: string;
}

export interface CaptureManifest {
  readonly schemaVersion: number;
  readonly files: Readonly<Record<string, CaptureManifestEntry>>;
}

export interface ValidatedCapture<T> {
  readonly artifact: T;
  readonly sha256: string;
}

export interface CohortCaptureDefinition {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly ianaTimeZone: string;
  readonly utcInstant: string;
}

export interface CohortManifestCompleteness {
  readonly missingManifestEntries: readonly string[];
  readonly missingArtifacts: readonly string[];
  readonly orphanManifestEntries: readonly string[];
  readonly unmanifestedArtifacts: readonly string[];
}

interface CohortCaptureMetadata {
  readonly caseId?: unknown;
  readonly site?: {
    readonly latitude?: unknown;
    readonly longitude?: unknown;
    readonly instant?: {
      readonly ianaTimeZone?: unknown;
      readonly utcInstant?: unknown;
    };
  };
}

function validateCohortCaptureMetadata(
  artifact: CohortCaptureMetadata,
  definition: CohortCaptureDefinition
): void {
  const checks: readonly { field: string; expected: unknown; actual: unknown }[] = [
    { field: 'caseId', expected: definition.id, actual: artifact.caseId },
    { field: 'site.latitude', expected: definition.latitude, actual: artifact.site?.latitude },
    { field: 'site.longitude', expected: definition.longitude, actual: artifact.site?.longitude },
    {
      field: 'site.instant.ianaTimeZone',
      expected: definition.ianaTimeZone,
      actual: artifact.site?.instant?.ianaTimeZone
    },
    {
      field: 'site.instant.utcInstant',
      expected: definition.utcInstant,
      actual: artifact.site?.instant?.utcInstant
    }
  ];

  for (const { field, expected, actual } of checks) {
    if (actual !== expected) {
      throw new Error(
        `capture ${definition.id}: artifact ${field} mismatch; ` +
        `expected ${formatMetadataValue(expected)}, actual ${formatMetadataValue(actual)}`
      );
    }
  }
}

function formatMetadataValue(value: unknown): string {
  return value === undefined ? '<missing>' : JSON.stringify(value) ?? String(value);
}

function objectField(
  value: unknown,
  caseId: string,
  field: string
): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`capture ${caseId}: ${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function finiteNumberField(value: unknown, caseId: string, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`capture ${caseId}: ${field} must be a finite number`);
  }
  return value;
}

function validateLongitude(value: unknown, caseId: string, field: string): void {
  const longitude = finiteNumberField(value, caseId, field);
  if (longitude < 0 || longitude >= 360) {
    throw new Error(`capture ${caseId}: ${field} must be in [0, 360)`);
  }
}

function validateNullableLongitude(value: unknown, caseId: string, field: string): void {
  // Null means the ascendant is unavailable, not that it was successfully measured.
  if (value !== null) validateLongitude(value, caseId, field);
}

// These are cohort-era sanity checks, not universal astronomical limits:
// - ΔT is roughly -2 s to +100 s across the cohort's 1900–2099 dates; the
//   [-0.001, 0.01] day bounds allow margin and reject implausible capture data.
// - Julian day > 0 holds because all cohort dates are after 4713 BCE.
// - Positive geocentric distance is a physical invariant.
// - |ayanamsaResidualDeg| < 0.01° checks frame consistency between swe.calc
//   calls; it is not a claim about ayanamsa accuracy.
// Revisit these checks if the declared cohort date range expands.
function validateCohortCaptureNumbers(
  artifact: unknown,
  caseId: string,
  expectedBodies: readonly string[]
): void {
  const root = objectField(artifact, caseId, 'artifact');
  const site = objectField(root.site, caseId, 'site');
  const latitude = finiteNumberField(site.latitude, caseId, 'site.latitude');
  if (latitude < -90 || latitude > 90) {
    throw new Error(`capture ${caseId}: site.latitude must be in [-90, 90]`);
  }
  const longitude = finiteNumberField(site.longitude, caseId, 'site.longitude');
  if (longitude < -180 || longitude > 180) {
    throw new Error(`capture ${caseId}: site.longitude must be in [-180, 180]`);
  }

  const instant = objectField(site.instant, caseId, 'site.instant');
  const utcInstant = instant.utcInstant;
  if (typeof utcInstant !== 'string' || !Number.isFinite(Date.parse(utcInstant))) {
    throw new Error(`capture ${caseId}: site.instant.utcInstant must be a valid date`);
  }

  const capture = objectField(root.capture, caseId, 'capture');
  const julianDayUt = finiteNumberField(capture.julianDayUt, caseId, 'capture.julianDayUt');
  if (julianDayUt <= 0) {
    throw new Error(`capture ${caseId}: capture.julianDayUt must be greater than 0`);
  }
  const deltaTDays = finiteNumberField(capture.deltaTDays, caseId, 'capture.deltaTDays');
  if (deltaTDays < -0.001 || deltaTDays > 0.01) {
    throw new Error(`capture ${caseId}: capture.deltaTDays must be in [-0.001, 0.01]`);
  }
  const ayanamsaDegrees = finiteNumberField(
    capture.ayanamsaDegrees,
    caseId,
    'capture.ayanamsaDegrees'
  );
  if (ayanamsaDegrees < 0 || ayanamsaDegrees >= 360) {
    throw new Error(`capture ${caseId}: capture.ayanamsaDegrees must be in [0, 360)`);
  }
  const ayanamsaSweMode = finiteNumberField(
    capture.ayanamsaSweMode,
    caseId,
    'capture.ayanamsaSweMode'
  );
  if (!Number.isSafeInteger(ayanamsaSweMode) || ayanamsaSweMode < 0) {
    throw new Error(`capture ${caseId}: capture.ayanamsaSweMode must be a non-negative integer`);
  }
  for (const field of ['ascendantTropicalDeg', 'ascendantSiderealDeg'] as const) {
    validateNullableLongitude(capture[field], caseId, `capture.${field}`);
  }
  const bodies = objectField(capture.bodies, caseId, 'capture.bodies');
  for (const bodyName of expectedBodies) {
    const body = objectField(bodies[bodyName], caseId, `capture.bodies.${bodyName}`);
    if (body.body !== bodyName) {
      throw new Error(
        `capture ${caseId}: capture.bodies.${bodyName}.body must be '${bodyName}'`
      );
    }
    const sweBody = finiteNumberField(
      body.sweBody,
      caseId,
      `capture.bodies.${bodyName}.sweBody`
    );
    if (!Number.isSafeInteger(sweBody) || sweBody < 0) {
      throw new Error(
        `capture ${caseId}: capture.bodies.${bodyName}.sweBody must be a non-negative integer`
      );
    }
    if (SE_BODY_MAP[bodyName] === undefined || sweBody !== SE_BODY_MAP[bodyName]) {
      throw new Error(
        `capture ${caseId}: capture.bodies.${bodyName}.sweBody must match the canonical ` +
        `Swiss Ephemeris body ID ${String(SE_BODY_MAP[bodyName])}`
      );
    }
    const residual = finiteNumberField(
      body.ayanamsaResidualDeg,
      caseId,
      `capture.bodies.${bodyName}.ayanamsaResidualDeg`
    );
    if (Math.abs(residual) >= 0.01) {
      throw new Error(
        `capture ${caseId}: capture.bodies.${bodyName}.ayanamsaResidualDeg must have ` +
        `absolute value less than 0.01`
      );
    }
    for (const frame of ['tropical', 'sidereal'] as const) {
      const position = objectField(body[frame], caseId, `capture.bodies.${bodyName}.${frame}`);
      validateLongitude(
        position.longitude,
        caseId,
        `capture.bodies.${bodyName}.${frame}.longitude`
      );
      const latitude = finiteNumberField(
        position.latitude,
        caseId,
        `capture.bodies.${bodyName}.${frame}.latitude`
      );
      if (latitude < -90 || latitude > 90) {
        throw new Error(
          `capture ${caseId}: capture.bodies.${bodyName}.${frame}.latitude must be in [-90, 90]`
        );
      }
      const distance = finiteNumberField(
        position.distance,
        caseId,
        `capture.bodies.${bodyName}.${frame}.distance`
      );
      if (distance <= 0) {
        throw new Error(
          `capture ${caseId}: capture.bodies.${bodyName}.${frame}.distance must be greater than 0`
        );
      }
      finiteNumberField(
        position.longitudeSpeed,
        caseId,
        `capture.bodies.${bodyName}.${frame}.longitudeSpeed`
      );
      finiteNumberField(
        position.latitudeSpeed,
        caseId,
        `capture.bodies.${bodyName}.${frame}.latitudeSpeed`
      );
      finiteNumberField(
        position.distanceSpeed,
        caseId,
        `capture.bodies.${bodyName}.${frame}.distanceSpeed`
      );
    }
  }
}

export function validateCohortManifestCompleteness(
  definitions: readonly CohortCaptureDefinition[],
  manifest: CaptureManifest,
  artifactPaths: readonly string[]
): CohortManifestCompleteness {
  const expectedPaths = new Set(definitions.map(definition => `cohort/${definition.id}.json`));
  const manifestPaths = Object.keys(manifest.files ?? {}).map(path => path.replace(/\\/g, '/'));
  const artifactPathSet = new Set(artifactPaths.map(path => path.replace(/\\/g, '/')));
  const cohortManifestPaths = manifestPaths.filter(path => path.startsWith('cohort/'));
  const cohortArtifactPaths = [...artifactPathSet].filter(path => path.startsWith('cohort/'));

  return {
    missingManifestEntries: [...expectedPaths].filter(path => !manifestPaths.includes(path)),
    missingArtifacts: [...expectedPaths].filter(path => !artifactPathSet.has(path)),
    orphanManifestEntries: cohortManifestPaths.filter(path => !expectedPaths.has(path)),
    unmanifestedArtifacts: cohortArtifactPaths.filter(path => !manifestPaths.includes(path))
  };
}

export function assertCohortManifestComplete(
  definitions: readonly CohortCaptureDefinition[],
  manifest: CaptureManifest,
  artifactPaths: readonly string[]
): void {
  const issues = validateCohortManifestCompleteness(definitions, manifest, artifactPaths);
  const messages = [
    issues.missingManifestEntries.length > 0
      ? `missing manifest entries: ${issues.missingManifestEntries.join(', ')}`
      : '',
    issues.missingArtifacts.length > 0
      ? `missing artifact files: ${issues.missingArtifacts.join(', ')}`
      : '',
    issues.orphanManifestEntries.length > 0
      ? `orphan manifest entries: ${issues.orphanManifestEntries.join(', ')}`
      : '',
    issues.unmanifestedArtifacts.length > 0
      ? `unmanifested files: ${issues.unmanifestedArtifacts.join(', ')}`
      : ''
  ].filter(Boolean);

  if (messages.length > 0) {
    throw new Error(`cohort manifest completeness BLOCKED: ${messages.join('; ')}`);
  }
}

export function validateCaptureArtifact<T extends { captureId?: unknown; capture?: unknown }>(
  options: {
    readonly manifest: CaptureManifest;
    readonly relativePath: string;
    readonly artifactPath: string;
    readonly caseId: string;
    readonly expectedCaptureId?: string;
    readonly expectedBodies?: readonly string[];
    readonly expectedCohortDefinition?: CohortCaptureDefinition;
  }
): ValidatedCapture<T> {
  const manifestPath = options.relativePath.replace(/\\/g, '/');
  const manifest = objectField(options.manifest, options.caseId, 'manifest');
  if (manifest.schemaVersion !== CAPTURE_MANIFEST_SCHEMA_VERSION) {
    throw new Error(
      `capture ${options.caseId}: manifest.schemaVersion must be ${CAPTURE_MANIFEST_SCHEMA_VERSION}`
    );
  }
  const files = objectField(manifest.files, options.caseId, 'manifest.files');
  const rawEntry = files[manifestPath];
  if (!rawEntry) {
    throw new Error(`capture ${options.caseId}: manifest has no entry for ${manifestPath}`);
  }
  const entry = objectField(rawEntry, options.caseId, `manifest.files.${manifestPath}`);
  if (typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(entry.sha256)) {
    throw new Error(
      `capture ${options.caseId}: manifest.files.${manifestPath}.sha256 must be 64 hexadecimal characters`
    );
  }
  if (typeof entry.bytes !== 'number'
    || !Number.isSafeInteger(entry.bytes)
    || entry.bytes <= 0) {
    throw new Error(
      `capture ${options.caseId}: manifest.files.${manifestPath}.bytes must be a positive integer`
    );
  }
  if (typeof entry.captureId !== 'string' || entry.captureId.trim().length === 0) {
    throw new Error(
      `capture ${options.caseId}: manifest.files.${manifestPath}.captureId must be a non-empty string`
    );
  }
  if (entry.status !== 'CAPTURED') {
    throw new Error(
      `capture ${options.caseId}: manifest status is ${entry.status}` +
      (entry.reason ? ` (${entry.reason})` : '')
    );
  }
  if (!existsSync(options.artifactPath)) {
    throw new Error(`capture ${options.caseId}: artifact is missing at ${options.artifactPath}`);
  }

  const bytes = readFileSync(options.artifactPath);
  const actualSha = sha256Hex(bytes);
  if (actualSha !== entry.sha256.toLowerCase()) {
    throw new Error(
      `capture ${options.caseId}: SHA-256 mismatch for ${manifestPath}; ` +
      `manifest=${entry.sha256}, actual=${actualSha}`
    );
  }
  if (bytes.byteLength !== entry.bytes) {
    throw new Error(
      `capture ${options.caseId}: byte length mismatch for ${manifestPath}; ` +
      `manifest=${entry.bytes}, actual=${bytes.byteLength}`
    );
  }

  let artifact: T;
  try {
    artifact = JSON.parse(bytes.toString('utf8')) as T;
  } catch (error) {
    throw new Error(
      `capture ${options.caseId}: invalid JSON in ${manifestPath}: ` +
      `${error instanceof Error ? error.message : String(error)}`
    );
  }

  const artifactRecord = objectField(artifact, options.caseId, 'artifact');
  if (artifactRecord.schemaVersion !== CAPTURE_ARTIFACT_SCHEMA_VERSION) {
    throw new Error(
      `capture ${options.caseId}: artifact.schemaVersion must be ${CAPTURE_ARTIFACT_SCHEMA_VERSION}`
    );
  }
  if (artifact.captureId !== entry.captureId) {
    throw new Error(
      `capture ${options.caseId}: captureId mismatch for ${manifestPath}; ` +
      `manifest=${entry.captureId}, artifact=${String(artifact.captureId)}`
    );
  }
  if (options.expectedCohortDefinition) {
    validateCohortCaptureMetadata(
      artifact as unknown as CohortCaptureMetadata,
      options.expectedCohortDefinition
    );
  }
  if (options.expectedCaptureId && entry.captureId !== options.expectedCaptureId) {
    throw new Error(
      `capture ${options.caseId}: unexpected manifest captureId ${entry.captureId}; ` +
      `expected ${options.expectedCaptureId}`
    );
  }
  if (options.expectedBodies) {
    const root = artifact as Record<string, unknown>;
    const capture = root.capture as { bodies?: unknown } | undefined;
    const bodies = capture?.bodies;
    if (!bodies || typeof bodies !== 'object' || Array.isArray(bodies)) {
      throw new Error(`capture ${options.caseId}: ${manifestPath} has no captured body set`);
    }
    const bodySet = bodies as Record<string, unknown>;
    const missing = options.expectedBodies.filter(name => {
      const body = bodySet[name];
      if (!body || typeof body !== 'object') return true;
      const record = body as Record<string, unknown>;
      return !record.tropical || !record.sidereal;
    });
    if (missing.length > 0) {
      throw new Error(
        `capture ${options.caseId}: ${manifestPath} is missing expected bodies: ${missing.join(', ')}`
      );
    }
    validateCohortCaptureNumbers(artifact, options.caseId, Object.keys(bodySet));
  }

  return { artifact, sha256: actualSha };
}
