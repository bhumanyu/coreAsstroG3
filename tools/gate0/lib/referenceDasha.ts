import {
  DASHA_SEQUENCE,
  DASHA_YEARS,
  type PlanetName,
  vimshottariAnchor
} from './grid.ts';

const MS_PER_DAY = 86_400_000;

export interface ReferenceDashaPeriod {
  readonly planet: PlanetName;
  readonly start: string;
  readonly end: string;
  readonly antardashas: readonly ReferenceAntardashaPeriod[];
}

export interface ReferenceAntardashaPeriod {
  readonly planet: PlanetName;
  readonly start: string;
  readonly end: string;
  readonly pratyantardashas: readonly ReferencePratyantardashaPeriod[];
}

export interface ReferencePratyantardashaPeriod {
  readonly planet: PlanetName;
  readonly start: string;
  readonly end: string;
}

export interface ReferenceDashaTimeline {
  readonly moonSiderealLongitude: number;
  readonly nakshatra: string;
  readonly nakshatraLord: PlanetName;
  readonly nakshatraProgress: number;
  readonly mahadashas: readonly ReferenceDashaPeriod[];
}

export interface ReferenceDashaInput {
  readonly birthDateTime: string;
  readonly moonSiderealLongitude: number;
  readonly until?: string;
  readonly yearLengthDays: number;
}

export function calculateReferenceDasha(input: ReferenceDashaInput): ReferenceDashaTimeline {
  const birthMs = Date.parse(input.birthDateTime);
  const yearMs = input.yearLengthDays * MS_PER_DAY;
  const untilMs = input.until === undefined
    ? birthMs + 120 * yearMs
    : Date.parse(input.until);
  if (!Number.isFinite(birthMs) || !Number.isFinite(untilMs)
    || !Number.isFinite(yearMs) || yearMs <= 0 || untilMs < birthMs) {
    throw new RangeError('Reference dasha requires valid dates and a positive year length.');
  }

  const anchor = vimshottariAnchor(input.moonSiderealLongitude, birthMs);
  const rotated = rotateFrom(anchor.nakshatraLord);
  const mahadashas: ReferenceDashaPeriod[] = [];
  let currentMs = birthMs;
  let firstCandidate = true;

  while (currentMs < untilMs) {
    let emitted = false;
    for (const planet of rotated) {
      if (currentMs >= untilMs) break;
      const isBirthBalance = firstCandidate && planet === anchor.nakshatraLord;
      if (isBirthBalance) firstCandidate = false;

      const years = DASHA_YEARS[planet] * (isBirthBalance ? anchor.remainingFraction : 1);
      const fullStartMs = isBirthBalance
        ? clip(birthMs - anchor.nakshatraProgress * DASHA_YEARS[planet] * yearMs)
        : currentMs;
      const fullEndMs = isBirthBalance
        ? clip(fullStartMs + DASHA_YEARS[planet] * yearMs)
        : clip(currentMs + years * yearMs);
      const isPartialOrClipped = isBirthBalance || fullEndMs > untilMs;
      const endMs = Math.min(fullEndMs, untilMs);
      if (endMs <= currentMs) continue;

      const fullDurationMs = isBirthBalance || isPartialOrClipped
        ? clip(fullStartMs + DASHA_YEARS[planet] * yearMs) - fullStartMs
        : endMs - currentMs;
      const antardashas = isPartialOrClipped
        ? buildAnchoredAntardashas(planet, fullStartMs, fullDurationMs, currentMs, endMs)
        : buildWindowAntardashas(planet, currentMs, endMs);

      mahadashas.push({
        planet,
        start: new Date(currentMs).toISOString(),
        end: new Date(endMs).toISOString(),
        antardashas
      });
      currentMs = endMs;
      emitted = true;
    }
    if (!emitted) break;
  }

  return {
    moonSiderealLongitude: input.moonSiderealLongitude,
    nakshatra: anchor.nakshatra,
    nakshatraLord: anchor.nakshatraLord,
    nakshatraProgress: anchor.nakshatraProgress,
    mahadashas
  };
}

function clip(milliseconds: number): number {
  return new Date(milliseconds).getTime();
}

