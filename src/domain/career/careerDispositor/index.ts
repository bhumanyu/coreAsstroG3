/**
 * P2-05 Career Dispositor Module
 *
 * Self-contained Phase 2 module modeling deterministic natal dispositor chains
 * for Career-relevant planets.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerFinalSynthesis
 * - careerExpression*
 * - domain/timing
 * - careerPattern*
 * - careerPatternQualification*
 * - careerAstroGraph* (no DISPOSITOR_OF edge type - P2-01 contract excludes it)
 */

// Type exports
export type {
  CareerDispositorStartRole,
  CareerDispositorRelationship,
  CareerDispositorTermination,
  CareerDispositorDestination,
  CareerDispositorLink,
  CareerDispositorChain,
  CareerDispositorProvenance,
  CareerDispositorStart,
  CareerDispositorIntegrationInput,
  CareerDispositorResult
} from './careerDispositorTypes';

// Identity exports
export {
  buildCareerDispositorIdentityKey,
  buildCareerDispositorChainId
} from './careerDispositorIdentity';

// Rules exports
export {
  CAREER_HOUSES,
  CAREER_LORD_START_HOUSES,
  MAX_DISPOSITOR_DEPTH,
  isCareerHouse,
  resolveCareerDestination,
  resolveTermination
} from './careerDispositorRules';

// Core dispositor exports
export {
  traverseDispositorChain,
  detectMutualReception,
  detectChainMutualReception
} from './careerDispositor';

// Integration exports
export {
  buildCareerDispositorStartPlanets,
  buildCareerDispositorStartsFromStructural,
  buildCareerDispositorAnalysis
} from './careerDispositorIntegration';
