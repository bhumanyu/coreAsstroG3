/**
 * astronomy-engine cross-check source for Gate-0 fixture generation.
 *
 * astronomy-engine (MIT) is an INDEPENDENTLY IDENTIFIABLE second reference —
 * it is never silently interchangeable with Swiss Ephemeris. Its captures are
 * recorded under their own source identity (`astronomy-engine`) and convention
 * record (geocentric, astrometric-with-aberration, tropical mean-equator/
 * true-ecliptic of date, J2000-based internal frame rotated to date).
 *
 * Scope: Sun..Pluto + Moon only. It has no lunar-node model and no ayanamsa,
 * so Rahu/Ketu are not cross-checked here.
 */
import * as AE from 'astronomy-engine';
import { normDeg } from './util.ts';

export const AE_PACKAGE = 'astronomy-engine';
export const AE_VERSION = '2.1.19';
export const AE_LICENSE_NOTE = 'MIT';

export interface AeBodyCrossCheck {
  readonly body: string;
  readonly eclipticLongitudeDeg: number;
  readonly eclipticLatitudeDeg: number;
  readonly distanceAu: number;
  /** deg/day via +0.01 d finite difference (matches common practice). */
  readonly longitudeSpeedDegPerDay: number;
}

const AE_BODY_MAP: Readonly<Record<string, AE.Body>> = {
  SUN: AE.Body.Sun,
  MOON: AE.Body.Moon,
  MERCURY: AE.Body.Mercury,
  VENUS: AE.Body.Venus,
  MARS: AE.Body.Mars,
  JUPITER: AE.Body.Jupiter,
  SATURN: AE.Body.Saturn
};

function eclOfDate(body: AE.Body, date: Date) {
  // GeoVector( aberration=true ) -> EQJ astrometric-with-aberration vector;
  // Rotation_EQJ_ECT -> true ecliptic of date; SphereFromVector -> lon/lat.
  const eqj = AE.GeoVector(body, date, true);
  const rot = AE.Rotation_EQJ_ECT(date);
  const ecl = AE.RotateVector(rot, eqj);
  const sph = AE.SphereFromVector(ecl);
  return { lon: normDeg(sph.lon), lat: sph.lat, dist: Math.sqrt(ecl.x * ecl.x + ecl.y * ecl.y + ecl.z * ecl.z) };
}

/** Cross-check capture for one instant. Returns per-body tropical ecliptic-of-date values. */
export function captureAstronomyEngine(utcInstant: string): Record<string, AeBodyCrossCheck> {
  const date = new Date(utcInstant);
  if (Number.isNaN(date.getTime())) throw new Error(`bad utcInstant: ${utcInstant}`);
  const later = new Date(date.getTime() + 0.01 * 86_400_000);
  const out: Record<string, AeBodyCrossCheck> = {};
  for (const [name, body] of Object.entries(AE_BODY_MAP)) {
    const p0 = eclOfDate(body, date);
    const p1 = eclOfDate(body, later);
    let dLon = p1.lon - p0.lon;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    out[name] = {
      body: name,
      eclipticLongitudeDeg: p0.lon,
      eclipticLatitudeDeg: p0.lat,
      distanceAu: p0.dist,
      longitudeSpeedDegPerDay: dLon / 0.01
    };
  }
  return out;
}
