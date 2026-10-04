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
  getEstablishingRelationshipIds
} from '../policyUtils';
import { computeQualificationDimensions, mapPlanetaryCondition, mapCareerRelevance } from '../careerPatternQualificationRules';

/**
 * P2-07A Career House Network Qualification Policy (Generic Carrier)
 *
 * Generic carrier validation / deferred qualification policy for CAREER_HOUSE_NETWORK classification.
 * This is a conservative carrier policy that never auto-QUALIFIED.
 *
 * Per spec §15: no universal threshold. This policy serves as a fallback
 * for patterns without specific family policies. It validates structural presence
 * but routes to INSUFFICIENT_DATA until methodology is frozen.
 *
 * Required structural facts:
 * - Any establishing relationship in pattern.provenance.establishingRelationshipIds
 *
 * Status precedence (per spec §24 decision chain):
 * 1. No establishing relationships → UNQUALIFIED
 * 2. Establishing relationships present + all evaluable dimensions positive → INSUFFICIENT_DATA (methodology deferred)
 * 3. Known disqualifier (WEAK condition, NEUTRAL relevance) → UNQUALIFIED
 *
 * Dimension evaluation:
 * - structuralStrength: NOT_ASSESSED (methodology deferred)
 * - planetaryCondition: Aggregated from participant planets
 * - careerRelevance: Aggregated from participant planets
 * - coherence: MODERATE if establishing relationships present, INSUFFICIENT_DATA otherwise
 * - activationPotential: UNKNOWN (timing deferred)
 * - divisionalConfirmation: NOT_ASSESSED (D10 deferred)
 *
 * QUALIFIED is unreachable until structural-strength methodology freeze (intentional).
 */
export class CareerHouseNetworkPolicy implements QualificationPolicy {
  readonly policyId = 'CAREER_HOUSE_NETWORK';
  readonly classification: CareerPatternClassification = 'CAREER_HOUSE_NETWORK';
  readonly description = 'Generic Career House Network qualification policy (conservative carrier, never auto-QUALIFIED)';

  evaluate(context: QualificationPolicyContext): PolicyEvaluationResult {
    const { pattern, relevanceByPlanet, conditionByPlanet } = context;
    const establishingIds = getEstablishingRelationshipIds(pattern);

    const evidence: QualificationEvidence[] = [];
    const insufficientDataReasons: string[] = [];
    let status: CareerPatternQualificationStatus = 'INSUFFICIENT_DATA';

    // Step 1: Check for any establishing relationships (structural prerequisite)
    if (establishingIds.length === 0) {
      // No establishing relationships → UNQUALIFIED
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
      // Has establishing relationships - proceed to dimension assessment
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
