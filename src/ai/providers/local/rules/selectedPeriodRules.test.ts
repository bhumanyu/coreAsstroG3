import { describe, it, expect } from 'vitest';
import { SELECTED_PERIOD_RULES } from './selectedPeriodRules';
import type { AiContext } from '../../../types/aiContextTypes';

describe('Selected Period Rules', () => {
  describe('SP-07-BASELINE-DISTINCTION', () => {
    it('emits statement describing natal baseline with provenance information', () => {
      const mockContext: AiContext = {
        schemaVersion: '1.0',
        source: 'VEDIC_ASTROLOGY',
        ascendant: 'VIRGO',
        planets: [],
        houses: [],
        aspects: [],
        yogas: [],
        evidence: [],
        career: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        wealth: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        selectedPeriod: {
          synthesisVersion: 'PBA-06-v1',
          selectedPeriodId: 'test-period-id',
          mahadashaId: 'test-md-id',
          mahadashaPlanet: 'JUPITER',
          antardashaId: 'test-ad-id',
          antardashaPlanet: 'VENUS',
          interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
          analysisAsOf: '2024-01-01T00:00:00Z',
          temporalRelation: 'PAST',
          career: {
            qualificationBasis: 'CANONICAL_STATUS',
            expressions: []
          },
          wealth: {
            dimensions: {
              ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] }
            }
          },
          evidence: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          missingInputs: [],
          diagnostics: [],
          provenance: {
            career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
          },
          availableEvidence: []
        }
      } as any;

      const rule = SELECTED_PERIOD_RULES.find(r => r.id === 'SP-07-BASELINE-DISTINCTION');
      expect(rule).toBeDefined();

      if (rule) {
        const result = rule.evaluate(mockContext);

        expect(result.triggered).toBe(true);
        expect(result.effect).toBe('NEUTRAL');
        expect(result.statement).toContain('qualifies and describes the unchanged natal baseline');
        expect(result.statement).toContain('Career baseline is PRESENT');
        expect(result.statement).toContain('version PBA-04-v1');
        expect(result.statement).toContain('qualification basis CANONICAL_STATUS');
        expect(result.statement).toContain('Wealth baseline is PRESENT');
        expect(result.statement).toContain('version PBA-05-v1');
        expect(result.statement).toContain('JUPITER mahadasha');
        expect(result.statement).toContain('VENUS antardasha');
        expect(result.statement).toContain('2020-01-01T00:00:00Z');
        expect(result.statement).toContain('2021-01-01T00:00:00Z');

        // Ensure no score is emitted
        expect(result.statement).not.toMatch(/score|strength|confidence/i);
      }
    });

    it('does not emit competing conclusion vocabulary', () => {
      const mockContext: AiContext = {
        schemaVersion: '1.0',
        source: 'VEDIC_ASTROLOGY',
        ascendant: 'VIRGO',
        planets: [],
        houses: [],
        aspects: [],
        yogas: [],
        evidence: [],
        career: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        wealth: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        selectedPeriod: {
          synthesisVersion: 'PBA-06-v1',
          selectedPeriodId: 'test-period-id',
          mahadashaId: 'test-md-id',
          mahadashaPlanet: 'JUPITER',
          antardashaId: 'test-ad-id',
          antardashaPlanet: 'VENUS',
          interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
          analysisAsOf: '2024-01-01T00:00:00Z',
          temporalRelation: 'PAST',
          career: {
            qualificationBasis: 'CANONICAL_STATUS',
            expressions: []
          },
          wealth: {
            dimensions: {
              ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] }
            }
          },
          evidence: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          missingInputs: [],
          diagnostics: [],
          provenance: {
            career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
          },
          availableEvidence: []
        }
      } as any;

      const rule = SELECTED_PERIOD_RULES.find(r => r.id === 'SP-07-BASELINE-DISTINCTION');
      expect(rule).toBeDefined();

      if (rule) {
        const result = rule.evaluate(mockContext);

        // Check that the statement does not use conclusion vocabulary
        // that would compete with other rules (e.g., "activates", "challenges", "supports")
        expect(result.statement).not.toMatch(/activates|challenges|supports|weakens|strengthens/i);
        expect(result.statement).not.toMatch(/score|rating|grade/i);
      }
    });

    it('handles missing provenance gracefully', () => {
      const mockContext: AiContext = {
        schemaVersion: '1.0',
        source: 'VEDIC_ASTROLOGY',
        ascendant: 'VIRGO',
        planets: [],
        houses: [],
        aspects: [],
        yogas: [],
        evidence: [],
        career: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        wealth: { status: 'STRONGLY_SUPPORTED', confidence: 'HIGH', supportingFactors: [], challengingFactors: [] },
        selectedPeriod: {
          synthesisVersion: 'PBA-06-v1',
          selectedPeriodId: 'test-period-id',
          mahadashaId: 'test-md-id',
          mahadashaPlanet: 'JUPITER',
          antardashaId: 'test-ad-id',
          antardashaPlanet: 'VENUS',
          interval: { start: '2020-01-01T00:00:00Z', end: '2021-01-01T00:00:00Z' },
          analysisAsOf: '2024-01-01T00:00:00Z',
          temporalRelation: 'PAST',
          career: {
            qualificationBasis: 'CANONICAL_STATUS',
            expressions: []
          },
          wealth: {
            dimensions: {
              ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] },
              SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'COMPLETE', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [] }
            }
          },
          evidence: [],
          supportingEvidenceIds: [],
          challengingEvidenceIds: [],
          missingInputs: [],
          diagnostics: [],
          provenance: {
            career: { status: 'PRESENT', version: 'PBA-04-v1', qualificationBasis: 'CANONICAL_STATUS' },
            wealth: { status: 'PRESENT', version: 'PBA-05-v1' }
          },
          availableEvidence: []
        }
      } as any;

      const rule = SELECTED_PERIOD_RULES.find(r => r.id === 'SP-07-BASELINE-DISTINCTION');
      expect(rule).toBeDefined();

      if (rule) {
        const result = rule.evaluate(mockContext);

        expect(result.triggered).toBe(true);
        expect(result.statement).toContain('qualifies and describes the unchanged natal baseline');
      }
    });
  });
});
