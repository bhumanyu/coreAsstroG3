/**
 * Domain presentation utilities for P-029 product layer.
 * Provides shared registry and formatting functions for domain display in UI.
 */

import type { DomainId } from '../../domain/interpretation';
import type {
  TimingActivationEffect,
  TransitTriggerEffect,
  EvidenceSource
} from '../../domain/interpretation';
import type { DomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type {
  EvidenceSourceViewModel,
  EvidenceSourceType
} from './lifeAnalysisEvidenceTypes';

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

const VARGA_NAMES: Record<string, string> = {
  D1: 'D1 Rasi',
  D2: 'D2 Hora',
  D3: 'D3 Drekkana',
  D7: 'D7 Saptamsa',
  D9: 'D9 Navamsa',
  D10: 'D10 Dasamsa',
  D12: 'D12 Dvadasamsa',
  D16: 'D16 Shodasamsa',
  D20: 'D20 Vimsamsa',
  D24: 'D24 Chaturvimsamsa',
  D27: 'D27 Saptavimsamsa',
  D30: 'D30 Trimsamsa',
  D40: 'D40 Khavedamsa',
  D45: 'D45 Akshavedamsa',
  D60: 'D60 Shastiamsa'
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
 * Maps an astrological evidence source and domain evidence object to an EvidenceSourceViewModel.
 */
export function mapEvidenceSource(
  source: EvidenceSource,
  evidence: DomainEvidence
): EvidenceSourceViewModel {
  const calculationId = evidence.ruleId;

  if (source === 'DASHA') {
    const periodLabel = evidence.timing?.periodKey
      ? `Dasha (${evidence.timing.periodKey})`
      : 'Vimshottari Dasha';
    return Object.freeze({
      type: 'DASHA' as EvidenceSourceType,
      label: periodLabel,
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (source === 'TRANSIT') {
    return Object.freeze({
      type: 'TRANSIT' as EvidenceSourceType,
      label: 'Gochara / Transit',
      ...(calculationId ? { calculationId } : {})
    });
  }

  // Check if it's a divisional chart other than D1
  if (source !== 'D1' && source !== 'OTHER') {
    const label = VARGA_NAMES[source] ?? `Divisional Chart (${source})`;
    return Object.freeze({
      type: 'VARGA' as EvidenceSourceType,
      label,
      ...(calculationId ? { calculationId } : {})
    });
  }

  // D1 Natal Chart source - classify based on evidenceFamily, ruleId, or source properties
  const family = evidence.evidenceFamily ?? '';
  const ruleId = evidence.ruleId ?? '';

  if (
    family.includes('HOUSE') ||
    family === 'TENTH_HOUSE' ||
    family === 'SIXTH_HOUSE' ||
    family === 'ELEVENTH_HOUSE' ||
    family === 'SECOND_HOUSE' ||
    family === 'FIFTH_HOUSE' ||
    family === 'NINTH_HOUSE' ||
    ruleId.includes('_HOUSE_') ||
    ruleId.includes('_10H_') ||
    ruleId.includes('_6H_') ||
    ruleId.includes('_11H_') ||
    ruleId.includes('_2H_') ||
    ruleId.includes('_5H_') ||
    ruleId.includes('_9H_')
  ) {
    return Object.freeze({
      type: 'HOUSE' as EvidenceSourceType,
      label: 'Natal House (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (
    family.includes('LORD') ||
    family === 'TENTH_LORD' ||
    family === 'SIXTH_LORD' ||
    family === 'ELEVENTH_LORD' ||
    family === 'SECOND_LORD' ||
    family === 'FIFTH_LORD' ||
    family === 'NINTH_LORD' ||
    ruleId.includes('_LORD_') ||
    ruleId.includes('_10L_') ||
    ruleId.includes('_6L_') ||
    ruleId.includes('_11L_') ||
    ruleId.includes('_2L_') ||
    ruleId.includes('_5L_') ||
    ruleId.includes('_9L_')
  ) {
    return Object.freeze({
      type: 'LORDSHIP' as EvidenceSourceType,
      label: 'House Lordship (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (
    family === 'SUN' ||
    family === 'MOON' ||
    family === 'MARS' ||
    family === 'MERCURY' ||
    family === 'JUPITER' ||
    family === 'VENUS' ||
    family === 'SATURN' ||
    family === 'RAHU' ||
    family === 'KETU' ||
    family === 'PLANET' ||
    ruleId.includes('_KARAKA_') ||
    ruleId.includes('_RELEVANCE_')
  ) {
    return Object.freeze({
      type: 'PLANET' as EvidenceSourceType,
      label: 'Planetary Position (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (family === 'ASPECT' || ruleId.includes('_ASPECT_')) {
    return Object.freeze({
      type: 'ASPECT' as EvidenceSourceType,
      label: 'Graha Drishti / Aspect (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (family === 'YOGA' || ruleId.includes('_YOGA_')) {
    return Object.freeze({
      type: 'YOGA' as EvidenceSourceType,
      label: 'Natal Yoga (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (family === 'PLANETARY_STRENGTH' || family === 'STRENGTH') {
    return Object.freeze({
      type: 'STRENGTH' as EvidenceSourceType,
      label: 'Planetary Strength (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  if (source === 'D1') {
    return Object.freeze({
      type: 'HOUSE' as EvidenceSourceType,
      label: 'Natal Rasi (D1)',
      ...(calculationId ? { calculationId } : {})
    });
  }

  return Object.freeze({
    type: 'OTHER' as EvidenceSourceType,
    label: 'Astrological Calculation',
    ...(calculationId ? { calculationId } : {})
  });
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
