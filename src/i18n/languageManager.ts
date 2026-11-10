import i18n from './i18n';
import { DEFAULT_LANGUAGE, isAppLanguage, LANGUAGE_STORAGE_KEY, type AppLanguage } from './config';

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  if (!isAppLanguage(language)) {
    throw new Error('Unsupported application language.');
  }

  await i18n.changeLanguage(language);
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Language still changes for this session when storage is unavailable.
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

export function getCurrentLanguage(): AppLanguage {
  const current = i18n.resolvedLanguage ?? i18n.language;
  return isAppLanguage(current) ? current : DEFAULT_LANGUAGE;
}
