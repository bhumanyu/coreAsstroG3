import type { AiCapability } from '../types/aiProviderTypes';
import type { AiRequest, AiTask } from '../types/aiRequestTypes';

export const TASK_REQUIRED_CAPABILITIES: Readonly<Record<AiTask, readonly AiCapability[]>> = Object.freeze({
  CHART_SYNTHESIS: Object.freeze(['CHART_SYNTHESIS'] as const),
  CAREER_ANALYSIS: Object.freeze(['CAREER'] as const),
  WEALTH_ANALYSIS: Object.freeze(['WEALTH'] as const),
  DASHA_ANALYSIS: Object.freeze(['DASHA'] as const),
  LIFE_THEME_ANALYSIS: Object.freeze(['LIFE_THEMES'] as const),
  LIFE_ANALYSIS_EXPLANATION: Object.freeze(['CHART_SYNTHESIS'] as const),
  GENERAL_QUERY: Object.freeze([] as const)
});

/**
 * Returns required capabilities for a specific AI task.
 */
export function requiredCapabilitiesForTask(task: AiTask): readonly AiCapability[] {
  return TASK_REQUIRED_CAPABILITIES[task] ?? Object.freeze([]);
}

/**
 * Returns required capabilities for a full request, including structured output if requested.
 */
export function requiredCapabilitiesForRequest(request: AiRequest): readonly AiCapability[] {
  const taskCapabilities = requiredCapabilitiesForTask(request.task);

  if (request.responseFormat === 'STRUCTURED') {
    if (!taskCapabilities.includes('STRUCTURED_OUTPUT')) {
      return Object.freeze([...taskCapabilities, 'STRUCTURED_OUTPUT']);
    }
  }

  return taskCapabilities;
}
