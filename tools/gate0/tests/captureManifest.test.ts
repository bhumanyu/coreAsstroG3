import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  auditCohort,
  renderCohortAudit,
  type CohortCapture
} from '../audit-cohort.ts';
import {
  assertCohortManifestComplete,
  validateCaptureArtifact,
  type CaptureManifest
} from '../lib/captureManifest.ts';
import { SE_BODY_MAP } from '../lib/seBodyMap.ts';
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
    schemaVersion: 1,
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
      julianDayUt: 2451545,
      deltaTDays: 0.0008,
      ayanamsaSweMode: 1,
      ayanamsaDegrees: 24,
      ascendantTropicalDeg: null,
      ascendantSiderealDeg: null,
      bodies: {
        SUN: {
          body: 'SUN',
          sweBody: 0,
          tropical: {
            longitude: 10,
            latitude: 0,
            distance: 1,
            longitudeSpeed: 1,
            latitudeSpeed: 0,
            distanceSpeed: 0
          },
          sidereal: {
            longitude: 346,
            latitude: 0,
            distance: 1,
            longitudeSpeed: 1,
            latitudeSpeed: 0,
            distanceSpeed: 0
          },
          ayanamsaResidualDeg: 0
        },
        MOON: {
          body: 'MOON',
          sweBody: 1,
          tropical: {
            longitude: 20,
            latitude: 0,
            distance: 1,
            longitudeSpeed: 13,
            latitudeSpeed: 0,
            distanceSpeed: 0
          },
          sidereal: {
            longitude: 356,
            latitude: 0,
            distance: 1,
            longitudeSpeed: 13,
            latitudeSpeed: 0,
            distanceSpeed: 0
          },
          ayanamsaResidualDeg: 0
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

  it.each([
    ['NaN', Number.NaN],
    ['negative', -1],
    ['non-integer', 1.5]
  ])('rejects %s manifest bytes', (_label, bytes) => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    const invalidManifest: CaptureManifest = {
      ...manifest,
      files: {
        ...manifest.files,
        'cohort/CASE-001.json': {
          ...manifest.files['cohort/CASE-001.json'],
          bytes
        }
      }
    };

    expect(() => validateCaptureArtifact({
      manifest: invalidManifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001'
    })).toThrow(/CASE-001.*manifest\.files\.cohort\/CASE-001\.json\.bytes/);
  });

  it.each([
    ['malformed SHA-256', { sha256: 'g'.repeat(64) }, /sha256/],
    ['empty capture ID', { captureId: '  ' }, /captureId/]
  ])('rejects %s manifest metadata', (_label, entryOverrides, fieldPattern) => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    const invalidManifest: CaptureManifest = {
      ...manifest,
      files: {
        ...manifest.files,
        'cohort/CASE-001.json': {
          ...manifest.files['cohort/CASE-001.json'],
          ...entryOverrides
        }
      }
    };

    expect(() => validateCaptureArtifact({
      manifest: invalidManifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001'
    })).toThrow(new RegExp(`CASE-001.*manifest\\.files.*${fieldPattern.source}`));
  });

  it('rejects unsupported manifest and artifact schema versions', () => {
    const { artifactPath, manifest } = writeArtifact(validArtifact);
    expect(() => validateCaptureArtifact({
      manifest: { ...manifest, schemaVersion: 2 },
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001'
    })).toThrow(/CASE-001.*manifest\.schemaVersion/);

    const wrongArtifact = writeArtifact({ ...validArtifact, schemaVersion: 2 });
    expect(() => validateCaptureArtifact({
      manifest: wrongArtifact.manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath: wrongArtifact.artifactPath,
      caseId: 'CASE-001'
    })).toThrow(/CASE-001.*artifact\.schemaVersion/);
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
    ['non-finite latitude', { tropicalLatitude: Number.NaN }, 'tropical.latitude'],
    ['non-finite latitude speed', { tropicalLatitudeSpeed: Number.NaN }, 'tropical.latitudeSpeed'],
    ['non-finite distance', { tropicalDistance: Number.NaN }, 'tropical.distance'],
    ['non-positive distance', { tropicalDistance: 0 }, 'tropical.distance'],
    ['non-finite distance speed', { siderealDistanceSpeed: Number.NaN }, 'sidereal.distanceSpeed'],
    ['malformed tropical ascendant', { ascendantTropicalDeg: '90' }, 'capture.ascendantTropicalDeg'],
    ['out-of-range sidereal ascendant', { ascendantSiderealDeg: 360 }, 'capture.ascendantSiderealDeg'],
    ['non-positive Julian day', { julianDayUt: 0 }, 'capture.julianDayUt'],
    ['excessive delta-T', { deltaTDays: 0.02 }, 'capture.deltaTDays'],
    ['delta-T below historical bound', { deltaTDays: -0.002 }, 'capture.deltaTDays'],
    ['large ayanamsa residual', { ayanamsaResidualDeg: 0.01 }, 'ayanamsaResidualDeg'],
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

  it.each([
    ['lower ΔT bound', { deltaTDays: -0.001 }],
    ['upper ΔT bound', { deltaTDays: 0.01 }],
    ['positive Julian day', { julianDayUt: Number.MIN_VALUE }],
    ['positive distance', { tropicalDistance: Number.MIN_VALUE }],
    ['residual within frame tolerance', { ayanamsaResidualDeg: 0.009 }]
  ])('accepts %s', (_label, overrides) => {
    const artifact = numericArtifact(overrides);
    const { artifactPath, manifest } = writeArtifact(artifact);

    const validated = validateCaptureArtifact<CohortCapture['artifact']>({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    });
    const audit = auditCohort([{
      definition: {
        id: 'CASE-001',
        latitude: 0,
        longitude: 0,
        ianaTimeZone: 'UTC',
        utcInstant: '2000-01-01T00:00:00Z',
        dasha: false
      },
      artifact: validated.artifact,
      sha256: validated.sha256
    }]);

    expect(audit.ascendantUnavailableCount).toBe(1);
    expect(renderCohortAudit(audit)).toContain('Ascendant unavailable: 1');
  });

  it.each([
    ['ΔT just below its lower bound', { deltaTDays: -0.0010001 }, 'capture.deltaTDays'],
    ['ΔT just above its upper bound', { deltaTDays: 0.0100001 }, 'capture.deltaTDays'],
    ['zero Julian day', { julianDayUt: 0 }, 'capture.julianDayUt'],
    ['zero distance', { tropicalDistance: 0 }, 'tropical.distance'],
    ['residual above frame tolerance', { ayanamsaResidualDeg: 0.011 }, 'ayanamsaResidualDeg']
  ])('rejects %s', (_label, overrides, field) => {
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

  it('rejects a body name paired with a different canonical Swiss Ephemeris ID', () => {
    const base = numericArtifact();
    const artifact = {
      ...base,
      capture: {
        ...base.capture,
        bodies: {
          MARS: {
            ...base.capture.bodies.SUN,
            body: 'MARS',
            sweBody: SE_BODY_MAP.JUPITER
          }
        }
      }
    };
    const { artifactPath, manifest } = writeArtifact(artifact);

    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['MARS']
    })).toThrow(/CASE-001.*MARS\.sweBody.*canonical/);
  });

  it('accepts null ascendants as unavailable fields', () => {
    const artifact = numericArtifact({
      ascendantTropicalDeg: null,
      ascendantSiderealDeg: null
    });
    const { artifactPath, manifest } = writeArtifact(artifact);

    expect(() => validateCaptureArtifact({
      manifest,
      relativePath: 'cohort/CASE-001.json',
      artifactPath,
      caseId: 'CASE-001',
      expectedBodies: ['SUN']
    })).not.toThrow();
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
    readonly tropicalLatitude?: unknown;
    readonly tropicalDistance?: unknown;
    readonly tropicalSpeed?: unknown;
    readonly tropicalLatitudeSpeed?: unknown;
    readonly tropicalDistanceSpeed?: unknown;
    readonly siderealLongitude?: unknown;
    readonly siderealLatitude?: unknown;
    readonly siderealDistance?: unknown;
    readonly siderealSpeed?: unknown;
    readonly siderealLatitudeSpeed?: unknown;
    readonly siderealDistanceSpeed?: unknown;
    readonly julianDayUt?: unknown;
    readonly deltaTDays?: unknown;
    readonly ayanamsaDegrees?: unknown;
    readonly ayanamsaSweMode?: unknown;
    readonly ayanamsaResidualDeg?: unknown;
    readonly ascendantTropicalDeg?: unknown;
    readonly ascendantSiderealDeg?: unknown;
    readonly sweBody?: unknown;
    readonly omitAyanamsa?: boolean;
    readonly latitude?: unknown;
    readonly siteLongitude?: unknown;
    readonly utcInstant?: unknown;
  } = {}) {
    const choose = (value: unknown, fallback: unknown): unknown =>
      value === undefined ? fallback : value;
    const makeBody = (frame: 'tropical' | 'sidereal') => ({
      [frame]: frame === 'tropical'
        ? {
          longitude: choose(overrides.tropicalLongitude, 10),
          latitude: choose(overrides.tropicalLatitude, 0),
          distance: choose(overrides.tropicalDistance, 1),
          longitudeSpeed: choose(overrides.tropicalSpeed, 1),
          latitudeSpeed: choose(overrides.tropicalLatitudeSpeed, 0),
          distanceSpeed: choose(overrides.tropicalDistanceSpeed, 0)
        }
        : {
          longitude: choose(overrides.siderealLongitude, 346),
          latitude: choose(overrides.siderealLatitude, 0),
          distance: choose(overrides.siderealDistance, 1),
          longitudeSpeed: choose(overrides.siderealSpeed, 1),
          latitudeSpeed: choose(overrides.siderealLatitudeSpeed, 0),
          distanceSpeed: choose(overrides.siderealDistanceSpeed, 0)
        }
    });
    return {
      schemaVersion: 1,
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
        julianDayUt: choose(overrides.julianDayUt, 2451545),
        deltaTDays: choose(overrides.deltaTDays, 0.0008),
        ayanamsaSweMode: choose(overrides.ayanamsaSweMode, 1),
        ...(overrides.omitAyanamsa
          ? {}
          : { ayanamsaDegrees: choose(overrides.ayanamsaDegrees, 24) }),
        ascendantTropicalDeg: choose(overrides.ascendantTropicalDeg, null),
        ascendantSiderealDeg: choose(overrides.ascendantSiderealDeg, null),
        bodies: {
          SUN: {
            body: 'SUN',
            sweBody: choose(overrides.sweBody, 0),
            ...makeBody('tropical'),
            ...makeBody('sidereal'),
            ayanamsaResidualDeg: choose(overrides.ayanamsaResidualDeg, 0)
          }
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
