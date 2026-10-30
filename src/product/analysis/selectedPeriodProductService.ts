/**
 * PBA-07: Selected-Period Product Service
 *
 * Orchestration layer for selected-period synthesis integration.
 * Pure projection layer - no new astrology computation, no interpreter re-invocation.
 *
 * INVARIANTS:
 * - No horoscope calculation
 * - No interpreter calls
 * - context.asOf passed unchanged
 * - All errors preserved verbatim in typed unions
 */

import type { Horoscope } from '../../types';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import type { AnalysisTemporalState } from '../../core/analysis/AnalysisTemporalState';
import type { DomainEvidence } from '../../domain/interpretation/DomainEvidence';
import type { CareerConclusionData, CareerInternalArtifacts } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import type {
  SelectedPeriodActivationContext,
  SelectedPeriodContextError
} from '../../core/analysis/selectedPeriodActivationContext';
import {
  createSelectedPeriodActivationContext
} from '../../core/analysis/selectedPeriodActivationContext';
import type {
  SelectedCareerDashaActivationResult,
  SelectedCareerDashaActivationSuccess
} from '../../domain/career/careerDasha/selectedCareerDashaActivation';
import {
  buildSelectedCareerDashaActivation
} from '../../domain/career/careerDasha/selectedCareerDashaActivation';
import type {
  EvaluateSelectedWealthPeriodActivationResult,
  SelectedWealthPeriodActivation
} from '../../domain/wealth/selectedWealthDashaActivation';
import {
  evaluateSelectedWealthPeriodActivation
} from '../../domain/wealth/selectedWealthDashaActivation';
import type {
  SelectedPeriodSynthesisResult
} from '../../domain/synthesis/selectedPeriodSynthesis';
import {
  buildSelectedPeriodSynthesis
} from '../../domain/synthesis/selectedPeriodSynthesis';

/**
 * Input for building product selected-period synthesis.
 */
export interface BuildProductSelectedPeriodSynthesisInput {
  readonly selection: {
    readonly mahadashaId: string;
    readonly antardashaId: string;
  };
  readonly context: AnalysisContext;
  readonly temporalState: AnalysisTemporalState;
  readonly horoscope: Horoscope;
  readonly careerArtifacts: CareerInternalArtifacts;
  readonly careerEvidence: readonly DomainEvidence[];
  readonly careerDashaEvidence: readonly DomainEvidence[];
  readonly wealthEvidence?: readonly DomainEvidence[];
  readonly careerBaseline?: CareerConclusionData;
  readonly wealthBaseline?: WealthConclusionData;
}

/**
 * Result type for buildProductSelectedPeriodSynthesis.
 *
 * Discriminated union preserving each layer's error codes verbatim.
 * Error codes are propagated directly from domain layers without wrapping:
 * - CONTEXT stage: SelectedPeriodContextError (from createSelectedPeriodActivationContext)
 * - SYNTHESIS stage: 'INVALID_SELECTED_PERIOD_CONTEXT' | 'ACTIVATION_PERIOD_MISMATCH' (from buildSelectedPeriodSynthesis)
 *
 * CAREER and WEALTH activation failures are handled as partial synthesis (degrade, not hard-fail).
 * This policy ensures domain error codes are never silently replaced with generic wrappers.
 */
export type BuildProductSelectedPeriodSynthesisResult =
  | { readonly ok: true; readonly value: import('../../domain/synthesis/selectedPeriodSynthesis').SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> }
  | { readonly ok: false; readonly error: SelectedPeriodContextError | 'ACTIVATION_PERIOD_MISMATCH' | 'DUPLICATE_CANONICAL_CANDIDATE_ID' | 'INVALID_CANDIDATE_ID' | 'COVERAGE_INVARIANT_VIOLATED' };

/**
 * Creates selected-period activation context.
 */
function createSelectedPeriodActivationContextInternal(
  input: BuildProductSelectedPeriodSynthesisInput
): { readonly ok: true; readonly value: SelectedPeriodActivationContext } | { readonly ok: false; readonly error: SelectedPeriodContextError } {
  const { selection, context, temporalState } = input;
  const result = createSelectedPeriodActivationContext({
    report: temporalState.dashaInterpretation,
    selection,
    analysisAsOf: context.asOf
  });
  return result;
}

/**
 * Builds selected Career Dasha activation.
 * Returns error code for partial synthesis diagnostics if activation fails.
 */
function buildSelectedCareerDashaActivationInternal(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext
): { readonly ok: true; readonly value: SelectedCareerDashaActivationSuccess } | { readonly ok: false; readonly errorCode: Extract<SelectedCareerDashaActivationResult, { ok: false }>['error'] } {
  const { careerArtifacts, horoscope } = input;
  const result = buildSelectedCareerDashaActivation({
    horoscope,
    natal: careerArtifacts.natal,
    expression: careerArtifacts.expression,
    selectedPeriod,
    canonicalExpression: careerArtifacts.canonicalExpression,
    mechanismCandidates: careerArtifacts.mechanismCandidates
  });

  if (!result.ok) {
    // Return error code for partial synthesis diagnostic
    // Type guard: ensure errorCode is from the failure branch of SelectedCareerDashaActivationResult
    const errorCode: Extract<SelectedCareerDashaActivationResult, { ok: false }>['error'] = result.error;
    return { ok: false, errorCode };
  }

  return { ok: true, value: result.value };
}

