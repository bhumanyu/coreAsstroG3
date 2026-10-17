import { describe, it, expect } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type {
  DashaInterpretationReport,
  DashaPlanetActivation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  listSelectableMdAdPeriods,
  resolveSelectedMdAdPeriod,
  MD_AD_PERIOD_RESOLVER_VERSION
} from './selectedMdAdPeriod';

const mockNatal = (planet: Planet): DashaPlanetActivation =>
  ({
    planet,
    house: 1,
    sign: 'ARIES',
    ownedHouses: [],
    functionalRoles: [],
    castAspects: [],
    receivedAspects: [],
    yogaParticipation: [],
    houseEvidence: [],
    evidence: []
  }) as unknown as DashaPlanetActivation;

describe('selectedMdAdPeriod', () => {
  describe('listSelectableMdAdPeriods', () => {
    it('pair listing: enumerates all MD-AD pairs', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              },
              {
                planet: Planet.MERCURY,
                start: '2022-01-01T00:00:00.000Z',
                end: '2024-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.MERCURY),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.SATURN,
            start: '2036-01-01T00:00:00.000Z',
            end: '2055-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            antardashas: [
              {
                planet: Planet.VENUS,
                start: '2036-01-01T00:00:00.000Z',
                end: '2039-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.VENUS),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.mahadashas).toHaveLength(2);
      expect(result.antardashas).toHaveLength(3);
      expect(result.diagnostics).toHaveLength(0);

      // Check first mahadasha
      expect(result.mahadashas[0].planet).toBe(Planet.JUPITER);
      expect(result.mahadashas[0].start).toBe('2020-01-01T00:00:00.000Z');
      expect(result.mahadashas[0].end).toBe('2036-01-01T00:00:00.000Z');

      // Check antardashas are linked to correct mahadasha
      const jupiterAdIds = result.antardashas
        .filter((ad) => ad.mahadashaId === result.mahadashas[0].id);
      expect(jupiterAdIds).toHaveLength(2);

      const saturnAdIds = result.antardashas
        .filter((ad) => ad.mahadashaId === result.mahadashas[1].id);
      expect(saturnAdIds).toHaveLength(1);
    });

    it('no current-date filtering: lists past, current, and future periods', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2000-01-01T00:00:00.000Z',
            end: '2016-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2000-01-01T00:00:00.000Z',
                end: '2002-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.SATURN,
            start: '2016-01-01T00:00:00.000Z',
            end: '2035-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            antardashas: [
              {
                planet: Planet.MERCURY,
                start: '2016-01-01T00:00:00.000Z',
                end: '2018-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.MERCURY),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.MERCURY,
            start: '2035-01-01T00:00:00.000Z',
            end: '2052-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.MERCURY),
            antardashas: [
              {
                planet: Planet.VENUS,
                start: '2035-01-01T00:00:00.000Z',
                end: '2037-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.VENUS),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      // All periods should be listed regardless of date
      expect(result.mahadashas).toHaveLength(3);
      expect(result.antardashas).toHaveLength(3);
    });

    it('invalid MD interval diagnostics: detects invalid start/end', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: 'invalid-date',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.diagnostics).toContain('INVALID_MAHADASHA_INTERVAL');
    });

    it('invalid AD interval diagnostics: detects invalid start/end', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: 'invalid-date',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.diagnostics).toContain('INVALID_ANTARDASHA_INTERVAL');
    });

    it('AD outside MD: detects antardasha not contained in mahadasha', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2010-01-01T00:00:00.000Z',
                end: '2012-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');
    });

    it('duplicate mahadasha ID diagnostics', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.diagnostics).toContain('DUPLICATE_MAHADASHA_ID');
    });

    it('duplicate antardasha ID diagnostics', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              },
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.diagnostics).toContain('DUPLICATE_ANTARDASHA_ID');
    });

    it('deterministic IDs: same inputs produce same IDs', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result1 = listSelectableMdAdPeriods(report);
      const result2 = listSelectableMdAdPeriods(report);

      expect(result1.mahadashas[0].id).toBe(result2.mahadashas[0].id);
      expect(result1.antardashas[0].id).toBe(result2.antardashas[0].id);
    });

    it('distinct identities for repeated planets: same planet at different dates has different IDs', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2000-01-01T00:00:00.000Z',
            end: '2016-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.JUPITER,
            start: '2036-01-01T00:00:00.000Z',
            end: '2052-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.mahadashas[0].planet).toBe(result.mahadashas[1].planet);
      expect(result.mahadashas[0].id).not.toBe(result.mahadashas[1].id);
    });

    it('AD cannot be reused under another MD: AD IDs include parent MD ID', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.SATURN,
            start: '2036-01-01T00:00:00.000Z',
            end: '2055-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2036-01-01T00:00:00.000Z',
                end: '2039-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      // Both ADs are Saturn but have different IDs due to different parent MDs
      const saturnAd1 = result.antardashas.find(
        (ad) => ad.planet === Planet.SATURN && ad.mahadashaId === result.mahadashas[0].id
      );
      const saturnAd2 = result.antardashas.find(
        (ad) => ad.planet === Planet.SATURN && ad.mahadashaId === result.mahadashas[1].id
      );

      expect(saturnAd1).toBeDefined();
      expect(saturnAd2).toBeDefined();
      expect(saturnAd1!.id).not.toBe(saturnAd2!.id);
    });

    it('missing report: returns empty lists', () => {
      const result = listSelectableMdAdPeriods(null);
      expect(result.mahadashas).toEqual([]);
      expect(result.antardashas).toEqual([]);
      expect(result.diagnostics).toEqual([]);

      const result2 = listSelectableMdAdPeriods(undefined);
      expect(result2.mahadashas).toEqual([]);
      expect(result2.antardashas).toEqual([]);
      expect(result2.diagnostics).toEqual([]);
    });

    it('ID encoding includes version and system', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.mahadashas[0].id).toContain(MD_AD_PERIOD_RESOLVER_VERSION);
      expect(result.mahadashas[0].id).toContain(DashaSystem.VIMSHOTTARI);
      expect(result.mahadashas[0].id).toContain('|md|');
      expect(result.antardashas[0].id).toContain('|ad|');
    });
  });

  describe('resolveSelectedMdAdPeriod', () => {
    it('exact source-date preservation: interval uses exact source strings', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interval.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.interval.end).toBe('2022-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.end).toBe('2036-01-01T00:00:00.000Z');
      }
    });

    it('AD-interval selection: returns AD interval and parent MD info', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              },
              {
                planet: Planet.MERCURY,
                start: '2022-01-01T00:00:00.000Z',
                end: '2024-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.MERCURY),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[1].id
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interval.start).toBe('2022-01-01T00:00:00.000Z');
        expect(result.value.interval.end).toBe('2024-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.planet).toBe(Planet.JUPITER);
        expect(result.value.mahadashaNode.planet).toBe(Planet.JUPITER);
        expect(result.value.antardashaNode.planet).toBe(Planet.MERCURY);
      }
    });

    it('unknown MD: returns MAHADASHA_NOT_FOUND error', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const fakeMdId = 'v1|VIMSHOTTARI|md|NONEXISTENT|2000-01-01T00:00:00.000Z|2016-01-01T00:00:00.000Z';
      const fakeAdId = `v1|VIMSHOTTARI|ad|SATURN|2000-01-01T00:00:00.000Z|2002-01-01T00:00:00.000Z|${Buffer.from(fakeMdId).toString('base64url')}`;

      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: fakeMdId,
        antardashaId: fakeAdId
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('MAHADASHA_NOT_FOUND');
      }
    });

    it('AD from different MD: returns ANTARDASHA_NOT_CHILD_OF_MAHADASHA error', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          },
          {
            planet: Planet.SATURN,
            start: '2036-01-01T00:00:00.000Z',
            end: '2055-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2036-01-01T00:00:00.000Z',
                end: '2039-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const selectable = listSelectableMdAdPeriods(report);

      // Try to select Saturn AD from the Jupiter MD, but provide AD ID from Saturn MD
      // This AD (Saturn 2036-2039) exists in Saturn MD but not in Jupiter MD
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[1].id
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ANTARDASHA_NOT_CHILD_OF_MAHADASHA');
      }
    });

    it('unknown AD: returns ANTARDASHA_NOT_FOUND error', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const selectable = listSelectableMdAdPeriods(report);

      const fakeAdId = `v1|VIMSHOTTARI|ad|NONEXISTENT|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${Buffer.from(selectable.mahadashas[0].id).toString('base64url')}`;

      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: fakeAdId
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
      }
    });

    it('missing report: returns REPORT_UNAVAILABLE error', () => {
      const result = resolveSelectedMdAdPeriod(null, {
        mahadashaId: 'any-id',
        antardashaId: 'any-id'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('REPORT_UNAVAILABLE');
      }

      const result2 = resolveSelectedMdAdPeriod(undefined, {
        mahadashaId: 'any-id',
        antardashaId: 'any-id'
      });

      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error).toBe('REPORT_UNAVAILABLE');
      }
    });

    it('unsupported dasha system: returns UNSUPPORTED_DASHA_SYSTEM error', () => {
      const report: DashaInterpretationReport = {
        system: 'OTHER_SYSTEM' as DashaSystem,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [],
        confidence: 'HIGH'
      };

      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: 'any-id',
        antardashaId: 'any-id'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('UNSUPPORTED_DASHA_SYSTEM');
      }
    });

    it('no mutation of report: source report remains unchanged', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        current: {
          at: '2024-06-15T00:00:00.000Z',
          mahadasha: {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          antardasha: {
            planet: Planet.SATURN,
            start: '2020-01-01T00:00:00.000Z',
            end: '2022-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            pratyantardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          pratyantardasha: {
            planet: Planet.MERCURY,
            start: '2024-05-01T00:00:00.000Z',
            end: '2024-08-01T00:00:00.000Z',
            natal: mockNatal(Planet.MERCURY),
            evidence: [],
            confidence: 'HIGH'
          },
          evidence: [],
          confidence: 'HIGH'
        },
        activePeriods: {
          at: '2024-06-15T00:00:00.000Z',
          mahadasha: {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          antardasha: {
            planet: Planet.SATURN,
            start: '2020-01-01T00:00:00.000Z',
            end: '2022-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.SATURN),
            pratyantardashas: [],
            evidence: [],
            confidence: 'HIGH'
          },
          pratyantardasha: {
            planet: Planet.MERCURY,
            start: '2024-05-01T00:00:00.000Z',
            end: '2024-08-01T00:00:00.000Z',
            natal: mockNatal(Planet.MERCURY),
            evidence: [],
            confidence: 'HIGH'
          },
          evidence: [],
          confidence: 'HIGH'
        },
        confidence: 'HIGH'
      };

      const reportClone = JSON.parse(JSON.stringify(report));

      const selectable = listSelectableMdAdPeriods(report);
      resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(report).toEqual(reportClone);
    });

    it('read-only references: mahadashaNode and antardashaNode are original nodes', () => {
      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [
          {
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
              {
                planet: Planet.SATURN,
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                natal: mockNatal(Planet.SATURN),
                pratyantardashas: [],
                evidence: [],
                confidence: 'HIGH'
              }
            ],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.mahadashaNode).toBe(report.mahadashas[0]);
        expect(result.value.antardashaNode).toBe(report.mahadashas[0].antardashas[0]);
      }
    });
  });
});
