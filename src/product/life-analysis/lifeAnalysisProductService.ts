import type { Horoscope } from '../../types';
import type { DomainInterpretation } from '../../domain/interpretation';
import type { AiRouter } from '../../ai';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { runAiExplanation } from '../../ai/product/aiExplanationService';
import { resolveLifeAnalysisEvidence } from './lifeAnalysisEvidence';
import { buildLifeAnalysisViewModel } from './lifeAnalysisMapper';
import type {
  LifeAnalysisProductState,
  LifeAnalysisProductStatus
} from './lifeAnalysisTypes';
import { deepFreeze } from '../../ai/context/deepFreeze';

export interface RunLifeAnalysisProductOptions {
  readonly horoscope: Horoscope;
  readonly router?: AiRouter;
  readonly includeAiExplanation?: boolean;
}

/**
 * Executes the full deterministic P-028 LifeAnalysis pipeline and optionally
 * enriches it with the P-026 AI explanation layer.
 *
 * Invariant: Career, Wealth, and LifeAnalysis are computed exactly once.
 * If AI explanation is requested, pre-computed values are passed through to avoid
 * redundant calculation.
 *
 * Invariant: Never fails into ERROR status solely because AI explanation failed.
 * If deterministic analysis succeeds, returns READY or PARTIAL status.
 */
export async function runLifeAnalysisProduct(
  options: RunLifeAnalysisProductOptions
): Promise<LifeAnalysisProductState> {
  try {
    // Compute Career, Wealth, and LifeAnalysis exactly once
    const career = interpretCareerV2(options.horoscope);
    const wealth = interpretWealthV2(options.horoscope);
    const domainInterpretations: readonly DomainInterpretation[] = [career, wealth];
    const analysis = buildLifeAnalysis(domainInterpretations);

    // Build AI context without recomputing domain interpretations or life analysis
    const aiContext = buildAiContext(options.horoscope, {
      domainInterpretations,
      lifeAnalysis: analysis
    });
    const resolvedEvidence = resolveLifeAnalysisEvidence(
      analysis,
      aiContext.evidence ?? []
    );

    const viewModel = buildLifeAnalysisViewModel(
      analysis,
      career,
      wealth,
      resolvedEvidence,
      options.horoscope.dashaInterpretation?.current
    );

    const deterministicStatus: LifeAnalysisProductStatus =
      viewModel.status === 'PARTIAL' ? 'PARTIAL' : 'READY';

    if (options.includeAiExplanation === false) {
      return deepFreeze({
        status: deterministicStatus,
        analysis: viewModel
      });
    }

    // Pass pre-computed domain interpretations and life analysis to avoid double calculation
    const aiExplanation = await runAiExplanation({
      horoscope: options.horoscope,
      task: 'LIFE_ANALYSIS_EXPLANATION',
      router: options.router,
      domainInterpretations,
      lifeAnalysis: analysis
    });

    return deepFreeze({
      status: deterministicStatus,
      analysis: viewModel,
      aiExplanation
    });
  } catch (error) {
    return deepFreeze({
      status: 'ERROR',
      errorMessage: error instanceof Error ? error.message : String(error)
    });
  }
}
