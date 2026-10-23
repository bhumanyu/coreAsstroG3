/**
 * Selected Period Report (P-UI-07)
 *
 * Displays the selected-period synthesis result.
 * Shows resolved period (IDs, canonical interval, temporalRelation),
 * then career and wealth sections rendering all four Wealth dimensions independently,
 * evidence, missingInputs, provenance, diagnostics.
 */

import React, { useState } from 'react';
import type {
  ProductSelectedPeriodSynthesis,
  ProductSynthesisCareerExpressionRow,
  ProductSynthesisWealthDimensionRow,
  ProductSynthesisEvidenceReference,
  ProductSynthesisMissingInput,
  ProductSynthesisDiagnostic,
  ActivationEffect,
  ProductQualificationStatus
} from '../../product/analysis/productAnalysisTypes';
import { Calendar, Clock, AlertTriangle, CheckCircle2, FileText, Activity, ChevronDown, ChevronRight, Copy } from 'lucide-react';

export interface SelectedPeriodReportProps {
  readonly synthesis: ProductSelectedPeriodSynthesis;
  readonly domainToggle?: 'CAREER' | 'WEALTH' | 'BOTH';
  readonly onDomainToggle?: (domain: 'CAREER' | 'WEALTH' | 'BOTH') => void;
}

const ACTIVATION_EFFECT_CLASSES: Record<ActivationEffect | string, string> = {
  ACTIVATES: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  PARTIALLY_ACTIVATES: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
  DOES_NOT_ACTIVATE: 'bg-slate-800/60 border-slate-700/80 text-slate-400',
  CHALLENGES: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
  UNKNOWN: 'bg-slate-800/60 border-slate-700/80 text-slate-400',
  INSUFFICIENT_DATA: 'bg-slate-800/60 border-slate-700/80 text-slate-400',
  UNAVAILABLE: 'bg-slate-800/60 border-slate-700/80 text-slate-400'
};

const TEMPORAL_BADGE_CLASSES: Record<'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN', string> = {
  PAST: 'bg-slate-700/60 border-slate-600/80 text-slate-300',
  CURRENT: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  FUTURE: 'bg-blue-950/60 border-blue-800/80 text-blue-300',
  UNKNOWN: 'bg-slate-800/60 border-slate-700/80 text-slate-400'
};

const QUALIFICATION_BADGE_CLASSES: Record<ProductQualificationStatus, string> = {
  CANONICAL: 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300',
  PROVISIONAL: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
  UNAVAILABLE: 'bg-slate-800/60 border-slate-700/80 text-slate-400'
};

