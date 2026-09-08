/**
 * Dasha Presentation Formatters (P-UI-07)
 *
 * Pure presentation formatters. Does NOT mutate or calculate domain data.
 * Reconciles strictly over the canonical types from productAnalysisTypes.ts.
 */

import type {
  ProductAvailability,
  ProductDirection,
  ProductEvidenceRole,
  ProductDashaPeriod,
  TransitEffect
} from '../../product/analysis/productAnalysisTypes';

/**
 * Format ProductAvailability over all 4 canonical literals:
 * 'AVAILABLE' | 'UNAVAILABLE' | 'CONDITIONAL' | 'PARTIAL'
 */
export function formatAvailability(availability?: ProductAvailability | string): string {
  if (!availability || availability.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (availability) {
    case 'AVAILABLE':
      return 'Available';
    case 'PARTIAL':
      return 'Partial';
    case 'CONDITIONAL':
      return 'Conditional';
    default:
      return 'Unavailable';
  }
}

/**
 * Format ProductDirection over REAL literals:
 * 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED'
 */
export function formatDirection(direction?: ProductDirection | string): string {
  if (!direction || direction.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
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
      return 'Unavailable';
  }
}

/**
 * Format ProductEvidenceRole over REAL 7 roles:
 * 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'MODIFIER' | 'REFINEMENT' | 'CONFLICTING' | 'NEUTRAL'
 */
export function formatRole(role?: ProductEvidenceRole | string): string {
  if (!role || role.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
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
      return 'Unavailable';
  }
}

/**
 * Format ProductDashaPeriod level: 'MD' | 'AD' | 'PD'
 */
export function formatDashaLevel(level?: ProductDashaPeriod['level'] | string): string {
  if (!level) return 'Unavailable';
  switch (level) {
    case 'MD':
      return 'Mahadasha (MD)';
    case 'AD':
      return 'Antardasha (AD)';
    case 'PD':
      return 'Pratyantardasha (PD)';
    default:
      return level;
  }
}

/**
 * Format TransitEffect values:
 * 'TRIGGER' | 'MODIFIER' | 'CHALLENGE' | 'NO_MATERIAL_TRIGGER' | 'UNKNOWN' | 'INSUFFICIENT_DATA' | 'UNAVAILABLE'
 */
export function formatTransitEffect(effect?: TransitEffect | string): string {
  if (!effect || effect.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (effect) {
    case 'TRIGGER':
      return 'Trigger';
    case 'MODIFIER':
      return 'Modifier';
    case 'CHALLENGE':
      return 'Challenge';
    case 'NO_MATERIAL_TRIGGER':
      return 'No Material Trigger';
    case 'UNKNOWN':
      return 'Unknown';
    case 'INSUFFICIENT_DATA':
      return 'Insufficient Data';
    default:
      return effect
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Format qualification severity: 'LOW' | 'MEDIUM' | 'HIGH'
 */
export function formatSeverity(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | string): string {
  if (!severity || severity.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (severity) {
    case 'HIGH':
      return 'High Severity';
    case 'MEDIUM':
      return 'Moderate';
    case 'LOW':
      return 'Low Impact';
    default:
      return 'Unavailable';
  }
}

/**
 * CSS badge class for ProductAvailability
 */
export function getAvailabilityBadgeClass(availability?: ProductAvailability | string): string {
  switch (availability) {
    case 'AVAILABLE':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'PARTIAL':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'CONDITIONAL':
      return 'bg-blue-950/60 border-blue-800/80 text-blue-300';
    case 'UNAVAILABLE':
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

/**
 * CSS badge class for ProductDirection
 */
export function getDirectionBadgeClass(direction?: ProductDirection | string): string {
  switch (direction) {
    case 'SUPPORT':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'CHALLENGE':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MIXED':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'NEUTRAL':
      return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

/**
 * CSS badge class for ProductEvidenceRole
 */
export function getRoleBadgeClass(role?: ProductEvidenceRole | string): string {
  switch (role) {
    case 'PRIMARY':
      return 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300';
    case 'SUPPORTING':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'CHALLENGING':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MODIFIER':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'REFINEMENT':
      return 'bg-sky-950/60 border-sky-800/80 text-sky-300';
    case 'CONFLICTING':
      return 'bg-purple-950/60 border-purple-800/80 text-purple-300';
    case 'NEUTRAL':
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

/**
 * CSS badge class for Severity
 */
export function getSeverityBadgeClass(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | string): string {
  switch (severity) {
    case 'HIGH':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MEDIUM':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'LOW':
      return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}
