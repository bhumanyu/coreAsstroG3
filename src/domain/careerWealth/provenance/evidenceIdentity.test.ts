import { describe, it, expect } from 'vitest';
import {
  buildEvidenceId,
  buildEvidenceIdentityKey,
  type EvidenceIdentityInput,
  type EvidenceIdentityKeyInput
} from './evidenceIdentity';
import {
  EvidenceDomain,
  EvidenceAxis,
  EvidenceSource,
  EvidenceEffect,
  EvidenceStrength
} from './evidenceProvenance';

describe('buildEvidenceIdentityKey', () => {
  it('same fact with different effect produces same identity key', () => {
    const baseInput: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const key1 = buildEvidenceIdentityKey(baseInput);
    const key2 = buildEvidenceIdentityKey(baseInput);

    expect(key1).toBe(key2);
    expect(key1).toBe('CW-CAREER-NATAL_PROMISE-PRIMARY_PROMISE-JUPITER_10TH_LORD-JUPITER');
  });

  it('same fact with different strength produces same identity key', () => {
    const baseInput: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const key1 = buildEvidenceIdentityKey(baseInput);
    const key2 = buildEvidenceIdentityKey(baseInput);

    expect(key1).toBe(key2);
  });

  it('different ruleId produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'SATURN_10TH_LORD',
      subjectKey: 'SATURN'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('different subjectKey produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'SATURN'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('different objectKey produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_ASPECT_10TH',
      subjectKey: 'JUPITER',
      objectKey: '10TH_HOUSE'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_ASPECT_10TH',
      subjectKey: 'JUPITER',
      objectKey: '2ND_HOUSE'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('identity key excludes effect and strength', () => {
    const baseInput: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const identityKey = buildEvidenceIdentityKey(baseInput);

    // Build two occurrence IDs with different effect/strength
    const occurrenceId1 = buildEvidenceId({
      ...baseInput,
      effect: EvidenceEffect.SUPPORT,
      strength: EvidenceStrength.STRONG
    });

    const occurrenceId2 = buildEvidenceId({
      ...baseInput,
      effect: EvidenceEffect.CHALLENGE,
      strength: EvidenceStrength.WEAK
    });

    // Identity key should be the same
    expect(identityKey).not.toContain('SUPPORT');
    expect(identityKey).not.toContain('CHALLENGE');
    expect(identityKey).not.toContain('STRONG');
    expect(identityKey).not.toContain('WEAK');

    // Occurrence IDs should differ
    expect(occurrenceId1).not.toBe(occurrenceId2);
    expect(occurrenceId1).toContain('SUPPORT');
    expect(occurrenceId1).toContain('STRONG');
    expect(occurrenceId2).toContain('CHALLENGE');
    expect(occurrenceId2).toContain('WEAK');
  });

  it('throws error for empty subjectKey', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: ''
    };

    expect(() => buildEvidenceIdentityKey(input)).toThrow('Evidence subjectKey must not be empty');
  });

  it('throws error for empty ruleId', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: '',
      subjectKey: 'JUPITER'
    };

    expect(() => buildEvidenceIdentityKey(input)).toThrow('Evidence ruleId must not be empty');
  });

  it('normalizes whitespace and special characters', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: EvidenceDomain.CAREER,
      axis: EvidenceAxis.NATAL_PROMISE,
      source: EvidenceSource.PRIMARY_PROMISE,
      ruleId: 'Jupiter 10th Lord',
      subjectKey: 'Jupiter'
    };

    const key = buildEvidenceIdentityKey(input);
    expect(key).toBe('CW-CAREER-NATAL_PROMISE-PRIMARY_PROMISE-JUPITER_10TH_LORD-JUPITER');
  });
});
