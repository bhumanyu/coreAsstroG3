import {
  Ayanamsa,
  Body,
  createSwissEph,
  FetchEphemeris,
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
  ascendantTropical(jdUt: number, lat: number, lon: number): number;
  ayanamsa(jdUt: number): number;
  ayanamsaFor(jdUt: number, ayanamsa: AyanamsaType): number;
  readonly version: string;
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

async function loadDataFiles(): Promise<Record<string, Uint8Array>> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const dir = join(process.cwd(), 'node_modules', '@kuntay', 'swisseph-data', 'ephe');
    const names = ['sepl_18.se1', 'semo_18.se1', 'seas_18.se1', 'sefstars.txt', 'seorbel.txt'];
    const files: Record<string, Uint8Array> = {};
    for (const name of names) {
      files[name] = new Uint8Array(await readFile(join(dir, name)));
    }
    return files;
  }
  return {};
}

async function createAdapter(): Promise<SwissEphemerisAdapter> {
  const files = await loadDataFiles();
  let swe: SwissEph;
  if (Object.keys(files).length > 0) {
    swe = await createSwissEph({ files });
  } else {
    swe = await createSwissEph();
    await swe.loadEphemeris(new FetchEphemeris(), {
      fromYear: 1800,
      toYear: 2399,
      fixedStars: true
    });
  }
  swe.setSiderealMode(Ayanamsa.Lahiri);

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
    tropicalPositions(jdUt: number): Record<Planet, SwissTropicalPosition> {
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
      const houses = swe.houses(jdUt, lat, lon, HouseSystem.EqualWholeSign);
      if (houses.warning) throw new Error(`Swiss Ephemeris houses failed: ${houses.warning}`);
      return normalizeDegree(houses.ascendant);
    },
    ayanamsa(jdUt: number): number {
      setAyanamsaMode(AyanamsaType.LAHIRI);
      return swe.ayanamsa(jdUt);
    },
    ayanamsaFor(jdUt: number, ayanamsaType: AyanamsaType): number {
      if (ayanamsaType === AyanamsaType.TROPICAL) return 0;
      setAyanamsaMode(ayanamsaType);
      return swe.ayanamsa(jdUt);
    }
  };
}

export const swissEphemerisAdapter: SwissEphemerisAdapter = await createAdapter();
