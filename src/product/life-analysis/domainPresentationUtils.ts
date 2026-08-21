/**
 * Domain presentation utilities for P-029 product layer.
 * Provides shared registry and formatting functions for domain display in UI.
 */

import type { DomainId } from '../../domain/interpretation';
import type { TimingActivationEffect, TransitTriggerEffect } from '../../domain/interpretation';

/**
 * Map of domain IDs to their UI display names.
 * Used consistently across all P-029 components.
 * Stage-1 only supports CAREER and WEALTH; others are included for future expansion.
 */
export const DOMAIN_DISPLAY_NAMES: Record<DomainId | string, string> = {
  CAREER: 'Career',
  WEALTH: 'Wealth',
  MARRIAGE: 'Marriage',
  CHILDREN: 'Children',
  PROPERTY: 'Property',
  HEALTH: 'Health',
  SPIRITUALITY: 'Spirituality'
};

/**
 * Format a domain ID to its UI display name.
 * Falls back to title-casing the domain ID if not in registry.
 */
export function formatDomainDisplayName(domain: DomainId | string): string {
  if (domain in DOMAIN_DISPLAY_NAMES) {
    return DOMAIN_DISPLAY_NAMES[domain];
  }
  // Fallback: title case the domain
  return domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase();
}

/**
 * Format analysis data completeness label for UI display.
 */
export function formatCompletenessLabel(
  overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
): string {
  switch (overall) {
    case 'COMPLETE':
      return 'Complete Analysis';
    case 'PARTIAL':
      return 'Partial Analysis';
    case 'INSUFFICIENT_DATA':
      return 'Insufficient Data';
    default:
      return 'Unknown';
  }
}

/**
 * Map data completeness level to product status for UI state.
 */
export function mapProductStatus(
  overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA'
): 'READY' | 'PARTIAL' | 'INSUFFICIENT_DATA' {
  if (overall === 'COMPLETE') {
    return 'READY';
  }
  if (overall === 'PARTIAL') {
    return 'PARTIAL';
  }
  return 'INSUFFICIENT_DATA';
}

/**
 * Map a Dasha/Timing activation effect to a UI tone for styling/presentation.
 * Used to classify visual treatment (positive, warning, negative, neutral).
 */
export function getTimingEffectTone(
  effect: TimingActivationEffect | string | undefined
): 'positive' | 'warning' | 'negative' | 'neutral' {
  switch (effect) {
    case 'ACTIVATES':
    case 'PARTIALLY_ACTIVATES':
      return 'positive';
    case 'CHALLENGES':
      return 'negative';
    case 'DOES_NOT_ACTIVATE':
    case 'INSUFFICIENT_DATA':
      return 'neutral';
    default:
      return 'neutral';
  }
}

/**
 * Map a Transit trigger effect to a UI tone for styling/presentation.
 * Used to classify visual treatment (positive, warning, negative, neutral).
 */
export function getTransitEffectTone(
  effect: TransitTriggerEffect | string | undefined
): 'positive' | 'warning' | 'negative' | 'neutral' {
  switch (effect) {
    case 'TRIGGER':
      return 'positive';
    case 'CHALLENGE':
      return 'negative';
    case 'MODIFIER':
      return 'warning';
    case 'NO_MATERIAL_TRIGGER':
    case 'INSUFFICIENT_DATA':
      return 'neutral';
    default:
      return 'neutral';
  }
}
