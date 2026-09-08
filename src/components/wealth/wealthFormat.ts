/**
 * Wealth Presentation Formatters (P-UI-05)
 *
 * Pure presentation formatters. Does NOT mutate or calculate domain data.
 * Reconciles strictly over the canonical types from productAnalysisTypes.ts.
 */

import type {
  ProductConfidence,
  ProductDirection,
  ProductEvidenceRole,
  PromiseStrength,
  ConclusionStatus,
  ActivationEffect,
  TransitEffect
} from '../../product/analysis/productAnalysisTypes';

/**
 * Format free-form domain strength strings (e.g. 'STRONGLY_SUPPORTED', 'VERY_STRONG', 'UNAVAILABLE').
 * Normalizes snake_case into Title Case.
 * Partial/unavailable data: returns 'Unavailable', never 'Weak'.
 */
export function formatStrength(strength?: PromiseStrength | string): string {
  if (!strength || strength.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  return strength
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format ConclusionStatus over canonical literals:
 * 'STRONGLY_SUPPORTED' | 'SUPPORTED' | 'MIXED' | 'CHALLENGED' | 'UNAVAILABLE'
 */
export function formatConclusionStatus(status?: ConclusionStatus | string): string {
  if (!status || status.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      return 'Strongly Supported';
    case 'SUPPORTED':
      return 'Supported';
    case 'MIXED':
      return 'Mixed';
    case 'CHALLENGED':
      return 'Challenged';
    default:
      return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Format ProductConfidence over REAL literals:
 * 'LOW' | 'MEDIUM' | 'HIGH'
 */
export function formatConfidence(confidence?: ProductConfidence | string): string {
  if (!confidence || confidence.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (confidence) {
    case 'HIGH':
      return 'High Confidence';
    case 'MEDIUM':
      return 'Medium Confidence';
    case 'LOW':
      return 'Low Confidence';
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
 * Format ProductEvidenceRole over REAL seven roles:
 * 'PRIMARY' | 'SUPPORTING' | 'CHALLENGING' | 'MODIFIER' | 'REFINEMENT' | 'CONFLICTING' | 'NEUTRAL'
 */
export function formatEvidenceRole(role?: ProductEvidenceRole | string): string {
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
 * Format D2 relationship values:
 * 'CONFIRMS' | 'PARTIALLY_CONFIRMS' | 'MODIFIES' | 'CONFLICTS' | 'UNAVAILABLE'
 */
export function formatD2Relationship(rel?: string): string {
  if (!rel || rel.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (rel) {
    case 'CONFIRMS':
      return 'Confirms';
    case 'PARTIALLY_CONFIRMS':
      return 'Partially Confirms';
    case 'MODIFIES':
      return 'Modifies';
    case 'CONFLICTS':
      return 'Conflicts';
    default:
      return 'Unavailable';
  }
}

/**
 * Format ActivationEffect values:
 * 'ACTIVATES' | 'CHALLENGES' | 'SUPPORTS' | 'NEUTRAL' | 'AMPLIFIES' | 'OBSTRUCTS' | 'UNAVAILABLE'
 */
export function formatActivationEffect(effect?: ActivationEffect | string): string {
  if (!effect || effect.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (effect) {
    case 'ACTIVATES':
      return 'Activates';
    case 'CHALLENGES':
      return 'Challenges';
    case 'SUPPORTS':
      return 'Supports';
    case 'NEUTRAL':
      return 'Neutral';
    case 'AMPLIFIES':
      return 'Amplifies';
    case 'OBSTRUCTS':
      return 'Obstructs';
    default:
      return 'Unavailable';
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
      return 'Unavailable';
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
 * Format speculative risk levels:
 * 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME' | 'UNAVAILABLE'
 */
export function formatSpeculativeRiskLevel(level?: string): string {
  if (!level || level.toUpperCase() === 'UNAVAILABLE') {
    return 'Unavailable';
  }
  switch (level.toUpperCase()) {
    case 'LOW':
      return 'Low Risk';
    case 'MODERATE':
      return 'Moderate Risk';
    case 'HIGH':
      return 'High Risk';
    case 'EXTREME':
      return 'Extreme Risk';
    default:
      return 'Unavailable';
  }
}

/**
 * Tailwind styling helper for ConclusionStatus badges
 */
export function getConclusionStatusBadgeClass(status?: ConclusionStatus | string): string {
  switch (status) {
    case 'STRONGLY_SUPPORTED':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'SUPPORTED':
      return 'bg-teal-950/60 border-teal-800/80 text-teal-300';
    case 'MIXED':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'CHALLENGED':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

/**
 * Tailwind styling helper for PromiseStrength badges
 */
export function getPromiseStrengthBadgeClass(strength?: PromiseStrength | string): string {
  const upper = strength?.toUpperCase();
  if (upper === 'VERY_STRONG' || upper === 'STRONG') {
    return 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300';
  }
  if (upper === 'MODERATE') {
    return 'bg-blue-950/60 border-blue-800/80 text-blue-300';
  }
  if (upper === 'WEAK' || upper === 'VERY_WEAK') {
    return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
  }
  return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
}

/**
 * Tailwind styling helper for Direction badges
 */
export function getDirectionBadgeClass(direction?: ProductDirection | string): string {
  switch (direction) {
    case 'SUPPORT':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'CHALLENGE':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MIXED':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
  }
}

/**
 * Tailwind styling helper for Severity badges
 */
export function getSeverityBadgeClass(severity?: 'LOW' | 'MEDIUM' | 'HIGH' | string): string {
  switch (severity) {
    case 'HIGH':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MEDIUM':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'LOW':
      return 'bg-blue-950/60 border-blue-800/80 text-blue-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
  }
}

/**
 * Tailwind styling helper for D2 Relationship badges
 */
export function getD2RelationshipBadgeClass(rel?: string): string {
  switch (rel) {
    case 'CONFIRMS':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'PARTIALLY_CONFIRMS':
      return 'bg-teal-950/60 border-teal-800/80 text-teal-300';
    case 'MODIFIES':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'CONFLICTS':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}

/**
 * Tailwind styling helper for Evidence Role badges
 */
export function getEvidenceRoleBadgeClass(role?: ProductEvidenceRole | string): string {
  switch (role) {
    case 'PRIMARY':
      return 'bg-purple-950/60 border-purple-800/80 text-purple-300';
    case 'SUPPORTING':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'CHALLENGING':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    case 'MODIFIER':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'REFINEMENT':
      return 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300';
    case 'CONFLICTING':
      return 'bg-orange-950/60 border-orange-800/80 text-orange-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-300';
  }
}

/**
 * Tailwind styling helper for Speculative Risk badges
 */
export function getSpeculativeRiskBadgeClass(level?: string): string {
  switch (level?.toUpperCase()) {
    case 'LOW':
      return 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300';
    case 'MODERATE':
      return 'bg-blue-950/60 border-blue-800/80 text-blue-300';
    case 'HIGH':
      return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    case 'EXTREME':
      return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    default:
      return 'bg-slate-800/60 border-slate-700/80 text-slate-400';
  }
}
