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
import { calculateHoroscope } from '../../engine/astroEngine';
import { analyzeDashaInterpretation } from '../../engine/dashaInterpretation/dashaInterpretation';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

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
      expect(result.mahadashas[0].valid).toBe(true);
      expect(result.mahadashas[0].diagnostics).toEqual([]);

      // Check antardashas are linked to correct mahadasha
      const jupiterAdIds = result.antardashas
        .filter((ad) => ad.mahadashaId === result.mahadashas[0].id);
      expect(jupiterAdIds).toHaveLength(2);
      expect(jupiterAdIds.every(ad => ad.valid)).toBe(true);
      expect(jupiterAdIds.every(ad => ad.diagnostics.length === 0)).toBe(true);

      const saturnAdIds = result.antardashas
        .filter((ad) => ad.mahadashaId === result.mahadashas[1].id);
      expect(saturnAdIds).toHaveLength(1);
      expect(saturnAdIds.every(ad => ad.valid)).toBe(true);
      expect(saturnAdIds.every(ad => ad.diagnostics.length === 0)).toBe(true);
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
      expect(result.mahadashas.every(md => md.valid)).toBe(true);
      expect(result.antardashas.every(ad => ad.valid)).toBe(true);
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

    it('per-entry validity: invalid MD interval has valid: false with INVALID_MAHADASHA_INTERVAL', () => {
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

      expect(result.mahadashas).toHaveLength(1);
      expect(result.mahadashas[0].valid).toBe(false);
      expect(result.mahadashas[0].diagnostics).toContain('INVALID_MAHADASHA_INTERVAL');
      expect(result.diagnostics).toContain('INVALID_MAHADASHA_INTERVAL');
    });

    it('per-entry validity: invalid AD interval has valid: false with INVALID_ANTARDASHA_INTERVAL', () => {
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

      expect(result.antardashas).toHaveLength(1);
      expect(result.antardashas[0].valid).toBe(false);
      expect(result.antardashas[0].diagnostics).toContain('INVALID_ANTARDASHA_INTERVAL');
      expect(result.diagnostics).toContain('INVALID_ANTARDASHA_INTERVAL');
    });

    it('per-entry validity: AD outside MD has valid: false with ANTARDASHA_OUTSIDE_MAHADASHA', () => {
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

      expect(result.antardashas).toHaveLength(1);
      expect(result.antardashas[0].valid).toBe(false);
      expect(result.antardashas[0].diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');
      expect(result.diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');
    });

    it('per-entry validity: duplicate MD ID has valid: false with DUPLICATE_MAHADASHA_ID', () => {
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

      expect(result.mahadashas).toHaveLength(2);
      expect(result.mahadashas[0].valid).toBe(false);
      expect(result.mahadashas[0].diagnostics).toContain('DUPLICATE_MAHADASHA_ID');
      expect(result.mahadashas[1].valid).toBe(false);
      expect(result.mahadashas[1].diagnostics).toContain('DUPLICATE_MAHADASHA_ID');
      expect(result.diagnostics).toContain('DUPLICATE_MAHADASHA_ID');
    });

    it('per-entry validity: duplicate AD ID has valid: false with DUPLICATE_ANTARDASHA_ID', () => {
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

      expect(result.antardashas).toHaveLength(2);
      expect(result.antardashas[0].valid).toBe(false);
      expect(result.antardashas[0].diagnostics).toContain('DUPLICATE_ANTARDASHA_ID');
      expect(result.antardashas[1].valid).toBe(false);
      expect(result.antardashas[1].diagnostics).toContain('DUPLICATE_ANTARDASHA_ID');
      expect(result.diagnostics).toContain('DUPLICATE_ANTARDASHA_ID');
    });

    it('per-entry validity: non-canonical date format has valid: false with NON_CANONICAL_DATE_FORMAT', () => {
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
            start: '2020-01-01T00:00:00+00:00',
            end: '2036-01-01T00:00:00+00:00',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [],
            evidence: [],
            confidence: 'HIGH'
          }
        ],
        confidence: 'HIGH'
      };

      const result = listSelectableMdAdPeriods(report);

      expect(result.mahadashas).toHaveLength(1);
      expect(result.mahadashas[0].valid).toBe(false);
      expect(result.mahadashas[0].diagnostics).toContain('NON_CANONICAL_DATE_FORMAT');
      expect(result.diagnostics).toContain('NON_CANONICAL_DATE_FORMAT');
    });

    it('per-entry validity: valid entries have valid: true and empty diagnostics', () => {
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

      expect(result.mahadashas).toHaveLength(1);
      expect(result.mahadashas[0].valid).toBe(true);
      expect(result.mahadashas[0].diagnostics).toEqual([]);

      expect(result.antardashas).toHaveLength(1);
      expect(result.antardashas[0].valid).toBe(true);
      expect(result.antardashas[0].diagnostics).toEqual([]);

      expect(result.diagnostics).toEqual([]);
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
      expect(result.mahadashas[0].valid).toBe(true);
      expect(result.mahadashas[1].valid).toBe(true);
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
      expect(saturnAd1!.valid).toBe(true);
      expect(saturnAd2!.valid).toBe(true);
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

      const fakeMdId = 'v2|VIMSHOTTARI|md|NONEXISTENT|2000-01-01T00:00:00.000Z|2016-01-01T00:00:00.000Z';
      const fakeAdId = `v2|VIMSHOTTARI|ad|SATURN|2000-01-01T00:00:00.000Z|2002-01-01T00:00:00.000Z|${encodeURIComponent(fakeMdId)}`;

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

      const fakeAdId = `v2|VIMSHOTTARI|ad|NONEXISTENT|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${encodeURIComponent(selectable.mahadashas[0].id)}`;

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

    it('resolver revalidation: malformed MD interval returns INVALID_SELECTED_PERIOD', () => {
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

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD');
      }
    });

    it('resolver revalidation: malformed AD interval returns INVALID_SELECTED_PERIOD', () => {
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

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD');
      }
    });

    it('resolver revalidation: AD outside parent MD returns INVALID_SELECTED_PERIOD', () => {
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

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_SELECTED_PERIOD');
      }
    });

    it('duplicate MD ID: selection by duplicated MD ID returns AMBIGUOUS_MAHADASHA_ID', () => {
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
            planet: Planet.JUPITER,
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            natal: mockNatal(Planet.JUPITER),
            antardashas: [
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
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('AMBIGUOUS_MAHADASHA_ID');
      }
    });

    it('duplicate AD ID: selection by duplicated AD ID returns AMBIGUOUS_ANTARDASHA_ID', () => {
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

      const selectable = listSelectableMdAdPeriods(report);
      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: selectable.antardashas[0].id
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('AMBIGUOUS_ANTARDASHA_ID');
      }
    });

    it('parent-ID verification: forged parent encoding returns ANTARDASHA_NOT_FOUND', () => {
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
      // Forged parent: encode a non-existent parent MD ID
      const forgedParentId = 'v2|VIMSHOTTARI|md|NONEXISTENT|2000-01-01T00:00:00.000Z|2016-01-01T00:00:00.000Z';
      const forgedAdId = `v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${encodeURIComponent(forgedParentId)}`;

      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id,
        antardashaId: forgedAdId
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
      }
    });

    it('parent-ID verification: valid AD fields with wrong parent returns ANTARDASHA_NOT_CHILD_OF_MAHADASHA', () => {
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
                planet: Planet.MERCURY,
                start: '2036-01-01T00:00:00.000Z',
                end: '2039-01-01T00:00:00.000Z',
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
      // Try to select with Jupiter MD but encode Saturn MD as parent in AD ID
      const wrongParentId = selectable.mahadashas[1].id; // Saturn MD
      const forgedAdId = `v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${encodeURIComponent(wrongParentId)}`;

      const result = resolveSelectedMdAdPeriod(report, {
        mahadashaId: selectable.mahadashas[0].id, // Jupiter MD
        antardashaId: forgedAdId
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ANTARDASHA_NOT_CHILD_OF_MAHADASHA');
      }
    });

    it('parent-ID verification: correct parent resolves successfully', () => {
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
    });

    it('producer contract: deterministic IDs from canonical Vimshottari output', () => {
      // Build a real DashaInterpretationReport via the canonical engine pipeline
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const dashaInterpretation = analyzeDashaInterpretation({
        vimshottari: horoscope.vimshottari,
        planetInterpretation: horoscope.planetInterpretation,
        houseInterpretation: horoscope.houseInterpretation,
        functionalRoles: horoscope.functionalRoles,
        natalGrahaDrishti: horoscope.natalGrahaDrishti,
        yogas: horoscope.yogas ?? { yogas: [] },
        planetAnalysis: horoscope.planetAnalysis
      });

      // Call listSelectableMdAdPeriods twice and verify identical IDs
      const result1 = listSelectableMdAdPeriods(dashaInterpretation);
      const result2 = listSelectableMdAdPeriods(dashaInterpretation);

      expect(result1.mahadashas).toHaveLength(result2.mahadashas.length);
      expect(result1.antardashas).toHaveLength(result2.antardashas.length);

      for (let i = 0; i < result1.mahadashas.length; i++) {
        expect(result1.mahadashas[i].id).toBe(result2.mahadashas[i].id);
        expect(result1.mahadashas[i].valid).toBe(result2.mahadashas[i].valid);
        expect(result1.mahadashas[i].diagnostics).toEqual(result2.mahadashas[i].diagnostics);
      }

      for (let i = 0; i < result1.antardashas.length; i++) {
        expect(result1.antardashas[i].id).toBe(result2.antardashas[i].id);
        expect(result1.antardashas[i].valid).toBe(result2.antardashas[i].valid);
        expect(result1.antardashas[i].diagnostics).toEqual(result2.antardashas[i].diagnostics);
      }

      // Verify all entries use canonical ISO format (valid: true, no NON_CANONICAL_DATE_FORMAT)
      expect(result1.diagnostics).not.toContain('NON_CANONICAL_DATE_FORMAT');
      expect(result1.mahadashas.every(md => md.valid)).toBe(true);
      expect(result1.antardashas.every(ad => ad.valid)).toBe(true);
    });

    describe('PBA-02A: malformed selection IDs', () => {
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

      it('empty MD ID returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: '',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('empty AD ID returns ANTARDASHA_NOT_FOUND', () => {
        const selectable = listSelectableMdAdPeriods(report);
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: ''
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
        }
      });

      it('whitespace-only MD ID returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: '   ',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('wrong resolver version returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: 'v99|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v99|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v99%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('wrong dasha system returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: 'v2|OTHER_SYSTEM|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|OTHER_SYSTEM|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7COTHER_SYSTEM%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('wrong level segment (pd instead of md) returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: 'v2|VIMSHOTTARI|pd|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cpd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('truncated MD ID (too few segments) returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('truncated AD ID (too few segments) returns ANTARDASHA_NOT_FOUND', () => {
        const selectable = listSelectableMdAdPeriods(report);
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
        }
      });

      it('malformed percent-encoding in AD parent returns ANTARDASHA_NOT_FOUND', () => {
        const selectable = listSelectableMdAdPeriods(report);
        // Invalid percent-encoding: % is not followed by two hex digits
        const malformedAdId = `v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|%`;
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: malformedAdId
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
        }
      });

      it('syntactically valid but nonexistent MD ID returns MAHADASHA_NOT_FOUND', () => {
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: 'v2|VIMSHOTTARI|md|MARS|2000-01-01T00:00:00.000Z|2016-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2000-01-01T00:00:00.000Z|2002-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CMARS%7C2000-01-01T00%3A00%3A00.000Z%7C2016-01-01T00%3A00%3A00.000Z'
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('MAHADASHA_NOT_FOUND');
        }
      });

      it('syntactically valid but nonexistent AD ID returns ANTARDASHA_NOT_FOUND', () => {
        const selectable = listSelectableMdAdPeriods(report);
        const fakeAdId = `v2|VIMSHOTTARI|ad|MERCURY|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${encodeURIComponent(selectable.mahadashas[0].id)}`;
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: fakeAdId
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
        }
      });
    });

    describe('PBA-02C: parentage and containment', () => {
      it('AD belonging to another existing MD returns ANTARDASHA_NOT_CHILD_OF_MAHADASHA', () => {
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
                  planet: Planet.MERCURY,
                  start: '2036-01-01T00:00:00.000Z',
                  end: '2039-01-01T00:00:00.000Z',
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
        // Try to select Mercury AD (which belongs to Saturn MD) under Jupiter MD
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id, // Jupiter MD
          antardashaId: selectable.antardashas[1].id // Mercury AD (belongs to Saturn)
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_CHILD_OF_MAHADASHA');
        }
      });

      it('encoded AD parent referencing MD not in report returns ANTARDASHA_NOT_FOUND', () => {
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
        // Encode a non-existent parent MD ID
        const nonexistentParentId = 'v2|VIMSHOTTARI|md|MARS|2000-01-01T00:00:00.000Z|2016-01-01T00:00:00.000Z';
        const forgedAdId = `v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|${encodeURIComponent(nonexistentParentId)}`;

        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: forgedAdId
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
        }
      });

      it('AD interval outside MD: listing emits ANTARDASHA_OUTSIDE_MAHADASHA and resolution returns INVALID_SELECTED_PERIOD', () => {
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

        const selectable = listSelectableMdAdPeriods(report);

        // Listing should emit diagnostic and mark entry invalid
        expect(selectable.diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');
        expect(selectable.antardashas[0].valid).toBe(false);
        expect(selectable.antardashas[0].diagnostics).toContain('ANTARDASHA_OUTSIDE_MAHADASHA');

        // Resolution should return INVALID_SELECTED_PERIOD
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: selectable.antardashas[0].id
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('INVALID_SELECTED_PERIOD');
        }
      });

      it('duplicate AD within selected MD returns AMBIGUOUS_ANTARDASHA_ID', () => {
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

        const selectable = listSelectableMdAdPeriods(report);
        const result = resolveSelectedMdAdPeriod(report, {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: selectable.antardashas[0].id
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toBe('AMBIGUOUS_ANTARDASHA_ID');
        }
      });
    });

    describe('PBA-02D: non-mutation', () => {
      it('snapshot: report and selection remain unchanged after listing and resolution', () => {
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
        const selection = {
          mahadashaId: selectable.mahadashas[0].id,
          antardashaId: selectable.antardashas[0].id
        };

        const reportSnapshot = structuredClone(report);
        const selectionSnapshot = structuredClone(selection);

        listSelectableMdAdPeriods(report);
        resolveSelectedMdAdPeriod(report, selection);

        expect(report).toEqual(reportSnapshot);
        expect(selection).toEqual(selectionSnapshot);

        // Verify valid resolution still succeeds
        const result = resolveSelectedMdAdPeriod(report, selection);
        expect(result.ok).toBe(true);
      });
    });

    describe('PBA-02E: determinism', () => {
      it('two successive listSelectableMdAdPeriods calls return deep-equal results', () => {
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

        const result1 = listSelectableMdAdPeriods(report);
        const result2 = listSelectableMdAdPeriods(report);

        expect(result1).toEqual(result2);
      });
    });
  });
});
