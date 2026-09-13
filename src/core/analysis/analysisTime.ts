import type { AnalysisContext } from './AnalysisContext';

export function analysisAsOfDate(context: AnalysisContext): Date {
  const d = new Date(context.asOf);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid context asOf timestamp: "${context.asOf}"`);
  }
  return d;
}

export function analysisAsOfEpochMs(context: AnalysisContext): number {
  return analysisAsOfDate(context).getTime();
}
