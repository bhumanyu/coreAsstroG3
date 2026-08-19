import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  TriangleAlert
} from 'lucide-react';
import type { BirthDetails, Horoscope } from '../../types';
import type { AiTask } from '../../ai/types/aiRequestTypes';
import {
  AI_EXPLANATION_TASKS,
  runAiExplanation
} from '../../ai';
import type {
  AiExplanationResult,
  AiExplanationViewModel
} from '../../ai';
import { AiExplanationEvidenceList } from './AiExplanationEvidenceList';

interface AiExplanationPanelProps {
  readonly horoscope: Horoscope;
  readonly birthDetails: BirthDetails;
}

export const AiExplanationPanel: React.FC<AiExplanationPanelProps> = ({
  horoscope,
  birthDetails
}) => {
  const [selectedTask, setSelectedTask] = useState<AiTask>('CHART_SYNTHESIS');
  const [result, setResult] = useState<AiExplanationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const requestIdRef = useRef(0);

  const chartKey = useMemo(
    () =>
      `${birthDetails.dateTimeStr}|${birthDetails.timeZone}|${birthDetails.ayanamsa}`,
    [
      birthDetails.dateTimeStr,
      birthDetails.timeZone,
      birthDetails.ayanamsa
    ]
  );

  useEffect(() => {
    requestIdRef.current += 1;
    setResult(null);
    setHasGenerated(false);
    setIsLoading(false);
  }, [chartKey]);

  const handleGenerate = async () => {
    const currentRequestId = ++requestIdRef.current;
    const requestChartKey = chartKey;

    setIsLoading(true);
    setResult(null);

    try {
      const nextResult = await runAiExplanation({
        horoscope,
        task: selectedTask
      });

      // Guard against chart change or newer request initiated during in-flight async call
      if (
        requestIdRef.current !== currentRequestId ||
        chartKey !== requestChartKey
      ) {
        return;
      }

      setResult(nextResult);
      setHasGenerated(true);
    } finally {
      if (
        requestIdRef.current === currentRequestId &&
        chartKey === requestChartKey
      ) {
        setIsLoading(false);
      }
    }
  };

  return (
    <section className="space-y-5">
      <div className="bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-400" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100">
                  AI Explanation
                </h2>

                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-mono-code bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Local • Offline
                </span>
              </div>

              <p className="text-sm text-slate-400 mt-1">
                Deterministic CoreAstro evidence explained through
                the local Vedic reasoning engine.
              </p>
            </div>
          </div>

          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {AI_EXPLANATION_TASKS.map((option) => {
            const active = selectedTask === option.task;

            return (
              <button
                key={option.task}
                type="button"
                onClick={() => setSelectedTask(option.task)}
                className={[
                  'text-left rounded-xl border p-3 transition-all cursor-pointer',
                  active
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-200'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">
                    {option.label}
                  </span>

                  {active && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                <p className="text-[11px] leading-relaxed mt-1 text-slate-500">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-medium text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating explanation…</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {hasGenerated
                  ? 'Regenerate Explanation'
                  : 'Generate Explanation'}
              </span>
            </>
          )}
        </button>
      </div>

      {result && <AiExplanationResultView result={result} />}
    </section>
  );
};

interface AiExplanationResultViewProps {
  readonly result: AiExplanationResult;
}

const AiExplanationResultView: React.FC<AiExplanationResultViewProps> = ({
  result
}) => {
  if (result.kind === 'ERROR') {
    return (
      <div className="bg-slate-900/90 border border-rose-500/20 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5" />

          <div>
            <h3 className="font-semibold text-slate-100">
              AI explanation unavailable
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              {result.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <AiExplanationSuccessView result={result} />;
};

interface AiExplanationSuccessViewProps {
  readonly result: AiExplanationViewModel;
}

const AiExplanationSuccessView: React.FC<AiExplanationSuccessViewProps> = ({
  result
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />

            <h3 className="font-semibold text-slate-100">
              CoreAstro Explanation
            </h3>
          </div>

          <span className="text-[10px] uppercase tracking-wide font-mono-code text-slate-500">
            {result.status}
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-slate-950/70 border border-slate-800 p-4">
          <p className="text-sm leading-7 text-slate-200">
            {result.conclusion}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono-code">
          <span className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
            Provider: {result.providerName}
          </span>

          <span className="px-2 py-1 rounded-md bg-slate-800 text-slate-400">
            Mode: {result.routingMode}
          </span>

          {result.fallbackUsed && (
            <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
              Fallback used
            </span>
          )}
        </div>
      </div>

      {result.supportingEvidence.length > 0 && (
        <AiExplanationEvidenceList
          title="Supporting Evidence"
          items={result.supportingEvidence}
          variant="supporting"
        />
      )}

      {result.challengingEvidence.length > 0 && (
        <AiExplanationEvidenceList
          title="Challenging Evidence"
          items={result.challengingEvidence}
          variant="challenging"
        />
      )}

      {result.unresolvedQuestions.length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-400" />

            <h3 className="font-semibold text-slate-100">
              Unresolved Questions
            </h3>
          </div>

          <ul className="mt-3 space-y-2">
            {result.unresolvedQuestions.map((question) => (
              <li
                key={question}
                className="flex items-start gap-2 text-sm text-slate-400"
              >
                <ChevronRight className="w-4 h-4 mt-0.5 text-amber-400 shrink-0" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-4 h-4 text-amber-400" />

            <h3 className="font-semibold text-slate-100">
              Warnings
            </h3>
          </div>

          <ul className="mt-3 space-y-2">
            {result.warnings.map((warning) => (
              <li
                key={warning}
                className="text-sm text-slate-400"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
