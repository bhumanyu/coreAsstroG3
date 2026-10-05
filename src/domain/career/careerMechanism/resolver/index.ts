/**
 * P2-07D Career Mechanism Resolver Module
 *
 * Public API for the mechanism resolution layer that maps pattern structural
 * facts to mechanism candidates. Per spec §25: only proven mappings initially,
 * based on dusthana transformation patterns (8↔10, 12↔10, composite 8-12-10).
 *
 * This layer sits ABOVE the pattern layer (P2-03/P2-06) and consumes patterns,
 * participant roles, and establishing evidence to produce mechanism candidate sets.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - any AI/profession module
 */

// Types
export type {
  CareerMechanismResolutionInput,
  CareerMechanismResolutionRule,
  CareerMechanismResolver
} from './careerMechanismResolverTypes';

// Rules
export {
  CAREER_MECHANISM_RESOLUTION_RULES
} from './careerMechanismResolverRules';

// Resolver implementation
export {
  DefaultCareerMechanismResolver,
  defaultCareerMechanismResolver
} from './defaultCareerMechanismResolver';

// Utils
export {
  compareCareerMechanismCandidates,
  deduplicateCareerMechanismCandidates,
  mergeCandidateEvidence,
  mergeCandidateProvenances,
  createCareerMechanismCandidateSet
} from './careerMechanismResolverUtils';
