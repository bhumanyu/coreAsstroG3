import { describe, expect, it } from 'vitest';
import { auditCohort, type CohortCapture } from '../audit-cohort.ts';

function capture(id: string, longitude: number): CohortCapture {
  return {
    definition: {
      id,
      utcInstant: '2026-01-01T00:00:00Z',
      latitude: 0,
      longitude: 0,
      ianaTimeZone: 'UTC',
      dasha: true
    },
    sha256: '0'.repeat(64),
    artifact: {
      captureId: `CAPTURE-${id}-2026-01-01`,
      caseId: id,
      site: {
        latitude: 0,
        longitude: 0,
        instant: {
          utcInstant: '2026-01-01T00:00:00Z',
          localRepresentation: '2026-01-01T00:00:00+00:00',
          ianaTimeZone: 'UTC'
        }
      },
      capture: {
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
      capture('BEFORE', 359.999),
      capture('AFTER', 0.001)
    ]);

    expect(audit.captureCount).toBe(2);
    expect(audit.bodyCount).toBe(18);
    expect(audit.moonBoundaryBrackets[0].bracketed).toBe(true);
    expect(audit.missingMoonBrackets).toHaveLength(26);
    expect(audit.proximity[0].total).toBe(18);
  });
});
