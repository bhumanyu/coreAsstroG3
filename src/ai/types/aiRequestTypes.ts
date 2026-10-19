import type { AiContext } from './aiContextTypes';
import type { AiContextSchemaVersion } from './aiTypes';

export type AiTask =
  | 'CHART_SYNTHESIS'
  | 'CAREER_ANALYSIS'
  | 'WEALTH_ANALYSIS'
  | 'DASHA_ANALYSIS'
  | 'LIFE_THEME_ANALYSIS'
  | 'LIFE_ANALYSIS_EXPLANATION'
  | 'SELECTED_PERIOD_ANALYSIS'
  | 'GENERAL_QUERY';

export interface AiRequest {
  readonly requestId: string;
  readonly schemaVersion: AiContextSchemaVersion;
  readonly task: AiTask;
  readonly context: AiContext;
  readonly instructions?: readonly string[];
  readonly responseFormat: 'STRUCTURED' | 'NARRATIVE';
  /**
   * Optional traceability IDs for debugging and audit.
   * When present, should contain deduplicated evidence IDs from the context.
   */
  readonly traceabilityIds?: readonly string[];
}
