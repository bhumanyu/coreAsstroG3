import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  readonly title?: string;
  readonly message?: string;
  readonly icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon
}) => {
  const { t } = useTranslation('reports');
  const resolvedTitle = title ?? t('fullNatal.emptyTitle');
  const resolvedMessage = message ?? t('fullNatal.emptyMessage');
  return (
    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 text-slate-400 my-2">
      <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
        {icon || <AlertCircle className="w-5 h-5" />}
      </div>
      <h4 className="text-xs font-semibold uppercase font-mono-code tracking-wider text-slate-300">
        {resolvedTitle}
      </h4>
      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
        {resolvedMessage}
      </p>
    </div>
  );
};
