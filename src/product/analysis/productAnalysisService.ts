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
import { createAnalysisContext, normalizeAsOf } from '../../core/analysis/analysisContextFactory';
import { systemClock } from '../../core/analysis/Clock';
import type { Clock } from '../../core/analysis/Clock';
import {
  buildProductSelectedPeriodSynthesis,
  type BuildProductSelectedPeriodSynthesisInput
} from './selectedPeriodProductService';
import { runAiExplanation } from '../../ai/product/aiExplanationService';

export interface ProductAnalysisDependencies {
  readonly calculateHoroscope: (birthDetails: BirthDetails, customPositionsOrOptions?: any, asOfParam?: string | Date) => Horoscope;
  readonly clock?: Clock;
  readonly runPipeline: (options: {
    readonly horoscope: Horoscope;
    readonly context: AnalysisContext;
    readonly includeAiExplanation?: boolean;
  }) => Promise<LifeAnalysisProductState>;
}

export const defaultProductAnalysisDependencies: ProductAnalysisDependencies = Object.freeze({
  calculateHoroscope,
  clock: systemClock,
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

/**
 * Frozen run envelope holding request-local references. Freezing is top-level
 * only; nested birth, context, horoscope, and pipeline objects are not deep-frozen.
 */
export interface ProductAnalysisRunSnapshot {
  readonly birthDetails: BirthDetails;
  readonly context: AnalysisContext;
  readonly horoscope?: Horoscope;
  readonly pipelineState?: LifeAnalysisProductState;
}

/** Frozen run envelope; nested analysis and snapshot contents remain unfrozen. */
export interface ProductAnalysisRun {
  readonly analysis: ProductAnalysis;
  readonly snapshot: ProductAnalysisRunSnapshot;
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

  /** Executes full analysis with state isolated to this request. */
  async analyzeRun(
    birthDetails: BirthDetails,
    options?: AnalyzeOptions
  ): Promise<ProductAnalysisRun> {
    const methodology = mapMethodology(birthDetails);
    const context = options?.context ?? createAnalysisContext({
      asOf: options?.asOf,
      methodology,
      engineVersion: methodology.calculationEngine,
      rulesVersion: methodology.rulesEngine
    }, this.deps.clock ?? systemClock);

    let horoscope: Horoscope | undefined;
    let pipelineState: LifeAnalysisProductState | undefined;
    const finish = (analysis: ProductAnalysis): ProductAnalysisRun => {
      const snapshot: ProductAnalysisRunSnapshot = Object.freeze({
        birthDetails,
        context,
        ...(horoscope ? { horoscope } : {}),
        ...(pipelineState ? { pipelineState } : {})
      });
      return Object.freeze({ analysis, snapshot });
    };

    try {
      if (options?.context && options.asOf !== undefined) {
        const requestedAsOf = normalizeAsOf(options.asOf);
        if (requestedAsOf !== context.asOf) {
          throw new Error(
            `Conflicting analysis time: options.context.asOf (${context.asOf}) does not match options.asOf (${requestedAsOf}).`
          );
        }
      }

      horoscope = this.deps.calculateHoroscope(birthDetails, undefined, context.asOf);
      pipelineState = await this.deps.runPipeline({
        horoscope,
        context,
        includeAiExplanation: options?.includeAiExplanation ?? true
      });

      if (pipelineState.status === 'ERROR' || !pipelineState.analysis) {
        return finish(buildFailedProductAnalysis(
          birthDetails,
          pipelineState.errorMessage || 'Life analysis computation failed.',
          context
        ));
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
          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'CAREER_ARTIFACTS_UNAVAILABLE'
            }
          });
        }

        // Check if temporalState is available
        if (!pipelineState.temporalState) {
          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'TEMPORAL_STATE_UNAVAILABLE'
            }
          });
        }

        // Check if career baseline is available
        if (!pipelineState.career?.conclusionData) {
          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'CAREER_BASELINE_UNAVAILABLE'
            }
          });
        }

        // Check if wealth baseline is available
        if (!pipelineState.wealth?.conclusionData) {
          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'UNAVAILABLE',
              error: 'WEALTH_BASELINE_UNAVAILABLE'
            }
          });
        }

        const selectedPeriodInput: BuildProductSelectedPeriodSynthesisInput = {
          selection: options.selectedPeriod,
          context,
          temporalState: pipelineState.temporalState,
          horoscope,
          careerArtifacts: pipelineState.careerArtifacts,
          careerEvidence: pipelineState.career?.evidence ?? [],
          careerDashaEvidence: pipelineState.careerArtifacts.careerDashaEvidence,
          wealthEvidence: pipelineState.wealth?.evidence,
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
          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'SYNTHESIS_FAILED',
              error: 'SYNTHESIS_EXCEPTION'
            }
          });
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

          return finish({
            ...productAnalysis,
            selectedPeriod: {
              status: 'OK',
              synthesis: {
                ...selectedPeriodSynthesis,
                aiExplanationStatus: aiExplanationStatus ?? 'NOT_REQUESTED',
                ...(aiExplanation ? { aiExplanation } : {})
              }
            }
          });
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
          // SYNTHESIS stage errors (from buildSelectedPeriodSynthesis)
          if (error === 'ACTIVATION_PERIOD_MISMATCH') {
            return 'SYNTHESIS_FAILED';
          }
          // Exhaustive check: if we reach here, the error type is not in the union
          const _exhaustiveCheck: never = error;
          return _exhaustiveCheck;
        })();

        // On failure, return productAnalysis with typed failure (no natal status downgrade)
        return finish({
          ...productAnalysis,
          selectedPeriod: {
            status: failureStatus,
            error: error
          }
        });
      }

      return finish(productAnalysis);
    } catch (error: unknown) {
      return finish(buildFailedProductAnalysis(birthDetails, error, context));
    }
  }

  /**
   * @deprecated Not concurrency-safe: this method retains shared `_last*`
   * instance state that concurrent calls can overwrite. `selectPeriod()` may
   * then use a mismatched run. Use `analyzeRun()` and its returned snapshot.
   */
  async analyze(
    birthDetails: BirthDetails,
    options?: AnalyzeOptions
  ): Promise<ProductAnalysis> {
    const run = await this.analyzeRun(birthDetails, options);
    this._lastHoroscope = run.snapshot.horoscope;
    this._lastBirthDetails = run.snapshot.birthDetails;
    this._lastContext = run.snapshot.context;
    this._lastPipelineState = run.snapshot.pipelineState;
    return run.analysis;
  }

  /**
   * Re-selects a Dasha period using only the supplied run snapshot.
   * It reuses this run's horoscope, pipeline state, evidence, and baselines;
   * it never recalculates the horoscope or reruns the pipeline.
   *
   * @param includeAiExplanation Whether to trigger selected-period AI (PBA-09).
   */
  async selectPeriodForRun(
    snapshot: ProductAnalysisRunSnapshot,
    mahadashaId: string,
    antardashaId: string,
    includeAiExplanation?: boolean
  ): Promise<ProductAnalysis> {
    const { horoscope, birthDetails, context, pipelineState } = snapshot;
    if (!horoscope) {
      throw new Error('Cannot select period: no horoscope available. Call analyze() first.');
    }
    if (!pipelineState) {
      throw new Error('Cannot select period: no pipeline state available. Call analyze() first.');
    }
    if (!birthDetails) {
      throw new Error('Cannot select period: no birth details available. Call analyze() first.');
    }
    if (!context) {
      throw new Error('Cannot select period: no analysis context available. Call analyze() first.');
    }
    if (!pipelineState.temporalState) {
      throw new Error('Cannot select period: temporalState unavailable.');
    }
    if (!pipelineState.careerArtifacts) {
      throw new Error('Cannot select period: careerArtifacts unavailable.');
    }
    if (!pipelineState.career?.conclusionData) {
      throw new Error('Cannot select period: career baseline unavailable.');
    }
    if (!pipelineState.wealth?.conclusionData) {
      throw new Error('Cannot select period: wealth baseline unavailable.');
    }

    const temporalState = pipelineState.temporalState!;

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
      wealthEvidence: pipelineState.wealth?.evidence,
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
      if (error === 'ACTIVATION_PERIOD_MISMATCH') {
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

  /**
   * @deprecated Not concurrency-safe: this method reads shared `_last*` state,
   * which concurrent `analyze()` calls can overwrite and may mismatch the
   * selected analysis. Use `selectPeriodForRun()` with the snapshot from
   * `analyzeRun()`.
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
    const snapshot: ProductAnalysisRunSnapshot = Object.freeze({
      birthDetails: this._lastBirthDetails,
      context: this._lastContext,
      horoscope: this._lastHoroscope,
      pipelineState: this._lastPipelineState
    });
    return this.selectPeriodForRun(snapshot, mahadashaId, antardashaId, includeAiExplanation);
  }
}

export function createProductAnalysisService(
  deps?: ProductAnalysisDependencies
): ProductAnalysisService {
  return new ProductAnalysisService(deps);
}
