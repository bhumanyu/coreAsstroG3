import React from 'react';
import type { Horoscope } from '../types';
import type { LifeAnalysisProductState } from '../product/life-analysis/lifeAnalysisTypes';
import type { AppState } from '../app/AppState';
import { AiExplanationPanel } from '../components/ai/AiExplanationPanel';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface AiExplanationPageProps {
  readonly state: AppState;
  readonly horoscope?: Horoscope;
  readonly lifeAnalysisState?: LifeAnalysisProductState;
  readonly onRetry?: () => void;
}

export const AiExplanationPage: React.FC<AiExplanationPageProps> = ({
  state,
  horoscope,
  lifeAnalysisState,
  onRetry
}) => {
  const effectiveState = lifeAnalysisState ?? state.lifeAnalysisState;
  const career = effectiveState?.career;
  const wealth = effectiveState?.wealth;
  const lifeAnalysis = effectiveState?.lifeAnalysis;
  const temporalState = effectiveState?.temporalState;
  const analysisId = state.productAnalysis?.analysis?.analysisId;

  const isReady = Boolean(
    horoscope &&
      career &&
      wealth &&
      lifeAnalysis &&
      temporalState &&
      effectiveState?.status !== 'ERROR'
  );

  if (!isReady) {
    return (
      <div
        data-testid="ai-explanation-unavailable"
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-semibold">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              AI Explanation Unavailable
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Canonical analysis artifacts are not yet ready or failed to compute.
          </p>
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Analysis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <AiExplanationPanel
        analysisId={analysisId}
        horoscope={horoscope!}
        career={career!}
        wealth={wealth!}
        lifeAnalysis={lifeAnalysis!}
        temporalState={temporalState!}
      />
    </div>
  );
};
