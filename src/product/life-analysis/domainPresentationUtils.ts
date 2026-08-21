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
 * Resolves the display label for an evidence source type and domain evidence.
 */
export function resolveEvidenceSourceLabel(
  source: EvidenceSource,
  sourceType: EvidenceSourceType,
  evidence: DomainEvidence
): string {
  switch (sourceType) {
    case 'HOUSE':
      return 'Natal House (D1)';
    case 'LORDSHIP':
      return 'House Lordship (D1)';
    case 'PLANET':
      return 'Planetary Position (D1)';
    case 'ASPECT':
      return 'Graha Drishti / Aspect (D1)';
    case 'YOGA':
      return 'Natal Yoga (D1)';
    case 'STRENGTH':
      return 'Planetary Strength (D1)';
    case 'VARGA':
      return (source !== 'D1' && source !== 'OTHER' && VARGA_NAMES[source])
        ? VARGA_NAMES[source]
        : (source !== 'D1' && source !== 'OTHER' ? `Divisional Chart (${source})` : 'Divisional Chart');
    case 'DASHA':
      return evidence.timing?.periodKey
        ? `Dasha (${evidence.timing.periodKey})`
        : 'Vimshottari Dasha';
    case 'TRANSIT':
      return 'Gochara / Transit';
    case 'OTHER':
    default:
      return source === 'D1' ? 'Natal Chart (D1)' : 'Astrological Calculation';
  }
}

/**
 * Maps an astrological evidence source and domain evidence object to an EvidenceSourceViewModel.
 * Driven deterministically by `evidence.sourceType`.
 */
export function mapEvidenceSource(
  source: EvidenceSource,
  evidence: DomainEvidence
): EvidenceSourceViewModel {
  return Object.freeze({
    type: evidence.sourceType,
    label: resolveEvidenceSourceLabel(source, evidence.sourceType, evidence)
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
