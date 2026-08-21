import { isEvidenceSourceType, type EvidenceSourceType } from './evidenceSourceTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';

export function validateDomainEvidence(evidence: DomainEvidence): readonly string[] {
  const errors: string[] = [];
  if (!evidence.id || typeof evidence.id !== 'string' || evidence.id.trim() === '') {
    errors.push('Evidence id must be a non-empty string');
  }
  if (!isEvidenceSourceType(evidence.sourceType)) {
    errors.push(`Invalid or missing sourceType: ${String(evidence.sourceType)}`);
  }
  return Object.freeze(errors);
}
