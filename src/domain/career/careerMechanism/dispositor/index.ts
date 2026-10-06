/**
 * P2-07E Career Mechanism Dispositor Refinement Module
 *
 * This module implements dispositor-based refinement of career mechanism candidates.
 * It consumes the existing careerDispositor engine to refine mechanism types based on
 * terminal planet analysis.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerD10
 * - careerDasha
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 */

// Type exports
export type {
  DispositorRefinementStatus,
  CareerDispositorChain,
  CareerDispositorContext,
  CareerMechanismDispositorRuleInput,
  CareerMechanismDispositorRuleResult,
  CareerMechanismDispositorRule,
  CareerMechanismDispositorRefinementInput,
  CareerMechanismDispositorRefinementResult
} from './careerMechanismDispositorTypes';

// Utility exports
export {
  sortStrings,
  sortParticipantIds,
  uniqueNumbers,
  hasUsableDispositorContext,
  hasTerminalPlanet,
  isCycle,
  isSelfDispositor,
  getChainDepth,
  collectRelevantDispositorContexts,
  assertValidDispositorRefinementSource
} from './careerMechanismDispositorUtils';

// Rule exports
export {
  CAREER_DISPOSITOR_MECHANISM_RULES
} from './careerMechanismDispositorRules';

// Adapter exports
export type {
  CareerDispositorEngineAdapter,
  DefaultCareerDispositorEngineAdapter,
  CareerDispositorContextFactory,
  DefaultCareerDispositorContextFactory
} from './careerMechanismDispositorAdapter';
export {
  defaultCareerDispositorEngineAdapter,
  defaultCareerDispositorContextFactory
} from './careerMechanismDispositorAdapter';

// Refiner exports
export type {
  CareerMechanismDispositorRefiner,
  DefaultCareerMechanismDispositorRefiner
} from './defaultCareerMechanismDispositorRefiner';
export {
  defaultCareerMechanismDispositorRefiner
} from './defaultCareerMechanismDispositorRefiner';
