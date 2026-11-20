import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Flag, HouseSystem } from '@kuntay/swisseph';
import {
  captureInstant,
  openSwissEph,
  SE_BODY_MAP,
  type SwissEphSession
} from '../lib/se.ts';

function expectedAyanamsa(jdUt: number): number {
  const centuries = (jdUt - 2451545) / 36525;
  return 23.8571 + 1.3969713 * centuries + 0.0003086 * centuries ** 2;
}

function expectedAscendant(
  jdUt: number,
  nutationLongitudeDegrees: number,
  latitudeDegrees: number,
  longitudeDegrees: number
): number {
  const centuries = (jdUt - 2451545) / 36525;
  const gmst = 280.46061837
    + 360.98564736629 * (jdUt - 2451545)
    + 0.000387933 * centuries ** 2
    - centuries ** 3 / 38710000;
  const meanObliquity = 23 + 26 / 60 + 21.448 / 3600
    - (46.815 * centuries
      + 0.00059 * centuries ** 2
      - 0.001813 * centuries ** 3) / 3600;
  const epsilon = meanObliquity * Math.PI / 180;
  const thetaDegrees = (
    (gmst + nutationLongitudeDegrees * Math.cos(epsilon) + longitudeDegrees) % 360 + 360
  ) % 360;
  const theta = thetaDegrees * Math.PI / 180;
  const latitude = latitudeDegrees * Math.PI / 180;
  const intersection = Math.atan2(
    -Math.cos(latitude) * Math.cos(theta),
    Math.cos(latitude) * Math.sin(theta) * Math.cos(epsilon)
      + Math.sin(latitude) * Math.sin(epsilon)
  )
    * 180 / Math.PI;
  const candidates = [intersection, intersection + 180].map(longitude => {
    const lambda = ((longitude % 360) + 360) % 360 * Math.PI / 180;
    const rightAscension = Math.atan2(
      Math.cos(epsilon) * Math.sin(lambda),
      Math.cos(lambda)
    ) * 180 / Math.PI;
    const normalizedRa = ((rightAscension % 360) + 360) % 360;
    const hourAngle = ((thetaDegrees - normalizedRa + 540) % 360) - 180;
    return { longitude: ((longitude % 360) + 360) % 360, hourAngle };
  });
  const risingIntersection = candidates.find(candidate => candidate.hourAngle < 0);
  if (!risingIntersection) throw new Error('Could not resolve eastern ecliptic/horizon intersection.');
  return risingIntersection.longitude;
}

// The 1900 and 2099 longitude/speed vectors and ΔT are Astro.com swetest
// 2.10.04 outputs for -b{date} -n1 -s1 -fPLBRS -p0123456m at TT midnight.
// The returned UT instants are passed to the capture wrapper. Its positions
// are SWIEPH|SPEED: geocentric, apparent, true-equinox-of-date.
// Lahiri values use the published J2000 value plus the standard precession
// polynomial (0.01° tolerance). Ascendants independently use Meeus GMST,
// swetest's nutation-in-longitude term, mean obliquity, and the eastern
// ecliptic/horizon intersection at the recorded site (0.001° tolerance).
let session: SwissEphSession;

beforeAll(async () => {
  session = await openSwissEph();
});

afterAll(() => {
  session?.dispose();
});

