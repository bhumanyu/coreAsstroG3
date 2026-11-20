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

export function validateCaptureArtifact<T extends { captureId?: unknown; capture?: unknown }>(
  options: {
    readonly manifest: CaptureManifest;
    readonly relativePath: string;
    readonly artifactPath: string;
    readonly caseId: string;
    readonly expectedCaptureId?: string;
    readonly expectedBodies?: readonly string[];
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
  }

  return { artifact, sha256: actualSha };
}
