import type { CareerPatternClassification } from '../../careerPattern/careerPatternTypes';
import type {
  QualificationPolicy,
  QualificationPolicyContext,
  PolicyEvaluationResult,
  CareerPatternQualificationStatus,
  CareerPatternQualificationDimensions,
  QualificationEvidence
} from '../careerPatternQualificationTypes';
import {
  generatePolicyEvidenceId,
  createQualificationEvidence,
  getEstablishingRelationshipIds,
  hasDirectedHouseRelationshipInPattern
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
 * Status precedence (per spec §24 decision chain):
 * 1. Prerequisite explicitly absent → UNQUALIFIED
 * 2. Prerequisite unevaluable → INSUFFICIENT_DATA
 * 3. Prerequisites confirmed + all evaluable dimensions positive → INSUFFICIENT_DATA (structural strength methodology not frozen)
 * 4. Known disqualifier (WEAK condition, NEUTRAL relevance) → UNQUALIFIED
 *
 * Dimension evaluation:
 * - structuralStrength: NOT_ASSESSED (methodology deferred)
 * - planetaryCondition: Aggregated from participant planets
 * - careerRelevance: Aggregated from participant planets
 * - coherence: MODERATE if both relationships present, INSUFFICIENT_DATA otherwise
 * - activationPotential: UNKNOWN (timing deferred)
 * - divisionalConfirmation: NOT_ASSESSED (D10 deferred)
 *
 * QUALIFIED is unreachable until structural-strength methodology freeze (intentional).
 */
export class ServiceToProfessionToGainsPolicy implements QualificationPolicy {
  readonly policyId = 'SERVICE_TO_PROFESSION_TO_GAINS';
  readonly classification: CareerPatternClassification = 'SERVICE_TO_PROFESSION_TO_GAINS';
  readonly description = 'Service (6H) → Profession (10H) → Gains (11H) network qualification policy';

  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult {
    const { pattern, relevanceByPlanet, conditionByPlanet } = context;
    const establishingIds = getEstablishingRelationshipIds(pattern);

    const evidence: QualificationEvidence[] = [];
    const insufficientDataReasons: string[] = [];
    let status: CareerPatternQualificationStatus = 'INSUFFICIENT_DATA';

    // Step 1: Check for required establishing relationships (structural prerequisites)
    // For SERVICE_TO_PROFESSION_TO_GAINS, we need both 6→10 and 10→11
    // Use semantic check instead of string-matching identity keys
    const has6to10 = hasDirectedHouseRelationshipInPattern(pattern, 6, 10);
    const has10to11 = hasDirectedHouseRelationshipInPattern(pattern, 10, 11);

    if (!has6to10 && !has10to11) {
      // Both prerequisites explicitly absent → UNQUALIFIED
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
      // One prerequisite absent, one present → UNQUALIFIED
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
      // Both prerequisites present - proceed to dimension assessment
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
    }

    // Step 2: Build dimensions using legacy computation
    const participantConditions = pattern.planets.map(p => {
      const condition = conditionByPlanet.get(p);
      return mapPlanetaryCondition(condition);
    });

    const participantRelevance = pattern.planets.map(p => {
      const relevance = relevanceByPlanet.get(p);
      return mapCareerRelevance(relevance);
    });

    const dimensions = computeQualificationDimensions(pattern, participantConditions, participantRelevance);

    // Step 3: Apply frozen decision layer (only if prerequisites present)
    if (status !== 'UNQUALIFIED') {
      // Check for missing/unevaluable data
      if (dimensions.structuralStrength === 'NOT_ASSESSED') {
        insufficientDataReasons.push('structural strength methodology not frozen');
      }
      if (dimensions.planetaryCondition === 'UNAVAILABLE') {
        insufficientDataReasons.push('planetary condition data unavailable');
      }
      if (dimensions.careerRelevance === 'UNAVAILABLE') {
        insufficientDataReasons.push('career relevance data unavailable');
      }
      if (dimensions.coherence === 'INSUFFICIENT_DATA') {
        insufficientDataReasons.push('pattern coherence insufficient data');
      }
      if (dimensions.activationPotential === 'UNKNOWN') {
        insufficientDataReasons.push('activation potential timing deferred');
      }
      if (dimensions.divisionalConfirmation === 'NOT_ASSESSED') {
        insufficientDataReasons.push('divisional confirmation (D10) deferred');
      }

      // Check for known disqualifiers
      if (dimensions.planetaryCondition === 'WEAK') {
        status = 'UNQUALIFIED';
        insufficientDataReasons.push('planetary condition is WEAK');
      } else if (dimensions.careerRelevance === 'NEUTRAL') {
        status = 'UNQUALIFIED';
        insufficientDataReasons.push('career relevance is NEUTRAL');
      } else if (insufficientDataReasons.length > 0) {
        // Prerequisites present + evaluable dimensions OK, but NOT_ASSESSED/UNKNOWN/UNAVAILABLE block
        status = 'INSUFFICIENT_DATA';
      } else {
        // Prerequisites present + all evaluable dimensions positive
        // QUALIFIED requires structural-strength freeze (currently unreachable)
        status = 'INSUFFICIENT_DATA';
        insufficientDataReasons.push('structural strength methodology not frozen');
      }
    }

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
