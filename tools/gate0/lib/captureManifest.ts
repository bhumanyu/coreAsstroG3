import { existsSync, readFileSync } from 'node:fs';
import { sha256Hex } from './util.ts';

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
  finiteNumberField(capture.ayanamsaDegrees, caseId, 'capture.ayanamsaDegrees');
  const bodies = objectField(capture.bodies, caseId, 'capture.bodies');
  for (const bodyName of expectedBodies) {
    const body = objectField(bodies[bodyName], caseId, `capture.bodies.${bodyName}`);
    for (const frame of ['tropical', 'sidereal'] as const) {
      const position = objectField(body[frame], caseId, `capture.bodies.${bodyName}.${frame}`);
      validateLongitude(
        position.longitude,
        caseId,
        `capture.bodies.${bodyName}.${frame}.longitude`
      );
      finiteNumberField(
        position.longitudeSpeed,
        caseId,
        `capture.bodies.${bodyName}.${frame}.longitudeSpeed`
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
  const entry = options.manifest.files?.[manifestPath];
  if (!entry) {
    throw new Error(`capture ${options.caseId}: manifest has no entry for ${manifestPath}`);
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
  if (actualSha !== entry.sha256) {
    throw new Error(
      `capture ${options.caseId}: SHA-256 mismatch for ${manifestPath}; ` +
      `manifest=${entry.sha256}, actual=${actualSha}`
    );
  }
  if (Number.isFinite(entry.bytes) && bytes.byteLength !== entry.bytes) {
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
    validateCohortCaptureNumbers(artifact, options.caseId, options.expectedBodies);
  }

  return { artifact, sha256: actualSha };
}
