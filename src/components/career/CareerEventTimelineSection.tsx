import React from 'react';
import type { ProductCareerEventTimeline } from '../../product/analysis/productAnalysisTypes';

export interface CareerEventTimelineSectionProps {
  readonly eventTimeline: ProductCareerEventTimeline;
}

function formatTiming(timing: ProductCareerEventTimeline['genericWindows'][number]['timing']): string {
  return timing.type === 'DASHA_PERIOD_WINDOW' && timing.start && timing.end
    ? `${timing.start} to ${timing.end}`
    : 'Untimed source window';
}

export const CareerEventTimelineSection: React.FC<CareerEventTimelineSectionProps> = ({ eventTimeline }) => (
  <section
    aria-labelledby="career-event-timeline-heading"
    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4"
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="career-event-timeline-heading" className="text-sm font-semibold text-slate-100">
        Career Event Timeline
      </h2>
      <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300">
        {eventTimeline.status}
      </span>
    </div>

    <p className="text-sm text-slate-300">{eventTimeline.statement}</p>
    <p className="text-xs text-amber-300">
      Event-specific predictions are disabled until each event type has its own validated natal and activation evidence rules.
      These windows are indicative candidates, never guarantees.
    </p>

    {eventTimeline.eventCandidates.length > 0 && (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-200">Validated event-specific candidates</h3>
        <ul aria-label="Validated event-specific career candidates" className="space-y-3">
          {eventTimeline.eventCandidates.map(candidate => (
            <li key={candidate.candidateId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{candidate.eventType.replaceAll('_', ' ')}</h4>
                <span className="text-xs text-slate-300">Candidate only · No guarantee</span>
              </div>
              <p className="text-xs text-slate-400">{formatTiming(candidate.timing)}</p>
              <p className="text-xs text-slate-500">
                Evidence occurrences: {candidate.evidenceOccurrenceIds.join(', ') || 'None'} · Root identities: {candidate.rootIdentityKeys.join(', ') || 'None'}
              </p>
              <p className="text-xs text-slate-500">Rules: {candidate.ruleIds.join(', ') || 'None'}</p>
              {candidate.counterEvidenceOccurrenceIds.length > 0 && (
                <p className="text-xs text-amber-300">Counter-evidence: {candidate.counterEvidenceOccurrenceIds.join(', ')}</p>
              )}
              <ul className="list-disc pl-4 text-xs text-slate-500">
                {candidate.limitations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-200">Qualified generic windows</h3>
      {eventTimeline.genericWindows.length === 0 ? (
        <p className="text-xs text-slate-400">
          No generic window passed the B06 natal-linkage checks. Missing linkage is unresolved evidence, not a negative career prediction.
        </p>
      ) : (
        <ul aria-label="Qualified generic career windows" className="space-y-3">
          {eventTimeline.genericWindows.map(window => (
            <li key={window.windowId} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100">{window.genericType.replaceAll('_', ' ')}</h4>
                <span className="text-xs text-slate-300">Generic candidate only</span>
              </div>
              <p className="text-xs text-slate-400">{formatTiming(window.timing)}</p>
              <p className="text-xs text-slate-400">
                Qualification: {window.qualificationBasis.replaceAll('_', ' ')}
              </p>
              <p className="text-xs text-slate-400">
                Conditions: {window.conditions.join(', ').replaceAll('_', ' ')}
              </p>
              {window.counterEvidenceOccurrenceIds.length > 0 && (
                <p className="text-xs text-amber-300">
                  Counter-evidence occurrences: {window.counterEvidenceOccurrenceIds.join(', ')}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Event-specific inference: NOT MADE · No guaranteed outcome · No probability
              </p>
              <dl className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                <div><dt className="inline font-semibold text-slate-300">Opportunity: </dt><dd className="inline">{window.opportunityId ?? 'Not applicable'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Activation: </dt><dd className="inline">{window.activationId}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Semantic identities: </dt><dd className="inline">{window.evidence.semanticIdentityIds.join(', ') || 'None'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Occurrences: </dt><dd className="inline">{window.evidence.occurrenceIds.join(', ') || 'None'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Natal roots: </dt><dd className="inline">{window.evidence.rootIdentityKeys.join(', ') || 'None'}</dd></div>
                <div><dt className="inline font-semibold text-slate-300">Rules: </dt><dd className="inline">{window.evidence.ruleIds.join(', ') || 'None'}</dd></div>
              </dl>
              <ul aria-label={`Limitations for ${window.windowId}`} className="list-disc pl-4 text-xs text-slate-500">
                {window.limitations.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>

    <div className="space-y-2 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">Event-specific taxonomy validation</h3>
      <p className="text-xs text-slate-400">
        Every proposed event type remains gated. Broad career modes and Dasha activation are not substitutes for event-specific evidence.
      </p>
      <ul aria-label="Event-specific taxonomy validation status" className="space-y-2">
        {eventTimeline.taxonomy.map(item => (
          <li key={item.eventType} className="rounded-md border border-slate-800 p-2 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-200">{item.eventType.replaceAll('_', ' ')}</span>
              <span className="text-xs text-amber-300">{item.validationStatus} · disabled</span>
            </div>
            <p className="text-xs text-slate-500">{item.validationGap}</p>
            <p className="text-xs text-slate-500">
              Required: {item.requiredEvidence.join(', ').replaceAll('_', ' ')}
            </p>
          </li>
        ))}
      </ul>
    </div>

    <div className="space-y-1 border-t border-slate-800 pt-3">
      <h3 className="text-xs font-semibold text-slate-200">Observed outcomes</h3>
      {eventTimeline.observedOutcomeReportIds.length === 0 ? (
        <p className="text-xs text-slate-400">No explicit B02 user-reported outcome references were supplied to this timeline.</p>
      ) : (
        <p className="text-xs text-slate-400">
          {eventTimeline.observedOutcomeReportIds.length} explicitly user-reported outcome reference(s): {eventTimeline.observedOutcomeReportIds.join(', ')}.
          These are separate from chart-derived candidate windows.
        </p>
      )}
    </div>

    {eventTimeline.diagnostics.length > 0 && (
      <ul aria-label="Career event timeline diagnostics" className="list-disc pl-4 text-xs text-slate-500">
        {eventTimeline.diagnostics.map(item => <li key={item}>{item}</li>)}
      </ul>
    )}
  </section>
);
