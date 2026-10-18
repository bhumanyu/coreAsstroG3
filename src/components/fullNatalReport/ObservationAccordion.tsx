import React, { createContext, useContext, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { SynthesisObservation } from '../../types';
import { formatLifeThemeLabel } from './reportUtils';

interface ObservationAccordionContextValue {
  readonly openObservationIds: ReadonlySet<string>;
  readonly toggleObservation: (id: string) => void;
}

const ObservationAccordionContext = createContext<ObservationAccordionContextValue | null>(null);

interface SectionAccordionProps {
  readonly title: string;
  readonly count: number;
  readonly children: React.ReactNode;
}

export const SectionAccordion: React.FC<SectionAccordionProps> = ({ title, count, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [openObservationIds, setOpenObservationIds] = useState<Set<string>>(() => new Set());
  const generatedId = useId().replace(/:/g, '');
  const panelId = `observation-section-${generatedId}`;

  const toggleObservation = (id: string) => {
    setOpenObservationIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ObservationAccordionContext.Provider value={{ openObservationIds, toggleObservation }}>
      <section className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <span className="text-xs font-mono-code font-bold uppercase text-indigo-400">
            {title}
          </span>
          <span className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/10 text-[10px] font-mono-code text-indigo-300">
              ({count})
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
            />
          </span>
        </button>
        <div
          id={panelId}
          aria-hidden={!isExpanded}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="space-y-2">{children}</div>
          </div>
        </div>
      </section>
    </ObservationAccordionContext.Provider>
  );
};

interface ObservationAccordionProps {
  readonly observation: SynthesisObservation;
  readonly observationKey: string;
}

function getShortTitle(summary: string): string {
  const firstSentence = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? summary.trim();
  return firstSentence.length > 100 ? `${firstSentence.slice(0, 97).trimEnd()}...` : firstSentence;
}

export const ObservationAccordion: React.FC<ObservationAccordionProps> = ({
  observation,
  observationKey
}) => {
  const context = useContext(ObservationAccordionContext);
  if (!context) {
    throw new Error('ObservationAccordion must be rendered inside SectionAccordion.');
  }

  const { openObservationIds, toggleObservation } = context;
  const isExpanded = openObservationIds.has(observationKey);
  const generatedId = useId().replace(/:/g, '');
  const panelId = `synthesis-observation-${generatedId}`;

  return (
    <article className="bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => toggleObservation(observationKey)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left"
      >
        <span className="font-semibold text-slate-200 font-serif-astro">
          {getShortTitle(observation.summary)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] font-mono-code text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase">
            {observation.type}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
          />
        </span>
      </button>
      <div
        id={panelId}
        aria-hidden={!isExpanded}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 border-t border-slate-800 px-3 pb-3 pt-2.5 text-slate-300">
            <p className="leading-relaxed">{observation.summary}</p>
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400">
                Type
              </span>
              <p className="mt-1 font-mono-code text-[10px] text-indigo-300">{observation.type}</p>
            </div>
            {observation.relatedThemes.length > 0 && (
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400">
                  Related Themes
                </span>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {observation.relatedThemes.map((theme) => (
                    <li
                      key={theme}
                      className="rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 font-mono-code text-[10px] text-indigo-200"
                    >
                      {formatLifeThemeLabel(theme)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {observation.evidenceReferences.length > 0 && (
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-400">
                  Supporting Factors
                </span>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-400">
                  {observation.evidenceReferences.map((reference, index) => (
                    <li key={`${reference}-${index}`}>{reference}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
