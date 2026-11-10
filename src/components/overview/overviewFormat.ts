/**
 * Overview Presentation Formatters (P-UI-03).
 *
 * Adapter over the shared product-layer user-facing interpretation contract.
 * Canonical enums remain unchanged; only their display representation changes.
 */
import type {
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  ProductStatus
} from '../../product/analysis/productAnalysisTypes';
import {
  formatEvidenceConfidence,
  formatIndicationStrength,
  formatOutcome,
  formatUserFacingClassification
} from '../../product/life-analysis/userFacingInterpretation';

export function formatDirection(direction?: ProductDirection | string): string {
  return formatUserFacingClassification(direction);
}

export function formatEvidenceRole(role?: ProductEvidenceRole | string): string {
  return formatUserFacingClassification(role);
}

export function formatConfidence(confidence?: ProductConfidence | string): string {
  return formatEvidenceConfidence(confidence);
}

export function formatStrength(strength?: string): string {
  return formatIndicationStrength(strength);
}

export function formatProductStatus(status?: ProductStatus | string): string {
  switch (status) {
    case 'READY': return 'Complete';
    case 'PARTIAL': return 'Partially complete';
    case 'ERROR': return 'Could not be completed';
    default: return 'In progress';
  }
}

export function formatRelationship(rel?: string): string {
  if (!rel) return 'Not available';
  return formatUserFacingClassification(rel);
}

export function formatSeverity(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | string): string {
  switch (severity) {
    case 'HIGH': return 'High severity';
    case 'MEDIUM': return 'Moderate';
    case 'LOW': return 'Low impact';
    default: return 'Information';
  }
}

/** Outcome label for Overview domain cards; never concatenates other dimensions. */
export function formatDomainOutcome(status?: string): string {
  return formatOutcome(status);
}
