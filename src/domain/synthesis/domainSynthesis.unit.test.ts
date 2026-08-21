import { describe, it, expect } from 'vitest';
import {
  deriveSharedTiming
} from './domainSynthesisTiming';
import {
  extractRawDomainStrength,
  buildDomainSummary
} from './domainSynthesisStrengths';
import {
  detectCrossDomainConflicts
} from './domainSynthesisConflicts';
import {
  determineOverallStatus,
  synthesizeLifeAnalysis
} from './domainSynthesisService';
import {
  createDomainInterpretation,
  createNatalPromise
} from '../interpretation';
import type { DomainSummary } from './domainSynthesisTypes';

describe('Domain Synthesis Refactored Unit Tests (P-028)', () => {
  describe('1. Shared timing identity (P0)', () => {
    it('does not group domains with different period keys into shared timing', () => {
      const career = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'SUN',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['C1']
          }
        ]
      });

      const wealth = createDomainInterpretation({
        domain: 'WEALTH',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'MOON',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['W1']
          }
        ]
      });

      const shared = deriveSharedTiming([career, wealth]);
      expect(shared).toHaveLength(0);
    });

    it('groups domains sharing same source + level + periodKey when count >= 2', () => {
      const career = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'JUPITER',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['C_JUP']
          }
        ]
      });

      const wealth = createDomainInterpretation({
        domain: 'WEALTH',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'JUPITER',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['W_JUP']
          }
        ]
      });

      const shared = deriveSharedTiming([career, wealth]);
      expect(shared).toHaveLength(1);
      expect(shared[0].source).toBe('DASHA');
      expect(shared[0].level).toBe('MAHADASHA');
      expect(shared[0].periodKey).toBe('JUPITER');
      expect(shared[0].participatingDomains).toEqual(['CAREER', 'WEALTH']);
      expect(shared[0].evidenceIds).toEqual(['C_JUP', 'W_JUP']);
    });
  });

  describe('2. Generic domain strength (P0)', () => {
    it('reads natalPromise.strength generically regardless of domain', () => {
      const career = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'VERY_STRONG' }),
        conclusionData: { natalStatus: 'CHALLENGED' } // legacy data should be ignored
      });

      const rawStrength = extractRawDomainStrength(career);
      expect(rawStrength).toBe('VERY_STRONG');

      const summary = buildDomainSummary(career);
      expect(summary.strength).toBe('VERY_STRONG');
      expect(summary.status).toBe('STRONGLY_SUPPORTED');
    });
  });

  describe('3. Explicit missing state (P1)', () => {
    it('uses typed defaults without as any in createDomainInterpretation', () => {
      const bare = createDomainInterpretation({
        domain: 'HEALTH' as any,
        natalPromise: createNatalPromise({ strength: 'MODERATE' })
      });

      expect(bare.dashaActivation.active).toBe(false);
      expect(bare.dashaActivation.effect).toBe('INSUFFICIENT_DATA');
      expect(bare.transitTrigger.active).toBe(false);
      expect(bare.transitTrigger.effect).toBe('NO_MATERIAL_TRIGGER');
      expect(bare.conclusion.strength).toBe('MODERATE');
    });
  });

  describe('4. Overall Life status (P1)', () => {
    it('classifies dominant natal landscape first before downgrading for conflicts', () => {
      const strongSummary1: DomainSummary = {
        domain: 'CAREER',
        strength: 'VERY_STRONG',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        primaryConclusion: 'Strong career promise',
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      };
      const strongSummary2: DomainSummary = {
        domain: 'WEALTH',
        strength: 'VERY_STRONG',
        status: 'STRONGLY_SUPPORTED',
        confidence: 'HIGH',
        primaryConclusion: 'Strong wealth promise',
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      };

      // 100% strongly supported with 0 conflicts -> STRONGLY_SUPPORTED
      expect(determineOverallStatus([strongSummary1, strongSummary2], 0)).toBe('STRONGLY_SUPPORTED');

      // 100% strongly supported with 1 conflict -> downgraded by 1 tier to SUPPORTED
      expect(determineOverallStatus([strongSummary1, strongSummary2], 1)).toBe('SUPPORTED');

      const supportedSummary: DomainSummary = {
        domain: 'WEALTH',
        strength: 'STRONG',
        status: 'SUPPORTED',
        confidence: 'HIGH',
        primaryConclusion: 'Supported wealth promise',
        supportingEvidenceIds: [],
        challengingEvidenceIds: []
      };

      // Mixed strong/supported >= 75% -> SUPPORTED, conflict downgrades to MIXED
      expect(determineOverallStatus([strongSummary1, supportedSummary], 0)).toBe('SUPPORTED');
      expect(determineOverallStatus([strongSummary1, supportedSummary], 1)).toBe('MIXED');
    });
  });

  describe('5. Conflict must require shared timing identity (P1)', () => {
    it('does not raise timing conflict if differing effects occur in different timing periods', () => {
      const career = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'SATURN',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['C_SAT']
          }
        ]
      });

      const wealth = createDomainInterpretation({
        domain: 'WEALTH',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'MARS',
            effect: 'CHALLENGES',
            active: true,
            evidenceIds: ['W_MARS']
          }
        ]
      });

      const conflicts = detectCrossDomainConflicts([career, wealth]);
      expect(conflicts).toHaveLength(0);
    });

    it('raises timing conflict when domains share same timing identity and have conflicting effects', () => {
      const career = createDomainInterpretation({
        domain: 'CAREER',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'RAHU',
            effect: 'ACTIVATES',
            active: true,
            evidenceIds: ['C_RAHU']
          }
        ]
      });

      const wealth = createDomainInterpretation({
        domain: 'WEALTH',
        natalPromise: createNatalPromise({ strength: 'STRONG' }),
        timingActivations: [
          {
            source: 'DASHA',
            level: 'MAHADASHA',
            periodKey: 'RAHU',
            effect: 'CHALLENGES',
            active: true,
            evidenceIds: ['W_RAHU']
          }
        ]
      });

      const conflicts = detectCrossDomainConflicts([career, wealth]);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('DOMAIN_VS_TIMING');
      expect(conflicts[0].participatingDomains).toEqual(['CAREER', 'WEALTH']);
      expect(conflicts[0].evidenceIds).toEqual(['C_RAHU', 'W_RAHU']);
    });
  });
});
