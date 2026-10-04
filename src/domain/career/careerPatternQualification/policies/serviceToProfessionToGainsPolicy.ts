import type { CareerPatternClassification } from '../../careerPattern/careerPatternTypes';
import type {
  QualificationPolicy,
  QualificationPolicyContext,
  PolicyEvaluationResult,
  CareerPatternQualificationStatus,
  CareerPatternQualificationDimensions,
  QualificationEvidence,
  CareerPatternDeferredDimension,
  DecisionBlockingReason
} from '../careerPatternQualificationTypes';
import {
  generatePolicyEvidenceId,
  createQualificationEvidence,
  getEstablishingRelationshipIds,
  hasDirectedHouseRelationshipId
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
    const decisionBlockingReasons: DecisionBlockingReason[] = [];
    const deferredDimensions: CareerPatternDeferredDimension[] = [];
    let status: CareerPatternQualificationStatus = 'INSUFFICIENT_DATA';

    // Step 1: Check for required establishing relationships (structural prerequisites)
    // For SERVICE_TO_PROFESSION_TO_GAINS, we need both 6→10 and 10→11
    // TODO(P2-07B): Replace ID-string check with canonical relationship resolution
    const has6to10 = hasDirectedHouseRelationshipId(pattern, 6, 10);
    const has10to11 = hasDirectedHouseRelationshipId(pattern, 10, 11);

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
      // Track deferred dimensions (non-decision-blocking)
      if (dimensions.activationPotential === 'UNKNOWN') {
        deferredDimensions.push('ACTIVATION_POTENTIAL');
      }
      if (dimensions.divisionalConfirmation === 'NOT_ASSESSED') {
        deferredDimensions.push('DIVISIONAL_CONFIRMATION');
      }

      // Check for known disqualifiers (explicit negatives beat missing data)
      if (dimensions.planetaryCondition === 'WEAK') {
        status = 'UNQUALIFIED';
        // Disqualifier: kept in evidence only, not in decisionBlockingReasons
      } else if (dimensions.careerRelevance === 'NEUTRAL') {
        status = 'UNQUALIFIED';
        // Disqualifier: kept in evidence only, not in decisionBlockingReasons
      } else {
        // No disqualifiers - check for missing/unevaluable data (decision-blocking)
        if (dimensions.structuralStrength === 'NOT_ASSESSED') {
          decisionBlockingReasons.push({
            reason: 'structural strength methodology not frozen',
            kind: 'METHODOLOGY_NOT_FROZEN'
          });
        }
        if (dimensions.planetaryCondition === 'UNAVAILABLE') {
          decisionBlockingReasons.push({
            reason: 'planetary condition data unavailable',
            kind: 'MISSING_INPUT'
          });
        }
        if (dimensions.careerRelevance === 'UNAVAILABLE') {
          decisionBlockingReasons.push({
            reason: 'career relevance data unavailable',
            kind: 'MISSING_INPUT'
          });
        }
        if (dimensions.coherence === 'INSUFFICIENT_DATA') {
          decisionBlockingReasons.push({
            reason: 'pattern coherence insufficient data',
            kind: 'INSUFFICIENT_STRUCTURAL_EVIDENCE'
          });
        }

        if (decisionBlockingReasons.length > 0) {
          // Prerequisites present + evaluable dimensions OK, but NOT_ASSESSED/UNAVAILABLE block
          status = 'INSUFFICIENT_DATA';
        } else {
          // Prerequisites present + all evaluable dimensions positive
          // QUALIFIED requires structural-strength freeze (currently unreachable)
          status = 'INSUFFICIENT_DATA';
          decisionBlockingReasons.push({
            reason: 'structural strength methodology not frozen',
            kind: 'METHODOLOGY_NOT_FROZEN'
          });
        }
      }
    }

    // Build explanation
    const explanation = this.buildExplanation(status, dimensions, decisionBlockingReasons);

    return Object.freeze({
      status,
      dimensions,
      evidence: Object.freeze(evidence),
      decisionBlockingReasons: Object.freeze(decisionBlockingReasons),
      deferredDimensions: Object.freeze(deferredDimensions),
      ruleId: this.policyId,
      explanation
    });
  }

  private buildExplanation(
    status: CareerPatternQualificationStatus,
    dimensions: CareerPatternQualificationDimensions,
    decisionBlockingReasons: readonly DecisionBlockingReason[]
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

    if (decisionBlockingReasons.length > 0) {
      const reasonTexts = decisionBlockingReasons.map(r => `${r.kind}: ${r.reason}`);
      parts.push(`Decision blocking reasons: ${reasonTexts.join('; ')}.`);
    }

    return parts.join(' ');
  }
}
