import { describe, expect, it } from 'vitest';
import {
  compareDashaTimelines,
  decomposeDashaTimelines,
  type DashaTimelineLike
} from '../lib/dashaComparison.ts';
import { calculateReferenceDasha } from '../lib/referenceDasha.ts';

function timeline(
  startMs: number,
  mdLord = 'KETU',
  adLord = 'VENUS',
  pdLord = 'KETU'
): DashaTimelineLike {
  const iso = (milliseconds: number) => new Date(milliseconds).toISOString();
  return {
    mahadashas: [{
      planet: mdLord,
      start: iso(startMs),
      end: iso(startMs + 1_000),
      antardashas: [{
        planet: adLord,
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

function childSequencesUnder(mdLord: string): DashaTimelineLike {
  const start = '2000-01-01T00:00:00.000Z';
  const end = '2000-02-01T00:00:00.000Z';
  return {
    mahadashas: [{
      planet: mdLord,
      start,
      end,
      antardashas: ['VENUS', 'SUN'].map(adLord => ({
        planet: adLord,
        start,
        end,
        pratyantardashas: ['KETU', 'MOON'].map(pdLord => ({
          planet: pdLord,
          start,
          end
        }))
      }))
    }]
  };
}

describe('Gate-0 dasha error decomposition', () => {
  it('attributes reference-Moon arithmetic and engine-Moon input deltas independently', () => {
    const result = decomposeDashaTimelines(
      timeline(0),
      timeline(2),
      timeline(5, 'KETU', 'VENUS', 'SUN')
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

  it('requires descendant identity to match every ancestor lord', () => {
    const result = compareDashaTimelines(
      childSequencesUnder('KETU'),
      childSequencesUnder('VENUS')
    );

    expect(result.MD.structuralAgreement).toBe(false);
    expect(result.AD.structuralAgreement).toBe(false);
    expect(result.AD.matchedPeriods).toBe(0);
    expect(result.AD.unmatchedExpectedPeriods).toBe(2);
    expect(result.AD.unmatchedActualPeriods).toBe(2);
    expect(result.AD.boundaryTimestampsCompared).toBe(0);
    expect(result.PD.structuralAgreement).toBe(false);
    expect(result.PD.matchedPeriods).toBe(0);
    expect(result.PD.unmatchedExpectedPeriods).toBe(4);
    expect(result.PD.unmatchedActualPeriods).toBe(4);
    expect(result.PD.boundaryTimestampsCompared).toBe(0);
  });

  it('agrees when the complete MD/AD/PD lord hierarchy matches', () => {
    const result = compareDashaTimelines(
      timeline(0, 'KETU', 'VENUS', 'SUN'),
      timeline(0, 'KETU', 'VENUS', 'SUN')
    );

    expect(result.MD.structuralAgreement).toBe(true);
    expect(result.AD.structuralAgreement).toBe(true);
    expect(result.PD.structuralAgreement).toBe(true);
    expect(result.PD.matchedPeriods).toBe(1);
    expect(result.PD.boundaryTimestampsCompared).toBe(2);
  });

  it('builds the independent R→R timeline from the recorded year convention', () => {
    const timeline = calculateReferenceDasha({
      birthDateTime: '2000-01-01T00:00:00.000Z',
      moonSiderealLongitude: 0,
      until: '2006-12-31T18:00:00.000Z',
      yearLengthDays: 365.25
    });

    expect(timeline.nakshatra).toBe('ASHWINI');
    expect(timeline.nakshatraLord).toBe('KETU');
    expect(timeline.mahadashas[0].planet).toBe('KETU');
    expect(timeline.mahadashas[0].start).toBe('2000-01-01T00:00:00.000Z');
    expect(timeline.mahadashas[0].antardashas[0].start)
      .toBe(timeline.mahadashas[0].start);
  });

  it('matches hand-computed full-Ketu MD, AD, and PD known-answer boundaries', () => {
    const result = calculateReferenceDasha({
      birthDateTime: '2000-01-01T00:00:00.000Z',
      moonSiderealLongitude: 0,
      until: '2006-12-31T18:00:00.000Z',
      yearLengthDays: 365.25
    });
    const md = result.mahadashas[0];

    expect(md.planet).toBe('KETU');
    expect([md.start, md.end]).toEqual([
      '2000-01-01T00:00:00.000Z',
      '2006-12-31T18:00:00.000Z'
    ]);
    expect(md.antardashas.map(period => [period.planet, period.end])).toEqual([
      ['KETU', '2000-05-29T03:27:00.000Z'],
      ['VENUS', '2001-07-29T06:27:00.000Z'],
      ['SUN', '2001-12-04T02:33:00.000Z'],
      ['MOON', '2002-07-05T04:03:00.000Z'],
      ['MARS', '2002-12-01T07:30:00.000Z'],
      ['RAHU', '2003-12-19T19:48:00.000Z'],
      ['JUPITER', '2004-11-24T17:24:00.000Z'],
      ['SATURN', '2006-01-03T13:03:00.000Z'],
      ['MERCURY', '2006-12-31T18:00:00.000Z']
    ]);
    expect(md.antardashas[0].pratyantardashas.map(period => [period.planet, period.end])).toEqual([
      ['KETU', '2000-01-09T16:48:04.500Z'],
      ['VENUS', '2000-02-03T13:22:34.500Z'],
      ['SUN', '2000-02-11T00:20:55.500Z'],
      ['MOON', '2000-02-23T10:38:10.500Z'],
      ['MARS', '2000-03-03T03:26:15.000Z'],
      ['RAHU', '2000-03-25T12:21:18.000Z'],
      ['JUPITER', '2000-04-14T09:36:54.000Z'],
      ['SATURN', '2000-05-08T00:21:40.500Z'],
      ['MERCURY', '2000-05-29T03:27:00.000Z']
    ]);
  });
});
