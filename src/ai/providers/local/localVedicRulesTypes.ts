import type { AiContext } from '../../types/aiContextTypes';
import type { AiReasoningResult } from '../../types/aiReasoningResult';

export type LocalRuleEffect = 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED';

export type LocalRuleDomain =
  | 'CHART'
  | 'CAREER'
  | 'WEALTH'
  | 'DASHA'
  | 'LIFE_THEME'
  | 'GENERAL';

export interface LocalRuleEvaluation {
  readonly triggered: boolean;
  readonly effect: LocalRuleEffect;
  readonly statement: string;
  readonly supportingEvidenceIds?: readonly string[];
  readonly challengingEvidenceIds?: readonly string[];
  readonly warnings?: readonly string[];
}

export interface LocalRuleDefinition {
  readonly id: string;
  readonly domain: LocalRuleDomain;
  readonly priority: number;
  readonly evaluate: (context: AiContext) => LocalRuleEvaluation;
}

export type LocalReasoningOutput = AiReasoningResult;
