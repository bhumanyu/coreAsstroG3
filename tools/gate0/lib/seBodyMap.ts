import { Body } from '@kuntay/swisseph';

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
