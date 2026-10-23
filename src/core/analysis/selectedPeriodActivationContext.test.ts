import { describe, it, expect } from 'vitest';
import { Planet, DashaSystem } from '../../types';
import type {
  DashaInterpretationReport,
  DashaPlanetActivation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import {
  createSelectedPeriodActivationContext,
  SELECTED_PERIOD_CONTEXT_VERSION,
  validateSelectedPeriodContext,
  createSelectedPeriodId
} from './selectedPeriodActivationContext';
import {
  resolveSelectedMdAdPeriod,
  MD_AD_PERIOD_RESOLVER_VERSION,
  listSelectableMdAdPeriods
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

/**
 * Shared fixture helper for constructing a test report.
 * Returns a report with Jupiter mahadasha (2020-2036) containing Saturn antardasha (2020-2022).
 */
function makeReport(): DashaInterpretationReport {
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

  return {
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
}

/**
 * Helper to derive selection IDs from a report.
 * Returns the mahadasha and antardasha IDs for the first valid MD-AD pair.
 */
function selectionFor(report: DashaInterpretationReport): {
  mahadashaId: string;
  antardashaId: string;
} {
  const selectable = listSelectableMdAdPeriods(report);
  const validMd = selectable.mahadashas.find((md) => md.valid);
  if (!validMd) {
    throw new Error('No valid mahadasha found in report');
  }
  const validAd = selectable.antardashas.find(
    (ad) => ad.valid && ad.mahadashaId === validMd.id
  );
  if (!validAd) {
    throw new Error('No valid antardasha found for mahadasha');
  }
  return {
    mahadashaId: validMd.id,
    antardashaId: validAd.id
  };
}

describe('selectedPeriodActivationContext', () => {
  describe('canonical node references', () => {
    it('returns mahadashaNode and antardashaNode unchanged from report', () => {
      const report = makeReport();
      const mahadashaNode = report.mahadashas[0];
      const antardashaNode = report.mahadashas[0].antardashas[0];
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2019-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('FUTURE');
      }
    });

    it('classifies as CURRENT when start <= asOf < end', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('classifies as PAST when asOf >= end', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2023-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('PAST');
      }
    });

    it('exact start boundary → CURRENT (asOf == start)', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2020-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('exact end boundary → PAST (asOf == end)', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2022-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('PAST');
      }
    });

    it('literal-interval: asOf < start → FUTURE', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2019-12-31T23:59:59.999Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('FUTURE');
      }
    });

    it('literal-interval: asOf === start → CURRENT', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2020-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('literal-interval: asOf === end-1ms → CURRENT', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-12-31T23:59:59.999Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('CURRENT');
      }
    });

    it('literal-interval: asOf === end → PAST', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2022-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.temporalRelation).toBe('PAST');
      }
    });

    it('literal-interval: invalid analysisAsOf → INVALID_ANALYSIS_AS_OF error', () => {
      // An unparseable analysisAsOf date results in a failed result with INVALID_ANALYSIS_AS_OF error.
      // This is a validation failure, not a temporalRelation: 'UNKNOWN' case.
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: 'not-a-valid-date'
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('INVALID_ANALYSIS_AS_OF');
      }
    });
  });

  describe('error handling', () => {
    it('returns INVALID_ANALYSIS_AS_OF for unparseable analysisAsOf', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
      const report = makeReport();
      const selection = selectionFor(report);

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
      const report = makeReport();
      const selection = selectionFor(report);

      // Store original references
      const originalMahadashas = report.mahadashas;
      const originalMahadasha = report.mahadashas[0];
      const originalAntardashas = report.mahadashas[0].antardashas;
      const originalAntardasha = report.mahadashas[0].antardashas[0];

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
    it('includes all required fields with correct values (format-compatibility check)', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
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
        // Format-compatibility check: explicit hardcoded IDs to detect resolver ID format changes
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

  describe('validateSelectedPeriodContext defensive checks', () => {
    it('returns false for null input', () => {
      expect(validateSelectedPeriodContext(null)).toBe(false);
    });

    it('returns false for undefined input', () => {
      expect(validateSelectedPeriodContext(undefined)).toBe(false);
    });

    it('returns false for non-object input (string)', () => {
      expect(validateSelectedPeriodContext('not an object')).toBe(false);
    });

    it('returns false for array input', () => {
      expect(validateSelectedPeriodContext([])).toBe(false);
    });

    it('returns false when mahadashaNode is missing', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, mahadashaNode: undefined };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false when interval is missing', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, interval: undefined };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false when antardasha is missing mahadashaId', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          antardasha: { ...result.value.antardasha, mahadashaId: undefined }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false when mahadasha.planet is not a string', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          mahadasha: { ...result.value.mahadasha, planet: 123 as any }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false when mahadasha.start is not a string', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          mahadasha: { ...result.value.mahadasha, start: null as any }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns true for valid context from factory', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });

    it('returns false for missing contextVersion', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const { contextVersion, ...invalidCtx } = result.value;
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for wrong contextVersion value', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, contextVersion: 'v99' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for missing selectedPeriodId', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const { selectedPeriodId, ...invalidCtx } = result.value;
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for selectedPeriodId inconsistent with createSelectedPeriodId', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, selectedPeriodId: 'inconsistent-id' };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for missing resolverVersion', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const { resolverVersion, ...invalidCtx } = result.value;
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for invalid resolverVersion', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, resolverVersion: 'invalid-version' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for unparseable analysisAsOf', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, analysisAsOf: 'not-a-date' };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for invalid temporalRelation value', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, temporalRelation: 'SOMETIME' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for temporalRelation mismatch (FUTURE on CURRENT interval)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This is a CURRENT interval (asOf is within [start, end))
        // Supplying FUTURE should fail validation
        const invalidCtx = { ...result.value, temporalRelation: 'FUTURE' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for temporalRelation mismatch (PAST on CURRENT interval)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This is a CURRENT interval (asOf is within [start, end))
        // Supplying PAST should fail validation
        const invalidCtx = { ...result.value, temporalRelation: 'PAST' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for temporalRelation mismatch (CURRENT on FUTURE interval)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2019-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This is a FUTURE interval (asOf < start)
        // Supplying CURRENT should fail validation
        const invalidCtx = { ...result.value, temporalRelation: 'CURRENT' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for temporalRelation mismatch (CURRENT on PAST interval)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2023-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This is a PAST interval (asOf >= end)
        // Supplying CURRENT should fail validation
        const invalidCtx = { ...result.value, temporalRelation: 'CURRENT' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for inverted interval (start > end)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Invert the interval
        const invalidCtx = {
          ...result.value,
          interval: {
            start: result.value.interval.end,
            end: result.value.interval.start
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for malformed date in interval.start', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          interval: {
            start: 'not-a-valid-date',
            end: result.value.interval.end
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns false for malformed date in interval.end', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          interval: {
            start: result.value.interval.start,
            end: 'not-a-valid-date'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('returns true for start−1ms FUTURE boundary (asOf = start - 1ms)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2019-12-31T23:59:59.999Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // asOf is 1ms before start → FUTURE
        expect(result.value.temporalRelation).toBe('FUTURE');
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });

    it('returns true for start included (CURRENT at start)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2020-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // asOf === start → CURRENT (start is included)
        expect(result.value.temporalRelation).toBe('CURRENT');
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });

    it('returns true for end excluded (PAST at end)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2022-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // asOf === end → PAST (end is excluded)
        expect(result.value.temporalRelation).toBe('PAST');
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });

    it('returns true for end−1ms CURRENT', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-12-31T23:59:59.999Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // asOf is 1ms before end → CURRENT
        expect(result.value.temporalRelation).toBe('CURRENT');
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });
  });

  describe('PBA-03B: temporal mismatch (no rewrite)', () => {
    it('valid context with false temporalRelation fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This is a CURRENT interval; forge a FUTURE temporalRelation
        const invalidCtx = { ...result.value, temporalRelation: 'FUTURE' as any };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('malformed analysisAsOf in context fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, analysisAsOf: 'not-a-date' };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('inverted interval fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          interval: {
            start: result.value.interval.end,
            end: result.value.interval.start
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('valid context passes validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(validateSelectedPeriodContext(result.value)).toBe(true);
      }
    });

    it('validator does not rewrite the supplied context', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const contextSnapshot = structuredClone(result.value);
        validateSelectedPeriodContext(result.value);
        expect(result.value).toEqual(contextSnapshot);
      }
    });
  });

  describe('PBA-03C: cross-field consistency', () => {
    it('antardasha.mahadashaId !== mahadasha.id fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          antardasha: {
            ...result.value.antardasha,
            mahadashaId: 'wrong-id'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('selectedPeriodId !== createSelectedPeriodId(...) fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = { ...result.value, selectedPeriodId: 'wrong-period-id' };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('interval.start differing from AD node fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          interval: {
            ...result.value.interval,
            start: '1999-01-01T00:00:00.000Z'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('interval.end differing from AD node fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          interval: {
            ...result.value.interval,
            end: '2099-01-01T00:00:00.000Z'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('MD summary differing from MD node fails validation (planet)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          mahadasha: {
            ...result.value.mahadasha,
            planet: Planet.MARS
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('MD summary differing from MD node fails validation (start)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          mahadasha: {
            ...result.value.mahadasha,
            start: '1999-01-01T00:00:00.000Z'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('AD summary differing from AD node fails validation (planet)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          antardasha: {
            ...result.value.antardasha,
            planet: Planet.MARS
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('AD summary differing from AD node fails validation (start)', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const invalidCtx = {
          ...result.value,
          antardasha: {
            ...result.value.antardasha,
            start: '1999-01-01T00:00:00.000Z'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });

    it('AD not contained in MD fails validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);
      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Forge an AD interval outside the MD interval
        const invalidCtx = {
          ...result.value,
          interval: {
            start: '2010-01-01T00:00:00.000Z',
            end: '2012-01-01T00:00:00.000Z'
          },
          antardasha: {
            ...result.value.antardasha,
            start: '2010-01-01T00:00:00.000Z',
            end: '2012-01-01T00:00:00.000Z'
          }
        };
        expect(validateSelectedPeriodContext(invalidCtx)).toBe(false);
      }
    });
  });

  describe('PBA-03D: non-mutation with structuredClone', () => {
    it('report, selection, and context remain unchanged after context creation and validation', () => {
      const report = makeReport();
      const selection = selectionFor(report);

      const reportSnapshot = structuredClone(report);
      const selectionSnapshot = structuredClone(selection);

      const result = createSelectedPeriodActivationContext({
        report,
        selection,
        analysisAsOf: '2021-01-01T00:00:00.000Z'
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const contextSnapshot = structuredClone(result.value);
        validateSelectedPeriodContext(result.value);

        expect(report).toEqual(reportSnapshot);
        expect(selection).toEqual(selectionSnapshot);
        expect(result.value).toEqual(contextSnapshot);
        expect(result.value.analysisAsOf).toBe('2021-01-01T00:00:00.000Z');
      }
    });
  });

  describe('PBA-03E: createSelectedPeriodId compatibility', () => {
    it('createSelectedPeriodId format matches expected versioned encoding', () => {
      const mdId = 'md:alpha|beta';
      const adId = 'ad:gamma|delta';
      const result = createSelectedPeriodId(mdId, adId);

      const expected = `pba-period:${SELECTED_PERIOD_CONTEXT_VERSION}:${encodeURIComponent(mdId)}:${encodeURIComponent(adId)}`;
      expect(result).toBe(expected);
    });
  });
});
