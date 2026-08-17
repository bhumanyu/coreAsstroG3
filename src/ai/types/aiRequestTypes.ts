import type { AiContext } from './aiContextTypes';

export type AiTask =
  | 'CHART_SYNTHESIS'
  | 'CAREER_ANALYSIS'
  | 'WEALTH_ANALYSIS'
  | 'DASHA_ANALYSIS'
  | 'TRANSIT_ANALYSIS'
  | 'LIFE_THEME_ANALYSIS'
  | 'GENERAL_QUERY';

export interface AiRequest {
  readonly requestId: string;
  readonly schemaVersion: string;
  readonly task: AiTask;
  readonly context: AiContext;
  readonly instructions?: readonly string[];
  readonly responseFormat: 'STRUCTURED' | 'NARRATIVE';
}
