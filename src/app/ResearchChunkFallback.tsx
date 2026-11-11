import React from 'react';
import { useTranslation } from 'react-i18next';

export const ResearchChunkFallback: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div role="status" aria-live="polite" className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 text-sm text-slate-300">
      {t('loadingResearchTools')}
    </div>
  );
};
