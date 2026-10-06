/**
 * P2-08A Career Expression Module
 *
 * Public API for the canonical career expression MODEL and RESOLVER.
 * This module provides the pure data model for career expressions — the vocabulary,
 * status, pathways, evidence sources, and canonical records — plus the expression
 * resolution layer that maps career mechanism candidates to expression candidates.
 *
 * NAMING COLLISION RESOLUTION:
 * - Legacy careerExpression.ts (C8 layer) exports CareerExpression, CareerExpressionAnalysis,
 *   CareerExpressionEvidence for mode/strength/weight-based analysis.
 * - This module uses CareerExpressionCandidate and CareerExpressionAnalysisResult to avoid collision.
 * - CareerExpressionEvidence is reused but with incompatible structure (mechanism-source-based vs
 *   mode/strength-based). The divergence is documented in careerExpressionTypes.ts.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 * - legacy careerExpression.ts (unless deliberately consumed)
 */

// Types (§8)
export type {
  CareerExpressionType,
  CareerExpressionStatus,
  CareerExpressionPathway,
  CareerExpressionCandidate,
  CareerExpressionEvidence,
  CareerExpressionProvenance,
  CareerExpressionAnalysisResult,
  CareerExpressionResolverInput
} from './careerExpressionTypes';

// Rules (§23)
export type { CareerExpressionRule } from './careerExpressionRules';
export { CAREER_EXPRESSION_RULES } from './careerExpressionRules';

// Utils (§8)
export {
  createCareerExpressionId,
  createExpressionEvidenceId,
  createExpressionRuleId,
  deduplicateExpressionCandidates,
  deduplicateExpressionEvidence,
  mergeExpressionProvenances,
  canonicalSortExpressionCandidates,
  sortExpressionParticipantIds
} from './careerExpressionUtils';

// Resolver (§8)
export {
  DefaultCareerExpressionResolver,
  defaultCareerExpressionResolver
} from './defaultCareerExpressionResolver';
