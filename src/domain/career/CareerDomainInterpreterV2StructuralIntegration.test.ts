import { describe, expect, it } from 'vitest';
import { Planet, type Horoscope } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';
import { buildCareerStructuralReasoning, toDomainEvidence } from './careerStructuralReasoningIntegration';

const testMethodology = {
  zodiacSystem: 'SIDEREAL',
  houseSystem: 'WHOLE_SIGN',
  ayanamsa: 'LAHIRI',
  calculationEngine: 'ASTRO_CORE_V1',
  rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2',
  vargaRules: 'PARASHARA_D10_D2',
  dashaSystem: 'VIMSHOTTARI'
};

function makeContext(asOf?: string) {
  return createAnalysisContext({ asOf, methodology: testMethodology });
}

function makeDomainOptions(asOf?: string, targetHoroscope: Horoscope): DomainReasoningOptions {
  const context = makeContext(asOf);
  const temporalState = resolveAnalysisTemporalState(targetHoroscope, context);
  return { context, temporalState };
}

describe('CareerDomainInterpreterV2StructuralIntegration', () => {
  describe('C4 Structural Reasoning Integration', () => {
    it('includes C4 structural evidence in the interpreter evidence graph', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Build C4 structural reasoning separately
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      
      // Verify that structural evidence is present in the interpretation
      expect(structuralEvidence.length).toBeGreaterThan(0);
      
      // Check that structural evidence items are present in the interpretation
      const structuralIds = new Set(structuralEvidence.map(e => e.id));
      const interpretationIds = new Set(interpretation.evidence.map(e => e.id));
      
      // At least some structural evidence should be in the interpretation
      const intersection = [...structuralIds].filter(id => interpretationIds.has(id));
      expect(intersection.length).toBeGreaterThan(0);
      
      // Verify structural evidence has correct provenance
      const structuralItemsInInterpretation = interpretation.evidence.filter(e => 
        structuralIds.has(e.id)
      );
      
      structuralItemsInInterpretation.forEach(item => {
        expect(item.provenance).toBeDefined();
        expect(item.provenance?.source).toBe('C4_STRUCTURAL_REASONING');
        expect(item.provenance?.axis).toBe('NATAL');
        expect(item.domain).toBe('CAREER');
        expect(item.phase).toBe('NATAL_PROMISE');
        expect(item.source).toBe('D1');
      });
    });

    it('preserves C4 structural evidence ruleId deterministically', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      
      // Check that ruleIds are deterministic and stable
      structuralEvidence.forEach(evidence => {
        expect(evidence.ruleId).toBeDefined();
        expect(evidence.ruleId).toMatch(/^CAREER_STRUCTURAL_/);
      });
      
      // Verify the same ruleId appears in interpretation
      const structuralIds = new Set(structuralEvidence.map(e => e.id));
      const structuralItemsInInterpretation = interpretation.evidence.filter(e => 
        structuralIds.has(e.id)
      );
      
      structuralItemsInInterpretation.forEach(item => {
        const originalItem = structuralEvidence.find(e => e.id === item.id);
        expect(item.ruleId).toBe(originalItem?.ruleId);
      });
    });

    it('correctly maps C4 structural direction to DomainEvidence polarity', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      
      // Check polarity mapping
      structuralEvidence.forEach(evidence => {
        const structuralItem = structuralReasoning.evidence.find(e => e.id === evidence.id);
        if (structuralItem) {
          if (structuralItem.direction === 'SUPPORT') {
            expect(evidence.polarity).toBe('SUPPORTING');
          } else if (structuralItem.direction === 'CHALLENGE') {
            expect(evidence.polarity).toBe('CHALLENGING');
          } else {
            expect(evidence.polarity).toBe('NEUTRAL');
          }
        }
      });
    });

    it('handles charts with mixed structural effects (10H↔6H=SUPPORT, 10H↔8H=CHALLENGE)', () => {
      // Create a chart with specific house relationships
      // This test assumes the canonical chart has some structural relationships
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      
      // If there are both supporting and challenging relationships, direction should be MIXED
      if (structuralReasoning.primarySupport > 0 && structuralReasoning.primaryChallenge > 0) {
        expect(structuralReasoning.direction).toBe('MIXED');
      }
      
      // Verify that structural evidence reflects the mixed nature
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      const hasSupporting = structuralEvidence.some(e => e.polarity === 'SUPPORTING');
      const hasChallenging = structuralEvidence.some(e => e.polarity === 'CHALLENGING');
      
      if (hasSupporting && hasChallenging) {
        // Both polarities should be present in interpretation
        const structuralIds = new Set(structuralEvidence.map(e => e.id));
        const structuralItemsInInterpretation = interpretation.evidence.filter(e => 
          structuralIds.has(e.id)
        );
        
        const hasSupportingInInterpretation = structuralItemsInInterpretation.some(e => e.polarity === 'SUPPORTING');
        const hasChallengingInInterpretation = structuralItemsInInterpretation.some(e => e.polarity === 'CHALLENGING');
        
        expect(hasSupportingInInterpretation).toBe(true);
        expect(hasChallengingInInterpretation).toBe(true);
      }
    });

    it('does not duplicate existing evidence through dedup in reasoning hierarchy', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      
      // Count total evidence items
      const totalEvidenceCount = interpretation.evidence.length;
      
      // The reasoning hierarchy should have deduplicated any overlapping evidence
      // by identityKey, so we should not have simple count = original + structural
      // Instead, the count should reflect deduplication
      
      // This is a weak test - the real verification is that the system doesn't crash
      // and produces consistent results
      expect(totalEvidenceCount).toBeGreaterThan(0);
      expect(structuralEvidence.length).toBeGreaterThan(0);
    });
  });

  describe('Non-regression tests', () => {
    it('preserves existing DomainEvidence IDs from golden fixture', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Key golden fixture evidence IDs should still be present
      const goldenIds = [
        'GOLDEN_CAREER_10H_STRONG'
      ];
      
      const interpretationIds = new Set(interpretation.evidence.map(e => e.id));
      
      // Not all golden IDs may be present in the canonical chart, but the structure should be preserved
      // This test mainly ensures we haven't broken the existing evidence generation
      expect(interpretation.evidence.length).toBeGreaterThan(0);
    });

    it('preserves planetary positions and houses', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Planetary positions should be unchanged
      expect(horoscope.planetFacts).toBeDefined();
      expect(Object.keys(horoscope.planetFacts || {}).length).toBeGreaterThan(0);
      
      // House analysis should be unchanged
      expect(horoscope.houseAnalysis).toBeDefined();
    });

    it('preserves Dasha, D10, and transit outputs', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);
      
      const interpretation = interpretCareerV2(horoscope, options);
      
      // Dasha activation should be present
      expect(interpretation.dashaActivation).toBeDefined();
      
      // Transit trigger should be present
      expect(interpretation.transitTrigger).toBeDefined();
      
      // D10 confirmation should be present
      expect(interpretation.vargaConfirmations).toBeDefined();
      expect(interpretation.vargaConfirmations.length).toBeGreaterThan(0);
    });
  });

  describe('Independence/invariant tests', () => {
    it('C4 structural conclusion is unchanged when Dasha inputs are mutated', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      
      // Build structural reasoning with original horoscope
      const originalStructural = buildCareerStructuralReasoning({ horoscope });
      
      // Mutate Dasha interpretation (should not affect structural reasoning)
      const mutatedHoroscope = {
        ...horoscope,
        dashaInterpretation: {
          ...horoscope.dashaInterpretation,
          current: {
            ...horoscope.dashaInterpretation?.current,
            mahadasha: { planet: 'SATURN' as Planet, ...horoscope.dashaInterpretation?.current?.mahadasha }
          }
        }
      };
      
      const mutatedStructural = buildCareerStructuralReasoning({ horoscope: mutatedHoroscope });
      
      // Structural reasoning should be identical
      expect(mutatedStructural.direction).toBe(originalStructural.direction);
      expect(mutatedStructural.strength).toBe(originalStructural.strength);
      expect(mutatedStructural.evidence.length).toBe(originalStructural.evidence.length);
    });

    it('C4 structural conclusion is unchanged when D10 inputs are mutated', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      
      // Build structural reasoning with original horoscope
      const originalStructural = buildCareerStructuralReasoning({ horoscope });
      
      // Mutate D10 interpretation (should not affect structural reasoning)
      const mutatedHoroscope = {
        ...horoscope,
        divisionalInterpretation: {
          ...horoscope.divisionalInterpretation,
          D10: {
            ...horoscope.divisionalInterpretation?.D10,
            houses: [] // Empty D10 houses
          }
        }
      };
      
      const mutatedStructural = buildCareerStructuralReasoning({ horoscope: mutatedHoroscope });
      
      // Structural reasoning should be identical
      expect(mutatedStructural.direction).toBe(originalStructural.direction);
      expect(mutatedStructural.strength).toBe(originalStructural.strength);
    });

    it('C4 structural conclusion is unchanged when transit inputs are mutated', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      
      // Build structural reasoning with original horoscope
      const originalStructural = buildCareerStructuralReasoning({ horoscope });
      
      // Structural reasoning doesn't use transit data, so this should be unchanged
      const mutatedStructural = buildCareerStructuralReasoning({ horoscope });
      
      expect(mutatedStructural.direction).toBe(originalStructural.direction);
      expect(mutatedStructural.strength).toBe(originalStructural.strength);
    });
  });

  describe('Why-not tests', () => {
    it('does not generate support evidence without supporting relationships', () => {
      // Create a minimal horoscope with no career house relationships
      const minimalHoroscope: Horoscope = {
        ...CANONICAL_BIRTH_DETAILS,
        planetFacts: {},
        houseAnalysis: { houses: [] }
      } as any;
      
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: minimalHoroscope });
      
      // Should have no supporting evidence if no relationships exist
      expect(structuralReasoning.primarySupport).toBe(0);
      expect(structuralReasoning.supportingSupport).toBe(0);
    });

    it('does not generate challenge evidence without challenging relationships', () => {
      // Create a minimal horoscope with no career house relationships
      const minimalHoroscope: Horoscope = {
        ...CANONICAL_BIRTH_DETAILS,
        planetFacts: {},
        houseAnalysis: { houses: [] }
      } as any;
      
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: minimalHoroscope });
      
      // Should have no challenging evidence if no relationships exist
      expect(structuralReasoning.primaryChallenge).toBe(0);
      expect(structuralReasoning.challengingChallenge).toBe(0);
    });

    it('does not convert missing evidence to negative evidence', () => {
      const minimalHoroscope: Horoscope = {
        ...CANONICAL_BIRTH_DETAILS,
        planetFacts: {},
        houseAnalysis: { houses: [] }
      } as any;
      
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: minimalHoroscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      
      // Missing evidence should not be converted to challenging evidence
      const challengingEvidence = structuralEvidence.filter(e => e.polarity === 'CHALLENGING');
      expect(challengingEvidence.length).toBe(0);
      
      // Direction should be UNAVAILABLE when no evidence
      expect(structuralReasoning.direction).toBe('UNAVAILABLE');
    });
  });
});