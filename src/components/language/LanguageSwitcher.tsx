import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../../i18n/languageManager';
import type { AppLanguage } from '../../i18n/config';

export const LanguageSwitcher: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact = false }) => {
  const { t, i18n } = useTranslation('common');
  const currentLanguage: AppLanguage = (i18n.resolvedLanguage ?? i18n.language) === 'hi' ? 'hi' : 'en';
  const buttonSize = compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs';

  const handleChange = useCallback((language: AppLanguage) => {
    if (language === currentLanguage) return;
    void changeAppLanguage(language);
  }, [currentLanguage]);

  return (
    <div
      className={['inline-flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-800/70 p-1 light:border-slate-300 light:bg-slate-100', className]
        .filter(Boolean).join(' ')}
      role="group"
      aria-label={t('language')}
    >
      <button
        type="button"
        aria-pressed={currentLanguage === 'en'}
        onClick={() => handleChange('en')}
        className={`rounded-lg ${buttonSize} font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 aria-pressed:bg-indigo-500/20 aria-pressed:text-indigo-200 light:aria-pressed:text-indigo-800`}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={currentLanguage === 'hi'}
        onClick={() => handleChange('hi')}
        className={`rounded-lg ${buttonSize} font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 aria-pressed:bg-indigo-500/20 aria-pressed:text-indigo-200 light:aria-pressed:text-indigo-800`}
      >
        हिन्दी
      </button>
    </div>
  );
};
