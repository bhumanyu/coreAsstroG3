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
import type { ProductAnalysis } from './productAnalysisTypes';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';
import { mapProductAnalysis, buildFailedProductAnalysis, mapMethodology, mapEvidenceItems, mapSelectedPeriodSynthesis } from './productAnalysisMapper';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import { createAnalysisContext } from '../../core/analysis/analysisContextFactory';
import {
  buildProductSelectedPeriodSynthesis,
  type BuildProductSelectedPeriodSynthesisInput
} from './selectedPeriodProductService';

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
}

export class ProductAnalysisService {
  private _lastPipelineState?: LifeAnalysisProductState;
  private _lastHoroscope?: Horoscope;

  constructor(
    private readonly deps: ProductAnalysisDependencies = defaultProductAnalysisDependencies
  ) { }

  get lastPipelineState(): LifeAnalysisProductState | undefined {
    return this._lastPipelineState;
  }

  get lastHoroscope(): Horoscope | undefined {
    return this._lastHoroscope;
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
          careerBaseline: pipelineState.career?.conclusionData as CareerConclusionData,
          wealthBaseline: pipelineState.wealth?.conclusionData as WealthConclusionData
        };

        const selectedPeriodResult = buildProductSelectedPeriodSynthesis(selectedPeriodInput);

        if (selectedPeriodResult.ok) {
          const selectedPeriodSynthesis = mapSelectedPeriodSynthesis(selectedPeriodResult.value);
          return {
            ...productAnalysis,
            selectedPeriod: {
              status: 'OK',
              synthesis: selectedPeriodSynthesis
            }
          };
        }

        // Map error codes to appropriate status based on the actual domain error codes
        let failureStatus: 'INVALID_SELECTION' | 'SYNTHESIS_FAILED' | 'UNAVAILABLE';
        const error = selectedPeriodResult.error;

        // UNAVAILABLE errors (missing prerequisites)
        if (error === 'CAREER_ARTIFACTS_UNAVAILABLE' ||
          error === 'TEMPORAL_STATE_UNAVAILABLE' ||
          error === 'CAREER_BASELINE_UNAVAILABLE' ||
          error === 'WEALTH_BASELINE_UNAVAILABLE') {
          failureStatus = 'UNAVAILABLE';
        }
        // CONTEXT stage errors (from createSelectedPeriodActivationContext)
        else if (error === 'REPORT_UNAVAILABLE' ||
          error === 'UNSUPPORTED_DASHA_SYSTEM' ||
          error === 'MAHADASHA_NOT_FOUND' ||
          error === 'ANTARDASHA_NOT_FOUND' ||
          error === 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA' ||
          error === 'INVALID_SELECTED_PERIOD' ||
          error === 'AMBIGUOUS_MAHADASHA_ID' ||
          error === 'AMBIGUOUS_ANTARDASHA_ID' ||
          error === 'INVALID_ANALYSIS_AS_OF' ||
          error === 'INVALID_SELECTED_PERIOD_CONTEXT') {
          failureStatus = 'INVALID_SELECTION';
        }
        // CAREER stage errors (from buildSelectedCareerDashaActivation)
        else if (error === 'INCOMPLETE_CANONICAL_INPUT') {
          failureStatus = 'SYNTHESIS_FAILED';
        }
        // SYNTHESIS stage errors (from buildSelectedPeriodSynthesis)
        else if (error === 'ACTIVATION_PERIOD_MISMATCH') {
          failureStatus = 'SYNTHESIS_FAILED';
        }
        // WEALTH stage errors (from evaluateSelectedWealthPeriodActivation)
        else if (error === 'INVALID_SELECTED_PERIOD_CONTEXT') {
          failureStatus = 'SYNTHESIS_FAILED';
        }
        // Any other error is treated as SYNTHESIS_FAILED
        else {
          failureStatus = 'SYNTHESIS_FAILED';
        }

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
}

export function createProductAnalysisService(
  deps?: ProductAnalysisDependencies
): ProductAnalysisService {
  return new ProductAnalysisService(deps);
}
