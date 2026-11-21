import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Sunrise,
  Sunset,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BirthContext } from '../../app/birthContext';
import type { AppPage } from '../../app/navigation/navigationTypes';
import { RESEARCH_NAVIGATION } from '../../app/navigation/navigation';
import { computePanchang, type Panchang } from '../../engine/panchang';
import { ensureSwissEphemerisAdapter } from '../../engine/ephemeris/swissEphemerisAdapter';
import type { ProductAnalysisState } from '../../app/AppState';
import { FEATURE_TILES } from './featureTiles';
import { FestivalsCard } from './FestivalsCard';
import { RashiForecastCard } from './RashiForecastCard';
import type { Horoscope } from '../../types';

export interface HomePageProps {
  readonly birthContext?: BirthContext;
  readonly onNavigate: (page: AppPage) => void;
  readonly onOpenBirthForm: () => void;
  readonly analysisStatus: ProductAnalysisState['status'];
  readonly horoscope?: Horoscope;
}

const BirthContextStrip: React.FC<{
  birthContext: BirthContext;
  onOpenBirthForm: () => void;
}> = ({ birthContext, onOpenBirthForm }) => {
  const { t } = useTranslation('home');
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{birthContext.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            {birthContext.formattedDate && <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" aria-hidden="true" />{birthContext.formattedDate} {birthContext.zoneLabel}</span>}
            {birthContext.placeOfBirth && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{birthContext.placeOfBirth}</span>}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenBirthForm}
        className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-indigo-500/50 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {t('editBirthDetails')}
      </button>
    </section>
  );
};

const BirthDetailsEmptyState: React.FC<{ onOpenBirthForm: () => void }> = ({ onOpenBirthForm }) => {
  const { t } = useTranslation('home');
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-7 text-center">
      <Sparkles className="h-6 w-6 text-indigo-300" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-200">{t('noChart.message')}</p>
      <button
        type="button"
        onClick={onOpenBirthForm}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {t('noChart.enterBirthDetails')}
      </button>
    </section>
  );
};

const PanchangCard: React.FC = () => {
  const { t } = useTranslation('home');
  const { t: tCommon } = useTranslation('common');
  const [panchang, setPanchang] = useState<Panchang | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureSwissEphemerisAdapter()
      .then(() => {
        if (!cancelled) setPanchang(computePanchang(new Date()));
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{t('panchang.eyebrow')}</p>
        <h2 className="mt-1 font-serif-astro text-lg font-semibold text-slate-100">{t('panchang.title')}</h2>
        <p className="mt-3 text-xs text-rose-300" role="alert">{tCommon('error')}</p>
      </section>
    );
  }

  if (!panchang) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" role="status" aria-live="polite">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{t('panchang.eyebrow')}</p>
        <h2 className="mt-1 font-serif-astro text-lg font-semibold text-slate-100">{t('panchang.title')}</h2>
        <p className="mt-3 text-xs text-slate-400">{tCommon('loading')}</p>
      </section>
    );
  }

  const entries = [
    { label: t('panchang.tithi'), value: `${panchang.tithi.name} · ${t(`panchang.paksha.${panchang.tithi.paksha.toLowerCase()}`)}` },
    { label: t('panchang.nakshatra'), value: `${panchang.nakshatra.name} · ${t('panchang.pada', { number: panchang.nakshatra.pada })}` },
    { label: t('panchang.yoga'), value: panchang.yoga },
    { label: t('panchang.karana'), value: panchang.karana },
    { label: t('panchang.vaar'), value: t(`panchang.weekdays.${panchang.vaar.toLowerCase()}`) }
  ];
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{t('panchang.eyebrow')}</p>
          <h2 className="mt-1 font-serif-astro text-lg font-semibold text-slate-100">{t('panchang.title')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('panchang.location')}</p>
        </div>
        <Sunrise className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map((entry) => (
          <div key={entry.label} className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
            <dt className="text-[10px] uppercase tracking-wider text-slate-500">{entry.label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{entry.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><Sunrise className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />{t('panchang.sunrise')}: {panchang.sunrise ? panchang.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : tCommon('noData')}</span>
        <span className="inline-flex items-center gap-1.5"><Sunset className="h-3.5 w-3.5 text-orange-300" aria-hidden="true" />{t('panchang.sunset')}: {panchang.sunset ? panchang.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : tCommon('noData')}</span>
      </div>
    </section>
  );
};

const ExploreYourChartGrid: React.FC<{
  onNavigate: (page: AppPage) => void;
  onOpenBirthForm: () => void;
  hasBirthDetails: boolean;
}> = ({ onNavigate, onOpenBirthForm, hasBirthDetails }) => {
  const { t } = useTranslation('home');
  return (
    <section>
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">{t('explore.eyebrow')}</p>
        <h2 className="mt-1 font-serif-astro text-xl font-semibold text-slate-100">{t('explore.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('explore.description')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FEATURE_TILES.map(({ title, subtitle, icon: Icon, target }) => (
          <button
            key={title}
            type="button"
            onClick={() => hasBirthDetails ? onNavigate(target) : onOpenBirthForm()}
            className="group min-h-32 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Icon className="h-5 w-5 text-indigo-300 transition-transform group-hover:scale-110" aria-hidden="true" />
            <span className="mt-3 block text-sm font-semibold text-slate-100">{t(`tiles.${title}`)}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-400">{t(`tiles.${subtitle}`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export const HomePage: React.FC<HomePageProps> = ({
  birthContext,
  onNavigate,
  onOpenBirthForm,
  analysisStatus,
  horoscope
}) => {
  const { t } = useTranslation('home');
  const hasBirthDetails = Boolean(birthContext);
  return (
    <div className="space-y-8">
      {birthContext
        ? <BirthContextStrip birthContext={birthContext} onOpenBirthForm={onOpenBirthForm} />
        : <BirthDetailsEmptyState onOpenBirthForm={onOpenBirthForm} />}
      {hasBirthDetails && analysisStatus === 'LOADING' && <p role="status" className="text-xs text-slate-400">{t('analysis.loading')}</p>}
      {hasBirthDetails && analysisStatus === 'ERROR' && <p role="status" className="text-xs text-amber-300">{t('analysis.error')}</p>}
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">{t('dailySnapshot.eyebrow')}</p>
          <h1 className="mt-1 font-serif-astro text-2xl font-semibold text-slate-100">{t('dailySnapshot.title')}</h1>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PanchangCard />
          <RashiForecastCard horoscope={horoscope} />
          <FestivalsCard />
        </div>
      </section>
      <ExploreYourChartGrid
        onNavigate={onNavigate}
        onOpenBirthForm={onOpenBirthForm}
        hasBirthDetails={hasBirthDetails}
      />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {t('fullSummary')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <section className="space-y-3">
        <div>
          <h2 className="font-serif-astro text-lg font-semibold text-slate-100">{t('research.title')}</h2>
          <p className="mt-1 text-xs text-slate-400">{t('research.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RESEARCH_NAVIGATION.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 transition-colors hover:border-indigo-500/40 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {t(`navigation:${item.id}`)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
