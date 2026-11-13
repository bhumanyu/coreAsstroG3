import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrentTransitSection as CurrentTransitSectionType } from '../../types';
import { EmptyState } from './EmptyState';
import { PartialStateNotice } from './PartialStateNotice';

interface CurrentTransitSectionProps {
  readonly section: CurrentTransitSectionType;
}

export const CurrentTransitSection: React.FC<CurrentTransitSectionProps> = ({ section }) => {
  const { t } = useTranslation('reports');
  if (section.status === 'UNAVAILABLE') {
    return (
      <EmptyState
        title={t('fullNatal.components.currentTransit.unavailableTitle')}
        message={section.reason || t('fullNatal.components.currentTransit.unavailableMessage')}
      />
    );
  }

  return (
    <div className="space-y-3">
      {section.status === 'PARTIAL' && <PartialStateNotice message={t('fullNatal.components.partial.transit')} />}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-mono-code">
        {section.reason}
      </div>
    </div>
  );
};
