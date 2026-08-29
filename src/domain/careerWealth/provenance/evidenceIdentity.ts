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
