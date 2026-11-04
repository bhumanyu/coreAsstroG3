import type { WealthLifecycleAnalysis, WealthLifecycleInput } from './wealthLifecycleTypes';
import { buildWealthLifecycleAnalysis } from './wealthLifecycleTypes';
export type { WealthLifecycleAnalysis, WealthLifecycleInput, WealthLifecycleCandidateWindow, WealthLifecycleDiagnostic, WealthLifecycleEventRuleContract, WealthLifecycleEventType } from './wealthLifecycleTypes';
export { WEALTH_LIFECYCLE_RULE_CATALOGUE, WEALTH_LIFECYCLE_VERSION } from './wealthLifecycleTypes';

/** C04 domain entrypoint. This downstream evaluator never recalculates Wealth astrology. */
export function evaluateWealthLifecycle(input: WealthLifecycleInput): WealthLifecycleAnalysis {
  return buildWealthLifecycleAnalysis(input);
}