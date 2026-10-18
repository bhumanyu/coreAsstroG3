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
import type { CareerConclusionData } from '../../domain/career/careerTypes';
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
  readonly careerArtifacts: {
    readonly natal: any; // CareerNatalAnalysis
    readonly expression: any; // CareerExpressionAnalysis
    readonly canonicalExpression?: any; // CareerExpressionCanonicalResult
    readonly mechanismCandidates?: readonly any[]; // CareerMechanismCandidate[]
    readonly careerDashaEvidence: readonly DomainEvidence[];
  };
  readonly careerEvidence: readonly DomainEvidence[];
  readonly careerDashaEvidence: readonly DomainEvidence[];
  readonly wealthEvidence: readonly DomainEvidence[];
  readonly careerBaseline: CareerConclusionData;
  readonly wealthBaseline: WealthConclusionData;
}

/**
 * Result type for buildProductSelectedPeriodSynthesis.
 *
 * Discriminated union preserving each layer's error codes verbatim.
 */
export type BuildProductSelectedPeriodSynthesisResult =
  | { readonly ok: true; readonly value: SelectedPeriodSynthesisResult<CareerConclusionData, WealthConclusionData>['value'] }
  | { readonly ok: false; readonly error: SelectedPeriodContextError | 'CAREER_ACTIVATION_FAILED' | 'WEALTH_ACTIVATION_FAILED' | 'SYNTHESIS_FAILED' };

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
 */
function buildSelectedCareerDashaActivationInternal(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext
): { readonly ok: true; readonly value: SelectedCareerDashaActivationSuccess } | { readonly ok: false; readonly error: 'CAREER_ACTIVATION_FAILED' } {
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
    return { ok: false, error: 'CAREER_ACTIVATION_FAILED' };
  }

  return { ok: true, value: result.value };
}

/**
 * Evaluates selected Wealth period activation.
 */
function evaluateSelectedWealthPeriodActivationInternal(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext
): { readonly ok: true; readonly value: SelectedWealthPeriodActivation } | { readonly ok: false; readonly error: 'WEALTH_ACTIVATION_FAILED' } {
  const { wealthEvidence } = input;
  const result = evaluateSelectedWealthPeriodActivation({
    selectedPeriod,
    wealthEvidence
  });

  if (!result.ok) {
    return { ok: false, error: 'WEALTH_ACTIVATION_FAILED' };
  }

  return { ok: true, value: result.value };
}

/**
 * Builds selected-period synthesis (internal wrapper).
 */
function buildSelectedPeriodSynthesisWrapper(
  input: BuildProductSelectedPeriodSynthesisInput,
  selectedPeriod: SelectedPeriodActivationContext,
  careerActivation: SelectedCareerDashaActivationSuccess | undefined,
  wealthActivation: SelectedWealthPeriodActivation | undefined
): { readonly ok: true; readonly value: SelectedPeriodSynthesisResult<CareerConclusionData, WealthConclusionData>['value'] } | { readonly ok: false; readonly error: 'SYNTHESIS_FAILED' } {
  const { careerEvidence, careerDashaEvidence, wealthEvidence, careerBaseline, wealthBaseline } = input;
  const result = buildSelectedPeriodSynthesis({
    selectedPeriod,
    careerActivation,
    wealthActivation,
    careerEvidence,
    wealthEvidence,
    careerDashaEvidence,
    careerBaseline,
    wealthBaseline
  });

  if (!result.ok) {
    return { ok: false, error: 'SYNTHESIS_FAILED' };
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
 * 4. buildSelectedPeriodSynthesis
 *
 * Preserves each layer's error codes verbatim in a typed union.
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

  // Step 2: Build selected Career Dasha activation
  const careerActivationResult = buildSelectedCareerDashaActivationInternal(input, selectedPeriod);
  const careerActivation = careerActivationResult.ok ? careerActivationResult.value : undefined;

  // Step 3: Evaluate selected Wealth period activation
  const wealthActivationResult = evaluateSelectedWealthPeriodActivationInternal(input, selectedPeriod);
  const wealthActivation = wealthActivationResult.ok ? wealthActivationResult.value : undefined;

  // Step 4: Build selected-period synthesis
  const synthesisResult = buildSelectedPeriodSynthesisWrapper(
    input,
    selectedPeriod,
    careerActivation,
    wealthActivation
  );

  if (!synthesisResult.ok) {
    return { ok: false, error: synthesisResult.error };
  }

  return { ok: true, value: synthesisResult.value };
}
