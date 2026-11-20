import { describe, expect, it } from 'vitest';
import { decomposeDashaTimelines, type DashaTimelineLike } from '../lib/dashaComparison.ts';
import { calculateReferenceDasha } from '../lib/referenceDasha.ts';

function timeline(startMs: number, mdLord = 'KETU', pdLord = 'KETU'): DashaTimelineLike {
  const iso = (milliseconds: number) => new Date(milliseconds).toISOString();
  return {
    mahadashas: [{
      planet: mdLord,
      start: iso(startMs),
      end: iso(startMs + 1_000),
      antardashas: [{
        planet: 'VENUS',
        start: iso(startMs),
        end: iso(startMs + 1_000),
        pratyantardashas: [{
          planet: pdLord,
          start: iso(startMs),
          end: iso(startMs + 1_000)
        }]
      }]
    }]
  };
}

describe('Gate-0 dasha error decomposition', () => {
  it('attributes reference-Moon arithmetic and engine-Moon input deltas independently', () => {
    const result = decomposeDashaTimelines(
      timeline(0),
      timeline(2),
      timeline(5, 'KETU', 'SUN')
    );

    expect(result.arithmetic.MD.maxBoundaryErrorMs).toBe(2);
    expect(result.arithmetic.MD.meanBoundaryErrorMs).toBe(2);
    expect(result.arithmetic.MD.structuralAgreement).toBe(true);
    expect(result.moonInput.MD.maxBoundaryErrorMs).toBe(3);
    expect(result.moonInput.PD.maxBoundaryErrorMs).toBeNull();
    expect(result.moonInput.PD.boundaryTimestampsCompared).toBe(0);
    expect(result.moonInput.PD.structuralAgreement).toBe(false);
    expect(result.moonInput.PD.structuralDetail).toContain('SUN');
  });

  it('builds the independent R→R timeline from the recorded year convention', () => {
    const timeline = calculateReferenceDasha({
      birthDateTime: '2000-01-01T00:00:00.000Z',
      moonSiderealLongitude: 0,
      until: '2001-01-01T00:00:00.000Z',
      yearLengthDays: 365.25
    });

    expect(timeline.nakshatra).toBe('ASHWINI');
    expect(timeline.nakshatraLord).toBe('KETU');
    expect(timeline.mahadashas[0].planet).toBe('KETU');
    expect(timeline.mahadashas[0].start).toBe('2000-01-01T00:00:00.000Z');
    expect(timeline.mahadashas[0].antardashas[0].start)
      .toBe(timeline.mahadashas[0].start);
  });
});
