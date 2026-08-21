import type { Horoscope } from '../../types';
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
 * Invariant: Never fails into ERROR status solely because AI explanation failed.
 * If deterministic analysis succeeds, returns READY or PARTIAL status.
 */
export async function runLifeAnalysisProduct(
  options: RunLifeAnalysisProductOptions
): Promise<LifeAnalysisProductState> {
  try {
    const career = interpretCareerV2(options.horoscope);
    const wealth = interpretWealthV2(options.horoscope);
    const analysis = buildLifeAnalysis([career, wealth]);

    const aiContext = buildAiContext(options.horoscope);
    const resolvedEvidence = resolveLifeAnalysisEvidence(
      analysis,
      aiContext.evidence ?? []
    );

    const viewModel = buildLifeAnalysisViewModel(
      analysis,
      career,
      wealth,
      resolvedEvidence
    );

    const deterministicStatus: LifeAnalysisProductStatus =
      viewModel.status === 'PARTIAL' ? 'PARTIAL' : 'READY';

    if (options.includeAiExplanation === false) {
      return deepFreeze({
        status: deterministicStatus,
        analysis: viewModel
      });
    }

    const aiExplanation = await runAiExplanation({
      horoscope: options.horoscope,
      task: 'CHART_SYNTHESIS',
      router: options.router
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
