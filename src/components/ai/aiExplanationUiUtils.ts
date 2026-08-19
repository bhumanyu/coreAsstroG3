import type { AiTask } from '../../ai/types/aiRequestTypes';

export function getTaskHeading(task: AiTask): string {
  switch (task) {
    case 'CHART_SYNTHESIS':
      return 'Chart Synthesis';
    case 'CAREER_ANALYSIS':
      return 'Career Analysis';
    case 'WEALTH_ANALYSIS':
      return 'Wealth Analysis';
    case 'DASHA_ANALYSIS':
      return 'Current Dasha Analysis';
    case 'LIFE_THEME_ANALYSIS':
      return 'Life Theme Analysis';
    case 'GENERAL_QUERY':
      return 'General Analysis';
    default:
      return 'AI Explanation';
  }
}