const QUALIFICATION_DESCRIPTIONS: Record<ProductQualificationStatus, string> = {
  CANONICAL: 'Fully qualified using canonical mechanisms',
  PROVISIONAL: 'Using proxy direction',
  UNAVAILABLE: 'Canonical qualification could not be determined'
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatActivationEffect(effect: ActivationEffect | string): string {
  return effect.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export const SelectedPeriodReport: React.FC<SelectedPeriodReportProps> = ({
  synthesis,
  domainToggle = 'BOTH',
  onDomainToggle
}) => {
  const showCareer = domainToggle === 'CAREER' || domainToggle === 'BOTH';
  const showWealth = domainToggle === 'WEALTH' || domainToggle === 'BOTH';
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const noCanonicalMechanismsDiagnostic = synthesis.career.diagnostics.find(
    diagnostic => diagnostic.code === 'CAREER_UNAVAILABLE_NO_CANONICAL_MECHANISMS'
  );

  const copyPeriodId = () => {
    navigator.clipboard.writeText(synthesis.period.selectedPeriodId);
  };

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Calendar className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
            Selected Period Analysis
          </span>
        </div>

        <div className="space-y-3">
          {/* Primary information: MD/AD planets, interval, temporal relation, qualification */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-slate-300 font-mono-code font-semibold">
                {synthesis.period.mahadashaPlanet} MD → {synthesis.period.antardashaPlanet} AD
              </div>
              <div className="text-xs text-slate-400 font-mono-code">
                {formatDate(synthesis.period.interval.start)} – {formatDate(synthesis.period.interval.end)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono-code ${TEMPORAL_BADGE_CLASSES[synthesis.period.temporalRelation]}`}
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{synthesis.period.temporalRelation}</span>
              </div>
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-mono-code ${QUALIFICATION_BADGE_CLASSES[synthesis.qualificationStatus]}`}
                title={QUALIFICATION_DESCRIPTIONS[synthesis.qualificationStatus]}
              >
                <span>{synthesis.qualificationStatus}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono-code">
            Analysis as of: {formatDate(synthesis.period.analysisAsOf)}
          </div>

          {/* Expandable Technical Details */}
          <div className="pt-2 border-t border-slate-800/60">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              {showTechnicalDetails ? (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Technical details</span>
            </button>

            {showTechnicalDetails && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 rounded-lg p-2">
                  <div className="text-xs text-slate-500 font-mono-code">Period ID:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono-code">{synthesis.period.selectedPeriodId}</span>
                    <button
                      onClick={copyPeriodId}
                      className="p-1 hover:bg-slate-800 rounded transition-colors"
                      title="Copy ID"
                    >
                      <Copy className="w-3 h-3 text-slate-500" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Domain Toggle */}
        {onDomainToggle && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-xs font-mono-code text-slate-400">Show:</span>
            {(['CAREER', 'WEALTH', 'BOTH'] as const).map(d => (
              <button
                key={d}
                onClick={() => onDomainToggle(d)}
                className={`px-2.5 py-1 rounded text-xs font-mono-code transition-colors ${domainToggle === d
                  ? 'bg-indigo-600 text-white border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/60'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Career Section */}
      {showCareer && (
        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Activity className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              Career Synthesis
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500 font-mono-code">
                Basis: {synthesis.career.qualificationBasis}
              </span>
            </div>
          </div>

          {/* Career unavailable state */}
          {synthesis.provenance.career.status === 'MISSING' && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs space-y-1">
                <span className="font-mono-code text-slate-400">Career activation unavailable</span>
                <span className="text-slate-500 block">
                  Career domain activation failed or was not provided. This synthesis proceeds with partial domain coverage.
                </span>
                {synthesis.career.diagnostics.length > 0 && (
                  <DiagnosticsList diagnostics={synthesis.career.diagnostics} compact />
                )}
              </div>
            </div>
          )}

          {/* Career limitation warning */}
          {synthesis.provenance.career.status !== 'MISSING' && (synthesis.career.qualificationBasis === 'PROXY_DIRECTION' || synthesis.career.qualificationBasis === 'UNAVAILABLE') && (
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <span className="font-mono-code text-amber-400">Career qualification unavailable</span>
                <span className="text-slate-300 ml-2">
                  {synthesis.career.qualificationBasis === 'PROXY_DIRECTION'
                    ? 'Using interim proxy direction (canonical C11 qualification not provided)'
                    : noCanonicalMechanismsDiagnostic?.message
                      ?? 'Canonical inputs provided but no qualifying mechanisms for this chart'}
                </span>
              </div>
            </div>
          )}

          {synthesis.provenance.career.status !== 'MISSING' && (
            <div className="space-y-3">
              {synthesis.career.expressions.map(expr => (
                <ExpressionRow key={expr.expressionRefKey} expression={expr} />
              ))}
            </div>
          )}

          {synthesis.career.diagnostics.length > 0 && synthesis.provenance.career.status !== 'MISSING' && (
            <DiagnosticsList
              diagnostics={
                // These diagnostics are already rendered in the friendly unavailable warning.
                (synthesis.career.qualificationBasis === 'PROXY_DIRECTION' || synthesis.career.qualificationBasis === 'UNAVAILABLE')
                  ? synthesis.career.diagnostics.filter(d =>
                      d.code !== 'CAREER_QUALIFICATION_UNAVAILABLE' &&
                      d.code !== 'CAREER_UNAVAILABLE_NO_CANONICAL_MECHANISMS'
                    )
                  : synthesis.career.diagnostics
              }
            />
          )}
        </div>
      )}

      {/* Wealth Section */}
      {showWealth && (
        <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
            <Activity className="w-4 h-4 text-indigo-400" aria-hidden="true" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
              Wealth Synthesis
            </span>
          </div>

          {/* Wealth unavailable state */}
          {synthesis.provenance.wealth.status === 'MISSING' && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs space-y-1">
                <span className="font-mono-code text-slate-400">Wealth activation unavailable</span>
                <span className="text-slate-500 block">
                  Wealth domain activation failed or was not provided. This synthesis proceeds with partial domain coverage.
                </span>
                {synthesis.wealth.diagnostics.length > 0 && (
                  <DiagnosticsList diagnostics={synthesis.wealth.diagnostics} compact />
                )}
              </div>
            </div>
          )}

          {synthesis.provenance.wealth.status !== 'MISSING' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(synthesis.wealth.dimensions).map(([key, dimension]) => (
                <WealthDimensionRow key={key} dimension={dimension} />
              ))}
            </div>
          )}

          {synthesis.wealth.diagnostics.length > 0 && synthesis.provenance.wealth.status !== 'MISSING' && (
            <DiagnosticsList diagnostics={synthesis.wealth.diagnostics} />
          )}
        </div>
      )}

      {/* Evidence Section */}
      <div className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <FileText className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
            Evidence References ({synthesis.evidence.length})
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {synthesis.evidence.map((ref, idx) => (
            <EvidenceReference key={idx} reference={ref} />
          ))}
        </div>
      </div>

      {/* Missing Inputs */}
      {synthesis.missingInputs.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-amber-300">
              Missing Inputs ({synthesis.missingInputs.length})
            </span>
          </div>

          <div className="space-y-2">
            {synthesis.missingInputs.map((input, idx) => (
              <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono-code text-slate-400">{input.domain}</span>
                  <span className="text-xs font-mono-code text-amber-400">{input.code}</span>
                </div>
                <div className="text-xs text-slate-300">{input.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <span className="text-xs font-mono-code font-bold uppercase tracking-wider text-slate-300">
            Provenance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
            <div className="text-xs font-mono-code text-slate-400 mb-1">Career</div>
            <div className="text-xs text-slate-300">
              Status: {synthesis.provenance.career.status}
              {synthesis.provenance.career.version && (
                <span className="ml-2 font-mono-code">v{synthesis.provenance.career.version}</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Qualification Basis: {synthesis.provenance.career.qualificationBasis}
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3">
            <div className="text-xs font-mono-code text-slate-400 mb-1">Wealth</div>
            <div className="text-xs text-slate-300">
              Status: {synthesis.provenance.wealth.status}
              {synthesis.provenance.wealth.version && (
                <span className="ml-2 font-mono-code">v{synthesis.provenance.wealth.version}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpressionRow: React.FC<{ readonly expression: ProductSynthesisCareerExpressionRow }> = ({ expression }) => {
  const effectClass = ACTIVATION_EFFECT_CLASSES[expression.status] || ACTIVATION_EFFECT_CLASSES.UNAVAILABLE;

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono-code text-slate-400">{expression.expressionRefKey}</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono-code ${effectClass}`}>
          <span>{formatActivationEffect(expression.status)}</span>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Levels: {expression.linkedLevels.join(' → ')}
      </div>

      <div className="text-xs text-slate-500">
        Qualification: {expression.qualificationBasis}
        {expression.matchBasis && ` • Match: ${expression.matchBasis}`}
      </div>

      {expression.diagnostics.length > 0 && (
        <DiagnosticsList diagnostics={expression.diagnostics} compact />
      )}
    </div>
  );
};

const WealthDimensionRow: React.FC<{ readonly dimension: ProductSynthesisWealthDimensionRow }> = ({ dimension }) => {
  const effectClass = ACTIVATION_EFFECT_CLASSES[dimension.effect] || ACTIVATION_EFFECT_CLASSES.UNAVAILABLE;

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono-code text-slate-400">{dimension.dimension}</span>
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono-code ${effectClass}`}>
          <span>{formatActivationEffect(dimension.effect)}</span>
        </div>
      </div>

      <div className="text-xs text-slate-400">
        Levels: {dimension.linkedLevels.join(' → ')}
      </div>

      <div className="text-xs text-slate-500">
        Data Status: {dimension.dataStatus}
      </div>

      {dimension.diagnostics.length > 0 && (
        <DiagnosticsList diagnostics={dimension.diagnostics} compact />
      )}
    </div>
  );
};

const EvidenceReference: React.FC<{ readonly reference: ProductSynthesisEvidenceReference }> = ({ reference }) => {
  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono-code text-slate-400">{reference.stage}</span>
        {reference.classification && (
          <span className="text-[10px] font-mono-code text-slate-500">{reference.classification}</span>
        )}
      </div>

      {reference.evidenceId && (
        <div className="text-xs text-slate-300 font-mono-code truncate">{reference.evidenceId}</div>
      )}

      {reference.ruleId && (
        <div className="text-xs text-slate-400 font-mono-code">Rule: {reference.ruleId}</div>
      )}

      {reference.source && (
        <div className="text-xs text-slate-500">{reference.source}</div>
      )}

      {reference.provenanceStage && (
        <div className="text-[10px] text-slate-600 font-mono-code">{reference.provenanceStage}</div>
      )}
    </div>
  );
};

const DiagnosticsList: React.FC<{
  readonly diagnostics: readonly ProductSynthesisDiagnostic[];
  readonly compact?: boolean;
}> = ({ diagnostics, compact = false }) => {
  if (compact) {
    return (
      <ul aria-label="Diagnostic explanations" className="space-y-1">
        {diagnostics.map((diag, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" aria-hidden="true" />
            <div>
              <span className="font-mono-code text-amber-400">{diag.code}</span>
              <p className="text-slate-300 mt-0.5">{diag.message}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2">
      {diagnostics.map((diag, idx) => (
        <div key={idx} className="flex items-start gap-2 text-xs text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div>
            <span className="font-mono-code">{diag.code}: </span>
            <span className="text-slate-300">{diag.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
