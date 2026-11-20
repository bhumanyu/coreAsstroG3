/**
 * Swiss Ephemeris capture wrapper for Gate-0 fixture generation.
 *
 * Uses `@kuntay/swisseph` — Swiss Ephemeris 2.10.03 compiled to WebAssembly —
 * plus the `@kuntay/swisseph-data` .se1 files (DE441-derived, 1800–2399 CE).
 *
 * LICENSE: Swiss Ephemeris is AGPL-3.0-or-later / commercial dual-licensed.
 * This binding is used ONLY for offline fixture generation inside tools/gate0/.
 * It must never become a runtime or bundled dependency of the product; flag
 * for distribution review before any release artifact is produced.
 *
 * Conventions used for every capture:
 *  - Position: GEOCENTRIC, APPARENT (default flags: light-time + aberration,
 *    nutation; no Topoctr, no Truepos).
 *  - Frame: both TROPICAL (mean equinox of date) and SIDEREAL
 *    (SEFLG_SIDEREAL with ayanamsa mode LAHIRI = 1) are captured separately so
 *    raw and normalized values are preserved independently.
 *  - Nodes: MEAN node (SE mean lunar node). Ketu = mean node + 180°.
 *  - Time: UTC instant -> UT julian day via swe.julianDay. In
 *    @kuntay/swisseph@0.2.2, SwissEph.calc() calls swe_calc_ut(), which
 *    accepts UT and applies deltaT internally; do not add deltaT to this JD.
 */
import { createSwissEph, Body, Flag, Ayanamsa, HouseSystem, type SwissEph, type Position } from '@kuntay/swisseph';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sha256Hex } from './util.ts';

export const SE_PACKAGE = '@kuntay/swisseph';
export const SE_PACKAGE_VERSION = '0.2.2';
export const SE_CORE_VERSION = '2.10.03';
export const SE_DATA_PACKAGE = '@kuntay/swisseph-data';
export const SE_DATA_VERSION = '0.2.2';
export const SE_DATA_JPL = 'DE441-derived .se1 files, coverage 1800-2399 CE';
export const SE_LICENSE_NOTE =
  'Swiss Ephemeris is AGPL-3.0-or-later (commercial license available from Astrodienst AG). ' +
  'Used only as an offline fixture-generation reference inside tools/gate0/; ' +
  'flag for distribution review before any release.';

