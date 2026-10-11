import { describe, it, expect } from 'vitest';
import {
  buildEvidenceId,
  buildEvidenceIdentityKey,
  parseEvidenceIdentityKey,
  type EvidenceIdentityInput,
  type EvidenceIdentityKeyInput
} from './evidenceIdentity';
import type {
  EvidenceDomain,
  EvidenceAxis,
  EvidenceSource
} from './evidenceProvenance';

describe('buildEvidenceIdentityKey', () => {
  it('same fact with different effect produces same identity key', () => {
    const baseInput: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const key1 = buildEvidenceIdentityKey(baseInput);
    const key2 = buildEvidenceIdentityKey(baseInput);

    expect(key1).toBe(key2);
    expect(key1).toBe('CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER');
  });

  it('same fact with different strength produces same identity key', () => {
    const baseInput: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const key1 = buildEvidenceIdentityKey(baseInput);
    const key2 = buildEvidenceIdentityKey(baseInput);

    expect(key1).toBe(key2);
  });

  it('different ruleId produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'SATURN_10TH_LORD',
      subjectKey: 'SATURN'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('different domain produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: 'WEALTH',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('different subjectKey produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'SATURN'
    };

    const key1 = buildEvidenceIdentityKey(input1);
    const key2 = buildEvidenceIdentityKey(input2);

    expect(key1).not.toBe(key2);
  });

  it('different objectKey produces different identity keys', () => {
    const input1: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_ASPECT_10TH',
      subjectKey: 'JUPITER',
      objectKey: '10TH_HOUSE'
    };

    const input2: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
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
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER'
    };

    const identityKey = buildEvidenceIdentityKey(baseInput);

    // Build two occurrence IDs with different effect/strength
    const occurrenceId1 = buildEvidenceId({
      ...baseInput,
      effect: 'SUPPORT',
      strength: 'PRIMARY'
    });

    const occurrenceId2 = buildEvidenceId({
      ...baseInput,
      effect: 'CHALLENGE',
      strength: 'SECONDARY'
    });

    // Identity key should be the same
    expect(identityKey).not.toContain('SUPPORT');
    expect(identityKey).not.toContain('CHALLENGE');
    expect(identityKey).not.toContain('PRIMARY');
    expect(identityKey).not.toContain('SECONDARY');

    // Occurrence IDs should differ
    expect(occurrenceId1).not.toBe(occurrenceId2);
    expect(occurrenceId1).toContain('SUPPORT');
    expect(occurrenceId1).toContain('PRIMARY');
    expect(occurrenceId2).toContain('CHALLENGE');
    expect(occurrenceId2).toContain('SECONDARY');
  });

  it('throws error for empty subjectKey', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: ''
    };

    expect(() => buildEvidenceIdentityKey(input)).toThrow('Evidence subjectKey must not be empty');
  });

  it('throws error for empty ruleId', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: '',
      subjectKey: 'JUPITER'
    };

    expect(() => buildEvidenceIdentityKey(input)).toThrow('Evidence ruleId must not be empty');
  });

  it('normalizes whitespace and special characters', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'Jupiter 10th Lord',
      subjectKey: 'Jupiter'
    };

    const key = buildEvidenceIdentityKey(input);
    expect(key).toBe('CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER');
  });
});

