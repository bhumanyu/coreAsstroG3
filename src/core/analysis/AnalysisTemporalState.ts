import type { DashaInterpretationReport } from '../../engine/dashaInterpretation/dashaInterpretationTypes';

export interface AnalysisTemporalState {
  readonly asOf: string;
  readonly dashaInterpretation: DashaInterpretationReport | undefined;
}
