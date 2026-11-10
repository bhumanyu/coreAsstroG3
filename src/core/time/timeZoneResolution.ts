export type TimeZoneResolutionStatus = 'RESOLVED' | 'USER_SELECTED' | 'UNRESOLVED' | 'INVALID';

export function getTimeZoneResolutionStatus(
  timeZone: string | undefined,
  source: 'PROVIDER' | 'USER' = 'PROVIDER'
): TimeZoneResolutionStatus {
  if (!timeZone || timeZone.trim().length === 0) return 'UNRESOLVED';
  if (!isValidIanaTimeZone(timeZone)) return 'INVALID';
  return source === 'USER' ? 'USER_SELECTED' : 'RESOLVED';
}

export type LocalDateTimeResolutionStatus = 'UNIQUE' | 'AMBIGUOUS' | 'NONEXISTENT' | 'INVALID';

export interface LocalDateTimeCandidate {
  readonly instant: string;
  readonly offsetMinutes: number;
  readonly offsetLabel: string;
}

export type LocalDateTimeResolution =
  | { readonly status: 'UNIQUE'; readonly candidates: readonly [LocalDateTimeCandidate] }
  | { readonly status: 'AMBIGUOUS'; readonly candidates: readonly [LocalDateTimeCandidate, LocalDateTimeCandidate] }
  | { readonly status: 'NONEXISTENT'; readonly candidates: readonly [] }
  | { readonly status: 'INVALID'; readonly candidates: readonly []; readonly reason: string };

interface WallClockParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const WALL_CLOCK_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== 'string' || timeZone.trim() !== timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function resolveLocalDateTime(
  wallClock: string,
  timeZone: string
): LocalDateTimeResolution {
  if (!isValidIanaTimeZone(timeZone)) {
    return { status: 'INVALID', candidates: [], reason: 'A valid IANA timezone is required.' };
  }

  const parsed = parseWallClock(wallClock);
  if (!parsed) {
    return { status: 'INVALID', candidates: [], reason: 'Enter a valid local date and time.' };
  }

  const naiveUtc = createUtcMillis(parsed);
  const offsets = new Set<number>();

  // Collect all offsets around the target wall-clock instant. Sampling both sides
  // of transitions is necessary to identify repeated and skipped DST wall times.
  for (let hours = -72; hours <= 72; hours += 3) {
    const sample = naiveUtc + hours * 60 * 60 * 1000;
    offsets.add(getOffsetAt(sample, timeZone));
  }

  const candidates = [...offsets]
    .map((offsetMs) => naiveUtc - offsetMs)
    .filter((candidate) => matchesWallClock(candidate, parsed, timeZone))
    .sort((a, b) => a - b);

  const uniqueCandidates = [...new Set(candidates)].map((instant) =>
    toCandidate(instant, timeZone)
  );

  if (uniqueCandidates.length === 0) {
    return { status: 'NONEXISTENT', candidates: [] };
  }
  if (uniqueCandidates.length === 1) {
    return { status: 'UNIQUE', candidates: [uniqueCandidates[0]] };
  }
  if (uniqueCandidates.length === 2) {
    return { status: 'AMBIGUOUS', candidates: [uniqueCandidates[0], uniqueCandidates[1]] };
  }
  return { status: 'INVALID', candidates: [], reason: 'Timezone resolution produced an unsupported number of instants.' };
}

function parseWallClock(value: string): WallClockParts | undefined {
  const match = WALL_CLOCK_PATTERN.exec(value);
  if (!match) return undefined;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const parts: WallClockParts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
    second: secondText === undefined ? 0 : Number(secondText)
  };
  if (parts.year < 1 || parts.year > 9999 || parts.month < 1 || parts.month > 12
    || parts.day < 1 || parts.hour < 0 || parts.hour > 23
    || parts.minute < 0 || parts.minute > 59 || parts.second < 0 || parts.second > 59) {
    return undefined;
  }
  const daysInMonth = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  if (parts.day > daysInMonth) return undefined;
  return parts;
}

function createUtcMillis(parts: WallClockParts): number {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  return date.getTime();
}

function zonedParts(instant: number, timeZone: string): WallClockParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date(instant));
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
    second: value('second')
  };
}

function getOffsetAt(instant: number, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  return createUtcMillis(parts) - instant;
}

function matchesWallClock(instant: number, expected: WallClockParts, timeZone: string): boolean {
  const actual = zonedParts(instant, timeZone);
  return actual.year === expected.year && actual.month === expected.month && actual.day === expected.day
    && actual.hour === expected.hour && actual.minute === expected.minute && actual.second === expected.second;
}

function toCandidate(instant: number, timeZone: string): LocalDateTimeCandidate {
  const date = new Date(instant);
  const offsetMs = getOffsetAt(instant, timeZone);
  const offsetMinutes = offsetMs / 60_000;
  const absoluteOffset = Math.abs(offsetMinutes);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = Math.floor(absoluteOffset / 60).toString().padStart(2, '0');
  const minutes = Math.floor(absoluteOffset % 60).toString().padStart(2, '0');
  return {
    instant: date.toISOString(),
    offsetMinutes,
    offsetLabel: `UTC${sign}${hours}:${minutes}`
  };
}
