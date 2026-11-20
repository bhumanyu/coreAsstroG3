import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  auditCohort,
  loadCohortCaptures,
  renderCohortAudit,
  type CohortCapture
} from '../audit-cohort.ts';
import { openSwissEph, type SwissEphSession } from '../lib/se.ts';

let swissEphSession: SwissEphSession;

beforeAll(async () => {
  swissEphSession = await openSwissEph();
});

afterAll(() => {
  swissEphSession?.dispose();
});

interface CaptureOptions {
  readonly utcInstant?: string;
  readonly latitude?: number;
  readonly siteLongitude?: number;
  readonly ianaTimeZone?: string;
  readonly captureId?: string;
}

function capture(id: string, longitude: number, options: CaptureOptions = {}): CohortCapture {
  const utcInstant = options.utcInstant ?? '2026-01-01T00:00:00Z';
  const latitude = options.latitude ?? 0;
  const siteLongitude = options.siteLongitude ?? 0;
  const ianaTimeZone = options.ianaTimeZone ?? 'UTC';
  return {
    definition: {
      id,
      utcInstant,
      latitude,
      longitude: siteLongitude,
      ianaTimeZone,
      dasha: true
    },
    sha256: '0'.repeat(64),
    artifact: {
      captureId: options.captureId ?? `CAPTURE-${id}-2026-01-01`,
      caseId: id,
      site: {
        latitude,
        longitude: siteLongitude,
        instant: {
          utcInstant,
          localRepresentation: '2026-01-01T00:00:00+00:00',
          ianaTimeZone
        }
      },
      capture: {
        ascendantTropicalDeg: null,
        ascendantSiderealDeg: null,
        bodies: Object.fromEntries(
          ['SUN', 'MOON', 'MARS', 'MERCURY', 'JUPITER', 'VENUS', 'SATURN', 'RAHU', 'KETU']
            .map(body => [body, { tropical: { longitude, longitudeSpeed: 0 }, sidereal: { longitude, longitudeSpeed: 0 } }])
        )
      }
    }
  };
}

describe('cohort stratification audit', () => {
  it('counts proximity for captured bodies and verifies Moon boundary brackets on both sides', () => {
    const audit = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('AFTER', 0.001, { utcInstant: '2026-01-01T00:01:00Z' })
    ]);

    expect(audit.captureCount).toBe(2);
    expect(audit.bodyCount).toBe(18);
    expect(audit.moonBoundaryBrackets[0].bracketed).toBe(true);
    expect(audit.missingMoonBrackets).toHaveLength(26);
    expect(audit.proximity[0].total).toBe(18);
  });

  it('reports null ascendants as unavailable, not as successful measurements', () => {
    const audit = auditCohort([capture('NO-ASCENDANT', 10)]);

    expect(audit.ascendantUnavailableCount).toBe(1);
    expect(renderCohortAudit(audit)).toContain('Ascendant unavailable: 1');
  });

  it('asserts the current cohort has no unavailable ascendants and reports zero', () => {
    const audit = auditCohort(loadCohortCaptures(swissEphSession.swe));

    expect(audit.ascendantUnavailableCount).toBe(0);
    expect(renderCohortAudit(audit)).toContain('Ascendant unavailable: 0');
  });

  it('does not count one exact-boundary capture as a two-sided bracket', () => {
    const audit = auditCohort([
      capture('EXACT', 0, { utcInstant: '2026-01-01T00:00:00Z' })
    ]);

    expect(audit.moonBoundaryBrackets[0].bracketed).toBe(false);
    expect(audit.missingMoonBrackets).toContain(0);
  });

  it('rejects same-side captures even when they are close to the boundary', () => {
    const audit = auditCohort([
      capture('BEFORE-1', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('BEFORE-2', 359.998, { utcInstant: '2026-01-01T00:01:00Z' })
    ]);

    expect(audit.moonBoundaryBrackets[0].bracketed).toBe(false);
    expect(audit.missingMoonBrackets).toContain(0);
  });

  it('requires before and after captures to share the same site and timezone', () => {
    const coordinateMismatch = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('AFTER', 0.001, {
        utcInstant: '2026-01-01T00:01:00Z',
        latitude: 1
      })
    ]);
    const timezoneMismatch = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('AFTER', 0.001, {
        utcInstant: '2026-01-01T00:01:00Z',
        ianaTimeZone: 'America/New_York'
      })
    ]);

    expect(coordinateMismatch.missingMoonBrackets).toContain(0);
    expect(timezoneMismatch.missingMoonBrackets).toContain(0);
  });

  it('requires chronological order for the same crossing', () => {
    const audit = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:01:00Z' }),
      capture('AFTER', 0.001, { utcInstant: '2026-01-01T00:00:00Z' })
    ]);

    expect(audit.moonBoundaryBrackets[0].bracketed).toBe(false);
    expect(audit.missingMoonBrackets).toContain(0);
  });

  it('rejects pairs too far apart to demonstrate the same crossing', () => {
    const audit = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('AFTER', 0.001, { utcInstant: '2026-01-01T00:03:00Z' })
    ]);

    expect(audit.missingMoonBrackets).toContain(0);
  });

  it('accepts a distinct, ordered, same-site pair across the 360° wrap', () => {
    const audit = auditCohort([
      capture('BEFORE', 359.999, { utcInstant: '2026-01-01T00:00:00Z' }),
      capture('AFTER', 0.001, { utcInstant: '2026-01-01T00:01:00Z' })
    ]);

    expect(audit.moonBoundaryBrackets[0]).toMatchObject({
      beforeCaseId: 'BEFORE',
      afterCaseId: 'AFTER',
      bracketed: true
    });
    expect(audit.missingMoonBrackets).not.toContain(0);
  });

  it('rejects a pair reusing one artifact capture ID', () => {
    const audit = auditCohort([
      capture('BEFORE', 359.999, {
        utcInstant: '2026-01-01T00:00:00Z',
        captureId: 'SHARED'
      }),
      capture('AFTER', 0.001, {
        utcInstant: '2026-01-01T00:01:00Z',
        captureId: 'SHARED'
      })
    ]);

    expect(audit.missingMoonBrackets).toContain(0);
  });
});
