import type { DomainInterpretation } from '../interpretation';
import type {
  LifeAnalysis,
  SynthesizeLifeAnalysisOptions
} from './domainSynthesisTypes';
import { synthesizeLifeAnalysis } from './domainSynthesisService';

export function buildLifeAnalysis(
  domains: readonly DomainInterpretation[],
  options?: SynthesizeLifeAnalysisOptions
): LifeAnalysis {
  return synthesizeLifeAnalysis(domains, options);
}