export interface SeFileManifestEntry {
  readonly file: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface SeBodyCapture {
  readonly body: string;
  readonly sweBody: number;
  readonly tropical: Position;
  readonly sidereal: Position;
  /** sidereal.longitude - (tropical.longitude - ayanamsaDegrees); should be ~0. */
  readonly ayanamsaResidualDeg: number;
}

export interface SeInstantCapture {
  readonly utcInstant: string;
  readonly julianDayUt: number;
  readonly deltaTDays: number;
  readonly ayanamsaMode: 'LAHIRI';
  readonly ayanamsaSweMode: number;
  readonly ayanamsaDegrees: number;
  readonly bodies: Readonly<Record<string, SeBodyCapture>>;
  readonly ascendantTropicalDeg: number | null;
  readonly ascendantSiderealDeg: number | null;
  readonly houseSystem: string;
  readonly flagsTropical: string;
  readonly flagsSidereal: string;
  readonly ephemerisModelsObserved: readonly string[];
  readonly warnings: readonly string[];
}

/** Planet -> Swiss Ephemeris body id. KETU is derived (mean node + 180). */
export const SE_BODY_MAP: Readonly<Record<string, number>> = {
  SUN: Body.Sun,
  MOON: Body.Moon,
  MARS: Body.Mars,
  MERCURY: Body.Mercury,
  JUPITER: Body.Jupiter,
  VENUS: Body.Venus,
  SATURN: Body.Saturn,
  RAHU: Body.NorthNodeMean,
  KETU: Body.NorthNodeMean
};

const NORM = (d: number) => ((d % 360) + 360) % 360;

export interface SwissEphSession {
  readonly swe: SwissEph;
  readonly version: string;
  readonly ephemerisFiles: readonly SeFileManifestEntry[];
  dispose(): void;
}

function ephemerisDir(): string {
  // tools/gate0/node_modules/@kuntay/swisseph-data/ephe (installed locally in tools/gate0)
  const candidates = [
    join(process.cwd(), 'tools/gate0/node_modules/@kuntay/swisseph-data/ephe'),
    join(process.cwd(), 'node_modules/@kuntay/swisseph-data/ephe')
  ];
  for (const dir of candidates) {
    try {
      const files = readdirSync(dir);
      if (files.some(f => f.endsWith('.se1'))) return dir;
    } catch { /* try next */ }
  }
  throw new Error(`Swiss Ephemeris data directory not found. Tried: ${candidates.join(', ')}`);
}

export async function openSwissEph(): Promise<SwissEphSession> {
  const dir = ephemerisDir();
  const files: Record<string, Uint8Array> = {};
  const manifest: SeFileManifestEntry[] = [];
  for (const name of readdirSync(dir).sort()) {
    const bytes = readFileSync(join(dir, name));
    files[name] = new Uint8Array(bytes);
    manifest.push({ file: name, bytes: bytes.length, sha256: sha256Hex(bytes) });
  }
  const swe = await createSwissEph({ files });
  swe.setSiderealMode(Ayanamsa.Lahiri);
  return {
    swe,
    version: swe.version,
    ephemerisFiles: manifest,
    dispose: () => swe.dispose()
  };
}

function utcHourDecimal(date: Date): number {
  return date.getUTCHours()
    + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3600
    + date.getUTCMilliseconds() / 3_600_000;
}

const SPEED_FLAG = Flag.Speed;

/**
 * Capture every Gate-0 planet at one UTC instant.
 * `site` supplies geolocation for the ascendant (whole-sign cusps are
 * longitude-independent for the ascendant itself; house cusps recorded for
 * information only).
 */
export function captureInstant(
  swe: SwissEph,
  utcInstant: string,
  site?: { latitude: number; longitude: number }
): SeInstantCapture {
  const date = new Date(utcInstant);
  if (Number.isNaN(date.getTime())) throw new Error(`bad utcInstant: ${utcInstant}`);
  const jd = swe.julianDay(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    utcHourDecimal(date)
  );
  const deltaTDays = swe.deltaT(jd);
  const ayanamsaDegrees = swe.ayanamsa(jd);

  const bodies: Record<string, SeBodyCapture> = {};
  const warnings: string[] = [];
  const models = new Set<string>();
  for (const [name, bodyId] of Object.entries(SE_BODY_MAP)) {
    const tropical = swe.calc(jd, bodyId, { flags: SPEED_FLAG });
    const sidereal = swe.calc(jd, bodyId, { flags: Flag.Sidereal | SPEED_FLAG });
    models.add(tropical.ephemeris);
    models.add(sidereal.ephemeris);
    for (const w of [tropical.warning, sidereal.warning]) {
      if (w) warnings.push(`${name}: ${w}`);
    }
    let tropPos = tropical;
    let sidPos = sidereal;
    if (name === 'KETU') {
      // Ketu is the lunar south node: mean node longitude + 180 deg.
      tropPos = {
        ...tropical,
        longitude: NORM(tropical.longitude + 180),
        latitude: -tropical.latitude,
        longitudeSpeed: tropical.longitudeSpeed,
        latitudeSpeed: -tropical.latitudeSpeed
      };
      sidPos = {
        ...sidereal,
        longitude: NORM(sidereal.longitude + 180),
        latitude: -sidereal.latitude,
        longitudeSpeed: sidereal.longitudeSpeed,
        latitudeSpeed: -sidereal.latitudeSpeed
      };
    }
    const residual = NORM(sidPos.longitude - NORM(tropPos.longitude - ayanamsaDegrees));
    bodies[name] = {
      body: name,
      sweBody: bodyId,
      tropical: tropPos,
      sidereal: sidPos,
      ayanamsaResidualDeg: residual > 180 ? residual - 360 : residual
    };
  }

  let ascT: number | null = null;
  if (site) {
    // swehouses is a pure spherical-astronomy routine; the sidereal ascendant
    // is the tropical ascendant shifted by the ayanamsa (the same convention
    // the engine documents). We keep the raw tropical value and the
    // ayanamsa-normalized value separately.
    const hT = swe.houses(jd, site.latitude, site.longitude, HouseSystem.EqualWholeSign);
    ascT = hT.ascendant;
    if (hT.warning) warnings.push(`houses: ${hT.warning}`);
  }
  const ascS = ascT === null ? null : NORM(ascT - ayanamsaDegrees);

  return {
    utcInstant,
    julianDayUt: jd,
    deltaTDays,
    ayanamsaMode: 'LAHIRI',
    ayanamsaSweMode: Ayanamsa.Lahiri,
    ayanamsaDegrees,
    bodies,
    ascendantTropicalDeg: ascT,
    ascendantSiderealDeg: ascS,
    houseSystem: 'EqualWholeSign (W); ascendant recorded for parity measurement only',
    flagsTropical: 'SEFLG_SWIEPH|SEFLG_SPEED (geocentric apparent, nutation, light-time+aberration)',
    flagsSidereal: 'SEFLG_SWIEPH|SEFLG_SPEED|SEFLG_SIDEREAL (ayanamsa=LAHIRI)',
    ephemerisModelsObserved: [...models].sort(),
    warnings
  };
}

/** Deterministic one-line-per-body raw rendering used inside capture records. */
export function rawBodyLine(b: SeBodyCapture): string {
  const t = b.tropical;
  const s = b.sidereal;
  return `${b.body} tropical_lon=${t.longitude.toFixed(10)} tropical_speed=${t.longitudeSpeed.toFixed(10)} ` +
    `sidereal_lon=${s.longitude.toFixed(10)} sidereal_speed=${s.longitudeSpeed.toFixed(10)} ` +
    `eph=${t.ephemeris}`;
}
