import type {
  Sign,
  Planet
} from '../../../types';
import type {
  CareerReferencePoint,
  Career10HContext,
  Career10HFoundation
} from './career10HFoundationTypes';

/**
 * P2-07F Career 10H Foundation Utility Functions
 *
 * This module provides utility functions for building IDs and frozen objects
 * for the 10H structural context layer.
 */

/**
 * Builds a deterministic context ID for a 10H context.
 * Format: CAREER_10H_CONTEXT:{refPoint}:{ascSign}:{moonSign}
 *
 * For LAGNA reference, moonSign is optional.
 * For MOON reference, both signs are required.
 */
export function buildCareer10HContextId(
  referencePoint: CareerReferencePoint,
  ascendantSign: Sign,
  moonSign?: Sign
): string {
  if (referencePoint === 'MOON' && !moonSign) {
    throw new Error('Moon reference point requires moonSign parameter');
  }
  const parts = ['CAREER_10H_CONTEXT', referencePoint, ascendantSign];
  if (moonSign) {
    parts.push(moonSign);
  }
  return parts.join(':');
}

/**
 * Builds a context ID from a horoscope-derived key.
 * Uses ascendant and moon signs from the horoscope.
 */
export function buildCareer10HContextIdFromHoroscope(
  referencePoint: CareerReferencePoint,
  ascendantSign: Sign,
  moonSign: Sign
): string {
  return buildCareer10HContextId(referencePoint, ascendantSign, moonSign);
}

/**
 * Builds a foundation ID from both contexts.
 * Format: CAREER_10H_FOUNDATION:{ascSign}:{moonSign}
 */
export function buildCareer10HFoundationId(
  ascendantSign: Sign,
  moonSign: Sign
): string {
  return `CAREER_10H_FOUNDATION:${ascendantSign}:${moonSign}`;
}

/**
 * Builds an evidence ID for 10H context evidence.
 * Format: CAREER_10H_EVIDENCE:{refPoint}:{evidenceType}:{detail}
 */
export function buildCareer10HEvidenceId(
  referencePoint: CareerReferencePoint,
  evidenceType: string,
  detail: string
): string {
  return `CAREER_10H_EVIDENCE:${referencePoint}:${evidenceType}:${detail}`;
}

/**
 * Creates a frozen copy of a 10H context.
 * Ensures immutability for all nested arrays and objects.
 */
export function freezeCareer10HContext(context: Career10HContext): Career10HContext {
  return Object.freeze({
    ...context,
    occupants: Object.freeze([...context.occupants]),
    aspectsOn10H: Object.freeze(context.aspectsOn10H.map(aspect =>
      Object.freeze({ ...aspect })
    )),
    provenance: Object.freeze({
      ...context.provenance,
      drishtiAspectIds: Object.freeze([...context.provenance.drishtiAspectIds])
    })
  });
}

/**
 * Creates a frozen copy of a 10H foundation.
 * Ensures immutability for both contexts.
 */
export function freezeCareer10HFoundation(foundation: Career10HFoundation): Career10HFoundation {
  return Object.freeze({
    lagnaContext: foundation.lagnaContext
      ? freezeCareer10HContext(foundation.lagnaContext)
      : null,
    moonContext: foundation.moonContext
      ? freezeCareer10HContext(foundation.moonContext)
      : null
  });
}

/**
 * Sorts participant IDs in canonical order.
 * Uses the Planet enum order for determinism.
 */
export function sortParticipantIds(ids: readonly string[]): readonly string[] {
  return [...ids].sort();
}

/**
 * Deduplicates and sorts participant IDs.
 */
export function dedupParticipantIds(ids: readonly string[]): readonly string[] {
  return sortParticipantIds([...new Set(ids)]);
}

/**
 * Validates that a reference point is valid.
 */
export function isValidReferencePoint(value: unknown): value is CareerReferencePoint {
  return value === 'LAGNA' || value === 'MOON';
}

/**
 * Validates that a house number is in valid range (1-12).
 */
export function isValidHouseNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12;
}
