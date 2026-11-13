import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, isAppLanguage, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from './config';
import { resources } from './resources';

function readInitialLanguage(): 'en' | 'hi' {
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isAppLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export const initialLanguage = readInitialLanguage();

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
}

export const registeredNamespaces = [
  'common',
  'navigation',
  'settings',
  'birthForm',
  'dateTime',
  'validation',
  'profiles',
  'dashboard',
  'astrology',
  'dasha',
  'career',
  'wealth',
  'reports',
  'research',
  'errors',
  'chartExport',
  'chartSharing'
] as const satisfies readonly (keyof typeof resources.en)[];

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  load: 'languageOnly',
  ns: [...registeredNamespaces],
  defaultNS: 'common',
  fallbackNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
  returnEmptyString: false,
  saveMissing: false,
  initImmediate: false
});

export default i18n;
