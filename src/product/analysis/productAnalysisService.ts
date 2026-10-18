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
      if (options?.selectedPeriod && pipelineState.careerArtifacts) {
        const selectedPeriodInput: BuildProductSelectedPeriodSynthesisInput = {
          selection: options.selectedPeriod,
          context,
          temporalState: pipelineState.temporalState!,
          horoscope,
          careerArtifacts: pipelineState.careerArtifacts,
          careerEvidence: pipelineState.career?.evidence ?? [],
          careerDashaEvidence: pipelineState.careerArtifacts.careerDashaEvidence,
          wealthEvidence: pipelineState.wealth?.evidence ?? [],
          careerBaseline: pipelineState.career?.conclusionData as any,
          wealthBaseline: pipelineState.wealth?.conclusionData as any
        };

        const selectedPeriodResult = buildProductSelectedPeriodSynthesis(selectedPeriodInput);

        if (selectedPeriodResult.ok) {
          const selectedPeriodSynthesis = mapSelectedPeriodSynthesis(selectedPeriodResult.value);
          return {
            ...productAnalysis,
            selectedPeriod: selectedPeriodSynthesis
          };
        }
        // On failure, return productAnalysis without selectedPeriod (no natal status downgrade)
        return productAnalysis;
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
