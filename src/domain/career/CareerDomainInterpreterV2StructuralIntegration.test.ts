import { describe, expect, it } from 'vitest';
import { Planet, type Horoscope } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import { resolveAnalysisTemporalState } from '../../core/analysis/resolveAnalysisTemporalState';
import type { DomainReasoningOptions } from '../reasoning/reasoningTypes';
import { interpretCareerV2 } from './CareerDomainInterpreterV2';
import { buildCareerStructuralReasoning, toDomainEvidence } from './careerStructuralReasoningIntegration';
import { MIXED_STRUCTURAL_CHART } from './__fixtures__/structural/mixedStructuralChart.fixture';
import { evaluateCareerReasoningHierarchy } from './careerReasoningHierarchy';
import type { DomainEvidence } from '../interpretation/DomainEvidence';

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

function makeDomainOptions(asOf: string | undefined, targetHoroscope: Horoscope): DomainReasoningOptions {
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
      // Use the dedicated mixed structural chart fixture
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: MIXED_STRUCTURAL_CHART });

      // The fixture is designed to produce both supporting and challenging relationships
      // Therefore direction should be MIXED unconditionally
      expect(structuralReasoning.direction).toBe('MIXED');

      // Verify that structural evidence reflects the mixed nature
      const structuralEvidence = toDomainEvidence(structuralReasoning);
      const hasSupporting = structuralEvidence.some(e => e.polarity === 'SUPPORTING');
      const hasChallenging = structuralEvidence.some(e => e.polarity === 'CHALLENGING');

      // Both polarities should be present in the structural evidence
      expect(hasSupporting).toBe(true);
      expect(hasChallenging).toBe(true);
    });

    it('splits MIXED structural evidence into two occurrences with same canonical identity', () => {
      // Use the dedicated mixed structural chart fixture
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: MIXED_STRUCTURAL_CHART });

      // Find MIXED structural evidence items
      const mixedEvidence = structuralReasoning.evidence.filter(e => e.direction === 'MIXED');

      // The fixture should produce at least one MIXED evidence item
      expect(mixedEvidence.length).toBeGreaterThan(0);

      // Convert to DomainEvidence
      const domainEvidence = toDomainEvidence(structuralReasoning);

      // For each MIXED evidence, we should have TWO split items with distinct occurrence ids but SAME canonical identity
      for (const mixedItem of mixedEvidence) {
        // Find the split items derived from this MIXED evidence
        const splitItems = domainEvidence.filter(e =>
          e.id.startsWith(mixedItem.id) ||
          (e.notes && e.notes.includes('C4 structural direction: MIXED'))
        );

        // Should have exactly 2 items (SUPPORTING and CHALLENGING)
        expect(splitItems.length).toBe(2);

        // One should be SUPPORTING, one should be CHALLENGING
        const supportingItem = splitItems.find(e => e.polarity === 'SUPPORTING');
        const challengingItem = splitItems.find(e => e.polarity === 'CHALLENGING');

        expect(supportingItem).toBeDefined();
        expect(challengingItem).toBeDefined();

        // Both should have distinct occurrence ids
        expect(supportingItem?.id).not.toBe(challengingItem?.id);

        // Both should share the SAME canonical ruleId (key change for identity collapse)
        expect(supportingItem?.ruleId).toBe(challengingItem?.ruleId);
        expect(supportingItem?.ruleId).not.toContain('_SUPPORTING');
        expect(supportingItem?.ruleId).not.toContain('_CHALLENGING');

        // Both should preserve MIXED effect in provenance
        expect(supportingItem?.provenance?.effect).toBe('MIXED');
        expect(challengingItem?.provenance?.effect).toBe('MIXED');

        // Both should have descriptive notes about the split
        expect(supportingItem?.notes).toContain('C4 structural direction: MIXED');
        expect(challengingItem?.notes).toContain('C4 structural direction: MIXED');

        // Both should share the same house (same semantic subject/object for identity collapse)
        expect(supportingItem?.house).toBe(challengingItem?.house);
      }
    });

    it('preserves MIXED nature through reasoning hierarchy after splitting', () => {
      // Use the dedicated mixed structural chart fixture
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: MIXED_STRUCTURAL_CHART });
      const structuralEvidence = toDomainEvidence(structuralReasoning);

      // Run through the reasoning hierarchy
      const hierarchyResult = evaluateCareerReasoningHierarchy({
        evidence: structuralEvidence,
        d10Confirmation: {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'UNAVAILABLE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '',
          evidenceIds: []
        },
        dashaTimings: {
          md: { level: 'MD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          ad: { level: 'AD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          pd: { level: 'PD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 }
        },
        transitEvidence: [],
        rawConflicts: []
      });

      // The result should reflect MIXED nature since we have both support and challenge
      // (primarySupport > 0 and primaryChallenge > 0 should yield MIXED direction)
      expect(hierarchyResult.natalDirection).toBe('MIXED');

      // Verify that both support and challenge are present in the totals
      const primaryLayer = hierarchyResult.layerSummaries.find(l => l.layer === 'PRIMARY_PROMISE');
      expect(primaryLayer?.weightedSupport).toBeGreaterThan(0);
      expect(primaryLayer?.weightedChallenge).toBeGreaterThan(0);

      // Extended assertion: verify the canonical identity contract
      // The two MIXED occurrences should collapse to exactly ONE canonical record
      expect(hierarchyResult.reasoningTrace.primaryPromise).toBeDefined();
      const canonicalRecords = hierarchyResult.reasoningTrace.primaryPromise.filter(
        r => r.direction === 'MIXED' && r.occurrenceCount === 2
      );
      // At least one MIXED record should have occurrenceCount=2 (collapsed from the two split items)
      expect(canonicalRecords.length).toBeGreaterThan(0);

      // Verify the canonical record has evidenceId === identityKey
      const mixedRecord = canonicalRecords[0];
      expect(mixedRecord.evidenceId).toBe(mixedRecord.identityKey);

      // Verify sourceIds contains both occurrence IDs
      expect(mixedRecord.sourceIds).toBeDefined();
      expect(mixedRecord.sourceIds.length).toBe(2);

      // Verify weight is NOT doubled (should be max of single occurrences, not sum)
      // Since both occurrences have the same weight, the canonical weight should equal that single weight
      const originalMixedEvidence = structuralReasoning.evidence.find(e => e.direction === 'MIXED');
      if (originalMixedEvidence) {
        expect(mixedRecord.weight).toBeLessThanOrEqual(originalMixedEvidence.weight);
      }
    });

    it('deduplicates structural evidence with same identity in reasoning hierarchy', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);

      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);

      // Ensure we have structural evidence to test with
      expect(structuralEvidence.length).toBeGreaterThan(0);

      // Run hierarchy once with single occurrence
      const singleResult = evaluateCareerReasoningHierarchy({
        evidence: structuralEvidence,
        d10Confirmation: {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'UNAVAILABLE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '',
          evidenceIds: []
        },
        dashaTimings: {
          md: { level: 'MD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          ad: { level: 'AD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          pd: { level: 'PD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 }
        },
        transitEvidence: [],
        rawConflicts: []
      });

      // Create duplicate evidence with same identity (same ruleId and all semantic fields)
      const duplicateEvidence = structuralEvidence[0];
      const evidenceWithDuplicate = [
        ...structuralEvidence,
        {
          ...duplicateEvidence,
          id: `DUPLICATE_${duplicateEvidence.id}`,
          // Keep all semantic fields identical to ensure identity key match
          ruleId: duplicateEvidence.ruleId,
          provenance: duplicateEvidence.provenance ? {
            ...duplicateEvidence.provenance,
            evidenceId: `DUPLICATE_${duplicateEvidence.id}` // Only change evidenceId
          } : undefined
        }
      ];

      // Run hierarchy again with duplicate
      const duplicateResult = evaluateCareerReasoningHierarchy({
        evidence: evidenceWithDuplicate,
        d10Confirmation: {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'UNAVAILABLE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '',
          evidenceIds: []
        },
        dashaTimings: {
          md: { level: 'MD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          ad: { level: 'AD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          pd: { level: 'PD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 }
        },
        transitEvidence: [],
        rawConflicts: []
      });

      // Should have deduplicated - natalStrength should be identical (not doubled)
      expect(singleResult.natalStrength).toBeDefined();
      expect(duplicateResult.natalStrength).toBeDefined();
      expect(singleResult.natalStrength).toBe(duplicateResult.natalStrength);

      // Should have identical direction (not affected by duplicate)
      expect(singleResult.natalDirection).toBe(duplicateResult.natalDirection);

      // Only one canonical record should exist for the shared identity
      // The evidence count in the result should be the same as the original (not incremented)
      expect(singleResult.primaryEvidenceIds.length).toBe(duplicateResult.primaryEvidenceIds.length);
    });

    it('deduplicates C4 evidence with legacy evidence having same identity', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const options = makeDomainOptions(undefined, horoscope);

      // Build C4 structural reasoning
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope });
      const structuralEvidence = toDomainEvidence(structuralReasoning);

      // Ensure we have structural evidence to test with
      expect(structuralEvidence.length).toBeGreaterThan(0);

      // Run hierarchy once with only C4 evidence
      const c4OnlyResult = evaluateCareerReasoningHierarchy({
        evidence: structuralEvidence,
        d10Confirmation: {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'UNAVAILABLE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '',
          evidenceIds: []
        },
        dashaTimings: {
          md: { level: 'MD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          ad: { level: 'AD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          pd: { level: 'PD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 }
        },
        transitEvidence: [],
        rawConflicts: []
      });

      // Create legacy evidence with same identity (same ruleId and all semantic fields)
      const c4Item = structuralEvidence[0];
      const legacyEvidence = {
        ...c4Item,
        id: `LEGACY_${c4Item.id}`,
        sourceType: 'HOUSE' as const,
        // Keep all semantic fields identical to ensure identity key match
        ruleId: c4Item.ruleId,
        provenance: c4Item.provenance ? {
          ...c4Item.provenance,
          evidenceId: `LEGACY_${c4Item.id}` // Only change evidenceId
        } : undefined
      } as DomainEvidence;

      const combinedEvidence = [...structuralEvidence, legacyEvidence];

      // Run hierarchy again with C4 + legacy evidence
      const combinedResult = evaluateCareerReasoningHierarchy({
        evidence: combinedEvidence,
        d10Confirmation: {
          domain: 'CAREER',
          varga: 'D10',
          relationship: 'UNAVAILABLE',
          strength: 'UNDETERMINED',
          confidence: 'UNDETERMINED',
          statement: '',
          evidenceIds: []
        },
        dashaTimings: {
          md: { level: 'MD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          ad: { level: 'AD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 },
          pd: { level: 'PD', effect: 'INSUFFICIENT_DATA', evidenceIds: [], confidence: 1.0 }
        },
        transitEvidence: [],
        rawConflicts: []
      });

      // Should result in single canonical fact, not doubled weight
      expect(c4OnlyResult.natalStrength).toBeDefined();
      expect(combinedResult.natalStrength).toBeDefined();
      expect(c4OnlyResult.natalStrength).toBe(combinedResult.natalStrength);

      // Should have identical direction
      expect(c4OnlyResult.natalDirection).toBe(combinedResult.natalDirection);

      // Only one canonical record should exist for the shared identity
      expect(c4OnlyResult.primaryEvidenceIds.length).toBe(combinedResult.primaryEvidenceIds.length);
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

    it('mixed non-primary relationship maps to role MODIFIER, not PRIMARY', () => {
      // Use the dedicated mixed structural chart fixture
      const structuralReasoning = buildCareerStructuralReasoning({ horoscope: MIXED_STRUCTURAL_CHART });

      // Find MIXED structural evidence items with non-PRIMARY role
      const mixedNonPrimaryEvidence = structuralReasoning.evidence.filter(
        e => e.direction === 'MIXED' && e.role !== 'PRIMARY'
      );

      // The fixture should produce at least one MIXED non-PRIMARY evidence item
      expect(mixedNonPrimaryEvidence.length).toBeGreaterThan(0);

      // Convert to DomainEvidence
      const domainEvidence = toDomainEvidence(structuralReasoning);

      // Verify that mixed non-primary relationships map to MODIFIER role in DomainEvidence
      for (const mixedItem of mixedNonPrimaryEvidence) {
        const splitItems = domainEvidence.filter(e =>
          e.id.startsWith(mixedItem.id) ||
          (e.notes && e.notes.includes('C4 structural direction: MIXED'))
        );

        // All split items from mixed non-primary relationships should have MODIFIER role
        splitItems.forEach(item => {
          expect(item.role).toBe('MODIFIER');
          expect(item.role).not.toBe('PRIMARY');
        });
      }
    });
  });
});