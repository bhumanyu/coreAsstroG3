import {
  Ayanamsa,
  Body,
  createSwissEph,
  Flag,
  HouseSystem,
  type SwissEph
} from '@kuntay/swisseph';
import { Planet, AyanamsaType } from '../../types';
import { normalizeDegree } from '../nakshatraUtils';

export interface SwissTropicalPosition {
  longitude: number;
  latitude: number;
  longitudeSpeed: number;
}

export interface SwissEphemerisAdapter {
  tropicalPositions(jdUt: number): Record<Planet, SwissTropicalPosition>;
  sunTropical(jdUt: number): number;
  ascendantTropical(jdUt: number, lat: number, lon: number): number;
  ayanamsa(jdUt: number): number;
  ayanamsaFor(jdUt: number, ayanamsa: AyanamsaType): number;
  readonly version: string;
  readonly dataSource: string;
  readonly ephemerisVersion: string;
}

const bodyMap: Readonly<Record<Exclude<Planet, Planet.RAHU | Planet.KETU>, number>> = {
  [Planet.SUN]: Body.Sun,
  [Planet.MOON]: Body.Moon,
  [Planet.MARS]: Body.Mars,
  [Planet.MERCURY]: Body.Mercury,
  [Planet.JUPITER]: Body.Jupiter,
  [Planet.VENUS]: Body.Venus,
  [Planet.SATURN]: Body.Saturn
};

export async function loadBrowserEphemerisFiles(assetBaseUrl = '/ephe'): Promise<Record<string, Uint8Array>> {
  const names = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1', 'sefstars.txt', 'seorbel.txt'];
  const manifestResponse = await fetch(`${assetBaseUrl.replace(/\/$/, '')}/manifest.json`);
  if (!manifestResponse.ok) {
    throw new Error(`Failed to load Swiss Ephemeris asset manifest: HTTP ${manifestResponse.status}`);
  }
  const manifest = await manifestResponse.json() as {
    version?: string;
    swissEphemerisVersion?: string;
    files: { file: string; bytes: number; sha256: string }[];
  };
  if (manifest.version !== '0.2.2' || manifest.swissEphemerisVersion !== '2.10.03') {
    throw new Error('Unsupported or mismatched Swiss Ephemeris asset manifest.');
  }
  const manifestByFile = new Map(manifest.files.map(entry => [entry.file, entry]));
  const files: Record<string, Uint8Array> = {};
  for (const name of names) {
    const response = await fetch(`${assetBaseUrl.replace(/\/$/, '')}/${name}`);
    if (!response.ok) {
      throw new Error(`Failed to load required Swiss Ephemeris asset ${name}: HTTP ${response.status}`);
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0) throw new Error(`Required Swiss Ephemeris asset is empty: ${name}`);
    const entry = manifestByFile.get(name);
    if (!entry || bytes.length !== entry.bytes) {
      throw new Error(`Swiss Ephemeris asset size mismatch: ${name}`);
    }
    if (!globalThis.crypto?.subtle) {
      throw new Error('Web Crypto is unavailable; cannot verify Swiss Ephemeris asset integrity.');
    }
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (sha256 !== entry.sha256) {
      throw new Error(`Swiss Ephemeris asset SHA-256 mismatch: ${name}`);
    }
    files[name] = bytes;
  }
  return files;
}

async function loadDataFiles(): Promise<Record<string, Uint8Array>> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { readFile } = await import('node:fs/promises');
    const { createRequire } = await import('node:module');
    const { createHash } = await import('node:crypto');
    const requireFromAdapter = createRequire(import.meta.url);
    const names = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1', 'sefstars.txt', 'seorbel.txt'];
    const files: Record<string, Uint8Array> = {};
    let manifest: { version?: string; swissEphemerisVersion?: string; files: { file: string; bytes: number; sha256: string }[] };
    try {
      manifest = JSON.parse(await readFile(requireFromAdapter.resolve('@kuntay/swisseph-data/manifest.json'), 'utf8'));
    } catch (error) {
      throw new Error('Failed to load the Swiss Ephemeris data package manifest.', { cause: error });
    }
    if (manifest.version !== '0.2.2' || manifest.swissEphemerisVersion !== '2.10.03') {
      throw new Error('Unsupported or mismatched Swiss Ephemeris package manifest.');
    }
    const manifestByFile = new Map(manifest.files.map(entry => [entry.file, entry]));
    for (const name of names) {
      let resolved: string;
      try {
        resolved = requireFromAdapter.resolve(`@kuntay/swisseph-data/${name}`);
      } catch (error) {
        throw new Error(`Required Swiss Ephemeris data package file missing: ${name}`, { cause: error });
      }
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await readFile(resolved));
      } catch (error) {
        throw new Error(`Failed to read required Swiss Ephemeris data file: ${resolved}`, { cause: error });
      }
      if (bytes.length === 0) {
        throw new Error(`Required Swiss Ephemeris data file is empty: ${resolved}`);
      }
      const entry = manifestByFile.get(name);
      if (!entry || bytes.length !== entry.bytes) {
        throw new Error(`Swiss Ephemeris data size mismatch: ${name}`);
      }
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      if (sha256 !== entry.sha256) {
        throw new Error(`Swiss Ephemeris data SHA-256 mismatch: ${name}`);
      }
      files[name] = bytes;
    }
    return files;
  }
  const assetConfig = (globalThis as {
    __COREASTRO_SWISS_EPHEMERIS_CONFIG__?: { assetBaseUrl?: string };
  }).__COREASTRO_SWISS_EPHEMERIS_CONFIG__;
  const assetBaseUrl = assetConfig?.assetBaseUrl ?? '/ephe';
  return loadBrowserEphemerisFiles(assetBaseUrl);
}

