/**
 * Canonical ProductAnalysis Service (P-UI-02)
 *
 * Orchestration boundary that delegates to the computational pipeline
 * and projects results into the canonical ProductAnalysis aggregate.
 *
 * INVARIANTS:
 * - Real repository types used (BirthDetails, Horoscope, LifeAnalysisProductState).
 * - "Chart calculated once / engines called once" preserved by delegating to runPipeline.
 * - No UI concerns (no navigate / render / ReactNode).
 * - Fault tolerant: Catches exceptions and returns buildFailedProductAnalysis with ERROR severity.
 */

import type { BirthDetails, Horoscope } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { runLifeAnalysisProduct } from '../life-analysis/lifeAnalysisProductService';
import type { LifeAnalysisProductState } from '../life-analysis/lifeAnalysisTypes';
import { isCareerDomainInterpretation, isWealthDomainInterpretation } from '../life-analysis/lifeAnalysisTypes';
import type { ProductAnalysis } from './productAnalysisTypes';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import type { DomainEvidence } from '../../domain/interpretation';
import { mapProductAnalysis, buildFailedProductAnalysis, mapMethodology, mapEvidenceItems, mapSelectedPeriodSynthesis } from './productAnalysisMapper';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import {
  buildProductSelectedPeriodSynthesis,
  type BuildProductSelectedPeriodSynthesisInput
} from './selectedPeriodProductService';
import { runAiExplanation } from '../../ai/product/aiExplanationService';

export interface ProductAnalysisDependencies {
  readonly calculateHoroscope: (birthDetails: BirthDetails, customPositionsOrOptions?: any, asOfParam?: string | Date) => Horoscope;
  readonly runPipeline: (options: {
    readonly horoscope: Horoscope;
    readonly context: AnalysisContext;
    readonly includeAiExplanation?: boolean;
  }) => Promise<LifeAnalysisProductState>;
}

export const defaultProductAnalysisDependencies: ProductAnalysisDependencies = Object.freeze({
  calculateHoroscope,
  runPipeline: runLifeAnalysisProduct
});

export interface AnalyzeOptions {
  readonly includeAiExplanation?: boolean;
  readonly asOf?: Date | string;
  readonly context?: AnalysisContext;
  readonly selectedPeriod?: {
    readonly mahadashaId: string;
    readonly antardashaId: string;
  };
  /**
   * Whether to trigger AI explanation for selected-period analysis (PBA-09).
   * When true and selected-period synthesis succeeds, AI explanation is run.
   * AI failure does not affect the deterministic synthesis or status.
   */
  readonly includeSelectedPeriodAiExplanation?: boolean;
}

export class ProductAnalysisService {
  private _lastPipelineState?: LifeAnalysisProductState;
  private _lastHoroscope?: Horoscope;
  private _lastBirthDetails?: BirthDetails;
  private _lastContext?: AnalysisContext;

  constructor(
    private readonly deps: ProductAnalysisDependencies = defaultProductAnalysisDependencies
  ) { }

  get lastPipelineState(): LifeAnalysisProductState | undefined {
    return this._lastPipelineState;
  }

  get lastHoroscope(): Horoscope | undefined {
    return this._lastHoroscope;
  }

  get lastBirthDetails(): BirthDetails | undefined {
    return this._lastBirthDetails;
  }