describe('Swiss Ephemeris wrapper conformance', () => {
  it('matches all mapped bodies and ascendants at historical/future instants', () => {
    const cases = [
      {
        name: '1900-01-01 TT midnight',
        utcInstant: '1900-01-01T00:00:01.953Z',
        jdUt: 2415020.500022608,
        deltaTSeconds: -1.953326,
        nutationLongitude: 17.4335 / 3600,
        site: { latitude: 28.6139, longitude: 77.209 },
        bodies: {
          SUN: { longitude: 280.153384444, speed: 1.0198499722 },
          MOON: { longitude: 272.416656083, speed: 14.3228556667 },
          MARS: { longitude: 283.867760111, speed: 0.7704248611 },
          MERCURY: { longitude: 258.997798889, speed: 1.2765999444 },
          JUPITER: { longitude: 241.135950167, speed: 0.1956219167 },
          VENUS: { longitude: 306.374467778, speed: 1.2435091389 },
          SATURN: { longitude: 267.716811333, speed: 0.1163600278 },
          RAHU: { longitude: 259.161305889, speed: -0.0529057500 },
          KETU: { longitude: 79.161305889, speed: -0.0529057500 }
        }
      },
      {
        name: '2099-01-01 TT midnight',
        utcInstant: '2098-12-31T23:58:27.278Z',
        jdUt: 2487704.498926830,
        deltaTSeconds: 92.721914,
        nutationLongitude: -2.7846 / 3600,
        site: { latitude: -33.8688, longitude: 151.2093 },
        bodies: {
          SUN: { longitude: 280.851789417, speed: 1.0190070000 },
          MOON: { longitude: 24.168952778, speed: 12.3600436389 },
          MARS: { longitude: 240.010116639, speed: 0.6736753889 },
          MERCURY: { longitude: 276.278869972, speed: 1.5802723056 },
          JUPITER: { longitude: 173.186761250, speed: 0.0203365278 },
          VENUS: { longitude: 235.058250139, speed: 1.1144387222 },
          SATURN: { longitude: 193.830001361, speed: 0.0384449722 },
          RAHU: { longitude: 10.264099583, speed: -0.0529603056 },
          KETU: { longitude: 190.264099583, speed: -0.0529603056 }
        }
      }
    ];
    for (const reference of cases) {
      const capture = captureInstant(session.swe, reference.utcInstant, reference.site);
      expect(capture.julianDayUt).toBeCloseTo(reference.jdUt, 8);
      expect(Object.keys(capture.bodies).sort()).toEqual(Object.keys(SE_BODY_MAP).sort());
      for (const [bodyName, bodyReference] of Object.entries(reference.bodies)) {
        expect(capture.bodies[bodyName].tropical.longitude)
          .toBeCloseTo(bodyReference.longitude, 5);
        expect(capture.bodies[bodyName].tropical.longitudeSpeed)
          .toBeCloseTo(bodyReference.speed, 5);
      }

      expect(capture.deltaTDays * 86400)
        .toBeCloseTo(reference.deltaTSeconds, 2);
      expect(Math.abs(capture.ayanamsaDegrees - expectedAyanamsa(capture.julianDayUt)))
        .toBeLessThan(0.01);
      expect(Math.abs(
        capture.ayanamsaDegrees
        - (capture.bodies.SUN.tropical.longitude - capture.bodies.SUN.sidereal.longitude)
      )).toBeLessThan(0.01);
      const houses = session.swe.houses(
        capture.julianDayUt,
        reference.site.latitude,
        reference.site.longitude,
        HouseSystem.EqualWholeSign
      );
      const wrapperAscendant = capture.ascendantTropicalDeg;
      if (wrapperAscendant === null) throw new Error('Wrapper did not return a site ascendant.');
      expect(wrapperAscendant).toBeCloseTo(houses.ascendant, 10);
      expect(Math.abs(
        houses.ascendant
        - expectedAscendant(
          capture.julianDayUt,
          reference.nutationLongitude,
          reference.site.latitude,
          reference.site.longitude
        )
      )).toBeLessThan(0.001);
    }
  });

  it('matches the swetest negative Jupiter speed during retrograde motion', () => {
    // Swetest -b1.12.2024 -n1 -s1 -fPLBRS -p5 returns UT JD 2460645.499201289,
    // Jupiter longitude 77.188694972° and speed -0.1341296944°/day.
    const retrogradeJupiter = session.swe.calc(2460645.499201289, SE_BODY_MAP.JUPITER, {
      flags: Flag.SwissEphemeris | Flag.Speed
    });

    expect(retrogradeJupiter.longitude).toBeCloseTo(77.188694972, 5);
    expect(retrogradeJupiter.longitudeSpeed).toBeLessThan(0);
    expect(retrogradeJupiter.longitudeSpeed).toBeCloseTo(-0.1341296944, 5);
  });
});
