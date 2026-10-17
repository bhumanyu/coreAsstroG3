import { describe, it, expect } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type {
  DashaInterpretationReport,
  DashaPlanetActivation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  createSelectedPeriodActivationContext,
  SELECTED_PERIOD_CONTEXT_VERSION
} from './selectedPeriodActivationContext';
import {
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

describe('selectedPeriodActivationContext', () => {
  describe('canonical node references', () => {
    it('returns mahadashaNode and antardashaNode unchanged from report', () => {
      const antardashaNode: any = {
        planet: Planet.SATURN,
        start: '2020-01-01T00:00:00.000Z',
        end: '2022-01-01T00:00:00.000Z',
        natal: mockNatal(Planet.SATURN),
        pratyantardashas: [],
        evidence: [],
        confidence: 'HIGH'
      };

      const mahadashaNode: any = {
        planet: Planet.JUPITER,
        start: '2020-01-01T00:00:00.000Z',
        end: '2036-01-01T00:00:00.000Z',
        natal: mockNatal(Planet.JUPITER),
        antardashas: [antardashaNode],
        evidence: [],
        confidence: 'HIGH'
      };

      const report: DashaInterpretationReport = {
        system: DashaSystem.VIMSHOTTARI,
        birthAnchor: {
          nakshatra: 'Ashwini',
          nakshatraLord: Planet.KETU,
          nakshatraProgress: 0.5,
          remainingFraction: 0.5
        },
        mahadashas: [mahadashaNode],
        confidence: 'HIGH'
      };

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.mahadashaNode).toBe(mahadashaNode);
        expect(result.value.antardashaNode).toBe(antardashaNode);
      }
    });
  });

  describe('exact interval string preservation', () => {
    it('preserves exact start and end strings from the antardasha', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interval.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.interval.end).toBe('2022-01-01T00:00:00.000Z');
      }
    });
  });

  describe('temporal classification', () => {
    it('classifies as FUTURE when asOf < start', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2019-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('FUTURE');
      }
    });

    it('classifies as CURRENT when start <= asOf < end', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('classifies as PAST when asOf >= end', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2023-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('PAST');
      }
    });

    it('exact start boundary → CURRENT (asOf == start)', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2020-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('exact end boundary → PAST (asOf == end)', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2022-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('PAST');
      }
    });
  });

  describe('error handling', () => {
    it('returns INVALID_ANALYSIS_AS_OF for unparseable analysisAsOf', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: 'invalid-date'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_ANALYSIS_AS_OF');
      }
    });

    it('propagates MAHADASHA_NOT_FOUND from PBA-02', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|SATURN|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|MERCURY|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CSATURN%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('MAHADASHA_NOT_FOUND');
      }
    });

    it('propagates AMBIGUOUS_MAHADASHA_ID from PBA-02', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('AMBIGUOUS_MAHADASHA_ID');
      }
    });

    it('propagates ANTARDASHA_NOT_FOUND from PBA-02', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('ANTARDASHA_NOT_FOUND');
      }
    });
  });

  describe('selectedPeriodId stability', () => {
    it('generates stable selectedPeriodId across different analysisAsOf values', () => {
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

      const selection = {
        mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
        antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
      };

      const result1 = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      const result2 = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2025-01-01T00:00:00.000Z'
      });

      const result3 = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2019-01-01T00:00:00.000Z'
      });

      expect(result1.ok).toBe(true);
      expect(result2.ok).toBe(true);
      expect(result3.ok).toBe(true);

      if (result1.ok && result2.ok && result3.ok) {
        expect(result1.value.selectedPeriodId).toBe(result2.value.selectedPeriodId);
        expect(result2.value.selectedPeriodId).toBe(result3.value.selectedPeriodId);
        expect(result1.value.selectedPeriodId).not.toContain('2021');
        expect(result1.value.selectedPeriodId).not.toContain('2025');
        expect(result1.value.selectedPeriodId).not.toContain('2019');
      }
    });
  });

  describe('immutability', () => {
    it('does not mutate report.current or report.activePeriods (invariant check)', () => {
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

      // Store original references
      const originalMahadashas = report.mahadashas;
      const originalMahadasha = report.mahadashas[0];
      const originalAntardashas = report.mahadashas[0].antardashas;
      const originalAntardasha = report.mahadashas[0].antardashas[0];

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);

      // Verify references are unchanged
      expect(report.mahadashas).toBe(originalMahadashas);
      expect(report.mahadashas[0]).toBe(originalMahadasha);
      expect(report.mahadashas[0].antardashas).toBe(originalAntardashas);
      expect(report.mahadashas[0].antardashas[0]).toBe(originalAntardasha);
    });

    it('returns frozen context object', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.isFrozen(result.value)).toBe(true);
        expect(Object.isFrozen(result.value.interval)).toBe(true);
        expect(Object.isFrozen(result.value.mahadasha)).toBe(true);
        expect(Object.isFrozen(result.value.antardasha)).toBe(true);
      }
    });
  });

  describe('context structure', () => {
    it('includes all required fields with correct values', () => {
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

      const result = createSelectedPeriodActivationContext({
        report,
        selection: {
          mahadashaId: 'v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z',
          antardashaId: 'v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z'
        },
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.contextVersion).toBe(SELECTED_PERIOD_CONTEXT_VERSION);
        expect(result.value.dashaSystem).toBe(DashaSystem.VIMSHOTTARI);
        expect(result.value.level).toBe('MD_AD');
        expect(result.value.resolverVersion).toBe(MD_AD_PERIOD_RESOLVER_VERSION);
        expect(result.value.analysisAsOf).toBe('2021-01-01T00:00:00.000Z');
        expect(result.value.intervalSemantics).toBe('[start,end)');
        expect(result.value.interval.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.interval.end).toBe('2022-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.id).toBe('v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.planet).toBe(Planet.JUPITER);
        expect(result.value.mahadasha.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.mahadasha.end).toBe('2036-01-01T00:00:00.000Z');
        expect(result.value.antardasha.id).toBe('v2|VIMSHOTTARI|ad|SATURN|2020-01-01T00:00:00.000Z|2022-01-01T00:00:00.000Z|v2%7CVIMSHOTTARI%7Cmd%7CJUPITER%7C2020-01-01T00%3A00%3A00.000Z%7C2036-01-01T00%3A00%3A00.000Z');
        expect(result.value.antardasha.mahadashaId).toBe('v2|VIMSHOTTARI|md|JUPITER|2020-01-01T00:00:00.000Z|2036-01-01T00:00:00.000Z');
        expect(result.value.antardasha.planet).toBe(Planet.SATURN);
        expect(result.value.antardasha.start).toBe('2020-01-01T00:00:00.000Z');
        expect(result.value.antardasha.end).toBe('2022-01-01T00:00:00.000Z');
        expect(result.value.mahadashaNode).toBeDefined();
        expect(result.value.antardashaNode).toBeDefined();
      }
    });
  });
});