  /**
   * Executes full product analysis for given birth details.
   */
  async analyze(
    birthDetails: BirthDetails,
    options?: AnalyzeOptions
  ): Promise<ProductAnalysis> {
    const methodology = mapMethodology(birthDetails);
    const context = options?.context ?? createAnalysisContext({
      asOf: options?.asOf,
      methodology,
      engineVersion: methodology.calculationEngine,
      rulesVersion: methodology.rulesEngine
    });

    try {
      const horoscope = this.deps.calculateHoroscope(birthDetails, undefined, context.asOf);
      this._lastHoroscope = horoscope;
      this._lastBirthDetails = birthDetails;
      this._lastContext = context;
      const pipelineState = await this.deps.runPipeline({
        horoscope,
        context,
        includeAiExplanation: options?.includeAiExplanation ?? true
      });
      this._lastPipelineState = pipelineState;

      if (pipelineState.status === 'ERROR' || !pipelineState.analysis) {
        return buildFailedProductAnalysis(
          birthDetails,
          pipelineState.errorMessage || 'Life analysis computation failed.',
          context
        );
      }

      const productAnalysis = mapProductAnalysis({
        birthDetails,
        horoscope,
        lifeAnalysisViewModel: pipelineState.analysis,
        aiExplanation: pipelineState.aiExplanation,
        careerEvidence: pipelineState.career?.evidence
          ? mapEvidenceItems(pipelineState.career.evidence, 'CAREER')
          : undefined,
        wealthEvidence: pipelineState.wealth?.evidence
          ? mapEvidenceItems(pipelineState.wealth.evidence, 'WEALTH')
          : undefined,
        context,
        temporalState: pipelineState.temporalState
      });

      // PBA-07: Build selected-period synthesis if selection is provided
      if (options?.selectedPeriod) {
        // Check if careerArtifacts are available
        if (!pipelineState.careerArtifacts) {
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'CAREER_ARTIFACTS_UNAVAILABLE'
            }
          };
        }

        // Check if temporalState is available
        if (!pipelineState.temporalState) {
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'TEMPORAL_STATE_UNAVAILABLE'
            }
          };
        }

        // Check if career baseline is available
        if (!pipelineState.career?.conclusionData) {
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'CAREER_BASELINE_UNAVAILABLE'
            }
          };
        }

        // Check if wealth baseline is available
        if (!pipelineState.wealth?.conclusionData) {
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'WEALTH_BASELINE_UNAVAILABLE'
            }
          };
        }

        const selectedPeriodInput: BuildProductSelectedPeriodSynthesisInput = {
          selection: options.selectedPeriod,
          context,
          temporalState: pipelineState.temporalState,
          horoscope,
          careerArtifacts: pipelineState.careerArtifacts,
          careerEvidence: pipelineState.career?.evidence ?? [],
          careerDashaEvidence: pipelineState.careerArtifacts.careerDashaEvidence,
          wealthEvidence: pipelineState.wealth?.evidence ?? [],
          careerBaseline: pipelineState.career && isCareerDomainInterpretation(pipelineState.career)
            ? pipelineState.career.conclusionData
            : undefined,
          wealthBaseline: pipelineState.wealth && isWealthDomainInterpretation(pipelineState.wealth)
            ? pipelineState.wealth.conclusionData
            : undefined
        };

        let selectedPeriodResult;
        try {
          selectedPeriodResult = buildProductSelectedPeriodSynthesis(selectedPeriodInput);
        } catch {
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'SYNTHESIS_FAILED',
              error: 'SYNTHESIS_EXCEPTION'
            }
          };
        }

        if (selectedPeriodResult.ok) {
          const selectedPeriodSynthesis = mapSelectedPeriodSynthesis(selectedPeriodResult.value);

          // PBA-09: Trigger AI explanation for selected period when enabled
          let aiExplanation;
          let aiExplanationStatus: 'OK' | 'ERROR' | undefined;
          if (options?.includeSelectedPeriodAiExplanation ?? false) {
            try {
              aiExplanation = await runAiExplanation({
                horoscope,
                task: 'SELECTED_PERIOD_ANALYSIS',
                domainInterpretations: pipelineState.domainInterpretations ?? [],
                lifeAnalysis: pipelineState.lifeAnalysis!,
                temporalState: pipelineState.temporalState!,
                selectedPeriod: selectedPeriodResult.value,
                selectedPeriodEvidence: {
                  careerEvidence: pipelineState.career?.evidence ?? [],
                  careerDashaEvidence: pipelineState.careerArtifacts?.careerDashaEvidence ?? [],
                  wealthEvidence: pipelineState.wealth?.evidence ?? []
                }
              });
              aiExplanationStatus = aiExplanation.kind === 'ERROR' ? 'ERROR' : 'OK';
            } catch (aiError) {
              // AI failure must never reject analyze() - map to ERROR result
              aiExplanation = Object.freeze({
                kind: 'ERROR' as const,
                requestId: `error-${Date.now()}`,
                task: 'SELECTED_PERIOD_ANALYSIS' as const,
                status: 'ERROR' as const,
                message: aiError instanceof Error ? aiError.message : 'AI explanation could not be generated.',
                warnings: Object.freeze([])
              });
              aiExplanationStatus = 'ERROR';
            }
          }

          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'OK',
              synthesis: {
                ...selectedPeriodSynthesis,
                aiExplanationStatus: aiExplanationStatus ?? 'NOT_REQUESTED',
                ...(aiExplanation ? { aiExplanation } : {})
              }
            }
          };
        }

        // Map error codes to appropriate status using exhaustive switch
        // Canonical mapping documented: INVALID_SELECTED_PERIOD_CONTEXT maps to INVALID_SELECTION
        // since both domain validators produce it for malformed contexts.
        const error = selectedPeriodResult.error;
        const failureStatus: 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE' = (() => {
          // UNAVAILABLE errors (missing prerequisites - handled earlier, not in domain error union)
          // CONTEXT stage errors (from createSelectedPeriodActivationContext)
          if (
            error === 'REPORT_UNAVAILABLE' ||
            error === 'UNSUPPORTED_DASHA_SYSTEM' ||
            error === 'MAHADASHA_NOT_FOUND' ||
            error === 'ANTARDASHA_NOT_FOUND' ||
            error === 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA' ||
            error === 'INVALID_SELECTED_PERIOD' ||
            error === 'AMBIGUOUS_MAHADASHA_ID' ||
            error === 'AMBIGUOUS_ANTARDASHA_ID' ||
            error === 'INVALID_ANALYSIS_AS_OF' ||
            error === 'INVALID_SELECTED_PERIOD_CONTEXT'
          ) {
            return 'INVALID_SELECTION';
          }
          // CAREER stage errors (from buildSelectedCareerDashaActivation)
          if (error === 'INCOMPLETE_CANONICAL_INPUT') {
            return 'SYNTHESIS_FAILED';
          }
          // SYNTHESIS stage errors (from buildSelectedPeriodSynthesis)
          if (error === 'ACTIVATION_PERIOD_MISMATCH') {
            return 'SYNTHESIS_FAILED';
          }
          // Exhaustive check: if we reach here, the error type is not in the union
          const _exhaustiveCheck: never = error;
          return _exhaustiveCheck;
        })();

        // On failure, return productAnalysis with typed failure (no natal status downgrade)
        return {
          ...productAnalysis,
          selectedPeriod: {
            status: failureStatus,
            error: error
          }
        };
      }

      return productAnalysis;
    } catch (error: unknown) {
      return buildFailedProductAnalysis(birthDetails, error, context);
    }
  }

  /**
   * Re-selects a dasha period using retained pipeline state.
   *
   * This method:
   * - Reuses lastHoroscope, lastPipelineState (temporalState, careerArtifacts, evidence, baselines)
   * - Calls buildProductSelectedPeriodSynthesis directly (NEVER calculateHoroscope/runPipeline)
   * - Returns typed errors (INVALID_SELECTION, synthesis codes verbatim)
   * - Keeps dasha.current and natal baseline untouched
   *
   * Returns updated ProductAnalysis with selectedPeriod result.
   * Throws if prerequisites are not available (should have been checked before calling).
   *
   * @param includeAiExplanation - Whether to trigger AI explanation for selected-period analysis (PBA-09)
   */
  async selectPeriod(
    mahadashaId: string,
    antardashaId: string,
    includeAiExplanation?: boolean
  ): Promise<ProductAnalysis> {
    if (!this._lastHoroscope) {
      throw new Error('Cannot select period: no horoscope available. Call analyze() first.');
    }
    if (!this._lastPipelineState) {
      throw new Error('Cannot select period: no pipeline state available. Call analyze() first.');
    }
    if (!this._lastBirthDetails) {
      throw new Error('Cannot select period: no birth details available. Call analyze() first.');
    }
    if (!this._lastContext) {
      throw new Error('Cannot select period: no analysis context available. Call analyze() first.');
    }
    if (!this._lastPipelineState.temporalState) {
      throw new Error('Cannot select period: temporalState unavailable.');
    }
    if (!this._lastPipelineState.careerArtifacts) {
      throw new Error('Cannot select period: careerArtifacts unavailable.');
    }
    if (!this._lastPipelineState.career?.conclusionData) {
      throw new Error('Cannot select period: career baseline unavailable.');
    }
    if (!this._lastPipelineState.wealth?.conclusionData) {
      throw new Error('Cannot select period: wealth baseline unavailable.');
    }

    const horoscope = this._lastHoroscope;
    const birthDetails = this._lastBirthDetails;
    const pipelineState = this._lastPipelineState;
    const temporalState = pipelineState.temporalState!;
    const context = this._lastContext;

    // Reconstruct the base product analysis (preserves natal baseline and dasha.current)
    const productAnalysis = mapProductAnalysis({
      birthDetails,
      horoscope,
      lifeAnalysisViewModel: pipelineState.analysis!,
      aiExplanation: pipelineState.aiExplanation,
      careerEvidence: pipelineState.career?.evidence
        ? mapEvidenceItems(pipelineState.career.evidence, 'CAREER')
        : undefined,
      wealthEvidence: pipelineState.wealth?.evidence
        ? mapEvidenceItems(pipelineState.wealth.evidence, 'WEALTH')
        : undefined,
      context,
      temporalState
    });

    const selection = { mahadashaId, antardashaId };

    const selectedPeriodInput: BuildProductSelectedPeriodSynthesisInput = {
      selection,
      context,
      temporalState,
      horoscope,
      careerArtifacts: pipelineState.careerArtifacts!,
      careerEvidence: pipelineState.career?.evidence ?? [],
      careerDashaEvidence: pipelineState.careerArtifacts!.careerDashaEvidence,
      wealthEvidence: pipelineState.wealth?.evidence ?? [],
      careerBaseline: pipelineState.career && isCareerDomainInterpretation(pipelineState.career)
        ? pipelineState.career.conclusionData
        : undefined,
      wealthBaseline: pipelineState.wealth && isWealthDomainInterpretation(pipelineState.wealth)
        ? pipelineState.wealth.conclusionData
        : undefined
    };

    let selectedPeriodResult;
    try {
      selectedPeriodResult = buildProductSelectedPeriodSynthesis(selectedPeriodInput);
    } catch {
      return {
        ...productAnalysis,
        selectedPeriod: {
          status: 'SYNTHESIS_FAILED',
          error: 'SYNTHESIS_EXCEPTION'
        }
      };
    }

    if (selectedPeriodResult.ok) {
      const selectedPeriodSynthesis = mapSelectedPeriodSynthesis(selectedPeriodResult.value);

      // PBA-09: Trigger AI explanation for selected period when enabled
      let aiExplanation;
      let aiExplanationStatus: 'OK' | 'ERROR' | undefined;
      if (includeAiExplanation) {
        try {
          aiExplanation = await runAiExplanation({
            horoscope,
            task: 'SELECTED_PERIOD_ANALYSIS',
            domainInterpretations: pipelineState.domainInterpretations ?? [],
            lifeAnalysis: pipelineState.lifeAnalysis!,
            temporalState: pipelineState.temporalState!,
            selectedPeriod: selectedPeriodResult.value,
            selectedPeriodEvidence: {
              careerEvidence: pipelineState.career?.evidence ?? [],
              careerDashaEvidence: pipelineState.careerArtifacts!.careerDashaEvidence,
              wealthEvidence: pipelineState.wealth?.evidence ?? []
            }
          });
          aiExplanationStatus = aiExplanation.kind === 'ERROR' ? 'ERROR' : 'OK';
        } catch (aiError) {
          // AI failure must never reject selectPeriod() - map to ERROR result
          aiExplanation = Object.freeze({
            kind: 'ERROR' as const,
            requestId: `error-${Date.now()}`,
            task: 'SELECTED_PERIOD_ANALYSIS' as const,
            status: 'ERROR' as const,
            message: aiError instanceof Error ? aiError.message : 'AI explanation could not be generated.',
            warnings: Object.freeze([])
          });
          aiExplanationStatus = 'ERROR';
        }
      }

      return {
        ...productAnalysis,
        selectedPeriod: {
          status: 'OK',
          synthesis: {
            ...selectedPeriodSynthesis,
            aiExplanationStatus: aiExplanationStatus ?? 'NOT_REQUESTED',
            ...(aiExplanation ? { aiExplanation } : {})
          }
        }
      };
    }

    // Map error codes to appropriate status (same logic as analyze)
    const error = selectedPeriodResult.error;
    const failureStatus: 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE' = (() => {
      if (
        error === 'REPORT_UNAVAILABLE' ||
        error === 'UNSUPPORTED_DASHA_SYSTEM' ||
        error === 'MAHADASHA_NOT_FOUND' ||
        error === 'ANTARDASHA_NOT_FOUND' ||
        error === 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA' ||
        error === 'INVALID_SELECTED_PERIOD' ||
        error === 'AMBIGUOUS_MAHADASHA_ID' ||
        error === 'AMBIGUOUS_ANTARDASHA_ID' ||
        error === 'INVALID_ANALYSIS_AS_OF' ||
        error === 'INVALID_SELECTED_PERIOD_CONTEXT'
      ) {
        return 'INVALID_SELECTION';
      }
      if (error === 'INCOMPLETE_CANONICAL_INPUT' || error === 'ACTIVATION_PERIOD_MISMATCH') {
        return 'SYNTHESIS_FAILED';
      }
      const _exhaustiveCheck: never = error;
      return _exhaustiveCheck;
    })();

    return {
      ...productAnalysis,
      selectedPeriod: {
        status: failureStatus,
        error: error
      }
    };
  }
}

export function createProductAnalysisService(
  deps?: ProductAnalysisDependencies
): ProductAnalysisService {
  return new ProductAnalysisService(deps);
}
