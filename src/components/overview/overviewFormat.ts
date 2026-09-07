/**
 * Overview Presentation Formatters (P-UI-03)
 *
 * Presentation-only formatters. Does NOT mutate or calculate domain data.
 * Reconciles strictly over the canonical types from productAnalysisTypes.ts.
 */

import type {
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  ProductStatus
} from '../../product/analysis/productAnalysisTypes';

/**
 * Format ProductDirection over REAL literals:
 * 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED'
 */
export function formatDirection(direction?: ProductDirection | string): string {
  if (!direction) return 'Neutral';
  switch (direction) {
    case 'SUPPORT':
      return 'Supporting';
    case 'CHALLENGE':
      return 'Challenging';
    case 'NEUTRAL':
      return 'Neutral';
    case 'MIXED':
      return 'Mixed';
    default:
      return 'Neutral';
  }
}

/**
 * Format ProductEvidenceRole over REAL seven roles:
 * 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'MODIFIER' | 'REFINEMENT' | 'CONFLICTING' | 'NEUTRAL'
 */
export function formatEvidenceRole(role?: ProductEvidenceRole | string): string {
  if (!role) return 'Contextual';
  switch (role) {
    case 'PRIMARY':
      return 'Primary Driver';
    case 'SUPPORTING':
      return 'Supporting';
    case 'CHALLENGING':
      return 'Challenging';
    case 'MODIFIER':
      return 'Modifier';
    case 'REFINEMENT':
      return 'Refinement';
    case 'CONFLICTING':
      return 'Conflicting';
    case 'NEUTRAL':
      return 'Contextual';
    default:
      return 'Contextual';
  }
}

/**
 * Format ProductConfidence over REAL literals:
 * 'LOW' | 'MEDIUM' | 'HIGH'
 */
export function formatConfidence(confidence?: ProductConfidence | string): string {
  if (!confidence) return 'Medium Confidence';
  switch (confidence) {
    case 'HIGH':
      return 'High Confidence';
    case 'MEDIUM':
      return 'Medium Confidence';
    case 'LOW':
      return 'Low Confidence';
    default:
      return 'Medium Confidence';
  }
}

/**
 * Format free-form domain strength strings (e.g. 'STRONGLY_SUPPORTED', 'VERY_STRONG', 'UNAVAILABLE').
 * Normalizes snake_case into Title Case.
 * Partial/unavailable data: returns 'Unavailable', never 'Weak'.
 */
export function formatStrength(strength?: string): string {
  if (!strength || strength.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  return strength
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format ProductStatus over REAL literals:
 * 'READY' | 'PARTIAL' | 'ERROR'
 */
export function formatProductStatus(status?: ProductStatus | string): string {
  if (!status) return 'In Progress';
  switch (status) {
    case 'READY':
      return 'Complete';
    case 'PARTIAL':
      return 'Partial Assessment';
    case 'ERROR':
      return 'Calculation Issue';
    default:
      return 'In Progress';
  }
}

/**
 * Format relationship values (e.g. 'CONFIRMS', 'PARTIALLY_CONFIRMS', 'MODIFIES', 'CONFLICTS', 'UNAVAILABLE').
 */
export function formatRelationship(rel?: string): string {
  if (!rel || rel.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  return rel
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format qualification severity: 'LOW' | 'MEDIUM' | 'HIGH'
 */
export function formatSeverity(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | string): string {
  if (!severity) return 'Information';
  switch (severity) {
    case 'HIGH':
      return 'High Severity';
    case 'MEDIUM':
      return 'Moderate';
    case 'LOW':
      return 'Low Impact';
    default:
      return 'Information';
  }
}
