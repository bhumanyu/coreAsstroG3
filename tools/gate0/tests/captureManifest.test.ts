import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateCaptureArtifact, type CaptureManifest } from '../lib/captureManifest.ts';
import { sha256Hex } from '../lib/util.ts';

const tempDirs: string[] = [];

function writeArtifact(value: unknown): { artifactPath: string; manifest: CaptureManifest } {
  const dir = mkdtempSync(join(tmpdir(), 'gate0-capture-'));
  tempDirs.push(dir);
  const artifactPath = join(dir, 'capture.json');
  const body = JSON.stringify(value);
  writeFileSync(artifactPath, body);
  return {
    artifactPath,
    manifest: {
      schemaVersion: 1,
      files: {
        'cohort/CASE-001.json': {
          sha256: sha256Hex(body),
          bytes: Buffer.byteLength(body),
          captureId: 'CAPTURE-CASE-001',
          status: 'CAPTURED'
        }
      }
    }
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('validateCaptureArtifact', () => {
  const validArtifact = {
    captureId: 'CAPTURE-CASE-001',
    capture: {
      bodies: {
        SUN: { tropical: {}, sidereal: {} },
        MOON: { tropical: {}, sidereal: {} }
      }
    }
  };

  it('accepts a captured artifact whose manifest hash, id, and expected body set match', () => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    const validated = validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedCaptureId: 'CAPTURE-CASE-001',
      expectedBodies: ['SUN', 'MOON']
    });

    expect(validated.artifact).toEqual(validArtifact);
  });

  it('rejects a stale hash and a BLOCKED manifest entry', () => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    const staleManifest: CaptureManifest = {
      ...manifest,
      files: {
        ...manifest.files,
        'cohort/CASE-001.json': { ...manifest.files['cohort/CASE-001.json'], sha256: '0'.repeat(64) }
      }
    };
    expect(() => validateCaptureArtifact({
      manifest: staleManifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001'
    })).toThrow(/CASE-001.*SHA-256 mismatch/);

    const blockedManifest: CaptureManifest = {
      ...manifest,
      files: {
        ...manifest.files,
        'cohort/CASE-001.json': {
          ...manifest.files['cohort/CASE-001.json'],
          status: 'BLOCKED',
          reason: 'ephemeris fallback'
        }
      }
    };
    expect(() => validateCaptureArtifact({
      manifest: blockedManifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001'
    })).toThrow(/CASE-001.*BLOCKED/);
  });

  it('rejects artifacts with missing expected bodies', () => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN', 'MOON', 'MARS']
    })).toThrow(/CASE-001.*MARS/);
  });

  const cohortDefinition = {
    id: 'CASE-001',
    latitude: 28.6139,
    longitude: 77.209,
    ianaTimeZone: 'Asia/Kolkata',
    utcInstant: '1905-04-12T04:30:00Z'
  };

  function cohortArtifact(overrides: {
    readonly caseId?: string;
    readonly latitude?: number;
    readonly longitude?: number;
    readonly ianaTimeZone?: string;
    readonly utcInstant?: string;
  } = {}) {
    return {
      ...validArtifact,
      caseId: overrides.caseId ?? cohortDefinition.id,
      site: {
        latitude: overrides.latitude ?? cohortDefinition.latitude,
        longitude: overrides.longitude ?? cohortDefinition.longitude,
        instant: {
          ianaTimeZone: overrides.ianaTimeZone ?? cohortDefinition.ianaTimeZone,
          utcInstant: overrides.utcInstant ?? cohortDefinition.utcInstant
        }
      }
    };
  }

  it('accepts cohort metadata that exactly matches the full case definition', () => {
    const artifact = cohortArtifact();
    const { artifactPath, manifest } = writeArtifact(artifact);
    const validated = validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: cohortDefinition.id,
      expectedCohortDefinition: cohortDefinition
    });

    expect(validated.artifact).toEqual(artifact);
  });

  it.each([
    ['caseId', { caseId: 'OTHER-CASE' }, 'caseId'],
    ['latitude', { latitude: 28.614 }, 'site.latitude'],
    ['longitude', { longitude: 77.21 }, 'site.longitude'],
    ['IANA timezone', { ianaTimeZone: 'Asia/Tokyo' }, 'site.instant.ianaTimeZone'],
    ['full UTC instant', { utcInstant: '1905-04-12T04:31:00Z' }, 'site.instant.utcInstant']
  ])('rejects mismatched cohort %s with a field-specific error', (_label, overrides, field) => {
    const { artifactPath, manifest } = writeArtifact(cohortArtifact(overrides));

    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: cohortDefinition.id,
      expectedCohortDefinition: cohortDefinition
    })).toThrow(new RegExp(`CASE-001.*${field.replaceAll('.', '\\.')}`));
  });
});
