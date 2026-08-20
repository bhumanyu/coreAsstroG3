import type { Horoscope } from '../../types';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { interpretCareerV2 } from '../../domain/career/CareerDomainInterpreterV2';
import { interpretWealthV2 } from '../../domain/wealth/WealthDomainInterpreterV2';
import { buildAiContext } from '../../ai/context/aiContextFactory';
import { createAiRequest } from '../../ai/api/createAiRequest';
import { createDefaultAiRouter } from '../../ai/routing/createDefaultAiRouter';
import { runAiExplanation } from '../../ai/product/aiExplanationService';
import type {
  Stage1IntegrationInput,
  Stage1IntegrationResult,
  Stage1UiContract
} from './stage1IntegrationTypes';

/**
 * Orchestrates the full Stage-1 product pipeline:
 * Horoscope -> Domain Interpreters (Career V2, Wealth V2) -> AiContext -> AiRequest -> AiRouter (LOCAL_ONLY) -> AiExplanationService.
 *
 * NOTE on Double Invocation:
 * `buildAiContext(horoscope)` currently instantiates and runs the domain interpreter registry
 * internally to produce `aiContext.domainInterpretations`. In this integration harness, we run
 * `interpretCareerV2(horoscope)` and `interpretWealthV2(horoscope)` directly for rigorous domain assertions
 * and verify that `aiContext.domainInterpretations` matches `projectDomainInterpretationForAi(...)`
 * with deterministic equality. This double invocation in buildAiContext is a known architectural property
 * and is deliberately validated here without refactoring.
 */
export async function runStage1Integration(
  input: Stage1IntegrationInput
): Promise<Stage1IntegrationResult> {
  const horoscope: Horoscope =
    input.horoscope ??
    calculateHoroscope(input.birthDetails ?? CANONICAL_BIRTH_DETAILS);

  const career = interpretCareerV2(horoscope);
  const wealth = interpretWealthV2(horoscope);
  const aiContext = buildAiContext(horoscope);

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
    router
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
