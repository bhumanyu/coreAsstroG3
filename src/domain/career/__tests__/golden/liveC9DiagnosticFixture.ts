import { Planet } from '../../../../types';
import { CANONICAL_BIRTH_DETAILS } from '../../../../test/fixtures/canonicalChart';
import type { VimshottariTimeline } from '../../../../engine/dasha/vimshottari';

export const LIVE_C9_DIAGNOSTIC_FIXTURE = Object.freeze({
  birthDetails: CANONICAL_BIRTH_DETAILS,
  mahadasha: Planet.JUPITER,
  antardasha: Planet.MERCURY,
  pratyantardasha: Planet.VENUS
});

export function resolveLiveC9DiagnosticAsOf(timeline: VimshottariTimeline): string {
  const mahadasha = timeline.mahadashas.find(period => period.planet === LIVE_C9_DIAGNOSTIC_FIXTURE.mahadasha);
  const antardasha = mahadasha?.antardashas.find(period => period.planet === LIVE_C9_DIAGNOSTIC_FIXTURE.antardasha);
  const pratyantardasha = antardasha?.pratyantardashas.find(
    period => period.planet === LIVE_C9_DIAGNOSTIC_FIXTURE.pratyantardasha
  );

  if (!pratyantardasha) {
    throw new Error('The diagnostic chart does not contain the requested Jupiter/Mercury/Venus period.');
  }

  const start = new Date(pratyantardasha.start).getTime();
  const end = new Date(pratyantardasha.end).getTime();
  return new Date(start + (end - start) / 2).toISOString();
}
