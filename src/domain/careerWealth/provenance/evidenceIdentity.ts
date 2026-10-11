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
  readonly objectKey?: string;
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
 * Format: CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]-<EFFECT>-<STRENGTH>
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
    input.subjectKey
  ];

  if (input.objectKey && input.objectKey.trim()) {
    segments.push(input.objectKey);
  }

  segments.push(input.effect);
  segments.push(input.strength);

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

/**
 * Parses a canonical evidence identity key into its semantic components.
 *
 * Validates that the key conforms to the canonical structure AND is already in
 * normalized form as produced by buildEvidenceIdentityKey():
 * CW-<DOMAIN>-<AXIS>-<SOURCE>-<RULE_ID>-<SUBJECT_KEY>[-<OBJECT_KEY>]
 *
 * Each positional segment is validated against known enum/value sets:
 * - DOMAIN must be one of: CAREER, WEALTH
 * - AXIS must be one of: NATAL, DASHA, TIMING, DIVISIONAL, MANIFESTATION
 * - SOURCE must be one of: D1, D2, D10, DASHA, TRANSIT, C4_STRUCTURAL_REASONING
 *
 * Additionally, every segment must be in canonical normalized form (no lowercase,
 * no whitespace, no special characters other than underscores). This rejects
 * malformed keys that the builder would never emit.
 *
 * Returns null for any key that does not conform to the canonical structure.
 * This ensures that non-canonical keys (e.g., raw occurrence-ID fallbacks) are safely ignored.
 *
 * @param key - The evidence identity key to parse
 * @returns The parsed components or null if the key is invalid
 */
export function parseEvidenceIdentityKey(
  key: string
): {
  domain: EvidenceDomain;
  axis: EvidenceAxis;
  source: EvidenceSource;
  ruleId: string;
  subjectKey: string;
  objectKey?: string;
} | null {
  if (!key || typeof key !== 'string') {
    return null;
  }

  const parts = key.split('-');

  // Must have at least 6 segments: CW, DOMAIN, AXIS, SOURCE, RULE_ID, SUBJECT_KEY
  // May have 7 segments if OBJECT_KEY is present
  if (parts.length < 6 || parts.length > 7) {
    return null;
  }

  // First segment must be 'CW'
  if (parts[0] !== 'CW') {
    return null;
  }

  const domain = parts[1] as EvidenceDomain;
  const axis = parts[2] as EvidenceAxis;
  const source = parts[3] as EvidenceSource;
  const ruleId = parts[4];
  const subjectKey = parts[5];
  const objectKey = parts[6]; // May be undefined

  // Validate domain
  // TODO: Derive from EvidenceDomain type definition in evidenceProvenance.ts to prevent drift
  const validDomains: readonly EvidenceDomain[] = ['CAREER', 'WEALTH'];
  if (!validDomains.includes(domain)) {
    return null;
  }

  // Validate axis
  // TODO: Derive from EvidenceAxis type definition in evidenceProvenance.ts to prevent drift
  const validAxes: readonly EvidenceAxis[] = ['NATAL', 'DASHA', 'TIMING', 'DIVISIONAL', 'MANIFESTATION'];
  if (!validAxes.includes(axis)) {
    return null;
  }

  // Validate source
  // TODO: Derive from EvidenceSource type definition in evidenceProvenance.ts to prevent drift
  const validSources: readonly EvidenceSource[] = ['D1', 'D2', 'D10', 'DASHA', 'TRANSIT', 'C4_STRUCTURAL_REASONING'];
  if (!validSources.includes(source)) {
    return null;
  }

  // Validate required fields are non-empty
  if (!ruleId || !subjectKey) {
    return null;
  }

  // Normalization enforcement: every segment must already be in canonical form
  // This rejects lowercase, whitespace-containing, or otherwise unnormalized values
  if (domain !== normalizeSegment(domain)) {
    return null;
  }
  if (axis !== normalizeSegment(axis)) {
    return null;
  }
  if (source !== normalizeSegment(source)) {
    return null;
  }
  if (ruleId !== normalizeSegment(ruleId)) {
    return null;
  }
  if (subjectKey !== normalizeSegment(subjectKey)) {
    return null;
  }

  // If objectKey is present (7 segments), it must not be empty/whitespace-only
  if (parts.length === 7) {
    if (!objectKey || !objectKey.trim()) {
      return null;
    }
    // ObjectKey must also be in canonical normalized form
    if (objectKey !== normalizeSegment(objectKey)) {
      return null;
    }
  }

  // Return parsed components
  return objectKey
    ? { domain, axis, source, ruleId, subjectKey, objectKey }
    : { domain, axis, source, ruleId, subjectKey };
}
