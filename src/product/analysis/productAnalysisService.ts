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
import { mapProductAnalysis, buildFailedProductAnalysis } from './productAnalysisMapper';

export interface ProductAnalysisDependencies {
  readonly calculateHoroscope: (birthDetails: BirthDetails) => Horoscope;
  readonly runPipeline: (options: {
    readonly horoscope: Horoscope;
    readonly includeAiExplanation?: boolean;
    readonly asOf?: Date | string;
  }) => Promise<LifeAnalysisProductState>;
}

export const defaultProductAnalysisDependencies: ProductAnalysisDependencies = Object.freeze({
  calculateHoroscope,
  runPipeline: runLifeAnalysisProduct
});

export interface AnalyzeOptions {
  readonly includeAiExplanation?: boolean;
  readonly asOf?: Date | string;
}

export class ProductAnalysisService {
  private _lastPipelineState?: LifeAnalysisProductState;
  private _lastHoroscope?: Horoscope;

  constructor(
    private readonly deps: ProductAnalysisDependencies = defaultProductAnalysisDependencies
  ) {}

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
    const asOfString = options?.asOf ? (options.asOf instanceof Date ? options.asOf.toISOString() : options.asOf) : undefined;
    try {
      const horoscope = this.deps.calculateHoroscope(birthDetails);
      this._lastHoroscope = horoscope;
      const pipelineState = await this.deps.runPipeline({
        horoscope,
        includeAiExplanation: options?.includeAiExplanation ?? true,
        ...(options?.asOf ? { asOf: options.asOf } : {})
      });
      this._lastPipelineState = pipelineState;

      if (pipelineState.status === 'ERROR' || !pipelineState.analysis) {
        return buildFailedProductAnalysis(
          birthDetails,
          pipelineState.errorMessage || 'Life analysis computation failed.',
          asOfString
        );
      }

      return mapProductAnalysis({
        birthDetails,
        horoscope,
        lifeAnalysisViewModel: pipelineState.analysis,
        aiExplanation: pipelineState.aiExplanation,
        asOf: asOfString
      });
    } catch (error: unknown) {
      return buildFailedProductAnalysis(birthDetails, error, asOfString);
    }
  }
}

export function createProductAnalysisService(
  deps?: ProductAnalysisDependencies
): ProductAnalysisService {
  return new ProductAnalysisService(deps);
}
