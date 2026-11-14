import React from 'react';
import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface NoChartEmptyStateProps {
  readonly onOpenBirthForm: () => void;
}

export const NoChartEmptyState: React.FC<NoChartEmptyStateProps> = ({ onOpenBirthForm }) => {
  const { t } = useTranslation('home');
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-10 text-center">
      <CalendarDays className="h-8 w-8 text-indigo-300" aria-hidden="true" />
      <p className="text-sm text-slate-300">{t('noChart.message')}</p>
      <button
        type="button"
        onClick={onOpenBirthForm}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        {t('noChart.enterBirthDetails')}
      </button>
    </section>
  );
};
