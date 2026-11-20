import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertCohortManifestComplete,
  validateCaptureArtifact,
  type CaptureManifest
} from '../lib/captureManifest.ts';
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
    caseId: 'CASE-001',
    site: {
      latitude: 0,
      longitude: 0,
      instant: {
        utcInstant: '2000-01-01T00:00:00Z',
        localRepresentation: '2000-01-01T00:00:00+00:00',
        ianaTimeZone: 'UTC'
      }
    },
    capture: {
      ayanamsaDegrees: 24,
      bodies: {
        SUN: {
          tropical: { longitude: 10, longitudeSpeed: 1 },
          sidereal: { longitude: 346, longitudeSpeed: 1 }
        },
        MOON: {
          tropical: { longitude: 20, longitudeSpeed: 13 },
          sidereal: { longitude: 356, longitudeSpeed: 13 }
        }
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

  it.each([
    ['non-finite longitude', { tropicalLongitude: Number.NaN }, 'tropical.longitude'],
    ['out-of-range longitude', { tropicalLongitude: 360 }, 'tropical.longitude'],
    ['string speed', { tropicalSpeed: '1' }, 'tropical.longitudeSpeed'],
    ['missing ayanamsa', { omitAyanamsa: true }, 'capture.ayanamsaDegrees'],
    ['latitude outside range', { latitude: 91 }, 'site.latitude'],
    ['longitude outside range', { siteLongitude: 181 }, 'site.longitude'],
    ['unparseable instant', { utcInstant: 'not-a-date' }, 'site.instant.utcInstant']
  ])('rejects %s and names the invalid field', (_label, overrides, field) => {
    const artifact = numericArtifact(overrides);
    const { artifactPath, manifest } = writeArtifact(artifact);

    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    })).toThrow(new RegExp(`CASE-001.*${field.replaceAll('.', '\\.')}`));
  });

  it('rejects non-finite sidereal values and both speed frames must be numeric', () => {
    const siderealLongitude = numericArtifact({ siderealLongitude: Infinity });
    const { artifactPath, manifest } = writeArtifact(siderealLongitude);
    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    })).toThrow(/CASE-001.*sidereal\.longitude/);

    const siderealSpeed = numericArtifact({ siderealSpeed: 'fast' });
    const second = writeArtifact(siderealSpeed);
    expect(() => validateCaptureArtifact({
      manifest: second.manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath: second.artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    })).toThrow(/CASE-001.*sidereal\.longitudeSpeed/);
  });

  it('rejects non-finite ayanamsa values', () => {
    const artifact = numericArtifact({ ayanamsaDegrees: Number.POSITIVE_INFINITY });
    const { artifactPath, manifest } = writeArtifact(artifact);
    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    })).toThrow(/CASE-001.*capture\.ayanamsaDegrees/);
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

  function numericArtifact(overrides: {
    readonly tropicalLongitude?: unknown;
    readonly tropicalSpeed?: unknown;
    readonly siderealLongitude?: unknown;
    readonly siderealSpeed?: unknown;
    readonly ayanamsaDegrees?: unknown;
    readonly omitAyanamsa?: boolean;
    readonly latitude?: unknown;
    readonly siteLongitude?: unknown;
    readonly utcInstant?: unknown;
  } = {}) {
    const choose = (value: unknown, fallback: number | string): unknown =>
      value === undefined ? fallback : value;
    const makeBody = (frame: 'tropical' | 'sidereal') => ({
      [frame]: frame === 'tropical'
        ? {
          longitude: choose(overrides.tropicalLongitude, 10),
          longitudeSpeed: choose(overrides.tropicalSpeed, 1)
        }
        : {
          longitude: choose(overrides.siderealLongitude, 346),
          longitudeSpeed: choose(overrides.siderealSpeed, 1)
        }
    });
    return {
      captureId: 'CAPTURE-CASE-001',
      caseId: 'CASE-001',
      site: {
        latitude: choose(overrides.latitude, 0),
        longitude: choose(overrides.siteLongitude, 0),
        instant: {
          utcInstant: choose(overrides.utcInstant, '2000-01-01T00:00:00Z'),
          localRepresentation: '2000-01-01T00:00:00+00:00',
          ianaTimeZone: 'UTC'
        }
      },
      capture: {
        ...(overrides.omitAyanamsa
          ? {}
          : { ayanamsaDegrees: choose(overrides.ayanamsaDegrees, 24) }),
        bodies: { SUN: { ...makeBody('tropical'), ...makeBody('sidereal') } }
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

  const definition = {
    id: 'CASE-001',
    latitude: 0,
    longitude: 0,
    ianaTimeZone: 'UTC',
    utcInstant: '2000-01-01T00:00:00Z'
  };
  const entry = {
    sha256: '0'.repeat(64),
    bytes: 0,
    captureId: 'CAPTURE-CASE-001',
    status: 'CAPTURED' as const
  };

  it('blocks a missing on-disk artifact even when the manifest entry exists', () => {
    expect(() => assertCohortManifestComplete(
      [definition],
      { schemaVersion: 1, files: { 'cohort/CASE-001.json': entry } },
      []
    )).toThrow(/BLOCKED.*missing artifact files: cohort\/CASE-001\.json/);
  });

  it('blocks orphan cohort entries in the manifest', () => {
    expect(() => assertCohortManifestComplete(
      [definition],
      {
        schemaVersion: 1,
        files: {
          'cohort/CASE-001.json': entry,
          'cohort/ORPHAN.json': { ...entry, captureId: 'CAPTURE-ORPHAN' }
        }
      },
      ['cohort/CASE-001.json', 'cohort/ORPHAN.json']
    )).toThrow(/orphan manifest entries: cohort\/ORPHAN\.json/);
  });

  it('blocks extra cohort files that are not in the manifest', () => {
    expect(() => assertCohortManifestComplete(
      [definition],
      { schemaVersion: 1, files: { 'cohort/CASE-001.json': entry } },
      ['cohort/CASE-001.json', 'cohort/EXTRA.json']
    )).toThrow(/unmanifested files: cohort\/EXTRA\.json/);
  });
});
