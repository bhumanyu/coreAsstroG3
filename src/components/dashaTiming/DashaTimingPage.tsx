import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  AlertTriangle,
  X,
  FileText
} from 'lucide-react';
import type { DashaTimingViewModel } from '../../product/dasha-timing/dashaTimingTypes';
import { DashaBirthAnchor } from './DashaBirthAnchor';
import { CurrentDashaPanel } from './CurrentDashaPanel';
import { DashaTimeline } from './DashaTimeline';
import { DashaInterpretationPanel } from './DashaInterpretationPanel';
import { DashaDomainActivation } from './DashaDomainActivation';
import { EmptyState } from '../fullNatalReport/EmptyState';
import { getEffectBadgeClass } from '../lifeAnalysis/lifeAnalysisUx';

export interface DashaTimingPageProps {
  readonly viewModel: DashaTimingViewModel;
  readonly onNavigateEvidence?: (evidenceIds: readonly string[]) => void;
  readonly onSelectTab?: (tab: string) => void;
}

export const DashaTimingPage: React.FC<DashaTimingPageProps> = ({
  viewModel,
  onNavigateEvidence,
  onSelectTab
}) => {
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<readonly string[] | null>(null);

  const handleOpenEvidence = (evidenceIds?: readonly string[]) => {
    if (onNavigateEvidence && evidenceIds && evidenceIds.length > 0) {
      onNavigateEvidence(evidenceIds);
    } else {
      setSelectedEvidenceIds(evidenceIds || []);
    }
  };

  const handleCloseEvidenceModal = () => {
    setSelectedEvidenceIds(null);
  };

  // Find evidence details from canonical evidence collection
  const allEvidence = viewModel.evidence || [];
  const modalEvidenceList = selectedEvidenceIds
    ? allEvidence.filter(e => selectedEvidenceIds.includes(e.id))
    : allEvidence;

  if (viewModel.availability === 'UNAVAILABLE') {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold font-serif-astro text-slate-100 flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-400" aria-hidden="true" />
            Dasha & Timing
          </h1>
          <p className="text-xs text-slate-400">
            Deterministic Vimshottari lifecycle progressions and domain activation analysis
          </p>
        </header>

        <EmptyState
          title="Dasha & Timing Data Unavailable"
          message="No Vimshottari or Active Dasha calculations were found for the current chart. Please verify natal planetary calculations."
          icon={<Clock className="w-6 h-6 text-indigo-400" aria-hidden="true" />}
        />
      </main>
    );
  }

  const activeMahadashaPlanet = viewModel.current?.mahadasha?.planet;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-slate-200">
      {/* Top Page Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif-astro text-slate-100 tracking-wide">
                Dasha & Timing
              </h1>
              <p className="text-xs text-slate-400">
                Deterministic multi-tier Vimshottari lifecycle and domain activation matrix
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono-code text-xs">
          {viewModel.asOf && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
              <span className="text-slate-500">As Of:</span>
              <span className="font-semibold text-indigo-300">
                {viewModel.asOf.split('T')[0]}
              </span>
            </div>
          )}

          <span
            className={`px-3 py-1.5 rounded-xl border font-bold uppercase text-[11px] ${
              viewModel.availability === 'AVAILABLE'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            {viewModel.availability === 'AVAILABLE' ? 'Full Analysis' : 'Partial Analysis'}
          </span>
        </div>
      </header>

      {/* Partial State Warning */}
      {viewModel.availability === 'PARTIAL' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Partial Timing Resolution</p>
            <p className="text-amber-300/80 leading-relaxed">
              {viewModel.unresolvedEvidenceIds && viewModel.unresolvedEvidenceIds.length > 0
                ? 'Some supporting evidence could not be resolved. The affected timing explanations may be incomplete.'
                : 'Vimshottari timeline sequence is available, but active period resolution was partial. Some active dasha cards may be omitted.'}
            </p>
          </div>
        </div>
      )}

      {/* 1. Birth Dasha Anchor */}
      {viewModel.timeline.birthAnchor && (
        <DashaBirthAnchor birthAnchor={viewModel.timeline.birthAnchor} />
      )}

      {/* 2. Active Vimshottari Dasha Hierarchy (MD, AD, PD) */}
      <CurrentDashaPanel current={viewModel.current} />

      {/* 3. Domain Timing Activations (Career & Wealth 4D Matrix) */}
      {(viewModel.career || viewModel.wealth) && (
        <DashaDomainActivation
          career={viewModel.career}
          wealth={viewModel.wealth}
          onOpenEvidence={handleOpenEvidence}
        />
      )}

      {/* 4. Active Dasha Astrological Interpretation & Rules */}
      <DashaInterpretationPanel
        interpretation={viewModel.interpretation}
        onOpenEvidence={() => handleOpenEvidence(viewModel.interpretation?.evidence.map(e => e.ruleId))}
      />

      {/* 5. Complete 120-Year Vimshottari Mahadasha Timeline Sequence */}
      <DashaTimeline
        timeline={viewModel.timeline}
        activeMahadashaPlanet={activeMahadashaPlanet}
      />

      {/* Evidence Inspector Modal (if opened locally) */}
      {selectedEvidenceIds !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="evidence-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2 text-slate-100">
                <FileText className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                <h3 id="evidence-modal-title" className="font-semibold text-sm">
                  Dasha Astrological Evidence ({modalEvidenceList.length} Rules)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseEvidenceModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close evidence modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs">
              {modalEvidenceList.length > 0 ? (
                modalEvidenceList.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code font-bold text-indigo-300 text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {item.ruleId || item.id}{item.level ? ` • ${item.level}` : ''}
                      </span>
                      {item.effect && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase border ${getEffectBadgeClass(
                            item.effect
                          )}`}
                        >
                          {item.effect}
                        </span>
                      )}
                    </div>
                    {item.statement && (
                      <p className="text-slate-200 font-serif-astro leading-relaxed">
                        {item.statement}
                      </p>
                    )}
                    {item.source && (
                      <p className="text-[10px] font-mono-code text-slate-500 pt-1 border-t border-slate-800/50">
                        Source: {item.source}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  No detailed rule evidence items found matching the selected IDs.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                type="button"
                onClick={handleCloseEvidenceModal}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
