import type { BirthDetails, Horoscope } from '../../types';
import type { DomainInterpretation } from '../../domain/interpretation/DomainInterpretation';
import type { AiContext } from '../../ai/types/aiContextTypes';
import type { AiRequest, AiTask } from '../../ai/types/aiRequestTypes';
import type { AiRoutingResult } from '../../ai/routing/aiRoutingTypes';
import type { AiRouter } from '../../ai/routing/AiRouter';
import type {
  AiExplanationResult,
  AiExplanationEvidence
} from '../../ai/product/aiExplanationTypes';

export interface Stage1IntegrationInput {
  readonly horoscope?: Horoscope;
  readonly birthDetails?: BirthDetails;
  readonly task: AiTask;
  readonly requestId?: string;
  readonly router?: AiRouter;
}

export interface Stage1IntegrationResult {
  readonly horoscope: Horoscope;
  readonly career: DomainInterpretation;
  readonly wealth: DomainInterpretation;
  readonly aiContext: AiContext;
  readonly aiRequest: AiRequest;
  readonly routingResult: AiRoutingResult;
  readonly explanation: AiExplanationResult;
}

export interface Stage1GoldenExpectation {
  readonly career: {
    readonly natalStatus: string;
    readonly d10Relationship: string;
    readonly supportingEvidenceRequired: boolean;
  };
  readonly wealth: {
    readonly overallStatus: string;
    readonly accumulationStatus: string;
    readonly gainsStatus: string;
    readonly fortuneStatus: string;
    readonly speculationStatus: string;
    readonly d2Relationship: string;
  };
}

export interface Stage1UiContract {
  readonly career: {
    readonly status: string;
    readonly conclusion: string;
    readonly evidence: readonly AiExplanationEvidence[];
  };
  readonly wealth: {
    readonly overallStatus: string;
    readonly accumulationStatus: string;
    readonly gainsStatus: string;
    readonly fortuneStatus: string;
    readonly speculationStatus: string;
    readonly conclusion: string;
    readonly evidence: readonly AiExplanationEvidence[];
  };
}
