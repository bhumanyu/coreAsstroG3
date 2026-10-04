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
 * P2-07A Service-to-Profession-to-Gains Qualification Policy
 *
 * Policy for SERVICE_TO_PROFESSION_TO_GAINS classification.
 *
 * Required structural facts:
 * - Establishing relationship 6→10 (Service to Profession)
 * - Establishing relationship 10→11 (Profession to Gains)
 *
 * Status precedence (per spec §24):
 * - Prerequisite explicitly absent → UNQUALIFIED
 * - Prerequisite unevaluable → INSUFFICIENT_DATA
 * - Prerequisites confirmed + conditions met → QUALIFIED
 * - Known disqualifier → UNQUALIFIED
 *
 * Dimension evaluation:
 * - structuralStrength: NOT_ASSESSED (methodology deferred)
 * - planetaryCondition: Aggregated from participant planets
 * - careerRelevance: Aggregated from participant planets
 * - coherence: MODERATE if both relationships present, INSUFFICIENT_DATA otherwise
 * - activationPotential: UNKNOWN (timing deferred)
 * - divisionalConfirmation: NOT_ASSESSED (D10 deferred)
 */
export class ServiceToProfessionToGainsPolicy implements QualificationPolicy {
  readonly policyId = 'SERVICE_TO_PROFESSION_TO_GAINS';
  readonly classification: CareerPatternClassification = 'SERVICE_TO_PROFESSION_TO_GAINS';
  readonly description = 'Service (6H) → Profession (10H) → Gains (11H) network qualification policy';

  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult {
    const { pattern, relevanceByPlanet, conditionByPlanet } = context;
    const establishingIds = getEstablishingRelationshipIds(pattern);

    const evidence: any[] = [];
    const insufficientDataReasons: string[] = [];
    let status: CareerPatternQualificationStatus = 'INSUFFICIENT_DATA';

    // Check for required establishing relationships
    // For SERVICE_TO_PROFESSION_TO_GAINS, we need both 6→10 and 10→11
    const has6to10 = establishingIds.some(id => id.includes('6→10') || id.includes('6-10'));
    const has10to11 = establishingIds.some(id => id.includes('10→11') || id.includes('10-11'));

    if (!has6to10 && !has10to11) {
      // Both prerequisites explicitly absent
      status = 'UNQUALIFIED';
      evidence.push(
        createQualificationEvidence(
          generatePolicyEvidenceId(this.policyId, 'structuralStrength', pattern.identityKey, 1),
          'structuralStrength',
          'STRUCTURAL_RELATIONSHIP',
          pattern.patternId,
          establishingIds,
          'Service-to-Profession-to-Gains requires both 6→10 and 10→11 establishing relationships. Neither found.'
        )
      );
    } else if (!has6to10 || !has10to11) {
      // One prerequisite absent, one present
      status = 'UNQUALIFIED';
      const missing = !has6to10 ? '6→10' : '10→11';
      evidence.push(
        createQualificationEvidence(
          generatePolicyEvidenceId(this.policyId, 'structuralStrength', pattern.identityKey, 1),
          'structuralStrength',
          'STRUCTURAL_RELATIONSHIP',
          pattern.patternId,
          establishingIds,
          `Service-to-Profession-to-Gains requires both 6→10 and 10→11 establishing relationships. Missing: ${missing}.`
        )
      );
    } else {
      // Both prerequisites present - defer to legacy dimension computation
      evidence.push(
        createQualificationEvidence(
          generatePolicyEvidenceId(this.policyId, 'structuralStrength', pattern.identityKey, 1),
          'structuralStrength',
          'STRUCTURAL_RELATIONSHIP',
          pattern.patternId,
          establishingIds,
          'Service-to-Profession-to-Gains has both required establishing relationships: 6→10 and 10→11.'
        )
      );

      // Let legacy computeQualificationDimensions handle the actual status
      // based on planetary condition, relevance, etc.
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
      `Service-to-Profession-to-Gains pattern (${this.classification})`,
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
