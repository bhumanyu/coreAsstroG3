/**
 * Tests for ProductAnalysis Selectors
 */

import { describe, it, expect } from 'vitest';
import {
  selectDashaPeriodOptions,
  selectAntardashasForMahadasha,
  selectSelectedPeriod
} from './productAnalysisSelectors';
import type {
  ProductAnalysis,
  ProductDashaPeriodOptions,
  ProductSelectedPeriodResult
} from './productAnalysisTypes';

describe('productAnalysisSelectors', () => {
  describe('selectDashaPeriodOptions', () => {
    it('returns undefined when dashPeriodOptions is not present', () => {
      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: []
      };

      const result = selectDashaPeriodOptions(analysis);
      expect(result).toBeUndefined();
    });

    it('returns dashPeriodOptions when present', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md-1',
            planet: 'JUPITER',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: []
          }
        ],
        diagnostics: []
      };

      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: [],
        dashPeriodOptions
      };

      const result = selectDashaPeriodOptions(analysis);
      expect(result).toBe(dashPeriodOptions);
    });
  });

  describe('selectAntardashasForMahadasha', () => {
    it('returns empty array when dashPeriodOptions is not present', () => {
      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: []
      };

      const result = selectAntardashasForMahadasha(analysis, 'md-1');
      expect(result).toEqual([]);
    });

    it('returns empty array when mahadashaId is not found', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md-1',
            planet: 'JUPITER',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: []
          }
        ],
        diagnostics: []
      };

      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: [],
        dashPeriodOptions
      };

      const result = selectAntardashasForMahadasha(analysis, 'md-999');
      expect(result).toEqual([]);
    });

    it('returns all antardashas when validOnly is false', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md-1',
            planet: 'JUPITER',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: [
              {
                id: 'ad-1',
                planet: 'SATURN',
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'PAST'
              },
              {
                id: 'ad-2',
                planet: 'MERCURY',
                start: '2022-01-01T00:00:00.000Z',
                end: '2024-01-01T00:00:00.000Z',
                valid: false,
                diagnostics: ['INVALID_INTERVAL'],
                temporalRelation: 'CURRENT'
              }
            ]
          }
        ],
        diagnostics: []
      };

      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: [],
        dashPeriodOptions
      };

      const result = selectAntardashasForMahadasha(analysis, 'md-1', false);
      expect(result).toHaveLength(2);
    });

    it('returns only valid antardashas when validOnly is true', () => {
      const dashPeriodOptions: ProductDashaPeriodOptions = {
        mahadashas: [
          {
            id: 'md-1',
            planet: 'JUPITER',
            start: '2020-01-01T00:00:00.000Z',
            end: '2036-01-01T00:00:00.000Z',
            valid: true,
            diagnostics: [],
            temporalRelation: 'CURRENT',
            antardashas: [
              {
                id: 'ad-1',
                planet: 'SATURN',
                start: '2020-01-01T00:00:00.000Z',
                end: '2022-01-01T00:00:00.000Z',
                valid: true,
                diagnostics: [],
                temporalRelation: 'PAST'
              },
              {
                id: 'ad-2',
                planet: 'MERCURY',
                start: '2022-01-01T00:00:00.000Z',
                end: '2024-01-01T00:00:00.000Z',
                valid: false,
                diagnostics: ['INVALID_INTERVAL'],
                temporalRelation: 'CURRENT'
              }
            ]
          }
        ],
        diagnostics: []
      };

      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: [],
        dashPeriodOptions
      };

      const result = selectAntardashasForMahadasha(analysis, 'md-1', true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ad-1');
      expect(result[0].valid).toBe(true);
    });
  });

  describe('selectSelectedPeriod', () => {
    it('returns undefined when selectedPeriod is not present', () => {
      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: []
      };

      const result = selectSelectedPeriod(analysis);
      expect(result).toBeUndefined();
    });

    it('returns selectedPeriod when present', () => {
      const selectedPeriod: ProductSelectedPeriodResult = {
        status: 'OK',
        synthesis: {
          synthesisVersion: 'PBA-06-v1',
          qualificationStatus: 'CANONICAL',
          period: {
            selectedPeriodId: 'test-period',
            mahadashaId: 'md-1',
            mahadashaPlanet: 'JUPITER',
            antardashaId: 'ad-1',
            antardashaPlanet: 'SATURN',
            interval: { start: '2020-01-01T00:00:00.000Z', end: '2022-01-01T00:00:00.000Z' },
            analysisAsOf: '2024-01-01T00:00:00.000Z',
            temporalRelation: 'PAST'
          },
          natalBaseline: {
            career: { baseline: {} as any, unchanged: true },
            wealth: { baseline: {} as any, unchanged: true }
          },
          career: {
            qualificationBasis: 'CANONICAL_STATUS',
            expressions: [],
            diagnostics: []
          },
          wealth: {
            dimensions: {
              ACCUMULATION: {
                dimension: 'ACCUMULATION',
                effect: 'ACTIVATES',
                dataStatus: 'COMPLETE',
                linkedLevels: ['MD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: []
              },
              GAINS: {
                dimension: 'GAINS',
                effect: 'ACTIVATES',
                dataStatus: 'COMPLETE',
                linkedLevels: ['MD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: []
              },
              FORTUNE: {
                dimension: 'FORTUNE',
                effect: 'ACTIVATES',
                dataStatus: 'COMPLETE',
                linkedLevels: ['MD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: []
              },
              SPECULATION: {
                dimension: 'SPECULATION',
                effect: 'ACTIVATES',
                dataStatus: 'COMPLETE',
                linkedLevels: ['MD'],
                diagnostics: [],
                promiseEvidenceIds: [],
                dashaRuleReferences: []
              }
            },
            diagnostics: []
          },
          evidence: [],
          missingInputs: [],
          provenance: {
            career: { status: 'PRESENT' },
            wealth: { status: 'PRESENT' }
          },
          qualificationStatus: 'CANONICAL',
          aiExplanationStatus: 'NOT_REQUESTED'
        }
      };

      const analysis: ProductAnalysis = {
        analysisId: 'test',
        asOf: '2024-01-01T00:00:00.000Z',
        engineVersion: 'v1',
        rulesVersion: 'v1',
        status: 'READY',
        birth: {
          dateTime: '2024-01-01T00:00:00.000Z',
          timezone: 'UTC',
          latitude: 0,
          longitude: 0,
          ayanamsa: 'LAHIRI'
        },
        methodology: {
          zodiacSystem: 'SIDEREAL',
          houseSystem: 'WHOLE_SIGN',
          ayanamsa: 'LAHIRI',
          calculationEngine: 'ASTRO_CORE_V1',
          rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
          vargaRules: 'PARASHARA_D10_D2',
          dashaSystem: 'VIMSHOTTARI'
        },
        chart: {
          ascendantSign: 'ARIES',
          moonSign: 'TAURUS',
          sunSign: 'ARIES',
          isAvailable: true
        },
        career: {
          promise: {
            strength: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          d10: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        wealth: {
          overall: {
            status: 'SUPPORTED',
            promise: 'STRONG',
            confidence: 'HIGH',
            statement: 'Test'
          },
          dimensions: {
            accumulation: { status: 'SUPPORTED' },
            gains: { status: 'SUPPORTED' },
            fortune: { status: 'SUPPORTED' },
            speculation: { status: 'SUPPORTED' }
          },
          d2: { relationship: 'CONFIRMS' },
          activation: {
            dasha: { status: 'AVAILABLE', periods: [] },
            transit: { status: 'UNAVAILABLE', effect: 'UNAVAILABLE' }
          },
          evidence: []
        },
        dasha: {
          current: {}
        },
        reasoning: {
          nodes: [],
          primaryConclusions: []
        },
        ai: {
          status: 'UNAVAILABLE'
        },
        warnings: [],
        selectedPeriod
      };

      const result = selectSelectedPeriod(analysis);
      expect(result).toBe(selectedPeriod);
    });
  });
});
