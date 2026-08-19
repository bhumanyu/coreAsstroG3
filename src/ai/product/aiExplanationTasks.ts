import type { AiTask } from '../types/aiRequestTypes';

export interface AiExplanationTaskOption {
  readonly task: AiTask;
  readonly label: string;
  readonly description: string;
}

export const AI_EXPLANATION_TASKS: readonly AiExplanationTaskOption[] =
  Object.freeze([
    Object.freeze({
      task: 'CHART_SYNTHESIS',
      label: 'Chart Synthesis',
      description:
        'Explain the major deterministic patterns found across the chart.'
    }),
    Object.freeze({
      task: 'CAREER_ANALYSIS',
      label: 'Career',
      description:
        'Explain the deterministic career indications and supporting evidence.'
    }),
    Object.freeze({
      task: 'WEALTH_ANALYSIS',
      label: 'Wealth',
      description:
        'Explain accumulation, gains and financial indications available in the context.'
    }),
    Object.freeze({
      task: 'DASHA_ANALYSIS',
      label: 'Current Dasha',
      description:
        'Explain the active Vimshottari Dasha interpretation.'
    }),
    Object.freeze({
      task: 'LIFE_THEME_ANALYSIS',
      label: 'Life Themes',
      description:
        'Explain the major life themes projected by CoreAstro.'
    })
  ]);

export function getAiExplanationTaskOption(
  task: AiTask
): AiExplanationTaskOption | undefined {
  return AI_EXPLANATION_TASKS.find((option) => option.task === task);
}
