import type { FinalDomainConfidence } from './careerWealthFinalSynthesisTypes';

/**
 * Deterministically calculates synthesis confidence based on primary evidence count,
 * manifestation coverage, and divisional confirmation.
 */
export function calculateFinalConfidence(
  primaryEvidenceCount: number,
  supportingManifestations: number,
  challengingManifestations: number,
  divisionalConfirmation: boolean
): FinalDomainConfidence {
  if (primaryEvidenceCount === 0) {
    return 'LOW';
  }

  const activeManifestations = supportingManifestations + challengingManifestations;
  if (
    primaryEvidenceCount >= 2 &&
    (supportingManifestations >= 2 || challengingManifestations >= 2 || activeManifestations >= 3) &&
    divisionalConfirmation
  ) {
    return 'HIGH';
  }

  if (
    primaryEvidenceCount >= 1 &&
    (supportingManifestations >= 1 || challengingManifestations >= 1 || activeManifestations >= 1 || divisionalConfirmation)
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}
