import type { Horoscope } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { buildLifeAnalysis } from '../../domain/synthesis';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { createAiRequest } from '../../ai/api/createAiRequest';
import { createDefaultAiRouter } from '../../ai/routing/createDefaultAiRouter';
import { runAiExplanation } from '../../ai/product/aiExplanationService';
import type { AnalysisContext } from '../../core/analysis/AnalysisContext';
import {
  createAnalysisContext,
  DEFAULT_ENGINE_VERSION,
  DEFAULT_RULES_VERSION
} from '../../core/analysis/analysisContextFactory';
import { mapMethodology } from '../../product/analysis/productAnalysisMapper';
import type { DomainReasoningOptions } from '../../domain/reasoning/reasoningTypes';
import type {
  Stage1IntegrationInput,
  Stage1IntegrationResult,
  Stage1UiContract
} from './stage1IntegrationTypes';

/**
 * Orchestrates the full Stage-1 product pipeline:
 * Horoscope -> Domain Interpreters (Career V2, Wealth V2) -> LifeAnalysis Synthesis -> AiContext -> AiRequest -> AiRouter (LOCAL_ONLY) -> AiExplanationService.
 *
 * NOTE on Single Canonical Execution:
 * Domain interpretation happens exactly once for Career and Wealth using the immutable AnalysisContext.
 * The resulting domain interpretations and synthesized LifeAnalysis are passed directly into
 * buildAiContext and runAiExplanation, reusing precomputed results across AiContext and AiExplanation
 * without duplicate or divergent recomputation.
 */
export async function runStage1Integration(
  input: Stage1IntegrationInput
): Promise<Stage1IntegrationResult> {
  const birthDetails =
    input.birthDetails ?? input.horoscope?.birthDetails ?? CANONICAL_BIRTH_DETAILS;

  const context: AnalysisContext =
    input.context ??
    createAnalysisContext({
      methodology: mapMethodology(birthDetails),
      engineVersion: DEFAULT_ENGINE_VERSION,
      rulesVersion: DEFAULT_RULES_VERSION
    });

  const horoscope: Horoscope =
    input.horoscope ??
    calculateHoroscope(birthDetails, undefined, context.asOf);

  const domainOptions: DomainReasoningOptions = { context };
  const career = interpretCareerV2(horoscope, domainOptions);
  const wealth = interpretWealthV2(horoscope, domainOptions);
  const lifeAnalysis = buildLifeAnalysis([career, wealth]);

  const aiContext = buildAiContext(horoscope, {
    domainInterpretations: [career, wealth],
    lifeAnalysis
  });

  const router = input.router ?? createDefaultAiRouter();
  const requestId = input.requestId ?? 'stage1-integration-request';

  const aiRequest = createAiRequest(
    input.task,
    aiContext,
    'STRUCTURED',
    requestId
  );

  const routingResult = await router.route(aiRequest, {
    mode: 'LOCAL_ONLY',
    fallbackPolicy: 'NO_FALLBACK'
  });

  const explanation = await runAiExplanation({
    horoscope,
    task: input.task,
    router,
    domainInterpretations: [career, wealth],
    lifeAnalysis
  });

  return Object.freeze({
    horoscope,
    career,
    wealth,
    aiContext,
    aiRequest,
    routingResult,
    explanation
  });
}

/**
 * Builds the presentation ViewModel contract consumed by the React UI layer.
 * The UI model only CONSUMES precomputed domain and AI results without recomputing astrological logic.
 */
export function buildStage1UiModel(
  result: Stage1IntegrationResult
): Stage1UiContract {
  const careerData = result.career.conclusionData;
  const wealthData = result.wealth.conclusionData;

  const careerEvidence =
    result.explanation.kind === 'SUCCESS'
      ? result.explanation.supportingEvidence
      : Object.freeze([]);

  const wealthEvidence =
    result.explanation.kind === 'SUCCESS'
      ? result.explanation.supportingEvidence
      : Object.freeze([]);

  return Object.freeze({
    career: Object.freeze({
      status: careerData?.natalStatus ?? result.career.natalPromise.strength,
      conclusion: result.career.conclusion.statement,
      evidence: careerEvidence
    }),
    wealth: Object.freeze({
      overallStatus:
        wealthData?.overallStatus ?? result.wealth.natalPromise.strength,
      accumulationStatus: wealthData?.accumulationStatus ?? 'UNAVAILABLE',
      gainsStatus: wealthData?.gainsStatus ?? 'UNAVAILABLE',
      fortuneStatus: wealthData?.fortuneStatus ?? 'UNAVAILABLE',
      speculationStatus: wealthData?.speculationStatus ?? 'UNAVAILABLE',
      conclusion: result.wealth.conclusion.statement,
      evidence: wealthEvidence
    })
  });
}
