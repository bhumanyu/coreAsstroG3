export type EvidenceDomain = 'CAREER' | 'WEALTH';

export type EvidenceAxis =
  | 'NATAL'
  | 'DASHA'
  | 'TIMING'
  | 'DIVISIONAL'
  | 'MANIFESTATION';

export type EvidenceSource = 'D1' | 'D2' | 'D10' | 'DASHA' | 'TRANSIT';

export type EvidenceEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL';

export type EvidenceStrength = 'PRIMARY' | 'SECONDARY' | 'TERTIARY';

export interface EvidenceProvenance {
  readonly evidenceId: string;
  readonly ruleId: string;
  readonly domain: EvidenceDomain;
  readonly axis: EvidenceAxis;
  readonly source: EvidenceSource;
  readonly effect: EvidenceEffect;
  /**
   * Hierarchical structural role of the evidence (PRIMARY / SECONDARY / TERTIARY).
   * This is intentionally distinct from DomainEvidence.strength, which represents
   * empirical magnitude (STRONG / MODERATE / WEAK / VERY_STRONG).
   */
  readonly strength: EvidenceStrength;
}

/**
 * Asserts that all evidence items in the given collection have unique evidenceIds.
 * Throws an Error on the first duplicate encountered.
 */
export function assertUniqueEvidenceIds(
  evidence: readonly EvidenceProvenance[]
): void {
  const seen = new Set<string>();
  for (const item of evidence) {
    if (seen.has(item.evidenceId)) {
      throw new Error(`Duplicate evidenceId detected: ${item.evidenceId}`);
    }
    seen.add(item.evidenceId);
  }
}
