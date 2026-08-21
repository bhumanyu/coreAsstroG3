import React, { useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coins,
  TrendingUp,
  Landmark,
  Compass
} from 'lucide-react';
import type { DomainId } from '../../domain/interpretation/DomainInterpretationTypes';
import type {
  WhyExperienceViewModel,
  EvidenceDetailViewModel
} from '../../product/life-analysis/lifeAnalysisEvidenceTypes';
import { groupWealthDimensionEvidence } from '../../product/life-analysis/lifeAnalysisWhy';
import { EvidenceCard } from './EvidenceCard';

export interface LifeAnalysisEvidencePanelProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly domain: 'CAREER' | 'WEALTH' | DomainId;
  readonly why: WhyExperienceViewModel;
}

export const LifeAnalysisEvidencePanel: React.FC<LifeAnalysisEvidencePanelProps> = ({
  isOpen,
  onClose,
  title,
  domain,
  why
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const wealthDimensions = useMemo(() => {
    if (domain === 'WEALTH' && why?.evidence) {
      return groupWealthDimensionEvidence(why.evidence);
    }
    return null;
  }, [domain, why?.evidence]);

  if (!isOpen) {
    return null;
  }

  const dialogId = `${domain.toLowerCase()}-evidence-dialog-title`;
  const totalFacts = why?.integrity.totalReferenced ?? why?.evidence.length ?? 0;

  const renderIntegrityBanner = () => {
    if (!why?.integrity) return null;

    const { status, resolved, totalReferenced } = why.integrity;

    if (status === 'VALID') {
      return (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-emerald-200">
              Deterministic Domain Evidence Fully Traceable
            </span>
            <p className="text-emerald-300/80 leading-normal">
              All {resolved} referenced factors in this domain are resolved from the astrological calculations.
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
              {resolved} of {totalReferenced} referenced astrological factors are verified against available inputs.
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
            Domain astrological evidence could not be fully reconciled.
          </p>
        </div>
      </div>
    );
  };

  const renderGroupSection = (
    sectionTitle: string,
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
            <h4 className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
              {sectionTitle}
            </h4>
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div>
            <h3 id={dialogId} className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs font-mono-code text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                {totalFacts} factors
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic astrological factors, classical rule metadata, and divisional confirmations
            </p>
          </div>
          <button
            type="button"
            aria-label="Close evidence"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {renderIntegrityBanner()}

          {domain === 'WEALTH' && wealthDimensions ? (
            /* Wealth Dimension-Grouped Sections */
            <div className="space-y-6">
              {renderGroupSection(
                'Accumulation',
                <Landmark className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
                wealthDimensions.ACCUMULATION,
                '2nd House fixed assets, capital preservation, and treasury retention'
              )}
              {renderGroupSection(
                'Gains',
                <TrendingUp className="w-4 h-4 text-cyan-400" aria-hidden="true" />,
                wealthDimensions.GAINS,
                '11th House cashflow, recurring profits, and professional earnings'
              )}
              {renderGroupSection(
                'Fortune',
                <Compass className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
                wealthDimensions.FORTUNE,
                '9th House Lakshmi sthana, divine grace, and effortless prosperity'
              )}
              {renderGroupSection(
                'Speculation',
                <Coins className="w-4 h-4 text-amber-400" aria-hidden="true" />,
                wealthDimensions.SPECULATION,
                '5th House purva punya, market intelligence, and risk ventures'
              )}
              {wealthDimensions.UNCLASSIFIED.length > 0 &&
                renderGroupSection(
                  'Timing & Additional Wealth Factors',
                  <Clock className="w-4 h-4 text-purple-400" aria-hidden="true" />,
                  wealthDimensions.UNCLASSIFIED,
                  'Active dasha, transit, and general planetary significations'
                )}
            </div>
          ) : (
            /* Career & General Role-Grouped Sections */
            <div className="space-y-6">
              {renderGroupSection(
                'Primary Structural Pillars',
                <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />,
                why.grouped.primary,
                'Foundational house and lordship placements (Role: Primary)'
              )}
              {renderGroupSection(
                'Supporting Evidence',
                <CheckCircle2 className="w-4 h-4 text-blue-400" aria-hidden="true" />,
                why.grouped.supporting,
                'Karaka planet significators and secondary linkages (Role: Secondary)'
              )}
              {renderGroupSection(
                'Challenging Factors',
                <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />,
                why.grouped.challenging,
                'Frictions, afflictions, or adverse dignity configurations (Direction: Challenging)'
              )}
              {renderGroupSection(
                'Cross-Domain Conflicting Factors',
                <AlertCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />,
                why.grouped.conflicting,
                'Factors producing mixed or divergent effects across domains (Direction: Conflicting)'
              )}
              {renderGroupSection(
                'Divisional & Yoga Confirmations',
                <Sparkles className="w-4 h-4 text-emerald-400" aria-hidden="true" />,
                why.grouped.confirmations,
                'D10 Dasamsa confirmations and classical yogas (Role: Confirmation)'
              )}
              {renderGroupSection(
                'Timing Activations',
                <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />,
                why.grouped.timing,
                'Active Vimshottari Dasha and Gochara transit influences (Role: Timing)'
              )}
              {renderGroupSection(
                'Modifiers & Secondary Influences',
                <Info className="w-4 h-4 text-purple-400" aria-hidden="true" />,
                why.grouped.modifiers,
                'Planetary aspects, strengths, and conditional nuances (Role: Modifier)'
              )}
            </div>
          )}
        </div>

        {/* Footer with explicit Close button */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close evidence
          </button>
        </div>
      </div>
    </div>
  );
};
