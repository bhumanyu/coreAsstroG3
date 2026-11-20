import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Body, Flag, HouseSystem } from '@kuntay/swisseph';
import { openSwissEph, type SwissEphSession } from '../lib/se.ts';

function expectedAyanamsa(jdUt: number): number {
  const centuries = (jdUt - 2451545) / 36525;
  return 23.8571 + 1.3969713 * centuries + 0.0003086 * centuries ** 2;
}

function expectedAscendant(jdUt: number, nutationLongitudeDegrees: number): number {
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
  const thetaDegrees = ((gmst + nutationLongitudeDegrees * Math.cos(epsilon)) % 360 + 360) % 360;
  const theta = thetaDegrees * Math.PI / 180;
  const intersection = Math.atan2(-Math.cos(theta), Math.sin(theta) * Math.cos(epsilon))
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

// Planetary longitudes and ΔT are Astro.com swetest 2.10.04 outputs for
// -b{date} -n1 -s1 -fPLBRS -p0123 and -pm at TT midnight; the recorded UT JDs
// are passed unchanged to this wrapper. The position flags are SWIEPH|SPEED:
// geocentric, apparent, true-equinox-of-date positions.
// Lahiri values use the published J2000 value plus the standard precession
// polynomial (0.01° tolerance). Ascendants independently use Meeus GMST,
// swetest's nutation-in-longitude term, mean obliquity, and the eastern
// ecliptic/horizon intersection at latitude=longitude=0 (0.001° tolerance).
let session: SwissEphSession;

beforeAll(async () => {
  session = await openSwissEph();
});

afterAll(() => {
  session?.dispose();
});

describe('Swiss Ephemeris wrapper conformance', () => {
  it('matches independent 1900 and 2099 reference vectors', () => {
    const cases = [
      {
        name: '1900-01-01 TT midnight',
        jdUt: 2415020.500022608,
        deltaTSeconds: -1.953326,
        sunLongitude: 280.153384444,
        moonLongitude: 272.416656083,
        meanNodeLongitude: 259.161305889,
        nutationLongitude: 17.4335 / 3600
      },
      {
        name: '2099-01-01 TT midnight',
        jdUt: 2487704.498926830,
        deltaTSeconds: 92.721914,
        sunLongitude: 280.851789417,
        moonLongitude: 24.168952778,
        meanNodeLongitude: 10.264099583,
        nutationLongitude: -2.7846 / 3600
      }
    ];
    for (const reference of cases) {
      const flags = Flag.SwissEphemeris | Flag.Speed;
      const sun = session.swe.calc(reference.jdUt, Body.Sun, { flags });
      const moon = session.swe.calc(reference.jdUt, Body.Moon, { flags });
      const meanNode = session.swe.calc(reference.jdUt, Body.NorthNodeMean, { flags });
      const siderealSun = session.swe.calc(reference.jdUt, Body.Sun, {
        flags: flags | Flag.Sidereal
      });
      const ayanamsa = session.swe.ayanamsa(reference.jdUt);
      const ascendant = session.swe.houses(
        reference.jdUt,
        0,
        0,
        HouseSystem.EqualWholeSign
      ).ascendant;

      expect(sun.longitude).toBeCloseTo(reference.sunLongitude, 5);
      expect(moon.longitude).toBeCloseTo(reference.moonLongitude, 5);
      expect(meanNode.longitude).toBeCloseTo(reference.meanNodeLongitude, 5);
      expect(session.swe.deltaT(reference.jdUt) * 86400)
        .toBeCloseTo(reference.deltaTSeconds, 2);
      expect(Math.abs(ayanamsa - expectedAyanamsa(reference.jdUt))).toBeLessThan(0.01);
      expect(Math.abs(ayanamsa - (sun.longitude - siderealSun.longitude))).toBeLessThan(0.01);
      expect(Math.abs(
        ascendant - expectedAscendant(reference.jdUt, reference.nutationLongitude)
      )).toBeLessThan(0.001);
    }
  });
});