function rotateFrom(start: PlanetName): readonly PlanetName[] {
  const index = DASHA_SEQUENCE.indexOf(start);
  return [...DASHA_SEQUENCE.slice(index), ...DASHA_SEQUENCE.slice(0, index)];
}

function buildWindowAntardashas(
  mdPlanet: PlanetName,
  startMs: number,
  endMs: number
): readonly ReferenceAntardashaPeriod[] {
  const adSequence = rotateFrom(mdPlanet);
  const durationMs = endMs - startMs;
  const result: ReferenceAntardashaPeriod[] = [];
  let cursor = startMs;
  for (let index = 0; index < adSequence.length && cursor < endMs; index++) {
    const planet = adSequence[index];
    const next = index === adSequence.length - 1
      ? endMs
      : Math.min(endMs, clip(cursor + durationMs * DASHA_YEARS[planet] / 120));
    if (next <= cursor) continue;
    result.push({
      planet,
      start: new Date(cursor).toISOString(),
      end: new Date(next).toISOString(),
      pratyantardashas: buildWindowPratyantardashas(planet, cursor, next)
    });
    cursor = next;
  }
  return result;
}

function buildWindowPratyantardashas(
  adPlanet: PlanetName,
  startMs: number,
  endMs: number
): readonly ReferencePratyantardashaPeriod[] {
  const pdSequence = rotateFrom(adPlanet);
  const durationMs = endMs - startMs;
  const result: ReferencePratyantardashaPeriod[] = [];
  let cursor = startMs;
  for (let index = 0; index < pdSequence.length && cursor < endMs; index++) {
    const planet = pdSequence[index];
    const next = index === pdSequence.length - 1
      ? endMs
      : Math.min(endMs, clip(cursor + durationMs * DASHA_YEARS[planet] / 120));
    if (next <= cursor) continue;
    result.push({
      planet,
      start: new Date(cursor).toISOString(),
      end: new Date(next).toISOString()
    });
    cursor = next;
  }
  return result;
}

function buildAnchoredAntardashas(
  mdPlanet: PlanetName,
  fullStartMs: number,
  fullDurationMs: number,
  windowStartMs: number,
  windowEndMs: number
): readonly ReferenceAntardashaPeriod[] {
  if (fullDurationMs <= 0 || windowEndMs <= windowStartMs) return [];
  const adSequence = rotateFrom(mdPlanet);
  const result: ReferenceAntardashaPeriod[] = [];
  let cursor = fullStartMs;
  for (let index = 0; index < adSequence.length && cursor < windowEndMs; index++) {
    const planet = adSequence[index];
    const fullEnd = index === adSequence.length - 1
      ? fullStartMs + fullDurationMs
      : clip(cursor + fullDurationMs * DASHA_YEARS[planet] / 120);
    const start = Math.max(cursor, windowStartMs);
    const end = Math.min(fullEnd, windowEndMs);
    if (end > start) {
      const fullAdDuration = fullEnd - cursor;
      result.push({
        planet,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        pratyantardashas: buildAnchoredPratyantardashas(
          planet, cursor, fullAdDuration, start, end
        )
      });
    }
    cursor = fullEnd;
  }
  return result;
}

function buildAnchoredPratyantardashas(
  adPlanet: PlanetName,
  fullStartMs: number,
  fullDurationMs: number,
  windowStartMs: number,
  windowEndMs: number
): readonly ReferencePratyantardashaPeriod[] {
  if (fullDurationMs <= 0 || windowEndMs <= windowStartMs) return [];
  const pdSequence = rotateFrom(adPlanet);
  const result: ReferencePratyantardashaPeriod[] = [];
  let cursor = fullStartMs;
  for (let index = 0; index < pdSequence.length && cursor < windowEndMs; index++) {
    const planet = pdSequence[index];
    const fullEnd = index === pdSequence.length - 1
      ? fullStartMs + fullDurationMs
      : clip(cursor + fullDurationMs * DASHA_YEARS[planet] / 120);
    const start = Math.max(cursor, windowStartMs);
    const end = Math.min(fullEnd, windowEndMs);
    if (end > start) {
      result.push({
        planet,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString()
      });
    }
    cursor = fullEnd;
  }
  return result;
}
