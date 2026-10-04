import type { CareerPatternClassification } from '../careerPattern/careerPatternTypes';
import type { QualificationPolicy } from './careerPatternQualificationTypes';
import { ServiceToProfessionToGainsPolicy } from './policies/serviceToProfessionToGainsPolicy';
import { CareerHouseNetworkPolicy } from './policies/careerHouseNetworkPolicy';

/**
 * P2-07A Qualification Policy Registry
 *
 * This module maintains the registry of qualification policies mapped to
 * CareerPatternClassification values. Each policy implements deterministic
 * dimension-by-dimension evaluation based on structural facts.
 *
 * Policies are evaluated per-family based on pattern.classification. The
 * registry provides a lookup function to retrieve the appropriate policy
 * for a given classification.
 *
 * STATUS: IMPLEMENTED — VERIFICATION PENDING
 */

/**
 * Record mapping CareerPatternClassification to QualificationPolicy.
 *
 * Policies for:
 * - SERVICE_TO_PROFESSION_TO_GAINS (implemented)
 * - WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS (to be implemented)
 * - COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS (to be implemented)
 * - CREATIVE_DHARMA_TO_PROFESSION (to be implemented)
 * - DHARMA_KARMA_ALIGNMENT (to be implemented)
 * - KENDRA_TRIKONA_CAREER (to be implemented)
 * - UPACHAYA_CAREER_NETWORK (to be implemented)
 * - PARIVARTANA_CAREER_NETWORK (to be implemented)
 * - DUSTHANA_CAREER_TRANSFORMATION (to be implemented)
 * - CAREER_YOGA_STRUCTURE (to be implemented)
 * - CAREER_HOUSE_NETWORK (implemented - generic carrier, never auto-QUALIFIED)
 *
 * Additional classifications (PROFESSION_TO_GAINS, UPACHAYA_PROGRESSION,
 * PARIVARTANA_YOGA, AUTHORITY_PATTERN, PROFESSIONAL_RISE_PATTERN) will
 * be added in future phases as methodology is frozen.
 */
export const QUALIFICATION_POLICIES: Readonly<
  Record<CareerPatternClassification, QualificationPolicy | null>
> = Object.freeze({
  // Service-to-Profession-to-Gains family
  SERVICE_TO_PROFESSION_TO_GAINS: new ServiceToProfessionToGainsPolicy(),
  WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS: null, // To be implemented
  COMMUNICATION_TO_WORK_TO_PROFESSION_TO_GAINS: null, // To be implemented

  // Dharma/Karma family
  CREATIVE_DHARMA_TO_PROFESSION: null, // To be implemented
  DHARMA_KARMA_ALIGNMENT: null, // To be implemented

  // Structural families
  KENDRA_TRIKONA_CAREER: null, // To be implemented
  UPACHAYA_CAREER_NETWORK: null, // To be implemented

  // Transformation families
  PARIVARTANA_CAREER_NETWORK: null, // To be implemented
  DUSTHANA_CAREER_TRANSFORMATION: null, // To be implemented

  // Yoga family
  CAREER_YOGA_STRUCTURE: null, // To be implemented

  // Generic carrier (never auto-QUALIFIED)
  CAREER_HOUSE_NETWORK: new CareerHouseNetworkPolicy(),

  // Classifications without specific policies yet
  PROFESSION_TO_GAINS: null,
  UPACHAYA_PROGRESSION: null,
  PARIVARTANA_YOGA: null,
  AUTHORITY_PATTERN: null,
  PROFESSIONAL_RISE_PATTERN: null
});

/**
 * Retrieves the qualification policy for a given classification.
 *
 * @param classification - The pattern classification
 * @returns The qualification policy, or null if not yet implemented
 */
export function getQualificationPolicy(
  classification: CareerPatternClassification
): QualificationPolicy | null {
  return QUALIFICATION_POLICIES[classification] ?? null;
}

/**
 * Checks if a classification has an implemented policy.
 *
 * @param classification - The pattern classification
 * @returns true if a policy is registered, false otherwise
 */
export function hasQualificationPolicy(
  classification: CareerPatternClassification
): boolean {
  return QUALIFICATION_POLICIES[classification] !== null;
}

/**
 * Returns all classifications with implemented policies.
 *
 * @returns Array of classifications with registered policies
 */
export function getImplementedPolicyClassifications(): readonly CareerPatternClassification[] {
  const implemented: CareerPatternClassification[] = [];
  for (const [classification, policy] of Object.entries(QUALIFICATION_POLICIES)) {
    if (policy !== null) {
      implemented.push(classification as CareerPatternClassification);
    }
  }
  return Object.freeze(implemented);
}
