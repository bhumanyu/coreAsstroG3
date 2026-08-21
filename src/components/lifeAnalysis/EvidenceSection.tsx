import React, { useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type {
  WhyExperienceViewModel,
  EvidenceDetailViewModel
} from '../../product/life-analysis/lifeAnalysisEvidenceTypes';
import type { LifeAnalysisEvidenceViewModel } from '../../product/life-analysis/lifeAnalysisTypes';
import { EvidenceCard } from './EvidenceCard';
import { formatEnum } from './lifeAnalysisUx';

interface EvidenceSectionProps {
  readonly why?: WhyExperienceViewModel;
  readonly evidence?: readonly LifeAnalysisEvidenceViewModel[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  why,
  evidence
}) => {
  // Map of all resolved evidence items by ID for related evidence link resolution
  const allEvidenceMap = useMemo(() => {
    const map = new Map<string, EvidenceDetailViewModel>();
    if (why?.evidence) {
      for (const item of why.evidence) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [why?.evidence]);

  const totalFacts = why?.integrity.totalReferenced ?? evidence?.length ?? 0;

  if (totalFacts === 0) {
    return null;
  }

  const renderIntegrityBanner = () => {
    if (!why?.integrity) {
      return null;
    }

    const { status, resolved, totalReferenced } = why.integrity;

    if (status === 'VALID') {
      return (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-emerald-200">
              Deterministic Evidence Fully Traceable
            </span>
            <p className="text-emerald-300/80 leading-normal">
              All {resolved} referenced astrological factors are resolved from the deterministic chart, divisional, and timing analysis.
            </p>
          </div>
        </div>
      );
    }

    if (status === 'PARTIAL') {
      return (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-amber-200">
              Partial Astrological Evidence Basis
            </span>
            <p className="text-amber-300/80 leading-normal">
              {resolved} of {totalReferenced} referenced astrological factors are verified against available planetary and divisional calculations.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300">
        <Info className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-slate-200">
            Evidence Traceability Limited
          </span>
          <p className="text-slate-400 leading-normal">
            Astrological evidence could not be fully reconciled with the active chart inputs.
          </p>
        </div>
      </div>
    );
  };

  const renderGroupSection = (
    title: string,
    icon: React.ReactNode,
    items: readonly EvidenceDetailViewModel[],
    subtitle?: string
  ) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1.5">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
              {title}
            </h3>
            <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
              {items.length}
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              {subtitle}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <EvidenceCard
              key={item.id}
              evidence={item}
              allEvidenceMap={allEvidenceMap}
            />
          ))}
        </div>
      </div>
    );
  };

  // Concise preview for legacy evidence: cap to 5 items if why structure is absent
  const conciseLegacyEvidence = evidence ? evidence.slice(0, 5) : [];

  return (
    <section
      id="why-conclusion-section"
      aria-labelledby="why-conclusion-heading"
      className="space-y-4"
    >
      <details
        id="why-conclusion-details"
        className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
      >
        <summary className="p-5 flex items-center justify-between cursor-pointer list-none select-none hover:bg-slate-800/50 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="why-conclusion-heading" className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Why this conclusion?</span>
                <span className="text-xs font-mono-code text-slate-400">
                  ({totalFacts} astrological factors)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore the deterministic astrological evidence and classical rules powering this life domain synthesis
              </p>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-400 transition-transform duration-200 group-open:rotate-180 shrink-0" aria-hidden="true" />
        </summary>

        <div className="p-5 pt-2 border-t border-slate-800/60 mt-1 space-y-6">
          {/* Integrity Banner */}
          {renderIntegrityBanner()}

          {/* Grouped Evidence Subsections if why model is available */}
          {why ? (
            <div className="space-y-6">
              {/* 1. Primary Pillars (Role: PRIMARY) */}
              {renderGroupSection(
                'Primary Structural Pillars',
                <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
                why.grouped.primary,
                'Foundational house and lordship placements (Role: Primary)'
              )}

              {/* 2. Supporting Factors (Role: SECONDARY) */}
              {renderGroupSection(
                'Supporting Evidence',
                <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" />,
                why.grouped.supporting,
                'Karaka planet significators and secondary linkages (Role: Secondary)'
              )}

              {/* 3. Challenging Factors (Polarity: CHALLENGING) */}
              {renderGroupSection(
                'Challenging Factors',
                <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />,
                why.grouped.challenging,
                'Frictions, afflictions, or adverse dignity configurations (Direction: Challenging)'
              )}

              {/* 4. Conflicting Factors (Polarity: CONFLICTING) */}
              {renderGroupSection(
                'Cross-Domain Conflicting Factors',
                <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />,
                why.grouped.conflicting,
                'Factors producing mixed or divergent effects across domains (Direction: Conflicting)'
              )}

              {/* 5. Confirmations & Yogas (Role: CONFIRMATION) */}
              {renderGroupSection(
                'Divisional & Yoga Confirmations',
                <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
                why.grouped.confirmations,
                'D10/D2 divisional validation and classical yogas (Role: Confirmation)'
              )}

              {/* 6. Timing Activations (Role: TIMING) */}
              {renderGroupSection(
                'Timing Activations',
                <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />,
                why.grouped.timing,
                'Active Vimshottari Dasha and Gochara transit influences (Role: Timing)'
              )}

              {/* 7. Modifiers (Role: MODIFIER) */}
              {renderGroupSection(
                'Modifiers & Secondary Influences',
                <Info className="w-4 h-4 text-purple-400" aria-hidden="true" />,
                why.grouped.modifiers,
                'Planetary aspects, strengths, and conditional nuances (Role: Modifier)'
              )}
            </div>
          ) : (
            /* Fallback rendering if only legacy evidence is present (capped at 5 preview items) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {conciseLegacyEvidence.map((item) => (
                <article
                  key={item.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono-code text-indigo-400 truncate">
                      {item.id}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider bg-slate-800 text-slate-300 border-slate-700">
                      {formatEnum(item.role)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-serif-astro">
                    {item.statement}
                  </p>
                  <div className="pt-1 text-[10px] font-mono-code text-slate-500 uppercase tracking-wider">
                    Source: {item.source}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </details>
    </section>
  );
};
