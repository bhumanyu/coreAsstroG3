import type {
  EvidenceAxis,
  EvidenceDomain,
  EvidenceEffect,
  EvidenceSource,
  EvidenceStrength
} from './evidenceProvenance';

export interface EvidenceIdentityInput {
  readonly domain: EvidenceDomain;
  readonly axis: EvidenceAxis;
  readonly source: EvidenceSource;
  readonly ruleId: string;
  readonly subjectKey: string;
  readonly effect: EvidenceEffect;
  readonly strength: EvidenceStrength;
}

export interface EvidenceIdentityKeyInput {
  readonly domain: EvidenceDomain;
  readonly axis: EvidenceAxis;
  readonly source: EvidenceSource;
  readonly ruleId: string;
  readonly subjectKey: string;
  readonly objectKey?: string;
}

function normalizeSegment(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Builds a deterministic, human-readable evidence identifier.
 * Format: CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>-<EFFECT>-<STRENGTH>
 */
export function buildEvidenceId(input: EvidenceIdentityInput): string {
  if (!input.subjectKey || !input.subjectKey.trim()) {
    throw new Error('Evidence subjectKey must not be empty');
  }

  if (!input.ruleId || !input.ruleId.trim()) {
    throw new Error('Evidence ruleId must not be empty');
  }

  const segments = [
    'CW',
    input.domain,
    input.axis,
    input.source,
    input.ruleId,
    input.subjectKey,
    input.effect,
    input.strength
  ];

  return segments.map(normalizeSegment).join('-');
}

/**
 * Builds a canonical evidence identity key from ONLY semantic fields.
 * Excludes effect, strength, and any layer/prose to enable identity-based deduplication.
 * Same fact with different direction/strength will have the same identity key.
 * Format: CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]
 */
export function buildEvidenceIdentityKey(input: EvidenceIdentityKeyInput): string {
  if (!input.subjectKey || !input.subjectKey.trim()) {
    throw new Error('Evidence subjectKey must not be empty');
  }

  if (!input.ruleId || !input.ruleId.trim()) {
    throw new Error('Evidence ruleId must not be empty');
  }

  const segments = [
    'CW',
    input.domain,
    input.axis,
    input.source,
    input.ruleId,
    input.subjectKey
  ];

  if (input.objectKey && input.objectKey.trim()) {
    segments.push(input.objectKey);
  }

  return segments.map(normalizeSegment).join('-');
}
