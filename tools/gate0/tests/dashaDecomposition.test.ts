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
    expect(md.antardashas.map(ad =>
      `${ad.planet}: ${ad.pratyantardashas.map(pd => `${pd.planet} ${pd.end}`).join(' | ')}`
    )).toEqual([
      'KETU: KETU 2000-01-09T16:48:04.500Z | VENUS 2000-02-03T13:22:34.500Z | SUN 2000-02-11T00:20:55.500Z | MOON 2000-02-23T10:38:10.500Z | MARS 2000-03-03T03:26:15.000Z | RAHU 2000-03-25T12:21:18.000Z | JUPITER 2000-04-14T09:36:54.000Z | SATURN 2000-05-08T00:21:40.500Z | MERCURY 2000-05-29T03:27:00.000Z',
      'VENUS: VENUS 2000-08-08T03:57:00.000Z | SUN 2000-08-29T11:18:00.000Z | MOON 2000-10-03T23:33:00.000Z | MARS 2000-10-28T20:07:30.000Z | RAHU 2000-12-31T18:10:30.000Z | JUPITER 2001-02-26T13:46:30.000Z | SATURN 2001-05-05T01:03:00.000Z | MERCURY 2001-07-04T09:52:30.000Z | KETU 2001-07-29T06:27:00.000Z',
      'SUN: SUN 2001-08-04T15:51:18.000Z | MOON 2001-08-15T07:31:48.000Z | MARS 2001-08-22T18:30:09.000Z | RAHU 2001-09-10T22:43:03.000Z | JUPITER 2001-09-27T23:47:51.000Z | SATURN 2001-10-18T05:34:48.000Z | MERCURY 2001-11-05T08:13:39.000Z | KETU 2001-11-12T19:12:00.000Z | VENUS 2001-12-04T02:33:00.000Z',
      'MOON: MOON 2001-12-21T20:40:30.000Z | MARS 2002-01-03T06:57:45.000Z | RAHU 2002-02-04T05:59:15.000Z | JUPITER 2002-03-04T15:47:15.000Z | SATURN 2002-04-07T09:25:30.000Z | MERCURY 2002-05-07T13:50:15.000Z | KETU 2002-05-20T00:07:30.000Z | VENUS 2002-06-24T12:22:30.000Z | SUN 2002-07-05T04:03:00.000Z',
      'MARS: MARS 2002-07-13T20:51:04.500Z | RAHU 2002-08-05T05:46:07.500Z | JUPITER 2002-08-25T03:01:43.500Z | SATURN 2002-09-17T17:46:30.000Z | MERCURY 2002-10-08T20:51:49.500Z | KETU 2002-10-17T13:39:54.000Z | VENUS 2002-11-11T10:14:24.000Z | SUN 2002-11-18T21:12:45.000Z | MOON 2002-12-01T07:30:00.000Z',
      'RAHU: RAHU 2003-01-27T20:08:42.000Z | JUPITER 2003-03-19T23:23:06.000Z | SATURN 2003-05-19T16:43:57.000Z | MERCURY 2003-07-13T00:40:30.000Z | KETU 2003-08-04T09:35:33.000Z | VENUS 2003-10-07T07:38:33.000Z | SUN 2003-10-26T11:51:27.000Z | MOON 2003-11-27T10:52:57.000Z | MARS 2003-12-19T19:48:00.000Z',
      'JUPITER: JUPITER 2004-02-03T06:40:48.000Z | SATURN 2004-03-28T06:06:00.000Z | MERCURY 2004-05-15T13:09:36.000Z | KETU 2004-06-04T10:25:12.000Z | VENUS 2004-07-31T06:01:12.000Z | SUN 2004-08-17T07:06:00.000Z | MOON 2004-09-14T16:54:00.000Z | MARS 2004-10-04T14:09:36.000Z | RAHU 2004-11-24T17:24:00.000Z',
      'SATURN: SATURN 2005-01-27T19:42:40.500Z | MERCURY 2005-03-26T04:05:42.000Z | KETU 2005-04-18T18:50:28.500Z | VENUS 2005-06-25T06:06:58.500Z | SUN 2005-07-15T11:53:55.500Z | MOON 2005-08-18T05:32:10.500Z | MARS 2005-09-10T20:16:57.000Z | RAHU 2005-11-10T13:37:48.000Z | JUPITER 2006-01-03T13:03:00.000Z',
      'MERCURY: MERCURY 2006-02-23T20:33:04.500Z | KETU 2006-03-16T23:38:24.000Z | VENUS 2006-05-16T08:27:54.000Z | SUN 2006-06-03T11:06:45.000Z | MOON 2006-07-03T15:31:30.000Z | MARS 2006-07-24T18:36:49.500Z | RAHU 2006-09-17T02:33:22.500Z | JUPITER 2006-11-04T09:36:58.500Z | SATURN 2006-12-31T18:00:00.000Z'
    ]);
  });
});
