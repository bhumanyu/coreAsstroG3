import { describe, expect, it } from 'vitest';

import {
  buildCareerStructuralReasoning,
  toDomainEvidence
} from './careerStructuralReasoningIntegration';

import {
  MIXED_STRUCTURAL_CHART
} from './__fixtures__/structural/mixedStructuralChart.fixture';

import {
  classifyReasoningEvidence
} from '../reasoning/reasoningHierarchy';

import {
  deduplicateReasoningEvidence
} from '../reasoning/deduplicateEvidence';

describe('C4 MIXED evidence identity contract', () => {
  it('produces distinct occurrence ids for the SUPPORTING and CHALLENGING occurrences', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const mixedEvidence =
      structuralReasoning.evidence.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedEvidence.length)
      .toBeGreaterThan(0);

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    for (const mixed of mixedEvidence) {
      const occurrences =
        domainEvidence.filter(
          (evidence) =>
            evidence.id.startsWith(mixed.id)
        );

      expect(occurrences)
        .toHaveLength(2);

      const supporting =
        occurrences.find(
          (evidence) =>
            evidence.polarity === 'SUPPORTING'
        );

      const challenging =
        occurrences.find(
          (evidence) =>
            evidence.polarity === 'CHALLENGING'
        );

      expect(supporting)
        .toBeDefined();

      expect(challenging)
        .toBeDefined();

      expect(supporting!.id)
        .not.toBe(challenging!.id);
    }
  });

  it('preserves one shared semantic rule identity across MIXED occurrences', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const mixedEvidence =
      structuralReasoning.evidence.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedEvidence.length)
      .toBeGreaterThan(0);

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    for (const mixed of mixedEvidence) {
      const occurrences =
        domainEvidence.filter(
          (evidence) =>
            evidence.id.startsWith(mixed.id)
        );

      expect(occurrences)
        .toHaveLength(2);

      const ruleIds =
        new Set(
          occurrences.map(
            (evidence) =>
              evidence.ruleId
          )
        );

      expect(ruleIds.size)
        .toBe(1);

      const [ruleId] =
        Array.from(ruleIds);

      expect(ruleId)
        .toBeDefined();

      expect(ruleId)
        .not.toContain('SUPPORTING');

      expect(ruleId)
        .not.toContain('CHALLENGING');
    }
  });

  it('preserves MIXED effect in provenance for both occurrences', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const mixedOccurrences =
      domainEvidence.filter(
        (evidence) =>
          evidence.notes?.includes(
            'C4 structural direction: MIXED'
          )
      );

    expect(mixedOccurrences.length)
      .toBeGreaterThan(0);

    for (const evidence of mixedOccurrences) {
      expect(
        evidence.provenance
      ).toBeDefined();

      expect(
        evidence.provenance?.source
      ).toBe(
        'C4_STRUCTURAL_REASONING'
      );

      expect(
        evidence.provenance?.effect
      ).toBe('MIXED');
    }
  });

  it('uses the same semantic subject/object identity for both MIXED occurrences', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const mixedEvidence =
      structuralReasoning.evidence.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedEvidence.length)
      .toBeGreaterThan(0);

    for (const mixed of mixedEvidence) {
      const occurrences =
        domainEvidence.filter(
          (evidence) =>
            evidence.id.startsWith(mixed.id)
        );

      expect(occurrences)
        .toHaveLength(2);

      const supporting =
        occurrences.find(
          (evidence) =>
            evidence.polarity === 'SUPPORTING'
        );

      const challenging =
        occurrences.find(
          (evidence) =>
            evidence.polarity === 'CHALLENGING'
        );

      expect(supporting)
        .toBeDefined();

      expect(challenging)
        .toBeDefined();

      expect(supporting!.house)
        .toBe(challenging!.house);

      expect(
        supporting!.provenance?.domain
      ).toBe(
        challenging!.provenance?.domain
      );

      expect(
        supporting!.provenance?.axis
      ).toBe(
        challenging!.provenance?.axis
      );

      expect(
        supporting!.provenance?.ruleId
      ).toBe(
        challenging!.provenance?.ruleId
      );
    }
  });

  it('derives the same identityKey for both MIXED occurrences', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const mixedEvidence =
      structuralReasoning.evidence.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedEvidence.length)
      .toBeGreaterThan(0);

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    for (const mixed of mixedEvidence) {
      const occurrences =
        domainEvidence.filter(
          (evidence) =>
            evidence.id.startsWith(mixed.id)
        );

      expect(occurrences)
        .toHaveLength(2);

      const occurrenceIds =
        new Set(
          occurrences.map(
            (evidence) =>
              evidence.id
          )
        );

      expect(occurrenceIds.size)
        .toBe(2);

      const weightedOccurrences =
        weighted.filter(
          (evidence) =>
            occurrenceIds.has(
              evidence.evidenceId
            )
        );

      expect(weightedOccurrences)
        .toHaveLength(2);

      expect(
        weightedOccurrences[0].identityKey
      ).toBe(
        weightedOccurrences[1].identityKey
      );
    }
  });

  it('maps each individual C4 MIXED occurrence pair to exactly one identityKey', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    const mixedEvidence =
      structuralReasoning.evidence.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedEvidence.length)
      .toBeGreaterThan(0);

    for (const mixed of mixedEvidence) {
      const occurrenceIds =
        new Set(
          domainEvidence
            .filter(
              (evidence) =>
                evidence.id.startsWith(mixed.id)
            )
            .map(
              (evidence) =>
                evidence.id
            )
        );

      expect(occurrenceIds.size)
        .toBe(2);

      const weightedOccurrences =
        weighted.filter(
          (evidence) =>
            occurrenceIds.has(
              evidence.evidenceId
            )
        );

      expect(weightedOccurrences)
        .toHaveLength(2);

      expect(
        weightedOccurrences[0].identityKey
      ).toBe(
        weightedOccurrences[1].identityKey
      );
    }
  });

  it('deduplicates MIXED occurrences into exactly one canonical semantic fact', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    const mixedWeighted =
      weighted.filter(
        (evidence) =>
          evidence.identityKey.includes(
            'CAREER'
          ) &&
          evidence.ruleId?.startsWith(
            'CAREER_STRUCTURAL_'
          )
      );

    const canonical =
      deduplicateReasoningEvidence(
        mixedWeighted
      );

    const mixedCanonical =
      canonical.filter(
        (evidence) =>
          evidence.direction === 'MIXED'
      );

    expect(mixedCanonical.length)
      .toBeGreaterThan(0);

    for (const evidence of mixedCanonical) {
      expect(evidence.occurrenceCount)
        .toBeGreaterThanOrEqual(2);

      expect(evidence.evidenceId)
        .toBe(evidence.identityKey);
    }
  });

  it('retains both occurrence ids as sourceIds after semantic deduplication', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    const canonical =
      deduplicateReasoningEvidence(
        weighted
      );

    const mixedCanonical =
      canonical.filter(
        (evidence) =>
          evidence.direction === 'MIXED' &&
          evidence.ruleId?.startsWith(
            'CAREER_STRUCTURAL_'
          )
      );

    expect(mixedCanonical.length)
      .toBeGreaterThan(0);

    for (const evidence of mixedCanonical) {
      expect(
        evidence.sourceIds.length
      ).toBe(
        evidence.occurrenceCount
      );

      expect(
        new Set(evidence.sourceIds).size
      ).toBe(
        evidence.sourceIds.length
      );

      expect(
        evidence.sourceIds.length
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('does not add the two MIXED occurrences together as evidentiary weight', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    const canonical =
      deduplicateReasoningEvidence(
        weighted
      );

    const mixedOccurrences =
      weighted.filter(
        (evidence) =>
          evidence.ruleId?.startsWith(
            'CAREER_STRUCTURAL_'
          )
      );

    const mixedCanonical =
      canonical.filter(
        (evidence) =>
          evidence.ruleId?.startsWith(
            'CAREER_STRUCTURAL_'
          ) &&
          evidence.direction === 'MIXED'
      );

    expect(mixedCanonical.length)
      .toBeGreaterThan(0);

    for (const canonicalEvidence of mixedCanonical) {
      const occurrences =
        mixedOccurrences.filter(
          (evidence) =>
            evidence.identityKey ===
            canonicalEvidence.identityKey
        );

      expect(occurrences.length)
        .toBeGreaterThanOrEqual(2);

      const maximumSingleOccurrenceWeight =
        Math.max(
          ...occurrences.map(
            (evidence) =>
              evidence.weight
          )
        );

      const summedOccurrenceWeight =
        occurrences.reduce(
          (sum, evidence) =>
            sum + evidence.weight,
          0
        );

      expect(
        canonicalEvidence.weight
      ).toBe(
        maximumSingleOccurrenceWeight
      );

      expect(
        canonicalEvidence.weight
      ).toBeLessThan(
        summedOccurrenceWeight
      );
    }
  });

  it('is deterministic regardless of SUPPORTING/CHALLENGING occurrence order', () => {
    const structuralReasoning =
      buildCareerStructuralReasoning({
        horoscope: MIXED_STRUCTURAL_CHART
      });

    const domainEvidence =
      toDomainEvidence(
        structuralReasoning
      );

    const weighted =
      classifyReasoningEvidence(
        domainEvidence
      );

    const forward =
      deduplicateReasoningEvidence(
        weighted
      );

    const reverse =
      deduplicateReasoningEvidence(
        [...weighted].reverse()
      );

    expect(reverse)
      .toEqual(forward);
  });
});