/**
 * Evaluates selected Wealth period activation.
 * Returns error code for partial synthesis diagnostics if activation fails.
 */
function evaluateSelectedWealthPeriodActivationInternal(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext
): { readonly ok: true; readonly value: SelectedWealthPeriodActivation } | { readonly ok: false; readonly errorCode: Extract<EvaluateSelectedWealthPeriodActivationResult, { ok: false }>['error'] } {
  const { wealthEvidence } = input;
  const result = evaluateSelectedWealthPeriodActivation({
    selectedPeriod,
    wealthEvidence
  });

  if (!result.ok) {
    // Return error code for partial synthesis diagnostic
    return { ok: false, errorCode: result.error };
  }

  return { ok: true, value: result.value };
}

/**
 * Builds selected-period synthesis (internal wrapper).
 * Accepts optional activations for partial synthesis support.
 * Propagates domain error codes verbatim.
 */
function buildSelectedPeriodSynthesisWrapper(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext,
  careerActivation?: SelectedCareerDashaActivationSuccess,
  wealthActivation?: SelectedWealthPeriodActivation,
  careerErrorCode?: Extract<SelectedCareerDashaActivationResult, { ok: false }>['error'],
  wealthErrorCode?: Extract<EvaluateSelectedWealthPeriodActivationResult, { ok: false }>['error']
): { readonly ok: true; readonly value: import('../../domain/synthesis/selectedPeriodSynthesis').SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> } | { readonly ok: false; readonly error: 'INVALID_SELECTED_PERIOD_CONTEXT' | 'ACTIVATION_PERIOD_MISMATCH' | 'DUPLICATE_CANONICAL_CANDIDATE_ID' | 'INVALID_CANDIDATE_ID' | 'COVERAGE_INVARIANT_VIOLATED' } {
  const { careerEvidence, careerDashaEvidence, wealthEvidence, careerBaseline, wealthBaseline } = input;
  const result = buildSelectedPeriodSynthesis({
    selectedPeriod,
    careerActivation,
    wealthActivation,
    careerEvidence,
    wealthEvidence,
    careerDashaEvidence,
    careerBaseline,
    wealthBaseline,
    careerErrorCode,
    wealthErrorCode
  });

  if (!result.ok) {
    // Propagate the actual domain error code verbatim
    return { ok: false, error: result.error };
  }

  return { ok: true, value: result.value };
}

/**
 * Builds product selected-period synthesis.
 *
 * Sequence:
 * 1. createSelectedPeriodActivationContext
 * 2. buildSelectedCareerDashaActivation (pass BOTH canonical inputs when present; if absent, neither)
 * 3. evaluateSelectedWealthPeriodActivation
 * 4. buildSelectedPeriodSynthesis (with partial activation support)
 *
 * Domain activation failures degrade to partial synthesis (do not hard-fail).
 * Context resolution failures still hard-fail (invariant violation).
 * No horoscope calculation, no interpreter calls, context.asOf passed unchanged.
 */
export function buildProductSelectedPeriodSynthesis(
  input: BuildProductSelectedPeriodSynthesisInput
): BuildProductSelectedPeriodSynthesisResult {
  // Step 1: Create selected-period activation context
  const contextResult = createSelectedPeriodActivationContextInternal(input);
  if (!contextResult.ok) {
    return { ok: false, error: contextResult.error };
  }

  const selectedPeriod = contextResult.value;

  // Step 2: Build selected Career Dasha activation (degrade on failure)
  const careerActivationResult = buildSelectedCareerDashaActivationInternal(input, selectedPeriod);
  const careerActivation = careerActivationResult.ok ? careerActivationResult.value : undefined;
  const careerErrorCode = careerActivationResult.ok ? undefined : careerActivationResult.errorCode;

  // Step 3: Evaluate selected Wealth period activation (degrade on failure)
  const wealthActivationResult = evaluateSelectedWealthPeriodActivationInternal(input, selectedPeriod);
  const wealthActivation = wealthActivationResult.ok ? wealthActivationResult.value : undefined;
  const wealthErrorCode = wealthActivationResult.ok ? undefined : wealthActivationResult.errorCode;

  // Step 4: Build selected-period synthesis with partial activation support
  const synthesisResult = buildSelectedPeriodSynthesisWrapper(
    input,
    selectedPeriod,
    careerActivation,
    wealthActivation,
    careerErrorCode,
    wealthErrorCode
  );

  if (!synthesisResult.ok) {
    return { ok: false, error: synthesisResult.error };
  }

  return { ok: true, value: synthesisResult.value };
}