// Startup contract: importing this module blocks until createAdapter completes.
// Ephemeris/asset initialization failures propagate as module-load errors.
// This intentionally provides no ready/not-ready fallback or silent Moshier degradation.
async function createAdapter(): Promise<SwissEphemerisAdapter> {
  const files = await loadDataFiles();
  const dataSource = typeof process !== 'undefined' && process.versions?.node
    ? '@kuntay/swisseph-data@0.2.2 package'
    : `browser-assets:${(globalThis as { __COREASTRO_SWISS_EPHEMERIS_CONFIG__?: { assetBaseUrl?: string } }).__COREASTRO_SWISS_EPHEMERIS_CONFIG__?.assetBaseUrl ?? '/ephe'}`;
  let swe: SwissEph;
  swe = await createSwissEph({ files });
  swe.setSiderealMode(Ayanamsa.Lahiri);

  function assertSupportedDate(jdUt: number): void {
    if (!Number.isFinite(jdUt)) throw new Error('Julian day must be finite.');
    if (jdUt < 2378496 || jdUt > 2597642) {
      throw new Error(`Julian day ${jdUt} is outside the deterministic ephemeris data coverage 1800-2399 CE.`);
    }
  }

  function setAyanamsaMode(type: AyanamsaType): void {
    switch (type) {
      case AyanamsaType.RAMAN:
        swe.setSiderealMode(Ayanamsa.Raman);
        break;
      case AyanamsaType.KRISHNAMURTI:
        swe.setSiderealMode(Ayanamsa.Krishnamurti);
        break;
      case AyanamsaType.FAGAN_BRADLEY:
        swe.setSiderealMode(Ayanamsa.FaganBradley);
        break;
      case AyanamsaType.TROPICAL:
      case AyanamsaType.LAHIRI:
      default:
        swe.setSiderealMode(Ayanamsa.Lahiri);
        break;
    }
  }

  return {
    version: swe.version,
    dataSource,
    ephemerisVersion: '2.10.03',
    sunTropical(jdUt: number): number {
      assertSupportedDate(jdUt);
      const position = swe.calc(jdUt, Body.Sun, { flags: Flag.Speed });
      if (position.ephemeris !== 'swiss') {
        throw new Error(`Swiss Ephemeris data unavailable for SUN: ${position.ephemeris}`);
      }
      return normalizeDegree(position.longitude);
    },
    tropicalPositions(jdUt: number): Record<Planet, SwissTropicalPosition> {
      assertSupportedDate(jdUt);
      setAyanamsaMode(AyanamsaType.LAHIRI);
      const result = {} as Record<Planet, SwissTropicalPosition>;
      for (const [planet, body] of Object.entries(bodyMap) as [Planet, number][]) {
        const position = swe.calc(jdUt, body, { flags: Flag.Speed });
        if (position.ephemeris !== 'swiss') {
          throw new Error(`Swiss Ephemeris data unavailable for ${planet}: ${position.ephemeris}`);
        }
        result[planet] = {
          longitude: normalizeDegree(position.longitude),
          latitude: position.latitude,
          longitudeSpeed: position.longitudeSpeed
        };
      }

      const rahu = swe.calc(jdUt, Body.NorthNodeMean, { flags: Flag.Speed });
      if (rahu.ephemeris !== 'swiss') {
        throw new Error(`Swiss Ephemeris data unavailable for RAHU: ${rahu.ephemeris}`);
      }
      result[Planet.RAHU] = {
        longitude: normalizeDegree(rahu.longitude),
        latitude: rahu.latitude,
        longitudeSpeed: rahu.longitudeSpeed
      };
      result[Planet.KETU] = {
        longitude: normalizeDegree(rahu.longitude + 180),
        latitude: -rahu.latitude,
        longitudeSpeed: rahu.longitudeSpeed
      };
      return result;
    },
    ascendantTropical(jdUt: number, lat: number, lon: number): number {
      assertSupportedDate(jdUt);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new Error(`Latitude out of range: ${lat}`);
      }
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error(`Longitude out of range: ${lon}`);
      }
      const houses = swe.houses(jdUt, lat, lon, HouseSystem.EqualWholeSign);
      if (houses.warning) throw new Error(`Swiss Ephemeris houses failed: ${houses.warning}`);
      return normalizeDegree(houses.ascendant);
    },
    ayanamsa(jdUt: number): number {
      assertSupportedDate(jdUt);
      setAyanamsaMode(AyanamsaType.LAHIRI);
      try {
        return swe.ayanamsa(jdUt);
      } finally {
        setAyanamsaMode(AyanamsaType.LAHIRI);
      }
    },
    ayanamsaFor(jdUt: number, ayanamsaType: AyanamsaType): number {
      assertSupportedDate(jdUt);
      if (ayanamsaType === AyanamsaType.TROPICAL) {
        setAyanamsaMode(AyanamsaType.LAHIRI);
        try {
          return 0;
        } finally {
          setAyanamsaMode(AyanamsaType.LAHIRI);
        }
      }
      setAyanamsaMode(ayanamsaType);
      try {
        return swe.ayanamsa(jdUt);
      } finally {
        setAyanamsaMode(AyanamsaType.LAHIRI);
      }
    }
  };
}

export const swissEphemerisAdapter: SwissEphemerisAdapter = await createAdapter();
