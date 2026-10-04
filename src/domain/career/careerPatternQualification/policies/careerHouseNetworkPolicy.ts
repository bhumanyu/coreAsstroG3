import type { CareerPatternClassification } from '../../careerPattern/careerPatternTypes';
import type {
  QualificationPolicy,
  QualificationPolicyContext,
  PolicyEvaluationResult,
  CareerPatternQualificationStatus,
  CareerPatternQualificationDimensions
} from '../careerPatternQualificationTypes';
import {
  generatePolicyEvidenceId,
  createQualificationEvidence,
  getEstablishingRelationshipIds
} from '../policyUtils';
import { computeQualificationDimensions, mapPlanetaryCondition, mapCareerRelevance } from '../careerPatternQualificationRules';

/**
 * P2-07A Career House Network Qualification Policy (Generic Carrier)
 *
 * Generic policy for CAREER_HOUSE_NETWORK classification.
 * This is a conservative carrier policy that never auto-QUALIFIED.
 *
 * Per spec §15: no universal threshold. This policy serves as a fallback
 * for patterns without specific family policies. It evaluates dimensions
 * but routes to INSUFFICIENT_DATA until methodology is frozen.
 *
 * Required structural facts:
 * - Any establishing relationship in pattern.provenance.establishingRelationshipIds
 *
 * Status precedence (per spec §24):
 * - No establishing relationships → UNQUALIFIED
 * - Establishing relationships present + conditions met → INSUFFICIENT_DATA (methodology deferred)
 * - Known disqualifier → UNQUALIFIED
 *
 * Dimension evaluation:
 * - structuralStrength: NOT_ASSESSED (methodology deferred)
 * - planetaryCondition: Aggregated from participant planets
 * - careerRelevance: Aggregated from participant planets
 * - coherence: MODERATE if establishing relationships present, INSUFFICIENT_DATA otherwise
 * - activationPotential: UNKNOWN (timing deferred)
 * - divisionalConfirmation: NOT_ASSESSED (D10 deferred)
 */
export class CareerHouseNetworkPolicy implements QualificationPolicy {
  readonly policyId = 'CAREER_HOUSE_NETWORK';
  readonly classification: CareerPatternClassification = 'CAREER_HOUSE_NETWORK';
  readonly description = 'Generic Career House Network qualification policy (conservative carrier, never auto-QUALIFIED)';

  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult {
    const { pattern, relevanceByPlanet, conditionByPlanet } = context;
    const establishingIds = getEstablishingRelationshipIds(pattern);

    const evidence: any[] = [];
    const insufficientDataReasons: string[] = [];
    let status: CareerPatternQualificationStatus = 'INSUFFICIENT_DATA';

    // Check for any establishing relationships
    if (establishingIds.length === 0) {
      // No establishing relationships
      status = 'UNQUALIFIED';
      evidence.push(
        createQualificationEvidence(
          generatePolicyEvidenceId(this.policyId, 'structuralStrength', pattern.identityKey, 1),
          'structuralStrength',
          'STRUCTURAL_RELATIONSHIP',
          pattern.patternId,
          establishingIds,
          'Career House Network has no establishing relationships. Disqualified.'
        )
      );
    } else {
      // Has establishing relationships - defer to legacy dimension computation
      evidence.push(
        createQualificationEvidence(
          generatePolicyEvidenceId(this.policyId, 'structuralStrength', pattern.identityKey, 1),
          'structuralStrength',
          'STRUCTURAL_RELATIONSHIP',
          pattern.patternId,
          establishingIds,
          `Career House Network has ${establishingIds.length} establishing relationship(s).`
        )
      );

      // Let legacy computeQualificationDimensions handle the actual status
      status = 'INSUFFICIENT_DATA'; // Will be overridden by caller
    }

    // Build dimensions using legacy computation
    const participantConditions = pattern.planets.map(p => {
      const condition = conditionByPlanet.get(p);
      return mapPlanetaryCondition(condition);
    });

    const participantRelevance = pattern.planets.map(p => {
      const relevance = relevanceByPlanet.get(p);
      return mapCareerRelevance(relevance);
    });

    const dimensions = computeQualificationDimensions(pattern, participantConditions, participantRelevance);

    // Build explanation
    const explanation = this.buildExplanation(status, dimensions, insufficientDataReasons);

    return Object.freeze({
      status,
      dimensions,
      evidence: Object.freeze(evidence),
      insufficientDataReasons: Object.freeze(insufficientDataReasons),
      ruleId: this.policyId,
      explanation
    });
  }

  private buildExplanation(
    status: CareerPatternQualificationStatus,
    dimensions: CareerPatternQualificationDimensions,
    insufficientDataReasons: readonly string[]
  ): string {
    const parts = [
      `Career House Network pattern (${this.classification})`,
      `has qualification status ${status}.`,
      `Structural strength: ${dimensions.structuralStrength}.`,
      `Planetary condition: ${dimensions.planetaryCondition}.`,
      `Career relevance: ${dimensions.careerRelevance}.`,
      `Coherence: ${dimensions.coherence}.`,
      `Activation potential: ${dimensions.activationPotential}.`,
      `Divisional confirmation: ${dimensions.divisionalConfirmation}.`
    ];

    if (insufficientDataReasons.length > 0) {
      parts.push(`Insufficient data reasons: ${insufficientDataReasons.join('; ')}.`);
    }

    return parts.join(' ');
  }
}
