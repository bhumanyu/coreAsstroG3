import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FESTIVALS_BY_YEAR, getUpcomingFestivals, type FestivalEntry, type FestivalEntryType } from '../../data/festivals';

type FestivalTab = FestivalEntryType;

export const FestivalsCard: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const [activeTab, setActiveTab] = useState<FestivalTab>('festival');
  const entries = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return getUpcomingFestivals(FESTIVALS_BY_YEAR[currentYear] ?? [], new Date());
  }, []);
  const visibleEntries = entries.filter((entry) => entry.type === activeTab);
  const locale = i18n.resolvedLanguage === 'hi' ? 'hi-IN' : 'en-IN';

  const formatDate = (date: string) => new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${date}T00:00:00`));

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{t('festivals.eyebrow')}</p>
          <h2 className="mt-1 font-serif-astro text-lg font-semibold text-slate-100">{t('festivals.title')}</h2>
        </div>
        <div role="tablist" aria-label={t('festivals.title')} className="flex rounded-lg border border-slate-700 p-0.5">
          {(['festival', 'holiday'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-2.5 py-1.5 text-xs transition-colors ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-200' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {t(`festivals.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>
      {visibleEntries.length > 0 ? (
        <ul className="space-y-2">
          {visibleEntries.map((entry: FestivalEntry) => (
            <li key={`${entry.date}-${entry.name}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2">
              <span className="text-sm text-slate-200">{t(`festivals.names.${entry.name}`, { defaultValue: entry.name })}</span>
              <time dateTime={entry.date} className="shrink-0 text-xs text-slate-400">{formatDate(entry.date)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-4 text-center text-xs text-slate-400">
          {t('festivals.empty')}
        </p>
      )}
    </section>
  );
};