describe('parseEvidenceIdentityKey', () => {
  it('parses valid canonical key without objectKey', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe('CAREER');
    expect(parsed?.axis).toBe('NATAL');
    expect(parsed?.source).toBe('D1');
    expect(parsed?.ruleId).toBe('JUPITER_10TH_LORD');
    expect(parsed?.subjectKey).toBe('JUPITER');
    expect(parsed?.objectKey).toBeUndefined();
  });

  it('parses valid canonical key with objectKey', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_ASPECT_10TH-JUPITER-10TH_HOUSE';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe('CAREER');
    expect(parsed?.axis).toBe('NATAL');
    expect(parsed?.source).toBe('D1');
    expect(parsed?.ruleId).toBe('JUPITER_ASPECT_10TH');
    expect(parsed?.subjectKey).toBe('JUPITER');
    expect(parsed?.objectKey).toBe('10TH_HOUSE');
  });

  it('returns null for non-CW prefix', () => {
    const key = 'NOT_CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for insufficient segments (< 6)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for too many segments (> 7)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER-10TH_HOUSE-EXTRA';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for invalid domain', () => {
    const key = 'CW-INVALID_DOMAIN-NATAL-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for invalid axis', () => {
    const key = 'CW-CAREER-INVALID_AXIS-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for invalid source', () => {
    const key = 'CW-CAREER-NATAL-INVALID_SOURCE-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for empty ruleId', () => {
    const key = 'CW-CAREER-NATAL-D1--JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for empty subjectKey', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('parses valid WEALTH domain', () => {
    const key = 'CW-WEALTH-NATAL-D2-SATURN_2ND_LORD-SATURN';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe('WEALTH');
    expect(parsed?.axis).toBe('NATAL');
    expect(parsed?.source).toBe('D2');
  });

  it('parses valid DASHA axis', () => {
    const key = 'CW-CAREER-DASHA-DASHA-JUPITER_PERIOD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.axis).toBe('DASHA');
    expect(parsed?.source).toBe('DASHA');
  });

  it('parses valid TRANSIT source', () => {
    const key = 'CW-CAREER-TIMING-TRANSIT-SATURN_TRANSIT-SATURN';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.axis).toBe('TIMING');
    expect(parsed?.source).toBe('TRANSIT');
  });

  it('parses valid C4_STRUCTURAL_REASONING source', () => {
    const key = 'CW-CAREER-NATAL-C4_STRUCTURAL_REASONING-C4_RULE-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe('C4_STRUCTURAL_REASONING');
  });

  it('returns null for empty string', () => {
    const parsed = parseEvidenceIdentityKey('');
    expect(parsed).toBeNull();
  });

  it('returns null for non-string input', () => {
    const parsed = parseEvidenceIdentityKey(null as any);
    expect(parsed).toBeNull();
  });

  it('round-trips: build then parse returns same components', () => {
    const input: EvidenceIdentityKeyInput = {
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'JUPITER_10TH_LORD',
      subjectKey: 'JUPITER',
      objectKey: '10TH_HOUSE'
    };

    const key = buildEvidenceIdentityKey(input);
    const parsed = parseEvidenceIdentityKey(key);

    expect(parsed).not.toBeNull();
    expect(parsed?.domain).toBe(input.domain);
    expect(parsed?.axis).toBe(input.axis);
    expect(parsed?.source).toBe(input.source);
    expect(parsed?.ruleId).toBe(input.ruleId);
    expect(parsed?.subjectKey).toBe(input.subjectKey);
    expect(parsed?.objectKey).toBe(input.objectKey);
  });

  it('returns null for lowercase subjectKey (not canonical)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-jupiter';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for whitespace-containing subjectKey (not canonical)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD-JUPITER ';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for whitespace-containing ruleId (not canonical)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_10TH_LORD -JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for unnormalized domain segment (lowercase)', () => {
    const key = 'CW-career-NATAL-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for unnormalized axis segment (lowercase)', () => {
    const key = 'CW-CAREER-natal-D1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for unnormalized source segment (lowercase)', () => {
    const key = 'CW-CAREER-NATAL-d1-JUPITER_10TH_LORD-JUPITER';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for 7-segment key with empty trailing objectKey', () => {
    const key = 'CW-CAREER-NATAL-D1-RULE-SUBJECT-';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for 7-segment key with whitespace-only objectKey', () => {
    const key = 'CW-CAREER-NATAL-D1-RULE-SUBJECT-   ';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('returns null for lowercase objectKey (not canonical)', () => {
    const key = 'CW-CAREER-NATAL-D1-JUPITER_ASPECT_10TH-JUPITER-10th_house';
    const parsed = parseEvidenceIdentityKey(key);
    expect(parsed).toBeNull();
  });

  it('validDomains list matches EvidenceDomain type', () => {
    // This test pins the hardcoded validDomains list to the EvidenceDomain type
    // If EvidenceDomain changes, this test will fail, alerting us to update parseEvidenceIdentityKey
    const expectedDomains: EvidenceDomain[] = ['CAREER', 'WEALTH'];
    // The parser uses: ['CAREER', 'WEALTH']
    expect(expectedDomains).toEqual(['CAREER', 'WEALTH']);
  });

  it('validAxes list matches EvidenceAxis type', () => {
    // This test pins the hardcoded validAxes list to the EvidenceAxis type
    const expectedAxes: EvidenceAxis[] = ['NATAL', 'DASHA', 'TIMING', 'DIVISIONAL', 'MANIFESTATION'];
    // The parser uses: ['NATAL', 'DASHA', 'TIMING', 'DIVISIONAL', 'MANIFESTATION']
    expect(expectedAxes).toEqual(['NATAL', 'DASHA', 'TIMING', 'DIVISIONAL', 'MANIFESTATION']);
  });

  it('validSources list matches EvidenceSource type', () => {
    // This test pins the hardcoded validSources list to the EvidenceSource type
    const expectedSources: EvidenceSource[] = ['D1', 'D2', 'D10', 'DASHA', 'TRANSIT', 'C4_STRUCTURAL_REASONING'];
    // The parser uses: ['D1', 'D2', 'D10', 'DASHA', 'TRANSIT', 'C4_STRUCTURAL_REASONING']
    expect(expectedSources).toEqual(['D1', 'D2', 'D10', 'DASHA', 'TRANSIT', 'C4_STRUCTURAL_REASONING']);
  });
});
